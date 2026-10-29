import { describe, expect, it } from "vitest";

import { parseReport } from "./report-text";

describe("parseReport", () => {
  it("reads titles, paragraphs and bullet lists", () => {
    const blocks = parseReport("Summary\nYour skin is in good condition.\n\nWhat you can do:\n- Cleanse gently\n- Use sunscreen");
    expect(blocks).toEqual([
      { type: "title", text: "Summary" },
      { type: "paragraph", text: "Your skin is in good condition." },
      { type: "title", text: "What you can do" },
      { type: "list", items: ["Cleanse gently", "Use sunscreen"] },
    ]);
  });

  it("does not treat a final short sentence as a title", () => {
    expect(parseReport("See you soon")).toEqual([{ type: "paragraph", text: "See you soon" }]);
  });
});
