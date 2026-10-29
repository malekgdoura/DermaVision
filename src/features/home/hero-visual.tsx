"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";

import { useReducedMotion } from "@/components/motion/use-reduced-motion";
import { Float, Parallax } from "@/components/motion";
import { PhotoPlaceholder } from "@/components/ui/photo-placeholder";
import { aiShowcase, hero } from "@/content/home";
import { duration, ease, scale, stagger } from "@/config/motion";
import { AnalysisMarker, FindingChip } from "@/features/analysis/analysis-marker";

const markerPositions = [
  { x: 64, y: 34 },
  { x: 36, y: 58 },
  { x: 60, y: 66 },
];

export function HeroVisual() {
  const reduceMotion = useReducedMotion();
  const [showMarkers, setShowMarkers] = useState(false);

  // Markers appear after the portrait and the floating layers have settled.
  useEffect(() => {
    const timer = window.setTimeout(() => setShowMarkers(true), reduceMotion ? 0 : 1100);
    return () => window.clearTimeout(timer);
  }, [reduceMotion]);

  const layerIn = (delay: number) => ({
    initial: { opacity: 0, scale: reduceMotion ? 1 : scale.enter },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: reduceMotion ? 0.15 : duration.reveal, ease: ease.outExpo, delay: reduceMotion ? 0 : delay },
  });

  return (
    <div className="relative mx-auto w-full max-w-[30rem] lg:max-w-none">
      {/* Arch-framed portrait */}
      <Parallax offset={-16} className="relative mx-auto w-[86%] sm:w-[78%] lg:ml-auto lg:mr-0 lg:w-[82%]">
        <motion.div
          className="overflow-hidden rounded-t-full rounded-b-xl"
          // Both properties always animate, so the final state is the same whatever
          // the reduced-motion value was during server rendering.
          initial={{ clipPath: reduceMotion ? "inset(0% 0% 0% 0%)" : "inset(100% 0% 0% 0%)", opacity: reduceMotion ? 0 : 1 }}
          animate={{ clipPath: "inset(0% 0% 0% 0%)", opacity: 1 }}
          transition={{ duration: reduceMotion ? 0.15 : 0.9, ease: ease.outExpo, delay: reduceMotion ? 0 : 0.15 }}
        >
          <PhotoPlaceholder alt="Portrait of a patient at the clinic" className="aspect-[4/5] w-full" />
        </motion.div>
      </Parallax>

      {/* Review chip, top right */}
      <Parallax offset={20} className="absolute top-[8%] right-0 sm:right-[2%] lg:right-0 xl:-right-4">
        <motion.div {...layerIn(0.75)}>
          <Float amplitude={4} period={11} phase={1.5}>
            <div className="flex items-center gap-2.5 rounded-full bg-surface py-2 pr-4 pl-2 shadow-md">
              <span aria-hidden="true" className="flex size-8 items-center justify-center rounded-full bg-success/12 text-success">
                <svg viewBox="0 0 16 16" className="size-4" fill="none">
                  <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="text-sm font-semibold text-heading">{hero.reviewChip}</span>
            </div>
          </Float>
        </motion.div>
      </Parallax>

      {/* Floating analysis preview card, bottom left */}
      <Parallax offset={24} className="absolute bottom-[-6%] left-0 w-[64%] sm:w-[56%] lg:-left-8 lg:w-[58%]">
        <motion.div {...layerIn(0.6)}>
          <Float amplitude={5} period={10}>
            <div className="rounded-lg bg-surface p-4 shadow-lg sm:p-5">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-semibold text-heading">{hero.previewTitle}</p>
                <p className="text-xs text-muted-foreground">{hero.previewNote}</p>
              </div>
              <div aria-hidden="true" className="relative mt-3 aspect-[4/3] overflow-hidden rounded-md bg-surface-blush">
                <svg viewBox="0 0 160 120" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice">
                  <ellipse cx="80" cy="64" rx="38" ry="48" fill="var(--surface-beige)" />
                </svg>
                {aiShowcase.findings.map((finding, index) => (
                  <AnalysisMarker
                    key={finding.id}
                    number={finding.id}
                    tone={finding.tone}
                    x={markerPositions[index].x}
                    y={markerPositions[index].y}
                    size={26}
                    show={showMarkers}
                    delay={index * stagger.markers}
                  />
                ))}
              </div>
              <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Example findings">
                {aiShowcase.findings.map((finding, index) => (
                  <motion.li
                    key={finding.id}
                    initial={false}
                    animate={{ opacity: showMarkers ? 1 : 0, y: showMarkers || reduceMotion ? 0 : 6 }}
                    transition={{ duration: 0.4, ease: ease.outExpo, delay: showMarkers && !reduceMotion ? index * stagger.markers : 0 }}
                  >
                    <FindingChip number={finding.id} tone={finding.tone} label={finding.label} />
                  </motion.li>
                ))}
              </ul>
            </div>
          </Float>
        </motion.div>
      </Parallax>
    </div>
  );
}
