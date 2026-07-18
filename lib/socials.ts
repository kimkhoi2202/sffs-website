/** A single social profile the site links out to. */
export interface Social {
  /** Network name. Also drives the aria-label, e.g. "Follow us on Instagram". */
  label: string;
  /** Absolute profile URL. */
  href: string;
  /** Public path to the brand icon SVG (lives in /public). */
  icon: string;
}

/**
 * The site's social profiles, in display order. Every footer / follow-us button
 * renders from this list, so adding a network (e.g. YouTube) is a one-line add:
 *
 *   { label: "YouTube", href: "https://www.youtube.com/@…", icon: "/social/youtube.svg" }
 */
export const SOCIALS: Social[] = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/smartfellafartsmellatest/",
    icon: "/social/instagram.svg",
  },
  {
    label: "TikTok",
    href: "https://www.tiktok.com/@smartfellafartsmellatest",
    icon: "/social/tiktok.svg",
  },
];
