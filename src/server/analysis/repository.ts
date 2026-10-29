import type { AnalysisStatus, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/db/prisma";

// Database access for skin analyses. The only file of server/analysis that talks to Prisma.
// No permission checks here: the service decides who may read or change what.

export function createImage(data: {
  userId: string;
  storageKey: string;
  mimeType: string;
  size: number;
}) {
  return prisma.image.create({ data });
}

// Returns null when the image does not exist.
export function findImageById(imageId: string) {
  return prisma.image.findUnique({ where: { id: imageId } });
}

export function createSkinAnalysis(data: { userId: string; imageId: string }) {
  // status defaults to PROCESSING in the schema.
  return prisma.skinAnalysis.create({ data });
}

export function createAiResult(data: {
  analysisId: string;
  provider: string;
  requestId?: string;
  rawResponse: Prisma.InputJsonValue;
  mappedResult: Prisma.InputJsonValue;
}) {
  return prisma.aiResult.create({
    data: {
      analysisId: data.analysisId,
      provider: data.provider,
      requestId: data.requestId ?? null,
      rawResponse: data.rawResponse,
      mappedResult: data.mappedResult,
    },
  });
}

export function updateSkinAnalysisStatus(analysisId: string, status: AnalysisStatus) {
  return prisma.skinAnalysis.update({
    where: { id: analysisId },
    data: { status },
  });
}

// Returns null when the analysis does not exist.
export function findSkinAnalysisById(analysisId: string) {
  return prisma.skinAnalysis.findUnique({
    where: { id: analysisId },
    include: { image: true, aiResult: true },
  });
}

// Newest first. Includes the image and AI result so a list can show them without extra queries.
export function findSkinAnalysesByUser(userId: string) {
  return prisma.skinAnalysis.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { image: true, aiResult: true },
  });
}
