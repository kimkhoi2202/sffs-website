import "server-only";

/**
 * Server-only client for the SFFS email-signup proxy.
 *
 * The website no longer talks to a database directly. It POSTs validated leads
 * to a small AWS Lambda (fronted by API Gateway) that inserts them into Aurora
 * (sffs.email_signups) via the RDS Data API. This keeps ALL AWS credentials on
 * the AWS side (the Lambda's execution role); the ONLY secret this app holds is
 * a random shared secret (EMAIL_PROXY_SECRET) sent in the `x-shared-secret`
 * header. No AWS access keys ever reach Vercel.
 *
 * The `server-only` import turns any accidental client import into a build
 * error, so the shared secret is never inlined into the browser bundle (it is
 * also not NEXT_PUBLIC). Env vars are read at call time so a missing value fails
 * the specific request with a clear message instead of crashing at boot.
 */

export interface EmailSignupInput {
  email: string;
  source: string;
  meta: Record<string, unknown>;
}

/**
 * Forward a validated lead to the proxy. Resolves on success — including a
 * deduped repeat submit, which the proxy treats as success (ON CONFLICT DO
 * NOTHING). Throws on misconfiguration, a non-2xx proxy response, or a network
 * failure so the caller can return a generic 500 without leaking details.
 */
export async function insertEmailSignup(input: EmailSignupInput): Promise<void> {
  const url = process.env.EMAIL_PROXY_URL;
  const secret = process.env.EMAIL_PROXY_SECRET;
  if (!url || !secret) {
    throw new Error(
      "Email proxy is not configured: set EMAIL_PROXY_URL and EMAIL_PROXY_SECRET.",
    );
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-shared-secret": secret,
    },
    body: JSON.stringify(input),
    // A signup is a mutation — never cache it.
    cache: "no-store",
  });

  if (!res.ok) {
    // Capture a short body for server logs only; never surface it to the client.
    let detail = "";
    try {
      detail = (await res.text()).slice(0, 200);
    } catch {
      // ignore — the status code is enough to signal failure
    }
    throw new Error(`email proxy responded ${res.status}: ${detail}`);
  }
}
