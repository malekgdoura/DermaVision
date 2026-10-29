import type { DermaVisionSkinAnalysis } from "@/server/skin-api";

/**
 * mappedResult is stored as JSON in the database: check its shape before the UI uses it.
 * Only this mapped DermaVision format reaches the UI, never the raw provider response.
 */
export function readMappedResult(value: unknown): DermaVisionSkinAnalysis | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<DermaVisionSkinAnalysis>;
  if (!Array.isArray(candidate.indicators) || !candidate.skinType) return null;
  return candidate as DermaVisionSkinAnalysis;
}

export function analysisPhotoUrl(analysisId: string) {
  return `/api/analyses/${encodeURIComponent(analysisId)}/image`;
}
