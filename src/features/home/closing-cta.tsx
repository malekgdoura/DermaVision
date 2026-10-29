import Link from "next/link";

import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/motion";
import { ButtonArrow, buttonVariants } from "@/components/ui/button";
import { closingCta } from "@/content/home";

export function ClosingCta() {
  return (
    <section aria-labelledby="closing-cta-title" className="py-20 lg:py-28">
      <Container>
        <Reveal className="flex flex-col items-center gap-6 rounded-xl bg-surface-blush px-6 py-16 text-center sm:px-12 lg:py-24">
          <h2 id="closing-cta-title" className="max-w-2xl font-display text-[2.25rem] leading-[1.1] sm:text-5xl">
            {closingCta.title}
          </h2>
          <p className="max-w-xl text-lg text-foreground">{closingCta.description}</p>
          <div className="mt-2 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link href={closingCta.primaryCta.href} className={buttonVariants({ size: "lg" })}>
              {closingCta.primaryCta.label}
              <ButtonArrow />
            </Link>
            <Link href={closingCta.secondaryCta.href} className={buttonVariants({ variant: "secondary", size: "lg" })}>
              {closingCta.secondaryCta.label}
            </Link>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
