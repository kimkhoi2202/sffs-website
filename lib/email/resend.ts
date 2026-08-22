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
  /**
   * Extra headers, merged over the transactional default below.
   *
   * This exists for the ONE-CLICK UNSUBSCRIBE pair that bulk mail needs
   * (RFC 8058: `List-Unsubscribe` pointing at an https URL plus
   * `List-Unsubscribe-Post: List-Unsubscribe=One-Click`). Gmail and Yahoo both
   * expect it from anyone sending in volume, and mail without it is judged on
   * that before it is judged on its contents.
   *
   * Resend passes `headers` through verbatim, so there is no SDK-specific
   * option to find: the pair goes on the wire exactly as written here.
   *
   * lib/email/product-email.ts is the only caller, and it supplies a
   * per-recipient URL. The results email deliberately does not, and keeps the
   * mailto default below.
   */
  headers?: Record<string, string>;
  /** Resend metadata returned on delivery/open/click webhook events. */
  tags?: Array<{ name: string; value: string }>;
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
export type SendFailureReason =
  | "not_configured"
  | "quota"
  | "rate_limited"
  | "rejected"
  | "network";

export type SendEmailResult =
  | { ok: true; id: string }
  | {
      ok: false;
      reason: SendFailureReason;
      detail: string;
      /** The provider's HTTP status, when there was one. Logs and metrics only. */
      status?: number;
      /**
       * Seconds the provider asked us to wait, from its `Retry-After` header.
       * Only ever set on `rate_limited`. Absent when the header was missing or
       * unparseable, which is the common case and why callers need a backoff of
       * their own rather than treating this as required.
       */
      retryAfterSeconds?: number;
    };

/**
 * Which kind of refusal this is.
 *
 * BOTH OF RESEND'S LIMITS ANSWER 429 AND THEY MEAN OPPOSITE THINGS.
 * `rate_limit_exceeded` is the per-second cap, currently 10 requests a second
 * across the whole team: the next request a moment later succeeds.
 * `daily_quota_exceeded` is the plan allowance: nothing succeeds until it
 * resets, and inviting a retry is inviting somebody to press a dead button.
 *
 * ===========================================================================
 * THE THIRD ANSWER EXISTS BECAUSE TWO CALLERS READ `rejected` DIFFERENTLY
 * ===========================================================================
 * An unnamed 429 used to fall through to `rejected` on the reasoning that
 * `rejected` was "the retryable reading". That was true of the send route,
 * which offers the person a retry, and FALSE of the drain, which treats
 * `rejected` as permanent and writes a `dropped` row. So the one condition
 * that is guaranteed to clear on its own was the one condition that could
 * permanently delete somebody from the backlog, and a fast batch is exactly
 * what provokes it. Nobody has been lost this way yet; scheduling the drain
 * without this split is what would have started.
 *
 * A rate limit is therefore named in its own right, and it is decided by the
 * STATUS as well as the name: any 429 that is not a quota refusal is a rate
 * limit. Relying on the name alone would leave an unnamed 429 falling back
 * into the permanent bucket, which is the bug being fixed.
 *
 * `rejected` now means only what the drain always assumed it meant: this
 * specific message will never be accepted.
 */
function classifyFailure(name: string, status: number): SendFailureReason {
  if (name.toLowerCase().includes("quota")) return "quota";
  if (status === 429) return "rate_limited";
  return "rejected";
}

/**
 * Seconds from a `Retry-After` header, when it is present and sane.
 *
 * Only the delta-seconds form is honoured. The HTTP-date form is legal and
 * Resend does not send it; parsing a date against our own clock would turn a
 * skewed machine into a wait of arbitrary length, which is worse than the
 * caller's own backoff. Anything absurd is discarded for the same reason.
 */
function retryAfterSeconds(header: string | null): number | undefined {
  if (!header) return undefined;
  const seconds = Number(header.trim());
  if (!Number.isFinite(seconds) || seconds <= 0 || seconds > 300) return undefined;
  return seconds;
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
        // Every mailbox provider wants a machine-readable way out. The default
        // is the mailbox itself, which is all a transactional message needs and
        // all that was available before there was a suppression list.
        //
        // A PRODUCT send overrides this with the https one-click pair. A mailto
        // is not enough for bulk mail: it asks a provider to trust that a human
        // will read that inbox and act on it, which is exactly what Gmail's and
        // Yahoo's bulk-sender rules stopped accepting.
        headers: {
          "List-Unsubscribe": `<mailto:${SUPPORT_EMAIL}?subject=unsubscribe>`,
          ...input.headers,
        },
        ...(input.tags ? { tags: input.tags } : {}),
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
      const reason = classifyFailure(name, res.status);
      const after =
        reason === "rate_limited" ? retryAfterSeconds(res.headers.get("retry-after")) : undefined;
      return {
        ok: false,
        reason,
        detail: `${res.status} ${name} ${body?.message ?? ""}`.trim(),
        status: res.status,
        ...(after === undefined ? {} : { retryAfterSeconds: after }),
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
