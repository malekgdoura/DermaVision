"use client";

import { useState, useTransition } from "react";

import { PatientQuestionnaire } from "./patient-questionnaire";
import { PreConsultationSummary } from "./preconsultation-summary";
import {
  retryPreConsultationSummaryAction,
  savePreConsultationDraftAction,
  submitPreConsultationAction,
} from "@/server/preconsultation/actions";
import type { OriginalAnswers, PreConsultationSummary as Summary } from "@/server/preconsultation/schemas";

export function PreConsultationWorkflow({
  appointmentId,
  initialAnswers,
  status,
  summaryStatus,
  summary,
  summaryError,
}: {
  appointmentId: string;
  initialAnswers: OriginalAnswers;
  status: "DRAFT" | "SUBMITTED";
  summaryStatus: "NOT_STARTED" | "GENERATING" | "READY" | "FAILED";
  summary: Summary | null;
  summaryError: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function saveDraft(answers: OriginalAnswers) {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await savePreConsultationDraftAction(appointmentId, answers);
      if (result.status === "error") setError(result.message);
      else if (result.status === "success") setMessage(result.message);
    });
  }

  function submit(answers: OriginalAnswers) {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await submitPreConsultationAction(appointmentId, answers);
      if (result.status === "error") setError(result.message);
      else if (result.status === "success") setMessage(result.message);
    });
  }

  function retry() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await retryPreConsultationSummaryAction(appointmentId);
      if (result.status === "error") setError(result.message);
      else if (result.status === "success") setMessage(result.message);
    });
  }

  if (status === "SUBMITTED") {
    return (
      <div className="flex flex-col gap-6">
        {message ? <p role="status" className="rounded-md bg-ai-panel px-4 py-3 text-sm text-ai-label">{message}</p> : null}
        {error ? <p role="alert" className="rounded-md bg-destructive/8 px-4 py-3 text-sm text-destructive">{error}</p> : null}
        <PreConsultationSummary
          originalAnswers={initialAnswers}
          summary={summary}
          status={summaryStatus}
          error={summaryError}
          onRetry={summaryStatus === "FAILED" ? retry : undefined}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {message ? <p role="status" className="rounded-md bg-ai-panel px-4 py-3 text-sm text-ai-label">{message}</p> : null}
      {error ? <p role="alert" className="rounded-md bg-destructive/8 px-4 py-3 text-sm text-destructive">{error}</p> : null}
      <PatientQuestionnaire initial={initialAnswers} onSubmit={submit} onSaveDraft={saveDraft} saving={isPending} />
      {isPending ? <p role="status" className="text-sm text-muted-foreground">Enregistrement en cours…</p> : null}
    </div>
  );
}