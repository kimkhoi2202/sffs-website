import type { Metadata } from "next";
import {
  ClipboardList,
  Clock,
  Flame,
  MessageSquare,
  PhoneCall,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";

import { NewsletterSignup } from "@/components/sections/newsletter-signup";
import { StatBand, type Stat } from "@/components/sections/stat-band";
import { LogoCloud } from "@/components/sections/logo-cloud";
import { FeatureGrid, type Feature } from "@/components/sections/feature-grid";
import { Testimonials, type Testimonial } from "@/components/sections/testimonials";
import { Bento, type BentoTile } from "@/components/sections/bento";
import { Faq, type FaqItem } from "@/components/sections/faq";
import { CtaBand } from "@/components/sections/cta-band";

export const metadata: Metadata = {
  title: "Closer - Weekly Sales Plays, in 5 Minutes | Free Newsletter",
  description:
    "One field-tested sales play in your inbox every Thursday, cold calls, discovery, and closing tactics you can run in your next meeting. Free forever, unsubscribe anytime.",
};

/* Hero email-capture bullets, the three-second pitch for subscribing. */
const heroBenefits: string[] = [
  "One play you can run today",
  "A five-minute read, start to finish",
  "Real scripts from working reps",
];

/* Round, plausible placeholder metrics for Closer (not real figures). */
const stats: Stat[] = [
  { value: "40,000+", label: "Subscribers and counting" },
  { value: "61%", label: "Average weekly open rate" },
  { value: "4 yrs", label: "Every Thursday, no misses" },
];

/* Fictional company wordmarks, generic placeholders, never real brands. */
const companies: string[] = [
  "NORTHWIND",
  "BRIGHTLINE",
  "CADENCE",
  "HELIX",
  "MERIDIAN",
  "VANTAGE",
  "OUTPACE",
  "KEYSTONE",
  "SUMMIT CRM",
  "DRIFTWOOD",
];

/* "What you get", three subscriber benefits, each with a lucide icon. */
const benefits: Feature[] = [
  {
    icon: Zap,
    title: "One play per issue",
    body: "Every Thursday you get a single, specific move, a cold open, a discovery question, or a closing line, ready to run as-is on your next call.",
    accent: "yellow",
  },
  {
    icon: ClipboardList,
    title: "Copy-paste scripts",
    body: "Steal the exact wording. Every play ships with the lines to say and the follow-up to send, so you never stare at a blank screen again.",
    accent: "coral",
  },
  {
    icon: Clock,
    title: "Five-minute reads",
    body: "Skimmable, jargon-free, and done before your coffee cools. Learn the move, close the tab, go book the meeting.",
    accent: "blue",
  },
];

/* Original subscriber quotes, fictional reps, each with a specific outcome. */
const testimonials: Testimonial[] = [
  {
    quote:
      "Ran Thursday's cold open on Friday and booked two meetings before lunch. I've never replied to a newsletter before. I replied to that one.",
    name: "Maya Ellison",
    role: "SDR",
    company: "Northwind",
    avatarColor: "blue",
  },
  {
    quote:
      "The discovery question from last week got a VP to admit their real budget on the first call. That deal closed on Tuesday.",
    name: "Devon Pratt",
    role: "Account Executive",
    company: "Brightline",
    avatarColor: "coral",
  },
  {
    quote:
      "I forward it to my whole team every Thursday. Five minutes, one play, it's the only sales email nobody on the floor deletes.",
    name: "Priya Raman",
    role: "Sales Manager",
    company: "Cadence",
    avatarColor: "ink",
  },
  {
    quote:
      "The objection reframe turned a flat 'we're all set' into a signed contract. I re-read that issue three times to be sure it was that simple.",
    name: "Marcus Boyd",
    role: "Enterprise AE",
    company: "Helix",
    avatarColor: "yellow",
  },
  {
    quote:
      "Finally a newsletter that respects my time. One play, one script, done, and my connect rate is climbing without any extra effort.",
    name: "Sofia Nunez",
    role: "SDR",
    company: "Meridian",
    avatarColor: "mint",
  },
  {
    quote:
      "I've bought four-figure courses that taught me less than this free email does in a month. I signed up both new hires on day one.",
    name: "Theo Marsh",
    role: "Founder",
    company: "Outpace",
    avatarColor: "ink",
  },
];

/* Sample-issue archive: mixed-size bento tiles, each an original past issue. */
const sampleIssues: BentoTile[] = [
  {
    type: "feature",
    color: "blue",
    colSpan: 2,
    rowSpan: 2,
    icon: Flame,
    title: "The 9-word cold open",
    body: "Our most-forwarded issue: the opening line that quiets the hang-up reflex and buys you thirty real seconds. Reps still email us about this one.",
  },
  {
    type: "feature",
    color: "yellow",
    icon: PhoneCall,
    title: "The callback voicemail",
    body: "A 15-second message that earns more callbacks than a live dial.",
  },
  {
    type: "feature",
    color: "mint",
    icon: Target,
    title: "The budget-finder question",
    body: "One line in discovery that surfaces real spend by minute two.",
  },
  {
    type: "feature",
    color: "coral",
    icon: MessageSquare,
    title: "\u201CWe're already covered\u201D",
    body: "Reframe the brush-off into a real conversation without pushing.",
  },
  {
    type: "feature",
    color: "paper",
    icon: TrendingUp,
    title: "The three-touch close",
    body: "The follow-up rhythm that turns a warm \u201Cmaybe\u201D into a yes.",
  },
  {
    type: "quote",
    color: "ink",
    colSpan: 2,
    quote: "The cold open alone booked me three meetings this week.",
    author: "Riley Okafor",
    role: "SDR",
  },
  {
    type: "stat",
    color: "paper",
    colSpan: 2,
    icon: Clock,
    value: "5 min",
    label: "The whole issue, start to finish",
  },
];

/* Objection-handling FAQ, one to two sentences each. */
const faqItems: FaqItem[] = [
  {
    q: "How much does it cost?",
    a: "Nothing. Closer is free forever, no trial, no credit card, and no upsell buried in the footer.",
  },
  {
    q: "How often will you email me?",
    a: "Once a week. One play lands every Thursday morning, and that's the only thing we'll ever send you.",
  },
  {
    q: "Will you spam me or sell my email?",
    a: "Never. Your address stays with us, you get a single email a week, and unsubscribing takes one click.",
  },
  {
    q: "Who is this actually for?",
    a: "Working reps, AEs, and SDRs who sell for a living. If you're on calls trying to book and close, every issue is built for you.",
  },
  {
    q: "Do I need any experience?",
    a: "No. Each play stands on its own with the exact words to use, so day-one SDRs and seasoned closers both get something to run.",
  },
  {
    q: "What if it's not useful?",
    a: "Unsubscribe anytime, there's a one-click link at the bottom of every issue. No hard feelings and no exit survey.",
  },
];

export default function NewsletterPage() {
  return (
    <>
      <NewsletterSignup
        id="signup"
        className="scroll-mt-24"
        headingLevel={1}
        variant="hero"
        background="blue"
        eyebrow="Free weekly newsletter"
        title="Steal a sales play every Thursday"
        subtitle="A five-minute read for reps, AEs, and SDRs, one field-tested play you can run on your very next call. No theory, no filler, no pitch."
        buttonLabel="Get the newsletter"
        benefits={heroBenefits}
        showSocialProof
        socialProofLabel="Join 40,000+ sellers who read it Thursday morning."
        successMessage="You're in, see you Thursday."
      />

      <StatBand
        background="ink"
        eyebrow="By the numbers"
        title="Read by sellers who hit quota"
        stats={stats}
      />

      <LogoCloud
        background="cream"
        variant="marquee"
        label="Read by sellers at teams you know"
        companies={companies}
      />

      <FeatureGrid
        background="mint"
        columns={3}
        eyebrow="What you get"
        title="Everything in one short email"
        intro="No 40-minute videos and no homework, just one tactical play you can put to work before your next call, plus the exact words to use."
        features={benefits}
      />

      <Testimonials
        background="paper"
        eyebrow="Subscribers"
        title="Reps run these plays and win"
        testimonials={testimonials}
      />

      <Bento
        id="sample-issues"
        className="scroll-mt-24"
        background="yellow"
        eyebrow="From the archive"
        title="See a few plays before you subscribe"
        description="A peek at recent Thursday issues. Every one is a single move you could run on your next call, this is the quality that shows up in your inbox."
        items={sampleIssues}
      />

      <Faq
        background="cream"
        eyebrow="Before you subscribe"
        title="The quick questions"
        items={faqItems}
      />

      <CtaBand
        background="coral"
        align="center"
        badge="Free forever"
        title="Your next call could use a better play"
        subtitle="Join 40,000+ sellers who get one field-tested move every Thursday. Free forever, five minutes to read, and one click to leave whenever you like."
        primaryCta={{ label: "Get the newsletter", href: "#signup" }}
        secondaryCta={{ label: "Browse sample issues", href: "#sample-issues" }}
      />
    </>
  );
}
