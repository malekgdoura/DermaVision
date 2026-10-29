"use client";

import { Lock, Sparkles } from "lucide-react";
import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { recommendationPicker } from "@/content/recommendations";
import { reviewWorkspace } from "@/content/review";
import { RecommendationPicker, type RecommendationOption } from "@/features/recommendations/recommendation-picker";
import { cn } from "@/lib/utils";
import type { ReviewActionState } from "@/server/review/actions";

import { ActionMessage } from "./action-message";
import { VersionHistory, type ReportVersionView } from "./version-history";

const copy = reviewWorkspace.report;

type Action = (state: ReviewActionState, formData: FormData) => Promise<ReviewActionState>;
type Style = keyof typeof copy.styles;
type Language = keyof typeof copy.languages;

type ReportStudioProps = {
  actions: { generate: Action; save: Action; publish: Action };
  // Newest first.
  versions: ReportVersionView[];
  // Indicators validated by the assigned doctor: the report can be drafted.
  unlocked: boolean;
  readOnly: boolean;
  // Library advice for this patient (suggested first). Empty lists when the library is empty.
  recommendations: { suggested: RecommendationOption[]; others: RecommendationOption[] };
};

const idle: ReviewActionState = { status: "idle" };

/** Steps 2 and 3: AI draft, mandatory manual edit, publication, with every version kept. */
export function ReportStudio({ actions, versions, unlocked, readOnly, recommendations }: ReportStudioProps) {
  const latest = versions[0] ?? null;

  const [generateState, generate, generating] = useActionState(actions.generate, idle);
  const [saveState, save, saving] = useActionState(actions.save, idle);
  const [publishState, publish, publishing] = useActionState(actions.publish, idle);

  const [text, setText] = useState(latest?.content ?? "");
  const [style, setStyle] = useState<Style>(latest?.style ?? "PATIENT_FRIENDLY");
  const [language, setLanguage] = useState<Language>(asLanguage(latest?.language));
  const [confirmed, setConfirmed] = useState(false);
  // Each action keeps its own state: show the message of the button clicked last.
  const [lastAction, setLastAction] = useState<"generate" | "save" | "publish" | null>(null);
  const [selectedRecommendations, setSelectedRecommendations] = useState<Set<string>>(new Set());

  function toggleRecommendation(id: string, checked: boolean) {
    setSelectedRecommendations((previous) => {
      const next = new Set(previous);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  // Appends the chosen advice as a bullet list under a "What you can do" heading.
  function insertRecommendations(options: RecommendationOption[]) {
    const heading = recommendationPicker.insertHeading[language];
    const bullets = options.map((option) => `- ${option.content.replace(/\s*\n\s*/g, " ")}`).join("\n");
    setText((current) => `${current.trimEnd()}${current.trim() ? "\n\n" : ""}${heading}\n${bullets}`);
  }

  // A new version arrived from the server (draft generated, version saved): show it in the editor.
  const [shownVersionId, setShownVersionId] = useState(latest?.id ?? null);
  if ((latest?.id ?? null) !== shownVersionId) {
    setShownVersionId(latest?.id ?? null);
    setText(latest?.content ?? "");
    if (latest) {
      setStyle(latest.style);
      setLanguage(asLanguage(latest.language));
    }
    setConfirmed(false);
  }

  const busy = generating || saving || publishing;
  const dirty = text.trim() !== (latest?.content ?? "").trim();
  const isUneditedAiDraft = versions.some(
    (version) => version.kind === "AI_DRAFT" && normalize(version.content) === normalize(text),
  );
  // Why "Publish" is disabled, shown under the button so the doctor knows what to do.
  const publishBlocker = !text.trim()
    ? copy.blockers.empty
    : isUneditedAiDraft
      ? copy.blockers.uneditedDraft
      : !confirmed
        ? copy.blockers.confirm
        : null;
  const lastState = lastAction ? { generate: generateState, save: saveState, publish: publishState }[lastAction] : null;

  if (!unlocked && versions.length === 0) {
    return (
      <section aria-labelledby="report-title" className="flex flex-col gap-4">
        <h2 id="report-title" className="font-display text-[2rem] leading-[1.1]">
          {copy.title}
        </h2>
        <p className="flex items-start gap-3 rounded-lg border border-dashed border-border-strong bg-surface/60 px-5 py-4 text-foreground">
          <Lock aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" strokeWidth={1.8} />
          {copy.locked}
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="report-title" className="flex flex-col gap-6">
      <h2 id="report-title" className="font-display text-[2rem] leading-[1.1]">
        {copy.title}
      </h2>

      {readOnly ? null : (
        // No form `action`: each button submits to its own Server Action through `formAction`.
        <form className="flex flex-col gap-6">
          <fieldset disabled={busy} className="flex flex-col gap-4 rounded-lg bg-ai-panel p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                name="style"
                label={copy.style}
                value={style}
                onChange={(value) => setStyle(value as Style)}
                options={copy.styles}
              />
              <Select
                name="language"
                label={copy.language}
                value={language}
                onChange={(value) => setLanguage(value as Language)}
                options={copy.languages}
              />
            </div>
            <RecommendationPicker
              suggested={recommendations.suggested}
              others={recommendations.others}
              language={language}
              selected={selectedRecommendations}
              onToggle={toggleRecommendation}
              onInsert={insertRecommendations}
            />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-ai-label">{copy.generateHint}</p>
              <Button
                type="submit"
                variant="secondary"
                size="sm"
                formAction={generate}
                onClick={(event) => {
                  if (dirty && !window.confirm(copy.unsavedWarning)) event.preventDefault();
                  else setLastAction("generate");
                }}
              >
                <Sparkles aria-hidden="true" />
                {generating ? copy.generating : versions.length > 0 ? copy.regenerate : copy.generate}
              </Button>
            </div>
          </fieldset>

          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label htmlFor="content" className="text-sm font-semibold text-heading">
                {copy.editorLabel}
              </label>
              <span className="flex items-center gap-2 text-xs">
                {isUneditedAiDraft ? (
                  <span className="rounded-full bg-ai-panel px-2 py-0.5 font-semibold text-ai-label">{copy.aiDraftBadge}</span>
                ) : null}
                {dirty ? (
                  <span className="rounded-full bg-marker-orange-soft px-2 py-0.5 font-semibold text-marker-orange-text">
                    {copy.unsaved}
                  </span>
                ) : null}
                <span className="tabular text-muted-foreground">{copy.chars(text.length)}</span>
              </span>
            </div>
            <textarea
              id="content"
              name="content"
              rows={16}
              maxLength={8000}
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder={copy.empty}
              aria-describedby="content-hint"
              readOnly={busy}
              className="w-full rounded-md border border-border bg-surface px-4 py-3 font-sans text-base leading-[1.6] text-heading transition-colors hover:border-border-strong focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-ring"
            />
            <p id="content-hint" className="text-sm text-muted-foreground">
              {copy.editorHint}
            </p>
          </div>

          <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-5">
            <label className="flex cursor-pointer items-start gap-3 text-[0.9375rem] text-heading">
              <input
                type="checkbox"
                name="confirmed"
                checked={confirmed}
                onChange={(event) => setConfirmed(event.target.checked)}
                className="mt-0.5 size-5 shrink-0 accent-(--primary)"
              />
              {copy.confirm}
            </label>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button type="submit" variant="secondary" formAction={save} onClick={() => setLastAction("save")} disabled={busy || !text.trim()}>
                {saving ? copy.saving : copy.save}
              </Button>
              <Button
                type="submit"
                formAction={publish}
                onClick={() => setLastAction("publish")}
                disabled={busy || publishBlocker !== null}
                aria-describedby={publishBlocker ? "publish-blocker" : undefined}
              >
                {publishing ? copy.publishing : copy.publish}
              </Button>
            </div>
            {publishBlocker ? (
              <p id="publish-blocker" className="text-right text-sm text-muted-foreground">
                {publishBlocker}
              </p>
            ) : null}
          </div>

          {lastState ? <ActionMessage state={lastState} /> : null}
        </form>
      )}

      <VersionHistory
        versions={versions}
        onLoad={
          readOnly
            ? undefined
            : (version) => {
                setText(version.content);
                setStyle(version.style);
                setLanguage(asLanguage(version.language));
              }
        }
      />
    </section>
  );
}

function Select({
  name,
  label,
  value,
  onChange,
  options,
}: {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Record<string, string>;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={name} className="text-sm font-semibold text-heading">
        {label}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "h-12 w-full cursor-pointer rounded-md border border-border bg-surface px-4 text-base text-heading",
          "hover:border-border-strong focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-ring",
        )}
      >
        {Object.entries(options).map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </div>
  );
}

function asLanguage(value: string | undefined): Language {
  return value === "fr" ? "fr" : "en";
}

function normalize(text: string) {
  return text.replace(/\s+/g, " ").trim();
}
