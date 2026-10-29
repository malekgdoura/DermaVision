import { analysisResult } from "@/content/analysis";
import type { ResultComparison } from "@/server/review/compare";
import type { ReviewedSkinAnalysis } from "@/server/review/corrections";
import type { SkinIndicator } from "@/server/skin-api";

import type { ChatMessage } from "./client";

// Builds the messages sent to the LLM for a report draft. Pure: no network.
// Privacy: no name, email, phone or photo is ever sent, only the validated findings.

export type ReportStyleValue = "SHORT" | "DETAILED" | "PATIENT_FRIENDLY";
export type ReportLanguage = "en" | "fr";

export type ReportPromptInput = {
  result: ReviewedSkinAnalysis;
  clinicalNotes: string | null;
  style: ReportStyleValue;
  language: ReportLanguage;
  // Comparison with the patient's previous published review, when there is one.
  previous: { date: Date; comparison: ResultComparison } | null;
  // Advice from the doctors' library, chosen by the doctor for this patient.
  recommendations?: { title: string; content: string }[];
};

const LANGUAGE_NAMES: Record<ReportLanguage, string> = { en: "English", fr: "French" };

const STYLE_INSTRUCTIONS: Record<ReportStyleValue, string> = {
  SHORT: [
    "Style: SHORT. 80 to 130 words.",
    "Sections: Summary, Key observations, Next steps.",
    "Bullet points for observations. No AI confidence percentages.",
  ].join("\n"),
  DETAILED: [
    "Style: DETAILED. 300 to 450 words.",
    "Sections: Summary, Skin type, Observations (grouped by facial area), Evolution since the previous review (only if previous data is given), Care recommendations, Follow-up.",
    "You may mention where the doctor corrected the automated analysis. You may give AI confidence only as context, never as a certainty.",
  ].join("\n"),
  PATIENT_FRIENDLY: [
    "Style: PATIENT_FRIENDLY. 150 to 250 words.",
    "Speak directly to the patient (\"you\"), warm and reassuring, no medical jargon: explain each term in simple words.",
    "Sections: What we looked at, What we noticed, What you can do, Next steps.",
  ].join("\n"),
};

const SYSTEM_PROMPT = [
  "You draft dermatology skin-analysis reports for DermaVision.",
  "A dermatologist has already validated the findings below and will read, edit and sign your draft before the patient sees it.",
  "Rules:",
  "- Use ONLY the findings and doctor notes provided. Never invent signs, diagnoses, diseases, causes or test results.",
  "- Do not name medications, dosages or procedures unless the doctor notes mention them.",
  "- Signs marked \"not present\" must not be described as problems.",
  "- Stay factual and calm. No alarming language, no guarantees, no product brands.",
  "- Do not greet by name and do not sign: the doctor's signature is added by the application.",
  "- If validatedRecommendations are given, the advice section must use them (you may translate and rephrase gently, never change their meaning) and must not add any other advice.",
  "- Format: plain text. Each section title on its own line, followed by its text. Bullet points start with \"- \". No markdown bold, headings symbols or tables.",
].join("\n");

export function buildReportMessages(input: ReportPromptInput): ChatMessage[] {
  const user = [
    `Write the report in ${LANGUAGE_NAMES[input.language]}.`,
    STYLE_INSTRUCTIONS[input.style],
    "",
    "Validated findings (JSON):",
    JSON.stringify(describeFindings(input), null, 2),
  ].join("\n");

  return [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: user },
  ];
}

function describeFindings({ result, clinicalNotes, previous, recommendations = [] }: ReportPromptInput) {
  const present = result.indicators.filter((indicator) => indicator.detected);
  const absent = result.indicators.filter((indicator) => !indicator.detected);

  return {
    skinType: {
      value: result.skinType.label,
      correctedByDoctor: Boolean(result.skinType.corrected),
    },
    presentSigns: present.map((indicator) => ({
      sign: describeSign(indicator),
      category: analysisResult.categories[indicator.category],
      aiConfidence: Math.round(indicator.confidence * 100) / 100,
      addedByDoctor: Boolean("corrected" in indicator && indicator.corrected),
    })),
    notPresent: absent.map(describeSign),
    doctorNotes: clinicalNotes?.trim() || null,
    validatedRecommendations: recommendations.length > 0 ? recommendations : null,
    previousReview: previous
      ? {
          date: previous.date.toISOString().slice(0, 10),
          newSigns: previous.comparison.appeared.map(describeSign),
          noLongerPresent: previous.comparison.resolved.map(describeSign),
          stillPresent: previous.comparison.persistent.map(describeSign),
          skinTypeChange: previous.comparison.skinTypeChange,
        }
      : null,
  };
}

function describeSign(indicator: SkinIndicator): string {
  return indicator.zone ? `${indicator.label} (${analysisResult.zones[indicator.zone]})` : indicator.label;
}
