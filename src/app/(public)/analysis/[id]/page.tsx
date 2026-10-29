import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { Container } from "@/components/layout/container";
import { routes } from "@/content/home";
import { AnalysisResult } from "@/features/analysis/analysis-result";
import { BackLink } from "@/features/analysis/back-link";
import { analysisPhotoUrl, readMappedResult } from "@/features/analysis/mapped-result";
import { getAnalysisForUser } from "@/server/analysis/service";
import { auth } from "@/server/auth/auth";
import { getPublishedReportForPatient } from "@/server/review/service";

export const metadata: Metadata = { title: "Your skin analysis" };

type PageProps = { params: Promise<{ id: string }> };

/** Reads the session and the analysis at request time; must stay behind <Suspense> (Cache Components). */
async function PatientAnalysis({ params }: PageProps) {
  await connection();
  const session = await auth();
  if (!session?.user) redirect(routes.login);

  const { id } = await params;
  // Same 404 whether the analysis is missing or belongs to someone else.
  const analysis = await getAnalysisForUser(session.user.id, id);
  if (!analysis) notFound();

  // Only the published version reaches the patient: never the drafts nor the doctor's private notes.
  const report = analysis.status === "VALIDATED" ? await getPublishedReportForPatient(session.user.id, id) : null;

  return (
    <AnalysisResult
      status={analysis.status}
      createdAt={analysis.createdAt}
      photoUrl={analysisPhotoUrl(analysis.id)}
      // Only the mapped DermaVision result reaches the UI; rawResponse never leaves the server.
      // Once published, the doctor's corrected result replaces the AI one.
      result={report?.result ?? readMappedResult(analysis.aiResult?.mappedResult)}
      report={report}
    />
  );
}

function ResultSkeleton() {
  return (
    <div aria-hidden="true" className="flex animate-pulse flex-col gap-10 motion-reduce:animate-none">
      <div className="flex flex-col gap-4">
        <div className="h-4 w-28 rounded bg-surface-blush" />
        <div className="h-12 w-3/4 rounded-md bg-surface-blush" />
        <div className="h-20 rounded-lg bg-surface-blush" />
      </div>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14">
        <div className="aspect-[4/5] rounded-xl bg-surface-blush" />
        <div className="flex flex-col gap-4">
          <div className="h-56 rounded-xl bg-surface-blush" />
          <div className="h-20 rounded-lg bg-surface-blush" />
          <div className="h-20 rounded-lg bg-surface-blush" />
        </div>
      </div>
    </div>
  );
}

/** Result of one skin analysis, visible only to the patient who owns it. */
export default function AnalysisResultPage({ params }: PageProps) {
  return (
    <section aria-labelledby="result-title" className="pt-28 pb-20 sm:pt-32 lg:pt-36 lg:pb-28">
      <Container>
        <BackLink href="/analysis" label="Back to analyses" className="mb-4 -mt-3" />
        <Suspense fallback={<ResultSkeleton />}>
          <PatientAnalysis params={params} />
        </Suspense>
      </Container>
    </section>
  );
}
