"use client";

import { motion } from "motion/react";

import { useReducedMotion } from "@/components/motion/use-reduced-motion";
import { ease } from "@/config/motion";

// Same egg-shaped window as the scanner on /analysis/new.
const FACE_RADIUS = "50% 50% 46% 46% / 40% 40% 60% 60%";

/**
 * The analyzed photo in the scanner frame: one last scan pass on arrival,
 * then a slowly orbiting ring for depth. Purely decorative around the photo.
 */
export function ResultPhoto({ src, alt, caption }: { src: string; alt: string; caption: string }) {
  const reduceMotion = useReducedMotion();

  return (
    <div
      className="relative isolate aspect-[4/5] w-full overflow-hidden rounded-xl border border-border bg-surface shadow-md"
      style={{ perspective: 1100 }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(circle at 50% 42%, var(--surface) 0%, var(--background) 45%, var(--surface-blush) 100%)",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 opacity-60"
        style={{
          backgroundImage: "radial-gradient(var(--border-strong) 0.8px, transparent 0.8px)",
          backgroundSize: "22px 22px",
          maskImage: "radial-gradient(circle at 50% 45%, black 20%, transparent 72%)",
        }}
      />

      <div className="absolute inset-0 flex items-center justify-center" style={{ transformStyle: "preserve-3d" }}>
        {/* Orbit ring, split in front of and behind the photo */}
        <div
          aria-hidden="true"
          className="absolute aspect-square w-[86%]"
          style={{ transform: "rotateX(76deg)", transformStyle: "preserve-3d" }}
        >
          <motion.div
            className="absolute inset-0 rounded-full border-[1.5px] border-primary/35"
            animate={reduceMotion ? { rotateZ: 0 } : { rotateZ: 360 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 28, ease: "linear", repeat: Infinity }}
          >
            <span className="absolute top-1/2 -right-[5px] size-2.5 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_0_4px_var(--primary-soft)]" />
          </motion.div>
        </div>

        <motion.div
          className="relative aspect-[4/5] w-[62%] overflow-hidden shadow-lg ring-1 ring-border-strong/60"
          style={{ borderRadius: FACE_RADIUS, transform: "translateZ(40px)" }}
          initial={{ opacity: 0, scale: reduceMotion ? 1 : 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: ease.outExpo }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- private photo served by a protected route, not optimizable */}
          <img src={src} alt={alt} className="absolute inset-0 h-full w-full object-cover" />

          {reduceMotion ? null : (
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 h-[22%]"
              initial={{ top: "-22%", opacity: 1 }}
              animate={{ top: "100%", opacity: 0 }}
              transition={{ duration: 1.8, ease: ease.inOutSine, delay: 0.4, opacity: { delay: 2, duration: 0.3 } }}
            >
              <div className="h-full w-full bg-gradient-to-b from-transparent via-primary/12 to-primary/25" />
              <div className="h-px w-full bg-primary/80 shadow-[0_0_12px_2px_var(--primary-soft)]" />
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Viewfinder corners */}
      <div aria-hidden="true">
        <span className="absolute top-5 left-5 size-7 rounded-tl-lg border-t-2 border-l-2 border-primary opacity-40" />
        <span className="absolute top-5 right-5 size-7 rounded-tr-lg border-t-2 border-r-2 border-primary opacity-40" />
        <span className="absolute bottom-5 left-5 size-7 rounded-bl-lg border-b-2 border-l-2 border-primary opacity-40" />
        <span className="absolute right-5 bottom-5 size-7 rounded-br-lg border-r-2 border-b-2 border-primary opacity-40" />
      </div>

      <div className="absolute inset-x-0 bottom-4 flex justify-center px-4 sm:bottom-6">
        <p className="inline-flex items-center gap-2 rounded-full bg-surface/90 px-4 py-1.5 text-[0.8125rem] font-medium text-heading shadow-sm backdrop-blur">
          <span aria-hidden="true" className="size-2 rounded-full bg-primary" />
          {caption}
        </p>
      </div>
    </div>
  );
}
