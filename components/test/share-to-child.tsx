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

/** The query param that drops someone straight into the grade picker. */
export const CHILD_ENTRY_PARAM = "for=child";

export function ShareToChild() {
  const [copied, setCopied] = useState(false);

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
      trackTestShareToChildClicked("copy");
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard blocked. The link below is still there.
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border-[2.5px] border-ink bg-mint p-4 sm:p-5">
      <h2 className="text-balance font-display text-xl uppercase leading-none">
        Now make your kid do it
      </h2>
      <p className="text-pretty text-[0.925rem] font-semibold leading-snug text-ink/75">
        Send them this and they land straight on the grade picker.
      </p>
      <Button variant="ink" size="lg" onClick={share} className="w-full">
        {copied ? "Link copied" : "Send it to your kid"}
      </Button>
      <a
        href={`/?${CHILD_ENTRY_PARAM}`}
        className="text-center text-xs font-bold uppercase tracking-wide text-ink/60 underline decoration-2 underline-offset-2"
      >
        Or open the grade picker here
      </a>
    </div>
  );
}
