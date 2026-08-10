import "server-only";

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { EMAIL_SOURCES } from "../email-sources";
import { emailStoreMode } from "../email-store-mode";
import type { Audience, Grade, GradeBand } from "./types";

/**
 * The durable record of a finished attempt, kept so a per-grade-band percentile
 * becomes possible later.
 *
 * ===========================================================================
 * THIS IS A SEPARATE THING FROM THE RESULTS LINK, ON PURPOSE
 * ===========================================================================
 * The link is stateless and carries its own result (see ./result-token.ts).
 * That fixes the emailed link but stores nothing, and "how did this score
 * compare to other grade 5s" needs rows that outlive the request.
 *
 * These are the rows. They are written once, never read back by the app, and
 * never updated. Nothing in the user-facing flow depends on this succeeding, so
 * a failure here is logged and swallowed rather than surfaced: losing a
 * statistic is not worth failing a request the visitor cannot retry.
 *
 * ===========================================================================
 * THE ADDRESS IS STORED WITH THE RESULT, AND THE PRIVACY PAGE SAYS SO.
 * ===========================================================================
 * It did not used to be, and that separation was stated as a promise on
 * /privacy. The promise changed deliberately rather than quietly: knowing which
 * result a person is asking about is what makes it possible to answer them, to
 * honour a deletion request properly, and to see whether the people who convert
 * score differently from the people who do not.
 *
 * Two things follow and both are load-bearing. On the CHILD branch the address
 * is a parent's and the result is their child's, which the privacy page now
 * states in those words rather than leaving it to be inferred. And a deletion
 * request has to remove these rows too, not just the mailing list — a promise
 * to forget somebody that leaves their score behind is not one.
 *
 * The address is only ever attached to an `emailed` row, and only because the
 * person typed it in asking us to send results there.
 *
 * ===========================================================================
 * THE ENDPOINT
 * ===========================================================================
 * The same Lambda, URL and shared secret as the signup path, discriminated by
 * `kind: "result"`. It writes a table with NO EMAIL COLUMN, which is what makes
 * the separation above structural: there is nowhere to put an address even if
 * some future caller tried to pass one.
 *
 * `RESULTS_STATS_URL` overrides the endpoint if the two ever need to diverge;
 * absent, this uses EMAIL_PROXY_URL, so there are no second credentials to
 * manage and nothing to forget to set.
 *
 * The Lambda validates rather than trusting us — a score above its max, a score
 * above 200, a grade outside 3 to 8 and an unknown test type are all rejected —
 * so a bug on this side becomes a 4xx in the log instead of a nonsense row.
 */

/**
 * WHEN THE ROW WAS WRITTEN, and therefore what is on it.
 *
 * ===========================================================================
 * SEVERAL ROWS PER EMAILED RESULT, AND WHY THAT IS NOT A BUG
 * ===========================================================================
 * A result is finished minutes before an address is typed, and the endpoint
 * only inserts — there is no update, so a row written at completion can never
 * gain an email later. That leaves exactly two options: write once at
 * completion and never learn the address, or write again when it arrives.
 *
 * The second, because the address-to-result link is the thing that cannot be
 * reconstructed afterwards. A missing percentile can be recomputed from the
 * rows we have; a missing link is gone.
 *
 *   completed  one row per finished test, no address. The population a
 *              percentile is computed against.
 *   pending    an address we are ABOUT to send to, written before the provider
 *              is called. See the block below — this is the whole recovery.
 *   emailed    a message that actually left, carrying the address.
 *   dropped    a pending send the drain gave up on for a reason retrying will
 *              not fix. Exists to take it out of the backlog; see
 *              lib/test/pending-sends.ts.
 *
 * SO ANYTHING COUNTING RESULTS MUST FILTER ON THIS. Counting stages together
 * double-counts every conversion, and counting `pending` as either a
 * completion or a conversion asserts something that has not happened.
 *
 * ===========================================================================
 * `pending` IS WRITTEN BEFORE THE SEND, WHICH IS THE ENTIRE POINT
 * ===========================================================================
 * On 9 August the Resend account hit its daily quota at 17:52 UTC and every
 * results email failed for six hours. Seventy-eight people were affected and
 * seventy-seven never got their results — and not one of them could be
 * identified afterwards, because the route sent first and wrote afterwards. A
 * 429 returned 502 having written nothing: no `emailed` row, no signup, the
 * address nowhere at all. What survived was 78 anonymous PostHog ids and a
 * masked field in a replay.
 *
 * A `pending` row is written BEFORE the provider is called, so the address
 * survives whatever happens next — a refusal, a timeout, the instance being
 * frozen mid-await. It carries the signed token as well as the address, which
 * is what makes it actionable rather than merely sad: the token is the whole
 * result (see ./result-token.ts), so a `pending` row is a complete instruction
 * to send that person their results later.
 *
 * ===========================================================================
 * AND IT MUST NOT BECOME A SIGNUP OR A COMPLETION BY ACCIDENT
 * ===========================================================================
 * This is the part that is easy to get wrong, because "we now have the
 * address" and "we sent them something" look the same from a distance and the
 * dashboard means the second one everywhere it says either.
 *
 * Two things keep it honest, and NEITHER OF THEM IS A NEW FILTER SOMEBODY HAS
 * TO REMEMBER:
 *
 *   1. `sffs-test-results-dw-export` pins the stage POSITIVELY on both sides —
 *      `stage = 'completed'` for the completion population, `stage = 'emailed'`
 *      for the address merged onto it. Its author wrote that a future third
 *      stage "would silently leak into the count under a negated test", and
 *      chose the form that does not. This is that third stage, arriving nine
 *      days later, and the export needs no change to exclude it. Neither
 *      export Lambda is touched by this work.
 *
 *   2. NOTHING IS WRITTEN TO `email_signups` UNTIL A MESSAGE ACTUALLY LEAVES.
 *      That table has exactly one export filter (`meta->>'synthetic' IS NULL`),
 *      so any row put there is a signup on the dashboard that hour. Persisting
 *      an address pre-send therefore goes to `test_results` and ONLY to
 *      `test_results`. The signup is still written after a successful send, on
 *      the live path and again from the drain, so "signup" keeps meaning
 *      exactly what it meant on 8 August.
 */
export type ResultStage = "completed" | "pending" | "emailed" | "dropped";

export interface ResultStatsRow {
  /** Which bank, e.g. "adult" or "grade-5". */
  testId: string;
  audience: Audience;
  band: GradeBand;
  /** The grade they said they were in, where that is narrower than the band. */
  grade: Grade | null;
  score: number;
  maxScore: number;
  /** How many of the questions they actually answered. */
  answered: number;
  elapsedSeconds: number;
  timedOut: boolean;
  /** ISO 8601. */
  completedAt: string;
  /** Which verdict the score earned. */
  verdict: string;
  stage: ResultStage;
  /**
   * The address the results were sent to, or are owed to. Never present on a
   * `completed` row; present on the other three, and only because the person
   * asked us to send them there — see the privacy page, which describes this
   * rather than promising the opposite.
   */
  email?: string;
  /**
   * Which attempt-to-send this row is about: an opaque digest of the result
   * and the address together.
   *
   * The endpoint cannot update, so "did this pending send ever go out" has to
   * be answerable by looking for a SECOND row rather than by reading a flag on
   * the first. This is the key those rows are matched on.
   *
   * DERIVED FROM THE RESULT AND THE ADDRESS, NOT FROM THE ATTEMPT, which is
   * what makes the match correct rather than merely present. Somebody who
   * failed at 17:52 and succeeded on their fourth try at 17:56 produces four
   * `pending` rows and one `emailed` row, all sharing one key — so the success
   * clears all four and the drain does not post them a fifth copy of results
   * they already have.
   */
  sendKey?: string;
  /**
   * The signed results token, on a `pending` row and nowhere else.
   *
   * It is what makes recovery possible at all: the token IS the result (see
   * ./result-token.ts), so re-rendering the exact email hours later needs
   * nothing but this and the address. Reconstructing it from the columns is
   * not an option — they hold a score, not the answers, and the email is a
   * link to the results page rather than the score itself.
   *
   * NOT WRITTEN ON AN `emailed` ROW. Once a message has gone the token has no
   * further use here, and a copy of it sitting next to an address for every
   * successful send is a widening of what a database leak would mean, bought
   * for nothing. The `sendKey` above is the durable link, and it is one-way.
   */
  token?: string;
  /** Why the drain gave up. `dropped` rows only. */
  dropReason?: string;
  /** A machine took this test. See SYNTHETIC_HEADER. */
  synthetic?: boolean;
}

/**
 * The opaque key that ties a pending send to its eventual outcome.
 *
 * The token's SIGNATURE stands in for the whole token — it is the same
 * identity in a fraction of the bytes, and it is what lib/test/result-store.ts
 * already keys its own counters on. Hashed with the address so the key cannot
 * be read backwards into either one: this value is written to a column an
 * export could one day pick up, and "which address" must not be recoverable
 * from it.
 */
export function sendKeyFor(token: string, email: string): string {
  const signature = token.slice(token.lastIndexOf(".") + 1);
  return createHash("sha256")
    .update(`${signature}:${email.trim().toLowerCase()}`)
    .digest("hex")
    .slice(0, 32);
}

/**
 * The header a verification run sets on itself, so its rows say so.
 *
 * ===========================================================================
 * WHY A ROW HAS TO BE ABLE TO ADMIT THIS
 * ===========================================================================
 * The Playwright suite finishes real tests to get a real token, and for a while
 * it did that against the live site. Fifteen synthetic rows ended up in Aurora
 * `test_results` against twenty-three genuine completions — a quarter of the
 * scored adult rows were the harness measuring itself. They were identifiable
 * only by accident: 900 seconds with `timed_out` false, which no person can
 * produce, and a blank on every seventh question.
 *
 * Being identifiable by accident is not good enough, so a run now says what it
 * is. `scripts/harness-target.mjs` stops the mutating scripts reaching
 * production at all; this is the second belt, for the runs that legitimately
 * DO touch production (`verify-live-email.mjs` exercises the real Resend and
 * Aurora path on purpose) and for anything that slips past the first.
 *
 * It only ever ADDS a fact to the row. It does not skip the write, and there is
 * deliberately no header that does — a request-path switch that makes results
 * vanish is a bigger risk than the thing it fixes. A caller who lies by not
 * setting it is no worse off than before.
 */
export const SYNTHETIC_HEADER = "x-sffs-synthetic";

/** Whether this request admitted to being a verification run. */
export function isSyntheticRequest(headers: Headers): boolean {
  return headers.get(SYNTHETIC_HEADER)?.trim() === "1";
}

/**
 * The Lambda's shape, which is not ours.
 *
 * `answered` and `timedOut` have no columns, so they go in `meta` rather than
 * being dropped: "22 out of 50, and they only reached 31 of them" is a
 * different result from "22 out of 50 with time to spare", and a percentile
 * that cannot tell those apart is measuring the clock as much as the person.
 *
 * `grade_band` is the comparison group, so it is the band with our internal
 * "grade-" prefix removed: the Lambda's vocabulary is "7-8", not "grade-7-8".
 */
function toWireFormat(row: ResultStatsRow): Record<string, unknown> {
  return {
    kind: "result",
    test_type: row.audience,
    grade: row.grade,
    grade_band: row.band === "adult" ? "adult" : row.band.replace(/^grade-/, ""),
    score: row.score,
    max_score: row.maxScore,
    duration_secs: Math.max(0, Math.round(row.elapsedSeconds)),
    source: row.audience === "child" ? EMAIL_SOURCES.testChild : EMAIL_SOURCES.testParent,
    verdict: row.verdict,
    // Omitted rather than sent as null on a `completed` row, so the column is
    // empty because nothing was known rather than because something was cleared.
    ...(row.email ? { email: row.email } : {}),
    meta: {
      test_id: row.testId,
      answered: row.answered,
      timed_out: row.timedOut,
      completed_at: row.completedAt,
      stage: row.stage,
      /*
        THE RECOVERY FIELDS RIDE IN `meta`, AND THAT IS WHY NO LAMBDA HAD TO
        CHANGE FOR THE PART THAT MATTERS.

        `_handle_result` in the proxy takes `meta` as an opaque dict and hands
        it to Postgres as JSONB without inspecting a single key. So a `pending`
        row carrying an address, a token and a send key is written by the
        Lambda that is deployed today, with no redeploy, no migration and no
        column. The same convention `synthetic` and `internal` already use —
        see docs/analytics/signup-internal-marker.md, which records that
        schema changes here are made by adding keys to `meta`.

        All three are omitted rather than sent as null when absent, so a
        `completed` row is byte-for-byte what it was before this change.
      */
      ...(row.sendKey ? { send_key: row.sendKey } : {}),
      ...(row.token ? { token: row.token } : {}),
      ...(row.dropReason ? { drop_reason: row.dropReason } : {}),
      // Present only when true, so an ordinary row is unchanged and a query for
      // real results is `meta->>'synthetic' IS NULL`. The Lambda passes `meta`
      // through verbatim, so this needs nothing on the AWS side.
      ...(row.synthetic ? { synthetic: true } : {}),
    },
  };
}

const FILE = join(process.cwd(), ".data", "test-results.local.json");

/**
 * File a finished attempt. Never throws: every caller is on a path where the
 * visitor is about to be shown their score and can do nothing about a failure
 * here.
 *
 * RETURNS WHETHER THE ROW LANDED, which most callers correctly ignore — they
 * are fire-and-forget and a lost statistic is not worth a word. The `pending`
 * write is the exception: it is the only caller for which failing means an
 * address is about to be lost, and it is the only one that says so in the log.
 */
export async function recordResultStats(row: ResultStatsRow): Promise<boolean> {
  try {
    if (emailStoreMode() === "proxy") await writeRemote(row);
    else writeLocal(row);
    return true;
  } catch (err) {
    console.error(
      "[result-stats] failed to file a result:",
      err instanceof Error ? err.message : err,
    );
    return false;
  }
}

async function writeRemote(row: ResultStatsRow): Promise<void> {
  // The results endpoint IS the signup endpoint, discriminated by `kind`.
  // RESULTS_STATS_URL exists only for the case where they need to diverge.
  const url = (process.env.RESULTS_STATS_URL || process.env.EMAIL_PROXY_URL)?.trim();
  const secret = process.env.EMAIL_PROXY_SECRET;
  if (!url || !secret) {
    throw new Error("EMAIL_PROXY_URL and EMAIL_PROXY_SECRET are required to file a result");
  }

  const body = JSON.stringify(toWireFormat(row));

  /*
    ONE RETRY, AND ONLY ON A 5xx.

    A cold invocation of the Lambda answers `server_error` and then works on
    every call after it, which was reproducible: the first two probes after a
    deploy failed and a dozen identical ones straight afterwards all passed. On
    a fire-and-forget write that swallows its errors, that means the first
    result after an idle period disappears with nothing to show for it — the
    same silent-loss shape as the bug this whole file exists to close.

    A 4xx is not retried. That is the Lambda telling us the row is wrong, and
    sending it again would just be wrong twice.
  */
  let last = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 400));
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", "x-shared-secret": secret },
      body,
      cache: "no-store",
    });
    if (res.ok) return;

    let detail = "";
    try {
      detail = (await res.text()).slice(0, 200);
    } catch {
      /* the status is enough */
    }
    last = `${res.status}: ${detail}`;
    if (res.status < 500) break;
  }
  throw new Error(`results endpoint responded ${last}`);
}

/**
 * Mirrors the signup path's local mode: a laptop must not be able to put test
 * rows into the real table, and the shape still gets exercised.
 */
function writeLocal(row: ResultStatsRow): void {
  let rows: ResultStatsRow[] = [];
  try {
    const parsed = JSON.parse(readFileSync(FILE, "utf8")) as ResultStatsRow[];
    if (Array.isArray(parsed)) rows = parsed;
  } catch {
    rows = [];
  }
  rows.push(row);
  try {
    mkdirSync(dirname(FILE), { recursive: true });
    writeFileSync(FILE, JSON.stringify(rows, null, 2), "utf8");
  } catch {
    // Read-only filesystem. Local mode's output is the log line below.
  }
  console.info(
    `[result-stats] local: ${row.testId} ${row.score}/${row.maxScore} ` +
      `(nothing sent to Aurora)`,
  );
}
