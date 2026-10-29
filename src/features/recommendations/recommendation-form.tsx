"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { routes } from "@/content/home";
import { recommendationLibrary as copy } from "@/content/recommendations";
import { cn } from "@/lib/utils";
import type { RecommendationFormState } from "@/server/recommendations/actions";

type Action = (state: RecommendationFormState, formData: FormData) => Promise<RecommendationFormState>;

type RecommendationFormProps = {
  action: Action;
  // Signs grouped by category, built on the server.
  signGroups: { group: string; options: { key: string; label: string }[] }[];
  initial?: {
    title: string;
    content: string;
    category: string;
    language: string;
    indicatorKeys: string[];
  };
};

const fieldClass =
  "w-full rounded-md border bg-surface px-4 text-base text-heading transition-colors hover:border-border-strong focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-ring";

/** Create and edit form of a recommendation (same form for both). */
export function RecommendationForm({ action, signGroups, initial }: RecommendationFormProps) {
  const [state, formAction, pending] = useActionState(action, { status: "idle" });

  // After a validation error, refill with what was submitted.
  const values = state.status === "error" && state.values ? state.values : null;
  const value = (name: "title" | "content" | "category" | "language") =>
    (values?.[name] as string | undefined) ?? initial?.[name] ?? "";
  const checkedKeys = new Set((values?.indicatorKeys as string[] | undefined) ?? initial?.indicatorKeys ?? []);
  const fields = state.status === "error" ? (state.fields ?? {}) : {};
  // Remount the fields when the server sends values back, so defaultValue applies.
  const formKey = state.status === "error" ? JSON.stringify(values) : "initial";

  return (
    <form key={formKey} action={formAction} className="flex flex-col gap-8" noValidate>
      {state.status === "error" ? (
        <p role="alert" className="rounded-md bg-destructive/8 px-4 py-3 text-sm font-medium text-destructive">
          {state.message}
        </p>
      ) : null}

      <Field label={copy.form.title} name="title" hint={copy.form.titleHint} error={fields.title}>
        <input
          id="title"
          name="title"
          defaultValue={value("title")}
          maxLength={80}
          required
          aria-invalid={fields.title ? true : undefined}
          aria-describedby="title-hint"
          className={cn(fieldClass, "h-12", fields.title ? "border-destructive" : "border-border")}
        />
      </Field>

      <Field label={copy.form.content} name="content" hint={copy.form.contentHint} error={fields.content}>
        <textarea
          id="content"
          name="content"
          rows={5}
          maxLength={1000}
          defaultValue={value("content")}
          required
          aria-invalid={fields.content ? true : undefined}
          aria-describedby="content-hint"
          className={cn(fieldClass, "py-3 leading-[1.6]", fields.content ? "border-destructive" : "border-border")}
        />
      </Field>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label={copy.form.category} name="category" error={fields.category}>
          <select
            id="category"
            name="category"
            defaultValue={value("category") || "general"}
            className={cn(fieldClass, "h-12 cursor-pointer border-border")}
          >
            {Object.entries(copy.categories).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Field label={copy.form.language} name="language" error={fields.language}>
          <select
            id="language"
            name="language"
            defaultValue={value("language") || "en"}
            className={cn(fieldClass, "h-12 cursor-pointer border-border")}
          >
            {Object.entries(copy.languages).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <fieldset aria-describedby="signs-hint">
        <legend className="text-sm font-semibold text-heading">{copy.form.signs}</legend>
        <p id="signs-hint" className="mt-1 text-sm text-muted-foreground">
          {copy.form.signsHint}
        </p>
        {fields.indicatorKeys ? <p className="mt-2 text-sm text-destructive">{fields.indicatorKeys}</p> : null}
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          {signGroups.map((group) => (
            <div key={group.group}>
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{group.group}</p>
              <ul className="mt-2 flex flex-col gap-1">
                {group.options.map((option) => (
                  <li key={option.key}>
                    <label className="flex min-h-9 cursor-pointer items-center gap-3 text-[0.9375rem] text-heading">
                      <input
                        type="checkbox"
                        name="indicatorKeys"
                        value={option.key}
                        defaultChecked={checkedKeys.has(option.key)}
                        className="size-4 shrink-0 accent-(--primary)"
                      />
                      {option.label}
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link href={routes.recommendations} className={buttonVariants({ variant: "ghost" })}>
          {copy.form.cancel}
        </Link>
        <Button type="submit" disabled={pending}>
          {pending ? copy.form.saving : copy.form.save}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  hint,
  error,
  children,
}: {
  label: string;
  name: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={name} className="text-sm font-semibold text-heading">
        {label}
      </label>
      {children}
      {hint ? (
        <p id={`${name}-hint`} className="text-sm text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
