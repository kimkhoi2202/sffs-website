/**
 * The results screen, on both sides of the email gate.
 *
 * ===========================================================================
 * BEFORE THE SEND: A MASKED SHAPE BEHIND GLASS
 * ===========================================================================
 * The score is not on the page. Not blurred, not hidden, not present: what
 * sits behind the glass is the SHAPE of the results with every earned value
 * replaced by a visible "???" (see `maskedResult`), so there is nothing in the
 * DOM to read with devtools and nothing a blur radius has to defeat. That is
 * what scripts/verify-gate-leak.mjs exists to prove, and it must keep passing.
 *
 * ===========================================================================
 * AFTER THE SEND: THE THING THEY EARNED, ON THIS PAGE
 * ===========================================================================
 * A successful send used to change one card into a "check your inbox" notice
 * and stop there. Everything the person had just spent five or fifteen minutes
 * on lived behind a link in an inbox they might have mistyped, and two of the
 * first seventeen conversions used disposable addresses, so those two almost
 * certainly never saw a score at all. Nobody was served by that: the gate had
 * already been paid.
 *
 * So the blur comes off, the verdict lands, the question review opens, and the
 * share controls arrive with them — the sheet, the card and the per-destination
 * buttons were built for a page most people never reached. The email still goes
 * and the confirmation still says so, because that message is the durable copy.
 *
 * IT IS A LATCH, NOT A MODE. `revealed` only ever goes true, and it is stored
 * in the flow's persisted state rather than here (see `revealed` in
 * lib/test/session.ts), so a refresh on this screen does not put the glass back
 * over results that have already been paid for, and neither does pressing
 * "Wrong address? Use a different one".
 *
 * ===========================================================================
 * WHY THE ANSWERS CAN BE A PROP AND THE SCORE CANNOT BE PRE-RENDERED
 * ===========================================================================
 * This component now takes the raw `answers` and scores them itself, but ONLY
 * inside the revealed branch. The distinction is not cosmetic. What the gate
 * guarantees is that no earned value is in the DOM, the hydrated markup or the
 * server HTML before a message has left; a value that is never rendered is
 * never in any of the three. The answers themselves were already in this tab's
 * sessionStorage the whole time (the flow persists them so a refresh mid-test
 * does not lose the attempt), so passing them down adds no exposure that was
 * not there before — and computing the score is a pure function away either
 * way, because the bank ships in the client bundle so the test can run.
 *
 * ===========================================================================
 * NOTHING OUTSIDE THE CARD IS REACHABLE, BEFORE THE SEND
 * ===========================================================================
 * The gated layer is `inert`, so the only interactive thing on that screen is
 * the email card. "Start over" used to sit below the blur as a full-width
 * button, which made it the one crisp, clickable object on a page whose whole
 * argument is that the results are locked — and put a restart control directly
 * under a person's thumb at the moment they were deciding whether to hand over
 * an address. It is now gone from the gate altogether and appears only once the
 * send has succeeded. See the note above `StartOver` in ./email-gate.tsx.
 */
"use client";

import { useEffect, useRef } from "react";

import { EmailGate } from "./email-gate";
import { ResultsView } from "./results-view";
import { ShareResults } from "./share-results";
import { trackTestResultsGateViewed } from "@/lib/analytics/events";
import { EMAIL_SOURCES } from "@/lib/email-sources";
import { maskedResult, scoreTest, type AnswerMap } from "@/lib/test/scoring";
import type { Test } from "@/lib/test/types";

export interface GatedResultsProps {
  test: Test;
  timedOut: boolean;
  /** What they picked. Scored here only once `revealed` is true. */
  answers: AnswerMap;
  /** The stored result's token. Null while the server is still saving it. */
  token: string | null;
  /** True once a results email has left for this attempt. Never goes back. */
  revealed: boolean;
  /** A message has gone. The caller latches it and remembers the result. */
  onSent: () => void;
  onRestart: () => void;
}

export function GatedResults({
  test,
  timedOut,
  answers,
  token,
  revealed,
  onSent,
  onRestart,
}: GatedResultsProps) {
  const audience = test.audience;
  const source =
    audience === "child" ? EMAIL_SOURCES.testChild : EMAIL_SOURCES.testParent;

  const seenRef = useRef(false);
  useEffect(() => {
    if (seenRef.current) return;
    seenRef.current = true;
    trackTestResultsGateViewed({ test_id: test.id, audience });
  }, [test.id, audience]);

  /*
    Only computed on the revealed branch. `scoreTest` is pure and cheap, but
    the discipline is what the gate is made of: no earned value exists in this
    render at all until a message has left.
  */
  const result = revealed ? scoreTest(test, answers) : null;

  return (
    /*
      ONE TREE, TWO STATES, AND THE SHAPE OF IT DOES NOT CHANGE.
      =======================================================================
      Both states render the same wrapper with the gate card at the same
      position in it, and the reveal only switches sibling slots between an
      element and `null`. That is not tidiness, it is a correctness
      requirement: React reconciles by position, so returning a different tree
      shape for the two states UNMOUNTS the gate and mounts a fresh one, and
      everything it knows — that a message went, and to which address — goes
      with it. The first version of this did exactly that, and the confirmation
      snapped back to an empty form at the instant the results appeared. Keep
      the card where it is.

      THE CARD STAYS ON TOP AND THE RESULTS GO UNDER IT, AND THERE IS NO
      AUTO-SCROLL. The card is where their eyes already are — they just pressed
      the button in it — so it is where the confirmation has to be, and it
      holds the three exits this flow promises: send it again, use a different
      address, start over. Putting the score above it would push "we have
      emailed this to you" off the top of a phone in the same gesture that
      reveals the score.

      Nothing has to be hunted for either. StepShell centres its content only
      while that content is shorter than the viewport, so the reveal makes the
      card jump from the middle of the screen to the top of it and a yellow
      slab appear underneath. A page visibly growing is a better signal than a
      scroll that would carry the confirmation off screen, and the confirmation
      copy names the direction anyway.

      `gap-5` matches app/results/[token]/page.tsx, because from the results
      card down this is the same stack somebody gets from the emailed link.
    */
    <div className="flex w-full flex-col items-center gap-5">
      {/*
        ===================================================================
        THE BLURRED LAYER IS THE WHOLE VIEWPORT, AND THAT IS THE POINT
        ===================================================================
        `filter: blur()` blurs an ELEMENT, so the element's own box becomes the
        edge of the blurred region. When this was a block inside the reading
        column it was a 512px-wide, 612px-tall rectangle of frosted glass
        floating on plain white, with 464px of hard white either side of it on a
        desktop viewport and the content sliced off flat at the bottom by
        `max-height`. It read as a rendering fault rather than as results behind
        glass, which is the opposite of what a gate is for.

        Of the ways to fix that, this is the one that suits how the screen is
        already built: put the blurred surface behind everything at viewport
        size, so its boundaries are off-screen and there is no edge left to see.

        The alternative worth naming is a `backdrop-filter` overlay, which was
        rejected. To have no visible boundary it would also have to be
        viewport-sized, and being ON TOP it would blur the things that are
        deliberately outside the flow: the floating sound toggle, and the dev
        tab. Blurring the page's own furniture to un-blur a rectangle is a worse
        trade than this.

        NO HEIGHT CAP ANY MORE. The cap existed to stop the box floating over
        three screens of fog, and the viewport now does that job by simply being
        the size it is. The content is taller than any phone or laptop screen
        (about 1100px for the shortest bank), so the layer is covered edge to
        edge and there is nothing to fade out.

        `inert` is the part that is easy to forget. A purely visual blur leaves
        every link and button underneath in the tab order and every word of it
        readable to a screen reader, which makes the gate no gate at all for
        anyone not using it with their eyes, and worse, makes the page a
        confusing tab-trap for them. `inert` takes the whole subtree out of
        focus order and out of the accessibility tree in one attribute.
      */}
      {revealed ? null : (
        <div
          inert
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-0 select-none overflow-hidden bg-paper blur-[5px]"
        >
          {/*
            The same reading column the real results page uses, so what shows
            through the glass has the shape of the thing being withheld. `pt`
            is a little tighter than the live page's because the top of the
            screen is the one part of the backdrop nothing covers.
          */}
          <div className="mx-auto w-full max-w-md px-4 pt-8 sm:max-w-lg sm:pt-10">
            <ResultsView test={test} result={maskedResult(test)} timedOut={timedOut} masked />
          </div>
        </div>
      )}

      {/*
        The card is in normal flow, and the step shell centres it. It used to
        be absolutely positioned over the blurred block, which meant its
        position depended on that block's height; with the backdrop out of the
        layout there is nothing left for it to depend on.
      */}
      <div className="relative z-10 flex w-full justify-center">
        <EmailGate
          audience={audience}
          testId={test.id}
          source={source}
          token={token}
          onSent={onSent}
          onRestart={onRestart}
        />
      </div>

      {result ? <ResultsView test={test} result={result} timedOut={timedOut} /> : null}

      {/*
        The share controls, which are most of the point of showing any of this.
        They were built on the results page, the results page is behind an
        email, and so almost nobody who could have shared a result had ever
        seen one. `token` is non-null whenever `result` is — a send is
        impossible without it — but it is typed nullable all the way down and
        this is not the place to assert otherwise.
      */}
      {result && token ? (
        <ShareResults
          token={token}
          testId={test.id}
          audience={audience}
          verdict={result.verdict.id}
        />
      ) : null}
    </div>
  );
}
