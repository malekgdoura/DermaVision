import type {
  DermaVisionSkinAnalysis,
  SkinIndicator,
  SkinTypeIndicator,
  SkinTypeValue,
} from "@/server/skin-api";

// Applies the doctor's corrections to the AI result. Pure: no database, no network.
// Corrections always start from the AI result, so validating twice gives the same output.

// Same shape as the AI result, plus a flag on every value the doctor changed.
export type ReviewedIndicator = SkinIndicator & { corrected?: true };
export type ReviewedSkinType = SkinTypeIndicator & { corrected?: true };
export type ReviewedSkinAnalysis = Omit<DermaVisionSkinAnalysis, "indicators" | "skinType"> & {
  indicators: ReviewedIndicator[];
  skinType: ReviewedSkinType;
};

export type IndicatorCorrections = {
  // Keys of the indicators the doctor confirms as present. Every other indicator is absent.
  detectedKeys: ReadonlySet<string>;
  skinType: SkinTypeValue;
};

export const SKIN_TYPE_LABELS: Record<SkinTypeValue, string> = {
  oily: "Oily skin",
  dry: "Dry skin",
  normal: "Normal skin",
  combination: "Combination skin",
};

export function applyCorrections(
  aiResult: DermaVisionSkinAnalysis,
  corrections: IndicatorCorrections,
): ReviewedSkinAnalysis {
  const indicators = aiResult.indicators.map((indicator): ReviewedIndicator => {
    const detected = corrections.detectedKeys.has(indicator.key);
    if (detected === indicator.detected) return { ...indicator };
    return { ...indicator, detected, corrected: true };
  });

  const ai = aiResult.skinType;
  const skinType: ReviewedSkinType =
    corrections.skinType === ai.value
      ? { ...ai }
      : {
          ...ai,
          value: corrections.skinType,
          label: SKIN_TYPE_LABELS[corrections.skinType],
          // AI confidence for the type the doctor chose, kept for transparency.
          confidence: ai.confidenceByType[corrections.skinType],
          corrected: true,
        };

  return { ...aiResult, indicators, skinType };
}

export function countCorrections(result: ReviewedSkinAnalysis): number {
  return result.indicators.filter((indicator) => indicator.corrected).length + (result.skinType.corrected ? 1 : 0);
}

/**
 * correctedResult is stored as JSON: check its shape before using it.
 * Returns null when the value is not a reviewed result.
 */
export function readReviewedResult(value: unknown): ReviewedSkinAnalysis | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<ReviewedSkinAnalysis>;
  if (!Array.isArray(candidate.indicators) || !candidate.skinType) return null;
  return candidate as ReviewedSkinAnalysis;
}
