"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { analysisResult } from "@/content/analysis";
import { reviewWorkspace as copy } from "@/content/review";
import { cn } from "@/lib/utils";
import type { ReviewActionState } from "@/server/review/actions";
import type { DermaVisionSkinAnalysis, SkinTypeValue } from "@/server/skin-api";

import { ActionMessage } from "./action-message";
import { formatDateTime } from "./format";

type Action = (state: ReviewActionState, formData: FormData) => Promise<ReviewActionState>;

type IndicatorsFormProps = {
  action: Action;
  aiResult: DermaVisionSkinAnalysis;
  // Current doctor values (after a previous validation), or null to start from the AI result.
  current: { detectedKeys: string[]; skinType: SkinTypeValue } | null;
  clinicalNotes: string | null;
  validatedAt: Date | null;
  readOnly: boolean;
};

const SKIN_TYPES: SkinTypeValue[] = ["oily", "dry", "normal", "combination"];
const SKIN_TYPE_NAMES: Record<SkinTypeValue, string> = {
  oily: "Oily",
  dry: "Dry",
  normal: "Normal",
  combination: "Combination",
};

/** Step 1: the doctor confirms or corrects each AI indicator and the skin type. */
export function IndicatorsForm({ action, aiResult, current, clinicalNotes, validatedAt, readOnly }: IndicatorsFormProps) {
  const [state, formAction, pending] = useActionState(action, { status: "idle" });
  const [detected, setDetected] = useState<Set<string>>(
    () =>
      new Set(current?.detectedKeys ?? aiResult.indicators.filter((indicator) => indicator.detected).map((i) => i.key)),
  );
  const [skinType, setSkinType] = useState<SkinTypeValue>(current?.skinType ?? aiResult.skinType.value);

  const corrections =
    aiResult.indicators.filter((indicator) => indicator.detected !== detected.has(indicator.key)).length +
    (skinType !== aiResult.skinType.value ? 1 : 0);

  function toggle(key: string, checked: boolean) {
    setDetected((previous) => {
      const next = new Set(previous);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  }

  return (
    <form action={formAction} className="flex flex-col gap-6" aria-describedby="indicators-description">
      <div>
        <h2 id="indicators-title" className="font-display text-[2rem] leading-[1.1]">
          {copy.indicators.title}
        </h2>
        <p id="indicators-description" className="mt-2 max-w-2xl text-foreground">
          {copy.indicators.description}
        </p>
      </div>

      <fieldset disabled={readOnly || pending} className="flex flex-col gap-6 disabled:opacity-90">
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-3 text-sm font-semibold text-heading">{copy.indicators.skinType}</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {SKIN_TYPES.map((type) => {
              const isAi = type === aiResult.skinType.value;
              const checked = type === skinType;
              return (
                <label
                  key={type}
                  className={cn(
                    "flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-md border px-4 py-2 transition-colors",
                    checked ? "border-primary bg-primary-soft/40" : "border-border bg-surface hover:border-border-strong",
                  )}
                >
                  <span className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="skinType"
                      value={type}
                      checked={checked}
                      onChange={() => setSkinType(type)}
                      className="size-4 accent-(--primary)"
                    />
                    <span className="font-medium text-heading">{SKIN_TYPE_NAMES[type]}</span>
                    {isAi ? (
                      <span className="rounded-full bg-ai-panel px-2 py-0.5 text-xs font-semibold text-ai-label">
                        {copy.indicators.aiSuggested}
                      </span>
                    ) : null}
                  </span>
                  <span className="tabular text-sm text-muted-foreground">
                    {percent(aiResult.skinType.confidenceByType[type])}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-3 text-sm font-semibold text-heading">{analysisResult.signs.overline}</legend>
          <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
            {aiResult.indicators.map((indicator) => {
              const isDetected = detected.has(indicator.key);
              const corrected = isDetected !== indicator.detected;
              const id = `indicator-${indicator.key}`;
              return (
                <li key={indicator.key} className={cn("flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3", corrected && "bg-marker-orange-soft/50")}>
                  <input
                    id={id}
                    type="checkbox"
                    name="detected"
                    value={indicator.key}
                    checked={isDetected}
                    onChange={(event) => toggle(indicator.key, event.target.checked)}
                    className="size-5 shrink-0 accent-(--primary)"
                  />
                  <label htmlFor={id} className="min-w-0 flex-1 cursor-pointer">
                    <span className="font-medium text-heading">{indicator.label}</span>
                    {indicator.zone ? (
                      <span className="text-sm text-muted-foreground"> · {analysisResult.zones[indicator.zone]}</span>
                    ) : null}
                  </label>
                  <span className="flex items-center gap-2 text-xs">
                    {corrected ? (
                      <span className="rounded-full bg-marker-orange-soft px-2 py-0.5 font-semibold text-marker-orange-text">
                        {copy.indicators.corrected}
                      </span>
                    ) : null}
                    <span className="tabular rounded-full bg-ai-panel px-2 py-0.5 text-ai-label">
                      {copy.indicators.aiSuggested}: {indicator.detected ? copy.indicators.present : "—"} ·{" "}
                      {percent(indicator.confidence)}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </fieldset>

        <div className="flex flex-col gap-2">
          <label htmlFor="clinicalNotes" className="text-sm font-semibold text-heading">
            {copy.indicators.notes}
            <span className="font-normal text-muted-foreground"> (optional)</span>
          </label>
          <textarea
            id="clinicalNotes"
            name="clinicalNotes"
            rows={4}
            maxLength={2000}
            defaultValue={clinicalNotes ?? ""}
            aria-describedby="clinicalNotes-hint"
            className="w-full rounded-md border border-border bg-surface px-4 py-3 text-base text-heading transition-colors hover:border-border-strong focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-ring"
          />
          <p id="clinicalNotes-hint" className="text-sm text-muted-foreground">
            {copy.indicators.notesHint}
          </p>
        </div>
      </fieldset>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-heading">{copy.indicators.corrections(corrections)}</span>
          {validatedAt ? (
            <>
              {" · "}
              {copy.indicators.validatedOn} <time dateTime={validatedAt.toISOString()}>{formatDateTime(validatedAt)}</time>
            </>
          ) : null}
        </p>
        {readOnly ? null : (
          <Button type="submit" disabled={pending}>
            {pending ? "…" : validatedAt ? copy.indicators.resubmit : copy.indicators.submit}
          </Button>
        )}
      </div>

      <ActionMessage state={state} />
    </form>
  );
}

function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}
