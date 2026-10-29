// Errors of the Groq (LLM) integration, in one place.
// No UI, no database, no network: only types, an error class and message translation.

export type ReportApiErrorKind =
  | "configuration" // GROQ_* variables missing or wrong, or key refused
  | "model_unavailable" // the configured model does not exist or was decommissioned
  | "rate_limited" // too many requests or tokens for the Groq plan
  | "network" // Groq could not be reached
  | "timeout" // Groq did not answer in time
  | "provider" // Groq answered with an error we do not classify more precisely
  | "invalid_response" // Groq answered something that does not match the schema
  | "empty_draft"; // the model returned no usable text

export type ReportApiErrorDetails = {
  kind: ReportApiErrorKind;
  // Clean message that DermaVision can show. Never contains secrets or raw API text.
  message: string;
  // True when trying again later can work.
  retryable: boolean;
  // Groq error code, e.g. "model_decommissioned" or "rate_limit_exceeded".
  providerCode?: string;
  httpStatus?: number;
};

export class ReportApiError extends Error {
  readonly kind: ReportApiErrorKind;
  readonly retryable: boolean;
  readonly providerCode?: string;
  readonly httpStatus?: number;

  constructor(details: ReportApiErrorDetails) {
    super(details.message);
    this.name = "ReportApiError";
    this.kind = details.kind;
    this.retryable = details.retryable;
    this.providerCode = details.providerCode;
    this.httpStatus = details.httpStatus;
  }
}

const DEFAULT_ERRORS: Record<ReportApiErrorKind, Omit<ReportApiErrorDetails, "kind">> = {
  configuration: {
    message: "The report assistant is not configured correctly (Groq API key).",
    retryable: false,
  },
  model_unavailable: {
    message: "The report assistant model is not available. Check GROQ_MODEL in the server configuration.",
    retryable: false,
  },
  rate_limited: {
    message: "The report assistant is busy. Please wait a moment and try again.",
    retryable: true,
  },
  network: {
    message: "The report assistant cannot be reached right now. Please try again later.",
    retryable: true,
  },
  timeout: {
    message: "The report assistant took too long to answer. Please try again.",
    retryable: true,
  },
  provider: {
    message: "The report assistant returned an error. Please try again later.",
    retryable: true,
  },
  invalid_response: {
    message: "The report assistant returned an unexpected answer.",
    retryable: true,
  },
  empty_draft: {
    message: "The report assistant returned an empty draft. Please try again.",
    retryable: true,
  },
};

// Groq error codes (OpenAI-compatible "error.code") and their DermaVision meaning.
const GROQ_CODES: Record<string, ReportApiErrorKind> = {
  invalid_api_key: "configuration",
  model_not_found: "model_unavailable",
  model_decommissioned: "model_unavailable",
  rate_limit_exceeded: "rate_limited",
};

export function describeReportApiError(kind: ReportApiErrorKind, httpStatus?: number): ReportApiErrorDetails {
  return { kind, ...DEFAULT_ERRORS[kind], httpStatus };
}

// Turns a Groq HTTP error (status + optional error.code) into clean DermaVision error details.
export function describeGroqError(httpStatus: number, providerCode?: string): ReportApiErrorDetails {
  const fromCode = providerCode ? GROQ_CODES[providerCode] : undefined;
  const kind = fromCode ?? kindFromStatus(httpStatus);
  return { kind, ...DEFAULT_ERRORS[kind], providerCode, httpStatus };
}

function kindFromStatus(status: number): ReportApiErrorKind {
  if (status === 401 || status === 403) return "configuration";
  if (status === 404) return "model_unavailable";
  if (status === 429) return "rate_limited";
  return "provider";
}
