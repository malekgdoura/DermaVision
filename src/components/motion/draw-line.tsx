"use client";

import { motion, useScroll, useSpring, type MotionValue } from "motion/react";
import { useRef } from "react";

import { cn } from "@/lib/utils";

import { useReducedMotion } from "./use-reduced-motion";

/**
 * Exposes a 0 to 1 progress value while `children` scroll through the viewport,
 * so a line can draw itself in step. Reduced motion: always fully drawn.
 */
export function useDrawProgress() {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 55%"] });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });
  return { ref, progress, reduceMotion: Boolean(reduceMotion) };
}

/** A track line with a burgundy fill that grows with `progress`. */
export function DrawLine({
  progress,
  orientation = "horizontal",
  reduceMotion,
  className,
}: {
  progress: MotionValue<number>;
  orientation?: "horizontal" | "vertical";
  reduceMotion: boolean;
  className?: string;
}) {
  const horizontal = orientation === "horizontal";
  return (
    <div aria-hidden="true" className={cn("relative bg-border", horizontal ? "h-px" : "w-px", className)}>
      <motion.div
        className={cn("absolute inset-0 bg-primary", horizontal ? "origin-left" : "origin-top")}
        style={horizontal ? { scaleX: reduceMotion ? 1 : progress } : { scaleY: reduceMotion ? 1 : progress }}
      />
    </div>
  );
}
