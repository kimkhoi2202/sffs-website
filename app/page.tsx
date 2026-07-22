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
import { FollowUs } from "@/components/sections/follow-us";
import { SectionDivider } from "@/components/ui/section-divider";

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
    quote: "I put 'Smart Fella, verified' on my résumé and got two callbacks.",
    name: "Leo M.",
    role: "Job seeker",
    avatarImage: "/testimonials/leo.png",
    cardColor: "blue",
    circleColor: "yellow",
  },
  {
    quote:
      "I made my whole team take it. Morale is at an all-time low and I've never been happier.",
    name: "Dana R.",
    role: "Manager",
    avatarImage: "/testimonials/dana.png",
    cardColor: "green",
    // Green brain + green card: a light PAPER disc makes the brain (and its black
    // outline) pop off the circle, and the circle pop off the green card.
    circleColor: "paper",
  },
  {
    quote: "Finally, science confirms what my wife has been saying for years.",
    name: "Marcus T.",
    role: "Smart Fella (barely)",
    avatarImage: "/testimonials/marcus.png",
    cardColor: "mint",
    // Light-mint brain + mint card: a coral disc separates the brain from the
    // circle and the circle from the mint card (no green-on-green).
    circleColor: "coral",
  },
  {
    quote:
      "The red-flag detector called me out for microwaving fish at the office. Accurate and cruel.",
    name: "Priya S.",
    role: "Reformed",
    avatarImage: "/testimonials/priya.png",
    cardColor: "yellow",
    circleColor: "blue",
  },
  {
    quote: "Scored a 12. Absolutely devastating. I hate this quiz",
    name: "Greg P.",
    role: "Certified Fart Smella",
    rating: 1,
    avatarImage: "/testimonials/greg.png",
    cardColor: "coral",
    // Coral brain on a white disc: ~2.6:1 vs green's ~1.17:1 — the brain pops.
    circleColor: "paper",
  },
  {
    quote: "Took it six times hoping for a better score. The engine is incorruptible.",
    name: "Sam K.",
    role: "Persistent",
    avatarImage: "/testimonials/sam.png",
    cardColor: "paper",
    circleColor: "coral",
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

      <div id="top" className="relative">
        <SmartFartHero />
        {/* The hero's draggable shapes are spawned + drifted by the PageShapes
            overlay — see components/quiz/page-shapes.tsx. The hero → paper seam
            (the swoop wave) is now FOLDED INTO the hero itself as its `.fella-wave`
            bottom apron, so the yellow + synthwave grid fill all the way down to
            the wavy ink line (no more grid-less band) and the shapes bounce at
            that same wavy edge. Hence there is NO standalone <SectionDivider>
            here anymore — the hero ends in white below the wave and flows
            straight into the (also-white) Steps section. */}
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

      {/* Outer TOP edge of the merged gray block (comparison + what-you-get). */}
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
        intro="Every test unlocks a full breakdown you can screenshot, share, and argue about for weeks."
        columns={3}
        features={REPORT}
      />

      {/* No divider: the merged gray "what you get" block flows straight into the
          (also-gray) testimonials as ONE continuous gray area. The two sections'
          own vertical padding keeps "LIVES HAVE BEEN CHANGED" from cramping. */}
      <Testimonials
        revealContent
        background="gray"
        eyebrow=""
        title="Lives have been changed"
        testimonials={TESTIMONIALS}
      />

      <SectionDivider top="gray" bottom="coral" variant="scallopBig" size="lg" />

      <Pricing
        revealContent
        fullViewport
        staticCards
        id="pricing"
        className="scroll-mt-nav"
        background="coral"
        eyebrow=""
        title="Settle it for the price of a coffee"
        tiers={TIERS}
      />

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
        badge="Takes 5 minutes"
        title="So… smart fella or fart smella?"
        subtitle=""
        primaryCta={{ label: "Take the test", href: "#pricing" }}
        secondaryCta={null}
      />

      <SectionDivider top="green" bottom="yellow" variant="stepped" size="lg" />

      {/* Standalone "follow us" moment, sat between the green CTA band and the blue
          footer as a bright yellow beacon (green → yellow → blue rhythm). The
          yellow→blue transition is NOT a divider here: the footer's own animated
          water wave (see components/sections/site-footer.tsx) is the sole seam —
          it overlaps this section and lets the yellow show above its crests. */}
      <FollowUs revealContent background="yellow" />
    </main>
  );
}
