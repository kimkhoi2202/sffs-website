/**
 * The card a returning visitor meets above the opening fork.
 *
 * ===========================================================================
 * AN OFFER, NOT A REDIRECT
 * ===========================================================================
 * The problem it solves is a real observation: somebody completed the test and
 * came back seventeen minutes later to `step: "audience"`, the front door,
 * with no way back to what they had earned. The flow's own state is per-tab by
 * design, so closing the tab is all it takes.
 *
 * The obvious fix is to restore them straight onto their results. It is the
 * wrong one, for three reasons and in that order:
 *
 *   1. THIS IS A FAMILY DEVICE. The whole product is a parent handing a phone
 *      to a child. localStorage is shared by everyone who picks that phone up,
 *      and lib/test/session.ts already rejected localStorage for mid-test
 *      state on exactly this ground — one child should not be dropped into
 *      another's attempt. Opening on somebody else's score is the same
 *      mistake with a better outcome attached.
 *   2. COMING BACK USUALLY MEANS COMING BACK FOR SOMETHING. A parent who took
 *      it and returns to set their kid up should not have to get past their
 *      own result first. The fork is the thing the flow is built around and it
 *      stays the default.
 *   3. AN OFFER COSTS ONE TAP AND A REDIRECT COSTS A BACK BUTTON. The
 *      asymmetry is not close.
 *
 * So: a quiet card above the fork, and the fork exactly where it was.
 *
 * ===========================================================================
 * IT NAMES NOTHING
 * ===========================================================================
 * No score, no verdict, no grade. Partly because the stored pointer holds none
 * of them (see lib/test/saved-result.ts), and partly because that is the right
 * shape for a card that may be read by whoever picks the phone up next: seeing
 * the result takes a deliberate press.
 *
 * FLAT, WITH A SHADOWED BUTTON IN IT, which is the intro screen's pattern and
 * the same reasoning — the card is a sentence, the button is the thing you
 * press. Only the email gate and the quit modal lift off the page in this
 * flow.
 */
"use client";

import { Button } from "@/components/ui/button";
import { savedResultHref } from "@/lib/test/results-url";

export function SavedResultOffer({ token }: { token: string }) {
  return (
    <div className="flex w-full flex-col items-center gap-3 rounded-2xl border-[2.5px] border-ink bg-cream p-4 text-center sm:p-5">
      <h2 className="text-balance font-display text-xl uppercase leading-none">
        Your results are still here
      </h2>
      <p className="text-pretty text-[0.925rem] font-semibold leading-snug text-ink/75">
        You finished a test in this browser. Open those results again, or start
        a new one below.
      </p>
      <Button variant="green" size="md" href={savedResultHref(token)} className="w-full">
        See my results
      </Button>
    </div>
  );
}
