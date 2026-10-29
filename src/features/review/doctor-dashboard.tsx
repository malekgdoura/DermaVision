import Link from "next/link";

import { Reveal } from "@/components/motion";
import { ButtonArrow, buttonVariants } from "@/components/ui/button";
import { doctorDashboard as copy } from "@/content/review";
import { routes } from "@/content/home";
import { SignOutButton } from "@/features/auth/sign-out-button";

import { formatDate } from "./format";

type DoctorDashboardProps = {
  name: string;
  waiting: number;
  inReview: number;
  publishedByMe: number;
  recent: { id: string; patient: { prenom: string; nom: string }; publishedAt: Date | null }[];
};

/** Doctor home: review counters, a shortcut to the queue and the last published reports. */
export function DoctorDashboard({ name, waiting, inReview, publishedByMe, recent }: DoctorDashboardProps) {
  const stats = [
    { label: copy.stats.waiting, value: waiting },
    { label: copy.stats.inReview, value: inReview },
    { label: copy.stats.published, value: publishedByMe },
  ];

  return (
    <div className="flex flex-col gap-10">
      <Reveal className="flex flex-col gap-3">
        <p className="overline-text">{copy.overline}</p>
        <h1 id="account-title" className="font-display text-[2.5rem] leading-[1.08] sm:text-5xl">
          {copy.welcome} {name}
        </h1>
        <p className="max-w-xl text-lg leading-[1.6] text-foreground">{copy.description}</p>
      </Reveal>

      <dl className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-surface p-6 shadow-sm">
            <dt className="text-sm text-muted-foreground">{stat.label}</dt>
            <dd className="tabular mt-2 font-display text-5xl leading-none text-heading">{stat.value}</dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-wrap gap-3">
        <Link href={routes.reviews} className={buttonVariants()}>
          {copy.openQueue}
          <ButtonArrow />
        </Link>
        <SignOutButton />
      </div>

      <section aria-labelledby="recent-title" className="flex flex-col gap-4">
        <h2 id="recent-title" className="text-lg font-semibold text-heading">
          {copy.recentTitle}
        </h2>
        {recent.length === 0 ? (
          <p className="text-muted-foreground">{copy.recentEmpty}</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border rounded-lg border border-border bg-surface">
            {recent.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/reviews/${item.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-3 transition-colors hover:bg-surface-blush/60"
                >
                  <span className="font-medium text-heading">
                    {item.patient.prenom} {item.patient.nom}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {item.publishedAt ? formatDate(item.publishedAt) : ""}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
