"use client";

import { useEffect } from "react";

import {
  trackOfferViewed,
  trackScrollDepthReached,
  trackSectionViewed,
  type ScrollDepth,
  type SectionName,
} from "@/lib/analytics/events";

/**
 * Fires `scroll_depth_reached` (25/50/75/90/100, once each) and `section_viewed`
 * (once per section) for the landing page. Renders nothing.
 *
 * - Scroll depth reads the real document scroll — Lenis scrolls the true window
 *   (not a virtual transform), so window.scrollY / scrollHeight stay accurate.
 * - Sections are matched by stable selectors (ids added in app/page.tsx + the
 *   hero's `.fella-hero`), observed with IntersectionObserver so a section counts
 *   as "viewed" when it crosses the middle of the viewport.
 * - Gated to the landing page (early-return unless the hero exists), so legal
 *   pages and other routes are a clean no-op.
 */

const DEPTHS: ScrollDepth[] = [25, 50, 75, 90, 100];

/** selector → canonical section_name (plan §2.2). */
const SECTIONS: ReadonlyArray<readonly [string, SectionName]> = [
  [".fella-hero", "hero"],
  ["#how", "how"],
  ["#comparison", "comparison"],
  ["#features", "features"],
  ["#testimonials", "testimonials"],
  ["#pricing", "pricing"],
  ["#faq", "faq"],
  ["#cta_band", "cta_band"],
  ["#follow_us", "follow_us"],
];

export function EngagementTracker() {
  useEffect(() => {
    // Landing-page only: the funnel lives on `/`, which owns the hero.
    if (!document.querySelector(".fella-hero")) return;

    // --- scroll depth ---
    const fired = new Set<ScrollDepth>();
    let raf = 0;

    const measure = () => {
      raf = 0;
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      const pct = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 100;
      for (const d of DEPTHS) {
        // 100% is effectively "at the bottom" — allow a small rounding slack.
        const hit = d === 100 ? pct >= 99 : pct >= d;
        if (hit && !fired.has(d)) {
          fired.add(d);
          trackScrollDepthReached(d);
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
          if (name) {
            trackSectionViewed(name);
            // The $67 offer lives in the pricing section — fire offer_viewed too
            // (keeps pricing.tsx a Server Component; plan §2.2 offer_viewed).
            if (name === "pricing") trackOfferViewed();
          }
          observer.unobserve(entry.target); // once each
        }
      },
      // Fire when the section overlaps the middle 40% band of the viewport —
      // robust for both very tall (hero) and short sections.
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
