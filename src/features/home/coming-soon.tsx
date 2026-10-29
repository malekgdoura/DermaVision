import Link from "next/link";

import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/motion";
import { buttonVariants } from "@/components/ui/button";

type ComingSoonProps = {
  overline: string;
  title: string;
  description: string;
};

/** Polished placeholder for routes that are planned but not built yet. No functionality. */
export function ComingSoon({ overline, title, description }: ComingSoonProps) {
  return (
    <section aria-labelledby="coming-soon-title" className="pt-36 pb-24 lg:pt-44 lg:pb-32">
      <Container>
        <Reveal className="mx-auto flex max-w-2xl flex-col items-center gap-5 rounded-xl bg-surface-blush px-6 py-16 text-center sm:px-12">
          <p className="overline-text">{overline}</p>
          <h1 id="coming-soon-title" className="font-display text-[2.5rem] leading-[1.1] sm:text-5xl">
            {title}
          </h1>
          <p className="max-w-md text-lg text-foreground">{description}</p>
          <p className="rounded-full bg-surface px-4 py-1.5 text-sm font-medium text-muted-foreground">Coming soon</p>
          <Link href="/" className={buttonVariants({ variant: "secondary", className: "mt-2" })}>
            Back to home
          </Link>
        </Reveal>
      </Container>
    </section>
  );
}
