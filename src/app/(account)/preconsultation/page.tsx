import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";

import { Container } from "@/components/layout/container";
import { routes } from "@/content/home";
import { auth } from "@/server/auth/auth";
import { getPatientAppointments } from "@/server/appointments/service";

export const metadata: Metadata = { title: "Pré-consultations" };
export const instant = false;

export default async function PreConsultationsPage() {
  await connection();
  const session = await auth();
  if (!session?.user) redirect(routes.login);
  if (session.user.role !== "PATIENT") notFound();

  const appointments = await getPatientAppointments(session.user.id);
  return (
    <section aria-labelledby="preconsultations-title" className="pt-28 pb-24 sm:pt-32 lg:pt-36">
      <Container>
        <div className="flex max-w-3xl flex-col gap-3">
          <p className="overline-text">Pré-consultation</p>
          <h1 id="preconsultations-title" className="font-display text-[2.5rem] leading-[1.08] sm:text-5xl">Préparer mon rendez-vous</h1>
          <p className="text-lg leading-[1.6] text-foreground">Répondez à quelques questions pour aider votre médecin à préparer la consultation.</p>
        </div>

        {appointments.length === 0 ? (
          <div className="mt-10 max-w-2xl rounded-xl border border-dashed border-border-strong bg-surface/60 p-6">
            <h2 className="text-lg font-semibold text-heading">Aucun rendez-vous disponible</h2>
            <p className="mt-2 text-sm text-muted-foreground">La pré-consultation apparaîtra ici dès qu’un rendez-vous vous sera associé.</p>
            <Link href={routes.book} className="mt-5 inline-flex font-semibold text-primary underline underline-offset-4">Voir les rendez-vous</Link>
          </div>
        ) : (
          <div className="mt-10 grid gap-4 lg:grid-cols-2">
            {appointments.map((appointment) => (
              <Link key={appointment.id} href={`/preconsultation/${appointment.id}`} className="rounded-xl border border-border bg-surface p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-border-strong hover:shadow-lg">
                <p className="text-sm text-muted-foreground">{new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short" }).format(appointment.scheduledAt)}</p>
                <h2 className="mt-2 text-xl font-semibold text-heading">Dr {appointment.doctor.prenom} {appointment.doctor.nom}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{appointment.consultationType === "VIDEO" ? "Consultation vidéo" : "Consultation au cabinet"}</p>
                <p className="mt-5 text-sm font-semibold text-primary">
                  {appointment.preConsultation?.status === "SUBMITTED" ? "Voir ma pré-consultation" : appointment.preConsultation ? `Reprendre le brouillon · ${appointment.preConsultation.completionPercentage}%` : "Commencer la pré-consultation"}
                </p>
              </Link>
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}