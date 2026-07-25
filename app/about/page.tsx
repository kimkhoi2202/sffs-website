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
  title: "About",
  description:
    "We make one thing: a dumb little game with a very stupid name that is secretly a real brain workout. Here is why it exists and what we refuse to build. No ads, no bottomless feed.",
  alternates: { canonical: "/about" },
};

const FAQ: FaqItem[] = [
  {
    q: "Is this just another addictive game?",
    a: "No feed, no autoplay, rounds end. It is built to be put down, the opposite of the apps fighting for your every waking second.",
  },
  {
    q: "What's the right amount of time?",
    a: "A few rounds. The game does not beg for more. When you are done, you are done.",
  },
  {
    q: "Who is it for?",
    a: "Anyone who wants to out-think their friends. If you still think a fart joke is funny, you are the target demographic.",
  },
  {
    q: "Is my data safe?",
    a: "No ads, no third-party ad tracking, and we never sell data. Signing in is optional, so you can play without handing over an account. We do log anonymous usage events so we can see which parts of the app work, but we never record your screen or use advertising identifiers. The full details are in our Privacy Policy.",
  },
];

/*
  The About page. It answers "who are you" the only honest way a one-product
  studio can: here is the one thing we make, here is why it exists, and here is
  what we refuse to build. The hero does the introduction, then each section
  carries one distinct idea: what we refuse to be (comparison), the real
  challenge (science), why it costs money (pricing), practical questions (FAQ).

  Intentionally CALM (neutral cream/paper, one soft blue CTA accent, gentle
  same-variant dividers, no hero shapes) and TIGHT, with no theme-restating
  filler sections.

  Replaces the retired /parents route; next.config.ts 308s the old URL here.
*/
export default function AboutPage() {
  return (
    <main id="main" className="flex-1">
      <QuizNav pinned homeHref="/" ctaHref="/#waitlist" />

      {/* 1. Hero: the introduction and the mission in one breath. */}
      <Section
        background="cream"
        padding="lg"
        className="pt-[96px] md:pt-[120px]"
        container="prose"
        containerClassName="text-center"
      >
        <Eyebrow>About us</Eyebrow>
        <Heading as={1} size="display" className="mt-6 !leading-[1.05]">
          Brains, not brain rot.
        </Heading>
        <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg font-medium leading-snug sm:text-xl">
          We make one thing: a dumb little game with a very stupid name that
          turns out to be a real brain workout. Everything else online is built
          to turn your brain to mush. We wanted the opposite, something that
          makes thinking feel like a flex.
        </p>
        <div className="mt-8">
          <Button href="/" variant="paper" size="lg">
            ← See the game
          </Button>
        </div>
      </Section>

      <SectionDivider top="cream" bottom="paper" variant="curve" size="sm" />

      {/* 2. Comparison: what we refuse to build, made concrete. */}
      <Comparison
        revealContent
        background="paper"
        title="The feed vs. the fella"
        eyebrow="What we refuse to build"
        theirLabel="Brain rot"
        ourLabel="SFFS"
        theirPoints={[
          "Infinite scroll designed to never end",
          "Rewards zoning out",
          "Gets dumber the longer you watch",
          "Built to keep you up till 2am",
        ]}
        ourPoints={[
          "A challenge with an actual finish line",
          "Rewards focus, memory, and pattern-hunting",
          "Gets harder as you get better",
          "A few rounds, then you put it down",
        ]}
      />

      <SectionDivider top="paper" bottom="cream" variant="curve" size="sm" />

      {/* 3. The science: measurement framing, no IQ-boost claim (hard guardrail). */}
      <Section background="cream" padding="lg" container="prose">
        <Eyebrow>The (boring) science</Eyebrow>
        <Heading as={2} size="xl" className="mt-4">
          A workout, not a time-killer
        </Heading>
        <div className="mt-6 space-y-5 text-lg font-medium leading-relaxed">
          <p>
            Working memory, how much your brain can hold and juggle at once, is
            one of the most-studied predictors of how people learn, backed by
            decades of cognitive-science research. Our games are built to give
            it a real workout.
          </p>
          <p>
            What we won&apos;t do is promise it &lsquo;boosts IQ.&rsquo; No game
            does that. But a genuine mental challenge you actually{" "}
            <em>want</em>{" "}
            to play? That&apos;s the whole point.
          </p>
        </div>
      </Section>

      <SectionDivider top="cream" bottom="paper" variant="curve" size="sm" />

      {/* 4. Why it costs money: the pillar (no number; explains the ad-free model). */}
      <Section background="paper" padding="lg" container="prose">
        <Eyebrow>Why it costs money</Eyebrow>
        <Heading as={2} size="xl" className="mt-4">
          You pay, so advertisers don&apos;t
        </Heading>
        <p className="mt-6 text-lg font-medium leading-relaxed">
          Free apps make their money by farming your attention: more time on
          screen, more ads, worse incentives. We would rather answer to you than
          to advertisers. So you pay once, and the app stays ad-free and built
          around you instead of against you.
        </p>
      </Section>

      <SectionDivider top="paper" bottom="cream" variant="curve" size="sm" />

      {/* 5. FAQ: the practical questions. */}
      <Faq
        revealContent
        background="cream"
        title="Questions people actually ask"
        eyebrow=""
        items={FAQ}
      />

      <SectionDivider top="cream" bottom="yellow" variant="curve" size="sm" />

      {/* 6. Closing CTA (no form): yellow "sand" above the footer's blue water
          wave, for a little beach effect at the bottom of the page. */}
      <CtaBand
        revealContent
        background="yellow"
        align="center"
        title="See what you're actually getting into"
        subtitle=""
        badge=""
        primaryCta={{ label: "Play Smart Fella or Fart Smella", href: "/" }}
        secondaryCta={null}
      />
    </main>
  );
}
