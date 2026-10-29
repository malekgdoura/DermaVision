"use client";

import { motion } from "motion/react";
import type { ComponentProps } from "react";

import { distance, duration, ease, revealViewport } from "@/config/motion";

import { useReducedMotion } from "./use-reduced-motion";

type RevealProps = ComponentProps<typeof motion.div> & {
  /** Delay in seconds before the reveal starts. */
  delay?: number;
  /** Rise distance in px (defaults to the section distance, 24px). */
  y?: number;
};

/**
 * Fades and rises its content the first time it scrolls into view.
 * With reduced motion it only fades.
 */
export function Reveal({ delay = 0, y = distance.section, children, ...props }: RevealProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: reduceMotion ? 0 : y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={revealViewport}
      transition={{
        duration: reduceMotion ? 0.15 : duration.reveal,
        ease: ease.outExpo,
        delay: reduceMotion ? 0 : delay,
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
