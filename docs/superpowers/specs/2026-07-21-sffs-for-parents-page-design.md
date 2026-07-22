# SFFS — "For Parents" Page — Design Spec

**Date:** 2026-07-21
**Repo:** `kimkhoi2202/sffs-website` (Next.js 16 App Router, Tailwind v4, neo-brutalist "Closer" system)
**Scope (this spec):** Build a new `/parents` route + add a "For Parents" link to the top nav. Mission-focused, no email capture form. Homepage rewrite is explicitly **out of scope**.

---

## 1. Goal & context

The live homepage currently sells an off-brand **$67 adult diagnostic quiz** ("The Fella Test"), which contradicts the real strategy: a kid-facing brain-*games* brand where the website attracts kids and **captures parents**. This spec does **not** fix the homepage — it adds a parent-facing page that explains the mission in the **parent voice**: *"the good kind of screen time / brains, not brain rot."*

**Audience:** parents of ~8–14 year-olds who are skeptical of screens and skeptical of edu-hype.

**Job of the page:** make a skeptical parent trust the mission and feel good about their kid playing — without asking for anything (no form this pass), then send them back to the product.

### Hard guardrails (non-negotiable — from brand memory + brainlift)
- **Never claim the app makes kids smarter / raises IQ / boosts grades.** This is the Lumosity $2M FTC line. Sell on fun, real challenge, focus, and anti-brain-rot.
- The games **measure / exercise** working memory in the moment; they do **not** durably raise it (far transfer ≈ 0). Approved language: "gives working memory a real workout," "a real mental challenge." Forbidden: "improves IQ," "makes them smarter," "boosts grades," "trains their brain to be smarter."
- **COPPA/CARU-safe:** no child PII referenced or collected; truthful, non-manipulative copy; no dark patterns / false urgency. (No form this pass, but the copy still states the privacy posture truthfully.)
- **No Alpha School / Alpha AI branding** or implied school affiliation.

### Design system (reuse, do not reinvent)
- Neo-brutalist "Closer": thick black borders (`border-[2.5px] border-ink`), hard zero-blur shadows, Anton display (`font-display`, uppercase) + DM Sans body, flat bright color-blocks.
- Palette: `ink` #000, `paper` #fff, `blue` #839AFF, `mint` #C6FCD0 (= smart), `coral` #FD7962 (= dumb/fart), `yellow` #FCE552, `cream` #F6F4EE.
- Alternate section backgrounds so adjacent blocks contrast; never two identical `bordered` backgrounds back-to-back.

---

## 2. Architecture

### Files
| File | Action | Purpose |
|---|---|---|
| `app/parents/page.tsx` | **new** | The `/parents` route. Server Component. Renders `QuizNav` (static variant) + the section stack. Owns all page copy as typed data. |
| `components/quiz/quiz-nav.tsx` | **edit** | Add a "For Parents" nav link. Add an optional `static?: boolean` (or `alwaysOn`) prop so the bar is always visible on `/parents` (no hide-until-scroll). Change logo `href` from `#top` to `/` so it works cross-route. |
| `components/sections/parent-manifesto.tsx` | **new (optional)** | Small custom section for the black manifesto strip + the mission block, since there's no `PageHero` primitive in this repo. May instead be inline in `page.tsx` — see §4. |

`SiteFooter` is already rendered by `app/layout.tsx` for every route, so the page does **not** add a footer. `QuizNav` is added per-page (it is not in the layout), so `/parents` adds it itself.

### Data flow
- Static Server Component. All copy lives as typed consts in `app/parents/page.tsx` (mirrors the pattern in `app/page.tsx`: `STEPS`, `FEATURES`, `FAQ` arrays passed to section components).
- No client state except what the reused components already own (`Faq` is `[client]`; `QuizNav` is `[client]`).
- No new dependencies. Must pass `tsc --noEmit`.

### Nav-link decision
- The bar is a `1fr auto 1fr` grid: logo (left) · wordmark (center) · CTA (right). Add the "For Parents" text link into the **right column**, before the existing "Take the test" button (`col-start-3`, a flex row: link + button). On small screens where the wordmark hides, keep both the link and button; if too tight, the link may drop below `sm` (acceptable — the page is still reachable from the footer). Exact responsive behavior to be finalized in the implementation plan.
- The "Take the test" button stays **unchanged** (homepage messaging out of scope).
- On `/parents`, render `QuizNav` in its always-visible (`static`) mode so the bar doesn't hide at the top of a page with no full-bleed hero scroll trigger.

---

## 3. Page section stack (top → bottom)

Background rhythm: `blue → ink → cream → paper → mint → paper → green`.

1. **Hero** (custom, `background="blue"`)
2. **Manifesto strip** (custom, `background="ink"`)
3. **Comparison** — "The feed vs. the fella" (`Comparison`, `background="cream"`)
4. **Feature grid** — "What it actually is" (`FeatureGrid`, `columns={2}`, `background="paper"`)
5. **Mission block** (custom, `background="mint"`)
6. **Parent FAQ** (`Faq`, `background="paper"`)
7. **Closing CTA** (`CtaBand`, `background="green"`, no form)

---

## 4. Final copy (verbatim)

### 1. Hero — `background="blue"`
- **Eyebrow:** `FOR PARENTS`
- **Headline (Anton/uppercase):** `BRAINS, NOT BRAIN ROT.`
- **Sub:** The internet is a machine built to turn your kid's brain to mush. Smart Fella or Fart Smella is the opposite — a dumb little game that makes thinking feel like a flex.
- **Link (text, not big CTA):** `← See the game` → `/`
- Mascot brain (`/logo.png` or the two-tone brain asset) optional visual, right/under headline.

### 2. Manifesto strip — `background="ink"` (paper text)
Big Anton, centered:
> EVERYTHING ONLINE IS TRYING TO MAKE YOUR KID DUMBER. WE MAKE THINKING THE FLEX.

### 3. Comparison — `background="cream"`
- **title:** `The feed vs. the fella`
- **theirLabel:** `Brain rot`
- **ourLabel:** `SFFS`
- **theirPoints:**
  - Infinite scroll designed to never end
  - Rewards zoning out
  - Gets dumber the longer they watch
  - Built to keep them up till 2am
- **ourPoints:**
  - A challenge with an actual finish line
  - Rewards focus, memory, and pattern-hunting
  - Gets harder as they get better
  - A few rounds, then they put it down

### 4. Feature grid — `background="paper"`, `columns={2}`, title `What it actually is`
1. **A game, not a feed** — It has a finish line. No infinite scroll, no autoplay, no rabbit hole.
2. **An actual challenge** — Memory and pattern puzzles that make kids lean in, not zone out.
3. **Speaks their language** — Goofy on purpose. They play because they *want* to, not because you made them.
4. **No ads, no dark patterns** — We don't sell your kid's attention. No ads pointed at them, ever.

(Icons from `lucide-react`, e.g. `Gamepad2`, `BrainCircuit`/`Puzzle`, `Smile`/`Sparkles`, `ShieldCheck`.)

### 5. Mission block — `background="mint"`
- **Eyebrow:** `OUR MISSION`
- **Heading (Anton):** `WE WANT THINKING TO BE THE FLEX`
- **Body (two short paras):**
> Kids are handed screens engineered to hold them as long as humanly possible. The reward for scrolling is just… more scrolling. We think that's a terrible deal — and a beatable one.
>
> So we built a game that's genuinely fun and genuinely hard. You get ranked, you climb, you flex on your friends. The status isn't in the likes — it's in being sharp. If we can make *"I'm smart"* the coolest thing a kid can say, we've done our job.

### 6. Parent FAQ — `background="paper"`, title `Questions parents actually ask`
- **Q: Is this just another addictive game?**
  A: No bottomless feed, no autoplay. Rounds end. It's built to be put *down* — the opposite of the apps fighting for your kid's every waking second.
- **Q: Does it make my kid smarter?**
  A: "Smarter" is a fuzzy word, so here's the straight version: the games give working memory a real workout — a genuine mental challenge, not mindless tap-to-win. What we'll never tell you is that a game raises your kid's IQ or grades. No game does that, and the company that promised it paid a $2M FTC fine. Our pitch is simpler and true — we make thinking fun enough to beat the feed.
- **Q: What's the right amount of time?**
  A: A few rounds. The game doesn't beg for more — when your kid's done, it's done.
- **Q: What ages is it for?**
  A: Built for kids old enough to want to beat their friends — roughly 8 to 14. Younger kids can absolutely play; the ranking just means more the older they get.
- **Q: Is my kid's data safe?**
  A: We don't collect kids' data. If we ever email anyone, it's a parent — never your child. No child names, ages, or profiles.
- **Q: Do you have ads?**
  A: None aimed at your kid. We're not in the business of renting out their attention.

### 7. Closing CTA — `CtaBand`, `background="green"`
- **title:** `See what they'll actually be playing`
- **primaryCta:** `{ label: "Play Smart Fella or Fart Smella", href: "/" }`
- **secondaryCta:** `null`
- No form.

---

## 5. Accessibility & quality bar
- Reused sections already handle reveal/reduced-motion. Custom sections must respect `prefers-reduced-motion` (match the `Reveal`/`QuizNav` pattern) and use semantic headings (single `<h1>` in the hero, `<h2>` per section).
- Nav link is a real `<a href="/parents">` with a discernible label; keyboard-focusable; passes color-contrast on the `paper` bar.
- `tsc --noEmit` clean. Only the files in §2 are created/edited. No new deps, no `npm install`, no edits to `globals.css`/`layout.tsx`/`lib/`/config.

## 6. Out of scope (explicit)
- Homepage rewrite / removing the $67 quiz framing / adult testimonials.
- Email capture form + backend (parent list). Deferred to a later pass.
- Deciding quiz vs. game vs. both as the product model.
- Any change to the "Take the test" nav button.

## 7. Open items to confirm during implementation
- Which mascot asset to show in the hero (`/logo.png`, `/wordmark.png`, or the two-tone brain SVG in `GTM/brand-assets/`).
- Exact responsive treatment of the new nav link below `sm`.
- Git handling: this is a teammate's repo — build on a feature branch and open a PR rather than committing to `main` (confirm with Grace before pushing).
