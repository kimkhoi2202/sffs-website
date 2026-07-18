# Build Blueprint — Podcast landing page

> Spec for a Next.js clone of the 30MPC podcast page in the **Closer** design system.
> Structure mapped from `design-reference/raw/pages/podcast.html` (section order only).
> **All copy below is original placeholder text for the "Closer" brand — never copy 30MPC text.**
> All media uses `<Placeholder>` / `<Avatar>` / `lucide-react`. Assemble sections only;
> `SiteHeader` + `SiteFooter` are already mounted in the root layout — do **not** add them.

## Purpose

The podcast hub: a punchy header, the latest + recent episodes, where to listen, proof
that the show is worth someone's commute (reach stats + listener quotes), and two ways to
keep coming back (newsletter subscribe + a final follow CTA). Goal = get a visitor to press
play on the featured episode and subscribe on their platform of choice.

## Route

- File: `app/podcast/page.tsx`
- Server Component that imports the sections below and `export const metadata`.

## Metadata (original copy)

```ts
export const metadata = {
  title: "The Closer Podcast — sales tactics for your next call",
  description:
    "Short, practical sales episodes from working reps. Steal cold-call openers, discovery questions, and closing plays — then follow along on Spotify, Apple Podcasts, or YouTube.",
};
```

## Reference structure (from the raw Webflow page — order only, no copy lifted)

1. Playlist-driven hero (big display title + curated playlist blocks).
2. A "join these sellers" newsletter/dive block with an animated social-proof island.
3. Footer band with a wall of testimonial cards + platform/social links.

The clone below expands that skeleton into a fuller, on-brand landing page (~7 sections)
using the shared component library, keeping the same intent: episodes → where to listen →
social proof → subscribe.

---

## Ordered sections

Backgrounds intentionally alternate so adjacent blocks contrast, and no two identical-colored
`bordered` blocks sit back to back. Rhythm: `blue → cream → paper → ink → mint → blue → coral`.

### 1. `PageHero` — hero header  ·  [server]
- **File:** `components/sections/page-hero.tsx`
- **Background:** `blue` (bordered — built in)
- **Variant / props:** `align="center"` (shows the decorative sticker row), single `cta`.
- **Copy note:** Eyebrow "The Closer Podcast"; Anton title along the lines of *"Sales plays you can steal on the drive to work"*; one-line subtitle promising short, tactical episodes; CTA `{ label: "Start listening", href: "#latest" }`.

### 2. `PodcastList` — featured + recent episodes  ·  [server]
- **File:** `components/sections/podcast.tsx`
- **Background:** `cream`
- **Variant / props:** `featured` (large latest-episode card on top, then the recent list); pass `platforms` (Spotify / Apple Podcasts / YouTube) so the featured card shows inline "listen on" pills; `id="latest"` to anchor the hero CTA.
- **Copy note:** Eyebrow + heading about tactical weekly episodes; original episode titles/summaries (cold-call openers, "just email me" reframes, discovery-to-budget, multi-threading, follow-ups, negotiation) with duration • date meta.

### 3. `LogoCloud` — where to listen  ·  [server]
- **File:** `components/sections/logo-cloud.tsx`
- **Background:** `paper`
- **Variant / props:** `variant="grid"` (a tidy centered row reads better than a marquee for ~6 platforms); `label="Where to listen"`; `companies` = platform wordmarks.
- **Copy note:** Label "Where to listen"; pills for Spotify, Apple Podcasts, YouTube, Overcast, Pocket Casts, Amazon Music (platform names only — no real logos).

### 4. `StatBand` — reach / social proof  ·  [server]
- **File:** `components/sections/stat-band.tsx`
- **Background:** `ink` (bordered, white text — built in)
- **Variant / props:** `eyebrow` + `title` + 4 `stats`.
- **Copy note:** "The show by the numbers" — original placeholder figures like downloads-to-date, episodes published, average episode length, and listener rating.

### 5. `Testimonials` — listener quotes  ·  [server]
- **File:** `components/sections/testimonials.tsx`
- **Background:** `mint`
- **Variant / props:** default wall-of-love grid; `eyebrow` + `title` + `testimonials`.
- **Copy note:** Eyebrow "Listener love"; original quotes from reps/managers on running a specific tactic after an episode, each with an `<Avatar>` (initials), role · company, and 5-star rating.

### 6. `NewsletterSignup` — subscribe  ·  [client]
- **File:** `components/sections/newsletter-signup.tsx`
- **Background:** `blue` (bordered — built in)
- **Variant / props:** `variant="hero"` with `benefits` + `showSocialProof`; `id="subscribe"`.
- **Copy note:** "Get every new episode in your inbox" — original subcopy about a short recap + the companion one-pager for each drop; benefit bullets; email capture (local success state, no backend).

### 7. `CtaBand` — final follow CTA  ·  [server]
- **File:** `components/sections/cta-band.tsx`
- **Background:** `coral` (bordered — built in)
- **Variant / props:** `align="center"`, rotated `badge`, `primaryCta` + `secondaryCta`.
- **Copy note:** Rotated sticker like "New episode every Tuesday"; headline nudging the visitor to hit follow; primary `{ label: "Follow the show", href: "#latest" }`, secondary `{ label: "Browse all episodes", href: "#latest" }`.

---

## Build notes
- Only `NewsletterSignup` needs `"use client"`; every other section here is a Server Component.
- Do not re-style buttons/cards — pass props to the shared primitives/sections only.
- Keep all episode/testimonial/stat data as original placeholder content; all imagery via `<Placeholder>` / `<Avatar>`.
- Verify mobile → `sm`/`md`/`lg` stacking; the featured card, stat grid, and testimonial columns all collapse to one column on mobile.

## Component order (summary)
`PageHero` → `PodcastList` → `LogoCloud` → `StatBand` → `Testimonials` → `NewsletterSignup` → `CtaBand`
