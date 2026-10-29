import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { routes } from "@/content/home";
import { recommendationLibrary as copy } from "@/content/recommendations";
import { formatDate } from "@/features/review/format";
import { cn } from "@/lib/utils";
import { setArchivedAction } from "@/server/recommendations/actions";
import { indicatorLabel } from "@/server/recommendations/indicators";
import type { RecommendationListItem } from "@/server/recommendations/service";

import { ArchiveButton } from "./archive-button";

/** The library: every doctor sees every recommendation; only the author edits or archives. */
export function RecommendationList({
  items,
  doctorId,
  archived,
}: {
  items: RecommendationListItem[];
  doctorId: string;
  archived: boolean;
}) {
  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => {
        const mine = item.authorId === doctorId;
        return (
          <li
            key={item.id}
            className={cn(
              "flex flex-col gap-3 rounded-xl border bg-surface p-5",
              archived ? "border-dashed border-border-strong opacity-80" : "border-border",
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-1">
                <h2 className="text-lg font-semibold text-heading">{item.title}</h2>
                <p className="text-sm text-muted-foreground">
                  <span className="rounded-full bg-surface-blush px-2 py-0.5 text-xs font-medium text-heading">
                    {copy.categories[item.category as keyof typeof copy.categories] ?? item.category}
                  </span>{" "}
                  · {item.language.toUpperCase()} · {mine ? copy.yours : copy.by(item.author.nom)} · {copy.updated}{" "}
                  {formatDate(item.updatedAt)}
                </p>
              </div>
              {mine ? (
                <div className="flex gap-1">
                  {archived ? null : (
                    <Link
                      href={`${routes.recommendations}/${item.id}/edit`}
                      className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-9 px-4")}
                    >
                      {copy.edit}
                    </Link>
                  )}
                  <ArchiveButton
                    action={setArchivedAction.bind(null, item.id, !archived)}
                    label={archived ? copy.restore : copy.archive}
                    confirmText={archived ? undefined : copy.archiveConfirm}
                  />
                </div>
              ) : null}
            </div>

            <p className="text-[0.9375rem] leading-[1.6] whitespace-pre-line text-foreground">{item.content}</p>

            <p className="text-sm text-muted-foreground">
              {item.indicatorKeys.length === 0 ? (
                copy.noSigns
              ) : (
                <>
                  <span className="font-medium text-heading">{copy.linkedTo}:</span>{" "}
                  {item.indicatorKeys.map(indicatorLabel).join(", ")}
                </>
              )}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
