import type { Metadata } from "next";

import { QuizNav } from "@/components/quiz/quiz-nav";
import { Section } from "@/components/ui/section";
import { Heading } from "@/components/ui/heading";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Button } from "@/components/ui/button";
import { SectionDivider } from "@/components/ui/section-divider";
import { Comparison } from "@/components/sections/comparison";
import { Faq, type FaqItem } from "@/components/sections/faq";
import { CtaBand } from "@/components/sections/cta-band";

export const metadata: Metadata = {
  title: { absolute: "For Parents — Smart Fella or Fart Smella" },
  description:
    "The good kind of screen time. A dumb little game that makes thinking a flex — built on real working-memory science, with no ads and no bottomless feed.",
};

const FAQ: FaqItem[] = [
  {
    q: "Is this just another addictive game?",
    a: "No feed, no autoplay — rounds end. It's built to be put down, the opposite of the apps fighting for your kid's every waking second.",
  },
  {
    q: "What's the right amount of time?",
    a: "A few rounds. The game doesn't beg for more — when your kid's done, it's done.",
  },
  {
    q: "What ages is it for?",
    a: "Roughly 8 to 14. Younger kids can play too; the ranking just means more as they grow.",
  },
  {
    q: "Is my kid's data safe?",
    a: "We don't collect kids' data. If we ever email anyone, it's a parent — never your child.",
  },
];

/*
  Intentionally CALM (neutral cream/paper, one soft blue CTA accent, gentle
  same-variant dividers, no hero shapes) and TIGHT: one distinct idea per
  section — the hook (hero), the concrete contrast (comparison), the real
  challenge (science), why it costs money (pricing), practical questions (FAQ).
  No theme-restating filler sections.
*/
export default function ParentsPage() {
  return (
    <main id="main" className="flex-1">
      <QuizNav pinned homeHref="/" ctaHref="/#waitlist" />

      {/* 1. Hero — the anti-brain-rot hook (states the mission once). */}
      <Section
        background="cream"
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
          Everything online is built to turn your kid&apos;s brain to mush. We built the
          opposite — a dumb little game that makes thinking feel like a flex.
        </p>
        <div className="mt-8">
          <Button href="/" variant="paper" size="lg">
            ← See the game
          </Button>
        </div>
      </Section>

      <SectionDivider top="cream" bottom="paper" variant="curve" size="sm" />

      {/* 2. Comparison — the concrete "how it's different from the feed." */}
      <Comparison
        revealContent
        background="paper"
        title="The feed vs. the fella"
        eyebrow=""
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

      <SectionDivider top="paper" bottom="cream" variant="curve" size="sm" />

      {/* 3. The science — measurement framing, no IQ-boost claim (hard guardrail). */}
      <Section background="cream" padding="lg" container="prose">
        <Eyebrow>The (boring) science</Eyebrow>
        <Heading as={2} size="xl" className="mt-4">
          A workout, not a time-killer
        </Heading>
        <div className="mt-6 space-y-5 text-lg font-medium leading-relaxed">
          <p>
            Working memory — how much your brain can hold and juggle at once — is one of
            the most-studied predictors of how kids learn, backed by decades of
            cognitive-science research. Our games are built to give it a real workout.
          </p>
          <p>
            What we won&apos;t do is promise it &lsquo;boosts IQ.&rsquo; No game does that
            — but a genuine mental challenge kids actually <em>want</em>{" "}
            to play? That&apos;s the whole point.
          </p>
        </div>
      </Section>

      <SectionDivider top="cream" bottom="paper" variant="curve" size="sm" />

      {/* 4. Why it costs money — the pillar (no number; explains the ad-free model). */}
      <Section background="paper" padding="lg" container="prose">
        <Eyebrow>Why it costs money</Eyebrow>
        <Heading as={2} size="xl" className="mt-4">
          You pay, so advertisers don&apos;t
        </Heading>
        <p className="mt-6 text-lg font-medium leading-relaxed">
          Free apps make their money by farming your kid&apos;s attention — more time on
          screen, more ads, worse incentives. We&apos;d rather answer to you than to
          advertisers. So parents pay, and the app stays ad-free and built around your kid
          instead of against them.
        </p>
      </Section>

      <SectionDivider top="paper" bottom="cream" variant="curve" size="sm" />

      {/* 5. FAQ — the practical parent questions. */}
      <Faq
        revealContent
        background="cream"
        title="Questions parents actually ask"
        eyebrow=""
        items={FAQ}
      />

      <SectionDivider top="cream" bottom="yellow" variant="curve" size="sm" />

      {/* 6. Closing CTA (no form) — yellow "sand" above the footer's blue water
          wave, for a little beach effect at the bottom of the page. */}
      <CtaBand
        revealContent
        background="yellow"
        align="center"
        title="See what they'll actually be playing"
        subtitle=""
        badge=""
        primaryCta={{ label: "Play Smart Fella or Fart Smella", href: "/" }}
        secondaryCta={null}
      />
    </main>
  );
}
