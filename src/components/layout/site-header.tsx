"use client";

import { LayoutGroup, motion, useMotionValueEvent, useScroll } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { useReducedMotion } from "@/components/motion/use-reduced-motion";
import { buttonVariants } from "@/components/ui/button";
import { doctorNavLinks, memberNavLinks, navLinks, routes } from "@/content/home";
import { SignOutButton } from "@/features/auth/sign-out-button";
import { springSelect } from "@/config/motion";
import { cn } from "@/lib/utils";

import { Logo } from "./logo";
import { MobileMenu } from "./mobile-menu";

/** Tracks which homepage section is in view, for the active nav indicator. */
function useActiveSection(ids: string[], enabled: boolean) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    // A section counts as active while it crosses the upper-middle band of the viewport.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-35% 0px -60% 0px" },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [ids, enabled]);

  return enabled ? active : null;
}

const sectionIds = navLinks.map((link) => link.href.replace("#", ""));

/** Who is looking: signed-in patients and doctors get their account navigation; "loading" while the session is read. */
export type HeaderViewer = "guest" | "member" | "doctor" | "loading";

/** Account links for a signed-in viewer, null for guests. */
export function accountNavLinks(viewer: HeaderViewer) {
  if (viewer === "doctor") return doctorNavLinks;
  if (viewer === "member") return memberNavLinks;
  return null;
}

/** A member link is active on its page; "My analyses" also covers a result and the comparison. */
export function isMemberLinkActive(href: string, pathname: string) {
  if (href === routes.reviews || href === routes.recommendations) return pathname === href || pathname.startsWith(`${href}/`);
  if (href === "/analysis") return pathname === "/analysis" || (pathname.startsWith("/analysis/") && pathname !== "/analysis/new");
  return pathname === href;
}

export function SiteHeader({ viewer = "guest" }: { viewer?: HeaderViewer }) {
  const accountLinks = accountNavLinks(viewer);
  const member = accountLinks !== null;
  const pathname = usePathname();
  const isHome = pathname === "/";
  const reduceMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const activeSection = useActiveSection(sectionIds, isHome && !member);

  useMotionValueEvent(scrollY, "change", (y) => {
    const previous = scrollY.getPrevious() ?? 0;
    setScrolled(y > 24);
    // Below lg only (see class below): hide when scrolling down, show when scrolling up.
    setHidden(y > 120 && y > previous);
  });

  const solid = scrolled || !isHome;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color,box-shadow,translate] duration-(--duration-component) ease-out-soft",
        solid ? "border-border bg-surface/95 shadow-sm backdrop-blur-sm" : "border-transparent bg-transparent",
        hidden && !reduceMotion ? "max-lg:-translate-y-full" : "translate-y-0",
      )}
    >
      <div className="mx-auto flex h-18 w-full max-w-[1200px] items-center justify-between gap-6 px-4 sm:px-6 lg:h-22 lg:px-8">
        <Logo />

        <nav aria-label="Main" className="hidden lg:block">
          <LayoutGroup id="main-nav">
            <ul className={cn("flex items-center", member ? "gap-6 xl:gap-8" : "gap-8")}>
              {(accountLinks ?? navLinks).map((link) => {
                const isActive = member
                  ? isMemberLinkActive(link.href, pathname)
                  : activeSection === link.href.replace("#", "");
                return (
                  <li key={link.href} className="relative">
                    <Link
                      href={member || isHome ? link.href : `/${link.href}`}
                      aria-current={isActive ? (member ? "page" : "true") : undefined}
                      className={cn(
                        "relative flex min-h-11 items-center text-[0.9375rem] font-medium transition-colors duration-(--duration-hover)",
                        isActive ? "text-primary" : "text-heading hover:text-primary",
                      )}
                    >
                      {link.label}
                      {isActive && (
                        <motion.span
                          layoutId="nav-indicator"
                          aria-hidden="true"
                          className="absolute inset-x-0 bottom-1.5 h-0.5 rounded-full bg-primary"
                          transition={reduceMotion ? { duration: 0 } : springSelect}
                        />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </LayoutGroup>
        </nav>

        <div className="hidden items-center gap-6 lg:flex">
          {member ? (
            <SignOutButton className="h-11 px-5 text-[0.9375rem]" />
          ) : (
            <>
              {viewer === "guest" ? (
                <Link
                  href={routes.login}
                  className="inline-flex min-h-11 items-center text-[0.9375rem] font-medium text-primary underline-offset-4 transition-colors hover:text-primary-hover hover:underline"
                >
                  Log in
                </Link>
              ) : null}
              <Link href={routes.book} className={buttonVariants({ size: "sm" })}>
                Book a consultation
              </Link>
            </>
          )}
        </div>

        <MobileMenu isHome={isHome} viewer={viewer} />
      </div>
    </header>
  );
}
