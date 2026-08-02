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
 * an address. It now lives inside the card as its quietest control.
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
    <div className="relative w-full">
      {/*
        The gated content.

        `inert` is the part that is easy to forget. A purely visual blur leaves
        every link and button underneath in the tab order and every word of it
        readable to a screen reader, which makes the gate no gate at all for
        anyone not using it with their eyes — and worse, makes the page a
        confusing tab-trap for them. `inert` takes the whole subtree out of
        focus order and out of the accessibility tree in one attribute.

        Height-capped to roughly one screen so the box has something to sit on
        rather than floating over three screens of fog, with a fade at the
        bottom so the cut reads as deliberate.
      */}
      <div
        inert
        aria-hidden="true"
        className="max-h-[68vh] select-none overflow-hidden blur-[5px]"
      >
        <ResultsView test={test} result={masked} timedOut={timedOut} masked />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-paper"
      />

      <div className="absolute inset-0 grid place-items-center p-3">
        <EmailGate
          audience={audience}
          testId={test.id}
          source={source}
          token={token}
          onRestart={onRestart}
        />
      </div>
    </div>
  );
}
