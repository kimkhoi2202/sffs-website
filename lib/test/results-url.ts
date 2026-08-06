/**
 * The absolute URL of a results page.
 *
 * Its own module because two routes need it and getting it wrong is invisible
 * until someone taps a dead link in their inbox. A relative path is not
 * clickable in an email client, so this must always produce an absolute origin.
 *
 * Resolution order, most to least trustworthy:
 *   1. RESULTS_BASE_URL, when set. The explicit answer, and the only one that
 *      is right when the site sits behind a proxy or a custom domain.
 *   2. The request's own origin, derived from the forwarded headers. Correct on
 *      Vercel and correct on localhost, which covers everything today.
 *   3. The production domain, as a last resort so a misconfigured environment
 *      sends a link that works rather than one that does not.
 */
const FALLBACK_ORIGIN = "https://smartfellaorfartsmella.com";

export function resultsOrigin(request?: { headers: Headers }): string {
  const configured = process.env.RESULTS_BASE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");

  if (request) {
    const host =
      request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    if (host) {
      const proto =
        request.headers.get("x-forwarded-proto") ??
        (host.startsWith("localhost") || host.startsWith("127.0.0.1")
          ? "http"
          : "https");
      return `${proto}://${host}`;
    }
  }

  return FALLBACK_ORIGIN;
}

export function resultsUrlFor(token: string, request?: { headers: Headers }): string {
  return `${resultsOrigin(request)}/results/${encodeURIComponent(token)}`;
}

/* -------------------------------------------------------------------------
 * WHERE THE PAGE WAS OPENED FROM
 * -------------------------------------------------------------------------
 * There are now two ways onto a results page: the link in the email, and the
 * offer a returning visitor gets in a browser that remembers finishing (see
 * components/test/saved-result-offer.tsx).
 *
 * They have to stay separable, because `results_link_opened` answers exactly
 * one question — DID THE EMAIL ARRIVE — and it can only answer it if every
 * event under that name is somebody who opened an email. Letting the second
 * route file under the first would inflate deliverability with people who
 * never left the site, silently and permanently.
 *
 * A query parameter rather than a second event name, so the existing funnel
 * keeps counting and the split is a breakdown. Absent means the email, which
 * is what every link already in an inbox says.
 * ----------------------------------------------------------------------- */

/** Which route onto the results page this was. */
export type ResultsOpenSource = "email" | "saved";

/** The in-app path for the returning-visitor offer. Relative: same origin. */
export function savedResultHref(token: string): string {
  return `/results/${encodeURIComponent(token)}?from=saved`;
}

/** Read the parameter above, treating anything unrecognised as the email. */
export function resultsOpenSource(
  from: string | string[] | undefined,
): ResultsOpenSource {
  const value = Array.isArray(from) ? from[0] : from;
  return value === "saved" ? "saved" : "email";
}
