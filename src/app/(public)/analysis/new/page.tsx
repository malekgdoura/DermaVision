import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/motion";
import { buttonVariants } from "@/components/ui/button";
import { analysisUpload as copy } from "@/content/analysis";
import { routes } from "@/content/home";
import { BackLink } from "@/features/analysis/back-link";
import { SkinScanner } from "@/features/analysis/skin-scanner";
import { auth } from "@/server/auth/auth";

export const metadata: Metadata = { title: "Skin analysis" };

/** Reads the session at request time; must stay behind <Suspense> (Cache Components). */
async function PatientScanner() {
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

  return <SkinScanner />;
}

function ScannerSkeleton() {
  return (
    <div aria-hidden="true" className="flex animate-pulse flex-col gap-6 motion-reduce:animate-none">
      <div className="aspect-[4/5] w-full rounded-xl bg-surface-blush sm:aspect-square" />
      <div className="h-12 w-40 rounded-full bg-surface-blush" />
    </div>
  );
}

/** Patient-only skin analysis upload page. */
export default function AnalysisNewPage() {
  return (
    <section aria-labelledby="analysis-title" className="pt-28 pb-20 sm:pt-32 lg:pt-36 lg:pb-28">
      <Container className="grid items-start gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
        <Reveal className="flex flex-col lg:sticky lg:top-32 lg:py-4">
          <BackLink href={routes.dashboard} label="Back to dashboard" className="mb-4 -mt-3" />
          <p className="overline-text">{copy.overline}</p>
          <h1 id="analysis-title" className="mt-4 font-display text-[2.5rem] leading-[1.08] sm:text-5xl">
            {copy.title}
          </h1>
          <p className="mt-4 text-lg leading-[1.6] text-foreground">{copy.description}</p>

          <ol className="mt-8 flex flex-col gap-5">
            {copy.guidelines.map((item, index) => (
              <li key={item.title} className="flex gap-4">
                <span
                  aria-hidden="true"
                  className="tabular flex size-8 shrink-0 items-center justify-center rounded-full border border-primary/30 text-sm font-semibold text-primary"
                >
                  {index + 1}
                </span>
                <div>
                  <p className="font-semibold text-heading">{item.title}</p>
                  <p className="mt-0.5 text-[0.9375rem] text-muted-foreground">{item.text}</p>
                </div>
              </li>
            ))}
          </ol>

          <p className="mt-8 flex items-start gap-2.5 rounded-lg bg-surface-blush px-4 py-3 text-sm text-foreground">
            <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" className="mt-0.5 size-4 shrink-0 text-primary">
              <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
              <path d="M5.5 7V5a2.5 2.5 0 015 0v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            {copy.privacy}
          </p>
        </Reveal>

        <Suspense fallback={<ScannerSkeleton />}>
          <PatientScanner />
        </Suspense>
      </Container>
    </section>
  );
}
