"use client";

import { motion } from "motion/react";

import { useReducedMotion } from "@/components/motion/use-reduced-motion";
import { ease } from "@/config/motion";
import { cn } from "@/lib/utils";

export type MarkerTone = "orange" | "rose" | "blue";

const ringClass: Record<MarkerTone, string> = {
  orange: "border-marker-orange bg-marker-orange-fill/55",
  rose: "border-marker-rose bg-marker-rose-fill/55",
  blue: "border-marker-blue bg-marker-blue-fill/55",
};

const chipClass: Record<MarkerTone, string> = {
  orange: "bg-marker-orange-soft text-marker-orange-text",
  rose: "bg-marker-rose-soft text-marker-rose-text",
  blue: "bg-marker-blue-soft text-marker-blue-text",
};

const dotClass: Record<MarkerTone, string> = {
  orange: "bg-marker-orange",
  rose: "bg-marker-rose",
  blue: "bg-marker-blue",
};

type AnalysisMarkerProps = {
  number: number;
  tone: MarkerTone;
  /** Position inside the photo frame, in % of its width/height. */
  x: number;
  y: number;
  /** Diameter in px. */
  size?: number;
  show: boolean;
  /** Seconds before this marker appears (180ms stagger between markers). */
  delay?: number;
  highlighted?: boolean;
  dimmed?: boolean;
};

/**
 * Numbered AI marker placed on a photo: colored ring, soft fill, white halo.
 * Always paired with a FindingChip carrying the same number and a text label.
 */
export function AnalysisMarker({
  number,
  tone,
  x,
  y,
  size = 44,
  show,
  delay = 0,
  highlighted,
  dimmed,
}: AnalysisMarkerProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      aria-hidden="true"
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${x}%`, top: `${y}%`, width: size, height: size }}
      initial={false}
      animate={
        show
          ? { opacity: dimmed ? 0.5 : 1, scale: 1 }
          : { opacity: 0, scale: reduceMotion ? 1 : 0.6 }
      }
      transition={{ duration: reduceMotion ? 0.15 : 0.5, ease: ease.outExpo, delay: show && !reduceMotion ? delay : 0 }}
    >
      <span
        className={cn(
          "block h-full w-full rounded-full border-2 shadow-[0_0_0_2px_rgb(255_255_255/0.9)] transition-[border-width] duration-(--duration-hover)",
          ringClass[tone],
          highlighted && "border-[3px]",
        )}
      />
      <span className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-surface text-[0.6875rem] font-semibold text-heading shadow-sm">
        {number}
      </span>
    </motion.div>
  );
}

/** Text equivalent of a marker: number + finding, in the marker's text-safe color. */
export function FindingChip({ number, tone, label }: { number: number; tone: MarkerTone; label: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[0.8125rem] font-medium", chipClass[tone])}>
      <span aria-hidden="true" className={cn("size-2 rounded-full", dotClass[tone])} />
      <span>
        <span className="tabular">{number}</span> · {label}
      </span>
    </span>
  );
}
