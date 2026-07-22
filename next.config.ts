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
