/**
 * Paper-folding geometry — the deterministic fold / punch / mirror solver.
 *
 * Ported from video/remotion/src/data/fold.ts, which is already pure and
 * React-free. Kept as a separate copy rather than imported across the repo
 * boundary because `video/` is excluded from this app's tsconfig and ships on a
 * different build; a cross-import would tie the website build to the video
 * pipeline's tree for 60 lines of arithmetic.
 *
 * Model: the sheet is an NxN grid of hole slots (N even, default 4). A fold
 * halves it along the vertical middle (V, from a left/right fold) or the
 * horizontal middle (H, from an up/down fold). A punch goes through every layer,
 * so unfolding reflects each punched slot across every folded axis and unions
 * the images. Restricting authored folds to at most one V and one H keeps the
 * result to a clean four-cell orbit, which is the difficulty band these tests
 * are aiming at.
 */
import type { FoldAxis, FoldDir, HoleCell } from "./types";

export const foldAxis = (d: FoldDir): FoldAxis =>
  d === "left" || d === "right" ? "V" : "H";

/** The distinct crease axes for a fold sequence: ["V"], ["H"], or ["V","H"]. */
export const foldAxes = (folds: FoldDir[]): FoldAxis[] => {
  const set = new Set(folds.map(foldAxis));
  return (["V", "H"] as FoldAxis[]).filter((a) => set.has(a));
};

const key = (h: HoleCell): string => `${h.r},${h.c}`;

/** Reflect a cell across the middle axis of an NxN grid. */
export const mirrorCell = (
  h: HoleCell,
  axis: FoldAxis,
  n: number,
): HoleCell => (axis === "V" ? { r: h.r, c: n - 1 - h.c } : { r: n - 1 - h.r, c: h.c });

/**
 * Reflect every punch across each folded axis and union the images. Order
 * independent, because the two axes are independent. Returned holes are sorted
 * by row then column so two patterns can be compared deterministically.
 */
export function unfold(
  folds: FoldDir[],
  punches: HoleCell[],
  n = 4,
): HoleCell[] {
  let holes = [...punches];
  for (const axis of foldAxes(folds)) {
    const m = new Map<string, HoleCell>();
    for (const h of holes) {
      m.set(key(h), h);
      const mirrored = mirrorCell(h, axis, n);
      m.set(key(mirrored), mirrored);
    }
    holes = [...m.values()];
  }
  return holes.sort((a, b) => a.r - b.r || a.c - b.c);
}

/** Set equality on hole cells. Ignores order and duplicates. */
export const sameHoles = (a: HoleCell[], b: HoleCell[]): boolean => {
  const sa = new Set(a.map(key));
  const sb = new Set(b.map(key));
  return sa.size === sb.size && [...sa].every((k) => sb.has(k));
};

/** A rectangle in normalised [0,1] paper space. */
export interface Rect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** Apply one fold, returning the half that survives on top of the stack. */
export const applyFold = (r: Rect, d: FoldDir): Rect => {
  const mx = (r.x0 + r.x1) / 2;
  const my = (r.y0 + r.y1) / 2;
  if (d === "left") return { ...r, x1: mx }; // right flap folds onto the left
  if (d === "right") return { ...r, x0: mx }; // left flap folds onto the right
  if (d === "up") return { ...r, y1: my }; // bottom flap folds up
  return { ...r, y0: my }; // "down": top flap folds down
};

/** The full sheet, then the surviving packet after each fold in turn. */
export const foldStages = (folds: FoldDir[]): Rect[] => {
  const stages: Rect[] = [{ x0: 0, y0: 0, x1: 1, y1: 1 }];
  for (const d of folds) stages.push(applyFold(stages[stages.length - 1], d));
  return stages;
};

/**
 * Does a cell sit inside the folded packet? Used by the validator to catch a
 * punch authored outside the stack, which would silently unfold into nonsense.
 */
export const inActiveRegion = (folds: FoldDir[], n = 4) => {
  const packet = foldStages(folds)[folds.length];
  return (h: HoleCell): boolean => {
    const cx = (h.c + 0.5) / n;
    const cy = (h.r + 0.5) / n;
    return cx > packet.x0 && cx < packet.x1 && cy > packet.y0 && cy < packet.y1;
  };
};
