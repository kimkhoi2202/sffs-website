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
 * IT IS NOW SCHEDULED. IT WAS DELIBERATELY MANUAL, AND THAT REASONING EXPIRED
 * ===========================================================================
 * This used to say "there is no cron", because the trigger for draining was
 * "the quota has reset and we have headroom" — a judgement about a shared,
 * exhaustible resource. An automatic drain firing into a still-constrained
 * account would have spent the recovered quota on the backlog and taken out the
 * next six hours of live sends, turning one outage into two. That was correct
 * while the account had a daily cap of 200 shared with live traffic.
 *
 * The account is now on Resend Pro: daily limit Unlimited, 50,000 a month
 * against roughly 322 sends a day. The scarce thing the caution was protecting
 * is not scarce, so the caution goes with it.
 *
 * What the manual policy actually cost is measurable. On 11 August the quota
 * went at 11:33 UTC and the backlog sat until somebody ran this by hand at
 * 16:09 the NEXT DAY. 156 people waited 28.6 hours for an email they had asked
 * for, and the only reason it went at all is that a human happened to look.
 *
 * The one limit that did NOT go away is ten requests a second across the team,
 * shared with live sends. That is answered by pacing, not by refusing to
 * schedule: see SEND_SPACING_MS and the GET handler below.
 *
 * The manual POST path is unchanged and still dry-runs by default.
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
import { captureDrainRun } from "@/lib/posthog-server";
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
/**
 * A paced batch takes longer than the platform default allows.
 *
 * 25 sends at SEND_SPACING_MS apart is twelve and a half seconds of deliberate
 * waiting before any provider latency, which is already past Vercel's default
 * ceiling. Without this the function is killed mid-batch, and a drain killed
 * mid-batch is the failure this route exists to prevent.
 */
export const maxDuration = 60;

const DEFAULT_LIMIT = 25;
/** Even a correct secret cannot be used to hammer this. */
const DRAIN_IP_LIMIT = { windowMs: 60_000, max: 5 };

/**
 * How long to wait between sends, and why it is not zero.
 *
 * Resend allows 10 requests a second ACROSS THE WHOLE TEAM, which means this
 * batch and the live send route are drawing on one allowance. A drain that
 * issues as fast as the loop can go would sit on that ceiling and the request
 * it starved would be somebody sitting in front of the site waiting for their
 * results — trading a backlog for a fresh live failure, which is the whole
 * thing we are trying not to do.
 *
 * 500ms is two a second, a fifth of the ceiling, leaving eight a second for
 * live traffic that currently peaks around forty an HOUR. The drain is
 * deliberately the smaller half of a shared resource.
 */
const SEND_SPACING_MS = 500;

/** Attempts per item when the provider says "too fast". Beyond this, it waits for the next run. */
const RATE_LIMIT_RETRIES = 3;
/** First backoff step. Doubles each attempt: 1s, 2s, 4s. */
const RATE_LIMIT_BACKOFF_MS = 1_000;

interface DrainBody {
  limit?: unknown;
  maxAgeHours?: unknown;
  dryRun?: unknown;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

/**
 * Whether this is Vercel Cron calling.
 *
 * Cron sends `Authorization: Bearer $CRON_SECRET` and cannot be taught to send
 * a custom header, so it gets its own check rather than a weakening of the one
 * above. A separate credential is also the honest description of what these
 * are: `RESULTS_DRAIN_SECRET` is held by a person, `CRON_SECRET` by the
 * platform, and either being leaked should not imply the other.
 *
 * Unset means no, for the same reason a missing drain secret means no.
 */
function fromCron(request: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const provided = request.headers.get("authorization") ?? "";
  const a = Buffer.from(provided);
  const b = Buffer.from(`Bearer ${expected}`);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * The scheduled drain.
 *
 * ===========================================================================
 * WHY THIS EXISTS NOW WHEN THE DOCSTRING ABOVE ARGUED AGAINST IT
 * ===========================================================================
 * The argument against a cron was that an automatic drain would spend quota
 * that live sends needed, turning one outage into two. That argument rested on
 * a daily cap of 200 shared with live traffic. The account is now on Resend Pro
 * with the daily limit reported as Unlimited and 50,000 a month against roughly
 * 322 sends a day, so the resource the argument was protecting is no longer
 * scarce and the reasoning does not survive its premise.
 *
 * What DID survive is the ten-a-second team-wide rate limit, which live sends
 * share. That is answered by pacing rather than by refusing to schedule: see
 * SEND_SPACING_MS.
 *
 * The cost of staying manual was measured rather than guessed. On 11 August the
 * backlog waited 28.6 hours for somebody to notice and run this by hand. Every
 * five minutes turns that into five.
 *
 * IT IS NOT A DRY RUN. That is the one deliberate difference from the POST
 * path, whose default protects a human who fired a request to see what would
 * happen. A schedule that dry-runs forever is a schedule that never sends,
 * which is the same defect this is fixing wearing a cron expression.
 */
export async function GET(request: NextRequest) {
  if (!fromCron(request)) {
    return NextResponse.json({ ok: false, code: "unauthorised" }, { status: 401 });
  }
  return runDrain(request, { limit: DEFAULT_LIMIT, maxAgeHours: 24 * 7, dryRun: false });
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

  return runDrain(request, {
    limit: clampInt(body.limit, DEFAULT_LIMIT, 1, MAX_DRAIN_BATCH),
    maxAgeHours: clampInt(body.maxAgeHours, 24 * 7, 1, 24 * 7),
    // Opt IN to sending. See the safety note in the docstring.
    dryRun: body.dryRun !== false,
  });
}

async function runDrain(
  request: NextRequest,
  { limit, maxAgeHours, dryRun }: { limit: number; maxAgeHours: number; dryRun: boolean },
) {
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

    if (report.sent > 0 || report.dropped > 0 || report.leftPending > 0) {
      // Paced BEFORE each send after the first, so the spacing holds even when
      // the previous item failed. A retry storm is still a request storm.
      await sleep(SEND_SPACING_MS);
    }

    const sent = await sendWithRateLimitRetry({
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
      STILL RATE LIMITED AFTER BACKING OFF: STOP, AND MARK NOTHING.

      Handled exactly like quota and for the same reason — it is a fact about
      the account rather than about this message, so the next item would fail
      too. What matters is the half that is NOT like quota: this must never
      reach the `rejected` branch below. A rate limit is the one refusal
      guaranteed to clear on its own, and dropping somebody for it would delete
      a real person from the backlog because we sent too fast. The next run is
      minutes away and the row is untouched.
    */
    if (sent.reason === "rate_limited") {
      report.stoppedBecause = "rate_limited";
      report.leftPending++;
      break;
    }

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
      domain, a malformed address, a blocked recipient. Retrying it every run
      would spend the constrained resource on an address that will never accept
      mail, which is precisely the waste this incident was about. It is marked
      `dropped` and leaves the backlog.

      It no longer catches a rate limit. Until `rate_limited` was split out of
      it in lib/email/resend.ts, any 429 without "quota" in its name landed
      here and was written off for good, so the transient condition was treated
      as the permanent one. That branch is above.

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

  /*
    A DRAIN THAT SAYS NOTHING IS WHY THIS WAS INVESTIGATED FROM A FALSE PREMISE.

    156 people were sent their results by this route on 12 August and every one
    of them still reads as "never succeeded" in analytics, because the only
    delivery event we fire is `test_email_sent` from the live route. Anyone
    asking "did these people get their results" gets No from PostHog and Yes
    from Aurora, and the wrong one is easier to reach. That silence cost a day
    and nearly cost 155 duplicate emails.

    IT IS NOT `test_email_sent` AND IT IS NOT PER PERSON, both deliberately.
    Firing the live event would date a conversion that happened hours ago to
    this run and bend the funnel — the reasoning in `settle` below, which still
    holds. And a pending row carries an address and a token but no distinct_id,
    so there is no honest person to attach it to; inventing one would create
    phantom profiles. This is one event per RUN, keyed to the mailer rather than
    to anybody, saying what the batch did.

    So it cannot be mistaken for the original send: different name, no person,
    counts rather than a conversion. What it buys is that the next person to ask
    the question finds the answer without reading the database.
  */
  if (report.sent > 0 || report.dropped > 0 || report.stoppedBecause) {
    void captureDrainRun(request, report);
  }

  return NextResponse.json(report);
}

/**
 * Send, and ride out a rate limit rather than counting it as a failure.
 *
 * The provider's per-second cap is not a verdict on the message; it is a
 * verdict on how fast we asked. So the only correct response is to wait and
 * ask again, and the only thing that must never happen is treating it as an
 * answer about the recipient.
 *
 * `Retry-After` is honoured when Resend sends one, because a number from the
 * provider beats a number we guessed. Otherwise it doubles from one second,
 * which clears a per-second cap many times over.
 *
 * Returns the last result either way. A caller that still sees `rate_limited`
 * knows the backoff was not enough and should stop the batch, not drop the row.
 */
async function sendWithRateLimitRetry(
  input: Parameters<typeof sendEmail>[0],
): Promise<Awaited<ReturnType<typeof sendEmail>>> {
  let result = await sendEmail(input);

  for (let attempt = 0; attempt < RATE_LIMIT_RETRIES; attempt++) {
    if (result.ok || result.reason !== "rate_limited") return result;

    const backoffMs = result.retryAfterSeconds
      ? result.retryAfterSeconds * 1_000
      : RATE_LIMIT_BACKOFF_MS * 2 ** attempt;
    console.warn(
      `results-drain: rate limited, waiting ${backoffMs}ms ` +
        `(attempt ${attempt + 1} of ${RATE_LIMIT_RETRIES})`,
    );
    await sleep(backoffMs);
    result = await sendEmail(input);
  }

  return result;
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
