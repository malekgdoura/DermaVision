"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";

import { routes } from "@/content/home";
import { auth } from "@/server/auth/auth";

import { recommendationSchema } from "./schemas";
import { addRecommendation, archiveRecommendation, editRecommendation } from "./service";

// Server Actions of the recommendation library. The doctor always comes from the session;
// the recommendation id is bound on the server (`action.bind(null, id)`).

export type RecommendationFormState =
  | { status: "idle" }
  | { status: "error"; message: string; fields?: Record<string, string>; values?: Record<string, string | string[]> };

export async function createRecommendationAction(
  _state: RecommendationFormState,
  formData: FormData,
): Promise<RecommendationFormState> {
  const doctor = await requireDoctor();
  if (!doctor) return { status: "error", message: "Only doctors can manage recommendations." };

  const parsed = recommendationSchema.safeParse(readForm(formData));
  if (!parsed.success) return invalid(parsed.error.issues, formData);

  await addRecommendation(doctor, parsed.data);
  redirect(`${routes.recommendations}?saved=created`);
}

export async function updateRecommendationAction(
  id: string,
  _state: RecommendationFormState,
  formData: FormData,
): Promise<RecommendationFormState> {
  const doctor = await requireDoctor();
  if (!doctor) return { status: "error", message: "Only doctors can manage recommendations." };

  const parsed = recommendationSchema.safeParse(readForm(formData));
  if (!parsed.success) return invalid(parsed.error.issues, formData);

  const result = await editRecommendation(doctor, id, parsed.data);
  if (!result.ok) return { status: "error", message: result.error.message };
  redirect(`${routes.recommendations}?saved=updated`);
}

// Archive or restore from the list. A refused request (not the author) changes nothing.
export async function setArchivedAction(id: string, archived: boolean) {
  const doctor = await requireDoctor();
  if (!doctor) return;
  await archiveRecommendation(doctor, id, archived);
  refresh();
}

async function requireDoctor(): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "MEDECIN") return null;
  return session.user.id;
}

function readForm(formData: FormData) {
  return {
    title: formData.get("title") ?? "",
    content: formData.get("content") ?? "",
    category: formData.get("category"),
    language: formData.get("language"),
    indicatorKeys: formData.getAll("indicatorKeys"),
  };
}

function invalid(issues: { path: PropertyKey[]; message: string }[], formData: FormData): RecommendationFormState {
  const fields: Record<string, string> = {};
  for (const issue of issues) {
    const field = String(issue.path[0] ?? "");
    if (field && !(field in fields)) fields[field] = issue.message;
  }
  // Refill the form after an error.
  const values: Record<string, string | string[]> = {
    title: String(formData.get("title") ?? ""),
    content: String(formData.get("content") ?? ""),
    category: String(formData.get("category") ?? ""),
    language: String(formData.get("language") ?? ""),
    indicatorKeys: formData.getAll("indicatorKeys").map(String),
  };
  return { status: "error", message: "Please check the highlighted fields.", fields, values };
}
