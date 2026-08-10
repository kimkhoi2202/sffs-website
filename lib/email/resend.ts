/**
 * Sending mail through Resend.
 *
 * ===========================================================================
 * SERVER ONLY
 * ===========================================================================
 * `import "server-only"` is the enforcement, not the comment: importing this
 * from a client component is a BUILD ERROR, the same guard lib/email-store.ts
 * and lib/survey-store.ts already use. RESEND_API_KEY is deliberately not
 * prefixed NEXT_PUBLIC_, so it cannot be inlined into a browser bundle even by
 * accident. Nothing here is ever reachable from the client.
 *
 * ===========================================================================
 * A DEPENDENCY WAS NOT ADDED FOR THIS
 * ===========================================================================
 * Resend publishes an SDK. Sending an email is one POST with a JSON body, and
 * the SDK's value is types we would write anyway plus retry behaviour we do not
 * want (a retried send is a duplicate email). Twenty lines of `fetch` is the
 * whole integration.
 *
 * ===========================================================================
 * THE SANDBOX SENDER, AND WHY YOU MIGHT NOT RECEIVE ANYTHING
 * ===========================================================================
 * Until a sending domain is DNS-verified, Resend will only deliver from
 * `onboarding@resend.dev`, and only to the account owner's own address.
 * Everything else is accepted by the API and quietly goes nowhere. That is a
 * Resend policy and there is no way around it, so it is not worked around here.
 *
 * Switching to a verified sender is a change to RESEND_FROM in the environment
 * and NOTHING IN THIS FILE. The DNS records needed are written out in
 * docs/test-content/resend-domain-setup.md.
 */
import "server-only";

import { SUPPORT_EMAIL } from "../support-contact";

const ENDPOINT = "https://api.resend.com/emails";

/** Re-exported so callers already importing it from here keep working. */
export { SUPPORT_EMAIL };

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/**
 * Why a send did not happen.
 *
 * ===========================================================================
 * `quota` IS SPLIT OUT BECAUSE IT IS THE ONE THAT DOES NOT CLEAR
 * ===========================================================================
 * Every other reason here is either permanent (`not_configured`) or plausibly
 * over by the time the person presses the button again. `quota` is neither: on
 * 9 August the account exhausted its daily allowance at 17:52 UTC and every
 * send failed for the next six hours. The route told all 78 of them to "try
 * again in a moment", which was false every single time, and they averaged
 * four attempts each finding that out.
 *
 * A caller cannot say anything honest about a failure it cannot name, so this
 * is named. See `classifyFailure` for how it is told apart from the OTHER 429
 * Resend sends, which genuinely is over in a second.
 */
export type SendFailureReason = "not_configured" | "quota" | "rejected" | "network";

export type SendEmailResult =
  | { ok: true; id: string }
  | {
      ok: false;
      reason: SendFailureReason;
      detail: string;
      /** The provider's HTTP status, when there was one. Logs and metrics only. */
      status?: number;
    };

/**
 * Which kind of refusal this is.
 *
 * BOTH OF RESEND'S LIMITS ANSWER 429 AND THEY MEAN OPPOSITE THINGS.
 * `rate_limit_exceeded` is the per-second cap: the next request a moment later
 * succeeds, and "try again in a moment" is exactly right for it.
 * `daily_quota_exceeded` is the daily allowance: nothing succeeds until it
 * resets, and inviting a retry is inviting somebody to press a dead button.
 *
 * So the NAME decides, not the status. An unnamed 429 falls through to
 * `rejected` — the retryable reading — deliberately: telling somebody their
 * results are stuck until tomorrow when in fact the next attempt would have
 * worked is the worse of the two mistakes, and the sustained-failure detector
 * in ./send-health.ts catches a run of them regardless of what they are called.
 */
function classifyFailure(name: string): SendFailureReason {
  return name.toLowerCase().includes("quota") ? "quota" : "rejected";
}

/** True when the sender is still the shared sandbox address. */
export function usingSandboxSender(): boolean {
  return (process.env.RESEND_FROM ?? "").includes("resend.dev");
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;

  if (!key || !from) {
    return {
      ok: false,
      reason: "not_configured",
      detail: "RESEND_API_KEY and RESEND_FROM must both be set.",
    };
  }

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        authorization: `Bearer ${key}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
        // Every mailbox provider wants a machine-readable way out, and there is
        // no preference centre to point at, so the mailbox IS the mechanism.
        headers: { "List-Unsubscribe": `<mailto:${SUPPORT_EMAIL}?subject=unsubscribe>` },
      }),
      cache: "no-store",
    });

    const body = (await res.json().catch(() => null)) as
      | { id?: string; message?: string; name?: string }
      | null;

    if (!res.ok) {
      // The message is for OUR logs. It is never returned to the browser: a
      // provider error string can name the recipient, and the caller turns this
      // into copy of its own choosing.
      const name = body?.name ?? "";
      return {
        ok: false,
        reason: classifyFailure(name),
        detail: `${res.status} ${name} ${body?.message ?? ""}`.trim(),
        status: res.status,
      };
    }

    return { ok: true, id: body?.id ?? "unknown" };
  } catch (err) {
    return {
      ok: false,
      reason: "network",
      detail: err instanceof Error ? err.message : "fetch failed",
    };
  }
}
