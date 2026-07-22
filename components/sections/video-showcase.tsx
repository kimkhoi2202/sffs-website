"use client";

import { useEffect } from "react";

import { Section } from "@/components/ui/section";
import { Heading } from "@/components/ui/heading";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Button } from "@/components/ui/button";

type SectionBackground = NonNullable<React.ComponentProps<typeof Section>["background"]>;

const TIKTOK_HANDLE = "smartfellafartsmellatest";
const PROFILE_URL = `https://www.tiktok.com/@${TIKTOK_HANDLE}`;
const EMBED_SRC = "https://www.tiktok.com/embed.js";

/**
 * TikTok video IDs to feature (from @smartfellafartsmellatest). Add/remove IDs
 * here — grab the number after `/video/` in a TikTok URL. Each renders as a
 * live embedded player.
 */
const VIDEO_IDS = [
  "7664675246712163614",
  "7664737430003666207",
  "7665159571417189646",
  "7664995258723224863",
  "7664804452393618719",
];

export interface VideoShowcaseProps {
  id?: string;
  className?: string;
  background?: SectionBackground;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
}

/**
 * Full-bleed video slideshow: a row of live TikTok video EMBEDS spanning the
 * whole width (snap-scrolling on overflow). TikTok's `embed.js` swaps each
 * `.tiktok-embed` blockquote for its player; before it runs (or if blocked),
 * each degrades to a link to the video. Player size/chrome is controlled by
 * TikTok — the brand framing lives on the card around each one.
 */
export function VideoShowcase({
  id,
  className,
  background = "cream",
  eyebrow = `@${TIKTOK_HANDLE}`,
  title = "Watch us on TikTok",
  subtitle = "New dumb little videos every week. Tag a fart smella.",
}: VideoShowcaseProps = {}) {
  useEffect(() => {
    // (Re)load TikTok's embed script so it upgrades the blockquotes into
    // players — including after a client-side navigation back to this page.
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${EMBED_SRC}"]`);
    if (existing) existing.remove();
    const script = document.createElement("script");
    script.src = EMBED_SRC;
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return (
    <Section id={id} className={className} background={background} padding="lg" container={false}>
      <div className="mx-auto max-w-page px-4 text-center md:px-8">
        <Eyebrow>{eyebrow}</Eyebrow>
        <Heading as={2} size="xl" className="mt-4">
          {title}
        </Heading>
        {subtitle ? (
          <p className="mx-auto mt-4 max-w-xl text-pretty text-lg font-medium opacity-90">
            {subtitle}
          </p>
        ) : null}
      </div>

      {/* Full-bleed, snap-scrolling row of live TikTok embeds. */}
      <ul className="mt-10 flex snap-x snap-mandatory list-none justify-start gap-4 overflow-x-auto px-4 pb-4 [-ms-overflow-style:none] [scrollbar-width:none] md:mt-12 md:justify-center md:gap-6 md:px-8 [&::-webkit-scrollbar]:hidden">
        {VIDEO_IDS.map((videoId) => (
          <li key={videoId} className="shrink-0 snap-center">
            <div className="overflow-hidden rounded-2xl border-[2.5px] border-ink bg-paper shadow-hard">
              <blockquote
                className="tiktok-embed"
                cite={`${PROFILE_URL}/video/${videoId}`}
                data-video-id={videoId}
                style={{ maxWidth: 340, minWidth: 325 }}
              >
                <section>
                  <a target="_blank" rel="noreferrer" href={`${PROFILE_URL}/video/${videoId}`}>
                    @{TIKTOK_HANDLE}
                  </a>
                </section>
              </blockquote>
            </div>
          </li>
        ))}
      </ul>

      <div className="mx-auto mt-8 max-w-page px-4 text-center md:px-8">
        <Button href={PROFILE_URL} variant="ink" size="lg">
          Follow on TikTok
        </Button>
      </div>
    </Section>
  );
}
