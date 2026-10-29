import { z } from "zod";

// Zod schemas for the Face++ Skin Analyze response (POST /facepp/v1/skinanalyze).
// Reference: https://console.faceplusplus.com/documents/129100210
// Unknown fields (e.g. "image_reset") are ignored rather than rejected.

// Face++ returns indicator values sometimes as "0" (string) and sometimes as 0 (number).
// Both are accepted and converted to a number.
const numericValue = z
  .union([z.number(), z.string().regex(/^\d+$/)])
  .transform((value) => Number(value));

const confidence = z.number().min(0).max(1);

// Standard indicator: value 0 = absent, 1 = present.
export const faceppIndicatorSchema = z.object({
  value: numericValue.pipe(z.union([z.literal(0), z.literal(1)])),
  confidence,
});

// Eyelids: 0 = single-fold, 1 = parallel double-fold, 2 = fan-shaped double-fold.
export const faceppEyelidsSchema = z.object({
  value: numericValue.pipe(z.union([z.literal(0), z.literal(1), z.literal(2)])),
  confidence,
});

// Skin type: 0 = oily, 1 = dry, 2 = normal, 3 = mixed.
// "details" gives one value/confidence pair per skin type.
export const faceppSkinTypeSchema = z.object({
  skin_type: numericValue.pipe(z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)])),
  details: z.object({
    "0": faceppIndicatorSchema,
    "1": faceppIndicatorSchema,
    "2": faceppIndicatorSchema,
    "3": faceppIndicatorSchema,
  }),
});

export const faceppFaceRectangleSchema = z.object({
  top: z.number().int(),
  left: z.number().int(),
  width: z.number().int(),
  height: z.number().int(),
});

export const faceppSkinResultSchema = z.object({
  // Eyes
  left_eyelids: faceppEyelidsSchema,
  right_eyelids: faceppEyelidsSchema,
  eye_pouch: faceppIndicatorSchema,
  dark_circle: faceppIndicatorSchema,

  // Wrinkles
  forehead_wrinkle: faceppIndicatorSchema,
  crows_feet: faceppIndicatorSchema,
  eye_finelines: faceppIndicatorSchema,
  glabella_wrinkle: faceppIndicatorSchema,
  nasolabial_fold: faceppIndicatorSchema,

  // Skin type
  skin_type: faceppSkinTypeSchema,

  // Pores
  pores_forehead: faceppIndicatorSchema,
  pores_left_cheek: faceppIndicatorSchema,
  pores_right_cheek: faceppIndicatorSchema,
  pores_jaw: faceppIndicatorSchema,

  // Blemishes
  blackhead: faceppIndicatorSchema,
  acne: faceppIndicatorSchema,
  mole: faceppIndicatorSchema,
  skin_spot: faceppIndicatorSchema,
});

// Successful response.
export const faceppSkinAnalyzeResponseSchema = z.object({
  request_id: z.string().min(1),
  time_used: z.number().int().nonnegative(),
  face_rectangle: faceppFaceRectangleSchema,
  // Interference factors, e.g. ["improper_headpose"]; empty when there are none.
  warning: z.array(z.string()).default([]),
  result: faceppSkinResultSchema,
});

// Failed response: Face++ only sends error_message (and usually request_id / time_used).
export const faceppErrorResponseSchema = z.object({
  request_id: z.string().optional(),
  time_used: z.number().optional(),
  error_message: z.string().min(1),
});

export type FaceppIndicator = z.infer<typeof faceppIndicatorSchema>;
export type FaceppEyelids = z.infer<typeof faceppEyelidsSchema>;
export type FaceppSkinType = z.infer<typeof faceppSkinTypeSchema>;
export type FaceppFaceRectangle = z.infer<typeof faceppFaceRectangleSchema>;
export type FaceppSkinResult = z.infer<typeof faceppSkinResultSchema>;
export type FaceppSkinAnalyzeResponse = z.infer<typeof faceppSkinAnalyzeResponseSchema>;
export type FaceppErrorResponse = z.infer<typeof faceppErrorResponseSchema>;
