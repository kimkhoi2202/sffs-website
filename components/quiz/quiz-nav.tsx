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
        "fixed inset-x-0 top-0 z-50 border-b-[2.5px] border-ink bg-paper/95 backdrop-blur-sm",
        reducedMotion
          ? "transition-none"
          : "transition-[transform,opacity] duration-300 ease-out",
        revealed
          ? "translate-y-0 opacity-100"
          : "pointer-events-none -translate-y-full opacity-0",
      )}
    >
      <nav
        aria-label="The Fella Test"
        className="mx-auto flex max-w-page items-center justify-between gap-4 px-4 py-3 md:px-8"
      >
        <a href="#top" className="inline-flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- brand mark is a static public asset */}
          <img
            src="/logo.png"
            alt="Smart Fella or Fart Smella"
            className="h-12 w-auto select-none"
            draggable={false}
          />
          {/* eslint-disable-next-line @next/next/no-img-element -- brand wordmark is a static public asset */}
          <img
            src="/wordmark.png"
            alt=""
            className="hidden h-12 w-auto select-none object-contain sm:block"
            draggable={false}
          />
        </a>
        <Button
          href="#pricing"
          variant="coral"
          size="sm"
          className="font-sans font-bold text-lg uppercase leading-none tracking-[-0.01em]"
        >
          Take the test
        </Button>
      </nav>
    </header>
  );
}
