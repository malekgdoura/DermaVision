import { describe, expect, it } from "vitest";

import { compareReviewedResults } from "@/server/review/compare";
import { applyCorrections } from "@/server/review/corrections";
import { aiResultFixture } from "@/test/fixtures";

import { buildReportMessages } from "./prompt";

const result = applyCorrections(aiResultFixture(), {
  detectedKeys: new Set(["acne", "dark_circle"]),
  skinType: "combination",
});

function findings(messages: ReturnType<typeof buildReportMessages>) {
  const user = messages[1].content;
  return JSON.parse(user.slice(user.indexOf("{")));
}

describe("buildReportMessages", () => {
  it("sends only the validated findings, with the doctor's corrections", () => {
    const messages = buildReportMessages({
      result,
      clinicalNotes: "Mild acne, no treatment needed yet.",
      style: "SHORT",
      language: "en",
      previous: null,
    });

    expect(messages.map((m) => m.role)).toEqual(["system", "user"]);
    const data = findings(messages);
    expect(data.skinType).toEqual({ value: "Combination skin", correctedByDoctor: true });
    expect(data.presentSigns.map((s: { sign: string }) => s.sign)).toEqual(["Acne", "Dark circles (Eyes)"]);
    expect(data.presentSigns[1].addedByDoctor).toBe(true);
    expect(data.notPresent).toContain("Blackheads");
    expect(data.doctorNotes).toBe("Mild acne, no treatment needed yet.");
    expect(data.previousReview).toBeNull();
  });

  it("follows the requested style and language", () => {
    const messages = buildReportMessages({ result, clinicalNotes: null, style: "PATIENT_FRIENDLY", language: "fr", previous: null });
    expect(messages[1].content).toContain("in French");
    expect(messages[1].content).toContain("PATIENT_FRIENDLY");
    expect(messages[0].content).toContain("Never invent");
  });

  it("includes the evolution since the previous review", () => {
    const previousResult = applyCorrections(aiResultFixture(), { detectedKeys: new Set(["acne", "blackhead"]), skinType: "oily" });
    const messages = buildReportMessages({
      result,
      clinicalNotes: null,
      style: "DETAILED",
      language: "en",
      previous: { date: new Date("2026-09-01T10:00:00Z"), comparison: compareReviewedResults(previousResult, result) },
    });

    expect(findings(messages).previousReview).toEqual({
      date: "2026-09-01",
      newSigns: ["Dark circles (Eyes)"],
      noLongerPresent: ["Blackheads"],
      stillPresent: ["Acne"],
      skinTypeChange: { from: "Oily skin", to: "Combination skin" },
    });
  });

  it("passes the doctor's chosen recommendations and forbids other advice", () => {
    const recommendations = [{ title: "Gentle cleansing", content: "Wash twice a day with a mild cleanser." }];
    const messages = buildReportMessages({ result, clinicalNotes: null, style: "SHORT", language: "en", previous: null, recommendations });

    expect(findings(messages).validatedRecommendations).toEqual(recommendations);
    expect(messages[0].content).toContain("must not add any other advice");
  });

  it("sends no recommendation field when none is chosen", () => {
    const messages = buildReportMessages({ result, clinicalNotes: null, style: "SHORT", language: "en", previous: null });
    expect(findings(messages).validatedRecommendations).toBeNull();
  });
});
