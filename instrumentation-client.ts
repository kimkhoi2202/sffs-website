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
  hasStoredInternal,
  registerLaunchSuperProperties,
  scrubAndEnrich,
} from "@/lib/analytics/events";
import { initGoogleTag } from "@/lib/analytics/google-tag";

const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;

/** The only hosts allowed to send data to the prod PostHog project. */
const PROD_HOSTS = new Set([
  "smartfellaorfartsmella.com",
  "www.smartfellaorfartsmella.com",
]);

const isProdHost =
  typeof window !== "undefined" && PROD_HOSTS.has(window.location.hostname);

/**
 * Internal-user tag: read the durable per-browser flag SYNCHRONOUSLY (before
 * posthog.init) so a teammate who marked this browser internal via
 * /internal has `is_internal: true` registered BEFORE the first capture.
 * Their events STILL flow — they're just stamped internal and filtered out of the
 * public metrics by the project's test-account filter. Only ever true when the
 * explicit flag is set, so normal visitors are unaffected. Additive to GPC/DNT.
 */
const isInternal = hasStoredInternal();

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
    property_denylist: ["$ip", "email", "email_address"], // hard PII guard
    before_send: scrubAndEnrich, // PII scrub + platform enrich + internal-user stamp

    loaded: (ph) => {
      // Stamp this browser's events as internal BEFORE first capture when the
      // durable flag is set (belt-and-suspenders alongside the before_send
      // enforcement + the SDK-persisted super-property). Only when the explicit
      // flag is present — never tags a normal visitor. See /internal.
      if (isInternal) ph.register({ is_internal: true });
      registerLaunchSuperProperties();
      // Honor Global Privacy Control: opt out even though the default is full send.
      const gpc = (navigator as Navigator & { globalPrivacyControl?: boolean })
        .globalPrivacyControl;
      if (gpc === true) ph.opt_out_capturing();
      if (process.env.NODE_ENV === "development") ph.debug();
    },
  });
}

/**
 * The Google Ads tag (gtag.js), behind the SAME prod-host guard as PostHog.
 *
 * That guard matters more here than it does for analytics: every localhost run
 * and every `*.vercel.app` preview that fired a conversion would be teaching a
 * live ad set what a customer looks like using the developer. There is no
 * equivalent of PostHog's "tag it and filter later" on an ad platform.
 *
 * Runs outside the `key &&` check above because the two vendors are configured
 * independently — the tag should still boot on a deploy with no PostHog key.
 */
initGoogleTag({ enabled: isProdHost, isInternal });
