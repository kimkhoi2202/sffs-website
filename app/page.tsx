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
import { VideoShowcase } from "@/components/sections/video-showcase";
import { Waitlist } from "@/components/sections/waitlist";
import { Section } from "@/components/ui/section";
import { Heading } from "@/components/ui/heading";
import { SectionDivider } from "@/components/ui/section-divider";

export const metadata: Metadata = {
  title: { absolute: "Smart Fella or Fart Smella? — the dumb little brain game" },
  description:
    "A dumb little brain game that knows exactly how smart you are. Play memory + puzzle games, climb the ranks, keep a streak, and flex on your friends. Join the waitlist.",
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

// Layout: an equal-height CSS grid (row-major), so with 3 columns the array
// reads across — top row = Leo · Dana · Marcus, bottom row = Priya · Greg · Sam.
//
// SANDWICH color scheme (see the light-gray section below): every card pins a
// distinct brand color that is ALSO its brain avatar's body color (cardColor ==
// the brain PNG's fill), and the avatar CIRCLE behind the transparent brain
// uses a contrasting color (circleColor) chosen to differ from the card/brain
// in BOTH hue AND lightness so the brain always pops — never a near-equal-
// lightness pairing (e.g. coral-on-green) that would read by hue alone. The
// green-family cards use a clearly NON-green disc (Dana green -> paper, Marcus
// mint -> coral) so the brain pops off the circle and the circle off the card;
// the other brains pair with a disc chosen for hue + lightness contrast. All
// six card colors differ from each other AND from the
// section's neutral `gray` background (incl. the white `paper` card), so no card
// blends in; the two greens (Dana green / Marcus mint) are kept non-adjacent.
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
    // Green brain + green card: a light PAPER disc makes the brain (and its black
    // outline) pop off the circle, and the circle pop off the green card.
    cardColor: "green",
    circleColor: "paper",
  },
  {
    quote: "Makes me feel like a genius and an idiot in the same round. Can't stop.",
    name: "Marcus T.",
    role: "Smart Fella (barely)",
    avatarImage: "/testimonials/marcus.png",
    // Light-mint brain + mint card: a coral disc separates the brain from the
    // circle and the circle from the mint card (no green-on-green).
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
    // Coral brain on a white disc: ~2.6:1 vs green's ~1.17:1 — the brain pops.
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
        {/* The hero's draggable shapes are spawned + drifted by the PageShapes
            overlay — see components/quiz/page-shapes.tsx. The hero → paper seam
            (the swoop wave) is now FOLDED INTO the hero itself as its `.fella-wave`
            bottom apron, so the yellow + synthwave grid fill all the way down to
            the wavy ink line (no more grid-less band) and the shapes bounce at
            that same wavy edge. Hence there is NO standalone <SectionDivider>
            here anymore — the hero ends in white below the wave and flows
            straight into the (also-white) waitlist section below. */}
      </div>

      {/* Waitlist moved up to the 2nd section (right after the hero) so the email
          capture sits high on the page. Paper (white) keeps it seamless with the
          hero's white swoop-wave bottom — no divider needed here. */}
      <Waitlist id="waitlist" className="scroll-mt-nav" background="paper" />

      {/* Top edge of the merged gray block (how it works → which one → what you get). */}
      <SectionDivider top="paper" bottom="gray" variant="curve" />

      <Steps
        revealContent
        id="how"
        className="scroll-mt-nav"
        background="gray"
        eyebrow=""
        title="Three steps to the flex"
        steps={STEPS}
        cta={{ label: "Join the waitlist", href: "#waitlist", variant: "green" }}
      />

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

      {/* No divider here: comparison + what-you-get share one gray fill and read
          as a single merged section. Extra top padding gives the "WHAT YOU
          ACTUALLY GET" heading breathing room from the checklist cards above. */}
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

      {/* Social proof as a scrolling MARQUEE, not a second card grid — otherwise
          it reads as "grid stacked on grid" right after the feature grid. Stays on
          the same gray block; the motion + single row break the visual rhythm. */}
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

      <SectionDivider top="gray" bottom="paper" variant="blob" size="lg" />

      <div className="relative">
      <Faq
        revealContent
        background="paper"
        eyebrow=""
        title="Questions from concerned fellas"
        items={FAQ}
      />
      </div>

      <SectionDivider top="paper" bottom="yellow" variant="arch" />

      {/* Full-bleed TikTok video embeds + the merged social-follow moment (IG +
          TikTok icons), as a bright yellow beacon. */}
      <VideoShowcase id="videos" background="yellow" />

      <SectionDivider top="yellow" bottom="green" variant="stepped" size="lg" />

      {/* Final call to action — the LAST section before the footer. The footer's
          own animated water wave is the green→blue seam (no divider needed). */}
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
    </main>
  );
}
