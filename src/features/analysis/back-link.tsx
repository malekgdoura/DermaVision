import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

/** Quiet "back" link shown above the title of the analysis pages. */
export function BackLink({ href, label, className }: { href: string; label: string; className?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex min-h-11 items-center gap-2 self-start text-[0.9375rem] font-medium text-muted-foreground transition-colors duration-(--duration-hover) hover:text-primary",
        className,
      )}
    >
      <ArrowLeft
        aria-hidden="true"
        className="size-4 transition-transform duration-(--duration-hover) ease-out-soft group-hover:-translate-x-[3px]"
        strokeWidth={1.75}
      />
      {label}
    </Link>
  );
}
