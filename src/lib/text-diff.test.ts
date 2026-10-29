import { describe, expect, it } from "vitest";

import { diffWords } from "./text-diff";

const join = (parts: ReturnType<typeof diffWords>, keep: "before" | "after") =>
  parts
    .filter((part) => part.type === "same" || part.type === (keep === "before" ? "removed" : "added"))
    .map((part) => part.text)
    .join("");

describe("diffWords", () => {
  it("marks added and removed words", () => {
    const parts = diffWords("Your skin is oily.", "Your skin is slightly oily.");
    expect(parts).toEqual([
      { type: "same", text: "Your skin is " },
      { type: "added", text: "slightly " },
      { type: "same", text: "oily." },
    ]);
  });

  it("can rebuild both texts from the diff", () => {
    const before = "Summary\nMild acne on the forehead.\n- Wash twice a day";
    const after = "Summary\nMild acne on the cheeks.\n- Wash gently twice a day\n- Use sunscreen";
    const parts = diffWords(before, after);
    expect(join(parts, "before")).toBe(before);
    expect(join(parts, "after")).toBe(after);
  });

  it("handles empty texts", () => {
    expect(diffWords("", "")).toEqual([]);
    expect(diffWords("", "new")).toEqual([{ type: "added", text: "new" }]);
  });
});
