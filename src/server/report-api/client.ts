import { getGroqConfig, type GroqConfig } from "./config";
import { describeGroqError, describeReportApiError, ReportApiError, type ReportApiErrorKind } from "./errors";
import { groqChatCompletionSchema, groqErrorResponseSchema } from "./schemas";

// Technical client for Groq chat completions: sends messages, returns a validated text answer.
// No business rules here (no database, no permissions).

const CHAT_COMPLETIONS_PATH = "/chat/completions";
const REQUEST_TIMEOUT_MS = 45_000;

export type ChatMessage = { role: "system" | "user"; content: string };

export type ChatCompletionRequest = {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
};

export type ChatCompletionData = {
  content: string;
  model: string;
  // True when the model stopped because of the token limit: the draft may end mid-sentence.
  truncated: boolean;
};

export type ChatCompletionResult =
  | { ok: true; data: ChatCompletionData }
  | { ok: false; error: ReportApiError };

export async function createChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResult> {
  let config: GroqConfig;
  try {
    config = getGroqConfig();
  } catch {
    return failure("configuration");
  }

  let response: Response;
  try {
    response = await fetch(`${config.baseUrl}${CHAT_COMPLETIONS_PATH}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        messages: request.messages,
        temperature: request.temperature ?? 0.3,
        max_completion_tokens: request.maxTokens ?? 1200,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    return failure(isTimeout(error) ? "timeout" : "network");
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch (error) {
    if (isTimeout(error)) return failure("timeout");
    // A non-JSON error page (e.g. a 502 from a proxy) is still a provider error.
    return response.ok ? failure("invalid_response", response.status) : providerFailure(response.status);
  }

  if (!response.ok) {
    const errorBody = groqErrorResponseSchema.safeParse(body);
    return providerFailure(response.status, errorBody.success ? (errorBody.data.error.code ?? undefined) : undefined);
  }

  const parsed = groqChatCompletionSchema.safeParse(body);
  if (!parsed.success) return failure("invalid_response", response.status);

  const choice = parsed.data.choices[0];
  const content = choice.message.content?.trim() ?? "";
  if (!content) return failure("empty_draft", response.status);

  return {
    ok: true,
    data: { content, model: parsed.data.model, truncated: choice.finish_reason === "length" },
  };
}

// AbortSignal.timeout() rejects with a DOMException named "TimeoutError".
function isTimeout(error: unknown): boolean {
  return error instanceof Error && error.name === "TimeoutError";
}

function failure(kind: ReportApiErrorKind, httpStatus?: number): ChatCompletionResult {
  return { ok: false, error: new ReportApiError(describeReportApiError(kind, httpStatus)) };
}

function providerFailure(httpStatus: number, providerCode?: string): ChatCompletionResult {
  return { ok: false, error: new ReportApiError(describeGroqError(httpStatus, providerCode)) };
}
