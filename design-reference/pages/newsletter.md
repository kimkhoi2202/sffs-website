# Newsletter — Build Blueprint

Design-system clone spec for the **Closer** newsletter landing page. Clone the *look & feel*
of the 30MPC newsletter page's section rhythm only. **All copy below is original placeholder
copy for "Closer" — never reproduce 30MPC text, topics, or numbers.**

---

## Page meta

- **Purpose:** Convert cold visitors into free subscribers. This is a single-goal email-capture
  landing page: lead hard with the signup, then stack proof (numbers → logos → benefits →
  testimonials → sample issues → FAQ) and close with one more ask. Every section either builds
  trust or points back to the signup.
- **Route:** `app/newsletter/page.tsx`
- **`<title>`:** `Closer — Weekly Sales Plays, in 5 Minutes | Free Newsletter`
- **`<meta name="description">`:** `One field-tested sales play in your inbox every Thursday —
  cold calls, discovery, and closing tactics you can run in your next meeting. Free forever,
  unsubscribe anytime.`
- **Layout note:** `SiteHeader` / `SiteFooter` are already mounted in the root layout — this
  page does **not** render them. Assemble only the sections below inside `page.tsx`.
- **Anchor note:** give the hero signup an `id="signup"` (via its `Section`) so the closing
  `CtaBand` button can link to `#signup`.

---

## Section order (quick reference)

| # | Component (export) | File | Variant | Background | Client? |
|---|---|---|---|---|---|
| 1 | `NewsletterSignup` | `sections/newsletter-signup.tsx` | `variant="hero"` | `blue` | `[client]` |
| 2 | `StatBand` | `sections/stat-band.tsx` | — | `ink` | server |
| 3 | `LogoCloud` | `sections/logo-cloud.tsx` | `variant="marquee"` | `cream` | server |
| 4 | `FeatureGrid` | `sections/feature-grid.tsx` | `columns={3}` | `mint` | server |
| 5 | `Testimonials` | `sections/testimonials.tsx` | grid | `paper` | server |
| 6 | `Bento` | `sections/bento.tsx` | — | `yellow` | server |
| 7 | `Faq` | `sections/faq.tsx` | accordion | `cream` | `[client]` |
| 8 | `CtaBand` | `sections/cta-band.tsx` | `align="center"` | `coral` | server |

**Color rhythm:** `blue → ink → cream → mint → paper → yellow → cream → coral` — no two adjacent
blocks share a color; bright accents (blue/mint/yellow/coral) alternate with dark/neutral
(ink/cream/paper). All full-bleed color blocks may use `bordered` for the sticker-sheet look.

---

## Section details

### 1. `NewsletterSignup` — hero email capture `[client]`
- **Background:** `blue` (periwinkle primary — biggest first impression; the white bordered
  input + pill button pop against it).
- **Variant:** `variant="hero"` (large centered headline + subhead + inline email field).
- **Copy note:** Original — an eyebrow like "Free weekly newsletter", a bold Anton headline
  promising one usable play per week, and a one-line subhead on time cost (~5 min) + who it's
  for (reps, AEs, SDRs). Add a small "no spam, unsubscribe anytime" microcopy under the field.
- **Props:** `title`, `subtitle`, `background="blue"`; wrap in a `Section id="signup"` so the
  final CTA can deep-link here. Field submits to a placeholder handler (no real backend).

### 2. `StatBand` — social-proof numbers
- **Background:** `ink` (dark band; render the numerals in a bright accent for high contrast —
  the signature 30MPC move).
- **Variant:** default; 3 stats.
- **Copy note:** Original placeholder metrics for Closer — e.g. subscriber count, weekly open
  rate, and years running. Invent round, plausible numbers; do **not** reuse 30MPC's figures.
- **Props:** `eyebrow`, optional `title`, `stats={[…3 items…]}`, `background="ink"`.

### 3. `LogoCloud` — "read by reps at" trust strip
- **Background:** `cream` (quiet warm neutral so placeholder logos read cleanly).
- **Variant:** `variant="marquee"` (scrolling strip; use `grid` if you prefer a static row).
- **Copy note:** Original label like "Read by sellers at teams you know" with placeholder
  company names. Use `<Placeholder>` blocks / generic names — never real 30MPC-cited brands.
- **Props:** `label`, `companies={[…]}`, `variant="marquee"`, `background="cream"`.

### 4. `FeatureGrid` — "what you get" benefits
- **Background:** `mint` (bright, upbeat).
- **Variant:** `columns={3}` (3 benefit cards).
- **Copy note:** Original — reframe the value into 3 subscriber benefits (e.g. one actionable
  play per issue, copy-paste scripts/templates, 5-minute reads). Each card gets a lucide icon,
  short Anton sub-head, and one line of body.
- **Props:** `eyebrow`, `title`, `intro`, `columns={3}`, `features={[…]}`, `background="mint"`.

### 5. `Testimonials` — subscriber quotes
- **Background:** `paper` (white so the bordered testimonial cards + `<Avatar>` initials stand
  out).
- **Variant:** default grid (swap to `TestimonialMarquee` if you want motion).
- **Copy note:** Original short quotes from fictional reps praising a specific outcome (booked
  a meeting, closed a deal) from a tactic they read. Use `<Avatar initials>` for faces.
- **Props:** `eyebrow`, `title`, testimonial items, `background="paper"`.

### 6. `Bento` — sample issues showcase
- **Background:** `yellow` (playful, energetic — mirrors the real page's categorized archive of
  past issues).
- **Variant:** default bento grid (mixed-size cards).
- **Copy note:** Original — 4–6 fictional past-issue "cards" with punchy made-up titles and a
  one-line teaser each (e.g. a cold-open line, a discovery question, an objection reframe), so
  visitors see the content quality before subscribing. Titles must be original, not 30MPC's.
- **Props:** `eyebrow`, `title`, `description`, `background="yellow"`.

### 7. `Faq` — objection handling `[client]`
- **Background:** `cream` (calm, readable warm neutral for the accordion).
- **Variant:** Base UI accordion.
- **Copy note:** Original 4–6 Q&A pairs answering signup objections — cost (free), frequency,
  spam/privacy, who it's for, how to unsubscribe. Keep answers one to two sentences.
- **Props:** `eyebrow`, `title`, `items={[{q,a}]}`, `background="cream"`.

### 8. `CtaBand` — final signup nudge
- **Background:** `coral` (punchy closing color, distinct from the blue hero).
- **Variant:** `align="center"`.
- **Copy note:** Original — restate the core promise in one bold line and drive the last action.
  `primaryCta` label like "Get the newsletter" linking to `#signup` (the hero form);
  optional `secondaryCta` to browse sample issues.
- **Props:** `title`, `subtitle`, `primaryCta={{ label, href:"#signup" }}`, `align="center"`,
  `background="coral"`.

---

## Build checklist
- [ ] 8 sections in the order above; `NewsletterSignup` (hero) first, `CtaBand` last.
- [ ] Only `NewsletterSignup` and `Faq` are `"use client"`; the rest are Server Components.
- [ ] Backgrounds follow the rhythm; no two adjacent blocks share a color.
- [ ] Hero `Section` has `id="signup"`; `CtaBand` primary button links to `#signup`.
- [ ] 100% original Closer copy + `<Placeholder>`/`<Avatar>`/lucide media — zero 30MPC text.
- [ ] `export const metadata` set from the title/description above.
