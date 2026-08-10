import "server-only";

import type { SendFailureReason } from "./resend";

/**
 * Whether the results mailer is currently working, and shouting when it is not.
 *
 * ===========================================================================
 * WHY THIS EXISTS
 * ===========================================================================
 * On 9 August the Resend account exhausted its daily quota at 17:52 UTC and
 * every results email failed for the next six hours. Nobody noticed. The only
 * trace was a `console.error` per attempt in a log nobody was tailing, and a
 * PostHog `test_email_send_failed` event that no insight and no alert was
 * pointed at. Both of those are records you find AFTER somebody tells you to
 * look, which is the definition of not being monitored.
 *
 * The gap was not instrumentation. It was that nothing anywhere could say the
 * sentence "sends are failing right now". This file says it.
 *
 * ===========================================================================
 * PROPORTION IS THE WHOLE DESIGN PROBLEM
 * ===========================================================================
 * One failed send is normal — a typo'd domain, a mailbox that is full, a blip.
 * An alert that fires on those is an alert that gets muted, and a muted alert
 * is worse than none because it also carries the belief that you are covered.
 * Six hours is not normal. Two rules, because the two cases look nothing alike:
 *
 *   1. A QUOTA REFUSAL FIRES IMMEDIATELY, on the first one. It is not a
 *      sampling question. `daily_quota_exceeded` means every send after it
 *      fails too, so waiting for a second data point only buys latency — the
 *      first refusal on 9 August was already the whole outage.
 *
 *   2. ANYTHING ELSE NEEDS A SUSTAINED RATE: most of the recent window failing,
 *      over enough attempts for "most" to mean something. This is what catches
 *      the shapes we have not met yet — a revoked key, a DNS failure, the
 *      provider being down — without firing on the ordinary bad address.
 *
 * ===========================================================================
 * PER-INSTANCE, AND THAT IS FINE FOR THE THING IT WATCHES
 * ===========================================================================
 * The window is an in-process array, like every other counter in this codebase
 * (see lib/rate-limit.ts and lib/test/result-store.ts). It sees only the
 * attempts that landed on one serverless instance, which would make it a poor
 * way to measure a 5% failure rate.
 *
 * It is not measuring a 5% failure rate. A total outage fails on EVERY
 * instance, so every instance that serves a send during one crosses the
 * threshold on its own, and the first one to do it is enough. The failure mode
 * of a per-instance detector here is firing several times, which the cooldown
 * below already handles, rather than not firing at all.
 */

/** How far back the sustained-rate rule looks. */
const WINDOW_MS = 15 * 60_000;

/**
 * Below this many attempts in the window, the ratio rule stays silent.
 *
 * Two failures out of two is 100% and means nothing; it is a quiet afternoon
 * and one person who typed `gmail.con`. Five is the smallest number where a
 * majority failing is a statement about us rather than about them.
 */
const MIN_ATTEMPTS = 5;

/** Most of the window failing. Three of five, six of ten. */
const FAIL_RATIO = 0.6;

/**
 * One alert per instance per this long.
 *
 * The event exists to be alerted on, and an outage produces hundreds of
 * attempts. Without this, a six-hour outage is a six-hour stream of identical
 * events, which is how a channel gets muted.
 */
const ALERT_COOLDOWN_MS = 15 * 60_000;

/**
 * How long a quota refusal keeps colouring what we tell people.
 *
 * An hour, matching ADDRESS_LIMIT in the send route, and that match is the
 * point. During the incident somebody's fourth attempt was refused by the
 * per-address limiter with copy about having "had a few of these already",
 * which reads as "some were sent" to a person who had received nothing. An
 * hour of memory means the route can still name the real reason at the moment
 * that limiter speaks.
 */
const OUTAGE_MEMORY_MS = 60 * 60_000;

interface Attempt {
  at: number;
  ok: boolean;
}

/**
 * Bounded by construction: entries older than the window are dropped on every
 * write, and the window is time-based rather than count-based, so a burst
 * cannot grow it without limit the way a keyed map can.
 */
let attempts: Attempt[] = [];
let lastQuotaFailureAt = 0;
let lastAlertAt = 0;

/** What an alert says. No address, no token, no provider message — see below. */
export interface SendHealthAlert {
  /** Why it fired. `quota` is rule 1; `failure_rate` is rule 2. */
  kind: "quota" | "failure_rate";
  failures: number;
  attempts: number;
  /** Whole percent, so the alert reads the same in a log line and an insight. */
  failureRate: number;
  windowMinutes: number;
}

/**
 * Record one send attempt and return an alert if this one crossed a line.
 *
 * Returns null on the overwhelming majority of calls, including most failures.
 * The caller fires whatever it fires; deciding IS this function's whole job, so
 * that the rule lives in one place and can be asserted against directly.
 */
export function noteSendAttempt(
  outcome: { ok: true } | { ok: false; reason: SendFailureReason },
): SendHealthAlert | null {
  const now = Date.now();

  attempts.push({ at: now, ok: outcome.ok });
  attempts = attempts.filter((a) => now - a.at < WINDOW_MS);

  const total = attempts.length;
  const failures = attempts.filter((a) => !a.ok).length;
  const rate = total === 0 ? 0 : failures / total;

  /*
    A quota refusal is remembered even when the cooldown swallows the alert.
    The two answer different questions: the alert asks "should a human hear
    about this now", and this asks "is the mailer out of quota right now",
    which the route needs on every request to choose honest copy.
  */
  const quota = !outcome.ok && outcome.reason === "quota";
  if (quota) lastQuotaFailureAt = now;

  if (outcome.ok) return null;

  const sustained = total >= MIN_ATTEMPTS && rate >= FAIL_RATIO;
  if (!quota && !sustained) return null;

  if (now - lastAlertAt < ALERT_COOLDOWN_MS) return null;
  lastAlertAt = now;

  return {
    kind: quota ? "quota" : "failure_rate",
    failures,
    attempts: total,
    failureRate: Math.round(rate * 100),
    windowMinutes: Math.round(WINDOW_MS / 60_000),
  };
}

/**
 * Whether the provider has refused us on quota grounds recently enough that a
 * fresh attempt is very unlikely to land.
 *
 * Used only to pick what to SAY. Nothing branches on it to skip a send: a
 * guess about the provider's state is not a reason to refuse to try, and the
 * cost of being wrong would be a person told their results are stuck when the
 * quota had already reset.
 */
export function inQuotaOutage(): boolean {
  return lastQuotaFailureAt > 0 && Date.now() - lastQuotaFailureAt < OUTAGE_MEMORY_MS;
}

/** Test seam. Nothing in the request path calls this. */
export function resetSendHealth(): void {
  attempts = [];
  lastQuotaFailureAt = 0;
  lastAlertAt = 0;
}
