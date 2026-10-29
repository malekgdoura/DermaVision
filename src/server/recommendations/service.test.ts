import { beforeEach, describe, expect, it, vi } from "vitest";

import { applyCorrections } from "@/server/review/corrections";
import { aiResultFixture } from "@/test/fixtures";

import * as repository from "./repository";
import {
  archiveRecommendation,
  editRecommendation,
  getRecommendationForAuthor,
  getRecommendationSuggestions,
  getRecommendationsForDraft,
} from "./service";

vi.mock("./repository");
const repo = vi.mocked(repository);

const AUTHOR = "doctor-1";
const OTHER = "doctor-2";

const input = {
  title: "Gentle cleansing",
  content: "Wash your face morning and evening with a mild cleanser.",
  category: "inflammation" as const,
  language: "en" as const,
  indicatorKeys: ["acne"],
};

function stored(authorId = AUTHOR) {
  return { id: "reco-1", authorId, archivedAt: null, ...input } as unknown as NonNullable<
    Awaited<ReturnType<typeof repository.findRecommendationById>>
  >;
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("author rules", () => {
  it("lets the author edit and archive", async () => {
    repo.findRecommendationById.mockResolvedValue(stored());

    expect(await editRecommendation(AUTHOR, "reco-1", input)).toEqual({ ok: true, data: undefined });
    expect(await archiveRecommendation(AUTHOR, "reco-1", true)).toEqual({ ok: true, data: undefined });
    expect(repo.updateRecommendation).toHaveBeenCalledWith("reco-1", input);
    expect(repo.setRecommendationArchived).toHaveBeenCalledWith("reco-1", true);
  });

  it("refuses another doctor and changes nothing", async () => {
    repo.findRecommendationById.mockResolvedValue(stored(OTHER));

    const edit = await editRecommendation(AUTHOR, "reco-1", input);
    const archive = await archiveRecommendation(AUTHOR, "reco-1", true);

    expect(!edit.ok && edit.error.kind).toBe("not_author");
    expect(!archive.ok && archive.error.kind).toBe("not_author");
    expect(repo.updateRecommendation).not.toHaveBeenCalled();
    expect(repo.setRecommendationArchived).not.toHaveBeenCalled();
  });

  it("reports a missing recommendation", async () => {
    repo.findRecommendationById.mockResolvedValue(null);
    const result = await editRecommendation(AUTHOR, "missing", input);
    expect(!result.ok && result.error.kind).toBe("not_found");
  });

  it("hides another doctor's recommendation from the edit page", async () => {
    repo.findRecommendationById.mockResolvedValue(stored(OTHER));
    expect(await getRecommendationForAuthor(AUTHOR, "reco-1")).toBeNull();
  });
});

describe("use in reports", () => {
  it("suggests recommendations matching the validated signs", async () => {
    repo.findActiveRecommendations.mockResolvedValue([
      { id: "a", title: "Acne", content: "x", category: "inflammation", indicatorKeys: ["acne"], language: "en" },
      { id: "b", title: "Eyes", content: "y", category: "eye-area", indicatorKeys: ["dark_circle"], language: "en" },
    ]);
    const result = applyCorrections(aiResultFixture(), { detectedKeys: new Set(["acne"]), skinType: "oily" });

    const { suggested, others } = await getRecommendationSuggestions(result);

    expect(suggested.map((item) => item.id)).toEqual(["a"]);
    expect(others.map((item) => item.id)).toEqual(["b"]);
  });

  it("does not query the database when nothing is ticked", async () => {
    expect(await getRecommendationsForDraft([])).toEqual([]);
    expect(repo.findActiveRecommendationsByIds).not.toHaveBeenCalled();
  });
});
