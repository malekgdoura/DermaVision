"use client";

import { motion } from "motion/react";
import Link from "next/link";

import { useReducedMotion } from "@/components/motion/use-reduced-motion";
import { Container } from "@/components/layout/container";
import { ButtonArrow, buttonVariants } from "@/components/ui/button";
import { hero } from "@/content/home";
import { distance, duration, ease, stagger } from "@/config/motion";
import { cn } from "@/lib/utils";

import { HeroVisual } from "./hero-visual";

export function HeroSection() {
  const reduceMotion = useReducedMotion();

  // Hero text is the LCP element: it starts immediately and is fully visible by ~700ms.
  const rise = (index: number) => ({
    initial: { opacity: 0, y: reduceMotion ? 0 : distance.section },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: reduceMotion ? 0.15 : duration.reveal,
      ease: ease.outExpo,
      delay: reduceMotion ? 0 : 0.05 + index * stagger.text,
    },
  });

  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden pt-28 pb-16 sm:pt-32 lg:pt-36 lg:pb-24">
      {/* Barely visible ivory-to-blush fade behind the hero */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-b from-background via-surface-blush/45 to-background" />

      <Container className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
        <div className="flex flex-col">
          <motion.p className="overline-text" {...rise(0)}>
            {hero.overline}
          </motion.p>

          <h1 id="hero-title" className="mt-5 font-display text-[2.875rem] leading-[1.02] sm:text-6xl lg:text-[4.5rem]">
            {hero.titleLines.map((line, index) => (
              <motion.span
                key={line}
                className={cn("block", index === hero.italicLine && "text-primary italic")}
                {...rise(index + 1)}
              >
                {line}
              </motion.span>
            ))}
          </h1>

          <motion.p className="mt-6 max-w-[34rem] text-lg leading-[1.65] text-foreground" {...rise(4)}>
            {hero.description}
          </motion.p>

          <motion.div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center" {...rise(5)}>
            <Link href={hero.primaryCta.href} className={buttonVariants({ size: "lg" })}>
              {hero.primaryCta.label}
              <ButtonArrow />
            </Link>
            <Link href={hero.secondaryCta.href} className={buttonVariants({ variant: "secondary", size: "lg" })}>
              {hero.secondaryCta.label}
            </Link>
          </motion.div>
        </div>

        <HeroVisual />
      </Container>
    </section>
  );
}
