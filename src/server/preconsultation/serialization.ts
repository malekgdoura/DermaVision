import {
  originalAnswersSchema,
  preConsultationSummarySchema,
  type OriginalAnswers,
  type PreConsultationSummary,
} from "./schemas";

export const emptyOriginalAnswers: OriginalAnswers = {
  motif: "",
  attentes: "",
  habitudesSoin: "",
  traitements: [],
  allergies: { status: "NOT_PROVIDED", items: [] },
  informationsComplementaires: "",
};

export function readOriginalAnswers(value: unknown): OriginalAnswers {
  const parsed = originalAnswersSchema.safeParse(value);
  if (parsed.success) return parsed.data;

  if (!value || typeof value !== "object") return emptyOriginalAnswers;
  const source = value as Record<string, unknown>;
  return {
    ...emptyOriginalAnswers,
    motif: typeof source.motif === "string" ? source.motif : "",
    attentes: typeof source.attentes === "string" ? source.attentes : "",
    habitudesSoin: typeof source.habitudesSoin === "string" ? source.habitudesSoin : "",
    traitements: Array.isArray(source.traitements) ? source.traitements.filter(isTreatment) : [],
    allergies: isAllergies(source.allergies) ? source.allergies : emptyOriginalAnswers.allergies,
    informationsComplementaires: typeof source.informationsComplementaires === "string" ? source.informationsComplementaires : "",
  };
}

export function readSummary(value: unknown): PreConsultationSummary | null {
  const parsed = preConsultationSummarySchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

function isTreatment(value: unknown): value is OriginalAnswers["traitements"][number] {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return typeof item.nom === "string" && typeof item.dosage === "string" && typeof item.frequence === "string";
}

function isAllergies(value: unknown): value is OriginalAnswers["allergies"] {
  return originalAnswersSchema.shape.allergies.safeParse(value).success;
}