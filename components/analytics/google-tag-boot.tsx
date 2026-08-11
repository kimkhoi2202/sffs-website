"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { retryGoogleTagBoot } from "@/lib/analytics/google-tag";

/**
 * Resumes a Google tag boot that lib/analytics/google-tag.ts deferred because
 * the document opened on /results/[token] or /beat/[token]. Renders nothing.
 *
 * This exists because instrumentation-client.ts runs ONCE per document, before
 * React, and never again for a client-side navigation. Without it the two
 * routes the tag must skip would also be the two routes that permanently
 * disable it: both carry a "Take the test" link into the funnel, that link is a
 * next/link navigation, and a visitor arriving from a shared result would then
 * complete the test with no tag loaded and no conversion recorded.
 *
 * `usePathname` re-renders on every client-side navigation, which is the signal
 * instrumentation-client.ts cannot see. The boot itself stays in the tag module
 * and remains a no-op once started, so this only ever costs a predicate.
 */
export function GoogleTagBoot() {
  const pathname = usePathname();

  useEffect(() => {
    retryGoogleTagBoot();
  }, [pathname]);

  return null;
}
