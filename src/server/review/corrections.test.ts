import { describe, expect, it } from "vitest";

import { aiResultFixture } from "@/test/fixtures";

import { applyCorrections, countCorrections, readReviewedResult } from "./corrections";

describe("applyCorrections", () => {
  it("keeps the AI result unchanged when the doctor confirms everything", () => {
    const ai = aiResultFixture();
    const result = applyCorrections(ai, { detectedKeys: new Set(["acne", "blackhead"]), skinType: "oily" });

    expect(countCorrections(result)).toBe(0);
    expect(result.indicators.map((i) => i.detected)).toEqual([true, true, false, false]);
  });

  it("flags every indicator the doctor changes", () => {
    const result = applyCorrections(aiResultFixture(), {
      detectedKeys: new Set(["acne", "dark_circle"]),
      skinType: "oily",
    });

    const byKey = Object.fromEntries(result.indicators.map((i) => [i.key, i]));
    expect(byKey.blackhead).toMatchObject({ detected: false, corrected: true });
    expect(byKey.dark_circle).toMatchObject({ detected: true, corrected: true });
    expect(byKey.acne.corrected).toBeUndefined();
    expect(countCorrections(result)).toBe(2);
  });

  it("changes the skin type with its label and the AI confidence for that type", () => {
    const result = applyCorrections(aiResultFixture(), {
      detectedKeys: new Set(["acne", "blackhead"]),
      skinType: "combination",
    });

    expect(result.skinType).toMatchObject({
      value: "combination",
      label: "Combination skin",
      confidence: 0.23,
      corrected: true,
    });
  });

  it("does not mutate the AI result", () => {
    const ai = aiResultFixture();
    applyCorrections(ai, { detectedKeys: new Set(), skinType: "dry" });
    expect(ai).toEqual(aiResultFixture());
  });
});

describe("readReviewedResult", () => {
  it("rejects values that are not a result", () => {
    expect(readReviewedResult(null)).toBeNull();
    expect(readReviewedResult({ indicators: "nope" })).toBeNull();
    expect(readReviewedResult(aiResultFixture())).not.toBeNull();
  });
});
