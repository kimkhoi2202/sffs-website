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

      {/* 4. Feature grid */}
      <FeatureGrid
        revealContent
        background="paper"
        title="What it actually is"
        eyebrow=""
        intro=""
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
            likes — it&apos;s in being sharp. If we can make <em>&ldquo;I&apos;m smart&rdquo;</em> the
            coolest thing a kid can say, we&apos;ve done our job.
          </p>
        </div>
      </Section>

      {/* 6. FAQ */}
      <Faq
        revealContent
        background="paper"
        title="Questions parents actually ask"
        eyebrow=""
        items={FAQ}
      />

      {/* 7. Closing CTA (no form) */}
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
