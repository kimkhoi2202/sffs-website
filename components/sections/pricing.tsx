import { Check } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/quiz/reveal";
import { cn } from "@/lib/utils";

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
  | "green"
  | "ink"
  | "paper"
  | "outline";

/** A single pricing plan rendered as a bordered, hard-shadow card. */
export interface Tier {
  /** Plan name, e.g. "Pro". */
  name: string;
  /** Big Anton price string, e.g. "$29" or "Custom". */
  price: string;
  /** Small note beside the price, e.g. "/ seat / month". */
  billingNote?: string;
  /** One or two lines describing who the plan is for. */
  description: string;
  /** Feature bullets, each gets a Check in a colored circle. */
  features: string[];
  /** Call-to-action button label. Defaults to a sensible verb. */
  cta?: string;
  /** Optional link for the CTA; renders a button when omitted. */
  href?: string;
  /** Featured plan: accent background, "Most popular" badge, and a lift. */
  highlighted?: boolean;
  /** Overrides the badge text on the highlighted tier. */
  badge?: string;
  /** Overrides the card background color. */
  color?: CardColor;
  /** Overrides the CTA button variant. */
  ctaVariant?: ButtonVariant;
}

export interface PricingProps {
  /** Small tracked label above the heading. */
  eyebrow?: string;
  /** Section heading. */
  title?: string;
  /** 2–3 plans to display. Falls back to a sensible default set. */
  tiers?: Tier[];
  /** Full-bleed section background color. */
  background?: SectionBackground;
  /**
   * Optional DOM id set on the section wrapper so pages can deep-link to it
   * (e.g. `id="pricing"`). Omitted leaves the section without an id (unchanged).
   */
  id?: string;
  /** Extra classes merged onto the outer `Section` (e.g. `scroll-mt-24`). */
  className?: string;
  /** Fade + rise the inner content on scroll while the section bg stays static. */
  revealContent?: boolean;
  /**
   * Render the plan cards completely static — no hover-lift. Only affects
   * non-highlighted cards (the highlighted card's lift is a persistent, not
   * hover, transform). Off by default so other Pricing usages keep their hover.
   */
  staticCards?: boolean;
  /**
   * Render the section as a full-viewport-height panel (like the hero): the
   * section grows to `100svh` and the heading + card sit in the UPPER portion
   * (a ~2:3 top-to-bottom whitespace ratio) rather than dead-center. Spacing and
   * type scale down on short viewports so everything stays visible without
   * scrolling, and a bottom reserve equal to the nav's scroll offset keeps the
   * content fully on-screen once the page lands flush under the fixed nav.
   * Off by default, so every other use of <Pricing> is unaffected.
   */
  fullViewport?: boolean;
  /**
   * Decorative node perched at each plan card's TOP-RIGHT corner (the card's
   * wrapper becomes `relative`), overlapping the edge and layered on top. Used
   * to sit the thumbs-up brain mascot on the card; the caller's node is
   * responsible for being aria-hidden / pointer-events-none.
   */
  cardCornerAccessory?: React.ReactNode;
}

const DEFAULT_TIERS: Tier[] = [
  {
    name: "Starter",
    price: "$0",
    billingNote: "free forever",
    description:
      "Everything a new rep needs to run their first cold outreach and book meeting one.",
    features: [
      "Up to 50 tracked prospects",
      "Cold call & email templates",
      "Weekly practice drills",
      "Community access",
    ],
    cta: "Start for free",
  },
  {
    name: "Pro",
    price: "$29",
    billingNote: "/ seat / month",
    description:
      "For quota-carrying closers who want repeatable pipeline and sharper calls.",
    features: [
      "Unlimited prospects & sequences",
      "Live call breakdowns",
      "Objection-handling playbooks",
      "Deal-stage analytics",
      "Priority coaching Q&A",
    ],
    cta: "Upgrade to Pro",
    highlighted: true,
    color: "blue",
  },
  {
    name: "Team",
    price: "Custom",
    billingNote: "billed annually",
    description:
      "Roll Closer out across the whole floor with coaching, reporting, and onboarding.",
    features: [
      "Everything in Pro",
      "Manager dashboards",
      "Custom onboarding & SSO",
      "Dedicated success manager",
    ],
    cta: "Talk to sales",
  },
];

const columnsMap: Record<number, string> = {
  1: "max-w-md mx-auto",
  2: "md:grid-cols-2 max-w-4xl mx-auto",
  3: "lg:grid-cols-3",
};

export function Pricing({
  eyebrow = "Pricing",
  title = "Plans that close with you",
  tiers = DEFAULT_TIERS,
  background = "cream",
  id,
  className,
  revealContent = true,
  staticCards = false,
  fullViewport = false,
  cardCornerAccessory,
}: PricingProps) {
  const columns = columnsMap[Math.min(tiers.length, 3)] ?? "lg:grid-cols-3";

  const header = (
    <Reveal stagger enabled={revealContent} className="mx-auto max-w-2xl text-center">
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <Heading
        as={2}
        size="xl"
        className={cn(
          "mt-3",
          // Height-aware clamp so the heading shrinks on short screens and
          // never crowds the card out of the full-viewport panel.
          fullViewport && "text-[clamp(1.75rem,2vh+1.9vw,3.5rem)] leading-[1.03]",
        )}
      >
        {title}
      </Heading>
    </Reveal>
  );

  const grid = (
    <Reveal
      as="div"
      stagger
      enabled={revealContent}
      className={cn(
        "grid grid-cols-1 items-stretch gap-6 md:gap-8",
        // The heading→cards gap collapses fluidly in the full-viewport panel.
        fullViewport ? "mt-[clamp(1.25rem,4vh,2.5rem)]" : "mt-12 md:mt-16",
        columns,
      )}
    >
      {tiers.map((tier) => {
          const highlighted = Boolean(tier.highlighted);
          const cardColor: CardColor = tier.color ?? (highlighted ? "blue" : "paper");
          // Primary conversion CTAs default to brand green; per-tier
          // `ctaVariant` still overrides for other (marketing) usages.
          const ctaVariant: ButtonVariant = tier.ctaVariant ?? "green";
          const iconBg = highlighted ? "bg-yellow" : "bg-mint";
          const cta = tier.cta ?? "Get started";

          return (
            // Wrapper is the stagger target so the featured card keeps its own
            // persistent lift/scale transform without fighting the entrance tween.
            // `relative` so an optional corner accessory can perch on the card.
            <div key={tier.name} className="relative h-full">
            {cardCornerAccessory}
            <Card
              color={cardColor}
              shadow={highlighted ? "lg" : "md"}
              padding={highlighted ? "lg" : "md"}
              className={cn(
                "flex h-full flex-col",
                highlighted
                  ? "relative z-10 lg:-translate-y-4 lg:scale-[1.03]"
                  : staticCards
                    ? undefined
                    : "card-hover",
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-display text-2xl uppercase leading-none tracking-tight">
                  {tier.name}
                </p>
                {highlighted && (
                  <Badge color="yellow" shadow="hard">
                    {tier.badge ?? "Most popular"}
                  </Badge>
                )}
              </div>

              <div className="mt-5 flex items-end gap-2">
                <span className="font-display text-5xl uppercase leading-[0.9] tracking-tight sm:text-6xl">
                  {tier.price}
                </span>
                {tier.billingNote && (
                  <span className="pb-1.5 text-sm font-medium text-ink/70">
                    {tier.billingNote}
                  </span>
                )}
              </div>

              <p className="mt-4 text-sm font-medium leading-relaxed text-ink/80">
                {tier.description}
              </p>

              <ul className="mt-6 flex flex-col gap-3 border-t-2 border-ink pt-6">
                {tier.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-3 text-sm font-medium leading-snug"
                  >
                    <span
                      className={cn(
                        "flex size-6 shrink-0 items-center justify-center rounded-full border-[2.5px] border-ink",
                        iconBg,
                      )}
                    >
                      <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {tier.href ? (
                <Button
                  href={tier.href}
                  variant={ctaVariant}
                  size="lg"
                  className="mt-8 w-full"
                >
                  {cta}
                </Button>
              ) : (
                <Button variant={ctaVariant} size="lg" className="mt-8 w-full">
                  {cta}
                </Button>
              )}
            </Card>
            </div>
          );
        })}
    </Reveal>
  );

  if (fullViewport) {
    return (
      <Section
        id={id}
        background={background}
        padding="none"
        className={cn("flex min-h-[100svh] flex-col", className)}
        containerClassName="flex w-full flex-1 flex-col"
      >
        {/* Upper spacer : lower spacer ≈ 2 : 3 → content sits above center. */}
        <div aria-hidden className="min-h-[clamp(0.75rem,3vh,2.5rem)] shrink-0 grow-[2] basis-0" />
        <div className="shrink-0">
          {header}
          {grid}
        </div>
        <div aria-hidden className="grow-[3] basis-0" />
        {/*
          Reserve the strip that lands BELOW the fold. On landing, #pricing's top
          sits flush under the fixed nav (scroll offset ≈ nav height − 2px), so
          the section's final ~nav-height would be off-screen. Reserving it here
          keeps the whole card on-screen and makes the 2:3 whitespace ratio apply
          to the VISIBLE band. Uses the same --nav-h / scroll-mt-nav offset.
        */}
        <div
          aria-hidden
          className="shrink-0"
          style={{ height: "calc(var(--nav-h, 4.5rem) - 2px)" }}
        />
      </Section>
    );
  }

  return (
    <Section id={id} background={background} padding="lg" className={className}>
      {header}
      {grid}
    </Section>
  );
}
