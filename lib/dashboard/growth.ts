import "server-only";

import { channelExpr, type LadderColumns } from "./attribution";
import { hogql, hogqlWithMeta, sqlString, type QueryScope } from "./posthog-query";
import type { ResolvedRange } from "./time-range";
import type {
  GrowthChannelRow,
  GrowthEmails,
  GrowthFunnel,
  GrowthSideTotals,
  SourceFreshness,
} from "./types";

/**
 * The four numbers the owner asks for by hand, and the two tables he reads
 * every time.
 *
 * ===========================================================================
 * EVERY STAGE IS DISTINCT PEOPLE, OVER ONE POPULATION
 * ===========================================================================
 * All four funnel stages are `uniqExact` over person_id, and — the part that
 * is easy to get wrong — they are all counted over THE SAME SET OF PEOPLE:
 * those who recorded at least one `$pageview` in the window.
 *
 * Counting people at the top and events at the bottom flatters the bottom, and
 * that bug has already been fixed once on this dashboard. The subtler version
 * is counting DIFFERENT PEOPLE at each stage, which is what happens if stage 1
 * is pageview-based and stages 2-4 are "everybody PostHog saw": 754 people in
 * the current window reached PostHog with no pageview at all, and twelve of
 * them gave an email. Left alone, that makes the last stage larger than its own
 * denominator deserves and makes the channel table below fail to add up to the
 * funnel above it.
 *
 * So the population is pinned once, in `POPULATION`, and every count on this
 * page — funnel, channel table, paid/organic — is taken over it. The people it
 * excludes are not swept away: `seenWithoutPageview` and
 * `withoutPageviewEmailed` are returned alongside and printed on the panel, so
 * the difference between this funnel and the `Signups` tile at the top of the
 * page is a stated number rather than a discrepancy somebody has to discover.
 *
 * ===========================================================================
 * THIS PAGE CARRIES TWO COUNTING UNITS, AND THEY ARE NOT INTERCHANGEABLE
 * ===========================================================================
 * `GrowthFunnel.completed` counts PEOPLE. `GrowthEmails.finishedTests` counts
 * FINISHED TESTS. They are different quantities measured off different
 * systems, they will not agree, and neither is wrong when they don't.
 *
 * They were both called "completions" once, four scroll-lines apart on the
 * same tab, and the page was read as reporting one number twice. It reported
 * two, and the owner had no way to see that from the page.
 *
 * A person is more than one finished test whenever they retake the paper or
 * sit one audience and then the other — measured at 21 people behind 26 extra
 * tests when this was written. In the other direction a finished test that
 * gave no address belongs to nobody the mirror can name, so the people behind
 * `finishedTests` can be BOUNDED but never counted, and the panel says so
 * rather than picking an end of the range.
 *
 * ===========================================================================
 * AND AURORA'S ROW COUNT IS A THIRD QUANTITY AGAIN
 * ===========================================================================
 * Counting `test_results` in Aurora directly gives a much bigger number than
 * this page shows and the difference is entirely by design, so anyone
 * reconciling the two needs the shape of it. Measured on 9 August: 898 rows
 * against 533 finished tests, and the 365 splits exactly.
 *
 *   +346  the two-stage write. Finishing a test writes a `stage=completed`
 *         row; giving an address afterwards writes a SECOND row,
 *         `stage=emailed`, carrying the same test. The export keeps the
 *         first and merges the address off the second.
 *   +19   attempts where `answered` is zero. Nobody answered a question, so
 *         the export does not call it a completion.
 *
 * The filter lives in the export Lambda (`sffs-test-results-dw-export`), NOT
 * here, so that nothing downstream can surface a contaminated row by
 * forgetting a WHERE clause. Do not reimplement it in this file; the point of
 * putting it at the export is that there is one copy.
 *
 * ===========================================================================
 * THE BOT COHORT IS NOT REIMPLEMENTED HERE, AND MUST NOT BE
 * ===========================================================================
 * An automated fleet was inflating the YouTube and Google visitor counts. The
 * exclusion for it is PostHog cohort 454171, "Automated crawler (client
 * fingerprint)", and it is already one of the five mechanisms inside the
 * project's `test_account_filters`. Every query here carries `{filters}` and is
 * run with a `QueryScope`, so PostHog substitutes that cohort — along with the
 * internal-user cohort, the two distinct_id lists and the `is_internal` rule —
 * server-side.
 *
 * Writing `person_id NOT IN COHORT 454171` here would be a sixth copy of
 * somebody else's configuration and would drift the same way the last copy did.
 * See lib/dashboard/filters.ts, which exists mostly to say so.
 *
 * The consequence worth knowing: in RAW mode the toggle turns
 * `filterTestAccounts` off, so the crawlers come back and the dead channels
 * regain their traffic. That is what raw means, and the panel says so.
 */

/** PostHog's `toDateTime` is happiest with a space-separated, zone-free string. */
function dt(iso: string): string {
  return `toDateTime(${sqlString(iso.replace("T", " ").replace("Z", ""))})`;
}

function scopeFor(range: ResolvedRange, filtered: boolean): QueryScope {
  return { from: range.from, to: range.to, filtered };
}

/**
 * The alias for the per-person subquery.
 *
 * NOT `person`. HogQL already knows that name — it is the person join on the
 * events table — and a subquery wearing it is resolved against the built-in
 * instead, which surfaces as "aggregate function is found inside another
 * aggregate function" rather than as anything resembling a name collision.
 */
const ARRIVED = "arrived";

/**
 * Who is on this page: anyone who loaded a page in the window.
 *
 * Named once so the funnel and the channel table cannot drift into counting
 * different people, which is the whole reason the two disagree elsewhere.
 */
const POPULATION = `${ARRIVED}.pageviews > 0`;

/**
 * A column of the subquery, always qualified.
 *
 * Qualifying is not tidiness. Several of the output aliases below deliberately
 * match the subquery column they are computed from — `emailed` from
 * `emailed` — and an unqualified reference in a LATER select item resolves to
 * the earlier OUTPUT alias, which is itself an aggregate. HogQL then reports
 * "aggregate function is found inside another aggregate function", which names
 * neither the column nor the shadowing that caused it.
 */
const col = (name: string): string => `${ARRIVED}.${name}`;

/**
 * Paid is `utm_medium=cpc`, read off the person's FIRST pageview.
 *
 * First touch, not last: the question this answers is "what did we pay to
 * acquire", and someone who arrived organically on Tuesday and clicked an ad on
 * Thursday was not acquired by the ad. `argMin` on the first pageview is also
 * exactly how the attribution ladder resolves the channel, so the two halves of
 * a row can never describe two different arrivals.
 */
const PAID = `if(lower(${col("f_medium")}) = 'cpc', 1, 0)`;

/** The ladder, reading the person's first pageview — the same one people.ts uses. */
const PERSON_LADDER: LadderColumns = {
  utmSource: col("f_utm"),
  refDomain: col("f_ref"),
  entryPath: col("f_path"),
  surveySource: col("survey_source"),
};

/**
 * One row per person, with their arrival and how far they got.
 *
 * Shared by the funnel and the channel table rather than run twice: the two are
 * the same facts asked at two grains, and computing them separately is how they
 * end up disagreeing by three people and nobody can say why.
 *
 * Written as a `FROM (...)` subquery rather than a `WITH` clause because HogQL
 * inlines CTEs, which puts these aggregates inside the outer ones.
 */
function arrivedSubquery(): string {
  return `
    SELECT
      person_id,
      argMinIf(coalesce(toString(properties.utm_source), ''), timestamp, event = '$pageview') AS f_utm,
      argMinIf(coalesce(toString(properties.utm_medium), ''), timestamp, event = '$pageview') AS f_medium,
      argMinIf(coalesce(toString(properties.$referring_domain), ''), timestamp, event = '$pageview') AS f_ref,
      argMinIf(coalesce(toString(properties.$pathname), ''), timestamp, event = '$pageview') AS f_path,
      argMaxIf(coalesce(toString(properties.source), ''), timestamp, event = 'attribution_survey_answered') AS survey_source,
      countIf(event = '$pageview') AS pageviews,
      maxIf(1, event = 'test_started') AS started,
      maxIf(1, event = 'test_completed') AS completed,
      maxIf(1, event = 'email_captured') AS emailed,
      max(timestamp) AS last_seen
    FROM events
    WHERE {filters}
    GROUP BY person_id`;
}

interface RawFunnel {
  landed: number;
  started: number;
  completed: number;
  emailed: number;
  seen_without_pageview: number;
  without_pageview_emailed: number;
  without_pageview_completed: number;
}

/**
 * The four stages, plus the two numbers that explain who is not in them.
 *
 * `uniqExact` rather than `uniq`. PostHog's `uniq` is an approximate
 * cardinality estimate, and while it is effectively exact at four figures, the
 * channel table below counts rows off a GROUP BY and is exact by construction.
 * An estimate at the top and an exact count underneath would eventually differ
 * by one or two for no reason a reader could ever work out.
 */
async function fetchFunnel(
  range: ResolvedRange,
  filtered: boolean,
): Promise<{ funnel: GrowthFunnel; computedAt: string | null }> {
  const { rows, computedAt } = await hogqlWithMeta<RawFunnel>(
    `SELECT
       countIf(${POPULATION}) AS landed,
       countIf(${POPULATION} AND ${col("started")} = 1) AS started,
       countIf(${POPULATION} AND ${col("completed")} = 1) AS completed,
       countIf(${POPULATION} AND ${col("emailed")} = 1) AS emailed,
       countIf(NOT (${POPULATION})) AS seen_without_pageview,
       countIf(NOT (${POPULATION}) AND ${col("emailed")} = 1) AS without_pageview_emailed,
       countIf(NOT (${POPULATION}) AND ${col("completed")} = 1) AS without_pageview_completed
     FROM (${arrivedSubquery()}) AS ${ARRIVED}`,
    scopeFor(range, filtered),
  );

  const row = rows[0];
  const landed = Number(row?.landed ?? 0);
  const started = Number(row?.started ?? 0);
  const completed = Number(row?.completed ?? 0);
  const emailed = Number(row?.emailed ?? 0);

  return {
    funnel: {
      landed,
      started,
      completed,
      emailed,
      startRate: rate(started, landed),
      completionRate: rate(completed, started),
      emailRate: rate(emailed, completed),
      seenWithoutPageview: Number(row?.seen_without_pageview ?? 0),
      withoutPageviewEmailed: Number(row?.without_pageview_emailed ?? 0),
      withoutPageviewCompleted: Number(row?.without_pageview_completed ?? 0),
    },
    computedAt,
  };
}

/** A fraction, or null when the denominator is zero — never a silent 0%. */
function rate(numerator: number, denominator: number): number | null {
  return denominator > 0 ? numerator / denominator : null;
}

/**
 * Parse a timestamp that may arrive in either of the two shapes this file sees.
 *
 * ClickHouse hands back `2026-08-09 06:37:06.169970`; PostHog's own response
 * metadata hands back `2026-08-09T07:18:32.710240Z`. Both are UTC and only one
 * of them says so, so the space-separated form is normalised before `Date.parse`
 * is allowed to guess — otherwise every warehouse timestamp is read in the
 * server's local zone and the staleness figure is wrong by the offset.
 */
function parseUtc(value: string | null): number | null {
  if (!value) return null;
  const ms = Date.parse(value.includes("T") ? value : `${value.replace(" ", "T")}Z`);
  return Number.isFinite(ms) ? ms : null;
}


interface RawChannelRow {
  channel: string;
  paid: number;
  landed: number;
  started: number;
  completed: number;
  emailed: number;
  last_activity: string;
}

/**
 * One row per channel PER SIDE, which is the entire point.
 *
 * Reddit runs paid and organic at the same time and the two behave nothing
 * alike — 12.5% and 27.3% against each other in the current window. A blended
 * Reddit row reads 13.4%, which describes neither of them, and it has already
 * been shown to the owner once and drawn the wrong conclusion. So `paid` is a
 * grouping key, not a filter, and a channel that runs both appears twice.
 */
async function fetchChannels(
  range: ResolvedRange,
  filtered: boolean,
  nowMs: number,
): Promise<GrowthChannelRow[]> {
  const rows = await hogql<RawChannelRow>(
    `SELECT
       ${channelExpr(PERSON_LADDER)} AS channel,
       ${PAID} AS paid,
       count() AS landed,
       sum(${col("started")}) AS started,
       sum(${col("completed")}) AS completed,
       sum(${col("emailed")}) AS emailed,
       toString(max(${col("last_seen")})) AS last_activity
     FROM (${arrivedSubquery()}) AS ${ARRIVED}
     WHERE ${POPULATION}
     GROUP BY channel, paid
     ORDER BY landed DESC, channel
     LIMIT 80`,
    scopeFor(range, filtered),
  );

  const mapped: GrowthChannelRow[] = rows.map((row) => {
    const landed = Number(row.landed);
    const started = Number(row.started);
    const completed = Number(row.completed);
    const emailed = Number(row.emailed);
    /*
      Normalised to ISO here, not in the browser.

      ClickHouse answers `2026-08-09 07:15:41.831000` — UTC, but with nothing
      in the string that says so, which `new Date()` reads as LOCAL time. Left
      alone, "last activity" would be wrong by the reader's UTC offset, and
      wrong in the direction that makes a live channel look quiet.
    */
    const lastActivityMs = parseUtc(String(row.last_activity ?? ""));
    return {
      channel: String(row.channel),
      paid: Number(row.paid) === 1,
      landed,
      started,
      completed,
      emailed,
      startRate: rate(started, landed),
      signupRate: rate(emailed, landed),
      lastActivity: lastActivityMs === null ? "" : new Date(lastActivityMs).toISOString(),
      lastActivityAgeSeconds:
        lastActivityMs === null ? null : Math.max(0, Math.round((nowMs - lastActivityMs) / 1000)),
    };
  });

  /*
    Sorted so a channel's two sides sit next to each other.

    Ordering the whole table by size would put "Reddit paid" at row two and
    "Reddit organic" at row six, and the comparison the owner actually makes —
    this channel bought versus this channel earned — would be a scroll apart.
    Channels are ranked by their combined size, and paid leads within a channel.
  */
  const channelSize = new Map<string, number>();
  for (const row of mapped) {
    channelSize.set(row.channel, (channelSize.get(row.channel) ?? 0) + row.landed);
  }
  return mapped.sort((a, b) => {
    if (a.channel !== b.channel) {
      const size = (channelSize.get(b.channel) ?? 0) - (channelSize.get(a.channel) ?? 0);
      return size || a.channel.localeCompare(b.channel);
    }
    return Number(b.paid) - Number(a.paid);
  });
}

/**
 * Paid against organic, summed from the channel rows rather than asked for
 * again.
 *
 * Every person lands in exactly one (channel, side) bucket, so the two sides
 * add up to the funnel's `landed` by construction. Running a second GROUP BY
 * over the same scan could only introduce a way for the summary and the table
 * to disagree.
 */
function summariseSides(rows: GrowthChannelRow[]): GrowthSideTotals[] {
  const sides: GrowthSideTotals[] = (["paid", "organic"] as const).map((side) => {
    const mine = rows.filter((r) => (r.paid ? "paid" : "organic") === side);
    const landed = mine.reduce((acc, r) => acc + r.landed, 0);
    const started = mine.reduce((acc, r) => acc + r.started, 0);
    const completed = mine.reduce((acc, r) => acc + r.completed, 0);
    const emailed = mine.reduce((acc, r) => acc + r.emailed, 0);
    return {
      side,
      landed,
      started,
      completed,
      emailed,
      signupRate: rate(emailed, landed),
      shareOfTraffic: null,
      channels: mine.length,
    };
  });

  const total = sides.reduce((acc, s) => acc + s.landed, 0);
  return sides.map((s) => ({ ...s, shareOfTraffic: rate(s.landed, total) }));
}

/* --------------------------------------------------------------------------
 * The warehouse half
 * ------------------------------------------------------------------------ */

/**
 * The window predicate for `test_results`.
 *
 * `completed_at` is a String on the warehouse table, so it is parsed rather
 * than compared, and the window cannot be delegated to PostHog's `dateRange`.
 * Identical to the predicate in test-results.ts on purpose — the Completions
 * tab and this panel must never disagree about which completions are in scope.
 */
function inWindow(range: ResolvedRange): string {
  return `notEmpty(toString(completed_at))
      AND parseDateTimeBestEffort(toString(completed_at)) >= ${dt(range.from)}
      AND parseDateTimeBestEffort(toString(completed_at)) < ${dt(range.to)}`;
}

interface RawEmails {
  rows_total: number;
  rows_with_email: number;
  addresses: number;
  adult: number;
  child: number;
}

/**
 * The real email count: distinct ADDRESSES, not rows.
 *
 * Somebody who takes the test twice writes two rows carrying one address, and
 * somebody who takes the adult test and then their child's writes two rows in
 * two audiences carrying one address. Counting rows overstates the list; that
 * is the whole reason "the real count" was asked for.
 *
 * `adult` and `child` are each distinct within their audience, so they add up
 * to MORE than `addresses` when a household did both. `both` names that
 * overlap rather than leaving it as an arithmetic surprise.
 *
 * No exclusion logic, deliberately: the export that fills this table is
 * pre-filtered at source. See the header of test-results.ts.
 *
 * `rows_total` is a count of FINISHED TESTS, which is why it is carried as
 * `finishedTests` and not as `completions`. One row here is one finished test,
 * never one person and never one row of Aurora `test_results` — see the note
 * on the two counting units at the top of this file.
 */
async function fetchEmails(range: ResolvedRange): Promise<GrowthEmails> {
  const has = `notEmpty(trim(coalesce(toString(email), '')))`;
  const address = `lower(trim(toString(email)))`;
  const rows = await hogql<RawEmails>(`
    SELECT
      count() AS rows_total,
      countIf(${has}) AS rows_with_email,
      uniqExactIf(${address}, ${has}) AS addresses,
      uniqExactIf(${address}, ${has} AND toString(test_type) = 'adult') AS adult,
      uniqExactIf(${address}, ${has} AND toString(test_type) = 'child') AS child
    FROM test_results
    WHERE ${inWindow(range)}`);

  const row = rows[0];
  const addresses = Number(row?.addresses ?? 0);
  const adult = Number(row?.adult ?? 0);
  const child = Number(row?.child ?? 0);
  return {
    finishedTests: Number(row?.rows_total ?? 0),
    rowsWithEmail: Number(row?.rows_with_email ?? 0),
    addresses,
    adult,
    child,
    // Inclusion-exclusion: anyone counted in both audiences was counted twice.
    both: Math.max(0, adult + child - addresses),
  };
}

/* --------------------------------------------------------------------------
 * Freshness
 *
 * ===========================================================================
 * WHY THE MIRROR'S SYNC TIME AND NOT THE NEWEST ROW IN IT
 * ===========================================================================
 * The obvious freshness signal for `test_results` is `max(completed_at)`. It is
 * the wrong one, and wrong in the direction that matters: it stops advancing
 * both when the mirror dies AND when nobody happens to finish a test for an
 * hour. A quiet Sunday morning would be indistinguishable from a frozen
 * pipeline, and the dashboard would cry stale at the reader until they learned
 * to ignore it.
 *
 * `system.data_warehouse_tables.updated_at` is the moment PostHog last rebuilt
 * the table. The mirror drops and recreates it on every run, so that timestamp
 * advances on every successful sync whether or not any row changed, and stops
 * dead the moment the sync stops. That is a true liveness signal.
 *
 * It is read with `force_blocking` because PostHog served it from its own
 * result cache with a six-hour target age, and a cached "last refreshed at" is
 * the precise failure this whole panel exists to prevent.
 * ------------------------------------------------------------------------ */

/**
 * How old the hourly mirror may be before it is called stale.
 *
 * The Lambda runs hourly, so an hour of lag is the healthy steady state and
 * flagging it would be noise. Ninety minutes means a scheduled run has been
 * missed outright, which is the thing worth saying out loud.
 */
const WAREHOUSE_STALE_AFTER_MS = 90 * 60 * 1000;

/**
 * How old a PostHog answer may be before it is called stale.
 *
 * Events are queryable within seconds and the window is re-cut every thirty
 * seconds, so anything beyond a few minutes means the answer came out of a
 * cache that outlived its usefulness rather than off the event stream.
 */
const POSTHOG_STALE_AFTER_MS = 15 * 60 * 1000;

function freshness(
  source: SourceFreshness["source"],
  at: string | null,
  staleAfterMs: number,
  nowMs: number,
  labels: { live: string; stale: string; unknown: string },
): SourceFreshness {
  const parsed = parseUtc(at);
  if (parsed === null) {
    // Unknown counts as stale. The one thing this panel may never do is imply
    // a number is current because it could not find out whether it was.
    return { source, at: null, ageSeconds: null, stale: true, note: labels.unknown };
  }
  const ageMs = Math.max(0, nowMs - parsed);
  const stale = ageMs > staleAfterMs;
  return {
    source,
    at: new Date(parsed).toISOString(),
    ageSeconds: Math.round(ageMs / 1000),
    stale,
    note: stale ? labels.stale : labels.live,
  };
}

interface RawSync {
  name: string;
  synced_at: string;
}

/** When PostHog last rebuilt each warehouse table. Never served from cache. */
async function fetchWarehouseSync(): Promise<Map<string, string>> {
  const { rows } = await hogqlWithMeta<RawSync>(
    `SELECT toString(name) AS name, toString(updated_at) AS synced_at
     FROM system.data_warehouse_tables
     WHERE deleted = 0 AND name IN ('test_results', 'email_signups')`,
    undefined,
    { refresh: "force_blocking" },
  );
  return new Map(rows.map((row) => [String(row.name), String(row.synced_at)]));
}

/* --------------------------------------------------------------------------
 * Assembly
 * ------------------------------------------------------------------------ */

export interface GrowthPayload {
  funnel: GrowthFunnel;
  channels: GrowthChannelRow[];
  sides: GrowthSideTotals[];
  emails: GrowthEmails | null;
  /** Set when the warehouse half failed while the PostHog half succeeded. */
  warehouseError: string | null;
  freshness: { posthog: SourceFreshness; warehouse: SourceFreshness };
}

export async function fetchGrowth(
  range: ResolvedRange,
  filtered: boolean,
  nowMs: number = Date.now(),
): Promise<GrowthPayload> {
  /*
    The two halves settle independently.

    Aurora is in a cost lockdown as this is written, which freezes the hourly
    mirror behind `test_results`. Frozen still answers — it just answers with
    old rows, which is what the freshness stamp is for. But if the source is
    ever removed rather than merely stopped, these queries fail outright, and a
    failed email count must not take the funnel and the channel table down with
    it. Those are the two things the owner reads every time, and they come from
    PostHog, which is up.
  */
  const [funnelPart, channels, warehouse] = await Promise.all([
    fetchFunnel(range, filtered),
    fetchChannels(range, filtered, nowMs),
    settleWarehouse(range),
  ]);

  return {
    funnel: funnelPart.funnel,
    channels,
    sides: summariseSides(channels),
    emails: warehouse.emails,
    warehouseError: warehouse.error,
    freshness: {
      posthog: freshness("posthog", funnelPart.computedAt, POSTHOG_STALE_AFTER_MS, nowMs, {
        live: "Live from PostHog. Events are queryable within seconds of happening.",
        stale:
          "This came out of PostHog's result cache rather than the event stream. Reload before acting on it.",
        unknown: "PostHog did not report when it calculated these. Treat them as of unknown age.",
      }),
      warehouse: freshness(
        "warehouse",
        warehouse.syncedAt,
        WAREHOUSE_STALE_AFTER_MS,
        nowMs,
        {
          live: "The hourly mirror of the product database is running normally.",
          stale:
            "The hourly mirror has missed a run, so completions and addresses are behind the visitor numbers above. Nothing below this line is current.",
          unknown:
            "Could not establish when the mirror last ran, so nothing below this line can be called current.",
        },
      ),
    },
  };
}

async function settleWarehouse(range: ResolvedRange): Promise<{
  emails: GrowthEmails | null;
  syncedAt: string | null;
  error: string | null;
}> {
  try {
    const [emails, sync] = await Promise.all([fetchEmails(range), fetchWarehouseSync()]);
    return { emails, syncedAt: sync.get("test_results") ?? null, error: null };
  } catch (error) {
    return {
      emails: null,
      syncedAt: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
