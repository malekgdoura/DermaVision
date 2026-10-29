import { CircleCheck, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/motion";
import { buttonVariants } from "@/components/ui/button";
import { routes } from "@/content/home";
import { recommendationLibrary as copy } from "@/content/recommendations";
import { BackLink } from "@/features/analysis/back-link";
import { RecommendationList } from "@/features/recommendations/recommendation-list";
import { cn } from "@/lib/utils";
import { auth } from "@/server/auth/auth";
import { RECOMMENDATION_CATEGORIES } from "@/server/recommendations/schemas";
import { listRecommendations } from "@/server/recommendations/service";

export const metadata: Metadata = { title: "Recommendations" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function param(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

/** Reads the session, the filters and the library at request time; must stay behind <Suspense>. */
async function Library({ searchParams }: { searchParams: SearchParams }) {
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

  const params = await searchParams;
  const query = param(params.q);
  // Unknown values in the URL are ignored rather than trusted.
  const category = (RECOMMENDATION_CATEGORIES as readonly string[]).includes(param(params.category))
    ? param(params.category)
    : "";
  const language = ["en", "fr"].includes(param(params.language)) ? param(params.language) : "";
  const archived = param(params.status) === "archived";
  const saved = param(params.saved);
  const filtered = Boolean(query || category || language);

  const items = await listRecommendations({ query, category, language, archived });

  return (
    <div className="flex flex-col gap-6">
      {saved === "created" || saved === "updated" ? (
        <p role="status" className="flex items-center gap-2 rounded-md bg-success/10 px-4 py-3 text-sm font-medium text-success">
          <CircleCheck aria-hidden="true" className="size-4" strokeWidth={2} />
          {copy.saved[saved]}
        </p>
      ) : null}

      <Filters query={query} category={category} language={language} archived={archived} />

      <p className="tabular text-sm font-medium text-muted-foreground">{copy.count(items.length)}</p>

      {items.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-xl bg-surface-blush p-8">
          {filtered ? (
            <p className="text-foreground">{copy.empty.filtered}</p>
          ) : archived ? (
            <p className="text-foreground">{copy.empty.archived}</p>
          ) : (
            <>
              <h2 className="font-display text-[2rem] leading-[1.1]">{copy.empty.title}</h2>
              <p className="max-w-md text-foreground">{copy.empty.text}</p>
            </>
          )}
        </div>
      ) : (
        <RecommendationList items={items} doctorId={session.user.id} archived={archived} />
      )}
    </div>
  );
}

const selectClass =
  "h-11 w-full cursor-pointer rounded-md border border-border bg-surface px-3 text-[0.9375rem] text-heading hover:border-border-strong focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-ring";

// Plain GET form: filters live in the URL, so they survive a reload and can be shared.
function Filters({ query, category, language, archived }: { query: string; category: string; language: string; archived: boolean }) {
  return (
    <form method="get" className="grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto]">
      <label className="flex flex-col gap-1 text-sm font-semibold text-heading">
        {copy.filters.search}
        <input name="q" defaultValue={query} placeholder={copy.filters.searchPlaceholder} className={cn(selectClass, "cursor-text")} />
      </label>
      <label className="flex flex-col gap-1 text-sm font-semibold text-heading">
        {copy.filters.category}
        <select name="category" defaultValue={category} className={selectClass}>
          <option value="">{copy.filters.any}</option>
          {Object.entries(copy.categories).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm font-semibold text-heading">
        {copy.filters.language}
        <select name="language" defaultValue={language} className={selectClass}>
          <option value="">{copy.filters.any}</option>
          {Object.entries(copy.languages).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm font-semibold text-heading">
        {copy.filters.status}
        <select name="status" defaultValue={archived ? "archived" : ""} className={selectClass}>
          <option value="">{copy.filters.active}</option>
          <option value="archived">{copy.filters.archived}</option>
        </select>
      </label>
      <div className="flex items-end gap-2">
        <button type="submit" className={buttonVariants({ variant: "secondary", size: "sm" })}>
          {copy.filters.apply}
        </button>
        <Link href={routes.recommendations} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "px-4")}>
          {copy.filters.reset}
        </Link>
      </div>
    </form>
  );
}

function LibrarySkeleton() {
  return (
    <div aria-hidden="true" className="flex animate-pulse flex-col gap-3 motion-reduce:animate-none">
      <div className="h-20 rounded-xl bg-surface-blush" />
      {[0, 1, 2].map((key) => (
        <div key={key} className="h-36 rounded-xl bg-surface-blush" />
      ))}
    </div>
  );
}

/** Doctors' library of validated care advice (list, search, archive). */
export default function RecommendationsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <section aria-labelledby="recommendations-title" className="pt-28 pb-20 sm:pt-32 lg:pt-36 lg:pb-28">
      <Container className="max-w-5xl">
        <BackLink href={routes.dashboard} label="Back to dashboard" className="mb-4 -mt-3" />
        <Reveal className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="overline-text">{copy.overline}</p>
            <h1 id="recommendations-title" className="mt-4 font-display text-[2.5rem] leading-[1.08] sm:text-5xl">
              {copy.title}
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-[1.6] text-foreground">{copy.description}</p>
          </div>
          <Link href={`${routes.recommendations}/new`} className={buttonVariants()}>
            <Plus aria-hidden="true" />
            {copy.newRecommendation}
          </Link>
        </Reveal>

        <Suspense fallback={<LibrarySkeleton />}>
          <Library searchParams={searchParams} />
        </Suspense>
      </Container>
    </section>
  );
}
