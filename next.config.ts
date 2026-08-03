import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The quiz now lives at the root (/). Keep old links working.
  async redirects() {
    return [
      {
        source: "/smart-or-fart",
        destination: "/",
        permanent: true,
      },
      // Route retirement: /parents -> /about. The old page addressed parents
      // about their children, which contradicts the 13+ positioning; its
      // substance now lives at /about addressed to the player. Permanent (308)
      // because /parents sat in the site-wide nav on every page, so assume it is
      // indexed and consolidate that signal onto /about.
      {
        source: "/parents",
        destination: "/about",
        permanent: true,
      },
      // --- Social vanity links (temporary 307, editable) ---
      // Short, memorable bio links that stamp the traffic source so PostHog
      // attributes the visit + any signup to the right platform. Temporary (307)
      // so we can retune the UTM mapping any time without a cached permanent
      // redirect. `utm_medium=social` per the acquisition spec.
      //
      // NOTE: `/tiktok` doubles as the internal Creator Studio tool, so it only
      // redirects for NON-authenticated visitors (no `tiktok_session` cookie) —
      // logged-in team members still get the Studio, and the connect flow starts
      // at /api/tiktok/auth (unaffected). Every other vanity path below is free,
      // so it is a plain unconditional redirect.
      {
        source: "/tiktok",
        missing: [{ type: "cookie", key: "tiktok_session" }],
        destination: "/?utm_source=tiktok&utm_medium=social",
        permanent: false,
      },
      {
        source: "/instagram",
        destination: "/?utm_source=instagram&utm_medium=social",
        permanent: false,
      },
      {
        source: "/youtube",
        destination: "/?utm_source=youtube&utm_medium=social",
        permanent: false,
      },
      {
        source: "/reddit",
        destination: "/?utm_source=reddit&utm_medium=social",
        permanent: false,
      },
      {
        source: "/x",
        destination: "/?utm_source=x&utm_medium=social",
        permanent: false,
      },
      {
        source: "/threads",
        destination: "/?utm_source=threads&utm_medium=social",
        permanent: false,
      },
      // --- Team vanity link: Hermes content-pipeline dashboard (temporary 307) ---
      // Short, bookmarkable link to the Hermes dashboard on the box's Elastic IP.
      // A plain external redirect (NOT a proxy/rewrite) so the browser lands
      // directly on the box; permanent:false so we can retarget the IP/host any
      // time without a cached permanent redirect.
      {
        source: "/hermes-dashboard",
        destination: "http://3.228.178.144:8080/",
        permanent: false,
      },
      // --- Route rename: /analytics-optout -> /internal (internal-user toggle) ---
      // The internal-user toggle page moved to /internal. Keep the old bookmark
      // working; temporary (307) and Next.js forwards the query string, so
      // /analytics-optout?on=1 still reverts this browser to a normal visitor.
      {
        source: "/analytics-optout",
        destination: "/internal",
        permanent: false,
      },
    ];
  },

  // --- PostHog reverse proxy (dodge ad-blockers) ---
  // TikTok/IG traffic is heavily mobile and a meaningful slice runs ad-blockers
  // or privacy browsers that block *.posthog.com. We proxy PostHog ingestion +
  // static assets through our own domain under /ingest, and point posthog-js at
  // `api_host: "/ingest"` (see instrumentation-client.ts). Vercel serves these
  // rewrites natively. The static rule MUST come before the catch-all so asset
  // requests (recorder.js, surveys, web-vitals, array/) resolve to the assets
  // host; everything else (event capture, /flags, /e) goes to the ingestion host.
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
  },
};

export default nextConfig;
