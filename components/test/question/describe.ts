/**
 * Plain-English descriptions of the drawn options.
 *
 * Every visual in this flow is `aria-hidden` SVG, which means a screen-reader
 * user gets nothing from it. These strings are the `aria-label` on the radio, so
 * the options are at least distinguishable and selectable.
 *
 * Be honest about the ceiling: "two filled hearts" is a usable label for a
 * figure-analogy option, but a blind player still cannot see the stimulus the
 * analogy is made of, so the nonverbal items are not really answerable without
 * sight. That is a property of the question type rather than of this markup.
 * The verbal and quantitative items are fully answerable, which is why the
 * results screen scores what was answered rather than requiring completion.
 */
import type { DotPos, FigCellState, FigElement, HoleCell, PolyShape } from "@/lib/test/types";

const COUNT_WORDS = ["", "one", "two", "three", "four", "five", "six"];

/** "two filled hearts", "one small empty square turned 90 degrees". */
function describeGroup(el: FigElement, count: number): string {
  const parts: string[] = [];
  if (count > 1) parts.push(COUNT_WORDS[count] ?? String(count));
  if (el.size === "s") parts.push("small");
  if (el.size === "l") parts.push("large");
  parts.push(el.filled ? "filled" : "empty");
  parts.push(count > 1 ? `${el.shape}s` : el.shape);
  if (el.rotate) parts.push(`turned ${el.rotate} degrees`);
  return parts.join(" ");
}

/**
 * A cell, in words.
 *
 * Runs of identical shapes are collapsed ("three filled stars" rather than
 * "filled star, filled star, filled star"), because a cell is now a set and the
 * literal reading of a count rule would be unbearable.
 */
export function describeFig(fig: FigCellState): string {
  const shapes = fig.shapes ?? [];
  if (shapes.length === 0) return "empty";

  const key = (el: FigElement) =>
    `${el.shape}|${el.filled ? 1 : 0}|${el.rotate ?? 0}|${el.size ?? "m"}`;

  const groups: Array<{ el: FigElement; count: number }> = [];
  for (const el of shapes) {
    const last = groups[groups.length - 1];
    if (last && key(last.el) === key(el)) last.count += 1;
    else groups.push({ el, count: 1 });
  }

  const described = groups.map((g) => describeGroup(g.el, g.count));
  if (described.length === 1) return described[0];
  // "stack" means the shapes sit on top of each other, which changes what the
  // cell means, so say so rather than listing them as if side by side.
  const joiner = fig.arrange === "stack" ? " on top of " : " and ";
  return described.join(joiner);
}

export function describePoly(poly: PolyShape): string {
  if (poly === "circle") return "circle";
  const names: Record<number, string> = {
    3: "triangle",
    4: "square",
    5: "pentagon",
    6: "hexagon",
    7: "seven-sided shape",
    8: "eight-sided shape",
  };
  return names[poly] ?? `${poly}-sided shape`;
}

const DOT_WORDS: Record<DotPos, string> = {
  tl: "top left",
  tm: "top middle",
  tr: "top right",
  rm: "right middle",
  br: "bottom right",
  bm: "bottom middle",
  bl: "bottom left",
  lm: "left middle",
  center: "centre",
};

export function describeDot(pos: DotPos): string {
  return `dot at ${DOT_WORDS[pos]}`;
}

export function describeHoles(holes: HoleCell[]): string {
  const n = holes.length;
  if (n === 0) return "no holes";
  if (n === 1) return "one hole";
  return `${COUNT_WORDS[n] ?? n} holes`;
}
