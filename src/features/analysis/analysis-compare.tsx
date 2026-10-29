import Link from "next/link";

import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { ButtonArrow, buttonVariants } from "@/components/ui/button";
import { analysisCompare as copy, analysisResult as resultCopy } from "@/content/analysis";
import { cn } from "@/lib/utils";
import type { DermaVisionSkinAnalysis, SkinIndicator } from "@/server/skin-api";

import { categoryTone, toneClasses } from "./analysis-result";
import { ResultPhoto } from "./result-photo";

export type CompareScan = {
  id: string;
  createdAt: Date;
  photoUrl: string;
  result: DermaVisionSkinAnalysis;
};

export type CompareOption = { id: string; label: string };

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" });

export function formatScanDate(date: Date) {
  return dateFormat.format(date);
}

/** Picker for the two scans. A plain GET form: works without JavaScript and keeps the choice in the URL. */
export function ComparePicker({
  options,
  firstId,
  secondId,
  error,
}: {
  options: CompareOption[];
  firstId?: string;
  secondId?: string;
  error?: string;
}) {
  return (
    <form
      action="/analysis/compare"
      method="get"
      className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5 shadow-sm sm:flex-row sm:items-end sm:p-6"
    >
      <ScanSelect name="a" label={copy.picker.first} options={options} defaultValue={firstId} />
      <ScanSelect name="b" label={copy.picker.second} options={options} defaultValue={secondId} />
      <button type="submit" className={buttonVariants({ className: "sm:mb-0" })}>
        {copy.picker.submit}
      </button>
      {error ? (
        <p role="alert" className="text-sm text-destructive sm:basis-full">
          {error}
        </p>
      ) : null}
    </form>
  );
}

function ScanSelect({
  name,
  label,
  options,
  defaultValue,
}: {
  name: string;
  label: string;
  options: CompareOption[];
  defaultValue?: string;
}) {
  return (
    <label className="flex flex-1 flex-col gap-2 text-sm font-medium text-heading">
      {label}
      <select
        name={name}
        defaultValue={defaultValue}
        className="h-12 rounded-md border border-input bg-background px-4 text-base font-normal text-heading transition-colors duration-(--duration-hover) hover:border-border-strong"
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Side-by-side comparison of two scans, built only from their mapped results. */
export function ScanComparison({ first, second }: { first: CompareScan; second: CompareScan }) {
  const firstDetected = detectedByKey(first.result);
  const secondDetected = detectedByKey(second.result);

  const common = [...secondDetected.keys()].filter((key) => firstDetected.has(key));
  const appeared = [...secondDetected.keys()].filter((key) => !firstDetected.has(key));
  const notDetected = [...firstDetected.keys()].filter((key) => !secondDetected.has(key));

  const sameSkinType = first.result.skinType.value === second.result.skinType.value;

  return (
    <div className="flex flex-col gap-12">
      {/* Photos */}
      <div className="grid gap-6 sm:grid-cols-2">
        <ScanColumn label={copy.picker.first} scan={first} />
        <ScanColumn label={copy.picker.second} scan={second} />
      </div>

      {/* Skin type */}
      <Reveal>
        <section
          aria-labelledby="compare-skin-type"
          className="relative isolate overflow-hidden rounded-xl border border-border bg-surface p-6 shadow-md sm:p-8"
        >
          <div aria-hidden="true" className="absolute -top-24 -right-24 -z-10 size-64 rounded-full bg-primary-soft/70 blur-3xl" />
          <p id="compare-skin-type" className="overline-text">
            {copy.skinType.overline}
          </p>
          <div className="mt-4 grid items-center gap-4 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
            <SkinTypeValue label={copy.picker.first} skinType={first.result.skinType} />
            <span aria-hidden="true" className="hidden text-primary sm:block">
              <svg viewBox="0 0 24 24" fill="none" className="size-6">
                <path d="M4 12h16M14 6l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <SkinTypeValue label={copy.picker.second} skinType={second.result.skinType} />
          </div>
          <p className="mt-5 text-sm text-muted-foreground">
            {sameSkinType ? copy.skinType.same : copy.skinType.different}
          </p>
        </section>
      </Reveal>

      {/* Signs */}
      <SignGroup
        id="compare-common"
        title={copy.groups.common.title}
        empty={copy.groups.common.empty}
        keys={common}
        first={first.result}
        second={second.result}
      />
      <SignGroup
        id="compare-appeared"
        title={copy.groups.appeared.title}
        empty={copy.groups.appeared.empty}
        keys={appeared}
        first={first.result}
        second={second.result}
      />
      <SignGroup
        id="compare-not-detected"
        title={copy.groups.notDetected.title}
        empty={copy.groups.notDetected.empty}
        keys={notDetected}
        first={first.result}
        second={second.result}
      />
    </div>
  );
}

function ScanColumn({ label, scan }: { label: string; scan: CompareScan }) {
  const date = formatScanDate(scan.createdAt);

  return (
    <Reveal className="flex flex-col gap-4">
      <ResultPhoto src={scan.photoUrl} alt={copy.photoAlt(label, date)} caption={label} />
      <div className="flex items-center justify-between gap-3">
        <time dateTime={scan.createdAt.toISOString()} className="text-sm font-medium text-heading">
          {date}
        </time>
        <Link href={`/analysis/${encodeURIComponent(scan.id)}`} className={buttonVariants({ variant: "link" })}>
          {copy.viewScan}
          <ButtonArrow />
        </Link>
      </div>
    </Reveal>
  );
}

function SkinTypeValue({ label, skinType }: { label: string; skinType: DermaVisionSkinAnalysis["skinType"] }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-[2rem] leading-[1.1] text-heading">{skinType.label}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        {copy.confidence} <span className="tabular font-semibold text-heading">{percent(skinType.confidence)}</span>
      </p>
    </div>
  );
}

function SignGroup({
  id,
  title,
  empty,
  keys,
  first,
  second,
}: {
  id: string;
  title: string;
  empty: string;
  keys: string[];
  first: DermaVisionSkinAnalysis;
  second: DermaVisionSkinAnalysis;
}) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4">
      <h2 id={id} className="font-display text-[2rem] leading-[1.1]">
        {title}
        <span className="tabular ml-3 align-middle font-sans text-base font-semibold text-muted-foreground">{keys.length}</span>
      </h2>

      {keys.length === 0 ? (
        <p className="rounded-lg border border-border bg-surface px-5 py-4 text-foreground">{empty}</p>
      ) : (
        <Stagger role="list" className="flex flex-col gap-3" interval={0.06}>
          {keys.map((key) => (
            <StaggerItem key={key} role="listitem">
              <CompareRow first={findIndicator(first, key)} second={findIndicator(second, key)} />
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </section>
  );
}

// One sign, with what each scan reported for it.
function CompareRow({ first, second }: { first?: SkinIndicator; second?: SkinIndicator }) {
  const indicator = (second ?? first)!;
  const tone = toneClasses[categoryTone[indicator.category as keyof typeof categoryTone] ?? "blue"];

  return (
    <article className="rounded-lg border border-border bg-surface px-5 py-4 transition-shadow duration-(--duration-hover) hover:shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className={cn("size-2.5 shrink-0 rounded-full", tone.dot)} />
          <h3 className="font-semibold text-heading">{indicator.label}</h3>
          {indicator.zone ? <span className="text-sm text-muted-foreground">{resultCopy.zones[indicator.zone]}</span> : null}
        </div>
        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", tone.chip)}>
          {resultCopy.categories[indicator.category]}
        </span>
      </div>

      <dl className="mt-4 grid gap-3 sm:grid-cols-2 sm:gap-6">
        <ScanConfidence label={copy.picker.first} indicator={first} barClass={tone.bar} />
        <ScanConfidence label={copy.picker.second} indicator={second} barClass={tone.bar} />
      </dl>
    </article>
  );
}

function ScanConfidence({
  label,
  indicator,
  barClass,
}: {
  label: string;
  indicator?: SkinIndicator;
  barClass: string;
}) {
  const noticed = indicator?.detected === true;

  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1.5 flex items-center gap-3">
        {noticed ? (
          <>
            <span className="h-1 flex-1 overflow-hidden rounded-full bg-surface-blush">
              <span
                className={cn("block h-full rounded-full", barClass)}
                style={{ width: `${Math.max(indicator.confidence * 100, 2)}%` }}
              />
            </span>
            <span className="tabular w-10 text-right text-sm font-medium text-heading">{percent(indicator.confidence)}</span>
          </>
        ) : (
          <span className="text-sm text-muted-foreground">{copy.notNoticed}</span>
        )}
      </dd>
    </div>
  );
}

function detectedByKey(result: DermaVisionSkinAnalysis) {
  return new Map(result.indicators.filter((indicator) => indicator.detected).map((indicator) => [indicator.key, indicator]));
}

function findIndicator(result: DermaVisionSkinAnalysis, key: string) {
  return result.indicators.find((indicator) => indicator.key === key);
}

function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}
