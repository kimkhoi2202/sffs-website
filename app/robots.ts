import type { MetadataRoute } from "next";

import { siteOrigin } from "@/lib/site-url";

/**
 * Both of the things a crawler asks for, and one real rule.
 *
 * `/results/*` IS DISALLOWED. Those URLs carry a signed token that renders
 * somebody's score, and while the token is unguessable, links leak: they get
 * pasted into chats, forwarded, and picked up by anything that follows a URL.
 * A results page in a search index is a score with a stranger's name nowhere on
 * it but their link permanently public. Nothing about that page wants to be
 * found by search, so nothing about it should be crawled.
 *
 * Everything else is open, which is the point of the site.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/results/", "/api/"],
    },
    sitemap: `${siteOrigin()}/sitemap.xml`,
  };
}
