import { z } from "zod";

import { recommendationIdsSchema } from "@/server/recommendations/schemas";

// Validation of the doctor's forms. FormData values are strings; checkboxes are present or absent.

export const REPORT_MIN_LENGTH = 40;
export const REPORT_MAX_LENGTH = 8000;
export const NOTES_MAX_LENGTH = 2000;

// Browsers submit textarea line breaks as "\r\n": store "\n" only, so versions compare cleanly.
const text = z.string().transform((value) => value.replace(/\r\n?/g, "\n").trim());

export const skinTypeSchema = z.enum(["oily", "dry", "normal", "combination"], {
  error: "Choose a skin type.",
});

export const reportStyleSchema = z.enum(["SHORT", "DETAILED", "PATIENT_FRIENDLY"], {
  error: "Choose a report style.",
});

export const reportLanguageSchema = z.enum(["en", "fr"], { error: "Choose a language." });

export const correctionsSchema = z.object({
  skinType: skinTypeSchema,
  // Keys of indicators the doctor marks as present (checkbox name "detected").
  detected: z.array(z.string().regex(/^[a-z_]+$/)).max(50),
  clinicalNotes: text
    .pipe(z.string().max(NOTES_MAX_LENGTH, `Notes must be ${NOTES_MAX_LENGTH} characters or less.`))
    .transform((value) => value || null),
});

export const draftRequestSchema = z.object({
  style: reportStyleSchema,
  language: reportLanguageSchema,
  // Library recommendations ticked by the doctor (optional).
  recommendationIds: recommendationIdsSchema.default([]),
});

export const reportContentSchema = z.object({
  style: reportStyleSchema,
  language: reportLanguageSchema,
  content: text.pipe(
    z
      .string()
      .min(REPORT_MIN_LENGTH, `The report must be at least ${REPORT_MIN_LENGTH} characters.`)
      .max(REPORT_MAX_LENGTH, `The report must be ${REPORT_MAX_LENGTH} characters or less.`),
  ),
});

export const publishSchema = reportContentSchema.extend({
  confirmed: z.literal(true, { error: "Confirm that you reviewed and take responsibility for this report." }),
});

export type CorrectionsInput = z.infer<typeof correctionsSchema>;
export type DraftRequestInput = z.infer<typeof draftRequestSchema>;
export type ReportContentInput = z.infer<typeof reportContentSchema>;
export type PublishInput = z.infer<typeof publishSchema>;
