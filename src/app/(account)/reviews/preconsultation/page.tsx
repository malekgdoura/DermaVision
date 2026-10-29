import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";

import { Container } from "@/components/layout/container";
import { routes } from "@/content/home";
import { auth } from "@/server/auth/auth";
import { getDoctorAppointments } from "@/server/appointments/service";

export const metadata: Metadata = { title: "Pré-consultations patients" };
export const instant = false;

export default async function DoctorPreConsultationsPage() {
  await connection();
  const session = await auth();
  if (!session?.user) redirect(routes.login);
  if (session.user.role !== "MEDECIN") notFound();

  const appointments = await getDoctorAppointments(session.user.id);
  return (
    <section aria-labelledby="doctor-preconsultations-title" className="pt-28 pb-24 sm:pt-32 lg:pt-36">
      <Container>
        <div className="flex max-w-3xl flex-col gap-3">
          <p className="overline-text">Pré-consultations</p>
          <h1 id="doctor-preconsultations-title" className="font-display text-[2.5rem] leading-[1.08] sm:text-5xl">Préparer vos consultations</h1>
          <p className="text-lg leading-[1.6] text-foreground">Consultez les réponses déclarées par vos patients et leur résumé assisté par IA.</p>
          <Link href="/reviews/preconsultation/templates" className="mt-2 self-start font-semibold text-primary underline underline-offset-4">Gérer mes questionnaires</Link>
        </div>
        {appointments.length === 0 ? (
          <p className="mt-10 rounded-xl border border-dashed border-border-strong bg-surface/60 p-6 text-sm text-muted-foreground">Aucun rendez-vous associé.</p>
        ) : (
          <div className="mt-10 grid gap-4 lg:grid-cols-2">
            {appointments.map((appointment) => (
              <Link key={appointment.id} href={`/reviews/preconsultation/${appointment.id}`} className="rounded-xl border border-border bg-surface p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-border-strong hover:shadow-lg">
                <p className="text-sm text-muted-foreground">{new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short" }).format(appointment.scheduledAt)}</p>
                <h2 className="mt-2 text-xl font-semibold text-heading">{appointment.patient.prenom} {appointment.patient.nom}</h2>
                <p className="mt-3 text-sm text-muted-foreground">{appointment.preConsultation ? `${appointment.preConsultation.status === "SUBMITTED" ? "Soumise" : "Brouillon"} · ${appointment.preConsultation.completionPercentage}%` : "Pas encore commencée"}</p>
              </Link>
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}