import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/motion";
import { buttonVariants } from "@/components/ui/button";
import { routes } from "@/content/home";
import { reviewQueue as copy } from "@/content/review";
import { BackLink } from "@/features/analysis/back-link";
import { ReviewQueue } from "@/features/review/review-queue";
import { auth } from "@/server/auth/auth";
import { getReviewQueue } from "@/server/review/service";

export const metadata: Metadata = { title: "Review queue" };

/** Reads the session and the queue at request time; must stay behind <Suspense> (Cache Components). */
async function DoctorQueue() {
  await connection();
  const session = await auth();
  if (!session?.user) redirect(routes.login);

  if (session.user.role !== "MEDECIN") {
    return (
      <div className="flex flex-col items-start gap-4 rounded-xl bg-surface-blush p-8 sm:p-10">
        <h2 className="font-display text-[2rem] leading-[1.1]">{copy.notDoctor.title}</h2>
        <p className="max-w-md text-foreground">{copy.notDoctor.text}</p>
        <Link href={routes.dashboard} className={buttonVariants({ variant: "secondary" })}>
          {copy.notDoctor.cta}
        </Link>
      </div>
    );
  }

  const items = await getReviewQueue();

  return (
    <>
      <p className="tabular mb-6 text-sm font-medium text-muted-foreground">{copy.count(items.length)}</p>
      <ReviewQueue items={items} doctorId={session.user.id} />
    </>
  );
}

function QueueSkeleton() {
  return (
    <div aria-hidden="true" className="flex animate-pulse flex-col gap-3 motion-reduce:animate-none">
      {[0, 1, 2, 3].map((key) => (
        <div key={key} className="h-28 rounded-xl bg-surface-blush" />
      ))}
    </div>
  );
}

/** Doctor's queue of AI pre-analyses waiting for a medical review. */
export default function ReviewQueuePage() {
  return (
    <section aria-labelledby="queue-title" className="pt-28 pb-20 sm:pt-32 lg:pt-36 lg:pb-28">
      <Container className="max-w-4xl">
        <BackLink href={routes.dashboard} label="Back to dashboard" className="mb-4 -mt-3" />
        <Reveal className="mb-12">
          <p className="overline-text">{copy.overline}</p>
          <h1 id="queue-title" className="mt-4 font-display text-[2.5rem] leading-[1.08] sm:text-5xl">
            {copy.title}
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-[1.6] text-foreground">{copy.description}</p>
        </Reveal>

        <Suspense fallback={<QueueSkeleton />}>
          <DoctorQueue />
        </Suspense>
      </Container>
    </section>
  );
}
