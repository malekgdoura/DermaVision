"use client";

import { useState, type ReactNode } from "react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ChampProps = {
  label: string;
  name: string;
  type?: "text" | "email" | "password" | "tel";
  required?: boolean;
  autoComplete?: string;
  /** Short help shown under the field (e.g. password rules). */
  hint?: string;
  /** Validation message for this field, from the server action. */
  error?: string;
  defaultValue?: string;
};

/**
 * Labelled input from the DermaVision design system: visible label, 48px field,
 * burgundy focus ring, error linked with aria-describedby. Password fields get a show/hide toggle.
 */
export function Champ({
  label,
  name,
  type = "text",
  required = true,
  autoComplete,
  hint,
  error,
  defaultValue,
}: ChampProps) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";
  const hintId = hint ? `${name}-hint` : undefined;
  const errorId = error ? `${name}-error` : undefined;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={name} className="text-sm font-semibold text-heading">
        {label}
        {!required && <span className="font-normal text-muted-foreground"> (optional)</span>}
      </label>

      <div className="relative">
        <input
          // Remount when the server returns new values so the field refills after an error.
          key={defaultValue}
          id={name}
          name={name}
          type={isPassword && visible ? "text" : type}
          required={required}
          autoComplete={autoComplete}
          defaultValue={defaultValue}
          aria-invalid={error ? true : undefined}
          aria-describedby={[errorId, hintId].filter(Boolean).join(" ") || undefined}
          className={cn(
            "h-12 w-full rounded-md border bg-surface px-4 text-base text-heading transition-colors duration-(--duration-hover)",
            "placeholder:text-muted-foreground hover:border-border-strong",
            "focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring",
            isPassword && "pr-14",
            error ? "border-destructive" : "border-border",
          )}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
            aria-pressed={visible}
            className="absolute top-1/2 right-1 flex size-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface-blush hover:text-heading"
          >
            {visible ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}
      </div>

      {error && (
        <p id={errorId} className="flex items-start gap-1.5 text-sm text-destructive">
          <AlertIcon className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={hintId} className="text-sm text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  );
}

/** Full-width primary pill; keeps its width while loading and shows a spinner. */
export function BoutonPrincipal({
  children,
  enCours,
  loadingLabel = "Please wait…",
}: {
  children: ReactNode;
  enCours: boolean;
  loadingLabel?: string;
}) {
  return (
    <button
      type="submit"
      disabled={enCours}
      aria-busy={enCours}
      className={cn(buttonVariants({ size: "lg" }), "w-full disabled:opacity-80")}
    >
      {enCours ? (
        <>
          <Spinner />
          {loadingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}

/** Form-level message (wrong credentials, existing account), announced to screen readers. */
export function MessageErreur({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-md border border-destructive/25 bg-[#f6e3e0] px-4 py-3 text-sm text-destructive"
    >
      <AlertIcon className="mt-0.5 size-[1.125rem] shrink-0" />
      <p className="font-medium">{message}</p>
    </div>
  );
}

function Spinner() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="animate-spin motion-reduce:animate-none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2.5" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className={className}>
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 6v4.5M10 13.5h.01" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-5">
      <path
        d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-5">
      <path
        d="M3 3l18 18M10.6 5.6A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-3.2 3.9M6.6 6.7C4 8.4 2.5 12 2.5 12S6 18.5 12 18.5c1.6 0 3-.4 4.2-1M9.9 9.9a3 3 0 0 0 4.2 4.2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
