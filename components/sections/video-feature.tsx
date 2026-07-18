import type { ComponentProps } from "react";
import { Play } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Heading } from "@/components/ui/heading";
import { Placeholder } from "@/components/ui/placeholder";
import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/quiz/reveal";
import { cn } from "@/lib/utils";

/** Full-bleed section color block (mirrors the `Section` primitive's options). */
type SectionBackground = NonNullable<ComponentProps<typeof Section>["background"]>;

/** Accent the media "screen" can take (mirrors the `Placeholder` primitive). */
type MediaColor = NonNullable<ComponentProps<typeof Placeholder>["color"]>;

export interface VideoFeatureProps {
  /** Small uppercase tracked label above the title. Pass `""` to hide. */
  eyebrow?: string;
  /** Anton display heading. Pass `""` to hide. */
  title?: string;
  /** Supporting paragraph beneath the heading. Pass `""` to hide. */
  subtitle?: string;
  /** Chip shown over the video (e.g. a title + duration). Pass `""` to hide. */
  caption?: string;
  /** Full-bleed color block behind the section. */
  background?: SectionBackground;
  /** Fade + rise the content on scroll; disable to render statically. */
  revealContent?: boolean;
  /**
   * `"center"` stacks copy above a wide video; `"split"` puts the copy on one
   * side and the video on the other at `lg`.
   */
  layout?: "center" | "split";
  /**
   * Optional DOM id set on the section wrapper so pages can deep-link to it
   * (e.g. `#featured`). Omitted leaves the section without an id (unchanged).
   */
  id?: string;
}

/**
 * Contrast-safe accent for the media "screen" per section background, always
 * non-coral so the coral play control keeps popping against it.
 */
const mediaColorForBackground: Record<SectionBackground, MediaColor> = {
  paper: "blue",
  cream: "mint",
  ink: "yellow",
  blue: "mint",
  mint: "blue",
  coral: "blue",
  yellow: "mint",
  gray: "blue",
};

/**
 * A video showcase section: an eyebrow, Anton heading, and optional subcopy over
 * a large 16/9 media "screen" with a big circular coral play control and a
 * caption chip. Purely presentational, the play control is decorative (no real
 * video, no client state) so this stays a Server Component. Renders fully with
 * no props and accepts typed overrides.
 */
export function VideoFeature({
  eyebrow = "Film room",
  title = "Watch the framework in action",
  subtitle = "Press play for a three-minute teardown of a live prospecting call, every opener, objection, and next step, annotated by the Closer coaching crew.",
  caption = "Cold call teardown · 3 min",
  background = "cream",
  revealContent = true,
  layout = "center",
  id,
}: VideoFeatureProps = {}) {
  const isSplit = layout === "split";
  const mediaColor = mediaColorForBackground[background];

  const media = (
    <div className="group relative">
      <Placeholder aspect="16/9" color={mediaColor} className="shadow-hard-lg">
        {/* Centered, decorative play control. */}
        <div className="absolute inset-0 z-10 grid place-items-center">
          <div
            aria-hidden="true"
            className="grid size-16 place-items-center rounded-full border-[2.5px] border-ink bg-coral text-ink shadow-hard-lg transition-transform duration-150 ease-out motion-safe:group-hover:scale-105 sm:size-20"
          >
            <Play
              className="size-7 translate-x-[2px] fill-ink sm:size-8"
              strokeWidth={2.5}
              aria-hidden="true"
            />
          </div>
        </div>

        {/* Caption chip layered over the video. */}
        {caption ? (
          <Badge
            color="paper"
            shadow="hard"
            className="absolute bottom-4 left-4 z-20 max-w-[calc(100%-2rem)]"
          >
            <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-coral" />
            <span className="min-w-0 truncate">{caption}</span>
          </Badge>
        ) : null}
      </Placeholder>
    </div>
  );

  const copy = (
    <Reveal stagger enabled={revealContent} className={cn(!isSplit && "mx-auto max-w-2xl text-center")}>
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}

      {title ? (
        <Heading as={2} size="lg" className={cn("text-balance", eyebrow && "mt-4")}>
          {title}
        </Heading>
      ) : null}

      {subtitle ? (
        <p
          className={cn(
            "mt-5 text-pretty text-lg font-medium leading-relaxed",
            !isSplit && "mx-auto max-w-prose",
          )}
        >
          {subtitle}
        </p>
      ) : null}
    </Reveal>
  );

  return (
    <Section id={id} background={background} padding="lg" bordered>
      {isSplit ? (
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
          {copy}
          <Reveal enabled={revealContent}>{media}</Reveal>
        </div>
      ) : (
        <>
          {copy}
          <Reveal enabled={revealContent} className="mx-auto mt-10 max-w-4xl md:mt-12">{media}</Reveal>
        </>
      )}
    </Section>
  );
}
