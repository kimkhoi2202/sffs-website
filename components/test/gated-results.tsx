/**
 * The results as they appear straight after a test: blurred, with the email box
 * on top.
 *
 * The blur NEVER lifts here. Submitting an address sends an email; the link in
 * that email opens app/results/[token], which is the same `ResultsView`
 * unblurred. See the header of components/test/email-gate.tsx for why the gate
 * works that way round.
 *
 * ===========================================================================
 * NOTHING OUTSIDE THE CARD IS REACHABLE
 * ===========================================================================
 * The gated layer is `inert`, so the only interactive thing on this screen is
 * the email card. "Start over" used to sit below the blur as a full-width
 * button, which made it the one crisp, clickable object on a page whose whole
 * argument is that the results are locked — and put a restart control directly
 * under a person's thumb at the moment they are deciding whether to hand over
 * an address. Moving it inside the card made it quieter but left it on the
 * same screen as the ask, and people kept taking it; it is now gone from the
 * gate altogether and appears only once the send has succeeded. See the note
 * above `StartOver` in ./email-gate.tsx.
 */
"use client";

import { useEffect, useRef } from "react";

import { EmailGate } from "./email-gate";
import { ResultsView } from "./results-view";
import { trackTestResultsGateViewed } from "@/lib/analytics/events";
import { EMAIL_SOURCES } from "@/lib/email-sources";
import { maskedResult } from "@/lib/test/scoring";
import type { Test } from "@/lib/test/types";

export interface GatedResultsProps {
  test: Test;
  timedOut: boolean;
  /** The stored result's token. Null while the server is still saving it. */
  token: string | null;
  onRestart: () => void;
}

export function GatedResults({
  test,
  timedOut,
  token,
  onRestart,
}: GatedResultsProps) {
  /*
   * THE REAL SCORE IS NOT ON THIS PAGE. Not blurred, not hidden, not present:
   * this component never receives it. Behind the blur is the SHAPE of the
   * results with every earned value replaced by a visible "???" — see
   * `maskedResult`. So there is nothing in the DOM to read with devtools,
   * nothing a blur radius has to defeat, and nothing that can turn out to have
   * been a fake when the real number arrives by email.
   */
  const masked = maskedResult(test);
  const audience = test.audience;
  const source =
    audience === "child" ? EMAIL_SOURCES.testChild : EMAIL_SOURCES.testParent;

  const seenRef = useRef(false);
  useEffect(() => {
    if (seenRef.current) return;
    seenRef.current = true;
    trackTestResultsGateViewed({ test_id: test.id, audience });
  }, [test.id, audience]);

  return (
    <>
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
      <div
        inert
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 select-none overflow-hidden bg-paper blur-[5px]"
      >
        {/*
          The same reading column the real results page uses, so what shows
          through the glass has the shape of the thing being withheld. `pt` is
          a little tighter than the live page's because the top of the screen is
          the one part of the backdrop nothing covers.
        */}
        <div className="mx-auto w-full max-w-md px-4 pt-8 sm:max-w-lg sm:pt-10">
          <ResultsView test={test} result={masked} timedOut={timedOut} masked />
        </div>
      </div>

      {/*
        The card is now in normal flow, and the step shell centres it. It used
        to be absolutely positioned over the blurred block, which meant its
        position depended on that block's height; with the backdrop out of the
        layout there is nothing left for it to depend on.
      */}
      <div className="relative z-10 flex w-full justify-center">
        <EmailGate
          audience={audience}
          testId={test.id}
          source={source}
          token={token}
          onRestart={onRestart}
        />
      </div>
    </>
  );
}
