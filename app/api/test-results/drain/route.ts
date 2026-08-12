/**
 * Send the results emails that an outage swallowed.
 *
 * POST { limit?, maxAgeHours?, dryRun? } -> a report
 *
 * ===========================================================================
 * WHAT THIS IS FOR
 * ===========================================================================
 * On 9 August the Resend account hit `daily_quota_exceeded` at 17:52 UTC and
 * every results email failed for six hours. 77 people never received theirs
 * and none of them could be identified, because the send route wrote nothing
 * until after a successful send.
 *
 * That route now files a `pending` row BEFORE it calls the provider, so the
 * same outage today would end with a list of exactly who is owed what. This is
 * the thing that works through the list. Without it the fix is a database of
 * regrets: knowing who we failed and having no mechanism to make it right is
 * only marginally better than not knowing.
 *
 * ===========================================================================
 * IT IS OPERATED, NOT AUTOMATED, AND THAT IS DELIBERATE
 * ===========================================================================
 * There is no cron. The trigger for draining is "the quota has reset and we
 * have headroom", which is a judgement about a shared, exhaustible resource
 * that was the proximate cause of the incident. An automatic drain firing into
 * a still-constrained account would spend the recovered quota on the backlog
 * and take out the next six hours of live sends — turning one outage into two.
 *
 * So: a human calls it, with a secret, and it reports what it did.
 *
 * ===========================================================================
 * THREE SAFETY PROPERTIES, IN THE ORDER THEY MATTER
 * ===========================================================================
 *   1. IT DRY RUNS BY DEFAULT. `dryRun` is true unless explicitly set false.
 *      An endpoint whose entire job is mailing real people should not do that
 *      on a request somebody fired to see what happens.
 *   2. IT STOPS ON THE FIRST QUOTA REFUSAL. If the allowance is gone again,
 *      continuing would burn attempts against a wall and — worse — mark
 *      nothing, leaving the same people pending anyway. The batch ends and
 *      says why.
 *   3. IT IS BOUNDED. One batch, `limit` at a time, capped in the Lambda too.
 *      Draining 500 people in one breath is how you exhaust a daily quota.
 *
 * ===========================================================================
 * WHAT IT WRITES, AND WHY THAT KEEPS THE DASHBOARD HONEST
 * ===========================================================================
 * A drained send writes exactly what a live one writes: an `emailed` row
 * carrying the same `send_key` as the pending row it satisfies, and a signup.
 * Nothing here writes anything for a send that did not happen.
 *
 * THE SIGNUP CANNOT DOUBLE-COUNT ANYBODY, which matters because this runs
 * against the same numbers the dashboard is reporting. The person was already
 * counted when they submitted; the insert conflicts on the address and does
 * nothing; no conversion event is fired. What a drain moves is the DELIVERY
 * figures — the warehouse mirror's addresses and the completion-to-email rates
 * derived from them — and it moves them toward the signup count rather than
 * past it. See `settle` below and lib/dashboard/signup-rule.ts.
 */
import { timingSafeEqual } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";

import { insertEmailSignup, signupMeta } from "@/lib/email-store";
import { EMAIL_SOURCES } from "@/lib/email-sources";
import { sendEmail } from "@/lib/email/resend";
import { clientIp, isRateLimited } from "@/lib/rate-limit";
import { fetchPendingSends, MAX_DRAIN_BATCH } from "@/lib/test/pending-sends";
import { recordResultStats } from "@/lib/test/result-stats";
import { getResult } from "@/lib/test/result-store";
import { renderResultsEmail } from "@/lib/test/results-email";
import { resultsUrlFor } from "@/lib/test/results-url";
import { verdictFor } from "@/lib/test/scoring";
import { displayTestTitle, getTestById } from "@/lib/test/tests";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 25;
/** Even a correct secret cannot be used to hammer this. */
const DRAIN_IP_LIMIT = { windowMs: 60_000, max: 5 };

interface DrainBody {
  limit?: unknown;
  maxAgeHours?: unknown;
  dryRun?: unknown;
}

function authorised(request: NextRequest): boolean {
  const expected = process.env.RESULTS_DRAIN_SECRET;
  if (!expected) return false;
  const provided = request.headers.get("x-drain-secret") ?? "";
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  // Length-checked first: timingSafeEqual throws on a mismatch rather than
  // returning false. Same shape as decodeResultToken in lib/test/result-token.ts.
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  if (isRateLimited("results-drain", clientIp(request.headers), DRAIN_IP_LIMIT)) {
    return NextResponse.json({ ok: false, code: "rate_limited" }, { status: 429 });
  }

  /*
   * A MISSING SECRET IS A REFUSAL, NOT AN OPEN DOOR. `RESULTS_DRAIN_SECRET` is
   * deliberately not defaulted to anything and deliberately not shared with
   * EMAIL_PROXY_SECRET: this is a public HTTPS endpoint that sends mail, and
   * the credential for it should not also be the credential that writes to
   * Aurora. Until it is set, this route does nothing at all.
   */
  if (!authorised(request)) {
    return NextResponse.json({ ok: false, code: "unauthorised" }, { status: 401 });
  }

  let body: DrainBody = {};
  try {
    body = (await request.json()) as DrainBody;
  } catch {
    // An empty body is the common case for a hand-run drain: all defaults.
  }

  const limit = clampInt(body.limit, DEFAULT_LIMIT, 1, MAX_DRAIN_BATCH);
  const maxAgeHours = clampInt(body.maxAgeHours, 24 * 7, 1, 24 * 7);
  // Opt IN to sending. See the safety note in the docstring.
  const dryRun = body.dryRun !== false;

  const backlog = await fetchPendingSends({ limit, maxAgeHours });
  if (!backlog.ok) {
    console.error(`results-drain: cannot read the backlog (${backlog.reason}):`, backlog.detail);
    return NextResponse.json(
      { ok: false, code: `backlog_${backlog.reason}`, error: backlog.detail },
      // `unavailable` is a deployment gap on our side, not a bad request.
      { status: backlog.reason === "unavailable" ? 501 : 500 },
    );
  }

  const report = {
    ok: true,
    dryRun,
    pending: backlog.sends.length,
    sent: 0,
    dropped: 0,
    leftPending: 0,
    /** Set when the batch ended early. The interesting field on a bad day. */
    stoppedBecause: null as string | null,
  };

  if (dryRun) {
    console.info(`results-drain: dry run, ${backlog.sends.length} pending send(s) in scope`);
    return NextResponse.json({ ...report, leftPending: backlog.sends.length });
  }

  for (const item of backlog.sends) {
    /*
      The token is re-verified rather than trusted, even though we wrote it.
      It carries its own expiry (twelve months) and a backlog can be old; an
      expired or unknown-bank token cannot produce an email, and re-rendering
      from the row's columns is not possible — they hold a score, not answers.
    */
    const record = getResult(item.token);
    const test = record ? getTestById(record.testId) : null;
    if (!record || !test) {
      report.dropped++;
      await settle(request, item.email, item.sendKey, null, "unreadable_token");
      continue;
    }

    const rendered = renderResultsEmail({
      audience: record.audience,
      testTitle: displayTestTitle(test, record.grade),
      maxScore: record.maxScore,
      resultsUrl: resultsUrlFor(record.token, request),
    });

    const sent = await sendEmail({
      to: item.email,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    });

    if (sent.ok) {
      report.sent++;
      await settle(request, item.email, item.sendKey, record, null);
      continue;
    }

    console.error(`results-drain: send failed (${sent.reason}):`, sent.detail);

    /*
      OUT OF QUOTA AGAIN: STOP THE WHOLE BATCH.

      Nothing is marked for this one, so it stays in the backlog for the next
      run — which is the correct outcome and the reason this is a `break` and
      not a `continue`. Grinding through the remaining fifty would fail fifty
      times, spend fifty attempts we do not have, and leave the list exactly
      where it started.
    */
    if (sent.reason === "quota") {
      report.stoppedBecause = "quota";
      break;
    }

    /*
      A REJECTION IS PERMANENT ENOUGH TO GIVE UP ON; A NETWORK FAILURE IS NOT.

      `rejected` is the provider refusing this specific message — a dead
      domain, a blocked recipient. Retrying it every run would spend the
      constrained resource on an address that will never accept mail, which is
      precisely the waste this incident was about. It is marked `dropped` and
      leaves the backlog.

      Anything else is left pending and tried again next time.
    */
    if (sent.reason === "rejected") {
      report.dropped++;
      await settle(request, item.email, item.sendKey, record, `rejected:${sent.status ?? "?"}`);
    } else {
      report.leftPending++;
    }
  }

  report.leftPending += Math.max(
    0,
    backlog.sends.length - report.sent - report.dropped - report.leftPending,
  );

  console.info(
    `results-drain: sent=${report.sent} dropped=${report.dropped} ` +
      `leftPending=${report.leftPending} of ${report.pending}` +
      (report.stoppedBecause ? ` (stopped: ${report.stoppedBecause})` : ""),
  );

  return NextResponse.json(report);
}

/**
 * Write the row that takes a pending send off the list, and — only for a real
 * delivery — the signup that goes with it.
 *
 * `dropReason` null means it went. Anything else is a `dropped` row, which
 * settles the backlog entry WITHOUT claiming a message was sent: `dropped` is
 * excluded from the export's positively-pinned `stage = 'emailed'` filter
 * exactly like `pending` is, so nothing here can inflate a delivery count.
 */
async function settle(
  request: NextRequest,
  email: string,
  sendKey: string,
  record: ReturnType<typeof getResult>,
  dropReason: string | null,
): Promise<void> {
  const source =
    record?.audience === "child" ? EMAIL_SOURCES.testChild : EMAIL_SOURCES.testParent;

  /*
    A dropped send whose token would not even decode has no result to file
    against, and the endpoint validates score and test type. There is nothing
    truthful to write, so nothing is written and the age window in the Lambda
    is what eventually retires it.
  */
  if (!record) {
    console.error(`results-drain: giving up on ${sendKey} (${dropReason ?? "unknown"})`);
    return;
  }

  await recordResultStats({
    testId: record.testId,
    audience: record.audience,
    band: record.band,
    grade: record.grade,
    score: record.score,
    maxScore: record.maxScore,
    answered: record.answered,
    elapsedSeconds: record.elapsedSeconds,
    timedOut: record.timedOut,
    completedAt: new Date(record.createdAt).toISOString(),
    verdict: verdictFor(Math.round((record.score / record.maxScore) * 100), record.audience).id,
    stage: dropReason ? "dropped" : "emailed",
    email,
    sendKey,
    ...(dropReason ? { dropReason } : {}),
  });

  if (dropReason) return;

  /*
    THE SIGNUP, WHICH IS NORMALLY ALREADY THERE.

    The live route now writes it BEFORE calling the provider, so anybody in
    this backlog was counted as a signup the moment they typed their address —
    see lib/dashboard/signup-rule.ts. The insert conflicts on the address and
    does nothing, which is exactly what we want: a drain cannot count a person
    a second time, however many rows it settles.

    It is still called, for two cases it genuinely covers. A backlog entry
    predating that change has no signup row yet. And the live write is
    best-effort — if it was the thing that hiccuped, this is the second chance
    to record the address at all.

    NO POSTHOG CONVERSION EVENT. `email_captured` is timestamped when it fires,
    and firing it now would date a conversion that happened hours ago to this
    drain, quietly bending the funnel. The dashboard does not need it to: a
    person in this backlog already carries a `test_email_submitted` from when
    they typed the address, and the signup rule counts that.
  */
  try {
    await insertEmailSignup({
      email,
      source,
      countsAsSubmission: true,
      meta: signupMeta(request.headers),
    });
  } catch (err) {
    console.error(
      "results-drain: sent, but the list write failed:",
      err instanceof Error ? err.message : err,
    );
  }
}

function clampInt(value: unknown, fallback: number, min: number, max: number): number {
  const n = typeof value === "number" && Number.isFinite(value) ? Math.floor(value) : fallback;
  return Math.max(min, Math.min(n, max));
}
