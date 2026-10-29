"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition, type ChangeEvent } from "react";

import { Button, ButtonArrow, buttonVariants } from "@/components/ui/button";
import { ease } from "@/config/motion";
import { analysisUpload as copy } from "@/content/analysis";
import { startAnalysisFromUpload } from "@/server/analysis/actions";

import { ScanStage, type ScanPhase } from "./scan-stage";

const MAX_BYTES = 2 * 1024 * 1024;
const ACCEPTED_TYPE = "image/jpeg";

type Feedback = {
  tone: "error" | "success";
  title?: string;
  text: string;
  retryable?: boolean;
  analysisId?: string;
} | null;

/** Upload flow of the skin analysis page: choose or drop a JPEG, preview it, send it for analysis. */
export function SkinScanner() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [phase, setPhase] = useState<ScanPhase>("empty");
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [isPending, startTransition] = useTransition();

  // Free the preview's object URL when it is replaced or the page closes.
  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  function selectFiles(files: FileList | null) {
    if (!files || files.length === 0 || isPending) return;
    if (files.length > 1) return showError(copy.errors.multiple);

    const candidate = files[0];
    if (candidate.type !== ACCEPTED_TYPE) return showError(copy.errors.type);
    if (candidate.size > MAX_BYTES) return showError(copy.errors.size);

    setFile(candidate);
    setPreviewUrl(URL.createObjectURL(candidate));
    setPhase("ready");
    setFeedback(null);
  }

  function showError(text: string, retryable = false) {
    setFeedback({ tone: "error", text, retryable });
    setPhase(file ? "error" : "empty");
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    selectFiles(event.target.files);
    // Allow choosing the same file again after an error.
    event.target.value = "";
  }

  function openPicker() {
    inputRef.current?.click();
  }

  function analyze() {
    if (!file) return;
    setFeedback(null);
    setPhase("scanning");

    startTransition(async () => {
      try {
        const result = await startAnalysisFromUpload(file);
        if (result.ok) {
          setPhase("done");
          setFeedback({
            tone: "success",
            title: copy.success.title,
            text: copy.success.text,
            analysisId: result.analysisId,
          });
        } else {
          setPhase("error");
          setFeedback({ tone: "error", text: result.error.message, retryable: result.error.retryable });
        }
      } catch {
        setPhase("error");
        setFeedback({ tone: "error", text: copy.errors.unexpected, retryable: true });
      }
    });
  }

  function reset() {
    setFile(null);
    setPreviewUrl(null);
    setPhase("empty");
    setFeedback(null);
  }

  const done = phase === "done";

  return (
    <div className="flex flex-col gap-6">
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,image/jpeg"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={handleInputChange}
      />

      <ScanStage
        phase={phase}
        previewUrl={previewUrl}
        previewAlt={copy.previewAlt}
        label={copy.stageLabel}
        statusText={copy.status[phase]}
        isDragging={isDragging}
        onDragStateChange={setIsDragging}
        onDropFiles={selectFiles}
        emptyContent={
          <button
            type="button"
            onClick={openPicker}
            className="rounded-full bg-surface/85 px-4 py-2 text-sm font-medium text-heading shadow-sm backdrop-blur transition-colors duration-(--duration-hover) hover:bg-surface"
          >
            {isDragging ? copy.dropActive : copy.dropPrompt}
          </button>
        }
      />

      {/* Actions */}
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row">
          {done ? (
            <Button variant="secondary" onClick={reset}>
              {copy.newAnalysis}
            </Button>
          ) : (
            <>
              <Button variant={file ? "secondary" : "primary"} onClick={openPicker} disabled={isPending}>
                {file ? copy.changePhoto : copy.choosePhoto}
              </Button>
              {file ? (
                <Button onClick={analyze} disabled={isPending} aria-busy={isPending}>
                  {isPending ? copy.analyzing : feedback?.retryable ? copy.tryAgain : copy.analyze}
                  {isPending ? null : <ButtonArrow />}
                </Button>
              ) : null}
            </>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground sm:text-right">
          {file ? (
            <span className="tabular">
              {file.name.length > 28 ? `${file.name.slice(0, 25)}…` : file.name} · {formatSize(file.size)}
            </span>
          ) : (
            copy.requirements
          )}
        </p>
      </div>

      {/* Result or error message (detailed results come later) */}
      <AnimatePresence mode="wait" initial={false}>
        {feedback ? (
          <motion.div
            key={`${feedback.tone}-${feedback.text}`}
            role={feedback.tone === "error" ? "alert" : "status"}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.28, ease: ease.outSoft }}
            className={
              feedback.tone === "error"
                ? "rounded-lg border border-destructive/25 bg-destructive/5 px-5 py-4 text-[0.9375rem] text-destructive"
                : "flex flex-col gap-3 rounded-lg border border-success/25 bg-success/8 px-5 py-5"
            }
          >
            {feedback.title ? <p className="font-semibold text-heading">{feedback.title}</p> : null}
            <p className={feedback.tone === "success" ? "text-foreground" : undefined}>{feedback.text}</p>
            {feedback.analysisId ? (
              <Link
                href={`/analysis/${encodeURIComponent(feedback.analysisId)}`}
                className={buttonVariants({ className: "mt-1 self-start" })}
              >
                {copy.success.cta}
                <ButtonArrow />
              </Link>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function formatSize(bytes: number) {
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}
