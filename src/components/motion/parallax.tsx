"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef, type ComponentProps } from "react";

import { distance } from "@/config/motion";

import { useReducedMotion } from "./use-reduced-motion";

type ParallaxProps = ComponentProps<typeof motion.div> & {
  /** Max offset in px over the element's pass through the viewport (capped at 24). */
  offset?: number;
};

/** Slow scroll-linked vertical drift. Removed with reduced motion. */
export function Parallax({ offset = distance.section, children, style, ...props }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const capped = Math.max(-distance.section, Math.min(distance.section, offset));
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [capped, -capped]);

  return (
    <motion.div ref={ref} style={{ ...style, y: reduceMotion ? 0 : y }} {...props}>
      {children}
    </motion.div>
  );
}
