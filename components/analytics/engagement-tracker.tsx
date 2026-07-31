"use client";

import { useEffect } from "react";

import {
  trackScrollDepthReached,
  trackScrolledToBottom,
  trackSectionViewed,
  type ScrollDepth,
  type SectionName,
} from "@/lib/analytics/events";

/**
 * Fires `scroll_depth_reached` (25/50/75/90/100, once each), `scrolled_to_bottom`
 * and `section_viewed` (once per section) for the landing page. Renders nothing.
 *
 * - Scroll depth reads the real document scroll — Lenis scrolls the true window
 *   (not a virtual transform), so window.scrollY / scrollHeight stay accurate.
 * - Sections are matched by stable selectors and observed with an
 *   IntersectionObserver, so a section counts as "viewed" when it crosses the
 *   middle of the viewport.
 * - Gated to the landing page via `[data-landing]` on its <main>, so legal pages
 *   and other routes stay a clean no-op and `scroll_depth_reached` keeps meaning
 *   "how far down the landing page", exactly as it always has.
 *
 * The gate used to be `.fella-hero`, the animated hero of the archived
 * multi-section homepage. When that page was replaced on 2026-07-30 the selector
 * stopped matching anything and this whole file silently became a no-op, taking
 * scroll depth and section views with it. `[data-landing]` is a marker that
 * exists to be a marker, so it cannot rot the same way if the page is redesigned
 * again.
 */

const DEPTHS: ScrollDepth[] = [25, 50, 75, 90, 100];

/**
 * selector → canonical section_name.
 *
 * The single-screen homepage really does have two: the signup screen itself,
 * and the footer that carries the legal links. The footer is matched by tag
 * because it is rendered by the shared layout, not by the page.
 */
const SECTIONS: ReadonlyArray<readonly [string, SectionName]> = [
  ["[data-section='signup']", "signup"],
  ["footer", "footer"],
];

export function EngagementTracker() {
  useEffect(() => {
    // Landing-page only: the funnel lives on `/`, which marks its <main>.
    if (!document.querySelector("[data-landing]")) return;

    // --- scroll depth ---
    const fired = new Set<ScrollDepth>();
    let raf = 0;

    const measure = () => {
      raf = 0;
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      // A page with nothing to scroll has no scroll depth to report. Returning
      // early (rather than treating it as 100%) matters now that the landing
      // page is one screen tall: the old code called an unscrollable page "100%
      // scrolled" and would have fired every depth plus `scrolled_to_bottom` on
      // load, inventing engagement nobody performed.
      if (scrollable <= 0) return;
      const pct = (window.scrollY / scrollable) * 100;
      for (const d of DEPTHS) {
        // 100% is effectively "at the bottom" — allow a small rounding slack.
        const hit = d === 100 ? pct >= 99 : pct >= d;
        if (hit && !fired.has(d)) {
          fired.add(d);
          trackScrollDepthReached(d);
          // 100% == reached the bottom — also fire the discrete funnel step.
          if (d === 100) trackScrolledToBottom();
        }
      }
    };

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(measure);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    measure(); // catch a page that loads already scrolled (deep link)

    // --- section views ---
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const name = entry.target.getAttribute("data-ph-name") as
            | SectionName
            | null;
          if (name) trackSectionViewed(name);
          observer.unobserve(entry.target); // once each
        }
      },
      // Fire when the section overlaps the middle 40% band of the viewport —
      // robust for both very tall (full-height signup) and short (footer) sections.
      { rootMargin: "-30% 0px -30% 0px", threshold: 0 },
    );

    for (const [selector, name] of SECTIONS) {
      const el = document.querySelector(selector);
      if (!el) continue;
      el.setAttribute("data-ph-name", name);
      observer.observe(el);
    }

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, []);

  return null;
}
