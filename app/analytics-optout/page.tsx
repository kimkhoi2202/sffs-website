import type { Metadata } from "next";

import { AnalyticsOptOut } from "@/components/analytics/analytics-optout";

export const metadata: Metadata = {
  title: "Exclude my traffic",
  description:
    "Team tool — turn Smart Fella or Fart Smella product analytics off for this browser so your own visits aren't counted.",
  // Internal utility page — keep it out of search results.
  robots: { index: false, follow: false },
  alternates: { canonical: "/analytics-optout" },
};

export default function AnalyticsOptOutPage() {
  return <AnalyticsOptOut />;
}
