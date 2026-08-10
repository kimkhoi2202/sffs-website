import { sqlString } from "./posthog-query";
import type { ResolvedRange } from "./time-range";

/**
 * What the dashboard means by "completed", written down once.
 *
 * ===========================================================================
 * THE PROBLEM THIS EXISTS TO FIX
 * ===========================================================================
 * A row in `test_results` was being read as "somebody finished the test". For
 * about a quarter of them that is false, and the way it is false was invisible
 * on the page.
 *
 * The test runs on a countdown. When the clock reaches zero the runner submits
 * whatever is on screen, writes the row, fires `test_completed` and raises the
 * email gate — all of it on a tab nobody is looking at, because the person left
 * ten minutes ago. Measured over 3-10 August: 218 of 860 rows were written this
 * way for somebody who had answered barely half the paper, with a median of 35
 * seconds per answered question against 14 for the people who pressed submit
 * themselves.
 *
 * Those 218 rows were being added to the 642 real ones and the sum divided into
 * the address count, which is how the completed-to-email rate came to read
 * 49.8% when the rate among people who actually sat the test is 71.1%. The page
 * was reporting that half of all finishers decline to give an email. They do
 * not.
 *
 * ===========================================================================
 * THE CUT, AND WHY IT IS THIS ONE
 * ===========================================================================
 * A finished test is one the person ENDED THEMSELVES, or one the clock ended
 * after they had worked through at least `ANSWERED_SHARE` of the paper.
 * An abandonment is a row the countdown wrote for somebody who had not.
 *
 * Two facts are available and NEITHER IS SUFFICIENT ALONE. The rule is the
 * conjunction, and both halves are carried onto the page so a reader can see
 * where they disagree.
 *
 *   `timed_out` is NECESSARY but not sufficient. Necessary because Aurora holds
 *   no row at all for somebody who simply quit or walked away — the write
 *   happens only when the flow ends and a token is minted — so the countdown is
 *   the ONLY thing that can manufacture a row nobody wanted. Not sufficient
 *   because 77 of the 295 timed-out rows had answered 90% or more: those people
 *   engaged completely and the clock caught them at the end. The Funnel tab has
 *   said so on screen since long before this file existed — "someone who answers
 *   48 of 50 and hits the limit engaged completely" — and reclassifying them as
 *   abandonments here would contradict the page one tab over.
 *
 *   A low answered share is also not sufficient. 46 rows were submitted
 *   deliberately below the share. Somebody who answers 60% and presses submit
 *   has finished and declined, which is precisely the population this whole
 *   change exists to stop erasing.
 *
 * So: 295 rows carry the flag, 264 fall under the share, 218 do both. The 218
 * are the abandonments. The 123 rows where the two measures disagree are
 * counted as finished, and both component figures ride on the payload so the
 * disagreement is readable rather than buried in this comment.
 *
 * ===========================================================================
 * WHY 90%, AND WHY IT IS ON THE PAGE
 * ===========================================================================
 * It is a threshold somebody chose, so it does not get to be a hidden constant.
 * It is carried in the payload as `answeredShare` and printed, because a reader
 * is entitled to know what "completed" means on a page that reports it.
 *
 * It separates cleanly rather than finely: the median self-submitted row
 * answered 100% of the paper and the median timer-written one answered 56%, so
 * the gap the threshold sits in is nearly empty and the exact value is not
 * load-bearing. It is the value the original analysis used, kept so the page
 * and the analysis can be compared without a translation step.
 *
 * `max_score` is the item count, not a points total — verified on the live
 * table: adult rows are 50/50 and child rows 15/15, and `answered` never
 * exceeds it. So `answered / max_score` really is the share of items answered.
 *
 * A timed-out row whose progress cannot be established does NOT get the
 * exemption: the clock wrote it and there is no evidence the person worked the
 * paper, so it counts as an abandonment. Zero rows are in that state today; the
 * branch exists so the answer is defined rather than accidental.
 *
 * ===========================================================================
 * WHAT THIS IS NOT
 * ===========================================================================
 * Not an exclusion. Abandonments are real people who started the test and left,
 * which is a genuine and expensive funnel loss — 218 of them, and 55 came back
 * to the gate and gave an address anyway. They are counted, carried and
 * reported next to the finishers. The distinction being drawn is between LEFT
 * THE TEST and FINISHED AND DECLINED, which the page was adding together.
 *
 * Not a change to the export. The Lambda's four conditions still decide what
 * reaches the warehouse at all; this decides what the dashboard calls the rows
 * once they arrive. See the header of test-results.ts.
 */

/**
 * The share of items a timed-out attempt must have answered to still count as
 * finished.
 *
 * Exported so the panel can print it. Do not inline it anywhere: the number
 * appearing on the page and the number in the WHERE clause have to be the same
 * one, or the page is documenting a rule it is not applying.
 */
export const ANSWERED_SHARE = 0.9;

/* --------------------------------------------------------------------------
 * The 9 August delivery outage
 * ------------------------------------------------------------------------ */

/**
 * The hours when giving an address could not be recorded as a conversion.
 *
 * Resend's daily quota was exhausted and every results email failed. The
 * product kept working: people finished tests, reached the gate and typed in
 * an address. What broke was everything downstream of the send.
 *
 * Measured across the window, both sides of the house agree on the shape:
 *
 *   Warehouse   157 finished tests recorded, 1 carrying an address. The address
 *               is merged onto a completion from its `stage='emailed'` sibling
 *               row, and that row is only written on a successful send, so a
 *               failed send leaves a completion looking anonymous.
 *   PostHog     633 `test_email_submitted` events from 80 people, and
 *               `email_captured` flat at zero from 18:00 onward — it fires
 *               server-side only when Aurora genuinely inserted a signup. 80
 *               people submitted, 77 were never recorded at all, 3 came back
 *               later and succeeded.
 *
 *   The 633-attempts-from-80-people ratio is the retry storm: people pressed
 *   the button eight times each because nothing arrived.
 *
 * Left in the average, six and a half hours of total delivery failure read as
 * users refusing to give an address, and cost the completed-to-email rate about
 * eleven points. So the window is held out of the rates and REPORTED, with its
 * counts, rather than quietly dropped — a range of hours vanishing from a
 * denominator with no note is the kind of thing this dashboard exists not to do.
 *
 * The boundaries come from the incident timeline (the send logs know the minute
 * the quota went and the minute it came back) and the row data corroborates
 * them exactly: every full hour between carries zero conversions, and the two
 * partial hours at the ends are where the transitions sit.
 *
 * Hardcoded because it is history. This is one fixed set of six and a half
 * hours in the past, it will never move, and the alternative — inferring an
 * outage from a conversion drought — would silently swallow any genuinely bad
 * afternoon. See lib/email/send-health.ts for the live detector, which is a
 * different job.
 */
export const OUTAGE_FROM = "2026-08-09T17:47:00Z";
export const OUTAGE_TO = "2026-08-10T00:16:00Z";

/** PostHog's `toDateTime` is happiest with a space-separated, zone-free string. */
function dt(iso: string): string {
  return `toDateTime(${sqlString(iso.replace("T", " ").replace("Z", ""))})`;
}

/** True when the reporting window touches the outage at all. */
export function rangeHitsOutage(range: ResolvedRange): boolean {
  return range.from < OUTAGE_TO && range.to > OUTAGE_FROM;
}

/**
 * Where the two systems keep the three facts the rule reads.
 *
 * The rule has to run against the warehouse mirror (bare typed columns) and
 * against `test_completed` (JSON event properties, everything stringly typed).
 * Passing the accessors in is what lets ONE definition serve both, so the
 * Completions tab and the Growth funnel cannot drift into disagreeing about
 * what the word means — which is the failure this whole file is cleaning up
 * after.
 */
export interface RuleColumns {
  /** An expression that is true when the countdown ended the attempt. */
  timedOut: string;
  /** Items answered, as a number. */
  answered: string;
  /** Items on the paper, as a number. Zero or null means "cannot tell". */
  maxScore: string;
}

/** The warehouse mirror: real columns, nullable. */
export const WAREHOUSE_COLUMNS: RuleColumns = {
  timedOut: "coalesce(timed_out, false)",
  answered: "toFloat(coalesce(answered, 0))",
  maxScore: "toFloat(coalesce(max_score, 0))",
};

/**
 * A `test_completed` event.
 *
 * `properties.timed_out` is a JSON boolean, which HogQL surfaces as the string
 * "true"; comparing the string is what people.ts already does for the same
 * property, and it survives the property arriving as either a real boolean or
 * a string.
 */
export const EVENT_COLUMNS: RuleColumns = {
  timedOut: "toString(properties.timed_out) = 'true'",
  answered: "toFloat(coalesce(properties.answered, 0))",
  maxScore: "toFloat(coalesce(properties.max_score, 0))",
};

/**
 * The attempt was finished: ended by the person, or by the clock after they had
 * worked through the paper.
 */
export function finishedExpr(c: RuleColumns): string {
  return `(NOT (${c.timedOut}) OR (${c.maxScore} > 0 AND ${c.answered} / ${c.maxScore} >= ${ANSWERED_SHARE}))`;
}

/** The countdown wrote this row for somebody who had already left. */
export function abandonedExpr(c: RuleColumns): string {
  return `(NOT ${finishedExpr(c)})`;
}

/** Answered less than the share — the corroborating measure, on its own. */
export function sparseExpr(c: RuleColumns): string {
  return `(${c.maxScore} <= 0 OR ${c.answered} / ${c.maxScore} < ${ANSWERED_SHARE})`;
}

/**
 * The completion landed inside the delivery outage.
 *
 * Reads `completed_at`, which is a String on the warehouse table, so it is
 * parsed rather than compared — the same reason the reporting window cannot be
 * delegated to PostHog's `dateRange`. See the header of test-results.ts.
 */
export function inOutageExpr(): string {
  return `(notEmpty(toString(completed_at))
      AND parseDateTimeBestEffort(toString(completed_at)) >= ${dt(OUTAGE_FROM)}
      AND parseDateTimeBestEffort(toString(completed_at)) < ${dt(OUTAGE_TO)})`;
}

/**
 * The event landed inside the delivery outage.
 *
 * The events side needs the bound on `timestamp` rather than on a string
 * column, so it cannot share the expression above.
 */
export function eventInOutageExpr(): string {
  return `(timestamp >= ${dt(OUTAGE_FROM)} AND timestamp < ${dt(OUTAGE_TO)})`;
}
