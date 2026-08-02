/**
 * The answer options. Two shapes: a full-width row for text, a square card for
 * anything drawn.
 *
 * ---------------------------------------------------------------------------
 * WHY A HIDDEN RADIO AND NOT A BUTTON
 * ---------------------------------------------------------------------------
 * Each option is a real `<input type="radio">` inside a `<label>`, visually
 * hidden and styled through `has-[:checked]`. A row of `<button>`s would have
 * looked the same and been worse: radios come with the group semantics
 * (arrow-key navigation within the group, one tab stop for the whole question,
 * "3 of 4" announced by screen readers) that a button row has to reimplement in
 * JavaScript and usually reimplements incompletely. The styling cost of the
 * native control is one `sr-only`.
 *
 * ---------------------------------------------------------------------------
 * TAP TARGETS
 * ---------------------------------------------------------------------------
 * Text rows are `min-h-14` (56px) and full-bleed to the column, so the target
 * is the whole row rather than the words in it. Visual cards are square and at
 * least a third of the viewport wide. Both clear the 44px floor with room,
 * which matters because a chunk of this traffic is a six-year-old with a
 * six-year-old's aim, under a countdown.
 */
"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Shared state styling. Rest sits on a hard shadow; hover lifts it (hover
 * devices only, so a touch tap never leaves a stuck hover state); selected
 * presses it flat into brand blue. Selected is a transform on the element's own
 * box, so it never moves anything around it.
 */
/*
 * NO SHADOW AND NO PRESS ANIMATION, DELIBERATELY, ON THIS SCREEN ONLY.
 *
 * The hard offset shadow is the brand's signature and it stays everywhere else,
 * the choice cards especially. Here it does not earn its place: four shadowed
 * slabs per question, fifteen questions running, is heavy, and the screen
 * somebody stares at under a clock should be the calmest one in the product.
 * The thick ink border still carries the house style.
 *
 * Selecting is instant and quiet. No translate, no shadow pop, no bounce — a
 * 100ms colour change and nothing else.
 *
 * SELECTION IS ONE SIGNAL: THE BLUE FILL. Nothing else changes.
 *
 * It briefly did three things at once — fill, a thicker border, and the letter
 * badge inverting to ink — and that was more emphasis than a single-choice list
 * needs. The border weight was the worst of the three: a 2.5px border growing
 * to 4px resizes the row's box, which nudges everything below it by a pixel or
 * two. Once per question, fifteen questions running, that is jitter people feel
 * without being able to name.
 *
 * The badge stays yellow-on-ink whatever happens. Yellow has real contrast
 * against the blue fill and stays on palette, whereas flipping it to a black
 * circle went muddy against blue and pulled the eye to the badge instead of the
 * row.
 *
 * Border weight, padding and box size are IDENTICAL in both states, so the row
 * cannot move or resize when it is picked. Only `background-color` transitions.
 */
const CARD_BASE = cn(
  "relative cursor-pointer select-none rounded-2xl border-[2.5px] border-ink bg-paper",
  "transition-colors duration-100",
  "hover:[@media(hover:hover)]:bg-cream",
  "has-[:checked]:bg-blue has-[:checked]:hover:bg-blue",
  // The focus ring goes on the label because the input inside it is sr-only.
  "has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-[3px] has-[:focus-visible]:outline-ink",
);

/** The A / B / C / D chip. */
function LetterBadge({
  id,
  className,
  style,
}: {
  id: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      aria-hidden="true"
      style={style}
      className={cn(
        "grid size-7 shrink-0 place-items-center rounded-full border-[2.5px] border-ink",
        "bg-yellow font-sans text-xs font-extrabold leading-none text-ink",
        className,
      )}
    >
      {id}
    </span>
  );
}

interface BaseProps {
  /** Radio group name. The item id, so groups never bleed between questions. */
  name: string;
  id: string;
  checked: boolean;
  onSelect: (id: string) => void;
  /** Spoken label. Visual options need one because the drawing is aria-hidden. */
  label: string;
}

/**
 * How far the letter badge sits in from the card's left edge, in pixels.
 *
 * ===========================================================================
 * A ROUNDED CORNER NEEDS MORE INSET THAN A SQUARE ONE
 * ===========================================================================
 * The badge on a figural card sits in the top-left corner, and the card's
 * corner is a 16px radius (`rounded-2xl`). Along the diagonal where the badge
 * actually sits, the curve pulls the card's edge inward by r(1 - 1/root 2),
 * which is about 4.7px. So an inset that looks generous measured against a
 * straight edge is nearly touching once you follow the curve: at the old 6px it
 * left roughly 1px of daylight, which is what read as crowding.
 *
 * Twelve gives about 7px of real diagonal clearance, which is what 12px looks
 * like on a square corner.
 *
 * The same number is used for the text rows, where the badge sits in normal
 * flow rather than in a corner, so the letter lands in the same place across
 * every item type instead of shifting when the question changes shape.
 *
 * IT HOLDS AT EVERY SCALE. The fit-to-viewport wrapper scales the whole
 * question with one transform, so the badge, its inset and the corner radius
 * all shrink at exactly the same rate and the relationship between them is
 * unchanged. That is a property of scaling the subtree rather than restyling
 * it, and it is one of the reasons the fitter works that way.
 */
const BADGE_INSET = "0.75rem"; // 12px

/** A full-width text option. */
export function TextOptionCard({
  name,
  id,
  checked,
  onSelect,
  label,
  text,
}: BaseProps & { text: string }) {
  return (
    <label
      className={cn(CARD_BASE, "group flex min-h-14 w-full items-center gap-3 py-3")}
      style={{ paddingLeft: BADGE_INSET, paddingRight: BADGE_INSET }}
    >
      <input
        type="radio"
        name={name}
        value={id}
        checked={checked}
        onChange={() => onSelect(id)}
        className="sr-only"
        aria-label={label}
      />
      <LetterBadge id={id} />
      <span className="text-pretty text-left text-[0.975rem] font-bold leading-snug text-ink">
        {text}
      </span>
    </label>
  );
}

/** A square option holding a drawing. */
export function VisualOptionCard({
  name,
  id,
  checked,
  onSelect,
  label,
  children,
}: BaseProps & { children: ReactNode }) {
  return (
    <label className={cn(CARD_BASE, "group flex aspect-square w-full items-center justify-center p-2")}>
      <input
        type="radio"
        name={name}
        value={id}
        checked={checked}
        onChange={() => onSelect(id)}
        className="sr-only"
        aria-label={label}
      />
      <LetterBadge
        id={id}
        className="absolute size-6 text-[0.65rem]"
        style={{ left: BADGE_INSET, top: BADGE_INSET }}
      />
      <div className="grid size-full place-items-center p-[8%]">{children}</div>
    </label>
  );
}

/**
 * The options container.
 *
 * A `<fieldset>` with a legend, so the whole group is announced with the
 * question rather than four unrelated radios. `columns` is 1 for text and 2 for
 * visuals — two square cards per row on a 360px phone gives each one about
 * 150px, which is a comfortable target and big enough to actually see a figure
 * matrix option.
 */
export function OptionGroup({
  legend,
  variant,
  children,
}: {
  legend: string;
  /**
   * THE LAYOUT FOLLOWS THE OPTION CONTENT, NOT THE SCREEN WIDTH.
   *
   *   "visual"  squares holding a drawing. Two across on a phone, four across
   *             from 768 up, because four square figures in a row is compact,
   *             comparable at a glance, and gets everything above the fold.
   *   "text"    always stacked, at every width. Four across works for shapes
   *             and falls apart for words: "example / padding / draft /
   *             outline" in four narrow columns is harder to read than the same
   *             four in a list, and a sentence-completion option that runs
   *             several words would wrap to three lines in a quarter-width box.
   *             Reading speed is not what this test is trying to measure.
   */
  variant: "text" | "visual";
  children: ReactNode;
}) {
  return (
    <fieldset className="w-full border-0 p-0">
      <legend className="sr-only">{legend}</legend>
      <div
        className={cn(
          "grid",
          variant === "text"
            ? "grid-cols-1 gap-2.5"
            : "grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-4",
        )}
      >
        {children}
      </div>
    </fieldset>
  );
}
