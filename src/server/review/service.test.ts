import { beforeEach, describe, expect, it, vi } from "vitest";

import { getRecommendationsForDraft } from "@/server/recommendations/service";
import { generateReportDraft, ReportApiError } from "@/server/report-api";
import { aiResultFixture } from "@/test/fixtures";

import { applyCorrections } from "./corrections";
import * as repository from "./repository";
import { generateDraft, getPublishedReportForPatient, publish, saveDraft, validateIndicators } from "./service";

vi.mock("./repository");
vi.mock("@/server/recommendations/service", () => ({ getRecommendationsForDraft: vi.fn() }));
vi.mock("@/server/report-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/server/report-api")>()),
  generateReportDraft: vi.fn(),
}));

const repo = vi.mocked(repository);
const draftApi = vi.mocked(generateReportDraft);
const recommendationsApi = vi.mocked(getRecommendationsForDraft);

const DOCTOR = "doctor-1";
const OTHER_DOCTOR = "doctor-2";
const ANALYSIS = "analysis-1";

type Version = {
  id: string;
  reviewId: string;
  kind: "AI_DRAFT" | "DOCTOR_EDIT" | "PUBLISHED";
  content: string;
  style: "SHORT";
  language: string;
};

type AnalysisRecord = NonNullable<Awaited<ReturnType<typeof repository.findAnalysisForReview>>>;

function analysisRecord(
  overrides: {
    status?: "AI_DONE" | "IN_REVIEW" | "VALIDATED" | "FAILED";
    reviewerId?: string | null;
    validated?: boolean;
    versions?: Version[];
  } = {},
): AnalysisRecord {
  const validated = overrides.validated ?? false;
  return {
    id: ANALYSIS,
    userId: "patient-1",
    imageId: "image-1",
    status: overrides.status ?? "AI_DONE",
    reviewerId: overrides.reviewerId ?? null,
    createdAt: new Date("2026-10-10T09:00:00Z"),
    updatedAt: new Date("2026-10-10T09:00:00Z"),
    user: { id: "patient-1", prenom: "Sara", nom: "Ben Ali", email: "sara@example.com", telephone: null, createdAt: new Date() },
    reviewer: null,
    image: { storageKey: "analyses/x.jpg" },
    aiResult: { mappedResult: aiResultFixture(), provider: "facepp", createdAt: new Date() },
    review: validated
      ? {
          id: "review-1",
          analysisId: ANALYSIS,
          correctedResult: applyCorrections(aiResultFixture(), { detectedKeys: new Set(["acne"]), skinType: "oily" }),
          clinicalNotes: null,
          indicatorsValidatedAt: new Date(),
          publishedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          versions: overrides.versions ?? [],
        }
      : null,
  } as unknown as AnalysisRecord;
}

const corrections = { skinType: "oily" as const, detected: ["acne", "unknown_key"], clinicalNotes: null };
const report = {
  style: "SHORT" as const,
  language: "en" as const,
  content: "Summary\nMild acne on the forehead, edited by the doctor.",
};

beforeEach(() => {
  vi.resetAllMocks();
  repo.countPatientAnalyses.mockResolvedValue(1);
  repo.findPreviousPublishedReview.mockResolvedValue(null);
  repo.claimAnalysis.mockResolvedValue(true);
  repo.publishReport.mockResolvedValue(true);
  repo.addReportVersion.mockResolvedValue({ id: "version-new" } as never);
  recommendationsApi.mockResolvedValue([]);
});

describe("validateIndicators", () => {
  it("claims the analysis and saves the corrected result", async () => {
    repo.findAnalysisForReview.mockResolvedValue(analysisRecord());

    const result = await validateIndicators(DOCTOR, ANALYSIS, corrections);

    expect(result.ok).toBe(true);
    expect(repo.claimAnalysis).toHaveBeenCalledWith(ANALYSIS, DOCTOR);
    const saved = repo.saveCorrections.mock.calls[0][0];
    const detected = (saved.correctedResult as { indicators: { key: string; detected: boolean }[] }).indicators
      .filter((indicator) => indicator.detected)
      .map((indicator) => indicator.key);
    // Blackheads were removed by the doctor; the unknown key is ignored.
    expect(detected).toEqual(["acne"]);
  });

  it("refuses when another doctor holds the analysis", async () => {
    repo.findAnalysisForReview.mockResolvedValue(analysisRecord({ status: "IN_REVIEW", reviewerId: OTHER_DOCTOR }));

    const result = await validateIndicators(DOCTOR, ANALYSIS, corrections);

    expect(!result.ok && result.error.kind).toBe("assigned_to_other");
    expect(repo.saveCorrections).not.toHaveBeenCalled();
  });

  it("refuses when the atomic claim is lost to another doctor", async () => {
    repo.findAnalysisForReview.mockResolvedValue(analysisRecord());
    repo.claimAnalysis.mockResolvedValue(false);

    const result = await validateIndicators(DOCTOR, ANALYSIS, corrections);
    expect(!result.ok && result.error.kind).toBe("assigned_to_other");
  });

  it("refuses an analysis that is already published", async () => {
    repo.findAnalysisForReview.mockResolvedValue(analysisRecord({ status: "VALIDATED", reviewerId: DOCTOR }));
    const result = await validateIndicators(DOCTOR, ANALYSIS, corrections);
    expect(!result.ok && result.error.kind).toBe("not_reviewable");
  });
});

describe("generateDraft", () => {
  it("requires validated indicators first", async () => {
    repo.findAnalysisForReview.mockResolvedValue(analysisRecord());

    const result = await generateDraft(DOCTOR, ANALYSIS, { style: "SHORT", language: "en", recommendationIds: [] });

    expect(!result.ok && result.error.kind).toBe("indicators_not_validated");
    expect(draftApi).not.toHaveBeenCalled();
  });

  it("builds the draft from the corrected result and stores it as a new version", async () => {
    repo.findAnalysisForReview.mockResolvedValue(analysisRecord({ status: "IN_REVIEW", reviewerId: DOCTOR, validated: true }));
    draftApi.mockResolvedValue({ ok: true, data: { content: "Draft", model: "llama-3.3-70b-versatile", truncated: false } });

    const result = await generateDraft(DOCTOR, ANALYSIS, { style: "SHORT", language: "en", recommendationIds: [] });

    expect(result.ok).toBe(true);
    const sent = draftApi.mock.calls[0][0].result;
    expect(sent.indicators.find((indicator) => indicator.key === "blackhead")?.detected).toBe(false);
    expect(repo.addReportVersion).toHaveBeenCalledWith(
      "review-1",
      expect.objectContaining({ kind: "AI_DRAFT", content: "Draft", authorId: DOCTOR }),
    );
  });

  it("sends the ticked library recommendations to the report assistant", async () => {
    repo.findAnalysisForReview.mockResolvedValue(analysisRecord({ status: "IN_REVIEW", reviewerId: DOCTOR, validated: true }));
    recommendationsApi.mockResolvedValue([{ id: "reco-1", title: "Gentle cleansing", content: "Wash gently twice a day." }]);
    draftApi.mockResolvedValue({ ok: true, data: { content: "Draft", model: "m", truncated: false } });

    await generateDraft(DOCTOR, ANALYSIS, { style: "SHORT", language: "en", recommendationIds: ["reco-1"] });

    expect(recommendationsApi).toHaveBeenCalledWith(["reco-1"]);
    expect(draftApi.mock.calls[0][0].recommendations).toEqual([
      { title: "Gentle cleansing", content: "Wash gently twice a day." },
    ]);
  });

  it("saves nothing and returns a clean error when Groq fails", async () => {
    repo.findAnalysisForReview.mockResolvedValue(analysisRecord({ status: "IN_REVIEW", reviewerId: DOCTOR, validated: true }));
    draftApi.mockResolvedValue({
      ok: false,
      error: new ReportApiError({ kind: "rate_limited", message: "busy", retryable: true }),
    });

    const result = await generateDraft(DOCTOR, ANALYSIS, { style: "SHORT", language: "en", recommendationIds: [] });

    expect(result).toEqual({ ok: false, error: { kind: "draft_failed", message: "busy", retryable: true } });
    expect(repo.addReportVersion).not.toHaveBeenCalled();
  });
});

describe("saveDraft", () => {
  it("does not create a version when nothing changed", async () => {
    const versions: Version[] = [
      { id: "v1", reviewId: "review-1", kind: "DOCTOR_EDIT", content: report.content, style: "SHORT", language: "en" },
    ];
    repo.findAnalysisForReview.mockResolvedValue(
      analysisRecord({ status: "IN_REVIEW", reviewerId: DOCTOR, validated: true, versions }),
    );

    const result = await saveDraft(DOCTOR, ANALYSIS, { ...report, content: `  ${report.content}\n` });

    expect(result).toEqual({ ok: true, data: { created: false } });
    expect(repo.addReportVersion).not.toHaveBeenCalled();
  });

  it("creates a doctor version for edited text", async () => {
    repo.findAnalysisForReview.mockResolvedValue(analysisRecord({ status: "IN_REVIEW", reviewerId: DOCTOR, validated: true }));
    await saveDraft(DOCTOR, ANALYSIS, report);
    expect(repo.addReportVersion).toHaveBeenCalledWith("review-1", expect.objectContaining({ kind: "DOCTOR_EDIT" }));
  });
});

describe("publish", () => {
  const aiDraft: Version = {
    id: "v1",
    reviewId: "review-1",
    kind: "AI_DRAFT",
    content: "Summary\nAI text as generated by the model.",
    style: "SHORT",
    language: "en",
  };

  it("refuses to publish an AI draft that was not edited", async () => {
    repo.findAnalysisForReview.mockResolvedValue(
      analysisRecord({ status: "IN_REVIEW", reviewerId: DOCTOR, validated: true, versions: [aiDraft] }),
    );

    const result = await publish(DOCTOR, ANALYSIS, { ...report, content: aiDraft.content, confirmed: true });

    expect(!result.ok && result.error.kind).toBe("edit_required");
    expect(repo.publishReport).not.toHaveBeenCalled();
  });

  it("publishes the edited report", async () => {
    repo.findAnalysisForReview.mockResolvedValue(
      analysisRecord({ status: "IN_REVIEW", reviewerId: DOCTOR, validated: true, versions: [aiDraft] }),
    );

    const result = await publish(DOCTOR, ANALYSIS, { ...report, confirmed: true });

    expect(result.ok).toBe(true);
    expect(repo.publishReport).toHaveBeenCalledWith({
      analysisId: ANALYSIS,
      reviewId: "review-1",
      doctorId: DOCTOR,
      version: { style: "SHORT", language: "en", content: report.content },
    });
  });

  it("refuses a doctor who is not assigned", async () => {
    repo.findAnalysisForReview.mockResolvedValue(
      analysisRecord({ status: "IN_REVIEW", reviewerId: OTHER_DOCTOR, validated: true }),
    );
    const result = await publish(DOCTOR, ANALYSIS, { ...report, confirmed: true });
    expect(!result.ok && result.error.kind).toBe("assigned_to_other");
  });
});

describe("getPublishedReportForPatient", () => {
  it("shows the report to its patient only", async () => {
    repo.findPublishedReport.mockResolvedValue({
      publishedAt: new Date(),
      correctedResult: aiResultFixture(),
      analysis: { userId: "patient-1", reviewer: null },
      versions: [{ content: "Report", style: "SHORT", language: "en" }],
    } as never);

    expect(await getPublishedReportForPatient("patient-2", ANALYSIS)).toBeNull();
    expect(await getPublishedReportForPatient("patient-1", ANALYSIS)).toMatchObject({ content: "Report" });
  });
});
