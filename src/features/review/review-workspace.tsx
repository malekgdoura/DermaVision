import { ArrowDownRight, ArrowUpRight, Minus, ShieldCheck, UserRound } from "lucide-react";

import { ResultPhoto } from "@/features/analysis/result-photo";
import { StatusBadge } from "@/features/analysis/analysis-result";
import { analysisPhotoUrl } from "@/features/analysis/mapped-result";
import { analysisResult } from "@/content/analysis";
import { reviewWorkspace as copy } from "@/content/review";
import {
  generateDraftAction,
  publishReportAction,
  saveDraftAction,
  validateIndicatorsAction,
} from "@/server/review/actions";
import { indicatorLabel } from "@/server/recommendations/indicators";
import type { RecommendationSuggestions } from "@/server/recommendations/service";
import { hasChanges } from "@/server/review/compare";
import { countCorrections } from "@/server/review/corrections";
import type { ReviewWorkspace as Workspace } from "@/server/review/service";
import type { SkinIndicator } from "@/server/skin-api";

import { formatDate, formatDateTime } from "./format";
import { IndicatorsForm } from "./indicators-form";
import { ReportStudio } from "./report-studio";
import { ReportText } from "./report-text";

/** The doctor's review screen: photo and patient on the left, the three steps on the right. */
export function ReviewWorkspace({
  workspace,
  recommendations,
}: {
  workspace: Workspace;
  recommendations: RecommendationSuggestions;
}) {
  const { id, patient, correctedResult } = workspace;
  const readOnly = !workspace.canEdit;
  const patientName = `${patient.prenom} ${patient.nom}`;

  // The analysis id is bound on the server; the client cannot change which analysis it acts on.
  const actions = {
    validate: validateIndicatorsAction.bind(null, id),
    generate: generateDraftAction.bind(null, id),
    save: saveDraftAction.bind(null, id),
    publish: publishReportAction.bind(null, id),
  };

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-4">
        <p className="overline-text">{copy.overline}</p>
        <h1 id="review-title" className="font-display text-[2.5rem] leading-[1.08] sm:text-5xl">
          {copy.title(patientName)}
        </h1>
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span>
            {copy.receivedOn} <time dateTime={workspace.createdAt.toISOString()}>{formatDateTime(workspace.createdAt)}</time>
          </span>
          <StatusBadge status={workspace.status} />
        </div>
        {workspace.assignedToOther && workspace.reviewer ? (
          <Notice>{copy.readOnly.assigned(workspace.reviewer.nom)}</Notice>
        ) : workspace.status === "VALIDATED" ? (
          <Notice>{copy.readOnly.published}</Notice>
        ) : null}
      </header>

      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-14">
        <aside className="flex flex-col gap-6 lg:sticky lg:top-32">
          <ResultPhoto src={analysisPhotoUrl(id)} alt={copy.photoAlt} caption={copy.photoCaption} />
          <PatientCard patient={patient} />
        </aside>

        <div className="flex flex-col gap-12">
          <ComparisonPanel previous={workspace.previous} />

          <IndicatorsForm
            action={actions.validate}
            aiResult={workspace.aiResult}
            current={
              correctedResult
                ? {
                    detectedKeys: correctedResult.indicators.filter((i) => i.detected).map((i) => i.key),
                    skinType: correctedResult.skinType.value,
                  }
                : null
            }
            clinicalNotes={workspace.clinicalNotes}
            validatedAt={workspace.indicatorsValidatedAt}
            readOnly={readOnly}
          />

          {correctedResult && readOnly ? (
            <p className="-mt-6 text-sm text-muted-foreground">{copy.indicators.corrections(countCorrections(correctedResult))}</p>
          ) : null}

          <ReportStudio
            actions={actions}
            versions={workspace.versions}
            unlocked={workspace.status === "IN_REVIEW" && Boolean(workspace.indicatorsValidatedAt)}
            readOnly={readOnly}
            recommendations={{
              // Only what the picker shows; sign keys become labels here (skin-api is server-only).
              suggested: recommendations.suggested.map((item) => ({
                id: item.id,
                title: item.title,
                content: item.content,
                language: item.language,
                matchedLabels: item.matchedKeys.map(indicatorLabel),
              })),
              others: recommendations.others.map((item) => ({
                id: item.id,
                title: item.title,
                content: item.content,
                language: item.language,
                matchedLabels: [],
              })),
            }}
          />
        </div>
      </div>
    </div>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-3 rounded-lg bg-marker-blue-soft px-5 py-4 text-[0.9375rem] text-marker-blue-text">
      <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" strokeWidth={1.8} />
      {children}
    </p>
  );
}

function PatientCard({ patient }: { patient: Workspace["patient"] }) {
  const rows = [
    { label: copy.patient.email, value: patient.email },
    { label: copy.patient.phone, value: patient.telephone || copy.patient.noPhone },
    { label: copy.patient.memberSince, value: formatDate(patient.createdAt) },
    { label: copy.patient.analyses, value: String(patient.analysisCount) },
  ];

  return (
    <section aria-labelledby="patient-title" className="rounded-xl border border-border bg-surface p-5 shadow-sm">
      <h2 id="patient-title" className="flex items-center gap-3 font-semibold text-heading">
        <span className="flex size-9 items-center justify-center rounded-full bg-primary-soft text-primary">
          <UserRound aria-hidden="true" className="size-4" strokeWidth={1.8} />
        </span>
        {patient.prenom} {patient.nom}
      </h2>
      <dl className="mt-4 grid gap-3">
        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-[7rem_minmax(0,1fr)] gap-3 text-sm">
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd className="tabular font-medium break-words text-heading">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function ComparisonPanel({ previous }: { previous: Workspace["previous"] }) {
  if (!previous) {
    return (
      <section aria-labelledby="comparison-title" className="rounded-lg bg-surface-blush/70 px-5 py-4">
        <h2 id="comparison-title" className="text-sm font-semibold text-heading">
          {copy.comparison.title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{copy.comparison.none}</p>
      </section>
    );
  }

  const { comparison } = previous;
  const groups: { title: string; items: SkinIndicator[]; icon: typeof ArrowUpRight; className: string }[] = [
    { title: copy.comparison.appeared, items: comparison.appeared, icon: ArrowUpRight, className: "text-marker-rose-text" },
    { title: copy.comparison.resolved, items: comparison.resolved, icon: ArrowDownRight, className: "text-success" },
    { title: copy.comparison.persistent, items: comparison.persistent, icon: Minus, className: "text-muted-foreground" },
  ];

  return (
    <section aria-labelledby="comparison-title" className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5 sm:p-6">
      <div>
        <h2 id="comparison-title" className="text-lg font-semibold text-heading">
          {copy.comparison.title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {copy.comparison.reviewedOn} <time dateTime={previous.publishedAt.toISOString()}>{formatDate(previous.publishedAt)}</time>
        </p>
      </div>

      {comparison.skinTypeChange ? (
        <p className="text-sm font-medium text-heading">
          {copy.comparison.skinType(comparison.skinTypeChange.from, comparison.skinTypeChange.to)}
        </p>
      ) : null}

      {hasChanges(comparison) || comparison.persistent.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {groups.map((group) => (
            <div key={group.title}>
              <h3 className={`flex items-center gap-1.5 text-sm font-semibold ${group.className}`}>
                <group.icon aria-hidden="true" className="size-4" strokeWidth={2} />
                {group.title}
                <span className="tabular font-medium text-muted-foreground">{group.items.length}</span>
              </h3>
              <ul className="mt-2 flex flex-col gap-1 text-sm text-foreground">
                {group.items.map((indicator) => (
                  <li key={indicator.key}>
                    {indicator.label}
                    {indicator.zone ? <span className="text-muted-foreground"> · {analysisResult.zones[indicator.zone]}</span> : null}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{copy.comparison.noChange}</p>
      )}

      {previous.report ? (
        <details className="group rounded-md bg-surface-blush/50 px-4 py-3">
          <summary className="cursor-pointer text-sm font-medium text-heading">{copy.comparison.previousReport}</summary>
          <ReportText content={previous.report} className="mt-3" />
        </details>
      ) : null}
    </section>
  );
}
