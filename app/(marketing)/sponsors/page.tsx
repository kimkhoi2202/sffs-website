import type { Metadata } from "next";

import { PageHero } from "@/components/sections/page-hero";
import { StatBand, type Stat } from "@/components/sections/stat-band";
import { LogoCloud } from "@/components/sections/logo-cloud";
import { Steps, type StepItem } from "@/components/sections/steps";
import { SponsorTiers, type Tier } from "@/components/sections/sponsor-tiers";
import { Testimonials, type Testimonial } from "@/components/sections/testimonials";
import { Faq, type FaqItem } from "@/components/sections/faq";
import { CtaBand } from "@/components/sections/cta-band";

export const metadata: Metadata = {
  title: "Partner with Closer - Reach B2B Sales Teams",
  description:
    "Put your product in front of the sales reps and leaders who shape B2B buying decisions. Multi-channel sponsorships with Closer that turn awareness into pipeline.",
};

const AUDIENCE_STATS: Stat[] = [
  { value: "180k+", label: "Weekly subscribers" },
  { value: "44%", label: "Are sales leaders" },
  { value: "72%", label: "Based in North America" },
  { value: "3.2M", label: "Monthly impressions" },
];

const SPONSOR_LOGOS: string[] = [
  "Northbeam",
  "Vantgo",
  "Pipeline Labs",
  "Quotaworks",
  "Signalhouse",
  "RevRocket",
  "Cadencely",
  "Outboundr",
  "Dealframe",
  "Closewise",
];

const PARTNERSHIP_STEPS: StepItem[] = [
  {
    title: "Book an intro call",
    body: "We start with a short call to learn your ideal customer, your goals, and what a win looks like, then tell you honestly whether our audience is a fit.",
  },
  {
    title: "Co-create the message",
    body: "Our editors draft the placement alongside your team so it sounds like the show and lands like a recommendation instead of an interruption.",
  },
  {
    title: "Run it across channels",
    body: "Your campaign goes live across the newsletter, podcast, and social over several weeks, staying in front of the buyers you actually care about.",
  },
  {
    title: "Measure the pipeline",
    body: "You get a plain-English recap of reach, clicks, and sourced opportunities, so you know exactly what the partnership returned.",
  },
];

const SPONSOR_TIERS: Tier[] = [
  {
    name: "Spotlight",
    reach: "80k+ reach",
    reachNote: "one newsletter placement",
    description:
      "A single, sharp placement to test the waters and see how our audience responds to your message.",
    includes: [
      "One dedicated newsletter slot",
      "Copy drafted with our editors",
      "Tracked click-through link",
      "48-hour performance recap",
    ],
    price: "Let's talk",
    priceLabel: "Investment",
    cta: "Book a call",
    href: "#book",
  },
  {
    name: "Signature",
    reach: "260k+ reach",
    reachNote: "newsletter + podcast, 4 weeks",
    description:
      "Show up everywhere your buyers already learn, all month long, our most popular way to partner.",
    includes: [
      "Everything in Spotlight",
      "Host-read podcast midroll",
      "Four-week always-on flight",
      "Social amplification",
      "A dedicated campaign manager",
    ],
    price: "Let's talk",
    priceLabel: "Investment",
    cta: "Book a call",
    href: "#book",
    highlighted: true,
    badge: "Most popular",
  },
  {
    name: "Season",
    reach: "1M+ reach",
    reachNote: "every channel, full quarter",
    description:
      "Own the conversation for a whole quarter with a sustained, multi-channel presence buyers can't miss.",
    includes: [
      "Everything in Signature",
      "12-week campaign flight",
      "Category exclusivity",
      "Custom content collaboration",
      "Quarterly results review",
    ],
    price: "Let's talk",
    priceLabel: "Investment",
    cta: "Book a call",
    href: "#book",
  },
];

const PARTNER_TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "We sourced more qualified pipeline from one Closer flight than from a full quarter of paid social. Reps were quoting our ad back to us on calls.",
    name: "Renée Alvarez",
    role: "VP Marketing",
    company: "Northbeam",
    avatarColor: "blue",
  },
  {
    quote:
      "The team wrote the placement better than we could have ourselves. It didn't feel like an ad. It felt like a recommendation from someone the audience already trusts.",
    name: "Marcus Feld",
    role: "Head of Growth",
    company: "Vantgo",
    avatarColor: "coral",
  },
  {
    quote:
      "Booking calls was the whole point, and the demos that came in closed faster. Prospects from their audience already understood what we do before we said a word.",
    name: "Priya Shah",
    role: "CMO",
    company: "Pipeline Labs",
    avatarColor: "mint",
  },
];

const SPONSOR_FAQ: FaqItem[] = [
  {
    q: "Is your audience actually a fit for a B2B product?",
    a: "Closer is read and heard almost entirely by people who sell or lead sales for a living. If you're trying to reach reps, managers, or revenue leaders, this is one of the most concentrated audiences you'll find anywhere.",
  },
  {
    q: "How selective are you about who you work with?",
    a: "Very. We run only a handful of partners at a time and turn down anything that wouldn't genuinely help our audience. That restraint is exactly why the placements keep performing.",
  },
  {
    q: "What kind of results should I expect?",
    a: "Most partners come to us for pipeline, not just impressions. We set a realistic benchmark on the intro call based on your offer, then send a recap of reach, clicks, and sourced opportunities after the flight.",
  },
  {
    q: "How is this different from buying generic ads?",
    a: "Generic ads interrupt. Our placements are written in the voice of the show and arrive as a trusted recommendation, so they get read, remembered, and acted on instead of scrolled past.",
  },
  {
    q: "Can I test with something small first?",
    a: "Yes. The Spotlight package exists for exactly that, a single placement so you can see how the audience responds before committing to a longer flight.",
  },
  {
    q: "Do I have to write the copy myself?",
    a: "Never. Our editors draft every placement with your team and tune it until it sounds like us and sells like you. You approve everything before it ships.",
  },
  {
    q: "What do you need from me to get started?",
    a: "Just a short intro call and a sense of your ideal customer and goals. We handle the scheduling, the writing, and the reporting from there.",
  },
];

export default function SponsorsPage() {
  return (
    <>
      <PageHero
        align="center"
        background="blue"
        eyebrow="Partner with Closer"
        title="Get in front of every B2B sales team that matters"
        subtitle="Closer is where reps and revenue leaders sharpen their craft every week. Put your product in that room and turn attention into real pipeline."
        cta={{ label: "Book a call", href: "#book" }}
        secondaryCta={{ label: "Get the media kit", href: "/media-kit" }}
        mediaLabel="Campaign reel"
      />

      <StatBand
        background="ink"
        eyebrow="The audience"
        title="Who's actually listening"
        stats={AUDIENCE_STATS}
      />

      <LogoCloud
        background="paper"
        variant="marquee"
        label="The teams that already partner with us"
        companies={SPONSOR_LOGOS}
      />

      <Steps
        background="cream"
        eyebrow="How it works"
        title="From intro call to sourced pipeline"
        steps={PARTNERSHIP_STEPS}
      />

      <SponsorTiers
        background="mint"
        eyebrow="Ways to partner"
        title="Pick the partnership that fits"
        intro="Every package ships with copy written alongside your team and a plain-English performance recap. Start small or wrap the whole audience, your call."
        tiers={SPONSOR_TIERS}
      />

      <Testimonials
        background="paper"
        eyebrow="Partner results"
        title="What partners say after they run with us"
        testimonials={PARTNER_TESTIMONIALS}
      />

      <Faq
        background="cream"
        eyebrow="Before you ask"
        title="Sponsor questions, answered"
        items={SPONSOR_FAQ}
      />

      <CtaBand
        id="book"
        className="scroll-mt-24"
        background="coral"
        align="center"
        badge="Now booking partners"
        title="Let's map out your campaign"
        subtitle="Tell us who you're trying to reach and we'll show you exactly how to reach them through Closer. One call is all it takes to get started."
        primaryCta={{ label: "Book a call", href: "mailto:hello@example.com?subject=Closer%20partnership" }}
        secondaryCta={{ label: "Get the media kit", href: "mailto:hello@example.com?subject=Closer%20media%20kit" }}
      />
    </>
  );
}
