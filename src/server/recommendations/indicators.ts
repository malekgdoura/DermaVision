import { analysisResult } from "@/content/analysis";
import { SKIN_INDICATOR_DEFINITIONS, type SkinTypeValue } from "@/server/skin-api";

// The signs a recommendation can be linked to: every Face++ indicator, plus each skin type.
// Pure data: used by the form (options) and by validation (allowed keys).

export const SKIN_TYPE_KEYS: Record<SkinTypeValue, string> = {
  oily: "skin_type:oily",
  dry: "skin_type:dry",
  normal: "skin_type:normal",
  combination: "skin_type:combination",
};

const SKIN_TYPE_NAMES: Record<SkinTypeValue, string> = {
  oily: "Oily skin",
  dry: "Dry skin",
  normal: "Normal skin",
  combination: "Combination skin",
};

export type IndicatorOption = { key: string; label: string; group: string };

export const INDICATOR_OPTIONS: IndicatorOption[] = [
  ...SKIN_INDICATOR_DEFINITIONS.map((definition) => ({
    key: definition.key,
    label: definition.zone ? `${definition.label} · ${analysisResult.zones[definition.zone]}` : definition.label,
    group: analysisResult.categories[definition.category],
  })),
  ...(Object.keys(SKIN_TYPE_KEYS) as SkinTypeValue[]).map((value) => ({
    key: SKIN_TYPE_KEYS[value],
    label: SKIN_TYPE_NAMES[value],
    group: analysisResult.categories["skin-type"],
  })),
];

export const INDICATOR_KEYS: ReadonlySet<string> = new Set(INDICATOR_OPTIONS.map((option) => option.key));

export function indicatorLabel(key: string): string {
  return INDICATOR_OPTIONS.find((option) => option.key === key)?.label ?? key;
}

// Options grouped by category, in display order, for the form.
export function groupedIndicatorOptions() {
  const groups = new Map<string, { key: string; label: string }[]>();
  for (const option of INDICATOR_OPTIONS) {
    const list = groups.get(option.group) ?? [];
    list.push({ key: option.key, label: option.label });
    groups.set(option.group, list);
  }
  return [...groups].map(([group, options]) => ({ group, options }));
}
