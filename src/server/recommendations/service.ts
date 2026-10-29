import type { ReviewedSkinAnalysis } from "@/server/review/corrections";

import { matchRecommendations, presentKeys } from "./matching";
import {
  createRecommendation,
  findActiveRecommendations,
  findActiveRecommendationsByIds,
  findRecommendationById,
  findRecommendations,
  setRecommendationArchived,
  updateRecommendation,
  type RecommendationFilters,
} from "./repository";
import type { RecommendationInput } from "./schemas";

// Rules of the recommendation library: every doctor reads and uses the whole library,
// only the author changes or archives a recommendation. Nothing is ever deleted.

export type RecommendationErrorKind = "not_found" | "not_author";
export type RecommendationResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: { kind: RecommendationErrorKind; message: string } };

const MESSAGES: Record<RecommendationErrorKind, string> = {
  not_found: "This recommendation could not be found.",
  not_author: "Only the doctor who wrote this recommendation can change it.",
};

function fail<T>(kind: RecommendationErrorKind): RecommendationResult<T> {
  return { ok: false, error: { kind, message: MESSAGES[kind] } };
}

export function listRecommendations(filters: RecommendationFilters) {
  return findRecommendations(filters);
}

export type RecommendationListItem = Awaited<ReturnType<typeof listRecommendations>>[number];

// For the edit page: null when missing or written by another doctor.
export async function getRecommendationForAuthor(doctorId: string, id: string) {
  const recommendation = await findRecommendationById(id);
  if (!recommendation || recommendation.authorId !== doctorId) return null;
  return recommendation;
}

export async function addRecommendation(
  doctorId: string,
  input: RecommendationInput,
): Promise<RecommendationResult<{ id: string }>> {
  const created = await createRecommendation(doctorId, input);
  return { ok: true, data: { id: created.id } };
}

export async function editRecommendation(
  doctorId: string,
  id: string,
  input: RecommendationInput,
): Promise<RecommendationResult> {
  const blocked = await checkAuthor(doctorId, id);
  if (blocked) return fail(blocked);
  await updateRecommendation(id, input);
  return { ok: true, data: undefined };
}

// Archive (archived = true) or restore (false). A published report may quote it, so it is never deleted.
export async function archiveRecommendation(
  doctorId: string,
  id: string,
  archived: boolean,
): Promise<RecommendationResult> {
  const blocked = await checkAuthor(doctorId, id);
  if (blocked) return fail(blocked);
  await setRecommendationArchived(id, archived);
  return { ok: true, data: undefined };
}

// Suggestions for the review screen: what matches the validated signs first, then the rest.
export async function getRecommendationSuggestions(result: ReviewedSkinAnalysis | null) {
  const all = await findActiveRecommendations();
  if (!result) return { suggested: [], others: all };
  return matchRecommendations(all, presentKeys(result));
}

export type RecommendationSuggestions = Awaited<ReturnType<typeof getRecommendationSuggestions>>;

// The recommendations ticked for a draft. Archived or unknown ids are dropped.
export async function getRecommendationsForDraft(ids: string[]) {
  if (ids.length === 0) return [];
  return findActiveRecommendationsByIds(ids);
}

async function checkAuthor(doctorId: string, id: string): Promise<RecommendationErrorKind | null> {
  const recommendation = await findRecommendationById(id);
  if (!recommendation) return "not_found";
  if (recommendation.authorId !== doctorId) return "not_author";
  return null;
}
