import type { FaceppIndicator, FaceppSkinAnalyzeResponse, FaceppSkinResult } from "./schemas";

// Turns a validated Face++ Skin Analyze response into the simpler DermaVision format.
// Pure transformation: no severity is invented, Face++ values and confidences are kept as is.

export type SkinIndicatorCategory =
  | "inflammation"
  | "pigmentation"
  | "texture"
  | "wrinkles"
  | "eye-area"
  | "skin-type";

export type SkinZone =
  | "forehead"
  | "left-cheek"
  | "right-cheek"
  | "jaw"
  | "eyes"
  | "between-brows"
  | "nose-to-mouth";

export type SkinTypeValue = "oily" | "dry" | "normal" | "combination";

export type SkinIndicator = {
  key: string;
  label: string;
  category: SkinIndicatorCategory;
  detected: boolean;
  confidence: number;
  zone?: SkinZone;
};

export type SkinTypeIndicator = SkinIndicator & {
  key: "skin_type";
  category: "skin-type";
  value: SkinTypeValue;
  // Face++ confidence for each skin type, kept for the doctor's review.
  confidenceByType: Record<SkinTypeValue, number>;
};

export type DermaVisionSkinAnalysis = {
  requestId: string;
  warnings: string[];
  indicators: SkinIndicator[];
  skinType: SkinTypeIndicator;
};

type BinaryIndicatorKey = Exclude<keyof FaceppSkinResult, "skin_type" | "left_eyelids" | "right_eyelids">;

type BinaryIndicatorDefinition = {
  key: BinaryIndicatorKey;
  label: string;
  category: Exclude<SkinIndicatorCategory, "skin-type">;
  zone?: SkinZone;
};

// Display order of the indicators. Eyelid shape is not mapped: it is anatomy, not a skin concern.
const BINARY_INDICATORS: BinaryIndicatorDefinition[] = [
  { key: "acne", label: "Acne", category: "inflammation" },

  { key: "skin_spot", label: "Skin spots", category: "pigmentation" },
  { key: "mole", label: "Moles", category: "pigmentation" },

  { key: "blackhead", label: "Blackheads", category: "texture" },
  { key: "pores_forehead", label: "Enlarged pores", category: "texture", zone: "forehead" },
  { key: "pores_left_cheek", label: "Enlarged pores", category: "texture", zone: "left-cheek" },
  { key: "pores_right_cheek", label: "Enlarged pores", category: "texture", zone: "right-cheek" },
  { key: "pores_jaw", label: "Enlarged pores", category: "texture", zone: "jaw" },

  { key: "forehead_wrinkle", label: "Forehead lines", category: "wrinkles", zone: "forehead" },
  { key: "glabella_wrinkle", label: "Frown lines", category: "wrinkles", zone: "between-brows" },
  { key: "crows_feet", label: "Crow's feet", category: "wrinkles", zone: "eyes" },
  { key: "eye_finelines", label: "Fine lines under the eyes", category: "wrinkles", zone: "eyes" },
  { key: "nasolabial_fold", label: "Nasolabial folds", category: "wrinkles", zone: "nose-to-mouth" },

  { key: "eye_pouch", label: "Under-eye bags", category: "eye-area", zone: "eyes" },
  { key: "dark_circle", label: "Dark circles", category: "eye-area", zone: "eyes" },
];

// Face++ skin_type codes: 0 = oily, 1 = dry, 2 = normal, 3 = mixed (combination).
const SKIN_TYPES: Record<0 | 1 | 2 | 3, { value: SkinTypeValue; label: string }> = {
  0: { value: "oily", label: "Oily skin" },
  1: { value: "dry", label: "Dry skin" },
  2: { value: "normal", label: "Normal skin" },
  3: { value: "combination", label: "Combination skin" },
};

export function mapSkinAnalysis(response: FaceppSkinAnalyzeResponse): DermaVisionSkinAnalysis {
  const { result } = response;

  return {
    requestId: response.request_id,
    warnings: response.warning,
    indicators: BINARY_INDICATORS.map((definition) =>
      mapBinaryIndicator(definition, result[definition.key]),
    ),
    skinType: mapSkinType(result.skin_type),
  };
}

// Read-only list of the signs DermaVision maps, for screens that let a doctor pick signs.
export const SKIN_INDICATOR_DEFINITIONS: readonly Readonly<BinaryIndicatorDefinition>[] = BINARY_INDICATORS;

function mapBinaryIndicator(
  definition: BinaryIndicatorDefinition,
  indicator: FaceppIndicator,
): SkinIndicator {
  return {
    key: definition.key,
    label: definition.label,
    category: definition.category,
    detected: indicator.value === 1,
    confidence: indicator.confidence,
    ...(definition.zone && { zone: definition.zone }),
  };
}

function mapSkinType(skinType: FaceppSkinResult["skin_type"]): SkinTypeIndicator {
  // The type comes from skin_type.skin_type only. The "value" fields inside details
  // are not reliable (they can all be 0), so only their confidences are kept.
  const { value, label } = SKIN_TYPES[skinType.skin_type];
  const { details } = skinType;

  return {
    key: "skin_type",
    label,
    category: "skin-type",
    detected: true,
    confidence: details[String(skinType.skin_type) as keyof typeof details].confidence,
    value,
    confidenceByType: {
      oily: details["0"].confidence,
      dry: details["1"].confidence,
      normal: details["2"].confidence,
      combination: details["3"].confidence,
    },
  };
}
