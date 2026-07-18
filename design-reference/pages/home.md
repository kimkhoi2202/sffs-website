# Build Blueprint — Home (`/`)

> Design-system clone of a 30MPC-style sales-education brand. Placeholder brand: **Closer**.
> All copy below is ORIGINAL placeholder direction — never lift text from the reference site.
> This blueprint is derived from the real page's *section order only*; enriched into a full,
> conversion-focused homepage.

## Page purpose
Front door for **Closer**, a modern sales-skills platform (courses, newsletter, podcast,
templates, community). Convert cold visitors into signups by stacking bold social proof,
content offerings, differentiation, and a strong closing CTA.

- **Route:** `app/page.tsx` (the `/` route). Add `export const metadata`.
- **Layout note:** `SiteHeader` + `SiteFooter` are already mounted in the root layout —
  **do NOT add them here.** The page renders only the ordered sections below.
- **`<title>`:** `Closer — Modern Sales Training That Actually Closes Deals`
- **meta description:** `Closer teaches reps the exact plays the top 1% use to book meetings, run discovery, negotiate, and close — with courses, a weekly newsletter, a podcast, and ready-to-steal templates.`

## Color rhythm (adjacent blocks always contrast)
`mint → paper → ink → cream → coral → paper → cream → paper → mint → cream → paper → ink → yellow`
No two identical `bordered` backgrounds sit back-to-back. `StatBand` (ink) and `CtaBand` (ink)
are the two dark anchors; `MarqueeHeadline` (coral) is a punchy divider mid-page.

---

## Ordered sections (13)

| # | Component | File | `background` | Client | Variant / note |
|---|---|---|---|---|---|
| 1 | `Hero` | sections/hero.tsx | `mint` | — | centered, dual CTAs + media |
| 2 | `LogoCloud` | sections/logo-cloud.tsx | `paper` | — | `variant="marquee"` |
| 3 | `StatBand` | sections/stat-band.tsx | `ink` | — | dark social-proof anchor |
| 4 | `Bento` | sections/bento.tsx | `cream` | — | content offerings grid |
| 5 | `MarqueeHeadline` | sections/marquee-headline.tsx | `coral` | — | scrolling divider |
| 6 | `FeatureGrid` | sections/feature-grid.tsx | `paper` | — | `columns={3}`, lucide icons |
| 7 | `Comparison` | sections/comparison.tsx | `cream` | — | old-school vs Closer |
| 8 | `FeatureTabs` | sections/feature-tabs.tsx | `paper` | `[client]` | tactic tracks |
| 9 | `Testimonials` | sections/testimonials.tsx | `mint` | — | card grid |
| 10 | `Pricing` | sections/pricing.tsx | `cream` | — | 3 tiers, middle featured |
| 11 | `Faq` | sections/faq.tsx | `paper` | `[client]` | Base UI accordion |
| 12 | `CtaBand` | sections/cta-band.tsx | `ink` | — | final conversion push |
| 13 | `NewsletterSignup` | sections/newsletter-signup.tsx | `yellow` | `[client]` | `variant="inline"` |

---

## Section details

### 1. `Hero` — `background="mint"`
Big centered Anton headline, subtitle, two CTAs, and a media placeholder (echoes the reference's
course carousel).
- **props:** `title="Sell sharper. Close faster."` · `subtitle="Skip the recycled 2000s playbooks. Get the exact plays the best reps use to book meetings, run real discovery, and close — taught by operators who still sell."` · `primaryCta={{ label: "Start free", href: "/signup" }}` · `secondaryCta={{ label: "Train your team", href: "/teams" }}` · `mediaLabel="Course library preview"`

### 2. `LogoCloud` — `background="paper"` · `variant="marquee"`
Trust strip directly under the hero.
- **props:** `label="Trusted by revenue teams at fast-growing companies"` · `companies={["Northwind","Acme Cloud","Vertex","Loop","Brightsend","Cargo","Meridian","Payline"]}` (invented names; renders as `<Placeholder>` logo tiles scrolling).

### 3. `StatBand` — `background="ink"`
Dark, high-contrast numbers band for instant credibility.
- **props:** `eyebrow="By the numbers"` · `title="Reps don't plateau here"` · `stats=[{value:"4.1M+", label:"podcast downloads"}, {value:"72k", label:"weekly readers"}, {value:"18", label:"expert instructors"}, {value:"9", label:"tactic tracks"}]` (placeholder figures).

### 4. `Bento` — `background="cream"`
"Greatest hits" style asymmetric grid of the brand's content offerings (mirrors reference bento).
- **props:** `eyebrow="Everything in one place"` · `title="Ways to get better this week"` · `description="Free plays, deep courses, and a community that actually replies."` — tiles cover: **Podcast** (weekly tactics), **Newsletter** (one play every Tuesday), **Templates** (steal-ready scripts), **Community** (peer role-play), **Courses** (self-paced tracks). Use `<Placeholder>` + `lucide-react` icons per tile.

### 5. `MarqueeHeadline` — `background="coral"`
Punchy scrolling divider between the offerings block and the value blocks.
- **props:** `text="Book more meetings · Run better discovery · Close bigger deals ·"` · `speed={30}` (repeats across the strip in Anton uppercase).

### 6. `FeatureGrid` — `background="paper"` · `columns={3}`
Value props / "what you'll actually learn."
- **props:** `eyebrow="Why Closer"` · `title="Tactics you can use on your next call"` · `intro="No theory dumps — every lesson ends with a script, a template, or a checklist."` · `features` = 6 icon cards: *Cold outreach that gets replies*, *Discovery that surfaces real pain*, *Multithreading into the C-suite*, *Negotiation without discounting*, *Forecasting you can defend*, *Objection handling on the fly* (each 1-line body + a lucide icon).

### 7. `Comparison` — `background="cream"`
Them-vs-us differentiation (core to the brand's attitude).
- **props:** `title="Old-school training vs Closer"` · `theirPoints=["Generic frameworks from a 2000s binder","All theory, zero scripts","One boring day of workshops","Trainers who haven't sold in years"]` · `ourPoints=["Plays pressure-tested on live deals","A template or checklist in every lesson","Learn in 15-minute reps, on your schedule","Taught by operators still in the arena"]`.

### 8. `FeatureTabs` — `background="paper"` · `[client]`
Interactive tabbed showcase of tactic tracks (echoes the reference's course carousel). Base UI `Tabs`.
- **props:** `eyebrow="Tactic tracks"` · `title="Pick your path"` · `tabs` = 4: **Cold Calling**, **Discovery**, **Negotiation**, **Closing** — each with a 1-line summary, 3 bullet outcomes, and a `<Placeholder>` panel image.

### 9. `Testimonials` — `background="mint"`
Card grid of social proof (mirrors reference testimonials block).
- **props:** `eyebrow="Loved by reps"` · `title="Quota-carriers who leveled up"` · testimonials use invented names/roles + `<Avatar initials>` (e.g. *Maya R., AE @ Northwind*; *Devon K., SDR Lead @ Loop*; *Priya S., Enterprise AE @ Vertex*). Original 1-2 sentence quotes about booking meetings / closing bigger.

### 10. `Pricing` — `background="cream"`
Membership tiers, middle tier featured.
- **props:** `eyebrow="Plans"` · `title="Start free, upgrade when you're winning"` · `tiers` = **Free** ($0 — newsletter + podcast + sample lessons), **Pro** ($29/mo — all courses + templates + community, *most popular*), **Team** (custom — seats, dashboards, live coaching). Pill CTAs per tier.

### 11. `Faq` — `background="paper"` · `[client]`
Base UI accordion of common objections.
- **props:** `eyebrow="Questions"` · `title="Before you sign up"` · `items` = 5 original Q/As: *Is this for SDRs or AEs?*, *How much time per week?*, *Do you offer team plans?*, *Can I expense it?*, *What if it's not for me?* (mention a simple refund/cancel-anytime line).

### 12. `CtaBand` — `background="ink"`
Final conversion push, dark to contrast the mint testimonials/cream/paper above.
- **props:** `title="Your next quarter starts with your next call"` · `subtitle="Join thousands of reps sharpening their game every week."` · `primaryCta={{ label: "Start free", href: "/signup" }}` · `secondaryCta={{ label: "See pricing", href: "#pricing" }}` · `align="center"`.

### 13. `NewsletterSignup` — `background="yellow"` · `[client]` · `variant="inline"`
Email capture as the closing block (sits directly above the footer).
- **props:** `variant="inline"` · `title="One sales play in your inbox every Tuesday"` · `subtitle="Short, tactical, free. Unsubscribe anytime."` (email `Input` + pill submit `Button`; include a tiny privacy line — original wording).

---

## Builder checklist
- [ ] Import sections by direct path from `@/components/sections/*`; primitives from `@/components/ui/*`.
- [ ] Backgrounds match the rhythm table exactly; keep `bordered` sections from repeating a color back-to-back.
- [ ] `Faq`, `FeatureTabs`, `NewsletterSignup` are the only `"use client"` sections.
- [ ] All copy original (Closer voice); all media via `<Placeholder>` / `<Avatar>` / lucide.
- [ ] Add `id="pricing"` on the `Pricing` section so the CtaBand `#pricing` link resolves.
- [ ] `export const metadata` uses the title + description above.
