import "server-only";

import { hogql, sqlString } from "./posthog-query";
import type { ResolvedRange } from "./time-range";
import type { TestCompletionRow, TestPlatformRow, TestResultTotals } from "./types";

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
}

interface RawPlatformRow {
  platform: string;
  adult: number;
  child: number;
  total: number;
  anonymous: number;
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
}

/**
 * Completions by acquisition platform, split adult and child.
 *
 * The anonymous count rides along per platform rather than being a separate
 * query: it is the one number a reader is most likely to assume has been
 * excluded, and showing it next to the total is what proves it has not.
 */
async function fetchPlatforms(range: ResolvedRange): Promise<RawPlatformRow[]> {
  return hogql<RawPlatformRow>(`
    SELECT
      ${PLATFORM} AS platform,
      countIf(toString(test_type) = 'adult') AS adult,
      countIf(toString(test_type) = 'child') AS child,
      count() AS total,
      countIf(email IS NULL OR empty(toString(email))) AS anonymous
    FROM test_results
    WHERE ${inWindow(range)}
    GROUP BY platform
    ORDER BY total DESC, platform`);
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
      toString(completed_at) AS completed_at
    FROM test_results
    WHERE ${inWindow(range)}
    ORDER BY parseDateTimeBestEffort(toString(completed_at)) DESC
    LIMIT 500`);
}

export async function fetchTestResults(range: ResolvedRange): Promise<TestResultsPayload> {
  const [platformRows, completionRows] = await Promise.all([
    fetchPlatforms(range),
    fetchCompletions(range),
  ]);

  const platforms: TestPlatformRow[] = platformRows.map((row) => ({
    platform: String(row.platform),
    adult: Number(row.adult),
    child: Number(row.child),
    total: Number(row.total),
    anonymous: Number(row.anonymous),
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

  return { platforms, completions, totals };
}

export { UNATTRIBUTABLE };
