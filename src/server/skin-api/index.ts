import { analyzeSkin } from "./client";
import type { SkinApiError } from "./errors";
import { mapSkinAnalysis, type DermaVisionSkinAnalysis } from "./mapper";
import type { FaceppSkinAnalyzeResponse } from "./schemas";

// Public entry point of server/skin-api. Other server code imports from "@/server/skin-api" only,
// never from client.ts, schemas.ts or config.ts directly.

export type SkinApiResult =
  | { ok: true; data: DermaVisionSkinAnalysis; raw: FaceppSkinAnalyzeResponse }
  | { ok: false; error: SkinApiError };

// Sends the photo to Face++ and returns the result in the DermaVision format (data),
// plus the validated Face++ response (raw) so it can be stored for traceability.
export async function runSkinAnalysis(image: Blob): Promise<SkinApiResult> {
  const result = await analyzeSkin(image);
  if (!result.ok) return result;

  return { ok: true, data: mapSkinAnalysis(result.data), raw: result.data };
}

export { SkinApiError, isSkinApiError } from "./errors";
export type { SkinApiErrorKind } from "./errors";
export { SKIN_INDICATOR_DEFINITIONS } from "./mapper";
export type {
  DermaVisionSkinAnalysis,
  SkinIndicator,
  SkinIndicatorCategory,
  SkinTypeIndicator,
  SkinTypeValue,
  SkinZone,
} from "./mapper";
