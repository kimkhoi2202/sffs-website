/**
 * PostHog client init — runs automatically on the client (Next.js 15.3+/16
 * `instrumentation-client.ts` entry), before the app's React code, so the SDK is
 * ready by first paint. The <PostHogProvider> in app/layout.tsx shares THIS same
 * singleton so `usePostHog()` / feature-flag hooks work in client components.
 *
 * Config = "MAXIMUM tracking, IDENTIFIED" per the go-live decision: the site is
 * general-audience, so autocapture, web analytics, web vitals, SESSION REPLAY,
 * heatmaps, console-log capture, and persistent cookies are ALL on, and visitors
 * are IDENTIFIED BY EMAIL on signup (see lib/analytics/events.ts identifyOnSignup)
 * so events + sessions tie to a real person. The email is now captured as a person
 * identifier. TWO reversible safety guards remain: (1) the email INPUT stays masked
 * in session replay — we never record it being typed — and request/response bodies
 * are never recorded; and (2) GPC/DNT are honored. $ip stays denylisted so raw IP is
 * never stored (PostHog still derives city/country geo server-side).
 *
 * PROD-DOMAIN GUARD: PostHog only initializes on the production hostname(s). On
 * localhost, `*.vercel.app` previews, or any other host it never boots — so dev
 * sessions and preview traffic never pollute the single prod project (no stray
 * events, pageviews, or session replays).
 */
import posthog from "posthog-js";

import {
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
    enable_recording_console_log: true, // MAX coverage — capture console logs in replay (app never logs the email)
    session_recording: {
      // SAFETY DEFAULT (reversible): the email INPUT stays masked — we never record
      // the address being typed char-by-char. Say the word to unmask this too.
      maskAllInputs: true,
      maskTextSelector: "[data-ph-mask]", // opt-in extra masking hook (form wrapper)
      recordBody: false, // keep request/response bodies OFF (the POST body has the email)
      recordHeaders: false,
    },

    // --- retained guards (reversible) ---
    respect_dnt: true, // honor Do Not Track / GPC (privacy-policy promise)
    // Email is now CAPTURED as a person identifier (identified analytics); only $ip
    // stays denylisted so raw IP is never stored (geo still derived server-side).
    property_denylist: ["$ip"],
    before_send: scrubAndEnrich, // platform enrichment + $ip belt (no longer strips email)

    loaded: (ph) => {
      registerLaunchSuperProperties();
      // Honor Global Privacy Control: opt out even though the default is full send.
      const gpc = (navigator as Navigator & { globalPrivacyControl?: boolean })
        .globalPrivacyControl;
      if (gpc === true) ph.opt_out_capturing();
      if (process.env.NODE_ENV === "development") ph.debug();
    },
  });
}
