import type { Metadata } from "next";

import { PageHero } from "@/components/sections/page-hero";
import { CourseGrid, type Course } from "@/components/sections/course-card";
import { FeatureTabs, type Tab } from "@/components/sections/feature-tabs";
import { Steps, type StepItem } from "@/components/sections/steps";
import { Instructors, type Person } from "@/components/sections/instructors";
import { Pricing, type Tier } from "@/components/sections/pricing";
import { Testimonials, type Testimonial } from "@/components/sections/testimonials";
import { Faq, type FaqItem } from "@/components/sections/faq";
import { CtaBand } from "@/components/sections/cta-band";
import { NewsletterSignup } from "@/components/sections/newsletter-signup";

export const metadata: Metadata = {
  title: "Courses - Sales Training That Books Meetings & Closes Deals | Closer",
  description:
    "Browse Closer's library of step-by-step sales courses, cold calling, cold email, discovery, negotiation, and leadership. Learn the exact plays top reps use to book meetings and hit quota. Self-paced, with team plans available.",
};

/* Individual tracks, the core catalog; bundles render as their own group below. */
const courses: Course[] = [
  {
    title: "Cold Calling That Books Meetings",
    description:
      "Open cold with a hook that earns the next sixty seconds, defuse the brush-off, and lock a meeting before you hang up.",
    level: "Beginner",
    lessons: 15,
    duration: "2h 30m",
    rating: 4.8,
    price: "$59",
    tags: ["Cold calling", "Prospecting"],
  },
  {
    title: "Cold Email & Sequences",
    description:
      "Write cold emails people actually reply to, then wrap them in multi-touch sequences that fill your calendar on autopilot.",
    level: "Beginner",
    lessons: 12,
    duration: "2h 05m",
    rating: 4.7,
    price: "$59",
    tags: ["Cold email", "Prospecting"],
  },
  {
    title: "Discovery That Sells Itself",
    description:
      "Run discovery that surfaces real pain, quantifies the impact, and quietly builds the urgency that closes the deal for you.",
    level: "Intermediate",
    lessons: 18,
    duration: "3h 10m",
    rating: 4.9,
    price: "$89",
    tags: ["Discovery", "Qualification"],
  },
  {
    title: "Negotiation & Closing",
    description:
      "Hold your price without the sweat, trade concessions with intent and ask for the business without the flinch.",
    level: "Advanced",
    lessons: 16,
    duration: "2h 55m",
    rating: 4.9,
    price: "$99",
    tags: ["Negotiation", "Closing"],
  },
  {
    title: "Multithreading the Enterprise Deal",
    description:
      "Map every stakeholder, build real champions, and steer a complex buying committee to a confident, on-time yes.",
    level: "Advanced",
    lessons: 14,
    duration: "2h 40m",
    rating: 4.8,
    price: "$119",
    tags: ["Enterprise", "Multithreading"],
  },
  {
    title: "Sales Leadership & Coaching",
    description:
      "Turn a floor of reps into a team of closers with coaching rhythms, honest call reviews, and forecasts you can trust.",
    level: "For leaders",
    lessons: 20,
    duration: "3h 45m",
    rating: 4.9,
    price: "$149",
    tags: ["Leadership", "Coaching"],
  },
];

/* Bundles, multi-course tracks shown as a distinct "Bundles" group under the grid. */
const bundles: Course[] = [
  {
    title: "Full-Funnel Outbound Bundle",
    description:
      "Cold calling, cold email, and discovery in one track, the complete outbound engine, from first touch to booked meeting.",
    level: "Bundle",
    lessons: 45,
    duration: "7h 45m",
    rating: 4.9,
    price: "$179",
    tags: ["Cold calling", "Cold email", "Discovery"],
  },
  {
    title: "All-Access Closer Pass",
    description:
      "Every course, every new drop, and the private community, the whole Closer library for one flat annual price.",
    level: "All-access",
    lessons: 120,
    duration: "20h+",
    rating: 5.0,
    price: "$399",
    tags: ["Every track", "Community"],
  },
];

/* "What's inside every course", contents framed as buyer benefits. */
const featureTabs: Tab[] = [
  {
    label: "Frameworks",
    badge: "Inside 01",
    heading: "Frameworks you can run on the next call",
    body: "Every lesson hands you a repeatable framework, not vague theory. Learn the exact steps, then apply them to your live pipeline the same afternoon.",
    bullets: [
      "Step-by-step plays for each stage of the deal",
      "Decision trees for the calls that go sideways",
      "Printable one-pagers to keep on your desk",
    ],
    ctaLabel: "Browse the catalog",
    ctaHref: "#catalog",
    mediaLabel: "Framework map",
  },
  {
    label: "Scripts",
    badge: "Inside 02",
    heading: "Copy-paste scripts and templates",
    body: "Steal the openers, emails, and objection responses that already work. Swap in your product, hit send, and skip the blank-page paralysis.",
    bullets: [
      "Cold-call openers and voicemail scripts",
      "Email and follow-up sequence templates",
      "Objection responses for the tough ones",
    ],
    mediaLabel: "Script library",
  },
  {
    label: "Teardowns",
    badge: "Inside 03",
    heading: "Real deal teardowns, start to finish",
    body: "Watch real calls broken down move by move, what worked, what didn't, and the one tweak that would have won the deal.",
    bullets: [
      "Annotated recordings of live calls",
      "Wins and losses reviewed side by side",
      "The single adjustment that flips the outcome",
    ],
    mediaLabel: "Call teardown",
  },
  {
    label: "Coaching",
    badge: "Inside 04",
    heading: "Community and live coaching",
    body: "You're never learning alone. Bring your real deals to monthly live sessions and a private community of reps trading what's working right now.",
    bullets: [
      "Monthly live coaching workshops",
      "A private community of working reps",
      "Feedback on your actual pitch and pipeline",
    ],
    mediaLabel: "Coaching room",
  },
];

/* "How it works", the four-step path from enrolled to closed. */
const steps: StepItem[] = [
  {
    title: "Pick your track",
    body: "Choose the course that matches the deal in front of you, or grab the All-Access Pass and unlock the whole library at once.",
  },
  {
    title: "Follow the playbook",
    body: "Work through short, on-demand lessons that each end with one clear action you can run on your very next call.",
  },
  {
    title: "Practice with the templates",
    body: "Steal the scripts, emails, and frameworks, then adapt them to your product and your buyer in minutes, not weeks.",
  },
  {
    title: "Book meetings, close deals",
    body: "Put the plays to work, bring your results to live coaching, and watch your pipeline and your quota follow.",
  },
];

/* Meet your coaches, original, fictional instructors (avatars, no photos). */
const instructors: Person[] = [
  {
    name: "Renata Alvarez",
    role: "Cold Calling Lead",
    bio: "Ex-enterprise SDR turned trainer, booked 400+ meetings a quarter and teaches the openers that survive the brush-off.",
    socials: [
      { platform: "linkedin", href: "#" },
      { platform: "youtube", href: "#" },
    ],
  },
  {
    name: "Malik Foster",
    role: "Discovery & Closing Coach",
    bio: "Former top-1% AE who closed eight figures by asking sharper questions than anyone on the call, now he shows you exactly how.",
    socials: [
      { platform: "linkedin", href: "#" },
      { platform: "twitter", href: "#" },
    ],
  },
  {
    name: "Simone Berg",
    role: "Sales Leadership Faculty",
    bio: "Built and coached quota-crushing teams from scratch, and specializes in turning brand-new hires into closers fast.",
    socials: [
      { platform: "linkedin", href: "#" },
      { platform: "website", href: "#" },
    ],
  },
];

/* Three plans, single course, the popular all-access pass, and a team plan. */
const pricingTiers: Tier[] = [
  {
    name: "Single Course",
    price: "$89",
    billingNote: "one-time",
    description:
      "Buy one course outright and own it for good, perfect when you have a specific gap to close.",
    features: [
      "Lifetime access to one course",
      "Every script & template for that track",
      "Certificate of completion",
      "14-day money-back guarantee",
    ],
    cta: "Buy a course",
    href: "#catalog",
  },
  {
    name: "Closer Pass",
    price: "$399",
    billingNote: "/ year",
    description:
      "Every course, every new drop, plus live coaching and the community. Our best value for individual reps.",
    features: [
      "All courses + every future release",
      "Monthly live coaching workshops",
      "Private community access",
      "New deal teardowns every month",
      "Priority coaching Q&A",
    ],
    cta: "Get the Closer Pass",
    href: "#catalog",
    highlighted: true,
    badge: "Most popular",
  },
  {
    name: "Team",
    price: "Custom",
    billingNote: "per seat, billed annually",
    description:
      "Roll Closer out across the whole floor with manager tools, guided onboarding, and centralized billing.",
    features: [
      "Everything in Closer Pass",
      "Manager dashboards & reporting",
      "Guided team onboarding",
      "Centralized billing & invoicing",
      "Dedicated success manager",
    ],
    cta: "Talk to sales",
  },
];

/* Wall of wins, original quotes from fictional reps citing a specific result. */
const testimonials: Testimonial[] = [
  {
    quote:
      "I booked three meetings the day after the cold-calling course. The opener alone paid for the whole thing.",
    name: "Jordan Pryce",
    role: "SDR",
    company: "Northwind",
    avatarColor: "blue",
  },
  {
    quote:
      "Discovery used to be small talk. Now it's where I win the deal. My close rate jumped in a single quarter.",
    name: "Aisha Rahman",
    role: "Account Executive",
    company: "Vantage",
    avatarColor: "coral",
  },
  {
    quote:
      "The negotiation track saved a deal procurement was about to gut. I held my price and kept the relationship.",
    name: "Ben Ortiz",
    role: "Enterprise AE",
    company: "Keystone",
    avatarColor: "ink",
  },
  {
    quote:
      "We put four new hires through the Closer Pass and they ramped in weeks, not months.",
    name: "Chloe Danforth",
    role: "Sales Manager",
    company: "Beacon",
    avatarColor: "yellow",
  },
  {
    quote:
      "Cold email finally clicked. Reply rates doubled the week I started sending the sequence templates as-is.",
    name: "Marco Silva",
    role: "SDR Lead",
    company: "Tidewater",
    avatarColor: "mint",
  },
  {
    quote:
      "The live coaching is the real unlock. Bringing a live deal and getting it torn apart is worth the price by itself.",
    name: "Priya Chandra",
    role: "Account Executive",
    company: "Lumina",
    avatarColor: "ink",
  },
];

/* Objection-handling FAQ, enrollment questions, short answers. */
const faqItems: FaqItem[] = [
  {
    q: "Are these courses right for me?",
    a: "If you sell, whether you're an SDR, AE, or sales leader, yes. Beginners get the fundamentals; experienced reps get the advanced plays and teardowns. Start with the track that matches the deal in front of you.",
  },
  {
    q: "Are the courses self-paced or live?",
    a: "Courses are on-demand video you can watch anytime, at your own speed. Closer Pass members also get live monthly coaching workshops on top.",
  },
  {
    q: "How long do I keep access?",
    a: "A single course is yours for life. The Closer Pass keeps everything unlocked, including new releases, for as long as your membership is active.",
  },
  {
    q: "Do you have team plans?",
    a: "Yes. The Team plan adds manager dashboards, guided onboarding, and centralized billing so you can roll Closer out across the whole floor.",
  },
  {
    q: "Is there a guarantee or refund?",
    a: "Every purchase is backed by a 14-day money-back guarantee. If it doesn't help you book more meetings, email us within two weeks for a full refund.",
  },
  {
    q: "Do I need experience to start?",
    a: "Not at all. The beginner tracks assume zero background and build from your very first dial or email, no jargon, no gatekeeping.",
  },
];

export default function CoursesPage() {
  return (
    <>
      <PageHero
        background="ink"
        align="left"
        badge="New negotiation course"
        eyebrow="The Closer Catalog"
        title="Every play to book meetings and close deals"
        subtitle="Step-by-step sales courses for SDRs, AEs, and sales leaders, the exact frameworks, scripts, and moves top reps use to fill pipeline and hit quota. Self-paced, with team plans available."
        cta={{ label: "Browse courses", href: "#catalog" }}
        secondaryCta={{ label: "Train your team", href: "#pricing" }}
      />

      <div id="catalog" className="scroll-mt-24">
        <CourseGrid
          background="paper"
          columns={3}
          eyebrow="The catalog"
          title="Pick your track. Start closing."
          intro="Short, practical programs you can finish in an afternoon and put to work on your very next call. Buy one at a time, grab a bundle, or unlock everything with the All-Access Pass."
          courses={courses}
          enrollLabel="Learn more"
          callout={{
            title: "Leading a sales team?",
            body: "Get every rep running the same plays. Team plans add manager dashboards, guided onboarding, and live group coaching.",
            cta: { label: "Train your team", href: "#pricing" },
            color: "ink",
          }}
          bundles={bundles}
          bundlesTitle="Bundles"
        />
      </div>

      <FeatureTabs
        background="blue"
        eyebrow="What's inside every course"
        title="More than videos, a system you'll actually run"
        tabs={featureTabs}
      />

      <Steps
        background="cream"
        eyebrow="How it works"
        title="From enrolled to closing in four steps"
        steps={steps}
      />

      <Instructors
        background="mint"
        media="avatar"
        columns={3}
        eyebrow="Meet your coaches"
        title="Learn from reps who've carried the number"
        people={instructors}
      />

      <div id="pricing" className="scroll-mt-24">
        <Pricing
          background="yellow"
          eyebrow="Plans"
          title="Pick the plan that closes with you"
          tiers={pricingTiers}
        />
      </div>

      <Testimonials
        background="ink"
        eyebrow="Wins from the floor"
        title="Reps who turned lessons into closed-won"
        testimonials={testimonials}
      />

      <Faq
        background="paper"
        eyebrow="Before you enroll"
        title="Questions reps ask us"
        items={faqItems}
      />

      <CtaBand
        background="coral"
        align="center"
        badge="New courses every month"
        title="Your next deal is one play away"
        subtitle="Pick a track, steal the scripts, and put the plays to work on your very next call, with a 14-day guarantee behind every course."
        primaryCta={{ label: "Browse courses", href: "#catalog" }}
        secondaryCta={{ label: "Train your team", href: "#pricing" }}
      />

      <NewsletterSignup
        variant="inline"
        background="blue"
        eyebrow="Not ready to enroll?"
        title="Get one sales play every week"
        subtitle="Free, actionable tactics for booking meetings and closing deals, straight to your inbox. No spam, unsubscribe anytime."
        buttonLabel="Get the plays"
      />
    </>
  );
}
