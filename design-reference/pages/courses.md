# Courses — Build Blueprint

> Build spec for the **Closer** design-system clone of the courses / catalog page. Assemble from
> existing primitives (`@/components/ui/*`) and sections (`@/components/sections/*`). **All copy
> below is original placeholder copy for "Closer" — never reproduce 30MPC text, course names,
> topics, or numbers.** `SiteHeader` / `SiteFooter` are already mounted in the root layout; do
> **not** render them here.

---

## Purpose
The **Courses** page is Closer's catalog / storefront: the page a warm visitor lands on to see
every course, understand what's inside, meet the instructors, compare plans, and enroll. It has
one job — turn "which one should I take?" into a click on a course. Lead with a bold dark hero,
put the **catalog front and center**, then stack the reasons to buy (what's inside → how it works
→ who teaches → pricing → proof), knock down objections (FAQ), and close with a strong CTA plus a
newsletter fallback for the not-yet-ready.

## Route
`app/courses/page.tsx` (Server Component shell; add `export const metadata`).

## Suggested metadata (original)
- **`<title>`:** `Courses — Sales Training That Books Meetings & Closes Deals | Closer`
- **`<meta name="description">`:** `Browse Closer's library of step-by-step sales courses — cold
  calling, cold email, discovery, negotiation, and leadership. Learn the exact plays top reps use
  to book meetings and hit quota. Self-paced, with team plans available.`

## Anchors
- Give the catalog `Section` `id="catalog"`; the hero primary CTA and the closing `CtaBand` both
  deep-link to `#catalog`.
- Give the pricing `Section` `id="pricing"`; hero/CTA "Train your team" links to `#pricing`.

---

## Observed source structure (reference only — no text copied)
`raw/pages/courses.html` section order (Webflow), studied for **structure/rhythm only**:
1. `section_home-hero is-courses` — a **dark** hero (white text over an animated sun), with a
   big one-word page title, a longer promise sub-headline, a short subtitle paragraph, and
   floating animated **testimonial cards** scattered as decoration (social proof in the hero).
2. `section-divider-wrapper` — a thin full-bleed **colored divider** strip between hero and body.
3. `section_course-courses is-courses` (`id="courses"`) — the **catalog**: a two-column grid of
   `course-item` cards (each with category **tags**, a title, a one-line description, and a
   "Learn more" button), split into individual courses + a **"Bundles"** column, with an inline
   **"Are you a sales leader? Train your team"** CTA card embedded in the grid.
4. `home-faq-grid` / `faq6` — an **FAQ** accordion beside an illustration ("Are these courses
   right for me?").
5. `marquee-logos` (clouds) + `home-dive-island` — a playful illustrated **social-proof** block
   with animated testimonial pop-ups.
6. Pre-footer testimonials — a large **testimonials wall** ("Join these reps who are going to
   President's Club!") of avatar + star-rating + blurb cards, just above the footer.

**Mapping decision:** the real page is lean (hero → catalog → FAQ → heavy testimonials → CTA).
Below it is mapped and expanded into an alternating-background, 10-section design-system page. The
catalog, testimonials wall, FAQ, and closing CTA mirror the source; **FeatureTabs, Steps,
Instructors, and Pricing are added** because a standalone catalog page needs them and they fit the
brand. (Fidelity note: the source places its FAQ *before* the testimonial wall — swap §7 and §8 if
you prefer strict source order.)

---

## Section order (quick reference)

| # | Component (export) | File | Variant / key props | Background | Client? |
|---|---|---|---|---|---|
| 1 | `PageHero` | `sections/page-hero.tsx` | `align="left"`, cta + secondary | `ink` | server |
| 2 | `CourseGrid` | `sections/course-card.tsx` | `columns={3}`, `id="catalog"` | `paper` | server |
| 3 | `FeatureTabs` | `sections/feature-tabs.tsx` | tabbed panels | `blue` | `[client]` |
| 4 | `Steps` | `sections/steps.tsx` | 4 numbered steps | `cream` | server |
| 5 | `Instructors` | `sections/instructors.tsx` | `columns={3}` | `mint` | server |
| 6 | `Pricing` | `sections/pricing.tsx` | 3 tiers, `id="pricing"` | `yellow` | server |
| 7 | `Testimonials` | `sections/testimonials.tsx` | grid | `ink` | server |
| 8 | `Faq` | `sections/faq.tsx` | accordion | `paper` | `[client]` |
| 9 | `CtaBand` | `sections/cta-band.tsx` | `align="center"` | `coral` | server |
| 10 | `NewsletterSignup` | `sections/newsletter-signup.tsx` | `variant="inline"` | `blue` | `[client]` |

**Color rhythm:** `ink → paper → blue → cream → mint → yellow → ink → paper → coral → blue`
— no two adjacent blocks share a color; bright accents (blue/mint/yellow/coral) alternate with
dark/neutral (ink/paper/cream). Use `bordered` on the full-bleed color blocks for the sticker-sheet
look.

---

## Section details

### 1. `PageHero` — dark catalog hero
- **Export:** `PageHero` · file `components/sections/page-hero.tsx` · Server
- **Background:** `ink` (mirrors the source's dark hero; render the display heading and any
  accent chips in bright colors for high contrast).
- **Variant / props:** `align="left"`, `eyebrow`, `title`, `subtitle`,
  `cta={{ label:"Browse courses", href:"#catalog" }}` plus a secondary
  `{ label:"Train your team", href:"#pricing" }`.
- **Copy note:** Original — eyebrow like "The Closer catalog", an Anton headline promising
  step-by-step training to book meetings and close deals, and a one-line subtitle on who it's for
  (SDRs, AEs, and sales leaders). Do **not** reuse 30MPC's headline.
- **Fidelity note:** the source hero floats animated testimonial cards as decoration — that social
  proof is represented by §7 `Testimonials`; keep this hero clean (optional single `Badge` like
  "New negotiation course").

### 2. `CourseGrid` — the catalog (centerpiece)
- **Export:** `CourseGrid` · file `components/sections/course-card.tsx` · Server
- **Background:** `paper` (clean white canvas so the many bordered `CourseCard`s read as a
  sticker sheet).
- **Variant / props:** wrap in `Section id="catalog"`; `columns={3}`, `eyebrow`, `title`,
  `courses={[…]}`. Each course: category `tags`, title, one-line benefit, `href` ("Learn more").
- **Copy note:** Original course names spanning tracks — e.g. cold calling, cold email, discovery,
  negotiation, executive/multithread selling, and sales leadership. Add a **"Bundles"** grouping
  (e.g. a full-funnel outbound bundle + an all-access option) and one highlighted **"Train your
  team"** callout card (mirrors the source's embedded sales-leader CTA), all in original copy.

### 3. `FeatureTabs` — what's inside every course `[client]`
- **Export:** `FeatureTabs` · file `components/sections/feature-tabs.tsx`
- **Background:** `blue`
- **Variant / props:** `eyebrow`, `title`, `tabs={[…]}` (Base UI `Tabs`). **`[client]`**
  (tab state). Each tab: a short Anton sub-head, one line of body, and a `<Placeholder>` preview.
- **Copy note:** Original — 3–4 tabs framing course contents as buyer benefits (e.g. proven
  frameworks, copy-paste scripts & templates, real deal teardowns, community & coaching). This is
  the "what you'll learn" block.

### 4. `Steps` — how it works
- **Export:** `Steps` · file `components/sections/steps.tsx` · Server
- **Background:** `cream`
- **Variant / props:** `eyebrow`, `title`, `steps={[…4 items…]}` (numbered).
- **Copy note:** Original 4-step flow — pick your track → follow the playbook → practice with the
  templates → book more meetings / close more deals. One original sentence each.

### 5. `Instructors` — meet your coaches
- **Export:** `Instructors` · file `components/sections/instructors.tsx` · Server
- **Background:** `mint`
- **Variant / props:** `eyebrow`, `title`, `columns={3}`, `people={[…]}` — each uses
  `<Avatar initials>` (no photos), an original name, and a role/credential line.
- **Copy note:** Original — 3–4 fictional instructors with credible-sounding sales credentials
  (e.g. "ex-Enterprise AE, top 1% closer"). Invent names/roles; do not name real people.

### 6. `Pricing` — plans
- **Export:** `Pricing` · file `components/sections/pricing.tsx` · Server
- **Background:** `yellow`
- **Variant / props:** wrap in `Section id="pricing"`; `eyebrow`, `title`, `tiers={[…3…]}` with
  the middle tier flagged most-popular.
- **Copy note:** Original 3 tiers — a single-course one-time price, an all-access "Closer Pass"
  (annual, most popular), and a Team plan (per-seat / "contact sales"). Use round placeholder
  `$` values and original bullet features; mirrors the source's all-access + team-training offer.

### 7. `Testimonials` — wall of wins
- **Export:** `Testimonials` · file `components/sections/testimonials.tsx` · Server
- **Background:** `ink` (dark wall so bordered cards + `<Avatar>` initials + star rows pop —
  the page's dominant proof block, echoing the source's dive-island + pre-footer wall).
- **Variant / props:** default grid; `eyebrow`, `title`, testimonial items (quote, name, role,
  avatar initials/color). Optional: swap in `TestimonialMarquee` for scrolling motion (still
  CSS-only, no client JS).
- **Copy note:** Original short quotes from fictional reps citing a specific outcome (booked a
  meeting, closed a deal, hit quota) after a Closer course. Original names + role/company.

### 8. `Faq` — objection handling `[client]`
- **Export:** `Faq` · file `components/sections/faq.tsx`
- **Background:** `paper`
- **Variant / props:** Base UI accordion; `eyebrow`, `title`, `items={[{q,a}]}`. **`[client]`**.
- **Copy note:** Original 5–6 Q&A pairs answering enrollment objections — is it right for me,
  self-paced vs live, how long is access, do you have team plans, is there a guarantee/refund, do
  I need experience. Keep answers one to two sentences.

### 9. `CtaBand` — closing enrollment nudge
- **Export:** `CtaBand` · file `components/sections/cta-band.tsx` · Server
- **Background:** `coral`
- **Variant / props:** `align="center"`, `title`, `subtitle`,
  `primaryCta={{ label:"Browse courses", href:"#catalog" }}`,
  `secondaryCta={{ label:"Train your team", href:"#pricing" }}`.
- **Copy note:** Original — restate the core promise in one bold line and drive the final action
  back to the catalog.

### 10. `NewsletterSignup` — not-ready-yet fallback `[client]`
- **Export:** `NewsletterSignup` · file `components/sections/newsletter-signup.tsx`
- **Background:** `blue`
- **Variant / props:** `variant="inline"`, `title`, `subtitle`. **`[client]`** (form
  state/validation; submits to a placeholder handler — no real backend).
- **Copy note:** Original — capture email from browsers who aren't ready to buy ("get one sales
  play every week"), with a one-line value prop + "no spam, unsubscribe anytime" microcopy.

---

## Build checklist
- [ ] 10 sections in the order above; `PageHero` (dark) first, `NewsletterSignup` last.
- [ ] `[client]` sections are only **FeatureTabs**, **Faq**, and **NewsletterSignup**; the rest
      are Server Components.
- [ ] Catalog `Section` has `id="catalog"` and Pricing `Section` has `id="pricing"`; hero +
      `CtaBand` buttons deep-link to them.
- [ ] Backgrounds follow the rhythm; no two adjacent blocks share a color; color blocks use
      `bordered`.
- [ ] Thick black `2.5px` borders + hard offset shadows; Anton uppercase display, DM Sans body.
- [ ] 100% original Closer copy + `<Placeholder>` / `<Avatar>` / `lucide-react` media — zero
      30MPC text, names, or numbers.
- [ ] `export const metadata` set from the title/description above; fully responsive.
