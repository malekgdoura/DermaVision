"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Stagger, StaggerItem } from "@/components/motion";
import { Button } from "@/components/ui/button";
import type { DoctorPreview } from "@/types/content";

import { DoctorCard } from "./doctor-card";

/** Horizontal, swipeable row of doctor cards with manual previous/next controls. No autoplay. */
export function DoctorsRow({ doctors }: { doctors: DoctorPreview[] }) {
  const listRef = useRef<HTMLUListElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const update = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    update();
    const el = listRef.current;
    el?.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [update]);

  const scrollByCard = (direction: 1 | -1) => {
    const el = listRef.current;
    const card = el?.querySelector("li");
    if (!el || !card) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: direction * (card.clientWidth + 20), behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <div>
      <Stagger>
        <ul
          ref={listRef}
          aria-label="Doctors"
          // contain-paint keeps off-screen cards from widening the mobile layout viewport
          className="-mx-4 flex snap-x [contain:paint] snap-mandatory gap-5 overflow-x-auto scroll-px-4 px-4 pb-2 [scrollbar-width:none] sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:scroll-px-0 lg:px-0 [&::-webkit-scrollbar]:hidden"
        >
          {doctors.map((doctor, index) => (
            <li key={doctor.id} className="w-[72%] shrink-0 snap-start sm:w-[44%] lg:w-[calc(25%-15px)]">
              <StaggerItem>
                <DoctorCard doctor={doctor} />
                <span className="sr-only">
                  {index + 1} of {doctors.length}
                </span>
              </StaggerItem>
            </li>
          ))}
        </ul>
      </Stagger>

      {(canPrev || canNext) && (
        <div className="mt-6 flex gap-2">
          <Button variant="secondary" size="icon" aria-label="Previous doctors" disabled={!canPrev} onClick={() => scrollByCard(-1)}>
            <svg aria-hidden="true" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Button>
          <Button variant="secondary" size="icon" aria-label="Next doctors" disabled={!canNext} onClick={() => scrollByCard(1)}>
            <svg aria-hidden="true" viewBox="0 0 16 16" fill="none">
              <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Button>
        </div>
      )}
    </div>
  );
}
