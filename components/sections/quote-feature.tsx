import { Avatar } from "@/components/ui/avatar";
import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/quiz/reveal";

/** Full-bleed color block behind the quote (mirrors the `Section` primitive). */
export type QuoteFeatureBackground =
  | "paper"
  | "cream"
  | "ink"
  | "blue"
  | "mint"
  | "coral"
  | "yellow"
  | "gray";

/** Accent colors the `Avatar` primitive accepts. */
type AvatarAccent = "blue" | "mint" | "coral" | "yellow" | "gray" | "ink";

export interface QuoteFeatureProps {
  /** The pull-quote text. */
  quote?: string;
  /** Person credited for the quote. The attribution row hides when empty. */
  name?: string;
  /** Role / company shown beneath the name. */
  role?: string;
  /** Full-bleed color block behind the quote. */
  background?: QuoteFeatureBackground;
  /** Fade + rise the content on scroll; disable to render statically. */
  revealContent?: boolean;
  /** Optional anchor id on the section. */
  id?: string;
  /** Extra classes on the outer section. */
  className?: string;
}

/** Pairs each section background with an avatar accent that pops against it. */
const avatarAccentForBackground: Record<QuoteFeatureBackground, AvatarAccent> = {
  yellow: "ink",
  blue: "yellow",
  mint: "coral",
  coral: "yellow",
  paper: "blue",
  cream: "coral",
  gray: "blue",
  ink: "yellow",
};

function toInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * A single large pull-quote in a full-bleed color block: a giant decorative
 * quotation mark, a bold Anton quote balanced at max ~4xl, and an attribution
 * row (bordered avatar + name + role). Renders fully with no props and accepts
 * typed overrides for the quote, attribution, and section color.
 */
export function QuoteFeature({
  quote = "The best reps don't wait to feel ready. They book the meeting, then earn the right to keep it.",
  name = "Jordan Vega",
  role = "Founder, Closer",
  background = "yellow",
  revealContent = true,
  id,
  className,
}: QuoteFeatureProps = {}) {
  const initials = name ? toInitials(name) : "";
  const avatarColor = avatarAccentForBackground[background];

  return (
    <Section background={background} padding="lg" bordered id={id} className={className}>
      <Reveal enabled={revealContent}>
        <figure className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <span
            aria-hidden="true"
            className="mb-2 block select-none font-display leading-[0.7] text-[5rem] sm:text-[7rem] md:text-[9rem]"
          >
            {"\u201C"}
          </span>

          <blockquote className="max-w-4xl text-balance font-display text-3xl uppercase leading-[1.05] tracking-[-0.01em] sm:text-4xl md:text-5xl">
            {quote}
          </blockquote>

          {name ? (
            <figcaption className="mt-8 flex items-center justify-center gap-4 md:mt-10">
              <Avatar
                initials={initials}
                color={avatarColor}
                size="lg"
                className="shadow-hard-sm"
              />
              <div className="text-left">
                <div className="font-sans text-lg font-bold leading-tight">{name}</div>
                {role ? (
                  <div className="mt-0.5 font-sans text-sm font-medium opacity-70">
                    {role}
                  </div>
                ) : null}
              </div>
            </figcaption>
          ) : null}
        </figure>
      </Reveal>
    </Section>
  );
}
