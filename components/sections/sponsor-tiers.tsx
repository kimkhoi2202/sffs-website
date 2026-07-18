import { Check } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/quiz/reveal";
import { cn } from "@/lib/utils";

/** Full-bleed section background (mirrors the `Section` primitive's options). */
type SectionBackground =
  | "paper"
  | "cream"
  | "ink"
  | "blue"
  | "mint"
  | "coral"
  | "yellow"
  | "gray";

type CardColor = "paper" | "cream" | "blue" | "mint" | "coral" | "yellow" | "ink";

type ButtonVariant =
  | "blue"
  | "coral"
  | "yellow"
  | "mint"
  | "ink"
  | "paper"
  | "outline";

/** A single sponsorship package rendered as a bordered, hard-shadow card. */
export interface Tier {
  /** Package name, e.g. "Newsletter". */
  name: string;
  /** Big Anton reach stat, the card's hero number, e.g. "250k+ opens". */
  reach: string;
  /** Small caption beneath the reach stat, e.g. "avg. per weekly send". */
  reachNote?: string;
  /** One short line describing the placement. */
  description?: string;
  /** What's included, each bullet gets a Check in a colored circle. */
  includes: string[];
  /** Price / starting-at value, e.g. "$4,500". */
  price: string;
  /** Small label above the price. Defaults to "Starting at". */
  priceLabel?: string;
  /** Small unit shown after the price, e.g. "per placement". */
  priceNote?: string;
  /** Call-to-action label. Defaults to "Book this". */
  cta?: string;
  /** Optional link for the CTA; renders a plain button when omitted. */
  href?: string;
  /** Featured package: accent background, "Best value" badge, and a lift. */
  highlighted?: boolean;
  /** Overrides the badge text on the highlighted tier. */
  badge?: string;
  /** Overrides the card background color. */
  color?: CardColor;
  /** Overrides the CTA button variant. */
  ctaVariant?: ButtonVariant;
}

export interface SponsorTiersProps {
  /** Small tracked label above the heading. */
  eyebrow?: string;
  /** Section heading. */
  title?: string;
  /** Optional lead paragraph shown under the heading. */
  intro?: string;
  /** 1–3 packages to display. Falls back to a sensible default set. */
  tiers?: Tier[];
  /** Full-bleed section background color. */
  background?: SectionBackground;
  /** Fade + rise the inner content on scroll; disable to render statically. */
  revealContent?: boolean;
  className?: string;
  id?: string;
}

const DEFAULT_TIERS: Tier[] = [
  {
    name: "Newsletter",
    reach: "250k+ opens",
    reachNote: "avg. per weekly send",
    description:
      "Land in the inbox of quota-carrying reps and revenue leaders every Tuesday morning.",
    includes: [
      "Dedicated ad slot in one send",
      "Custom copy written with you",
      "Clickable logo + tracked CTA",
      "Performance recap within 48h",
    ],
    price: "$4,500",
    priceNote: "per placement",
  },
  {
    name: "Podcast",
    reach: "180k+ listens",
    reachNote: "avg. per new episode",
    description:
      "A host-read spot inside the show closers actually finish on the drive home.",
    includes: [
      "60-second host-read midroll",
      "Mention in the show notes",
      "Evergreen back-catalog reach",
      "Shareable audiogram clip",
    ],
    price: "$6,000",
    priceNote: "per episode",
  },
  {
    name: "Bundle",
    reach: "400k+ reach",
    reachNote: "newsletter + podcast, combined",
    description:
      "Wrap the whole audience in one campaign and stay top of mind all month long.",
    includes: [
      "Everything in Newsletter",
      "Everything in Podcast",
      "Four-week always-on flight",
      "Priority calendar placement",
      "A dedicated campaign manager",
    ],
    price: "$9,000",
    priceNote: "per month",
    highlighted: true,
    badge: "Best value",
    color: "blue",
  },
];

const columnsMap: Record<number, string> = {
  1: "max-w-md mx-auto",
  2: "md:grid-cols-2 max-w-4xl mx-auto",
  3: "lg:grid-cols-3",
};

/**
 * A sponsorship-packages section: an eyebrow + heading (+ optional intro) above
 * a row of bordered, hard-shadowed tier cards (they stack on mobile). Each card
 * leads with a big Anton reach stat, lists what's included with checkmarks, and
 * ends with a price and a "Book this" CTA. The highlighted tier gets an accent
 * background, a "Best value" badge, and a lift. Renders fully with no props.
 */
export function SponsorTiers({
  eyebrow = "Sponsorships",
  title = "Put your brand in front of closers",
  intro = "Reach a highly engaged audience of sellers, founders, and revenue leaders. Pick a channel or bundle the lot, every package ships with copy help and a performance recap.",
  tiers = DEFAULT_TIERS,
  background = "cream",
  revealContent = true,
  className,
  id,
}: SponsorTiersProps = {}) {
  const columns = columnsMap[Math.min(tiers.length, 3)] ?? "lg:grid-cols-3";

  return (
    <Section background={background} padding="lg" className={className} id={id}>
      {(eyebrow || title || intro) && (
        <Reveal stagger enabled={revealContent} className="mx-auto max-w-2xl text-center">
          {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
          {title && (
            <Heading as={2} size="xl" className={cn(eyebrow && "mt-3")}>
              {title}
            </Heading>
          )}
          {intro && (
            <p className="mt-4 text-lg leading-relaxed text-ink/80">{intro}</p>
          )}
        </Reveal>
      )}

      {tiers.length > 0 && (
        <Reveal
          as="ul"
          stagger
          enabled={revealContent}
          className={cn(
            "mt-12 grid list-none grid-cols-1 items-stretch gap-6 md:mt-16 md:gap-8",
            columns,
          )}
        >
          {tiers.map((tier, index) => {
            const highlighted = Boolean(tier.highlighted);
            const cardColor: CardColor =
              tier.color ?? (highlighted ? "blue" : "paper");
            const ctaVariant: ButtonVariant =
              tier.ctaVariant ?? (highlighted ? "ink" : "blue");
            const iconBg = highlighted ? "bg-yellow" : "bg-mint";
            const cta = tier.cta ?? "Book this";
            const priceLabel = tier.priceLabel ?? "Starting at";

            return (
              <li key={`${tier.name}-${index}`} className="h-full">
                <Card
                  color={cardColor}
                  shadow={highlighted ? "lg" : "md"}
                  padding={highlighted ? "lg" : "md"}
                  className={cn(
                    "flex h-full flex-col",
                    highlighted
                      ? "relative z-10 lg:-translate-y-4 lg:scale-[1.03]"
                      : "card-hover",
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-display text-2xl uppercase leading-none tracking-tight">
                      {tier.name}
                    </p>
                    {highlighted && (
                      <Badge color="yellow" shadow="hard">
                        {tier.badge ?? "Best value"}
                      </Badge>
                    )}
                  </div>

                  <div className="mt-6">
                    <p className="font-display text-5xl uppercase leading-[0.9] tracking-tight sm:text-6xl">
                      {tier.reach}
                    </p>
                    {tier.reachNote && (
                      <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-ink/80">
                        {tier.reachNote}
                      </p>
                    )}
                  </div>

                  {tier.description && (
                    <p className="mt-4 text-sm font-medium leading-relaxed text-ink/80">
                      {tier.description}
                    </p>
                  )}

                  {tier.includes.length > 0 && (
                    <ul className="mt-6 flex flex-col gap-3 border-t-2 border-ink pt-6">
                      {tier.includes.map((item) => (
                        <li
                          key={item}
                          className="flex items-start gap-3 text-sm font-medium leading-snug"
                        >
                          <span
                            className={cn(
                              "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border-[2.5px] border-ink",
                              iconBg,
                            )}
                          >
                            <Check
                              className="size-3.5"
                              strokeWidth={3}
                              aria-hidden="true"
                            />
                          </span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="mt-auto pt-8">
                    <div className="flex items-end gap-2">
                      <span className="text-xs font-bold uppercase tracking-wide text-ink/80">
                        {priceLabel}
                      </span>
                      <span className="font-display text-3xl uppercase leading-none tracking-tight">
                        {tier.price}
                      </span>
                      {tier.priceNote && (
                        <span className="pb-0.5 text-sm font-medium text-ink/70">
                          {tier.priceNote}
                        </span>
                      )}
                    </div>

                    {tier.href ? (
                      <Button
                        href={tier.href}
                        variant={ctaVariant}
                        size="lg"
                        className="mt-6 w-full"
                      >
                        {cta}
                      </Button>
                    ) : (
                      <Button
                        variant={ctaVariant}
                        size="lg"
                        className="mt-6 w-full"
                      >
                        {cta}
                      </Button>
                    )}
                  </div>
                </Card>
              </li>
            );
          })}
        </Reveal>
      )}
    </Section>
  );
}
