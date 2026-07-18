import type { ComponentProps } from "react";
import { ArrowRight, Check, PlayCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Heading } from "@/components/ui/heading";
import { Placeholder } from "@/components/ui/placeholder";
import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/quiz/reveal";
import { cn } from "@/lib/utils";

/** Full-bleed section background (mirrors the `Section` primitive's options). */
type SectionBackground = NonNullable<ComponentProps<typeof Section>["background"]>;

/** Bright accent used for the checkmarks and the layered media blocks. */
type Accent = "blue" | "mint" | "coral" | "yellow";

export interface HeroSplitProps {
  /** Small uppercase tracked label above the title. */
  eyebrow?: string;
  /** Anton display headline. */
  title?: string;
  /** Lead paragraph beneath the headline. */
  body?: string;
  /** Short benefit bullets, each rendered with a checkmark. Pass `[]` to hide. */
  bullets?: string[];
  /** Primary call-to-action. Pass `null` to hide it. */
  cta?: { label: string; href: string } | null;
  /** Label shown inside the media placeholder. */
  mediaLabel?: string;
  /** Flip the layout so the media sits on the left at `lg`. */
  reverse?: boolean;
  /** Full-bleed section color block behind the split. */
  background?: SectionBackground;
  /** Fade + rise the content on scroll; disable to render statically. */
  revealContent?: boolean;
}

/** Maps an accent to its literal Tailwind bg class (kept static for JIT scanning). */
const accentBg: Record<Accent, string> = {
  blue: "bg-blue",
  mint: "bg-mint",
  coral: "bg-coral",
  yellow: "bg-yellow",
};

/**
 * Contrast-safe accent trio per section color, so the split looks great on any
 * background: `check` circles, the `media` block, and its offset `backing` block.
 */
const scheme: Record<SectionBackground, { check: Accent; media: Accent; backing: Accent }> = {
  paper: { check: "mint", media: "blue", backing: "yellow" },
  cream: { check: "mint", media: "coral", backing: "blue" },
  blue: { check: "yellow", media: "coral", backing: "mint" },
  mint: { check: "coral", media: "blue", backing: "yellow" },
  coral: { check: "yellow", media: "blue", backing: "mint" },
  yellow: { check: "coral", media: "blue", backing: "mint" },
  ink: { check: "yellow", media: "coral", backing: "mint" },
  gray: { check: "mint", media: "blue", backing: "coral" },
};

const DEFAULT_BULLETS = [
  "Frameworks you can run on your very next call",
  "Real teardown clips from live prospecting sessions",
  "Copy-paste templates for email, DMs, and voicemail",
  "A community of reps leveling up every single week",
];

/**
 * A split feature/intro section: an eyebrow, display heading, lead paragraph,
 * checkmark bullets, and a CTA on one side; a rotated, hard-shadowed media
 * placeholder on the other. Columns stack on mobile and sit side-by-side at
 * `lg`. `reverse` flips which side the media is on. Renders fully with no props.
 */
export function HeroSplit({
  eyebrow = "The Closer method",
  title = "Turn cold outreach into booked meetings",
  body = "Closer hands ambitious reps a repeatable system for starting conversations, handling pushback, and moving deals forward, minus the cringe.",
  bullets = DEFAULT_BULLETS,
  cta = { label: "Start free", href: "/start" },
  mediaLabel = "Watch the 2-min intro",
  reverse = false,
  background = "cream",
  revealContent = true,
}: HeroSplitProps = {}) {
  const colors = scheme[background];
  // Keep the CTA readable on any block: black button on brights, yellow on ink.
  const ctaVariant = background === "ink" ? "yellow" : "ink";

  return (
    <Section background={background} padding="lg">
      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Text column */}
        <Reveal stagger enabled={revealContent} className={cn(reverse && "lg:order-2")}>
          {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}

          {title ? (
            <Heading as={2} size="xl" className={cn("text-balance", eyebrow && "mt-4")}>
              {title}
            </Heading>
          ) : null}

          {body ? (
            <p className="mt-5 max-w-prose text-pretty text-lg font-medium leading-relaxed">
              {body}
            </p>
          ) : null}

          {bullets.length > 0 ? (
            <ul className="mt-8 flex flex-col gap-3">
              {bullets.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span
                    className={cn(
                      "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border-[2.5px] border-ink shadow-hard-xs",
                      accentBg[colors.check],
                    )}
                  >
                    <Check className="size-3.5 text-ink" strokeWidth={3} aria-hidden="true" />
                  </span>
                  <span className="text-base font-medium leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          ) : null}

          {cta ? (
            <div className="mt-8">
              <Button href={cta.href} variant={ctaVariant} size="lg">
                {cta.label}
                <ArrowRight className="size-5" aria-hidden="true" />
              </Button>
            </div>
          ) : null}
        </Reveal>

        {/* Media column */}
        <div className={cn("relative", reverse && "lg:order-1")}>
          {/* Offset accent block for a layered, sticker-sheet depth. */}
          <div
            aria-hidden="true"
            className={cn(
              "absolute inset-0 rounded-2xl border-[2.5px] border-ink",
              accentBg[colors.backing],
              reverse ? "rotate-3" : "-rotate-3",
            )}
          />
          <Placeholder
            aspect="4/3"
            color={colors.media}
            className={cn("relative shadow-hard-lg", reverse ? "-rotate-2" : "rotate-2")}
          >
            <div className="relative z-10 flex flex-col items-center gap-4 px-6 text-center">
              <span className="grid size-16 place-items-center rounded-full border-[2.5px] border-ink bg-paper text-ink shadow-hard-sm">
                <PlayCircle className="size-8" strokeWidth={2.5} aria-hidden="true" />
              </span>
              <span className="font-sans text-sm font-bold uppercase tracking-wide">
                {mediaLabel}
              </span>
            </div>
          </Placeholder>
        </div>
      </div>
    </Section>
  );
}
