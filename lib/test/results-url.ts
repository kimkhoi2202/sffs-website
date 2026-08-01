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
