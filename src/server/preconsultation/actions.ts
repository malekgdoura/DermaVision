"use server";

import { generatePreConsultationSummary, type SummaryResult } from "./service";

export type PreConsultationActionState =
  | { status: "idle" }
  | { status: "success"; result: Extract<SummaryResult, { ok: true }>["data"] }
  | { status: "error"; result: Extract<SummaryResult, { ok: false }>["data"] };

export async function generatePreConsultationSummaryAction(
  _state: PreConsultationActionState,
  formData: FormData,
): Promise<PreConsultationActionState> {
  const rawAnswers = formData.get("answers");
  if (typeof rawAnswers !== "string") {
    return {
      status: "error",
      result: {
        originalAnswers: {
          motif: "",
          attentes: "",
          habitudesSoin: "",
          traitements: [],
          allergies: { status: "NOT_PROVIDED", items: [] },
          informationsComplementaires: "",
        },
        summary: null,
        status: "FAILED",
        provider: "groq",
        model: null,
        generatedAt: null,
        error: "Les réponses de pré-consultation sont absentes.",
        retryable: false,
      },
    };
  }

  let answers: unknown;
  try {
    answers = JSON.parse(rawAnswers);
  } catch {
    return {
      status: "error",
      result: {
        originalAnswers: {
          motif: "",
          attentes: "",
          habitudesSoin: "",
          traitements: [],
          allergies: { status: "NOT_PROVIDED", items: [] },
          informationsComplementaires: "",
        },
        summary: null,
        status: "FAILED",
        provider: "groq",
        model: null,
        generatedAt: null,
        error: "Les réponses de pré-consultation sont invalides.",
        retryable: false,
      },
    };
  }

  const result = await generatePreConsultationSummary(answers);
  return result.ok ? { status: "success", result: result.data } : { status: "error", result: result.data };
}
