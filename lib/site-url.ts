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
const CANONICAL = "https://www.smartfellaorfartsmella.com";

export function siteOrigin(): string {
  const configured = process.env.RESULTS_BASE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  return CANONICAL;
}
