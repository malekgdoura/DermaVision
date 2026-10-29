import type { PreConsultationSummary, OriginalAnswers } from "@/server/preconsultation/schemas";

type SummaryState = "NOT_STARTED" | "GENERATING" | "READY" | "FAILED";

export function PreConsultationSummary({
  originalAnswers,
  summary,
  status,
  error,
  onRetry,
}: {
  originalAnswers: OriginalAnswers;
  summary: PreConsultationSummary | null;
  status: SummaryState;
  error?: string | null;
  onRetry?: () => void;
}) {
  return (
    <section className="flex flex-col gap-6">
      <header>
        <p className="overline-text">Pré-consultation</p>
        <h2 className="mt-3 font-display text-[2rem] leading-[1.1]">Réponses et résumé assistant</h2>
      </header>

      {status === "GENERATING" ? <p role="status" className="rounded-lg bg-ai-panel px-5 py-4 text-sm text-ai-label">Génération du résumé en cours…</p> : null}
      {status === "FAILED" ? (
        <div role="alert" className="flex flex-col gap-3 rounded-lg bg-destructive/8 px-5 py-4 text-sm text-destructive">
          <p>{error || "Le résumé n’a pas pu être généré."}</p>
          {onRetry ? <button type="button" onClick={onRetry} className="self-start font-semibold underline underline-offset-4">Réessayer</button> : null}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <AnswerPanel answers={originalAnswers} />
        {summary ? <SummaryPanel summary={summary} /> : <p className="rounded-xl border border-dashed border-border-strong bg-surface/60 p-5 text-sm text-muted-foreground">Le résumé IA apparaîtra ici après sa génération.</p>}
      </div>
    </section>
  );
}

function AnswerPanel({ answers }: { answers: OriginalAnswers }) {
  return (
    <section className="rounded-xl border border-border bg-surface p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-heading">Réponses originales du patient</h3>
      <dl className="mt-5 flex flex-col gap-4 text-sm">
        <Row label="Motif" value={answers.motif} />
        <Row label="Attentes" value={answers.attentes} />
        <Row label="Habitudes de soin" value={answers.habitudesSoin} />
        <Row label="Traitements" value={answers.traitements.map((item) => `${item.nom} — ${item.dosage || "dosage non renseigné"} — ${item.frequence || "fréquence non renseignée"}`).join("\n") || "Aucun traitement déclaré"} />
        <Row label="Allergies" value={answers.allergies.status === "KNOWN" ? answers.allergies.items.map((item) => `${item.substance} — ${item.reaction}`).join("\n") : answers.allergies.status} />
        <Row label="Informations complémentaires" value={answers.informationsComplementaires || "Non renseigné"} />
      </dl>
    </section>
  );
}

function SummaryPanel({ summary }: { summary: PreConsultationSummary }) {
  return (
    <section className="rounded-xl border border-ai-label/20 bg-ai-panel p-5">
      <h3 className="text-lg font-semibold text-heading">Résumé assisté par IA</h3>
      <p className="mt-2 text-sm text-ai-label">{summary.disclaimer}</p>
      <dl className="mt-5 flex flex-col gap-4 text-sm">
        <Row label="Motif" value={summary.motif} />
        <Row label="Attentes" value={summary.attentes} />
        <Row label="Habitudes de soin" value={summary.habitudesSoin} />
        <Row label="Traitements déclarés" value={summary.traitementsDeclares.map((item) => `${item.nom} — ${item.dosage || "dosage non renseigné"} — ${item.frequence || "fréquence non renseignée"}`).join("\n") || "Aucun traitement déclaré"} />
        <Row label="Allergies déclarées" value={summary.allergiesDeclarees.status === "KNOWN" ? summary.allergiesDeclarees.items.map((item) => `${item.substance} — ${item.reaction}`).join("\n") : summary.allergiesDeclarees.status} />
        <Row label="Informations complémentaires" value={summary.informationsComplementaires || "Non renseigné"} />
        <Row label="Informations manquantes" value={summary.missingInformation.join("\n") || "Aucune identifiée"} />
      </dl>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-semibold text-heading">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap text-foreground">{value}</dd>
    </div>
  );
}
