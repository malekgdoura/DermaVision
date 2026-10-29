import { z } from "zod";

// Face++ credentials are secrets: this file must only run on the server.
// (The `server-only` package is not installed yet, so we guard at runtime.)
if (typeof window !== "undefined") {
  throw new Error("server/skin-api/config.ts must never be imported in the browser.");
}

const faceppEnvSchema = z.object({
  FACEPP_API_KEY: z.string().trim().min(1, "FACEPP_API_KEY is missing"),
  FACEPP_API_SECRET: z.string().trim().min(1, "FACEPP_API_SECRET is missing"),
  FACEPP_BASE_URL: z.url("FACEPP_BASE_URL must be a valid URL"),
});

export type FaceppConfig = {
  apiKey: string;
  apiSecret: string;
  baseUrl: string;
};

let cachedConfig: FaceppConfig | undefined;

// Read and validate the variables on first use (not at import time),
// so `next build` still works on machines without Face++ keys.
export function getFaceppConfig(): FaceppConfig {
  if (cachedConfig) return cachedConfig;

  const parsed = faceppEnvSchema.safeParse({
    FACEPP_API_KEY: process.env.FACEPP_API_KEY,
    FACEPP_API_SECRET: process.env.FACEPP_API_SECRET,
    FACEPP_BASE_URL: process.env.FACEPP_BASE_URL,
  });

  if (!parsed.success) {
    // Only variable names are reported, never their values.
    const problems = parsed.error.issues.map((issue) => issue.message).join(", ");
    throw new Error(`Face++ configuration is invalid: ${problems}. Check web/.env.`);
  }

  cachedConfig = {
    apiKey: parsed.data.FACEPP_API_KEY,
    apiSecret: parsed.data.FACEPP_API_SECRET,
    baseUrl: parsed.data.FACEPP_BASE_URL.replace(/\/+$/, ""),
  };
  return cachedConfig;
}
