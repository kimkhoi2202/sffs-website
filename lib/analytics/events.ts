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

import type { EmailSource } from "../email-sources";

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

/**
 * `section_name` values.
 *
 * The first two are the only ones the current single-screen homepage can emit.
 * Everything below them is HISTORICAL: those sections were archived with the
 * old multi-section homepage on 2026-07-30 (see the restore note at the top of
 * app/page.tsx). They are kept in the union so historical data stays typed and
 * so restoring the old page needs no change here.
 */
export type SectionName =
  | "signup"
  | "footer"
  // historical, from the archived multi-section homepage:
  | "hero"
  | "how"
  | "comparison"
  | "features"
  | "testimonials"
  | "pricing"
  | "faq"
  | "cta_band"
  | "follow_us";

/**
 * The email-source vocabulary lives in lib/email-sources.ts, which has no
 * `posthog-js` import, because two SERVER routes need these values and pulling
 * a browser SDK into a Node bundle for three string constants is the wrong
 * shape. Re-exported here so analytics call sites still find them where they
 * expect to.
 */
export { EMAIL_SOURCES, isKnownEmailSource, type EmailSource } from "../email-sources";

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
 * A surface that REPORTS on the project must not also feed it.
 *
 * /dashboard reads this PostHog project and renders it. Left alone it also
 * captures its own pageviews, autocaptured clicks and session replays into the
 * very numbers it is displaying, so anyone with the passphrase quietly inflates
 * the traffic they came to read — and does it disproportionately, because at
 * five completed tests a handful of internal page loads is not noise, it is a
 * visible fraction of the chart.
 *
 * Dropped here rather than by skipping `posthog.init`, because init runs once
 * per page load and the flow in and out of this route is a client-side
 * navigation: a load-time guard would either miss the dashboard (arrived at
 * from elsewhere) or kill capture for the rest of the session (left for
 * elsewhere). `before_send` is the one place that sees every event with the
 * current URL, so the rule is exactly "while you are on this route, nothing
 * leaves", and normal capture resumes by itself on the way out.
 *
 * This is deliberately stronger than the `is_internal` stamp next door. That
 * one keeps events and tags them so a filter can exclude them; this route
 * should not be in the dataset at all, under any filter.
 */
function isSilentRoute(): boolean {
  if (typeof window === "undefined") return false;
  const p = window.location.pathname;
  return p === "/dashboard" || p.startsWith("/dashboard/");
}

/**
 * Runs on EVERY outbound event. (0) drops everything from the reporting
 * surfaces that must not appear in their own numbers; (1) hard-strips
 * email/$ip from properties + the person `$set`/`$set_once` bags — a guarantee
 * no accidental PII ever leaves the browser; (2) guarantees `platform` is
 * present so the conversion funnel's platform breakdown is never blank
 * (including the first pageview).
 */
export function scrubAndEnrich(cr: CaptureResult | null): CaptureResult | null {
  if (!cr) return cr;
  if (isSilentRoute()) return null;
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

/**
 * The email capture form enters the viewport.
 *
 * `location` was "pricing" until 2026-07-31, when the form stopped living in a
 * pricing card and became the homepage. Any saved insight filtering on
 * `location = pricing` needs repointing at `home_signup` to keep counting.
 */
export function trackEmailFormViewed(): void {
  posthog.capture("email_form_viewed", { location: "home_signup" });
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

/**
 * THE conversion event. Source + attribution only — NEVER the email.
 *
 * `source` is a REQUIRED argument rather than a constant baked into the body.
 * It used to be hardcoded to the old homepage's value, which meant that if this
 * were ever wired to a second surface it would file that surface's conversions
 * under the first one's tag, and nobody would notice because the event would
 * still be firing. The caller knows which surface it is; it should have to say.
 */
export function trackEmailCaptured(source: EmailSource): void {
  posthog.capture("email_captured", { source });
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
 * RETIRED 2026-07-31, kept only so historical data stays documented. There is
 * no pricing section on the site to view, and no price to view it at, so this
 * has no reachable call site. Do not re-wire it to the signup screen: a signup
 * screen is not a pricing view, and pointing this at it would silently redefine
 * every historical number.
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

/**
 * RETIRED 2026-07-31, kept only so historical data stays documented. It
 * hardcodes a $67 "the_fella_test" tier that the product no longer sells, and
 * the card it fired from is archived. No reachable call site.
 */
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
 * THE IQ TEST FUNNEL
 *
 * The test replaced the homepage on 2026-08-01 and is now the front door, so
 * this is the site's primary funnel:
 *
 *   $pageview
 *     -> test_fork_selected        (parent or kid)
 *     -> test_audience_selected    (parent branch only: themselves or their child)
 *     -> test_grade_selected       (child test only)
 *     -> test_started
 *     -> test_completed            (carries the score)
 *     -> test_results_gate_viewed
 *     -> test_email_submitted      (the attempt)
 *     -> email_captured            (server-side, only on a genuine new row)
 *
 * PRIVACY. Same posture as everything else here: no PII, ever. A score, a
 * grade and a verdict band are not personal data on their own, and the email
 * never leaves the browser for anywhere but Aurora. Note what is deliberately
 * ABSENT: no per-question answer events. Which options a specific person picked,
 * question by question, is a behavioural profile of a named child once it is
 * joined to their grade and their session recording, and there is no product
 * question worth that. Aggregate item difficulty, if it is ever wanted, should
 * come from a deliberate anonymous rollup rather than as a side effect of
 * instrumenting the runner.
 * ------------------------------------------------------------------------ */

/** Which door: taking it as a parent, or as a kid. */
export type TestFork = "parent" | "child";
/** Which test is actually being sat. */
export type TestAudience = "adult" | "child";

export function trackTestForkSelected(fork: TestFork): void {
  posthog.capture("test_fork_selected", { fork });
}

/** The parent branch's second fork: taking it themselves, or handing it over. */
export function trackTestAudienceSelected(audience: TestAudience): void {
  posthog.capture("test_audience_selected", { audience });
}

export function trackTestGradeSelected(grade: number): void {
  posthog.capture("test_grade_selected", { grade });
}

/**
 * Somebody arrived on the test. The first step of the funnel, and the
 * denominator every later rate is measured against.
 *
 * `version` is which homepage actually rendered, read from the same resolver
 * the page uses rather than hardcoded, so the moment the switch is flipped the
 * events say so. Without it, comparing v2's conversion to v3's means guessing
 * which visitors saw which from the date.
 */
/**
 * Every screen in the flow, as ONE event with a `step` property rather than an
 * event per screen.
 *
 * The question this has to answer is "where do people leave", and that is a
 * funnel over an ordered list of steps. With an event per screen, adding a step
 * later means the old funnels silently skip it. With one event, the funnel is a
 * breakdown of `step` and a new screen shows up in it the day it ships.
 *
 * Fires once per entry to a step, including re-entry: going back to the grade
 * picker and choosing again is a real thing a person did and the count should
 * show it.
 */
/**
 * Somebody arrived on a link a parent shared, closing the loop.
 *
 * Without this the share is a dead end in the data: `test_share_to_child_clicked`
 * says a link went out and nothing says one ever came back, so the loop's
 * conversion rate cannot be computed at all. It fires from the `?for=child`
 * seed in the flow.
 *
 * ===========================================================================
 * IT OVER-COUNTS THE PARENT HAND-OFF, AND `platform` IS HOW YOU SPLIT IT
 * ===========================================================================
 * This used to say `?for=child` was the only way to arrive in that state. It
 * is not, and has not been since /beat/[token] shipped. A stranger who opens
 * a shared CHILD result is sent to `/?for=child` by the challenge page's
 * "Take the test" button (see the `startHref` in app/beat/[token]/page.tsx),
 * so they file this event too — and they are not a parent handing a test to
 * their kid, which is the only thing this name describes.
 *
 * READ IT WITH A BREAKDOWN ON `platform`, NOT ON ITS OWN. A shared link is
 * tagged `utm_source=share` (see beatUrlFor in lib/test/share-url.ts) and
 * `derivePlatform` turns that into `platform: "share"`, while a genuine
 * parent-to-child hand-off is a bare `/?for=child` with no UTM at all and
 * cannot produce that value. So:
 *
 *   platform = "share"   -> a challenge recipient, from somebody's share
 *   platform ≠ "share"   -> the parent hand-off this event is named for
 *
 * The two are already separable, which is why this is a note rather than a
 * change: renaming the event or splitting it would silently redefine every
 * historical number filed under it, and the distinction is recoverable from
 * data already being collected.
 */
export function trackTestChildLinkOpened(): void {
  posthog.capture("test_child_link_opened");
}

export function trackTestStepViewed(p: {
  /** "fork" | "parent-intent" | "grade" | "intro" | "test" | "results" */
  step: string;
  /** Which build of the flow, so v2 and v3 funnels stay separable. */
  version: string;
  audience: TestAudience | null;
  grade: number | null;
}): void {
  posthog.capture("test_step_viewed", p);
}

/* --------------------------------------------------------------------------
 * PER-QUESTION
 *
 * This pair is the reason the rest of the funnel is worth having. "People drop
 * during the test" is not an actionable sentence; "we lose a third of them on
 * question four" is, and the gap between those two is exactly these two events.
 *
 * It is also the only cheap way to find ONE bad item. An item that loses 40% of
 * everyone who sees it is either broken or a difficulty cliff, and reviewing a
 * bank of 125 by eye will not find it, because a broken item does not look
 * broken to the person who wrote it.
 *
 * VOLUME. `question_viewed` fires ONCE PER QUESTION PER ATTEMPT, on first sight,
 * not on every render and not again when a child navigates back to a question
 * they have already seen. That caps it at 50 events for the longest test, which
 * is the number a drop-off funnel wants: re-views would inflate the middle of
 * the funnel and make the curve lie. `question_answered` fires on a deliberate
 * tap, and carries `changed` when it is replacing an earlier answer.
 *
 * NO PII, same as everything else here. An index, a type and a duration are not
 * a person. Note what is still deliberately absent: WHICH OPTION was picked.
 * Per-option data joined to a grade and a session recording is a behavioural
 * profile of a named child, and correctness plus timing answers every question
 * we actually have.
 * ------------------------------------------------------------------------ */

interface QuestionEventBase {
  test_id: string;
  audience: TestAudience;
  band: string;
  /** 1-based, so it reads the way the screen does: "4 of 50". */
  question_index: number;
  question_total: number;
  /** Stable id, so a single bad item can be found across banks. */
  question_id: string;
  /** The item type pill: SENTENCE COMPLETION, FIGURE MATRIX, and so on. */
  question_tier: string;
  question_domain: string;
}

export function trackQuestionViewed(p: QuestionEventBase): void {
  posthog.capture("question_viewed", p);
}

export function trackQuestionAnswered(
  p: QuestionEventBase & {
    correct: boolean;
    /** Milliseconds from the question appearing to this tap. */
    dwell_ms: number;
    /** True when this replaced an answer they had already given. */
    changed: boolean;
  },
): void {
  posthog.capture("question_answered", p);
}

/**
 * They walked out mid-test. Deliberately separate from the clock running out:
 * one is a decision about the product and the other is the product working as
 * designed, and averaging them together hides both.
 */
export function trackTestQuit(p: {
  test_id: string;
  audience: TestAudience;
  band: string;
  /** Where they were when they left, 1-based. */
  question_index: number;
  question_total: number;
  answered: number;
  elapsed_s: number;
}): void {
  posthog.capture("test_quit", p);
}

/** The clock hit zero. `test_completed` still follows; this says why. */
export function trackTestTimedOut(p: {
  test_id: string;
  audience: TestAudience;
  band: string;
  /** How far they had got when it stopped, 1-based. */
  question_index: number;
  question_total: number;
  answered: number;
}): void {
  posthog.capture("test_timed_out", p);
}

/** Threw the attempt away and went back to the start. */
export function trackTestRestarted(from_step: string): void {
  posthog.capture("test_restarted", { from_step });
}

export function trackTestStarted(p: {
  test_id: string;
  audience: TestAudience;
  band: string;
  grade: number | null;
  item_count: number;
  duration_s: number;
}): void {
  posthog.capture("test_started", p);
}

/**
 * A finished attempt.
 *
 * This event IS the sample described by `TestSubmission` in lib/test/types.ts.
 * It carries everything a per-band comparison would ever need — score, max,
 * band, test id, duration — so the data for an eventual "how you did against
 * everyone else" is accumulating from the first attempt, without a durable
 * store existing yet and without a single personal field being recorded.
 *
 * `band` is what any such comparison must group on, not `grade`: grades 7 and 8
 * sit the identical test, so pooling them is correct and splitting them would
 * be inventing a distinction. `grade` rides along because knowing which of the
 * two a player chose is useful for content work, and a grade on its own is not
 * a person.
 */
export function trackTestCompleted(p: {
  test_id: string;
  audience: TestAudience;
  /** The scoring cohort: "adult" or a bank id. Group on this, not on grade. */
  band: string;
  grade: number | null;
  score: number;
  max_score: number;
  percent: number;
  answered: number;
  verdict: string;
  elapsed_s: number;
  /** True when the clock ran out rather than the player finishing. */
  timed_out: boolean;
}): void {
  posthog.capture("test_completed", p);
}

/** The blurred results and the email box are on screen. */
export function trackTestResultsGateViewed(p: {
  test_id: string;
  audience: TestAudience;
}): void {
  posthog.capture("test_results_gate_viewed", p);
}

/**
 * A well-formed address was submitted at the gate. This is the ATTEMPT, and it
 * is deliberately separate from `test_email_sent`: the gap between the two is
 * exactly the send-failure rate, which is the number worth watching when the
 * only route to a result is an email that has to arrive.
 *
 * Note this is NOT the signup conversion either. `email_captured` still fires
 * once, server-side, and only when Aurora genuinely inserted a row. Firing a
 * client-side conversion here as well would double-count every one of them.
 */
export function trackTestEmailSubmitted(p: {
  test_id: string;
  audience: TestAudience;
  source: string;
}): void {
  posthog.capture("test_email_submitted", p);
}

/** The provider accepted the message. `resend` separates first sends from repeats. */
export function trackTestEmailSent(p: {
  test_id: string;
  audience: TestAudience;
  resend: boolean;
}): void {
  posthog.capture("test_email_sent", p);
}

/**
 * The send did not happen. `code` is the API's failure code (`send_failed`,
 * `send_cap`, `address_limited`, `rate_limited`, `network`, ...) — a short
 * enum, never a provider message, which can contain the recipient's address.
 */
export function trackTestEmailSendFailed(p: {
  test_id: string;
  audience: TestAudience;
  code: string;
}): void {
  posthog.capture("test_email_send_failed", p);
}

/** They asked for the same address to be mailed again (typo, or it never came). */
export function trackTestResendRequested(p: {
  test_id: string;
  audience: TestAudience;
}): void {
  posthog.capture("test_resend_requested", p);
}

/**
 * Someone opened a results page. The other half of the funnel's only real
 * question: did the email actually land.
 *
 * `source` is what keeps it able to answer that. There is a second route onto
 * that page now — a browser that remembers finishing offers the result back on
 * a return visit — and folding those in under the same name would inflate
 * deliverability with people who never opened an inbox. "email" is the default
 * for every link already sitting in one, so historical events read correctly
 * and the existing funnel keeps counting; the split is a breakdown.
 *
 * Carries no token. A token is a durable handle to one person's result page,
 * and putting one in an event stream turns a no-PII dataset into a keyring.
 */
export function trackResultsLinkOpened(p: {
  test_id: string;
  audience: TestAudience;
  /** "email" | "saved" — see ResultsOpenSource in lib/test/results-url.ts. */
  source: string;
}): void {
  posthog.capture("results_link_opened", p);
}

/**
 * The parent handed the test to their kid.
 *
 * THREE METHODS, BECAUSE THE CARD HAS THREE EXITS. It used to report two: the
 * native share sheet and the clipboard. The third is a plain anchor —
 * "Or open the grade picker here" — which navigated with no event at all, so a
 * parent who used it appeared to reach the child flow from nowhere. That is a
 * bad thing to be blind to on a sharing loop specifically, because the loop is
 * the growth mechanism and an untracked arm of it looks like no growth.
 *
 * `failed` is the fourth, and it exists for the same reason as the third. When
 * the OS sheet was dismissed and the clipboard then refused, the card fired
 * nothing at all — so the one outcome worth knowing about, a press that got the
 * person nowhere, was the only one the data could not see. It read as no press.
 */
export function trackTestShareToChildClicked(
  method: "link" | "copy" | "open" | "failed",
): void {
  posthog.capture("test_share_to_child_clicked", { method });
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
  | "youtube"
  | "reddit"
  | "x"
  | "threads"
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

/* --------------------------------------------------------------------------
 * Sharing a result — the growth loop
 *
 * The one place a result leaves the person who earned it, so it is the one
 * place the loop can be measured. Two mechanisms, because there are two ways
 * out: the OS share sheet, which carries the 1080x1920 card wherever the
 * browser will take a file, and the clipboard, which is both a deliberate
 * choice and where a sheet that never appeared lands.
 *
 * WHAT THESE CARRY, AND WHAT THEY MUST NEVER CARRY. The same fields the rest
 * of the test taxonomy uses: test id, audience, verdict band. No token, for
 * the reason spelled out on `trackResultsLinkOpened` — a token is a durable
 * handle to one person's result page, and a stream of them turns a no-PII
 * dataset into a keyring. No address, obviously; `scrubAndEnrich` would strip
 * one anyway, and nothing here has an address to pass.
 * ------------------------------------------------------------------------ */

/**
 * How a share left the device: the TRANSPORT.
 *
 * TWO REACHABLE VALUES. `image_download` and `web_intent` were the other two
 * and both are HISTORICAL: they belonged to a share sheet of our own, which
 * saved the PNG to the device and opened x.com, wa.me and reddit.com in a new
 * tab. That sheet was removed in favour of the OS one (see the note at the top
 * of components/test/share-results.tsx), so nothing emits either value any
 * more. Events carrying them are still in the data and still mean what they
 * meant; they are named here so a chart that includes them is readable, and
 * left out of the union so nobody wires a call site to one by accident.
 *
 * THERE IS NO `destination` PROPERTY ANY MORE. It carried WHERE a share went,
 * which only our own sheet could know — `navigator.share()` deliberately does
 * not say which app was chosen. With the sheet gone the property could only
 * repeat the mechanism, so it was dropped rather than left as a duplicate.
 * `ShareDestination` in lib/test/share-url.ts survives for the link's own
 * `utm_content` tag, which is a different question: how the link left, not
 * where it landed.
 */
export type ShareMechanism = "native_sheet" | "copy_link";

interface ShareEventBase {
  test_id: string;
  audience: TestAudience;
  /** The verdict band, e.g. "smart-fella". Group on this. */
  verdict: string;
}

/**
 * A share was asked for. Fires the moment the control is pressed, BEFORE the
 * browser is involved, so it counts intent rather than success.
 *
 * The gap between this and `test_result_share_completed` is the number worth
 * watching: on the native sheet it is the share-sheet abandon rate, and it is
 * invisible if only completions are recorded.
 */
export function trackTestResultShareInitiated(
  p: ShareEventBase & { mechanism: ShareMechanism },
): void {
  posthog.capture("test_result_share_initiated", p);
}

/**
 * The share actually happened, AS FAR AS THE PLATFORM WILL SAY.
 *
 * That qualifier is load-bearing and the number should be read with it in
 * mind. `navigator.share()` resolves when the sheet reports success, and it
 * deliberately does NOT say which app was chosen — that is a privacy property
 * of the API, not a gap to work around. Copy reports when the clipboard write
 * resolved. Neither can tell us whether anything was ever posted.
 *
 * A FALLBACK FILES ITS OWN COMPLETION, so `initiated` and `completed` do not
 * pair off by mechanism. A tap that asked for the OS sheet, got nothing, and
 * ended on the clipboard files `initiated(native_sheet)`,
 * `failed(native_sheet, sheet_never_opened)` and `completed(copy_link)`, in
 * that order. Count taps on `initiated` and successes on `completed`; do not
 * expect the two to match per mechanism.
 */
export function trackTestResultShareCompleted(
  p: ShareEventBase & { mechanism: ShareMechanism },
): void {
  posthog.capture("test_result_share_completed", p);
}

/**
 * The share sheet opened and the person backed out of it.
 *
 * Its own event rather than a `reason` on the failure event, because it is not
 * a failure: the machinery worked and they changed their mind. Folding the two
 * together would make a healthy sheet look broken.
 */
export function trackTestResultShareDismissed(
  p: ShareEventBase & { mechanism: ShareMechanism },
): void {
  posthog.capture("test_result_share_dismissed", p);
}

/**
 * The share could not be completed. `reason` is a short enum of our own, never
 * a thrown message: DOMException text varies by browser and has no contract.
 */
/**
 * `sheet_never_opened` IS THE ONE TO WATCH. It is the only signal that
 * `navigator.share()` was called, returned a promise, and never settled —
 * the desktop failure that produced a dead button twice in one day. Nothing
 * else in this taxonomy can see it happening in the wild, because from every
 * other angle it looks like somebody who tapped and walked away.
 */
export function trackTestResultShareFailed(
  p: ShareEventBase & {
    mechanism: ShareMechanism;
    /** "card_fetch" | "share_api" | "sheet_never_opened" | "clipboard" */
    reason: string;
  },
): void {
  posthog.capture("test_result_share_failed", p);
}

/**
 * Somebody opened a shared link and saw the challenge. The far end of the loop
 * and the only evidence a share reached a human.
 *
 * Pairs with `test_result_share_completed` the way `results_link_opened` pairs
 * with `test_email_sent`. `platform` is already a super property and the
 * shared URL carries `utm_source=share`, so the two together separate shared
 * traffic from every other arrival with no extra field here.
 */
export function trackTestChallengeViewed(p: ShareEventBase): void {
  posthog.capture("test_challenge_viewed", p);
}
