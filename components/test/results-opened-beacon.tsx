/**
 * Fires `results_link_opened` when someone opens a results page.
 *
 * A one-effect client island rather than turning app/results/[token]/page.tsx
 * into a client component, which would drag the whole results tree across the
 * boundary for the sake of a single capture.
 *
 * It records the test, the audience and WHICH ROUTE got them here. Not the
 * token: a token is a durable per-person handle to a specific result, and
 * putting one in an analytics property turns a no-PII event stream into a set
 * of keys that open individual people's pages.
 */
"use client";

import { useEffect, useRef } from "react";

import { trackResultsLinkOpened } from "@/lib/analytics/events";
import type { ResultsOpenSource } from "@/lib/test/results-url";
import type { Audience } from "@/lib/test/types";

export function ResultsOpenedBeacon({
  testId,
  audience,
  source,
}: {
  testId: string;
  audience: Audience;
  /** "email" for a link from an inbox, "saved" for the returning-visitor offer. */
  source: ResultsOpenSource;
}) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    trackResultsLinkOpened({ test_id: testId, audience, source });
  }, [testId, audience, source]);

  return null;
}
