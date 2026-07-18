import type { ComponentProps } from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Sparkles, Target, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Heading } from "@/components/ui/heading";
import { Placeholder } from "@/components/ui/placeholder";
import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/quiz/reveal";
import { cn } from "@/lib/utils";

type SectionBackground = NonNullable<ComponentProps<typeof Section>["background"]>;
type BadgeColor = NonNullable<ComponentProps<typeof Badge>["color"]>;

export interface PageHeroProps {
  /** Small uppercase tracked label above the title. Pass `null` to hide it. */
  eyebrow?: string | null;
  /** Main display heading, rendered as the page `h1` in uppercase Anton. */
  title?: string;
  /** Supporting sentence beneath the title. Pass `null` to hide it. */
  subtitle?: string | null;
  /** Optional single call-to-action button. Pass `null` to hide it. */
  cta?: { label: string; href: string } | null;
  /**
   * Optional secondary call-to-action rendered beside the primary `cta` as a
   * quieter paper pill. Omitted = only the primary button (current behavior).
   */
  secondaryCta?: { label: string; href: string };
  /**
   * Optional on-brand decorative sticker badge shown above the eyebrow in BOTH
   * `align="left"` and `align="center"`. Omitted = no badge (current behavior).
   */
  badge?: string;
  /**
   * Optional media label. When provided, renders a bordered 16/9 `<Placeholder>`
   * and switches to a two-column copy + media split that stacks on mobile.
   * Omitted = the current single-column (centered/left) layout, unchanged.
   */
  mediaLabel?: string;
  /**
   * Optional small muted sub-CTA line rendered under the buttons
   * (e.g. "No cost. Live sessions + recordings."). Omitted = none.
   */
  note?: string;
  /** Content alignment. `center` also shows a decorative row of sticker badges. */
  align?: "left" | "center";
  /** Full-bleed section color block behind the header. */
  background?: SectionBackground;
  /** Fade + rise the content on scroll; disable to render statically. */
  revealContent?: boolean;
}

const DEFAULT_EYEBROW = "The Closer Playbook";
const DEFAULT_TITLE = "Turn every rep into a closer";
const DEFAULT_SUBTITLE =
  "Bite-sized playbooks, live coaching, and battle-tested templates that help revenue teams book more meetings and win more deals.";
const DEFAULT_CTA = { label: "Start free", href: "/start" } as const;

/** Decorative stickers shown only when the header is centered. */
const DECOR_STICKERS: ReadonlyArray<{ label: string; color: BadgeColor; icon: LucideIcon }> = [
  { label: "Playbooks", color: "blue", icon: Target },
  { label: "Live coaching", color: "coral", icon: Zap },
  { label: "Templates", color: "yellow", icon: Sparkles },
];

const STICKER_ROTATIONS = ["-rotate-3", "rotate-2", "-rotate-2"] as const;

/**
 * Compact subpage header. Sits at the top of interior pages, shorter and punchier
 * than the main landing hero. Renders a finished, on-brand header with no props and
 * is fully overridable via typed props.
 */
export function PageHero({
  eyebrow = DEFAULT_EYEBROW,
  title = DEFAULT_TITLE,
  subtitle = DEFAULT_SUBTITLE,
  cta = DEFAULT_CTA,
  secondaryCta,
  badge,
  mediaLabel,
  note,
  align = "center",
  background = "cream",
  revealContent = true,
}: PageHeroProps = {}) {
  // A media label switches on the two-column split; that layout reads best with a
  // left-aligned copy column, so `center` collapses to left only in split mode.
  const hasMedia = Boolean(mediaLabel);
  const isCenter = align === "center" && !hasMedia;
  // Keep the CTA readable on any block: black button on brights, yellow on ink.
  const ctaVariant = background === "ink" ? "yellow" : "ink";
  // Decorative sticker: keep it off the same hue as the block so it always pops.
  const badgeColor: BadgeColor = background === "yellow" ? "blue" : "yellow";

  const copy = (
    <Reveal stagger enabled={revealContent} className={cn("flex flex-col", isCenter ? "items-center text-center" : "items-start text-left")}>
      {badge ? (
        <Badge color={badgeColor} shadow="hard" className="mb-4 -rotate-3">
          {badge}
        </Badge>
      ) : null}

      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}

      <Heading size="xl" className={cn("text-balance", (eyebrow || badge) && "mt-4")}>
        {title}
      </Heading>

      {subtitle ? (
        <p className="mt-4 max-w-[42rem] text-pretty text-lg font-medium leading-relaxed md:text-xl">
          {subtitle}
        </p>
      ) : null}

      {cta || secondaryCta ? (
        <div className={cn("mt-7 flex flex-wrap gap-3", isCenter && "justify-center")}>
          {cta ? (
            <Button href={cta.href} variant={ctaVariant} size="lg">
              {cta.label}
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Button>
          ) : null}
          {secondaryCta ? (
            <Button href={secondaryCta.href} variant="paper" size="lg">
              {secondaryCta.label}
            </Button>
          ) : null}
        </div>
      ) : null}

      {note ? (
        <p className="mt-4 max-w-[42rem] text-pretty text-sm font-medium leading-relaxed opacity-70">
          {note}
        </p>
      ) : null}

      {isCenter ? (
        <div
          className="mt-8 flex select-none flex-wrap items-center justify-center gap-3"
          aria-hidden="true"
        >
          {DECOR_STICKERS.map((sticker, i) => {
            const Icon = sticker.icon;
            return (
              <Badge
                key={sticker.label}
                color={sticker.color}
                shadow="hard"
                className={STICKER_ROTATIONS[i % STICKER_ROTATIONS.length]}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {sticker.label}
              </Badge>
            );
          })}
        </div>
      ) : null}
    </Reveal>
  );

  return (
    <Section as="header" background={background} padding="md" bordered>
      {hasMedia ? (
        <div className="grid items-center gap-8 md:gap-12 lg:grid-cols-2">
          {copy}
          <Placeholder aspect="16/9" label={mediaLabel} />
        </div>
      ) : (
        copy
      )}
    </Section>
  );
}
