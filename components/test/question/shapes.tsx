/**
 * The three remaining procedural drawings: the dot-position grid, the regular
 * polygon, and the folded-paper hole grid.
 *
 * Like glyph.tsx these all draw into a fixed 100x100 viewBox and are sized by
 * CSS, so one component covers both the stimulus (large) and the option cards
 * (small). Geometry ported from the video pipeline's DotSquare, Polygon and
 * HoleGrid.
 */
import type { DotPos, HoleCell, PolyShape } from "@/lib/test/types";
import { foldAxes, foldStages } from "@/lib/test/fold";
import type { FoldDir } from "@/lib/test/types";
import { cn } from "@/lib/utils";

const STROKE = 6;

/* ==========================================================================
 * Dot position — a 3x3 grid with one dot on it
 * ========================================================================== */

/** Centre of each slot in viewBox units. */
const DOT_XY: Record<DotPos, [number, number]> = {
  tl: [26, 26],
  tm: [50, 26],
  tr: [74, 26],
  rm: [74, 50],
  br: [74, 74],
  bm: [50, 74],
  bl: [26, 74],
  lm: [26, 50],
  center: [50, 50],
};

const GHOST_SLOTS: DotPos[] = ["tl", "tm", "tr", "rm", "br", "bm", "bl", "lm", "center"];

/**
 * One tile of a dot-position sequence.
 *
 * The faint "ghost" pips on the unoccupied slots are not decoration: without
 * them the tile is a square with a dot somewhere in it, and the player has to
 * infer the 3x3 lattice before they can see the movement rule. With them the
 * geometry is stated and the question becomes the one being asked.
 */
export function DotSquare({
  pos,
  size,
  className,
}: {
  pos: DotPos;
  size: number | string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="presentation"
      aria-hidden="true"
      className={className}
      style={{ display: "block", flex: "none" }}
    >
      <rect
        x={STROKE / 2}
        y={STROKE / 2}
        width={100 - STROKE}
        height={100 - STROKE}
        rx="10"
        fill="var(--color-paper)"
        stroke="var(--color-ink)"
        strokeWidth={STROKE}
      />
      {GHOST_SLOTS.filter((s) => s !== pos).map((slot) => (
        <circle
          key={slot}
          cx={DOT_XY[slot][0]}
          cy={DOT_XY[slot][1]}
          r="3"
          fill="var(--color-ink)"
          opacity="0.16"
        />
      ))}
      <circle cx={DOT_XY[pos][0]} cy={DOT_XY[pos][1]} r="11" fill="var(--color-ink)" />
    </svg>
  );
}

/* ==========================================================================
 * Polygon — a regular n-gon by side count
 * ========================================================================== */

/**
 * Start angle per side count so each polygon sits the way a person expects:
 * odd shapes point up, the square is axis-aligned rather than a diamond, the
 * hexagon is flat-topped. Without this the series reads as shapes tumbling.
 */
const POLY_ROT: Record<number, number> = { 3: -90, 4: 45, 5: -90, 6: 0, 7: -90, 8: 22.5 };

export function PolygonShape({
  shape,
  size,
  filled = false,
  className,
}: {
  shape: PolyShape;
  size: number | string;
  filled?: boolean;
  className?: string;
}) {
  const fill = filled ? "var(--color-blue)" : "var(--color-paper)";
  const common = {
    fill,
    stroke: "var(--color-ink)",
    strokeWidth: STROKE + 1,
    strokeLinejoin: "round" as const,
  };
  const r = 50 - (STROKE + 1) / 2 - 2;

  let body;
  if (shape === "circle") {
    body = <circle cx="50" cy="50" r={r} {...common} />;
  } else {
    const rot = POLY_ROT[shape] ?? -90;
    const pts = Array.from({ length: shape }, (_, i) => {
      const a = ((rot + (i * 360) / shape) * Math.PI) / 180;
      return `${(50 + r * Math.cos(a)).toFixed(2)},${(50 + r * Math.sin(a)).toFixed(2)}`;
    }).join(" ");
    body = <polygon points={pts} {...common} />;
  }

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="presentation"
      aria-hidden="true"
      className={className}
      style={{ display: "block", flex: "none" }}
    >
      {body}
    </svg>
  );
}

/* ==========================================================================
 * Paper folding — the hole grid and the fold filmstrip
 * ========================================================================== */

/**
 * An unfolded sheet with holes punched in it. This is what a paper-folding
 * option card shows, and what the answer is.
 *
 * The dashed lines mark where the creases were, which is the visual bridge back
 * to the stimulus: without them, four separate options are four squares with
 * dots and nothing anchors them to the folding that was just described.
 */
export function HoleGrid({
  holes,
  grid = 4,
  creases = [],
  size,
  className,
}: {
  holes: HoleCell[];
  grid?: number;
  creases?: Array<"V" | "H">;
  size: number | string;
  className?: string;
}) {
  const inset = STROKE;
  const span = 100 - 2 * inset;
  const cell = span / grid;
  const at = (i: number) => inset + cell * (i + 0.5);
  const holeR = Math.min(cell * 0.3, 9);

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="presentation"
      aria-hidden="true"
      className={className}
      style={{ display: "block", flex: "none" }}
    >
      <rect
        x={STROKE / 2}
        y={STROKE / 2}
        width={100 - STROKE}
        height={100 - STROKE}
        rx="8"
        fill="var(--color-paper)"
        stroke="var(--color-ink)"
        strokeWidth={STROKE}
      />
      {creases.includes("V") ? (
        <line
          x1="50"
          y1={STROKE}
          x2="50"
          y2={100 - STROKE}
          stroke="var(--color-ink)"
          strokeOpacity="0.3"
          strokeWidth="2"
          strokeDasharray="5 5"
        />
      ) : null}
      {creases.includes("H") ? (
        <line
          x1={STROKE}
          y1="50"
          x2={100 - STROKE}
          y2="50"
          stroke="var(--color-ink)"
          strokeOpacity="0.3"
          strokeWidth="2"
          strokeDasharray="5 5"
        />
      ) : null}
      {holes.map((h) => (
        <circle
          key={`${h.r},${h.c}`}
          cx={at(h.c)}
          cy={at(h.r)}
          r={holeR}
          fill="var(--color-ink)"
        />
      ))}
    </svg>
  );
}

/** Arrow glyph pointing the way a flap folds. */
const ARROW_ANGLE: Record<FoldDir, number> = { left: 0, up: 90, right: 180, down: 270 };

/**
 * One stage of the fold filmstrip: the paper as it stands, the flap about to
 * fold over shown hatched, and any punched holes.
 */
function PaperStage({
  packet,
  flap,
  foldDir,
  punches,
  grid,
  size,
}: {
  packet: { x0: number; y0: number; x1: number; y1: number };
  flap?: { x0: number; y0: number; x1: number; y1: number };
  foldDir?: FoldDir;
  punches?: HoleCell[];
  grid: number;
  size: number | string;
}) {
  const inset = STROKE;
  const span = 100 - 2 * inset;
  const px = (v: number) => inset + v * span;
  const cellAt = (i: number) => inset + (span / grid) * (i + 0.5);
  const holeR = Math.min((span / grid) * 0.3, 9);

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="presentation"
      aria-hidden="true"
      style={{ display: "block", flex: "none" }}
    >
      <defs>
        <pattern id="fold-hatch" width="7" height="7" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="0" y2="7" stroke="var(--color-ink)" strokeOpacity="0.22" strokeWidth="2.5" />
        </pattern>
      </defs>

      {/* The part of the sheet that stays put. */}
      <rect
        x={px(packet.x0)}
        y={px(packet.y0)}
        width={px(packet.x1) - px(packet.x0)}
        height={px(packet.y1) - px(packet.y0)}
        rx="5"
        fill="var(--color-paper)"
        stroke="var(--color-ink)"
        strokeWidth={STROKE}
      />

      {/* The flap that is about to fold over it. */}
      {flap ? (
        <rect
          x={px(flap.x0)}
          y={px(flap.y0)}
          width={px(flap.x1) - px(flap.x0)}
          height={px(flap.y1) - px(flap.y0)}
          rx="5"
          fill="url(#fold-hatch)"
          stroke="var(--color-ink)"
          strokeWidth="3"
          strokeDasharray="6 4"
        />
      ) : null}

      {/* Which way it folds. */}
      {flap && foldDir ? (
        <g
          transform={`translate(50 50) rotate(${ARROW_ANGLE[foldDir]}) translate(-50 -50)`}
          opacity="0.85"
        >
          <path
            d="M62,50 L44,50"
            stroke="var(--color-coral)"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <polygon points="34,50 48,42 48,58" fill="var(--color-coral)" stroke="var(--color-ink)" strokeWidth="3" strokeLinejoin="round" />
        </g>
      ) : null}

      {punches?.map((h) => (
        <circle
          key={`${h.r},${h.c}`}
          cx={cellAt(h.c)}
          cy={cellAt(h.r)}
          r={holeR}
          fill="var(--color-ink)"
        />
      ))}
    </svg>
  );
}

/**
 * The stimulus for a paper-folding item: sheet, each fold, then the punch.
 *
 * Rendered as a horizontal filmstrip because the question is inherently about a
 * sequence of actions in time, and a single "after" picture does not tell the
 * player what was done to get there.
 */
export function FoldStrip({
  folds,
  punches,
  grid = 4,
  className,
}: {
  folds: FoldDir[];
  punches: HoleCell[];
  grid?: number;
  className?: string;
}) {
  const stages = foldStages(folds);

  interface Frame {
    packet: { x0: number; y0: number; x1: number; y1: number };
    flap?: { x0: number; y0: number; x1: number; y1: number };
    foldDir?: FoldDir;
    punches?: HoleCell[];
  }

  // One frame per fold showing the flap about to close, then a final frame of
  // the folded packet with the hole punched through it.
  const frames: Frame[] = folds.map((dir, i) => {
    const before = stages[i];
    const after = stages[i + 1];
    const mx = (before.x0 + before.x1) / 2;
    const my = (before.y0 + before.y1) / 2;
    const flap =
      dir === "left"
        ? { ...before, x0: mx }
        : dir === "right"
          ? { ...before, x1: mx }
          : dir === "up"
            ? { ...before, y0: my }
            : { ...before, y1: my };
    return { packet: after, flap, foldDir: dir };
  });
  frames.push({ packet: stages[stages.length - 1], punches });

  return (
    <div className={cn("flex items-center justify-center gap-1.5 sm:gap-3", className)}>
      {frames.map((frame, i) => (
        <div key={i} className="flex items-center gap-1.5 sm:gap-3">
          {i > 0 ? (
            <span aria-hidden="true" className="text-xl font-black leading-none text-ink/50">
              &rsaquo;
            </span>
          ) : null}
          <PaperStage
            packet={frame.packet}
            flap={frame.flap}
            foldDir={frame.foldDir}
            punches={frame.punches}
            grid={grid}
            size="clamp(58px, 19vw, 104px)"
          />
        </div>
      ))}
    </div>
  );
}

/** The crease axes a set of folds leaves behind, for the option cards. */
export const creaseAxes = foldAxes;
