"use client";

import { motion } from "motion/react";
import type { ComponentProps } from "react";

import { ease } from "@/config/motion";

import { useReducedMotion } from "./use-reduced-motion";

type FloatProps = ComponentProps<typeof motion.div> & {
  /** Float amplitude in px (4 to 6). */
  amplitude?: number;
  /** Loop length in seconds (8 to 12). */
  period?: number;
  /** Start offset in seconds, to keep two floating layers out of phase. */
  phase?: number;
};

/** Slow ambient float for hero layers only. Never on text, never in dashboards. */
export function Float({ amplitude = 4, period = 10, phase = 0, children, ...props }: FloatProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) return <motion.div {...props}>{children}</motion.div>;

  return (
    <motion.div
      animate={{ y: [0, -amplitude, 0] }}
      transition={{ duration: period, ease: ease.inOutSine, repeat: Infinity, delay: phase }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
