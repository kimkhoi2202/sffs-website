/**
 * The site's canonical origin, for the places that need an absolute URL with no
 * request to derive one from.
 *
 * Separate from lib/test/results-url.ts, which answers a related but different
 * question. That one resolves the origin FOR A GIVEN REQUEST and prefers the
 * request's own forwarded host, because a results link has to work from
 * whatever host the person is actually on. This one runs at build time inside
 * `robots.ts` and `sitemap.ts`, where there is no request, and it must produce
 * the canonical host rather than whichever preview deployment happens to be
 * building — a sitemap listing a `*.vercel.app` origin is worse than none.
 */
/**
 * Exported because the results email needs it DIRECTLY rather than through
 * `siteOrigin()`. A link in an inbox is read outside the deployment that sent
 * it, so a localhost or preview origin is never useful there — it is a broken
 * image with no upside. The results LINK still honours RESULTS_BASE_URL, since
 * a developer testing the flow does want their own link to work.
 */
export const CANONICAL_ORIGIN = "https://www.smartfellaorfartsmella.com";

const CANONICAL = CANONICAL_ORIGIN;

export function siteOrigin(): string {
  const configured = process.env.RESULTS_BASE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  return CANONICAL;
}
