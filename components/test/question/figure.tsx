/**
 * The figure-cell renderer: declarative geometry in, inline SVG out.
 *
 * One component serves every figural question type (matrix, analogy,
 * classification, visual odd-one-out) and their answer options, because all of
 * them are the same node — see the FigCellState note in lib/test/types.ts.
 * A third of every child bank renders through here.
 *
 * NOTHING IS AN IMAGE. There is no fetch, no PNG, no CDN. Each shape becomes an
 * inline `<svg>` that inherits the brand ink colour and scales with CSS, so a
 * cell renders identically at 44px in an option card and 110px in a matrix.
 *
 * Everything is sized as a PERCENTAGE of the cell, so neither this file nor its
 * callers do pixel arithmetic at any point.
 */
import type { ReactNode } from "react";

import { Glyph } from "./glyph";
import { PUZZLE_INK, type FigCellState, type FigElement, type FigSize } from "@/lib/test/types";
import { cn } from "@/lib/utils";

/** A single element at size "m", as a share of the cell. */
const BASE_SHARE = 0.62;
const SIZE_SCALE: Record<FigSize, number> = { s: 0.64, m: 1, l: 1.26 };

/** Gap between side-by-side elements, as a share of the cell. */
const GAP_SHARE = 0.05;
/** How much of a cell a row of elements may occupy. The rest is breathing room. */
const MAX_ROW = 0.92;
/** The 2x2 block carries its own padding, so it has less room than a single row. */
const MAX_ROW_GRID = 0.82;

/** The authored size of one element, before anything is fitted. */
function rawFraction(size: FigElement["size"]): number {
  if (typeof size === "number") return Math.max(0.02, Math.min(1, size));
  return BASE_SHARE * SIZE_SCALE[size ?? "m"];
}

/**
 * One scale for every element in a cell, so N of them fit side by side.
 *
 * ===========================================================================
 * IT IS COMPUTED FROM THE SIZES, AND IT IGNORES THE ARRANGEMENT
 * ===========================================================================
 * Both halves of that matter, and both were bugs.
 *
 * FROM THE SIZES, because a lookup keyed on the COUNT cannot know whether the
 * two elements are two mediums or a large and a small, and has to assume the
 * worst for every case. Measuring what the row actually needs lets a pair take
 * the space a pair can have.
 *
 * IGNORING THE ARRANGEMENT is the one that broke an item. The old rule skipped
 * the shrink for `arrange: "stack"` and applied it to everything else, so in
 * a16 — five cards where four stack a small shape inside a large one and the
 * fifth puts the pair side by side — the odd card's shapes came out at 58% of
 * the size of the other four's. That is a second, unauthored 4-1 split on
 * apparent size, and a solver picks the odd card instantly for a reason the
 * item was not testing. Since the renderer only ever sees one cell, the only
 * way five sibling cards can agree on a scale is if the scale does not depend
 * on how any of them is arranged. So a stacked pair is fitted as though it were
 * going to be laid out in a row, and comes out the same size as one that is.
 */
function fitScaleFor(sizes: FigElement["size"][], columns: number, limit: number): number {
  if (sizes.length === 0) return 1;
  const perRow = sizes.slice(0, columns);
  const needed =
    perRow.reduce<number>((sum, s) => sum + rawFraction(s), 0) +
    GAP_SHARE * (perRow.length - 1);
  return needed > limit ? limit / needed : 1;
}

/**
 * The contents of a cell: every shape in it, placed.
 *
 * Three placement modes, checked in order per element:
 *   - explicit x/y   absolutely positioned at that point in the cell
 *   - arrange stack  centred, drawn on top of each other
 *   - arrange auto   laid out side by side (or 2x2 at four), scaled to fit
 */
export function FigCellContent({ fig }: { fig: FigCellState }) {
  const shapes = fig.shapes ?? [];
  if (shapes.length === 0) return null;

  const positioned = shapes.filter((s) => s.x !== undefined && s.y !== undefined);
  const flowed = shapes.filter((s) => s.x === undefined || s.y === undefined);

  const stack = fig.arrange === "stack";
  /*
    Four flowed elements become a 2x2 block, so only two of them share a row.
    A stacked group is measured as a row anyway — see fitScaleFor.
  */
  const grid = !stack && flowed.length === 4;
  const scale = fitScaleFor(
    flowed.map((el) => el.size),
    grid ? 2 : flowed.length,
    grid ? MAX_ROW_GRID : MAX_ROW,
  );

  const glyphOf = (el: FigElement, key: number, absolute = false) => (
    <Glyph
      key={key}
      kind={el.shape}
      size={`${(rawFraction(el.size) * scale * 100).toFixed(1)}%`}
      /*
       * PUZZLE INK ONLY. A figure is part of the question, so it may only be
       * painted in the puzzle ramp; brand blue lives on the other side of the
       * split because it is the selected-option colour. See the palette note in
       * lib/test/types.ts for what went wrong when these two overlapped.
       */
      fill={el.filled ? (el.color ?? PUZZLE_INK.solid) : PUZZLE_INK.empty}
      rotate={el.rotate}
      className={absolute ? "absolute" : undefined}
      style={
        absolute
          ? {
              left: `${(el.x ?? 0.5) * 100}%`,
              top: `${(el.y ?? 0.5) * 100}%`,
              transform: `translate(-50%, -50%)${el.rotate ? ` rotate(${el.rotate}deg)` : ""}`,
            }
          : undefined
      }
    />
  );

  const flow = stack ? (
    /*
      EACH LAYER IS ABSOLUTE AND FULL-BLEED, which is load-bearing rather than
      stylistic. A glyph's size is a PERCENTAGE, so it needs an ancestor with a
      resolved width to be a percentage OF. These layers used to be grid items
      under `place-items-center`, which sizes an item to its content — so the
      percentage resolved against a box that was itself waiting on the
      percentage, and the inner shape collapsed to a speck. That is what made
      a16's containment rule unreadable: a large shape with a dot in it rather
      than a shape inside a shape.

      `inset-0` gives every layer the cell's own dimensions, so both shapes
      resolve against the same known box and land concentrically.
    */
    <div className="relative size-full">
      {flowed.map((el, i) => (
        <div key={i} className="absolute inset-0 grid place-items-center">
          {glyphOf(el, i)}
        </div>
      ))}
    </div>
  ) : grid ? (
    // Four in a row would either overflow or be too small to read. A 2x2 block
    // keeps each one legible at option-card size.
    <div className="grid size-full grid-cols-2 place-items-center gap-[4%] p-[6%]">
      {flowed.map((el, i) => glyphOf(el, i))}
    </div>
  ) : (
    <div className="flex size-full items-center justify-center gap-[5%]">
      {flowed.map((el, i) => glyphOf(el, i))}
    </div>
  );

  if (positioned.length === 0) return flow;

  return (
    <div className="relative size-full">
      <div className="absolute inset-0">{flow}</div>
      {positioned.map((el, i) => glyphOf(el, flowed.length + i, true))}
    </div>
  );
}

/**
 * A bordered square cell. Uses the site's neo-brutalist surface (thick ink
 * keyline, rounded) so a matrix sits inside the page's visual language rather
 * than next to it.
 */
export function FigCell({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid aspect-square w-full place-items-center rounded-xl border-[2.5px] border-ink bg-paper",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** A cell holding a figure. */
export function FigureCell({
  fig,
  className,
}: {
  fig: FigCellState;
  className?: string;
}) {
  return (
    <FigCell className={className}>
      <FigCellContent fig={fig} />
    </FigCell>
  );
}

/** The "?" cell the player is completing. Brand yellow so it reads as the gap. */
export function QuestionCell({ className }: { className?: string }) {
  return (
    <FigCell className={cn("bg-yellow", className)}>
      <span
        aria-hidden="true"
        className="font-display text-[2.75rem] leading-none text-ink"
      >
        ?
      </span>
    </FigCell>
  );
}
