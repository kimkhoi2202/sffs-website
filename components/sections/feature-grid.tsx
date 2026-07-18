import {
  MessageSquare,
  PhoneCall,
  Target,
  TrendingUp,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Heading } from "@/components/ui/heading";
import { Placeholder } from "@/components/ui/placeholder";
import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/quiz/reveal";
import { cn } from "@/lib/utils";

/** Bright accent used for a feature's icon tile. Rotates when omitted. */
export type FeatureAccent = "blue" | "mint" | "coral" | "yellow";

/** Full-bleed section background (mirrors the `Section` primitive's options). */
export type FeatureGridBackground =
  | "paper"
  | "cream"
  | "ink"
  | "blue"
  | "mint"
  | "coral"
  | "yellow"
  | "gray";

export interface Feature {
  /** A `lucide-react` icon component, e.g. `PhoneCall`. */
  icon: LucideIcon;
  title: string;
  body: string;
  /** Overrides the rotating icon-tile accent color. */
  accent?: FeatureAccent;
  /**
   * Optional media caption. When set, a bordered 16/9 `<Placeholder>` (in the
   * card's accent color) renders at the top of the card, above the icon tile.
   * Omit to keep the plain icon-led card.
   */
  mediaLabel?: string;
  /**
   * Optional short label rendered as an on-brand accent `<Badge>` beside the
   * icon tile. Omit to render no badge.
   */
  badge?: string;
}

export interface FeatureGridProps {
  eyebrow?: string;
  title?: string;
  /** Optional lead paragraph shown under the heading. */
  intro?: string;
  /** Widest column count: 2 or 3 (mobile is always 1). */
  columns?: 2 | 3;
  features?: Feature[];
  background?: FeatureGridBackground;
  /** Fade + rise the inner content on scroll while the section bg stays static. */
  revealContent?: boolean;
  className?: string;
  id?: string;
}

const accentBg: Record<FeatureAccent, string> = {
  blue: "bg-blue",
  mint: "bg-mint",
  coral: "bg-coral",
  yellow: "bg-yellow",
};

const accentRotation: readonly FeatureAccent[] = [
  "blue",
  "mint",
  "coral",
  "yellow",
];

const columnClass: Record<2 | 3, string> = {
  2: "md:grid-cols-2",
  3: "md:grid-cols-2 lg:grid-cols-3",
};

const defaultFeatures: Feature[] = [
  {
    icon: PhoneCall,
    title: "Openers that land",
    body: "Start every cold call with a pattern interrupt that earns you the next thirty seconds, no awkward scripts required.",
  },
  {
    icon: Target,
    title: "Know your buyer cold",
    body: "Build a razor-sharp ideal customer profile so your energy goes only toward the deals genuinely worth closing.",
  },
  {
    icon: MessageSquare,
    title: "Handle any objection",
    body: "Turn “just send me an email” and “we're all set” into real, qualified conversations that keep moving forward.",
  },
  {
    icon: TrendingUp,
    title: "Pipeline that compounds",
    body: "Install a daily prospecting rhythm that keeps your funnel full and ends the feast-or-famine rollercoaster for good.",
  },
  {
    icon: Users,
    title: "Multi-thread the deal",
    body: "Win the whole buying committee instead of a single champion, and de-risk every close before it reaches the finish line.",
  },
  {
    icon: Zap,
    title: "Shorten the cycle",
    body: "Create urgency the honest way and guide buyers toward a confident yes, in weeks, not quarters.",
  },
];

/**
 * A color-blocked section that pairs an eyebrow + heading (+ optional intro)
 * with a responsive grid of feature cards. Each card leads with a bordered,
 * hard-shadowed icon tile whose accent color rotates blue → mint → coral →
 * yellow unless a `Feature.accent` is set. A `Feature` may optionally add a
 * top 16/9 `<Placeholder>` (`mediaLabel`) and/or an accent `<Badge>` (`badge`);
 * with neither set, the card is the same icon + title + body card as before.
 * Renders fully with no props.
 */
export function FeatureGrid({
  eyebrow = "The Closer method",
  title = "Sell like the top one percent",
  intro = "Practical, repeatable sales skills you can put to work on your very next call. No fluff, no theory, just the plays that reliably move deals forward.",
  columns = 3,
  features = defaultFeatures,
  background = "cream",
  revealContent = true,
  className,
  id,
}: FeatureGridProps = {}) {
  return (
    <Section background={background} padding="lg" className={className} id={id}>
      {(eyebrow || title || intro) && (
        <Reveal stagger enabled={revealContent} className="max-w-prose">
          {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
          {title && (
            <Heading as={2} size="lg" className={cn(eyebrow && "mt-3")}>
              {title}
            </Heading>
          )}
          {intro && <p className="mt-4 text-lg leading-relaxed">{intro}</p>}
        </Reveal>
      )}

      {features.length > 0 && (
        <Reveal
          as="ul"
          stagger
          enabled={revealContent}
          className={cn(
            "mt-10 grid list-none grid-cols-1 gap-6 md:mt-14 md:gap-8",
            columnClass[columns],
          )}
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const accent =
              feature.accent ?? accentRotation[index % accentRotation.length];
            const iconTile = (
              <span
                className={cn(
                  "inline-flex size-12 items-center justify-center rounded-xl border-[2.5px] border-ink shadow-hard-sm",
                  accentBg[accent],
                )}
              >
                <Icon className="size-6" strokeWidth={2.5} aria-hidden="true" />
              </span>
            );
            return (
              <li key={`${feature.title}-${index}`} className="h-full">
                <Card color="paper" shadow="md" padding="lg" className="h-full card-hover">
                  {feature.mediaLabel ? (
                    <Placeholder
                      aspect="16/9"
                      color={accent}
                      label={feature.mediaLabel}
                      className="mb-5"
                    />
                  ) : null}
                  {feature.badge ? (
                    <div className="flex items-start justify-between gap-3">
                      {iconTile}
                      <Badge color={accent} size="sm" shadow="hard">
                        {feature.badge}
                      </Badge>
                    </div>
                  ) : (
                    iconTile
                  )}
                  <Heading as={3} size="sm" className="mt-5">
                    {feature.title}
                  </Heading>
                  <p className="mt-2 text-base leading-relaxed">{feature.body}</p>
                </Card>
              </li>
            );
          })}
        </Reveal>
      )}
    </Section>
  );
}
