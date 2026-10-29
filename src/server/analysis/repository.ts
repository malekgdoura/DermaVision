import { Prisma, type AnalysisStatus, type Prisma as PrismaTypes } from "@/generated/prisma/client";
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
  rawResponse: PrismaTypes.InputJsonValue;
  mappedResult: PrismaTypes.InputJsonValue;
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
  // The connected database uses the multi-photo schema: images belong to an analysis,
  // so SkinAnalysis no longer has the legacy imageId column. History only needs this
  // projection and avoids selecting the obsolete relation through the old client model.
  return prisma.$queryRaw<
    Array<{
      id: string;
      userId: string;
      status: AnalysisStatus;
      createdAt: Date;
      updatedAt: Date;
      reviewerId: string | null;
      mappedResult: PrismaTypes.JsonValue | null;
    }>
  >(Prisma.sql`
    SELECT
      analysis."id",
      analysis."userId",
      analysis."status",
      analysis."createdAt",
      analysis."updatedAt",
      analysis."reviewerId",
      result."mappedResult"
    FROM "SkinAnalysis" AS analysis
    LEFT JOIN "AiResult" AS result ON result."analysisId" = analysis."id"
    WHERE analysis."userId" = ${userId}
    ORDER BY analysis."createdAt" DESC
  `).then((rows) =>
    rows.map(({ mappedResult, ...analysis }) => ({
      ...analysis,
      aiResult: mappedResult === null ? null : { mappedResult },
    })),
  );
}
