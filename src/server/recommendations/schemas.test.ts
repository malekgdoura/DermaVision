import { describe, expect, it } from "vitest";

import { recommendationSchema } from "./schemas";

const valid = {
  title: "Gentle cleansing",
  content: "Wash your face morning and evening with a mild, soap-free cleanser.",
  category: "inflammation",
  language: "en",
  indicatorKeys: ["acne", "blackhead", "acne"],
};

describe("recommendationSchema", () => {
  it("accepts a valid recommendation and removes duplicate signs", () => {
    const parsed = recommendationSchema.parse(valid);
    expect(parsed.indicatorKeys).toEqual(["acne", "blackhead"]);
  });

  it("accepts skin type keys and general advice without signs", () => {
    expect(recommendationSchema.safeParse({ ...valid, indicatorKeys: ["skin_type:dry"] }).success).toBe(true);
    expect(recommendationSchema.safeParse({ ...valid, category: "general", indicatorKeys: [] }).success).toBe(true);
  });

  it("rejects unknown signs, categories and too short text", () => {
    expect(recommendationSchema.safeParse({ ...valid, indicatorKeys: ["freckles"] }).success).toBe(false);
    expect(recommendationSchema.safeParse({ ...valid, category: "magic" }).success).toBe(false);
    expect(recommendationSchema.safeParse({ ...valid, content: "Too short" }).success).toBe(false);
    expect(recommendationSchema.safeParse({ ...valid, title: "Hi" }).success).toBe(false);
  });

  it("stores line breaks as \\n only", () => {
    const parsed = recommendationSchema.parse({ ...valid, content: `${valid.content}\r\nSecond line of advice.\r\n` });
    expect(parsed.content).toBe(`${valid.content}\nSecond line of advice.`);
  });
});
