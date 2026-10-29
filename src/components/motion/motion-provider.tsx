"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

/** With reduced motion, Motion skips transform and layout animations and keeps fades. */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
