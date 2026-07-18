import * as React from "react";
import { ArrowRight, Star, TrendingUp } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Heading } from "@/components/ui/heading";
import { Placeholder } from "@/components/ui/placeholder";
import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/quiz/reveal";
import { cn } from "@/lib/utils";

/** Section background block color (matches the shared <Section> palette). */
type HeroBackground =
  | "paper"
  | "cream"
  | "ink"
  | "blue"
  | "mint"
  | "coral"
  | "yellow"
  | "gray";

export interface HeroCta {
  label: string;
  href: string;
}

export interface HeroProps {
  /** Small uppercase tracked label above the headline. */
  eyebrow?: string;
  /** The big display headline. Pass a fragment with <br /> for a controlled 2-line break. */
  title?: React.ReactNode;
  /** Supporting lead paragraph under the headline. */
  subtitle?: string;
  /** Primary (coral) call-to-action. */
  primaryCta?: HeroCta;
  /** Secondary (paper) call-to-action. */
  secondaryCta?: HeroCta;
  /** Label shown inside the media placeholder. */
  mediaLabel?: string;
  /** Full-bleed section block color. */
  background?: HeroBackground;
  /** Fade + rise the content on scroll; disable to render statically. */
  revealContent?: boolean;
  /** Extra classes forwarded to the outer <Section>. */
  className?: string;
}

const DEFAULT_AVATARS: { initials: string; color: "blue" | "coral" | "yellow" | "mint" }[] = [
  { initials: "AV", color: "coral" },
  { initials: "JL", color: "yellow" },
  { initials: "MR", color: "mint" },
  { initials: "KP", color: "blue" },
];

/** Row of 5 filled stars; inherits color via `fill-current` so it adapts to any surface. */
function StarRow({ className }: { className?: string }) {
  return (
    <div
      className={cn("flex items-center gap-0.5", className)}
      role="img"
      aria-label="Rated 5 out of 5 stars"
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className="h-4 w-4 fill-current" aria-hidden />
      ))}
    </div>
  );
}

/**
 * Hero, the primary landing section.
 *
 * Full-bleed color-blocked <Section> with a two-column layout on `lg` (stacked on
 * mobile): a headline + lead + dual CTAs + social proof on one side, and a media
 * placeholder framed by rotated "sticker" cards on the other. Renders great with no
 * props (tasteful placeholder data baked in) and accepts typed overrides.
 */
export function Hero({
  eyebrow = "Free weekly sales playbook",
  title,
  subtitle = "Closer turns cold prospects into booked pipeline with battle-tested scripts, live call teardowns, and frameworks trusted by 250k+ quota-crushing reps.",
  primaryCta = { label: "Start learning free", href: "/courses" },
  secondaryCta = { label: "Watch the demo", href: "/demo" },
  mediaLabel = "Live cold-call teardown",
  background = "blue",
  revealContent = true,
  className,
}: HeroProps) {
  const headline = title ?? (
    <>
      Outbound that
      <br />
      actually books meetings
    </>
  );

  return (
    <Section
      background={background}
      padding="lg"
      bordered
      className={cn("overflow-x-clip", className)}
    >
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        {/* Main column */}
        <Reveal stagger enabled={revealContent} className="flex flex-col items-start">
          <Eyebrow>{eyebrow}</Eyebrow>

          <Heading size="display" className="mt-4">
            {headline}
          </Heading>

          <p className="mt-6 max-w-prose text-lg font-medium opacity-90 md:text-xl">
            {subtitle}
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
            <Button href={primaryCta.href} variant="coral" size="lg">
              {primaryCta.label}
              <ArrowRight className="h-5 w-5" aria-hidden />
            </Button>
            <Button href={secondaryCta.href} variant="paper" size="lg">
              {secondaryCta.label}
            </Button>
          </div>

          {/* Social proof */}
          <div className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-3">
            <div className="flex -space-x-3">
              {DEFAULT_AVATARS.map((avatar) => (
                <Avatar
                  key={avatar.initials}
                  initials={avatar.initials}
                  color={avatar.color}
                  size="md"
                />
              ))}
            </div>
            <div>
              <StarRow />
              <p className="mt-1 text-sm font-bold">Joined by 250k+ sellers</p>
            </div>
          </div>
        </Reveal>

        {/* Media column */}
        <div className="relative mx-auto w-full max-w-md lg:mx-0 lg:max-w-none">
          <Placeholder
            aspect="4/3"
            color="mint"
            label={mediaLabel}
            className="shadow-hard-lg"
          />

          {/* Sticker: rating (top-left) */}
          <Card
            color="paper"
            padding="sm"
            shadow="md"
            className="absolute -left-4 -top-6 z-10 -rotate-3"
          >
            <StarRow />
            <p className="mt-1 text-xs font-bold uppercase tracking-wide">4.9/5 rating</p>
          </Card>

          {/* Sticker: pill badge (mid-right) */}
          <Badge
            color="coral"
            size="md"
            shadow="hard"
            className="absolute -right-3 top-8 z-10 rotate-6"
          >
            <Star className="h-3.5 w-3.5 fill-current" aria-hidden />
            #1 sales course
          </Badge>

          {/* Sticker: stat (bottom-right) */}
          <Card
            color="yellow"
            padding="sm"
            shadow="md"
            className="absolute -bottom-6 -right-4 z-10 rotate-3"
          >
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-[2.5px] border-ink bg-paper">
                <TrendingUp className="h-4 w-4" aria-hidden />
              </span>
              <div className="leading-none">
                <div className="font-display text-2xl leading-none">+37%</div>
                <div className="mt-0.5 text-[0.65rem] font-bold uppercase tracking-wide">
                  reply rate
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Section>
  );
}
