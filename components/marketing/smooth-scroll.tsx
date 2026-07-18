"use client";

import { useEffect, useState, type ReactNode } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

/**
 * Premium "dampened" smooth scrolling for the original marketing site.
 *
 * Tuning knobs:
 *  - LERP: how much of the remaining distance is covered each frame. Lower =
 *    floatier / more damped; higher = crisper / snappier.
 *      0.10, Lenis default (a touch floaty)
 *      0.12, our pick: a light, premium glide that still feels responsive
 *      0.15, noticeably crisper, closer to native
 *    Stay within roughly 0.08–0.2.
 *  - HEADER_OFFSET: pixels to clear below the sticky (~76px) header when jumping
 *    to an in-page anchor. Only a fallback, targets already declare
 *    `scroll-mt-24` (6rem / 96px), which we read off the element so anchor jumps
 *    match the exact offset the design uses with native scrolling.
 */
const LERP = 0.12;
const HEADER_OFFSET = 96;

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Client provider that adds Lenis smooth scrolling to whatever it wraps and
 * tears it down on unmount (e.g. when navigating away from the marketing site
 * to the GSAP-driven quiz). Renders children unchanged, no extra DOM wrapper,
 * so the surrounding flex layout is untouched.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const [reducedMotion, setReducedMotion] = useState(prefersReducedMotion);

  // Keep in sync if the user flips the reduced-motion preference at runtime.
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(query.matches);
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    // Reduced motion → fall back to fully native scrolling (no Lenis at all).
    if (reducedMotion) return;

    const lenis = new Lenis({
      lerp: LERP,
      smoothWheel: true,
      wheelMultiplier: 1,
      // syncTouch stays false (its default) so touch / mobile scrolling stays
      // native and doesn't feel weird.
    });

    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    // Same-page hash links (#pricing, #catalog, #how-it-works, the privacy TOC,
    // the skip link, …) need to run through Lenis so they animate with the page
    // and clear the sticky header. Listening in the capture phase and stopping
    // propagation lets us win over Next.js <Link>'s own hash handling.
    const handleAnchorClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const anchor = (event.target as HTMLElement | null)?.closest?.("a");
      const href = anchor?.getAttribute("href");
      if (!href || !href.startsWith("#") || href === "#") return;

      const target = document.getElementById(decodeURIComponent(href.slice(1)));
      if (!target) return;

      event.preventDefault();
      event.stopPropagation();

      // Respect the target's own scroll-margin-top (scroll-mt-24 = 96px); fall
      // back to the header offset for anything that doesn't set one.
      const scrollMargin = Number.parseFloat(
        window.getComputedStyle(target).scrollMarginTop,
      );
      const offset =
        Number.isFinite(scrollMargin) && scrollMargin > 0
          ? scrollMargin
          : HEADER_OFFSET;

      lenis.scrollTo(target, { offset: -offset });
      // Reflect the hash in the URL without triggering a native jump, keeping
      // Next's router history state intact.
      window.history.replaceState(window.history.state, "", href);
    };

    document.addEventListener("click", handleAnchorClick, true);

    return () => {
      document.removeEventListener("click", handleAnchorClick, true);
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, [reducedMotion]);

  return <>{children}</>;
}
