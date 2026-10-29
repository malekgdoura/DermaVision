"use client";

import { BookOpenCheck } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { routes } from "@/content/home";
import { recommendationPicker as copy } from "@/content/recommendations";

export type RecommendationOption = {
  id: string;
  title: string;
  content: string;
  language: string;
  // Labels of the patient's signs this advice answers (empty for the "others" list).
  matchedLabels: string[];
};

type RecommendationPickerProps = {
  suggested: RecommendationOption[];
  others: RecommendationOption[];
  language: string;
  selected: ReadonlySet<string>;
  onToggle: (id: string, checked: boolean) => void;
  onInsert: (options: RecommendationOption[]) => void;
};

/**
 * Library advice for this report, in the report's language: the ones matching the validated signs first.
 * Ticked ids are submitted with the draft request (name="recommendationIds").
 */
export function RecommendationPicker({ suggested, others, language, selected, onToggle, onInsert }: RecommendationPickerProps) {
  const inLanguage = (options: RecommendationOption[]) => options.filter((option) => option.language === language);
  const shownSuggested = inLanguage(suggested);
  const shownOthers = inLanguage(others);
  const chosen = [...shownSuggested, ...shownOthers].filter((option) => selected.has(option.id));

  return (
    <div className="flex flex-col gap-3 rounded-md border border-ai-label/20 bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-heading">
            <BookOpenCheck aria-hidden="true" className="size-4 text-primary" strokeWidth={1.8} />
            {copy.title}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{copy.description}</p>
        </div>
        <Link href={routes.recommendations} className="text-sm font-medium text-primary underline-offset-4 hover:underline">
          {copy.manage}
        </Link>
      </div>

      {shownSuggested.length === 0 && shownOthers.length === 0 ? (
        <p className="text-sm text-muted-foreground">{copy.none}</p>
      ) : (
        <>
          <OptionGroup title={copy.suggested} options={shownSuggested} selected={selected} onToggle={onToggle} highlight />
          {shownOthers.length > 0 ? (
            <details open={shownSuggested.length === 0}>
              <summary className="cursor-pointer text-sm font-medium text-heading">
                {copy.others} <span className="tabular text-muted-foreground">{shownOthers.length}</span>
              </summary>
              <OptionGroup options={shownOthers} selected={selected} onToggle={onToggle} />
            </details>
          ) : null}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="tabular text-sm text-muted-foreground">{copy.selected(chosen.length)}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 px-4"
              disabled={chosen.length === 0}
              onClick={() => onInsert(chosen)}
            >
              {copy.insert}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function OptionGroup({
  title,
  options,
  selected,
  onToggle,
  highlight = false,
}: {
  title?: string;
  options: RecommendationOption[];
  selected: ReadonlySet<string>;
  onToggle: (id: string, checked: boolean) => void;
  highlight?: boolean;
}) {
  if (options.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      {title ? <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{title}</p> : null}
      <ul className="flex flex-col gap-2">
        {options.map((option) => (
          <li key={option.id}>
            <label
              className={`flex cursor-pointer items-start gap-3 rounded-md px-3 py-2 ${highlight ? "bg-primary-soft/30" : "bg-surface-blush/50"}`}
            >
              <input
                type="checkbox"
                name="recommendationIds"
                value={option.id}
                checked={selected.has(option.id)}
                onChange={(event) => onToggle(option.id, event.target.checked)}
                className="mt-1 size-4 shrink-0 accent-(--primary)"
              />
              <span className="min-w-0 text-sm">
                <span className="font-semibold text-heading">{option.title}</span>
                {option.matchedLabels.length > 0 ? (
                  <span className="text-muted-foreground"> · {option.matchedLabels.join(", ")}</span>
                ) : null}
                <span className="mt-0.5 block text-foreground">{option.content}</span>
              </span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
