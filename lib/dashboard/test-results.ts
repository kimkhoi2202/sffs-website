import "server-only";

import {
  ANSWERED_SHARE,
  OUTAGE_FROM,
  OUTAGE_TO,
  WAREHOUSE_COLUMNS,
  abandonedExpr,
  finishedExpr,
  inOutageExpr,
  rangeHitsOutage,
  sparseExpr,
} from "./completion-rule";
import { hogql, sqlString } from "./posthog-query";
import type { ResolvedRange } from "./time-range";
import type {
  CompletionAccounting,
  CompletionSplit,
  TestCompletionRow,
  TestPlatformRow,
  TestResultTotals,
} from "./types";

/**
 * Real test completions, read from Aurora's `test_results` table as mirrored
 * into PostHog's data warehouse.
 *
 * ===========================================================================
 * DO NOT ADD EXCLUSION FILTERS HERE
 * ===========================================================================
 * Every other query in this dashboard carries `{filters}` so PostHog can
 * substitute the project's internal-user rules, and `lib/dashboard/people.ts`
 * additionally keeps a hand-written address list for signup rows PostHog never
 * saw. NEITHER APPLIES TO THIS TABLE, and adding either would be wrong rather
 * than merely redundant.
 *
 * The export that fills this table is pre-filtered at source: harness rows and
 * internal rows are removed before they reach PostHog, so every row here is
 * already a real public completion. A second filter on top could only remove
 * real people. The Playwright harness in particular used to write synthetic
 * rows into Aurora and no longer can — see `scripts/harness-target.mjs`, which
 * refuses production targets outright — so there is nothing left here to
 * subtract.
 *
 * Consequently these queries are called WITHOUT a `QueryScope`: no
 * `filterTestAccounts`, no `{filters}` placeholder, no `dateRange`. The window
 * is applied inline instead, for the reason immediately below.
 *
 * ===========================================================================
 * THE TABLE IS ADDRESSED BY NAME, AND `completed_at` IS A STRING
 * ===========================================================================
 * `FROM test_results` resolves by name on purpose. The warehouse table's
 * numeric PostHog id is regenerated on every content refresh — hourly — so an
 * id pinned into this file would be stale within the hour and the panel would
 * start answering "unknown table" for no visible reason.
 *
 * `completed_at` is a String on the warehouse table, not a DateTime, so it is
 * parsed rather than compared. That is also why the window cannot be delegated
 * to PostHog's `dateRange`, which expects a real timestamp column. HogQL
 * exposes `parseDateTimeBestEffort` but not the `OrNull` variant, hence the
 * `notEmpty` guard standing in front of it.
 */

/** PostHog's `toDateTime` is happiest with a space-separated, zone-free string. */
function dt(iso: string): string {
  return `toDateTime(${sqlString(iso.replace("T", " ").replace("Z", ""))})`;
}

/**
 * The window predicate, shared by both queries so they can never disagree
 * about which completions are in scope.
 */
function inWindow(range: ResolvedRange): string {
  return `notEmpty(toString(completed_at))
      AND parseDateTimeBestEffort(toString(completed_at)) >= ${dt(range.from)}
      AND parseDateTimeBestEffort(toString(completed_at)) < ${dt(range.to)}`;
}

/**
 * The label for a completion that arrived with no acquisition platform.
 *
 * `platform IS NULL` is a real and reasonably common outcome — someone typing
 * the address in, a stripped referrer, an app that does not pass one through.
 * Grouping on the raw column would drop those rows out of the GROUP BY
 * silently, so the summary would still add up internally while quietly
 * understating the total. Naming the bucket is what keeps it visible.
 */
const UNATTRIBUTABLE = "unattributable";

const PLATFORM = `coalesce(nullIf(toString(platform), ''), '${UNATTRIBUTABLE}')`;

export interface TestResultsPayload {
  platforms: TestPlatformRow[];
  completions: TestCompletionRow[];
  totals: TestResultTotals;
  /**
   * What this tab means by "completion", and the 9 August correction.
   *
   * `totals.completions` is unchanged and still counts every row in the
   * mirror. This says how many of those the person actually finished. See
   * lib/dashboard/completion-rule.ts.
   */
  accounting: CompletionAccounting;
}

interface RawPlatformRow {
  platform: string;
  adult: number;
  child: number;
  total: number;
  anonymous: number;
  finished: number;
  abandoned: number;
  finished_email: number;
}

interface RawCompletionRow {
  id: string;
  email: string;
  test_type: string;
  grade_band: string;
  score: number;
  max_score: number;
  platform: string;
  completed_at: string;
  /*
    Aliased away from the column names they are computed from. HogQL resolves
    a later select item against an earlier OUTPUT alias, so `AS timed_out`
    would make the `abandoned` expression below read its own output instead of
    the column. See the note on `RawEmails` in growth.ts, where the same
    shadowing produced a 400 that named neither the column nor the cause.
  */
  answered_count: number;
  is_timed_out: boolean;
  is_abandoned: boolean;
}

interface RawAccountingRow {
  finished: number;
  abandoned: number;
  finished_email: number;
  abandoned_email: number;
  out_finished: number;
  out_abandoned: number;
  out_finished_email: number;
  out_abandoned_email: number;
  outage_finished: number;
  outage_finished_email: number;
  rule_timed_out: number;
  rule_sparse: number;
  both_signals: number;
}

/**
 * Completions by acquisition platform, split adult and child.
 *
 * The anonymous count rides along per platform rather than being a separate
 * query: it is the one number a reader is most likely to assume has been
 * excluded, and showing it next to the total is what proves it has not.
 */
async function fetchPlatforms(range: ResolvedRange): Promise<RawPlatformRow[]> {
  const has = `notEmpty(trim(coalesce(toString(email), '')))`;
  return hogql<RawPlatformRow>(`
    SELECT
      ${PLATFORM} AS platform,
      countIf(toString(test_type) = 'adult') AS adult,
      countIf(toString(test_type) = 'child') AS child,
      count() AS total,
      countIf(email IS NULL OR empty(toString(email))) AS anonymous,
      countIf(${finishedExpr(WAREHOUSE_COLUMNS)}) AS finished,
      countIf(${abandonedExpr(WAREHOUSE_COLUMNS)}) AS abandoned,
      countIf(${finishedExpr(WAREHOUSE_COLUMNS)} AND ${has}) AS finished_email
    FROM test_results
    WHERE ${inWindow(range)}
    GROUP BY platform
    ORDER BY total DESC, platform`);
}

/**
 * The accounting figures, in one scan over the same rows.
 *
 * Separate from `fetchPlatforms` because the outage hold-out cuts across
 * platforms rather than within them, and summing a corrected figure out of
 * per-platform rows would give the panel two ways to arrive at one number.
 */
async function fetchAccounting(range: ResolvedRange): Promise<RawAccountingRow[]> {
  const has = `notEmpty(trim(coalesce(toString(email), '')))`;
  const finished = finishedExpr(WAREHOUSE_COLUMNS);
  const abandoned = abandonedExpr(WAREHOUSE_COLUMNS);
  const outage = inOutageExpr();
  const sparse = sparseExpr(WAREHOUSE_COLUMNS);
  return hogql<RawAccountingRow>(`
    SELECT
      countIf(${finished}) AS finished,
      countIf(${abandoned}) AS abandoned,
      countIf(${finished} AND ${has}) AS finished_email,
      countIf(${abandoned} AND ${has}) AS abandoned_email,
      countIf(${finished} AND NOT ${outage}) AS out_finished,
      countIf(${abandoned} AND NOT ${outage}) AS out_abandoned,
      countIf(${finished} AND ${has} AND NOT ${outage}) AS out_finished_email,
      countIf(${abandoned} AND ${has} AND NOT ${outage}) AS out_abandoned_email,
      countIf(${finished} AND ${outage}) AS outage_finished,
      countIf(${finished} AND ${has} AND ${outage}) AS outage_finished_email,
      countIf(${WAREHOUSE_COLUMNS.timedOut}) AS rule_timed_out,
      countIf(${sparse}) AS rule_sparse,
      countIf(${WAREHOUSE_COLUMNS.timedOut} AND ${sparse}) AS both_signals
    FROM test_results
    WHERE ${inWindow(range)}`);
}

/**
 * One row per completion.
 *
 * `grade` is null on every adult row, so `grade_band` carries the display value
 * instead: it is populated on all of them, and on a child row it already reads
 * as the grade the test was set for.
 */
async function fetchCompletions(range: ResolvedRange): Promise<RawCompletionRow[]> {
  return hogql<RawCompletionRow>(`
    SELECT
      toString(id) AS id,
      coalesce(nullIf(toString(email), ''), '') AS email,
      toString(test_type) AS test_type,
      coalesce(nullIf(toString(grade_band), ''), '') AS grade_band,
      toInt(coalesce(score, 0)) AS score,
      toInt(coalesce(max_score, 0)) AS max_score,
      ${PLATFORM} AS platform,
      toString(completed_at) AS completed_at,
      toInt(coalesce(answered, 0)) AS answered_count,
      ${WAREHOUSE_COLUMNS.timedOut} AS is_timed_out,
      ${abandonedExpr(WAREHOUSE_COLUMNS)} AS is_abandoned
    FROM test_results
    WHERE ${inWindow(range)}
    ORDER BY parseDateTimeBestEffort(toString(completed_at)) DESC
    LIMIT 500`);
}

export async function fetchTestResults(range: ResolvedRange): Promise<TestResultsPayload> {
  const [platformRows, completionRows, accountingRows] = await Promise.all([
    fetchPlatforms(range),
    fetchCompletions(range),
    fetchAccounting(range),
  ]);

  const platforms: TestPlatformRow[] = platformRows.map((row) => ({
    platform: String(row.platform),
    adult: Number(row.adult),
    child: Number(row.child),
    total: Number(row.total),
    anonymous: Number(row.anonymous),
    finished: Number(row.finished),
    abandoned: Number(row.abandoned),
    finishedWithEmail: Number(row.finished_email),
  }));

  // Unattributable is the absence of a platform rather than one of them, so it
  // sits at the bottom regardless of size instead of jostling with Reddit for
  // the top row.
  platforms.sort((a, b) => {
    if (a.platform === UNATTRIBUTABLE) return 1;
    if (b.platform === UNATTRIBUTABLE) return -1;
    return b.total - a.total || a.platform.localeCompare(b.platform);
  });

  const completions: TestCompletionRow[] = completionRows.map((row) => ({
    id: String(row.id),
    email: row.email ? String(row.email) : null,
    testType: String(row.test_type),
    gradeBand: String(row.grade_band),
    score: Number(row.score),
    maxScore: Number(row.max_score),
    platform: String(row.platform),
    completedAt: String(row.completed_at),
    answered: Number(row.answered_count),
    timedOut: Boolean(row.is_timed_out),
    abandoned: Boolean(row.is_abandoned),
  }));

  // Totalled from the platform rows rather than from `completions`, which is
  // capped at 500. At the current volume the two agree; if the table ever
  // outgrows the cap, the headline stays right and only the list truncates.
  const totals = platforms.reduce(
    (acc, row) => ({
      completions: acc.completions + row.total,
      adult: acc.adult + row.adult,
      child: acc.child + row.child,
      anonymous: acc.anonymous + row.anonymous,
      withEmail: acc.withEmail + (row.total - row.anonymous),
    }),
    { completions: 0, adult: 0, child: 0, anonymous: 0, withEmail: 0 },
  );

  const acc = accountingRows[0];
  const timedOut = Number(acc?.rule_timed_out ?? 0);
  const sparse = Number(acc?.rule_sparse ?? 0);
  const bothSignals = Number(acc?.both_signals ?? 0);
  const accounting: CompletionAccounting = {
    rule: {
      answeredShare: ANSWERED_SHARE,
      timedOut,
      sparse,
      both: bothSignals,
      timedOutOnly: Math.max(0, timedOut - bothSignals),
      sparseOnly: Math.max(0, sparse - bothSignals),
    },
    all: split(
      Number(acc?.finished ?? 0),
      Number(acc?.abandoned ?? 0),
      Number(acc?.finished_email ?? 0),
      Number(acc?.abandoned_email ?? 0),
    ),
    corrected: split(
      Number(acc?.out_finished ?? 0),
      Number(acc?.out_abandoned ?? 0),
      Number(acc?.out_finished_email ?? 0),
      Number(acc?.out_abandoned_email ?? 0),
    ),
    outage: {
      from: OUTAGE_FROM,
      to: OUTAGE_TO,
      overlaps: rangeHitsOutage(range),
      finished: Number(acc?.outage_finished ?? 0),
      finishedWithEmail: Number(acc?.outage_finished_email ?? 0),
    },
  };

  return { platforms, completions, totals, accounting };
}

/** Four counts and the two rates they imply. */
function split(
  finished: number,
  abandoned: number,
  finishedWithEmail: number,
  abandonedWithEmail: number,
): CompletionSplit {
  return {
    finished,
    abandoned,
    finishedWithEmail,
    abandonedWithEmail,
    finishedEmailRate: finished > 0 ? finishedWithEmail / finished : null,
    abandonedEmailRate: abandoned > 0 ? abandonedWithEmail / abandoned : null,
  };
}

export { UNATTRIBUTABLE };
