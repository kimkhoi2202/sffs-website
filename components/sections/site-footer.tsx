import type { CSSProperties } from "react";
import Link from "next/link";

import styles from "./site-footer.module.css";

/* Support contact address, shown in the footer and used for the mailto link. */
const SUPPORT_EMAIL = "smartfellaorfartsmella123@gmail.com";

const footerLink =
  "font-bold text-ink underline decoration-2 underline-offset-4 transition-colors hover:text-ink/60";

/**
 * The footer as a living body of WATER (preview-only, nothing here pushes
 * page layout; every effect is an absolutely-positioned, aria-hidden overlay).
 *
 * The top seam is the SOLE boundary between the previous (yellow) section and
 * the blue footer: a smooth multi-crest water surface rolls across it. The strip
 * ABOVE the wave is transparent (the footer overlaps the section above via a
 * negative top margin, cancelled by matching padding so the content doesn't
 * move), so that section's color shows through above the crests, and everything
 * from the ink surface line DOWN is filled brand-blue. A sunlit sheen rides
 * locked to the very same surface line (shared crest path + roll, no independent
 * drift). Small "~~~" ripple marks scatter and drift over the water, the swim
 * brain mascot idles through a breaststroke, and the bottom-right copyright bobs
 * on the surface. All motion is transform/opacity only (no layout shift) and freezes
 * to a static pose under prefers-reduced-motion (see site-footer.module.css).
 */

/** One smooth sine-ish crest field, duplicated across a 2880-wide viewBox so a
 *  -50% roll loops seamlessly. Baseline 60, gentle amplitude, ~6 crests. */
const WAVE_FRONT =
  "M0,60 Q120,40 240,60 Q360,80 480,60 Q600,40 720,60 Q840,80 960,60 Q1080,40 1200,60 Q1320,80 1440,60 Q1560,40 1680,60 Q1800,80 1920,60 Q2040,40 2160,60 Q2280,80 2400,60 Q2520,40 2640,60 Q2760,80 2880,60";

/** Short curved "~~~" ripple stroke (a smooth tilde in a 48×14 box). */
const RIPPLE_PATH = "M1,9 Q7,3 13,9 T25,9 T37,9 T47,9";

/**
 * Deterministic ripple field (fixed values → stable SSR, no hydration drift).
 * Varied size / position / drift / timing so the surface reads alive but calm.
 */
type Ripple = {
  top: string;
  left: string;
  w: number;
  op: number;
  stroke: string;
  rx: string;
  ry: string;
  rot: string;
  dur: string;
  delay: string;
};

const RIPPLES: Ripple[] = [
  { top: "36%", left: "15%", w: 46, op: 0.34, stroke: "#000000", rx: "4px", ry: "-6px", rot: "-4deg", dur: "6.5s", delay: "0s" },
  { top: "54%", left: "29%", w: 34, op: 0.26, stroke: "#000000", rx: "-3px", ry: "-5px", rot: "3deg", dur: "7.2s", delay: "-1.2s" },
  { top: "70%", left: "19%", w: 40, op: 0.3, stroke: "#000000", rx: "3px", ry: "-4px", rot: "-2deg", dur: "6.0s", delay: "-2.4s" },
  { top: "44%", left: "52%", w: 30, op: 0.24, stroke: "#ffffff", rx: "4px", ry: "-5px", rot: "2deg", dur: "7.8s", delay: "-0.6s" },
  { top: "62%", left: "67%", w: 52, op: 0.3, stroke: "#000000", rx: "-4px", ry: "-6px", rot: "-3deg", dur: "8.2s", delay: "-3.0s" },
  { top: "38%", left: "80%", w: 36, op: 0.26, stroke: "#000000", rx: "3px", ry: "-5px", rot: "4deg", dur: "6.8s", delay: "-1.8s" },
  { top: "74%", left: "83%", w: 28, op: 0.22, stroke: "#ffffff", rx: "-3px", ry: "-4px", rot: "-2deg", dur: "7.0s", delay: "-2.0s" },
  { top: "56%", left: "43%", w: 44, op: 0.3, stroke: "#000000", rx: "4px", ry: "-6px", rot: "3deg", dur: "7.6s", delay: "-4.0s" },
  { top: "82%", left: "49%", w: 32, op: 0.24, stroke: "#000000", rx: "-3px", ry: "-5px", rot: "-3deg", dur: "6.3s", delay: "-1.0s" },
];

export function SiteFooter() {
  return (
    <footer className="relative -mt-[60px] overflow-hidden pt-[60px] text-ink sm:-mt-[80px] sm:pt-[80px] md:-mt-[96px] md:pt-[96px]">
      {/* Brand-blue water body. Its top is offset BELOW the wave troughs so the
          strip above the rolling crests stays transparent and the previous
          section's color shows through the footer's negative-margin overlap. */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 top-[44px] z-0 bg-blue sm:top-[58px] md:top-[68px]"
      />

      {/*
        TOP SEAM: the SOLE yellow to blue boundary. A rolling multi-crest water
        surface: transparent above the wave (the overlapped section shows through),
        brand-blue from the ink surface line down. Full-bleed, 200%-wide with a
        -50% roll so the crest pattern wraps with no visible seam. aria-hidden +
        pointer-events-none so it's inert to AT and never intercepts clicks.
      */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[60px] overflow-hidden sm:h-[80px] md:h-[96px]"
      >
        <div className={`${styles.waveBob} h-full w-full`}>
          {/*
            ONE rolling group so the blue fill, the sunlit sheen, and the ink
            surface line share the EXACT same crest path, phase, direction and
            speed, they can never desync (the sheen rides locked just under the
            line). The stroke is a continuous SCALING stroke (deliberately NOT
            `vector-effect="non-scaling-stroke"`, which trips a Chromium
            rasterizer bug that fragments the line under this
            `preserveAspectRatio="none"` stretch); `shape-rendering:geometricPrecision`
            keeps it crisp and strokeWidth is bumped so the scaled line stays bold.
          */}
          <svg
            className={`${styles.waveRoll} absolute inset-0 h-full`}
            style={{ width: "200%" }}
            viewBox="0 0 2880 120"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="sffSheen" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#ffffff" stopOpacity="0.22" />
                <stop offset="0.72" stopColor="#ffffff" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Brand-blue water below the surface line. */}
            <path d={`${WAVE_FRONT} L2880,120 L0,120 Z`} fill="var(--color-blue)" />
            {/* Sunlit sheen on the SAME path (locked to the ink crest), fading
                down into the water for depth. */}
            <path d={`${WAVE_FRONT} L2880,120 L0,120 Z`} fill="url(#sffSheen)" />
            {/* The ink surface line, drawn on top so it stays crisp. */}
            <path
              d={WAVE_FRONT}
              fill="none"
              stroke="#000000"
              strokeWidth={4}
              strokeLinejoin="round"
              strokeLinecap="round"
              shapeRendering="geometricPrecision"
            />
          </svg>
        </div>
      </div>

      {/* Scattered, drifting ripple marks across the water. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
        {RIPPLES.map((r, i) => (
          <span
            key={i}
            className={`${styles.ripple} absolute block`}
            style={
              {
                top: r.top,
                left: r.left,
                width: r.w,
                "--r-op": r.op,
                "--r-rx": r.rx,
                "--r-ry": r.ry,
                "--r-rot": r.rot,
                "--r-dur": r.dur,
                "--r-delay": r.delay,
              } as CSSProperties
            }
          >
            <svg viewBox="0 0 48 14" fill="none" className="block h-auto w-full">
              <path
                d={RIPPLE_PATH}
                stroke={r.stroke}
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        ))}
      </div>

      {/* Swim brain mascot, mid-breaststroke in the lower-left water, well
          clear of the bottom-right copyright and the fixed bottom-right music
          toggle, so it never collides at any width. */}
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-[14%] left-[9%] z-20 block h-12 select-none sm:h-14"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- decorative mascot /public asset */}
        <img
          src="/decor/mascot/swim.png"
          alt=""
          draggable={false}
          className={`${styles.swim} block h-full w-auto select-none`}
        />
      </span>

      {/* Copyright, gently bobbing on the surface, seated in the footer's
          BOTTOM-RIGHT corner (right-aligned, near the bottom) rather than
          centered. Full-bleed (NOT the max-w Container) so its right edge is
          measured from the true page edge; pr-[6.5rem] (104px) clears the fixed
          bottom-right music toggle, a 56px puck inset 24px from the edge (left
          edge ~80px in), with a ~24px gap, so text and puck never overlap at
          any breakpoint. On the narrowest screens the single line can't fit in
          the gap between the lower-left mascot and the toggle, so a max-width
          lets it wrap to two right-aligned lines that stay clear of BOTH the
          mascot and the puck; the cap is dropped at sm+ where there's room for
          one line. min-height preserves the water body's height. */}
      <div className="relative z-10 flex min-h-[13rem] flex-col items-end justify-end gap-4 pb-6 pl-6 pr-[6.5rem]">
        {/* About + legal + support text links (required on every page). The About
            link is the ONLY inbound link to /about now that it is off the top nav,
            so it also keeps that route crawlable. Right-aligned and stacked above
            the copyright so they clear the lower-left mascot and the fixed
            bottom-right music toggle at every width. */}
        <nav
          aria-label="Footer"
          className="flex flex-wrap items-center justify-end gap-x-5 gap-y-2 text-right text-sm"
        >
          <Link href="/about" className={footerLink}>
            About
          </Link>
          <Link href="/privacy" className={footerLink}>
            Privacy
          </Link>
          <Link href="/terms" className={footerLink}>
            Terms
          </Link>
          <Link href="/support" className={footerLink}>
            Support
          </Link>
          <a href={`mailto:${SUPPORT_EMAIL}`} className={footerLink}>
            {SUPPORT_EMAIL}
          </a>
        </nav>
        <p className={`${styles.copy} max-w-[8.5rem] text-right text-sm font-medium text-ink/70 sm:max-w-none`}>
          © 2026 Smart Fella or Fart Smella
        </p>
      </div>
    </footer>
  );
}
