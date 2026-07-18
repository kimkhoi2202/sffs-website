# Page Blueprint — Teardowns (`/teardown`)

> Build spec for the **Closer** clone. Design-system clone only: section **order** is derived
> from the structure of `raw/pages/teardown.html` (Webflow "Live Tactic Teardowns" page).
> **All copy below is original placeholder text — nothing is lifted from 30MPC.**

## Purpose
Landing page for **Closer Teardowns** — the flagship series where real, recorded sales calls
are dissected line-by-line so reps can steal the exact moves that move deals. The page hooks
the visitor with the latest teardown, explains what they'll learn, lets them browse the full
archive of episodes, builds trust with social proof, and converts them into subscribers.

## Route
`app/teardown/page.tsx` — assembles the sections below and exports `metadata`.
Server Component by default; `SiteHeader` / `SiteFooter` come from the root layout, so this
page does **not** render header, footer, or nav.

## Suggested metadata (original)
- **`<title>`:** `Teardowns — Watch Real Sales Calls Get Dissected | Closer`
- **`description`:** `Every week Closer breaks down a real sales call, moment by moment — the
  fumble, the save, and the exact line that turned it around. Watch the latest teardown, browse
  the archive, and get each new episode free.`

## Source-structure mapping (structure only — no copy reused)
| Source block in `teardown.html` | Clone section(s) |
|---|---|
| Red hero: eyebrow + big title + featured "next" event (date, title, CTA, guest avatars) | `PageHero` + `VideoFeature` |
| "Upcoming events" list + subscribe box | folded into `PodcastList` + `NewsletterSignup` |
| Grey "Watch past events": filters + episode list + pagination | `PodcastList` |
| "Ready to dive in?" newsletter + logo marquee | `NewsletterSignup` + `LogoCloud` |
| Footer testimonials grid + closing CTA (part of global footer in source) | `Testimonials` + `CtaBand` (page sections here) |
| A "what you'll learn" value block does not exist in source — added per teardown page intent | `FeatureGrid` |

## Color rhythm
`coral → ink → cream → paper → mint → blue → yellow → ink` — every neighbor contrasts; no two
identical `bordered` sections are adjacent.

---

## Ordered section list (8 sections)

### 1. `PageHero` — background: `coral` — [server]
- **File:** `components/sections/page-hero.tsx`
- **Copy note:** Eyebrow "The Teardown Series"; display title along the lines of *"Watch real
  sales calls get taken apart."*; subtitle promising a fresh recorded deal broken down every week.
- **Props/variant:** `eyebrow`, `title`, `subtitle`, `align="left"`, primary `cta` "Watch the
  latest", secondary cta "Subscribe free", `background="coral"`.
- Mirrors the source's full-bleed red hero.

### 2. `VideoFeature` — background: `ink` — [server]
- **File:** `components/sections/video-feature.tsx`
- **Copy note:** "This week's teardown" — one-line caption naming the (placeholder) episode and
  the type of call being dissected (e.g. a discovery call that nearly stalled).
- **Props/variant:** `layout="split"`, `title`, `caption`, `background="ink"`; uses
  `<Placeholder aspect="16/9">` for the video still. Cinematic dark block right after the hero.
- Maps to the featured "next event" that sits inside the source hero.

### 3. `FeatureGrid` — background: `cream` — [server]
- **File:** `components/sections/feature-grid.tsx`
- **Copy note:** "What you'll steal from every teardown" — 3 outcome cards (spot the exact
  moment a deal turns, hear the words that reset a stalled call, walk away with a play you can
  run tomorrow).
- **Props/variant:** `eyebrow`, `title`, `intro`, `columns={3}`, `features`, `background="cream"`.
  *(Alternate: `Steps` if framed as "how a teardown works" instead of outcomes.)*

### 4. `PodcastList` — background: `paper` — [server]
- **File:** `components/sections/podcast.tsx`
- **Copy note:** "Every teardown in one place" — a featured episode plus a scannable list of
  past episodes (title, guest, date). Note that topic filters/pagination in the source are
  optional here.
- **Props/variant:** `eyebrow`, `title`, `featured`, `episodes`, `background="paper"`.
- Maps to the grey "watch past events" archive (and rolls in the "upcoming events" list).

### 5. `LogoCloud` — background: `mint` — [server]
- **File:** `components/sections/logo-cloud.tsx`
- **Copy note:** "Where our members are closing" — a marquee strip of placeholder company names.
- **Props/variant:** `variant="marquee"`, `label`, `companies`, `background="mint"`.
- Maps to the logo marquee inside the source's "ready to dive in" block.

### 6. `Testimonials` — background: `blue` — [server]
- **File:** `components/sections/testimonials.tsx`
- **Copy note:** "Reps who watch, win" — 3–6 short quotes from placeholder sellers on how a
  teardown changed the way they run calls.
- **Props/variant:** `eyebrow`, `title`, `testimonials`, `background="blue"`.
- Maps to the testimonials grid rendered in the source footer.

### 7. `NewsletterSignup` — background: `yellow` — **[client]**
- **File:** `components/sections/newsletter-signup.tsx`
- **Copy note:** "Get every new teardown in your inbox" — one email field, note the weekly
  cadence and that it's free.
- **Props/variant:** `variant="inline"`, `title`, `subtitle`, `background="yellow"`. Client
  component (form state).
- Maps to the "ready to dive in?" subscribe box + the upcoming-events signup.

### 8. `CtaBand` — background: `ink` — [server]
- **File:** `components/sections/cta-band.tsx`
- **Copy note:** "Bring us your worst call" — invite visitors to submit a recording to be torn
  down on a future episode.
- **Props/variant:** `title`, `subtitle`, `align="center"`, primary cta "Submit a call",
  secondary cta "Browse teardowns", `background="ink"`.
- Maps to the closing CTA in the source footer.

---

## Client vs server summary
- **[client]:** `NewsletterSignup` (form state).
- **[server]:** `PageHero`, `VideoFeature`, `FeatureGrid`, `PodcastList`, `LogoCloud`,
  `Testimonials`, `CtaBand`.

## Build checklist
- [ ] Reuse shared primitives/sections; no ad-hoc restyling.
- [ ] Alternate backgrounds per the color rhythm; no adjacent duplicates.
- [ ] Original placeholder copy only; `<Placeholder>` / `<Avatar>` / lucide for all media.
- [ ] `export const metadata` set from the suggested title + description.
- [ ] Do not render header/footer/nav (provided by root layout).
- [ ] Type-safe; only `app/teardown/page.tsx` created for the page.
