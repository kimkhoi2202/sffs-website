import { Section } from "@/components/ui/section";
import { Heading } from "@/components/ui/heading";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Marquee } from "@/components/ui/marquee";
import { Placeholder } from "@/components/ui/placeholder";
import { SocialButton } from "@/components/social/social-button";
import { SOCIALS } from "@/lib/socials";

type SectionBackground = NonNullable<React.ComponentProps<typeof Section>["background"]>;

const TIKTOK_HANDLE = "smartfellafartsmellatest";
const PROFILE_URL = `https://www.tiktok.com/@${TIKTOK_HANDLE}`;

/**
 * TikTok video IDs to feature — grab the number after `/video/` in a TikTok URL.
 * Each shows as a cover image linking to the video.
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

const PLACEHOLDER_COLORS = ["blue", "mint", "coral", "yellow"] as const;

interface Cover {
  id: string;
  url: string;
  thumbnail: string | null;
}

/** Resolve a video's 9:16 cover image via TikTok's public oEmbed endpoint. */
async function getCover(id: string): Promise<Cover> {
  const url = `${PROFILE_URL}/video/${id}`;
  try {
    const res = await fetch(
      `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`,
      // Revalidate hourly: the thumbnail URLs are time-signed, so we re-fetch
      // well within their expiry rather than baking a stale URL at build time.
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) return { id, url, thumbnail: null };
    const data = (await res.json()) as { thumbnail_url?: string };
    return { id, url, thumbnail: data.thumbnail_url ?? null };
  } catch {
    return { id, url, thumbnail: null };
  }
}

export interface VideoShowcaseProps {
  id?: string;
  className?: string;
  background?: SectionBackground;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
}

/**
 * "Follow the fellas" — the follow moment (IG + TikTok icons) sits ABOVE a
 * full-bleed, continuously-looping carousel of TikTok video COVERS. Covers are
 * plain images (via oEmbed), so there's no player chrome to crop and the marquee
 * loops seamlessly (the duplicated set stays light). Each cover links to the
 * video on TikTok. Server component — thumbnails resolve at request time.
 */
export async function VideoShowcase({
  id,
  className,
  background = "cream",
  eyebrow = `@${TIKTOK_HANDLE}`,
  title = "Follow the fellas",
  subtitle = "New dumb little videos every week. Tag a fart smella.",
}: VideoShowcaseProps = {}) {
  const covers = await Promise.all(VIDEO_IDS.map(getCover));

  return (
    <Section id={id} className={className} background={background} padding="lg" container={false}>
      {/* Follow moment — heading + social links, ABOVE the carousel. */}
      <div className="mx-auto flex max-w-page flex-col items-center gap-5 px-4 text-center md:px-8">
        <Eyebrow>{eyebrow}</Eyebrow>
        <Heading as={2} size="xl">
          {title}
        </Heading>
        {subtitle ? (
          <p className="max-w-xl text-pretty text-lg font-medium opacity-90">{subtitle}</p>
        ) : null}
        <ul className="flex list-none items-center justify-center gap-5 md:gap-6">
          {SOCIALS.map((social) => (
            <li key={social.label}>
              <SocialButton social={social} size="lg" surface="light" />
            </li>
          ))}
        </ul>
      </div>

      {/* Full-bleed, continuously-looping cover carousel. */}
      <Marquee speed={45} gap="1.25rem" className="mt-10 py-6 md:mt-12">
        {covers.map((cover, i) => (
          <a
            key={cover.id}
            href={cover.url}
            target="_blank"
            rel="noreferrer"
            aria-label="Watch on TikTok"
            className="press block w-[260px] shrink-0 overflow-hidden rounded-2xl border-[2.5px] border-ink shadow-hard [aspect-ratio:9/16]"
          >
            {cover.thumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element -- remote TikTok CDN cover; plain img avoids remotePatterns config
              <img
                src={cover.thumbnail}
                alt=""
                className="size-full object-cover"
                loading="lazy"
              />
            ) : (
              <Placeholder
                color={PLACEHOLDER_COLORS[i % PLACEHOLDER_COLORS.length]}
                aspect="9/16"
                rounded="rounded-none"
                bordered={false}
                className="size-full"
                label="watch on tiktok"
              />
            )}
          </a>
        ))}
      </Marquee>
    </Section>
  );
}
