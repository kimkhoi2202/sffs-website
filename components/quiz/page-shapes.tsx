"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { motion, motionValue, useAnimationFrame } from "motion/react";

import { cn } from "@/lib/utils";
import { scrollQuizBy } from "@/components/quiz/smooth-scroll";

/*
  PAGE-LEVEL draggable, self-recoloring neo-brutalist shape field.

  DOCUMENT-GLUED: this is an `absolute inset-0` overlay on the (relative) <body>,
  so it spans the whole document and SCROLLS WITH THE PAGE. Shapes are positioned
  in DOCUMENT coordinates — scrolling does NOT move a shape relative to the page:
  a hero shape scrolls up out of view, and a shape dropped in the footer stays
  parked in the footer. Shapes only move when DRAGGED (or their small idle drift).

  NO scrollbars: the overlay's `overflow-hidden` (height = document content) clips
  any shape dragged/flung past the edges, and `cy` is clamped to the document
  height — a shape can never grow the page. (Horizontal is also covered by the
  page's `overflow-x: clip`.)

  Shapes are the TOP layer (z-30 — above the hero text/CTA and all page content;
  the fixed nav/music chrome stay above). Container is pointer-events:none and
  each shape is pointer-events:auto, so gaps pass clicks/selection through.

  Behaviour: idle local drift around a home; drag anywhere (mouse+touch); release
  visible → stays (home = drop spot); throw off-screen → eases back to the hero
  safe-edge home after a delay ∝ throw (cap ~1.8s), no snap; recolor-on-blend
  happens DURING THE DRAG (smooth 200ms fill fade to a contrasting brand color,
  kept afterward). Reduced motion → static.
*/

// --- tuning (px, px/s, deg/s, ms) ---
const DRIFT_AMP = 26;
const FOLLOW_STIFF = 9;
const FOLLOW_DAMP = 5;
const IDLE_MAX_SPEED = 240;
const GENTLE_RELEASE = 0.12;
const THROW_MIN = 320;
const FLY_DAMP = 1.6;
const FLY_MAX_SPEED = 2600;
const DELAY_PER_SPEED = 1.0;
const MAX_RETURN_DELAY = 1800; // ~max 2s; harder throw → nearer this
const RETURN_TAU = 0.26; // s — ease-back time constant (smooth, no snap)
const SAFE_MARGIN = 14; // px kept inside the hero edges for homes (fully visible)
const BLEND_DIST = 100; // RGB distance under which a fill "blends" into a bg
const DRAG_RECOLOR_MS = 100; // throttle for live (mid-drag) recolor checks
const DOCH_REFRESH_FRAMES = 45; // how often to re-read the document height
const AUTOSCROLL_EDGE = 90; // px from a viewport edge where drag auto-scroll starts
const AUTOSCROLL_SPEED = 1500; // px/s auto-scroll at full edge proximity

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
// Auto-recolor picks a VIVID brand color that pops on the section bg. `ink`
// (black) is intentionally excluded (as pure max-contrast it would win on every
// vivid section → black blobs), keeping shapes colorful and the pick varied.
const RECOLOR_TARGETS: ShapeColor[] = ["blue", "coral", "mint", "green", "paper"];

interface ShapeDef {
  id: string;
  type: ShapeType;
  color: ShapeColor;
  w: number;
  h: number;
  fx: number; // home anchor as a fraction of the hero (pulled into the safe band)
  fy: number;
  spin: number; // deg/s
}

// 6 distinct shapes anchored around the hero perimeter, non-yellow, varied.
const SHAPES: ShapeDef[] = [
  { id: "circle", type: "circle", color: "blue", w: 128, h: 128, fx: 0.11, fy: 0.2, spin: 4 },
  { id: "roundsq", type: "roundSquare", color: "mint", w: 104, h: 104, fx: 0.89, fy: 0.18, spin: 6 },
  { id: "hexagon", type: "hexagon", color: "green", w: 116, h: 116, fx: 0.93, fy: 0.52, spin: -4 },
  { id: "pill", type: "pill", color: "paper", w: 150, h: 64, fx: 0.87, fy: 0.83, spin: 5 },
  { id: "triangle", type: "triangle", color: "blue", w: 102, h: 102, fx: 0.12, fy: 0.82, spin: -6 },
  { id: "diamond", type: "diamond", color: "coral", w: 112, h: 112, fx: 0.08, fy: 0.5, spin: 5 },
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

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/** One shape's visual. Fill fades smoothly (200ms) on recolor; the black
 * border/shadow never changes and the transition is color-only (never transform). */
function ShapeVisual({ type, color }: { type: ShapeType; color: ShapeColor }) {
  const fill = COLOR_VAR[color];
  const divStyle: CSSProperties = { backgroundColor: fill, transition: "background-color 200ms ease" };
  const svgStyle: CSSProperties = { filter: "drop-shadow(5px 5px 0 #000)", overflow: "visible" };
  const polyStyle: CSSProperties = { fill, transition: "fill 200ms ease" };
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

type Mode = "idle" | "drag" | "fly" | "return";

interface Body {
  homeX0: number; // hero safe-edge home (document coords) — the return target
  homeY0: number;
  hx: number; // current home (document coords)
  hy: number;
  cx: number; // current center (document coords)
  cy: number;
  vx: number;
  vy: number;
  f1: number;
  f2: number;
  f3: number;
  f4: number;
  p1: number;
  p2: number;
  p3: number;
  p4: number;
  rot: number;
  vrot: number;
  baseW: number;
  baseH: number;
  mode: Mode;
  decideAt: number;
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

/** Effective (non-transparent) background painted under a VIEWPORT point,
 * ignoring the shapes overlay. */
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

export function PageShapes() {
  const reduced = usePrefersReducedMotion();
  const overlayRef = useRef<HTMLDivElement>(null);
  const dimsRef = useRef({ heroLeft: 0, heroTop: 0, heroW: 1200, heroH: 800, scale: 1, docH: 4000 });
  const bodiesRef = useRef<Body[] | null>(null);
  const timeRef = useRef(0);
  const frameRef = useRef(0);
  // Manual pointer drag (so it composes with Lenis auto-scroll — Motion's own
  // drag can't be offset by a mid-drag page scroll).
  const dragRef = useRef<{ i: number; pointerId: number; ox: number; oy: number } | null>(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const samplesRef = useRef<{ t: number; x: number; y: number }[]>([]);
  // Handlers only WRITE these refs; the animation-frame loop (the single owner of
  // body mutations) reads them and applies the drag / release physics.
  const releaseRef = useRef<{ i: number; vx: number; vy: number } | null>(null);

  const [colors, setColors] = useState<ShapeColor[]>(() => SHAPES.map((s) => s.color));
  const colorsRef = useRef<ShapeColor[]>(SHAPES.map((s) => s.color));

  const [mvs] = useState(() =>
    SHAPES.map(() => ({
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

  // Recolor a shape if its fill would blend into the section beneath it. Uses the
  // shape's VIEWPORT position (document center minus scroll) for the hit-test.
  const maybeRecolor = (i: number, b: Body) => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const vx = b.cx - window.scrollX;
    const vy = b.cy - window.scrollY;
    if (vx < 0 || vy < 0 || vx > window.innerWidth || vy > window.innerHeight) return;
    const bg = bgUnder(vx, vy, overlay);
    if (!bg) return;
    const cur = colorsRef.current[i];
    if (dist2(bg, COLOR_RGB[cur]) >= BLEND_DIST * BLEND_DIST) return; // not blending
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

  // Measure the hero → seed homes in the safe edge band (document coords).
  // Re-anchor on resize. Layout effect so shapes are placed before first paint.
  useIsomorphicLayoutEffect(() => {
    const measure = () => {
      const hero = document.querySelector<HTMLElement>(".fella-hero");
      const r = hero?.getBoundingClientRect();
      const w = r?.width || window.innerWidth;
      dimsRef.current = {
        heroLeft: (r?.left ?? 0) + window.scrollX,
        heroTop: (r?.top ?? 0) + window.scrollY,
        heroW: w,
        heroH: r?.height || window.innerHeight,
        scale: clamp(w / 1280, 0.55, 1),
        docH: document.documentElement.scrollHeight,
      };
    };
    measure();
    const homeOf = (s: ShapeDef) => {
      const { heroLeft, heroTop, heroW, heroH, scale } = dimsRef.current;
      const halfW = (s.w * scale) / 2;
      const halfH = (s.h * scale) / 2;
      return {
        x: heroLeft + clamp(s.fx * heroW, halfW + SAFE_MARGIN, heroW - halfW - SAFE_MARGIN),
        y: heroTop + clamp(s.fy * heroH, halfH + SAFE_MARGIN, heroH - halfH - SAFE_MARGIN),
      };
    };
    if (!bodiesRef.current) {
      const rand = (a: number, b: number) => a + Math.random() * (b - a);
      const scale = dimsRef.current.scale;
      bodiesRef.current = SHAPES.map((s, i) => {
        const home = homeOf(s);
        const rot = rand(-12, 12);
        mvs[i].x.set(home.x - s.w / 2);
        mvs[i].y.set(home.y - s.h / 2);
        mvs[i].r.set(rot);
        mvs[i].s.set(scale);
        mvs[i].o.set(1);
        return {
          homeX0: home.x,
          homeY0: home.y,
          hx: home.x,
          hy: home.y,
          cx: home.x,
          cy: home.y,
          vx: 0,
          vy: 0,
          f1: rand(0.18, 0.4),
          f2: rand(0.24, 0.5),
          f3: rand(0.18, 0.4),
          f4: rand(0.24, 0.5),
          p1: rand(0, Math.PI * 2),
          p2: rand(0, Math.PI * 2),
          p3: rand(0, Math.PI * 2),
          p4: rand(0, Math.PI * 2),
          rot,
          vrot: s.spin,
          baseW: s.w,
          baseH: s.h,
          mode: "idle" as Mode,
          decideAt: 0,
          lastBg: 0,
        };
      });
    }
    const onResize = () => {
      measure();
      mvs.forEach((mv) => mv.s.set(dimsRef.current.scale));
      const bodies = bodiesRef.current;
      if (bodies) {
        bodies.forEach((b, i) => {
          const home = homeOf(SHAPES[i]);
          b.homeX0 = home.x;
          b.homeY0 = home.y;
          if (b.mode === "idle") {
            b.hx = home.x;
            b.hy = home.y;
          }
        });
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [reduced, mvs]);

  useAnimationFrame((_t, deltaMs) => {
    if (reduced) return;
    const bodies = bodiesRef.current;
    if (!bodies || !overlayRef.current) return;
    const dt = clamp(deltaMs / 1000, 0, 0.05);
    timeRef.current += dt;
    const t = timeRef.current;
    const idleDamp = Math.max(0, 1 - FOLLOW_DAMP * dt);
    const flyDamp = Math.max(0, 1 - FLY_DAMP * dt);
    const now = performance.now();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const sx = window.scrollX;
    const sy = window.scrollY;

    // Re-read the document height occasionally (content can settle after load) so
    // the cy clamp keeps a thrown shape from ever growing the page.
    if (frameRef.current++ % DOCH_REFRESH_FRAMES === 0) {
      dimsRef.current.docH = document.documentElement.scrollHeight;
    }
    const docH = dimsRef.current.docH;

    for (let i = 0; i < bodies.length; i++) {
      const b = bodies[i];
      const mv = mvs[i];

      const d = dragRef.current;
      if (d && d.i === i) {
        b.mode = "drag";
        // Auto-scroll when the pointer nears a viewport edge, so a shape can be
        // dragged across sections in one continuous gesture (Lenis-integrated).
        const py = pointerRef.current.y;
        if (py > vh - AUTOSCROLL_EDGE) {
          scrollQuizBy(AUTOSCROLL_SPEED * dt * Math.min(1, (py - (vh - AUTOSCROLL_EDGE)) / AUTOSCROLL_EDGE));
        } else if (py < AUTOSCROLL_EDGE) {
          scrollQuizBy(-AUTOSCROLL_SPEED * dt * Math.min(1, (AUTOSCROLL_EDGE - py) / AUTOSCROLL_EDGE));
        }
        // Keep the shape under the pointer in DOCUMENT coords (re-reads the live
        // scroll, so it follows the page as it auto-scrolls).
        b.cx = pointerRef.current.x + window.scrollX + d.ox;
        b.cy = clamp(pointerRef.current.y + window.scrollY + d.oy, 0, docH);
        b.rot += b.vrot * dt;
        mv.x.set(b.cx - b.baseW / 2);
        mv.y.set(b.cy - b.baseH / 2);
        mv.r.set(b.rot);
        if (now - b.lastBg > DRAG_RECOLOR_MS) {
          b.lastBg = now;
          maybeRecolor(i, b);
        }
        continue;
      }

      // Just released (pointerup/cancel): turn the recorded release velocity into
      // a throw (fly) or a gentle place (idle) / off-screen return.
      const rel = releaseRef.current;
      if (rel && rel.i === i) {
        releaseRef.current = null;
        const speed = Math.hypot(rel.vx, rel.vy);
        if (speed >= THROW_MIN) {
          b.vx = rel.vx;
          b.vy = rel.vy;
          b.mode = "fly";
          b.decideAt = now + clamp(speed * DELAY_PER_SPEED, 0, MAX_RETURN_DELAY);
        } else {
          b.vx = rel.vx * GENTLE_RELEASE;
          b.vy = rel.vy * GENTLE_RELEASE;
          const vpx = b.cx - sx;
          const vpy = b.cy - sy;
          const visible = vpx >= 0 && vpx <= vw && vpy >= 0 && vpy <= vh;
          if (visible) {
            b.mode = "idle";
            b.hx = b.cx;
            b.hy = b.cy;
          } else {
            b.mode = "return";
          }
          maybeRecolor(i, b);
        }
      }

      if (b.mode === "fly") {
        b.vx *= flyDamp;
        b.vy *= flyDamp;
        const sp = Math.hypot(b.vx, b.vy);
        if (sp > FLY_MAX_SPEED) {
          b.vx = (b.vx / sp) * FLY_MAX_SPEED;
          b.vy = (b.vy / sp) * FLY_MAX_SPEED;
        }
        b.cx += b.vx * dt;
        b.cy = clamp(b.cy + b.vy * dt, 0, docH); // never grow the document
        b.rot += b.vrot * dt;
        if (now >= b.decideAt) {
          const vx = b.cx - sx;
          const vy = b.cy - sy;
          const centerVisible = vx >= 0 && vx <= vw && vy >= 0 && vy <= vh;
          if (centerVisible) {
            b.mode = "idle"; // stays where it landed (idle spring absorbs residual velocity)
            b.hx = b.cx;
            b.hy = b.cy;
            maybeRecolor(i, b);
          } else {
            b.mode = "return"; // flung off-screen → ease back to the hero safe edge
          }
        }
        mv.x.set(b.cx - b.baseW / 2);
        mv.y.set(b.cy - b.baseH / 2);
        mv.r.set(b.rot);
        continue;
      }

      if (b.mode === "return") {
        const k = 1 - Math.exp(-dt / RETURN_TAU);
        b.cx += (b.homeX0 - b.cx) * k;
        b.cy += (b.homeY0 - b.cy) * k;
        b.rot += b.vrot * dt;
        if (Math.hypot(b.homeX0 - b.cx, b.homeY0 - b.cy) < 1.5) {
          b.cx = b.homeX0;
          b.cy = b.homeY0;
          b.hx = b.homeX0;
          b.hy = b.homeY0;
          b.vx = 0;
          b.vy = 0;
          b.mode = "idle";
          maybeRecolor(i, b);
        }
        mv.x.set(b.cx - b.baseW / 2);
        mv.y.set(b.cy - b.baseH / 2);
        mv.r.set(b.rot);
        continue;
      }

      // idle: gentle bounded local drift around home (document coords)
      const offX =
        DRIFT_AMP * (0.65 * Math.sin(t * b.f1 + b.p1) + 0.35 * Math.sin(t * b.f2 + b.p2));
      const offY =
        DRIFT_AMP * (0.65 * Math.sin(t * b.f3 + b.p3) + 0.35 * Math.sin(t * b.f4 + b.p4));
      b.vx = (b.vx + (b.hx + offX - b.cx) * FOLLOW_STIFF * dt) * idleDamp;
      b.vy = (b.vy + (b.hy + offY - b.cy) * FOLLOW_STIFF * dt) * idleDamp;
      const isp = Math.hypot(b.vx, b.vy);
      if (isp > IDLE_MAX_SPEED) {
        b.vx = (b.vx / isp) * IDLE_MAX_SPEED;
        b.vy = (b.vy / isp) * IDLE_MAX_SPEED;
      }
      b.cx += b.vx * dt;
      b.cy = clamp(b.cy + b.vy * dt, 0, docH);
      b.rot += b.vrot * dt;
      mv.x.set(b.cx - b.baseW / 2);
      mv.y.set(b.cy - b.baseH / 2);
      mv.r.set(b.rot);
    }
  });

  // These pointer handlers are passed DIRECTLY to the shape's on* props so the
  // React compiler treats them as event handlers (side effects on the physics
  // bodies are expected here). The shape index rides on a data attribute.
  const onShapePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (reduced) return;
    const i = Number(e.currentTarget.dataset.shapeIndex);
    const b = bodiesRef.current?.[i];
    if (!b) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    // Grab offset: keep the shape where it was grabbed relative to the pointer
    // (no jump-to-center), in document coords. The loop flips this body to "drag".
    dragRef.current = {
      i,
      pointerId: e.pointerId,
      ox: b.cx - (e.clientX + window.scrollX),
      oy: b.cy - (e.clientY + window.scrollY),
    };
    pointerRef.current = { x: e.clientX, y: e.clientY };
    samplesRef.current = [{ t: performance.now(), x: e.clientX, y: e.clientY }];
  };

  const onShapePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d || e.pointerId !== d.pointerId) return;
    pointerRef.current = { x: e.clientX, y: e.clientY };
    const s = samplesRef.current;
    s.push({ t: performance.now(), x: e.clientX, y: e.clientY });
    if (s.length > 6) s.shift();
  };

  const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d || e.pointerId !== d.pointerId) return;
    dragRef.current = null;
    // Release velocity (viewport px/s) from ONLY the most recent pointer samples
    // (last ~120ms). If the pointer was held still (e.g. parked at the edge while
    // auto-scrolling), there are no recent samples → velocity 0 → a gentle place,
    // not a stale throw. The loop turns this into a throw or a place.
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
    releaseRef.current = { i: d.i, vx, vy };
  };

  return (
    <div
      ref={overlayRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-30 overflow-hidden"
    >
      {SHAPES.map((s, i) => (
        <motion.div
          key={s.id}
          className={cn(
            "absolute left-0 top-0 select-none",
            !reduced && "pointer-events-auto cursor-grab touch-none active:cursor-grabbing",
          )}
          style={{
            width: s.w,
            height: s.h,
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
          <ShapeVisual type={s.type} color={colors[i]} />
        </motion.div>
      ))}
    </div>
  );
}
