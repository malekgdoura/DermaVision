import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { Container } from "@/components/layout/container";
import { routes } from "@/content/home";
import { recommendationLibrary as copy } from "@/content/recommendations";
import { BackLink } from "@/features/analysis/back-link";
import { RecommendationForm } from "@/features/recommendations/recommendation-form";
import { auth } from "@/server/auth/auth";
import { updateRecommendationAction } from "@/server/recommendations/actions";
import { groupedIndicatorOptions } from "@/server/recommendations/indicators";
import { getRecommendationForAuthor } from "@/server/recommendations/service";

export const metadata: Metadata = { title: "Edit recommendation" };

type PageProps = { params: Promise<{ id: string }> };

async function EditRecommendation({ params }: PageProps) {
  await connection();
  const session = await auth();
  if (!session?.user) redirect(routes.login);
  if (session.user.role !== "MEDECIN") notFound();

  const { id } = await params;
  // Same 404 for "missing" and "written by another doctor".
  const recommendation = await getRecommendationForAuthor(session.user.id, id);
  if (!recommendation || recommendation.archivedAt) notFound();

  return (
    <RecommendationForm
      action={updateRecommendationAction.bind(null, id)}
      signGroups={groupedIndicatorOptions()}
      initial={{
        title: recommendation.title,
        content: recommendation.content,
        category: recommendation.category,
        language: recommendation.language,
        indicatorKeys: recommendation.indicatorKeys,
      }}
    />
  );
}

/** Edit one of your own recommendations. */
export default function EditRecommendationPage({ params }: PageProps) {
  return (
    <section aria-labelledby="form-title" className="pt-28 pb-20 sm:pt-32 lg:pt-36 lg:pb-28">
      <Container className="max-w-3xl">
        <BackLink href={routes.recommendations} label={copy.form.back} className="mb-4 -mt-3" />
        <h1 id="form-title" className="mb-10 font-display text-[2.5rem] leading-[1.08] sm:text-5xl">
          {copy.form.editTitle}
        </h1>
        <Suspense fallback={<div aria-hidden="true" className="h-[40rem] animate-pulse rounded-xl bg-surface-blush" />}>
          <EditRecommendation params={params} />
        </Suspense>
      </Container>
    </section>
  );
}
