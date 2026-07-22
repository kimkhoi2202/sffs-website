# PostHog Analytics & Tracking Plan — Smart Fella or Fart Smella (SFFS)

> **Status:** PLAN / brainstorm only. No SDK is installed and no code has been changed. This document is the blueprint to review + approve before implementation. Implementation begins only after (a) the PostHog keys are provided and (b) the privacy/compliance decision in §11 is made.

---

## 0. TL;DR

- **Goal of the site:** turn social traffic (TikTok + Instagram short quiz videos) into **email signups**, and eventually **$67 purchases**. There is **no on-site quiz yet** — `/` is a single-page landing.
- **The one number that matters:** **email-signup conversion rate, segmented by traffic source** (TikTok vs Instagram vs direct), and ideally **per social post**.
- **Primary conversion event:** `email_captured` (fired on the "You're in!" success state of `components/quiz/get-access-form.tsx`).
- **Biggest analytics unlock:** a disciplined **UTM scheme** (see §A) + a **per-post short-link redirect** so PostHog can attribute every visit and signup back to the exact TikTok/IG post and A/B hook that drove it.
- **Biggest risk:** the audience **skews toward kids/parents**, but the current privacy policy declares the site "not directed to children under 13." Session replay + persistent tracking on a potentially child-directed site has real **COPPA / GDPR‑K** exposure. This is a **legal decision, not a config toggle** (see §11).
- **Install recommendation:** **manual, privacy-first install** (optionally seeded by the PostHog wizard PR, but reviewed line-by-line). The wizard's generic defaults must not go live unreviewed given the audience.

---

## 1. Capture setup

### 1.1 Stack facts that shape this plan (from reading the repo)
| Fact | Source | Implication |
|---|---|---|
| Next.js **16.2.10**, App Router, React **19.2.4**, on Vercel | `package.json` | Use `instrumentation-client.ts` (Next 15.3+) — the modern, fast init path. |
| Single-page landing; all sections on `/` | `app/page.tsx` | Funnels are **within-page**; engagement is measured by scroll + section-view + interactions, not multi-page navigation. |
| **Clean URLs** — in-page nav never writes `#hash` | `components/quiz/smooth-scroll.tsx` | `$current_url` stays clean (good), but section engagement **must** come from IntersectionObserver events, not hashchange. |
| **Lenis** smooth-scroll + GSAP ScrollTrigger drive scrolling | `smooth-scroll.tsx` | Scroll-depth tracking should hook Lenis/ScrollTrigger or IntersectionObserver, not a naive `window` scroll listener (it still fires, but ST is the source of truth). |
| Email form is a client state machine: idle→submitting→success/error | `get-access-form.tsx` | Perfect, well-defined seams to instrument each funnel micro-step + typed error reasons. |
| `POST /api/access-signup` (Node runtime) → Lambda → Aurora | `app/api/access-signup/route.ts`, `lib/email-store.ts` | Enables a **server-side** truth event via `posthog-node` (P1). Email never needs to reach PostHog. |
| Heavy client animation (GSAP, `motion`, draggable shape overlay) | `smart-fart-hero.tsx`, `page-shapes.tsx` | Watch bundle weight + mobile perf; shapes are DOM transforms (replay-friendly, no `<canvas>`). |
| No analytics installed today | grep | Greenfield — we set conventions correctly from day one. |
| `metadataBase` is apex, TikTok redirect uses `www.` | `app/layout.tsx`, `.env.example` | Pick one canonical host for cookie domain + UTM base (recommend `https://www.smartfellaorfartsmella.com`). |

### 1.2 Initialization (recommended config)

Create `instrumentation-client.ts` at repo root (Next.js runs it on the client automatically). Wrap the app with `PostHogProvider` from `posthog-js/react` in `app/layout.tsx` so hooks (`usePostHog`, `useFeatureFlagEnabled`) work in client components.

```ts
// instrumentation-client.ts  (PROPOSED — do not add yet)
import posthog from "posthog-js";

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  api_host: "/ingest",                         // reverse proxy (see §1.5)
  ui_host: "https://us.posthog.com",           // correct "view in PostHog" links
  defaults: "2026-05-30",                        // latest sane defaults (see §1.3)

  // --- privacy-first (see §11) ---
  person_profiles: "identified_only",           // no profile for every anon visitor (also the SDK default)
  persistence: "memory",                         // cookieless by default; upgrade to localStorage+cookie ONLY on consent
  property_denylist: ["$ip"],                    // don't attach raw IP to events (geo still derived server-side by PostHog; can also disable at project level)
  autocapture: true,
  capture_pageview: "history_change",            // set by defaults; SPA-safe pageviews
  capture_pageleave: true,

  // --- session replay: OFF at init; started explicitly + gated (see §5, §11) ---
  disable_session_recording: true,

  session_recording: {
    maskAllInputs: true,                          // masks the email field (belt) — never capture typed values
    maskTextSelector: "[data-ph-mask]",          // opt-in extra masking hook
  },

  loaded: (ph) => {
    if (process.env.NODE_ENV === "development") ph.debug();
  },
});
```

**Why these choices**
- `defaults: '2026-05-30'` turns on: `capture_pageview: 'history_change'` (SPA pageviews), replay `strictMinimumDuration`, **`external_scripts_inject_target: 'head'` (avoids SSR hydration errors — important for this animation-heavy SSR page)**, rageclick + persistence-debounce improvements.
- `person_profiles: 'identified_only'` keeps anonymous events (still great for funnels/web analytics) but avoids minting a person profile for every kid who watches a video and taps through — lower PII footprint + lower cost.
- `persistence: 'memory'` = **cookieless** until consent. This honors the **existing** privacy-policy promise ("we will ask for your consent before setting non-essential ones"). Upgrade to `localStorage+cookie` only after opt-in (see §11.3).

### 1.3 Pageviews & page-leaves (App Router)
- With `capture_pageview: 'history_change'`, `posthog-js` auto-captures `$pageview` on initial load **and** client navigations (e.g. `/` → `/privacy`). No manual pathname effect needed for the common case.
- If we want UTM/referrer guaranteed on the **first** pageview (some in-app browsers are flaky), register super properties in a tiny client effect that reads `window.location.search` on mount **before** relying on auto-capture — or accept PostHog's built-in `$initial_utm_*` capture (it already parses UTMs). Recommendation: rely on built-in UTM capture; add a `platform` derived super property (see §2.1).
- `$pageleave` (on) gives us session duration + bounce signal on this single-page site.

### 1.4 Web analytics & autocapture
- **Autocapture** ON — free clicks/inputs/changes across the whole page; powers heatmaps (§6) and the "what are people clicking" exploration without hand-instrumenting everything.
- **Web Analytics** dashboard (PostHog's built-in) works out of the box from `$pageview`/`$pageleave` — enable it for the classic "visitors / sessions / bounce / top sources" view.
- We **still** hand-instrument the high-value custom events (§2) because autocapture selectors are brittle against this design-system markup and can't express semantics like "email submitted with validation error reason X."

### 1.5 Reverse proxy (recommended — dodge ad-blockers)
TikTok/IG audiences are heavily mobile; a meaningful slice run ad-blockers or privacy browsers that block `*.posthog.com`. Proxy ingestion through our own domain. `next.config.ts` currently only has a redirect — add `rewrites` + `skipTrailingSlashRedirect`:

```ts
// next.config.ts (PROPOSED addition)
skipTrailingSlashRedirect: true,
async rewrites() {
  return [
    { source: "/ingest/static/:path*", destination: "https://us-assets.i.posthog.com/static/:path*" },
    { source: "/ingest/:path*",        destination: "https://us.i.posthog.com/:path*" },
  ];
},
```
Then `api_host: '/ingest'` (as above). Optionally set `flags_api_host` to a **separate** proxy path so feature-flag calls survive even if `/ingest` is blocked. Vercel serves these rewrites natively.

### 1.6 Server-side capture (`posthog-node`, P1)
The signup already round-trips through `POST /api/access-signup`. Emitting the conversion **server-side** there gives an ad-blocker-proof source of truth:

```ts
// lib/posthog-server.ts (PROPOSED)
import { PostHog } from "posthog-node";
export function getPostHogServer() {
  return new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    host: "https://us.i.posthog.com",
    flushAt: 1, flushInterval: 0,   // serverless: flush immediately
  });
}
```
Use it to fire `email_captured` (server) with `distinct_id` bootstrapped from the PostHog cookie (passed from the client) so client + server events stitch to the same person. Dedup by treating the server event as canonical for the conversion count. **Server capture uses the project key `phc_…`, not the personal key.**

---

## A. UTM & attribution scheme (the growth centerpiece)

**Problem:** TikTok makes only the **bio link** clickable (in-caption links are not); Instagram allows bio + Stories/link-sticker links. So per-post attribution can't rely on unique in-caption URLs.

**Solution:** Hermes (the social pipeline) mints a **unique short link per post** that 302-redirects to the canonical site URL with a full UTM set baked in. For TikTok, rotate the bio link (or a link-in-bio page listing recent posts) to the newest post's short link; for IG, use the per-post Story/bio link.

### A.1 Canonical UTM parameters
| Param | Value | Example | Notes |
|---|---|---|---|
| `utm_source` | platform | `tiktok`, `instagram`, (`youtube` later) | Drives "TikTok vs IG vs direct". |
| `utm_medium` | channel type | `social_organic` (`social_paid` if boosted) | Keep stable so paid vs organic is clean. |
| `utm_campaign` | series / month / theme | `2026-07_quiz_series`, `fella_launch` | Groups posts into initiatives. |
| `utm_content` | **the specific post ID** | `post_7423…`, `ttk_7423…` | **Key for per-post attribution.** Hermes injects the post's unique ID. |
| `utm_term` | **A/B hook / variant arm** | `hookA`, `thumbB`, `cta2` | Feeds the brand's A/B culture: which hook/thumbnail converts on-site. |

### A.2 Example tagged URL
```
https://www.smartfellaorfartsmella.com/?utm_source=tiktok&utm_medium=social_organic&utm_campaign=2026-07_quiz_series&utm_content=post_7423991&utm_term=hookA
```

### A.3 Short-link redirect (recommended)
- Hermes generates `https://sffs.link/<postid>` (or a `/go/<postid>` route on our domain) → 302 to the tagged canonical URL above.
- Benefits: clean bio link, per-post attribution even where only one link is allowed, click counts at the redirect layer, and freedom to change UTMs without re-editing posts.
- PostHog auto-captures `utm_*` as **event properties** and `$initial_utm_*` as **person properties**, so no custom code is needed to store them — just get the tags right at the source.

### A.4 Fallback attribution (when UTMs are stripped)
In-app browsers sometimes strip params/referrers. Capture belt-and-suspenders signals:
- `$referring_domain` (e.g. `tiktok.com`, `lm.tiktok.com`, `l.instagram.com`) → derive `platform` when `utm_source` is missing.
- The **post-signup "How did you find us?" survey** (§9) is a self-reported cross-check that rescues attribution when the technical signals fail. This is genuinely valuable here.

---

## 2. Event taxonomy (the deliverable centerpiece)

### 2.0 Naming convention
- **`lower_snake_case`**, **`object_action`** with a **past-tense** verb (`email_captured`, `cta_activated`).
- Reserve PostHog's `$`-prefixed events for the ones it captures automatically (`$pageview`, `$autocapture`, `$rageclick`, …). Never invent a `$` event.
- Keep property keys `snake_case`. Prefer a small, reused property vocabulary (`location`, `section_name`, `method`, `variant`) over one-off keys.

### 2.1 Super properties (registered once, attached to every event)
Register on init (client) so every event + person is attributable without repeating props:
| Property | Example | How |
|---|---|---|
| `platform` | `tiktok` / `instagram` / `direct` / `other` | Derived from `utm_source` else `$referring_domain`; `posthog.register()`. |
| `initial_utm_source/medium/campaign/content/term` | `tiktok` / … | PostHog captures these automatically as person props; register the derived `platform` explicitly. |
| `device_type` | `Mobile` / `Desktop` | Auto (`$device_type`). Used everywhere for mobile-vs-desktop splits. |
| `is_touch` | `true`/`false` | From `(pointer: coarse)` — the site already branches on this for the shape field. |

### 2.2 Custom event catalog

Legend — **Tier:** P0 = launch must-have, P1 = fast follow, P2 = later. **Auto** = PostHog captures it for free once the feature is enabled.

#### Acquisition / landing
| Event | Tier | When | Key properties |
|---|---|---|---|
| `$pageview` | P0 (Auto) | Page load + SPA nav | `$current_url`, `utm_*`, `$referrer`, `$referring_domain`, `platform`, `device_type` |
| `$pageleave` | P0 (Auto) | Leaving page | session duration inputs |

#### Engagement — scroll & sections
| Event | Tier | When | Key properties |
|---|---|---|---|
| `scroll_depth_reached` | P0 | Crossing 25 / 50 / 75 / 90 / 100% depth (fire each once/session) | `depth_pct` (25\|50\|75\|90\|100) |
| `section_viewed` | P1 | A section enters viewport (IntersectionObserver, once each) | `section_name` (`hero`\|`how`\|`comparison`\|`features`\|`testimonials`\|`pricing`\|`faq`\|`cta_band`\|`follow_us`) |

#### Engagement — hero toy (the draggable shapes)
| Event | Tier | When | Key properties |
|---|---|---|---|
| `hero_shape_dragged` | P1 | A shape is promoted to a real drag (`onShapePointerMove` horizontal intent) — debounce to 1/shape/session or throttle | `shape_id`, `shape_type`, `shape_color`, `is_touch` |
| `hero_shape_thrown` | P1 | Release velocity ≥ `THROW_MIN` in `endDrag` | `shape_id`, `throw_speed`, `is_touch` |
| `hero_shape_recolored` | P2 | A shape recolors over a matching bg (very chatty — **optional/off** or heavily sampled) | `shape_id`, `to_color` |

> Instrument at the existing seams in `page-shapes.tsx` (`onShapePointerMove` promotion branch → dragged; `endDrag` throw branch → thrown). Debounce hard so a fidgety session doesn't emit hundreds of events.

#### Intent — "TAKE THE TEST"
| Event | Tier | When | Key properties |
|---|---|---|---|
| `test_cta_activated` | P0 | Any "take the test" trigger fires (all currently scroll to `#pricing`) | `method` (`click`\|`key_t`), `location` (`nav`\|`hero`\|`steps`\|`cta_band`) |

> Unifies the green hero button, the sticky-nav coral button, the Steps/CTA-band buttons, **and** the global **"T" keyboard shortcut** (`smart-fart-hero.tsx` `onKeyDown`). One event, `method`/`location` properties → clean funnel step + heatmap of which entry point works.

#### Conversion — the email form (the money path)
| Event | Tier | When (in `get-access-form.tsx`) | Key properties |
|---|---|---|---|
| `email_form_viewed` | P0 | Form/pricing card enters viewport (IntersectionObserver) | `location: pricing` |
| `email_field_focused` | P1 | Input `onFocus` | — |
| `email_capture_started` | P1 | First keystroke (`onChange`, once) | — |
| `email_capture_submitted` | P0 | `handleSubmit` passes client regex, before/at `fetch` | — |
| `email_capture_validation_failed` | P0 | Any failure branch | `reason` (see below) |
| **`email_captured`** | **P0** | **`setStatus("success")`** (200 + `{ok:true}`) | `source: "pricing-get-access"`, `platform`, `utm_*` (via super props) |

**`reason` values (mapped 1:1 to the real code paths):**
| `reason` | Trigger in code |
|---|---|
| `invalid_format_client` | client `EMAIL_RE` fails |
| `invalid_format_server` | API 400 (server regex / length) |
| `rate_limited` | API 429 |
| `payload_too_large` | API 413 |
| `network_error` | `fetch` throws (offline / unreachable) |
| `server_error` | API 500 (proxy/Aurora failure) |

> **Never** attach the email address to any event. `email_captured` carries source + attribution only; the address lives solely in Aurora. (See §11.)

#### Offer / purchase intent ($67)
| Event | Tier | When | Key properties |
|---|---|---|---|
| `offer_viewed` | P1 | Pricing section w/ the $67 tier enters viewport | `price: 67`, `tier: the_fella_test` |
| `checkout_intent` | P2 | Placeholder for a future real "Buy" button | `price: 67` |

> Today the email capture **is** the purchase-intent proxy (no checkout exists). Reserve `checkout_intent` so the funnel extends cleanly when payment ships.

#### Outbound / the social flywheel
| Event | Tier | When | Key properties |
|---|---|---|---|
| `social_link_clicked` | P0 | Click on an Instagram/TikTok button (Follow-Us §, footer) | `platform` (`instagram`\|`tiktok`), `location` (`follow_us`\|`footer`) |
| `outbound_link_clicked` | P1 | Any other external link | `href`, `link_domain`, `location` |

> Strategically important: measures the **reverse** flow (site → social). Grounded in `lib/socials.ts` (IG `@smartfellafartsmellatest`, TikTok `@smartfellafartsmellatest`) rendered by `follow-us.tsx` + the footer.

#### Quality signals (enable + monitor)
| Event | Tier | When | Notes |
|---|---|---|---|
| `$rageclick` | P0 (Auto) | Rapid repeated clicks | UX friction; watch on CTA/form. |
| `$dead_click` | P0 (Auto) | Click with no effect | e.g. tapping a non-interactive shape expecting action. |
| `$exception` | P1 (Auto) | JS errors (Error Tracking) | Correlate spikes with conversion drops. |
| `$web_vitals` | P1 (Auto) | LCP/CLS/INP/FCP | Mobile perf of the animation-heavy hero. |

---

## 3. Funnels

### 3.1 Primary conversion funnel — "macro" (exec view)
```
$pageview  →  email_form_viewed  →  email_capture_submitted  →  email_captured
```
Break down by `platform` (TikTok vs IG vs direct) and `device_type` (mobile vs desktop). This is the headline funnel on the North-Star dashboard.

### 3.2 Primary conversion funnel — "micro" (diagnostic)
```
$pageview
  → scroll_depth_reached (≥50)         // did they get past the fold's promise?
  → email_form_viewed                   // did they reach the offer?
  → email_capture_started               // did the offer + price move them to type?
  → email_capture_submitted             // did they attempt?
  → email_captured                      // did it succeed?
```
**Where drop-off matters most (hypotheses to validate):**
- **`$pageview → email_form_viewed`** — the funnel of the whole page. Low = weak hook / too long / mobile perf. Cross-check with `scroll_depth_reached` distribution + `$web_vitals`.
- **`email_form_viewed → email_capture_started`** — the **offer/price** step. Low = $67 objection or unclear value. This is the #1 A/B battleground (§8).
- **`email_capture_submitted → email_captured`** — **technical** health. Low = server/network errors; watch `email_capture_validation_failed` by `reason`.

### 3.3 Secondary funnels
| Funnel | Question it answers |
|---|---|
| `$pageview → test_cta_activated → email_form_viewed` | Do CTA clicks actually deliver people to the form? Which `location` converts? |
| `$pageview → hero_shape_dragged → email_captured` | Does playing with the toy correlate with (or cannibalize) conversion? |
| `scroll_depth_reached 25 → 50 → 75 → 90` | Content consumption / where the page loses people. |
| `$pageview → social_link_clicked` | Are we leaking hard-won traffic back to social before converting? |

---

## 4. Conversions & goals

- **Primary conversion:** `email_captured` (unique users).
- **Conversion rate:** `unique users(email_captured) ÷ unique users($pageview)` — a **Trends formula** insight, broken down by `initial_utm_source` / `platform`, and by `device_type`. Track daily + 7-day rolling.
- **Per-source rate:** duplicate the insight broken down by `utm_campaign` and `utm_content` to rank **which posts** convert (not just which get views).
- **Micro-conversions (leading indicators):** `email_form_viewed`, `email_capture_started`, `test_cta_activated`. Useful early when signup volume is thin.
- **Server truth (P1):** count conversions from the **server** `email_captured` (ad-blocker-proof); reconcile against client to estimate blocker rate.

---

## 5. Session replay

**Verdict: YES — but masked, sampled, consent-gated, and OFF until the §11 decision.** Replay is disabled at init (`disable_session_recording: true`) and started explicitly via `posthog.startSessionRecording()` only when (a) consent is granted and (b) a feature flag allows it.

**Why it's worth it here:** the audience is mobile-first from TikTok/IG. Replays show the *real* mobile experience — how far the thumb scrolls, whether the shapes delight or distract, exactly where people hesitate at the $67 offer, and what a rage/dead click was about.

**Config & guardrails**
- `maskAllInputs: true` (default) — **masks the email input**. Also tag the input's wrapper with `data-ph-mask` (matched by `maskTextSelector`) as a second layer.
- **Sampling / cost + privacy:** record **100% of sessions that reach the form or convert**, sample the rest (e.g. 25–50%). Use `minimum_duration` (via defaults' `strictMinimumDuration`, ~2s) to drop bounces.
- **Network capture:** keep request/response **bodies OFF** (the `/api/access-signup` POST body contains the email). Timing-only is fine and useful.
- **Console capture:** ON (helps debug the form error reasons) — but console must never log the email (it doesn't today).
- **No `<canvas>` recording needed** — the hero/shape animations are DOM transforms, captured natively.
- **Kill switch:** gate `startSessionRecording()` behind the `session-replay-enabled` flag (§7) so it can be disabled instantly without a deploy.

---

## 6. Heatmaps / clickmaps

Enable **Heatmaps** (autocapture-powered; view via the PostHog Toolbar on the live site). Focus surfaces:
- **Hero:** the green "Take the test" button vs the draggable shapes — are taps landing on the CTA or getting lost on the toy? (Cross-check `$dead_click`.)
- **Sticky nav:** the coral "Take the test" button (reveals after 120px scroll).
- **Pricing card + email form:** the input, the "Get access" button, and any mis-taps around them.
- **FAQ:** which questions get expanded (objections people care about → feeds copy + surveys).
- **Social buttons:** Follow-Us + footer (the flywheel).
- **Scrollmaps:** complement `scroll_depth_reached` to see the exact fall-off pixel on mobile vs desktop.

---

## 7. Feature flags

| Flag key | Purpose |
|---|---|
| `session-replay-enabled` | Master kill-switch for replay (privacy safety + cost). |
| `analytics-consent-required` | Region/consent gate; when true, hold analytics until opt-in (EU/child-safe default). |
| `show-hero-shapes` | Perf/UX kill-switch — disable the heavy shape overlay for low-end devices or as an experiment arm. |
| `pricing-visible` / `pricing-framing` | Gate or vary how the $67 offer is shown (ties to experiments §8). |
| `email-first-layout` | Test moving the email capture higher up the page. |
| `new-section-rollout` | Gradual rollout of any new section/quiz flow (0→100%). |

Flags are evaluated client-side (`useFeatureFlagEnabled`) and can also be read in API routes via `posthog-node` if server logic ever needs them. Consider `flags_api_host` (§1.5) so flag eval survives ad-blockers.

---

## 8. A/B experiments (PostHog Experiments)

Tailored to this brand's A/B-heavy culture. Each has **one primary metric** + guardrails. Primary metric defaults to `email_captured` conversion (the money), with leading-indicator secondaries when volume is thin.

| # | Experiment | Variants (example) | Primary metric | Guardrails / secondary |
|---|---|---|---|---|
| 1 | **Hero headline / hook** | current "Are you a Smart Fella or Fart Smella?" vs a curiosity/challenge hook | `email_captured` conv. | bounce, `scroll_depth_reached ≥50` |
| 2 | **CTA copy** | "Take the test" vs "Get my Fella Score" vs "Start the test" | `test_cta_activated` rate → `email_captured` | scroll depth |
| 3 | **Price framing** ($67) | "$67 one-time" vs "price of a coffee" vs anchored "~~$97~~ $67" | `email_captured` (intent) | `email_form_viewed→started` step |
| 4 | **Email form copy** | "Enter your email to get access" vs "Get on the list — be first to take the test" | `email_captured ÷ email_form_viewed` | `email_capture_validation_failed` rate |
| 5 | **Hero shapes on/off** | shapes ON vs OFF (via `show-hero-shapes`) | `email_captured` conv. | **`$web_vitals` (mobile INP/LCP)**, bounce |
| 6 | **"Press T" hint** (desktop) | hint shown vs hidden | `test_cta_activated (method=key_t)` | overall CTA rate |
| 7 | **CTA color** | green vs coral | `test_cta_activated` | — |

Run experiments **segmented by `device_type`** (a mobile-first audience means desktop-only wins can mislead) and, where sample allows, by `platform`.

---

## 9. Surveys

| Survey | Trigger | Purpose |
|---|---|---|
| **Post-signup "How did you find us?"** | On the "You're in!" success state (or `email_captured`) | Self-reported attribution (TikTok / IG / friend / other) — **rescues attribution** when in-app browsers strip UTMs/referrers. Highest-value survey here. |
| **Post-signup "What made you sign up?"** | Same moment (2nd question) | Qualitative why → sharpens copy + hooks. |
| **Exit-intent / dwell "What almost stopped you?"** | Desktop exit-intent; mobile via dwell-without-scroll or scroll-up near the offer | Objection mining (price / "not sure it's worth it" / "just browsing" / technical issue). |
| **Price-sensitivity (Van Westendorp)** | Later, once traffic supports it | Validate the $67 point before scaling paid. |

Keep surveys **light, skippable, throttled** (one per session), and — given the audience — never ask a child for personal info. Target with flags/properties so they never harm the conversion path.

---

## 10. Dashboards, insights & alerts

### 10.1 Dashboards
1. **North-Star (exec):** visitors, sessions, `email_captured` count + **conversion-rate trend**, signups by `platform`, mobile vs desktop split, the §3.1 macro funnel.
2. **Acquisition / Attribution:** visitors by `utm_source`/`utm_campaign`/**`utm_content` (per post)**, top posts by signups, conversion rate by platform, **geography map**, new vs returning.
3. **Conversion funnel:** macro + micro funnels, drop-off by step, funnel split by source + device, time-to-convert.
4. **Engagement:** `scroll_depth_reached` distribution, `section_viewed` rates, hero shape interaction rate, `test_cta_activated` by `location`, FAQ opens, `$rageclick`/`$dead_click`.
5. **Quality / Perf:** `$web_vitals` (mobile), `$exception` volume, **`email_capture_validation_failed` by `reason`** (form/API health).

### 10.2 Alerts (PostHog insight alerts → email/Slack/webhook)
| Alert | Condition | Why |
|---|---|---|
| **Conversion-rate drop** | daily `email_captured ÷ $pageview` falls > X% WoW, or below floor | Catch a broken form / regressed page fast. |
| **Signups flatline** | `email_captured` ≈ 0 over N daytime hours despite traffic | Form/API/Aurora outage. |
| **Form-error spike** | `email_capture_validation_failed (reason=server_error\|network_error)` spikes | Proxy/Lambda/Aurora problem. |
| **Traffic spike** | `$pageview` spikes vs baseline | A video is going viral — capitalize (post more, check capacity). |
| **Error spike** | `$exception` rate jumps | Regression on the animation-heavy client. |

---

## 11. PRIVACY / COMPLIANCE  ⚠️ (read before enabling anything)

**This is a genuine legal consideration, not a checkbox.** The brand's audience **skews toward kids/parents**, yet the current privacy policy (`app/privacy/page.tsx`) states the site is *"not directed to children under 13"* and that we *"do not knowingly collect personal information from them."* Under **COPPA**, whether a site is *"directed to children"* is judged by its **actual content, audience, and marketing** — a disclaimer does **not** override reality. **GDPR‑K** (Art. 8) sets a digital-consent age of **13–16** depending on EU member state. If the site is deemed child-directed (or we have *actual knowledge* of under-13 users), then **behavioral tracking, persistent identifiers, third-party analytics, and especially session replay** are restricted absent **verifiable parental consent**.

> **Required action:** get a real compliance determination (counsel) on whether SFFS is *"child-directed."* The answer drives whether replay + persistent tracking can run at all. Ship the **privacy-conservative default** (below) until then.

### 11.1 Privacy-conservative default config (safe to ship at P0)
- **Cookieless by default:** `persistence: 'memory'` (or `sessionStorage`) until explicit consent — honors the policy's existing promise to gate non-essential cookies.
- **`person_profiles: 'identified_only'`** — don't mint a profile for every anonymous visitor.
- **No PII in events:** `email_captured` carries **no** email; the address stays only in Aurora. Add `property_denylist: ['$ip', 'email', 'email_address']` as a hard guard.
- **Session replay OFF** until the child-directed decision; when on, **mask all inputs** (email masked), bodies off, sampled, and flag-gated (`session-replay-enabled`).
- **Discard client IP** at the project level (PostHog "Discard client IP data") after geo is derived — reduces PII while keeping city/country.
- **Honor GPC / Do Not Track** and respect a consent banner's opt-out via `posthog.opt_out_capturing()`.

### 11.2 The specific flags to raise (call these out to the owner)
1. **Child-directed status is undecided** and the policy's disclaimer may not match reality → **blocks** replay + persistent tracking until resolved.
2. **The policy already promises consent for non-essential cookies** → shipping PostHog cookies **without a consent banner would break that promise**. Either go cookieless (default) or ship the banner first.
3. **Session replay of minors** is the highest-risk feature — default OFF; enable only post-decision, masked + sampled + consent-gated + geo-limited.
4. **US data residency** (project is on US cloud). For EU visitors, document the transfer and consider stricter gating; **sign PostHog's DPA**.
5. **Update the privacy policy** to name **PostHog** as the analytics processor, describe session replay (if used) and the consent choices — the current text only says "analytics provider" generically.
6. **Retention:** set the **shortest workable** retention (short replay retention, e.g. 30 days; minimal person retention). Policy already commits to de-identified aggregate analytics.

### 11.3 Consent flow (if not going fully cookieless)
`opt_out_capturing_by_default`-style hold → show banner → on accept: `posthog.opt_in_capturing()` + upgrade `persistence` to `localStorage+cookie` (+ optionally `startSessionRecording()`); on decline: stay cookieless/opted-out. Region-gate via `analytics-consent-required` flag.

---

## 12. Implementation roadmap

### Wizard "Open a PR" vs manual — **recommend MANUAL (privacy-first)**
- The PostHog wizard scaffolds a generic provider + pageview capture and opens a PR — a fine **starting point**, but it will **not** handle this app's specifics: the reverse proxy, cookieless/consent + `identified_only` privacy config, replay masking, Lenis-aware scroll depth, the draggable-shape events, the email form state machine, or the "T" shortcut.
- Given the **kid-audience privacy stakes**, the wizard's defaults (profiles, cookies, possibly replay) **must not go live unreviewed**.
- **Recommendation:** either install manually, **or** let the wizard open the PR and then **review it line-by-line** and layer §1–§11 on top. Do **not** merge the wizard PR as-is.

### Keys & scopes needed
| Key | Prefix | Used by | Exposure |
|---|---|---|---|
| **Project API key** | `phc_…` | `posthog-js` (client) **and** `posthog-node` (server capture) | Public — safe as `NEXT_PUBLIC_POSTHOG_KEY`. Project **524578**. |
| **Personal API key** | `phx_…` | PostHog **MCP / management API** (create dashboards, flags, run queries) | **Secret — server only**, never `NEXT_PUBLIC`. Least-privilege scopes: `insight:read/write`, `dashboard:read/write`, `feature_flag:read/write`, `experiment:*`, `survey:*`, `query:read`, `session_recording:read`, `event_definition:read`, `person:read`. |

**Env additions**
```bash
# P0 (client)
NEXT_PUBLIC_POSTHOG_KEY=phc_xxx
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com   # or "/ingest" when reverse-proxied
NEXT_PUBLIC_POSTHOG_UI_HOST=https://us.posthog.com
# P1+ (server/management — NOT NEXT_PUBLIC)
POSTHOG_PERSONAL_API_KEY=phx_xxx
```

### Phased rollout
**P0 — must-haves (week 1)**
- Decide wizard-vs-manual (→ manual); make the **§11 privacy decision** (or ship the conservative default).
- Install `posthog-js` via `instrumentation-client.ts` + `PostHogProvider`; **reverse proxy** rewrites; privacy-first config (`identified_only`, cookieless/consent, input masking, `property_denylist`, `defaults: '2026-05-30'`).
- Autocapture + pageviews (`history_change`) + Web Analytics.
- **Money events:** `email_form_viewed`, `email_capture_submitted`, `email_captured`, `email_capture_validation_failed` (+ reasons); plus `test_cta_activated`, `scroll_depth_reached`, `social_link_clicked`.
- **UTM scheme live in Hermes** + per-post short-link redirect.
- Macro funnel + **North-Star dashboard** + conversion-drop & signup-flatline **alerts**.
- Consent banner (if not fully cookieless).

**P1 — fast follow (weeks 2–3)**
- **Session replay** (masked, sampled, consent-gated) — mobile focus.
- Full taxonomy: shapes (`hero_shape_dragged/thrown`), `section_viewed`, `offer_viewed`, `email_field_focused`, `email_capture_started`, `outbound_link_clicked`.
- **Heatmaps/clickmaps**; Attribution + Engagement dashboards.
- **Server-side `email_captured`** via `posthog-node` in `/api/access-signup` (blocker-proof truth).
- **Post-signup "How did you find us?" survey** (attribution cross-check).
- Feature-flag scaffolding + first A/B (CTA copy or headline).
- Error Tracking (`$exception`) + `$web_vitals`.

**P2 — later (week 4+)**
- Full experiments program (headline, price framing, shapes on/off).
- Exit-intent + price-sensitivity surveys.
- Cohorts, retention (returning visitors), correlation analysis, multi-touch attribution.
- MCP-driven management (Personal API key): programmatic dashboards/flags/insights.
- Extend the funnel with `checkout_intent` when real payment ships.

---

## Appendix — event ↔ code seam map (for the implementer)
| Event | File / seam |
|---|---|
| `test_cta_activated` | `components/quiz/smart-fart-hero.tsx` (`onKeyDown` T-branch + CTA `href`), `quiz-nav.tsx` button, `page.tsx` Steps/CtaBand CTAs — all route via `scrollToQuizHash('#pricing')` |
| `email_*` | `components/quiz/get-access-form.tsx` (`handleSubmit` branches, `onFocus`, `onChange`, success block) |
| `email_captured` (server) | `app/api/access-signup/route.ts` success path (via `posthog-node`) |
| `hero_shape_dragged/thrown` | `components/quiz/page-shapes.tsx` (`onShapePointerMove` promotion, `endDrag` throw branch) |
| `scroll_depth_reached` / `section_viewed` | new IntersectionObserver util; hook Lenis/ScrollTrigger from `smooth-scroll.tsx` |
| `social_link_clicked` / `outbound_link_clicked` | `components/social/social-button.tsx`, `components/sections/follow-us.tsx`, footer; data from `lib/socials.ts` |
| `offer_viewed` | `components/sections/pricing.tsx` ($67 tier card) |
```
