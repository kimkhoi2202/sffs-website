import type { Metadata } from "next";

import { HomeSignup } from "@/components/sections/home-signup";

/*
  ============================================================================
  THE OLD HOMEPAGE IS ARCHIVED, NOT DELETED. HERE IS HOW TO GET IT BACK.
  ============================================================================

  Until 2026-07-30 this route was a long scrolling landing page: animated hero,
  three steps, "which one are you" comparison, feature grid, testimonial
  marquee, waitlist band, FAQ, brand closer, video showcase. It produced one
  real signup, so it was replaced with the single-purpose email-capture screen
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

// Metadata is held to the SAME honesty rule as the page copy: it may say the
// game is finished and it may say we will get you in, but it must not imply
// that handing over an email delivers anything. No "early", no percentage, no
// discount, no claim that a link is on its way.
const SHARE_DESCRIPTION =
  "The dumb little brain game that knows exactly how smart you are. The game is ready. Drop your email and we'll get you in.";

export const metadata: Metadata = {
  title: { absolute: "Smart Fella or Fart Smella? The dumb little brain game" },
  description: SHARE_DESCRIPTION,
  // Page-level Open Graph REPLACES the root layout's object rather than merging
  // into it, so type/siteName/url are restated here. Images are deliberately
  // omitted so the generated app/opengraph-image card still applies.
  openGraph: {
    type: "website",
    siteName: "Smart Fella or Fart Smella",
    title: "Smart Fella or Fart Smella?",
    description: SHARE_DESCRIPTION,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Smart Fella or Fart Smella?",
    description: SHARE_DESCRIPTION,
  },
};

export default function HomePage() {
  return (
    /*
      `data-landing` is what components/analytics/engagement-tracker.tsx gates
      on. It is a marker whose only job is to be a marker, so that scroll-depth
      and section-view tracking cannot silently die the next time this page is
      redesigned, which is exactly how it died on 2026-07-30: the tracker was
      still keyed to the old hero's class name.
    */
    <main id="main" data-landing className="flex-1">
      <HomeSignup />
    </main>
  );
}
