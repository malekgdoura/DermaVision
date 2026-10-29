import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/** Page container: max 1200px, 16 / 24 / 32px side padding. */
export function Container({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8", className)} {...props} />;
}
