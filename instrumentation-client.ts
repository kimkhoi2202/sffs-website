/**
 * PostHog client init — runs automatically on the client (Next.js 15.3+/16
 * `instrumentation-client.ts` entry), before the app's React code, so the SDK is
 * ready by first paint. The <PostHogProvider> in app/layout.tsx shares THIS same
 * singleton so `usePostHog()` / feature-flag hooks work in client components.
 *
 * Config = "privacy-conscious FULL SEND" per docs/analytics/posthog-tracking-plan.md:
 * the site is general-audience, so autocapture, web analytics, web vitals, SESSION
 * REPLAY, and persistent cookies are ALL on — but with responsible guards that hold
 * regardless: inputs masked in replay (email never recorded), no request bodies,
 * email/$ip denylisted + scrubbed, and GPC/DNT honored.
 *
 * PROD-DOMAIN GUARD: PostHog only initializes on the production hostname(s). On
 * localhost, `*.vercel.app` previews, or any other host it never boots — so dev
 * sessions and preview traffic never pollute the single prod project (no stray
 * events, pageviews, or session replays).
 */
import posthog from "posthog-js";

import {
  hasStoredOptOut,
  registerLaunchSuperProperties,
  scrubAndEnrich,
} from "@/lib/analytics/events";

const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;

/** The only hosts allowed to send data to the prod PostHog project. */
const PROD_HOSTS = new Set([
  "smartfellaorfartsmella.com",
  "www.smartfellaorfartsmella.com",
]);

const isProdHost =
  typeof window !== "undefined" && PROD_HOSTS.has(window.location.hostname);

/**
 * Internal-traffic exclusion: read the durable per-browser opt-out flag
 * SYNCHRONOUSLY (before posthog.init) so a teammate who visited /analytics-optout
 * starts opted-out and sends ZERO events from the very first pageview — not only
 * after re-visiting the opt-out page. Only ever true when the explicit flag is
 * set, so normal visitors are unaffected. Additive to GPC/DNT (below).
 */
const optedOut = hasStoredOptOut();

if (isProdHost && key) {
  posthog.init(key, {
    // Reverse proxy (next.config.ts rewrites) to dodge ad-blockers; ui_host is
    // the PostHog app host so "view in PostHog" links resolve correctly.
    api_host: "/ingest",
    ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.posthog.com",
    defaults: "2026-05-30",

    // --- identity / persistence: FULL SEND (general-audience decision) ---
    person_profiles: "identified_only", // no profile minted for every anon tap
    persistence: "localStorage+cookie", // persistent cookies (full send)
    cross_subdomain_cookie: true, // one identity across apex + www

    // --- capture surfaces ---
    autocapture: true,
    capture_pageview: "history_change", // SPA-safe pageviews (also set by defaults)
    capture_pageleave: true,
    capture_performance: { web_vitals: true, network_timing: true }, // vitals + timing, NO bodies
    enable_heatmaps: true, // clickmaps / scrollmaps (plan §6)

    // --- session replay ON, privacy-guarded (plan §5) ---
    disable_session_recording: false,
    enable_recording_console_log: false, // W2: never capture console logs in replay (max privacy)
    session_recording: {
      maskAllInputs: true, // masks the email field — typed values never recorded
      maskTextSelector: "[data-ph-mask]", // opt-in extra masking hook (form wrapper)
      recordBody: false, // NEVER capture request/response bodies (the POST body has the email)
      recordHeaders: false,
    },

    // --- responsible guards that hold even in full-send mode (plan §11.1) ---
    respect_dnt: true, // honor Do Not Track
    // Internal-traffic exclusion: start opted-out iff THIS browser set the durable
    // flag via /analytics-optout. No effect for normal visitors (flag absent).
    opt_out_capturing_by_default: optedOut,
    // When opted out, also silence everything else that would still touch /ingest
    // even with capture off — feature-flag eval (/flags), surveys (/api/surveys),
    // and PostHog's lazy-loaded extension scripts (/ingest/static/*.js: web-vitals,
    // exception + dead-click autocapture, recorder). Net result: an excluded
    // browser hits /ingest ZERO times. All default false ⇒ IDENTICAL behavior for
    // normal visitors (optedOut=false); PostHog still inits, so /analytics-optout
    // can re-enable live.
    advanced_disable_flags: optedOut,
    disable_surveys: optedOut,
    disable_external_dependency_loading: optedOut,
    property_denylist: ["$ip", "email", "email_address"], // hard PII guard
    before_send: scrubAndEnrich, // belt-and-suspenders PII scrub + platform enrich

    loaded: (ph) => {
      // Re-assert the durable per-browser opt-out into PostHog's own consent
      // store (belt-and-suspenders alongside opt_out_capturing_by_default above,
      // in case that store was cleared). Only when the explicit flag is present —
      // never opts a normal visitor out. See /analytics-optout.
      if (optedOut) ph.opt_out_capturing();
      registerLaunchSuperProperties();
      // Honor Global Privacy Control: opt out even though the default is full send.
      const gpc = (navigator as Navigator & { globalPrivacyControl?: boolean })
        .globalPrivacyControl;
      if (gpc === true) ph.opt_out_capturing();
      if (process.env.NODE_ENV === "development") ph.debug();
    },
  });
}
