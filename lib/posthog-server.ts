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

/**
 * W4 — only emit server-side events for real production traffic. Mirrors the
 * client's prod-domain guard so localhost dev and `*.vercel.app` previews never
 * pollute the single prod project with stray conversions.
 */
function isProdRequest(req: NextRequest): boolean {
  if (process.env.NODE_ENV !== "production") return false;
  const host = (req.headers.get("host") ?? "").toLowerCase();
  return host.endsWith("smartfellaorfartsmella.com");
}

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
  /**
   * Whether the submitting browser is marked internal.
   *
   * ===========================================================================
   * WHY THIS HAS TO BE PASSED IN
   * ===========================================================================
   * The internal flag lives in the visitor's own localStorage and as a PostHog
   * super-property the browser SDK attaches client-side. The server has neither,
   * so this event went out with no `is_internal` and a distinct_id the project's
   * test-account filter does not recognise — which meant it bypassed the filter
   * completely. Every client-side series read zero while this one read three,
   * and all three were us testing the flow. A conversion metric that counts the
   * people building the product is worse than no conversion metric.
   *
   * TRUSTING THE CLIENT IS FINE HERE, unusually. The only thing a visitor can
   * do by lying is exclude themselves from our analytics, and claiming `false`
   * is what happens by default anyway. There is nothing to gain and nothing to
   * protect.
   */
  internal = false,
): Promise<void> {
  if (!isProdRequest(req)) return; // W4: prod domain only — no dev/preview pollution
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
        // Same property name the client stamps, so one test-account filter
        // covers both sides. See INTERNAL_PROPERTY in lib/analytics/events.ts.
        ...(internal ? { is_internal: true } : {}),
        ...(platform ? { platform } : {}),
        $process_person_profile: false, // stay anonymous (mirrors identified_only)
      },
    });
    await ph.flush();
  } catch {
    // swallow — the signup already succeeded; analytics is best-effort
  }
}

/**
 * Fire the operational alert for a results mailer that is failing.
 *
 * ===========================================================================
 * THIS IS NOT AN ANALYTICS EVENT AND MUST NOT BE TREATED AS ONE
 * ===========================================================================
 * Everything else in this file measures visitors. This measures US, and it
 * exists for one reason: on 9 August every results email failed for six hours
 * and nothing said so. There WAS already a failure event — the client's
 * `test_email_send_failed` — and it was useless for this, because it fires
 * once per attempt whether the cause is one bad address or a dead provider.
 * You cannot alert on it without alerting on Tuesday.
 *
 * This one fires only when lib/email/send-health.ts has decided the mailer is
 * genuinely down (see the two rules there), which is what makes it something
 * an alert can be pointed at without being muted within a week.
 *
 * CARRIES NO PII AND NO PROVIDER TEXT. Counts and a reason code only. A
 * provider error message can name the recipient, which is exactly how an
 * address ends up somewhere the privacy policy says it is not.
 */
export async function captureSendHealthAlert(
  req: NextRequest,
  alert: {
    kind: string;
    failures: number;
    attempts: number;
    failureRate: number;
    windowMinutes: number;
  },
): Promise<void> {
  if (!isProdRequest(req)) return;
  const ph = getClient();
  if (!ph) return;
  try {
    ph.capture({
      // Deliberately not stitched to the visitor who happened to be unlucky
      // enough to be holding the request when the threshold tipped. This is a
      // fact about the system, and attaching it to a person would put it
      // behind the project's person-level filters.
      distinctId: "sffs-results-mailer",
      event: "results_email_failing",
      properties: {
        alert_kind: alert.kind,
        failures: alert.failures,
        attempts: alert.attempts,
        failure_rate: alert.failureRate,
        window_minutes: alert.windowMinutes,
        server_side: true,
        $process_person_profile: false,
      },
    });
    await ph.flush();
  } catch {
    // swallow — an alert that throws would take the request down with it, and
    // the console line beside this call site is still in the log either way.
  }
}
