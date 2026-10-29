"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { originalAnswersSchema, type AllergyStatus, type OriginalAnswers, type Treatment } from "@/server/preconsultation/schemas";

const steps = ["Motif", "Soins", "Traitements", "Allergies", "Vérification"] as const;
const fieldClass =
  "w-full rounded-md border border-border bg-surface px-4 py-3 text-base text-heading focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-ring";

const emptyAnswers: OriginalAnswers = {
  motif: "",
  attentes: "",
  habitudesSoin: "",
  traitements: [],
  allergies: { status: "NOT_PROVIDED", items: [] },
  informationsComplementaires: "",
};

export function PatientQuestionnaire({
  initial = emptyAnswers,
  onSubmit,
  onSaveDraft,
  saving = false,
}: {
  initial?: OriginalAnswers;
  onSubmit?: (answers: OriginalAnswers) => void;
  onSaveDraft?: (answers: OriginalAnswers) => void;
  saving?: boolean;
}) {
  const [answers, setAnswers] = useState<OriginalAnswers>(initial);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const progress = Math.round(((step + 1) / steps.length) * 100);

  const stepFields = useMemo(() => {
    if (step === 0) return ["motif", "attentes"];
    if (step === 1) return ["habitudesSoin"];
    if (step === 2) return ["traitements"];
    if (step === 3) return ["allergies"];
    return [];
  }, [step]);

  function update<K extends keyof OriginalAnswers>(field: K, value: OriginalAnswers[K]) {
    setAnswers((current) => ({ ...current, [field]: value }));
    setErrors({});
  }

  function validateStep() {
    const result = originalAnswersSchema.safeParse(answers);
    if (result.success) {
      setErrors({});
      return true;
    }
    const next: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const path = String(issue.path[0] ?? "");
      if (stepFields.includes(path) && !next[path]) next[path] = issue.message;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function next() {
    if (step < steps.length - 1 && validateStep()) setStep((current) => current + 1);
  }

  function submit() {
    const result = originalAnswersSchema.safeParse(answers);
    if (!result.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const path = String(issue.path[0] ?? "");
        if (!nextErrors[path]) nextErrors[path] = issue.message;
      }
      setErrors(nextErrors);
      return;
    }
    onSubmit?.(result.data);
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <p className="overline-text">Pré-consultation</p>
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-medium text-muted-foreground">
            Étape {step + 1} sur {steps.length} · {steps[step]}
          </p>
          <span className="tabular text-sm font-semibold text-primary">{progress}%</span>
        </div>
        <div
          role="progressbar"
          aria-label={`Progression : ${progress}%`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          className="h-2 overflow-hidden rounded-full bg-surface-blush"
        >
          <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${progress}%` }} />
        </div>
      </header>

      <section className="flex flex-col gap-6 rounded-xl border border-border bg-surface p-5 shadow-sm sm:p-7">
        {step === 0 ? (
          <>
            <TextArea label="Motif de consultation" value={answers.motif} error={errors.motif} onChange={(value) => update("motif", value)} />
            <TextArea
              label="Attentes et préoccupations"
              value={answers.attentes}
              error={errors.attentes}
              onChange={(value) => update("attentes", value)}
            />
          </>
        ) : null}
        {step === 1 ? (
          <>
            <TextArea
              label="Habitudes de soin"
              value={answers.habitudesSoin}
              error={errors.habitudesSoin}
              onChange={(value) => update("habitudesSoin", value)}
            />
            <TextArea
              label="Informations complémentaires"
              required={false}
              value={answers.informationsComplementaires}
              error={errors.informationsComplementaires}
              onChange={(value) => update("informationsComplementaires", value)}
            />
          </>
        ) : null}
        {step === 2 ? <TreatmentEditor items={answers.traitements} onChange={(value) => update("traitements", value)} error={errors.traitements} /> : null}
        {step === 3 ? (
          <AllergyEditor value={answers.allergies} onChange={(value) => update("allergies", value)} error={errors.allergies ?? errors.items} />
        ) : null}
        {step === 4 ? <Review answers={answers} /> : null}
      </section>

      {Object.keys(errors).length > 0 ? (
        <p role="alert" className="rounded-md bg-destructive/8 px-4 py-3 text-sm font-medium text-destructive">
          Vérifiez les champs signalés avant de continuer.
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <Button variant="ghost" disabled={step === 0} onClick={() => setStep((current) => Math.max(0, current - 1))}>
          Retour
        </Button>
        <div className="flex flex-col gap-3 sm:flex-row">
          {onSaveDraft ? (
            <Button type="button" variant="secondary" disabled={saving} onClick={() => onSaveDraft(answers)}>
              {saving ? "Enregistrement…" : "Enregistrer le brouillon"}
            </Button>
          ) : null}
          {step < steps.length - 1 ? <Button onClick={next}>Continuer</Button> : <Button onClick={submit}>Valider mes réponses</Button>}
        </div>
      </div>
    </div>
  );
}

function TextArea({
  label,
  value,
  error,
  required = true,
  onChange,
}: {
  label: string;
  value: string;
  error?: string;
  required?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm font-semibold text-heading">
      {label}
      {!required ? <span className="font-normal text-muted-foreground">(facultatif)</span> : null}
      <textarea
        rows={5}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        className={`${fieldClass} leading-[1.6] ${error ? "border-destructive" : ""}`}
      />
      {error ? <span className="font-normal text-destructive">{error}</span> : null}
    </label>
  );
}

function TreatmentEditor({ items, error, onChange }: { items: Treatment[]; error?: string; onChange: (items: Treatment[]) => void }) {
  function update(index: number, field: keyof Treatment, value: string) {
    onChange(items.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)));
  }

  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="text-sm font-semibold text-heading">Traitements déclarés</legend>
      <p className="text-sm text-muted-foreground">Indiquez le dosage et la fréquence uniquement s’ils sont connus.</p>
      {items.map((item, index) => (
        <div key={index} className="grid gap-3 rounded-md border border-border p-4 sm:grid-cols-3">
          {(["nom", "dosage", "frequence"] as const).map((field) => (
            <input
              key={field}
              aria-label={`${field} du traitement ${index + 1}`}
              className={`${fieldClass} py-2`}
              value={item[field]}
              placeholder={field === "nom" ? "Nom" : field === "dosage" ? "Dosage (facultatif)" : "Fréquence (facultatif)"}
              onChange={(event) => update(index, field, event.target.value)}
            />
          ))}
          <Button type="button" variant="ghost" onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}>
            Supprimer
          </Button>
        </div>
      ))}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="button" variant="secondary" onClick={() => onChange([...items, { nom: "", dosage: "", frequence: "" }])}>
        Ajouter un traitement
      </Button>
    </fieldset>
  );
}

function AllergyEditor({
  value,
  error,
  onChange,
}: {
  value: OriginalAnswers["allergies"];
  error?: string;
  onChange: (value: OriginalAnswers["allergies"]) => void;
}) {
  const statuses: { value: AllergyStatus; label: string }[] = [
    { value: "KNOWN", label: "J’ai des allergies connues" },
    { value: "NONE_KNOWN", label: "Aucune allergie connue" },
    { value: "UNKNOWN", label: "Je ne sais pas" },
    { value: "NOT_PROVIDED", label: "Je ne souhaite pas / je n’ai pas renseigné" },
  ];

  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="text-sm font-semibold text-heading">Allergies déclarées</legend>
      <div className="grid gap-3">
        {statuses.map((status) => (
          <label key={status.value} className="flex items-start gap-3 text-sm text-heading">
            <input
              type="radio"
              name="allergy-status"
              checked={value.status === status.value}
              onChange={() => onChange({ status: status.value, items: [] })}
              className="mt-1 accent-(--primary)"
            />
            {status.label}
          </label>
        ))}
      </div>
      {value.status === "KNOWN" ? (
        <div className="flex flex-col gap-3">
          {value.items.map((item, index) => (
            <div key={index} className="grid gap-3 rounded-md border border-border p-4 sm:grid-cols-2">
              <input
                aria-label={`Substance allergène ${index + 1}`}
                className={`${fieldClass} py-2`}
                placeholder="Substance"
                value={item.substance}
                onChange={(event) =>
                  onChange({ ...value, items: value.items.map((current, itemIndex) => (itemIndex === index ? { ...current, substance: event.target.value } : current)) })
                }
              />
              <input
                aria-label={`Réaction allergique ${index + 1}`}
                className={`${fieldClass} py-2`}
                placeholder="Réaction"
                value={item.reaction}
                onChange={(event) =>
                  onChange({ ...value, items: value.items.map((current, itemIndex) => (itemIndex === index ? { ...current, reaction: event.target.value } : current)) })
                }
              />
              <Button type="button" variant="ghost" onClick={() => onChange({ ...value, items: value.items.filter((_, itemIndex) => itemIndex !== index) })}>
                Supprimer
              </Button>
            </div>
          ))}
          <Button type="button" variant="secondary" onClick={() => onChange({ ...value, items: [...value.items, { substance: "", reaction: "" }] })}>
            Ajouter une allergie
          </Button>
        </div>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </fieldset>
  );
}

function Review({ answers }: { answers: OriginalAnswers }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="font-display text-[2rem] leading-[1.1]">Vérifiez vos réponses</h2>
        <p className="mt-2 text-sm text-muted-foreground">Ces réponses originales seront transmises au médecin et serviront de base au résumé assisté par IA.</p>
      </div>
      <ReviewRow label="Motif" value={answers.motif} />
      <ReviewRow label="Attentes" value={answers.attentes} />
      <ReviewRow label="Habitudes de soin" value={answers.habitudesSoin} />
      <ReviewRow label="Traitements" value={answers.traitements.map((item) => `${item.nom} — ${item.dosage || "dosage non renseigné"} — ${item.frequence || "fréquence non renseignée"}`).join("\n") || "Aucun traitement déclaré"} />
      <ReviewRow label="Allergies" value={answers.allergies.status === "KNOWN" ? answers.allergies.items.map((item) => `${item.substance} — ${item.reaction}`).join("\n") : answers.allergies.status} />
      <ReviewRow label="Informations complémentaires" value={answers.informationsComplementaires || "Non renseigné"} />
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-surface-blush/60 p-4">
      <dt className="text-sm font-semibold text-heading">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap text-sm text-foreground">{value}</dd>
    </div>
  );
}
