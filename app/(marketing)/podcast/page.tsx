import type { Metadata } from "next";

import { PageHero } from "@/components/sections/page-hero";
import { PodcastList, type Episode, type PlatformLink } from "@/components/sections/podcast";
import { LogoCloud } from "@/components/sections/logo-cloud";
import { StatBand, type Stat } from "@/components/sections/stat-band";
import { Testimonials, type Testimonial } from "@/components/sections/testimonials";
import { NewsletterSignup } from "@/components/sections/newsletter-signup";
import { CtaBand } from "@/components/sections/cta-band";

export const metadata: Metadata = {
  title: "The Closer Podcast - sales tactics for your next call",
  description:
    "Short, practical sales episodes from working reps. Steal cold-call openers, discovery questions, and closing plays, then follow along on Spotify, Apple Podcasts, or YouTube.",
};

/* Latest episode leads the featured card; the rest fill the recent list. */
const episodes: Episode[] = [
  {
    number: 62,
    title: "The opener that buys you 30 more seconds",
    description:
      "A nine-word cold-call intro that lowers the hang-up reflex and earns you the rest of the conversation, no gimmicky pattern-interrupt required.",
    duration: "31 min",
    date: "Jul 14, 2026",
    accent: "blue",
  },
  {
    number: 61,
    title: "When they say 'just send me something'",
    description:
      "Turn the polite brush-off into a booked calendar invite with one honest question instead of another attachment nobody opens.",
    duration: "26 min",
    date: "Jul 7, 2026",
    accent: "coral",
  },
  {
    number: 60,
    title: "Discovery questions that find the money",
    description:
      "Trade feature-dumping for questions that surface real budget, so you only chase the deals that can actually sign this quarter.",
    duration: "38 min",
    date: "Jun 30, 2026",
    accent: "yellow",
  },
  {
    number: 59,
    title: "Sell wide before the deal goes quiet",
    description:
      "How to earn a second and third contact inside the account before your champion goes dark and takes the whole quarter with them.",
    duration: "34 min",
    date: "Jun 23, 2026",
    accent: "mint",
  },
  {
    number: 58,
    title: "Follow-ups that don't sound desperate",
    description:
      "A four-line reply that wakes up a stalled thread without a single 'just circling back', and gives the buyer an easy reason to respond.",
    duration: "22 min",
    date: "Jun 16, 2026",
    accent: "blue",
  },
  {
    number: 57,
    title: "Hold your price without the standoff",
    description:
      "Swap reflex discounts for smart trades and protect your margin while the buyer still walks away feeling like they won.",
    duration: "35 min",
    date: "Jun 9, 2026",
    accent: "coral",
  },
];

const platforms: PlatformLink[] = [
  { label: "Spotify", href: "#" },
  { label: "Apple Podcasts", href: "#" },
  { label: "YouTube", href: "#" },
];

const listenOn: string[] = [
  "Spotify",
  "Apple Podcasts",
  "YouTube",
  "Overcast",
  "Pocket Casts",
  "Amazon Music",
];

const stats: Stat[] = [
  { value: "3.4M+", label: "Downloads to date" },
  { value: "62", label: "Episodes published" },
  { value: "29 min", label: "Avg. episode length" },
  { value: "4.9/5", label: "Listener rating" },
];

const testimonials: Testimonial[] = [
  {
    quote:
      "I ran the Tuesday cold-call opener on my next block of dials and booked three meetings before lunch. Nothing else about my list changed.",
    name: "Renée Okafor",
    role: "SDR",
    company: "Northwind",
    avatarColor: "blue",
  },
  {
    quote:
      "Played the 'just send me something' episode for the whole team on Monday. Our reply-to-booked rate climbed by the end of the week.",
    name: "Caleb Moreno",
    role: "Sales Manager",
    company: "Driftwood",
    avatarColor: "coral",
  },
  {
    quote:
      "The discovery-to-budget question is now the only one I really care about on a first call. It saved me a quarter of wasted demos.",
    name: "Aisha Farrell",
    role: "Account Executive",
    company: "Keystone",
    avatarColor: "ink",
  },
  {
    quote:
      "Multi-threading used to feel pushy. This episode handed me the exact words, and my champion stopped being a single point of failure.",
    name: "Diego Santos",
    role: "Enterprise AE",
    company: "Meridian",
    avatarColor: "yellow",
  },
  {
    quote:
      "My follow-ups finally get replies instead of silence. I deleted 'just checking in' from my vocabulary and never looked back.",
    name: "Hannah Pike",
    role: "BDR",
    company: "Cedarline",
    avatarColor: "ink",
  },
  {
    quote:
      "The negotiation episode paid for my whole year. I held price on a deal I would have discounted on pure instinct.",
    name: "Marco Vitale",
    role: "Founder",
    company: "Tidewell",
    avatarColor: "mint",
  },
];

const subscribeBenefits: string[] = [
  "A 2-minute episode recap",
  "The companion one-pager",
  "Copy-paste scripts & questions",
];

export default function PodcastPage() {
  return (
    <>
      <PageHero
        background="blue"
        align="center"
        eyebrow="The Closer Podcast"
        title="Sales plays you can steal on the drive to work"
        subtitle="Short, tactical episodes from reps who still carry a bag, real openers, objection flips, and closing moves you can run before your coffee gets cold."
        cta={{ label: "Start listening", href: "#latest" }}
      />

      <PodcastList
        id="latest"
        className="scroll-mt-24"
        background="cream"
        featured
        eyebrow="New episodes every Tuesday"
        title="Tactics for your very next call"
        description="Working reps break down the exact play behind a real win, short enough to finish before your next dial, specific enough to use on it."
        episodes={episodes}
        platforms={platforms}
      />

      <LogoCloud
        background="paper"
        variant="grid"
        label="Where to listen"
        companies={listenOn}
      />

      <StatBand
        background="ink"
        eyebrow="The show by the numbers"
        title="Proof it's worth the commute"
        stats={stats}
      />

      <Testimonials
        background="mint"
        eyebrow="Listener love"
        title="Reps who ran the play"
        testimonials={testimonials}
      />

      <NewsletterSignup
        id="subscribe"
        variant="hero"
        background="blue"
        eyebrow="Never miss a drop"
        title="Get every new episode in your inbox"
        subtitle="Each Tuesday we send a two-minute recap of the new episode plus the companion one-pager, the scripts, questions, and next steps, ready to paste into your sequence."
        benefits={subscribeBenefits}
        showSocialProof
        socialProofLabel="Join 40k+ reps who listen on the drive in."
      />

      <CtaBand
        background="coral"
        align="center"
        badge="New episode every Tuesday"
        title="Hit follow and never miss a play"
        subtitle="A fresh tactical episode drops every Tuesday morning. Follow The Closer Podcast on your platform of choice and walk into your next call with a new move."
        primaryCta={{ label: "Follow the show", href: "#latest" }}
        secondaryCta={{ label: "Browse all episodes", href: "#latest" }}
      />
    </>
  );
}
