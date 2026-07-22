# SFFS "For Parents" Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a mission-focused `/parents` route and a "For Parents" link in the top nav, in the parent voice ("brains, not brain rot"), reusing the existing neo-brutalist component library.

**Architecture:** A new Server Component page at `app/parents/page.tsx` renders a pinned `QuizNav` plus a stack of sections. Reused section components (`Comparison`, `FeatureGrid`, `Faq`, `CtaBand`) carry typed copy data; the hero, manifesto strip, and mission block are inline JSX built from the `Section`/`Heading`/`Eyebrow`/`Button` primitives. `QuizNav` gains three props (`pinned`, `homeHref`, `ctaHref`) so it can be always-visible and route-correct on sub-pages without changing homepage behavior. `SiteFooter` is already in the root layout, so the page adds no footer.

**Tech Stack:** Next.js 16.2.10 (App Router, RSC), React 19.2.4, TypeScript 5, Tailwind v4, lucide-react 1.24.0, GSAP (already used by `QuizNav`).

## Global Constraints

- **Never claim the product makes kids smarter / raises IQ / boosts grades.** Approved: games "give working memory a real workout," "a real mental challenge." Forbidden: "improves IQ," "makes them smarter," "boosts grades," "trains their brain."
- **COPPA/CARU-safe copy:** no child PII referenced or collected; truthful, non-manipulative; no false urgency or dark patterns.
- **No Alpha School / Alpha AI branding** or implied school affiliation.
- **Only create/edit the files named in each task.** Do NOT modify `app/globals.css`, `app/layout.tsx`, `lib/*`, `components/ui/*` (except where a task explicitly edits a file), or any config.
- **No new dependencies**, no `npm install`.
- Server Components by default; add `"use client"` only for state/effects.
- Must pass `npm run typecheck` (`tsc --noEmit`) and `npm run lint` with no new errors.
- Design tokens: `border-[2.5px] border-ink`, hard zero-blur shadows, Anton (`font-display`, uppercase) + DM Sans, palette `ink/paper/blue/mint/green/coral/yellow/cream`. Alternate section backgrounds; never two identical `bordered` backgrounds adjacent.
- **Git:** this is a teammate's repo. Work on a feature branch (`feat/for-parents-page`); do NOT push to `main`. Confirm with Grace before opening a PR.

---

### Task 1: Extend `QuizNav` with pinned mode, home link, CTA link, and a "For Parents" nav link

**Files:**
- Modify: `components/quiz/quiz-nav.tsx` (full replacement below)

**Interfaces:**
- Consumes: `Button` from `@/components/ui/button`, `cn` from `@/lib/utils`, `next/link`.
- Produces: `QuizNav` now accepts `{ pinned?: boolean; homeHref?: string; ctaHref?: string }` (all optional; defaults preserve current homepage behavior: `pinned=false`, `homeHref="#top"`, `ctaHref="#pricing"`). Task 2 renders `<QuizNav pinned homeHref="/" ctaHref="/#pricing" />`.

- [ ] **Step 1: Replace the file contents**

Replace the entire contents of `components/quiz/quiz-nav.tsx` with:

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/** Scroll distance (px) to clear before the bar reveals (non-pinned mode). */
const REVEAL_AT = 120;

/**
 * Slim landing bar for the quiz routes.
 *
 * Default (home): hidden at the very top so the hero reads full-bleed, then
 * slides down once the visitor scrolls past REVEAL_AT.
 *
 * `pinned` (sub-routes like /parents): always visible — those pages have no
 * full-bleed hero scroll trigger, so the bar stays put and no ScrollTrigger runs.
 *
 * `homeHref` sets where the logo links ("#top" on the single-page home, "/" on
 * sub-routes). `ctaHref` sets the CTA target ("#pricing" on home, "/#pricing"
 * from a sub-route so it lands on the homepage pricing section).
 */
export function QuizNav({
  pinned = false,
  homeHref = "#top",
  ctaHref = "#pricing",
}: {
  pinned?: boolean;
  homeHref?: string;
  ctaHref?: string;
} = {}) {
  const [revealed, setRevealed] = useState(pinned);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useGSAP(() => {
    // Pinned bars are always shown — skip the scroll-driven reveal entirely.
    if (pinned) return;
    ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => setRevealed(self.scroll() > REVEAL_AT),
      onRefresh: (self) => setRevealed(self.scroll() > REVEAL_AT),
    });
  }, [pinned]);

  const showBar = pinned || revealed;

  return (
    <header
      inert={!showBar}
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b-[2.5px] border-ink bg-paper/95 backdrop-blur-sm",
        reducedMotion || pinned
          ? "transition-none"
          : "transition-[transform,opacity] duration-300 ease-out",
        showBar
          ? "translate-y-0 opacity-100"
          : "pointer-events-none -translate-y-full opacity-0",
      )}
    >
      <nav
        aria-label="Smart Fella or Fart Smella"
        className="mx-auto grid max-w-page grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-3 md:px-8"
      >
        <a
          href={homeHref}
          aria-label="Smart Fella or Fart Smella — home"
          className="col-start-1 inline-flex items-center justify-self-start"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- brand mark is a static public asset */}
          <img
            src="/logo.png"
            alt=""
            className="h-11 w-auto select-none md:h-12"
            draggable={false}
          />
        </a>
        {/* eslint-disable-next-line @next/next/no-img-element -- brand wordmark is a static public asset */}
        <img
          src="/wordmark.png"
          alt="Smart Fella or Fart Smella"
          className="col-start-2 pointer-events-none hidden h-12 w-auto max-w-full select-none justify-self-center object-contain md:block lg:h-14"
          draggable={false}
        />
        <div className="col-start-3 flex items-center justify-self-end gap-3 sm:gap-5">
          <Link
            href="/parents"
            className="hidden font-sans text-sm font-bold uppercase tracking-wide leading-none text-ink underline-offset-4 hover:underline sm:inline-block"
          >
            For Parents
          </Link>
          <Button
            href={ctaHref}
            variant="coral"
            size="sm"
            className="font-sans font-bold text-lg uppercase leading-none tracking-[-0.01em]"
          >
            Take the test
          </Button>
        </div>
      </nav>
    </header>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: exits 0, no errors.

- [ ] **Step 3: Lint the changed file**

Run: `npm run lint`
Expected: no new errors/warnings for `components/quiz/quiz-nav.tsx`.

- [ ] **Step 4: Visually verify homepage behavior is unchanged**

Run: `npm run dev`, open `http://localhost:3000`.
Expected: at the very top the bar is hidden; after scrolling ~120px it slides in; it now shows a **"For Parents"** link (≥`sm` width) left of the coral "Take the test" button; the logo still links to `#top`; clicking "For Parents" navigates to `/parents` (will 404 until Task 2 — acceptable at this step).

- [ ] **Step 5: Commit**

```bash
git add components/quiz/quiz-nav.tsx
git commit -m "feat(nav): add For Parents link + pinned/homeHref/ctaHref props to QuizNav"
```

---

### Task 2: Create the `/parents` page with all sections and copy

**Files:**
- Create: `app/parents/page.tsx`

**Interfaces:**
- Consumes: `QuizNav` (Task 1, with `pinned`/`homeHref`/`ctaHref`); `Section`, `Heading`, `Eyebrow`, `Button` from `@/components/ui/*`; `Comparison`, `FeatureGrid` (+ `Feature` type), `Faq` (+ `FaqItem` type), `CtaBand` from `@/components/sections/*`; icons from `lucide-react`.
- Produces: default-exported `ParentsPage` Server Component at route `/parents`; a `metadata` export.

- [ ] **Step 1: Create the file**

Create `app/parents/page.tsx` with:

```tsx
import type { Metadata } from "next";
import { Gamepad2, Brain, Sparkles, ShieldCheck } from "lucide-react";

import { QuizNav } from "@/components/quiz/quiz-nav";
import { Section } from "@/components/ui/section";
import { Heading } from "@/components/ui/heading";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Button } from "@/components/ui/button";
import { Comparison } from "@/components/sections/comparison";
import { FeatureGrid, type Feature } from "@/components/sections/feature-grid";
import { Faq, type FaqItem } from "@/components/sections/faq";
import { CtaBand } from "@/components/sections/cta-band";

export const metadata: Metadata = {
  title: { absolute: "For Parents — Smart Fella or Fart Smella" },
  description:
    "The good kind of screen time. Smart Fella or Fart Smella is a dumb little game that makes thinking feel like a flex — a real challenge, not a bottomless feed. Our mission, for parents.",
};

const FEATURES: Feature[] = [
  {
    icon: Gamepad2,
    title: "A game, not a feed",
    body: "It has a finish line. No infinite scroll, no autoplay, no rabbit hole.",
  },
  {
    icon: Brain,
    title: "An actual challenge",
    body: "Memory and pattern puzzles that make kids lean in, not zone out.",
  },
  {
    icon: Sparkles,
    title: "Speaks their language",
    body: "Goofy on purpose. They play because they want to, not because you made them.",
  },
  {
    icon: ShieldCheck,
    title: "No ads, no dark patterns",
    body: "We don't sell your kid's attention. No ads pointed at them, ever.",
  },
];

const FAQ: FaqItem[] = [
  {
    q: "Is this just another addictive game?",
    a: "No bottomless feed, no autoplay. Rounds end. It's built to be put down — the opposite of the apps fighting for your kid's every waking second.",
  },
  {
    q: "Does it make my kid smarter?",
    a: "“Smarter” is a fuzzy word, so here's the straight version: the games give working memory a real workout — a genuine mental challenge, not mindless tap-to-win. What we'll never tell you is that a game raises your kid's IQ or grades. No game does that, and the company that promised it paid a $2M FTC fine. Our pitch is simpler and true — we make thinking fun enough to beat the feed.",
  },
  {
    q: "What's the right amount of time?",
    a: "A few rounds. The game doesn't beg for more — when your kid's done, it's done.",
  },
  {
    q: "What ages is it for?",
    a: "Built for kids old enough to want to beat their friends — roughly 8 to 14. Younger kids can absolutely play; the ranking just means more the older they get.",
  },
  {
    q: "Is my kid's data safe?",
    a: "We don't collect kids' data. If we ever email anyone, it's a parent — never your child. No child names, ages, or profiles.",
  },
  {
    q: "Do you have ads?",
    a: "None aimed at your kid. We're not in the business of renting out their attention.",
  },
];

export default function ParentsPage() {
  return (
    <main id="main" className="flex-1">
      <QuizNav pinned homeHref="/" ctaHref="/#pricing" />

      {/* 1. Hero — pt offsets the fixed nav so the headline isn't tucked under it. */}
      <Section
        background="blue"
        padding="lg"
        className="pt-[96px] md:pt-[120px]"
        container="prose"
        containerClassName="text-center"
      >
        <Eyebrow>For Parents</Eyebrow>
        <Heading as={1} size="display" className="mt-4">
          Brains, not brain rot.
        </Heading>
        <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg font-medium leading-snug sm:text-xl">
          The internet is a machine built to turn your kid&apos;s brain to mush. Smart
          Fella or Fart Smella is the opposite — a dumb little game that makes thinking
          feel like a flex.
        </p>
        <div className="mt-8">
          <Button href="/" variant="paper" size="lg">
            ← See the game
          </Button>
        </div>
      </Section>

      {/* 2. Manifesto strip */}
      <Section
        background="ink"
        padding="md"
        bordered
        container="prose"
        containerClassName="text-center"
      >
        <Heading as={2} size="xl" className="text-balance">
          Everything online is trying to make your kid dumber. We make thinking the flex.
        </Heading>
      </Section>

      {/* 3. Comparison */}
      <Comparison
        revealContent
        background="cream"
        title="The feed vs. the fella"
        theirLabel="Brain rot"
        ourLabel="SFFS"
        theirPoints={[
          "Infinite scroll designed to never end",
          "Rewards zoning out",
          "Gets dumber the longer they watch",
          "Built to keep them up till 2am",
        ]}
        ourPoints={[
          "A challenge with an actual finish line",
          "Rewards focus, memory, and pattern-hunting",
          "Gets harder as they get better",
          "A few rounds, then they put it down",
        ]}
      />

      {/* 4. Feature grid */}
      <FeatureGrid
        revealContent
        background="paper"
        title="What it actually is"
        columns={2}
        features={FEATURES}
      />

      {/* 5. Mission block */}
      <Section background="mint" padding="lg" bordered container="prose">
        <Eyebrow>Our mission</Eyebrow>
        <Heading as={2} size="xl" className="mt-4">
          We want thinking to be the flex
        </Heading>
        <div className="mt-6 space-y-5 text-lg font-medium leading-relaxed">
          <p>
            Kids are handed screens engineered to hold them as long as humanly possible.
            The reward for scrolling is just… more scrolling. We think that&apos;s a
            terrible deal — and a beatable one.
          </p>
          <p>
            So we built a game that&apos;s genuinely fun and genuinely hard. You get
            ranked, you climb, you flex on your friends. The status isn&apos;t in the
            likes — it&apos;s in being sharp. If we can make <em>“I&apos;m smart”</em> the
            coolest thing a kid can say, we&apos;ve done our job.
          </p>
        </div>
      </Section>

      {/* 6. FAQ */}
      <Faq
        revealContent
        background="paper"
        title="Questions parents actually ask"
        items={FAQ}
      />

      {/* 7. Closing CTA (no form) */}
      <CtaBand
        revealContent
        background="green"
        align="center"
        title="See what they'll actually be playing"
        primaryCta={{ label: "Play Smart Fella or Fart Smella", href: "/" }}
        secondaryCta={null}
      />
    </main>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: exits 0. If lucide-react 1.24.0 does not export `Brain`, `Gamepad2`, `Sparkles`, or `ShieldCheck`, the error names the missing icon — substitute a present one (e.g. `Puzzle` for `Brain`, `Gamepad` for `Gamepad2`, `Star` for `Sparkles`, `Shield` for `ShieldCheck`) and re-run.

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: no new errors for `app/parents/page.tsx`.

- [ ] **Step 4: Visually verify the page**

Run: `npm run dev`, open `http://localhost:3000/parents`.
Expected, top to bottom: pinned nav visible immediately (not hidden); blue hero "BRAINS, NOT BRAIN ROT." not tucked under the nav, with a paper "← See the game" button; black manifesto strip; cream comparison "The feed vs. the fella"; paper 2-column feature grid; mint mission block; paper FAQ (all 6 questions, the "smarter" answer verbatim); green closing CTA; then the site footer. Logo and both CTAs link back to `/`.

- [ ] **Step 5: Verify guardrail copy**

Manually confirm the rendered page contains **no** phrase claiming the product "makes kids smarter," "improves IQ," "boosts grades," or "trains the brain," and no Alpha School reference. The only place "smart" appears as a benefit is inside quotation marks in the mission ("I'm smart" as status) and the FAQ's explicit refusal of the IQ claim.

- [ ] **Step 6: Commit**

```bash
git add app/parents/page.tsx
git commit -m "feat(parents): add mission-focused /parents page"
```

---

### Task 3: Production build + responsive & accessibility QA

**Files:**
- Modify (only if QA finds issues): `app/parents/page.tsx`, `components/quiz/quiz-nav.tsx`

**Interfaces:**
- Consumes: the outputs of Tasks 1–2. Produces: no new exports — a verified, shippable build.

- [ ] **Step 1: Production build**

Run: `npm run build`
Expected: build succeeds; the route list includes `/parents`.

- [ ] **Step 2: Responsive check**

With `npm run dev`, view `/parents` at 375px (mobile), 768px (tablet), 1280px (desktop).
Expected: no horizontal scroll; hero headline wraps cleanly; the comparison's two columns stack on mobile; the feature grid is 1 column on mobile / 2 on ≥md; the nav "For Parents" link is hidden below `sm` (the coral button remains, and `/parents` is still reachable from the footer/site). If the headline collides with the nav on mobile, bump the hero `pt-[96px]` up until clear.

- [ ] **Step 3: Reduced-motion check**

Enable "Reduce motion" (macOS System Settings → Accessibility → Display) and reload `/parents`.
Expected: reused sections' reveal is disabled (they render statically via `<Reveal>`); the pinned nav shows with no transition. No content is stuck hidden.

- [ ] **Step 4: Keyboard & heading check**

Tab through `/parents`.
Expected: nav "For Parents" link and both CTAs are focusable with the visible brand focus ring; exactly one `<h1>` (the hero); each subsequent section starts an `<h2>`. Fix any duplicate `<h1>` (only the hero uses `as={1}`).

- [ ] **Step 5: Final commit (only if QA edits were made)**

```bash
git add -A
git commit -m "fix(parents): responsive + a11y polish from QA"
```

---

## Self-Review

**Spec coverage:**
- Nav "For Parents" link + pinned bar + logo `/` link → Task 1. ✅
- Hero / manifesto / comparison / feature grid / mission / FAQ / closing CTA with verbatim copy → Task 2 (matches spec §4 exactly, incl. ages 8–14 and the soft "working memory workout" FAQ answer). ✅
- Guardrails (no "smarter"/IQ claim, COPPA-safe, no Alpha branding) → Global Constraints + Task 2 Step 5. ✅
- Background rhythm blue→ink→cream→paper→mint→paper→green → Task 2 section order. ✅
- Footer auto-inherited (not added) → noted in Architecture; page renders no footer. ✅
- `tsc --noEmit` / lint / build clean → verification steps in every task. ✅
- Out-of-scope (homepage, email form, quiz-vs-app, "Take the test" label) → untouched; only additive nav props + new route. ✅

**Placeholder scan:** No TBD/TODO. All copy is verbatim; all code blocks are complete; the one runtime uncertainty (lucide icon export names under 1.24.0) has an explicit substitution instruction in Task 2 Step 2. ✅

**Type consistency:** `QuizNav` props (`pinned`/`homeHref`/`ctaHref`) defined in Task 1 are consumed with matching names/types in Task 2. `Feature`/`FaqItem` types imported from their real modules. Section/Comparison/FeatureGrid/Faq/CtaBand prop names verified against the actual component sources (`background`, `revealContent`, `theirLabel`/`ourLabel`, `theirPoints`/`ourPoints`, `columns`, `features`, `items`, `primaryCta`, `secondaryCta`, `align`). ✅
