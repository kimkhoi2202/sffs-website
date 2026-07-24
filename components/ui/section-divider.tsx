import { cn } from "@/lib/utils";

/**
 * Decorative, aria-hidden shape divider that flows one full-bleed color band
 * into the next with a bold wavy INK edge (neo-brutalist, not a soft gradient).
 *
 * The block's background is the NEXT section's color (`bottom`); an SVG fills the
 * PREVIOUS section's color (`top`) above the wave, and a constant-width ink line
 * traces the wave — so the two bands read as one flowing into the other. Placed
 * as a plain flow element BETWEEN two <Section>s; the adjacent sections must not
 * carry their own hard top/bottom border (the wave is the edge now).
 *
 * `preserveAspectRatio="none"` stretches the wave to any width. The ink edge is a
 * plain SCALING stroke, deliberately NOT `vector-effect="non-scaling-stroke"`:
 * under the non-uniform stretch, non-scaling-stroke trips a Chromium rasterizer
 * bug that fragments the line into visible GAPS at some widths, whereas a normal
 * stroke always renders as ONE continuous line. `shape-rendering:geometricPrecision`
 * keeps it crisp, and it's stroked as a single path drawn ON TOP of the fill so no
 * section colour bleeds through. Static (no animation) → reduced-motion safe.
 */

export type DividerColor =
  | "paper"
  | "cream"
  | "blue"
  | "mint"
  | "green"
  | "coral"
  | "yellow"
  | "gray"
  | "ink";

const HEX: Record<DividerColor, string> = {
  paper: "#ffffff",
  cream: "#f6f4ee",
  blue: "#839aff",
  mint: "#c6fcd0",
  green: "#63c088",
  coral: "#fd7962",
  yellow: "#fce552",
  gray: "#ebebeb",
  ink: "#000000",
};

export type DividerVariant =
  | "swoop"
  | "curve"
  | "doubleWave"
  | "peaks"
  | "scallopBig"
  | "blob"
  | "arch"
  | "stepped"
  | "torn";

/**
 * A DISTINCT edge per seam — no two alike — all in a 1440×100 viewBox (drawn
 * left→right; the fill closes up to y=0). Varied but one cohesive family.
 */
const WAVE: Record<DividerVariant, string> = {
  // Hero standout: a big asymmetric swoop (dips low, sweeps back up).
  swoop: "M0,26 C520,26 560,90 880,90 C1150,90 1250,34 1440,30",
  // Gentle symmetric valley dip.
  curve: "M0,22 C480,82 960,82 1440,22",
  // Two alternating amplitudes.
  doubleWave:
    "M0,52 C90,22 200,22 300,52 C380,74 470,74 560,52 C680,16 820,16 940,52 C1030,76 1130,76 1220,52 C1310,28 1380,32 1440,44",
  // Smooth flowing multi-crest roll (was sharp triangular peaks) — bold + lively.
  peaks: "M0,72 C200,16 380,16 560,58 C740,100 900,100 1080,58 C1220,26 1340,40 1440,54",
  // Chunky, cloud-like rounded scallops.
  scallopBig: "M0,34 Q180,92 360,34 Q540,92 720,34 Q900,92 1080,34 Q1260,92 1440,34",
  // Organic drippy blob lobes.
  blob: "M0,44 C120,44 150,82 280,82 C420,82 410,32 560,36 C720,40 700,84 860,84 C1010,84 1010,34 1160,38 C1300,42 1330,78 1440,72",
  // Single big rounded arch.
  arch: "M0,84 C430,84 510,20 720,20 C930,20 1010,84 1440,84",
  // Gentle low rolling ripple (was square castellated steps).
  stepped: "M0,50 C160,74 320,74 480,52 C660,26 820,26 1000,50 C1160,68 1300,62 1440,54",
  // Rough torn-paper edge (irregular jags).
  torn: "M0,46 L110,60 L190,38 L300,62 L410,40 L540,64 L660,42 L790,62 L910,38 L1040,60 L1170,42 L1300,62 L1440,46",
};

const SIZE: Record<"sm" | "md" | "lg", string> = {
  sm: "h-[36px] sm:h-[50px] md:h-[64px]",
  md: "h-[46px] sm:h-[64px] md:h-[82px]",
  lg: "h-[56px] sm:h-[78px] md:h-[100px]",
};

export function SectionDivider({
  top,
  bottom,
  variant = "curve",
  flip = false,
  size = "md",
  className,
}: {
  /** Color of the section ABOVE (fills above the wave). */
  top: DividerColor;
  /** Color of the section BELOW (the block's fill under the wave). */
  bottom: DividerColor;
  variant?: DividerVariant;
  /** Mirror the wave horizontally for variety. */
  flip?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const d = WAVE[variant];
  return (
    <div
      aria-hidden
      // overflow-hidden + -my-px kill the edge artifacts this divider used to show
      // against a bright section: (1) the ink stroke STARTS/ENDS at the left and
      // right viewBox edges (e.g. scallopBig's 0,34 / 1440,34), so its round
      // line-caps rendered as short VERTICAL ticks at the section's side edges —
      // the SVG below is over-drawn a few px past each side and clipped here so
      // those endpoints fall off-screen and the wave runs cleanly to both edges;
      // (2) the divider's top/bottom land on fractional pixels, so each seam with
      // the adjacent same-color section revealed a faint full-width HORIZONTAL
      // hairline — -my-px overlaps both neighbours by 1px (the divider's top/bottom
      // colour matches the section it meets) so no sub-pixel gap can show. Net: the
      // wavy ink line is the ONLY line in the seam.
      className={cn("relative -my-px w-full overflow-hidden leading-[0]", className)}
      style={{ backgroundColor: HEX[bottom] }}
    >
      <svg
        viewBox="0 0 1440 100"
        preserveAspectRatio="none"
        className={cn("-ml-2 block w-[calc(100%+16px)]", SIZE[size], flip && "-scale-x-100")}
      >
        <path d={`${d} L1440,0 L0,0 Z`} fill={HEX[top]} shapeRendering="geometricPrecision" />
        <path
          d={d}
          fill="none"
          stroke="#000000"
          strokeWidth={4}
          strokeLinejoin="round"
          strokeLinecap="round"
          shapeRendering="geometricPrecision"
        />
      </svg>
    </div>
  );
}
