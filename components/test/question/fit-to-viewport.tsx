/**
 * A QUESTION ALWAYS FITS THE SCREEN. It is never scrolled to and never cut off.
 *
 * ===========================================================================
 * WHY FIT AND NOT SCROLL
 * ===========================================================================
 * The runner gives the question a fixed region between a pinned header and a
 * pinned footer, and for a while that region scrolled when a question was too
 * tall for it. Under a clock that is the wrong answer twice over: a person who
 * does not realise there is a fourth option below the fold answers a question
 * they have not read, and a person who does realise spends their eighteen
 * seconds dragging instead of thinking. Turning the scroll off without making
 * the content fit is worse again, which is the state this replaces: the option
 * was not below the fold, it was simply unreachable.
 *
 * So the content is measured against the region it has been given and scaled
 * down until it fits. A smaller question that is entirely visible beats a
 * comfortable one with its last option off the bottom.
 *
 * ===========================================================================
 * WHY A TRANSFORM AND NOT A FONT-SIZE CASCADE
 * ===========================================================================
 * The obvious alternative is a scale variable threaded through every type size,
 * padding and gap in the question renderer. It was rejected for two reasons.
 *
 * The first is that it does not converge. Shrinking type reflows text, which
 * changes the height, which changes the required scale, so it has to be
 * iterated, and it can oscillate. A transform does not touch layout at all:
 * rendered height is exactly `layoutHeight * scale`, which makes the right
 * scale a single division rather than a search.
 *
 * The second is that it would only shrink the things somebody remembered to
 * thread the variable through. Figures are sized against the viewport, tables
 * against their content, option cards against their aspect ratio; the miss rate
 * on hand-threading twelve renderers is not zero, and a miss shows up as an
 * item that still clips. A transform is total by construction.
 *
 * The cost is horizontal gutters on a heavily scaled item, because the block
 * narrows as it shrinks. On the three-by-three matrices, the worst case in the
 * bank, that is about fifty pixels a side on a 360px screen. That is a real
 * cost and it is the right trade: the alternative is a figure matrix whose
 * bottom row of options is not on the screen.
 *
 * WHAT THE SCALE FLOOR IS FOR. Below `MIN_SCALE` the item would be too small to
 * read, and the honest response is to say so rather than to keep shrinking. At
 * the floor the region is allowed to scroll as a last resort, so nothing is
 * ever unreachable, and `onOverflow` reports the item so it can be rewritten.
 *
 * Measured across all 125 shipped items at 360x640, the deepest scale asked for
 * is 0.69, on the three-by-three matrices; every other item is 0.845 or
 * gentler, and at 390x844 only the matrices scale at all, to 0.9. Nothing
 * reaches the floor.
 *
 * TAP TARGETS SURVIVE THIS, and not by luck. The items that need the deepest
 * scale are the figural ones, whose options are 150px squares; at the worst
 * measured scale those are still about 100px. The items with 56px text rows
 * need barely any scaling at all, because text is what the region is shaped
 * for. The two never collide.
 */
"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";

/**
 * The smallest a question may be scaled. 0.6 is well below anything the current
 * bank asks for (the deepest is about 0.68, a three-by-three matrix on a 360px
 * screen) and exists as a backstop, not as a target.
 */
const MIN_SCALE = 0.6;

/**
 * Round the scale so a one-pixel measurement wobble does not produce a visibly
 * different render on two consecutive frames.
 */
const step = (n: number) => Math.floor(n * 200) / 200;

export interface FitToViewportProps {
  children: ReactNode;
  /**
   * Changes whenever the content does, so the scale is recomputed for the new
   * question rather than inherited from the last one.
   */
  contentKey: string;
  /**
   * Called when the content still does not fit at MIN_SCALE. That is a content
   * problem rather than a layout one: the item is too long and wants rewriting.
   */
  onOverflow?: (info: { contentKey: string; needed: number; available: number }) => void;
}

export function FitToViewport({ children, contentKey, onOverflow }: FitToViewportProps) {
  const regionRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState<number | undefined>(undefined);

  const measure = useCallback(() => {
    const region = regionRef.current;
    const content = contentRef.current;
    if (!region || !content) return;

    // The natural, unscaled height. `offsetHeight` rather than a bounding rect:
    // a rect is post-transform and would feed the previous scale back in.
    const natural = content.offsetHeight;
    const available = region.clientHeight;
    if (natural <= 0 || available <= 0) return;

    const exact = available / natural;
    const next = exact >= 1 ? 1 : Math.max(MIN_SCALE, step(exact));

    setScale(next);
    setHeight(natural * next);

    if (natural * next > available + 1) {
      onOverflow?.({ contentKey, needed: Math.round(natural * next), available });
    }
  }, [contentKey, onOverflow]);

  /*
   * Before paint, so a question is never briefly visible at the previous
   * question's size.
   *
   * There is no "reset the scale to 1 first" step, and there does not need to
   * be: `offsetHeight` is the LAYOUT height and a transform does not touch
   * layout, so the natural height reads correctly however the last item was
   * scaled. That is the same property that makes the scale a single division
   * instead of a search.
   */
  useLayoutEffect(() => {
    measure();
  }, [measure]);

  useEffect(() => {
    const region = regionRef.current;
    if (!region) return;

    // The region changes size when the browser chrome collapses on scroll, when
    // a phone rotates, and when a desktop window is dragged.
    const observer = new ResizeObserver(() => measure());
    observer.observe(region);

    // Web fonts land after first paint and change every line height in the
    // question, so the first measurement is against fallback metrics.
    let cancelled = false;
    void document.fonts?.ready.then(() => {
      if (!cancelled) measure();
    });

    return () => {
      observer.disconnect();
      cancelled = true;
    };
  }, [measure]);

  return (
    <div
      ref={regionRef}
      data-lenis-prevent
      /*
       * `overflow-y-auto` is the backstop for the floor case only. With the
       * scale applied it has nothing to scroll in the shipped bank, and it is
       * kept rather than set to hidden because unreachable content is a worse
       * failure than a scrollbar nobody uses.
       */
      /*
       * `flat-surface`: the stem card and the option cards are the two things
       * somebody looks at for fifteen minutes, so they lose the hard shadow.
       * Scoped here rather than on the flow root so it cannot reach the
       * buttons, the fork cards or anything else. See app/globals.css.
       */
      className="flat-surface flex min-h-0 flex-1 items-center justify-center overflow-y-auto overscroll-contain"
    >
      <div style={{ height }} className="w-full">
        <div
          ref={contentRef}
          style={{
            transform: scale === 1 ? undefined : `scale(${scale})`,
            transformOrigin: "top center",
          }}
          className="w-full px-4 py-3 sm:px-6 sm:py-5"
        >
          {children}
        </div>
      </div>
    </div>
  );
}
