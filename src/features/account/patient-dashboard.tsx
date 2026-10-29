import {
  CalendarDays,
  Columns2,
  FileText,
  FlaskConical,
  History,
  Lock,
  ScanFace,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { ButtonArrow } from "@/components/ui/button";
import { authContent } from "@/content/auth";
import { routes } from "@/content/home";
import { StatusBadge, type AnalysisStatusValue } from "@/features/analysis/analysis-result";
import { cn } from "@/lib/utils";

const copy = authContent.patientDashboard;
const FACE_RADIUS = "50% 50% 46% 46% / 40% 40% 60% 60%";

type PatientDashboardProps = {
  name: string;
  analysisCount: number;
  comparableCount: number;
  latestStatus: AnalysisStatusValue | null;
  reviewedCount: number;
};

type Tone = "rose" | "orange" | "blue";

const toneTile: Record<Tone, string> = {
  rose: "bg-marker-rose-soft text-marker-rose-text",
  orange: "bg-marker-orange-soft text-marker-orange-text",
  blue: "bg-marker-blue-soft text-marker-blue-text",
};

const upcoming: { key: "appointments" | "products" | "documents"; icon: LucideIcon; tone: Tone; number: string }[] = [
  { key: "appointments", icon: CalendarDays, tone: "orange", number: "05" },
  { key: "products", icon: FlaskConical, tone: "rose", number: "06" },
  { key: "documents", icon: FileText, tone: "blue", number: "07" },
];

/** Patient home: one grid with every DermaVision module, active ones first. */
export function PatientDashboard({ name, analysisCount, comparableCount, latestStatus, reviewedCount }: PatientDashboardProps) {
  const canCompare = comparableCount >= 2;

  return (
    <div className="flex flex-col gap-10">
      <Reveal className="flex flex-col gap-3">
        <p className="overline-text">{copy.overline}</p>
        <h1 id="account-title" className="font-display text-[2.5rem] leading-[1.08] sm:text-5xl">
          {copy.welcome} {name}
        </h1>
        <p className="max-w-xl text-lg leading-[1.6] text-foreground">{copy.description}</p>
      </Reveal>

      <Stagger role="list" aria-label={copy.modulesTitle} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5" interval={0.06}>
        <StaggerItem role="listitem" className="sm:col-span-2">
          <SkinAnalysisCard />
        </StaggerItem>

        <StaggerItem role="listitem">
          <ModuleCard
            href="/analysis"
            number="02"
            icon={History}
            title={copy.modules.myAnalyses.title}
            text={copy.modules.myAnalyses.text}
            footer={<ModuleCta label={copy.modules.myAnalyses.cta} />}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="tabular text-sm font-medium text-heading">{copy.modules.myAnalyses.count(analysisCount)}</span>
              {latestStatus ? <StatusBadge status={latestStatus} /> : null}
            </div>
          </ModuleCard>
        </StaggerItem>

        <StaggerItem role="listitem">
          <ModuleCard
            href="/analysis/compare"
            number="03"
            icon={Columns2}
            title={copy.modules.compare.title}
            text={copy.modules.compare.text}
            footer={<ModuleCta label={copy.modules.compare.cta} />}
          >
            {canCompare ? null : <p className="text-sm text-muted-foreground">{copy.modules.compare.locked}</p>}
          </ModuleCard>
        </StaggerItem>

        <StaggerItem role="listitem">
          <ModuleCard
            href="/analysis"
            number="04"
            icon={Stethoscope}
            title={copy.modules.doctorReview.title}
            text={copy.modules.doctorReview.text}
            footer={<ModuleCta label={copy.modules.doctorReview.cta} />}
          >
            <span className="tabular text-sm font-medium text-heading">{copy.modules.doctorReview.count(reviewedCount)}</span>
          </ModuleCard>
        </StaggerItem>

        {upcoming.map((module) => (
          <StaggerItem key={module.key} role="listitem">
            <ModuleCard
              number={module.number}
              icon={module.icon}
              tone={module.tone}
              title={copy.modules[module.key].title}
              text={copy.modules[module.key].text}
              footer={
                <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-blush px-3 py-1 text-xs font-semibold text-muted-foreground">
                  <Lock aria-hidden="true" className="size-3" strokeWidth={2} />
                  {copy.comingSoonBadge}
                </span>
              }
            />
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  );
}

/**
 * One module. With `href` it is an active link card; without, a quiet card that is visibly unavailable.
 */
function ModuleCard({
  href,
  number,
  icon: Icon,
  tone,
  title,
  text,
  footer,
  children,
}: {
  href?: string;
  number: string;
  icon: LucideIcon;
  tone?: Tone;
  title: string;
  text: string;
  footer: ReactNode;
  children?: ReactNode;
}) {
  const active = Boolean(href);

  const body = (
    <>
      {active ? (
        <div
          aria-hidden="true"
          className="absolute -top-20 -right-16 -z-10 size-56 rounded-full bg-primary-soft/50 opacity-60 blur-3xl transition-opacity duration-(--duration-component) group-hover:opacity-100"
        />
      ) : null}
      <div className="flex items-start justify-between">
        <span
          className={cn(
            "flex size-11 items-center justify-center rounded-full",
            active ? "bg-primary-soft text-primary" : cn(toneTile[tone ?? "blue"], "opacity-75"),
          )}
        >
          <Icon aria-hidden="true" className="size-5" strokeWidth={1.6} />
        </span>
        <span className="tabular text-xs font-semibold text-muted-foreground">{number}</span>
      </div>
      <div className="flex flex-col gap-1.5">
        <h2 className={cn("text-lg font-semibold", active ? "text-heading" : "text-heading/80")}>{title}</h2>
        <p className={cn("text-[0.9375rem]", active ? "text-foreground" : "text-muted-foreground")}>{text}</p>
        {children}
      </div>
      <div className="mt-auto pt-1">{footer}</div>
    </>
  );

  const base = "relative isolate flex h-full min-h-[15rem] flex-col gap-4 overflow-hidden rounded-xl p-6";

  if (!href) {
    return (
      <div aria-disabled="true" className={cn(base, "border border-dashed border-border-strong bg-surface/60")}>
        {body}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        base,
        "group border border-border bg-surface shadow-sm",
        "transition-[box-shadow,transform,border-color] duration-(--duration-component) ease-out-soft hover:-translate-y-0.5 hover:border-border-strong hover:shadow-lg",
      )}
    >
      {body}
    </Link>
  );
}

function ModuleCta({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-[0.9375rem] font-semibold text-primary">
      {label}
      <ButtonArrow />
    </span>
  );
}

// Highlighted module: same card shape, burgundy, with the scanner signature.
function SkinAnalysisCard() {
  return (
    <Link
      href={routes.analysis}
      className="group relative isolate flex h-full min-h-[15rem] items-stretch justify-between gap-6 overflow-hidden rounded-xl bg-primary p-6 text-primary-foreground shadow-md transition-[transform,box-shadow] duration-(--duration-component) ease-out-soft hover:-translate-y-0.5 hover:shadow-lg sm:p-7"
    >
      <div aria-hidden="true" className="absolute -right-20 -bottom-24 -z-10 size-80 rounded-full bg-primary-foreground/10 blur-3xl" />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 opacity-25"
        style={{
          backgroundImage: "radial-gradient(rgb(255 255 255 / 0.5) 0.8px, transparent 0.8px)",
          backgroundSize: "22px 22px",
          maskImage: "radial-gradient(circle at 80% 50%, black 10%, transparent 60%)",
        }}
      />

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-full bg-primary-foreground/15">
            <ScanFace aria-hidden="true" className="size-5" strokeWidth={1.6} />
          </span>
          <span className="tabular text-xs font-semibold text-primary-foreground/70">01</span>
        </div>
        <div>
          <h2 className="font-display text-[2rem] leading-[1.05] text-primary-foreground sm:text-[2.25rem]">
            {copy.modules.skinAnalysis.title}
          </h2>
          <p className="mt-1.5 max-w-xs text-[0.9375rem] text-primary-foreground/85">{copy.modules.skinAnalysis.text}</p>
        </div>
        <span className="mt-auto inline-flex items-center gap-2 self-start rounded-full bg-primary-foreground px-5 py-2.5 text-[0.9375rem] font-semibold text-primary">
          {copy.modules.skinAnalysis.cta}
          <ButtonArrow />
        </span>
      </div>

      <MiniScanner />
    </Link>
  );
}

// Small scanner: egg-shaped window, scan line and a tilted ring that turns on hover.
function MiniScanner() {
  return (
    <div
      aria-hidden="true"
      className="relative hidden size-36 shrink-0 items-center justify-center self-center min-[420px]:flex"
      style={{ perspective: 600 }}
    >
      <span
        className="absolute size-full rounded-full border border-primary-foreground/40 transition-transform duration-(--duration-reveal) ease-out-soft group-hover:rotate-[30deg]"
        style={{ transform: "rotateX(70deg)" }}
      />
      <span
        className="h-[70%] w-[56%] border border-primary-foreground/50 bg-primary-foreground/10"
        style={{ borderRadius: FACE_RADIUS }}
      />
      <span className="absolute h-px w-[46%] -translate-y-4 bg-primary-foreground/70 shadow-[0_0_10px_2px_rgb(255_255_255/0.25)] transition-transform duration-(--duration-reveal) ease-out-soft group-hover:translate-y-4" />
    </div>
  );
}
