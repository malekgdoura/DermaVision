"use client";

import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { useState } from "react";

import { Container } from "@/components/layout/container";
import { ImageReveal } from "@/components/motion";
import { useReducedMotion } from "@/components/motion/use-reduced-motion";
import { PhotoPlaceholder } from "@/components/ui/photo-placeholder";
import { treatmentCategories, treatments, treatmentsSection } from "@/content/home";
import { duration, ease, springSelect } from "@/config/motion";
import { cn } from "@/lib/utils";
import type { TreatmentCategory } from "@/types/content";

import { SectionHeading } from "./section-heading";

type Filter = TreatmentCategory | "all";

export function TreatmentsSection() {
  const [filter, setFilter] = useState<Filter>("all");
  const reduceMotion = useReducedMotion();
  const visible = filter === "all" ? treatments : treatments.filter((t) => t.category === filter);
  const categoryLabel = (id: TreatmentCategory) => treatmentCategories.find((c) => c.id === id)?.label ?? id;
  const filters: { id: Filter; label: string }[] = [{ id: "all", label: "All" }, ...treatmentCategories];

  return (
    <section id="treatments" aria-labelledby="treatments-title" className="scroll-mt-24 py-20 lg:py-28">
      <Container>
        <div className="flex flex-col gap-8">
          <SectionHeading
            id="treatments-title"
            overline={treatmentsSection.overline}
            title={treatmentsSection.title}
            description={treatmentsSection.description}
          />

          <LayoutGroup id="treatment-filters">
            <div role="group" aria-label="Filter treatments by concern" className="flex flex-wrap gap-2">
              {filters.map((option) => {
                const selected = filter === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setFilter(option.id)}
                    className={cn(
                      "relative h-11 cursor-pointer rounded-full border px-4 text-sm font-medium transition-colors duration-(--duration-hover)",
                      selected ? "border-primary text-primary" : "border-border text-heading hover:border-border-strong",
                    )}
                  >
                    {selected && (
                      <motion.span
                        layoutId="treatment-filter"
                        aria-hidden="true"
                        className="absolute inset-0 rounded-full bg-primary-soft"
                        transition={reduceMotion ? { duration: 0 } : springSelect}
                      />
                    )}
                    <span className="relative">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </LayoutGroup>
        </div>

        {/* Editorial grid: alternating wide and narrow cards */}
        <motion.ul layout={!reduceMotion} className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-12" aria-live="polite">
          <AnimatePresence mode="popLayout" initial={false}>
            {visible.map((treatment, index) => {
              const wide = index % 4 === 0 || index % 4 === 3;
              return (
                <motion.li
                  key={treatment.id}
                  layout={!reduceMotion}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reduceMotion ? 0.15 : duration.component, ease: ease.outSoft }}
                  className={wide ? "lg:col-span-7" : "lg:col-span-5"}
                >
                  <article className="group flex h-full flex-col overflow-hidden rounded-lg border border-border bg-surface">
                    {/* Narrow cards use a taller ratio so both image heights match in a row */}
                    <ImageReveal className={cn("aspect-[16/10]", !wide && "lg:aspect-[8/7]")}>
                      <div className="h-full w-full transition-transform duration-[600ms] ease-out-soft group-hover:scale-[1.04]">
                        <PhotoPlaceholder alt={`${treatment.name} at the clinic`} shape="abstract" className="h-full w-full" />
                      </div>
                    </ImageReveal>
                    <div className="flex flex-1 flex-col gap-2 p-6 lg:p-8">
                      <p className="text-[0.8125rem] font-medium text-muted-foreground">{categoryLabel(treatment.category)}</p>
                      <h3 className="text-xl font-semibold">{treatment.name}</h3>
                      <p className="text-foreground">{treatment.description}</p>
                    </div>
                  </article>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </motion.ul>
      </Container>
    </section>
  );
}
