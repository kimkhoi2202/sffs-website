import type { Metadata } from "next";
import {
  FileText,
  GraduationCap,
  Handshake,
  LineChart,
  Mail,
  Mic,
  Network,
  PhoneCall,
  Search,
  Send,
  ShieldCheck,
  Trophy,
  Users,
} from "@/components/ui/icons";

import { Hero } from "@/components/sections/hero";
import { LogoCloud } from "@/components/sections/logo-cloud";
import { StatBand, type Stat } from "@/components/sections/stat-band";
import { Bento, type BentoTile } from "@/components/sections/bento";
import { MarqueeHeadline } from "@/components/sections/marquee-headline";
import { FeatureGrid, type Feature } from "@/components/sections/feature-grid";
import { Comparison } from "@/components/sections/comparison";
import { FeatureTabs, type Tab } from "@/components/sections/feature-tabs";
import { Testimonials, type Testimonial } from "@/components/sections/testimonials";
import { Pricing, type Tier } from "@/components/sections/pricing";
import { Faq, type FaqItem } from "@/components/sections/faq";
import { CtaBand } from "@/components/sections/cta-band";
import { NewsletterSignup } from "@/components/sections/newsletter-signup";

export const metadata: Metadata = {
  title: "Closer - Modern Sales Training That Actually Closes Deals",
  description:
    "Closer teaches reps the exact plays the top 1% use to book meetings, run discovery, negotiate, and close, with courses, a weekly newsletter, a podcast, and ready-to-steal templates.",
};

const stats: Stat[] = [
  { value: "4.1M+", label: "podcast downloads" },
  { value: "72k", label: "weekly readers" },
  { value: "18", label: "expert instructors" },
  { value: "9", label: "tactic tracks" },
];

const offerings: BentoTile[] = [
  {
    type: "media",
    color: "blue",
    colSpan: 2,
    rowSpan: 2,
    badge: "Courses",
    label: "Self-paced course library",
  },
  {
    type: "feature",
    color: "ink",
    rowSpan: 2,
    icon: Mic,
    title: "The Closer Podcast",
    body: "New tactics every week from operators who still carry a number.",
  },
  {
    type: "feature",
    color: "yellow",
    icon: Mail,
    title: "Tuesday newsletter",
    body: "One play in your inbox, every single week.",
  },
  {
    type: "feature",
    color: "coral",
    icon: FileText,
    title: "Steal-ready templates",
    body: "Scripts, sequences, and checklists you can ship today.",
  },
  {
    type: "feature",
    color: "mint",
    colSpan: 2,
    icon: Users,
    title: "Peer community",
    body: "Role-play, live feedback, and wins with reps who actually reply.",
  },
  {
    type: "stat",
    color: "paper",
    icon: GraduationCap,
    value: "40+",
    label: "on-demand lessons",
  },
  {
    type: "quote",
    color: "cream",
    quote: "I book meetings before lunch now.",
    author: "Jordan T.",
    role: "SDR, Loop",
  },
];

const features: Feature[] = [
  {
    icon: Send,
    title: "Cold outreach that gets replies",
    body: "Openers and follow-ups tuned to earn a response, not a spam report.",
  },
  {
    icon: Search,
    title: "Discovery that surfaces real pain",
    body: "Question maps that get past the surface ask to real pain and budget.",
  },
  {
    icon: Network,
    title: "Multithreading into the C-suite",
    body: "Win the whole buying committee instead of betting on one champion.",
  },
  {
    icon: Handshake,
    title: "Negotiation without discounting",
    body: "Trade concessions instead of caving. Protect your margin and the deal.",
  },
  {
    icon: LineChart,
    title: "Forecasting you can defend",
    body: "Call your number with evidence your VP can't poke holes in.",
  },
  {
    icon: ShieldCheck,
    title: "Objection handling on the fly",
    body: "Turn \u201Cwe're all set\u201D into a real conversation, live on the call.",
  },
];

const tracks: Tab[] = [
  {
    label: "Cold Calling",
    icon: PhoneCall,
    badge: "Track 01",
    heading: "Dials that turn into booked meetings",
    body: "Get past the first ten seconds and earn the follow-up, without a robotic script.",
    bullets: [
      "Openers that beat the hang-up reflex",
      "A gatekeeper plan that actually works",
      "A callback cadence that fills your calendar",
    ],
    mediaLabel: "Cold calling track",
  },
  {
    label: "Discovery",
    icon: Search,
    badge: "Track 02",
    heading: "Ask the questions that close the deal",
    body: "Trade pitching for a conversation that surfaces real pain and real budget.",
    bullets: [
      "Uncover pain, power, and budget fast",
      "Quantify impact so urgency builds itself",
      "Lock the next step before you hang up",
    ],
    mediaLabel: "Discovery track",
  },
  {
    label: "Negotiation",
    icon: Handshake,
    badge: "Track 03",
    heading: "Hold your price with a straight face",
    body: "Walk into every negotiation with a plan that protects margin and momentum.",
    bullets: [
      "Trade concessions instead of giving them away",
      "Defuse the reflexive discount ask",
      "Stay in control when procurement shows up",
    ],
    mediaLabel: "Negotiation track",
  },
  {
    label: "Closing",
    icon: Trophy,
    badge: "Track 04",
    heading: "Make the signature feel inevitable",
    body: "Build momentum that ends in a signed contract, not a stalled thread.",
    bullets: [
      "Map every stakeholder to the decision",
      "Run a mutual action plan that sticks",
      "Ask for the business without the flinch",
    ],
    mediaLabel: "Closing track",
  },
];

const testimonials: Testimonial[] = [
  {
    quote:
      "I booked nine meetings in my first week on the cold-calling track. My manager thought I was inflating the numbers.",
    name: "Maya Rivera",
    role: "AE",
    company: "Northwind",
    avatarColor: "coral",
  },
  {
    quote:
      "Discovery finally clicked. I stopped pitching, started asking, and my average deal size jumped by a third.",
    name: "Devon Clarke",
    role: "SDR Lead",
    company: "Loop",
    avatarColor: "blue",
  },
  {
    quote:
      "The negotiation track paid for my whole year in one deal. I held list price on an enterprise contract for the first time ever.",
    name: "Priya Shah",
    role: "Enterprise AE",
    company: "Vertex",
    avatarColor: "yellow",
  },
  {
    quote:
      "Our new reps ramp in three weeks instead of three months. The 15-minute lessons actually get watched.",
    name: "Marcus Bell",
    role: "Sales Manager",
    company: "Brightsend",
    avatarColor: "ink",
  },
  {
    quote:
      "I used to dread objection handling. Now it's the part of the call I look forward to most.",
    name: "Sofia Nguyen",
    role: "Account Executive",
    company: "Meridian",
    avatarColor: "mint",
  },
  {
    quote:
      "The only sales training that ever stuck with me, tactical, fast, and mercifully free of fluff. I quote it back to my team weekly.",
    name: "Andre Willis",
    role: "VP of Sales",
    company: "Payline",
    avatarColor: "ink",
  },
];

const tiers: Tier[] = [
  {
    name: "Free",
    price: "$0",
    billingNote: "free forever",
    description:
      "Get a feel for the Closer method with the newsletter, the full podcast, and a taste of the courses.",
    features: [
      "Tuesday newsletter",
      "Full podcast archive",
      "3 sample lessons",
      "Community read access",
    ],
    cta: "Start free",
  },
  {
    name: "Pro",
    price: "$29",
    billingNote: "/ month",
    description:
      "Everything a quota-carrying rep needs to keep pipeline full and every deal moving.",
    features: [
      "Every course & tactic track",
      "All templates & scripts",
      "Full community access",
      "Monthly live workshops",
      "A new play every week",
    ],
    cta: "Go Pro",
    highlighted: true,
    badge: "Most popular",
    color: "blue",
  },
  {
    name: "Team",
    price: "Custom",
    billingNote: "per seat, billed annually",
    description:
      "Roll Closer out across the whole floor with coaching and reporting built in.",
    features: [
      "Everything in Pro",
      "Manager dashboards",
      "Live team coaching",
      "Onboarding & SSO",
      "Dedicated success manager",
    ],
    cta: "Talk to sales",
  },
];

const faqs: FaqItem[] = [
  {
    q: "Is Closer for SDRs or AEs?",
    a: "Both. The tracks run from cold outreach all the way through closing, so SDRs sharpen prospecting while AEs level up discovery, negotiation, and closing. Most reps mix and match as their role grows.",
  },
  {
    q: "How much time does it take each week?",
    a: "As little as fifteen minutes. Lessons are short and each one ends with a single action step, so you can watch a rep on the train and run the play on your very next call.",
  },
  {
    q: "Do you offer team plans?",
    a: "Yes. The Team plan adds manager dashboards, live coaching, and centralized billing, and we'll help you onboard the whole floor inside a week.",
  },
  {
    q: "Can I expense Closer?",
    a: "Almost always. We send an itemized invoice your finance team will happily approve, and most reps get Pro reimbursed without a second thought.",
  },
  {
    q: "What if it's not for me?",
    a: "No risk. Every plan is month-to-month and you can cancel anytime in one click, plus Pro is backed by a 14-day money-back guarantee.",
  },
];

export default function Home() {
  return (
    <>
      <Hero
        eyebrow="Modern sales training"
        title="Sell sharper. Close faster."
        subtitle="Skip the recycled 2000s playbooks. Get the exact plays the best reps use to book meetings, run real discovery, and close, taught by operators who still sell."
        primaryCta={{ label: "Start free", href: "/signup" }}
        secondaryCta={{ label: "Train your team", href: "/teams" }}
        mediaLabel="Course library preview"
        background="mint"
      />

      <LogoCloud
        variant="marquee"
        label="Trusted by revenue teams at fast-growing companies"
        companies={[
          "Northwind",
          "Acme Cloud",
          "Vertex",
          "Loop",
          "Brightsend",
          "Cargo",
          "Meridian",
          "Payline",
        ]}
        background="paper"
      />

      <StatBand
        eyebrow="By the numbers"
        title="Reps don't plateau here"
        stats={stats}
        background="ink"
      />

      <Bento
        eyebrow="Everything in one place"
        title="Ways to get better this week"
        description="Free plays, deep courses, and a community that actually replies."
        items={offerings}
        background="cream"
      />

      <MarqueeHeadline
        text="Book more meetings · Run better discovery · Close bigger deals ·"
        speed={30}
        background="coral"
      />

      <FeatureGrid
        eyebrow="Why Closer"
        title="Tactics you can use on your next call"
        intro="No theory dumps, every lesson ends with a script, a template, or a checklist."
        columns={3}
        features={features}
        background="paper"
      />

      <Comparison
        eyebrow="The difference"
        title="Old-school training vs Closer"
        theirLabel="Old-school training"
        ourLabel="Closer"
        theirPoints={[
          "Generic frameworks from a 2000s binder",
          "All theory, zero scripts",
          "One boring day of workshops",
          "Trainers who haven't sold in years",
        ]}
        ourPoints={[
          "Plays pressure-tested on live deals",
          "A template or checklist in every lesson",
          "Learn in 15-minute reps, on your schedule",
          "Taught by operators still in the arena",
        ]}
        background="cream"
      />

      <FeatureTabs
        eyebrow="Tactic tracks"
        title="Pick your path"
        tabs={tracks}
        background="paper"
      />

      <Testimonials
        eyebrow="Loved by reps"
        title="Quota-carriers who leveled up"
        testimonials={testimonials}
        background="mint"
      />

      <div id="pricing" className="scroll-mt-24">
        <Pricing
          eyebrow="Plans"
          title="Start free, upgrade when you're winning"
          tiers={tiers}
          background="cream"
        />
      </div>

      <Faq
        eyebrow="Questions"
        title="Before you sign up"
        items={faqs}
        background="paper"
      />

      <CtaBand
        title="Your next quarter starts with your next call"
        subtitle="Join thousands of reps sharpening their game every week."
        primaryCta={{ label: "Start free", href: "/signup" }}
        secondaryCta={{ label: "See pricing", href: "#pricing" }}
        align="center"
        badge="No card required"
        background="ink"
      />

      <NewsletterSignup
        variant="inline"
        eyebrow="The Tuesday play"
        title="One sales play in your inbox every Tuesday"
        subtitle="Short, tactical, free. Unsubscribe anytime."
        buttonLabel="Subscribe free"
        background="yellow"
      />
    </>
  );
}
