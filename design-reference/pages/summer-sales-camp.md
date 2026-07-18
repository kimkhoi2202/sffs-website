# Build Blueprint — Summer Sales Camp

> **Scope:** This is a *build spec* for one page of the "Closer" design-system clone. It maps
> the section flow to existing component **export names** from `components/sections/*` and
> `components/ui/*`. No React code here — the assigned builder implements each section using the
> shared primitives.
>
> **Content policy:** All copy below is an *original placeholder direction* for the fictional brand
> **"Closer"**. Do **not** copy any 30MPC marketing text. Write your own on-brand sales-education
> copy. All media = `<Placeholder>` / `<Avatar>` / `lucide-react`.

---

## Purpose

A high-energy **live cohort / event landing page** for **"Closer Summer Camp"** — a free, 4-week
live sales intensive. The page has to (1) sell the event with a bold, date-driven hero, (2) lay out
the week-by-week agenda, (3) prove value (what you'll learn, coaches, numbers, alumni proof),
(4) present ticket tiers, (5) answer objections, and (6) drive registration. It should read like a
playful, neo-brutalist "sticker sheet": bright color-blocked sections, thick black borders, hard
offset shadows, Anton uppercase headlines.

- **Route:** `app/summer-sales-camp/page.tsx`
- **Assembly:** import sections from `@/components/sections/*`; add `export const metadata`. Do **not**
  add `SiteHeader` / `SiteFooter` (already mounted in the root layout).

### Suggested `<title>` + description (original)

```ts
export const metadata = {
  title: "Closer Summer Camp — Build Your Sales Engine in 4 Weeks (Live & Free)",
  description:
    "Closer Summer Camp is a free 4-week live cohort for reps and sales leaders. Get live sessions, playbooks, and steal-able templates for prospecting, discovery, deal control, and closing.",
};
```

---

## Section order at a glance

Backgrounds alternate so no two adjacent blocks match (rhythm:
`blue → ink → paper → mint → ink → cream → yellow → paper → cream → coral`).

| # | Component (export) | File | Background | Client? | Role |
|---|---|---|---|---|---|
| 1 | `PageHero` | `page-hero.tsx` | `blue` | server | Event hero — dates/urgency in eyebrow |
| 2 | `MarqueeHeadline` | `marquee-headline.tsx` | `ink` | server | Scrolling urgency ticker / divider |
| 3 | `Steps` | `steps.tsx` | `paper` | server | 4-week agenda / curriculum |
| 4 | `FeatureGrid` | `feature-grid.tsx` | `mint` | server | What you'll learn (outcomes) |
| 5 | `StatBand` | `stat-band.tsx` | `ink` | server | Proof-in-numbers band |
| 6 | `Instructors` | `instructors.tsx` | `cream` | server | Who's coaching |
| 7 | `Testimonials` | `testimonials.tsx` | `yellow` | server | Alumni social proof |
| 8 | `Pricing` | `pricing.tsx` | `paper` | server | Ticket tiers |
| 9 | `Faq` | `faq.tsx` | `cream` | **[client]** | Objection handling |
| 10 | `CtaBand` | `cta-band.tsx` | `coral` | server | Final register CTA |

> Source-structure note: the reference page's real flow is sparse — **hero → 4-week schedule →
> live-event feature w/ guest coaches → team pricing**, separated by decorative wave dividers. This
> blueprint keeps that backbone (hero, schedule/`Steps`, coaches/`Instructors`, `Pricing`) and fills
> it out into a complete ~10-section event landing page. `MarqueeHeadline` stands in for the real
> page's decorative section dividers.

---

## Section details

### 1. `PageHero` — hero  · `background="blue"` · server
- **Variant:** `align="center"`, event-style. Put dates/urgency in the **eyebrow** pill; single strong `cta`.
- **Copy note (original):** eyebrow = short date/urgency badge (e.g. "LIVE COHORT · STARTS JUL 6 · 4 WEEKS · FREE"); headline promises building a full sales engine in one summer; subtitle names who it's for (reps + leaders) and the format (live + free); CTA "Save my seat".
- **Notes:** biggest Anton display heading on the page. Optionally add a small supporting line under the CTA ("No cost. Live sessions + recordings."). Decorative flourish only via `<Placeholder>`/lucide — no reference imagery.

### 2. `MarqueeHeadline` — urgency divider · `background="ink"` · server
- **Variant:** moderate `speed`, `reverse={false}`; single repeating phrase; paper/accent text on black.
- **Copy note (original):** short punchy urgency loop (e.g. "SEATS ARE LIMITED · DOORS CLOSE FRIDAY · BRING YOUR TEAM ·").
- **Notes:** acts as the high-contrast divider between the hero and the agenda (mirrors the reference page's decorative dividers).

### 3. `Steps` — 4-week agenda / curriculum · `background="paper"` · server
- **Variant:** vertical numbered steps; **each step = one weekly module** (label it with a week # + date).
- **Copy note (original):** 4 modules with original themes and one-line outcomes, e.g. Week 1 Prospecting, Week 2 Discovery, Week 3 Deal Control, Week 4 Closing & Expansion — each with a date and a single "you'll leave with…" line.
- **Notes:** keep it scannable; dates can sit in the step eyebrow/badge. This is the structural heart of the page (the reference page's schedule block).

### 4. `FeatureGrid` — what you'll learn · `background="mint"` · server
- **Variant:** `columns={3}`, lucide icon per feature; eyebrow + title + short intro.
- **Copy note (original):** 6 concrete take-home skills/outcomes (e.g. a repeatable prospecting cadence, a discovery scorecard, a multi-thread map, an objection playbook, a close checklist, a 30-day ramp plan).
- **Notes:** outcome-led, benefit-first copy; one lucide icon per card, black border + hard shadow via the shared `Card`.

### 5. `StatBand` — proof in numbers · `background="ink"` · server
- **Variant:** 4 stats, oversized Anton numerals on dark; eyebrow + short title.
- **Copy note (original):** invented-but-plausible camp stats (e.g. 4 weeks live, 12 sessions, 30+ templates, 5,000+ alumni). Keep numbers clearly placeholder.
- **Notes:** dark band gives contrast between the mint outcomes block and the cream coaches block; accent-colored numerals.

### 6. `Instructors` — who's coaching · `background="cream"` · server
- **Variant:** `columns={3}`, `<Avatar>` initials (no photos), name + role + one-line bio.
- **Copy note (original):** 3 fictional Closer coaches with playful titles and original one-line bios (e.g. "Head of Cold Calls", "Discovery Coach", "Deal Strategist"). Invent names/companies.
- **Notes:** maps to the reference page's live-event guest coaches. Use `<Avatar color=…>` variety; keep bios one line.

### 7. `Testimonials` — alumni proof · `background="yellow"` · server
- **Variant:** grid (3 cards) with `<Avatar>` + quote + attribution (use `Testimonials`, not the marquee).
- **Copy note (original):** 3 original alumni quotes focused on concrete results (booked more meetings, shorter cycles, first President's-Club-style win). Fictional names + roles + companies.
- **Notes:** cards get black borders + hard shadows; keep quotes short and specific.

### 8. `Pricing` — ticket tiers · `background="paper"` · server
- **Variant:** 3 tiers via `tiers` prop; highlight the middle tier (`featured`/emphasis) with an accent + `Badge`.
- **Copy note (original):** 3 ticket options — a Free camper pass, a paid Pro pass (recordings + templates + workbook), and a Team table (seats for the whole squad). Original prices + 3–5 bullet inclusions each; middle tier "Most popular".
- **Notes:** anchor id `id="pricing"` on the `Section` so nav/CTAs can deep-link. Pill buttons via shared `Button`.

### 9. `Faq` — objection handling · `background="cream"` · **[client]**
- **Variant:** Base UI `Accordion` (single-open), eyebrow + title + `items`.
- **Copy note (original):** 5–6 original Q&As (Is it really free? Are sessions recorded? Who is it for? Can I bring my team? What's the weekly time commitment? What if I miss a week?).
- **Notes:** `"use client"` (Base UI interactivity). Keep answers 1–3 sentences; on-brand borders/shadows on each item.

### 10. `CtaBand` — final register CTA · `background="coral"` · server
- **Variant:** `align="center"`, `primaryCta` + `secondaryCta`.
- **Copy note (original):** final urgency push — primary "Claim your free seat", secondary "Get the schedule". One-line reassurance under the buttons (free · live · recorded).
- **Notes:** boldest closing block; reuse the hero's promise in fewer words. Primary button in `paper`/`yellow` for pop on coral.

---

## Build checklist (self-review)
- [ ] Only `app/summer-sales-camp/page.tsx` created for this page; nothing else modified.
- [ ] Sections imported by direct path from `@/components/sections/*`; no barrel files.
- [ ] Backgrounds alternate exactly as the table above; no two identical adjacent blocks.
- [ ] `Faq` is the only `"use client"` section; all others are Server Components.
- [ ] All copy is original "Closer" placeholder text; all media is `<Placeholder>`/`<Avatar>`/lucide.
- [ ] `export const metadata` present with the original title/description.
- [ ] `#pricing` anchor set on the `Pricing` section for deep-linking.
- [ ] Anton uppercase display headings, DM Sans body, thick black borders + hard offset shadows.
- [ ] Fully responsive (mobile-first; verify `sm`/`md`/`lg`); type-safe (`tsc --noEmit`).
