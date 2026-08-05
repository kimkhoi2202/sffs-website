/**
 * The hand-off: a parent sending the test to their kid.
 *
 * Native share sheet where the browser has one, which on a phone is the point —
 * it lands in the messaging app the parent already uses. Clipboard otherwise,
 * and the plain link is always visible as a third fallback, so there is no
 * dead end if both are blocked.
 *
 * Its own file because components/test/results-view.tsx is a server component
 * and this needs the browser.
 */
"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { trackTestShareToChildClicked } from "@/lib/analytics/events";
import { CHILD_ENTRY_PARAM } from "@/lib/test/share-url";

export function ShareToChild() {
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function share() {
    const url = `${window.location.origin}/?${CHILD_ENTRY_PARAM}`;
    const title = "The Official Smart Fella Test";
    const text = "I just did this. Your turn. Pick your grade and go.";

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text, url });
        trackTestShareToChildClicked("link");
        return;
      } catch {
        // Sheet dismissed or not permitted. Fall through to the clipboard.
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setStatus(null);
      trackTestShareToChildClicked("copy");
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      /*
        BOTH EXITS BLOCKED, AND THIS USED TO BE WHERE THE TAP DIED.

        The comment here said "the link below is still there", which is true
        and is not the same as telling anybody. Nothing changed on screen and
        no event went out, so the button was indistinguishable from a dead one
        — and that is how it was reported. PostHog had it exactly: an
        $autocapture for the press, a $dead_click for the silence after it, and
        no test_share_to_child_clicked between them, because the only two
        places that fire one are the two paths that worked.

        It is reachable in ordinary use. `navigator.share` exists on desktop
        Chrome for macOS, so a dismissed OS sheet lands here, and by then the
        gesture's transient activation can be spent — which is exactly what
        `clipboard.writeText` needs. Two normal things in a row and the card
        goes quiet.

        Same rule the share sheet next to this one already follows: never be
        silent. Say what happened, point at the exit that still works, and
        record it so the next one of these is visible in the data instead of
        arriving as a bug report.
      */
      setStatus("Could not copy. Use the link underneath instead.");
      trackTestShareToChildClicked("failed");
      window.setTimeout(() => setStatus(null), 4000);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border-[2.5px] border-ink bg-mint p-4 shadow-hard-sm sm:p-5">
      <h2 className="text-balance font-display text-xl uppercase leading-none">
        Now make your kid do it
      </h2>
      <p className="text-pretty text-[0.925rem] font-semibold leading-snug text-ink/75">
        Send them this and they land straight on the grade picker.
      </p>
      {/* Paper, not ink. Every control in this stack is white now, for
          consistency with "Take it again" below it. */}
      <Button variant="paper" size="lg" onClick={share} className="w-full">
        {copied ? "Link copied" : "Send it to your kid"}
      </Button>
      {/*
        SPOKEN, NOT JUST SHOWN, and always in the DOM — a live region added at
        the same moment its text is set is frequently missed by the
        announcement. Same shape as the one on the share card above, because it
        is the same job. It reserves no height when empty, so the card does not
        move when it speaks.
      */}
      <p
        role="status"
        aria-live="polite"
        className="text-center text-xs font-bold uppercase tracking-wide text-ink/70 empty:hidden"
      >
        {status}
      </p>
      {/*
        Tracked like the other two exits. It is a real navigation rather than a
        handler, so the event has to go out before the browser leaves; a plain
        capture is enough here because PostHog sends it beacon-style.
      */}
      <a
        onClick={() => trackTestShareToChildClicked("open")}
        href={`/?${CHILD_ENTRY_PARAM}`}
        className="text-center text-xs font-bold uppercase tracking-wide text-ink/60 underline decoration-2 underline-offset-2"
      >
        Or open the grade picker here
      </a>
    </div>
  );
}
