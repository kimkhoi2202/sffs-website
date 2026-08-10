/**
 * WHICH VERSION OF THE SITE IS LIVE AT `/`.
 *
 * Three homepages exist in the tree at once and one environment variable picks
 * between them:
 *
 *   v1  the original multi-section marketing site   components/versions/home-v1
 *   v2  the single-screen waitlist page             components/versions/home-v2
 *   v3  the Official Smart Fella Test flow          components/test/test-flow
 *
 * This is worth more than convenience. v2 is what is on production, and if v3
 * converts worse, putting v2 back is `SITE_VERSION=v2` and a redeploy rather
 * than reverting a large branch under time pressure. Being able to undo a
 * launch cheaply is what makes launching it a smaller decision.
 *
 * ---------------------------------------------------------------------------
 * ONLY `/` CHANGES
 * ---------------------------------------------------------------------------
 * /privacy, /terms, /support, /about, /app-store-copy and /internal, and every
 * redirect, are live in all three versions. They are not part of any version;
 * they are the site.
 *
 * ---------------------------------------------------------------------------
 * A BAD VALUE FALLS BACK, LOUDLY
 * ---------------------------------------------------------------------------
 * An unrecognised value logs a warning and renders the default rather than
 * throwing. The failure mode of falling back is "the site shows the current
 * version" — which is what an operator who typo'd `v33` almost certainly
 * wanted. The failure mode of throwing is a blank site because of a typo in an
 * environment variable, which is a much worse trade at 2am. The warning is
 * there so it does not go unnoticed.
 */

export const SITE_VERSIONS = ["v1", "v2", "v3"] as const;
export type SiteVersion = (typeof SITE_VERSIONS)[number];

/** The current state of the site. */
export const DEFAULT_SITE_VERSION: SiteVersion = "v3";

function isSiteVersion(value: string | undefined): value is SiteVersion {
  return (SITE_VERSIONS as readonly string[]).includes(value ?? "");
}

/** Read and validate SITE_VERSION. Warns once per bad value, never throws. */
function fromEnv(): SiteVersion {
  const raw = process.env.SITE_VERSION?.trim().toLowerCase();
  if (!raw) return DEFAULT_SITE_VERSION;
  if (isSiteVersion(raw)) return raw;
  console.warn(
    `[site-version] SITE_VERSION="${process.env.SITE_VERSION}" is not one of ` +
      `${SITE_VERSIONS.join(", ")}. Falling back to ${DEFAULT_SITE_VERSION}.`,
  );
  return DEFAULT_SITE_VERSION;
}

/**
 * The version to render, given the request's search params.
 *
 * `?v=1` OVERRIDES THE ENVIRONMENT, IN DEVELOPMENT ONLY. Changing an
 * environment variable needs a server restart, which makes comparing three
 * homepages a chore of restarts rather than three tabs. The override makes it
 * three tabs.
 *
 * It is gated on NODE_ENV for the same reason the dev tools are: a query
 * parameter that changes what the site is would otherwise be a query parameter
 * anyone could put in a link, and a shared "look at our homepage" URL that
 * silently serves the old marketing site is a genuinely confusing bug to be
 * handed. `process.env.NODE_ENV` is inlined at build time, so in production
 * this is `if (false && ...)` and the branch is removed.
 */
export function resolveSiteVersion(searchParams?: {
  v?: string | string[];
}): SiteVersion {
  if (process.env.NODE_ENV !== "production" && searchParams) {
    const raw = Array.isArray(searchParams.v) ? searchParams.v[0] : searchParams.v;
    if (raw) {
      // Accept "1" and "v1" alike; nobody wants to remember which.
      const normalised = raw.trim().toLowerCase().replace(/^v?/, "v");
      if (isSiteVersion(normalised)) return normalised;
      console.warn(`[site-version] ?v=${raw} is not a known version. Ignoring.`);
    }
  }
  return fromEnv();
}

/* --------------------------------------------------------------------------
 * Per-version metadata
 *
 * The title, description and social card have to follow the active version. A
 * marketing site, a waitlist and a test are three different promises, and a v3
 * site serving v2's share card would be worse than having no switch at all —
 * every link posted to TikTok would advertise a waitlist that is no longer
 * what the page does.
 * ------------------------------------------------------------------------ */

export interface VersionMeta {
  title: string;
  description: string;
}

export const VERSION_META: Record<SiteVersion, VersionMeta> = {
  v1: {
    title: "Smart Fella or Fart Smella? The dumb little brain game",
    description:
      "A dumb little brain game that knows exactly how smart you are. Get ranked, climb the leaderboard, keep a streak, and flex on your friends. Join the waitlist.",
  },
  v2: {
    // Held to the same honesty rule as the page copy: it may say the game is
    // finished and promise a FUTURE contact, but it must not imply that handing
    // over an email delivers anything.
    title: "Smart Fella or Fart Smella? The dumb little brain game",
    description:
      "The dumb little brain game that knows exactly how smart you are. The game is ready. Drop your email and we'll get you in.",
  },
  v3: {
    // Describes the FORMAT, which is accurate and names nobody's product. No
    // "IQ": nothing certifies an IQ test, and the instruments this format is
    // modelled on say plainly that they are not one.
    title: "Are you a Smart Fella or a Fart Smella? The Official Smart Fella Test",
    description:
      "A cognitive aptitude test, 50 questions in 15 minutes, and a verdict you will not enjoy. Adults take the long one. Kids get five minutes and their own grade.",
  },
};
