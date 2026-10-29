import type { Prisma } from "@/generated/prisma/client";
import {
  runSkinAnalysis,
  SkinApiError,
  type DermaVisionSkinAnalysis,
} from "@/server/skin-api";

import {
  createAiResult,
  createSkinAnalysis,
  findImageById,
  findSkinAnalysesByUser,
  findSkinAnalysisById,
  updateSkinAnalysisStatus,
} from "./repository";

// Business flow of a skin analysis: statuses, AI result storage and read permissions.
// No UI, no Server Action, no file storage (the image is already saved and passed in).

const PROVIDER = "facepp";

type SkinAnalysisWithDetails = NonNullable<Awaited<ReturnType<typeof findSkinAnalysisById>>>;

// Refused before anything is created or sent to Face++.
export type AnalysisRequestError = {
  kind: "image_not_found";
  message: string;
};

export type StartAnalysisResult =
  | { ok: true; analysis: SkinAnalysisWithDetails }
  | { ok: false; analysisId: string; error: SkinApiError }
  | { ok: false; analysisId: null; error: AnalysisRequestError };

export async function startSkinAnalysis(input: {
  userId: string;
  imageId: string;
  image: Blob;
}): Promise<StartAnalysisResult> {
  // The image must exist and belong to this user. Both cases get the same answer,
  // so a user cannot learn that another user's image exists.
  const image = await findImageById(input.imageId);
  if (!image || image.userId !== input.userId) {
    return {
      ok: false,
      analysisId: null,
      error: { kind: "image_not_found", message: "This photo could not be found." },
    };
  }

  const analysis = await createSkinAnalysis({ userId: input.userId, imageId: input.imageId });

  try {
    const result = await runSkinAnalysis(input.image);

    if (!result.ok) {
      await updateSkinAnalysisStatus(analysis.id, "FAILED");
      return { ok: false, analysisId: analysis.id, error: result.error };
    }

    await createAiResult({
      analysisId: analysis.id,
      provider: PROVIDER,
      requestId: result.data.requestId,
      rawResponse: result.raw,
      mappedResult: toJson(result.data),
    });
    await updateSkinAnalysisStatus(analysis.id, "AI_DONE");
  } catch (error) {
    // Unexpected failure (database, bug): never leave the analysis stuck in PROCESSING.
    await updateSkinAnalysisStatus(analysis.id, "FAILED");
    throw error;
  }

  const finalAnalysis = await findSkinAnalysisById(analysis.id);
  if (!finalAnalysis) throw new Error(`Skin analysis ${analysis.id} disappeared after saving.`);

  return { ok: true, analysis: finalAnalysis };
}

// Returns null when the analysis does not exist OR belongs to someone else,
// so a user cannot even learn that another user's analysis exists.
export async function getAnalysisForUser(userId: string, analysisId: string) {
  const analysis = await findSkinAnalysisById(analysisId);
  if (!analysis || analysis.userId !== userId) return null;
  return analysis;
}

export function getAnalysesForUser(userId: string) {
  return findSkinAnalysesByUser(userId);
}

// The mapped result is plain data; the JSON round trip drops undefined fields (e.g. no zone).
function toJson(data: DermaVisionSkinAnalysis): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(data)) as Prisma.InputJsonValue;
}
