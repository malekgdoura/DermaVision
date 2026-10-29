"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

import { useReducedMotion } from "@/components/motion/use-reduced-motion";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { testimonials, testimonialsSection } from "@/content/home";
import { duration, ease } from "@/config/motion";

import { SectionHeading } from "./section-heading";

/**
 * One serif pull-quote at a time, manual previous/next only (no autoplay).
 * Renders nothing until real, consented testimonials exist in content/home.ts.
 */
export function TestimonialsSection() {
  const [index, setIndex] = useState(0);
  const reduceMotion = useReducedMotion();

  if (testimonials.length === 0) return null;

  const current = testimonials[index];
  const go = (step: 1 | -1) => setIndex((i) => (i + step + testimonials.length) % testimonials.length);

  return (
    <section aria-labelledby="testimonials-title" className="py-20 lg:py-28">
      <Container className="flex flex-col items-center">
        <SectionHeading id="testimonials-title" overline={testimonialsSection.overline} title={testimonialsSection.title} align="center" />

        <div className="relative mt-12 grid min-h-56 w-full max-w-3xl place-items-center text-center" aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            <motion.figure
              key={current.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0.15 : duration.component, ease: ease.outSoft }}
              className="flex flex-col items-center gap-6"
            >
              <blockquote className="font-display text-[1.875rem] leading-[1.25] text-heading sm:text-4xl">“{current.quote}”</blockquote>
              <figcaption className="text-muted-foreground">
                {current.initials}
                {current.context && <span> · {current.context}</span>}
              </figcaption>
            </motion.figure>
          </AnimatePresence>
        </div>

        {testimonials.length > 1 && (
          <div className="mt-8 flex items-center gap-4">
            <Button variant="secondary" size="icon" aria-label="Previous testimonial" onClick={() => go(-1)}>
              <svg aria-hidden="true" viewBox="0 0 16 16" fill="none">
                <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Button>
            <p className="tabular text-sm text-muted-foreground">
              {index + 1} / {testimonials.length}
            </p>
            <Button variant="secondary" size="icon" aria-label="Next testimonial" onClick={() => go(1)}>
              <svg aria-hidden="true" viewBox="0 0 16 16" fill="none">
                <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Button>
          </div>
        )}
      </Container>
    </section>
  );
}
