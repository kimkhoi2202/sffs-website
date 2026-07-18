import { cn } from "@/lib/utils";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/quiz/reveal";

/** A single statistic: a big display number and a short caption. */
export interface Stat {
  /** Headline figure, e.g. "250k+", "37%", "1,200". */
  value: string;
  /** Short uppercase caption shown beneath the number. */
  label: string;
}

/** Section color block for the band. Mirrors the <Section> palette. */
export type StatBandBackground =
  | "ink"
  | "paper"
  | "cream"
  | "blue"
  | "mint"
  | "coral"
  | "yellow"
  | "gray";

/**
 * Number of columns on desktop. Mobile always renders 2-up. When omitted, a
 * sensible count is derived from how many stats are supplied.
 */
export type StatColumns = 2 | 3 | 4;

export interface StatBandProps {
  /** Small tracked label above the title. */
  eyebrow?: string;
  /** Optional heading above the stats. */
  title?: string;
  /** 3-4 stats read best; a sensible default set renders when omitted. */
  stats?: Stat[];
  /**
   * Desktop column count. Omit to derive one from `stats.length` (e.g. 3 stats
   * span 3 even columns with no empty cell; 4 keep the classic 4-up band).
   * Mobile always stays 2-up.
   */
  columns?: StatColumns;
  /** Full-bleed color block. Defaults to "ink" (white text). */
  background?: StatBandBackground;
  /** Extra classes for the outer <Section>. */
  className?: string;
  /** Fade + rise the header and stagger the stat cells on scroll. */
  revealContent?: boolean;
}

const DEFAULT_STATS: Stat[] = [
  { value: "250k+", label: "Reps trained" },
  { value: "37%", label: "Avg. win-rate lift" },
  { value: "1,200", label: "Cold calls / week" },
  { value: "4.9/5", label: "Coach rating" },
];

/*
  Grid + divider utilities keyed by desktop column count (mobile is always
  2-up). Kept as whole literal strings so Tailwind can statically detect every
  class. Borders are drawn only *between* cells via nth-child width rules; the
  color is applied separately (below) so lines stay visible on dark vs. light.
  The `4` entry reproduces the original 2-up→4-up band exactly.
*/
const GRID_COLS: Record<1 | 2 | 3 | 4, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-2 lg:grid-cols-4",
};

const DIVIDERS: Record<1 | 2 | 3 | 4, string> = {
  1: "",
  2: "[&>*:nth-child(2n)]:border-l-[2.5px] [&>*:nth-child(n+3)]:border-t-[2.5px]",
  3: "[&>*:nth-child(2n)]:border-l-[2.5px] [&>*:nth-child(n+3)]:border-t-[2.5px] lg:[&>*]:border-t-0 lg:[&>*]:border-l-[2.5px] lg:[&>*:nth-child(3n+1)]:border-l-0 lg:[&>*:nth-child(n+4)]:border-t-[2.5px]",
  4: "[&>*:nth-child(2n)]:border-l-[2.5px] [&>*:nth-child(n+3)]:border-t-[2.5px] lg:[&>*]:border-t-0 lg:[&>*]:border-l-[2.5px] lg:[&>*:nth-child(4n+1)]:border-l-0 lg:[&>*:nth-child(n+5)]:border-t-[2.5px]",
};

/** Pick a sensible desktop column count from how many stats were supplied. */
function resolveStatColumns(count: number): 1 | 2 | 3 | 4 {
  if (count <= 1) return 1;
  if (count === 2) return 2;
  if (count === 3) return 3;
  return 4;
}

/**
 * StatBand, a bold band of huge Anton numbers with uppercase labels,
 * separated by thick dividers inside a full-bleed color block. Renders great
 * with no props; every field is overridable and type-safe. Server Component.
 */
export function StatBand({
  eyebrow,
  title,
  stats = DEFAULT_STATS,
  columns,
  background = "ink",
  className,
  revealContent = true,
}: StatBandProps) {
  const isDark = background === "ink";
  const hasHeader = Boolean(eyebrow || title);
  const cols = columns ?? resolveStatColumns(stats.length);
  const dividerColor = isDark ? "[&>*]:border-paper" : "[&>*]:border-ink";

  return (
    <Section background={background} padding="lg" bordered className={className}>
      {hasHeader && (
        <Reveal
          stagger
          enabled={revealContent}
          className="mb-10 flex flex-col items-center text-center md:mb-14"
        >
          {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
          {title && (
            <Heading as={2} size="lg" className={cn(eyebrow && "mt-3")}>
              {title}
            </Heading>
          )}
        </Reveal>
      )}

      <Reveal
        as="dl"
        stagger
        enabled={revealContent}
        className={cn("grid", GRID_COLS[cols], dividerColor, DIVIDERS[cols])}
      >
        {stats.map((stat, i) => (
          <div
            key={`${stat.value}-${i}`}
            className="flex flex-col-reverse items-center justify-center gap-2 px-4 py-8 text-center md:gap-3 md:px-6 md:py-10"
          >
            <dt className="eyebrow opacity-70">{stat.label}</dt>
            <dd className="font-display text-[clamp(2rem,9vw,3rem)] leading-none tracking-[-0.01em] tabular-nums sm:text-6xl lg:text-7xl">
              {stat.value}
            </dd>
          </div>
        ))}
      </Reveal>
    </Section>
  );
}
