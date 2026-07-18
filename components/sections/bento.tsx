import type { LucideIcon } from "lucide-react";
import {
  Clock,
  PhoneCall,
  PlayCircle,
  Quote as QuoteIcon,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Heading } from "@/components/ui/heading";
import { Placeholder } from "@/components/ui/placeholder";
import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/quiz/reveal";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

type BentoColor = "blue" | "mint" | "coral" | "yellow" | "paper" | "cream" | "ink";
type Span = 1 | 2;

interface BentoTileBase {
  /** Columns to span. `2` = full width on mobile / half at `lg`. Default `1`. */
  colSpan?: Span;
  /** Rows to span (applied at `lg`+ only, so mobile always stacks cleanly). Default `1`. */
  rowSpan?: Span;
  /** Accent background for the tile. Default `paper`. */
  color?: BentoColor;
}

/** Big Anton number + short label. */
interface BentoStatTile extends BentoTileBase {
  type: "stat";
  value: string;
  label: string;
  icon?: LucideIcon;
}

/** Icon + heading + supporting body. */
interface BentoFeatureTile extends BentoTileBase {
  type: "feature";
  icon: LucideIcon;
  title: string;
  body?: string;
}

/** A `<Placeholder>` media block with an optional badge + caption. */
interface BentoMediaTile extends BentoTileBase {
  type: "media";
  label?: string;
  badge?: string;
}

/** A short pull-quote with attribution. */
interface BentoQuoteTile extends BentoTileBase {
  type: "quote";
  quote: string;
  author?: string;
  role?: string;
}

export type BentoTile =
  | BentoStatTile
  | BentoFeatureTile
  | BentoMediaTile
  | BentoQuoteTile;

type SectionBackground =
  | "paper"
  | "cream"
  | "ink"
  | "blue"
  | "mint"
  | "coral"
  | "yellow"
  | "gray";

export interface BentoProps {
  /** Small uppercase label above the heading. */
  eyebrow?: string;
  /** Anton display heading rendered above the grid. */
  title?: string;
  /** Optional supporting sentence under the heading. */
  description?: string;
  /** Full-bleed section background the tiles sit on. */
  background?: SectionBackground;
  /** Override the default tile arrangement entirely. */
  items?: BentoTile[];
  /** Fade + rise the inner content on scroll; disable to render statically. */
  revealContent?: boolean;
  className?: string;
  id?: string;
}

/* -------------------------------------------------------------------------- */
/*  Span helpers (full literal classes so Tailwind can detect them)           */
/* -------------------------------------------------------------------------- */

const colSpanClass: Record<Span, string> = {
  1: "col-span-1",
  2: "col-span-1 sm:col-span-2",
};
const lgColSpanClass: Record<Span, string> = {
  1: "lg:col-span-1",
  2: "lg:col-span-2",
};
const lgRowSpanClass: Record<Span, string> = {
  1: "lg:row-span-1",
  2: "lg:row-span-2",
};

function spanClasses(tile: BentoTile): string {
  const c = tile.colSpan ?? 1;
  const r = tile.rowSpan ?? 1;
  return cn(colSpanClass[c], lgColSpanClass[c], lgRowSpanClass[r]);
}

function statValueSize(rowSpan?: Span): string {
  return rowSpan === 2
    ? "text-[clamp(3.25rem,6vw,4.75rem)]"
    : "text-[clamp(2.75rem,5vw,3.75rem)]";
}

/** Placeholder's palette omits `paper`; fall back to a neutral for it. */
function placeholderColor(
  color: BentoColor,
): "blue" | "mint" | "coral" | "yellow" | "cream" | "gray" | "ink" {
  return color === "paper" ? "gray" : color;
}

/* -------------------------------------------------------------------------- */
/*  Sub-parts                                                                  */
/* -------------------------------------------------------------------------- */

function IconChip({
  icon: Icon,
  tone = "light",
}: {
  icon: LucideIcon;
  /** `dark` = the tile is dark, so the chip pops in yellow. */
  tone?: "light" | "dark";
}) {
  return (
    <span
      className={cn(
        "grid size-12 shrink-0 place-items-center rounded-full border-[2.5px] border-ink",
        tone === "dark" ? "bg-yellow text-ink" : "bg-ink text-paper",
      )}
    >
      <Icon className="size-5" strokeWidth={2.5} aria-hidden />
    </span>
  );
}

function BentoTileView({ tile }: { tile: BentoTile }) {
  const color = tile.color ?? "paper";
  const isDark = color === "ink";
  const chipTone = isDark ? "dark" : "light";
  const span = spanClasses(tile);
  const big = (tile.colSpan ?? 1) === 2 && (tile.rowSpan ?? 1) === 2;
  const shadow = big || (tile.rowSpan ?? 1) === 2 ? "lg" : "md";

  if (tile.type === "media") {
    return (
      <Placeholder
        color={placeholderColor(color)}
        aspect="auto"
        className={cn("h-full min-h-[14rem] shadow-hard-lg sm:min-h-[16rem]", span)}
      >
        <div className="relative z-10 flex h-full w-full flex-col justify-between p-5">
          <div className="flex items-start justify-between gap-3">
            <Badge color="paper" shadow="hard">
              {tile.badge ?? "Watch"}
            </Badge>
            <span className="grid size-12 place-items-center rounded-full border-[2.5px] border-ink bg-paper text-ink">
              <PlayCircle className="size-6" strokeWidth={2.5} aria-hidden />
            </span>
          </div>
          <p className="font-display text-2xl uppercase leading-none tracking-[-0.01em]">
            {tile.label ?? "Live deal teardown"}
          </p>
        </div>
      </Placeholder>
    );
  }

  return (
    <Card
      color={color}
      shadow={shadow}
      padding="md"
      className={cn("flex h-full flex-col card-hover", span)}
    >
      {tile.type === "stat" && (
        <>
          {tile.icon ? <IconChip icon={tile.icon} tone={chipTone} /> : null}
          <div className="mt-auto pt-6">
            <div
              className={cn(
                "font-display leading-[0.9] tracking-[-0.01em]",
                statValueSize(tile.rowSpan),
              )}
            >
              {tile.value}
            </div>
            <p className="mt-2 text-sm font-bold uppercase tracking-wide opacity-80">
              {tile.label}
            </p>
          </div>
        </>
      )}

      {tile.type === "feature" && (
        <>
          <IconChip icon={tile.icon} tone={chipTone} />
          <div className="mt-auto pt-6">
            <Heading as={3} size="sm">
              {tile.title}
            </Heading>
            {tile.body ? (
              <p className="mt-2 text-sm leading-snug opacity-80">{tile.body}</p>
            ) : null}
          </div>
        </>
      )}

      {tile.type === "quote" && (
        <>
          <QuoteIcon className="size-8" strokeWidth={2.5} aria-hidden />
          <blockquote className="mt-4 font-display text-lg uppercase leading-[1.1] tracking-[-0.01em] sm:text-xl">
            {`\u201C${tile.quote}\u201D`}
          </blockquote>
          {tile.author || tile.role ? (
            <p className="mt-auto pt-6 text-sm font-bold uppercase tracking-wide opacity-80">
              {tile.author ? <cite className="not-italic">{tile.author}</cite> : null}
              {tile.author && tile.role ? " \u00B7 " : null}
              {tile.role}
            </p>
          ) : null}
        </>
      )}
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*  Default content (original placeholder copy for the "Closer" brand)        */
/* -------------------------------------------------------------------------- */

const defaultItems: BentoTile[] = [
  {
    type: "media",
    color: "blue",
    colSpan: 2,
    rowSpan: 2,
    badge: "Watch",
    label: "Live deal teardown",
  },
  {
    type: "stat",
    color: "ink",
    rowSpan: 2,
    icon: TrendingUp,
    value: "3.4x",
    label: "More pipeline per rep in 90 days",
  },
  {
    type: "quote",
    color: "paper",
    colSpan: 2,
    quote: "I booked three meetings the morning after session one.",
    author: "Riley Okafor",
    role: "SDR, Northwind",
  },
  {
    type: "stat",
    color: "yellow",
    icon: Zap,
    value: "92%",
    label: "Of reps who finish week one keep going",
  },
  {
    type: "stat",
    color: "coral",
    icon: Clock,
    value: "18min",
    label: "Average time to a booked meeting",
  },
  {
    type: "feature",
    color: "mint",
    icon: Target,
    title: "Discovery that finds the budget",
    body: "A question map that surfaces pain, power, and dollars fast.",
  },
  {
    type: "feature",
    color: "cream",
    icon: PhoneCall,
    title: "Openers they don't hang up on",
    body: "Pattern-interrupt scripts tuned for cold outbound.",
  },
];

/* -------------------------------------------------------------------------- */
/*  Section                                                                    */
/* -------------------------------------------------------------------------- */

export function Bento({
  eyebrow = "The Closer system",
  title = "A toolkit that books more meetings",
  description = "Real reps, real quota. Every piece is built to get you scheduling meetings before the end of your first week.",
  background = "paper",
  items = defaultItems,
  revealContent = true,
  className,
  id,
}: BentoProps) {
  return (
    <Section background={background} bordered id={id} className={className}>
      <Reveal stagger enabled={revealContent} className="max-w-2xl">
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        {title ? (
          <Heading as={2} size="lg" className="mt-3">
            {title}
          </Heading>
        ) : null}
        {description ? (
          <p className="mt-4 text-lg font-medium opacity-80">{description}</p>
        ) : null}
      </Reveal>

      <Reveal
        as="div"
        stagger
        enabled={revealContent}
        className="mt-10 grid grid-cols-1 gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-5 lg:grid-flow-row-dense lg:auto-rows-[minmax(13rem,auto)] lg:grid-cols-4"
      >
        {items.map((tile, i) => (
          <BentoTileView key={i} tile={tile} />
        ))}
      </Reveal>
    </Section>
  );
}
