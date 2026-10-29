import type { ReviewedSkinAnalysis } from "@/server/review/corrections";

import { SKIN_TYPE_KEYS } from "./indicators";

// Matches library recommendations with the signs the doctor confirmed. Pure: no database.

type Matchable = { indicatorKeys: string[] };

// Keys of what is present in a validated result: detected indicators plus the skin type.
export function presentKeys(result: ReviewedSkinAnalysis): Set<string> {
  const keys = new Set(result.indicators.filter((indicator) => indicator.detected).map((indicator) => indicator.key));
  keys.add(SKIN_TYPE_KEYS[result.skinType.value]);
  return keys;
}

/**
 * Splits recommendations into those that answer a present sign (most matches first, with the matching keys)
 * and the others (general advice, or signs this patient does not have).
 */
export function matchRecommendations<T extends Matchable>(recommendations: T[], present: ReadonlySet<string>) {
  const suggested: (T & { matchedKeys: string[] })[] = [];
  const others: T[] = [];

  for (const recommendation of recommendations) {
    const matchedKeys = recommendation.indicatorKeys.filter((key) => present.has(key));
    if (matchedKeys.length > 0) suggested.push({ ...recommendation, matchedKeys });
    else others.push(recommendation);
  }

  suggested.sort((a, b) => b.matchedKeys.length - a.matchedKeys.length);
  return { suggested, others };
}
