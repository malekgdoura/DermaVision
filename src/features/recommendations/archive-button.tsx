"use client";

import { useTransition } from "react";

import { Button } from "@/components/ui/button";

/** Archive or restore button. Archiving asks for confirmation; restoring does not. */
export function ArchiveButton({
  action,
  label,
  confirmText,
}: {
  action: () => Promise<void>;
  label: string;
  confirmText?: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-9 px-4"
      disabled={pending}
      onClick={() => {
        if (confirmText && !window.confirm(confirmText)) return;
        startTransition(() => action());
      }}
    >
      {pending ? "…" : label}
    </Button>
  );
}
