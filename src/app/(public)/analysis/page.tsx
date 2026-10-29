import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/motion";
import { ButtonArrow, buttonVariants } from "@/components/ui/button";
import { analysisHistory as copy } from "@/content/analysis";
import { routes } from "@/content/home";
import { AnalysisHistory, type AnalysisHistoryItem } from "@/features/analysis/analysis-history";
import { BackLink } from "@/features/analysis/back-link";
import { analysisPhotoUrl, readMappedResult } from "@/features/analysis/mapped-result";
import { getAnalysesForUser } from "@/server/analysis/service";
import { auth } from "@/server/auth/auth";

export const metadata: Metadata = { title: "Your analyses" };

/** Reads the session and the analyses at request time; must stay behind <Suspense> (Cache Components). */
async function PatientHistory() {
  await connection();
  const session = await auth();
  if (!session?.user) redirect(routes.login);

  if (session.user.role !== "PATIENT") {
    return (
      <div className="flex flex-col items-start gap-4 rounded-xl bg-surface-blush p-8 sm:p-10">
        <h2 className="font-display text-[2rem] leading-[1.1]">{copy.notPatient.title}</h2>
        <p className="max-w-md text-foreground">{copy.notPatient.text}</p>
        <Link href={routes.dashboard} className={buttonVariants({ variant: "secondary" })}>
          {copy.notPatient.cta}
        </Link>
      </div>
    );
  }

  // Already sorted newest first by the repository.
  const analyses = await getAnalysesForUser(session.user.id);

  // Keep only what the UI needs: the mapped result, never rawResponse.
  const items: AnalysisHistoryItem[] = analyses.map((analysis) => ({
    id: analysis.id,
    status: analysis.status,
    createdAt: analysis.createdAt,
    photoUrl: analysisPhotoUrl(analysis.id),
    result: readMappedResult(analysis.aiResult?.mappedResult),
  }));

  return (
    <>
      {items.length > 0 ? (
        <p className="tabular mb-6 text-sm font-medium text-muted-foreground">{copy.count(items.length)}</p>
      ) : null}
      <AnalysisHistory items={items} />
    </>
  );
}

function HistorySkeleton() {
  return (
    <div aria-hidden="true" className="flex animate-pulse flex-col gap-5 motion-reduce:animate-none">
      {[0, 1, 2].map((key) => (
        <div key={key} className="h-40 rounded-xl bg-surface-blush sm:ml-12" />
      ))}
    </div>
  );
}

/** Patient's skin analyses, newest first. */
export default function AnalysisHistoryPage() {
  return (
    <section aria-labelledby="history-title" className="pt-28 pb-20 sm:pt-32 lg:pt-36 lg:pb-28">
      <Container className="max-w-4xl">
        <BackLink href={routes.dashboard} label="Back to dashboard" className="mb-4 -mt-3" />
        <Reveal className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="overline-text">{copy.overline}</p>
            <h1 id="history-title" className="mt-4 font-display text-[2.5rem] leading-[1.08] sm:text-5xl">
              {copy.title}
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-[1.6] text-foreground">{copy.description}</p>
          </div>
       <div className="flex flex-wrap gap-3">
  <Link
    href="/analysis/compare"
    className={buttonVariants({ variant: "secondary" })}
  >
    Compare scans
  </Link>

  <Link
    href={routes.analysis}
    className={buttonVariants()}
  >
    {copy.newAnalysis}
    <ButtonArrow />
  </Link>
</div>
        </Reveal>

        <Suspense fallback={<HistorySkeleton />}>
          <PatientHistory />
        </Suspense>
      </Container>
    </section>
  );
}
