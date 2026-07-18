import { Calendar, Clock, Headphones, Play } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Heading } from "@/components/ui/heading";
import { Placeholder } from "@/components/ui/placeholder";
import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/quiz/reveal";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

/** Bright accent used for an episode's cover tile. Rotates when omitted. */
export type EpisodeAccent = "blue" | "mint" | "coral" | "yellow";

/** Full-bleed section background (mirrors the `Section` primitive's options). */
export type PodcastBackground =
  | "paper"
  | "cream"
  | "ink"
  | "blue"
  | "mint"
  | "coral"
  | "yellow"
  | "gray";

/** A "listen on" pill rendered under the featured episode. */
export interface PlatformLink {
  /** Visible label, e.g. "Spotify". Rendered UPPERCASE by the pill. */
  label: string;
  /** Where the pill links. Defaults to `"#"`. */
  href?: string;
}

export interface Episode {
  /** Episode number shown in the cover badge, e.g. `48`. */
  number?: number;
  title: string;
  /** Short summary shown under the title. */
  description?: string;
  /** Duration label, e.g. "34 min". */
  duration?: string;
  /** Publish date label, e.g. "Jul 14, 2026". */
  date?: string;
  /** Overrides the rotating cover accent color. */
  accent?: EpisodeAccent;
  /** Optional link for the title + play button (episode/listen page). */
  href?: string;
}

export interface PodcastEpisodeProps {
  /** The episode to render. Falls back to an original placeholder episode. */
  episode?: Episode;
  /** Index used to rotate the cover accent when `episode.accent` is unset. */
  index?: number;
  className?: string;
}

export interface PodcastListProps {
  /** Small uppercase label above the heading. Pass `""` to hide. */
  eyebrow?: string;
  /** Anton display heading for the section. */
  title?: string;
  /** Optional lead paragraph under the heading. */
  description?: string;
  /** Episode data. Falls back to a set of original placeholder episodes. */
  episodes?: Episode[];
  /** "Listen on" pills shown with the featured episode. */
  platforms?: PlatformLink[];
  /** Full-bleed section background the content sits on. */
  background?: PodcastBackground;
  /** Show a large featured card (the latest episode) above the list. */
  featured?: boolean;
  /** Fade + rise the inner content on scroll; disable to render statically. */
  revealContent?: boolean;
  id?: string;
  className?: string;
}

/* -------------------------------------------------------------------------- */
/*  Default content (original placeholder copy for the "Closer" brand)         */
/* -------------------------------------------------------------------------- */

const accentRotation: readonly EpisodeAccent[] = ["blue", "coral", "yellow", "mint"];

const defaultEpisodes: Episode[] = [
  {
    number: 48,
    title: "Cold calls they don't hang up on",
    description:
      "Steal the ten-second opener our top reps use to earn the next full minute on every single dial, no clunky script required.",
    duration: "34 min",
    date: "Jul 14, 2026",
    accent: "blue",
  },
  {
    number: 47,
    title: "Turn “just email me” into a meeting",
    description:
      "The three-step reframe that keeps the classic brush-off from quietly ending your best conversations.",
    duration: "28 min",
    date: "Jul 7, 2026",
    accent: "coral",
  },
  {
    number: 46,
    title: "Discovery questions that find the budget",
    description:
      "Map pain straight to dollars so you spend your energy only on the deals that can actually close this quarter.",
    duration: "41 min",
    date: "Jun 30, 2026",
    accent: "yellow",
  },
  {
    number: 45,
    title: "Multi-thread before the deal stalls",
    description:
      "Win the whole buying committee instead of betting an entire quarter on a single champion who might go quiet.",
    duration: "37 min",
    date: "Jun 23, 2026",
    accent: "mint",
  },
  {
    number: 44,
    title: "Follow-ups people actually reply to",
    description:
      "A five-line email framework that revives stalled pipeline without ever sounding like you're begging for a reply.",
    duration: "25 min",
    date: "Jun 16, 2026",
    accent: "blue",
  },
  {
    number: 43,
    title: "Negotiate without discounting your worth",
    description:
      "Hold your price, trade instead of cave, and land deals that respect the value you actually bring to the table.",
    duration: "39 min",
    date: "Jun 9, 2026",
    accent: "coral",
  },
];

const defaultPlatforms: PlatformLink[] = [
  { label: "Spotify", href: "#" },
  { label: "Apple Podcasts", href: "#" },
  { label: "YouTube", href: "#" },
];

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function accentFor(episode: Episode, index: number): EpisodeAccent {
  return episode.accent ?? accentRotation[index % accentRotation.length];
}

/* -------------------------------------------------------------------------- */
/*  Sub-parts                                                                  */
/* -------------------------------------------------------------------------- */

/** Square cover tile with a centered headphones mark + episode-number badge. */
function EpisodeCover({
  accent,
  number,
  featured = false,
}: {
  accent: EpisodeAccent;
  number?: number;
  featured?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative shrink-0",
        featured ? "w-full max-w-[16rem] md:max-w-none" : "size-16 sm:size-24",
      )}
    >
      <Placeholder
        color={accent}
        aspect="1/1"
        rounded={featured ? "rounded-2xl" : "rounded-xl"}
        className={cn("h-full w-full", featured ? "shadow-hard" : "shadow-hard-sm")}
      >
        <Headphones
          aria-hidden
          strokeWidth={2.5}
          className={featured ? "size-12" : "size-6 sm:size-7"}
        />
      </Placeholder>
      {number != null && (
        <Badge
          color="ink"
          size={featured ? "md" : "sm"}
          shadow="hard"
          className={cn("absolute", featured ? "left-3 top-3" : "-left-2 -top-2")}
        >
          {featured ? `Ep ${number}` : `#${number}`}
        </Badge>
      )}
    </div>
  );
}

/** Duration • date, each with a small icon. Uppercase caption styling. */
function MetaRow({
  duration,
  date,
  className,
}: {
  duration?: string;
  date?: string;
  className?: string;
}) {
  if (!duration && !date) return null;
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-bold uppercase tracking-wide opacity-70",
        className,
      )}
    >
      {duration && (
        <span className="inline-flex items-center gap-1.5">
          <Clock aria-hidden strokeWidth={2.5} className="size-4" />
          {duration}
        </span>
      )}
      {duration && date && (
        <span aria-hidden className="opacity-50">
          •
        </span>
      )}
      {date && (
        <span className="inline-flex items-center gap-1.5">
          <Calendar aria-hidden strokeWidth={2.5} className="size-4" />
          {date}
        </span>
      )}
    </div>
  );
}

/** Circular, bordered, coral play button with a hard shadow + press. */
function PlayButton({
  href,
  label,
  size = "md",
}: {
  href?: string;
  label: string;
  size?: "md" | "lg";
}) {
  const big = size === "lg";
  const className = cn(
    "shrink-0 rounded-full p-0",
    big ? "size-16 shadow-hard-lg sm:size-[4.5rem]" : "size-14 shadow-hard",
  );
  const icon = (
    <Play
      aria-hidden
      strokeWidth={2.5}
      className={cn("translate-x-px fill-current", big ? "size-7" : "size-6")}
    />
  );

  if (href) {
    return (
      <Button href={href} variant="coral" aria-label={label} className={className}>
        {icon}
      </Button>
    );
  }
  return (
    <Button type="button" variant="coral" aria-label={label} className={className}>
      {icon}
    </Button>
  );
}

/** Bordered "listen on" pills (Spotify / Apple / YouTube …). */
function PlatformPills({ platforms }: { platforms: PlatformLink[] }) {
  if (platforms.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {platforms.map((platform) => (
        <Button
          key={platform.label}
          href={platform.href ?? "#"}
          variant="paper"
          size="sm"
          className="shadow-hard-xs"
        >
          {platform.label}
        </Button>
      ))}
    </div>
  );
}

/** Large "latest episode" hero card: big cover, description, play + pills. */
function FeaturedEpisode({
  episode,
  platforms,
  index = 0,
  className,
}: {
  episode: Episode;
  platforms: PlatformLink[];
  index?: number;
  className?: string;
}) {
  const accent = accentFor(episode, index);
  return (
    <Card color="paper" shadow="lg" padding="lg" className={className}>
      <div className="grid gap-6 md:grid-cols-[16rem_1fr] md:items-start md:gap-8">
        <EpisodeCover accent={accent} number={episode.number} featured />
        <div className="flex flex-col">
          <div className="flex flex-wrap items-center gap-2">
            <Badge color="coral" shadow="hard">
              <Headphones aria-hidden strokeWidth={2.5} className="size-3.5" />
              Latest episode
            </Badge>
          </div>
          <Heading as={3} size="md" className="mt-4 text-balance">
            {episode.href ? (
              <a
                href={episode.href}
                className="decoration-[2.5px] underline-offset-4 hover:underline"
              >
                {episode.title}
              </a>
            ) : (
              episode.title
            )}
          </Heading>
          {episode.description && (
            <p className="mt-3 max-w-prose text-lg leading-relaxed opacity-80">
              {episode.description}
            </p>
          )}
          <MetaRow duration={episode.duration} date={episode.date} className="mt-4" />
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-4">
            <PlayButton
              href={episode.href}
              label={`Play episode: ${episode.title}`}
              size="lg"
            />
            <PlatformPills platforms={platforms} />
          </div>
        </div>
      </div>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*  Exports                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * A single podcast episode as a compact card/row: a bordered square cover tile
 * (headphones mark + episode-number badge), the title, a short description, a
 * duration • date meta row, and a circular coral play button with a hard
 * offset shadow. Renders great with no props (uses a placeholder episode).
 */
export function PodcastEpisode({
  episode = defaultEpisodes[0],
  index = 0,
  className,
}: PodcastEpisodeProps = {}) {
  const accent = accentFor(episode, index);
  return (
    <Card
      color="paper"
      shadow="sm"
      padding="md"
      className={cn("flex items-center gap-4 sm:gap-5 card-hover", className)}
    >
      <EpisodeCover accent={accent} number={episode.number} />
      <div className="min-w-0 flex-1">
        <Heading as={3} size="sm" className="text-balance">
          {episode.href ? (
            <a
              href={episode.href}
              className="decoration-[2.5px] underline-offset-4 hover:underline"
            >
              {episode.title}
            </a>
          ) : (
            episode.title
          )}
        </Heading>
        {episode.description && (
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed opacity-70">
            {episode.description}
          </p>
        )}
        <MetaRow duration={episode.duration} date={episode.date} className="mt-3" />
      </div>
      <PlayButton href={episode.href} label={`Play episode: ${episode.title}`} />
    </Card>
  );
}

/**
 * A full podcast section: eyebrow + heading (+ optional lead), an optional
 * large featured "latest episode" card with listen-on pills, then a stacked
 * list of recent episodes rendered with `PodcastEpisode`. Rotates cover
 * accents blue → coral → yellow → mint. Renders great with no props.
 */
export function PodcastList({
  eyebrow = "The Closer podcast",
  title = "Tactics you can use on your next call",
  description = "Real reps break down the exact plays behind their biggest deals, short, practical episodes you can finish before your next dial.",
  episodes = defaultEpisodes,
  platforms = defaultPlatforms,
  background = "cream",
  featured = true,
  revealContent = true,
  id,
  className,
}: PodcastListProps = {}) {
  const items = episodes.length > 0 ? episodes : defaultEpisodes;
  const featuredEpisode = featured ? items[0] : undefined;
  const listEpisodes = featured ? items.slice(1) : items;

  return (
    <Section background={background} padding="lg" id={id} className={className}>
      {(eyebrow || title || description) && (
        <Reveal stagger enabled={revealContent} className="max-w-prose">
          {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
          {title && (
            <Heading as={2} size="lg" className={cn(eyebrow && "mt-3")}>
              {title}
            </Heading>
          )}
          {description && (
            <p className="mt-4 text-lg leading-relaxed opacity-80">{description}</p>
          )}
        </Reveal>
      )}

      {featuredEpisode && (
        <Reveal enabled={revealContent}>
          <FeaturedEpisode
            episode={featuredEpisode}
            platforms={platforms}
            className="mt-10 md:mt-12"
          />
        </Reveal>
      )}

      {listEpisodes.length > 0 && (
        <Reveal
          as="ul"
          stagger
          enabled={revealContent}
          className={cn(
            "grid list-none gap-4 sm:gap-5",
            featuredEpisode ? "mt-4 sm:mt-6" : "mt-10 md:mt-12",
          )}
        >
          {listEpisodes.map((episode, i) => (
            <li key={`${episode.title}-${i}`}>
              <PodcastEpisode episode={episode} index={featured ? i + 1 : i} />
            </li>
          ))}
        </Reveal>
      )}
    </Section>
  );
}
