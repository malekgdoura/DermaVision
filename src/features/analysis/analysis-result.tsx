import Link from "next/link";

import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { buttonVariants } from "@/components/ui/button";
import { analysisResult as copy } from "@/content/analysis";
import { routes } from "@/content/home";
import { patientReport } from "@/content/review";
import { formatDate } from "@/features/review/format";
import { ReportText } from "@/features/review/report-text";
import { cn } from "@/lib/utils";
import type {
  DermaVisionSkinAnalysis,
  SkinIndicator,
  SkinIndicatorCategory,
  SkinTypeValue,
} from "@/server/skin-api";

import { ResultPhoto } from "./result-photo";

export type AnalysisStatusValue = keyof typeof copy.status;

/** Report published by the dermatologist; its findings replace the AI result on the page. */
export type PublishedReport = {
  content: string;
  publishedAt: Date;
  doctor: { prenom: string; nom: string } | null;
};

type AnalysisResultProps = {
  status: AnalysisStatusValue;
  createdAt: Date;
  photoUrl: string;
  result: DermaVisionSkinAnalysis | null;
  report?: PublishedReport | null;
};

const LOW_CONFIDENCE = 0.6;
const CLOSE_CALL_GAP = 0.1;

type Tone = "rose" | "orange" | "blue";

export const categoryTone: Record<Exclude<SkinIndicatorCategory, "skin-type">, Tone> = {
  inflammation: "rose",
  pigmentation: "orange",
  texture: "blue",
  wrinkles: "blue",
  "eye-area": "orange",
};

export const toneClasses: Record<Tone, { dot: string; chip: string; bar: string }> = {
  rose: { dot: "bg-marker-rose", chip: "bg-marker-rose-soft text-marker-rose-text", bar: "bg-marker-rose" },
  orange: { dot: "bg-marker-orange", chip: "bg-marker-orange-soft text-marker-orange-text", bar: "bg-marker-orange" },
  blue: { dot: "bg-marker-blue", chip: "bg-marker-blue-soft text-marker-blue-text", bar: "bg-marker-blue" },
};

const statusClasses: Record<AnalysisStatusValue, string> = {
  PROCESSING: "bg-surface-blush text-heading",
  AI_DONE: "bg-ai-panel text-ai-label",
  IN_REVIEW: "bg-marker-blue-soft text-marker-blue-text",
  FAILED: "bg-destructive/8 text-destructive",
  VALIDATED: "bg-success/10 text-success",
};

const skinTypeOrder: SkinTypeValue[] = ["oily", "dry", "normal", "combination"];
const skinTypeLabel: Record<SkinTypeValue, string> = {
  oily: "Oily",
  dry: "Dry",
  normal: "Normal",
  combination: "Combination",
};

/** Result of one skin analysis, built only from the mapped DermaVision result. */
export function AnalysisResult({ status, createdAt, photoUrl, result, report = null }: AnalysisResultProps) {
  const disclaimer = report ? patientReport.disclaimer : copy.disclaimer;

  const date = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(createdAt);

  return (
    <div className="flex flex-col gap-10">
      <Reveal className="flex flex-col gap-5">
        <p className="overline-text">{copy.overline}</p>
        <h1 id="result-title" className="font-display text-[2.5rem] leading-[1.08] sm:text-5xl">
          {copy.title}
        </h1>
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span>
            {copy.analyzedOn} <time dateTime={createdAt.toISOString()}>{date}</time>
          </span>
          <StatusBadge status={status} />
        </div>

        <div className={cn("flex gap-3 rounded-lg px-5 py-4", report ? "bg-success/10" : "bg-ai-panel")}>
          <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" className={cn("mt-0.5 size-4 shrink-0", report ? "text-success" : "text-ai-label")}>
            <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.4" />
            <path d="M8 7.25v3.5M8 5.25v.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <div className="text-[0.9375rem]">
            <p className={cn("font-semibold", report ? "text-success" : "text-ai-label")}>{disclaimer.title}</p>
            <p className="mt-1 text-foreground">{disclaimer.text}</p>
          </div>
        </div>
      </Reveal>

      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14">
        <div className="lg:sticky lg:top-32">
          <ResultPhoto src={photoUrl} alt={copy.photoAlt} caption={copy.photoCaption} />
        </div>

        <div className="flex flex-col gap-8">
          {report ? <DoctorReport report={report} /> : null}
          {result ? <Findings result={result} reviewed={Boolean(report)} /> : <Unavailable status={status} />}
        </div>
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: AnalysisStatusValue }) {
  return (
    <span className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1 text-[0.8125rem] font-medium", statusClasses[status])}>
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {copy.status[status]}
    </span>
  );
}

function DoctorReport({ report }: { report: PublishedReport }) {
  return (
    <Reveal>
      <section
        aria-labelledby="report-title"
        className="relative overflow-hidden rounded-xl border border-border bg-surface p-6 shadow-md sm:p-8"
      >
        <p className="overline-text">{patientReport.overline}</p>
        <h2 id="report-title" className="mt-2 font-display text-[2rem] leading-[1.1]">
          {patientReport.title}
        </h2>
        <ReportText content={report.content} className="mt-5" />
        <footer className="mt-6 flex flex-col gap-1 border-t border-border pt-4 text-sm">
          {report.doctor ? (
            <p className="font-semibold text-heading">{patientReport.reviewedBy(`${report.doctor.prenom} ${report.doctor.nom}`)}</p>
          ) : null}
          <p className="text-muted-foreground">
            {patientReport.publishedOn} <time dateTime={report.publishedAt.toISOString()}>{formatDate(report.publishedAt)}</time>
          </p>
        </footer>
      </section>
    </Reveal>
  );
}

function Findings({ result, reviewed }: { result: DermaVisionSkinAnalysis; reviewed: boolean }) {
  const detected = result.indicators.filter((indicator) => indicator.detected);
  const notDetected = result.indicators.filter((indicator) => !indicator.detected);

  return (
    <div className="flex flex-col gap-8">
      <SkinTypeCard skinType={result.skinType} />

      <section aria-labelledby="signs-title" className="flex flex-col gap-5">
        <div>
          <p className="overline-text">{copy.signs.overline}</p>
          <h2 id="signs-title" className="mt-2 font-display text-[2rem] leading-[1.1]">
            {reviewed ? patientReport.signsTitle : copy.signs.title}
            <span className="tabular ml-3 align-middle font-sans text-base font-semibold text-muted-foreground">
              {detected.length}
            </span>
          </h2>
        </div>

        {detected.length > 0 ? (
          <Stagger className="flex flex-col gap-3" interval={0.08}>
            {detected.map((indicator) => (
              <StaggerItem key={indicator.key}>
                <SignRow indicator={indicator} />
              </StaggerItem>
            ))}
          </Stagger>
        ) : (
          <p className="rounded-lg border border-border bg-surface px-5 py-4 text-foreground">{copy.signs.none}</p>
        )}

        {notDetected.length > 0 ? (
          <div className="mt-2">
            <h3 className="text-sm font-semibold text-heading">{copy.signs.notDetectedTitle}</h3>
            <ul className="mt-3 flex flex-wrap gap-2">
              {notDetected.map((indicator) => (
                <li
                  key={indicator.key}
                  className="rounded-full border border-border bg-surface px-3 py-1 text-[0.8125rem] text-muted-foreground"
                >
                  {indicator.label}
                  {indicator.zone ? ` · ${copy.zones[indicator.zone]}` : ""}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <NextSteps />
    </div>
  );
}

function SkinTypeCard({ skinType }: { skinType: DermaVisionSkinAnalysis["skinType"] }) {
  const ranked = [...skinTypeOrder].sort((a, b) => skinType.confidenceByType[b] - skinType.confidenceByType[a]);
  const closeCall =
    skinType.confidenceByType[ranked[0]] - skinType.confidenceByType[ranked[1]] < CLOSE_CALL_GAP;

  return (
    <Reveal>
      <section
        aria-labelledby="skin-type-title"
        className="relative overflow-hidden rounded-xl border border-border bg-surface p-6 shadow-md sm:p-8"
      >
        {/* Soft depth glow */}
        <div
          aria-hidden="true"
          className="absolute -top-24 -right-24 size-64 rounded-full bg-primary-soft/70 blur-3xl"
        />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="overline-text">{copy.skinType.overline}</p>
            <h2 id="skin-type-title" className="mt-2 font-display text-[2.5rem] leading-[1.05] sm:text-5xl">
              {skinType.label}
            </h2>
          </div>
          {isCorrected(skinType) ? (
            <CorrectedBadge />
          ) : (
            <p className="text-sm text-muted-foreground">
              {copy.skinType.confidence}{" "}
              <span className="tabular text-base font-semibold text-heading">{percent(skinType.confidence)}</span>
            </p>
          )}
        </div>

        <div className="relative mt-7">
          <p className="text-sm font-medium text-heading">{copy.skinType.breakdown}</p>
          <dl className="mt-3 flex flex-col gap-2.5">
            {skinTypeOrder.map((type) => {
              const value = skinType.confidenceByType[type];
              const selected = type === skinType.value;
              return (
                <div key={type} className="grid grid-cols-[6.5rem_minmax(0,1fr)_3rem] items-center gap-3">
                  <dt className={cn("text-sm", selected ? "font-semibold text-heading" : "text-muted-foreground")}>
                    {skinTypeLabel[type]}
                  </dt>
                  <dd className="h-1.5 overflow-hidden rounded-full bg-surface-blush">
                    <span
                      className={cn("block h-full rounded-full", selected ? "bg-primary" : "bg-border-strong")}
                      style={{ width: `${Math.max(value * 100, 2)}%` }}
                    />
                  </dd>
                  <dd className="tabular text-right text-sm text-muted-foreground">{percent(value)}</dd>
                </div>
              );
            })}
          </dl>
          {closeCall && !isCorrected(skinType) ? <p className="mt-4 text-sm text-muted-foreground">{copy.skinType.closeCall}</p> : null}
        </div>
      </section>
    </Reveal>
  );
}

function SignRow({ indicator }: { indicator: SkinIndicator }) {
  const tone = toneClasses[categoryTone[indicator.category as keyof typeof categoryTone] ?? "blue"];
  const corrected = isCorrected(indicator);
  const low = !corrected && indicator.confidence < LOW_CONFIDENCE;

  return (
    <article className="group relative overflow-hidden rounded-lg border border-border bg-surface px-5 py-4 transition-shadow duration-(--duration-hover) hover:shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className={cn("size-2.5 shrink-0 rounded-full", tone.dot)} />
          <h3 className="font-semibold text-heading">{indicator.label}</h3>
          {indicator.zone ? <span className="text-sm text-muted-foreground">{copy.zones[indicator.zone]}</span> : null}
          {corrected ? <CorrectedBadge /> : null}
        </div>
        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", tone.chip)}>
          {copy.categories[indicator.category]}
        </span>
      </div>

      {/* The AI confidence says nothing about a sign the dermatologist added. */}
      {corrected ? null : (
        <div className="mt-3 flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{copy.signs.confidence}</span>
          <span className="h-1 flex-1 overflow-hidden rounded-full bg-surface-blush">
            <span
              className={cn("block h-full rounded-full", low ? "bg-border-strong" : tone.bar)}
              style={{ width: `${Math.max(indicator.confidence * 100, 2)}%` }}
            />
          </span>
          <span className="tabular w-10 text-right text-sm font-medium text-heading">{percent(indicator.confidence)}</span>
        </div>
      )}
      {low ? <p className="mt-2 text-xs text-warning">{copy.signs.lowConfidence}</p> : null}
    </article>
  );
}

function CorrectedBadge() {
  return (
    <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
      {patientReport.correctedBadge}
    </span>
  );
}

// Doctor-corrected values carry `corrected: true` (see server/review/corrections.ts).
function isCorrected(value: object): boolean {
  return "corrected" in value && value.corrected === true;
}

function NextSteps() {
  return (
    <Reveal>
      <section aria-labelledby="next-title" className="flex flex-col gap-4 rounded-xl bg-surface-blush p-6 sm:p-8">
        <h2 id="next-title" className="font-display text-[2rem] leading-[1.1]">
          {copy.next.title}
        </h2>
        <p className="max-w-lg text-foreground">{copy.next.text}</p>
        <div className="mt-1 flex flex-col gap-3 sm:flex-row">
          <Link href={routes.book} className={buttonVariants()}>
            {copy.next.book}
          </Link>
          <Link href={routes.analysis} className={buttonVariants({ variant: "secondary" })}>
            {copy.next.newAnalysis}
          </Link>
        </div>
      </section>
    </Reveal>
  );
}

function Unavailable({ status }: { status: AnalysisStatusValue }) {
  const text =
    status === "PROCESSING" || status === "FAILED" ? copy.unavailable[status] : copy.unavailable.missing;

  return (
    <div className="flex flex-col items-start gap-4 rounded-xl bg-surface-blush p-8">
      <p className="text-lg text-foreground">{text}</p>
      <Link href={routes.analysis} className={buttonVariants({ variant: "secondary" })}>
        {copy.next.newAnalysis}
      </Link>
    </div>
  );
}

function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}
