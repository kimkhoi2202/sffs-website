/**
 * SFFS analytics — the single source of truth for the custom event taxonomy.
 *
 * Everything client-side goes through the `posthog-js` singleton that
 * `instrumentation-client.ts` initializes. These helpers give each code seam a
 * typed, self-documenting call (1:1 with docs/analytics/posthog-tracking-plan.md
 * §2) instead of scattering stringly-typed `posthog.capture("...")` around.
 *
 * PRIVACY INVARIANT: no event here ever carries an email address or any PII. The
 * conversion event `email_captured` carries source + attribution only; the email
 * lives solely in Aurora. `scrubAndEnrich` is a belt-and-suspenders guard that
 * strips email/$ip from EVERY outbound event regardless of caller.
 */
import posthog from "posthog-js";
import type { CaptureResult } from "posthog-js";

/* --------------------------------------------------------------------------
 * Shared property vocabulary (kept small + reused — see plan §2.0)
 * ------------------------------------------------------------------------ */
export type CtaMethod = "click" | "key_t";
export type CtaLocation = "nav" | "hero" | "steps" | "cta_band";

/** `reason` values mapped 1:1 to the real client + /api/access-signup paths. */
export type ValidationFailReason =
  | "invalid_format_client" // client EMAIL_RE fails
  | "invalid_format_server" // API 400 (server regex / length)
  | "rate_limited" // API 429
  | "payload_too_large" // API 413
  | "network_error" // fetch throws (offline / unreachable)
  | "server_error"; // API 500 (proxy / Aurora failure)

export type SocialNetwork = "instagram" | "tiktok";
export type SocialLocation = "follow_us" | "footer";
export type ScrollDepth = 25 | 50 | 75 | 90 | 100;
export type SectionName =
  | "hero"
  | "how"
  | "comparison"
  | "features"
  | "testimonials"
  | "pricing"
  | "faq"
  | "cta_band"
  | "follow_us";

export const EMAIL_SOURCE = "pricing-get-access";

/* --------------------------------------------------------------------------
 * Attribution — derived super properties (plan §2.1 + §A)
 * ------------------------------------------------------------------------ */
const NAMED_PLATFORMS = ["tiktok", "instagram", "youtube"] as const;

/**
 * Derive a coarse traffic `platform` for the TikTok-vs-IG-vs-direct split:
 * prefer `utm_source` (Hermes always tags it), else fall back to the referring
 * domain (in-app browsers sometimes strip UTMs). Never throws.
 */
export function derivePlatform(): string {
  if (typeof window === "undefined") return "unknown";
  try {
    const utm = new URLSearchParams(window.location.search)
      .get("utm_source")
      ?.toLowerCase();
    if (utm) return NAMED_PLATFORMS.find((p) => utm.includes(p)) ?? utm;

    const ref = document.referrer;
    if (!ref) return "direct";
    const host = new URL(ref).hostname.toLowerCase();
    if (host.includes("tiktok")) return "tiktok";
    if (host.includes("instagram")) return "instagram";
    if (host.includes("youtube") || host.includes("youtu.be")) return "youtube";
    if (host === window.location.hostname) return "direct"; // internal nav
    return "other";
  } catch {
    return "unknown";
  }
}

export function isTouchDevice(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(pointer: coarse)").matches ?? false;
}

/**
 * Register the derived super properties so every event + person carries them.
 * Called from the SDK `loaded` callback. `platform` is ALSO injected in
 * `scrubAndEnrich` as a fallback so even the very first `$pageview` has it.
 */
export function registerLaunchSuperProperties(): void {
  posthog.register({ platform: derivePlatform(), is_touch: isTouchDevice() });
}

/* --------------------------------------------------------------------------
 * before_send — PII scrubber + platform enrichment (plan §11.1)
 * ------------------------------------------------------------------------ */
const PII_KEYS = ["email", "email_address", "$ip"] as const;

let cachedPlatform: string | null = null;
function platformOnce(): string {
  if (cachedPlatform === null) cachedPlatform = derivePlatform();
  return cachedPlatform;
}

/**
 * Runs on EVERY outbound event. (1) hard-strips email/$ip from properties + the
 * person `$set`/`$set_once` bags — a guarantee no accidental PII ever leaves the
 * browser; (2) guarantees `platform` is present so the conversion funnel's
 * platform breakdown is never blank (including the first pageview).
 */
export function scrubAndEnrich(cr: CaptureResult | null): CaptureResult | null {
  if (!cr) return cr;
  for (const bag of [cr.properties, cr.$set, cr.$set_once]) {
    if (!bag) continue;
    for (const key of PII_KEYS) if (key in bag) delete bag[key];
  }
  if (cr.properties && cr.properties.platform == null) {
    cr.properties.platform = platformOnce();
  }
  return cr;
}

/* --------------------------------------------------------------------------
 * Per-browser opt-out — internal-traffic exclusion (see app/analytics-optout)
 *
 * Our analytics are ANONYMOUS (no stored IP/email to filter on server-side), so
 * the owner + teammates exclude their OWN visits with PostHog's recommended
 * opt-out-capturing. Two redundant signals keep it robust:
 *   1. PostHog's own consent store (via opt_out_capturing / opt_in_capturing).
 *   2. A durable localStorage flag we control, read SYNCHRONOUSLY at init in
 *      instrumentation-client.ts BEFORE the first pageview — so an opted-out
 *      browser sends ZERO events from the very first paint, and re-asserts the
 *      opt-out even if PostHog's own store was cleared.
 * This is ADDITIVE to the GPC/DNT suppression — it never re-enables anyone.
 * ------------------------------------------------------------------------ */

/** localStorage key for the durable per-browser opt-out flag ("1" == opted out). */
export const OPT_OUT_STORAGE_KEY = "sffs_ph_optout";

/** Synchronously read the durable opt-out flag. SSR- and error-safe. */
export function hasStoredOptOut(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(OPT_OUT_STORAGE_KEY) === "1";
  } catch {
    return false; // storage blocked (private mode / hardened browser)
  }
}

/** True if PostHog currently reports this browser opted out (incl. GPC/DNT). */
export function isCapturingOptedOut(): boolean {
  try {
    return posthog.has_opted_out_capturing();
  } catch {
    // PostHog not initialized (non-prod host guard) — fall back to our flag.
    return hasStoredOptOut();
  }
}

/**
 * Opt THIS browser OUT: set the durable flag AND stop PostHog capturing (which
 * persists in PostHog's own consent store). Idempotent; never throws.
 */
export function optOutThisBrowser(): void {
  try {
    window.localStorage.setItem(OPT_OUT_STORAGE_KEY, "1");
  } catch {
    /* storage blocked — the PostHog opt-out below still applies this session */
  }
  try {
    posthog.opt_out_capturing();
  } catch {
    /* not initialized here — the durable flag above is read at init on prod */
  }
}

/**
 * Re-enable analytics on THIS browser: clear the durable flag AND opt back in.
 * GPC/DNT still re-suppress on the next load if the browser sends them.
 * Idempotent; never throws.
 */
export function optInThisBrowser(): void {
  try {
    window.localStorage.removeItem(OPT_OUT_STORAGE_KEY);
  } catch {
    /* storage blocked — nothing to clear */
  }
  try {
    posthog.opt_in_capturing();
  } catch {
    /* not initialized here (non-prod host guard) */
  }
}

/* --------------------------------------------------------------------------
 * Event catalog (plan §2.2) — one typed helper per seam
 * ------------------------------------------------------------------------ */

/** Any "take the test" trigger — button click or the global "T" shortcut. */
export function trackTestCtaActivated(
  method: CtaMethod,
  location: CtaLocation,
): void {
  posthog.capture("test_cta_activated", { method, location });
}

/** Pricing / email-capture card enters the viewport. */
export function trackEmailFormViewed(): void {
  posthog.capture("email_form_viewed", { location: "pricing" });
}

export function trackEmailFieldFocused(): void {
  posthog.capture("email_field_focused");
}

/** First keystroke in the email input (fired once per mount). */
export function trackEmailCaptureStarted(): void {
  posthog.capture("email_capture_started");
}

/** Submit passed the client regex, at/just-before the fetch. */
export function trackEmailCaptureSubmitted(): void {
  posthog.capture("email_capture_submitted");
}

export function trackEmailCaptureValidationFailed(
  reason: ValidationFailReason,
): void {
  posthog.capture("email_capture_validation_failed", { reason });
}

/** THE conversion event. Source + attribution only — NEVER the email. */
export function trackEmailCaptured(): void {
  posthog.capture("email_captured", { source: EMAIL_SOURCE });
}

export function trackScrollDepthReached(depth: ScrollDepth): void {
  posthog.capture("scroll_depth_reached", { depth_pct: depth });
}

export function trackSectionViewed(section: SectionName): void {
  posthog.capture("section_viewed", { section_name: section });
}

export function trackHeroShapeDragged(p: {
  shape_id: string;
  shape_type?: string;
  shape_color?: string;
  is_touch: boolean;
}): void {
  posthog.capture("hero_shape_dragged", p);
}

export function trackHeroShapeThrown(p: {
  shape_id: string;
  throw_speed: number;
  is_touch: boolean;
}): void {
  posthog.capture("hero_shape_thrown", {
    ...p,
    throw_speed: Math.round(p.throw_speed),
  });
}

/** The $67 tier card enters the viewport. */
export function trackOfferViewed(): void {
  posthog.capture("offer_viewed", { price: 67, tier: "the_fella_test" });
}

export function trackSocialLinkClicked(
  network: SocialNetwork,
  location: SocialLocation,
): void {
  posthog.capture("social_link_clicked", { platform: network, location });
}

export function trackOutboundLinkClicked(p: {
  href: string;
  link_domain: string;
  location: string;
}): void {
  posthog.capture("outbound_link_clicked", p);
}

/* --------------------------------------------------------------------------
 * Attribution survey ("How did you find us?") — our OWN card that replaces the
 * native PostHog survey (plan §9). Self-reported channel rescues attribution
 * when in-app browsers strip UTMs/referrers. The answer is ALSO written to Aurora
 * `survey_responses`; these events keep it visible in PostHog funnels/dashboards.
 * ------------------------------------------------------------------------ */
export type AttributionSource =
  | "tiktok"
  | "instagram"
  | "friend"
  | "search"
  | "other";

/** The survey card became visible (right after the "You're in!" success state). */
export function trackAttributionSurveyShown(): void {
  posthog.capture("attribution_survey_shown");
}

/** THE attribution answer. Source only — NEVER the email or any PII. */
export function trackAttributionSurveyAnswered(source: AttributionSource): void {
  posthog.capture("attribution_survey_answered", { source });
}

/** The visitor skipped the survey. */
export function trackAttributionSurveyDismissed(): void {
  posthog.capture("attribution_survey_dismissed");
}
