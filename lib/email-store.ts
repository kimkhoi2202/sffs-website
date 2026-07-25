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

export interface EmailSignupResult {
  /**
   * True when this call actually created a row. False when the address was
   * already on the list and `ON CONFLICT DO NOTHING` suppressed the insert.
   *
   * The caller uses this to decide whether the submit is a real conversion. A
   * repeat submit is still a success for the visitor (same status, same body),
   * it just must not be counted twice.
   */
  inserted: boolean;
}

/**
 * Forward a validated lead to the proxy. Resolves on success — including a
 * deduped repeat submit, which the proxy treats as success (ON CONFLICT DO
 * NOTHING). Throws on misconfiguration, a non-2xx proxy response, or a network
 * failure so the caller can return a generic 500 without leaking details.
 */
export async function insertEmailSignup(
  input: EmailSignupInput,
): Promise<EmailSignupResult> {
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

  /*
    Read the proxy's row-created flag. The proxy's insert uses RETURNING, so a
    row comes back only when ON CONFLICT did not fire.

    FAIL OPEN on purpose. A proxy build that predates this flag sends no such
    field, and treating "absent" as false would silently drop every conversion
    event to zero, which is far worse than the double-count this replaces. So an
    absent or unparseable flag means "count it", exactly matching the old
    behavior, and the dedupe only starts once the proxy actually reports.

    Accepts `inserted` or `created` so this does not hinge on which name the
    proxy settles on.
  */
  let inserted = true;
  try {
    const data = (await res.json()) as {
      inserted?: unknown;
      created?: unknown;
    } | null;
    if (typeof data?.inserted === "boolean") inserted = data.inserted;
    else if (typeof data?.created === "boolean") inserted = data.created;
  } catch {
    // No body, or not JSON: keep the fail-open default.
  }

  return { inserted };
}
