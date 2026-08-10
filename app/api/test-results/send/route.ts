/**
 * Email someone a link to their results.
 *
 * POST { token, email } -> { ok } | { ok: false, error, code }
 *
 * ===========================================================================
 * THIS IS THE ABUSE SURFACE
 * ===========================================================================
 * "Type an address, we send it mail" is an open relay with extra steps if it is
 * not fenced, and every message that goes out spends our sending domain's
 * reputation. Four limits, deliberately layered, because each one covers a case
 * the others miss:
 *
 *   1. PER IP, 10 a minute. Stops one browser tab in a loop. Shares the
 *      mechanism with /api/access-signup (lib/rate-limit.ts) rather than
 *      inventing a second one.
 *   2. PER TARGET ADDRESS, 3 an hour. Stops someone using us to flood ONE
 *      person's inbox from a rotating set of IPs. Keyed by a hash of the
 *      address, never the address itself, so no raw email sits in a server-side
 *      map (see hashEmail below).
 *   3. PER RESULT, 5 sends ever. The durable one: it is a counter written next
 *      to the stored result, so unlike the two above it survives a restart and
 *      holds across instances. This is the real ceiling. A legitimate person
 *      fixing a typo needs two or three; nobody needs six.
 *   4. THE EMAIL IS ONLY SENT TO AN ADDRESS THAT WAS TYPED IN THIS REQUEST.
 *      There is no "send to the address on file" path, because there is no
 *      address on file. See lib/test/result-store.ts.
 *
 * When the cap is hit the copy says so plainly rather than pretending to send.
 *
 * ===========================================================================
 * AND ONE GUARD THAT IS NOT ABOUT ABUSE
 * ===========================================================================
 * All four above answer "how much may a stranger make us send". A separate
 * question is whether this send is one we just did. It is asked because
 * somebody received the same results twice, three seconds apart, by pressing
 * "Send it again" while the first was still in flight — so a result-and-address
 * pair is CLAIMED before the provider is called and stays claimed for a minute.
 * See
 * SEND_DEDUPE_WINDOW_MS in lib/test/result-store.ts for the window, and for why
 * "Wrong address? Use a different one" is untouched by it.
 *
 * Claimed before the call rather than counted after it, which also closes the
 * race the cap has always had: two requests arriving together both read the
 * same count and both send.
 *
 * ===========================================================================
 * FAILURE IS REPORTED, NOT SWALLOWED
 * ===========================================================================
 * If Resend rejects or the network dies, this returns a failure and the UI
 * offers a retry. It never returns ok for a message that did not leave, because
 * "check your inbox" for mail that was never sent is the worst outcome
 * available here: the person waits, finds nothing, and concludes the site is
 * broken with no way to recover.
 *
 * The send is only counted against the result AFTER the provider accepts it,
 * so a failed attempt does not burn one of the five.
 *
 * ===========================================================================
 * AND A REPORTED FAILURE IS NOW A RECOVERABLE ONE
 * ===========================================================================
 * Reporting it was never enough. On 9 August the Resend account hit
 * `daily_quota_exceeded` at 17:52 UTC and every send failed for six hours; 78
 * people were affected, 77 never got their results, and NONE OF THEM COULD BE
 * IDENTIFIED. This route sent first and wrote afterwards, so a 429 returned
 * 502 having written nothing. The addresses had been typed into a form, held
 * in memory for the length of one request, and discarded.
 *
 * Four things changed, and the first is the one that matters:
 *
 *   1. THE ADDRESS IS PERSISTED BEFORE THE PROVIDER IS CALLED, as a `pending`
 *      row. An outage now ends with a list of people to send to instead of a
 *      hole. That row is invisible to every existing count — see ResultStage
 *      in lib/test/result-stats.ts, which is where the reasoning for that
 *      lives, because getting it wrong would trade one lost number for three
 *      wrong ones.
 *   2. THOSE ROWS CAN BE DRAINED once quota allows. See
 *      app/api/test-results/drain/route.ts.
 *   3. A SUSTAINED FAILURE RATE IS ANNOUNCED. Six hours passed unnoticed
 *      because the only trace was a console.error nobody was tailing. See
 *      lib/email/send-health.ts.
 *   4. QUOTA EXHAUSTION SAYS SO. It is no longer flattened into "try again in
 *      a moment", which was false for six hours and which people obeyed.
 */
import { createHash } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";

import { insertEmailSignup, signupMeta } from "@/lib/email-store";
import { sendEmail } from "@/lib/email/resend";
import { inQuotaOutage, noteSendAttempt } from "@/lib/email/send-health";
import { captureEmailCapturedServer, captureSendHealthAlert } from "@/lib/posthog-server";
import { clientIp, isRateLimited } from "@/lib/rate-limit";
import { EMAIL_SOURCES } from "@/lib/email-sources";
import {
  claimSend,
  getResult,
  MAX_SENDS_PER_RESULT,
  recordSend,
  releaseSend,
} from "@/lib/test/result-store";
import { verdictFor } from "@/lib/test/scoring";
import { isSyntheticRequest, recordResultStats, sendKeyFor } from "@/lib/test/result-stats";
import { renderResultsEmail } from "@/lib/test/results-email";
import { displayTestTitle, getTestById } from "@/lib/test/tests";
import { resultsUrlFor } from "@/lib/test/results-url";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 4 * 1024;
const MAX_EMAIL_LENGTH = 254;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const IP_LIMIT = { windowMs: 60_000, max: 10 };
const ADDRESS_LIMIT = { windowMs: 60 * 60_000, max: 3 };

/**
 * What we say when the account is out of quota for the day.
 *
 * ===========================================================================
 * THE OLD MESSAGE WAS FALSE FOR SIX HOURS
 * ===========================================================================
 * Every failure used to answer "We could not send that just now. Try again in
 * a moment." On 9 August that sentence was wrong from 17:52 UTC until the
 * quota reset, and the people reading it did the reasonable thing: they tried
 * again, an average of four times each, because we had told them to.
 *
 * Three things this has to do, in order of how much they matter.
 *
 *   1. STOP INVITING A RETRY THAT CANNOT WORK. "Trying again will not help" is
 *      the single most useful fact we have, and the old copy asserted its
 *      opposite.
 *   2. SAY IT IS OURS. A person whose mail did not arrive assumes they typed
 *      it wrong. They did not.
 *   3. SAY WHAT SURVIVES. "Your results and your address are saved" is now a
 *      true statement about a row that exists — see the `pending` write below.
 *      It is deliberately phrased as the fact it is rather than as a promise
 *      with a time on it, because the drain is operated (see
 *      app/api/test-results/drain/route.ts) and this endpoint does not know
 *      when it will next run.
 */
const QUOTA_MESSAGE =
  "We have hit today's email limit, so trying again will not help — this one is " +
  "on us, not you. Your results and your address are saved, and you are on the " +
  "list to send as soon as the limit resets.";

/**
 * Rate-limit key for a target address.
 *
 * Hashed, not stored raw. The limiter is a long-lived in-process map, and an
 * in-process map full of the email addresses of everyone who used the site is a
 * thing worth not having — it shows up in a heap dump, and it is personal data
 * living somewhere nobody would think to look for it. A truncated SHA-256 is
 * just as good a bucket key.
 */
function hashEmail(email: string): string {
  return createHash("sha256").update(email).digest("hex").slice(0, 32);
}

interface SendBody {
  /** Whether the submitting browser is marked internal. See lib/posthog-server.ts. */
  isInternal?: boolean;
  token?: unknown;
  email?: unknown;
  /**
   * Set by the "Send it again" button. Excluded from the per-address
   * submission count — see the `countsAsSubmission` note further down.
   */
  isResend?: unknown;
  /** Dev-tools only, honoured only outside production. See below. */
  forceFailure?: unknown;
}

export async function POST(request: NextRequest) {
  const ip = clientIp(request.headers);
  if (isRateLimited("results-send-ip", ip, IP_LIMIT)) {
    return NextResponse.json(
      { ok: false, code: "rate_limited", error: "Too many tries. Give it a minute." },
      { status: 429 },
    );
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return NextResponse.json(
      { ok: false, code: "too_large", error: "Request too large." },
      { status: 413 },
    );
  }

  let body: SendBody;
  try {
    body = (await request.json()) as SendBody;
  } catch {
    return NextResponse.json(
      { ok: false, code: "bad_request", error: "Invalid request." },
      { status: 400 },
    );
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || email.length > MAX_EMAIL_LENGTH || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { ok: false, code: "bad_email", error: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  // The same opaque key serves the limiter below and the duplicate claim
  // further down, so neither ever holds the address itself.
  const addressKey = hashEmail(email);
  if (isRateLimited("results-send-address", addressKey, ADDRESS_LIMIT)) {
    /*
     * THE WORST SENTENCE WE SAID ON 9 AUGUST, and it was this one rather than
     * the failure copy.
     *
     * It used to read "That address has had a few of these already. Try again
     * in an hour." During the outage people averaged four attempts each, so
     * the fourth was met by this limiter — and "has had a few of these
     * already" says, to somebody who has received nothing at all, that several
     * were sent and their inbox is the problem. It sent them to look in a spam
     * folder for mail that did not exist.
     *
     * Two changes. It now names what it is counting, which is attempts, not
     * deliveries. And when the mailer is known to be out of quota it does not
     * speak for itself at all: the quota is the real reason nothing arrived,
     * so the honest answer wins over the technically-accurate one.
     */
    return NextResponse.json(
      {
        ok: false,
        code: inQuotaOutage() ? "send_quota" : "address_limited",
        error: inQuotaOutage()
          ? QUOTA_MESSAGE
          : `${ADDRESS_LIMIT.max} attempts for one address in an hour is our limit. ` +
            `That counts attempts, not deliveries. Try again in an hour.`,
      },
      { status: 429 },
    );
  }

  const token = typeof body.token === "string" ? body.token : "";
  const record = token ? getResult(token) : null;
  if (!record) {
    return NextResponse.json(
      { ok: false, code: "not_found", error: "Those results have gone. Take the test again." },
      { status: 404 },
    );
  }

  if (record.sendCount >= MAX_SENDS_PER_RESULT) {
    return NextResponse.json(
      {
        ok: false,
        code: "send_cap",
        error: `We have already sent these results ${MAX_SENDS_PER_RESULT} times. That is as many as we do.`,
      },
      { status: 429 },
    );
  }

  const test = getTestById(record.testId);
  if (!test) {
    return NextResponse.json(
      { ok: false, code: "not_found", error: "Those results have gone. Take the test again." },
      { status: 404 },
    );
  }

  /*
   * Dev tools: force the failure path so it can actually be exercised. Gated on
   * NODE_ENV, which the bundler inlines, so in a production build this whole
   * branch is `if (false && ...)` and is removed. It is also belt-and-braces
   * useless even if it survived: it only makes a send fail.
   */
  const forcedFailure =
    process.env.NODE_ENV !== "production" && body.forceFailure === true;

  const rendered = renderResultsEmail({
    audience: record.audience,
    // The grade they picked, never the band. Someone who chose 7 gets an email
    // about the Grade 7 test, not "Grade 7 and 8".
    testTitle: displayTestTitle(test, record.grade),
    maxScore: record.maxScore,
    resultsUrl: resultsUrlFor(record.token, request),
  });

  /*
   * THE LAST GATE BEFORE THE IRREVERSIBLE PART, and the only one that has to be
   * on this side of the await. Everything above can be re-decided; a message
   * cannot be unsent.
   *
   * A refusal is reported as success, and that is not the lie the docstring
   * above forbids. What is forbidden is "check your inbox" for mail that never
   * left — here mail did leave, to this exact address, seconds ago, and it is
   * the thing the person is being pointed at. Nothing is filed for it: no send
   * happened, so no send is recorded, which is what stops the second Aurora row
   * that made this visible in the first place.
   */
  if (!claimSend(record.token, addressKey)) {
    console.info("results-send: suppressed a repeat send inside the dedupe window");
    return NextResponse.json({
      ok: true,
      deduped: true,
      sendsRemaining: Math.max(0, MAX_SENDS_PER_RESULT - record.sendCount),
    });
  }

  /*
   * ===========================================================================
   * THE ADDRESS IS WRITTEN DOWN BEFORE THE PROVIDER IS CALLED
   * ===========================================================================
   * This is the fix for 9 August. The order used to be send-then-persist, so a
   * refusal returned 502 having written nothing at all: no `emailed` row, no
   * signup, the address in no table anywhere. Seventy-eight people hit that in
   * six hours and not one of them could be named afterwards — the PostHog
   * event carries a code and no address by design, the field is masked in
   * replay, and the server-side event runs with person profiles off. All that
   * survived was 78 anonymous ids.
   *
   * Reordering two statements is the entire difference between a permanent
   * loss and a recoverable one. Whatever happens on the next line — a
   * rejection, a timeout, this instance being frozen mid-await and never
   * resuming — the row is already in Aurora and says who to send to and what
   * to send them. See ResultStage in lib/test/result-stats.ts for what a
   * `pending` row carries and, just as important, why it counts as neither a
   * signup nor a completion anywhere downstream.
   *
   * AWAITED, UNLIKE EVERY OTHER WRITE ON THIS PATH. A fire-and-forget write
   * that has not landed yet is exactly as useful as no write at all in the
   * crash case this exists for, and the whole claim being made here is about
   * ordering. It costs one round trip on a request that is about to make a
   * slower one.
   *
   * NOT FATAL, THOUGH. If the bookkeeping write fails we still try to send:
   * refusing to mail somebody their results because our own record-keeping
   * hiccuped would be punishing them for our problem, and a delivered email
   * needs no recovery row.
   */
  const sendKey = sendKeyFor(record.token, email);
  const stats = {
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
    synthetic: isSyntheticRequest(request.headers),
  };

  const persisted = await recordResultStats({
    ...stats,
    stage: "pending",
    email,
    sendKey,
    // The token is what makes the row actionable rather than a note that
    // somebody was lost. `pending` rows are the only ones that carry it.
    token: record.token,
  });
  if (!persisted) {
    console.error(
      "results-send: could not file the pending row; a failed send from here is " +
        "unrecoverable, which is the exact hole this write exists to close",
    );
  }

  const sent = forcedFailure
    ? ({ ok: false, reason: "rejected", detail: "forced by dev tools" } as const)
    : await sendEmail({
        to: email,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
      });

  /*
   * Every outcome is offered to the health tracker, successes included: a
   * failure RATE needs both halves, and a detector fed only failures cannot
   * tell an outage from a quiet afternoon. See lib/email/send-health.ts.
   */
  const alert = noteSendAttempt(sent.ok ? { ok: true } : { ok: false, reason: sent.reason });
  if (alert) {
    /*
      Two channels because they reach different people. The log line is for
      whoever is already looking; the event is for the alert that tells
      somebody who is not. On 9 August there was only the first kind, and the
      person who would have read it was asleep.
    */
    console.error(
      `[send-health] ALERT ${alert.kind}: ${alert.failures}/${alert.attempts} results ` +
        `emails failed in the last ${alert.windowMinutes} minutes (${alert.failureRate}%)`,
    );
    void captureSendHealthAlert(request, alert);
  }

  if (!sent.ok) {
    // Nothing left, so the claim goes back — the transient copy below invites a
    // retry and has to mean it. Released on the quota path too: the message
    // there does not invite one, but the quota can reset at any moment and a
    // stale claim would then block the first attempt that would have worked.
    releaseSend(record.token, addressKey);
    // The provider's message is for our logs only: it can name the recipient,
    // and the client gets copy chosen from the reason instead.
    console.error(`results-send failed (${sent.reason}):`, sent.detail);

    /*
      QUOTA IS ITS OWN ANSWER, with its own code and its own status.
      `send_quota` rather than `send_failed` is what puts the cause into the
      PostHog failure event, which until now carried "send_failed" for
      everything and so could not tell anyone what had gone wrong. 503 rather
      than 502 because this is our capacity, not the provider rejecting the
      message.
    */
    if (sent.reason === "quota") {
      return NextResponse.json(
        { ok: false, code: "send_quota", error: QUOTA_MESSAGE },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        code: "send_failed",
        error:
          sent.reason === "not_configured"
            ? "Email is not switched on yet. Nothing was sent."
            : // True again now that the one failure it was false for has been
              // split out above.
              "We could not send that just now. Try again in a moment.",
      },
      { status: 502 },
    );
  }

  // Counted only after the provider accepted it, so a failure does not burn one
  // of the five.
  recordSend(record.token);

  /*
   * THE LINK BETWEEN AN ADDRESS AND A RESULT, which is the one thing here that
   * cannot be reconstructed later. A second row rather than an update, because
   * the endpoint only inserts — see ResultStage in lib/test/result-stats.ts for
   * why that means two rows per emailed result and what has to filter on it.
   *
   * Not awaited and never fatal, exactly like the completion row: the person
   * has their email already, and failing their request over our own bookkeeping
   * would be punishing them for our problem.
   */
  void recordResultStats({
    ...stats,
    stage: "emailed",
    email,
    /*
      THE SAME KEY THE `pending` ROW ABOVE CARRIES, and writing it here is what
      closes the loop. The endpoint cannot update, so this row landing IS the
      record that the pending one was satisfied; without a shared key the drain
      would have no way to tell an address that never got its results from one
      that did, and would post a second copy to everybody who retried.
    */
    sendKey,
  });

  /*
   * The address goes to Aurora through the SAME path the rest of the site uses,
   * with a source that distinguishes this branch. This is deliberately after
   * the send and deliberately non-fatal: the person has their email either way,
   * and failing their request because our own list-write hiccuped would be
   * punishing them for our problem.
   */
  const source =
    record.audience === "child" ? EMAIL_SOURCES.testChild : EMAIL_SOURCES.testParent;
  try {
    const { inserted, submissions, mode } = await insertEmailSignup({
      email,
      source,
      /*
       * A RESEND IS NOT A SUBMISSION.
       *
       * Typing an address is an act of intent and is counted every time, even
       * when the address is one already on the list — someone who comes back
       * and enters the same address a second time has told us something. But
       * "Send it again" is one person chasing one message that did not arrive,
       * and counting it would inflate the number with impatience rather than
       * interest.
       *
       * The write still happens on a resend, with counting suppressed, because
       * the list write is best-effort and non-fatal: if the first attempt's
       * write was the one that hiccuped, this is the second chance to record
       * the address at all.
       */
      countsAsSubmission: body.isResend !== true,
      /*
        The same builder the pricing form uses, so the synthetic marker reaches
        both tables from one place. This route already tags its `test_results`
        row via `isSyntheticRequest` a few lines above; before this, the signup
        it writes immediately afterwards from the SAME request went in untagged.
      */
      meta: signupMeta(request.headers),
    });
    if (process.env.NODE_ENV !== "production") {
      console.info(
        `results-send: filed source="${source}" via the ${mode} store ` +
          `(submissions=${submissions ?? "unreported"})`,
      );
    }
    // Only a genuinely new row is a conversion. A resend to the same address is
    // not a second signup.
    if (inserted) await captureEmailCapturedServer(request, source, body.isInternal === true);
  } catch (err) {
    console.error(
      "results-send: email stored-send succeeded but the list write failed:",
      err instanceof Error ? err.message : err,
    );
  }

  return NextResponse.json({
    ok: true,
    sendsRemaining: Math.max(0, MAX_SENDS_PER_RESULT - (record.sendCount + 1)),
  });
}
