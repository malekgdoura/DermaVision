import { z } from "zod";

export const templateQuestionSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/, "L’identifiant doit utiliser des lettres minuscules, des chiffres ou des tirets."),
  label: z.string().trim().min(1, "La question est obligatoire.").max(500),
  type: z.enum(["SHORT_TEXT", "LONG_TEXT", "YES_NO", "SINGLE_CHOICE", "MULTIPLE_CHOICE"]),
  required: z.boolean(),
  options: z.array(z.string().trim().min(1).max(160)).max(20),
  dependsOn: z.object({ questionId: z.string(), value: z.string().max(160) }).nullable(),
}).superRefine((question, context) => {
  const choice = question.type === "SINGLE_CHOICE" || question.type === "MULTIPLE_CHOICE";
  if (choice && question.options.length < 2) {
    context.addIssue({ code: "custom", path: ["options"], message: "Ajoutez au moins deux options pour une question à choix." });
  }
  if (!choice && question.options.length > 0) {
    context.addIssue({ code: "custom", path: ["options"], message: "Les options ne sont valables que pour une question à choix." });
  }
});

export const questionnaireTemplateSchema = z.object({
  name: z.string().trim().min(1, "Le nom est obligatoire.").max(160),
  description: z.string().trim().max(1000),
  consultationType: z.enum(["IN_CLINIC", "VIDEO"]).nullable(),
  questions: z.array(templateQuestionSchema).min(1, "Ajoutez au moins une question.").max(50),
});

export type TemplateQuestion = z.infer<typeof templateQuestionSchema>;
export type QuestionnaireTemplateInput = z.infer<typeof questionnaireTemplateSchema>;