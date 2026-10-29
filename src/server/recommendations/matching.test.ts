import { describe, expect, it } from "vitest";

import { applyCorrections } from "@/server/review/corrections";
import { aiResultFixture } from "@/test/fixtures";

import { matchRecommendations, presentKeys } from "./matching";

const result = applyCorrections(aiResultFixture(), { detectedKeys: new Set(["acne", "blackhead"]), skinType: "oily" });

describe("presentKeys", () => {
  it("lists the confirmed signs and the skin type", () => {
    expect([...presentKeys(result)].sort()).toEqual(["acne", "blackhead", "skin_type:oily"]);
  });
});

describe("matchRecommendations", () => {
  const library = [
    { id: "general", indicatorKeys: [] },
    { id: "eyes", indicatorKeys: ["dark_circle"] },
    { id: "acne", indicatorKeys: ["acne"] },
    { id: "acne-oily", indicatorKeys: ["acne", "skin_type:oily", "mole"] },
  ];

  it("suggests what answers a present sign, best match first", () => {
    const { suggested, others } = matchRecommendations(library, presentKeys(result));

    expect(suggested.map((item) => item.id)).toEqual(["acne-oily", "acne"]);
    expect(suggested[0].matchedKeys).toEqual(["acne", "skin_type:oily"]);
    expect(others.map((item) => item.id)).toEqual(["general", "eyes"]);
  });

  it("suggests nothing when no sign matches", () => {
    const { suggested } = matchRecommendations(library, new Set(["wrinkles"]));
    expect(suggested).toEqual([]);
  });
});
