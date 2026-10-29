"use client";

import { motion, useInView } from "motion/react";
import { useRef, type ComponentProps } from "react";

import { duration, ease, revealViewport } from "@/config/motion";
import { cn } from "@/lib/utils";

import { useReducedMotion } from "./use-reduced-motion";

type ImageRevealProps = ComponentProps<typeof motion.div> & {
  delay?: number;
};

/**
 * Reveals an image (passed as children, e.g. next/image) with a clip from the bottom
 * and a slight scale settle. With reduced motion it only fades.
 */
export function ImageReveal({ delay = 0, className, children, ...props }: ImageRevealProps) {
  const reduceMotion = useReducedMotion();
  // Observe an unclipped wrapper: a fully clipped element (inset 100%) has no visible area,
  // so watching the clipped element itself may never report it as in view.
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, revealViewport);
  const transition = {
    duration: reduceMotion ? 0.15 : duration.reveal + 0.05,
    ease: ease.outExpo,
    delay: reduceMotion ? 0 : delay,
  };

  return (
    <div ref={ref} className={cn("relative", className)}>
      <motion.div
        className="h-full w-full overflow-hidden rounded-[inherit]"
        // Both properties always animate to their final value, so the end state is correct
        // even if the reduced-motion setting differs between server and client rendering.
        initial={{ clipPath: reduceMotion ? "inset(0% 0% 0% 0%)" : "inset(100% 0% 0% 0%)", opacity: reduceMotion ? 0 : 1 }}
        animate={inView ? { clipPath: "inset(0% 0% 0% 0%)", opacity: 1 } : undefined}
        transition={transition}
        {...props}
      >
        <motion.div
          className="h-full w-full"
          initial={{ scale: reduceMotion ? 1 : 1.06 }}
          animate={inView ? { scale: 1 } : undefined}
          transition={transition}
        >
          {children}
        </motion.div>
      </motion.div>
    </div>
  );
}
