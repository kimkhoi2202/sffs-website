import { Star } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Heading } from "@/components/ui/heading";
import { Marquee } from "@/components/ui/marquee";
import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/quiz/reveal";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

type AvatarColor = "blue" | "mint" | "coral" | "yellow" | "gray" | "ink";
/**
 * Fill colors the avatar CIRCLE can use behind a (transparent) brain PNG. This
 * is the "bread" half of the sandwich — deliberately a DIFFERENT color from the
 * card/brain so the brain reads clearly. Superset of `AvatarColor` (adds the
 * brand "green" and the light "paper" so any card's brain gets a contrasting
 * disc).
 */
type CircleColor = "blue" | "mint" | "coral" | "yellow" | "gray" | "ink" | "green" | "paper";
/** Colors the shared `<Card>` primitive renders natively. */
type CardBaseColor = "paper" | "cream" | "blue" | "mint" | "coral" | "yellow" | "ink";
/**
 * Card fills a testimonial can use. Adds the brand "green" on top of the
 * `<Card>` primitive's own colors; since `<Card>` has no green variant it is
 * painted via a `bg-green` override (black text still reads cleanly on it), so
 * the wall can show all six brand hues at once.
 */
type CardColor = CardBaseColor | "green";
type SectionBackground =
  | "paper"
  | "cream"
  | "ink"
  | "blue"
  | "mint"
  | "coral"
  | "yellow"
  | "gray";

/** Button color options (mirrors the shared `<Button>` primitive). */
type ButtonVariant = NonNullable<React.ComponentProps<typeof Button>["variant"]>;

export interface Testimonial {
  /** The quote body. */
  quote: string;
  /** Person's name, e.g. "Maya Delgado". */
  name: string;
  /** Job title, e.g. "SDR". */
  role?: string;
  /** Company, e.g. "Brightline". Rendered as `role · company`. */
  company?: string;
  /** Star rating 0–5. Defaults to 5. */
  rating?: number;
  /** Avatar initials. Derived from `name` when omitted. */
  initials?: string;
  /** Avatar fill for the initials fallback. Defaults to `ink`. */
  avatarColor?: AvatarColor;
  /**
   * Public path to a photo/illustration (e.g. "/testimonials/greg.png"). When
   * set, it fills the avatar circle instead of the initials; `avatarColor` and
   * `initials` are ignored. Use a TRANSPARENT PNG so `circleColor` shows behind
   * it (the sandwich: card = brain color, circle = a contrasting color).
   */
  avatarImage?: string;
  /**
   * Fill color of the avatar circle sitting behind `avatarImage`. Pick a color
   * DIFFERENT from `cardColor` (the brain's color) so the brain pops. Defaults
   * to `ink`.
   */
  circleColor?: CircleColor;
  /** Pin a card color. Otherwise rotates through a bright palette by index. */
  cardColor?: CardColor;
}

/** A labelled link rendered as the wall's trailing call-to-action. */
export interface TestimonialsCta {
  /** Button text, e.g. "Buy the book". */
  label: string;
  /** Destination, internal path (e.g. "#pricing") or absolute URL. */
  href: string;
}

export interface TestimonialsProps {
  /** Section heading. */
  title?: string;
  /** Small uppercase label above the heading. Pass `""` to hide. */
  eyebrow?: string;
  /** Quote data. Falls back to a set of original placeholder quotes. */
  testimonials?: Testimonial[];
  /** Full-bleed section background color. */
  background?: SectionBackground;
  /**
   * Optional trailing call-to-action rendered as a centered button below the
   * grid (e.g. a recurring "Buy the book" link). Omit to hide it. Only affects
   * `Testimonials`; `TestimonialMarquee` is unchanged.
   */
  cta?: TestimonialsCta;
  /** Fade + rise the inner content on scroll while the section bg stays static. */
  revealContent?: boolean;
  /**
   * Decorative node anchored to the FIRST glyph of the title (rendered inside a
   * `relative inline-block` wrapper around that letter, behind it at `z-0`). Used
   * to peek the brain mascot out from behind the first "L" of the heading.
   */
  firstLetterAccessory?: React.ReactNode;
  /** Optional anchor id set on the section wrapper. */
  id?: string;
  className?: string;
}

export interface TestimonialMarqueeProps {
  /** Quote data. Falls back to a set of original placeholder quotes. */
  testimonials?: Testimonial[];
  /** Seconds per loop (lower = faster). */
  speed?: number;
  /** Scroll right-to-left when true. */
  reverse?: boolean;
  className?: string;
}

/* -------------------------------------------------------------------------- */
/*  Default (original, placeholder) data                                       */
/* -------------------------------------------------------------------------- */

/** Bright palette the cards cycle through when no `cardColor` is set. */
const CARD_COLOR_CYCLE: CardColor[] = ["paper", "mint", "yellow", "blue", "coral"];

/**
 * Per-background button variant so the wall's trailing CTA pill always
 * contrasts with the section it sits on (mirrors the shared `CtaBand` recipe).
 */
const CTA_VARIANT: Record<SectionBackground, ButtonVariant> = {
  paper: "ink",
  cream: "ink",
  blue: "ink",
  mint: "ink",
  coral: "ink",
  yellow: "ink",
  gray: "ink",
  ink: "yellow",
};

export const DEFAULT_TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "I booked more meetings in my first two weeks than I did all of last quarter. The cold-call framework just works.",
    name: "Maya Delgado",
    role: "SDR",
    company: "Brightline",
    avatarColor: "blue",
  },
  {
    quote:
      "Closer cut our new-rep ramp from three months to three weeks. People sound like veterans on day one.",
    name: "Theo Ballard",
    role: "Sales Manager",
    company: "Nimbus",
    avatarColor: "coral",
  },
  {
    quote:
      "The discovery module paid for itself on my first call. I finally stopped pitching and started asking better questions.",
    name: "Priya Nair",
    role: "Account Executive",
    company: "Foundry",
    avatarColor: "ink",
  },
  {
    quote:
      "I used to dread objection handling. Now it's the part of the call I actually look forward to.",
    name: "Marcus Webb",
    role: "Enterprise AE",
    company: "Halcyon",
    avatarColor: "yellow",
  },
  {
    quote:
      "Our whole floor quotes the negotiation tactics back to each other. It quietly became our team playbook.",
    name: "Dana Kowalski",
    role: "VP of Sales",
    company: "Lumen",
    avatarColor: "ink",
  },
  {
    quote:
      "The only sales training that ever stuck with me. Practical, punchy, and mercifully free of fluff.",
    name: "Sofia Reyes",
    role: "Founder",
    company: "Cadence",
    avatarColor: "mint",
  },
];

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function resolveInitials(t: Testimonial): string {
  if (t.initials) return t.initials;
  const parts = t.name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, 2);
  return parts[0][0] + parts[parts.length - 1][0];
}

function resolveRole(t: Testimonial): string {
  return [t.role, t.company].filter(Boolean).join(" · ");
}

function cardColorFor(
  t: Testimonial,
  index: number,
  cycle: CardColor[] = CARD_COLOR_CYCLE,
): CardColor {
  return t.cardColor ?? cycle[index % cycle.length];
}

/**
 * Split a card fill into the base `<Card>` color plus any override class. Only
 * "green" needs an override today (the `<Card>` primitive has no green
 * variant); every other value maps straight through to a native variant.
 */
function resolveCardFill(color: CardColor): { base: CardBaseColor; className?: string } {
  if (color === "green") {
    return { base: "paper", className: "bg-green selection:bg-yellow selection:text-ink" };
  }
  return { base: color };
}

/* -------------------------------------------------------------------------- */
/*  Star rating                                                                */
/* -------------------------------------------------------------------------- */

function StarRating({ rating = 5 }: { rating?: number }) {
  const filled = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <div
      className="flex items-center gap-0.5"
      role="img"
      aria-label={`${filled} out of 5 stars`}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          aria-hidden
          strokeWidth={2.5}
          className={cn(
            "size-4",
            i < filled ? "fill-ink text-ink" : "fill-none text-ink/30",
          )}
        />
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Avatar                                                                     */
/* -------------------------------------------------------------------------- */

/** Match the `<Avatar>` primitive's circle dimensions per size. */
const AVATAR_IMAGE_SIZE: Record<"sm" | "md", string> = {
  sm: "h-9 w-9",
  md: "h-12 w-12",
};

/**
 * Solid fills for the avatar circle behind a transparent brain PNG. Every value
 * maps to a brand token so the "circle" half of the sandwich always contrasts
 * with the card/brain color painted on top of the disc.
 */
const CIRCLE_BG: Record<CircleColor, string> = {
  blue: "bg-blue",
  mint: "bg-mint",
  coral: "bg-coral",
  yellow: "bg-yellow",
  gray: "bg-gray-100",
  ink: "bg-ink",
  green: "bg-green",
  paper: "bg-paper",
};

/**
 * Renders a testimonial's avatar. When `avatarImage` is set, the (transparent)
 * brain PNG sits on top of a solid `circleColor` disc — the sandwich: the card
 * behind is the brain's color, the disc is a different, contrasting color, so
 * the brain reads crisply. Otherwise falls back to the initials `<Avatar>`.
 */
function TestimonialAvatar({
  testimonial: t,
  size,
}: {
  testimonial: Testimonial;
  size: "sm" | "md";
}) {
  if (t.avatarImage) {
    return (
      <span
        className={cn(
          "relative grid shrink-0 place-items-center overflow-hidden rounded-full border-[2.5px] border-ink",
          CIRCLE_BG[t.circleColor ?? "ink"],
          AVATAR_IMAGE_SIZE[size],
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- local /public asset; transparent PNG lets the disc color show through */}
        <img src={t.avatarImage} alt={t.name} className="h-full w-full object-cover" />
      </span>
    );
  }
  return <Avatar initials={resolveInitials(t)} color={t.avatarColor ?? "ink"} size={size} />;
}

/* -------------------------------------------------------------------------- */
/*  Cards                                                                      */
/* -------------------------------------------------------------------------- */

function QuoteCard({ testimonial: t, color }: { testimonial: Testimonial; color: CardColor }) {
  const role = resolveRole(t);
  const fill = resolveCardFill(color);
  return (
    <Card
      color={fill.base}
      shadow="md"
      padding="md"
      className={cn("flex h-full flex-col card-hover", fill.className)}
    >
      {/* Quote grows to fill, pushing the star row + author footer to the bottom
          so, in an equal-height grid row, all footers align across cards. */}
      <blockquote className="flex-1 text-pretty text-lg font-medium leading-snug">
        {`“${t.quote}”`}
      </blockquote>
      <div className="mt-5 flex flex-col gap-4 border-t-[2.5px] border-ink pt-4">
        <StarRating rating={t.rating} />
        <div className="flex items-center gap-3">
          <TestimonialAvatar testimonial={t} size="md" />
          <div className="min-w-0 leading-tight">
            <p className="truncate font-bold">{t.name}</p>
            {role ? (
              <p className="truncate text-sm font-medium text-ink/70">{role}</p>
            ) : null}
          </div>
        </div>
      </div>
    </Card>
  );
}

function CompactQuoteCard({
  testimonial: t,
  color,
}: {
  testimonial: Testimonial;
  color: CardColor;
}) {
  const role = resolveRole(t);
  const fill = resolveCardFill(color);
  return (
    <Card
      color={fill.base}
      shadow="sm"
      padding="md"
      className={cn("flex w-[320px] shrink-0 flex-col gap-3 whitespace-normal", fill.className)}
    >
      <StarRating rating={t.rating} />
      <p className="text-pretty text-base font-medium leading-snug">
        {`“${t.quote}”`}
      </p>
      <div className="mt-1 flex items-center gap-3">
        <TestimonialAvatar testimonial={t} size="sm" />
        <div className="min-w-0 text-sm leading-tight">
          <p className="truncate font-bold">{t.name}</p>
          {role ? <p className="truncate text-ink/70">{role}</p> : null}
        </div>
      </div>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*  Sections                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Testimonials, a "wall of love" of quote cards laid out in balanced CSS
 * multi-columns (1 → 2 → 3 across breakpoints). Renders great with no props.
 */
export function Testimonials({
  title = "Don't just take our word for it",
  eyebrow = "Testimonials",
  testimonials = DEFAULT_TESTIMONIALS,
  background = "cream",
  cta,
  revealContent = true,
  firstLetterAccessory,
  id,
  className,
}: TestimonialsProps = {}) {
  const items = testimonials.length > 0 ? testimonials : DEFAULT_TESTIMONIALS;

  // Drop the section's own background from the auto palette so no card fill
  // blends into the page behind it. Only paper/mint/yellow/blue/coral overlap
  // the cycle; cream/ink/gray backgrounds leave it untouched.
  const filteredCycle = CARD_COLOR_CYCLE.filter((color) => color !== background);
  const cardCycle = filteredCycle.length > 0 ? filteredCycle : CARD_COLOR_CYCLE;

  return (
    <Section background={background} padding="lg" className={className} id={id}>
      <Reveal stagger enabled={revealContent} className="mb-10 max-w-2xl md:mb-14">
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <Heading as={2} size="xl" className={cn(eyebrow && "mt-4")}>
          {firstLetterAccessory ? (
            <>
              <span className="relative inline-block">
                <span className="relative z-10">{title.slice(0, 1)}</span>
                {firstLetterAccessory}
              </span>
              {title.slice(1)}
            </>
          ) : (
            title
          )}
        </Heading>
      </Reveal>

      <Reveal
        as="ul"
        stagger
        enabled={revealContent}
        className="grid list-none grid-cols-1 items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        {items.map((t, i) => (
          <li key={`${t.name}-${i}`} className="h-full">
            <QuoteCard testimonial={t} color={cardColorFor(t, i, cardCycle)} />
          </li>
        ))}
      </Reveal>

      {cta ? (
        <div className="mt-10 flex justify-center md:mt-14">
          <Button href={cta.href} variant={CTA_VARIANT[background]} size="lg">
            {cta.label}
          </Button>
        </div>
      ) : null}
    </Section>
  );
}

/**
 * TestimonialMarquee, a continuously scrolling, full-width strip of compact
 * quote cards. Drop it edge-to-edge between color-blocked sections. The
 * wrapper keeps vertical padding so the hard offset shadows are never clipped.
 */
export function TestimonialMarquee({
  testimonials = DEFAULT_TESTIMONIALS,
  speed = 40,
  reverse = false,
  className,
}: TestimonialMarqueeProps = {}) {
  const items = testimonials.length > 0 ? testimonials : DEFAULT_TESTIMONIALS;

  return (
    <Marquee
      speed={speed}
      reverse={reverse}
      gap="1.5rem"
      className={cn("py-8", className)}
    >
      {items.map((t, i) => (
        <CompactQuoteCard
          key={`${t.name}-${i}`}
          testimonial={t}
          color={cardColorFor(t, i)}
        />
      ))}
    </Marquee>
  );
}
