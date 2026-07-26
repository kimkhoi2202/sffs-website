import type { Metadata } from "next";
import { Flame, Gamepad2, TrendingUp, Users } from "lucide-react";

import { SmartFartHero } from "@/components/quiz/smart-fart-hero";
import { QuizNav } from "@/components/quiz/quiz-nav";
import { Steps, type StepItem } from "@/components/sections/steps";
import { Comparison } from "@/components/sections/comparison";
import { FeatureGrid, type Feature } from "@/components/sections/feature-grid";
import { TestimonialMarquee, type Testimonial } from "@/components/sections/testimonials";
import { Faq, type FaqItem } from "@/components/sections/faq";
import { Waitlist } from "@/components/sections/waitlist";
import { VideoShowcase } from "@/components/sections/video-showcase";
import { Section } from "@/components/ui/section";
import { Heading } from "@/components/ui/heading";
import { SectionDivider } from "@/components/ui/section-divider";

export const metadata: Metadata = {
  title: { absolute: "Smart Fella or Fart Smella? The dumb little brain game" },
  description:
    "A dumb little brain game that knows exactly how smart you are. Get ranked, climb the leaderboard, keep a streak, and flex on your friends. Join the waitlist.",
};

const STEPS: StepItem[] = [
  {
    label: "Step 1",
    title: "Pick a game and play",
    body: "Jump into a quick puzzle round: slide, stack, or match your way to a high score in under a minute.",
  },
  {
    label: "Step 2",
    title: "Beat your best, climb the rank",
    body: "Every round scores you and bumps your brain rank. The higher you score, the higher you climb.",
  },
  {
    label: "Step 3",
    title: "Drag your friends in",
    body: "Keep your daily streak alive, then send a friend the exact same board to settle who's smarter.",
  },
];

const FEATURES: Feature[] = [
  {
    icon: Gamepad2,
    title: "A stack of quick puzzle games",
    body: "Slide, stack, match, and remember your way to a high score. One-handed rounds you finish in under a minute.",
  },
  {
    icon: TrendingUp,
    title: "One shared brain rank",
    body: "Every game feeds a single score. Beat your own bests to climb from certified fart smella to smart fella.",
  },
  {
    icon: Flame,
    title: "A daily challenge + streaks",
    body: "One new challenge drops every day. Play daily to grow your streak. Miss a day and it resets to zero.",
  },
  {
    icon: Users,
    title: "Head-to-head with friends",
    body: "Send a friend the exact same board and see who scores higher. Loser gets tagged, obviously.",
  },
];

// SANDWICH color scheme (gray section): the brain-mascot cards each pin a
// distinct brand color that is ALSO the brain avatar's body color (cardColor ==
// the brain PNG fill), and the avatar CIRCLE (circleColor) contrasts in BOTH hue
// and lightness so the brain always pops (Marcus mint→coral disc).
//
// The two grown-up voices (Dana, Sam) deliberately SKIP the brain mascot and take
// the initials <Avatar> on a solid ink disc instead, so the wall does not read as
// six identical cartoon brains. Same 2.5px ink border and hard-shadow language,
// just a monogram in place of the PNG.
const TESTIMONIALS: Testimonial[] = [
  {
    quote: "Beat my whole friend group and I will NOT let them forget it.",
    name: "Leo M.",
    role: "Ranked #3, taking it personally",
    avatarImage: "/testimonials/leo.png",
    cardColor: "blue",
    circleColor: "yellow",
  },
  {
    quote:
      "Downloaded it to make fun of the name. It is now the only app on my home screen.",
    name: "Dana R.",
    role: "Ironic download, sincere addict",
    avatarColor: "ink",
    cardColor: "green",
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
    avatarColor: "ink",
    cardColor: "paper",
  },
];

const FAQ: FaqItem[] = [
  {
    q: "What is this, exactly?",
    a: "A stack of quick puzzle games (slide, stack, and match for a high score) that score your brain and rank you against everyone else playing.",
  },
  {
    q: "Is it actually fun, or is it secretly homework?",
    a: "Game first. It's genuinely hard, genuinely dumb, and built to be flexed about, not studied.",
  },
  {
    q: "How much will it cost?",
    a: "We'll sort that out at launch. Right now it's free to join the waitlist and be first in.",
  },
  {
    q: "Who's it for?",
    a: "Anyone who wants to out-think their friends. If you still think a fart joke is funny, you are the target demographic.",
  },
  {
    q: "When does it launch?",
    a: "Soon. Join the waitlist and you'll be first to know, and first up the ranks.",
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
        intro="A stack of quick puzzle games, one shared brain rank, and a daily streak you'll get weirdly protective of."
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

      {/* Plain brand closer — NO second waitlist form (the single waitlist lives
          above). Just the rhetorical sign-off. */}
      <Section background="green" padding="lg" container="prose" containerClassName="text-center">
        <Heading as={2} size="display">
          So… smart fella or fart smella?
        </Heading>
      </Section>

      <SectionDivider top="green" bottom="cream" variant="stepped" size="lg" />

      {/* "Follow the fellas" — social links + a looping carousel of TikTok video
          covers. Neutral cream so the bright covers pop; replaces the old FollowUs.
          The footer's animated water wave is the cream→blue seam. */}
      <VideoShowcase id="videos" background="cream" />
    </main>
  );
}
