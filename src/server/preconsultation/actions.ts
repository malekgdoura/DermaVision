"use server";

import { refresh } from "next/cache";

import { auth } from "@/server/auth/auth";

import { generatePreConsultationSummary, type SummaryResult } from "./service";
import { retryPreConsultationSummary, savePreConsultationDraft, submitPreConsultation } from "./service";

export type PreConsultationActionState =
  | { status: "idle" }
  | { status: "success"; result: Extract<SummaryResult, { ok: true }>["data"] }
  | { status: "error"; result: Extract<SummaryResult, { ok: false }>["data"] };

export type PersistedPreConsultationActionState =
  | { status: "idle" }
  | { status: "success"; message: string; summaryStatus?: "READY" | "FAILED" }
  | { status: "error"; message: string; retryable: boolean; summaryStatus?: "FAILED" };

export async function savePreConsultationDraftAction(
  appointmentId: string,
  answers: unknown,
): Promise<PersistedPreConsultationActionState> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "PATIENT") return { status: "error", message: "Connectez-vous comme patient pour continuer.", retryable: false };

  const result = await savePreConsultationDraft({ appointmentId, patientId: session.user.id, answers });
  if (!result.ok) return { status: "error", message: result.error, retryable: false };
  refresh();
  return { status: "success", message: "Brouillon enregistré." };
}

export async function submitPreConsultationAction(
  appointmentId: string,
  answers: unknown,
): Promise<PersistedPreConsultationActionState> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "PATIENT") return { status: "error", message: "Connectez-vous comme patient pour continuer.", retryable: false };

  const result = await submitPreConsultation({ appointmentId, patientId: session.user.id, answers });
  if (!result.ok) {
    if (result.data?.summaryStatus === "FAILED") {
      refresh();
      return { status: "success", message: "Vos réponses sont enregistrées, mais le résumé doit être régénéré.", summaryStatus: "FAILED" };
    }
    return { status: "error", message: result.error, retryable: false };
  }
  refresh();
  return { status: "success", message: "Pré-consultation envoyée au médecin.", summaryStatus: result.data.summaryStatus };
}

export async function retryPreConsultationSummaryAction(appointmentId: string): Promise<PersistedPreConsultationActionState> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "PATIENT") return { status: "error", message: "Connectez-vous comme patient pour continuer.", retryable: false };

  const result = await retryPreConsultationSummary({ appointmentId, patientId: session.user.id });
  if (!result.ok) return { status: "error", message: result.error, retryable: true };
  refresh();
  return { status: "success", message: "Résumé régénéré.", summaryStatus: "READY" };
}
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
