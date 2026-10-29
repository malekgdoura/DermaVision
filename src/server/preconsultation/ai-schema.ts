import {
  allergiesSchema,
  preConsultationSummarySchema,
  type OriginalAnswers,
  type PreConsultationSummary,
} from "./schemas";

export const AI_PRECONSULTATION_DISCLAIMER =
  "Résumé assisté par IA, à vérifier par un médecin. Ce contenu ne constitue pas un diagnostic ni une prescription.";

export function parsePreConsultationSummary(value: unknown, answers: OriginalAnswers):
  | { ok: true; data: PreConsultationSummary }
  | { ok: false; message: string } {
  const parsed = preConsultationSummarySchema.safeParse(value);
  if (!parsed.success) {
    return { ok: false, message: "La réponse de l’assistant ne respecte pas le format attendu." };
  }

  const summary = parsed.data;
  if (
    summary.motif !== answers.motif ||
    summary.attentes !== answers.attentes ||
    summary.habitudesSoin !== answers.habitudesSoin ||
    summary.informationsComplementaires !== answers.informationsComplementaires ||
    JSON.stringify(summary.traitementsDeclares) !== JSON.stringify(answers.traitements) ||
    JSON.stringify(summary.allergiesDeclarees) !== JSON.stringify(answers.allergies)
  ) {
    return {
      ok: false,
      message: "La réponse de l’assistant modifie les informations fournies par le patient.",
    };
  }

  const allergies = allergiesSchema.safeParse(summary.allergiesDeclarees);
  if (!allergies.success) {
    return { ok: false, message: "La réponse de l’assistant contient un statut d’allergies invalide." };
  }

  return {
    ok: true,
    data: { ...summary, disclaimer: AI_PRECONSULTATION_DISCLAIMER },
  };
}
