import Link from "next/link";
import { Clock, PlayCircle, Sparkles, Star } from "lucide-react";

import { cn } from "@/lib/utils";
import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/quiz/reveal";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heading } from "@/components/ui/heading";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Placeholder } from "@/components/ui/placeholder";

/** Bright accent used for a card's rotating cover + Enroll button. */
export type AccentColor = "blue" | "mint" | "coral" | "yellow";

const ACCENTS: readonly AccentColor[] = ["blue", "mint", "coral", "yellow"];

/** A single course record. All fields are optional at the component boundary. */
export interface Course {
  /** Course title, rendered UPPERCASE in Anton. */
  title: string;
  /** One or two sentence summary (clamped to two lines on the card). */
  description: string;
  /** Short level/status label shown in the cover badge, e.g. "Beginner", "New". */
  level: string;
  /** Number of lessons/videos in the course. */
  lessons: number;
  /** Human-readable total length, e.g. "2h 40m". */
  duration: string;
  /** Average rating out of 5, e.g. 4.8. */
  rating: number;
  /** Display price, e.g. "$49" or "Free". */
  price: string;
  /** Destination for the card + Enroll button. */
  href?: string;
  /** Override the rotating cover/button accent for this card. */
  accent?: AccentColor;
  /**
   * Optional category tags rendered as small pills on the card, in addition to
   * the cover level badge. Omit for the original single-badge look.
   */
  tags?: string[];
  /**
   * Optional per-course override for the footer action label. Falls back to the
   * grid-level `enrollLabel`, then to the default ("Enroll").
   */
  enrollLabel?: string;
}

export interface CourseCardProps extends Partial<Course> {
  /** Position within a grid; drives the rotating accent when `accent` is omitted. */
  index?: number;
  /** Label for the footer action. */
  enrollLabel?: string;
  className?: string;
}

/**
 * Neo-brutalist course product card: framed cover, level badge, Anton title,
 * meta row, and a price + Enroll footer. The whole card is a link (stretched
 * over the surface) while the Enroll button stays independently clickable, so
 * there are no nested anchors.
 */
export function CourseCard({
  title = "Cold Outreach Foundations",
  description = "Write cold emails and open cold calls that actually get replies, built on plug-and-play scripts you can steal for your next shift.",
  level = "Beginner",
  lessons = 14,
  duration = "2h 40m",
  rating = 4.8,
  price = "$49",
  href = "#",
  accent,
  tags,
  index = 0,
  enrollLabel = "Enroll",
  className,
}: CourseCardProps) {
  const tone: AccentColor = accent ?? ACCENTS[index % ACCENTS.length];

  return (
    <Card
      interactive
      color="paper"
      shadow="lg"
      className={cn("relative flex h-full flex-col", className)}
    >
      <div className="relative">
        <Placeholder
          aspect="4/3"
          color={tone}
          rounded="rounded-xl"
          label="Course preview"
        >
          <PlayCircle
            aria-hidden
            strokeWidth={2.25}
            className="relative z-10 h-14 w-14"
          />
        </Placeholder>
        <Badge
          color="paper"
          size="sm"
          shadow="hard"
          className="pointer-events-none absolute left-3 top-3 z-10"
        >
          {level}
        </Badge>
      </div>

      <Heading as={3} size="sm" className="mt-4">
        <Link
          href={href}
          className="rounded-sm outline-none before:absolute before:inset-0 before:content-[''] focus-visible:underline focus-visible:decoration-2 focus-visible:underline-offset-4"
        >
          {title}
        </Link>
      </Heading>

      <p className="mt-2 line-clamp-2 text-sm font-medium text-ink/70">
        {description}
      </p>

      {tags && tags.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <Badge key={tag} color="paper" size="sm">
              {tag}
            </Badge>
          ))}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-semibold text-ink/60">
        <span className="inline-flex items-center gap-1.5">
          <PlayCircle aria-hidden className="h-4 w-4" />
          {lessons} lessons
        </span>
        <span aria-hidden className="text-ink/30">
          &bull;
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock aria-hidden className="h-4 w-4" />
          {duration}
        </span>
        <span aria-hidden className="text-ink/30">
          &bull;
        </span>
        <span
          className="inline-flex items-center gap-1.5"
          aria-label={`Rated ${rating.toFixed(1)} out of 5`}
        >
          <Star aria-hidden className="h-4 w-4 fill-current" />
          {rating.toFixed(1)}
        </span>
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 pt-5">
        <span className="font-display text-2xl leading-none">{price}</span>
        <Button
          href={href}
          variant={tone}
          size="sm"
          className="relative z-10"
          aria-label={`Enroll in ${title}`}
        >
          {enrollLabel}
        </Button>
      </div>
    </Card>
  );
}

/** Accent options for the in-grid callout card (accents + dark ink). */
export type CalloutColor = AccentColor | "ink";

/**
 * A highlighted call-to-action card rendered inside the {@link CourseGrid}
 * alongside the course cards (e.g. an "Are you a sales leader?" team pitch).
 */
export interface CourseCallout {
  /** Anton headline for the callout. */
  title: string;
  /** One or two sentence supporting line. */
  body: string;
  /** The primary action for the card + its stretched link. */
  cta: { label: string; href: string };
  /** Card/button color treatment. Defaults to a bold dark `ink` card. */
  color?: CalloutColor;
}

/** Contrasting button variant for each callout color. */
const calloutButtonVariant: Record<CalloutColor, "ink" | "yellow"> = {
  ink: "yellow",
  blue: "ink",
  mint: "ink",
  coral: "ink",
  yellow: "ink",
};

/**
 * Neo-brutalist highlighted CTA card. Mirrors {@link CourseCard}'s interaction
 * (stretched link + independently clickable button) so it drops into the grid
 * without introducing nested anchors.
 */
function CalloutCard({ title, body, cta, color = "ink" }: CourseCallout) {
  const onDark = color === "ink";

  return (
    <Card
      interactive
      color={color}
      shadow="lg"
      className="relative flex h-full flex-col"
    >
      <Sparkles aria-hidden strokeWidth={2.25} className="h-9 w-9" />

      <Heading as={3} size="sm" className="mt-4">
        <Link
          href={cta.href}
          className="rounded-sm outline-none before:absolute before:inset-0 before:content-[''] focus-visible:underline focus-visible:decoration-2 focus-visible:underline-offset-4"
        >
          {title}
        </Link>
      </Heading>

      <p
        className={cn(
          "mt-2 text-sm font-medium",
          onDark ? "text-paper/80" : "text-ink/75",
        )}
      >
        {body}
      </p>

      <div className="mt-auto pt-6">
        <Button
          href={cta.href}
          variant={calloutButtonVariant[color]}
          size="sm"
          className="relative z-10"
        >
          {cta.label}
        </Button>
      </div>
    </Card>
  );
}

type CourseGridColumns = 1 | 2 | 3;

const gridColsMap: Record<CourseGridColumns, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
};

export interface CourseGridProps {
  eyebrow?: string;
  title?: string;
  intro?: string;
  /** Courses to render; falls back to a built-in set of originals. */
  courses?: Course[];
  /** Max columns at the widest breakpoint (grid always starts single-column). */
  columns?: CourseGridColumns;
  background?: React.ComponentProps<typeof Section>["background"];
  /** Fade + rise the inner content on scroll; disable to render statically. */
  revealContent?: boolean;
  /**
   * Default footer action label forwarded to every card (e.g. "Learn more").
   * A per-`Course.enrollLabel` value overrides this. Omit to keep "Enroll".
   */
  enrollLabel?: string;
  /**
   * Optional highlighted CTA card rendered inside the main grid alongside the
   * course cards. Omit for no callout.
   */
  callout?: CourseCallout;
  /**
   * Optional secondary group of courses rendered under a subheading below the
   * main grid, using the same {@link CourseCard}. Omit to render only `courses`.
   */
  bundles?: Course[];
  /** Subheading shown above the `bundles` group. Defaults to "Bundles". */
  bundlesTitle?: string;
}

const DEFAULT_COURSES: Course[] = [
  {
    title: "Cold Outreach Foundations",
    description:
      "Write cold emails and open cold calls that actually get replies, built on plug-and-play scripts you can steal for your next shift.",
    level: "Beginner",
    lessons: 14,
    duration: "2h 40m",
    rating: 4.8,
    price: "$49",
    accent: "blue",
  },
  {
    title: "Discovery Call Mastery",
    description:
      "Run discovery that surfaces real pain, qualifies fast, and quietly sets up a deal that ends up closing itself.",
    level: "Intermediate",
    lessons: 18,
    duration: "3h 15m",
    rating: 4.9,
    price: "$79",
    accent: "mint",
  },
  {
    title: "Objection Handling Playbook",
    description:
      "Turn “we’re not interested” into a next step with a calm, repeatable framework that works on almost any pushback.",
    level: "Intermediate",
    lessons: 12,
    duration: "2h 05m",
    rating: 4.7,
    price: "$59",
    accent: "coral",
  },
  {
    title: "Closing Without the Cringe",
    description:
      "Ask for the business with confidence, natural closes that respect the buyer and still protect your quota.",
    level: "Advanced",
    lessons: 16,
    duration: "2h 50m",
    rating: 4.9,
    price: "$99",
    accent: "yellow",
  },
  {
    title: "Prospecting Systems That Scale",
    description:
      "Build a daily prospecting engine, lists, sequences, and triggers, so your pipeline never runs dry again.",
    level: "New",
    lessons: 10,
    duration: "1h 45m",
    rating: 4.6,
    price: "Free",
    accent: "mint",
  },
  {
    title: "Negotiation Tactics That Land",
    description:
      "Protect margin and momentum, trade concessions with intent and land deals both sides feel genuinely good about.",
    level: "Advanced",
    lessons: 20,
    duration: "3h 30m",
    rating: 4.8,
    price: "$129",
    accent: "coral",
  },
];

/**
 * Section wrapper: eyebrow + heading + optional intro, followed by a responsive
 * grid of {@link CourseCard}s. Renders a full set of original placeholder
 * courses when none are supplied.
 */
export function CourseGrid({
  eyebrow = "Closer Academy",
  title = "Courses that turn reps into closers",
  intro = "Short, practical programs you can finish in an afternoon and put to work on your very next call, no fluff, just moves that move deals.",
  courses = DEFAULT_COURSES,
  columns = 3,
  background = "cream",
  revealContent = true,
  enrollLabel,
  callout,
  bundles,
  bundlesTitle = "Bundles",
}: CourseGridProps) {
  const gridClasses = cn(
    "grid gap-6 md:gap-8",
    gridColsMap[columns],
  );

  return (
    <Section background={background} padding="lg">
      <Reveal stagger enabled={revealContent} className="max-w-prose">
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        {title ? (
          <Heading size="lg" className={cn(eyebrow && "mt-3")}>
            {title}
          </Heading>
        ) : null}
        {intro ? (
          <p className="mt-4 text-lg font-medium text-ink/75">{intro}</p>
        ) : null}
      </Reveal>

      <Reveal
        as="div"
        stagger
        enabled={revealContent}
        className={cn("mt-10 md:mt-12", gridClasses)}
      >
        {courses.map((course, i) => (
          <CourseCard
            key={`${course.title}-${i}`}
            index={i}
            {...course}
            enrollLabel={course.enrollLabel ?? enrollLabel}
          />
        ))}
        {callout ? <CalloutCard {...callout} /> : null}
      </Reveal>

      {bundles && bundles.length > 0 ? (
        <div className="mt-14 md:mt-20">
          <Heading as={2} size="sm">
            {bundlesTitle}
          </Heading>
          <Reveal
            as="div"
            stagger
            enabled={revealContent}
            className={cn("mt-6 md:mt-8", gridClasses)}
          >
            {bundles.map((course, i) => (
              <CourseCard
                key={`bundle-${course.title}-${i}`}
                index={i}
                {...course}
                enrollLabel={course.enrollLabel ?? enrollLabel}
              />
            ))}
          </Reveal>
        </div>
      ) : null}
    </Section>
  );
}
