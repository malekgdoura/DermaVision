import type { Prisma, ReportStyle, ReportVersionKind } from "@/generated/prisma/client";
import { prisma } from "@/server/db/prisma";

// Database access for medical reviews. The only file of server/review that talks to Prisma.
// No permission checks here: the service decides who may read or change what.

const REVIEWABLE = ["AI_DONE", "IN_REVIEW"] as const;

const patientSelect = { id: true, prenom: true, nom: true } as const;
const doctorSelect = { id: true, prenom: true, nom: true } as const;

// Analyses waiting for a doctor, oldest first (first in, first reviewed).
export function findReviewQueue() {
  return prisma.skinAnalysis.findMany({
    where: { status: { in: [...REVIEWABLE] } },
    orderBy: { createdAt: "asc" },
    include: {
      user: { select: patientSelect },
      reviewer: { select: doctorSelect },
      aiResult: { select: { mappedResult: true } },
      review: { select: { indicatorsValidatedAt: true, _count: { select: { versions: true } } } },
    },
  });
}

// Reports this doctor published, newest first.
export function findPublishedByDoctor(doctorId: string, take: number) {
  return prisma.skinAnalysis.findMany({
    where: { status: "VALIDATED", reviewerId: doctorId },
    orderBy: { review: { publishedAt: "desc" } },
    take,
    include: {
      user: { select: patientSelect },
      review: { select: { publishedAt: true } },
    },
  });
}

export function countByStatus() {
  return prisma.skinAnalysis.groupBy({ by: ["status"], _count: { _all: true } });
}

export function countPublishedByDoctor(doctorId: string) {
  return prisma.skinAnalysis.count({ where: { status: "VALIDATED", reviewerId: doctorId } });
}

// Everything the review screen needs. Returns null when the analysis does not exist.
export function findAnalysisForReview(analysisId: string) {
  return prisma.skinAnalysis.findUnique({
    where: { id: analysisId },
    include: {
      user: { select: { ...patientSelect, email: true, telephone: true, createdAt: true } },
      reviewer: { select: doctorSelect },
      image: { select: { storageKey: true } },
      aiResult: { select: { mappedResult: true, provider: true, createdAt: true } },
      review: {
        include: {
          versions: {
            orderBy: { number: "desc" },
            include: { author: { select: doctorSelect } },
          },
        },
      },
    },
  });
}

export function countPatientAnalyses(userId: string) {
  return prisma.skinAnalysis.count({ where: { userId } });
}

// The patient's most recent published review before a given analysis date.
export function findPreviousPublishedReview(userId: string, before: Date) {
  return prisma.medicalReview.findFirst({
    where: {
      publishedAt: { not: null },
      analysis: { userId, createdAt: { lt: before } },
    },
    orderBy: { analysis: { createdAt: "desc" } },
    include: {
      analysis: { select: { id: true, createdAt: true } },
      versions: { where: { kind: "PUBLISHED" }, take: 1 },
    },
  });
}

// Published report of one analysis, for its patient: never the drafts nor the clinical notes.
export function findPublishedReport(analysisId: string) {
  return prisma.medicalReview.findFirst({
    where: { analysisId, publishedAt: { not: null } },
    select: {
      publishedAt: true,
      correctedResult: true,
      analysis: { select: { userId: true, reviewer: { select: doctorSelect } } },
      versions: { where: { kind: "PUBLISHED" }, take: 1, select: { content: true, style: true, language: true } },
    },
  });
}

export function countPublishedForPatient(userId: string) {
  return prisma.skinAnalysis.count({ where: { userId, status: "VALIDATED" } });
}

/**
 * Atomically assigns the analysis to the doctor and moves it to IN_REVIEW.
 * Succeeds only while it is still reviewable and free or already theirs.
 * Returns false when another doctor holds it or it is no longer reviewable.
 */
export async function claimAnalysis(analysisId: string, doctorId: string): Promise<boolean> {
  const { count } = await prisma.skinAnalysis.updateMany({
    where: {
      id: analysisId,
      status: { in: [...REVIEWABLE] },
      OR: [{ reviewerId: null }, { reviewerId: doctorId }],
    },
    data: { reviewerId: doctorId, status: "IN_REVIEW" },
  });
  return count === 1;
}

export function saveCorrections(data: {
  analysisId: string;
  correctedResult: Prisma.InputJsonValue;
  clinicalNotes: string | null;
}) {
  const now = new Date();
  return prisma.medicalReview.upsert({
    where: { analysisId: data.analysisId },
    create: {
      analysisId: data.analysisId,
      correctedResult: data.correctedResult,
      clinicalNotes: data.clinicalNotes,
      indicatorsValidatedAt: now,
    },
    update: {
      correctedResult: data.correctedResult,
      clinicalNotes: data.clinicalNotes,
      indicatorsValidatedAt: now,
    },
  });
}

type NewVersion = {
  kind: ReportVersionKind;
  style: ReportStyle;
  language: string;
  content: string;
  model?: string | null;
  authorId: string;
};

function createVersion(tx: Prisma.TransactionClient, reviewId: string, version: NewVersion) {
  return tx.reportVersion
    .aggregate({ where: { reviewId }, _max: { number: true } })
    .then(({ _max }) =>
      tx.reportVersion.create({
        data: { reviewId, number: (_max.number ?? 0) + 1, ...version, model: version.model ?? null },
      }),
    );
}

// Numbers are computed inside the transaction; the (reviewId, number) unique index guards the rest.
export function addReportVersion(reviewId: string, version: NewVersion) {
  return prisma.$transaction((tx) => createVersion(tx, reviewId, version));
}

/**
 * Publishes the report in one transaction: PUBLISHED version, publication date, VALIDATED status.
 * Returns false (and changes nothing) when the analysis is no longer IN_REVIEW for this doctor.
 */
export function publishReport(input: {
  analysisId: string;
  reviewId: string;
  doctorId: string;
  version: Omit<NewVersion, "kind" | "authorId" | "model">;
}): Promise<boolean> {
  return prisma
    .$transaction(async (tx) => {
      const { count } = await tx.skinAnalysis.updateMany({
        where: { id: input.analysisId, status: "IN_REVIEW", reviewerId: input.doctorId },
        data: { status: "VALIDATED" },
      });
      if (count !== 1) throw new PublishConflict();

      await createVersion(tx, input.reviewId, { ...input.version, kind: "PUBLISHED", authorId: input.doctorId });
      await tx.medicalReview.update({ where: { id: input.reviewId }, data: { publishedAt: new Date() } });
      return true;
    })
    .catch((error: unknown) => {
      if (error instanceof PublishConflict) return false;
      throw error;
    });
}

class PublishConflict extends Error {}
