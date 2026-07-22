"use client";

import { useEffect } from "react";

import { Section } from "@/components/ui/section";
import { Heading } from "@/components/ui/heading";
import { Eyebrow } from "@/components/ui/eyebrow";

type SectionBackground = NonNullable<React.ComponentProps<typeof Section>["background"]>;

const TIKTOK_HANDLE = "smartfellafartsmellatest";
const PROFILE_URL = `https://www.tiktok.com/@${TIKTOK_HANDLE}`;
const EMBED_SRC = "https://www.tiktok.com/embed.js";

export interface TikTokFeedProps {
  id?: string;
  className?: string;
  background?: SectionBackground;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
}

/**
 * Embeds the live TikTok PROFILE FEED for @smartfellafartsmellatest as a
 * scrollable slideshow of recent videos (TikTok's "creator" embed), wrapped in
 * the neo-brutalist card frame.
 *
 * TikTok's `embed.js` scans the page for `.tiktok-embed` blockquotes and swaps
 * each for its live widget. We load that script once on mount; before it runs
 * (or if it's blocked), the blockquote degrades gracefully to a plain link to
 * the profile. The widget's internal chrome is controlled by TikTok and can't be
 * fully restyled — the brand framing lives on the card around it.
 */
export function TikTokFeed({
  id,
  className,
  background = "cream",
  eyebrow = "@smartfellafartsmellatest",
  title = "Watch us on TikTok",
  subtitle = "New dumb little videos every week. Tag a fart smella.",
}: TikTokFeedProps = {}) {
  useEffect(() => {
    // Load TikTok's embed script once; if it's already present, re-run it so the
    // blockquote upgrades after a client-side navigation.
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${EMBED_SRC}"]`);
    if (existing) {
      existing.remove();
    }
    const script = document.createElement("script");
    script.src = EMBED_SRC;
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return (
    <Section
      id={id}
      className={className}
      background={background}
      padding="lg"
      container="page"
      containerClassName="text-center"
    >
      <Eyebrow>{eyebrow}</Eyebrow>
      <Heading as={2} size="xl" className="mt-4">
        {title}
      </Heading>
      {subtitle ? (
        <p className="mx-auto mt-4 max-w-xl text-pretty text-lg font-medium opacity-90">
          {subtitle}
        </p>
      ) : null}

      <div className="mx-auto mt-10 w-fit max-w-full overflow-hidden rounded-2xl border-[2.5px] border-ink bg-paper p-2 shadow-hard">
        <blockquote
          className="tiktok-embed"
          cite={PROFILE_URL}
          data-unique-id={TIKTOK_HANDLE}
          data-embed-type="creator"
          style={{ maxWidth: 780, minWidth: 288 }}
        >
          <section>
            <a target="_blank" rel="noreferrer" href={PROFILE_URL}>
              @{TIKTOK_HANDLE}
            </a>
          </section>
        </blockquote>
      </div>
    </Section>
  );
}
