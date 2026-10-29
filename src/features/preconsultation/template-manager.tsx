"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { deactivateQuestionnaireTemplateAction, saveQuestionnaireTemplateAction } from "@/server/preconsultation/template-actions";
import type { TemplateQuestion } from "@/server/preconsultation/template-schema";

const fieldClass = "w-full rounded-md border border-border bg-surface px-4 py-3 text-base text-heading focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-ring";

const emptyQuestion: TemplateQuestion = { id: "question-1", label: "", type: "LONG_TEXT", required: true, options: [], dependsOn: null };

export type TemplateRecord = {
  id: string;
  name: string;
  description: string;
  consultationType: "IN_CLINIC" | "VIDEO" | null;
  questions: TemplateQuestion[];
  isActive: boolean;
};

export function TemplateManager({ templates }: { templates: TemplateRecord[] }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [consultationType, setConsultationType] = useState<"IN_CLINIC" | "VIDEO" | "">("");
  const [questions, setQuestions] = useState<TemplateQuestion[]>([emptyQuestion]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function save() {
    setMessage(null);
    startTransition(async () => {
      const result = await saveQuestionnaireTemplateAction(editingId, { name, description, consultationType: consultationType || null, questions });
      if (result.status === "error" || result.status === "success") setMessage(result.message);
      if (result.status === "success") {
        setName("");
        setDescription("");
        setQuestions([emptyQuestion]);
        setEditingId(null);
      }
    });
  }

  function edit(template: TemplateRecord) {
    setEditingId(template.id);
    setName(template.name);
    setDescription(template.description);
    setConsultationType(template.consultationType ?? "");
    setQuestions(template.questions);
    setMessage(null);
  }

  function deactivate(id: string) {
    startTransition(async () => {
      const result = await deactivateQuestionnaireTemplateAction(id);
      if (result.status === "error" || result.status === "success") setMessage(result.message);
    });
  }

  function updateQuestion(index: number, patch: Partial<TemplateQuestion>) {
    setQuestions((current) => current.map((question, questionIndex) => (questionIndex === index ? { ...question, ...patch } : question)));
  }

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      {templates.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-heading">Mes questionnaires</h2>
          {templates.map((template) => (
            <div key={template.id} className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div><h3 className="font-semibold text-heading">{template.name}</h3><p className="mt-1 text-sm text-muted-foreground">{template.description || "Sans description"} · {template.questions.length} question(s) · {template.isActive ? "Actif" : "Désactivé"}</p></div>
              <div className="flex gap-3"><Button type="button" variant="secondary" onClick={() => edit(template)}>Modifier</Button>{template.isActive ? <Button type="button" variant="ghost" onClick={() => deactivate(template.id)}>Désactiver</Button> : null}</div>
            </div>
          ))}
        </section>
      ) : null}
      {message ? <p role="status" className="rounded-md bg-ai-panel px-4 py-3 text-sm text-ai-label">{message}</p> : null}
      <section className="rounded-xl border border-border bg-surface p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-4">
          <label className="text-sm font-semibold text-heading">Nom<input className={`${fieldClass} mt-2`} value={name} onChange={(event) => setName(event.target.value)} /></label>
          <label className="text-sm font-semibold text-heading">Description<textarea className={`${fieldClass} mt-2`} rows={3} value={description} onChange={(event) => setDescription(event.target.value)} /></label>
          <label className="text-sm font-semibold text-heading">Type de consultation<select className={`${fieldClass} mt-2`} value={consultationType} onChange={(event) => setConsultationType(event.target.value as typeof consultationType)}><option value="">Tous les types</option><option value="IN_CLINIC">Au cabinet</option><option value="VIDEO">Vidéo</option></select></label>
        </div>
        <div className="mt-8 flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-heading">Questions</h2>
          {questions.map((question, index) => (
            <div key={question.id} className="grid gap-3 rounded-md border border-border p-4">
              <input aria-label={`Identifiant de la question ${index + 1}`} className={fieldClass} value={question.id} onChange={(event) => updateQuestion(index, { id: event.target.value })} placeholder="identifiant-question" />
              <input aria-label={`Libellé de la question ${index + 1}`} className={fieldClass} value={question.label} onChange={(event) => updateQuestion(index, { label: event.target.value })} placeholder="Question à poser" />
              <select aria-label={`Type de la question ${index + 1}`} className={fieldClass} value={question.type} onChange={(event) => updateQuestion(index, { type: event.target.value as TemplateQuestion["type"], options: [] })}>
                <option value="SHORT_TEXT">Réponse courte</option><option value="LONG_TEXT">Réponse longue</option><option value="YES_NO">Oui / non</option><option value="SINGLE_CHOICE">Choix unique</option><option value="MULTIPLE_CHOICE">Choix multiples</option>
              </select>
              {(question.type === "SINGLE_CHOICE" || question.type === "MULTIPLE_CHOICE") ? <input aria-label={`Options de la question ${index + 1}`} className={fieldClass} value={question.options.join(" | ")} onChange={(event) => updateQuestion(index, { options: event.target.value.split("|").map((option) => option.trim()).filter(Boolean) })} placeholder="Option 1 | Option 2" /> : null}
              <label className="flex items-center gap-2 text-sm text-heading"><input type="checkbox" checked={question.required} onChange={(event) => updateQuestion(index, { required: event.target.checked })} /> Réponse obligatoire</label>
              {questions.length > 1 ? <Button type="button" variant="ghost" onClick={() => setQuestions((current) => current.filter((_, questionIndex) => questionIndex !== index))}>Supprimer</Button> : null}
            </div>
          ))}
          <Button type="button" variant="secondary" onClick={() => setQuestions((current) => [...current, { ...emptyQuestion, id: `question-${current.length + 1}` }])}>Ajouter une question</Button>
        </div>
        <div className="mt-6 flex flex-wrap gap-3"><Button type="button" disabled={isPending} onClick={save}>{isPending ? "Enregistrement…" : editingId ? "Mettre à jour le questionnaire" : "Enregistrer le questionnaire"}</Button>{editingId ? <Button type="button" variant="ghost" onClick={() => { setEditingId(null); setName(""); setDescription(""); setQuestions([emptyQuestion]); }}>Annuler</Button> : null}</div>
      </section>
    </div>
  );
}