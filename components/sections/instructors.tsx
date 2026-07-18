import {
  Globe,
  Camera,
  Link2,
  Send,
  Video,
  type LucideIcon,
} from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
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

/** Bright accent used for a person's photo/avatar. Rotates when omitted. */
export type InstructorAccent = "blue" | "mint" | "coral" | "yellow";

/** How each person's likeness is rendered. */
export type InstructorsMedia = "placeholder" | "avatar";

/** Full-bleed section background (mirrors the `Section` primitive's options). */
export type InstructorsBackground =
  | "paper"
  | "cream"
  | "ink"
  | "blue"
  | "mint"
  | "coral"
  | "yellow"
  | "gray";

/** Supported social platforms (each maps to a `lucide-react` icon). */
export type SocialPlatform =
  | "linkedin"
  | "youtube"
  | "twitter"
  | "instagram"
  | "website";

export interface SocialLink {
  platform: SocialPlatform;
  /** Destination URL. */
  href: string;
  /** Accessible label override (defaults to a friendly platform name). */
  label?: string;
}

export interface Person {
  /** Full name, e.g. "Marisol Vega". */
  name: string;
  /** Job title / specialty, e.g. "Head of Cold Calling". */
  role: string;
  /** One short bio line. */
  bio?: string;
  /** Avatar/monogram initials. Derived from `name` when omitted. */
  initials?: string;
  /** Pin the accent color; otherwise rotates blue → mint → coral → yellow. */
  accent?: InstructorAccent;
  /** Social links rendered as bordered icon pills. */
  socials?: SocialLink[];
}

export interface InstructorsProps {
  /** Small uppercase label above the heading. Pass `""` to hide. */
  eyebrow?: string;
  /** Section heading (Anton, uppercase). Pass `""` to hide. */
  title?: string;
  /** People to feature. Falls back to original placeholder instructors. */
  people?: Person[];
  /** Widest column count (mobile is always 1, tablet 2). */
  columns?: 2 | 3 | 4;
  /** Full-bleed section background color. */
  background?: InstructorsBackground;
  /** Square photo placeholder (default) or a large circular avatar. */
  media?: InstructorsMedia;
  /** Fade + rise the inner content on scroll; disable to render statically. */
  revealContent?: boolean;
  className?: string;
  id?: string;
}

/* -------------------------------------------------------------------------- */
/*  Social icon lookups                                                        */
/* -------------------------------------------------------------------------- */

const socialIcon: Record<SocialPlatform, LucideIcon> = {
  linkedin: Link2,
  youtube: Video,
  twitter: Send,
  instagram: Camera,
  website: Globe,
};

const socialLabel: Record<SocialPlatform, string> = {
  linkedin: "LinkedIn",
  youtube: "YouTube",
  twitter: "Twitter",
  instagram: "Instagram",
  website: "Website",
};

/* -------------------------------------------------------------------------- */
/*  Layout helpers                                                             */
/* -------------------------------------------------------------------------- */

const accentRotation: readonly InstructorAccent[] = [
  "blue",
  "mint",
  "coral",
  "yellow",
];

const columnClass: Record<2 | 3 | 4, string> = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 lg:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
};

function resolveInitials(person: Person): string {
  if (person.initials) return person.initials;
  const parts = person.name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, 2);
  return parts[0][0] + parts[parts.length - 1][0];
}

/* -------------------------------------------------------------------------- */
/*  Default (original, placeholder) data                                       */
/* -------------------------------------------------------------------------- */

export const DEFAULT_INSTRUCTORS: Person[] = [
  {
    name: "Marisol Vega",
    role: "Head of Cold Calling",
    bio: "Turned 200 dials a day into a repeatable system, and teaches the openers that earn you the next sixty seconds.",
    socials: [
      { platform: "linkedin", href: "#" },
      { platform: "youtube", href: "#" },
    ],
  },
  {
    name: "Desmond Clarke",
    role: "Discovery Coach",
    bio: "Closed eight figures of pipeline by asking sharper questions than anyone else on the call, and shows you how.",
    socials: [
      { platform: "linkedin", href: "#" },
      { platform: "youtube", href: "#" },
    ],
  },
  {
    name: "Yuki Tanaka",
    role: "Negotiation Lead",
    bio: "Makes objection handling feel like a conversation instead of a fight, guiding buyers to a confident yes.",
    socials: [
      { platform: "linkedin", href: "#" },
      { platform: "youtube", href: "#" },
    ],
  },
  {
    name: "Amara Okonkwo",
    role: "Pipeline Strategist",
    bio: "Builds daily prospecting rhythms that end the feast-or-famine cycle and keep your funnel permanently full.",
    socials: [
      { platform: "linkedin", href: "#" },
      { platform: "youtube", href: "#" },
    ],
  },
];

/* -------------------------------------------------------------------------- */
/*  Sub-parts                                                                  */
/* -------------------------------------------------------------------------- */

function SocialRow({
  socials,
  className,
}: {
  socials?: SocialLink[];
  className?: string;
}) {
  if (!socials || socials.length === 0) return null;
  return (
    <ul className={cn("flex list-none flex-wrap items-center gap-2", className)}>
      {socials.map((social, i) => {
        const Icon = socialIcon[social.platform];
        const label = social.label ?? socialLabel[social.platform];
        return (
          <li key={`${social.platform}-${i}`}>
            <a
              href={social.href}
              aria-label={label}
              target="_blank"
              rel="noreferrer"
              className="press inline-grid size-10 place-items-center rounded-full border-[2.5px] border-ink bg-paper text-ink shadow-hard-sm"
            >
              <Icon className="size-4" strokeWidth={2.5} aria-hidden="true" />
            </a>
          </li>
        );
      })}
    </ul>
  );
}

function PersonCard({
  person,
  accent,
  media,
}: {
  person: Person;
  accent: InstructorAccent;
  media: InstructorsMedia;
}) {
  const initials = resolveInitials(person);
  const isAvatar = media === "avatar";

  return (
    <Card
      color="paper"
      shadow="md"
      padding="md"
      className={cn("flex h-full flex-col card-hover", isAvatar && "items-center text-center")}
    >
      {isAvatar ? (
        <Avatar initials={initials} color={accent} size="xl" />
      ) : (
        <Placeholder
          color={accent}
          aspect="1/1"
          rounded="rounded-xl"
          className="shadow-hard-xs"
        >
          <span className="relative z-10 font-display text-4xl uppercase leading-none tracking-tight">
            {initials}
          </span>
        </Placeholder>
      )}

      <Heading as={3} size="sm" className="mt-4">
        {person.name}
      </Heading>
      <p className="mt-1 text-sm font-bold uppercase tracking-wide text-ink/70">
        {person.role}
      </p>
      {person.bio ? (
        <p className="mt-3 text-base leading-relaxed text-ink/80">{person.bio}</p>
      ) : null}

      <SocialRow
        socials={person.socials}
        className={cn("mt-auto pt-5", isAvatar && "justify-center")}
      />
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*  Section                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Instructors, a "meet your team" section: an eyebrow + Anton heading over a
 * responsive grid (1 → 2 → 3/4 across breakpoints) of person cards. Each card
 * leads with a square photo Placeholder (or a large Avatar via `media="avatar"`)
 * whose accent rotates blue → mint → coral → yellow, then the person's name,
 * role, a short bio line, and a row of bordered social icon pills. Renders
 * great with no props and accepts fully-typed overrides.
 */
export function Instructors({
  eyebrow = "The faculty",
  title = "Meet your instructors",
  people = DEFAULT_INSTRUCTORS,
  columns = 4,
  background = "paper",
  media = "placeholder",
  revealContent = true,
  className,
  id,
}: InstructorsProps = {}) {
  return (
    <Section background={background} padding="lg" className={className} id={id}>
      {(eyebrow || title) && (
        <Reveal stagger enabled={revealContent} className="mb-10 max-w-2xl md:mb-14">
          {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
          {title ? (
            <Heading as={2} size="xl" className={cn(eyebrow && "mt-4")}>
              {title}
            </Heading>
          ) : null}
        </Reveal>
      )}

      {people.length > 0 && (
        <Reveal
          as="ul"
          stagger
          enabled={revealContent}
          className={cn(
            "grid list-none grid-cols-1 gap-6 md:gap-8",
            columnClass[columns],
          )}
        >
          {people.map((person, index) => (
            <li key={`${person.name}-${index}`} className="h-full">
              <PersonCard
                person={person}
                accent={person.accent ?? accentRotation[index % accentRotation.length]}
                media={media}
              />
            </li>
          ))}
        </Reveal>
      )}
    </Section>
  );
}
