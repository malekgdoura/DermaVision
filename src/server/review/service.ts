import type { Prisma } from "@/generated/prisma/client";
import { readMappedResult } from "@/features/analysis/mapped-result";
import { getRecommendationsForDraft } from "@/server/recommendations/service";
import { generateReportDraft } from "@/server/report-api";

import { compareReviewedResults, type ResultComparison } from "./compare";
import { applyCorrections, readReviewedResult, type ReviewedSkinAnalysis } from "./corrections";
import {
  addReportVersion,
  claimAnalysis,
  countByStatus,
  countPatientAnalyses,
  countPublishedByDoctor,
  countPublishedForPatient,
  findAnalysisForReview,
  findPreviousPublishedReview,
  findPublishedByDoctor,
  findPublishedReport,
  findReviewQueue,
  publishReport,
  saveCorrections,
} from "./repository";
import type { CorrectionsInput, DraftRequestInput, PublishInput, ReportContentInput } from "./schemas";

// Business flow of the medical review: who may review, the order of the steps, and the
// "doctor stays responsible" rules. No UI, no Server Action, no session reading.
//
// Steps: AI_DONE → (indicators validated) IN_REVIEW → drafts / edits → (published) VALIDATED.

export type ReviewErrorKind =
  | "not_found"
  | "not_reviewable"
  | "assigned_to_other"
  | "indicators_not_validated"
  | "edit_required"
  | "draft_failed";

export type ReviewError = { kind: ReviewErrorKind; message: string; retryable: boolean };
export type ReviewResult<T = undefined> = { ok: true; data: T } | { ok: false; error: ReviewError };

const MESSAGES: Record<Exclude<ReviewErrorKind, "draft_failed">, string> = {
  not_found: "This analysis could not be found.",
  not_reviewable: "This analysis is not waiting for a review (already published, failed or still processing).",
  assigned_to_other: "Another doctor is already reviewing this analysis.",
  indicators_not_validated: "Validate the indicators before generating or publishing a report.",
  edit_required:
    "The report is still identical to an AI draft. Read it and adapt it to the patient before publishing.",
};

function fail<T>(kind: Exclude<ReviewErrorKind, "draft_failed">): ReviewResult<T> {
  return { ok: false, error: { kind, message: MESSAGES[kind], retryable: false } };
}

// ---------- Reading ----------

export async function getReviewQueue() {
  const analyses = await findReviewQueue();
  return analyses.map((analysis) => {
    const result = readMappedResult(analysis.aiResult?.mappedResult);
    return {
      id: analysis.id,
      status: analysis.status,
      createdAt: analysis.createdAt,
      patient: analysis.user,
      reviewer: analysis.reviewer,
      skinTypeLabel: result?.skinType.label ?? null,
      detectedCount: result?.indicators.filter((indicator) => indicator.detected).length ?? 0,
      indicatorsValidated: Boolean(analysis.review?.indicatorsValidatedAt),
      versionCount: analysis.review?._count.versions ?? 0,
    };
  });
}

export type ReviewQueueItem = Awaited<ReturnType<typeof getReviewQueue>>[number];

export async function getDoctorOverview(doctorId: string) {
  const [counts, published, recent] = await Promise.all([
    countByStatus(),
    countPublishedByDoctor(doctorId),
    findPublishedByDoctor(doctorId, 5),
  ]);
  const count = (status: string) => counts.find((row) => row.status === status)?._count._all ?? 0;
  return {
    waiting: count("AI_DONE"),
    inReview: count("IN_REVIEW"),
    publishedByMe: published,
    recent: recent.map((analysis) => ({
      id: analysis.id,
      patient: analysis.user,
      publishedAt: analysis.review?.publishedAt ?? null,
    })),
  };
}

/**
 * Everything the review screen shows. Null when the analysis does not exist or never had an AI
 * result (processing or failed): there is nothing for a doctor to review.
 */
export async function getReviewWorkspace(doctorId: string, analysisId: string) {
  const analysis = await findAnalysisForReview(analysisId);
  if (!analysis) return null;

  const aiResult = readMappedResult(analysis.aiResult?.mappedResult);
  if (!aiResult || analysis.status === "PROCESSING" || analysis.status === "FAILED") return null;

  const review = analysis.review;
  const correctedResult = readReviewedResult(review?.correctedResult);

  const [patientAnalysisCount, previousReview] = await Promise.all([
    countPatientAnalyses(analysis.userId),
    findPreviousPublishedReview(analysis.userId, analysis.createdAt),
  ]);

  const previousResult = readReviewedResult(previousReview?.correctedResult);
  const previous =
    previousReview && previousResult && previousReview.publishedAt
      ? {
          analysisId: previousReview.analysis.id,
          analysisDate: previousReview.analysis.createdAt,
          publishedAt: previousReview.publishedAt,
          report: previousReview.versions[0]?.content ?? null,
          // Compared with the doctor's current corrections, or the AI result before validation.
          comparison: compareReviewedResults(previousResult, correctedResult ?? aiResult),
        }
      : null;

  const assignedToOther = analysis.reviewerId !== null && analysis.reviewerId !== doctorId;

  return {
    id: analysis.id,
    reviewId: review?.id ?? null,
    status: analysis.status,
    createdAt: analysis.createdAt,
    patient: { ...analysis.user, analysisCount: patientAnalysisCount },
    reviewer: analysis.reviewer,
    aiResult,
    correctedResult,
    clinicalNotes: review?.clinicalNotes ?? null,
    indicatorsValidatedAt: review?.indicatorsValidatedAt ?? null,
    publishedAt: review?.publishedAt ?? null,
    versions: review?.versions ?? [],
    previous,
    canEdit: !assignedToOther && (analysis.status === "AI_DONE" || analysis.status === "IN_REVIEW"),
    assignedToOther,
  };
}

export type ReviewWorkspace = NonNullable<Awaited<ReturnType<typeof getReviewWorkspace>>>;

// A doctor may see the photo of any analysis that reached the review stage.
export async function canDoctorViewAnalysis(analysisId: string) {
  const analysis = await findAnalysisForReview(analysisId);
  if (!analysis || analysis.status === "PROCESSING" || analysis.status === "FAILED") return null;
  return analysis;
}

// The published report for its patient only; null when missing, not published or not theirs.
export async function getPublishedReportForPatient(userId: string, analysisId: string) {
  const report = await findPublishedReport(analysisId);
  if (!report || report.analysis.userId !== userId || !report.publishedAt) return null;

  const version = report.versions[0];
  const result = readReviewedResult(report.correctedResult);
  if (!version || !result) return null;

  return {
    content: version.content,
    publishedAt: report.publishedAt,
    doctor: report.analysis.reviewer,
    result,
  };
}

export function countReviewedForPatient(userId: string) {
  return countPublishedForPatient(userId);
}

// ---------- Changing ----------

// Step 1: the doctor confirms or corrects every indicator. Takes the analysis for this doctor.
export async function validateIndicators(
  doctorId: string,
  analysisId: string,
  input: CorrectionsInput,
): Promise<ReviewResult<{ correctedResult: ReviewedSkinAnalysis }>> {
  const analysis = await findAnalysisForReview(analysisId);
  const aiResult = readMappedResult(analysis?.aiResult?.mappedResult);
  if (!analysis || !aiResult) return fail("not_found");

  const blocked = checkEditable(analysis, doctorId);
  if (blocked) return fail(blocked);
  if (!(await claimAnalysis(analysisId, doctorId))) return fail("assigned_to_other");

  // Unknown keys are ignored: only indicators of this AI result can be marked.
  const known = new Set(aiResult.indicators.map((indicator) => indicator.key));
  const detectedKeys = new Set(input.detected.filter((key) => known.has(key)));
  const correctedResult = applyCorrections(aiResult, { detectedKeys, skinType: input.skinType });

  await saveCorrections({
    analysisId,
    correctedResult: toJson(correctedResult),
    clinicalNotes: input.clinicalNotes,
  });

  return { ok: true, data: { correctedResult } };
}

// Step 2: ask the LLM for a draft built from the validated indicators. Nothing is saved on failure.
export async function generateDraft(
  doctorId: string,
  analysisId: string,
  input: DraftRequestInput,
): Promise<ReviewResult<{ versionId: string; truncated: boolean }>> {
  const workspace = await getReviewWorkspace(doctorId, analysisId);
  const ready = checkReportReady(workspace);
  if (!ready.ok) return ready;
  const { review, correctedResult } = ready.data;
  const recommendations = await getRecommendationsForDraft(input.recommendationIds);

  const draft = await generateReportDraft({
    result: correctedResult,
    clinicalNotes: review.clinicalNotes,
    style: input.style,
    language: input.language,
    previous: review.previous ? { date: review.previous.analysisDate, comparison: review.previous.comparison } : null,
    recommendations: recommendations.map(({ title, content }) => ({ title, content })),
  });

  if (!draft.ok) {
    return {
      ok: false,
      error: { kind: "draft_failed", message: draft.error.message, retryable: draft.error.retryable },
    };
  }

  const version = await addReportVersion(ready.data.reviewId, {
    kind: "AI_DRAFT",
    style: input.style,
    language: input.language,
    content: draft.data.content,
    model: draft.data.model,
    authorId: doctorId,
  });

  return { ok: true, data: { versionId: version.id, truncated: draft.data.truncated } };
}

// Step 3: the doctor saves an edited version. Saving unchanged text does not create a version.
export async function saveDraft(
  doctorId: string,
  analysisId: string,
  input: ReportContentInput,
): Promise<ReviewResult<{ created: boolean }>> {
  const workspace = await getReviewWorkspace(doctorId, analysisId);
  const ready = checkReportReady(workspace);
  if (!ready.ok) return ready;

  const latest = ready.data.review.versions[0];
  if (latest && sameText(latest.content, input.content) && latest.style === input.style && latest.language === input.language) {
    return { ok: true, data: { created: false } };
  }

  await addReportVersion(ready.data.reviewId, { kind: "DOCTOR_EDIT", ...input, authorId: doctorId });
  return { ok: true, data: { created: true } };
}

// Step 4: publication. The text must have been edited by the doctor: an AI draft is never published as is.
export async function publish(doctorId: string, analysisId: string, input: PublishInput): Promise<ReviewResult> {
  const workspace = await getReviewWorkspace(doctorId, analysisId);
  const ready = checkReportReady(workspace);
  if (!ready.ok) return ready;

  const copiedFromAi = ready.data.review.versions.some(
    (version) => version.kind === "AI_DRAFT" && sameText(version.content, input.content),
  );
  if (copiedFromAi) return fail("edit_required");

  const published = await publishReport({
    analysisId,
    reviewId: ready.data.reviewId,
    doctorId,
    version: { style: input.style, language: input.language, content: input.content },
  });
  if (!published) return fail("assigned_to_other");

  return { ok: true, data: undefined };
}

// ---------- Rules ----------

function checkEditable(
  analysis: { status: string; reviewerId: string | null },
  doctorId: string,
): Exclude<ReviewErrorKind, "draft_failed"> | null {
  if (analysis.status !== "AI_DONE" && analysis.status !== "IN_REVIEW") return "not_reviewable";
  if (analysis.reviewerId !== null && analysis.reviewerId !== doctorId) return "assigned_to_other";
  return null;
}

// A report can be drafted, saved or published only by the assigned doctor, after step 1.
function checkReportReady(
  workspace: ReviewWorkspace | null,
): ReviewResult<{ review: ReviewWorkspace; reviewId: string; correctedResult: ReviewedSkinAnalysis }> {
  if (!workspace) return fail("not_found");
  if (workspace.assignedToOther) return fail("assigned_to_other");
  if (workspace.status !== "IN_REVIEW") {
    return fail(workspace.status === "AI_DONE" ? "indicators_not_validated" : "not_reviewable");
  }
  if (!workspace.reviewId || !workspace.correctedResult || !workspace.indicatorsValidatedAt) {
    return fail("indicators_not_validated");
  }
  return {
    ok: true,
    data: { review: workspace, reviewId: workspace.reviewId, correctedResult: workspace.correctedResult },
  };
}

// Whitespace differences do not count as an edit.
export function sameText(a: string, b: string): boolean {
  return normalize(a) === normalize(b);
}

function normalize(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function toJson(data: ReviewedSkinAnalysis): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(data)) as Prisma.InputJsonValue;
}

export type { ResultComparison };
