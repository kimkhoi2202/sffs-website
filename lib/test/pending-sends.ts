import "server-only";

/**
 * Reading back the results emails that were promised and never went out.
 *
 * ===========================================================================
 * WHAT A PENDING SEND IS
 * ===========================================================================
 * `app/api/test-results/send/route.ts` writes a `pending` row to `test_results`
 * immediately BEFORE it calls Resend, carrying the address and the signed
 * result token. If the send then succeeds an `emailed` row follows, sharing a
 * `send_key`. So a pending row with no `emailed` (or `dropped`) sibling is
 * somebody who asked for their results and did not get them.
 *
 * That is the whole recovery. On 9 August it would have turned six hours of
 * total failure into a list of 77 addresses; what it actually turned into was
 * 78 anonymous PostHog ids and nothing else.
 *
 * ===========================================================================
 * THE ONE THING THE APP READS BACK OUT OF AURORA
 * ===========================================================================
 * Everything else in this codebase writes to the proxy and never asks for
 * anything in return — see lib/email-store.ts and ./result-stats.ts, both of
 * which are one-way. This is the exception, and it exists because a queue you
 * cannot read is not a queue.
 *
 * ===========================================================================
 * IT NEEDS A LAMBDA BRANCH, AND IT SAYS SO WHEN THAT IS MISSING
 * ===========================================================================
 * `kind: "pending_sends"` was deployed to the proxy on 10 August 2026, so the
 * `unavailable` branch below should not fire in production. It is kept because
 * the proxy is deployed by hand from a vendored mirror with nothing in CI
 * watching it, so a rollback to an older zip would bring the gap straight back.
 *
 * A proxy that predates the read answers `400 invalid_kind`, which this maps to
 * a distinct `unavailable` rather than folding into a generic error — the
 * difference between "there is nothing to drain" and "we cannot see whether
 * there is anything to drain" is the entire value of the report, and a drain
 * that quietly returned "0 pending" on a proxy that could not answer would be a
 * worse version of the bug this whole change is about.
 *
 * infra/lambda/sffs-email-proxy/lambda_function.py holds the branch and
 * infra/lambda/README.md holds the one command that ships it.
 */

export interface PendingSend {
  /** Opaque key tying this to its outcome row. See sendKeyFor in ./result-stats.ts. */
  sendKey: string;
  email: string;
  /** The signed results token, which is the whole result. See ./result-token.ts. */
  token: string;
  /** ISO 8601, from Aurora. */
  pendingSince: string;
}

export type PendingSendsResult =
  | { ok: true; sends: PendingSend[] }
  | {
      ok: false;
      /**
       * `unavailable` means the proxy does not implement the read yet, and is
       * the only one of these with a one-command fix.
       */
      reason: "not_configured" | "unavailable" | "error";
      detail: string;
    };

/** Matches MAX_PENDING_LIMIT in the Lambda; asking for more just gets clamped. */
export const MAX_DRAIN_BATCH = 200;

export async function fetchPendingSends(opts: {
  limit: number;
  maxAgeHours: number;
}): Promise<PendingSendsResult> {
  const url = (process.env.RESULTS_STATS_URL || process.env.EMAIL_PROXY_URL)?.trim();
  const secret = process.env.EMAIL_PROXY_SECRET;
  if (!url || !secret) {
    return {
      ok: false,
      reason: "not_configured",
      detail: "EMAIL_PROXY_URL and EMAIL_PROXY_SECRET are required to read the backlog.",
    };
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", "x-shared-secret": secret },
      body: JSON.stringify({
        kind: "pending_sends",
        limit: Math.max(1, Math.min(opts.limit, MAX_DRAIN_BATCH)),
        max_age_hours: opts.maxAgeHours,
      }),
      cache: "no-store",
    });
  } catch (err) {
    return {
      ok: false,
      reason: "error",
      detail: err instanceof Error ? err.message : "fetch failed",
    };
  }

  const body = (await res.json().catch(() => null)) as {
    ok?: unknown;
    error?: unknown;
    sends?: unknown;
  } | null;

  if (!res.ok) {
    // The signature of a proxy that predates this branch. Named, because it is
    // the one failure here with a remedy somebody can act on in a minute.
    if (res.status === 400 && body?.error === "invalid_kind") {
      return {
        ok: false,
        reason: "unavailable",
        detail:
          "The email proxy does not implement kind=pending_sends yet. Deploy " +
          "infra/lambda/sffs-email-proxy (see infra/lambda/README.md) and retry.",
      };
    }
    return { ok: false, reason: "error", detail: `proxy responded ${res.status}` };
  }

  if (!Array.isArray(body?.sends)) {
    return { ok: false, reason: "error", detail: "proxy returned no sends array" };
  }

  /*
    Validated rather than trusted, even though we wrote every one of these rows
    ourselves. A row with a null token or a blank address cannot be sent and
    would otherwise become an exception in the middle of a batch, taking the
    rest of the drain down with it.
  */
  const sends: PendingSend[] = [];
  for (const raw of body.sends) {
    const row = raw as Partial<PendingSend>;
    if (
      typeof row.sendKey === "string" &&
      typeof row.email === "string" &&
      typeof row.token === "string" &&
      row.sendKey &&
      row.email &&
      row.token
    ) {
      sends.push({
        sendKey: row.sendKey,
        email: row.email,
        token: row.token,
        pendingSince: typeof row.pendingSince === "string" ? row.pendingSince : "",
      });
    }
  }

  return { ok: true, sends };
}
