import type { SkinIndicator } from "@/server/skin-api";

import type { ReviewedSkinAnalysis } from "./corrections";

// Compares two doctor-validated results of the same patient. Pure: no database, no network.

export type ResultComparison = {
  // Present now, absent in the previous review.
  appeared: SkinIndicator[];
  // Absent now, present in the previous review.
  resolved: SkinIndicator[];
  // Present in both reviews.
  persistent: SkinIndicator[];
  skinTypeChange: { from: string; to: string } | null;
};

export function compareReviewedResults(
  previous: ReviewedSkinAnalysis,
  current: ReviewedSkinAnalysis,
): ResultComparison {
  const before = new Map(previous.indicators.map((indicator) => [indicator.key, indicator.detected]));

  const appeared: SkinIndicator[] = [];
  const resolved: SkinIndicator[] = [];
  const persistent: SkinIndicator[] = [];

  for (const indicator of current.indicators) {
    const wasDetected = before.get(indicator.key) ?? false;
    if (indicator.detected && wasDetected) persistent.push(indicator);
    else if (indicator.detected) appeared.push(indicator);
    else if (wasDetected) resolved.push(indicator);
  }

  const skinTypeChange =
    previous.skinType.value === current.skinType.value
      ? null
      : { from: previous.skinType.label, to: current.skinType.label };

  return { appeared, resolved, persistent, skinTypeChange };
}

export function hasChanges(comparison: ResultComparison): boolean {
  return comparison.appeared.length > 0 || comparison.resolved.length > 0 || comparison.skinTypeChange !== null;
}
