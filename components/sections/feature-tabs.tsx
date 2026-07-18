"use client";

import { Tabs } from "@base-ui-components/react/tabs";
import {
  ArrowRight,
  Check,
  Handshake,
  MessageSquare,
  Target,
  Trophy,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Heading } from "@/components/ui/heading";
import { Placeholder } from "@/components/ui/placeholder";
import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/quiz/reveal";

/** Allowed section color blocks, derived from the shared `<Section>` primitive. */
type SectionBackground = NonNullable<React.ComponentProps<typeof Section>["background"]>;
/** Placeholder fill colors, derived from the shared `<Placeholder>` primitive. */
type PlaceholderColor = NonNullable<React.ComponentProps<typeof Placeholder>["color"]>;

/** A single feature tab: one pill in the list + its split-layout panel. */
export interface Tab {
  /** Short label shown on the pill tab (kept 1-2 words so the row stays tidy). */
  label: string;
  /** Optional lucide icon rendered inside the pill, left of the label. */
  icon?: LucideIcon;
  /** Optional small badge shown above the panel sub-heading. */
  badge?: string;
  /** Panel sub-heading (rendered in Anton). */
  heading: string;
  /** Supporting paragraph beneath the sub-heading. */
  body: string;
  /** Feature bullets, each prefixed with a Check icon. Omit to hide the list. */
  bullets?: string[];
  /** Optional CTA label; renders a `<Button>` when set. */
  ctaLabel?: string;
  /** CTA destination. Defaults to `"#"` (placeholder). */
  ctaHref?: string;
  /** Override the media placeholder color. Defaults to a rotating accent. */
  mediaColor?: PlaceholderColor;
  /** Label shown inside the media placeholder. Defaults to the tab label. */
  mediaLabel?: string;
}

export interface FeatureTabsProps {
  /** Small uppercase tracked label above the title. */
  eyebrow?: string;
  /** Anton display headline for the section. */
  title?: string;
  /** 3-4 tabs render best. Falls back to a sensible default set. */
  tabs?: Tab[];
  /** Full-bleed color block behind the section. */
  background?: SectionBackground;
  /** Fade + rise the inner content on scroll; disable to render statically. */
  revealContent?: boolean;
  /** Optional anchor id (e.g. for a "#playbook" nav link). */
  id?: string;
  className?: string;
}

/** Bright accents rotated per tab so each panel's media reads distinctly. */
const ACCENTS = ["yellow", "coral", "blue", "mint"] as const;
type Accent = (typeof ACCENTS)[number];

/** Static bg classes for the bullet check chips (Tailwind can't see dynamic names). */
const ACCENT_BG: Record<Accent, string> = {
  yellow: "bg-yellow",
  coral: "bg-coral",
  blue: "bg-blue",
  mint: "bg-mint",
};

const DEFAULT_TABS: Tab[] = [
  {
    label: "Prospect",
    icon: Target,
    badge: "Playbook 01",
    heading: "Build a pipeline that never runs dry",
    body: "Stop spraying and praying. Pick the accounts most likely to buy and open them with a message that actually earns a reply.",
    bullets: [
      "Score and prioritize your target account list",
      "Write cold openers that get replies, not left on read",
      "Book meetings with a repeatable multi-touch cadence",
    ],
    ctaLabel: "See the prospecting play",
    mediaLabel: "Prospecting play",
  },
  {
    label: "Discover",
    icon: MessageSquare,
    badge: "Playbook 02",
    heading: "Run discovery that closes itself",
    body: "Deals are won in discovery. Ask the questions that surface real pain and let your prospect talk their way straight to the value.",
    bullets: [
      "Uncover the pain behind the surface-level ask",
      "Quantify impact so urgency builds itself",
      "Earn the next step before the call ends",
    ],
    ctaLabel: "Watch a live discovery call",
    mediaLabel: "Discovery call",
  },
  {
    label: "Negotiate",
    icon: Handshake,
    badge: "Playbook 03",
    heading: "Hold your price without the sweat",
    body: "Discounting is a habit, not a strategy. Walk into every negotiation with a plan that protects margin and keeps the deal moving.",
    bullets: [
      "Trade concessions instead of giving them away",
      "Defuse the reflexive 'just send me a discount'",
      "Keep control when procurement enters the room",
    ],
    ctaLabel: "Grab the negotiation script",
    mediaLabel: "Negotiation script",
  },
  {
    label: "Close",
    icon: Trophy,
    badge: "Playbook 04",
    heading: "Turn momentum into signatures",
    body: "The close should feel inevitable, not awkward. Build a mutual plan that removes surprises and gets the contract signed on time.",
    bullets: [
      "Map every stakeholder to the decision",
      "Run a mutual action plan that actually sticks",
      "Ask for the business without the flinch",
    ],
    ctaLabel: "Steal the closing checklist",
    mediaLabel: "Closing checklist",
  },
];

/**
 * Feature showcase driven by an accessible Base UI tab set. An eyebrow + Anton
 * headline sit above a horizontal row of bordered pill tabs (the selected pill
 * fills solid `ink` with a hard offset shadow). Each panel is a split layout:
 * copy + a Check bullet list on the left, a `<Placeholder>` media block in a
 * rotating accent on the right. The tab row scrolls horizontally on mobile and
 * wraps/centers on desktop; panels stack. Renders complete with zero props and
 * accepts typed overrides for copy, tabs, and color.
 */
export function FeatureTabs({
  eyebrow = "The Closer method",
  title = "Master every moment of the deal",
  tabs = DEFAULT_TABS,
  background = "cream",
  revealContent = true,
  id,
  className,
}: FeatureTabsProps = {}) {
  if (tabs.length === 0) return null;

  return (
    <Section background={background} id={id} className={className}>
      <Reveal stagger enabled={revealContent} className="mx-auto max-w-2xl text-center">
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        {title ? (
          <Heading as={2} size="xl" className={cn(eyebrow && "mt-3")}>
            {title}
          </Heading>
        ) : null}
      </Reveal>

      <Reveal enabled={revealContent} className="mt-10 md:mt-12">
      <Tabs.Root defaultValue={0}>
        <Tabs.List
          aria-label={title ?? "Feature tabs"}
          className="flex snap-x gap-3 overflow-x-auto pb-3 [scrollbar-width:none] md:flex-wrap md:justify-center [&::-webkit-scrollbar]:hidden"
        >
          {tabs.map((tab, i) => {
            const Icon = tab.icon;
            return (
              <Tabs.Tab
                key={`${tab.label}-${i}`}
                value={i}
                className={cn(
                  "press inline-flex shrink-0 snap-start cursor-pointer items-center gap-2 whitespace-nowrap rounded-full border-[2.5px] border-ink bg-paper px-5 py-2.5 font-sans text-sm font-bold uppercase tracking-wide text-ink shadow-hard-xs",
                  "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ink",
                  "data-[active]:bg-ink data-[active]:text-paper data-[active]:shadow-hard-sm data-[active]:focus-visible:ring-paper",
                  "motion-reduce:transition-none",
                )}
              >
                {Icon ? <Icon className="size-4" strokeWidth={2.5} aria-hidden /> : null}
                {tab.label}
              </Tabs.Tab>
            );
          })}
        </Tabs.List>

        {tabs.map((tab, i) => {
          const rotate: Accent = ACCENTS[i % ACCENTS.length];
          const media: PlaceholderColor = tab.mediaColor ?? rotate;
          return (
            <Tabs.Panel
              key={`${tab.label}-panel-${i}`}
              value={i}
              className="mt-8 md:mt-12"
            >
              <div className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
                <div>
                  {tab.badge ? (
                    <Badge color="yellow" shadow="hard">
                      {tab.badge}
                    </Badge>
                  ) : null}
                  <Heading as={3} size="md" className={cn(tab.badge && "mt-4")}>
                    {tab.heading}
                  </Heading>
                  <p className="mt-4 max-w-prose text-lg font-medium leading-relaxed opacity-80">
                    {tab.body}
                  </p>

                  {tab.bullets && tab.bullets.length > 0 ? (
                    <ul className="mt-6 space-y-3">
                      {tab.bullets.map((bullet, bi) => (
                        <li key={`${bullet}-${bi}`} className="flex items-start gap-3">
                          <span
                            aria-hidden
                            className={cn(
                              "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border-[2.5px] border-ink text-ink",
                              ACCENT_BG[rotate],
                            )}
                          >
                            <Check className="size-3.5" strokeWidth={3} />
                          </span>
                          <span className="text-base font-medium leading-snug">
                            {bullet}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {tab.ctaLabel ? (
                    <div className="mt-8">
                      <Button href={tab.ctaHref ?? "#"} variant="ink" size="md">
                        {tab.ctaLabel}
                        <ArrowRight className="size-4" strokeWidth={2.5} aria-hidden />
                      </Button>
                    </div>
                  ) : null}
                </div>

                <div className="md:pl-2">
                  <Placeholder
                    aspect="4/3"
                    color={media}
                    label={tab.mediaLabel ?? tab.label}
                    className="shadow-hard"
                  />
                </div>
              </div>
            </Tabs.Panel>
          );
        })}
      </Tabs.Root>
      </Reveal>
    </Section>
  );
}
