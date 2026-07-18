# Build Blueprint — AI Info Page ("How Closer Uses AI")

> Design-system clone spec for the placeholder brand **Closer**. Original copy only.
> This maps the *structure* of the source Webflow AI-info page onto our shared component
> library — it does **not** reproduce any 30MPC copy.

## Purpose

An honest, no-hype explainer of how **Closer** uses AI to help sellers do the job: what the
AI actually does, how a workflow runs end to end, the measured impact, how it compares to
working without it, and straight answers to the trust questions (data, accuracy, human
control). It's an informational / feature-explainer page — read top-to-bottom, one primary
conversion at the end. No pricing, no login-gated content.

## Route

`app/ai-info-page/page.tsx` — a Server Component that assembles the sections below and
exports `metadata`. `SiteHeader` / `SiteFooter` come from the root layout; do not add them.

## Metadata (original)

- **`<title>`:** `How Closer Uses AI — Sell Smarter, Not Louder | Closer`
- **`description`:** `A plain-English look at how Closer puts AI to work for sellers: call breakdowns, tailored coaching, and rep-ready practice — plus exactly what it does (and doesn't do) with your data.`

## Design notes

- **Color rhythm:** `paper → blue → cream → ink → mint → paper → coral`. No two adjacent
  blocks share a background; the dark `ink` StatBand sits mid-page as a contrast beat.
- Reuse shared primitives only (`Section`, `Heading`, `Eyebrow`, `Button`, `Card`, `Badge`,
  `Placeholder`, lucide icons). Thick black borders + hard offset shadows throughout.
- All section components ship with zero-prop placeholder data; pass original copy via props.
- Mobile-first: every grid/steps/comparison block must stack cleanly on `sm`.

## Ordered sections → component export names

| # | Component | File | `[client]?` | Background | Variant / key props | Original copy note (1 line) |
|---|---|---|---|---|---|---|
| 1 | `PageHero` | `sections/page-hero.tsx` | server | `paper` | `align="center"`; `eyebrow`, `title`, `subtitle`, single `cta` | Eyebrow "AI at Closer" over a headline like *"AI that helps you close — no buzzwords, no autopilot."* + one-line subhead + primary CTA. |
| 2 | `FeatureGrid` | `sections/feature-grid.tsx` | server | `blue` | `columns={3}`, lucide-icon feature cards; `eyebrow`, `title`, `intro`, `features` | "How we use AI" — 3 distinct jobs it does, e.g. *breaks down your calls, drafts tailored follow-ups, flags deals going quiet.* |
| 3 | `Steps` | `sections/steps.tsx` | server | `cream` | vertical numbered steps (3–4); `eyebrow`, `title`, `steps` | "How it works" — walk one AI-assisted workflow end to end: *connect → Closer listens → you get a next-step plan.* |
| 4 | `StatBand` | `sections/stat-band.tsx` | server | `ink` | dark band, 3 stats across; `eyebrow`, `title`, `stats` | "The impact" — a few punchy outcome numbers (hours saved, reply lift, ramp time) written as original placeholder metrics. |
| 5 | `Comparison` | `sections/comparison.tsx` | server | `mint` | two-column `theirPoints` vs `ourPoints`; `title` | "With Closer AI vs. flying blind" — original before/after bullets contrasting guesswork with guided reps. |
| 6 | `Faq` | `sections/faq.tsx` | **[client]** | `paper` | Base UI accordion; `eyebrow`, `title`, `items` | "AI, answered" — straight answers on data privacy, accuracy, and staying in human control (original Q&A). |
| 7 | `CtaBand` | `sections/cta-band.tsx` | server | `coral` | `align="center"`; `title`, `subtitle`, `primaryCta`, `secondaryCta` | Closing invite like *"See Closer AI on your next call."* with a primary CTA + a low-commitment secondary link. |

## Structure basis (from source, structure only)

The source page runs: centered hero → "at a glance" info grid → offerings grid → key-metrics
grid → two-panel ratings/review → "who it's for" list → numbered AI-assistant guidance →
numbered "where to start" → footer CTA. This blueprint compresses those into the seven
reusable blocks above (info/offerings → `FeatureGrid`; numbered lists → `Steps`; metrics →
`StatBand`; two-panel → `Comparison`; guidance Q&A → `Faq`; footer → `CtaBand`), reframed as
an original AI feature explainer. No source text is carried over.
