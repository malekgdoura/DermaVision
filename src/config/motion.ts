/**
 * Motion tokens for Motion (motion/react) components.
 * Mirrors the CSS variables in src/app/globals.css. Durations are in seconds.
 */

export const duration = {
  press: 0.1,
  hover: 0.18,
  component: 0.28,
  reveal: 0.65,
  hero: 1.1,
} as const;

export const ease = {
  standard: [0.4, 0, 0.2, 1],
  outSoft: [0.22, 1, 0.36, 1],
  outExpo: [0.16, 1, 0.3, 1],
  in: [0.4, 0, 1, 1],
  inOutSine: [0.37, 0, 0.63, 1],
} as const satisfies Record<string, [number, number, number, number]>;

export const distance = {
  micro: 2,
  component: 12,
  section: 24,
  hero: 40,
} as const;

export const scale = {
  press: 0.97,
  hover: 1.02,
  image: 1.04,
  enter: 0.96,
} as const;

export const stagger = {
  text: 0.08,
  cards: 0.06,
  findings: 0.14,
  markers: 0.18,
} as const;

/** Selected-state highlights (nav indicator, time slots): settles with no visible bounce. */
export const springSelect = { type: "spring", stiffness: 380, damping: 34 } as const;

/** Scroll reveals play once, when 20% of the element is visible. */
export const revealViewport = { once: true, amount: 0.2 } as const;
