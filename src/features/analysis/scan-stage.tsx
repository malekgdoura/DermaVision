"use client";

import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import Image from "next/image";
import type { DragEvent, PointerEvent, ReactNode } from "react";

import { useReducedMotion } from "@/components/motion/use-reduced-motion";
import { ease } from "@/config/motion";
import { cn } from "@/lib/utils";

export type ScanPhase = "empty" | "ready" | "scanning" | "done" | "error";

type ScanStageProps = {
  phase: ScanPhase;
  previewUrl: string | null;
  previewAlt: string;
  label: string;
  statusText: string;
  isDragging: boolean;
  onDragStateChange: (dragging: boolean) => void;
  onDropFiles: (files: FileList) => void;
  /** Shown in the middle of the stage when there is no photo yet. */
  emptyContent?: ReactNode;
};

// Egg-shaped face window, shared by the photo and the scan line.
const FACE_RADIUS = "50% 50% 46% 46% / 40% 40% 60% 60%";
const MAX_TILT = 6; // degrees

/**
 * Central scanner: an abstract 3D face form with orbiting scan rings, subtle pointer
 * parallax and a scan line. Also the drag & drop target for the photo.
 */
export function ScanStage({
  phase,
  previewUrl,
  previewAlt,
  label,
  statusText,
  isDragging,
  onDragStateChange,
  onDropFiles,
  emptyContent,
}: ScanStageProps) {
  const reduceMotion = useReducedMotion();
  const scanning = phase === "scanning";

  // Pointer parallax: the whole scene tilts a few degrees towards the pointer.
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const smoothX = useSpring(pointerX, { stiffness: 120, damping: 20 });
  const smoothY = useSpring(pointerY, { stiffness: 120, damping: 20 });
  const rotateY = useTransform(smoothX, [-1, 1], [-MAX_TILT, MAX_TILT]);
  const rotateX = useTransform(smoothY, [-1, 1], [MAX_TILT, -MAX_TILT]);

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (reduceMotion || event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    pointerX.set(((event.clientX - rect.left) / rect.width) * 2 - 1);
    pointerY.set(((event.clientY - rect.top) / rect.height) * 2 - 1);
  }

  function resetPointer() {
    pointerX.set(0);
    pointerY.set(0);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    if (!isDragging) onDragStateChange(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    // Ignore leave events fired when moving between children of the stage.
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
    onDragStateChange(false);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    onDragStateChange(false);
    if (event.dataTransfer.files.length > 0) onDropFiles(event.dataTransfer.files);
  }

  const ringSpeed = scanning ? 6 : 22;

  return (
    <div
      role="group"
      aria-label={label}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetPointer}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "relative isolate aspect-[4/5] w-full overflow-hidden rounded-xl border bg-surface sm:aspect-square",
        "transition-[border-color,box-shadow] duration-(--duration-component) ease-standard",
        isDragging ? "border-primary shadow-[0_0_0_4px_var(--primary-soft)]" : "border-border shadow-md",
      )}
      style={{ perspective: 1100 }}
    >
      {/* Ivory-to-blush ground with a faint clinical dot grid */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(circle at 50% 42%, var(--surface) 0%, var(--background) 45%, var(--surface-blush) 100%)",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 opacity-60"
        style={{
          backgroundImage: "radial-gradient(var(--border-strong) 0.8px, transparent 0.8px)",
          backgroundSize: "22px 22px",
          maskImage: "radial-gradient(circle at 50% 45%, black 20%, transparent 72%)",
        }}
      />

      <ViewfinderCorners active={isDragging || scanning} />

      {/* 3D scene */}
      <motion.div
        aria-hidden={previewUrl ? undefined : true}
        className="absolute inset-0 flex items-center justify-center"
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      >
        {/* Depth halo, far back */}
        <div
          aria-hidden="true"
          className="absolute aspect-square w-[88%] rounded-full border border-border-strong/50"
          style={{ transform: "translateZ(-90px)" }}
        />
        <div
          aria-hidden="true"
          className="absolute aspect-square w-[70%] rounded-full bg-primary-soft/45 blur-2xl"
          style={{ transform: "translateZ(-70px)" }}
        />

        {/* Orbit ring behind and in front of the face (preserve-3d splits it around the face) */}
        <OrbitRing
          className="w-[80%]"
          tilt={74}
          duration={ringSpeed}
          reduceMotion={reduceMotion}
          emphasized={isDragging || scanning}
        />
        <OrbitRing
          className="w-[66%]"
          tilt={78}
          yaw={-18}
          duration={ringSpeed * 1.4}
          reverse
          reduceMotion={reduceMotion}
          emphasized={scanning}
          subtle
        />

        {/* Face window: photo or abstract face form */}
        <motion.div
          className="relative aspect-[4/5] w-[50%] max-w-[18rem]"
          style={{ transform: "translateZ(40px)", transformStyle: "preserve-3d" }}
          initial={false}
          animate={{ scale: isDragging ? 1.03 : 1 }}
          transition={{ duration: 0.4, ease: ease.outSoft }}
        >
          <div
            className="absolute inset-0 overflow-hidden bg-surface/70 shadow-lg ring-1 ring-border-strong/60 backdrop-blur-[2px]"
            style={{ borderRadius: FACE_RADIUS }}
          >
            {previewUrl ? (
              <motion.div
                key={previewUrl}
                className="absolute inset-0"
                initial={{ opacity: 0, scale: reduceMotion ? 1 : 1.06 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, ease: ease.outExpo }}
              >
                <Image src={previewUrl} alt={previewAlt} fill unoptimized sizes="18rem" className="object-cover" />
                {/* Mesh stays visible over the photo, very faint */}
                <FaceMesh className="opacity-35 mix-blend-multiply" scanning={scanning} reduceMotion={reduceMotion} />
              </motion.div>
            ) : (
              <FaceMesh scanning={scanning} reduceMotion={reduceMotion} />
            )}

            <ScanLine phase={phase} reduceMotion={reduceMotion} />
          </div>
        </motion.div>
      </motion.div>

      {/* Empty-state prompt */}
      {!previewUrl && emptyContent ? (
        <div className="absolute inset-x-0 bottom-16 flex justify-center px-4 sm:bottom-20">{emptyContent}</div>
      ) : null}

      {/* Live status */}
      <div className="absolute inset-x-0 bottom-4 flex justify-center px-4 sm:bottom-6">
        <p
          aria-live="polite"
          className="inline-flex items-center gap-2 rounded-full bg-surface/90 px-4 py-1.5 text-[0.8125rem] font-medium text-heading shadow-sm backdrop-blur"
        >
          <StatusDot phase={phase} reduceMotion={reduceMotion} />
          {statusText}
        </p>
      </div>
    </div>
  );
}

function OrbitRing({
  className,
  tilt,
  yaw = 0,
  duration,
  reverse,
  reduceMotion,
  emphasized,
  subtle,
}: {
  className?: string;
  tilt: number;
  yaw?: number;
  duration: number;
  reverse?: boolean;
  reduceMotion: boolean;
  emphasized: boolean;
  subtle?: boolean;
}) {
  return (
    <motion.div
      aria-hidden="true"
      className={cn("absolute aspect-square rounded-full", className)}
      style={{ rotateX: tilt, rotateY: yaw, transformStyle: "preserve-3d" }}
    >
      <motion.div
        className={cn(
          "absolute inset-0 rounded-full border transition-[border-color,opacity] duration-(--duration-component)",
          subtle ? "border-dashed" : "border-[1.5px]",
          emphasized ? "border-primary/70" : subtle ? "border-primary/20" : "border-primary/35",
        )}
        animate={reduceMotion ? { rotateZ: 0 } : { rotateZ: reverse ? -360 : 360 }}
        transition={reduceMotion ? { duration: 0 } : { duration, ease: "linear", repeat: Infinity }}
      >
        {/* Bead travelling on the ring */}
        {!subtle ? (
          <span className="absolute top-1/2 -right-[5px] size-2.5 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_0_4px_var(--primary-soft)]" />
        ) : null}
      </motion.div>
    </motion.div>
  );
}

// Abstract face: outline, topographic contours and a few landmarks. No real face is drawn.
function FaceMesh({
  className,
  scanning,
  reduceMotion,
}: {
  className?: string;
  scanning: boolean;
  reduceMotion: boolean;
}) {
  const outline =
    "M100 22C150 22 172 66 170 116C168 170 142 218 100 228C58 218 32 170 30 116C28 66 50 22 100 22Z";
  const contours = [0.86, 0.72, 0.58, 0.44];
  const landmarks = [
    { x: 72, y: 104 },
    { x: 128, y: 104 },
    { x: 100, y: 140 },
    { x: 70, y: 150 },
    { x: 130, y: 150 },
    { x: 100, y: 176 },
    { x: 100, y: 62 },
  ];

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 200 250"
      preserveAspectRatio="xMidYMid slice"
      className={cn("absolute inset-0 h-full w-full", className)}
    >
      <defs>
        <radialGradient id="face-fill" cx="50%" cy="42%" r="60%">
          <stop offset="0%" stopColor="var(--surface)" />
          <stop offset="100%" stopColor="var(--surface-blush)" />
        </radialGradient>
      </defs>

      <path d={outline} fill="url(#face-fill)" stroke="var(--primary)" strokeOpacity="0.45" strokeWidth="1.2" />

      {/* Topographic contours, scaled around the face centre */}
      {contours.map((factor, index) => (
        <path
          key={factor}
          d={outline}
          fill="none"
          stroke="var(--primary)"
          strokeOpacity={0.28 - index * 0.05}
          strokeWidth="0.8"
          transform={`translate(${100 * (1 - factor)} ${125 * (1 - factor)}) scale(${factor})`}
        />
      ))}

      {/* Minimal features */}
      <g fill="none" stroke="var(--heading)" strokeOpacity="0.28" strokeWidth="1.1" strokeLinecap="round">
        <path d="M58 92q14-8 28-2" />
        <path d="M114 90q14-6 28 2" />
        <path d="M64 108q8-5 16 0" />
        <path d="M120 108q8-5 16 0" />
        <path d="M100 112v26q-6 4-10 2" />
        <path d="M84 172q16 8 32 0" />
      </g>

      {/* Vertical symmetry axis */}
      <path d="M100 30V222" stroke="var(--primary)" strokeOpacity="0.18" strokeWidth="0.8" strokeDasharray="2 4" />

      {/* Landmarks */}
      {landmarks.map((point, index) => (
        <motion.circle
          key={`${point.x}-${point.y}`}
          cx={point.x}
          cy={point.y}
          r="2.2"
          fill="var(--primary)"
          initial={false}
          animate={
            scanning && !reduceMotion
              ? { opacity: [0.35, 1, 0.35], scale: [1, 1.5, 1] }
              : { opacity: 0.55, scale: 1 }
          }
          transition={
            scanning && !reduceMotion
              ? { duration: 1.6, repeat: Infinity, ease: ease.inOutSine, delay: index * 0.12 }
              : { duration: 0.3 }
          }
          style={{ transformOrigin: `${point.x}px ${point.y}px` }}
        />
      ))}
    </svg>
  );
}

// Horizontal scan beam: one pass when a photo is placed, continuous while analyzing.
function ScanLine({ phase, reduceMotion }: { phase: ScanPhase; reduceMotion: boolean }) {
  if (reduceMotion || (phase !== "ready" && phase !== "scanning")) return null;

  const continuous = phase === "scanning";

  return (
    <motion.div
      key={phase}
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 h-[22%]"
      initial={{ top: "-22%" }}
      animate={{ top: "100%" }}
      transition={{
        duration: continuous ? 2.2 : 1.6,
        ease: ease.inOutSine,
        repeat: continuous ? Infinity : 0,
        repeatDelay: continuous ? 0.2 : 0,
      }}
    >
      <div className="h-full w-full bg-gradient-to-b from-transparent via-primary/12 to-primary/25" />
      <div className="h-px w-full bg-primary/80 shadow-[0_0_12px_2px_var(--primary-soft)]" />
    </motion.div>
  );
}

function StatusDot({ phase, reduceMotion }: { phase: ScanPhase; reduceMotion: boolean }) {
  const color = {
    empty: "bg-border-strong",
    ready: "bg-primary",
    scanning: "bg-primary",
    done: "bg-success",
    error: "bg-destructive",
  }[phase];

  return (
    <span aria-hidden="true" className="relative flex size-2">
      {phase === "scanning" && !reduceMotion ? (
        <span className={cn("absolute inset-0 animate-ping rounded-full opacity-60", color)} />
      ) : null}
      <span className={cn("relative size-2 rounded-full", color)} />
    </span>
  );
}

function ViewfinderCorners({ active }: { active: boolean }) {
  const base = cn(
    "absolute size-7 border-primary transition-opacity duration-(--duration-component)",
    active ? "opacity-90" : "opacity-40",
  );

  return (
    <div aria-hidden="true">
      <span className={cn(base, "top-5 left-5 rounded-tl-lg border-t-2 border-l-2")} />
      <span className={cn(base, "top-5 right-5 rounded-tr-lg border-t-2 border-r-2")} />
      <span className={cn(base, "bottom-5 left-5 rounded-bl-lg border-b-2 border-l-2")} />
      <span className={cn(base, "right-5 bottom-5 rounded-br-lg border-r-2 border-b-2")} />
    </div>
  );
}
