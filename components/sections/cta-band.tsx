import type { ComponentProps } from "react";
import { ArrowRight, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/quiz/reveal";

/** Full-bleed color block (mirrors the `Section` primitive's palette). */
type SectionBackground = NonNullable<ComponentProps<typeof Section>["background"]>;
/** Button color options (mirrors the `Button` primitive). */
type ButtonVariant = NonNullable<ComponentProps<typeof Button>["variant"]>;
/** Badge color options (mirrors the `Badge` primitive). */
type BadgeColor = NonNullable<ComponentProps<typeof Badge>["color"]>;

/** A single labelled link used for the band's actions. */
export interface CtaLink {
  /** Button text. */
  label: string;
  /** Destination, internal path or absolute URL. */
  href: string;
}

export interface CtaBandProps {
  /** Big Anton headline. */
  title?: string;
  /** Short supporting line under the headline. */
  subtitle?: string;
  /** Primary action, the loud, high-contrast pill. */
  primaryCta?: CtaLink;
  /** Optional variant override for the primary button; defaults to a per-background contrast color. */
  primaryVariant?: ButtonVariant;
  /** Optional second action. Pass `null` to render a single button. */
  secondaryCta?: CtaLink | null;
  /** Full-bleed block color; buttons and sticker auto-contrast to it. Defaults to `"coral"`. */
  background?: SectionBackground;
  /** `center` stacks everything centered; `split` puts copy left / buttons right on `lg`. */
  align?: "center" | "split";
  /** Decorative rotated sticker text. Pass `null` (or `""`) to hide it. */
  badge?: string | null;
  /** Anchor id on the outer section. */
  id?: string;
  /** Extra classes merged onto the outer `Section`. */
  className?: string;
  /** Fade + rise the inner content on scroll while the section bg stays static. */
  revealContent?: boolean;
}

/**
 * Per-background contrast recipe so the band pops on any color block: a bold
 * primary button, a lighter secondary, and a sticker that never matches the
 * section behind it.
 */
const bandTheme: Record<
  SectionBackground,
  { primary: ButtonVariant; secondary: ButtonVariant; badge: BadgeColor }
> = {
  paper: { primary: "ink", secondary: "blue", badge: "yellow" },
  cream: { primary: "ink", secondary: "coral", badge: "blue" },
  blue: { primary: "ink", secondary: "paper", badge: "yellow" },
  mint: { primary: "ink", secondary: "paper", badge: "coral" },
  green: { primary: "paper", secondary: "yellow", badge: "coral" },
  coral: { primary: "ink", secondary: "paper", badge: "yellow" },
  yellow: { primary: "ink", secondary: "paper", badge: "coral" },
  gray: { primary: "ink", secondary: "paper", badge: "yellow" },
  ink: { primary: "yellow", secondary: "paper", badge: "coral" },
};

const DEFAULT_PRIMARY: CtaLink = { label: "Start free trial", href: "/get-started" };
const DEFAULT_SECONDARY: CtaLink = { label: "Book a demo", href: "/demo" };

/**
 * CtaBand, a punchy, high-contrast call-to-action block: a rotated sticker
 * badge, a giant uppercase Anton headline, a short subcopy line, and one or two
 * pill buttons inside a full-bleed bordered color block. `align="center"` stacks
 * everything centered; `align="split"` sits the copy left and the buttons right
 * from `lg` up. Renders fully with no props and accepts typed overrides.
 * Server Component.
 */
export function CtaBand({
  title = "Ready to close more deals?",
  subtitle = "Join 12,000+ reps sharpening their pitch with Closer playbooks, live coaching, and scripts that actually book meetings.",
  primaryCta = DEFAULT_PRIMARY,
  primaryVariant,
  secondaryCta,
  background = "coral",
  align = "center",
  badge = "Free 14-day trial",
  id,
  className,
  revealContent = true,
}: CtaBandProps = {}) {
  const theme = bandTheme[background];
  // `undefined` (omitted) falls back to a sensible default; `null` hides it.
  const secondary = secondaryCta === undefined ? DEFAULT_SECONDARY : secondaryCta;
  const showBadge = badge != null && badge.length > 0;

  const sticker = showBadge ? (
    <Badge color={theme.badge} shadow="hard" className="-rotate-3">
      <Sparkles className="size-3.5" aria-hidden="true" />
      {badge}
    </Badge>
  ) : null;

  const actions = (
    <>
      <Button href={primaryCta.href} variant={primaryVariant ?? theme.primary} size="lg">
        {primaryCta.label}
        <ArrowRight className="size-5" aria-hidden="true" />
      </Button>
      {secondary ? (
        <Button href={secondary.href} variant={theme.secondary} size="lg">
          {secondary.label}
        </Button>
      ) : null}
    </>
  );

  if (align === "split") {
    return (
      <Section id={id} background={background} padding="lg" bordered className={className}>
        <Reveal
          stagger
          enabled={revealContent}
          className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-10"
        >
          <div className="min-w-0 max-w-2xl">
            {sticker ? <div className="mb-5">{sticker}</div> : null}
            <Heading as={2} size="xl" className="text-balance">
              {title}
            </Heading>
            {subtitle ? (
              <p className="mt-5 max-w-xl text-pretty text-lg font-medium opacity-90 md:text-xl">
                {subtitle}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-col gap-4 sm:flex-row sm:flex-wrap lg:justify-end">
            {actions}
          </div>
        </Reveal>
      </Section>
    );
  }

  return (
    <Section id={id} background={background} padding="lg" bordered className={className}>
      <Reveal
        stagger
        enabled={revealContent}
        className="mx-auto flex max-w-3xl flex-col items-center text-center"
      >
        {sticker ? <div className="mb-6">{sticker}</div> : null}
        <Heading as={2} size="xl" className="text-balance">
          {title}
        </Heading>
        {subtitle ? (
          <p className="mt-5 max-w-2xl text-pretty text-lg font-medium opacity-90 md:text-xl">
            {subtitle}
          </p>
        ) : null}
        <div className="mt-8 flex flex-col flex-wrap items-center justify-center gap-4 sm:flex-row">
          {actions}
        </div>
      </Reveal>
    </Section>
  );
}
