/**
 * The results as they appear straight after a test: blurred, with the email box
 * on top.
 *
 * The blur NEVER lifts here. Submitting an address sends an email; the link in
 * that email opens app/results/[token], which is the same `ResultsView`
 * unblurred. See the header of components/test/email-gate.tsx for why the gate
 * works that way round.
 */
"use client";

import { useEffect, useRef } from "react";

import { EmailGate } from "./email-gate";
import { ResultsView } from "./results-view";
import { Button } from "@/components/ui/button";
import { EMAIL_SOURCES, trackTestResultsGateViewed } from "@/lib/analytics/events";
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
   * this component never receives it. Behind the blur is a structurally
   * identical decoy (see `maskedResult`), so there is nothing in the DOM to
   * read with devtools and nothing a blur radius has to defeat. The true
   * result lives only behind the emailed token.
   */
  const decoy = maskedResult(test);
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
    <div className="w-full">
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
          <ResultsView test={test} result={decoy} timedOut={timedOut} />
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
          />
        </div>
      </div>

      <Button variant="paper" size="lg" onClick={onRestart} className="mt-5 w-full">
        Start over
      </Button>
    </div>
  );
}
