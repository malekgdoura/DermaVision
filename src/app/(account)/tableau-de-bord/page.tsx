import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { Container } from "@/components/layout/container";
import { authContent } from "@/content/auth";
import { routes } from "@/content/home";
import { PatientDashboard } from "@/features/account/patient-dashboard";
import { readMappedResult } from "@/features/analysis/mapped-result";
import { SignOutButton } from "@/features/auth/sign-out-button";
import { DoctorDashboard } from "@/features/review/doctor-dashboard";
import { getAnalysesForUser } from "@/server/analysis/service";
import { auth } from "@/server/auth/auth";
import { getDoctorOverview } from "@/server/review/service";

export const metadata: Metadata = {
  title: "Your account",
};

const roleLabel = { PATIENT: "Patient", MEDECIN: "Doctor", ADMIN: "Administrator" } as const;

/** Reads the session at request time; must stay behind <Suspense> (Cache Components). */
async function Dashboard() {
  // Mark this component as request-time before Auth.js runs (it uses crypto, which Next refuses during prerender).
  await connection();
  const session = await auth();
  if (!session?.user) redirect(routes.login);

  const { id, name, email, role } = session.user;

  if (role === "PATIENT") {
    const analyses = await getAnalysesForUser(id);
    return (
      <PatientDashboard
        name={name ?? ""}
        analysisCount={analyses.length}
        comparableCount={analyses.filter((analysis) => readMappedResult(analysis.aiResult?.mappedResult)).length}
        latestStatus={analyses[0]?.status ?? null}
        reviewedCount={analyses.filter((analysis) => analysis.status === "VALIDATED").length}
      />
    );
  }

  if (role === "MEDECIN") {
    const overview = await getDoctorOverview(id);
    return <DoctorDashboard name={name?.split(" ").slice(1).join(" ") || (name ?? "")} {...overview} />;
  }

  // Administrators keep the minimal page until their dashboard is built.
  return (
    <div className="max-w-3xl">
      <p className="overline-text">{authContent.dashboard.overline}</p>
      <h1 id="account-title" className="mt-4 font-display text-[2.5rem] leading-[1.08] sm:text-5xl">
        Welcome, {name}
      </h1>
      <dl className="mt-8 grid gap-4 rounded-lg border border-border bg-surface p-6 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-muted-foreground">Email</dt>
          <dd className="mt-1 font-medium break-words text-heading">{email}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Account type</dt>
          <dd className="mt-1 font-medium text-heading">{roleLabel[role]}</dd>
        </div>
      </dl>
      <p className="mt-8 text-lg text-foreground">{authContent.dashboard.description}</p>
      <div className="mt-8">
        <SignOutButton />
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div aria-hidden="true" className="flex animate-pulse flex-col gap-10 motion-reduce:animate-none">
      <div className="flex flex-col gap-4">
        <div className="h-4 w-24 rounded bg-surface-blush" />
        <div className="h-12 w-2/3 rounded-md bg-surface-blush" />
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="h-80 rounded-xl bg-surface-blush lg:row-span-2" />
        <div className="h-36 rounded-xl bg-surface-blush lg:col-span-2" />
        <div className="h-36 rounded-xl bg-surface-blush lg:col-span-2" />
      </div>
    </div>
  );
}

/** Signed-in home: the patient dashboard, or a minimal page for doctors and administrators. */
export default function AccountPage() {
  return (
    <section aria-labelledby="account-title" className="pt-28 pb-24 sm:pt-32 lg:pt-36">
      <Container>
        <Suspense fallback={<DashboardSkeleton />}>
          <Dashboard />
        </Suspense>
      </Container>
    </section>
  );
}
