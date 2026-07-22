import "server-only";

import { randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";
import { PostHog } from "posthog-node";

/**
 * Server-side PostHog capture for the signup conversion.
 *
 * Firing `email_captured` from `/api/access-signup` (in addition to the client)
 * gives an AD-BLOCKER-PROOF source of truth: even when a visitor blocks the
 * client SDK, the conversion still lands. Uses the PUBLIC project key `phc_…`
 * (never the personal `phx_` key) and hits the direct US ingestion host (the
 * server doesn't need the ad-blocker reverse proxy).
 *
 * PRIVACY INVARIANT: no email or PII is ever sent — source + attribution only.
 * The event stays anonymous (`$process_person_profile: false`, mirroring the
 * client's `identified_only`); the address lives solely in Aurora.
 */

const INGESTION_HOST = "https://us.i.posthog.com";

let client: PostHog | null = null;

function getClient(): PostHog | null {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return null;
  if (!client) {
    // Serverless: flush each event immediately (no batching timer).
    client = new PostHog(key, {
      host: INGESTION_HOST,
      flushAt: 1,
      flushInterval: 0,
    });
  }
  return client;
}

function safeDecode(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

/**
 * Recover the visitor's PostHog `distinct_id` from the `ph_<key>_posthog` cookie
 * so the server event STITCHES to the same person as the client's pageview
 * (completing the funnel). Returns null when the cookie is absent (blocked /
 * cookieless), in which case we fall back to a fresh anonymous id.
 */
function distinctIdFromRequest(req: NextRequest): string | null {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return null;
  const raw = req.cookies.get(`ph_${key}_posthog`)?.value;
  if (!raw) return null;
  for (const candidate of [raw, safeDecode(raw)]) {
    if (!candidate) continue;
    try {
      const parsed = JSON.parse(candidate) as { distinct_id?: unknown };
      if (typeof parsed.distinct_id === "string") return parsed.distinct_id;
    } catch {
      // try the next candidate (encoded vs decoded)
    }
  }
  return null;
}

/** Best-effort `platform` from the landing URL's utm_source (the fetch referer). */
function platformFromReferer(req: NextRequest): string | undefined {
  const ref = req.headers.get("referer");
  if (!ref) return undefined;
  try {
    const source = new URL(ref).searchParams.get("utm_source")?.toLowerCase();
    if (!source) return undefined;
    return (
      ["tiktok", "instagram", "youtube"].find((p) => source.includes(p)) ??
      source
    );
  } catch {
    return undefined;
  }
}

/**
 * Fire the server-side `email_captured` conversion. Never throws — analytics must
 * never break a signup. Awaits a flush so the event actually leaves the
 * (ephemeral) serverless instance before it freezes.
 */
export async function captureEmailCapturedServer(
  req: NextRequest,
  source: string,
): Promise<void> {
  const ph = getClient();
  if (!ph) return;
  try {
    const stitchedId = distinctIdFromRequest(req);
    const platform = platformFromReferer(req);
    ph.capture({
      distinctId: stitchedId ?? randomUUID(),
      event: "email_captured",
      properties: {
        source,
        server_side: true, // lets insights dedupe/split client vs server truth
        stitched: Boolean(stitchedId),
        ...(platform ? { platform } : {}),
        $process_person_profile: false, // stay anonymous (mirrors identified_only)
      },
    });
    await ph.flush();
  } catch {
    // swallow — the signup already succeeded; analytics is best-effort
  }
}
