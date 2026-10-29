import Link from "next/link";

import { footer } from "@/content/home";
import { siteConfig } from "@/config/site";

import { Container } from "./container";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <Container className="grid gap-12 pt-16 pb-10 md:grid-cols-[1.4fr_1fr_1fr] lg:pt-20">
        <div className="flex flex-col gap-4">
          <p className="max-w-xs text-lg text-heading">{footer.tagline}</p>
          <div className="flex flex-col gap-1 text-sm text-muted-foreground">
            <p>{footer.address}</p>
            <p>{footer.hours}</p>
          </div>
        </div>

        {footer.columns.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <h2 className="mb-4 text-sm font-semibold text-heading">{column.title}</h2>
            <ul className="flex flex-col gap-1">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="inline-block py-1.5 text-[0.9375rem] text-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </Container>

      <Container>
        <p
          aria-hidden="true"
          className="font-display text-[clamp(4rem,17vw,13.5rem)] leading-[0.85] tracking-[-0.02em] text-surface-blush select-none"
        >
          {siteConfig.name}
        </p>
      </Container>

      <Container>
        <div className="flex flex-col gap-2 border-t border-border py-6 text-sm text-muted-foreground sm:flex-row sm:justify-between">
          <p>© {siteConfig.name}</p>
          <p>{footer.legal}</p>
        </div>
      </Container>
    </footer>
  );
}
