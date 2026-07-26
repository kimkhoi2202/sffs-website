import type { Metadata } from "next";

import { AnalyticsOptOut } from "@/components/analytics/analytics-optout";

export const metadata: Metadata = {
  title: "Internal user",
  description:
    "Team tool: mark this browser as internal so your Smart Fella or Fart Smella visits still record but stay out of the public metrics.",
  // Internal utility page — keep it out of search results.
  robots: { index: false, follow: false },
  alternates: { canonical: "/internal" },
};

export default function InternalPage() {
  return <AnalyticsOptOut />;
}
