/**
 * The big tappable card used by both forks and by the grade picker.
 *
 * One component rather than three so the two forks and the grade grid share a
 * press feel and a focus ring. `tone` picks the brand surface; nothing else
 * varies.
 */
"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type Tone = "blue" | "mint" | "coral" | "yellow" | "paper";

const TONES: Record<Tone, string> = {
  blue: "bg-blue",
  mint: "bg-mint",
  coral: "bg-coral",
  yellow: "bg-yellow",
  paper: "bg-paper",
};

export function ChoiceCard({
  onClick,
  tone = "paper",
  title,
  subtitle,
  className,
  children,
}: {
  onClick: () => void;
  tone?: Tone;
  title: string;
  subtitle?: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "press-lg group flex w-full cursor-pointer flex-col items-start gap-1 rounded-2xl",
        "border-[2.5px] border-ink p-5 text-left shadow-hard-lg",
        "focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-ink",
        TONES[tone],
        className,
      )}
    >
      {children}
      <span className="font-display text-[clamp(1.5rem,6vw,2rem)] uppercase leading-[1.05] tracking-[-0.01em] text-ink">
        {title}
      </span>
      {subtitle ? (
        <span className="text-pretty text-[0.95rem] font-semibold leading-snug text-ink/75">
          {subtitle}
        </span>
      ) : null}
    </button>
  );
}

/** A small square button. Used for the twelve grades. */
export function GradeButton({
  grade,
  onClick,
}: {
  grade: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Grade ${grade}`}
      className={cn(
        "press flex aspect-square min-h-14 w-full cursor-pointer items-center justify-center rounded-2xl",
        "border-[2.5px] border-ink bg-paper shadow-hard-sm",
        "font-display text-[clamp(1.5rem,7vw,2.25rem)] leading-none text-ink",
        "focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-ink",
      )}
    >
      {grade}
    </button>
  );
}
