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

const ENDPOINT = "https://api.resend.com/emails";

/** Where a reply or an unsubscribe request goes. Matches the legal pages. */
export const SUPPORT_EMAIL = "smartfellaorfartsmella123@gmail.com";

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export type SendEmailResult =
  | { ok: true; id: string }
  | { ok: false; reason: "not_configured" | "rejected" | "network"; detail: string };

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
      // into a generic retryable failure.
      return {
        ok: false,
        reason: "rejected",
        detail: `${res.status} ${body?.name ?? ""} ${body?.message ?? ""}`.trim(),
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
