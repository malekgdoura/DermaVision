import { createChatCompletion } from "@/server/report-api/client";

import { getPatientAppointment } from "@/server/appointments/service";
import { parsePreConsultationSummary } from "./ai-schema";
import { buildPreConsultationMessages } from "./prompt";
import { markSummaryGenerating, saveSummary, saveSummaryFailure, submitPreConsultation as persistSubmittedPreConsultation, upsertDraft } from "./repository";
import {
  calculateCompletionPercentage,
  draftAnswersSchema,
  originalAnswersSchema,
  type OriginalAnswers,
  type PreConsultationSummary,
} from "./schemas";
import type { Prisma } from "@/generated/prisma/client";

export type SummaryStatus = "NOT_STARTED" | "GENERATING" | "READY" | "FAILED";

export type SummaryResult =
  | {
      ok: true;
      data: {
        originalAnswers: OriginalAnswers;
        summary: PreConsultationSummary;
        status: "READY";
        provider: "groq";
        model: string;
        generatedAt: Date;
      };
    }
  | {
      ok: false;
      data: {
        originalAnswers: OriginalAnswers | null;
        summary: null;
        status: "FAILED";
        provider: "groq";
        model: string | null;
        generatedAt: null;
        error: string;
        retryable: boolean;
      };
    };

export async function generatePreConsultationSummary(input: unknown): Promise<SummaryResult> {
  const parsedAnswers = originalAnswersSchema.safeParse(input);
  if (!parsedAnswers.success) {
    return {
      ok: false,
      data: {
        originalAnswers: null,
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

  const originalAnswers = parsedAnswers.data;
  const completion = await createChatCompletion({
    messages: buildPreConsultationMessages(originalAnswers),
    temperature: 0.1,
    maxTokens: 1400,
  });

  if (!completion.ok) {
    return {
      ok: false,
      data: {
        originalAnswers,
        summary: null,
        status: "FAILED",
        provider: "groq",
        model: null,
        generatedAt: null,
        error: completion.error.message,
        retryable: completion.error.retryable,
      },
    };
  }

  const raw = parseJson(completion.data.content);
  const summary = parsePreConsultationSummary(raw, originalAnswers);
  if (!summary.ok) {
    return {
      ok: false,
      data: {
        originalAnswers,
        summary: null,
        status: "FAILED",
        provider: "groq",
        model: completion.data.model,
        generatedAt: null,
        error: summary.message,
        retryable: true,
      },
    };
  }

  return {
    ok: true,
    data: {
      originalAnswers,
      summary: summary.data,
      status: "READY",
      provider: "groq",
      model: completion.data.model,
      generatedAt: new Date(),
    },
  };
}

export async function savePreConsultationDraft(input: {
  appointmentId: string;
  patientId: string;
  answers: unknown;
}) {
  const parsed = draftAnswersSchema.safeParse(input.answers);
  if (!parsed.success) return { ok: false as const, error: "Les réponses de brouillon sont invalides." };

  const appointment = await getPatientAppointment(input.appointmentId, input.patientId);
  if (!appointment || appointment.status === "CANCELLED") return { ok: false as const, error: "Ce rendez-vous n’est pas accessible." };

  const record = await upsertDraft({
    appointmentId: input.appointmentId,
    patientId: input.patientId,
    answers: parsed.data as Prisma.InputJsonValue,
    completionPercentage: calculateCompletionPercentage(parsed.data),
  });
  return { ok: true as const, data: { id: record.id, completionPercentage: record.completionPercentage } };
}

export async function submitPreConsultation(input: {
  appointmentId: string;
  patientId: string;
  answers: unknown;
}) {
  const parsed = originalAnswersSchema.safeParse(input.answers);
  if (!parsed.success) return { ok: false as const, error: "Les réponses de pré-consultation sont invalides." };

  const appointment = await getPatientAppointment(input.appointmentId, input.patientId);
  if (!appointment || appointment.status === "CANCELLED") return { ok: false as const, error: "Ce rendez-vous n’est pas accessible." };

  const record = await persistSubmittedPreConsultation(input.appointmentId, input.patientId, parsed.data as Prisma.InputJsonValue);
  const summary = await generateAndSaveSummary(record.id, parsed.data);
  return summary.ok
    ? { ok: true as const, data: { summaryStatus: "READY" as const } }
    : { ok: false as const, error: summary.error, data: { summaryStatus: "FAILED" as const } };
}

export async function retryPreConsultationSummary(input: { appointmentId: string; patientId: string }) {
  const appointment = await getPatientAppointment(input.appointmentId, input.patientId);
  if (!appointment?.preConsultation || appointment.preConsultation.status !== "SUBMITTED") {
    return { ok: false as const, error: "Aucune pré-consultation soumise ne peut être régénérée." };
  }

  const parsed = originalAnswersSchema.safeParse(appointment.preConsultation.answers);
  if (!parsed.success) return { ok: false as const, error: "Les réponses enregistrées sont invalides." };
  const summary = await generateAndSaveSummary(appointment.preConsultation.id, parsed.data);
  return summary.ok ? { ok: true as const } : { ok: false as const, error: summary.error };
}

async function generateAndSaveSummary(recordId: string, answers: OriginalAnswers) {
  await markSummaryGenerating(recordId);
  const result = await generatePreConsultationSummary(answers);
  if (!result.ok) {
    await saveSummaryFailure(recordId, result.data.error);
    return { ok: false as const, error: result.data.error };
  }

  await saveSummary({
    id: recordId,
    summary: result.data.summary as Prisma.InputJsonValue,
    provider: result.data.provider,
    model: result.data.model,
    generatedAt: result.data.generatedAt,
  });
  return { ok: true as const };
}

function parseJson(content: string): unknown {
  const fenced = content.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const candidate = fenced?.[1] ?? content;
  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
}
