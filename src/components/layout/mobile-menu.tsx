"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { useReducedMotion } from "@/components/motion/use-reduced-motion";
import { buttonVariants } from "@/components/ui/button";
import { navLinks, routes } from "@/content/home";
import { SignOutButton } from "@/features/auth/sign-out-button";
import { ease } from "@/config/motion";

import { Logo } from "./logo";
import { accountNavLinks, type HeaderViewer } from "./site-header";

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function MobileMenu({ isHome, viewer }: { isHome: boolean; viewer: HeaderViewer }) {
  const accountLinks = accountNavLinks(viewer);
  const member = accountLinks !== null;
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [openedOn, setOpenedOn] = useState(pathname);

  // Close the menu after any navigation (e.g. the redirect after signing out).
  if (open && openedOn !== pathname) {
    setOpen(false);
    setOpenedOn(pathname);
  } else if (!open && openedOn !== pathname) {
    setOpenedOn(pathname);
  }
  const reduceMotion = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  // Lock page scroll, trap focus and close on Escape while open.
  useEffect(() => {
    if (!open) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  return (
    <div className="lg:hidden">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label="Open menu"
        onClick={() => setOpen(true)}
        className="-mr-2 flex size-11 cursor-pointer items-center justify-center rounded-full text-heading transition-colors hover:bg-surface-blush"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6" fill="none">
          <path d="M4 8h16M4 16h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="fixed inset-0 z-[60] flex flex-col bg-background"
            initial={reduceMotion ? { opacity: 0 } : { clipPath: "inset(0% 0% 100% 0%)" }}
            animate={reduceMotion ? { opacity: 1 } : { clipPath: "inset(0% 0% 0% 0%)" }}
            exit={reduceMotion ? { opacity: 0 } : { clipPath: "inset(0% 0% 100% 0%)" }}
            transition={{ duration: reduceMotion ? 0.15 : 0.42, ease: ease.outExpo }}
          >
            <div className="flex h-18 items-center justify-between px-4 sm:px-6">
              <Logo onClick={() => setOpen(false)} />
              <button
                type="button"
                aria-label="Close menu"
                onClick={close}
                className="-mr-2 flex size-11 cursor-pointer items-center justify-center rounded-full text-heading transition-colors hover:bg-surface-blush"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6" fill="none">
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <nav aria-label="Mobile" className="flex flex-1 flex-col justify-between overflow-y-auto px-4 pt-6 pb-8 sm:px-6">
              <ul className="flex flex-col gap-1">
                {(accountLinks ?? navLinks).map((link, index) => (
                  <motion.li
                    key={link.href}
                    initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: reduceMotion ? 0.15 : 0.5,
                      ease: ease.outExpo,
                      delay: reduceMotion ? 0 : 0.15 + index * 0.05,
                    }}
                  >
                    <Link
                      href={member || isHome ? link.href : `/${link.href}`}
                      onClick={() => setOpen(false)}
                      className="block py-2 font-display text-[2.5rem] leading-tight text-heading transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </motion.li>
                ))}
              </ul>

              <div className="flex flex-col gap-3 pt-10">
                {member ? (
                  <SignOutButton className="h-14 w-full px-8" />
                ) : (
                  <>
                    <Link href={routes.book} onClick={() => setOpen(false)} className={buttonVariants({ size: "lg" })}>
                      Book a consultation
                    </Link>
                    {viewer === "guest" ? (
                      <Link
                        href={routes.login}
                        onClick={() => setOpen(false)}
                        className={buttonVariants({ variant: "secondary", size: "lg" })}
                      >
                        Log in
                      </Link>
                    ) : null}
                  </>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
