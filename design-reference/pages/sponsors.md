# Build Blueprint — Sponsors / Advertise page

> Design-system clone of the 30MPC sponsors page for the placeholder brand **"Closer"**.
> Structure and section order are modeled on `design-reference/raw/pages/sponsors.html`
> (Webflow source). **All copy below is original placeholder text** — write your own; never
> lift 30MPC's marketing copy. **All media is placeholder** (`<Placeholder>`, `<Avatar>`,
> `lucide-react`). This is a spec only — no React code lives here.

## Purpose

The "advertise / partner with us" landing page. It sells sponsorship of Closer's media to
B2B software teams: proves the audience is worth reaching (sales leaders + reps), shows past
partners for trust, explains how a campaign runs, lays out sponsorship packages, backs it with
partner results, answers buyer objections, and drives one action — **book a call**.

## Route & file

- **Page:** `app/sponsors/page.tsx` (React Server Component that assembles the sections below).
- `SiteHeader` and `SiteFooter` are already mounted in the root layout — **do not add them here.**
- Add `export const metadata` (below). Import each section by its direct path from
  `@/components/sections/*`. No barrel/index files.

### Suggested original metadata

```ts
export const metadata = {
  title: "Partner with Closer — Reach B2B Sales Teams",
  description:
    "Put your product in front of the sales reps and leaders who shape B2B buying decisions. Multi-channel sponsorships with Closer that turn awareness into pipeline.",
};
```

## Section order at a glance

1. `PageHero` — the pitch
2. `StatBand` — audience metrics
3. `LogoCloud` — past sponsors (social proof)
4. `Steps` — how a partnership works
5. `SponsorTiers` — sponsorship packages
6. `Testimonials` — results from partners
7. `Faq` **[client]** — sponsor objections
8. `CtaBand` — book a call

8 sections. Backgrounds alternate so no two adjacent blocks share a color:
`blue → ink → paper → cream → mint → paper → cream → ink`.

---

## Sections (ordered)

### 1. `PageHero` — hero pitch
- **Import:** `@/components/sections/page-hero`
- **Maps to source:** `<section class="header_lp">` (hero with big H1 + subtitle + media + CTA).
- **Background:** `blue` (bordered). Bold periwinkle opener.
- **Variant / props:** `align="center"`, `eyebrow`, `title`, `subtitle`, `cta` (primary + secondary).
- **Original copy note:** Eyebrow "Partner with Closer"; headline about getting in front of
  every B2B sales team that matters; one-line subtitle on reaching buyers where they already
  learn; primary CTA "Book a call", secondary "Get the media kit".
- **Media:** `<Placeholder aspect="16/9" label="Campaign reel" />` for the hero visual.
- **Server component.**

### 2. `StatBand` — audience metrics
- **Import:** `@/components/sections/stat-band`
- **Maps to source:** the "Audience" `<section class="section">` (the 43%-are-sales-leaders proof block).
- **Background:** `ink` (dark). White figures pop against the blue hero above.
- **Variant / props:** `eyebrow`, `title`, `stats` (4 figures).
- **Original copy note:** Eyebrow "The audience"; title about who's actually listening; four
  original stats, e.g. subscriber count, "~44% are sales leaders", "majority North America",
  monthly impressions. Invent plausible round numbers — do not reuse 30MPC's figures verbatim.
- **Server component.**

### 3. `LogoCloud` — past sponsors
- **Import:** `@/components/sections/logo-cloud`
- **Maps to source:** trust framing of `<section class="section_sponsors">` ("earn your buyers'
  trust"), reframed as a social-proof logo strip.
- **Background:** `paper`.
- **Variant / props:** `variant="marquee"`, `label`, `companies` (placeholder brand names).
- **Original copy note:** Label like "The teams that already partner with us" with invented
  placeholder company names (e.g. Northbeam, Vantgo, Pipeline Labs). Logos are `<Placeholder>` tiles.
- **Server component.**

### 4. `Steps` — how a partnership works
- **Import:** `@/components/sections/steps`
- **Maps to source:** the "You'll be impossible to miss" multichannel `<section class="section red">`
  plus the "Turn awareness into pipeline" `<section class="section mint">` deliverables — combined
  into an ordered process.
- **Background:** `cream`.
- **Variant / props:** `eyebrow`, `title`, `steps` (3–4 numbered steps).
- **Original copy note:** Eyebrow "How it works"; steps such as (1) intro call to define goals,
  (2) co-create the campaign message, (3) run it across newsletter/podcast/socials over months,
  (4) measure sourced pipeline. Original wording throughout.
- **Server component.**

### 5. `SponsorTiers` — sponsorship packages
- **Import:** `@/components/sections/sponsor-tiers`
- **Maps to source:** the `id="pricing"` packaging intent of the campaign section.
- **Background:** `mint`. Black-bordered tier cards read great on mint.
- **Variant / props:** `eyebrow`, `title`, `tiers` (3 packages, one flagged as featured/most popular).
- **Original copy note:** Eyebrow "Ways to partner"; three invented package names (e.g.
  "Spotlight", "Signature", "Season"), each with an original one-line promise + a short
  what's-included list. No real prices required — use "Let's talk" style CTAs.
- **Server component.**

### 6. `Testimonials` — results from partners
- **Import:** `@/components/sections/testimonials`
- **Maps to source:** no literal block in the source; added as standard proof before the FAQ,
  consistent with the page's trust/results theme.
- **Background:** `paper`.
- **Variant / props:** `Testimonials` grid (alt: `TestimonialMarquee` if a moving strip is
  preferred); each quote uses `<Avatar initials … />`.
- **Original copy note:** 2–3 original partner quotes about pipeline lift and prospects quoting
  their ads back to them, with invented names/roles/companies.
- **Server component.**

### 7. `Faq` — sponsor objections **[client]**
- **Import:** `@/components/sections/faq`
- **Maps to source:** the FAQ `<section class="section">` (`home-faq-grid` / `faq6_accordion`).
- **Background:** `cream`.
- **Variant / props:** `eyebrow`, `title`, `items` (6–7 Q&A pairs). Base UI accordion.
- **Original copy note:** Original questions covering audience relevance, how selective you are,
  what results to expect, how this differs from generic ads, whether they can test small, and
  messaging help. Write fresh answers — do not copy the source Q&A text.
- **`"use client"` — this is the only client component on the page** (Base UI accordion interactivity).

### 8. `CtaBand` — book a call
- **Import:** `@/components/sections/cta-band`
- **Maps to source:** the recurring "Talk to Our Campaigns Team" CTAs, consolidated into one
  closing band.
- **Background:** `ink` (dark) with a bright pill button (coral/yellow) — strong on-brand close.
- **Variant / props:** `align="center"`, `title`, `subtitle`, `primaryCta` ("Book a call"),
  optional `secondaryCta` ("Get the media kit").
- **Original copy note:** Short original closer inviting them to map out a campaign; the primary
  CTA is the single conversion action for the whole page.
- **Server component.**

---

## Implementation notes

- **Client components:** only `Faq` (`[client]`). Everything else renders as a Server Component.
- **Background rhythm:** `blue → ink → paper → cream → mint → paper → cream → ink`. Never place
  two identical `bordered` sections back to back; use black top/bottom borders on adjacent blocks
  for the sticker-sheet stacking look.
- **Signatures:** thick `2.5px` black borders, hard offset shadows (no blur), Anton uppercase
  display headings via `<Heading>`, DM Sans body, pill buttons via `<Button>`, generous rounding.
- **Reuse primitives** (`Button`, `Badge`, `Heading`, `Eyebrow`, `Card`, `Placeholder`, `Avatar`,
  `Marquee`) — no ad-hoc restyling.
- **Responsive:** mobile-first; stat figures, logos, steps, and tier cards must stack cleanly at
  `sm`/`md`; verify at `lg`.
- **Content policy:** original placeholder copy for "Closer" only; all imagery via
  `<Placeholder>` / `<Avatar>` / `lucide-react`. Never reference 30MPC copy, logos, or photos.
