/**
 * Fires `results_link_opened` when someone follows the link from their email.
 *
 * A one-effect client island rather than turning app/results/[token]/page.tsx
 * into a client component, which would drag the whole results tree across the
 * boundary for the sake of a single capture.
 *
 * It records the test and the audience. NOT the token: a token is a durable
 * per-person handle to a specific result, and putting one in an analytics
 * property turns a no-PII event stream into a set of keys that open individual
 * people's pages.
 */
"use client";

import { useEffect, useRef } from "react";

import { trackResultsLinkOpened } from "@/lib/analytics/events";
import type { Audience } from "@/lib/test/types";

export function ResultsOpenedBeacon({
  testId,
  audience,
}: {
  testId: string;
  audience: Audience;
}) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    trackResultsLinkOpened({ test_id: testId, audience });
  }, [testId, audience]);

  return null;
}
