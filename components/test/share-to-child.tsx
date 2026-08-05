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
import { isTouchDevice, trackTestShareToChildClicked } from "@/lib/analytics/events";
import { CHILD_ENTRY_PARAM } from "@/lib/test/share-url";

/**
 * How long to wait for the OS sheet to show itself before deciding it never
 * will. See `presentSheet`, which is where the reason this is not simply a
 * timeout is written down.
 */
const SHEET_WATCHDOG_MS = 2000;

/**
 * Offer the OS sheet, and come back either way.
 *
 * `navigator.share()` CAN BE CALLED SUCCESSFULLY AND THEN NEVER SETTLE. It is
 * measured behaviour on desktop Chrome, and the reason this file's one exit
 * used to hang: `await navigator.share(...)` sat on a promise nobody was ever
 * going to resolve, so the clipboard fallback below it was unreachable, no
 * event went out, and the button was silent for the rest of the page's life.
 * That is the whole of "I press it and nothing happens", and PostHog recorded
 * it precisely — a press captured, a $dead_click after it, and no
 * test_share_to_child_clicked in between.
 *
 * A PLAIN TIMEOUT CANNOT FIX IT, because a sheet somebody is actually reading
 * leaves the promise pending too, for as long as they like. What separates the
 * two is FOCUS: when the OS puts a sheet up, this document loses it. So the
 * watchdog only gives up when the promise has not settled AND this page is
 * still visible and still focused, which together mean no sheet was ever
 * presented.
 *
 * The same reasoning, and the same two seconds, as the share card above this
 * one (components/test/share-results.tsx). It is written out twice rather than
 * shared because the two do different things with the answer, and a helper
 * that hid this decision would be the easier of the two to get wrong later.
 */
function presentSheet(data: ShareData): Promise<"shared" | "no_sheet"> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (outcome: "shared" | "no_sheet") => {
      if (settled) return;
      settled = true;
      window.clearTimeout(watchdog);
      resolve(outcome);
    };
    const watchdog = window.setTimeout(() => {
      if (document.visibilityState !== "visible" || !document.hasFocus()) return;
      finish("no_sheet");
    }, SHEET_WATCHDOG_MS);
    // Dismissing a sheet rejects, and that lands here too: from this card's
    // point of view a backed-out sheet and an absent one both mean "still not
    // sent", and both should end up at the clipboard rather than nowhere.
    navigator.share(data).then(
      () => finish("shared"),
      () => finish("no_sheet"),
    );
  });
}

export function ShareToChild() {
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function share() {
    const url = `${window.location.origin}/?${CHILD_ENTRY_PARAM}`;
    const title = "The Official Smart Fella Test";
    const text = "I just did this. Your turn. Pick your grade and go.";

    /*
      THE OS SHEET IS FOR PHONES, AND ASKING FOR IT AT A DESK COSTS TWO SILENT
      SECONDS.

      `navigator.share` EXISTS in Chrome for macOS, so this used to be offered
      everywhere — and at a desk it is the wrong trade twice over. It routinely
      never presents anything, which means the watchdog above has to burn its
      full two seconds before the clipboard is even attempted; and by the time
      it gives up the gesture's transient activation is spent, so the clipboard
      then refuses too and the honest outcome is an apology. Measured on the
      live page in Chrome for macOS: nothing whatsoever on screen until 2.4s
      after the press. Nobody waits that long before deciding a button is dead,
      and this is what was reported, twice.

      On a fine pointer the clipboard is simply the better answer, and taken
      first — inside the gesture, with the activation intact — it is instant.
      On a phone the sheet is still the point: it lands the link in the
      messaging app the parent already uses, which is the whole purpose of this
      card, so touch keeps it.

      Capability is not sufficiency. The share card above this one reaches the
      same conclusion for the same reason (see `readSheetTakesFiles`), and this
      is the same test: what the browser CAN do, and whether it should.
    */
    if (isTouchDevice() && typeof navigator.share === "function") {
      if ((await presentSheet({ title, text, url })) === "shared") {
        trackTestShareToChildClicked("link");
        return;
      }
      // Dismissed, refused, or never presented. Fall through to the clipboard.
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setStatus(null);
      trackTestShareToChildClicked("copy");
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      /*
        THE LAST EXIT IS GONE TOO, AND SAYING SO IS THE POINT.

        This used to be an empty catch under a comment reading "the link below
        is still there". That is true, and it is not the same as telling
        anybody: nothing changed on screen and no event went out, so a press
        that got the person nowhere looked exactly like a button that does
        nothing.

        It is an ordinary path, not a corner. Anything that spends the
        gesture's transient activation before this line — a sheet the person
        dismissed, or the two seconds the watchdog waits for one that never
        appears — leaves `clipboard.writeText` without the activation it
        requires, and it refuses.

        Same rule the share card above this one already follows: never be
        silent. Say what happened, point at the exit that still works, and
        report it, so the next one of these shows up in the data instead of
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
