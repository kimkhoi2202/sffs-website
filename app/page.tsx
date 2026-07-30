import type { Metadata } from "next";

import { EarlyAccess } from "@/components/sections/early-access";

/*
  ============================================================================
  THE OLD HOMEPAGE IS ARCHIVED, NOT DELETED. HERE IS HOW TO GET IT BACK.
  ============================================================================

  Until 2026-07-30 this route was a long scrolling landing page: animated hero,
  three steps, "which one are you" comparison, feature grid, testimonial
  marquee, waitlist band, FAQ, brand closer, video showcase. It produced one
  real signup, so it was replaced with the single-purpose early-access page
  below. This is meant to be reversible.

  The old page is preserved at BOTH of these, which point at the same commit:

    tag     homepage-archive-2026-07-30   (annotated, pushed to origin)
    branch  archive/homepage-2026-07-30   (pushed to origin)

  Restore it with one command, from main:

    git checkout homepage-archive-2026-07-30 -- app/page.tsx

  That is the whole restore. Every section component the old page imported
  (steps, comparison, feature-grid, testimonials, waitlist, faq,
  video-showcase, section-divider, smart-fart-hero, quiz-nav) is still in the
  tree untouched, so the restored file compiles as-is. Nothing else has to be
  reverted, and /about keeps using comparison + faq either way.
*/

export const metadata: Metadata = {
  title: { absolute: "Smart Fella or Fart Smella? Get early access" },
  description:
    "A dumb little brain game that knows exactly how smart you are. Drop your email to get early access to the game before it launches.",
  // Page-level Open Graph REPLACES the root layout's object rather than merging
  // into it, so type/siteName/url are restated here. Images are deliberately
  // omitted so the generated app/opengraph-image card still applies.
  openGraph: {
    type: "website",
    siteName: "Smart Fella or Fart Smella",
    title: "Smart Fella or Fart Smella? Get early access",
    description:
      "The dumb little brain game that knows exactly how smart you are. Get early access before it launches.",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Smart Fella or Fart Smella? Get early access",
    description:
      "The dumb little brain game that knows exactly how smart you are. Get early access before it launches.",
  },
};

export default function HomePage() {
  return (
    <main id="main" className="flex-1">
      <EarlyAccess />
    </main>
  );
}
