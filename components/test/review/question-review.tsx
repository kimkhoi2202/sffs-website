/**
 * The question-by-question review: a list, and a panel showing one question in
 * full.
 *
 * ===========================================================================
 * WHY THIS REPLACED A LIST OF ONE-LINERS
 * ===========================================================================
 * This page is what somebody hands over an email address to reach, and it used
 * to print a question TYPE and a sentence, never the question. A person could
 * not see what they were asked, what they picked, or what was right. A correct
 * answer showed a green tick and nothing else, so somebody who reasoned it out
 * and somebody who guessed saw an identical screen.
 *
 * ===========================================================================
 * ONE COMPONENT, TWO LAYOUTS, AND THE BREAKPOINT IS NOT A STYLE CHOICE
 * ===========================================================================
 * Above `lg` the list sits on the left and the panel on the right, both on
 * screen, because comparing your run to one question at a time is the point.
 *
 * Below it there is no room for both — a 360px column cannot hold a list and a
 * figure matrix — so selecting a question REPLACES the list with a full-screen
 * detail and a way back. That is a genuinely different interaction rather than
 * the same one squeezed, which is why it is a state change (`open`) rather than
 * a CSS reflow of the same tree.
 *
 * PREV AND NEXT ARE ON BOTH, and arrow keys and escape work, because the
 * alternative is returning to the list fifteen or fifty times. This is a
 * reading surface: someone who just sat a test wants to walk it, not navigate
 * it.
 *
 * ===========================================================================
 * THE GATED VIEW RENDERS NONE OF THIS
 * ===========================================================================
 * There is far more to leak here than there was: the questions, the options,
 * the answers, and which ones they got wrong. So `masked` does not hide it with
 * styling — this component is not rendered at all, and the caller substitutes a
 * shape-holding placeholder. Anything blurred is still in the DOM, and a blur
 * is a picture rather than a privacy boundary.
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { QuestionDetail } from "./question-detail";
import { Button } from "@/components/ui/button";
import type { ScoredItem } from "@/lib/test/scoring";
import { cn } from "@/lib/utils";

function StatusDot({ scored }: { scored: ScoredItem }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid size-6 shrink-0 place-items-center rounded-full border-[2.5px] border-ink text-xs font-black leading-none",
        scored.correct ? "bg-mint" : scored.picked === null ? "bg-gray-200" : "bg-coral",
      )}
    >
      {scored.correct ? "\u2713" : scored.picked === null ? "\u2013" : "\u2715"}
    </span>
  );
}

export function QuestionReview({ items }: { items: ScoredItem[] }) {
  const [selected, setSelected] = useState(0);
  /** Only meaningful below `lg`, where the detail takes the whole screen. */
  const [open, setOpen] = useState(false);
  const detailRef = useRef<HTMLDivElement>(null);

  const go = useCallback(
    (delta: number) => {
      setSelected((i) => Math.min(items.length - 1, Math.max(0, i + delta)));
    },
    [items.length],
  );

  /*
    Arrow keys and escape. Skipped when the focus is in a field so this can
    never eat someone's typing, even though there is nothing to type on this
    page today — the next thing added to it should not have to remember.
  */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); go(1); }
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); go(-1); }
      else if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  /* Moving between questions should put you at the top of the new one. */
  useEffect(() => {
    detailRef.current?.scrollTo?.({ top: 0 });
  }, [selected]);

  const current = items[selected];
  const pick = (i: number) => {
    setSelected(i);
    setOpen(true);
  };

  const nav = (
    <div className="flex items-center gap-2">
      <Button
        variant="paper"
        size="sm"
        onClick={() => go(-1)}
        disabled={selected === 0}
        aria-label="Previous question"
      >
        &larr; Prev
      </Button>
      <Button
        variant="paper"
        size="sm"
        onClick={() => go(1)}
        disabled={selected === items.length - 1}
        aria-label="Next question"
      >
        Next &rarr;
      </Button>
    </div>
  );

  return (
    <div
      /*
        IT BREAKS OUT OF THE READING COLUMN ON LARGE SCREENS.

        The rest of this page sits in a 512px column, which is right for a score
        and a verdict and far too narrow for two panes — the first version put
        the list and the detail inside it and the figure matrix was clipped to
        about a hundred pixels. The column is sized for reading a sentence; this
        is sized for looking at a puzzle next to a list.

        `left-1/2` plus a half-width pull re-centres a wider box against the
        centre of a parent that is itself centred, which is the one breakout
        that does not need the page restructured around it. Below `lg` none of
        it applies and the card stays in the column with everything else.
      */
      className={cn(
        "w-full rounded-2xl border-[2.5px] border-ink bg-paper p-4 shadow-hard-sm sm:p-5",
        "lg:relative lg:left-1/2 lg:w-[min(72rem,94vw)] lg:max-w-none lg:-translate-x-1/2",
      )}
    >
      <div className="lg:grid lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] lg:gap-6">
        {/* -- the list ------------------------------------------------------ */}
        <ol
          /*
            LENIS IS WHY THIS NEEDS AN OPT-OUT.

            The site runs a smooth-scroll library that intercepts wheel events
            at the window and drives the document scroll itself. It does not
            know about nested scrollers, so a wheel anywhere — including inside
            a pane with 2000px of content below the fold — moved the PAGE and
            left the pane at scrollTop 0. The pane was scrollable the whole
            time: `overflow-y: auto`, a real max-height, scrollHeight well over
            clientHeight, and `scrollTop = 200` stuck when set from script. It
            simply never saw the event.

            That is worth spelling out because every plausible local cause was
            wrong. It was not `overflow: hidden` inherited from the shell, not
            the fit-to-viewport wrapper, not the document's `overflow-x: clip`,
            not the breakout transform, not the mask, and not flex-vs-block on
            the pane itself — all five were toggled off individually and none
            of them changed anything. A plain nested scroller on a blank page
            scrolled fine under the same synthetic gesture, which is what
            proved the problem was ours rather than the harness.

            `data-lenis-prevent` tells the library to leave wheel events inside
            this subtree alone, which hands them back to the browser.
          */
          data-lenis-prevent
          className={cn(
            /*
              ROOM RESERVED FOR THINGS THAT LEAVE THEIR BOX, sized from the
              treatments rather than guessed. `btn-press` moves -2px on hover
              and grows its shadow to 6px, so its painted extent reaches 4px
              past the bottom-right and 2px past the top-left; `press-lg`
              reaches 6px; the Button's focus ring sits about 3.5px outside.
              Eight pixels clears the worst of those with margin, and holds if
              the treatment is retuned within reason.

              This is the same bug three times over in one session — a sheared
              focus ring, a Next button clipped at the column edge, and a
              hover-displaced control cut off — so it is fixed once here, on
              the container, rather than by asking each element not to move.

              The bottom is deeper because the fade needs clearing too: content
              under it is technically visible and hard to read, so the last row
              has to end above it, not inside it.
            */
            "flex flex-col gap-1.5 pane-scroll lg:max-h-[34rem] lg:px-2 lg:pt-2 lg:pb-12",
            // Below lg the list is replaced rather than pushed off-canvas, so
            // the detail never renders under a list nobody can see.
            open ? "hidden lg:flex" : "flex",
          )}
        >
          {items.map((scored, i) => (
            <li key={scored.item.id}>
              <button
                type="button"
                onClick={() => pick(i)}
                aria-current={i === selected ? "true" : undefined}
                className={cn(
                  /*
                    `items-center`, not `items-start`. The row aligned to the
                    top and the icon carried an `mt-0.5` nudge to compensate,
                    so the icon looked centred and the label did not — measured
                    at 5.2px high against the row's centre while the icon was
                    within 1px of it, which is what made the row read as
                    tilted. Centring both and dropping the nudge fixes it at
                    the cause. (The residual all-caps optical offset is under a
                    pixel and is not worth a magic number.)

                    `cursor-pointer` because the row is a button and did not
                    say so.

                    THE FOCUS RING IS DRAWN INSIDE. A default outline sits
                    outside the border box and the pane clips it, so it showed
                    on the left and was sheared off on the right. A negative
                    offset puts it within the row's own bounds, where there is
                    nothing to clip it — which keeps the indicator that
                    keyboard users need on a page whose arrow-key navigation is
                    a designed feature.
                  */
                  "flex w-full cursor-pointer items-center gap-2.5 rounded-xl border-[2.5px] px-2.5 py-2 text-left transition-colors",
                  "focus-visible:outline focus-visible:outline-[3px] focus-visible:-outline-offset-[3px] focus-visible:outline-ink",
                  i === selected
                    ? "border-ink bg-blue"
                    : "border-transparent hover:[@media(hover:hover)]:bg-cream",
                )}
              >
                <StatusDot scored={scored} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[0.78rem] font-extrabold uppercase leading-tight tracking-wide text-ink/60">
                    {i + 1}. {scored.item.tier}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ol>

        {/* -- the panel ----------------------------------------------------- */}
        {/*
          TWO ELEMENTS, AND THE DIVIDER IS THE OUTER ONE.

          The rule between the panes used to be a `border-left` on the scrolling
          element itself, which also carries `pane-scroll` and therefore its
          fade mask. A mask applies to the whole box INCLUDING its border, so
          the line dissolved at exactly the same y as the last line of text and
          the panel looked like it had been torn off at the bottom.

          Content fading is the point of that mask: it is what replaces the
          hidden scrollbar as the signal that there is more below. A structural
          divider fading is just a bug wearing the same clothes. So the border
          moves out to an unmasked wrapper, which stretches to the grid row's
          full height, and the mask stays on the scroller inside it.
        */}
        <div
          className={cn(
            // SYMMETRIC PADDING, still. The wrapper holds the left half and the
            // scroller inside holds the right, which together are the `px-5`
            // this used to be. It was once `pl-5` with nothing opposite, which
            // put the content 20px off the centre of its own column.
            "min-w-0 lg:border-l-[2.5px] lg:border-ink/15 lg:pl-5",
            open ? "block" : "hidden lg:block",
          )}
        >
          <div
            ref={detailRef}
            // Same reason as the list. See the note there.
            data-lenis-prevent
            className="min-w-0 pane-scroll lg:max-h-[34rem] lg:pr-5 lg:pt-2 lg:pb-12"
          >
            {/*
              WRAPS RATHER THAN OVERFLOWS. At 360 this control and the document's
              deliberate `overflow-x: clip` used to fight, and the arrows that
              shared this row were cut off at the column edge and genuinely
              unreachable. The arrows have since moved to the foot of the panel,
              so this row now holds one button, but the wrap stays: the fix was
              never specific to how many controls were in it.
            */}
            <div className="mb-4 flex flex-wrap items-center gap-2 lg:hidden">
              <Button
                variant="paper"
                size="sm"
                onClick={() => setOpen(false)}
                /*
                  NO `aria-label` HERE. One would override the visible text, and
                  "Back to the list" does not contain "All questions" — which
                  fails WCAG 2.5.3, and more practically breaks voice control:
                  someone saying "click all questions" would find nothing. The
                  visible text is already the better label.
                */
              >
                &larr; All questions
              </Button>
            </div>

            {current ? (
              <QuestionDetail scored={current} index={selected} total={items.length} />
            ) : null}
          </div>

          {/*
            PREV AND NEXT LIVE AT THE FOOT OF THE PANEL, and OUTSIDE the
            scroller.

            At the top they occupied the corner the WRONG / CORRECT badge wants,
            which is the one thing on this panel a reader looks for first, and
            pushed it onto its own line underneath. Moving them down hands that
            corner back.

            Outside the scroller rather than at the end of its content, for two
            reasons: inside, they would sit under the same bottom fade this
            commit is fixing, and they would only be reachable after scrolling
            a long explanation to its end. Out here they are always visible and
            always solid. Arrow keys and escape are unchanged and remain the
            fast path.

            `pb-2` and the right padding are room for displacement, not
            decoration: `btn-press` lifts -2px and grows its shadow to 6px on
            hover, so the painted extent reaches about 4px past the bottom
            right of where the button sits at rest.
          */}
          <div className="mt-4 flex flex-wrap items-center justify-end gap-2 pb-2 pr-1 lg:pr-5">
            {nav}
          </div>
        </div>
      </div>

    </div>
  );
}
