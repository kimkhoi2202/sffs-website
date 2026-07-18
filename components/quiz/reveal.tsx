"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/** Elements <Reveal> can render as (default is a plain <div> wrapper). */
type RevealTag =
  | "div"
  | "section"
  | "ul"
  | "ol"
  | "dl"
  | "li"
  | "span"
  | "figure"
  | "figcaption"
  | "article";

interface RevealProps {
  children: React.ReactNode;
  /** Vertical travel distance in px. */
  y?: number;
  /** Delay before the tween starts (seconds). */
  delay?: number;
  /** Tween duration (seconds). Sensible per-mode default when omitted. */
  duration?: number;
  /**
   * Stagger the DIRECT CHILDREN instead of moving the wrapper as one block, so
   * each item fades + rises in sequence as the group scrolls into view. Pass
   * `true` for a sensible step, or a number of seconds for a custom step.
   */
  stagger?: boolean | number;
  /** Element to render the wrapper as (e.g. `"ul"` so list items are the stagger targets). */
  as?: RevealTag;
  /**
   * Opt out of the animation and render the element statically (content stays
   * visible). Lets a caller disable the reveal without changing the markup.
   */
  enabled?: boolean;
  className?: string;
  /** Inline styles forwarded to the wrapper (e.g. a grid-template on a subgrid). */
  style?: React.CSSProperties;
  /** Optional anchor id set on the wrapper (e.g. for "#pricing" deep-links). */
  id?: string;
}

/**
 * Scroll-triggered fade + rise. Wrap any block; it animates in once when it
 * enters the viewport. With `stagger`, its direct children cascade in one after
 * another instead of the block moving as a single unit.
 *
 * Respects prefers-reduced-motion (via gsap.matchMedia — the tween is never
 * created, so content stays visible) and degrades gracefully with no JS
 * (nothing is hidden until GSAP runs). Compositor-only (transform + opacity),
 * so it never triggers layout.
 */
export function Reveal({
  children,
  y = 44,
  delay = 0,
  duration,
  stagger = false,
  as: Tag = "div",
  enabled = true,
  className,
  style,
  id,
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (!enabled) return;
      const el = ref.current;
      if (!el) return;

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const targets = stagger ? Array.from(el.children) : el;
        gsap.from(targets, {
          y,
          autoAlpha: 0,
          duration: duration ?? (stagger ? 0.6 : 0.7),
          delay,
          ease: "power3.out",
          stagger: stagger ? (typeof stagger === "number" ? stagger : 0.08) : 0,
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            once: true,
          },
        });
      });
    },
    { scope: ref },
  );

  const Component = Tag as React.ElementType;

  return (
    <Component ref={ref} id={id} className={className} style={style}>
      {children}
    </Component>
  );
}
