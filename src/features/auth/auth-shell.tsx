import type { ReactNode } from "react";

import { Container } from "@/components/layout/container";
import { ImageReveal, Reveal } from "@/components/motion";
import { PhotoPlaceholder } from "@/components/ui/photo-placeholder";
import { authContent } from "@/content/auth";

type AuthShellProps = {
  overline: string;
  title: string;
  description: string;
  children: ReactNode;
};

/**
 * Shared frame for /login and /register: the form on the left,
 * a quiet blush panel with the clinic's promises on the right (large screens only).
 */
export function AuthShell({ overline, title, description, children }: AuthShellProps) {
  return (
    <section aria-labelledby="auth-title" className="pt-28 pb-16 sm:pt-32 lg:pt-36 lg:pb-24">
      <Container className="grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
        <Reveal className="mx-auto w-full max-w-md lg:mx-0 lg:py-6">
          <p className="overline-text">{overline}</p>
          <h1 id="auth-title" className="mt-4 font-display text-[2.5rem] leading-[1.08] sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 text-lg leading-[1.6] text-foreground">{description}</p>

          <div className="mt-10">{children}</div>
        </Reveal>

        <aside aria-label="Why DermaVision" className="hidden lg:block">
          <div className="flex flex-col gap-10 rounded-xl bg-surface-blush p-10 xl:p-12">
            <ImageReveal className="mx-auto w-[72%] overflow-hidden rounded-t-full rounded-b-lg">
              {/* Ivory ground so the arch reads against the blush panel */}
              <PhotoPlaceholder alt="The DermaVision clinic" className="aspect-[4/5] w-full bg-background" />
            </ImageReveal>

            <div className="flex flex-col gap-5">
              <p className="font-display text-[2rem] leading-[1.15] text-heading">{authContent.panel.title}</p>
              <ul className="flex flex-col gap-3">
                {authContent.panel.points.map((point) => (
                  <li key={point} className="flex items-start gap-3 text-[0.9375rem] text-heading">
                    <span
                      aria-hidden="true"
                      className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-surface text-success"
                    >
                      <svg viewBox="0 0 16 16" className="size-3" fill="none">
                        <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>
      </Container>
    </section>
  );
}
