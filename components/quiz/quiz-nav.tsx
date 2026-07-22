"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/** Scroll distance (px) to clear before the bar reveals (non-pinned mode). */
const REVEAL_AT = 120;

/**
 * Slim landing bar for the quiz routes.
 *
 * Default (home): hidden at the very top so the hero reads full-bleed, then
 * slides down once the visitor scrolls past REVEAL_AT.
 *
 * `pinned` (sub-routes like /parents): always visible — those pages have no
 * full-bleed hero scroll trigger, so the bar stays put and no ScrollTrigger runs.
 *
 * `homeHref` sets where the logo links ("#top" on the single-page home, "/" on
 * sub-routes). `ctaHref` sets the CTA target ("#pricing" on home, "/#pricing"
 * from a sub-route so it lands on the homepage pricing section).
 */
export function QuizNav({
  pinned = false,
  homeHref = "#top",
  ctaHref = "#pricing",
}: {
  pinned?: boolean;
  homeHref?: string;
  ctaHref?: string;
} = {}) {
  const [revealed, setRevealed] = useState(pinned);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useGSAP(() => {
    // Pinned bars are always shown — skip the scroll-driven reveal entirely.
    if (pinned) return;
    ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => setRevealed(self.scroll() > REVEAL_AT),
      onRefresh: (self) => setRevealed(self.scroll() > REVEAL_AT),
    });
  }, [pinned]);

  const showBar = pinned || revealed;

  return (
    <header
      inert={!showBar}
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b-[2.5px] border-ink bg-paper/95 backdrop-blur-sm",
        reducedMotion || pinned
          ? "transition-none"
          : "transition-[transform,opacity] duration-300 ease-out",
        showBar
          ? "translate-y-0 opacity-100"
          : "pointer-events-none -translate-y-full opacity-0",
      )}
    >
      <nav
        aria-label="Smart Fella or Fart Smella"
        className="mx-auto grid max-w-page grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-3 md:px-8"
      >
        <a
          href={homeHref}
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
        <div className="col-start-3 flex items-center justify-self-end gap-3 sm:gap-5">
          <Link
            href="/parents"
            className="inline-block font-sans text-xs sm:text-sm font-bold uppercase tracking-wide leading-none text-ink underline-offset-4 hover:underline"
          >
            For Parents
          </Link>
          <Button
            href={ctaHref}
            variant="coral"
            size="sm"
            className="font-sans font-bold text-lg uppercase leading-none tracking-[-0.01em]"
          >
            Take the test
          </Button>
        </div>
      </nav>
    </header>
  );
}
