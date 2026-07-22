"use client";

import { useEffect, useState } from "react";

import { Section } from "@/components/ui/section";
import { Heading } from "@/components/ui/heading";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Button } from "@/components/ui/button";
import { Placeholder } from "@/components/ui/placeholder";

type SectionBackground = NonNullable<React.ComponentProps<typeof Section>["background"]>;

const TIKTOK_HANDLE = "smartfellafartsmellatest";
const PROFILE_URL = `https://www.tiktok.com/@${TIKTOK_HANDLE}`;
const MANIFEST_URL = "/tiktok-samples/manifest.json";

/** One hosted short, mirroring public/tiktok-samples/manifest.json entries. */
interface ShowcaseVideo {
  id: string;
  title?: string;
  src: string;
  poster?: string;
}

/** Placeholder card colors, cycled while there are no real videos yet. */
const PLACEHOLDER_COLORS = ["blue", "mint", "coral", "yellow"] as const;

export interface VideoShowcaseProps {
  id?: string;
  className?: string;
  background?: SectionBackground;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
}

/**
 * Full-bleed video slideshow for the landing page: big vertical (9:16) cards in
 * an edge-to-edge, snap-scrolling row. Self-hosted (not the size-locked TikTok
 * widget), so the videos render as large as we want and span the full width.
 *
 * Videos come from the SAME place the Creator Studio uses:
 * `public/tiktok-samples/manifest.json` — drop `.mp4`s in that folder and list
 * them there (see its README) and they appear here automatically. While the
 * manifest is empty, we render placeholder phone-cards so the layout is intact.
 */
export function VideoShowcase({
  id,
  className,
  background = "cream",
  eyebrow = `@${TIKTOK_HANDLE}`,
  title = "Watch us on TikTok",
  subtitle = "New dumb little videos every week. Tag a fart smella.",
}: VideoShowcaseProps = {}) {
  const [videos, setVideos] = useState<ShowcaseVideo[]>([]);

  useEffect(() => {
    let alive = true;
    fetch(MANIFEST_URL, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { videos: [] }))
      .then((data: { videos?: ShowcaseVideo[] }) => {
        if (alive && Array.isArray(data.videos)) setVideos(data.videos);
      })
      .catch(() => {
        /* No manifest / offline: fall back to placeholder cards. */
      });
    return () => {
      alive = false;
    };
  }, []);

  // Until real videos are listed, show four placeholder phone-cards so the
  // full-bleed layout reads correctly.
  const hasVideos = videos.length > 0;
  const cardCount = hasVideos ? videos.length : 4;

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

      {/* Full-bleed, snap-scrolling row of big vertical cards. */}
      <ul className="mt-10 flex snap-x snap-mandatory list-none gap-4 overflow-x-auto px-4 pb-4 [-ms-overflow-style:none] [scrollbar-width:none] md:mt-12 md:gap-6 md:px-8 [&::-webkit-scrollbar]:hidden">
        {Array.from({ length: cardCount }).map((_, i) => {
          const video = hasVideos ? videos[i] : undefined;
          return (
            <li
              key={video?.id ?? `placeholder-${i}`}
              className="h-[clamp(380px,64vh,560px)] shrink-0 snap-center"
            >
              <div className="relative h-full overflow-hidden rounded-2xl border-[2.5px] border-ink bg-paper shadow-hard [aspect-ratio:9/16]">
                {video ? (
                  <video
                    className="size-full object-cover"
                    src={video.src}
                    poster={video.poster}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                  />
                ) : (
                  <Placeholder
                    color={PLACEHOLDER_COLORS[i % PLACEHOLDER_COLORS.length]}
                    aspect="9/16"
                    rounded="rounded-none"
                    bordered={false}
                    className="size-full"
                    label="video coming soon"
                  />
                )}
              </div>
              {video?.title ? (
                <p className="mt-3 line-clamp-1 px-1 text-center text-sm font-bold">
                  {video.title}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>

      <div className="mx-auto mt-8 max-w-page px-4 text-center md:px-8">
        <Button href={PROFILE_URL} variant="ink" size="lg">
          Follow on TikTok
        </Button>
      </div>
    </Section>
  );
}
