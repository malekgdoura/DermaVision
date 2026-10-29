import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/**
 * Pill buttons from the DermaVision design system.
 * Use `buttonVariants` on a <Link> when the action navigates.
 */
export const buttonVariants = cva(
  [
    "group/button inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap select-none",
    "transition-[background-color,border-color,color,box-shadow,transform] duration-(--duration-hover) ease-standard",
    "active:scale-[0.97] active:duration-(--duration-press)",
    "disabled:pointer-events-none disabled:opacity-45",
    "[&_svg]:size-[1.125em] [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground hover:-translate-y-px hover:bg-primary-hover hover:shadow-md",
        secondary:
          "border-[1.5px] border-primary text-primary hover:border-primary-hover hover:bg-surface-blush",
        tertiary: "bg-surface-blush text-heading hover:bg-[#ede0d8]",
        ghost: "text-heading hover:bg-surface-blush",
        link: "rounded-none px-0 text-primary underline-offset-4 hover:text-primary-hover hover:underline",
      },
      size: {
        md: "h-12 px-7 text-base",
        lg: "h-14 px-8 text-base",
        sm: "h-11 px-5 text-[0.9375rem]",
        icon: "size-11",
      },
    },
    compoundVariants: [{ variant: "link", className: "h-auto px-0" }],
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonProps = ComponentProps<"button"> & VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

/** Trailing arrow that nudges 3px on button hover. */
export function ButtonArrow() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      className="transition-transform duration-(--duration-hover) ease-out-soft group-hover/button:translate-x-[3px]"
    >
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
