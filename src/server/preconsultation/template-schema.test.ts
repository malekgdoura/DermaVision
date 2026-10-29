import { describe, expect, it } from "vitest";

import { questionnaireTemplateSchema } from "./template-schema";

const question = {
  id: "motif",
  label: "Quel est le motif de votre consultation ?",
  type: "LONG_TEXT" as const,
  required: true,
  options: [],
  dependsOn: null,
};

describe("questionnaire template schema", () => {
  it("accepts controlled question definitions", () => {
    expect(questionnaireTemplateSchema.safeParse({ name: "Peau sensible", description: "", consultationType: null, questions: [question] }).success).toBe(true);
  });

  it("requires options for choice questions", () => {
    expect(questionnaireTemplateSchema.safeParse({
      name: "Choix",
      description: "",
      consultationType: "VIDEO",
      questions: [{ ...question, type: "SINGLE_CHOICE", options: [] }],
    }).success).toBe(false);
  });

  it("rejects unsafe question identifiers", () => {
    expect(questionnaireTemplateSchema.safeParse({ ...{ name: "Test", description: "", consultationType: null }, questions: [{ ...question, id: "question;drop" }] }).success).toBe(false);
  });
});