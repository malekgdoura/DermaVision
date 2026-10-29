import type { DermaVisionSkinAnalysis, SkinIndicator } from "@/server/skin-api";

// Small, realistic AI result used by the review tests.

function indicator(key: string, label: string, detected: boolean, extra: Partial<SkinIndicator> = {}): SkinIndicator {
  return { key, label, category: "texture", detected, confidence: 0.8, ...extra };
}

export function aiResultFixture(): DermaVisionSkinAnalysis {
  return {
    requestId: "req-1",
    warnings: [],
    indicators: [
      indicator("acne", "Acne", true, { category: "inflammation", confidence: 0.91 }),
      indicator("blackhead", "Blackheads", true, { confidence: 0.55 }),
      indicator("pores_forehead", "Enlarged pores", false, { zone: "forehead" }),
      indicator("dark_circle", "Dark circles", false, { category: "eye-area", zone: "eyes" }),
    ],
    skinType: {
      key: "skin_type",
      label: "Oily skin",
      category: "skin-type",
      detected: true,
      confidence: 0.62,
      value: "oily",
      confidenceByType: { oily: 0.62, dry: 0.05, normal: 0.1, combination: 0.23 },
    },
  };
}
