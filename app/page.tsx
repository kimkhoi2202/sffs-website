import type { Metadata } from "next";

import { TestFlow } from "@/components/test/test-flow";
import { HomeV1 } from "@/components/versions/home-v1";
import { HomeV2 } from "@/components/versions/home-v2";
import { resolveSiteVersion, VERSION_META } from "@/lib/site-version";

/*
  ============================================================================
  THREE HOMEPAGES LIVE IN THE TREE AT ONCE. SITE_VERSION PICKS ONE.
  ============================================================================

    v1  the original multi-section marketing site  (components/versions/home-v1)
    v2  the single-screen waitlist page            (components/versions/home-v2)
    v3  the Official Smart Fella Test flow         (components/test/test-flow)

  Set SITE_VERSION in the environment; it defaults to v3. In development,
  `?v=1` / `?v=2` / `?v=3` overrides it without a restart. The reasoning for
  all of that, including why a bad value falls back rather than throwing, is in
  lib/site-version.ts.

  Nothing else changes with the version. /privacy, /terms, /support, /about,
  /app-store-copy, /internal and every redirect are live in all three: they are
  not part of a version, they are the site.

  ----------------------------------------------------------------------------
  ARCHIVES, for the record. Both are tags AND branches on the same commit:

    v1  tag homepage-archive-2026-07-30  branch archive/homepage-2026-07-30
    v2  tag homepage-archive-2026-08-01  branch archive/homepage-2026-08-01

  Neither is needed to restore a version any more — all three are in the tree —
  but they are the provenance of what v1 and v2 originally were.

  ----------------------------------------------------------------------------
  THE FOOTER. v1 and v2 render their own <SiteFooter />. v3 does not, and the
  root layout no longer renders one for anybody: it moved to
  app/(site)/layout.tsx, which the flow is deliberately not part of. See the
  note in components/test/step-shell.tsx for why the flow cannot have it.
*/

/**
 * Metadata follows the ACTIVE VERSION.
 *
 * A marketing site, a waitlist and a test are three different promises. A v3
 * site serving v2's share card would mean every link posted to TikTok
 * advertising a waitlist that the page no longer is — worse than having no
 * switch at all.
 *
 * `generateMetadata` rather than a static export because the value is only
 * known at request time (the env var, and the dev query override).
 */
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ v?: string | string[] }>;
}): Promise<Metadata> {
  const version = resolveSiteVersion(await searchParams);
  const { title, description } = VERSION_META[version];

  return {
    title: { absolute: title },
    description,
    // Page-level Open Graph REPLACES the root layout's object rather than
    // merging into it, so type/siteName/url are restated. Images are
    // deliberately omitted so the generated app/opengraph-image card applies.
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

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ v?: string | string[] }>;
}) {
  const version = resolveSiteVersion(await searchParams);

  if (version === "v1") return <HomeV1 />;
  if (version === "v2") return <HomeV2 />;

  return (
    /*
      `data-flow` does two jobs, both of them removing blue from a page that has
      none: globals.css keys the root's overscroll canvas off it (the canvas is
      blue only because the footer is, and this flow has no footer), and it
      marks the subtree as the flow for anything else that needs to know.

      `data-landing` is the marker components/analytics/engagement-tracker.tsx
      gates scroll-depth and section-view tracking on. It is a marker whose only
      job is to be a marker, so tracking cannot silently die the next time this
      page is redesigned — which is exactly how it died on 2026-07-30, when the
      tracker was still keyed to a hero class name that had been deleted.
    */
    <main id="main" data-flow data-landing className="flex flex-1 flex-col">
      <TestFlow />
    </main>
  );
}
