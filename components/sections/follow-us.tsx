import type { ComponentProps } from "react";

import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/quiz/reveal";
import { SocialButton } from "@/components/social/social-button";
import { SOCIALS } from "@/lib/socials";

type SectionBackground = NonNullable<ComponentProps<typeof Section>["background"]>;

export interface FollowUsProps {
  /** Big Anton headline. */
  title?: string;
  /** Short supporting line under the headline. */
  subtitle?: string;
  /** Full-bleed color block. Ink social chips read on any bright surface. */
  background?: SectionBackground;
  /** Anchor id on the outer section. */
  id?: string;
  className?: string;
  /** Fade + rise the inner content on scroll while the section bg stays static. */
  revealContent?: boolean;
}

/**
 * A dedicated, standalone "FOLLOW US" moment: a giant Anton headline, a short
 * line, and the social icon buttons at a large, prominent size. Distinct from
 * the footer's slim social row. Renders every network from the SOCIALS list, so
 * adding one (e.g. YouTube) needs no changes here.
 */
export function FollowUs({
  title = "Follow us",
  subtitle = "for more brain-teasers",
  background = "yellow",
  id,
  className,
  revealContent = true,
}: FollowUsProps = {}) {
  return (
    <Section background={background} padding="lg" id={id} className={className}>
      <Reveal
        stagger
        enabled={revealContent}
        className="mx-auto flex max-w-3xl flex-col items-center text-center"
      >
        <Heading as={2} size="display">
          {title}
        </Heading>
        {subtitle ? (
          <p className="mt-4 text-pretty text-lg font-medium opacity-90 md:text-xl">
            {subtitle}
          </p>
        ) : null}
        <ul className="mt-8 flex list-none items-center justify-center gap-5 md:mt-10 md:gap-6">
          {SOCIALS.map((social) => (
            <li key={social.label}>
              <SocialButton social={social} size="lg" surface="light" />
            </li>
          ))}
        </ul>
      </Reveal>
    </Section>
  );
}
