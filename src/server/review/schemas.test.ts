import { describe, expect, it } from "vitest";

import { correctionsSchema, publishSchema } from "./schemas";

const content = "Summary\nThe doctor reviewed and edited this report text.";

describe("publishSchema", () => {
  it("requires the doctor's confirmation", () => {
    const result = publishSchema.safeParse({ style: "SHORT", language: "en", content, confirmed: false });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(["confirmed"]);
  });

  it("rejects a too short report and unknown styles", () => {
    expect(publishSchema.safeParse({ style: "SHORT", language: "en", content: "Too short", confirmed: true }).success).toBe(false);
    expect(publishSchema.safeParse({ style: "FUNNY", language: "en", content, confirmed: true }).success).toBe(false);
  });

  it("stores line breaks as \\n only", () => {
    const submitted = `${content.replace("\n", "\r\n")}\r\n`;
    const parsed = publishSchema.parse({ style: "SHORT", language: "en", content: submitted, confirmed: true });
    expect(parsed.content).toBe(content);
  });

  it("accepts a confirmed report", () => {
    expect(publishSchema.safeParse({ style: "DETAILED", language: "fr", content, confirmed: true }).success).toBe(true);
  });
});

describe("correctionsSchema", () => {
  it("turns empty notes into null and rejects odd keys", () => {
    expect(correctionsSchema.parse({ skinType: "dry", detected: ["acne"], clinicalNotes: "  " }).clinicalNotes).toBeNull();
    expect(correctionsSchema.safeParse({ skinType: "dry", detected: ["../x"], clinicalNotes: "" }).success).toBe(false);
  });
});
