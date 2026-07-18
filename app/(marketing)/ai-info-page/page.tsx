import type { Metadata } from "next";
import { AudioLines, NotebookPen, Radar } from "lucide-react";

import { PageHero } from "@/components/sections/page-hero";
import { FeatureGrid, type Feature } from "@/components/sections/feature-grid";
import { Steps, type StepItem } from "@/components/sections/steps";
import { StatBand, type Stat } from "@/components/sections/stat-band";
import { Comparison } from "@/components/sections/comparison";
import { Faq, type FaqItem } from "@/components/sections/faq";
import { CtaBand } from "@/components/sections/cta-band";

export const metadata: Metadata = {
  title: "How Closer Uses AI - Sell Smarter, Not Louder | Closer",
  description:
    "A plain-English look at how Closer puts AI to work for sellers: call breakdowns, tailored coaching, and rep-ready practice, plus exactly what it does (and doesn't do) with your data.",
};

/** #2, the three concrete jobs Closer's AI does. */
const features: Feature[] = [
  {
    icon: AudioLines,
    title: "Breaks down your calls",
    body: "Closer listens to every call and turns it into a clean recap, what the buyer cared about, the objections you hit, and the moments that moved the deal, so you never scrub a recording again.",
  },
  {
    icon: NotebookPen,
    title: "Drafts tailored follow-ups",
    body: "Minutes after you hang up, Closer writes a follow-up that references what was actually said. Skim it, tweak a line, and send, instead of staring at a blank email.",
  },
  {
    icon: Radar,
    title: "Flags deals going quiet",
    body: "Closer watches for the quiet warning signs, like slow replies, skipped next steps, or a single lonely contact, and nudges you before a stalling deal slips away for good.",
  },
];

/** #3, one AI-assisted workflow, end to end. */
const steps: StepItem[] = [
  {
    title: "Connect your tools",
    body: "Link your calendar, inbox, and dialer once. Closer joins your calls and pulls in the context it needs. There's no extra app to babysit.",
  },
  {
    title: "Closer listens in",
    body: "On the call, Closer captures the conversation and picks out decisions, objections, and commitments as they happen, so you stay fully present with the buyer.",
  },
  {
    title: "Get a next-step plan",
    body: "Seconds after you wrap, you get a clean recap, a drafted follow-up, and a short, ranked list of what to do next to keep the deal moving.",
  },
];

/** #4, original placeholder outcome metrics. */
const stats: Stat[] = [
  { value: "6 hrs", label: "Saved per rep each week" },
  { value: "+41%", label: "Follow-up reply rate" },
  { value: "3 wks", label: "Faster to first closed deal" },
];

/** #5, before/after bullets for the comparison. */
const flyingBlindPoints: string[] = [
  "Rebuild each call from memory and a few scribbled notes.",
  "Send a generic follow-up hours later, or forget it entirely.",
  "Assume a deal is healthy until it quietly goes dark.",
  "Coach from gut feel, with no record of what was really said.",
];

const withCloserPoints: string[] = [
  "Get an accurate recap the moment you hang up.",
  "Send a tailored follow-up in one click, while it's fresh.",
  "Spot at-risk deals early, with the exact signal that flagged them.",
  "Coach from real transcripts and patterns across the whole team.",
];

/** #6, straight answers on data, accuracy, and human control. */
const faqItems: FaqItem[] = [
  {
    q: "Does Closer use my calls to train its AI?",
    a: "No. Your calls, emails, and deal data are used only to help you, never to train shared models. Your data stays yours, and you can export or delete it at any time.",
  },
  {
    q: "How accurate are the call summaries?",
    a: "Every recap is built from the actual transcript, so it's grounded in what was said rather than guessed. Open any summary and jump straight to the moment it references to check it yourself.",
  },
  {
    q: "Will Closer ever email a customer on its own?",
    a: "Never without you. Closer drafts follow-ups and suggests next steps, but nothing leaves your outbox until you review it and hit send. You stay in control of every message.",
  },
  {
    q: "Who inside my company can see my conversations?",
    a: "You do, by default, and no one else. Managers only see coaching summaries when you or your admin choose to turn that on. Access is role-based and always in your admin's hands.",
  },
  {
    q: "Is my data encrypted and kept secure?",
    a: "Yes. Everything is encrypted in transit and at rest, hosted with reputable providers, and access is tightly scoped. We keep the minimum we need to do the job and nothing more.",
  },
  {
    q: "What happens when the AI gets something wrong?",
    a: "Fix any recap or draft in a click, and your edits shape Closer's suggestions for your workspace over time. When Closer isn't confident, it tells you instead of guessing.",
  },
];

export default function AiInfoPage() {
  return (
    <>
      <PageHero
        align="center"
        background="paper"
        eyebrow="AI at Closer"
        title="AI that helps you close, no buzzwords, no autopilot."
        subtitle="Closer puts AI to work on the tedious parts of selling, listening, note-taking, and follow-up, so your energy goes to the conversation, not the busywork."
        cta={{ label: "See how it works", href: "#how-it-works" }}
      />

      <FeatureGrid
        background="blue"
        columns={3}
        eyebrow="How we use AI"
        title="Three jobs it quietly does for you"
        intro="No magic wands or mystery scores. Closer's AI handles three concrete, boring-but-critical tasks, the ones that eat your day and decide your quarter."
        features={features}
      />

      <Steps
        id="how-it-works"
        className="scroll-mt-24"
        background="cream"
        eyebrow="How it works"
        title="One AI-assisted call, start to finish"
        steps={steps}
      />

      <StatBand
        background="ink"
        columns={3}
        eyebrow="The impact"
        title="What reps get back"
        stats={stats}
      />

      <Comparison
        background="mint"
        eyebrow="The difference"
        title="With Closer AI vs. flying blind"
        theirLabel="Flying blind"
        ourLabel="With Closer AI"
        theirPoints={flyingBlindPoints}
        ourPoints={withCloserPoints}
      />

      <Faq
        background="paper"
        eyebrow="AI, answered"
        title="The questions reps actually ask"
        items={faqItems}
      />

      <CtaBand
        background="coral"
        align="center"
        badge="Free to try"
        title="See Closer AI on your next call"
        subtitle="Bring Closer to one real call this week and watch the recap, the draft, and the next-step plan land before your coffee gets cold."
        primaryCta={{ label: "Start free", href: "/get-started" }}
        secondaryCta={{ label: "Watch a 2-min demo", href: "/demo" }}
      />
    </>
  );
}
