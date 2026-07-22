"use client";

import { useEffect, useState } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/** Scroll distance (px) to clear before the bar reveals. */
const REVEAL_AT = 120;

/**
 * Decorative bottom EDGE for the bar, in the brand divider language (see
 * components/ui/section-divider.tsx): a single broad, gentle ink curve — ONE
 * clean continuous swoop across the full width, not a row of ripples. Drawn
 * left→right in a 1440×16 viewBox and stretched to any width with
 * `preserveAspectRatio="none"`. The ink edge is a plain SCALING stroke,
 * deliberately NOT `vector-effect="non-scaling-stroke"`: under the non-uniform
 * stretch, non-scaling-stroke trips a Chromium rasterizer bug that fragments the
 * line into visible GAPS at some widths, whereas a normal stroke always renders
 * as ONE continuous line. `shape-rendering:geometricPrecision` keeps it crisp,
 * and strokeWidth is bumped so the scaled line keeps its bold weight. Both
 * endpoints sit at the viewBox bottom (y=16) so the bar's corners stay grounded
 * (paper flush to the edge, fill closes cleanly to the top — no gap/notch). The
 * two control points sit NEAR the ends (x≈120 / x≈1320) so the single wide cubic
 * bends smoothly right out of BOTH corners — a rounded shoulder, no flat/straight
 * run at the edges — then eases to a shallow center (y≈7) where the section behind
 * shows through. Static (no animation) → nothing to disable for reduced motion.
 */
const NAV_EDGE = "M0,16 C120,4 1320,4 1440,16";

/**
 * Slim landing bar for the quiz route. Hidden while the visitor sits at the very
 * top (so the hero reads full-bleed), then slides down from the top edge once
 * they scroll past REVEAL_AT, and slides back up when they return to the top.
 *
 * A single GSAP ScrollTrigger (same registration pattern as <Reveal>) flips the
 * boolean at the threshold; the slide itself is a cheap CSS transform/opacity
 * transition, which also makes it trivial to disable for reduced-motion users.
 * Positioned fixed as an overlay so it can glide in over the hero without
 * reserving layout space, and made inert while hidden so it can't trap
 * keyboard focus or intercept clicks.
 */
export function QuizNav() {
  const [revealed, setRevealed] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useGSAP(() => {
    // Reveal whenever the page is scrolled past REVEAL_AT — driving `revealed`
    // off raw scroll depth (rather than a bounded trigger's isActive) keeps the
    // bar visible all the way down to and including the very bottom (max scroll).
    // onUpdate re-evaluates the threshold on every scroll; onRefresh sets the
    // correct initial value (e.g. when the page loads already scrolled to a
    // #hash deep-link). Re-setting the same value is a no-op — React bails out.
    ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => setRevealed(self.scroll() > REVEAL_AT),
      onRefresh: (self) => setRevealed(self.scroll() > REVEAL_AT),
    });
  });

  return (
    <header
      inert={!revealed}
      className={cn(
        "fixed inset-x-0 top-0 z-50",
        reducedMotion
          ? "transition-none"
          : "transition-[transform,opacity] duration-300 ease-out",
        revealed
          ? "translate-y-0 opacity-100"
          : "pointer-events-none -translate-y-full opacity-0",
      )}
    >
      {/*
        The bar's paper surface + blur live on this inner block (NOT the <header>)
        so the decorative wave edge below it can be a real see-through scallop:
        the block's rectangle stops at the bar's bottom, and the SVG paints the
        paper crests / leaves the troughs transparent, letting the hero show
        through. Keeping bg + blur here (rather than the header) means the header
        stays a bare transform/opacity container for the scroll-reveal, and the
        wave rides along with it.
      */}
      <div className="bg-paper/95 backdrop-blur-sm">
        {/*
          Three-zone layout: brain logo LEFT (the #top home link), wordmark
          CENTERED across the full bar, CTA RIGHT. A `1fr auto 1fr` grid keeps the
          side columns equal width, so the middle (wordmark) column is truly
          centered on the nav regardless of the logo/button widths — and because
          each zone owns its own column they can never overlap. The wordmark is
          hidden below `md` (where the bar is too tight) so it never collides with
          the logo or button on small screens.
        */}
        <nav
          aria-label="The Fella Test"
          className="mx-auto grid max-w-page grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-3 md:px-8"
        >
          <a
            href="#top"
            aria-label="Smart Fella or Fart Smella — home"
            className="col-start-1 inline-flex items-center justify-self-start"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- brand mark is a static public asset */}
            <img
              src="/logo.png"
              alt=""
              className="h-11 w-auto select-none md:h-12"
              draggable={false}
            />
          </a>
          {/* eslint-disable-next-line @next/next/no-img-element -- brand wordmark is a static public asset */}
          <img
            src="/wordmark.png"
            alt="Smart Fella or Fart Smella"
            className="col-start-2 pointer-events-none hidden h-12 w-auto max-w-full select-none justify-self-center object-contain md:block lg:h-14"
            draggable={false}
          />
          {/*
            Explicit `col-start-3` (not auto-placement) so the CTA always stays in
            the RIGHT column even when the wordmark is display:none on small
            screens — otherwise the button would collapse into the empty middle.
          */}
          <Button
            href="#pricing"
            variant="coral"
            size="sm"
            className="col-start-3 justify-self-end font-sans font-bold text-lg uppercase leading-none tracking-[-0.01em]"
          >
            Take the test
          </Button>
        </nav>
      </div>
      {/*
        Decorative single-curve bottom edge (brand divider language). Sits in
        normal flow directly under the paper bar so it (a) rides the scroll-reveal
        transform with the header and (b) is fully hidden when the bar slides up
        (unlike an absolutely-positioned edge, which would peek at the top). The
        paper fills ABOVE the curve; below the gentle center dip it's transparent
        so the section behind shows through. aria-hidden + pointer-events-none so
        it's inert to AT and never intercepts hero drags/clicks. `-mt-px` overlaps
        the bar by a hair so no sub-pixel seam shows between the bar and the edge.
      */}
      <svg
        aria-hidden
        viewBox="0 0 1440 16"
        preserveAspectRatio="none"
        className="pointer-events-none -mt-px block h-[12px] w-full select-none sm:h-[14px]"
      >
        <path
          d={`${NAV_EDGE} L1440,0 L0,0 Z`}
          fill="var(--color-paper)"
          fillOpacity={0.95}
          shapeRendering="geometricPrecision"
        />
        <path
          d={NAV_EDGE}
          fill="none"
          stroke="var(--color-ink)"
          strokeWidth={3}
          strokeLinejoin="round"
          strokeLinecap="round"
          shapeRendering="geometricPrecision"
        />
      </svg>
    </header>
  );
}
