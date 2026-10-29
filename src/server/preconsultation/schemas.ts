import { z } from "zod";

const requiredText = (label: string, max: number) =>
  z
    .string({ error: `${label} est obligatoire.` })
    .max(max, `${label} doit contenir ${max} caractères ou moins.`)
    .refine((value) => value.trim().length > 0, `${label} est obligatoire.`);

const optionalText = (label: string, max: number) =>
  z.string({ error: `${label} doit être du texte.` }).max(max, `${label} doit contenir ${max} caractères ou moins.`);

export const allergyStatusSchema = z.enum(["KNOWN", "NONE_KNOWN", "UNKNOWN", "NOT_PROVIDED"]);

export const treatmentSchema = z.object({
  nom: requiredText("Le nom du traitement", 160),
  dosage: optionalText("Le dosage", 120),
  frequence: optionalText("La fréquence", 120),
});

export const allergyItemSchema = z.object({
  substance: requiredText("La substance allergène", 160),
  reaction: requiredText("La réaction", 300),
});

export const allergiesSchema = z
  .object({
    status: allergyStatusSchema,
    items: z.array(allergyItemSchema).max(30, "Vous pouvez déclarer 30 allergies au maximum."),
  })
  .superRefine((value, context) => {
    if (value.status === "KNOWN" && value.items.length === 0) {
      context.addIssue({
        code: "custom",
        path: ["items"],
        message: "Ajoutez au moins une allergie déclarée.",
      });
    }
    if (value.status !== "KNOWN" && value.items.length > 0) {
      context.addIssue({
        code: "custom",
        path: ["items"],
        message: "Les allergies détaillées sont possibles uniquement avec le statut « connu ».",
      });
    }
  });

export const originalAnswersSchema = z.object({
  motif: requiredText("Le motif de consultation", 2000),
  attentes: requiredText("Les attentes et préoccupations", 4000),
  habitudesSoin: requiredText("Les habitudes de soin", 4000),
  traitements: z.array(treatmentSchema).max(30, "Vous pouvez déclarer 30 traitements au maximum."),
  allergies: allergiesSchema,
  informationsComplementaires: optionalText("Les informations complémentaires", 4000),
});

export const preConsultationSummarySchema = z
  .object({
    motif: z.string(),
    attentes: z.string(),
    habitudesSoin: z.string(),
    traitementsDeclares: z.array(treatmentSchema),
    allergiesDeclarees: allergiesSchema,
    informationsComplementaires: z.string(),
    missingInformation: z.array(z.string().max(300)).max(30),
    disclaimer: z.string().min(1),
  })
  .strict();

export type AllergyStatus = z.infer<typeof allergyStatusSchema>;
export type Treatment = z.infer<typeof treatmentSchema>;
export type AllergyItem = z.infer<typeof allergyItemSchema>;
export type OriginalAnswers = z.infer<typeof originalAnswersSchema>;
export type PreConsultationSummary = z.infer<typeof preConsultationSummarySchema>;
