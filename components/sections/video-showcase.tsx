"use client";

import { useEffect } from "react";

import { Section } from "@/components/ui/section";
import { Heading } from "@/components/ui/heading";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Marquee } from "@/components/ui/marquee";
import { SocialButton } from "@/components/social/social-button";
import { SOCIALS } from "@/lib/socials";

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
  "7665314182547442958",
  "7665267283329109261",
  "7665198993680502029",
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

      {/* Full-bleed marquee: the embeds auto-scroll continuously, same as the
          testimonials strip. Marquee duplicates its children for a seamless loop,
          so each video renders twice (~16 iframes total — fine for this count). */}
      <Marquee speed={60} gap="1.25rem" className="mt-10 py-6 md:mt-12">
        {VIDEO_IDS.map((videoId) => (
          <div key={videoId} className="shrink-0">
            {/* overflow-hidden + fixed height crops TikTok's tall caption footer;
                the inner negative margin nudges the embed up so the top chrome
                strip (TikTok logo + pink seek bar) is cropped too — leaving just
                the video. Width stays 325 (TikTok's embed minimum). */}
            <div className="h-[512px] w-[325px] overflow-hidden rounded-2xl border-[2.5px] border-ink bg-paper shadow-hard">
              <div className="-mt-[46px]">
                <blockquote
                  className="tiktok-embed !m-0"
                  cite={`${PROFILE_URL}/video/${videoId}`}
                  data-video-id={videoId}
                  style={{ maxWidth: 325, minWidth: 325, margin: 0 }}
                >
                  <section>
                    <a target="_blank" rel="noreferrer" href={`${PROFILE_URL}/video/${videoId}`}>
                      @{TIKTOK_HANDLE}
                    </a>
                  </section>
                </blockquote>
              </div>
            </div>
          </div>
        ))}
      </Marquee>

      {/* Merged "follow us" moment: the social icons live with the videos rather
          than in a separate section. Renders every network from SOCIALS. */}
      <div className="mx-auto mt-10 flex max-w-page flex-col items-center gap-5 px-4 text-center md:mt-12 md:px-8">
        <p className="font-display text-xl uppercase leading-none tracking-[-0.01em] sm:text-2xl">
          Follow the fellas
        </p>
        <ul className="flex list-none items-center justify-center gap-5 md:gap-6">
          {SOCIALS.map((social) => (
            <li key={social.label}>
              <SocialButton social={social} size="lg" surface="light" />
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
