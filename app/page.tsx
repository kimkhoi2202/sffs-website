import type { Metadata } from "next";
import { Flame, Gamepad2, TrendingUp, Users } from "lucide-react";

import { SmartFartHero } from "@/components/quiz/smart-fart-hero";
import { QuizNav } from "@/components/quiz/quiz-nav";
import { Steps, type StepItem } from "@/components/sections/steps";
import { Comparison } from "@/components/sections/comparison";
import { FeatureGrid, type Feature } from "@/components/sections/feature-grid";
import { TestimonialMarquee, type Testimonial } from "@/components/sections/testimonials";
import { Faq, type FaqItem } from "@/components/sections/faq";
import { CtaBand } from "@/components/sections/cta-band";
import { Waitlist } from "@/components/sections/waitlist";
import { VideoShowcase } from "@/components/sections/video-showcase";
import { Section } from "@/components/ui/section";
import { Heading } from "@/components/ui/heading";
import { SectionDivider } from "@/components/ui/section-divider";

export const metadata: Metadata = {
  title: { absolute: "Smart Fella or Fart Smella? — the dumb little brain game" },
  description:
    "A dumb little brain game that knows exactly how smart you are. Get ranked, climb the leaderboard, keep a streak, and flex on your friends. Join the waitlist.",
};

const STEPS: StepItem[] = [
  {
    label: "Step 1",
    title: "Pick a dumb little game",
    body: "Jump into a quick round — the kind that actually makes you think, not zone out.",
  },
  {
    label: "Step 2",
    title: "Get ranked",
    body: "Every round scores you and moves your brain rank. The better you play, the higher you climb.",
  },
  {
    label: "Step 3",
    title: "Flex on your friends",
    body: "Keep a daily streak, share your rank, and tag a fart smella to settle who's really smart.",
  },
];

const FEATURES: Feature[] = [
  {
    icon: Gamepad2,
    title: "Real brain games",
    body: "Genuinely tricky rounds that reward focus and memory — not mindless tap-to-win.",
  },
  {
    icon: TrendingUp,
    title: "Your brain rank",
    body: "Every game scores you and ranks your brain against everyone else playing.",
  },
  {
    icon: Flame,
    title: "Daily streak",
    body: "A fresh challenge every day. Miss one and watch the streak die.",
  },
  {
    icon: Users,
    title: "Tag a fart smella",
    body: "Challenge anyone head to head and prove who's really smart.",
  },
];

// SANDWICH color scheme (gray section): every card pins a distinct brand color
// that is ALSO its brain avatar's body color (cardColor == the brain PNG fill),
// and the avatar CIRCLE (circleColor) contrasts in BOTH hue and lightness so the
// brain always pops. Green-family cards use a non-green disc (Dana green→paper,
// Marcus mint→coral); the two greens are kept non-adjacent.
const TESTIMONIALS: Testimonial[] = [
  {
    quote: "Beat my whole friend group and I will NOT let them forget it.",
    name: "Leo M.",
    role: "Ranked #3 in his class",
    avatarImage: "/testimonials/leo.png",
    cardColor: "blue",
    circleColor: "yellow",
  },
  {
    quote:
      "My kid asked to play a memory game instead of watching slime videos. Actual witchcraft.",
    name: "Dana R.",
    role: "Parent",
    avatarImage: "/testimonials/dana.png",
    cardColor: "green",
    circleColor: "paper",
  },
  {
    quote: "Makes me feel like a genius and an idiot in the same round. Can't stop.",
    name: "Marcus T.",
    role: "Smart Fella (barely)",
    avatarImage: "/testimonials/marcus.png",
    cardColor: "mint",
    circleColor: "coral",
  },
  {
    quote: "Haven't missed a daily challenge since March. This is my whole personality now.",
    name: "Priya S.",
    role: "Streak: 63 days",
    avatarImage: "/testimonials/priya.png",
    cardColor: "yellow",
    circleColor: "blue",
  },
  {
    quote: "Scored a 2. Absolutely devastating. I'm training and coming back for blood.",
    name: "Greg P.",
    role: "Certified Fart Smella",
    rating: 1,
    avatarImage: "/testimonials/greg.png",
    cardColor: "coral",
    circleColor: "paper",
  },
  {
    quote: "Replaced my 2am doomscroll with a few quick rounds. My brain said thank you.",
    name: "Sam K.",
    role: "Reformed doomscroller",
    avatarImage: "/testimonials/sam.png",
    cardColor: "paper",
    circleColor: "coral",
  },
];

const FAQ: FaqItem[] = [
  {
    q: "What is this, exactly?",
    a: "A dumb little game that knows exactly how smart you are. Quick brain-game rounds that score your brain and rank you against everyone else.",
  },
  {
    q: "Is it actually fun, or is it secretly homework?",
    a: "Game first. It's genuinely hard, genuinely dumb, and built to be flexed about — not studied.",
  },
  {
    q: "How much will it cost?",
    a: "We'll sort that out at launch. Right now it's free to join the waitlist and be first in.",
  },
  {
    q: "Who's it for?",
    a: "Anyone who wants to out-think their friends. Built for sharp kids — but honestly addictive for everyone.",
  },
  {
    q: "When does it launch?",
    a: "Soon. Join the waitlist and you'll be first to know — and first up the ranks.",
  },
];

export default function SmartOrFartPage() {
  return (
    <main id="main" className="flex-1">
      {/* Slim landing bar (this route opts out of the Closer site chrome) */}
      <QuizNav />

      <div id="top" className="relative">
        <SmartFartHero />
        {/* The hero's draggable shapes are a PAGE-LEVEL overlay (page-shapes.tsx)
            confined to this hero. The hero → paper seam (the swoop wave) is FOLDED
            INTO the hero as its `.fella-wave` bottom apron, so it flows straight
            into the (also-white) Steps section — no standalone divider here. */}
      </div>

      <Steps
        revealContent
        id="how"
        className="scroll-mt-nav"
        background="paper"
        eyebrow=""
        title="Three steps to the flex"
        steps={STEPS}
        cta={{ label: "Join the waitlist", href: "#waitlist", variant: "green" }}
      />

      {/* Top edge of the merged gray block (which one → what you get → testimonials). */}
      <SectionDivider top="paper" bottom="gray" variant="curve" />

      <div className="relative">
        <Comparison
          revealContent
          background="gray"
          eyebrow=""
          title="Which one are you, really?"
          theirLabel="Fart Smella"
          ourLabel="Smart Fella"
          theirPoints={[
            "Doomscrolls until the phone dies",
            "Rage quits at level 3",
            "Taps randomly and prays",
            "Screenshots someone else's high score",
          ]}
          ourPoints={[
            "Beats their own high score for fun",
            "Spots the pattern three moves ahead",
            "Keeps a streak alive for weeks",
            "Actually earns the rank",
          ]}
        />
      </div>

      {/* No divider: comparison + what-you-get share one gray fill as a merged block. */}
      <FeatureGrid
        revealContent
        background="gray"
        className="pt-2 md:pt-6"
        eyebrow=""
        title="What you actually get"
        intro="It's all built to make thinking a flex — get ranked, keep a streak, and drag your friends in."
        columns={2}
        features={FEATURES}
      />

      {/* Social proof as a scrolling MARQUEE (not a second card grid) so it doesn't
          read as "grid stacked on grid" after the feature grid. Same gray block. */}
      <Section background="gray" container={false} padding="md">
        <div className="mx-auto max-w-page px-4 text-center md:px-8">
          <Heading as={2} size="xl">
            Lives have been changed
          </Heading>
        </div>
        <div className="mt-8">
          <TestimonialMarquee testimonials={TESTIMONIALS} />
        </div>
      </Section>

      <SectionDivider top="gray" bottom="coral" variant="scallopBig" size="lg" />

      {/* Waitlist — the coral pop (where the old pricing block sat), after the games. */}
      <Waitlist id="waitlist" className="scroll-mt-nav" background="coral" />

      <SectionDivider top="coral" bottom="paper" variant="blob" />

      <div className="relative">
        <Faq
          revealContent
          background="paper"
          eyebrow=""
          title="Questions from concerned fellas"
          items={FAQ}
        />
      </div>

      <SectionDivider top="paper" bottom="green" variant="arch" />

      <CtaBand
        revealContent
        background="green"
        align="center"
        badge="Launching soon"
        title="So… smart fella or fart smella?"
        subtitle=""
        primaryCta={{ label: "Join the waitlist", href: "#waitlist" }}
        secondaryCta={null}
      />

      <SectionDivider top="green" bottom="cream" variant="stepped" size="lg" />

      {/* "Follow the fellas" — social links + a looping carousel of TikTok video
          covers. Neutral cream so the bright covers pop; replaces the old FollowUs.
          The footer's animated water wave is the cream→blue seam. */}
      <VideoShowcase id="videos" background="cream" />
    </main>
  );
}
