import type { Metadata } from "next";
import {
  ClipboardCheck,
  Compass,
  FileText,
  Handshake,
  ListChecks,
  Mail,
  PhoneCall,
  Send,
  ShieldCheck,
  Target,
} from "@/components/ui/icons";

import { PageHero } from "@/components/sections/page-hero";
import { ResourceGrid, type Resource } from "@/components/sections/resource-grid";
import { FeatureGrid, type Feature } from "@/components/sections/feature-grid";
import { Steps, type StepItem } from "@/components/sections/steps";
import { Testimonials, type Testimonial } from "@/components/sections/testimonials";
import { NewsletterSignup } from "@/components/sections/newsletter-signup";
import { CtaBand } from "@/components/sections/cta-band";

export const metadata: Metadata = {
  // `absolute` bypasses the root layout's "%s · Closer" title template so this
  // self-contained, already-branded title renders exactly once as intended.
  title: {
    absolute: "Toolkit - Free Sales Scripts, Templates & Playbooks | Closer",
  },
  description:
    "Steal Closer's free library of cold-call scripts, discovery frameworks, and outreach templates. Battle-tested by top reps. Copy, customize, and close. New drops weekly.",
};

/** §2, the core "vault": most-downloaded, evergreen assets. */
const vaultResources: Resource[] = [
  {
    title: "Cold Call Opening Lines",
    type: "Script",
    icon: PhoneCall,
    href: "/toolkit/cold-call-opening-lines",
    cta: "Get it free",
    description:
      "Fifteen first-ten-second openers that earn you the right to keep talking, grouped by industry and buyer mood.",
  },
  {
    title: "Discovery Question Bank",
    type: "Framework",
    icon: Compass,
    href: "/toolkit/discovery-question-bank",
    description:
      "Sixty layered questions that move a call from surface symptoms to the budget-worthy problem hiding underneath.",
  },
  {
    title: "Objection Rebuttal Sheet",
    type: "One-pager",
    icon: ShieldCheck,
    href: "/toolkit/objection-rebuttal-sheet",
    cta: "Get it free",
    description:
      "Word-for-word answers to the eleven brush-offs you hear most, from 'just send me an email' to 'we're all set.'",
  },
  {
    title: "Multi-Touch Outreach Sequence",
    type: "Template",
    icon: Mail,
    href: "/toolkit/multi-touch-outreach-sequence",
    description:
      "A twelve-day mix of email, call, and social touches you can drop straight into your CRM and start running tomorrow.",
  },
  {
    title: "Negotiation Guardrails Checklist",
    type: "Checklist",
    icon: ListChecks,
    href: "/toolkit/negotiation-guardrails-checklist",
    description:
      "The concessions to protect, the trades to offer, and the walk-away line to hold before you ever open the pricing call.",
  },
  {
    title: "Deal Review Scorecard",
    type: "Spreadsheet",
    icon: ClipboardCheck,
    href: "/toolkit/deal-review-scorecard",
    description:
      "Grade any open opportunity across access, pain, and urgency so you know which deals deserve your Friday afternoon.",
  },
];

/** §4, freshest additions; the "New" badge rides the resource `type` slot. */
const freshResources: Resource[] = [
  {
    title: "Referral Ask Templates",
    type: "New",
    icon: Send,
    href: "/toolkit/referral-ask-templates",
    cta: "Get it free",
    description:
      "Five low-cringe ways to ask a happy customer for the intro that turns one closed win into three more.",
  },
  {
    title: "Renewal Save Playbook",
    type: "New",
    icon: ShieldCheck,
    href: "/toolkit/renewal-save-playbook",
    cta: "Get it free",
    description:
      "The pre-renewal check-in sequence that surfaces churn risk while there is still time on the clock to fix it.",
  },
  {
    title: "Champion Enablement Kit",
    type: "New",
    icon: FileText,
    href: "/toolkit/champion-enablement-kit",
    cta: "Get it free",
    description:
      "A one-page brief your internal champion can forward to the buying committee without editing a single word.",
  },
];

/** §3, browse by the moment a deal is stuck in. */
const categories: Feature[] = [
  {
    icon: Target,
    title: "Prospecting",
    body: "Fill the top of your funnel with a repeatable daily list of accounts that are genuinely worth a call.",
  },
  {
    icon: Compass,
    title: "Discovery",
    body: "Trade happy-ears for real qualification with frameworks that surface pain, budget, and timing fast.",
  },
  {
    icon: PhoneCall,
    title: "Cold calling",
    body: "Openers, voicemails, and gatekeeper turns that keep strangers on the line past the first breath.",
  },
  {
    icon: ShieldCheck,
    title: "Objection handling",
    body: "Calm, curious responses that turn 'not interested' into a reason to keep the conversation going.",
  },
  {
    icon: Handshake,
    title: "Negotiation",
    body: "Protect your price and your margin with trades you planned long before anyone said the number.",
  },
  {
    icon: Send,
    title: "Follow-up email",
    body: "Short, human notes that earn replies instead of vanishing into a busy prospect's crowded archive.",
  },
];

/** §5, the three-move flow from download to closed. */
const usageSteps: StepItem[] = [
  {
    title: "Grab the asset",
    body: "Pick the script, framework, or checklist that matches the exact moment your deal is stuck in right now.",
  },
  {
    title: "Make it yours",
    body: "Swap in your product, your buyer, and your voice so it sounds like you, not a template off the internet.",
  },
  {
    title: "Run it and close",
    body: "Take it into your next call or sequence, watch what lands, and keep the version that books the meeting.",
  },
];

/** §6, reps who grabbed a resource and put it to work (all fictional). */
const testimonials: Testimonial[] = [
  {
    quote:
      "The discovery question bank flipped my second call of the day. I finally heard the real problem instead of the polite version.",
    name: "Nadia Brooks",
    role: "SDR",
    company: "Northwind",
    avatarColor: "blue",
  },
  {
    quote:
      "I pasted the outreach sequence into our CRM on a Monday and had three meetings booked by Thursday. Zero edits.",
    name: "Elliot Vance",
    role: "Account Executive",
    company: "Parallel",
    avatarColor: "coral",
  },
  {
    quote:
      "Our new hires used to freeze on objections. Now they open the rebuttal sheet, breathe, and sound like veterans.",
    name: "Rosa Iglesias",
    role: "Sales Manager",
    company: "Keystone",
    avatarColor: "yellow",
  },
  {
    quote:
      "The negotiation checklist saved a deal I was about to give away. I held the line because I had already decided where it was.",
    name: "Marcus Tan",
    role: "Enterprise AE",
    company: "Silverline",
    avatarColor: "mint",
  },
  {
    quote:
      "I keep the cold-call openers taped to my monitor. Connect rates are up and I actually look forward to the phone now.",
    name: "Priya Menon",
    role: "BDR",
    company: "Cadence Labs",
    avatarColor: "blue",
  },
  {
    quote:
      "We onboarded the whole team off this toolkit before we ever paid for training. It quietly became our playbook.",
    name: "Devon Clarke",
    role: "VP of Sales",
    company: "Harborview",
    avatarColor: "coral",
  },
];

export default function ToolkitPage() {
  return (
    <>
      {/* §1 PageHero, cream */}
      <PageHero
        align="left"
        background="cream"
        eyebrow="Free downloads"
        title="The Closer Toolkit"
        subtitle="A free, growing shelf of cold-call scripts, discovery frameworks, and outreach templates, battle-tested by working reps and ready to paste into your very next conversation."
        cta={{ label: "Browse the vault", href: "#vault" }}
        secondaryCta={{ label: "Get the weekly drop", href: "#newsletter" }}
      />

      {/* §2 ResourceGrid (core library), blue */}
      <ResourceGrid
        id="vault"
        className="scroll-mt-24"
        background="blue"
        columns={3}
        eyebrow="The vault"
        title="Every play, free to steal"
        intro="The assets our team reaches for most, no ten-field form, no trial, no catch. Download one, plug in your details, and put it to work today."
        resources={vaultResources}
        filterable
        searchable
      />

      {/* §3 FeatureGrid (browse by category), paper */}
      <FeatureGrid
        background="paper"
        columns={3}
        eyebrow="Find your play"
        title="Browse by where you're stuck"
        intro="Every deal stalls somewhere different. Jump straight to the part of the motion that's costing you meetings this week."
        features={categories}
      />

      {/* §4 ResourceGrid (fresh drops), mint */}
      <ResourceGrid
        background="mint"
        columns={3}
        eyebrow="New this week"
        title="Fresh off the sales floor"
        intro="The newest additions to the vault, shipped straight from calls our reps ran this week. Grab them before everyone else does."
        resources={freshResources}
      />

      {/* §5 Steps (how to use), cream */}
      <Steps
        background="cream"
        eyebrow="Put it to work"
        title="From download to closed in three moves"
        steps={usageSteps}
      />

      {/* §6 Testimonials, ink */}
      <Testimonials
        background="ink"
        eyebrow="Wall of wins"
        title="Reps who grabbed one and ran"
        testimonials={testimonials}
      />

      {/* §7 NewsletterSignup (drops gate), yellow */}
      <NewsletterSignup
        id="newsletter"
        className="scroll-mt-24"
        variant="inline"
        background="yellow"
        eyebrow="Never miss a drop"
        title="Get every new drop first"
        subtitle="New scripts, templates, and checklists land in the vault most weeks. Drop your email and we'll send each one the day it goes live, no spam, unsubscribe anytime."
        buttonLabel="Send me the drops"
      />

      {/* §8 CtaBand, coral */}
      <CtaBand
        background="coral"
        align="center"
        badge="Toolkit stays free"
        title="Want more than templates?"
        subtitle="The toolkit gets you moving. Closer's courses and live coaching turn these plays into habits your whole team runs on autopilot."
        primaryCta={{ label: "Explore the courses", href: "/courses" }}
        secondaryCta={{ label: "Get the weekly drop", href: "#newsletter" }}
      />
    </>
  );
}
