"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { useReducedMotion } from "@/components/motion/use-reduced-motion";
import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/motion";
import { aiShowcase } from "@/content/home";
import { duration, ease, stagger } from "@/config/motion";
import { AnalysisMarker, FindingChip } from "@/features/analysis/analysis-marker";
import { cn } from "@/lib/utils";

import { SectionHeading } from "./section-heading";

const markerPositions = [
  { x: 60, y: 36 },
  { x: 38, y: 56 },
  { x: 58, y: 70 },
];

/**
 * Illustrated photo frame in one of three states:
 * 0 face guide, 1 AI markers + findings, 2 doctor-reviewed.
 */
function ShowcaseFrame({ step, className }: { step: number; className?: string }) {
  const reduceMotion = useReducedMotion();
  const showMarkers = step >= 1;
  const reviewed = step >= 2;

  return (
    <div className={cn("relative overflow-hidden rounded-xl bg-surface-blush", className)}>
      <div aria-hidden="true" className="absolute inset-0">
        <svg viewBox="0 0 400 500" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice">
          <ellipse cx="200" cy="230" rx="112" ry="146" fill="var(--surface-beige)" />
          <path d="M60 540c0-110 62-170 140-170s140 60 140 170z" fill="var(--surface-beige)" />
          {/* Face guide: draws its outline in step 0, fades once markers arrive */}
          <motion.ellipse
            cx="200"
            cy="230"
            rx="132"
            ry="168"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="2"
            strokeDasharray="6 8"
            initial={{ pathLength: reduceMotion ? 1 : 0, opacity: 0.9 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true, amount: 0.5 }}
            animate={{ opacity: step === 0 ? 0.9 : 0 }}
            transition={{ duration: reduceMotion ? 0.15 : 0.7, ease: ease.outSoft }}
          />
        </svg>

        {aiShowcase.findings.map((finding, index) => (
          <AnalysisMarker
            key={finding.id}
            number={finding.id}
            tone={finding.tone}
            x={markerPositions[index].x}
            y={markerPositions[index].y}
            size={52}
            show={showMarkers}
            delay={index * stagger.markers}
          />
        ))}
      </div>

      {/* Doctor-reviewed seal */}
      <AnimatePresence>
        {reviewed && (
          <motion.div
            key="seal"
            className="absolute top-4 right-4 flex items-center gap-2.5 rounded-full bg-surface py-2 pr-4 pl-2 shadow-md"
            initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0.15 : duration.component, ease: ease.outExpo }}
          >
            <span aria-hidden="true" className="flex size-8 items-center justify-center rounded-full bg-success/12 text-success">
              <svg viewBox="0 0 24 24" className="size-5" fill="none">
                <motion.circle
                  cx="12"
                  cy="12"
                  r="9"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  initial={{ pathLength: reduceMotion ? 1 : 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: reduceMotion ? 0 : 0.5, ease: ease.outSoft }}
                />
                <path d="M8 12.5l2.5 2.5 5-5.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="text-sm font-semibold text-heading">Reviewed</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Finding chips: text equivalent of the markers */}
      <div className="absolute inset-x-4 bottom-4">
        <motion.ul
          aria-label="Example findings"
          className="flex flex-wrap gap-2"
          initial={false}
          animate={{ opacity: showMarkers ? 1 : 0 }}
          transition={{ duration: reduceMotion ? 0.15 : 0.4, delay: showMarkers && !reduceMotion ? 0.3 : 0 }}
        >
          {aiShowcase.findings.map((finding) => (
            <li key={finding.id} className="rounded-full bg-surface/80">
              <FindingChip number={finding.id} tone={finding.tone} label={finding.label} />
            </li>
          ))}
        </motion.ul>
      </div>

      <span className="absolute top-4 left-4 rounded-full bg-surface/90 px-3 py-1 text-[0.8125rem] font-medium text-muted-foreground">
        Illustration
      </span>
    </div>
  );
}

export function AiShowcase() {
  const [active, setActive] = useState(0);
  const stepRefs = useRef<(HTMLLIElement | null)[]>([]);

  // Native sticky scroll: the active step is the text block crossing the middle of the viewport.
  // No scroll snapping or speed changes.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.step));
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    stepRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const steps = aiShowcase.steps;

  return (
    <section id="skin-analysis" aria-labelledby="skin-analysis-title" className="scroll-mt-24 bg-surface py-20 lg:py-28">
      <Container>
        <SectionHeading id="skin-analysis-title" overline={aiShowcase.overline} title={aiShowcase.title} />

        {/* Small and medium screens: each step followed by its own frame */}
        <ol className="mt-12 flex flex-col gap-14 lg:hidden">
          {steps.map((step, index) => (
            <li key={step.title}>
              <Reveal className="flex flex-col gap-6">
                <div className="flex flex-col gap-3">
                  <span className="font-display text-4xl leading-none text-primary">{index + 1}</span>
                  <h3 className="text-2xl font-semibold">{step.title}</h3>
                  <p className="text-foreground">{step.description}</p>
                </div>
                <ShowcaseFrame step={index} className="aspect-[4/5] w-full max-w-md" />
              </Reveal>
            </li>
          ))}
        </ol>

        {/* Large screens: text scrolls on the left, the frame stays pinned on the right */}
        <div className="mt-16 hidden grid-cols-2 gap-16 lg:grid">
          <ol>
            {steps.map((step, index) => (
              <li
                key={step.title}
                ref={(el) => {
                  stepRefs.current[index] = el;
                }}
                data-step={index}
                className="flex min-h-[70vh] flex-col justify-center"
              >
                <div
                  className={cn(
                    "flex max-w-md flex-col gap-4 transition-opacity duration-(--duration-component) ease-out-soft",
                    active === index ? "opacity-100" : "opacity-35",
                  )}
                  aria-current={active === index ? "step" : undefined}
                >
                  <span className="font-display text-5xl leading-none text-primary">{index + 1}</span>
                  <h3 className="text-[1.75rem] leading-tight font-semibold">{step.title}</h3>
                  <p className="text-lg leading-[1.65] text-foreground">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="relative @container">
            <div className="sticky top-[max(7rem,calc(50vh-18rem))]">
              <ShowcaseFrame step={active} className="mx-auto aspect-[4/5] h-[min(36rem,calc(100vh-11rem),125cqw)] w-auto" />
              <ol aria-hidden="true" className="mt-5 flex justify-center gap-2">
                {steps.map((step, index) => (
                  <li
                    key={step.title}
                    className={cn(
                      "h-1 rounded-full transition-all duration-(--duration-component) ease-out-soft",
                      active === index ? "w-8 bg-primary" : "w-4 bg-border-strong",
                    )}
                  />
                ))}
              </ol>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
