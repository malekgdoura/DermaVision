"use server";

import { auth } from "@/server/auth/auth";
import type { DermaVisionSkinAnalysis } from "@/server/skin-api";
import { deletePrivateImage, savePrivateImage, StorageError } from "@/server/storage/private-images";

import { createImage } from "./repository";
import { startSkinAnalysis } from "./service";

// Server Action: starts a skin analysis from an uploaded photo.
// The user always comes from the session, never from the client.

// Plain, serializable result (Server Actions cannot return Error instances).
export type StartAnalysisActionResult =
  | {
      ok: true;
      analysisId: string;
      status: string;
      result: DermaVisionSkinAnalysis | null;
    }
  | {
      ok: false;
      analysisId?: string;
      error: { kind: string; message: string; retryable: boolean };
    };

export async function startAnalysisFromUpload(file: File): Promise<StartAnalysisActionResult> {
  // 1. Authenticated user only.
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return failure("unauthenticated", "Please sign in to start an analysis.");
  }

  // Only patients can submit their own photo for analysis.
  if (session.user.role !== "PATIENT") {
    return failure("forbidden", "Only patients can start a skin analysis.");
  }

  if (!(file instanceof File)) {
    return failure("invalid_image", "Please choose a photo.");
  }

  // 2. Save the photo in private storage (checks JPEG and 2 MB).
  let saved;
  try {
    saved = await savePrivateImage(file);
  } catch (error) {
    if (error instanceof StorageError) return failure(error.kind, error.message);
    throw error;
  }

  // 3. Record the image in the database. If this fails, the file would be orphaned: remove it.
  let imageId: string;
  try {
    const image = await createImage({ userId, ...saved });
    imageId = image.id;
  } catch (error) {
    await deletePrivateImage(saved.storageKey);
    throw error;
  }

  // 4. Run the analysis. From here the file is linked to an Image row, so it is kept
  //    even if Face++ fails: the FAILED analysis still points to its photo.
  const outcome = await startSkinAnalysis({ userId, imageId, image: file });

  // 5. Plain result for the caller.
  if (!outcome.ok) {
    return {
      ok: false,
      analysisId: outcome.analysisId ?? undefined,
      error: {
        kind: outcome.error.kind,
        message: outcome.error.message,
        retryable: "retryable" in outcome.error ? outcome.error.retryable : false,
      },
    };
  }

  return {
    ok: true,
    analysisId: outcome.analysis.id,
    status: outcome.analysis.status,
    result: (outcome.analysis.aiResult?.mappedResult ?? null) as DermaVisionSkinAnalysis | null,
  };
}

function failure(kind: string, message: string): StartAnalysisActionResult {
  return { ok: false, error: { kind, message, retryable: false } };
}
