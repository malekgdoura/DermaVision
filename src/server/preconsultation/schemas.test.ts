import { describe, expect, it } from "vitest";

import { allergiesSchema, originalAnswersSchema } from "./schemas";

const base = {
  motif: "Suivi de rougeurs",
  attentes: "Comprendre ce qui peut les déclencher.",
  habitudesSoin: "Nettoyant doux le soir.",
  traitements: [],
  allergies: { status: "NOT_PROVIDED" as const, items: [] },
  informationsComplementaires: "",
};

describe("pre-consultation schemas", () => {
  it("accepts a complete questionnaire", () => {
    const result = originalAnswersSchema.safeParse({
      ...base,
      traitements: [{ nom: "Crème", dosage: "", frequence: "Le soir" }],
      allergies: { status: "KNOWN", items: [{ substance: "Pénicilline", reaction: "Urticaire" }] },
    });

    expect(result.success).toBe(true);
  });

  it.each(["KNOWN", "NONE_KNOWN", "UNKNOWN", "NOT_PROVIDED"] as const)("supports allergy status %s", (status) => {
    const result = allergiesSchema.safeParse({
      status,
      items: status === "KNOWN" ? [{ substance: "Pollen", reaction: "Éternuements" }] : [],
    });

    expect(result.success).toBe(true);
  });

  it("rejects a known allergy status without an item", () => {
    const result = allergiesSchema.safeParse({ status: "KNOWN", items: [] });

    expect(result.success).toBe(false);
  });

  it("rejects whitespace-only required answers", () => {
    const result = originalAnswersSchema.safeParse({ ...base, motif: "   " });

    expect(result.success).toBe(false);
  });

  it("does not accept allergy items for a non-known status", () => {
    const result = allergiesSchema.safeParse({
      status: "UNKNOWN",
      items: [{ substance: "Pollen", reaction: "Inconnue" }],
    });

    expect(result.success).toBe(false);
  });
});
