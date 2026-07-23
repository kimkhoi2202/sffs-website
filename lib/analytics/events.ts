/**
 * SFFS analytics — the single source of truth for the custom event taxonomy.
 *
 * Everything client-side goes through the `posthog-js` singleton that
 * `instrumentation-client.ts` initializes. These helpers give each code seam a
 * typed, self-documenting call (1:1 with docs/analytics/posthog-tracking-plan.md
 * §2) instead of scattering stringly-typed `posthog.capture("...")` around.
 *
 * IDENTIFIED ANALYTICS: visitors are identified BY EMAIL on signup + survey answer
 * (see identifyOnSignup / identifyOnSurveyAnswer), so events + sessions tie to a
 * real person and full individual journeys are visible. The email lives on the
 * PERSON profile (via identify), not on the conversion event itself —
 * `email_captured` still carries source + attribution only. `scrubAndEnrich` strips
 * $ip from outbound events (belt) and enriches platform; it intentionally NO LONGER
 * strips email.
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
 * before_send — $ip belt + platform enrichment
 * ------------------------------------------------------------------------ */
// Email is intentionally CAPTURED now (identified analytics), so it is NOT in this
// list. Only $ip is stripped (belt) so raw IP never leaves the browser — PostHog
// still derives city/country geo server-side from the request.
const PII_KEYS = ["$ip"] as const;

let cachedPlatform: string | null = null;
function platformOnce(): string {
  if (cachedPlatform === null) cachedPlatform = derivePlatform();
  return cachedPlatform;
}

/**
 * Runs on EVERY outbound event. (1) strips `$ip` from properties + the person
 * `$set`/`$set_once` bags (belt — raw IP is never stored); (2) guarantees
 * `platform` is present so the conversion funnel's platform breakdown is never
 * blank (including the first pageview). Email is deliberately left intact so
 * identify()'s person properties reach PostHog.
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
 * Identity — IDENTIFIED analytics (email is the person identifier)
 * ------------------------------------------------------------------------ */

/** First-touch attribution from the landing URL, for identify()'s $set_once. */
function initialAttribution(): Record<string, string> {
  const out: Record<string, string> = {};
  if (typeof window === "undefined") return out;
  try {
    const p = new URLSearchParams(window.location.search);
    for (const k of [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_content",
      "utm_term",
    ] as const) {
      const v = p.get(k);
      if (v) out[`initial_${k}`] = v;
    }
    if (document.referrer) out.initial_referrer = document.referrer;
  } catch {
    // best-effort — attribution is nice-to-have, never block identify
  }
  return out;
}

/**
 * Identify the visitor BY EMAIL on signup. This ties every prior anonymous event
 * and every future event + session replay to a real person, so full individual
 * journeys are visible. Rich person properties are set for segmentation; the email
 * is intentionally stored on the person profile (identified analytics).
 */
export function identifyOnSignup(email: string): void {
  const platform = derivePlatform();
  const now = new Date().toISOString();
  posthog.identify(
    email, // the person identifier = the email address
    {
      // $set — latest-wins person properties
      email,
      signup_source: EMAIL_SOURCE,
      signup_platform: platform,
      is_touch: isTouchDevice(),
      last_signup_at: now,
    },
    {
      // $set_once — first-touch, never overwritten
      first_signup_at: now,
      initial_signup_platform: platform,
      ...initialAttribution(),
    },
  );
}

/**
 * On the attribution-survey answer: (re)identify by email (per the identified-
 * analytics decision) and record the self-reported acquisition channel on the
 * person profile. Falls back to setPersonProperties if the email is unavailable.
 */
export function identifyOnSurveyAnswer(
  email: string | undefined,
  source: AttributionSource,
  detail?: string,
): void {
  const set: Record<string, string> = { self_reported_source: source };
  if (detail) set.self_reported_detail = detail;
  if (email) posthog.identify(email, set);
  else posthog.setPersonProperties(set);
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
