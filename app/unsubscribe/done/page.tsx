import type { Metadata } from "next";

import { UnsubscribeShell } from "../shell";

/**
 * Where the POST lands once the suppression is written.
 *
 * ===========================================================================
 * IT CARRIES NO TOKEN, WHICH IS THE POINT OF REDIRECTING AT ALL
 * ===========================================================================
 * The handler could render this itself and save a round trip. It redirects
 * instead so that the URL sitting in the address bar afterwards, in browser
 * history, and in the Referer header of anything the reader clicks next, has
 * nothing personal in it. The token is spent by then and only ever existed in
 * a POST body.
 *
 * It is also the plain POST-redirect-GET fix: a refresh on this page re-renders
 * a static confirmation rather than re-submitting the form.
 *
 * NOT A SILENT ROUTE, deliberately. It is under /unsubscribe, so the analytics
 * guard covers it by prefix and it stays silent for free. Nothing here would be
 * worth measuring anyway.
 */
export const metadata: Metadata = {
  title: { absolute: "Unsubscribed | Smart Fella or Fart Smella" },
  robots: { index: false, follow: false, nocache: true },
};

export default function UnsubscribeDonePage() {
  return (
    <UnsubscribeShell heading="Done. No more emails.">
      {/*
        ONE JOKE, AND IT DOES NOT PUNISH THEM FOR LEAVING. The brand runs on the
        smart/fart binary and this is a moment to use it lightly, not to guilt
        somebody on the way out. No "are you sure?", no second ask, no offer of
        a reduced frequency. They said stop.
      */}
      <p>
        You are off the list. We will not send you notes about the app again,
        and you did not have to explain yourself, which is how it should be.
      </p>
      <p>
        The test is still there if you ever want another crack at it. No hard
        feelings, certified smart fella.
      </p>
      <p>
        Changed your mind, or think this was a mistake? Email{" "}
        <a href="mailto:smartfellaorfartsmella123@gmail.com">
          smartfellaorfartsmella123@gmail.com
        </a>
        .
      </p>
      <p className="pt-2">
        {/* Plain anchor for the same reason as the one on ../page.tsx: a
            client-side navigation would carry this route's session out with it
            rather than ending the document. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/">Back to the test</a>
      </p>
    </UnsubscribeShell>
  );
}
