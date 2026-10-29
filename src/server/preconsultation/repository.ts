import { randomUUID } from "node:crypto";

import { Prisma } from "@/generated/prisma/client";

import { prisma } from "@/server/db/prisma";

export function upsertDraft(input: {
  appointmentId: string;
  patientId: string;
  answers: Prisma.InputJsonValue;
  completionPercentage: number;
}) {
  return saveAnswers({ ...input, status: "DRAFT" });
}

export function submitPreConsultation(appointmentId: string, patientId: string, answers: Prisma.InputJsonValue) {
  return saveAnswers({ appointmentId, patientId, answers, status: "SUBMITTED" });
}

export function markSummaryGenerating(id: string) {
  return prisma.$executeRaw(Prisma.sql`UPDATE "PreConsultation" SET "aiCallCount" = "aiCallCount" + 1, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = ${id}`);
}

export function saveSummary(input: {
  id: string;
  summary: Prisma.InputJsonValue;
  provider: string;
  model: string;
  generatedAt: Date;
}) {
  return prisma.$executeRaw(Prisma.sql`
    UPDATE "PreConsultation"
    SET "summary" = ${input.summary}::jsonb,
        "summarySource" = 'AI'::"PreConsultationSummarySource",
        "summaryModel" = ${input.model},
        "summaryGeneratedAt" = ${input.generatedAt},
        "updatedAt" = CURRENT_TIMESTAMP
    WHERE "id" = ${input.id}
  `);
}

export function saveSummaryFailure(id: string, error: string) {
  void error;
  return prisma.$executeRaw(Prisma.sql`
    UPDATE "PreConsultation"
    SET "summary" = NULL,
        "summarySource" = 'FALLBACK'::"PreConsultationSummarySource",
        "summaryModel" = NULL,
        "summaryGeneratedAt" = NULL,
        "updatedAt" = CURRENT_TIMESTAMP
    WHERE "id" = ${id}
  `);
}

async function saveAnswers(input: {
  appointmentId: string;
  patientId: string;
  answers: Prisma.InputJsonValue;
  status: "DRAFT" | "SUBMITTED";
  completionPercentage?: number;
}) {
  return prisma.$transaction(async (transaction) => {
    const existing = await transaction.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      SELECT "id" FROM "PreConsultation" WHERE "appointmentId" = ${input.appointmentId} LIMIT 1
    `);
    const id = existing[0]?.id ?? randomUUID();

    if (existing[0]) {
      await transaction.$executeRaw(Prisma.sql`
        UPDATE "PreConsultation"
        SET "status" = ${input.status}::"PreConsultationStatus",
            "revision" = "revision" + 1,
            "submittedAt" = CASE WHEN ${input.status} = 'SUBMITTED' THEN CURRENT_TIMESTAMP ELSE "submittedAt" END,
            "updatedAt" = CURRENT_TIMESTAMP
        WHERE "id" = ${id} AND "patientId" = ${input.patientId}
      `);
    } else {
      await transaction.$executeRaw(Prisma.sql`
        INSERT INTO "PreConsultation" ("id", "patientId", "appointmentId", "catalogVersion", "status", "revision", "createdAt", "updatedAt", "submittedAt")
        VALUES (${id}, ${input.patientId}, ${input.appointmentId}, 1, ${input.status}::"PreConsultationStatus", 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CASE WHEN ${input.status} = 'SUBMITTED' THEN CURRENT_TIMESTAMP ELSE NULL END)
      `);
    }

    await transaction.$executeRaw(Prisma.sql`DELETE FROM "PreConsultationAnswer" WHERE "preConsultationId" = ${id}`);
    for (const [questionKey, answer] of Object.entries(input.answers)) {
      await transaction.$executeRaw(Prisma.sql`
        INSERT INTO "PreConsultationAnswer" ("id", "preConsultationId", "questionKey", "answer", "createdAt", "updatedAt")
        VALUES (${randomUUID()}, ${id}, ${questionKey}, ${JSON.stringify(answer)}::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `);
    }

    return { id, completionPercentage: input.completionPercentage ?? (input.status === "SUBMITTED" ? 100 : 0) };
  });
}