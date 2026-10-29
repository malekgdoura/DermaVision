import Link from "next/link";

import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { ButtonArrow, buttonVariants } from "@/components/ui/button";
import { analysisHistory as copy, analysisResult as resultCopy } from "@/content/analysis";
import { routes } from "@/content/home";
import { cn } from "@/lib/utils";
import type { DermaVisionSkinAnalysis } from "@/server/skin-api";

import { categoryTone, StatusBadge, toneClasses, type AnalysisStatusValue } from "./analysis-result";

export type AnalysisHistoryItem = {
  id: string;
  status: AnalysisStatusValue;
  createdAt: Date;
  photoUrl: string;
  result: DermaVisionSkinAnalysis | null;
};

const FACE_RADIUS = "50% 50% 46% 46% / 40% 40% 60% 60%";
const MAX_SIGNS = 3;

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" });
const timeFormat = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" });

/** Patient's analyses as a vertical "scan log", newest first. */
export function AnalysisHistory({ items }: { items: AnalysisHistoryItem[] }) {
  if (items.length === 0) return <EmptyHistory />;

  return (
    <Stagger role="list" className="relative flex flex-col gap-5" interval={0.07}>
      {/* Timeline spine */}
      <span
        aria-hidden="true"
        className="absolute top-6 bottom-6 left-[1.0625rem] hidden w-px bg-gradient-to-b from-primary/40 via-border-strong to-transparent sm:block"
      />
      {items.map((item, index) => (
        <StaggerItem key={item.id} role="listitem" className="relative sm:pl-12">
          <TimelineDot latest={index === 0} />
          <HistoryCard item={item} />
        </StaggerItem>
      ))}
    </Stagger>
  );
}

function TimelineDot({ latest }: { latest: boolean }) {
  return (
    <span aria-hidden="true" className="absolute top-8 left-2.5 hidden size-4 items-center justify-center sm:flex">
      {latest ? <span className="absolute size-4 rounded-full bg-primary/20" /> : null}
      <span className={cn("size-2.5 rounded-full ring-4 ring-background", latest ? "bg-primary" : "bg-border-strong")} />
    </span>
  );
}

function HistoryCard({ item }: { item: AnalysisHistoryItem }) {
  const date = dateFormat.format(item.createdAt);
  const detected = item.result?.indicators.filter((indicator) => indicator.detected) ?? [];
  const shown = detected.slice(0, MAX_SIGNS);
  const href = `/analysis/${encodeURIComponent(item.id)}`;

  return (
    <article
        aria-labelledby={`analysis-${item.id}`}
        className={cn(
          "group relative isolate overflow-hidden rounded-xl border border-border bg-surface p-5 shadow-sm sm:p-6",
          "transition-[box-shadow,transform,border-color] duration-(--duration-component) ease-out-soft",
          "hover:-translate-y-0.5 hover:border-border-strong hover:shadow-lg",
        )}
      >
        {/* Depth glow, stronger on hover */}
        <div
          aria-hidden="true"
          className="absolute -top-20 -right-16 -z-10 size-56 rounded-full bg-primary-soft/50 blur-3xl transition-opacity duration-(--duration-component) group-hover:opacity-100 sm:opacity-60"
        />

        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
          <Thumbnail src={item.photoUrl} alt={copy.photoAlt(date)} />

          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
              <time dateTime={item.createdAt.toISOString()}>
                {date} · <span className="tabular">{timeFormat.format(item.createdAt)}</span>
              </time>
              <StatusBadge status={item.status} />
            </div>

            <h2 id={`analysis-${item.id}`} className="font-display text-[1.875rem] leading-[1.1]">
              {item.result ? item.result.skinType.label : resultCopy.status[item.status]}
            </h2>

            {item.result ? (
              detected.length > 0 ? (
                <ul className="flex flex-wrap gap-2">
                  {shown.map((indicator) => {
                    const tone = toneClasses[categoryTone[indicator.category as keyof typeof categoryTone] ?? "blue"];
                    return (
                      <li
                        key={indicator.key}
                        className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.8125rem] font-medium", tone.chip)}
                      >
                        <span aria-hidden="true" className={cn("size-1.5 rounded-full", tone.dot)} />
                        {indicator.label}
                        {indicator.zone ? <span className="opacity-75">· {resultCopy.zones[indicator.zone]}</span> : null}
                      </li>
                    );
                  })}
                  {detected.length > MAX_SIGNS ? (
                    <li className="rounded-full border border-border px-3 py-1 text-[0.8125rem] text-muted-foreground">
                      {copy.moreSigns(detected.length - MAX_SIGNS)}
                    </li>
                  ) : null}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">{copy.noSigns}</p>
              )
            ) : item.status === "PROCESSING" || item.status === "FAILED" ? (
              <p className="text-sm text-muted-foreground">{copy.pending[item.status]}</p>
            ) : null}
          </div>

          <Link
            href={href}
            className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "self-start sm:self-center")}
          >
            {copy.view}
            <ButtonArrow />
          </Link>
        </div>
    </article>
  );
}

// Small version of the scanner window: egg-shaped photo with a tilted ring for depth.
function Thumbnail({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative flex size-28 shrink-0 items-center justify-center" style={{ perspective: 600 }}>
      <span
        aria-hidden="true"
        className="absolute size-28 rounded-full border border-primary/25 transition-transform duration-(--duration-reveal) ease-out-soft group-hover:rotate-[24deg]"
        style={{ transform: "rotateX(70deg)" }}
      />
      <span aria-hidden="true" className="absolute size-24 rounded-full bg-surface-blush" />
      <div
        className="relative h-[5.5rem] w-[4.4rem] overflow-hidden bg-surface-blush shadow-md ring-1 ring-border-strong/60 transition-transform duration-(--duration-component) ease-out-soft group-hover:scale-[1.04]"
        style={{ borderRadius: FACE_RADIUS }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- private photo served by a protected route, not optimizable */}
        <img src={src} alt={alt} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
      </div>
    </div>
  );
}

function EmptyHistory() {
  return (
    <Reveal>
      <div className="relative isolate flex flex-col items-center gap-5 overflow-hidden rounded-xl border border-border bg-surface px-6 py-16 text-center shadow-sm sm:px-12">
        <div
          aria-hidden="true"
          className="absolute top-1/2 left-1/2 -z-10 size-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-soft/50 blur-3xl"
        />
        {/* Empty scanner window */}
        <div className="relative flex size-32 items-center justify-center" style={{ perspective: 600 }}>
          <span
            aria-hidden="true"
            className="absolute size-32 rounded-full border border-dashed border-primary/35"
            style={{ transform: "rotateX(70deg)" }}
          />
          <span
            aria-hidden="true"
            className="h-24 w-[4.8rem] border border-primary/35 bg-surface-blush"
            style={{ borderRadius: FACE_RADIUS }}
          />
        </div>
        <h2 className="font-display text-[2rem] leading-[1.1]">{copy.empty.title}</h2>
        <p className="max-w-md text-foreground">{copy.empty.text}</p>
        <Link href={routes.analysis} className={buttonVariants({ className: "mt-2" })}>
          {copy.empty.cta}
          <ButtonArrow />
        </Link>
      </div>
    </Reveal>
  );
}
