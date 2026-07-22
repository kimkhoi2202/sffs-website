import "server-only";

/**
 * Server-only client for the SFFS attribution-survey write path.
 *
 * The custom post-signup "How did you find us?" survey POSTs answers here, and
 * this forwards them to the SAME keyless AWS Lambda proxy that email signups use
 * (EMAIL_PROXY_URL), tagged with `kind: "survey"` so the Lambda inserts into
 * Aurora `sffs.survey_responses` instead of `email_signups`. This keeps ALL AWS
 * credentials on the AWS side; the only secret this app holds is the shared
 * secret (EMAIL_PROXY_SECRET) — no AWS keys ever reach Vercel.
 *
 * The `server-only` import turns any accidental client import into a build error
 * so the shared secret never lands in the browser bundle. Env vars are read at
 * call time so a missing value fails the specific request with a clear message.
 *
 * PRIVACY: the survey's PostHog event carries NO PII. The signup `email` (when
 * provided, to tie the answer back to the signup) is stored ONLY in Aurora here,
 * exactly like `email_signups` — never sent to PostHog.
 */

export interface SurveyResponseInput {
  /** Normalized channel: tiktok | instagram | friend | search | other. */
  source: string;
  /** Optional free-text detail. */
  openText?: string | null;
  /** Optional signup email — ties the answer to the signup (Aurora only). */
  email?: string | null;
  /** Optional PostHog distinct_id — stitches the answer to the same person. */
  distinctId?: string | null;
  /** Non-PII context (referrer / user-agent / utm). */
  meta?: Record<string, unknown>;
}

/**
 * Forward a validated survey answer to the proxy. Resolves on success; throws on
 * misconfiguration, a non-2xx proxy response, or a network failure so the caller
 * can return a generic 500 without leaking details.
 */
export async function insertSurveyResponse(
  input: SurveyResponseInput,
): Promise<void> {
  const url = process.env.EMAIL_PROXY_URL;
  const secret = process.env.EMAIL_PROXY_SECRET;
  if (!url || !secret) {
    throw new Error(
      "Survey proxy is not configured: set EMAIL_PROXY_URL and EMAIL_PROXY_SECRET.",
    );
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-shared-secret": secret,
    },
    body: JSON.stringify({
      kind: "survey",
      source: input.source,
      open_text: input.openText ?? null,
      email: input.email ?? null,
      distinct_id: input.distinctId ?? null,
      meta: input.meta ?? {},
    }),
    // A survey answer is a mutation — never cache it.
    cache: "no-store",
  });

  if (!res.ok) {
    let detail = "";
    try {
      detail = (await res.text()).slice(0, 200);
    } catch {
      // ignore — the status code is enough to signal failure
    }
    throw new Error(`survey proxy responded ${res.status}: ${detail}`);
  }
}
