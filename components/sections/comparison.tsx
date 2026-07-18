import { Check, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/quiz/reveal";
import { cn } from "@/lib/utils";

/** Full-bleed section background (mirrors the `Section` primitive's options). */
export type ComparisonBackground =
  | "paper"
  | "cream"
  | "ink"
  | "blue"
  | "mint"
  | "coral"
  | "yellow"
  | "gray";

export interface ComparisonProps {
  /** Small tracked label above the heading. */
  eyebrow?: string;
  /** Section heading. */
  title?: string;
  /** Heading for the muted "before" column. */
  theirLabel?: string;
  /** Heading for the highlighted "after" column. */
  ourLabel?: string;
  /** Pain-point bullets for the "before" column, each gets an X. */
  theirPoints?: string[];
  /** Benefit bullets for the "after" column, each gets a Check. */
  ourPoints?: string[];
  /** Full-bleed section background color. */
  background?: ComparisonBackground;
  /** Fade + rise the inner content on scroll while the section bg stays static. */
  revealContent?: boolean;
}

const DEFAULT_THEIR_POINTS: string[] = [
  "Improvise every cold call and hope the right words show up.",
  "Blast the same generic pitch to every lead on the list.",
  "Scrape together tips from random threads and dusty PDFs.",
  "Find out a deal stalled only after it has gone cold.",
  "Track next steps in a spreadsheet nobody remembers to open.",
];

const DEFAULT_OUR_POINTS: string[] = [
  "Open with proven frameworks built for real objections.",
  "Focus each day on the accounts most likely to close.",
  "Learn in short, practical lessons you can use on the next call.",
  "Spot at-risk deals early with clear pipeline signals.",
  "Keep every next step in one simple, shared view.",
];

/**
 * A color-blocked "old way vs. with Closer" comparison. Pairs an eyebrow +
 * heading with two bordered columns that stack on mobile: a muted "before"
 * column (coral X per row) beside a bright, hard-shadowed, emphasized
 * "after" column (ink circle Check per row + a "Recommended" badge). Renders
 * fully with no props and accepts typed overrides.
 */
export function Comparison({
  eyebrow = "Why switch",
  title = "The old way vs. with Closer",
  theirLabel = "The old way",
  ourLabel = "With Closer",
  theirPoints = DEFAULT_THEIR_POINTS,
  ourPoints = DEFAULT_OUR_POINTS,
  background = "cream",
  revealContent = true,
}: ComparisonProps = {}) {
  // Cross-column alignment: both columns are laid into one CSS grid that shares
  // row tracks (via `subgrid`). Row 1 holds each header + its divider; the
  // remaining rows hold one bullet each, sized to the taller column. This keeps
  // headers, dividers, and corresponding bullets on the same baseline even when
  // text wraps to a different number of lines, and degrades gracefully when the
  // two columns hold a different number of points (the shorter column simply
  // leaves its trailing rows empty). `rowCount` is the number of bullet rows.
  const rowCount = Math.max(theirPoints.length, ourPoints.length);

  return (
    <Section background={background} padding="lg">
      {(eyebrow || title) && (
        <Reveal stagger enabled={revealContent} className="mx-auto max-w-2xl text-center">
          {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
          {title && (
            <Heading as={2} size="xl" className={cn(eyebrow && "mt-3")}>
              {title}
            </Heading>
          )}
        </Reveal>
      )}

      <Reveal
        enabled={revealContent}
        className="mx-auto mt-10 flex max-w-4xl flex-col gap-6 md:mt-14 md:grid md:grid-cols-2 md:items-stretch md:gap-x-8 md:gap-y-3"
        style={{ gridTemplateRows: `auto repeat(${rowCount}, auto)` }}
      >
        {/* The old way, muted, drawbacks marked with a coral X. The card spans
            every shared row track so its background/border is one full-height
            column behind the subgridded header + bullets. */}
        <Card
          color="paper"
          shadow="sm"
          padding="lg"
          className="flex flex-col gap-y-3 bg-gray-100 md:row-span-full md:grid md:grid-rows-subgrid"
        >
          <div className="flex min-h-9 items-center justify-between gap-3 border-b-2 border-ink pb-4">
            <Heading as={3} size="sm">
              {theirLabel}
            </Heading>
          </div>
          <ul
            role="list"
            className="flex flex-col gap-y-3 md:grid md:grid-rows-subgrid"
            style={{ gridRow: "2 / -1" }}
          >
            {theirPoints.map((point, index) => (
              <li
                key={`their-${index}`}
                className="flex items-start gap-3 text-base font-medium leading-snug text-ink/80"
              >
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border-[2.5px] border-ink bg-coral text-ink">
                  <span className="sr-only">Drawback: </span>
                  <X className="size-3.5" strokeWidth={3} aria-hidden="true" />
                </span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* With Closer, bright accent, benefits marked with a Check. Emphasis
            comes from the mint fill + larger hard shadow + border + badge (and
            z-10), NOT a vertical offset, so both card tops stay aligned. */}
        <Card
          color="mint"
          shadow="lg"
          padding="lg"
          className="relative z-10 flex flex-col gap-y-3 md:row-span-full md:grid md:grid-rows-subgrid"
        >
          <div className="flex min-h-9 items-center justify-between gap-3 border-b-2 border-ink pb-4">
            <Heading as={3} size="sm">
              {ourLabel}
            </Heading>
            <Badge color="yellow" size="sm" shadow="hard">
              Recommended
            </Badge>
          </div>
          <ul
            role="list"
            className="flex flex-col gap-y-3 md:grid md:grid-rows-subgrid"
            style={{ gridRow: "2 / -1" }}
          >
            {ourPoints.map((point, index) => (
              <li
                key={`our-${index}`}
                className="flex items-start gap-3 text-base font-medium leading-snug"
              >
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border-[2.5px] border-ink bg-ink text-mint">
                  <span className="sr-only">Better with Closer: </span>
                  <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
                </span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </Card>
      </Reveal>
    </Section>
  );
}
