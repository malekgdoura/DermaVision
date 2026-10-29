import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";

import { Container } from "@/components/layout/container";
import { routes } from "@/content/home";
import { PreConsultationWorkflow } from "@/features/preconsultation/preconsultation-workflow";
import { auth } from "@/server/auth/auth";
import { getPatientAppointment } from "@/server/appointments/service";
import { readOriginalAnswers, readSummary } from "@/server/preconsultation/serialization";

export const metadata: Metadata = { title: "Pré-consultation" };
export const instant = false;

type PageProps = { params: Promise<{ appointmentId: string }> };

export default async function PatientPreConsultationPage({ params }: PageProps) {
  await connection();
  const session = await auth();
  if (!session?.user) redirect(routes.login);
  if (session.user.role !== "PATIENT") notFound();

  const { appointmentId } = await params;
  const appointment = await getPatientAppointment(appointmentId, session.user.id);
  if (!appointment || appointment.status === "CANCELLED") notFound();

  const preConsultation = appointment.preConsultation;
  return (
    <section aria-labelledby="preconsultation-title" className="pt-28 pb-24 sm:pt-32 lg:pt-36">
      <Container>
        <div className="mb-10 flex max-w-3xl flex-col gap-3">
          <p className="overline-text">Pré-consultation</p>
          <h1 id="preconsultation-title" className="font-display text-[2.5rem] leading-[1.08] sm:text-5xl">Votre rendez-vous avec Dr {appointment.doctor.prenom} {appointment.doctor.nom}</h1>
          <p className="text-lg leading-[1.6] text-foreground">{new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short" }).format(appointment.scheduledAt)}</p>
        </div>
        <PreConsultationWorkflow
          appointmentId={appointment.id}
          initialAnswers={readOriginalAnswers(preConsultation?.answers)}
          status={preConsultation?.status === "SUBMITTED" ? "SUBMITTED" : "DRAFT"}
          summaryStatus={preConsultation?.summaryStatus ?? "NOT_STARTED"}
          summary={readSummary(preConsultation?.summary)}
          summaryError={preConsultation?.summaryError ?? null}
        />
      </Container>
    </section>
  );
}