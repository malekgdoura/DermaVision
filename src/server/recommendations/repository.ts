import { prisma } from "@/server/db/prisma";

import type { RecommendationInput } from "./schemas";

// Database access for the recommendation library. No permission checks here: see service.ts.

const authorSelect = { id: true, prenom: true, nom: true } as const;

export type RecommendationFilters = {
  query?: string;
  category?: string;
  language?: string;
  archived: boolean;
};

export function findRecommendations(filters: RecommendationFilters) {
  const query = filters.query?.trim();
  return prisma.recommendation.findMany({
    where: {
      archivedAt: filters.archived ? { not: null } : null,
      ...(filters.category ? { category: filters.category } : {}),
      ...(filters.language ? { language: filters.language } : {}),
      ...(query
        ? {
            OR: [
              { title: { contains: query, mode: "insensitive" as const } },
              { content: { contains: query, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    orderBy: [{ updatedAt: "desc" }],
    include: { author: { select: authorSelect } },
  });
}

export function findRecommendationById(id: string) {
  return prisma.recommendation.findUnique({ where: { id }, include: { author: { select: authorSelect } } });
}

// Active recommendations only, for suggestions on the review screen.
export function findActiveRecommendations() {
  return prisma.recommendation.findMany({
    where: { archivedAt: null },
    orderBy: [{ title: "asc" }],
    select: { id: true, title: true, content: true, category: true, indicatorKeys: true, language: true },
  });
}

export function findActiveRecommendationsByIds(ids: string[]) {
  return prisma.recommendation.findMany({
    where: { id: { in: ids }, archivedAt: null },
    select: { id: true, title: true, content: true },
  });
}

export function createRecommendation(authorId: string, data: RecommendationInput) {
  return prisma.recommendation.create({ data: { ...data, authorId } });
}

export function updateRecommendation(id: string, data: RecommendationInput) {
  return prisma.recommendation.update({ where: { id }, data });
}

export function setRecommendationArchived(id: string, archived: boolean) {
  return prisma.recommendation.update({ where: { id }, data: { archivedAt: archived ? new Date() : null } });
}
