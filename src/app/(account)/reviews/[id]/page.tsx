import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { Container } from "@/components/layout/container";
import { routes } from "@/content/home";
import { reviewWorkspace as copy } from "@/content/review";
import { BackLink } from "@/features/analysis/back-link";
import { ReviewWorkspace } from "@/features/review/review-workspace";
import { auth } from "@/server/auth/auth";
import { getRecommendationSuggestions } from "@/server/recommendations/service";
import { getReviewWorkspace } from "@/server/review/service";

export const metadata: Metadata = { title: "Medical review" };

type PageProps = { params: Promise<{ id: string }> };

/** Reads the session and the analysis at request time; must stay behind <Suspense> (Cache Components). */
async function DoctorReview({ params }: PageProps) {
  await connection();
  const session = await auth();
  if (!session?.user) redirect(routes.login);
  // Patients never see this screen, not even a "forbidden" page that would confirm the analysis exists.
  if (session.user.role !== "MEDECIN") notFound();

  const { id } = await params;
  const workspace = await getReviewWorkspace(session.user.id, id);
  if (!workspace) notFound();

  // Suggestions follow the validated signs; before validation every recommendation is listed as "other".
  const recommendations = workspace.canEdit
    ? await getRecommendationSuggestions(workspace.correctedResult)
    : { suggested: [], others: [] };

  return <ReviewWorkspace workspace={workspace} recommendations={recommendations} />;
}

function WorkspaceSkeleton() {
  return (
    <div aria-hidden="true" className="flex animate-pulse flex-col gap-10 motion-reduce:animate-none">
      <div className="flex flex-col gap-4">
        <div className="h-4 w-28 rounded bg-surface-blush" />
        <div className="h-12 w-2/3 rounded-md bg-surface-blush" />
      </div>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-14">
        <div className="aspect-[4/5] rounded-xl bg-surface-blush" />
        <div className="flex flex-col gap-4">
          <div className="h-24 rounded-xl bg-surface-blush" />
          <div className="h-96 rounded-xl bg-surface-blush" />
        </div>
      </div>
    </div>
  );
}

/** One analysis under medical review: correction, AI report draft, edit and publication. */
export default function ReviewPage({ params }: PageProps) {
  return (
    <section aria-labelledby="review-title" className="pt-28 pb-20 sm:pt-32 lg:pt-36 lg:pb-28">
      <Container>
        <BackLink href={routes.reviews} label={copy.backToQueue} className="mb-4 -mt-3" />
        <Suspense fallback={<WorkspaceSkeleton />}>
          <DoctorReview params={params} />
        </Suspense>
      </Container>
    </section>
  );
}
