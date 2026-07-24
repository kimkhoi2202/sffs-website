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
  // Stamp events from an internal browser so the project's "internal & test
  // users" filter can exclude them from the PUBLIC metrics. Events still record
  // — they're just tagged. Enforced here (on EVERY event) as a belt-and-suspenders
  // guarantee alongside the registered super-property, so even the first pageview
  // of a fresh load is tagged. See app/internal.
  if (cr.properties && hasStoredInternal()) {
    cr.properties[INTERNAL_PROPERTY] = true;
  }
  return cr;
}

/* --------------------------------------------------------------------------
 * Per-browser INTERNAL-USER toggle (see app/internal)
 *
 * The owner + teammates mark their OWN browser as internal so their visits are
 * EXCLUDED FROM THE PUBLIC METRICS without vanishing: events still flow to
 * PostHog, they're just stamped `is_internal: true` and filtered out by the
 * project's "internal & test users" test-account filter. Two redundant signals:
 *   1. A PostHog super-property (posthog.register / unregister) — persisted by
 *      the SDK and attached to every event.
 *   2. A durable localStorage flag we control, read SYNCHRONOUSLY at init so the
 *      stamp is applied BEFORE the first capture and re-enforced in `before_send`
 *      on EVERY outbound event (guarantees even the first pageview is tagged).
 * Additive to GPC/DNT: marking internal keeps events flowing, but GPC/DNT still
 * suppress capture entirely when the browser asks for it.
 * ------------------------------------------------------------------------ */

/** localStorage key for the durable per-browser "internal user" flag ("1" == internal). */
export const INTERNAL_STORAGE_KEY = "sffs_ph_internal";

/** The event property stamped on every event from an internal browser. */
export const INTERNAL_PROPERTY = "is_internal";

/** Legacy hard-opt-out key (superseded by the internal toggle); cleaned up on toggle. */
const LEGACY_OPT_OUT_KEY = "sffs_ph_optout";

/**
 * Module cache of the internal flag so `before_send` (runs on EVERY event) never
 * hits localStorage per-event. Initialized lazily from storage and kept live by
 * markInternalUser / clearInternalUser, so a same-session toggle takes effect
 * immediately (no stale reads).
 */
let internalCache: boolean | null = null;

/** Synchronously read the durable internal flag. SSR- and error-safe. */
export function hasStoredInternal(): boolean {
  if (internalCache !== null) return internalCache;
  if (typeof window === "undefined") return false;
  try {
    internalCache = window.localStorage.getItem(INTERNAL_STORAGE_KEY) === "1";
  } catch {
    internalCache = false; // storage blocked (private mode / hardened browser)
  }
  return internalCache;
}

/** Whether THIS browser is currently marked internal (drives the toggle UI). */
export function isInternalUser(): boolean {
  return hasStoredInternal();
}

/**
 * Mark THIS browser as internal: persist the flag + register the `is_internal`
 * super-property so every event is stamped. Also opts back in (no `$opt_in`
 * noise) if a legacy hard opt-out was set, so a previously-excluded teammate
 * starts recording again — tagged internal. Idempotent; never throws.
 */
export function markInternalUser(): void {
  internalCache = true;
  try {
    window.localStorage.setItem(INTERNAL_STORAGE_KEY, "1");
    window.localStorage.removeItem(LEGACY_OPT_OUT_KEY);
  } catch {
    /* storage blocked — the super-property below still stamps this session */
  }
  try {
    if (posthog.has_opted_out_capturing()) {
      posthog.opt_in_capturing({ captureEventName: false });
    }
    posthog.register({ [INTERNAL_PROPERTY]: true });
  } catch {
    /* not initialized here (non-prod host guard) — init re-applies from the flag */
  }
}

/**
 * Make THIS browser a normal visitor again: clear the flag + unregister the
 * super-property so events are no longer stamped internal. Idempotent; never throws.
 */
export function clearInternalUser(): void {
  internalCache = false;
  try {
    window.localStorage.removeItem(INTERNAL_STORAGE_KEY);
    window.localStorage.removeItem(LEGACY_OPT_OUT_KEY);
  } catch {
    /* storage blocked — nothing to clear */
  }
  try {
    posthog.unregister(INTERNAL_PROPERTY);
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

/**
 * The visitor reached the bottom of the landing page (fired once per load).
 * A discrete, explicitly-named funnel step — cleaner than filtering
 * `scroll_depth_reached` on `depth_pct = 100`, which still also fires.
 */
export function trackScrolledToBottom(): void {
  posthog.capture("scrolled_to_bottom");
}

export function trackSectionViewed(section: SectionName): void {
  posthog.capture("section_viewed", { section_name: section });
}

/**
 * The pricing section ("Settle it for the price of a coffee") crossed into the
 * viewport (fired once per load). A dedicated funnel step for the pricing view —
 * complements `section_viewed{pricing}` + `offer_viewed` with a clean name.
 */
export function trackPricingSectionViewed(): void {
  posthog.capture("pricing_section_viewed", { location: "pricing" });
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
