import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";

import { Container } from "@/components/layout/container";
import { routes } from "@/content/home";
import { PreConsultationSummary } from "@/features/preconsultation/preconsultation-summary";
import { auth } from "@/server/auth/auth";
import { getDoctorAppointment } from "@/server/appointments/service";
import { readOriginalAnswers, readSummary } from "@/server/preconsultation/serialization";

export const metadata: Metadata = { title: "Revue de pré-consultation" };
export const instant = false;

type PageProps = { params: Promise<{ appointmentId: string }> };

export default async function DoctorPreConsultationPage({ params }: PageProps) {
  await connection();
  const session = await auth();
  if (!session?.user) redirect(routes.login);
  if (session.user.role !== "MEDECIN") notFound();

  const { appointmentId } = await params;
  const appointment = await getDoctorAppointment(appointmentId, session.user.id);
  if (!appointment?.preConsultation) notFound();

  const preConsultation = appointment.preConsultation;
  return (
    <section aria-labelledby="doctor-preconsultation-title" className="pt-28 pb-24 sm:pt-32 lg:pt-36">
      <Container>
        <div className="mb-10 flex max-w-3xl flex-col gap-3">
          <p className="overline-text">Pré-consultation · Revue médecin</p>
          <h1 id="doctor-preconsultation-title" className="font-display text-[2.5rem] leading-[1.08] sm:text-5xl">{appointment.patient.prenom} {appointment.patient.nom}</h1>
          <p className="text-lg leading-[1.6] text-foreground">Rendez-vous du {new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short" }).format(appointment.scheduledAt)}</p>
          <p className="text-sm text-muted-foreground">Les réponses originales restent la référence. Le résumé assisté par IA doit être vérifié par le médecin.</p>
        </div>
        <PreConsultationSummary
          originalAnswers={readOriginalAnswers(preConsultation.answers)}
          summary={readSummary(preConsultation.summary)}
          status={preConsultation.summaryStatus}
          error={preConsultation.summaryError}
        />
      </Container>
    </section>
  );
}