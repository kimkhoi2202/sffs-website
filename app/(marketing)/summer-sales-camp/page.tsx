import type { Metadata } from "next";
import {
  ClipboardList,
  ListChecks,
  PhoneCall,
  Rocket,
  ShieldCheck,
  Users,
} from "lucide-react";

import { PageHero } from "@/components/sections/page-hero";
import { MarqueeHeadline } from "@/components/sections/marquee-headline";
import { Steps, type StepItem } from "@/components/sections/steps";
import { FeatureGrid, type Feature } from "@/components/sections/feature-grid";
import { StatBand, type Stat } from "@/components/sections/stat-band";
import { Instructors, type Person } from "@/components/sections/instructors";
import { Testimonials, type Testimonial } from "@/components/sections/testimonials";
import { Pricing, type Tier } from "@/components/sections/pricing";
import { Faq, type FaqItem } from "@/components/sections/faq";
import { CtaBand } from "@/components/sections/cta-band";

export const metadata: Metadata = {
  title: "Closer Summer Camp - Build Your Sales Engine in 4 Weeks (Live & Free)",
  description:
    "Closer Summer Camp is a free 4-week live cohort for reps and sales leaders. Live sessions, steal-able playbooks, and templates for prospecting, discovery, deal control, and closing. Doors open July 6.",
};

/** §3, the week-by-week agenda; the week # + date rides the step title. */
const CAMP_SCHEDULE: StepItem[] = [
  {
    title: "Week 1 · Jul 6 - Prospecting",
    body: "Build a razor-sharp ICP and a multi-touch outbound cadence. You'll leave week one with a live target list and openers that book meetings the same afternoon.",
  },
  {
    title: "Week 2 · Jul 13 - Discovery",
    body: "Run discovery that surfaces the real, budget-worthy problem. You'll leave with a one-page scorecard that qualifies (or kills) any deal inside the first call.",
  },
  {
    title: "Week 3 · Jul 20 - Deal Control",
    body: "Multi-thread the buying committee and map the path to signature. You'll leave with a reusable mutual action plan so deals stop stalling in limbo.",
  },
  {
    title: "Week 4 · Jul 27 - Closing & Expansion",
    body: "Handle objections, create honest urgency, and lock the next step. You'll leave with a close checklist and a 30-day plan to turn it all into pipeline.",
  },
];

/** §4, concrete assets each camper builds by graduation. */
const CAMP_OUTCOMES: Feature[] = [
  {
    icon: PhoneCall,
    title: "A prospecting cadence",
    body: "A multi-touch outbound sequence tuned to your market, the exact days, channels, and messages that keep your calendar booked.",
  },
  {
    icon: ClipboardList,
    title: "A discovery scorecard",
    body: "A one-page rubric that tells you within ten minutes whether a deal is real, so you stop pouring hours into opportunities that ghost.",
  },
  {
    icon: Users,
    title: "A multi-thread map",
    body: "A simple diagram of every buyer, blocker, and champion, plus the play to win each one before procurement ever enters the room.",
  },
  {
    icon: ShieldCheck,
    title: "An objection playbook",
    body: "Word-for-word responses to the ten objections that stall your deals most, rehearsed live until they feel completely natural.",
  },
  {
    icon: ListChecks,
    title: "A close checklist",
    body: "A pre-flight list that flushes out every risk before the verbal yes, so signatures stop slipping into next quarter.",
  },
  {
    icon: Rocket,
    title: "A 30-day ramp plan",
    body: "A day-by-day plan to turn everything you learned at camp into real, sourced pipeline the month after it ends.",
  },
];

/** §5, invented-but-plausible camp stats (clearly placeholder). */
const CAMP_STATS: Stat[] = [
  { value: "4", label: "Weeks live" },
  { value: "12", label: "Live sessions" },
  { value: "30+", label: "Steal-able templates" },
  { value: "5,000+", label: "Camp alumni" },
];

/** §6, fictional Closer coaches with original one-line bios. */
const CAMP_COACHES: Person[] = [
  {
    name: "Rae Solano",
    role: "Head of Cold Calls",
    bio: "Booked 1,200 meetings a year at fintech upstart Larkwave; teaches openers that survive the first ten seconds on the phone.",
    socials: [
      { platform: "linkedin", href: "#" },
      { platform: "youtube", href: "#" },
    ],
  },
  {
    name: "Marcus Ihejirika",
    role: "Discovery Coach",
    bio: "Closed $40M in net-new at Beacon Cloud by asking sharper questions than anyone else in the room, and shows you exactly how.",
    socials: [
      { platform: "linkedin", href: "#" },
      { platform: "youtube", href: "#" },
    ],
  },
  {
    name: "Priya Ravel",
    role: "Deal Strategist",
    bio: "Ran nine-figure enterprise cycles at Northwind and now teaches reps how to control a deal instead of chasing it downhill.",
    socials: [
      { platform: "linkedin", href: "#" },
      { platform: "youtube", href: "#" },
    ],
  },
];

/** §7, original alumni quotes focused on concrete results. */
const CAMP_TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "I booked 19 meetings in the two weeks after camp, more than my entire previous quarter. The cadence just works.",
    name: "Dominic Fry",
    role: "SDR",
    company: "Cloudgraph",
    avatarColor: "blue",
  },
  {
    quote:
      "My cycle times dropped by three weeks once I started running the discovery scorecard on every single first call.",
    name: "Hana Beck",
    role: "Account Executive",
    company: "Tidepool",
    avatarColor: "coral",
  },
  {
    quote:
      "Camp gave me my first President's-Club-caliber quarter. I finally have a system instead of a lucky streak.",
    name: "Owen Marsh",
    role: "Enterprise AE",
    company: "Vantage",
    avatarColor: "ink",
  },
];

/** §8, three ticket tiers; the middle Pro Pass is featured. */
const CAMP_TIERS: Tier[] = [
  {
    name: "Camper",
    price: "$0",
    billingNote: "free forever",
    description:
      "Everything you need to attend all four weeks of camp, live and in full.",
    features: [
      "All 12 live sessions",
      "Weekly homework drills",
      "Private camp community",
      "Certificate of completion",
    ],
    cta: "Grab a free seat",
    href: "#pricing",
  },
  {
    name: "Pro Pass",
    price: "$149",
    billingNote: "one-time",
    description:
      "For reps who want the whole toolkit and every session on replay.",
    features: [
      "Everything in Camper",
      "Lifetime session recordings",
      "All 30+ templates & workbooks",
      "The Closer discovery scorecard",
      "Graded final-week deal review",
    ],
    cta: "Get the Pro Pass",
    href: "#pricing",
    highlighted: true,
    color: "blue",
    badge: "Most popular",
  },
  {
    name: "Team Table",
    price: "$1,200",
    billingNote: "up to 10 seats",
    description:
      "Bring the whole squad and ramp them together in one cohort.",
    features: [
      "10 Pro Passes",
      "Private team cohort channel",
      "Manager progress dashboard",
      "Live team debrief with a coach",
    ],
    cta: "Reserve a table",
    href: "#pricing",
  },
];

/** §9, objection-handling Q&A (original copy). */
const CAMP_FAQ: FaqItem[] = [
  {
    q: "Is Closer Summer Camp really free?",
    a: "Completely. The Camper pass costs nothing and gets you into all twelve live sessions. Paid passes only add recordings, templates, and team features on top.",
  },
  {
    q: "Are the sessions recorded?",
    a: "Live attendance is best, but every session is recorded. Pro Pass and Team Table holders keep lifetime access to the replays.",
  },
  {
    q: "Who is camp for?",
    a: "SDRs, AEs, and sales leaders at any stage. If you talk to buyers for a living, the plays translate directly to your seat.",
  },
  {
    q: "Can I bring my team?",
    a: "Please do. The Team Table covers up to ten seats, a private cohort channel, and a live end-of-camp debrief with one of the coaches.",
  },
  {
    q: "What's the weekly time commitment?",
    a: "Plan on roughly three hours a week: two live sessions plus a short homework drill you can run on your real, open deals.",
  },
  {
    q: "What if I miss a week?",
    a: "No problem. Catch the replay, run the drill on your own time, and jump straight back into the next live session, the full schedule stays posted.",
  },
];

export default function SummerSalesCampPage() {
  return (
    <>
      {/* §1 PageHero, event hero, dates/urgency in the eyebrow, blue */}
      <PageHero
        align="center"
        background="blue"
        eyebrow="Live cohort · Starts Jul 6 · 4 weeks · 100% free"
        title="Build your whole sales engine in one summer"
        subtitle="Closer Summer Camp is a free, live 4-week intensive for reps and sales leaders who want a repeatable system for prospecting, discovery, deal control, and closing. Sessions run live and every one is recorded."
        cta={{ label: "Save my seat", href: "#pricing" }}
        note="No cost to attend. Live sessions, plus a recording of every week."
      />

      {/* §2 MarqueeHeadline, urgency divider, ink */}
      <MarqueeHeadline
        background="ink"
        speed={28}
        text="Seats are limited · Doors close Friday, July 3 · Bring your whole team"
      />

      {/* §3 Steps, 4-week agenda (anchor for the "get the schedule" CTA), paper */}
      <Steps
        id="schedule"
        className="scroll-mt-24"
        background="paper"
        eyebrow="The 4-week camp plan"
        title="Four weeks. Four systems. One closing machine."
        steps={CAMP_SCHEDULE}
      />

      {/* §4 FeatureGrid, what you'll walk away with, mint */}
      <FeatureGrid
        background="mint"
        columns={3}
        eyebrow="What you'll walk away with"
        title="Six take-home systems, not a pile of notes"
        intro="Every session ends with something you can use on your next call. By graduation you'll have built all six of these assets for your own pipeline."
        features={CAMP_OUTCOMES}
      />

      {/* §5 StatBand, proof in numbers, ink */}
      <StatBand
        background="ink"
        eyebrow="Camp by the numbers"
        title="A summer that actually moves the needle"
        stats={CAMP_STATS}
      />

      {/* §6 Instructors, who's coaching, cream */}
      <Instructors
        background="cream"
        columns={3}
        media="avatar"
        eyebrow="Your camp coaches"
        title="Learn from closers who still carry a number"
        people={CAMP_COACHES}
      />

      {/* §7 Testimonials, alumni proof, yellow */}
      <Testimonials
        background="yellow"
        eyebrow="Camp alumni"
        title="What last summer's cohort pulled off"
        testimonials={CAMP_TESTIMONIALS}
      />

      {/* §8 Pricing, ticket tiers (wrapped for the #pricing deep-link anchor), paper */}
      <div id="pricing" className="scroll-mt-24">
        <Pricing
          background="paper"
          eyebrow="Camp passes"
          title="Pick your seat at camp"
          tiers={CAMP_TIERS}
        />
      </div>

      {/* §9 Faq, objection handling [client], cream */}
      <Faq
        background="cream"
        eyebrow="Before you pack"
        title="Camp questions, answered"
        items={CAMP_FAQ}
      />

      {/* §10 CtaBand, final register CTA, coral */}
      <CtaBand
        background="coral"
        align="center"
        badge="Doors close Fri · Jul 3"
        title="Your seat at Closer Summer Camp is waiting"
        subtitle="Four weeks, twelve live sessions, one repeatable sales engine. Free to attend, fully recorded, and no credit card required."
        primaryCta={{ label: "Claim your free seat", href: "#pricing" }}
        secondaryCta={{ label: "Get the schedule", href: "#schedule" }}
      />
    </>
  );
}
