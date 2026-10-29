"use client";

import { motion, useTransform, type MotionValue } from "motion/react";

import { Container } from "@/components/layout/container";
import { DrawLine, useDrawProgress } from "@/components/motion";
import { howItWorks } from "@/content/home";

import { SectionHeading } from "./section-heading";

function Step({
  index,
  total,
  title,
  description,
  progress,
  reduceMotion,
}: {
  index: number;
  total: number;
  title: string;
  description: string;
  progress: MotionValue<number>;
  reduceMotion: boolean;
}) {
  // Each step reveals as the line reaches it.
  const threshold = total > 1 ? index / (total - 1) : 0;
  const opacity = useTransform(progress, [Math.max(0, threshold - 0.25), threshold], [0.25, 1]);
  const y = useTransform(progress, [Math.max(0, threshold - 0.25), threshold], [16, 0]);

  return (
    <motion.li
      className="relative flex gap-6 lg:flex-col lg:gap-5"
      style={{ opacity: reduceMotion ? 1 : opacity, y: reduceMotion ? 0 : y }}
    >
      <span className="relative z-10 flex size-14 shrink-0 items-center justify-center rounded-full border border-border bg-background font-display text-[2rem] leading-none text-primary">
        {index + 1}
      </span>
      <div className="flex flex-col gap-2 pt-2 lg:pt-0">
        <h3 className="text-xl font-semibold">{title}</h3>
        <p className="max-w-xs text-foreground">{description}</p>
      </div>
    </motion.li>
  );
}

export function HowItWorks() {
  const { ref, progress, reduceMotion } = useDrawProgress();
  const steps = howItWorks.steps;

  return (
    <section id="how-it-works" aria-labelledby="how-it-works-title" className="scroll-mt-24 py-20 lg:py-28">
      <Container>
        <SectionHeading id="how-it-works-title" overline={howItWorks.overline} title={howItWorks.title} />

        <div ref={ref} className="relative mt-14 lg:mt-16">
          {/* Line behind the step numbers: vertical on small screens, horizontal from lg */}
          <DrawLine
            progress={progress}
            orientation="vertical"
            reduceMotion={reduceMotion}
            className="absolute top-7 bottom-7 left-7 lg:hidden"
          />
          <DrawLine
            progress={progress}
            orientation="horizontal"
            reduceMotion={reduceMotion}
            className="absolute top-7 right-[calc(33.333%-3.417rem)] left-7 hidden lg:block"
          />

          <ol className="relative grid gap-12 lg:grid-cols-3 lg:gap-10">
            {steps.map((step, index) => (
              <Step
                key={step.title}
                index={index}
                total={steps.length}
                title={step.title}
                description={step.description}
                progress={progress}
                reduceMotion={reduceMotion}
              />
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}
