import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/motion";
import { ButtonArrow, buttonVariants } from "@/components/ui/button";
import { analysisCompare as copy } from "@/content/analysis";
import { routes } from "@/content/home";
import {
  ComparePicker,
  formatScanDate,
  ScanComparison,
  type CompareScan,
} from "@/features/analysis/analysis-compare";
import { BackLink } from "@/features/analysis/back-link";
import { analysisPhotoUrl, readMappedResult } from "@/features/analysis/mapped-result";
import { getAnalysesForUser } from "@/server/analysis/service";
import { auth } from "@/server/auth/auth";

export const metadata: Metadata = { title: "Progress tracking" };

type SearchParams = Promise<{ a?: string | string[]; b?: string | string[] }>;

/** Reads the session and the analyses at request time; must stay behind <Suspense> (Cache Components). */
async function PatientComparison({ searchParams }: { searchParams: SearchParams }) {
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

  // Only the patient's own analyses, and only those with a usable mapped result (never rawResponse).
  const scans: CompareScan[] = (await getAnalysesForUser(session.user.id)).flatMap((analysis) => {
    const result = readMappedResult(analysis.aiResult?.mappedResult);
    return result
      ? [{ id: analysis.id, createdAt: analysis.createdAt, photoUrl: analysisPhotoUrl(analysis.id), result }]
      : [];
  });

  if (scans.length < 2) return <NotEnoughScans />;

  const params = await searchParams;
  const requestedA = typeof params.a === "string" ? params.a : undefined;
  const requestedB = typeof params.b === "string" ? params.b : undefined;

  // Unknown ids (or another patient's ids) are ignored: defaults are the two most recent scans.
  const pickA = scans.find((scan) => scan.id === requestedA) ?? scans[1];
  const pickB = scans.find((scan) => scan.id === requestedB) ?? scans[0];

  const options = scans.map((scan) => ({ id: scan.id, label: `${formatScanDate(scan.createdAt)} · ${scan.result.skinType.label}` }));

  if (pickA.id === pickB.id) {
    return <ComparePicker options={options} firstId={pickA.id} secondId={pickB.id} error={copy.sameScan} />;
  }

  // "First" is always the older scan, whatever order was picked.
  const [first, second] = pickA.createdAt <= pickB.createdAt ? [pickA, pickB] : [pickB, pickA];

  return (
    <div className="flex flex-col gap-12">
      <ComparePicker options={options} firstId={first.id} secondId={second.id} />
      <ScanComparison first={first} second={second} />
    </div>
  );
}

function NotEnoughScans() {
  return (
    <div className="flex flex-col items-start gap-4 rounded-xl bg-surface-blush p-8 sm:p-10">
      <h2 className="font-display text-[2rem] leading-[1.1]">{copy.empty.title}</h2>
      <p className="max-w-md text-foreground">{copy.empty.text}</p>
      <Link href={routes.analysis} className={buttonVariants()}>
        {copy.empty.cta}
        <ButtonArrow />
      </Link>
    </div>
  );
}

function CompareSkeleton() {
  return (
    <div aria-hidden="true" className="flex animate-pulse flex-col gap-8 motion-reduce:animate-none">
      <div className="h-24 rounded-xl bg-surface-blush" />
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="aspect-[4/5] rounded-xl bg-surface-blush" />
        <div className="aspect-[4/5] rounded-xl bg-surface-blush" />
      </div>
    </div>
  );
}

/** Progress tracking: two of the patient's scans side by side. */
export default function AnalysisComparePage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <section aria-labelledby="compare-title" className="pt-28 pb-20 sm:pt-32 lg:pt-36 lg:pb-28">
      <Container className="max-w-5xl">
        <Reveal className="mb-10 flex flex-col gap-5">
          <BackLink href="/analysis" label={copy.backToHistory} className="-mt-3" />
          <p className="overline-text">{copy.overline}</p>
          <h1 id="compare-title" className="font-display text-[2.5rem] leading-[1.08] sm:text-5xl">
            {copy.title}
          </h1>
          <p className="max-w-xl text-lg leading-[1.6] text-foreground">{copy.description}</p>

          <div className="flex gap-3 rounded-lg bg-ai-panel px-5 py-4">
            <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" className="mt-0.5 size-4 shrink-0 text-ai-label">
              <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.4" />
              <path d="M8 7.25v3.5M8 5.25v.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <div className="text-[0.9375rem]">
              <p className="font-semibold text-ai-label">{copy.disclaimer.title}</p>
              <p className="mt-1 text-foreground">{copy.disclaimer.text}</p>
            </div>
          </div>
        </Reveal>

        <Suspense fallback={<CompareSkeleton />}>
          <PatientComparison searchParams={searchParams} />
        </Suspense>
      </Container>
    </section>
  );
}
