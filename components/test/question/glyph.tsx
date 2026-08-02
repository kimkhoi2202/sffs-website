/**
 * The eleven figure glyphs, as scalable SVG.
 *
 * ---------------------------------------------------------------------------
 * WHY THESE ARE DRAWN AND NOT LOADED
 * ---------------------------------------------------------------------------
 * The obvious way to put a figure matrix on a web page is to render the images
 * somewhere else and ship PNGs. This does not do that, for three reasons:
 *
 *   1. There are no image bytes to download. A grade 1 test is 40% visual
 *      items, and this traffic arrives from Instagram and TikTok on a phone,
 *      often on a bad connection, into a TIMED test. A visual question that
 *      pops in late is a question the player loses time on.
 *   2. They stay sharp at any size and in dark mode, and they inherit the
 *      brand ink colour rather than baking it in.
 *   3. Authoring a new question means writing `{ shape: "star", count: 2 }`,
 *      not opening a drawing tool and exporting an asset. That is the
 *      difference between the research agent being able to land content and
 *      needing a designer in the loop.
 *
 * It cost about 120 lines, because the video pipeline had already solved the
 * geometry (video/remotion/src/components/ShapeGlyph.tsx). The visual items
 * were the part of this build I expected to be expensive and they were the
 * cheapest.
 *
 * ---------------------------------------------------------------------------
 * WHAT CHANGED IN THE PORT
 * ---------------------------------------------------------------------------
 * The pipeline draws into absolute design pixels against a fixed 1920x1080
 * canvas, and passes a half-size `s` down through every component. That does
 * not survive contact with a 360px phone.
 *
 * Here every glyph draws into the SAME 100x100 viewBox and is sized purely by
 * CSS. One component renders at 40px inside an option card and at 96px inside a
 * matrix cell with no pixel arithmetic anywhere, and the stroke scales with it
 * so a small glyph does not look like it has a fence around it. Circle and
 * square became real SVG too (the pipeline draws them as bordered divs), so all
 * eleven share one coordinate space and one stroke rule.
 */
import type { CSSProperties } from "react";

import type { GlyphKind } from "@/lib/test/types";

/** Stroke weight in viewBox units. Reads as a thick ink keyline at every size. */
const STROKE = 7;
/** Keeps the stroke inside the viewBox so nothing clips against a cell edge. */
const PAD = STROKE / 2 + 1;

/** Points for a five-point star inscribed in the viewBox. */
function starPoints(): string {
  const c = 50;
  const R = 50 - PAD;
  const r = R * 0.42;
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? R : r;
    const a = (-90 + i * 36) * (Math.PI / 180);
    pts.push(`${(c + rad * Math.cos(a)).toFixed(2)},${(c + rad * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(" ");
}

/**
 * A regular n-gon inscribed in the viewBox, first vertex at the top.
 *
 * Drawn from the same circle as the star so a pentagon and a hexagon carry the
 * same visual weight as everything else in the set. That matters more than it
 * sounds: these two exist so a matrix can run triangle, square, pentagon as a
 * shape rule, and a rule reads as a rule only when nothing else changes with it.
 */
function polygonPoints(sides: number): string {
  const c = 50;
  const R = 50 - PAD;
  return Array.from({ length: sides }, (_, i) => {
    const a = (-90 + (i * 360) / sides) * (Math.PI / 180);
    return `${(c + R * Math.cos(a)).toFixed(2)},${(c + R * Math.sin(a)).toFixed(2)}`;
  }).join(" ");
}

/**
 * The shape of each glyph inside the shared 0..100 viewBox. Six of these paths
 * are lifted verbatim from the video pipeline, which already drew them on a
 * 0..100 box; the rest were re-derived to fit the same box.
 */
function glyphShape(kind: GlyphKind): { tag: "polygon" | "path" | "circle" | "rect"; d: string } {
  switch (kind) {
    case "circle":
      return { tag: "circle", d: `${50 - PAD}` };
    case "square":
      return { tag: "rect", d: `${PAD}` };
    case "triangle":
      return { tag: "polygon", d: `50,${PAD + 4} ${96 - PAD},${92 - PAD} ${PAD + 4},${92 - PAD}` };
    case "diamond":
      return { tag: "polygon", d: `50,${PAD} ${100 - PAD},50 50,${100 - PAD} ${PAD},50` };
    case "pentagon":
      return { tag: "polygon", d: polygonPoints(5) };
    case "hexagon":
      return { tag: "polygon", d: polygonPoints(6) };
    case "star":
      return { tag: "polygon", d: starPoints() };
    case "heart":
      return { tag: "path", d: "M50,88 C12,58 4,36 20,22 C32,11 46,18 50,30 C54,18 68,11 80,22 C96,36 88,58 50,88 Z" };
    case "cross":
      return { tag: "polygon", d: "36,8 64,8 64,36 92,36 92,64 64,64 64,92 36,92 36,64 8,64 8,36 36,36" };
    case "arrow":
      return { tag: "polygon", d: "50,8 86,48 65,48 65,92 35,92 35,48 14,48" };
    case "crescent":
      return { tag: "path", d: "M50,10 A40,40 0 1 0 50,90 A32,40 0 1 1 50,10 Z" };
    case "lightning":
      return { tag: "polygon", d: "58,6 28,54 47,54 42,94 74,40 54,40 60,6" };
    case "teardrop":
      return { tag: "path", d: "M50,8 C64,30 82,48 82,64 A32,32 0 1 1 18,64 C18,48 36,30 50,8 Z" };
  }
}

export interface GlyphProps {
  kind: GlyphKind;
  /** Any CSS length. The glyph is square and scales to it. */
  size: number | string;
  /** Fill colour. Defaults to paper (an empty glyph). */
  fill?: string;
  /** Clockwise rotation in degrees. */
  rotate?: number;
  className?: string;
  style?: CSSProperties;
}

export function Glyph({
  kind,
  size,
  fill = "var(--color-paper)",
  rotate,
  className,
  style,
}: GlyphProps) {
  const shape = glyphShape(kind);
  const common = {
    fill,
    stroke: "var(--color-ink)",
    strokeWidth: STROKE,
    strokeLinejoin: "round" as const,
    strokeLinecap: "round" as const,
  };

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="presentation"
      aria-hidden="true"
      className={className}
      style={{
        display: "block",
        flex: "none",
        // Rotation lives on the SVG element rather than inside the viewBox so a
        // rotated glyph is never clipped by its own box.
        transform: rotate ? `rotate(${rotate}deg)` : undefined,
        ...style,
      }}
    >
      {shape.tag === "circle" ? (
        <circle cx="50" cy="50" r={shape.d} {...common} />
      ) : shape.tag === "rect" ? (
        <rect
          x={shape.d}
          y={shape.d}
          width={100 - 2 * PAD}
          height={100 - 2 * PAD}
          rx="12"
          {...common}
        />
      ) : shape.tag === "polygon" ? (
        <polygon points={shape.d} {...common} />
      ) : (
        <path d={shape.d} {...common} />
      )}
    </svg>
  );
}
