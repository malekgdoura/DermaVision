import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";

import { Container } from "@/components/layout/container";
import { routes } from "@/content/home";
import { TemplateManager, type TemplateRecord } from "@/features/preconsultation/template-manager";
import { auth } from "@/server/auth/auth";
import { listDoctorTemplates } from "@/server/preconsultation/templates";
import { parseTemplateInput } from "@/server/preconsultation/templates";

export const metadata: Metadata = { title: "Questionnaires personnalisés" };
export const instant = false;

export default async function QuestionnaireTemplatesPage() {
  await connection();
  const session = await auth();
  if (!session?.user) redirect(routes.login);
  if (session.user.role !== "MEDECIN") notFound();

  return (
    <section aria-labelledby="templates-title" className="pt-28 pb-24 sm:pt-32 lg:pt-36">
      <Container>
        <div className="mb-10 flex max-w-3xl flex-col gap-3">
          <p className="overline-text">Pré-consultation</p>
          <h1 id="templates-title" className="font-display text-[2.5rem] leading-[1.08] sm:text-5xl">Créer un questionnaire</h1>
          <p className="text-lg leading-[1.6] text-foreground">Définissez des questions contrôlées pour adapter la préparation aux consultations.</p>
        </div>
        <TemplateManager templates={readTemplates(await listDoctorTemplates(session.user.id))} />
      </Container>
    </section>
  );
}

function readTemplates(templates: Awaited<ReturnType<typeof listDoctorTemplates>>): TemplateRecord[] {
  return templates.flatMap((template) => {
    const parsed = parseTemplateInput({
      name: template.name,
      description: template.description,
      consultationType: template.consultationType,
      questions: template.questions,
    });
    return parsed.success ? [{ id: template.id, isActive: template.isActive, ...parsed.data }] : [];
  });
}