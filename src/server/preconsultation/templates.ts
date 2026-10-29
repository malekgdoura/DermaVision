import type { Prisma } from "@/generated/prisma/client";

import { prisma } from "@/server/db/prisma";

import { questionnaireTemplateSchema, type QuestionnaireTemplateInput } from "./template-schema";

export function listDoctorTemplates(doctorId: string) {
  return prisma.questionnaireTemplate.findMany({ where: { doctorId }, orderBy: { updatedAt: "desc" } });
}

export async function createDoctorTemplate(doctorId: string, input: QuestionnaireTemplateInput) {
  return prisma.questionnaireTemplate.create({
    data: {
      doctorId,
      name: input.name,
      description: input.description,
      consultationType: input.consultationType,
      questions: input.questions as Prisma.InputJsonValue,
    },
  });
}

export async function updateDoctorTemplate(doctorId: string, id: string, input: QuestionnaireTemplateInput) {
  const owned = await prisma.questionnaireTemplate.findFirst({ where: { id, doctorId } });
  if (!owned) return null;
  return prisma.questionnaireTemplate.update({
    where: { id },
    data: {
      name: input.name,
      description: input.description,
      consultationType: input.consultationType,
      questions: input.questions as Prisma.InputJsonValue,
    },
  });
}

export async function deactivateDoctorTemplate(doctorId: string, id: string) {
  const result = await prisma.questionnaireTemplate.updateMany({ where: { id, doctorId }, data: { isActive: false } });
  return result.count === 1;
}

export function parseTemplateInput(value: unknown) {
  return questionnaireTemplateSchema.safeParse(value);
}