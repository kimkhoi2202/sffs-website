import type { Metadata } from "next";

import { TestFlow } from "@/components/test/test-flow";
import { HomeV1 } from "@/components/versions/home-v1";
import { HomeV2 } from "@/components/versions/home-v2";
import { resolveSiteVersion, VERSION_META } from "@/lib/site-version";
import type { EntrySeed } from "@/lib/test/entry";

/**
 * The one screen behind every deep-entry route.
 *
 * `/adult`, `/grownup`, `/kids` and `/kids/[grade]` differ by a seed and
 * nothing else, so they are four thin route files over this. A private `_`
 * folder rather than a component, because it is a page body and its neighbours
 * (app/_og) are the same idea.
 *
 * ===========================================================================
 * WHY THESE ROUTES RESPECT SITE_VERSION
 * ===========================================================================
 * `SITE_VERSION` is the rollback lever: if the test converts worse than the
 * waitlist it replaced, `SITE_VERSION=v2` and a redeploy puts the old page back
 * without reverting anything (see lib/site-version.ts). A route that rendered
 * the test unconditionally would be a hole in that lever — the ads would keep
 * pouring traffic into the thing that had just been rolled back, and it would
 * take a second deploy and somebody remembering these files exist to notice.
 *
 * So a non-v3 site serves the active homepage here too. The URL still works,
 * the ad still lands somewhere real, and the lever still means what it says.
 */

export type EntrySearchParams = Promise<{ v?: string | string[] }>;

/**
 * Metadata for an entry route: the active version's copy, plus two rules of
 * its own.
 *
 * NOINDEX, AND CANONICAL BACK TO `/`. These are paid entry points, not pages.
 * They render the same flow as the homepage from the same content, so leaving
 * them indexable would put four near-identical documents in the index and split
 * the homepage's own signal between them. `follow` stays on: there is nothing
 * wrong with the links, only with treating the page as a separate destination.
 */
export async function entryMetadata(searchParams: EntrySearchParams): Promise<Metadata> {
  const version = resolveSiteVersion(await searchParams);
  const { title, description } = VERSION_META[version];

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: "/" },
    robots: { index: false, follow: true },
    openGraph: {
      type: "website",
      siteName: "Smart Fella or Fart Smella",
      title,
      description,
      url: "/",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export async function EntryScreen({
  seed,
  searchParams,
}: {
  seed: EntrySeed;
  searchParams: EntrySearchParams;
}) {
  const version = resolveSiteVersion(await searchParams);

  if (version === "v1") return <HomeV1 />;
  if (version === "v2") return <HomeV2 />;

  return (
    // Same wrapper as app/page.tsx, and for the same two reasons: `data-flow`
    // keeps the root's overscroll canvas off blue on a page with no footer, and
    // `data-landing` is the marker the engagement tracker gates on.
    <main id="main" data-flow data-landing className="flex flex-1 flex-col">
      <TestFlow entry={seed} />
    </main>
  );
}
