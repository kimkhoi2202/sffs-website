import type { Metadata } from "next";
import { Gamepad2, Sparkles, ShieldCheck } from "lucide-react";

import { QuizNav } from "@/components/quiz/quiz-nav";
import { Section } from "@/components/ui/section";
import { Heading } from "@/components/ui/heading";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Button } from "@/components/ui/button";
import { SectionDivider } from "@/components/ui/section-divider";
import { Comparison } from "@/components/sections/comparison";
import { FeatureGrid, type Feature } from "@/components/sections/feature-grid";
import { Faq, type FaqItem } from "@/components/sections/faq";
import { CtaBand } from "@/components/sections/cta-band";

export const metadata: Metadata = {
  title: { absolute: "For Parents — Smart Fella or Fart Smella" },
  description:
    "The good kind of screen time. A dumb little game that makes thinking a flex — built on real working-memory science, with no ads and no bottomless feed.",
};

const FEATURES: Feature[] = [
  {
    icon: Gamepad2,
    title: "A game, not a feed",
    body: "Rounds end. No infinite scroll, no autoplay.",
  },
  {
    icon: Sparkles,
    title: "Speaks their language",
    body: "Goofy on purpose, so they choose it themselves.",
  },
  {
    icon: ShieldCheck,
    title: "No ads, ever",
    body: "We don't sell your kid's attention to anyone.",
  },
];

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

export default function ParentsPage() {
  return (
    <main id="main" className="flex-1">
      <QuizNav pinned homeHref="/" ctaHref="/#pricing" />

      {/* 1. Hero — pt offsets the fixed nav so the headline isn't tucked under it.
          `fella-hero` marks this as the shapes' confinement box (page-shapes.tsx),
          so the draggable shapes bounce inside the hero like they do on the home
          hero. `relative isolate` gives them a clean stacking context. */}
      <Section
        background="blue"
        padding="lg"
        className="fella-hero relative isolate pt-[96px] md:pt-[120px]"
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

      {/* Wavy seams (brand divider language) flow each color band into the next —
          same system as the homepage. The swoop echoes the homepage hero's edge;
          adjacent sections drop their own borders since the wave IS the edge. */}
      <SectionDivider top="blue" bottom="ink" variant="swoop" size="lg" />

      {/* 2. Manifesto strip */}
      <Section
        background="ink"
        padding="md"
        container="prose"
        containerClassName="text-center"
      >
        <Heading as={2} size="xl" className="text-balance">
          Everything online is trying to make your kid dumber. We make thinking the flex.
        </Heading>
      </Section>

      <SectionDivider top="ink" bottom="cream" variant="doubleWave" />

      {/* 3. Comparison — the single scannable "is it just more screen time?" answer */}
      <Comparison
        revealContent
        background="cream"
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

      <SectionDivider top="cream" bottom="paper" variant="peaks" />

      {/* 4. The science — measurement framing, no IQ-boost claim (hard guardrail). */}
      <Section background="paper" padding="lg" container="prose">
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

      <SectionDivider top="paper" bottom="mint" variant="scallopBig" size="lg" />

      {/* 5. Feature grid — three tight cards. */}
      <FeatureGrid
        revealContent
        background="mint"
        title="What it actually is"
        eyebrow=""
        intro=""
        columns={3}
        features={FEATURES}
      />

      <SectionDivider top="mint" bottom="coral" variant="blob" />

      {/* 6. Pricing rationale — no number (undecided); explains why it isn't free. */}
      <Section background="coral" padding="lg" container="prose">
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

      <SectionDivider top="coral" bottom="yellow" variant="arch" />

      {/* 7. Mission block — one tight paragraph. */}
      <Section background="yellow" padding="lg" container="prose">
        <Eyebrow>Our mission</Eyebrow>
        <Heading as={2} size="xl" className="mt-4">
          We want thinking to be the flex
        </Heading>
        <p className="mt-6 text-lg font-medium leading-relaxed">
          Kids are handed screens engineered to hold them as long as humanly possible.
          We&apos;re building the opposite — something genuinely fun and genuinely hard,
          where the flex is being sharp, not racking up hours. If we can make{" "}
          <em>&ldquo;I&apos;m smart&rdquo;</em>{" "}
          the coolest thing a kid can say, we&apos;ve done our job.
        </p>
      </Section>

      <SectionDivider top="yellow" bottom="paper" variant="stepped" size="lg" />

      {/* 8. FAQ — the four simplest concerns. */}
      <Faq
        revealContent
        background="paper"
        title="Questions parents actually ask"
        eyebrow=""
        items={FAQ}
      />

      <SectionDivider top="paper" bottom="green" variant="torn" />

      {/* 9. Closing CTA (no form). Green → footer seam is the footer's own animated
          water wave (see site-footer.tsx), so no divider here. */}
      <CtaBand
        revealContent
        background="green"
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
