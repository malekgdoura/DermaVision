import { Inbox } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { StatusBadge } from "@/features/analysis/analysis-result";
import { reviewQueue as copy } from "@/content/review";
import { cn } from "@/lib/utils";
import type { ReviewQueueItem } from "@/server/review/service";

import { formatDateTime } from "./format";

/** Analyses waiting for a doctor, oldest first. */
export function ReviewQueue({ items, doctorId }: { items: ReviewQueueItem[]; doctorId: string }) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-xl bg-surface-blush p-8 sm:p-10">
        <Inbox aria-hidden="true" className="size-6 text-primary" strokeWidth={1.6} />
        <h2 className="font-display text-[2rem] leading-[1.1]">{copy.empty.title}</h2>
        <p className="max-w-md text-foreground">{copy.empty.text}</p>
      </div>
    );
  }

  return (
    <ol className="flex flex-col gap-3" aria-label={copy.title}>
      {items.map((item) => {
        const mine = item.reviewer?.id === doctorId;
        const takenByOther = item.reviewer !== null && !mine;
        return (
          <li
            key={item.id}
            className={cn(
              "flex flex-col gap-4 rounded-xl border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between",
              mine ? "border-primary/40 shadow-sm" : "border-border",
            )}
          >
            <div className="flex min-w-0 flex-col gap-2">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <h2 className="text-lg font-semibold text-heading">
                  {item.patient.prenom} {item.patient.nom}
                </h2>
                <StatusBadge status={item.status} />
              </div>
              <p className="text-sm text-muted-foreground">
                <time dateTime={item.createdAt.toISOString()}>{formatDateTime(item.createdAt)}</time>
                {" · "}
                {item.skinTypeLabel ?? "—"} · {copy.signs(item.detectedCount)}
              </p>
              <p className="text-sm font-medium text-heading">
                {!item.indicatorsValidated
                  ? copy.progress.waiting
                  : item.versionCount > 0
                    ? `${copy.progress.indicators} · ${copy.progress.drafts(item.versionCount)}`
                    : copy.progress.indicators}
                {item.reviewer ? (
                  <span className="font-normal text-muted-foreground">
                    {" · "}
                    {mine ? copy.you : copy.assignedTo(item.reviewer.nom)}
                  </span>
                ) : null}
              </p>
            </div>
            <Link
              href={`/reviews/${item.id}`}
              className={cn(buttonVariants({ variant: takenByOther ? "ghost" : mine ? "primary" : "secondary", size: "sm" }), "self-start sm:self-center")}
            >
              {takenByOther ? copy.view : copy.open}
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
