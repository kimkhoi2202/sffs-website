/**
 * Shared site configuration (placeholder brand for the design clone).
 * Header, footer, and pages all read from here so navigation stays in sync.
 */

export const site = {
  name: "Closer",
  tagline: "There's an easier way to hit quota.",
  description:
    "Tactical sales skills, courses, a podcast, a newsletter, and free tools to help reps get to President's Club.",
  email: "hello@example.com",
};

export type NavLink = { label: string; href: string; description?: string };
export type NavGroup = { label: string; links: NavLink[] };

/** Compact primary nav shown in the desktop header bar. */
export const primaryNav: NavLink[] = [
  { label: "Courses", href: "/courses" },
  { label: "Podcast", href: "/podcast" },
  { label: "Newsletter", href: "/newsletter" },
  { label: "Toolkit", href: "/toolkit" },
  { label: "Teardown", href: "/teardown" },
];

/** Full grouped navigation used in the mega-menu and footer. */
export const navGroups: NavGroup[] = [
  {
    label: "Learn",
    links: [
      { label: "Courses", href: "/courses", description: "Self-paced sales programs" },
      {
        label: "Summer Sales Camp",
        href: "/summer-sales-camp",
        description: "Live cohort intensive",
      },
      {
        label: "The Book on Cold Calling",
        href: "/the-book-on-cold-calling",
        description: "The cold call playbook",
      },
    ],
  },
  {
    label: "Free",
    links: [
      { label: "Podcast", href: "/podcast", description: "Daily tactical episodes" },
      { label: "Newsletter", href: "/newsletter", description: "One tactic, twice a week" },
      { label: "Teardown", href: "/teardown", description: "Real calls, broken down" },
      { label: "Toolkit", href: "/toolkit", description: "Templates & frameworks" },
    ],
  },
  {
    label: "Company",
    links: [
      { label: "Sponsors", href: "/sponsors", description: "Reach 250k+ sellers" },
      { label: "AI", href: "/ai-info-page", description: "How we use AI" },
      { label: "Privacy", href: "/privacy-policy" },
    ],
  },
];

export const socials: NavLink[] = [
  { label: "LinkedIn", href: "https://www.linkedin.com" },
  { label: "YouTube", href: "https://www.youtube.com" },
  { label: "Instagram", href: "https://www.instagram.com" },
  { label: "Spotify", href: "https://www.spotify.com" },
];

export const primaryCta: NavLink = { label: "Join free", href: "/newsletter" };
