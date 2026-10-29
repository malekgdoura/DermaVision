import { CircleAlert, CircleCheck, TriangleAlert } from "lucide-react";

import type { ReviewActionState } from "@/server/review/actions";
import { cn } from "@/lib/utils";

/** Result of a review action, announced to screen readers. Nothing while idle. */
export function ActionMessage({ state, className }: { state: ReviewActionState; className?: string }) {
  if (state.status === "idle") return <p role="status" aria-live="polite" className="sr-only" />;

  const success = state.status === "success";
  const Icon = success ? CircleCheck : CircleAlert;

  return (
    <div role={success ? "status" : "alert"} aria-live="polite" className={cn("flex flex-col gap-2", className)}>
      <p
        className={cn(
          "flex items-start gap-2 rounded-md px-4 py-3 text-sm font-medium",
          success ? "bg-success/10 text-success" : "bg-destructive/8 text-destructive",
        )}
      >
        <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" strokeWidth={2} />
        {state.message}
      </p>
      {success && state.notice ? (
        <p className="flex items-start gap-2 rounded-md bg-marker-orange-soft px-4 py-3 text-sm text-marker-orange-text">
          <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" strokeWidth={2} />
          {state.notice}
        </p>
      ) : null}
    </div>
  );
}
