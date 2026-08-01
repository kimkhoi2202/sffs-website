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
import type { FigCellState, FigElement, FigSize } from "@/lib/test/types";
import { cn } from "@/lib/utils";

/** A single element at size "m", as a share of the cell. */
const BASE_SHARE = 0.62;
const SIZE_SCALE: Record<FigSize, number> = { s: 0.64, m: 1, l: 1.26 };
/**
 * Shrink auto-arranged elements as the count grows so N of them still fit one
 * cell. Only applies to `arrange: "auto"` — stacked and explicitly positioned
 * elements keep their authored size, because there the overlap is the point.
 */
const COUNT_SCALE: Record<number, number> = { 1: 1, 2: 0.58, 3: 0.4, 4: 0.4 };

/** Resolve a size to a fraction of the cell. A raw number passes through. */
function sizeFraction(size: FigElement["size"], countScale: number): number {
  if (typeof size === "number") return Math.max(0.02, Math.min(1, size));
  return BASE_SHARE * SIZE_SCALE[size ?? "m"] * countScale;
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
  // Auto-arranged elements share the cell, so they shrink as they multiply.
  // Stacked ones sit on top of each other and keep their authored size.
  const countScale = stack ? 1 : (COUNT_SCALE[Math.min(4, flowed.length)] ?? 0.4);

  const glyphOf = (el: FigElement, key: number, absolute = false) => (
    <Glyph
      key={key}
      kind={el.shape}
      size={`${(sizeFraction(el.size, countScale) * 100).toFixed(1)}%`}
      fill={el.filled ? (el.color ?? "var(--color-blue)") : "var(--color-paper)"}
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
    <div className="relative grid size-full place-items-center">
      {flowed.map((el, i) => (
        <div key={i} className="col-start-1 row-start-1 grid place-items-center">
          {glyphOf(el, i)}
        </div>
      ))}
    </div>
  ) : flowed.length === 4 ? (
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
