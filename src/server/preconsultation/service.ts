import { createChatCompletion } from "@/server/report-api/client";

import { parsePreConsultationSummary } from "./ai-schema";
import { buildPreConsultationMessages } from "./prompt";
import { originalAnswersSchema, type OriginalAnswers, type PreConsultationSummary } from "./schemas";

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

function parseJson(content: string): unknown {
  const fenced = content.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const candidate = fenced?.[1] ?? content;
  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
}
