import { beforeEach, describe, expect, it, vi } from "vitest";

import { createChatCompletion } from "@/server/report-api/client";

import { AI_PRECONSULTATION_DISCLAIMER } from "./ai-schema";
import { generatePreConsultationSummary } from "./service";
import type { OriginalAnswers } from "./schemas";

vi.mock("@/server/report-api/client", () => ({
  createChatCompletion: vi.fn(),
}));

const mockedCompletion = vi.mocked(createChatCompletion);

const answers: OriginalAnswers = {
  motif: "Rougeurs",
  attentes: "Comprendre les causes.",
  habitudesSoin: "Nettoyant doux.",
  traitements: [{ nom: "Crème", dosage: "", frequence: "Le soir" }],
  allergies: { status: "UNKNOWN", items: [] },
  informationsComplementaires: "",
};

function completion(content: string) {
  return {
    ok: true as const,
    data: { content, model: "test-model", truncated: false },
  };
}

function validSummary(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    motif: answers.motif,
    attentes: answers.attentes,
    habitudesSoin: answers.habitudesSoin,
    traitementsDeclares: answers.traitements,
    allergiesDeclarees: answers.allergies,
    informationsComplementaires: answers.informationsComplementaires,
    missingInformation: ["Depuis quand les rougeurs sont-elles présentes ?"],
    disclaimer: AI_PRECONSULTATION_DISCLAIMER,
    ...overrides,
  });
}

beforeEach(() => {
  mockedCompletion.mockReset();
});

describe("generatePreConsultationSummary", () => {
  it("returns a validated summary and preserves original answers", async () => {
    mockedCompletion.mockResolvedValue(completion(validSummary()));

    const result = await generatePreConsultationSummary(answers);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.originalAnswers).toEqual(answers);
      expect(result.data.summary.disclaimer).toBe(AI_PRECONSULTATION_DISCLAIMER);
      expect(result.data.provider).toBe("groq");
      expect(result.data.model).toBe("test-model");
    }
  });

  it("rejects a summary that invents treatment data", async () => {
    mockedCompletion.mockResolvedValue(
      completion(validSummary({ traitementsDeclares: [{ nom: "Inventé", dosage: "", frequence: "" }] })),
    );

    const result = await generatePreConsultationSummary(answers);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.data.status).toBe("FAILED");
      expect(result.data.originalAnswers).toEqual(answers);
      expect(result.data.summary).toBeNull();
    }
  });

  it("preserves answers and exposes a retryable safe error when Groq fails", async () => {
    mockedCompletion.mockResolvedValue({
      ok: false,
      error: {
        name: "ReportApiError",
        message: "Le service est indisponible.",
        kind: "network",
        retryable: true,
      } as never,
    });

    const result = await generatePreConsultationSummary(answers);

    expect(result).toEqual({
      ok: false,
      data: expect.objectContaining({
        originalAnswers: answers,
        summary: null,
        status: "FAILED",
        retryable: true,
        error: "Le service est indisponible.",
      }),
    });
  });

  it("rejects invalid input before calling Groq", async () => {
    const result = await generatePreConsultationSummary({ ...answers, motif: "" });

    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        data: expect.objectContaining({ originalAnswers: null, status: "FAILED" }),
      }),
    );
    expect(mockedCompletion).not.toHaveBeenCalled();
  });
});
