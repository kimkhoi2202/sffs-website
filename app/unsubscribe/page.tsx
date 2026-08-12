import type { Metadata } from "next";

import { decodeUnsubscribeToken } from "@/lib/email/unsubscribe-token";

import { UnsubscribeShell } from "./shell";

/**
 * The unsubscribe confirmation page.
 *
 * ===========================================================================
 * THIS GET DOES NOT UNSUBSCRIBE ANYBODY, AND THAT IS THE WHOLE DESIGN
 * ===========================================================================
 * The obvious build is "GET the link, you are unsubscribed". It is wrong, and
 * the way it fails is quiet. Corporate mail scanners, link-safety services and
 * mail clients FETCH every URL in a message before a human sees it, some of
 * them within seconds of delivery. A GET that mutates hands those scanners the
 * power to unsubscribe people who never opened the mail, and the person finds
 * out months later when they notice they stopped hearing from us. Nothing in
 * any log looks wrong, because from the server's side a scanner and a reader
 * are the same request.
 *
 * So the split is the ordinary HTTP one, and it costs the reader one tap:
 *
 *   GET   renders this page. Reads the token, changes nothing.
 *   POST  performs it. Mutating, idempotent, and unreachable by pre-fetch
 *         because nothing pre-fetches a POST.
 *
 * ONE TAP IS STILL ONE-CLICK. No sign-in, no typing the address again, no
 * JavaScript: it is a plain HTML form with a single button, so it works with
 * scripting off and in a text browser. And for Gmail and Yahoo, who honour
 * RFC 8058, there is no tap at all: `List-Unsubscribe-Post` sends them straight
 * to the POST handler and the reader never sees this page. The one-click
 * promise is kept by the header; this page is for the person who clicked the
 * link in the body.
 *
 * ===========================================================================
 * NO ANALYTICS REACHES THIS ROUTE
 * ===========================================================================
 * The URL carries a token that decodes to an email address, so the failure to
 * avoid is the one that already happened once on this site: in August 2026 the
 * Google Ads tag was found shipping decodable child result tokens to Google
 * simply by being loaded on /results/[token]. No event had to fire.
 *
 * Two guards, both asserted in scripts/verify-unsubscribe.mjs rather than
 * reasoned about:
 *
 *   lib/analytics/events.ts   /unsubscribe is a SILENT ROUTE. `before_send`
 *                             returns null for every event while the browser
 *                             is here, so nothing reaches PostHog at all. That
 *                             is stronger than scrubbing the URL, because it
 *                             does not depend on having thought of every
 *                             property that might carry it.
 *   lib/analytics/google-tag  /unsubscribe is a deferred prefix, so gtag.js is
 *                             never inserted into the document.
 *
 * The POST also redirects to /unsubscribe/done, which carries no token, so the
 * address bar and any later Referer header are clean the moment the work is
 * done.
 */
export const metadata: Metadata = {
  title: { absolute: "Unsubscribe | Smart Fella or Fart Smella" },
  // NOINDEX, and `nofollow` with it. These URLs are personal, they are pasted
  // into places that get crawled, and there is nothing here worth a search
  // result. Belt and braces with the X-Robots-Tag on the API route.
  robots: { index: false, follow: false, nocache: true },
};

/** Never cached or prerendered: the token is per-request and per-person. */
export const dynamic = "force-dynamic";

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string | string[] }>;
}) {
  const params = await searchParams;
  const raw = Array.isArray(params.t) ? params.t[0] : params.t;
  const decoded = raw ? decodeUnsubscribeToken(raw) : null;

  if (!decoded?.ok) {
    return (
      <UnsubscribeShell heading="That link did not work">
        <p>
          The link was incomplete or has been mangled somewhere between the
          email and here, which usually means it got wrapped or shortened on the
          way. Nothing has changed either way.
        </p>
        <p>
          Email{" "}
          <a href="mailto:smartfellaorfartsmella123@gmail.com">
            smartfellaorfartsmella123@gmail.com
          </a>{" "}
          and say stop, and we will take you off by hand. You do not have to
          explain yourself.
        </p>
      </UnsubscribeShell>
    );
  }

  /*
    THE ADDRESS IS NOT SHOWN, and it is a real temptation to show it. "Are you
    sure you want to unsubscribe you@example.com" is friendlier and it is what
    most sites do. But anybody holding the link can then read the address out
    of the page, which turns a token designed to avoid putting an address in a
    URL into one that prints it on screen instead. The reader already knows
    which inbox they are in.

    The token rides through in a hidden field rather than the form's action, so
    the POST body carries it and the address bar does not.
  */
  return (
    <UnsubscribeShell heading="Stop the emails?">
      <p>
        One tap and we will stop sending you notes about the app. Your test
        results are not affected, and you can still take the test whenever you
        like.
      </p>
      <form
        method="POST"
        action="/api/unsubscribe"
        /*
          Belt and braces on top of the silent-route rule: even if that ever
          regressed, autocapture would not read a masked, no-capture form.
        */
        data-ph-no-capture
        data-ph-mask
        className="mt-6 flex flex-col items-center gap-3"
      >
        <input type="hidden" name="t" value={raw} />
        <button
          type="submit"
          className="btn-press inline-flex h-14 cursor-pointer items-center justify-center rounded-full border-[2.5px] border-ink bg-coral px-8 font-sans text-base font-bold uppercase leading-none tracking-wide text-ink shadow-hard-sm"
        >
          Yes, unsubscribe me
        </button>
        {/*
          A PLAIN ANCHOR, NOT `<Link>`, and the lint rule is disabled rather
          than obeyed. `<Link>` navigates client-side, which keeps this
          document — and the initialised PostHog SDK — alive while the path
          changes to "/". Anything still buffered from this route would then be
          flushed with isSilentRoute() reading false, which is the one way the
          token escapes the guard above. A full document navigation ends the
          page instead, and works with scripting off.
        */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/"
          className="min-h-11 px-2 text-center text-xs font-bold uppercase tracking-wide text-ink/50 underline decoration-2 underline-offset-2"
        >
          No, keep them coming
        </a>
      </form>
    </UnsubscribeShell>
  );
}
