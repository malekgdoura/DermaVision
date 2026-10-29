import { z } from "zod";

// The Groq key is a secret: this file must only run on the server.
if (typeof window !== "undefined") {
  throw new Error("server/report-api/config.ts must never be imported in the browser.");
}

export const DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile";
export const DEFAULT_GROQ_BASE_URL = "https://api.groq.com/openai/v1";

const groqEnvSchema = z.object({
  GROQ_API_KEY: z.string().trim().min(1, "GROQ_API_KEY is missing"),
  GROQ_MODEL: z.string().trim().min(1).default(DEFAULT_GROQ_MODEL),
  GROQ_BASE_URL: z.url("GROQ_BASE_URL must be a valid URL").default(DEFAULT_GROQ_BASE_URL),
});

export type GroqConfig = {
  apiKey: string;
  model: string;
  baseUrl: string;
};

let cachedConfig: GroqConfig | undefined;

// Read and validate the variables on first use (not at import time),
// so `next build` still works on machines without a Groq key.
export function getGroqConfig(): GroqConfig {
  if (cachedConfig) return cachedConfig;

  const parsed = groqEnvSchema.safeParse({
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    // Empty strings in .env mean "not set": fall back to the defaults.
    GROQ_MODEL: process.env.GROQ_MODEL || undefined,
    GROQ_BASE_URL: process.env.GROQ_BASE_URL || undefined,
  });

  if (!parsed.success) {
    // Only variable names are reported, never their values.
    const problems = parsed.error.issues.map((issue) => issue.message).join(", ");
    throw new Error(`Groq configuration is invalid: ${problems}. Check .env.`);
  }

  cachedConfig = {
    apiKey: parsed.data.GROQ_API_KEY,
    model: parsed.data.GROQ_MODEL,
    baseUrl: parsed.data.GROQ_BASE_URL.replace(/\/+$/, ""),
  };
  return cachedConfig;
}

// Tests change the environment between cases.
export function resetGroqConfigCache() {
  cachedConfig = undefined;
}
