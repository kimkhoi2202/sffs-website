import type { ComponentProps } from "react";
import { Check, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Heading } from "@/components/ui/heading";
import { Placeholder } from "@/components/ui/placeholder";
import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/quiz/reveal";
import { cn } from "@/lib/utils";

/** Full-bleed section block color (mirrors the shared <Section> palette). */
type SectionBackground = NonNullable<ComponentProps<typeof Section>["background"]>;
type PlaceholderColor = NonNullable<ComponentProps<typeof Placeholder>["color"]>;
type BadgeColor = NonNullable<ComponentProps<typeof Badge>["color"]>;
type ButtonVariant = NonNullable<ComponentProps<typeof Button>["variant"]>;

/** Bright accent used for the check circles and the layered book blocks. */
type Accent = "blue" | "mint" | "coral" | "yellow";

/** A single call-to-action button. */
export interface BookHeroCta {
  label: string;
  href: string;
}

export interface BookHeroProps {
  /** Small uppercase tracked label above the title. */
  eyebrow?: string;
  /** Anton display headline (also printed on the book cover). */
  title?: string;
  /** Supporting lead paragraph under the headline. */
  subtitle?: string;
  /** Price line, e.g. "$29", rendered in the Anton display face. */
  price?: string;
  /** Benefit bullets, each with a checkmark. Pass `[]` to hide. */
  bullets?: string[];
  /** Primary "buy" button. Pass `null` to hide it. */
  primaryCta?: BookHeroCta | null;
  /** Optional secondary button. Pass `null` for a single CTA. */
  secondaryCta?: BookHeroCta | null;
  /** Full-bleed section color block behind the hero. */
  background?: SectionBackground;
  /** Fade + rise the content on scroll; disable to render statically. */
  revealContent?: boolean;
}

/** Static accent → bg class map (kept literal so Tailwind's JIT can scan it). */
const accentBg: Record<Accent, string> = {
  blue: "bg-blue",
  mint: "bg-mint",
  coral: "bg-coral",
  yellow: "bg-yellow",
};

interface Scheme {
  /** Circle behind each checkmark. */
  check: Accent;
  /** The book cover block color. */
  cover: PlaceholderColor;
  /** Offset block peeking behind the cover for depth. */
  backing: Accent;
  /** "Bestseller" sticker color. */
  sticker: BadgeColor;
  /** Primary + secondary buy button variants. */
  primaryBtn: ButtonVariant;
  secondaryBtn: ButtonVariant;
}

/**
 * Contrast-safe accent recipe per section color, so the hero, cover, stickers,
 * checks, and CTAs, stays legible and punchy on any block.
 */
const scheme: Record<SectionBackground, Scheme> = {
  paper: { check: "mint", cover: "blue", backing: "yellow", sticker: "coral", primaryBtn: "coral", secondaryBtn: "blue" },
  cream: { check: "coral", cover: "blue", backing: "mint", sticker: "yellow", primaryBtn: "coral", secondaryBtn: "blue" },
  ink: { check: "yellow", cover: "blue", backing: "coral", sticker: "yellow", primaryBtn: "yellow", secondaryBtn: "paper" },
  blue: { check: "yellow", cover: "coral", backing: "mint", sticker: "yellow", primaryBtn: "ink", secondaryBtn: "paper" },
  mint: { check: "coral", cover: "blue", backing: "yellow", sticker: "coral", primaryBtn: "ink", secondaryBtn: "paper" },
  coral: { check: "yellow", cover: "blue", backing: "mint", sticker: "yellow", primaryBtn: "ink", secondaryBtn: "paper" },
  yellow: { check: "coral", cover: "blue", backing: "mint", sticker: "coral", primaryBtn: "ink", secondaryBtn: "paper" },
  gray: { check: "mint", cover: "blue", backing: "coral", sticker: "yellow", primaryBtn: "coral", secondaryBtn: "blue" },
};

const DEFAULT_BULLETS = [
  "40+ battle-tested scripts for calls, email, and DMs",
  "A repeatable framework for handling any objection",
  "Real teardown transcripts from six-figure closers",
  "Bonus workbook, templates, and lifetime updates",
];

/** Five filled stars; inherits color via `fill-current` to suit any surface. */
function StarRow() {
  return (
    <div className="flex items-center gap-0.5" role="img" aria-label="Rated 4.9 out of 5 stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className="h-4 w-4 fill-current" aria-hidden />
      ))}
    </div>
  );
}

/**
 * BookHero, a book landing hero.
 *
 * Two-column split that stacks on mobile: sales copy, a benefit checklist, a
 * price line, and buy CTAs on one side; a rotated, hard-shadowed book "cover"
 * with a rotated "Bestseller" sticker on the other. Full-bleed color block,
 * thick black borders, and hard offset shadows throughout. Renders great with
 * no props (tasteful placeholder copy baked in) and accepts typed overrides.
 */
export function BookHero({
  eyebrow = "New release",
  title = "The Closer's Playbook",
  subtitle = "The field guide to booking meetings, handling objections, and closing more deals, without the pushy scripts or the awkward silences.",
  price = "$29",
  bullets = DEFAULT_BULLETS,
  primaryCta = { label: "Buy the book", href: "/buy" },
  secondaryCta = { label: "Read a sample", href: "/sample" },
  background = "blue",
  revealContent = true,
}: BookHeroProps = {}) {
  const colors = scheme[background];
  const coverTitle = title || "The Closer's Playbook";

  return (
    <Section background={background} padding="lg" bordered>
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        {/* Text column */}
        <Reveal stagger enabled={revealContent} className="flex flex-col items-start">
          {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}

          {title ? (
            <Heading as={1} size="xl" className={cn("text-balance", eyebrow && "mt-4")}>
              {title}
            </Heading>
          ) : null}

          {subtitle ? (
            <p className="mt-5 max-w-prose text-pretty text-lg font-medium leading-relaxed opacity-90">
              {subtitle}
            </p>
          ) : null}

          {bullets.length > 0 ? (
            <ul className="mt-8 flex w-full flex-col gap-3">
              {bullets.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span
                    className={cn(
                      "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border-[2.5px] border-ink shadow-hard-xs",
                      accentBg[colors.check],
                    )}
                  >
                    <Check className="size-3.5 text-ink" strokeWidth={3} aria-hidden />
                  </span>
                  <span className="text-base font-medium leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          ) : null}

          {price ? (
            <p className="mt-8 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="font-display text-4xl leading-none tracking-[-0.01em]">{price}</span>
              <span className="text-sm font-bold uppercase tracking-wide opacity-80">
                One-time payment · Lifetime updates
              </span>
            </p>
          ) : null}

          {primaryCta || secondaryCta ? (
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
              {primaryCta ? (
                <Button href={primaryCta.href} variant={colors.primaryBtn} size="lg">
                  {primaryCta.label}
                </Button>
              ) : null}
              {secondaryCta ? (
                <Button href={secondaryCta.href} variant={colors.secondaryBtn} size="lg">
                  {secondaryCta.label}
                </Button>
              ) : null}
            </div>
          ) : null}

          {/* Social proof */}
          <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2">
            <StarRow />
            <p className="text-sm font-bold">4.9/5 from 1,200 readers</p>
          </div>
        </Reveal>

        {/* Book column */}
        <div className="relative mx-auto w-full max-w-[17rem] sm:max-w-[20rem] lg:max-w-[22rem]">
          {/* Offset accent block for layered, physical-book depth. */}
          <div
            aria-hidden
            className={cn(
              "absolute inset-0 -rotate-3 rounded-2xl border-[2.5px] border-ink",
              accentBg[colors.backing],
            )}
          />

          {/* The book "cover", tilted and lifted off its hard shadow. */}
          <Placeholder aspect="3/4" color={colors.cover} className="relative rotate-3 shadow-hard-xl">
            <div className="absolute inset-0 z-10 flex flex-col justify-between p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <span className="font-sans text-[0.65rem] font-bold uppercase tracking-[0.14em]">
                  A Closer Field Guide
                </span>
                <Star className="h-4 w-4 fill-current" aria-hidden />
              </div>
              <div>
                <span className="block font-display text-[clamp(1.5rem,4.4vw,2.25rem)] uppercase leading-[0.95] tracking-[-0.01em]">
                  {coverTitle}
                </span>
                <span aria-hidden className="mt-3 block h-[2.5px] w-12 bg-ink" />
                <span className="mt-3 block font-sans text-xs font-bold uppercase tracking-[0.1em]">
                  by Jordan Vale
                </span>
              </div>
            </div>
          </Placeholder>

          {/* "Bestseller" sticker overlapping the top corner. */}
          <Badge
            color={colors.sticker}
            size="md"
            shadow="hard"
            className="absolute -right-3 -top-3 z-20 rotate-6 sm:-right-4 sm:-top-4"
          >
            <Star className="h-3.5 w-3.5 fill-current" aria-hidden />
            Bestseller
          </Badge>
        </div>
      </div>
    </Section>
  );
}
