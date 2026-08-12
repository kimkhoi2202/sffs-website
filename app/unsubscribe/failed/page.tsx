import type { Metadata } from "next";

import { UnsubscribeShell } from "../shell";

/**
 * Where the POST lands when the suppression write did NOT succeed.
 *
 * This page exists because the alternative is showing somebody a confirmation
 * for something that did not happen. They would stop chasing it, the next send
 * would arrive anyway, and from their side we would have lied. A visible
 * failure with a human to write to is worse-looking and far better behaved.
 */
export const metadata: Metadata = {
  title: { absolute: "Unsubscribe | Smart Fella or Fart Smella" },
  robots: { index: false, follow: false, nocache: true },
};

export default function UnsubscribeFailedPage() {
  return (
    <UnsubscribeShell heading="That did not save">
      <p>
        Something on our end broke while we were taking you off the list, so we
        are not going to pretend it worked. You are still on it.
      </p>
      <p>
        Two options, both fine. Go back and{" "}
        <a href="/unsubscribe">try the link again</a>, because this sort of
        thing is usually temporary. Or email{" "}
        <a href="mailto:smartfellaorfartsmella123@gmail.com">
          smartfellaorfartsmella123@gmail.com
        </a>{" "}
        with the word stop, and a human will do it by hand.
      </p>
      <p>Sorry. That is our mess, not yours.</p>
    </UnsubscribeShell>
  );
}
