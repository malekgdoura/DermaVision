"use server";

import { refresh } from "next/cache";

import { auth } from "@/server/auth/auth";

import { createDoctorTemplate, deactivateDoctorTemplate, parseTemplateInput, updateDoctorTemplate } from "./templates";

export type TemplateActionState = { status: "idle" } | { status: "success"; message: string } | { status: "error"; message: string };

export async function saveQuestionnaireTemplateAction(id: string | null, input: unknown): Promise<TemplateActionState> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "MEDECIN") return { status: "error", message: "Seuls les médecins peuvent gérer les questionnaires." };

  const parsed = parseTemplateInput(input);
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Le questionnaire est invalide." };

  if (id) {
    const updated = await updateDoctorTemplate(session.user.id, id, parsed.data);
    if (!updated) return { status: "error", message: "Ce questionnaire n’est pas accessible." };
  } else {
    await createDoctorTemplate(session.user.id, parsed.data);
  }
  refresh();
  return { status: "success", message: id ? "Questionnaire mis à jour." : "Questionnaire créé." };
}

export async function deactivateQuestionnaireTemplateAction(id: string): Promise<TemplateActionState> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "MEDECIN") return { status: "error", message: "Seuls les médecins peuvent gérer les questionnaires." };
  const changed = await deactivateDoctorTemplate(session.user.id, id);
  if (!changed) return { status: "error", message: "Ce questionnaire n’est pas accessible." };
  refresh();
  return { status: "success", message: "Questionnaire désactivé." };
}