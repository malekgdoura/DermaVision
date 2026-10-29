import Link from "next/link";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

export function Logo({ className, onClick }: { className?: string; onClick?: () => void }) {
  return (
    <Link
      href="/"
      onClick={onClick}
      className={cn("inline-flex min-h-11 items-center font-display text-[1.75rem] leading-none text-heading", className)}
    >
      {siteConfig.name}
    </Link>
  );
}
