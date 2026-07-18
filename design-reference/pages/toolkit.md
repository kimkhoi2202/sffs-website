# Page Blueprint — Toolkit

> Build spec for the **Closer** design-system clone. Assemble from existing primitives
> (`@/components/ui/*`) and sections (`@/components/sections/*`). **Original placeholder copy
> only** — never reuse 30MPC text. `SiteHeader`/`SiteFooter` are already mounted in the root
> layout; do **not** add them here.

## Purpose
The **Toolkit** is Closer's free resource library: a browsable, filterable collection of
downloadable sales assets (cold-call scripts, discovery frameworks, email/outreach templates,
objection-handling one-pagers, negotiation checklists). Visitors land, scan the library, filter
by category, grab what they need, and drop their email to get every new drop. It is the site's
top-of-funnel lead magnet.

## Route
`app/toolkit/page.tsx` (Server Component; add `export const metadata`).

## Suggested metadata (original)
- **title:** `Toolkit — Free Sales Scripts, Templates & Playbooks | Closer`
- **description:** `Steal Closer's free library of cold-call scripts, discovery frameworks, and
  outreach templates. Battle-tested by top reps — copy, customize, and close. New drops weekly.`

---

## Observed source structure (reference only — no text copied)
`raw/pages/toolkit.html` section order:
1. `section is-header` — left-aligned eyebrow + big page title + short intro paragraph and an
   inline "subscribe so you never miss a drop" capture.
2. Main library region — a sticky left category rail (e.g. a "Prospecting" heading) beside
   category-grouped collection lists, including a highlighted "best of" group; each item is a
   thumbnail card for a downloadable asset (slide deck / doc / template).
3. `island-background-color` — a "ready to dive in / join these sellers" block wrapping a
   newsletter form.
4. Pre-footer — a large testimonials grid of reps with avatars, star ratings, and blurbs.

Mapped and expanded below into an alternating-background design-system page (8 sections).

---

## Ordered section list

### 1. PageHero
- **Export:** `PageHero` · file `components/sections/page-hero.tsx` · Server
- **Background:** `cream`
- **Variant/props:** `align="left"`, `eyebrow`, `title`, `subtitle`, `cta` (primary → jump to
  library; optional secondary → jump to newsletter).
- **Copy note:** Eyebrow "Free downloads", title naming the toolkit, subtitle promising
  battle-tested, copy-paste-ready sales assets you can use on your next call.

### 2. ResourceGrid — the core library `[client]`
- **Export:** `ResourceGrid` · file `components/sections/resource-grid.tsx`
- **Background:** `blue`
- **Variant/props:** `columns={3}`, `eyebrow`, `title`, `resources`. Mark **`[client]`**: add
  category filter chips + search over the resource set (base `ResourceGrid` is a Server
  Component — only the interactive filter wrapper needs `"use client"`).
- **Copy note:** Eyebrow "The vault", title for the full/most-downloaded library; each card is
  an original resource name + type badge (Script / Template / Checklist) + short benefit line.

### 3. FeatureGrid — browse by category
- **Export:** `FeatureGrid` · file `components/sections/feature-grid.tsx` · Server
- **Background:** `paper`
- **Variant/props:** `columns={3}`, `eyebrow`, `title`, `intro`, `features` (each with a
  `lucide-react` icon).
- **Copy note:** "Find your play" — cards for categories (Prospecting, Discovery, Cold calling,
  Objection handling, Negotiation, Follow-up email), one original line describing each.

### 4. ResourceGrid — fresh drops
- **Export:** `ResourceGrid` · file `components/sections/resource-grid.tsx` · Server
- **Background:** `mint`
- **Variant/props:** `columns={3}`, `eyebrow`, `title`, `resources` (static "newest" set).
- **Copy note:** Eyebrow "New this week", title for the latest additions; original names for a
  few recently added templates with a "New" `Badge`.

### 5. Steps — how to use the toolkit
- **Export:** `Steps` · file `components/sections/steps.tsx` · Server
- **Background:** `cream`
- **Variant/props:** `eyebrow`, `title`, `steps` (3 items, numbered).
- **Copy note:** 3-step flow — find the asset → customize to your deal → run it and close —
  each step one original sentence.

### 6. Testimonials
- **Export:** `Testimonials` · file `components/sections/testimonials.tsx` · Server
- **Background:** `ink`
- **Variant/props:** 3-column grid with `Avatar` + star row per card. (Optional: swap in
  `TestimonialMarquee` for a scrolling variant — still static/CSS, no client JS.)
- **Copy note:** Original quotes from fictional reps on how a specific template helped them book
  meetings or hit quota; original names + role/company.

### 7. NewsletterSignup — the drops gate `[client]`
- **Export:** `NewsletterSignup` · file `components/sections/newsletter-signup.tsx`
- **Background:** `yellow`
- **Variant/props:** `variant="inline"`, `title`, `subtitle`. **`[client]`** (form
  state/validation).
- **Copy note:** Email capture to unlock/receive every new toolkit drop; original one-line
  value prop + privacy microcopy.

### 8. CtaBand
- **Export:** `CtaBand` · file `components/sections/cta-band.tsx` · Server
- **Background:** `coral`
- **Variant/props:** `align="center"`, `title`, `subtitle`, `primaryCta` (→ courses),
  `secondaryCta` (→ newsletter/podcast).
- **Copy note:** Final nudge — "want more than templates?" pointing to Closer's courses, in
  original copy.

---

## Color rhythm (adjacent contrast — no repeats back to back)
`cream → blue → paper → mint → cream → ink → yellow → coral`

## Notes
- `[client]` sections: **ResourceGrid** (only its filter/search wrapper) and
  **NewsletterSignup**. Everything else is a Server Component.
- Optional divider: a single `MarqueeHeadline` between §6 Testimonials and §7 NewsletterSignup
  can add punch (keep total ≤ 9 sections).
- All media via `<Placeholder>` / `<Avatar>` / `lucide-react`; thick black borders + hard offset
  shadows per `design-tokens.md`.
