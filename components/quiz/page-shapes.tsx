"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { motion, motionValue, useAnimationFrame } from "motion/react";

import { trackHeroShapeDragged, trackHeroShapeThrown } from "@/lib/analytics/events";

/*
  Draggable, self-recoloring neo-brutalist shape field, mounted once in
  app/layout.tsx.

  DOCUMENT-GLUED overlay: an `absolute inset-0` layer on the (relative) <body>
  so it spans the whole document and scrolls with the page. Every item holds
  DOCUMENT coordinates. The items are CONFINED TO THE HERO SECTION on BOTH axes
  (the hero sits at the document top): each is clamped to the hero's rect and
  BOUNCES off all four hero edges — nothing can be dragged or thrown out of the
  hero anymore.

  ITEMS: 6 draggable shapes sharing one ambient-drift + drag/throw system.

  INITIAL LAYOUT — FIXED + deterministic (identical every page load): each item
  has a fractional home anchor (fx, fy) placed along the hero's sides, spaced
  out and clear of the centered headline/CTA. `homeOf` converts the fraction to
  document coords inside a small safe band from the hero edges. Placed client-
  side in a layout effect (motion values start at 0 / invisible so SSR and the
  first client render agree — no hydration mismatch). Shapes MAY OVERLAP — there
  is no min-distance / no-overlap rule.

  MOTION:
    - Continuous AMBIENT drift + slow rotation at all times (Emil-calm). Off-
      screen items pause their drift (perf). Shapes spin slowly.
    - Drag (mouse + touch) any shape — clamped to the hero rect.
    - Release with velocity → THROW: momentum + friction glide with a SPRINGY
      bounce off ALL FOUR HERO edges, energy decaying until it settles — then it
      RESUMES ambient drift from wherever it landed inside the hero.
    - Recolor when a shape drifts/drags over a same-color background.

  Reduced motion: items still get the fixed layout and shapes stay draggable
  (clamped to the hero), but there is NO ambient drift / throw glide (release
  settles where dropped); the loop idles while nothing is dragged.

  NO scrollbars: overlay `overflow-hidden` + positions clamped to the hero box.
  Items are the top layer (z-30) with container pointer-events:none / shape
  pointer-events:auto, so gaps pass clicks + the CTA and "T" shortcut through.
*/

// --- ambient drift (idle) ---
const DRIFT_AMP = 28; // px — gentle wander radius around home
const FOLLOW_STIFF = 7; // spring pulling a shape toward its drifting home
const FOLLOW_DAMP = 4.5; // idle damping
const IDLE_MAX_SPEED = 200; // px/s cap on idle speed
const OFFSCREEN_MARGIN = 140; // px past the viewport where idle drift pauses (perf)

// --- throw / bounce (off the hero edges) ---
const FRICTION = 1.5; // throw glide decay: v *= max(0, 1 - FRICTION*dt)
const RESTITUTION = 0.7; // fraction of speed kept per edge bounce (springy, decays)
const REST_SPEED = 46; // px/s below which a thrown shape settles back into drift
const REST_SPIN = 16; // deg/s below which throw-spin settles
const THROW_MIN = 190; // release speed (px/s) that counts as a throw
const GENTLE_RELEASE = 0.14; // residual velocity for a slow (non-throw) release
const SPIN_FROM_VX = 0.16; // throw spin (deg/s) per px/s of horizontal release velocity
const MAX_SPIN = 240; // cap throw spin (deg/s)
const FLY_MAX_SPEED = 3200; // cap throw speed (px/s) — plenty inside a single hero

// --- drag / recolor ---
const DRAG_RECOLOR_MS = 100; // throttle for live recolor checks
const BLEND_DIST = 100; // RGB distance under which a fill "blends" into a bg

// --- fixed layout ---
const SAFE_MARGIN = 16; // px kept inside the hero edges for homes (fully visible)

// --- bottom bound = the WAVY divider edge (the ACTUAL per-x swoop curve) ---
// The hero folds the swoop wave into its bottom as the `.fella-wave` apron (see
// components/quiz/smart-fart-hero.tsx). Every shape collides against that REAL
// curve, not a flat line: measure() samples the apron's swoop <path> into a
// per-x wave function (`waveDocYAt`, document coords) and the loop keeps each
// shape's bounding-circle bottom above `waveY(centerX)` — a clamp while dragging/
// drifting, a springy reflect when thrown. Falls back to the hero's straight
// bottom if the apron is absent.
//
// WAVE_MARGIN — safety gap (document px) between a shape's bounding-circle bottom
// and the ink line; the knob to nudge on localhost if shapes rest slightly off:
//   • Shapes DIP onto/under the ink line?     → RAISE WAVE_MARGIN (e.g. 6–12).
//   • Shapes FLOAT in yellow above the line?  → LOWER it (toward 0, even negative).
// (Per-shape bounding radii already seat each shape near the ink — this shifts all
// six together. The shapes' 5px drop-shadow is intentionally ignored, so it falls
// past the line onto the white below; add ~5 to WAVE_MARGIN to lift it clear too.)
const WAVE_MARGIN = 2;
// Samples taken along the swoop path to build waveY(x) (once per measure). The
// swoop is smooth so few are needed; this is cheap and keeps interp sub-pixel.
const WAVE_SAMPLES = 160;

const PI2 = Math.PI * 2;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

type ShapeType =
  | "circle"
  | "roundSquare"
  | "triangle"
  | "pill"
  | "diamond"
  | "hexagon";
type ShapeColor = "blue" | "coral" | "mint" | "green" | "paper" | "ink";

const COLOR_VAR: Record<ShapeColor, string> = {
  blue: "var(--color-blue)",
  coral: "var(--color-coral)",
  mint: "var(--color-mint)",
  green: "var(--color-green)",
  paper: "var(--color-paper)",
  ink: "var(--color-ink)",
};
const COLOR_RGB: Record<ShapeColor, [number, number, number]> = {
  blue: [131, 154, 255],
  coral: [253, 121, 98],
  mint: [198, 252, 208],
  green: [99, 192, 136],
  paper: [255, 255, 255],
  ink: [0, 0, 0],
};
const RECOLOR_TARGETS: ShapeColor[] = ["blue", "coral", "mint", "green", "paper"];

interface Item {
  id: string;
  type?: ShapeType;
  color?: ShapeColor;
  w: number;
  h: number;
  fx: number; // fixed home anchor as a fraction of the hero (pulled into the safe band)
  fy: number;
  spin: number; // deg/s continuous ambient rotation
}

// 6 shapes anchored along the hero's sides (3 left, 3 right), spaced out and
// clear of the centered copy — the ORIGINAL fixed positions (deterministic).
const SHAPE_ITEMS: Item[] = [
  { id: "circle", type: "circle", color: "blue", w: 128, h: 128, fx: 0.11, fy: 0.2, spin: 4 },
  { id: "roundsq", type: "roundSquare", color: "mint", w: 104, h: 104, fx: 0.89, fy: 0.18, spin: 6 },
  { id: "hexagon", type: "hexagon", color: "green", w: 116, h: 116, fx: 0.93, fy: 0.52, spin: -4 },
  { id: "pill", type: "pill", color: "paper", w: 150, h: 64, fx: 0.87, fy: 0.83, spin: 5 },
  { id: "triangle", type: "triangle", color: "blue", w: 102, h: 102, fx: 0.12, fy: 0.82, spin: -6 },
  { id: "diamond", type: "diamond", color: "coral", w: 112, h: 112, fx: 0.08, fy: 0.5, spin: 5 },
];
const ITEMS: Item[] = [...SHAPE_ITEMS];

// TOUCH / coarse-pointer layout: only THREE shapes, pushed hard to the hero's
// edges (top-left, right-middle, bottom-left) so the central headline+CTA band
// stays clear on a narrow phone screen. A subset of the desktop shapes (same
// ids/types/colors) so recolor + physics behave identically — just fewer of
// them, edge-biased, and shrunk further via a lower scale floor (see measure()).
const MOBILE_ITEMS: Item[] = [
  { ...SHAPE_ITEMS[0], fx: 0.08, fy: 0.14 }, // circle (blue)  — top-left
  { ...SHAPE_ITEMS[2], fx: 0.93, fy: 0.5 }, //  hexagon (green) — right, mid-height
  { ...SHAPE_ITEMS[5], fx: 0.1, fy: 0.88 }, //  diamond (coral) — bottom-left
];

/** SSR-safe `prefers-reduced-motion` (server snapshot false → no hydration mismatch). */
function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const q = window.matchMedia("(prefers-reduced-motion: reduce)");
      q.addEventListener("change", onChange);
      return () => q.removeEventListener("change", onChange);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

/** SSR-safe `(pointer: coarse)` — touch devices (phones/tablets). Server snapshot
 *  is false so SSR + the first client render agree (desktop layout, 6 shapes),
 *  then it re-evaluates on the client and swaps to the lean mobile field. */
function useCoarsePointer(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const q = window.matchMedia("(pointer: coarse)");
      q.addEventListener("change", onChange);
      return () => q.removeEventListener("change", onChange);
    },
    () => window.matchMedia("(pointer: coarse)").matches,
    () => false,
  );
}

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/** One shape's visual. Fill fades smoothly (200ms) on recolor; the border/shadow
 * never changes and the transition is color-only. Reduced motion → instant recolor. */
function ShapeVisual({
  type,
  color,
  reduced,
}: {
  type: ShapeType;
  color: ShapeColor;
  reduced: boolean;
}) {
  const fill = COLOR_VAR[color];
  const colorTx = reduced ? undefined : "background-color 200ms ease";
  const fillTx = reduced ? undefined : "fill 200ms ease";
  const divStyle: CSSProperties = { backgroundColor: fill, transition: colorTx };
  const svgStyle: CSSProperties = { filter: "drop-shadow(5px 5px 0 #000)", overflow: "visible" };
  const polyStyle: CSSProperties = { fill, transition: fillTx };
  switch (type) {
    case "circle":
      return <div className="size-full rounded-full border-[3px] border-ink shadow-hard" style={divStyle} />;
    case "roundSquare":
      return <div className="size-full rounded-[26%] border-[3px] border-ink shadow-hard" style={divStyle} />;
    case "pill":
      return <div className="size-full rounded-full border-[3px] border-ink shadow-hard" style={divStyle} />;
    case "triangle":
      return (
        <svg viewBox="0 0 100 100" className="size-full" style={svgStyle}>
          <polygon points="50,6 94,90 6,90" stroke="#000" strokeWidth={8} strokeLinejoin="round" style={polyStyle} />
        </svg>
      );
    case "diamond":
      return (
        <svg viewBox="0 0 100 100" className="size-full" style={svgStyle}>
          <polygon points="50,4 96,50 50,96 4,50" stroke="#000" strokeWidth={8} strokeLinejoin="round" style={polyStyle} />
        </svg>
      );
    case "hexagon":
      return (
        <svg viewBox="0 0 100 100" className="size-full" style={svgStyle}>
          <polygon points="50,4 91,27 91,73 50,96 9,73 9,27" stroke="#000" strokeWidth={8} strokeLinejoin="round" style={polyStyle} />
        </svg>
      );
  }
}

type Mode = "idle" | "drag" | "fly";

interface Body {
  cx: number; // current center (document coords)
  cy: number;
  vx: number; // px/s
  vy: number;
  hx: number; // drift home (document coords) — follows wherever the shape settles
  hy: number;
  rot: number; // deg
  vrot: number; // deg/s (throw spin; decays)
  spin: number; // deg/s continuous ambient rotation
  f1: number;
  f2: number;
  f3: number;
  f4: number;
  p1: number;
  p2: number;
  p3: number;
  p4: number;
  baseW: number;
  baseH: number;
  radius: number; // unscaled, rotation-invariant bounding-circle radius (wavy bottom collision)
  mode: Mode;
  lastBg: number;
}

function parseRgb(s: string): [number, number, number, number] | null {
  const m = s.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const p = m[1].split(",").map((v) => parseFloat(v.trim()));
  return [p[0], p[1], p[2], p[3] === undefined ? 1 : p[3]];
}
const dist2 = (a: [number, number, number], b: [number, number, number]) =>
  (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;

/** Effective (non-transparent) background painted under a VIEWPORT point. */
function bgUnder(x: number, y: number, overlay: Element): [number, number, number] | null {
  const stack = document.elementsFromPoint(x, y);
  for (const el of stack) {
    if (overlay.contains(el)) continue;
    let node: Element | null = el;
    while (node && node !== document.documentElement) {
      const rgb = parseRgb(getComputedStyle(node).backgroundColor);
      if (rgb && rgb[3] !== 0) return [rgb[0], rgb[1], rgb[2]];
      node = node.parentElement;
    }
  }
  const body = parseRgb(getComputedStyle(document.body).backgroundColor);
  return body ? [body[0], body[1], body[2]] : null;
}

/** Per-x wave geometry: the apron's swoop path sampled into SVG-viewBox space
 *  (`xs`/`ys`, ascending x) plus the linear mapping from that viewBox to DOCUMENT
 *  coords. Built once per measure(); consumed by `waveDocYAt`. */
interface WaveGeom {
  left: number; // document x for viewBox x = 0 (apron left edge)
  width: number; // document width spanning viewBox x [0..viewW]
  top: number; // document y for viewBox y = 0 (apron top edge)
  height: number; // document height spanning viewBox y [0..viewH]
  viewW: number; // viewBox width  (swoop authored in 0..1440)
  viewH: number; // viewBox height (swoop authored in 0..100)
  xs: number[]; // sample x's in viewBox space, ascending (swoop x is monotonic)
  ys: number[]; // matching sample y's in viewBox space
}

/** Sample the apron's OPEN swoop stroke — the path whose `d` has no close (`Z`)
 *  command, i.e. just the curve, NOT the filled path that closes down to the
 *  apron bottom — into ascending-x viewBox-space samples via the browser's own
 *  path geometry (getPointAtLength), so waveY always matches whatever `d=` is
 *  actually rendered (the swoop lives in smart-fart-hero.tsx's `.fella-wave` and
 *  mirrors the `swoop` variant in components/ui/section-divider.tsx — this reads
 *  the real DOM path so the two can never drift apart). null if no usable path. */
function sampleWavePath(wave: Element): { xs: number[]; ys: number[] } | null {
  const paths = Array.from(wave.querySelectorAll<SVGPathElement>("path"));
  if (paths.length === 0) return null;
  const swoop =
    paths.find((p) => !/z/i.test(p.getAttribute("d") ?? "")) ?? paths[paths.length - 1];
  let total = 0;
  try {
    total = swoop.getTotalLength();
  } catch {
    return null; // getTotalLength can throw on a detached/empty path
  }
  if (!(total > 0)) return null;
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i <= WAVE_SAMPLES; i++) {
    const p = swoop.getPointAtLength((i / WAVE_SAMPLES) * total);
    pts.push({ x: p.x, y: p.y });
  }
  pts.sort((a, b) => a.x - b.x); // swoop x is monotonic; guards FP jitter
  return { xs: pts.map((p) => p.x), ys: pts.map((p) => p.y) };
}

/** Document-Y of the wavy ink line at a document-X — the per-x bottom bound.
 *  Maps document x → viewBox x, linearly interpolates the sampled swoop y at that
 *  x (binary search over ascending `xs`), then maps viewBox y → document y.
 *  Returns `fallbackY` (the hero's straight bottom) when there's no wave geometry. */
function waveDocYAt(g: WaveGeom | null, fallbackY: number, docX: number): number {
  if (!g || g.width <= 0 || g.xs.length === 0) return fallbackY;
  const { xs, ys, viewW, viewH } = g;
  const svgX = clamp((docX - g.left) / g.width, 0, 1) * viewW;
  const toDocY = (svgY: number) => g.top + (svgY / viewH) * g.height;
  const last = xs.length - 1;
  if (svgX <= xs[0]) return toDocY(ys[0]);
  if (svgX >= xs[last]) return toDocY(ys[last]);
  let lo = 0;
  let hi = last;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (xs[mid] <= svgX) lo = mid;
    else hi = mid;
  }
  const span = xs[hi] - xs[lo];
  const f = span > 1e-6 ? (svgX - xs[lo]) / span : 0;
  return toDocY(ys[lo] + (ys[hi] - ys[lo]) * f);
}

/** Rotation-invariant bounding-circle radius (unscaled px) per shape, so ONE
 *  radius holds at EVERY rotation (a circle is rotation-invariant). Kept tight to
 *  each shape's real reach (not the loose box half-diagonal) so pointy shapes rest
 *  near the ink instead of floating far above it; exact for circle & pill. Values
 *  cover the polygon vertex + its 8px round-join stroke. */
function boundingRadius(type: ShapeType, w: number, h: number): number {
  switch (type) {
    case "circle":
      return w / 2; // the circle itself
    case "pill":
      return w / 2; // stadium end-cap reach (w > h)
    case "roundSquare":
      return 0.62 * Math.max(w, h); // rounded-corner reach
    case "triangle":
      return 0.64 * Math.max(w, h); // farthest vertex + stroke
    case "diamond":
      return 0.5 * Math.max(w, h); // box mid-edge vertex + stroke
    case "hexagon":
      return 0.52 * Math.max(w, h); // flat-top hex vertex + stroke
  }
}

export function PageShapes() {
  const reduced = usePrefersReducedMotion();
  // On touch devices render the lean 3-shape, edge-biased field; on mouse/desktop
  // keep the full 6. Memoized so its identity only changes when the pointer type
  // does (drives the layout effect below to rebuild the bodies once).
  const coarse = useCoarsePointer();
  const items = useMemo(() => (coarse ? MOBILE_ITEMS : SHAPE_ITEMS), [coarse]);
  const overlayRef = useRef<HTMLDivElement>(null);
  const dimsRef = useRef({
    heroLeft: 0,
    heroTop: 0,
    heroW: 1200,
    heroH: 800,
    scale: 1,
    // Per-x bottom bound = the wavy `.fella-wave` swoop, sampled into DOCUMENT
    // space by measure(). `waveGeom` null → fall back to the hero's straight
    // bottom (`bottomFallbackY`), preserving the old flat behavior.
    waveGeom: null as WaveGeom | null,
    bottomFallbackY: 800,
  });
  const bodiesRef = useRef<Body[] | null>(null);
  const timeRef = useRef(0);
  const dragRef = useRef<{ i: number; pointerId: number; ox: number; oy: number } | null>(null);
  // A press awaiting intent classification (see the pointer handlers): recorded
  // on pointerdown, promoted to `dragRef` on a horizontal-dominant move, or
  // dropped on a vertical-dominant move / tap so the page scrolls natively.
  const pendingRef = useRef<{ i: number; pointerId: number; x: number; y: number } | null>(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const samplesRef = useRef<{ t: number; x: number; y: number }[]>([]);
  const releaseRef = useRef<{ i: number; vx: number; vy: number } | null>(null);
  // Debounce hero_shape_dragged to once per shape per mount (a fidgety session
  // must not emit hundreds of events — see plan §2.2).
  const draggedTrackedRef = useRef<Set<string>>(new Set());

  const [colors, setColors] = useState<ShapeColor[]>(() => ITEMS.map((it) => it.color ?? "blue"));
  const colorsRef = useRef<ShapeColor[]>(ITEMS.map((it) => it.color ?? "blue"));

  // The shapes are the HERO's decorative field. Only render them on pages that
  // actually have a `.fella-hero` (the home hero); routes without one (e.g.
  // /about) get no shapes. Set in measure() below, pre-paint via layout effect.
  const [hasHero, setHasHero] = useState(false);

  const [mvs] = useState(() =>
    ITEMS.map(() => ({
      x: motionValue(0),
      y: motionValue(0),
      r: motionValue(0),
      s: motionValue(1),
      o: motionValue(0),
    })),
  );

  const setColorAt = (i: number, name: ShapeColor) => {
    if (colorsRef.current[i] === name) return;
    colorsRef.current[i] = name;
    setColors((prev) => {
      const next = [...prev];
      next[i] = name;
      return next;
    });
  };

  const maybeRecolor = (i: number, b: Body) => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const vx = b.cx - window.scrollX;
    const vy = b.cy - window.scrollY;
    if (vx < 0 || vy < 0 || vx > window.innerWidth || vy > window.innerHeight) return;
    const bg = bgUnder(vx, vy, overlay);
    if (!bg) return;
    const cur = colorsRef.current[i];
    if (dist2(bg, COLOR_RGB[cur]) >= BLEND_DIST * BLEND_DIST) return;
    let best = cur;
    let bestD = -1;
    for (const name of RECOLOR_TARGETS) {
      if (name === cur) continue;
      const d = dist2(bg, COLOR_RGB[name]);
      if (d > bestD) {
        bestD = d;
        best = name;
      }
    }
    setColorAt(i, best);
  };

  // Measure the hero + place every item at its FIXED home (fraction of the hero,
  // pulled into a safe edge band). Deterministic — identical each load. Client-
  // only (layout effect; motion values start at 0/invisible so SSR agrees).
  // Resize re-measures scale/bounds and re-anchors idle homes; it never
  // reshuffles (there is nothing random left to reshuffle).
  useIsomorphicLayoutEffect(() => {
    const measure = () => {
      const hero = document.querySelector<HTMLElement>(".fella-hero");
      setHasHero(!!hero);
      const r = hero?.getBoundingClientRect();
      const w = r?.width || window.innerWidth;
      const heroTop = (r?.top ?? 0) + window.scrollY;
      const heroH = r?.height || window.innerHeight;
      // Bottom bound = the folded swoop wave. Sample the `.fella-wave` apron's
      // swoop <path> into a per-x waveY(x) in DOCUMENT coords so shapes bounce/
      // settle at the ACTUAL curve. The apron's SVG (viewBox 0..viewW × 0..viewH,
      // preserveAspectRatio="none") stretches to the apron's on-screen rect, so
      // viewBox x/y map LINEARLY onto [rect.left..right] / [rect.top..bottom]
      // (document coords once scroll is added). Falls back to the hero's straight
      // bottom if the apron is absent.
      const wave = document.querySelector<HTMLElement>(".fella-wave");
      let waveGeom: WaveGeom | null = null;
      if (wave) {
        const wr = wave.getBoundingClientRect();
        const vb = wave.querySelector("svg")?.viewBox.baseVal;
        const viewW = vb && vb.width > 0 ? vb.width : 1440;
        const viewH = vb && vb.height > 0 ? vb.height : 100;
        const samples = sampleWavePath(wave);
        if (samples && wr.width > 0 && wr.height > 0) {
          waveGeom = {
            left: wr.left + window.scrollX,
            width: wr.width,
            top: wr.top + window.scrollY,
            height: wr.height,
            viewW,
            viewH,
            xs: samples.xs,
            ys: samples.ys,
          };
        }
      }
      dimsRef.current = {
        heroLeft: (r?.left ?? 0) + window.scrollX,
        heroTop,
        heroW: w,
        heroH,
        // Shrink the shapes further on touch (lower floor) so the smaller field
        // reads lighter on a phone and leaves more of the hero clear.
        scale: clamp(w / 1280, coarse ? 0.4 : 0.55, 1),
        waveGeom,
        bottomFallbackY: heroTop + heroH,
      };
    };
    measure();

    // Fixed home for an item: its (fx, fy) fraction of the hero, clamped so the
    // whole item stays inside the hero edges (document coords).
    const homeOf = (it: Item) => {
      const { heroLeft, heroTop, heroW, heroH, scale } = dimsRef.current;
      const halfW = (it.w * scale) / 2;
      const halfH = (it.h * scale) / 2;
      return {
        x: heroLeft + clamp(it.fx * heroW, halfW + SAFE_MARGIN, heroW - halfW - SAFE_MARGIN),
        y: heroTop + clamp(it.fy * heroH, halfH + SAFE_MARGIN, heroH - halfH - SAFE_MARGIN),
      };
    };

    // Build (or rebuild, when the pointer type flips the active set between the
    // 6-shape desktop field and the 3-shape touch field) the bodies + colors.
    if (!bodiesRef.current || bodiesRef.current.length !== items.length) {
      const initialColors = items.map((it) => it.color ?? "blue");
      colorsRef.current = initialColors;
      setColors(initialColors);
      const rand = (a: number, b: number) => a + Math.random() * (b - a);
      const scale = dimsRef.current.scale;
      bodiesRef.current = items.map((it, i) => {
        const home = homeOf(it);
        // Fixed positions; only the tiny idle-wobble phases + a small initial tilt
        // stay random (as in the original) so the drift still reads as organic.
        const rot = rand(-12, 12);
        mvs[i].x.set(home.x - it.w / 2);
        mvs[i].y.set(home.y - it.h / 2);
        mvs[i].r.set(rot);
        mvs[i].s.set(scale);
        mvs[i].o.set(1);
        return {
          cx: home.x,
          cy: home.y,
          vx: 0,
          vy: 0,
          hx: home.x,
          hy: home.y,
          rot,
          vrot: 0,
          spin: it.spin,
          f1: rand(0.2, 0.46),
          f2: rand(0.28, 0.56),
          f3: rand(0.2, 0.46),
          f4: rand(0.28, 0.56),
          p1: rand(0, PI2),
          p2: rand(0, PI2),
          p3: rand(0, PI2),
          p4: rand(0, PI2),
          baseW: it.w,
          baseH: it.h,
          radius: boundingRadius(it.type ?? "circle", it.w, it.h),
          mode: "idle" as Mode,
          lastBg: 0,
        };
      });
    }

    const onResize = () => {
      measure();
      const { scale } = dimsRef.current;
      mvs.forEach((mv) => mv.s.set(scale));
      const bodies = bodiesRef.current;
      if (bodies) {
        bodies.forEach((b, i) => {
          if (b.mode === "idle") {
            const home = homeOf(items[i]);
            b.hx = home.x;
            b.hy = home.y;
          }
        });
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [mvs, items, coarse]);

  // Physics loop. Normal motion: continuous ambient drift + drag + throw/bounce,
  // all confined to the hero rect. Reduced motion: nothing runs unless a shape is
  // actively being dragged (static otherwise).
  useAnimationFrame((_t, deltaMs) => {
    const bodies = bodiesRef.current;
    if (!bodies || !overlayRef.current) return;
    if (reduced && !dragRef.current && releaseRef.current === null) return;

    const dt = clamp(deltaMs / 1000, 0, 0.05);
    timeRef.current += dt;
    const t = timeRef.current;
    const now = performance.now();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const sx = window.scrollX;
    const sy = window.scrollY;
    const idleDamp = Math.max(0, 1 - FOLLOW_DAMP * dt);
    const { heroLeft, heroTop, heroW, scale, waveGeom, bottomFallbackY } = dimsRef.current;

    for (let i = 0; i < bodies.length; i++) {
      const b = bodies[i];
      const mv = mvs[i];
      const halfW = (b.baseW * scale) / 2;
      const halfH = (b.baseH * scale) / 2;
      const rad = b.radius * scale; // bounding-circle radius for the wavy bottom
      // Hero bounds for this item's CENTER (document coords). Left/right/top are
      // the straight hero rect (UNCHANGED — still use the box half-extents). The
      // BOTTOM is the ACTUAL swoop curve: `bottomLimitAt(cx)` = the wavy ink
      // line's document-Y at the shape's center x, lifted by the bounding-circle
      // radius (+ WAVE_MARGIN) so the circle rests just above the ink at that x.
      // `Math.max(minY, …)` keeps it sane if a very tall shape can't fit above
      // the wave. Recomputed per mode from the shape's live center x below.
      const minX = heroLeft + halfW;
      const maxX = heroLeft + heroW - halfW;
      const minY = heroTop + halfH;
      const bottomLimitAt = (cx: number) =>
        Math.max(minY, waveDocYAt(waveGeom, bottomFallbackY, cx) - rad - WAVE_MARGIN);

      const d = dragRef.current;
      if (d && d.i === i) {
        b.mode = "drag";
        // Follow the pointer, clamped to the hero rect (can't be dragged out);
        // the bottom clamp is the per-x wave at the dragged center x.
        b.cx = clamp(pointerRef.current.x + window.scrollX + d.ox, minX, maxX);
        b.cy = clamp(pointerRef.current.y + window.scrollY + d.oy, minY, bottomLimitAt(b.cx));
        b.rot += b.spin * dt;
        mv.x.set(b.cx - b.baseW / 2);
        mv.y.set(b.cy - b.baseH / 2);
        mv.r.set(b.rot);
        if (now - b.lastBg > DRAG_RECOLOR_MS) {
          b.lastBg = now;
          maybeRecolor(i, b);
        }
        continue;
      }

      const rel = releaseRef.current;
      if (rel && rel.i === i) {
        releaseRef.current = null;
        if (reduced) {
          b.mode = "idle";
          b.hx = b.cx;
          b.hy = b.cy;
          b.vx = 0;
          b.vy = 0;
        } else {
          const speed = Math.hypot(rel.vx, rel.vy);
          if (speed >= THROW_MIN) {
            b.vx = rel.vx;
            b.vy = rel.vy;
            b.vrot = clamp(rel.vx * SPIN_FROM_VX, -MAX_SPIN, MAX_SPIN);
          } else {
            b.vx = rel.vx * GENTLE_RELEASE;
            b.vy = rel.vy * GENTLE_RELEASE;
            b.vrot = 0;
          }
          b.mode = "fly";
        }
        maybeRecolor(i, b);
      }

      if (b.mode === "fly") {
        const f = Math.max(0, 1 - FRICTION * dt);
        b.vx *= f;
        b.vy *= f;
        b.vrot *= f;
        const sp = Math.hypot(b.vx, b.vy);
        if (sp > FLY_MAX_SPEED) {
          b.vx = (b.vx / sp) * FLY_MAX_SPEED;
          b.vy = (b.vy / sp) * FLY_MAX_SPEED;
        }
        b.cx += b.vx * dt;
        b.cy += b.vy * dt;
        // Springy bounce off the hero's left/right + top edges and the WAVY
        // bottom (velocity reflects, energy decays via restitution, then it
        // settles back into drift). The bottom uses the per-x wave evaluated at
        // the now-in-bounds center x, so the reflect happens ON the curve.
        if (b.cx < minX) {
          b.cx = minX;
          b.vx = Math.abs(b.vx) * RESTITUTION;
        } else if (b.cx > maxX) {
          b.cx = maxX;
          b.vx = -Math.abs(b.vx) * RESTITUTION;
        }
        const bottomLimit = bottomLimitAt(b.cx);
        if (b.cy < minY) {
          b.cy = minY;
          b.vy = Math.abs(b.vy) * RESTITUTION;
        } else if (b.cy > bottomLimit) {
          b.cy = bottomLimit;
          b.vy = -Math.abs(b.vy) * RESTITUTION;
        }
        b.rot += b.vrot * dt;
        if (Math.hypot(b.vx, b.vy) < REST_SPEED && Math.abs(b.vrot) < REST_SPIN) {
          // Settle → resume ambient drift from wherever it landed in the hero.
          b.mode = "idle";
          b.hx = b.cx;
          b.hy = b.cy;
          b.vx = 0;
          b.vy = 0;
          b.vrot = 0;
          maybeRecolor(i, b);
        }
        mv.x.set(b.cx - b.baseW / 2);
        mv.y.set(b.cy - b.baseH / 2);
        mv.r.set(b.rot);
        continue;
      }

      // idle: continuous ambient drift + slow rotation (normal motion only).
      if (reduced) continue;
      // Pause drift while off-screen (perf) — e.g. the hero scrolled out of view.
      const vpx = b.cx - sx;
      const vpy = b.cy - sy;
      if (vpx < -OFFSCREEN_MARGIN || vpy < -OFFSCREEN_MARGIN || vpx > vw + OFFSCREEN_MARGIN || vpy > vh + OFFSCREEN_MARGIN) {
        continue;
      }
      const offX = DRIFT_AMP * (0.65 * Math.sin(t * b.f1 + b.p1) + 0.35 * Math.sin(t * b.f2 + b.p2));
      const offY = DRIFT_AMP * (0.65 * Math.sin(t * b.f3 + b.p3) + 0.35 * Math.sin(t * b.f4 + b.p4));
      b.vx = (b.vx + (b.hx + offX - b.cx) * FOLLOW_STIFF * dt) * idleDamp;
      b.vy = (b.vy + (b.hy + offY - b.cy) * FOLLOW_STIFF * dt) * idleDamp;
      const isp = Math.hypot(b.vx, b.vy);
      if (isp > IDLE_MAX_SPEED) {
        b.vx = (b.vx / isp) * IDLE_MAX_SPEED;
        b.vy = (b.vy / isp) * IDLE_MAX_SPEED;
      }
      // Clamp drift to the hero rect too (a side home can wander to the edge);
      // the bottom follows the per-x wave (gentle clamp) at the drifted center x.
      b.cx = clamp(b.cx + b.vx * dt, minX, maxX);
      b.cy = clamp(b.cy + b.vy * dt, minY, bottomLimitAt(b.cx));
      b.rot += b.spin * dt;
      mv.x.set(b.cx - b.baseW / 2);
      mv.y.set(b.cy - b.baseH / 2);
      mv.r.set(b.rot);
    }
  });

  // Pointer handlers write ONLY refs (the loop owns all body mutations).
  //
  // INTENT-GATED drag (so a vertical swipe on a shape scrolls the page instead
  // of being hijacked): pointerdown does NOT capture the pointer — it only
  // records a PENDING press. The first significant move decides intent:
  //   • horizontal-dominant (|dx|>8 && |dx|>|dy|) → promote to a real drag and
  //     capture the pointer;
  //   • vertical-dominant   (|dy|>10 && |dy|>=|dx|) → abandon, so the browser's
  //     native pan-y (touch-action: pan-y on the shape) scrolls the page.
  const onShapePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const i = Number(e.currentTarget.dataset.shapeIndex);
    const b = bodiesRef.current?.[i];
    if (!b) return;
    // Record the press but DON'T capture yet (capturing on down would swallow
    // the browser's vertical scroll). Promotion + capture happen in pointermove.
    pendingRef.current = { i, pointerId: e.pointerId, x: e.clientX, y: e.clientY };
    pointerRef.current = { x: e.clientX, y: e.clientY };
    samplesRef.current = [{ t: performance.now(), x: e.clientX, y: e.clientY }];
  };

  const onShapePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    // Classify a still-pending press into a horizontal drag or a vertical scroll.
    const p = pendingRef.current;
    if (p && e.pointerId === p.pointerId) {
      const dx = e.clientX - p.x;
      const dy = e.clientY - p.y;
      if (Math.abs(dy) > 10 && Math.abs(dy) >= Math.abs(dx)) {
        pendingRef.current = null; // vertical intent → let the page scroll
        return;
      }
      if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
        // Horizontal intent → promote to a real drag. Recompute the grab offset
        // against the body's LIVE (drifted) center so it doesn't jump on capture.
        const b = bodiesRef.current?.[p.i];
        pendingRef.current = null;
        if (!b) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        dragRef.current = {
          i: p.i,
          pointerId: p.pointerId,
          ox: b.cx - (e.clientX + window.scrollX),
          oy: b.cy - (e.clientY + window.scrollY),
        };
        // A press just became a real drag — record it once per shape/session.
        const dit = items[p.i];
        if (dit && !draggedTrackedRef.current.has(dit.id)) {
          draggedTrackedRef.current.add(dit.id);
          trackHeroShapeDragged({
            shape_id: dit.id,
            shape_type: dit.type,
            shape_color: colorsRef.current[p.i],
            is_touch: coarse,
          });
        }
      } else {
        return; // still ambiguous — wait for a clearer move
      }
    }

    const d = dragRef.current;
    if (!d || e.pointerId !== d.pointerId) return;
    pointerRef.current = { x: e.clientX, y: e.clientY };
    const s = samplesRef.current;
    s.push({ t: performance.now(), x: e.clientX, y: e.clientY });
    if (s.length > 6) s.shift();
  };

  const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    // An un-promoted press (a tap, or a vertical swipe the browser took over and
    // ended with pointercancel) just clears the pending intent — nothing to throw.
    if (pendingRef.current && e.pointerId === pendingRef.current.pointerId) {
      pendingRef.current = null;
    }
    const d = dragRef.current;
    if (!d || e.pointerId !== d.pointerId) return;
    dragRef.current = null;
    const nowT = performance.now();
    const recent = samplesRef.current.filter((p) => nowT - p.t <= 120);
    let vx = 0;
    let vy = 0;
    if (recent.length >= 2) {
      const last = recent[recent.length - 1];
      const ref = recent[0];
      const dtS = (last.t - ref.t) / 1000;
      if (dtS > 0) {
        vx = (last.x - ref.x) / dtS;
        vy = (last.y - ref.y) / dtS;
      }
    }
    // A release above the throw threshold is an intentional "throw" gesture.
    const tit = items[d.i];
    const throwSpeed = Math.hypot(vx, vy);
    if (tit && throwSpeed >= THROW_MIN) {
      trackHeroShapeThrown({
        shape_id: tit.id,
        throw_speed: throwSpeed,
        is_touch: coarse,
      });
    }
    releaseRef.current = { i: d.i, vx, vy };
  };

  // No hero on this route → no shape field (keeps calmer pages like /about clean).
  if (!hasHero) return null;

  return (
    <div
      ref={overlayRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-30 overflow-hidden"
    >
      {items.map((it, i) => (
        <motion.div
          key={it.id}
          // touch-action: pan-y — the browser keeps vertical scrolling; a drag is
          // only claimed once movement is horizontal-dominant (see the handlers).
          className="pointer-events-auto absolute left-0 top-0 cursor-grab touch-pan-y select-none active:cursor-grabbing"
          style={{
            width: it.w,
            height: it.h,
            x: mvs[i].x,
            y: mvs[i].y,
            rotate: mvs[i].r,
            scale: mvs[i].s,
            opacity: mvs[i].o,
            willChange: "transform",
          }}
          data-shape-index={i}
          onPointerDown={onShapePointerDown}
          onPointerMove={onShapePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <ShapeVisual type={it.type!} color={colors[i]} reduced={reduced} />
        </motion.div>
      ))}
    </div>
  );
}
