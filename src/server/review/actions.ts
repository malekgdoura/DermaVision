"use server";

import { refresh } from "next/cache";
import type { z } from "zod";

import { auth } from "@/server/auth/auth";

import { correctionsSchema, draftRequestSchema, publishSchema, reportContentSchema } from "./schemas";
import { generateDraft, publish, saveDraft, validateIndicators, type ReviewResult } from "./service";

// Server Actions of the doctor's review screen. The doctor always comes from the session,
// never from the client; the analysis id is bound on the server (`action.bind(null, id)`).

// Plain, serializable state for useActionState.
export type ReviewActionState =
  | { status: "idle" }
  | { status: "success"; message: string; notice?: string }
  | { status: "error"; message: string; retryable: boolean; fields?: Record<string, string> };

export async function validateIndicatorsAction(
  analysisId: string,
  _state: ReviewActionState,
  formData: FormData,
): Promise<ReviewActionState> {
  const doctor = await requireDoctor();
  if (!doctor.ok) return doctor.state;

  const parsed = correctionsSchema.safeParse({
    skinType: formData.get("skinType"),
    detected: formData.getAll("detected"),
    clinicalNotes: formData.get("clinicalNotes") ?? "",
  });
  if (!parsed.success) return invalid(parsed.error);

  return finish(await validateIndicators(doctor.id, analysisId, parsed.data), "Indicators validated.");
}

export async function generateDraftAction(
  analysisId: string,
  _state: ReviewActionState,
  formData: FormData,
): Promise<ReviewActionState> {
  const doctor = await requireDoctor();
  if (!doctor.ok) return doctor.state;

  const parsed = draftRequestSchema.safeParse({
    style: formData.get("style"),
    language: formData.get("language"),
    recommendationIds: formData.getAll("recommendationIds"),
  });
  if (!parsed.success) return invalid(parsed.error);

  const result = await generateDraft(doctor.id, analysisId, parsed.data);
  return finish(
    result,
    "New AI draft ready. Read it carefully and edit it before publishing.",
    result.ok && result.data.truncated ? "The draft was cut by the length limit: complete the end yourself." : undefined,
  );
}

export async function saveDraftAction(
  analysisId: string,
  _state: ReviewActionState,
  formData: FormData,
): Promise<ReviewActionState> {
  const doctor = await requireDoctor();
  if (!doctor.ok) return doctor.state;

  const parsed = reportContentSchema.safeParse(readReportForm(formData));
  if (!parsed.success) return invalid(parsed.error);

  const result = await saveDraft(doctor.id, analysisId, parsed.data);
  return finish(result, result.ok && !result.data.created ? "No change since the last version." : "Version saved.");
}

export async function publishReportAction(
  analysisId: string,
  _state: ReviewActionState,
  formData: FormData,
): Promise<ReviewActionState> {
  const doctor = await requireDoctor();
  if (!doctor.ok) return doctor.state;

  const parsed = publishSchema.safeParse({
    ...readReportForm(formData),
    confirmed: formData.get("confirmed") === "on",
  });
  if (!parsed.success) return invalid(parsed.error);

  return finish(await publish(doctor.id, analysisId, parsed.data), "Report published. The patient can now read it.");
}

// ---------- Helpers ----------

async function requireDoctor(): Promise<{ ok: true; id: string } | { ok: false; state: ReviewActionState }> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, state: error("Please sign in again.") };
  if (session.user.role !== "MEDECIN") return { ok: false, state: error("Only doctors can review analyses.") };
  return { ok: true, id: session.user.id };
}

function readReportForm(formData: FormData) {
  return {
    style: formData.get("style"),
    language: formData.get("language"),
    content: formData.get("content") ?? "",
  };
}

function finish<T>(result: ReviewResult<T>, message: string, notice?: string): ReviewActionState {
  if (!result.ok) return { status: "error", message: result.error.message, retryable: result.error.retryable };
  // Re-render the server components of the page with the new data.
  refresh();
  return { status: "success", message, notice };
}

function invalid(zodError: z.ZodError): ReviewActionState {
  const fields: Record<string, string> = {};
  for (const issue of zodError.issues) {
    const field = String(issue.path[0] ?? "");
    if (field && !(field in fields)) fields[field] = issue.message;
  }
  return { status: "error", message: Object.values(fields)[0] ?? "Please check the form.", retryable: false, fields };
}

function error(message: string): ReviewActionState {
  return { status: "error", message, retryable: false };
}
