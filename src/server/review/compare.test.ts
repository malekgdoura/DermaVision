import { describe, expect, it } from "vitest";

import { aiResultFixture } from "@/test/fixtures";

import { compareReviewedResults, hasChanges } from "./compare";
import { applyCorrections } from "./corrections";

describe("compareReviewedResults", () => {
  it("sorts signs into appeared, resolved and persistent", () => {
    const previous = applyCorrections(aiResultFixture(), { detectedKeys: new Set(["acne", "blackhead"]), skinType: "oily" });
    const current = applyCorrections(aiResultFixture(), { detectedKeys: new Set(["acne", "dark_circle"]), skinType: "oily" });

    const comparison = compareReviewedResults(previous, current);

    expect(comparison.appeared.map((i) => i.key)).toEqual(["dark_circle"]);
    expect(comparison.resolved.map((i) => i.key)).toEqual(["blackhead"]);
    expect(comparison.persistent.map((i) => i.key)).toEqual(["acne"]);
    expect(comparison.skinTypeChange).toBeNull();
    expect(hasChanges(comparison)).toBe(true);
  });

  it("reports a skin type change", () => {
    const previous = applyCorrections(aiResultFixture(), { detectedKeys: new Set(["acne"]), skinType: "oily" });
    const current = applyCorrections(aiResultFixture(), { detectedKeys: new Set(["acne"]), skinType: "normal" });

    expect(compareReviewedResults(previous, current).skinTypeChange).toEqual({ from: "Oily skin", to: "Normal skin" });
  });

  it("finds no change between identical results", () => {
    const result = applyCorrections(aiResultFixture(), { detectedKeys: new Set(["acne"]), skinType: "oily" });
    expect(hasChanges(compareReviewedResults(result, result))).toBe(false);
  });
});
