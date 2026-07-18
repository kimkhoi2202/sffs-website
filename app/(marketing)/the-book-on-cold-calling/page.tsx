import type { Metadata } from "next";
import {
  BarChart3,
  FileText,
  Ghost,
  Headphones,
  Layers,
  MailX,
  PhoneOff,
} from "lucide-react";

import { BookHero } from "@/components/sections/book-hero";
import {
  TestimonialMarquee,
  Testimonials,
  type Testimonial,
} from "@/components/sections/testimonials";
import { StatBand, type Stat } from "@/components/sections/stat-band";
import { Pricing, type Tier } from "@/components/sections/pricing";
import { FeatureGrid, type Feature } from "@/components/sections/feature-grid";
import { Steps, type StepItem } from "@/components/sections/steps";
import { Instructors, type Person } from "@/components/sections/instructors";
import { Faq, type FaqItem } from "@/components/sections/faq";
import { CtaBand } from "@/components/sections/cta-band";
import { Section } from "@/components/ui/section";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Heading } from "@/components/ui/heading";
import { Marquee } from "@/components/ui/marquee";

export const metadata: Metadata = {
  title: "The Cold Call Playbook - Book More Meetings",
  description:
    "Closer's step-by-step book for turning dreaded cold calls into booked meetings, openers, objection frameworks, and dial-blitz systems used by top reps. Single copy, 3-pack, and team bulk options, with bonus resources included.",
};

/* §2, early social proof: short reader wins that scroll in a marquee. */
const READER_QUOTES: Testimonial[] = [
  {
    quote:
      "I read it in a weekend and booked four meetings on Monday. The openers alone were worth it.",
    name: "Elena Ruiz",
    role: "SDR",
    company: "Northwind",
    avatarColor: "blue",
  },
  {
    quote:
      "Finally a cold-call book with actual scripts instead of vague pep talks. My dials convert now.",
    name: "Tomas Realer",
    role: "Account Executive",
    company: "Loop",
    avatarColor: "coral",
  },
  {
    quote:
      "I bought copies for my whole team. Ramp time dropped and everyone sounds confident on the phone.",
    name: "Grace Okafor",
    role: "Sales Manager",
    company: "Brightsend",
    avatarColor: "yellow",
  },
  {
    quote:
      "The objection chapter is a cheat code. I stopped freezing on 'just send me an email.'",
    name: "Priya Shah",
    role: "Enterprise AE",
    company: "Vertex",
    avatarColor: "mint",
  },
  {
    quote:
      "Chapter three rebuilt my entire dialing routine. I make twice the calls in half the dread.",
    name: "Marcus Bell",
    role: "SDR Lead",
    company: "Meridian",
    avatarColor: "ink",
  },
  {
    quote:
      "The bonus workbook is the part I actually use daily. Print it, fill it, book more meetings.",
    name: "Sofia Nguyen",
    role: "AE",
    company: "Payline",
    avatarColor: "blue",
  },
];

/* §2, "trusted at teams like" wordmarks for the logo marquee (original placeholders). */
const PROOF_LOGOS = [
  "Northwind",
  "Loopwork",
  "Vertex",
  "Brightsend",
  "Meridian",
  "Payline",
  "Cloudgraph",
  "Tidepool",
  "Halcyon",
  "Everpeak",
];

/* Edge fade so the logo marquee scrolls in/out instead of clipping at the edges. */
const LOGO_FADE =
  "linear-gradient(to right, transparent, #000 6%, #000 94%, transparent)";

/* §3, headline proof numbers (original, plainly placeholder). */
const BOOK_STATS: Stat[] = [
  { value: "38k", label: "copies in the wild" },
  { value: "40+", label: "steal-ready scripts" },
  { value: "1,900", label: "calls broken down" },
  { value: "4.9/5", label: "average reader rating" },
];

/* §4, three buy bundles; the 3-pack is flagged as best value. */
const BOOK_TIERS: Tier[] = [
  {
    name: "One copy",
    price: "$29",
    billingNote: "for you",
    description:
      "The full playbook plus the bonus workbook and lifetime updates, everything one rep needs to stop dreading the phone.",
    features: [
      "The complete Cold Call Playbook",
      "Printable objection workbook",
      "Audio scripts via QR code",
      "Lifetime free updates",
    ],
    cta: "Buy the book",
    href: "#pricing",
  },
  {
    name: "3-pack",
    price: "$69",
    billingNote: "share with your pod",
    description:
      "Three copies at a bulk price for you and the two teammates who dial next to you. Learn the plays and practice them together.",
    features: [
      "Three copies (save 20%)",
      "Everything in One copy",
      "Shared role-play drills",
      "Team objection tracker",
    ],
    cta: "Buy the 3-pack",
    href: "#pricing",
    highlighted: true,
    color: "blue",
    badge: "Best value",
  },
  {
    name: "10-pack",
    price: "$199",
    billingNote: "arm the whole team",
    description:
      "Ten copies plus a manager's rollout guide, so you can turn a shared book into a shared cold-calling system across the floor.",
    features: [
      "Ten copies (save 30%)",
      "Everything in the 3-pack",
      "Manager rollout guide",
      "Team kickoff call template",
    ],
    cta: "Buy the 10-pack",
    href: "#pricing",
  },
];

/* §5, the problem: why cold calling feels like a waste (agitation). */
const PROBLEMS: Feature[] = [
  {
    icon: PhoneOff,
    title: "Nobody picks up",
    body: "You blitz a list, hit voicemail after voicemail, and start to wonder whether the phone is even worth it anymore.",
  },
  {
    icon: Ghost,
    title: "When they answer, they brush you off",
    body: "The rare live pickup ends in ten seconds, a reflexive 'not interested' before you ever get to say why you called.",
  },
  {
    icon: MailX,
    title: "So reps hide behind email",
    body: "Dodging the phone feels safer, pipeline dries up quietly, and the one channel that still books meetings goes cold.",
  },
];

/* §6, what's inside: the concrete value you walk away with. */
const WHATS_INSIDE: Feature[] = [
  {
    icon: FileText,
    title: "Exactly what to say",
    body: "Word-for-word openers, bridges, and objection responses you can lift onto your very next dial, no rewriting required.",
    accent: "yellow",
    badge: "Scripts",
    mediaLabel: "Script preview",
  },
  {
    icon: Headphones,
    title: "How it should sound",
    body: "Every core script is recorded. Scan a QR code and hear the tone, pacing, and pauses that make an opener actually land.",
    accent: "coral",
    badge: "Audio",
    mediaLabel: "QR / audio",
  },
  {
    icon: Layers,
    title: "Frameworks for any industry",
    body: "Swap in your product and market. The plays are structures, not gimmicks, so they hold up whatever you sell.",
    accent: "mint",
    badge: "Frameworks",
    mediaLabel: "Framework map",
  },
  {
    icon: BarChart3,
    title: "Grounded in real calls",
    body: "Every tactic is pulled from teardown transcripts of live calls, what worked, what flopped, and why it mattered.",
    accent: "blue",
    badge: "Call data",
    mediaLabel: "Call teardown",
  },
];

/* §7, the chapter outline as three numbered parts. */
const CHAPTERS: StepItem[] = [
  {
    label: "Part I",
    title: "Win the opening",
    body: "Beat the ten-second hang-up reflex with openers that earn attention and frame a problem worth talking about.",
  },
  {
    label: "Part II",
    title: "Handle the rest of the call",
    body: "Work through objections, voicemails, and gatekeepers with responses that keep the conversation moving to a next step.",
  },
  {
    label: "Part III",
    title: "Become a dialing machine",
    body: "Build a repeatable daily block that lifts both your conversion rate and your raw volume, without burning out.",
  },
];

/* §8, about the authors (invented practitioners). */
const AUTHORS: Person[] = [
  {
    name: "Dylan Marsh",
    role: "Co-author · Former VP of Sales",
    bio: "Built and ran outbound teams for a decade, from first SDR to nine-figure org. Writes the parts about turning dials into a system.",
    socials: [
      { platform: "linkedin", href: "#" },
      { platform: "youtube", href: "#" },
    ],
  },
  {
    name: "Nadia Feld",
    role: "Co-author · Former top enterprise rep",
    bio: "Carried a number for twelve years and out-dialed every floor she joined. Writes the parts about what to actually say on the phone.",
    socials: [
      { platform: "linkedin", href: "#" },
      { platform: "instagram", href: "#" },
    ],
  },
];

/* §9, the reviews wall. */
const REVIEWS: Testimonial[] = [
  {
    quote:
      "The best $29 I've spent on my career. I keep it open on my desk during every call block.",
    name: "Owen Marsh",
    role: "SDR",
    company: "Cloudgraph",
    avatarColor: "blue",
  },
  {
    quote:
      "I gave up on cold calling twice before this. Now it's my most reliable source of pipeline.",
    name: "Hana Beck",
    role: "AE",
    company: "Tidepool",
    avatarColor: "coral",
  },
  {
    quote:
      "My manager noticed the difference in a week. The gatekeeper section is criminally underrated.",
    name: "Dominic Fry",
    role: "SDR",
    company: "Vantage",
    avatarColor: "yellow",
  },
  {
    quote:
      "Short chapters, real scripts, zero fluff. I finished it on a flight and used it the next morning.",
    name: "Ava Lindqvist",
    role: "Account Executive",
    company: "Halcyon",
    avatarColor: "mint",
  },
  {
    quote:
      "We onboard every new rep with this book now. It's basically our cold-calling curriculum.",
    name: "Marcus Ihejirika",
    role: "Sales Manager",
    company: "Beacon",
    avatarColor: "ink",
  },
  {
    quote:
      "The audio scripts are the secret weapon. Hearing the pacing changed how I open every call.",
    name: "Rae Solano",
    role: "SDR Lead",
    company: "Larkwave",
    avatarColor: "coral",
  },
  {
    quote:
      "I stopped winging it and started running plays. My connect-to-meeting rate nearly doubled.",
    name: "Theo Ballard",
    role: "AE",
    company: "Nimbus",
    avatarColor: "blue",
  },
  {
    quote:
      "Practical to a fault. Every chapter ends with something I could do on my next dial.",
    name: "Priya Nair",
    role: "Enterprise AE",
    company: "Foundry",
    avatarColor: "yellow",
  },
];

/* §10, objection handling before purchase. */
const BOOK_FAQ: FaqItem[] = [
  {
    q: "Do you offer team or bulk discounts?",
    a: "Yes. The 3-pack and 10-pack are already discounted, and for larger orders you can reach out for custom pricing and an invoice your finance team will approve.",
  },
  {
    q: "Is it print or digital?",
    a: "Both. Every purchase includes the digital edition instantly, and print copies ship within a few business days. The 3-pack and 10-pack are print bundles with digital included.",
  },
  {
    q: "How fast do I get it?",
    a: "The digital edition and bonus workbook are available the moment you buy. Physical copies are printed to order and typically arrive within a week.",
  },
  {
    q: "Is this for brand-new reps?",
    a: "Absolutely. New reps get a ready-made system instead of learning by trial and error, and experienced reps use it to sharpen openers and objection handling.",
  },
  {
    q: "What's your refund policy?",
    a: "If the book doesn't earn its price back in booked meetings, email us within 30 days for a full refund. Keep the bonus workbook either way.",
  },
];

export default function TheBookOnColdCallingPage() {
  return (
    <>
      {/* §1 BookHero, cover + buy CTA, blue */}
      <BookHero
        background="blue"
        eyebrow="New from Closer"
        title="The Cold Call Playbook"
        subtitle="Turn the calls you dread into the meetings you need. A step-by-step system of openers, objection frameworks, and dial-blitz routines, with every script recorded so you know exactly how it should sound."
        price="$29"
        bullets={[
          "40+ steal-ready scripts for calls and voicemails",
          "A framework for handling any objection live",
          "Audio versions of every script via QR code",
          "Bonus printable workbook + lifetime updates",
        ]}
        primaryCta={{ label: "Buy the book", href: "#pricing" }}
        secondaryCta={{ label: "Read a sample", href: "#whats-inside" }}
      />

      {/* §2 Early social proof, reader-wins marquee + trusted-by logo strip in one cream block, cream */}
      <Section background="cream" padding="md" bordered>
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>Readers are booking meetings</Eyebrow>
          <Heading as={2} size="md" className="mt-3">
            Loved by reps who live on the phone
          </Heading>
        </div>

        <div className="mt-10">
          <TestimonialMarquee testimonials={READER_QUOTES} speed={46} />
        </div>

        <div className="mt-8 text-center">
          <Eyebrow>Trusted at teams like</Eyebrow>
        </div>
        <div
          className="mt-6"
          style={{ WebkitMaskImage: LOGO_FADE, maskImage: LOGO_FADE }}
        >
          <Marquee speed={40} gap="1.5rem" reverse className="py-2">
            {PROOF_LOGOS.map((name) => (
              <span
                key={name}
                className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full border-[2.5px] border-ink bg-paper px-5 py-2.5 font-display text-base uppercase leading-none text-ink shadow-hard-xs md:text-lg"
              >
                {name}
              </span>
            ))}
          </Marquee>
        </div>
      </Section>

      {/* §3 StatBand, headline proof numbers, ink */}
      <StatBand
        background="ink"
        eyebrow="By the numbers"
        title="A cold-calling book reps actually finish"
        stats={BOOK_STATS}
      />

      {/* §4 Pricing, buy options (anchor for every "Buy the book" CTA), coral */}
      <div id="pricing" className="scroll-mt-24">
        <Pricing
          background="coral"
          eyebrow="Buy options"
          title="Grab your copy, or arm the whole team"
          tiers={BOOK_TIERS}
        />
      </div>

      {/* §5 FeatureGrid, the problem (agitation), mint */}
      <FeatureGrid
        background="mint"
        columns={3}
        eyebrow="Why most reps quit the phone"
        title="Cold calling only feels like a waste without a system"
        intro="It isn't that the phone stopped working. It's that nobody handed you a repeatable way to use it. Here's what that gap actually feels like."
        features={PROBLEMS}
      />

      {/* §6 FeatureGrid, what's inside, paper */}
      <FeatureGrid
        id="whats-inside"
        className="scroll-mt-24"
        background="paper"
        columns={2}
        eyebrow="What's inside"
        title="Leave every session with a booked meeting"
        intro="The book is built to be used, not admired. Everything in it is designed to move from the page onto your next call."
        features={WHATS_INSIDE}
      />

      {/* §7 Steps, chapter outline, yellow */}
      <Steps
        background="yellow"
        eyebrow="Inside the book"
        title="Three parts, one dialing machine"
        steps={CHAPTERS}
        cta={{ label: "Buy the book", href: "#pricing" }}
      />

      {/* §8 Instructors, about the authors, paper */}
      <Instructors
        background="paper"
        columns={2}
        media="avatar"
        eyebrow="About the authors"
        title="Written by people who still make the calls"
        people={AUTHORS}
      />

      {/* §9 Testimonials, reviews wall, blue */}
      <Testimonials
        background="blue"
        eyebrow="Reader reviews"
        title="Join the reps booking more meetings"
        testimonials={REVIEWS}
        cta={{ label: "Buy the book", href: "#pricing" }}
      />

      {/* §10 Faq, objection handling [client], cream */}
      <Faq
        background="cream"
        eyebrow="FAQ"
        title="Everything you might be wondering"
        items={BOOK_FAQ}
      />

      {/* §11 CtaBand, closing nudge back to pricing, coral */}
      <CtaBand
        background="coral"
        align="center"
        badge="Ships worldwide"
        title="Book more meetings, starting on your next dial"
        subtitle="Get the playbook, the workbook, and the audio scripts today, and turn the phone back into your best channel."
        primaryCta={{ label: "Buy the book", href: "#pricing" }}
        secondaryCta={{ label: "See what's inside", href: "#whats-inside" }}
      />
    </>
  );
}
