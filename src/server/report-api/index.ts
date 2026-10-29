import { createChatCompletion } from "./client";
import type { ReportApiError } from "./errors";
import { buildReportMessages, type ReportPromptInput } from "./prompt";

// Public entry point of server/report-api. Other server code imports from "@/server/report-api" only.

export type ReportDraft = {
  content: string;
  model: string;
  truncated: boolean;
};

export type ReportDraftResult = { ok: true; data: ReportDraft } | { ok: false; error: ReportApiError };

// Asks the LLM (Groq) for a report draft built from the doctor-validated findings.
export async function generateReportDraft(input: ReportPromptInput): Promise<ReportDraftResult> {
  const maxTokens = input.style === "DETAILED" ? 1500 : 800;
  return createChatCompletion({ messages: buildReportMessages(input), temperature: 0.3, maxTokens });
}

export { ReportApiError } from "./errors";
export type { ReportApiErrorKind } from "./errors";
export type { ReportLanguage, ReportPromptInput, ReportStyleValue } from "./prompt";
