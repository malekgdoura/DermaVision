"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { reviewWorkspace } from "@/content/review";
import { diffWords } from "@/lib/text-diff";
import { cn } from "@/lib/utils";

import { formatDateTime } from "./format";
import { ReportText } from "./report-text";

const copy = reviewWorkspace.history;

export type ReportVersionView = {
  id: string;
  number: number;
  kind: keyof typeof copy.kinds;
  style: keyof typeof reviewWorkspace.report.styles;
  language: string;
  content: string;
  model: string | null;
  createdAt: Date;
  author: { prenom: string; nom: string };
};

const kindClasses: Record<ReportVersionView["kind"], string> = {
  AI_DRAFT: "bg-ai-panel text-ai-label",
  DOCTOR_EDIT: "bg-marker-blue-soft text-marker-blue-text",
  PUBLISHED: "bg-success/10 text-success",
};

/** Every saved version, newest first, with the changes since the version before it. */
export function VersionHistory({
  versions,
  onLoad,
}: {
  versions: ReportVersionView[];
  onLoad?: (version: ReportVersionView) => void;
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <section aria-labelledby="history-title" className="flex flex-col gap-4">
      <h3 id="history-title" className="text-lg font-semibold text-heading">
        {copy.title}
        <span className="tabular ml-2 text-base font-medium text-muted-foreground">{versions.length}</span>
      </h3>

      {versions.length === 0 ? (
        <p className="text-sm text-muted-foreground">{copy.empty}</p>
      ) : (
        <ol className="flex flex-col gap-2">
          {versions.map((version, index) => {
            const previous = versions[index + 1] ?? null;
            const open = openId === version.id;
            const panelId = `version-${version.id}`;
            return (
              <li key={version.id} className="rounded-lg border border-border bg-surface">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
                  <span className="tabular text-sm font-semibold text-heading">v{version.number}</span>
                  <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", kindClasses[version.kind])}>
                    {copy.kinds[version.kind]}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {reviewWorkspace.report.styles[version.style]} · {version.language.toUpperCase()} ·{" "}
                    <time dateTime={version.createdAt.toISOString()}>{formatDateTime(version.createdAt)}</time> ·{" "}
                    {copy.by(version.author.nom)}
                    {version.model ? ` · ${version.model}` : ""}
                  </span>
                  <span className="ml-auto flex gap-2">
                    {onLoad && open ? (
                      <Button variant="ghost" size="sm" className="h-9 px-4" onClick={() => onLoad(version)}>
                        {copy.useInEditor}
                      </Button>
                    ) : null}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 px-4"
                      aria-expanded={open}
                      aria-controls={panelId}
                      onClick={() => setOpenId(open ? null : version.id)}
                    >
                      {open ? copy.hide : copy.show}
                    </Button>
                  </span>
                </div>

                {open ? (
                  <div id={panelId} className="grid gap-5 border-t border-border px-4 py-4 lg:grid-cols-2">
                    <ReportText content={version.content} />
                    <div>
                      <p className="mb-2 text-sm font-semibold text-heading">
                        {previous ? `${copy.compare} (v${previous.number})` : copy.first}
                      </p>
                      {previous ? <Diff before={previous.content} after={version.content} /> : null}
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

function Diff({ before, after }: { before: string; after: string }) {
  const parts = diffWords(before, after);
  return (
    <p className="rounded-md bg-surface-blush/60 p-3 text-sm leading-[1.7] whitespace-pre-wrap text-foreground">
      {parts.map((part, index) =>
        part.type === "same" ? (
          <span key={index}>{part.text}</span>
        ) : part.type === "added" ? (
          <ins key={index} className="bg-success/15 text-heading no-underline">
            {part.text}
          </ins>
        ) : (
          <del key={index} className="bg-destructive/10 text-destructive">
            {part.text}
          </del>
        ),
      )}
    </p>
  );
}
