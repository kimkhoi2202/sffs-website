/**
 * Fires `test_challenge_viewed` when somebody opens a shared link.
 *
 * The far end of the sharing loop, and the same one-effect island pattern as
 * ResultsOpenedBeacon next door, for the same reason: app/beat/[token]/page.tsx
 * is a server render and this is one capture.
 *
 * Test, audience and verdict band. NOT the token, for the reason written out
 * on ResultsOpenedBeacon.
 */
"use client";

import { useEffect, useRef } from "react";

import { trackTestChallengeViewed } from "@/lib/analytics/events";
import type { Audience } from "@/lib/test/types";

export function ChallengeBeacon({
  testId,
  audience,
  verdict,
}: {
  testId: string;
  audience: Audience;
  verdict: string;
}) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    trackTestChallengeViewed({ test_id: testId, audience, verdict });
  }, [testId, audience, verdict]);

  return null;
}
