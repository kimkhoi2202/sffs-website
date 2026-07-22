"use client";

import { useEffect, useState, type ReactNode } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { trackTestCtaActivated, type CtaLocation } from "@/lib/analytics/events";

gsap.registerPlugin(ScrollTrigger);

/**
 * Which "take the test" entry point an in-page anchor belongs to, from its DOM
 * context. Every such CTA routes to #pricing; the location powers the funnel +
 * heatmap of which entry point converts (plan §2.2 test_cta_activated).
 */
function ctaLocationForAnchor(anchor: Element | null | undefined): CtaLocation {
  if (anchor?.closest("header.fixed")) return "nav";
  if (anchor?.closest(".fella-hero")) return "hero";
  if (anchor?.closest("#cta_band")) return "cta_band";
  if (anchor?.closest("#how")) return "steps";
  return "hero";
}

/**
 * Premium "dampened" smooth scrolling for the /smart-or-fart quiz route.
 *
 * Mirrors the marketing SmoothScroll tuning (components/marketing/smooth-scroll.tsx)
 * so the glide feels identical, but ALSO wires Lenis into GSAP's ScrollTrigger.
 * The quiz leans on ScrollTrigger heavily (components/quiz/reveal.tsx scroll
 * reveals, the scroll-reveal nav). If Lenis drove scrolling without telling
 * ScrollTrigger, the triggers would fire against a stale scroll position and
 * desync. All of that integration lives HERE, centrally, so the individual GSAP
 * components never need to know Lenis exists.
 *
 * Tuning knobs:
 *  - LERP: fraction of the remaining distance covered each frame. Lower =
 *    floatier / more damped; higher = crisper. 0.12 matches the marketing site:
 *    a light, premium glide that still feels responsive. Stay within ~0.08–0.2.
 *  - NAV_OVERLAP: a tiny amount the landing is pulled UP into the target so its
 *    top tucks a hair under the fixed nav's bottom edge instead of leaving a
 *    gap. Landing flush-or-slightly-over guarantees the target's OWN color
 *    reaches the bar, so no sliver of the PREVIOUS section can peek through at
 *    the color boundary (sub-pixel rounding never opens a 1px seam). Subtracted
 *    from the nav's REAL, measured height, and kept small so it never tucks the
 *    section heading under the bar.
 *  - NAV_FALLBACK: nav height to assume ONLY when the live nav can't be measured
 *    yet (pre-hydration / header not mounted). The true offset is read from the
 *    rendered nav at scroll time (getQuizNavHeight), so it self-corrects at any
 *    viewport and whatever height the nav renders.
 */
const LERP = 0.12;
const NAV_OVERLAP = 2;
const NAV_FALLBACK = 72;

/**
 * The live Lenis instance for the quiz route, held at module scope so triggers
 * that live OUTSIDE this provider's tree (the hero's global "T" shortcut in
 * components/quiz/smart-fart-hero.tsx) can scroll through the SAME engine and
 * land on the exact same spot as a "Take the test" click. Null when Lenis isn't
 * running (reduced motion, or provider unmounted).
 */
let activeLenis: Lenis | null = null;

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Measure the fixed quiz nav's CURRENT rendered height. QuizNav
 * (components/quiz/quiz-nav.tsx) is the route's only fixed <header>; we read it
 * live instead of hard-coding a number so the scroll offset tracks the nav's
 * actual height at this viewport. getBoundingClientRect().height stays correct
 * even while the nav is translated off-screen / hidden at the top, because a
 * pure translate doesn't change the measured box height.
 */
export function getQuizNavHeight(): number {
  if (typeof document === "undefined") return NAV_FALLBACK;
  const nav =
    document.querySelector<HTMLElement>("header.fixed") ??
    Array.from(document.querySelectorAll<HTMLElement>("header")).find(
      (el) => window.getComputedStyle(el).position === "fixed",
    ) ??
    null;
  const height = nav?.getBoundingClientRect().height ?? 0;
  return height > 0 ? height : NAV_FALLBACK;
}

/**
 * How far a target must clear below the top: the nav's real measured height,
 * pulled up by NAV_OVERLAP so the target lands flush (a hair under) the bar.
 */
export function getQuizScrollOffset(): number {
  return getQuizNavHeight() - NAV_OVERLAP;
}

/**
 * Scroll the page by `delta` px immediately (no smoothing), routed through the
 * live Lenis instance so it composes with the smooth-scroll engine (falls back
 * to native scrolling). Used by the page-level shape field to auto-scroll while a
 * shape is dragged near a viewport edge, so a shape can be dragged across
 * sections in one continuous gesture.
 */
export function scrollQuizBy(delta: number): void {
  if (typeof window === "undefined" || delta === 0) return;
  if (activeLenis) {
    activeLenis.scrollTo(activeLenis.scroll + delta, { immediate: true, force: true });
  } else {
    window.scrollBy(0, delta);
  }
}

/**
 * Move keyboard / assistive-tech focus to a section we just scrolled to, WITHOUT
 * moving the page (Lenis / the smooth scroll owns the scroll position). The
 * sections aren't natively focusable, so add a one-off tabindex=-1; our
 * :focus-visible ring is keyboard-only, so this programmatic focus shows no
 * visible outline. This is the a11y counterpart to a real #hash navigation now
 * that we deliberately keep the URL clean.
 */
function moveFocusToTarget(target: HTMLElement) {
  if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
  target.focus({ preventScroll: true });
}

/**
 * Smooth-scroll so `target`'s top lands flush under the fixed nav (the live
 * measured nav height, pulled up by NAV_OVERLAP so the section tucks a hair
 * under the bar and no previous-section color peeks through). Routes through the
 * live Lenis instance when present so it composes with the page's dampened
 * scroll; otherwise falls back to native scrolling (reduced motion / Lenis not
 * mounted).
 *
 * Deliberately does NOT touch the URL: in-page navigation stays "clean" (no
 * #top / #pricing in the address bar). Focus is moved to the section once the
 * scroll settles, so keyboard/AT users still land in the right place.
 *
 * Note: Lenis.scrollTo already subtracts the target's OWN scroll-margin-top
 * (the quiz sections set .scroll-mt-nav to the SAME measured-nav-minus-overlap
 * offset). We add that margin back into the Lenis offset so the NET landing is
 * exactly our freshly measured offset — never double-counted — and so targets
 * WITHOUT a scroll-margin (e.g. #top) still clear the nav. The native fallback
 * applies the offset directly (native scrolling ignores scroll-margin).
 */
function smoothScrollToTarget(target: HTMLElement) {
  const offset = getQuizScrollOffset();
  if (activeLenis) {
    const scrollMargin =
      Number.parseFloat(window.getComputedStyle(target).scrollMarginTop) || 0;
    activeLenis.scrollTo(target, {
      offset: scrollMargin - offset,
      onComplete: () => moveFocusToTarget(target),
    });
  } else if (typeof window !== "undefined") {
    const top = window.scrollY + target.getBoundingClientRect().top - offset;
    window.scrollTo({
      top: Math.max(0, top),
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
    moveFocusToTarget(target);
  }
}

/**
 * Scroll to an in-page hash (e.g. "#pricing") using the exact SAME nav-aware
 * offset as an anchor click — but WITHOUT writing the hash to the URL. Exported
 * for triggers outside this provider (the hero's global "T" shortcut) so the CTA
 * click and the keyboard shortcut land identically and both keep the URL clean.
 */
export function scrollToQuizHash(hash: string) {
  if (typeof document === "undefined") return;
  const id = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!id) return;
  const target = document.getElementById(decodeURIComponent(id));
  if (!target) return;
  smoothScrollToTarget(target);
}

/**
 * Client provider that adds Lenis smooth scrolling (synced to ScrollTrigger) to
 * whatever it wraps and tears everything down on unmount. Renders children
 * unchanged, no extra DOM wrapper, so the route's own <main> layout is
 * untouched.
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

  // Publish the fixed nav's measured height as --nav-h so NATIVE #hash jumps
  // land right too: the quiz sections derive their scroll-margin-top from it
  // (.scroll-mt-nav in app/smart-or-fart/page.tsx), matching the JS offset used
  // for CTA clicks / the "T" shortcut. Runs regardless of reduced motion (native
  // anchors still apply there) and re-measures on resize, since the nav can
  // render a different height at different breakpoints.
  useEffect(() => {
    const syncNavHeight = () => {
      document.documentElement.style.setProperty(
        "--nav-h",
        `${getQuizNavHeight()}px`,
      );
    };
    syncNavHeight();
    window.addEventListener("resize", syncNavHeight);
    return () => window.removeEventListener("resize", syncNavHeight);
  }, []);

  useEffect(() => {
    // Reduced motion → fully native scrolling (no Lenis). ScrollTrigger keeps
    // working off the native scroll position and reveal.tsx leaves its content
    // visible, so nothing else is needed here.
    if (reducedMotion) return;

    const lenis = new Lenis({
      lerp: LERP,
      smoothWheel: true,
      wheelMultiplier: 1,
      // syncTouch stays false (its default) so touch / mobile scrolling stays
      // native and doesn't feel weird.
    });
    // Publish for out-of-tree triggers (the hero "T" shortcut) so they scroll
    // through this same instance and land identically. Cleared on teardown.
    activeLenis = lenis;

    // --- Lenis ↔ GSAP ScrollTrigger integration (the reason this route needs
    // its own provider). Two wires:
    //   1. Every Lenis scroll pushes an update into ScrollTrigger so triggers
    //      evaluate against the real, in-progress smooth position.
    //   2. Lenis is driven by GSAP's ticker instead of its own rAF loop, so
    //      both share a single clock (no double rAF, no drift). lagSmoothing(0)
    //      keeps Lenis's easing math correct when a frame is delayed.
    lenis.on("scroll", ScrollTrigger.update);

    const tick = (time: number) => {
      // GSAP ticker time is in seconds; Lenis.raf expects milliseconds.
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // Reveal / nav ScrollTriggers mount before this effect runs (child effects
    // fire before the parent's), so recalculate their start/end positions now
    // that Lenis owns the scroll.
    ScrollTrigger.refresh();

    return () => {
      lenis.off("scroll", ScrollTrigger.update);
      gsap.ticker.remove(tick);
      // Restore GSAP's default lag smoothing (500ms / 33ms) so leaving the quiz
      // for the marketing site doesn't inherit our disabled setting.
      gsap.ticker.lagSmoothing(500, 33);
      lenis.destroy();
      activeLenis = null;
    };
  }, [reducedMotion]);

  // Clean in-page navigation. Always on (not gated by reduced motion), so EVERY
  // path — nav links, the logo (#top), the "Take the test" CTA (#pricing) — is
  // intercepted and scrolled programmatically WITHOUT ever writing a #hash to
  // the URL. Runs through smoothScrollToTarget, which uses Lenis when present
  // and falls back to native scroll under reduced motion. Capture phase +
  // stopPropagation wins over Next.js <Link>'s own hash handling. On first load
  // an incoming deep link (e.g. /#pricing) is honored ONCE and then stripped, so
  // shared deep links still work but the address bar ends up clean.
  useEffect(() => {
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

      // Every "take the test" CTA scrolls to #pricing — capture the activation
      // here (this capture-phase handler owns the click, so a Button onClick
      // would never fire) with the entry point derived from the anchor's context.
      if (target.id === "pricing") {
        trackTestCtaActivated("click", ctaLocationForAnchor(anchor));
      }

      event.preventDefault();
      event.stopPropagation();
      smoothScrollToTarget(target);
    };

    document.addEventListener("click", handleAnchorClick, true);

    // Honor an incoming #hash — on initial load (a shared deep link) AND if one
    // later appears (e.g. typed into the address bar, firing `hashchange`) — by
    // smooth-scrolling under the nav, then immediately strip it so the URL stays
    // clean. Because we never WRITE hashes ourselves, this only ever reacts to
    // external hashes, never our own in-page navigation.
    let deepLinkTimer: ReturnType<typeof setTimeout> | undefined;
    const consumeHash = () => {
      const { hash } = window.location;
      if (!hash || hash === "#") return;
      const target = document.getElementById(decodeURIComponent(hash.slice(1)));
      window.history.replaceState(
        window.history.state,
        "",
        window.location.pathname + window.location.search,
      );
      if (target) {
        if (deepLinkTimer) clearTimeout(deepLinkTimer);
        deepLinkTimer = setTimeout(() => smoothScrollToTarget(target), 400);
      }
    };
    consumeHash();
    window.addEventListener("hashchange", consumeHash);

    return () => {
      document.removeEventListener("click", handleAnchorClick, true);
      window.removeEventListener("hashchange", consumeHash);
      if (deepLinkTimer) clearTimeout(deepLinkTimer);
    };
  }, []);

  return <>{children}</>;
}
