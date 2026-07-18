# The Book on Cold Calling — Build Blueprint

> Build spec for the **Closer** design-system clone of the book landing page. Assemble from
> existing primitives (`@/components/ui/*`) and sections (`@/components/sections/*`). **All copy
> below is original placeholder copy for "Closer" — never reproduce 30MPC text, book/author
> names, or numbers.** All media = `<Placeholder>` / `<Avatar>` / `lucide-react`.
> `SiteHeader` / `SiteFooter` are already mounted in the root layout; do **not** render them here.

---

## Purpose
The page is a long-form **sales landing page** for Closer's flagship book on cold calling. It has
one job — sell the book to individual reps and to teams. It opens with a cover-and-buy hero, backs
it with social proof, surfaces the offer (pricing) early, then builds desire (problem →
what's-inside → chapter outline → authors), reinforces with a wall of reviews, knocks down
objections (FAQ), and closes with a final CTA. A "Buy the book" button recurs down the page and
always anchor-scrolls to the pricing block.

## Route
`app/the-book-on-cold-calling/page.tsx` (Server Component shell; add `export const metadata`).

## Suggested metadata (original)
- **`<title>`:** `The Cold Call Playbook — Book More Meetings | Closer`
- **`<meta name="description">`:** `Closer's step-by-step book for turning dreaded cold calls into
  booked meetings — openers, objection frameworks, and dial-blitz systems used by top reps. Single
  copy, 3-pack, and team bulk options, with bonus resources included.`

## Anchors
- Give the pricing `Section` `id="pricing"`; **every** "Buy the book" CTA (hero, chapter outline,
  testimonial wall, closing band) deep-links to `#pricing`.

---

## Observed source structure (reference only — no text copied)
`raw/pages/the-book-on-cold-calling.html` block order (Webflow, minified), studied for
**structure / rhythm only**:
1. `section is-header blue` — **book hero**: headline + subhead + "Buy The Book" button + a
   bonus-teaser line, with a **book cover** image and floating reader **photos** on the right.
2. `section-divider-wrapper` — thin full-bleed colored **divider** strip (recurs between blocks).
3. `section grey` — **social proof**: a **testimonial carousel** (swiper of reader quotes) plus a
   **company logo marquee** ("at companies like") and a Buy button — all in one block.
4. `section red` (`id="pricing"`) — **pricing**: three `book-pricing-item` cards (1 / 3 / 10
   books) each with a cover, blurb, price, and buy button.
5. `section mint` — **problem/agitation**: "most people think it's a waste of time" heading + 3
   Lottie-icon pain rows + a "here's the harsh truth" footer callout.
6. `section` (white) — **what's inside**: "leave every session with a meeting" + a 4-card grid of
   benefits, each with media (one card embeds QR/audio + video players).
7. `section_coursetemplate-outline / -intro` — **chapter outline**: "course outline" heading then
   3 numbered parts (Section I / II / III), each rich text + image, then a Buy button.
8. `section` (white) — **about the authors**: heading + intro + 2 author cards (photo, name, bio).
9. `footer section blue` — **testimonial wall**: "join these sellers…" + a large masonry grid of
   avatar + star-rating + blurb cards, closing with a Buy button. *(This is a content block, not
   the site footer.)*
10. `section grey` — **FAQ**: "FAQs" + a `faq6` accordion + a contact line.

**Mapping decision:** the order below mirrors the source 1:1 (hero → proof+logos → pricing →
problem → what's-inside → chapters → authors → reviews wall → FAQ) and maps each block to a
component export. **`StatBand` (§3) and `CtaBand` (§11) are added** to hit the "stats" and closing-
CTA beats and to round the page out; both fit the brand. (Fidelity note: the source places
**pricing early**, right after the first proof block — kept as-is. The source ends on the FAQ; the
added `CtaBand` gives a stronger close — drop it for strict source order.)

---

## Section order (quick reference)

| # | Component (export) | File | Variant / key props | Background | Client? |
|---|---|---|---|---|---|
| 1 | `BookHero` | `sections/book-hero.tsx` | cover + price + buy CTA | `blue` | server |
| 2 | `TestimonialMarquee` + `LogoCloud` | `sections/testimonials.tsx` + `sections/logo-cloud.tsx` | scroller + `variant="marquee"` | `cream` | server |
| 3 | `StatBand` | `sections/stat-band.tsx` | 3–4 proof numbers | `ink` | server |
| 4 | `Pricing` | `sections/pricing.tsx` | 3 book bundles, `id="pricing"` | `coral` | server |
| 5 | `FeatureGrid` | `sections/feature-grid.tsx` | `columns={3}` (problem) | `mint` | server |
| 6 | `FeatureGrid` | `sections/feature-grid.tsx` | `columns={2}` (what's inside) | `paper` | server |
| 7 | `Steps` | `sections/steps.tsx` | 3 chapters | `yellow` | server |
| 8 | `Instructors` | `sections/instructors.tsx` | `columns={2}` (authors) | `paper` | server |
| 9 | `Testimonials` | `sections/testimonials.tsx` | grid wall + Buy CTA | `blue` | server *(opt. [client])* |
| 10 | `Faq` | `sections/faq.tsx` | accordion | `cream` | `[client]` |
| 11 | `CtaBand` | `sections/cta-band.tsx` | `align="center"` | `coral` | server |

**Color rhythm:** `blue → cream → ink → coral → mint → paper → yellow → paper → blue → cream → coral`
— no two adjacent blocks share a color; bright accents (blue/coral/mint/yellow) alternate with
neutral/dark (cream/paper/ink). Use `bordered` on full-bleed color blocks for the sticker-sheet look.

---

## Section details

### 1. `BookHero` — cover + buy
- **Export:** `BookHero` · file `components/sections/book-hero.tsx` · Server
- **Background:** `blue`
- **Variant / props:** two-column (copy left, cover right). `title`, `subtitle`, `price` (e.g.
  "$19"), `bullets` (2–3 bonus items), `primaryCta={{ label:"Buy the book", href:"#pricing" }}`.
  Right column = a large `<Placeholder aspect="3/4" label="Book cover">` with 2–3 overlapping
  circular `<Avatar>` reader photos. `bordered`.
- **Copy note (original):** Anton headline promising more booked meetings from every dial session;
  one-line subhead; small "free bonuses included" teaser. Do **not** reuse 30MPC's headline.

### 2. `TestimonialMarquee` + `LogoCloud` — early social proof
- **Export:** `TestimonialMarquee` (`components/sections/testimonials.tsx`) + `LogoCloud`
  (`components/sections/logo-cloud.tsx`) · Server — rendered as one bordered block.
- **Background:** `cream`
- **Variant / props:** `TestimonialMarquee` with `speed` and 5–6 quote objects (quote,
  `<Avatar initials>`, name, role); beneath it `LogoCloud variant="marquee"`
  `label="Trusted at teams like"` with 8–12 `<Placeholder label="Logo">` marks.
- **Copy note (original):** One-line reader wins + a "trusted at teams like" logo label. Original
  quotes/names; placeholder logos only.
- **Client?** Server (CSS marquee — no arrows/JS). Mirrors the source carousel without needing state.

### 3. `StatBand` — headline proof numbers
- **Export:** `StatBand` · file `components/sections/stat-band.tsx` · Server
- **Background:** `ink` (bright Anton numbers on black).
- **Variant / props:** `eyebrow`, `title`, `stats={[{value,label}]}` — 3–4 items.
- **Copy note (original):** Invent Closer's own metrics (readers trained, calls booked per dials,
  calls analyzed, top reps interviewed). **Original round numbers only** — do not reuse source figures.

### 4. `Pricing` — buy options
- **Export:** `Pricing` · file `components/sections/pricing.tsx` · Server
- **Background:** `coral`
- **Variant / props:** wrap in `Section id="pricing"`; `eyebrow="Buy options"`, `title`,
  `tiers={[…3…]}`. Each tier: cover `<Placeholder>`, name, one-line note, price, pill
  `Button variant="ink"` ("Buy the book"). Flag the mid tier as best value.
- **Copy note (original):** "One copy" (for you), "3-pack" (share with your pod), "10-pack" (arm
  the whole team) — original blurbs + placeholder `$` prices; note bulk discounts.

### 5. `FeatureGrid` — the problem (agitation)
- **Export:** `FeatureGrid` · file `components/sections/feature-grid.tsx` · Server
- **Background:** `mint`
- **Variant / props:** `eyebrow`, `title`, `columns={3}`, `features` (each `{ icon:<lucide>,
  title, body }`). Add a closing callout `<p>`/`Card` under the grid for the "hard truth" line.
- **Copy note (original):** 3 pains — nobody answers; when they do they brush you off; so reps
  avoid the phone and hide behind email. Callout: it only sucks without a system. Original wording.

### 6. `FeatureGrid` — what's inside (what you get)
- **Export:** `FeatureGrid` · file `components/sections/feature-grid.tsx` · Server
- **Background:** `paper`
- **Variant / props:** `eyebrow`, `title`, `intro`, `columns={2}`, `features` — 4 benefit cards,
  each with a `<Placeholder aspect="16/9">` media and accent `Badge` (alternate `yellow`/`coral`/
  `mint`). Represent the source's QR/audio card as `<Placeholder label="QR / audio">`. `bordered`.
- **Copy note (original):** Exactly what to say (openers + objection scripts); how it should
  sound (audio via QR); frameworks that fit any industry; every tactic grounded in real call data.

### 7. `Steps` — chapter outline
- **Export:** `Steps` · file `components/sections/steps.tsx` · Server
- **Background:** `yellow`
- **Variant / props:** `eyebrow="Inside the book"`, `title`, `steps={[…3…]}` — each `{ n, label,
  title, body, media:<Placeholder> }`. Add a centered "Buy the book" `Button` (→ `#pricing`) below.
- **Copy note (original):** Part 1 — win the opening (openers + problem framing); Part 2 — handle
  the rest of the call (objections, voicemails, gatekeepers); Part 3 — become a dialing machine
  (conversion + volume). Original chapter names.

### 8. `Instructors` — about the authors
- **Export:** `Instructors` · file `components/sections/instructors.tsx` · Server
- **Background:** `paper`
- **Variant / props:** `eyebrow="About the authors"`, `title`, `columns={2}`, `people` — each
  `{ name, role, bio, avatar:<Avatar>/<Placeholder> }`. **Optional** lead-in `QuoteFeature`
  (single bold author pull-quote) directly above the cards, same block/bg, for a stronger voice.
- **Copy note (original):** Two Closer founders, practitioners first — one a former VP of sales,
  one a former top enterprise rep. **Invent names/bios** (not the source authors).

### 9. `Testimonials` — reviews wall
- **Export:** `Testimonials` · file `components/sections/testimonials.tsx` · Server
- **Background:** `blue`
- **Variant / props:** multi-column grid; `title`, `items` (quote, name, role, `<Avatar>` initials,
  `rating` shown via lucide `Star` icons). End with a centered `Button variant="paper"`
  ("Buy the book" → `#pricing`).
- **Copy note (original):** Heading inviting readers to join others booking meetings; ~8–10 short
  original reviews with placeholder names/roles.
- **Client?** Server by default. **[client] only if** you add "read more" expansion (Base UI
  `Dialog`/`Collapsible`); the static truncated version needs no client.

### 10. `Faq` — objection handling `[client]`
- **Export:** `Faq` · file `components/sections/faq.tsx`
- **Background:** `cream`
- **Variant / props:** Base UI accordion; `eyebrow="FAQ"`, `title`, `items={[{q,a}]}`, plus a
  contact line with a placeholder support address. **`[client]`** (accordion state).
- **Copy note (original):** 4–6 Q&As — team/bulk discounts, print vs digital, delivery time,
  refund policy, whether it suits new reps. One to two sentences each.

### 11. `CtaBand` — closing nudge
- **Export:** `CtaBand` · file `components/sections/cta-band.tsx` · Server
- **Background:** `coral`
- **Variant / props:** `align="center"`, `title`, `subtitle`,
  `primaryCta={{ label:"Buy the book", href:"#pricing" }}`, optional soft secondary link.
- **Copy note (original):** One punchy closing line ("book more meetings starting on your next
  dial session") driving the final action back to pricing.

---

## Build checklist
- [ ] Sections in the order above; `BookHero` first, `CtaBand` last.
- [ ] Pricing `Section` has `id="pricing"`; **all** "Buy the book" CTAs deep-link to it.
- [ ] `[client]` is only **Faq** (and optionally the reviews wall if it gains read-more); the rest
      are Server Components.
- [ ] Backgrounds follow the rhythm; no two adjacent blocks share a color; color blocks use `bordered`.
- [ ] Thick black `2.5px` borders + hard offset shadows; Anton uppercase display, DM Sans body;
      pill buttons, `rounded-2xl` cards.
- [ ] 100% original Closer copy + `<Placeholder>` / `<Avatar>` / `lucide-react` media — zero 30MPC
      text, names, or numbers.
- [ ] `export const metadata` set from the title/description above; fully responsive (hero,
      pricing, and grids stack cleanly on mobile).
