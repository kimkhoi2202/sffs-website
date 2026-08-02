import type { MetadataRoute } from "next";

import { siteOrigin } from "@/lib/site-url";

/**
 * The pages worth indexing, listed by hand.
 *
 * By hand rather than crawled off the route tree, because the route tree
 * contains things that must not be in here: `/results/[token]` is somebody's
 * private score, `/internal` and `/app-store-copy` are working documents, and
 * `/tiktok` is an OAuth surface. An automatic list would include all four and
 * nobody would notice until they were indexed.
 *
 * The homepage is the test now, which is why it is the only `weekly` entry and
 * the only priority 1. The rest are legal and support pages that change when
 * the policy changes and not otherwise.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteOrigin();
  const now = new Date();

  return [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/support`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}
