import { z } from "zod";

import { INDICATOR_KEYS } from "./indicators";

// Validation of the recommendation form. FormData values are strings; checkboxes are repeated keys.

export const RECOMMENDATION_CATEGORIES = [
  "general",
  "inflammation",
  "pigmentation",
  "texture",
  "wrinkles",
  "eye-area",
  "skin-type",
] as const;

export type RecommendationCategory = (typeof RECOMMENDATION_CATEGORIES)[number];

// Browsers submit textarea line breaks as "\r\n": store "\n" only.
const text = z.string().transform((value) => value.replace(/\r\n?/g, "\n").trim());

export const recommendationSchema = z.object({
  title: text.pipe(
    z.string().min(3, "The title must be at least 3 characters.").max(80, "The title must be 80 characters or less."),
  ),
  content: text.pipe(
    z
      .string()
      .min(20, "The advice must be at least 20 characters.")
      .max(1000, "The advice must be 1000 characters or less."),
  ),
  category: z.enum(RECOMMENDATION_CATEGORIES, { error: "Choose a category." }),
  language: z.enum(["en", "fr"], { error: "Choose a language." }),
  indicatorKeys: z
    .array(z.string().refine((key) => INDICATOR_KEYS.has(key), "Unknown sign."))
    .max(20)
    .transform((keys) => [...new Set(keys)]),
});

export type RecommendationInput = z.infer<typeof recommendationSchema>;

// Ids of the recommendations the doctor ticks when asking for a draft.
export const recommendationIdsSchema = z.array(z.string().regex(/^[a-z0-9]{10,40}$/)).max(20);
