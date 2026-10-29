"use client";

import { motion, type Variants } from "motion/react";
import type { ComponentProps } from "react";

import { distance, duration, ease, revealViewport, stagger } from "@/config/motion";

import { useReducedMotion } from "./use-reduced-motion";

type StaggerProps = ComponentProps<typeof motion.div> & {
  /** Seconds between children (defaults to the card stagger, 60ms). */
  interval?: number;
};

/**
 * Reveals its <StaggerItem> children one after another when the group scrolls into view.
 */
export function Stagger({ interval = stagger.cards, children, ...props }: StaggerProps) {
  const reduceMotion = useReducedMotion();

  const container: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: reduceMotion ? 0 : interval } },
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      whileInView="visible"
      viewport={revealViewport}
      {...props}
    >
      {children}
    </motion.div>
  );
}

type StaggerItemProps = ComponentProps<typeof motion.div>;

export function StaggerItem({ children, ...props }: StaggerItemProps) {
  const reduceMotion = useReducedMotion();

  const item: Variants = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : distance.section },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: reduceMotion ? 0.15 : duration.reveal, ease: ease.outExpo },
    },
  };

  return (
    <motion.div variants={item} {...props}>
      {children}
    </motion.div>
  );
}
