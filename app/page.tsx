import type { Metadata } from "next";
import {
  Award,
  Flame,
  Gauge,
  PieChart,
  Share2,
  TrendingUp,
} from "lucide-react";

import { SmartFartHero } from "@/components/quiz/smart-fart-hero";
import { QuizNav } from "@/components/quiz/quiz-nav";
import { Steps, type StepItem } from "@/components/sections/steps";
import { Comparison } from "@/components/sections/comparison";
import { FeatureGrid, type Feature } from "@/components/sections/feature-grid";
import { Testimonials, type Testimonial } from "@/components/sections/testimonials";
import { Pricing, type Tier } from "@/components/sections/pricing";
import { Faq, type FaqItem } from "@/components/sections/faq";
import { CtaBand } from "@/components/sections/cta-band";

export const metadata: Metadata = {
  title: { absolute: "The Fella Test - Smart Fella or Fart Smella?" },
  description:
    "A brutally honest 60-second diagnostic that scores your fella-ness and reveals whether you're a Smart Fella or a Fart Smella. Backed by vibes and questionable science.",
};

const STEPS: StepItem[] = [
  {
    label: "Step 1",
    title: "Answer 27 questions",
    body: "Rapid-fire scenarios about your daily choices, group-chat conduct, and snack ethics. Takes about five minutes and roughly zero brain cells.",
  },
  {
    label: "Step 2",
    title: "The Fella Engine scores you",
    body: "Our deeply unscientific algorithm weighs your answers across six fella dimensions and computes your official Fella Score.",
  },
  {
    label: "Step 3",
    title: "Get your diagnosis",
    body: "Receive the verdict, Smart Fella or Fart Smella, plus a shareable report you can wave triumphantly in your friends' faces.",
  },
];

const REPORT: Feature[] = [
  {
    icon: Gauge,
    title: "Your Fella Score",
    body: "A single 0–100 number that settles the debate once and for all. No appeals.",
  },
  {
    icon: PieChart,
    title: "Six-dimension breakdown",
    body: "See exactly where you lean smart, and where you lean, regrettably, fart.",
  },
  {
    icon: Flame,
    title: "Red-flag detector",
    body: "The three habits quietly dragging your score into the danger zone.",
  },
  {
    icon: Share2,
    title: "Shareable result card",
    body: "A bordered, brag-worthy card engineered specifically for the group chat.",
  },
  {
    icon: TrendingUp,
    title: "Improvement plan",
    body: "Five concrete moves to climb from certified fart to respectable smart.",
  },
  {
    icon: Award,
    title: "Official certificate",
    body: "Frame-ready proof of your fella status. Mostly a joke. Mostly.",
  },
];

// Order matters: the grid uses CSS multi-columns (fill top→bottom, then across),
// so with 3 columns the array reads Leo/Dana | Marcus/Priya | Greg/Sam, i.e.
// top row = Leo · Marcus · Greg, bottom row = Dana · Priya · Sam. Each card
// pins a distinct brand color (no repeats), balanced so no two similar hues
// (mint/green) sit adjacent.
const TESTIMONIALS: Testimonial[] = [
  {
    quote: "I put 'Smart Fella, verified' on my résumé and got two callbacks.",
    name: "Leo M.",
    role: "Job seeker",
    avatarColor: "mint",
    avatarImage: "/testimonials/leo.png",
    cardColor: "blue",
  },
  {
    quote:
      "I made my whole team take it. Morale is at an all-time low and I've never been happier.",
    name: "Dana R.",
    role: "Manager",
    avatarColor: "blue",
    avatarImage: "/testimonials/dana.png",
    cardColor: "yellow",
  },
  {
    quote: "Finally, science confirms what my wife has been saying for years.",
    name: "Marcus T.",
    role: "Smart Fella (barely)",
    avatarColor: "yellow",
    avatarImage: "/testimonials/marcus.png",
    cardColor: "green",
  },
  {
    quote:
      "The red-flag detector called me out for microwaving fish at the office. Accurate and cruel.",
    name: "Priya S.",
    role: "Reformed",
    avatarColor: "blue",
    avatarImage: "/testimonials/priya.png",
    cardColor: "paper",
  },
  {
    quote: "Scored a 12. Absolutely devastating. I hate this quiz",
    name: "Greg P.",
    role: "Certified Fart Smella",
    rating: 1,
    avatarColor: "coral",
    avatarImage: "/testimonials/greg.png",
    cardColor: "coral",
  },
  {
    quote: "Took it six times hoping for a better score. The engine is incorruptible.",
    name: "Sam K.",
    role: "Persistent",
    avatarColor: "coral",
    avatarImage: "/testimonials/sam.png",
    cardColor: "mint",
  },
];

const TIERS: Tier[] = [
  {
    name: "The Fella Test",
    price: "$67",
    billingNote: "one-time",
    description: "One full diagnostic, your complete report, and a shareable result card.",
    features: [
      "The full 27-question test",
      "Your Fella Score + report",
      "Shareable result card",
      "Personal improvement plan",
    ],
    cta: "Take the test",
    href: "#pricing",
  },
];

const FAQ: FaqItem[] = [
  {
    q: "Is this scientifically valid?",
    a: "Absolutely not. The Fella Engine runs on vibes, stereotypes, and one very opinionated spreadsheet. It's for entertainment only.",
  },
  {
    q: "Is it rigged to call me a Fart Smella?",
    a: "It is not, but the questions are designed to expose your worst habits, so a low score is entirely your own doing.",
  },
  {
    q: "How long does it take?",
    a: "About five minutes. Twenty-seven quick questions, no essays, and no account required to start.",
  },
  {
    q: "Can I get a refund if I hate my score?",
    a: "You can get a refund if the test won't load. You cannot get a refund simply because the truth stings.",
  },
  {
    q: "Can my whole team take it?",
    a: "Please do — everyone grabs their own test and compares Fella Scores. Nothing bonds a team like collective public humiliation.",
  },
];

export default function SmartOrFartPage() {
  return (
    <main id="main" className="flex-1">
      {/* Slim landing bar (this route opts out of the Closer site chrome) */}
      <QuizNav />

      <div id="top">
        <SmartFartHero />
      </div>

      <Steps
        revealContent
        id="how"
        className="scroll-mt-nav"
        background="paper"
        eyebrow=""
        title="Three steps to the truth"
        steps={STEPS}
        cta={{ label: "Take the test", href: "#pricing", variant: "green" }}
      />

      <Comparison
        revealContent
        background="cream"
        eyebrow=""
        title="Which one are you, really?"
        theirLabel="Fart Smella"
        ourLabel="Smart Fella"
        theirPoints={[
          "Replies “lol” to genuinely serious questions",
          "Microwaves fish in a shared office kitchen",
          "Has 47 unread “urgent” emails and zero concern",
          "Confidently, cheerfully wrong about everything",
        ]}
        ourPoints={[
          "Reads the whole thread before replying",
          "Owns a water bottle and, crucially, uses it",
          "Inbox at zero, mind mysteriously clear",
          "Says “I don't know” like an absolute legend",
        ]}
      />

      <FeatureGrid
        revealContent
        background="paper"
        eyebrow=""
        title="What you actually get"
        intro="Every test unlocks a full breakdown you can screenshot, share, and argue about for weeks."
        columns={3}
        features={REPORT}
      />

      <Testimonials
        revealContent
        background="mint"
        eyebrow=""
        title="Lives have been changed"
        testimonials={TESTIMONIALS}
      />

      <Pricing
        revealContent
        fullViewport
        id="pricing"
        className="scroll-mt-nav"
        background="coral"
        eyebrow=""
        title="Settle it for the price of a coffee"
        tiers={TIERS}
      />

      <Faq
        revealContent
        background="paper"
        eyebrow=""
        title="Questions from concerned fellas"
        items={FAQ}
      />

      <CtaBand
        revealContent
        background="ink"
        align="center"
        badge="Takes 5 minutes"
        title="So… smart fella or fart smella?"
        subtitle="There's only one way to find out, and your friends are already placing bets."
        primaryCta={{ label: "Take the test", href: "#pricing" }}
        primaryVariant="green"
        secondaryCta={null}
      />
    </main>
  );
}
