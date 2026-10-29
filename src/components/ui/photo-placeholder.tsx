import { photoPlaceholderLabel } from "@/content/home";
import { cn } from "@/lib/utils";

type PhotoPlaceholderProps = {
  className?: string;
  /** Describes the future photo for screen readers, e.g. "Portrait of a doctor". */
  alt: string;
  /** Soft silhouette shape: a head-and-shoulders bust or an abstract form. */
  shape?: "portrait" | "abstract";
};

/**
 * Neutral blush/beige stand-in for a real photo. Never replaced by AI-generated faces.
 */
export function PhotoPlaceholder({ className, alt, shape = "portrait" }: PhotoPlaceholderProps) {
  return (
    <div role="img" aria-label={`${alt} (${photoPlaceholderLabel.toLowerCase()})`} className={cn("relative overflow-hidden bg-surface-blush", className)}>
      <svg aria-hidden="true" viewBox="0 0 400 500" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full">
        {shape === "portrait" ? (
          <g fill="var(--surface-beige)">
            <ellipse cx="200" cy="210" rx="92" ry="118" />
            <path d="M40 520c0-110 72-180 160-180s160 70 160 180z" />
          </g>
        ) : (
          <g fill="var(--surface-beige)">
            <circle cx="250" cy="200" r="150" opacity="0.7" />
            <circle cx="120" cy="380" r="110" opacity="0.5" />
          </g>
        )}
      </svg>
      <span className="absolute bottom-3 left-3 rounded-full bg-surface/90 px-3 py-1 text-[0.8125rem] font-medium text-muted-foreground">
        {photoPlaceholderLabel}
      </span>
    </div>
  );
}
