import "server-only";

import { channelExpr, type LadderColumns } from "./attribution";
import {
  ANSWERED_SHARE,
  EVENT_COLUMNS,
  OUTAGE_FROM,
  OUTAGE_TO,
  WAREHOUSE_COLUMNS,
  abandonedExpr,
  eventInOutageExpr,
  finishedExpr,
  inOutageExpr,
  rangeHitsOutage,
  sparseExpr,
} from "./completion-rule";
import { hogql, hogqlWithMeta, sqlString, type QueryScope } from "./posthog-query";
import type { ResolvedRange } from "./time-range";
import type {
  AudienceChannelSlice,
  CompletionSplit,
  GrowthAudiences,
  GrowthAudienceSplit,
  GrowthChannelRow,
  GrowthEmails,
  GrowthFunnel,
  GrowthSideTotals,
  MirrorBacklog,
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

/** The rule, against `test_completed` properties. Named once, used three times. */
const FINISHED_EVENT = finishedExpr(EVENT_COLUMNS);

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
      maxIf(1, event = 'test_completed' AND toString(properties.audience) = 'adult') AS took_adult,
      maxIf(1, event = 'test_completed' AND toString(properties.audience) = 'child') AS took_child,

      -- The completion stage, split. One attempt is enough: somebody who
      -- abandoned at lunchtime and finished properly in the evening finished.
      maxIf(1, event = 'test_completed' AND ${FINISHED_EVENT}) AS finished,
      maxIf(1, event = 'test_completed' AND ${FINISHED_EVENT}
            AND toString(properties.audience) = 'adult') AS finished_adult,
      maxIf(1, event = 'test_completed' AND ${FINISHED_EVENT}
            AND toString(properties.audience) = 'child') AS finished_child,

      -- Typed in an address while the sends were failing. Paired with the
      -- emailed flag above, this recovers a conversion the outage swallowed.
      maxIf(1, event = 'test_email_submitted' AND ${eventInOutageExpr()}) AS outage_submit,

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
  finished: number;
  finished_emailed: number;
  finished_emailed_corrected: number;
  outage_lost: number;
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
       countIf(NOT (${POPULATION}) AND ${col("completed")} = 1) AS without_pageview_completed,
       countIf(${POPULATION} AND ${col("finished")} = 1) AS finished,
       countIf(${POPULATION} AND ${col("finished")} = 1 AND ${col("emailed")} = 1) AS finished_emailed,
       countIf(${POPULATION} AND ${col("finished")} = 1
               AND (${col("emailed")} = 1 OR ${col("outage_submit")} = 1)) AS finished_emailed_corrected,
       countIf(${POPULATION} AND ${col("emailed")} = 0
               AND ${col("outage_submit")} = 1) AS outage_lost
     FROM (${arrivedSubquery()}) AS ${ARRIVED}`,
    scopeFor(range, filtered),
  );

  const row = rows[0];
  const landed = Number(row?.landed ?? 0);
  const started = Number(row?.started ?? 0);
  const completed = Number(row?.completed ?? 0);
  const emailed = Number(row?.emailed ?? 0);
  const finished = Number(row?.finished ?? 0);
  const finishedEmailed = Number(row?.finished_emailed ?? 0);
  const finishedEmailedCorrected = Number(row?.finished_emailed_corrected ?? 0);

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
      finished,
      // Subtracted rather than counted separately: the two must add to
      // `completed` on the page, and a second countIf could drift from it.
      abandonedOnly: Math.max(0, completed - finished),
      finishedEmailed,
      finishedEmailedCorrected,
      finishedEmailRate: rate(finishedEmailed, finished),
      finishedEmailRateCorrected: rate(finishedEmailedCorrected, finished),
      outageLostConversions: Number(row?.outage_lost ?? 0),
      answeredShare: ANSWERED_SHARE,
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
  emailed_adult: number;
  emailed_child: number;
  emailed_both: number;
  emailed_unknown: number;
  finished: number;
  finished_adult: number;
  finished_child: number;
  finished_both: number;
  finished_unknown: number;
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
 *
 * ===========================================================================
 * THE ADULT/CHILD SPLIT COMES OFF THE EVENTS, NOT OFF THE MIRROR
 * ===========================================================================
 * The obvious source for "which test did they sit" is `test_results`, since
 * that is where the Email addresses panel below gets its adult and child
 * figures. It cannot answer this question, and the reason is worth writing
 * down so nobody spends the afternoon rediscovering it.
 *
 * The mirror does carry an audience per row, but its acquisition channel is
 * enriched by the export Lambda's `_channel()`, which recognises exactly two
 * values. Measured on the live table on 9 August, all 666 rows:
 *
 *   platform = reddit       150
 *   platform = instagram      9
 *   platform = NULL         507   (76%)
 *
 * Its `referrer_domain` is thinner still — null on 591 of the 666. A channel
 * table built on either column could say nothing at all about TikTok, Google
 * Search, the results-email link or direct traffic, and would file three
 * quarters of the audience under "unknown". That is not a split, it is a
 * rounding error with a column heading.
 *
 * PostHog can answer it directly. `test_completed` carries `audience` as a
 * first-class property on every single event — verified over 90 days: 685
 * events, 347 adult, 338 child, ZERO missing. So the audience is read off the
 * same person rows the rest of this table is built from, which means the split
 * inherits the channel ladder, the population and the counting unit for free
 * and cannot drift from the `emailed` column it decomposes.
 *
 * It also keeps the panel honest about time. The channel table carries the
 * PostHog stamp and is current within seconds; the mirror carries its own and
 * is an hour behind at best. Sourcing two columns of one table from two clocks
 * is exactly the "one shared as-of" the panel refuses to print — and it would
 * be worse here than elsewhere, because the two columns would sit inside the
 * same row as the figure they decompose.
 *
 * ===========================================================================
 * FOUR NUMBERS, BECAUSE THREE WOULD NOT ADD UP
 * ===========================================================================
 * `emailed_adult` and `emailed_child` are each counted within their own
 * audience, so a person who sat both is in both — the same overlap the
 * addresses panel already reports for households. And an emailed person with
 * no `test_completed` in the window belongs to neither.
 *
 * Both residuals are counted and returned rather than absorbed:
 *
 *   emailed = adult + child − both + unknown
 *
 * Measured over 90 days at the time of writing: 337 emailed people, 200 adult,
 * 123 child, 15 both, 29 unresolved — and the identity holds exactly. The
 * unresolved 29 are NOT dropped and NOT shared out across the channels that do
 * resolve; they are carried as their own number so the panel can show them.
 * Reallocating people quietly is a thing that has cost this project twice.
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
       countIf(${col("emailed")} = 1 AND ${col("took_adult")} = 1) AS emailed_adult,
       countIf(${col("emailed")} = 1 AND ${col("took_child")} = 1) AS emailed_child,
       countIf(${col("emailed")} = 1 AND ${col("took_adult")} = 1 AND ${col("took_child")} = 1) AS emailed_both,
       countIf(${col("emailed")} = 1 AND ${col("took_adult")} = 0 AND ${col("took_child")} = 0) AS emailed_unknown,
       sum(${col("finished")}) AS finished,
       countIf(${col("emailed")} = 1 AND ${col("finished_adult")} = 1) AS finished_adult,
       countIf(${col("emailed")} = 1 AND ${col("finished_child")} = 1) AS finished_child,
       countIf(${col("emailed")} = 1 AND ${col("finished_adult")} = 1 AND ${col("finished_child")} = 1) AS finished_both,
       countIf(${col("emailed")} = 1 AND ${col("finished_adult")} = 0 AND ${col("finished_child")} = 0) AS finished_unknown,
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
    const finished = Number(row.finished);
    return {
      channel: String(row.channel),
      paid: Number(row.paid) === 1,
      landed,
      started,
      completed,
      emailed,
      emailedAdult: Number(row.emailed_adult),
      emailedChild: Number(row.emailed_child),
      emailedBoth: Number(row.emailed_both),
      emailedAudienceUnknown: Number(row.emailed_unknown),
      finished,
      abandonedOnly: Math.max(0, completed - finished),
      finishedAdult: Number(row.finished_adult),
      finishedChild: Number(row.finished_child),
      finishedBoth: Number(row.finished_both),
      finishedAudienceUnknown: Number(row.finished_unknown),
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
    const finished = mine.reduce((acc, r) => acc + r.finished, 0);
    return {
      side,
      landed,
      started,
      completed,
      finished,
      abandonedOnly: mine.reduce((acc, r) => acc + r.abandonedOnly, 0),
      emailed,
      signupRate: rate(emailed, landed),
      shareOfTraffic: null,
      channels: mine.length,
    };
  });

  const total = sides.reduce((acc, s) => acc + s.landed, 0);
  return sides.map((s) => ({ ...s, shareOfTraffic: rate(s.landed, total) }));
}

/**
 * How much of an audience a channel must hold to be named rather than pooled.
 *
 * Under this it goes into the tail. Not a rounding-away: the pooled row keeps
 * its count and says how many channels it covers, so the column still adds up
 * to the audience total. It exists because eight of the fifteen rows in the
 * table above contribute nobody at all, and printing those twice more would
 * bury the one comparison this panel is built to make.
 *
 * Tested on EITHER audience, not on the combined total. A channel that is
 * invisible overall but supplies a tenth of the children is exactly the row
 * worth naming, and a combined test would pool it.
 */
const NAMED_AUDIENCE_SHARE = 0.03;

/**
 * The channel table read the other way round: two audiences, each by channel.
 *
 * Summed from the channel rows rather than asked for again, for the same
 * reason `summariseSides` is — a second query over the same scan could only
 * introduce a way for this panel and the table above it to disagree. Every
 * number here is one of the numbers already on the page, regrouped.
 *
 * PAID AND ORGANIC ARE COMBINED HERE, WHICH WOULD BE WRONG ONE PANEL UP. The
 * table splits them because a blended CONVERSION RATE describes neither side —
 * Reddit's 12.5% bought against 27.3% earned averages to a number that is true
 * of nobody. This panel counts PEOPLE, and 117 adults from Reddit is just how
 * many adults came from Reddit however they arrived. Sums do not lie the way
 * ratios do, and splitting every channel in two here would double the rows to
 * preserve a distinction the question does not ask about.
 */
function summariseAudiences(
  rows: GrowthChannelRow[],
  basis: AudienceBasis = "any",
): GrowthAudiences {
  const pick = AUDIENCE_COLUMNS[basis];
  const byChannel = new Map<string, { adult: number; child: number }>();
  for (const row of rows) {
    const acc = byChannel.get(row.channel) ?? { adult: 0, child: 0 };
    acc.adult += row[pick.adult];
    acc.child += row[pick.child];
    byChannel.set(row.channel, acc);
  }

  const adultTotal = rows.reduce((acc, row) => acc + row[pick.adult], 0);
  const childTotal = rows.reduce((acc, row) => acc + row[pick.child], 0);

  const reaches = (count: number, total: number): boolean =>
    total > 0 && count / total >= NAMED_AUDIENCE_SHARE;

  /*
    One ordering, shared by both columns, ranked on the two audiences together.

    Ranking each column by its own size would sort Reddit to the top on the
    left and to the bottom on the right, and the reader would have to match
    labels across the gap to see that they are the same channel. Holding the
    order still is what turns the inversion into something you see rather than
    something you work out.
  */
  const named = [...byChannel.entries()]
    .filter(([, v]) => reaches(v.adult, adultTotal) || reaches(v.child, childTotal))
    .sort((a, b) => {
      const size = b[1].adult + b[1].child - (a[1].adult + a[1].child);
      return size || a[0].localeCompare(b[0]);
    })
    .map(([channel]) => channel);

  const namedSet = new Set(named);
  const pooledChannels = [...byChannel.entries()].filter(
    ([channel, v]) => !namedSet.has(channel) && v.adult + v.child > 0,
  );

  const split = (audience: "adult" | "child", total: number): GrowthAudienceSplit => {
    const slices: AudienceChannelSlice[] = named.map((channel) => {
      const people = byChannel.get(channel)?.[audience] ?? 0;
      return {
        channel,
        people,
        share: rate(people, total),
        pooled: false,
        channels: 1,
      };
    });
    const pooledPeople = pooledChannels.reduce((acc, [, v]) => acc + v[audience], 0);
    if (pooledChannels.length > 0) {
      slices.push({
        channel: "Other channels",
        people: pooledPeople,
        share: rate(pooledPeople, total),
        pooled: true,
        channels: pooledChannels.length,
      });
    }
    return { audience, people: total, slices };
  };

  return {
    adult: split("adult", adultTotal),
    child: split("child", childTotal),
    both: rows.reduce((acc, row) => acc + row[pick.both], 0),
    neither: rows.reduce((acc, row) => acc + row[pick.unknown], 0),
    emailed: rows.reduce((acc, row) => acc + row.emailed, 0),
  };
}

/**
 * Which decomposition of `emailed` the audience panel is reading.
 *
 * "any" counts somebody by whatever test they completed, abandonments
 * included — the original question, and still a true one. "finished" counts
 * them only by a test they genuinely finished, so the 44 people who left the
 * test and gave an address anyway fall into `neither` instead of being
 * attributed to an audience they did not really sit.
 *
 * Both are produced and both are carried. The panel is not being told which
 * question to ask; it is being given the means to ask either without a second
 * scan, and to show that the two differ.
 */
type AudienceBasis = "any" | "finished";

/** The counting fields of a channel row, so a lookup cannot land on a string. */
type NumericChannelKey = {
  [K in keyof GrowthChannelRow]: GrowthChannelRow[K] extends number ? K : never;
}[keyof GrowthChannelRow];

const AUDIENCE_COLUMNS: Record<
  AudienceBasis,
  { adult: NumericChannelKey; child: NumericChannelKey; both: NumericChannelKey; unknown: NumericChannelKey }
> = {
  any: {
    adult: "emailedAdult",
    child: "emailedChild",
    both: "emailedBoth",
    unknown: "emailedAudienceUnknown",
  },
  finished: {
    adult: "finishedAdult",
    child: "finishedChild",
    both: "finishedBoth",
    unknown: "finishedAudienceUnknown",
  },
};

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
  /*
    Prefixed because the bare names would SHADOW the columns they are computed
    from. HogQL resolves a later select item against an earlier OUTPUT alias,
    so `countIf(timed_out AND ...)` after `countIf(...) AS timed_out` reads the
    aggregate and fails with "aggregate function is found inside another
    aggregate function" — which names neither the column nor the shadowing.
    The same trap the `col()` helper at the top of this file exists to avoid.
  */
  rule_timed_out: number;
  rule_sparse: number;
  both_signals: number;
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
  const finished = finishedExpr(WAREHOUSE_COLUMNS);
  const abandoned = abandonedExpr(WAREHOUSE_COLUMNS);
  const outage = inOutageExpr();
  /*
    Everything in one scan.

    The split, the outage-corrected split and the two component measures are
    all conditional aggregates over the same rows, so asking for them together
    costs one query and — the part that matters — makes it impossible for the
    corrected figure and the raw one to be computed off different row sets.
  */
  const rows = await hogql<RawEmails>(`
    SELECT
      count() AS rows_total,
      countIf(${has}) AS rows_with_email,
      uniqExactIf(${address}, ${has}) AS addresses,
      uniqExactIf(${address}, ${has} AND toString(test_type) = 'adult') AS adult,
      uniqExactIf(${address}, ${has} AND toString(test_type) = 'child') AS child,

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
      countIf(${sparseExpr(WAREHOUSE_COLUMNS)}) AS rule_sparse,
      countIf(${WAREHOUSE_COLUMNS.timedOut} AND ${sparseExpr(WAREHOUSE_COLUMNS)}) AS both_signals
    FROM test_results
    WHERE ${inWindow(range)}`);

  const row = rows[0];
  const addresses = Number(row?.addresses ?? 0);
  const adult = Number(row?.adult ?? 0);
  const child = Number(row?.child ?? 0);
  const timedOut = Number(row?.rule_timed_out ?? 0);
  const sparse = Number(row?.rule_sparse ?? 0);
  const bothSignals = Number(row?.both_signals ?? 0);

  return {
    finishedTests: Number(row?.rows_total ?? 0),
    rowsWithEmail: Number(row?.rows_with_email ?? 0),
    addresses,
    adult,
    child,
    // Inclusion-exclusion: anyone counted in both audiences was counted twice.
    both: Math.max(0, adult + child - addresses),
    accounting: {
      rule: {
        answeredShare: ANSWERED_SHARE,
        timedOut,
        sparse,
        both: bothSignals,
        timedOutOnly: Math.max(0, timedOut - bothSignals),
        sparseOnly: Math.max(0, sparse - bothSignals),
      },
      all: split(
        Number(row?.finished ?? 0),
        Number(row?.abandoned ?? 0),
        Number(row?.finished_email ?? 0),
        Number(row?.abandoned_email ?? 0),
      ),
      corrected: split(
        Number(row?.out_finished ?? 0),
        Number(row?.out_abandoned ?? 0),
        Number(row?.out_finished_email ?? 0),
        Number(row?.out_abandoned_email ?? 0),
      ),
      outage: {
        from: OUTAGE_FROM,
        to: OUTAGE_TO,
        overlaps: rangeHitsOutage(range),
        finished: Number(row?.outage_finished ?? 0),
        finishedWithEmail: Number(row?.outage_finished_email ?? 0),
      },
    },
  };
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
    finishedEmailRate: rate(finishedWithEmail, finished),
    abandonedEmailRate: rate(abandonedWithEmail, abandoned),
  };
}

/* --------------------------------------------------------------------------
 * Freshness
 *
 * ===========================================================================
 * THE MIRROR'S TIMESTAMP IS NOT A LIVENESS SIGNAL, AND READING IT AS ONE COST
 * AN EVENING
 * ===========================================================================
 * An earlier version of this comment claimed that "the mirror drops and
 * recreates the table on every run, so that timestamp advances on every
 * successful sync". That is false, and the code it justified reported a
 * healthy pipeline as dead.
 *
 * `sffs-test-results-dw-export` builds the snapshot, hashes it, and compares
 * the digest against the marker it wrote last time. If they match it SKIPS the
 * upload entirely and returns `{"status": "unchanged"}` — no delete, no create,
 * so `system.data_warehouse_tables.updated_at` does not move. That timestamp
 * is the moment the CONTENT last changed, not the moment the export last ran,
 * and the two only coincide on a busy hour.
 *
 * On 10 August the runs at 17:37, 18:37 and 19:36 UTC all succeeded and all
 * correctly skipped: Aurora had taken two more child attempts, both with
 * `answered = 0`, which the export drops by design. The snapshot was
 * byte-identical three times over, the stamp sat at 16:37 going redder, two
 * agents read it as a stopped export, and the owner was told his pipeline had
 * failed. It had not.
 *
 * ===========================================================================
 * WHAT THE DASHBOARD CAN ACTUALLY REACH
 * ===========================================================================
 * The truest signal is the exporter's last successful invocation. It is not
 * reachable from here and pretending otherwise would be the same mistake in a
 * new coat: the Lambda's run history lives in CloudWatch, this app holds no AWS
 * credentials and ships no AWS client, and `POSTHOG_PERSONAL_API_KEY` is scoped
 * to `query:read` on one project. Everything below is built from the two things
 * that ARE reachable, and the stamp claims nothing beyond them.
 *
 *   THE MIRROR ITSELF     `updated_at` (when its content last changed) and
 *                         `max(completed_at)` (the newest completion it
 *                         carries — its high-water mark).
 *   POSTHOG'S EVENTS      `test_completed`, live within seconds, fired by the
 *                         same interaction that writes the Aurora row.
 *
 * ===========================================================================
 * THE SEPARATOR: A SECOND, INDEPENDENT WITNESS
 * ===========================================================================
 * Neither timestamp alone can tell a quiet hour from a dead exporter, because
 * both are silent in both cases. What distinguishes them is whether there was
 * anything to do. So the verdict is a COMPARISON rather than an age:
 *
 *   content changed inside the cadence            -> current
 *   nothing outstanding, or nothing due yet       -> idle
 *   outstanding work has missed a scheduled run   -> stalled
 *   the age itself is unreadable                  -> unknown, and stale
 *
 * This is what makes the fix survive the case the indicator exists for. A
 * genuinely broken exporter goes red the moment somebody finishes a test and
 * the mirror does not carry it across a run — the alarm is not weakened, it is
 * given a reason. And a broken exporter with no traffic behind it holds
 * `idle`, which is the correct reading: there is nothing missing from the
 * figures, and the note says only that, never that the export is healthy.
 *
 * THE WITNESS APPLIES THE ONE EXPORT FILTER IT CAN. `answered > 0` is not
 * decoration — it is exactly what made both of 10 August's events non-events,
 * and a witness without it would have manufactured a fresh false alarm out of
 * the same evening. The rest of the export's filters key on markers written
 * onto the Aurora row (`synthetic`, `internal`) which no event carries, so the
 * closest reachable equivalent is PostHog's own test-account filters via
 * `{filters}`. They are not the same rule set, so the panel reports what was
 * measured — completions PostHog recorded that the mirror does not carry —
 * rather than asserting what the exporter owes.
 *
 * EVERY QUERY THE VERDICT RESTS ON REFUSES THE CACHE. PostHog served the
 * freshness statement from its own result cache with a six-hour target age. A
 * cached "last refreshed at" is the precise failure this panel exists to
 * prevent, and a cached witness would be worse: it would hide new completions
 * and turn a real stall back into a quiet evening.
 * ------------------------------------------------------------------------ */

/**
 * How old the hourly mirror's content may be before the witness is consulted —
 * and, past it, how long an outstanding completion must have waited before it
 * counts as a missed run.
 *
 * The Lambda runs hourly, so an hour of lag is the healthy steady state and
 * flagging it would be noise. Ninety minutes means a scheduled run has come and
 * gone without collecting something it should have, which is the thing worth
 * saying out loud.
 *
 * One constant for both because they are one question asked twice: has a
 * scheduled run had its chance? Two constants would let the panel call the
 * content stale while still calling the work not yet due, and print a
 * contradiction.
 */
const WAREHOUSE_STALE_AFTER_MS = 90 * 60 * 1000;

/**
 * How far back the witness looks for qualifying completions.
 *
 * It only has to comfortably outrun any plausible mirror lag, and the volume
 * is tiny — under ten completions on a busy day. A mirror further behind than
 * this still reads as stalled, because every event in the window is then newer
 * than its high-water mark and the oldest of them is already a fortnight past
 * the threshold; only the `outstanding` count would understate, and it would
 * understate a table nobody is about to trust anyway.
 */
const WITNESS_LOOKBACK_MS = 14 * 24 * 60 * 60 * 1000;

/**
 * Slack when matching an Aurora completion time against a PostHog event time.
 *
 * They are written by different clocks on the same interaction and land within
 * a second or two — the export's own matcher allows five seconds. The mirror
 * additionally truncates to the second, so tonight's pair reads 16:17:53.000
 * against 16:17:53.470. A minute is far more than the skew and far less than
 * the ninety it would take to matter to the verdict.
 */
const WITNESS_CLOCK_SLACK_MS = 60 * 1000;

/**
 * How old a PostHog answer may be before it is called stale.
 *
 * Events are queryable within seconds and the window is re-cut every thirty
 * seconds, so anything beyond a few minutes means the answer came out of a
 * cache that outlived its usefulness rather than off the event stream.
 */
const POSTHOG_STALE_AFTER_MS = 15 * 60 * 1000;

/**
 * The PostHog stamp: one source, one age, and no mirror behind it.
 *
 * It needs no witness because its answer carries the moment it was computed.
 * There is no equivalent of "the content did not change" here — PostHog
 * recalculates or it does not.
 */
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
    return {
      source,
      at: null,
      ageSeconds: null,
      stale: true,
      state: "unknown",
      note: labels.unknown,
      backlog: null,
    };
  }
  const ageMs = Math.max(0, nowMs - parsed);
  const stale = ageMs > staleAfterMs;
  return {
    source,
    at: new Date(parsed).toISOString(),
    ageSeconds: Math.round(ageMs / 1000),
    stale,
    state: stale ? "stalled" : "current",
    note: stale ? labels.stale : labels.live,
    backlog: null,
  };
}

/**
 * What the mirror is missing, by comparing its high-water mark against
 * PostHog's own record of the same completions.
 *
 * `witnessed` is false whenever either input is missing, and every caller
 * treats that as "cannot tell" rather than as "nothing outstanding". An
 * unreadable witness must never be able to talk the panel out of an alarm.
 */
function mirrorBacklog(
  newestRowAt: string | null,
  witness: string[] | null,
  nowMs: number,
): MirrorBacklog {
  const mark = parseUtc(newestRowAt);
  if (mark === null || witness === null) {
    return {
      newestRowAt: mark === null ? null : new Date(mark).toISOString(),
      outstanding: 0,
      oldestOutstandingAt: null,
      oldestOutstandingAgeSeconds: null,
      witnessed: false,
    };
  }

  /*
    Strictly after the high-water mark, plus a minute of clock slack.

    Without the slack the completion the mirror is BUILT FROM reads as
    outstanding against itself: Aurora truncates `completed_at` to the second
    and PostHog keeps the milliseconds, so the pair that describes one
    interaction is 16:17:53.000 against 16:17:53.470.
  */
  const outstanding = witness
    .map(parseUtc)
    .filter((ms): ms is number => ms !== null && ms > mark + WITNESS_CLOCK_SLACK_MS);

  if (outstanding.length === 0) {
    return {
      newestRowAt: new Date(mark).toISOString(),
      outstanding: 0,
      oldestOutstandingAt: null,
      oldestOutstandingAgeSeconds: null,
      witnessed: true,
    };
  }

  // The OLDEST, not the newest: it is the one that has had the most chances to
  // be collected, so it is the one that decides whether a run was missed.
  const oldest = Math.min(...outstanding);
  return {
    newestRowAt: new Date(mark).toISOString(),
    outstanding: outstanding.length,
    oldestOutstandingAt: new Date(oldest).toISOString(),
    oldestOutstandingAgeSeconds: Math.max(0, Math.round((nowMs - oldest) / 1000)),
    witnessed: true,
  };
}

/**
 * The mirror stamp: an age, and what that age actually means.
 *
 * The four branches are the whole point of the change, so they are written out
 * rather than compressed into a ternary. Each one says what was measured and
 * stops there — none of them claims the exporter is healthy, because nothing
 * reachable from here can establish that.
 */
function warehouseFreshness(
  syncedAt: string | null,
  backlog: MirrorBacklog,
  nowMs: number,
): SourceFreshness {
  const parsed = parseUtc(syncedAt);
  if (parsed === null) {
    return {
      source: "warehouse",
      at: null,
      ageSeconds: null,
      stale: true,
      state: "unknown",
      note: "Could not establish when the mirror last published, so nothing below this line can be called current.",
      backlog,
    };
  }

  const ageMs = Math.max(0, nowMs - parsed);
  const base = {
    source: "warehouse" as const,
    at: new Date(parsed).toISOString(),
    ageSeconds: Math.round(ageMs / 1000),
    backlog,
  };
  const carrying = backlog.newestRowAt
    ? ` The newest completion it carries is ${clock(backlog.newestRowAt)} UTC.`
    : "";

  if (ageMs <= WAREHOUSE_STALE_AFTER_MS) {
    return {
      ...base,
      stale: false,
      state: "current",
      note: `The hourly mirror published new completions inside its cadence.${carrying}`,
    };
  }

  /*
    Past the cadence with no witness. This is the ONLY branch that behaves the
    way the old boolean did, and it is the branch where behaving that way is
    correct: the content is old and we could not find out whether that is
    because nothing happened. Doubt resolves towards the alarm.
  */
  if (!backlog.witnessed) {
    return {
      ...base,
      stale: true,
      state: "stalled",
      note: `The mirror's content has not changed since ${clock(base.at)} UTC, and PostHog could not be asked whether any completion is outstanding — so nothing below this line can be called current.`,
    };
  }

  const waited = backlog.oldestOutstandingAgeSeconds;
  if (backlog.outstanding > 0 && waited !== null && waited * 1000 > WAREHOUSE_STALE_AFTER_MS) {
    const missing =
      backlog.outstanding === 1
        ? `PostHog has recorded a completion the mirror does not carry, from ${ago(waited)} ago`
        : `PostHog has recorded ${backlog.outstanding} completions the mirror does not carry, the oldest ${ago(waited)} ago`;
    return {
      ...base,
      stale: true,
      state: "stalled",
      note: `The mirror is behind. ${missing} — past a scheduled hourly run.${carrying} Completions and addresses below this line are missing ${backlog.outstanding === 1 ? "it" : "them"}.`,
    };
  }

  /*
    Unchanged content, nothing overdue.

    THE NOTE SAYS ONLY WHAT WAS MEASURED. It is tempting to write "the mirror
    is running normally" here, and it would be the same class of lie the old
    stamp told in the other direction — an export that died an hour ago with no
    traffic behind it looks exactly like this. What IS true, and is all the
    reader needs, is that nothing is missing from the figures below.
  */
  const pending =
    backlog.outstanding > 0
      ? ` ${plural(backlog.outstanding, "completion")} ${backlog.outstanding === 1 ? "has" : "have"} been recorded since, not yet due until the next hourly run.`
      : " Nothing has qualified for export since, so there was nothing to publish.";
  return {
    ...base,
    stale: false,
    state: "idle",
    note: `Content unchanged since ${clock(base.at)} UTC — the export skips the upload when the snapshot is identical.${carrying}${pending} Nothing PostHog has seen is missing from the figures below.`,
  };
}

/** "4 completions", "1 completion" — a count that reads as a sentence. */
function plural(n: number, one: string): string {
  return `${n} ${one}${n === 1 ? "" : "s"}`;
}

/** HH:MM off an ISO instant, for a note that already says UTC. */
function clock(iso: string): string {
  return iso.slice(11, 16);
}

/** A compact age: 45s, 12m, 3h, 2d. Matches the panel's own formatting. */
function ago(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

interface RawSync {
  name: string;
  synced_at: string;
}

/** When the mirror's content last changed. Never served from cache. */
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

interface RawHighWater {
  rows_total: number;
  newest: string;
}

/**
 * The newest completion the mirror actually carries.
 *
 * NOT windowed by the reporting range. The question is "how current is the
 * mirror", which is a fact about now — a reader who selects last Tuesday has
 * not moved the pipeline, and a stamp that went green because they narrowed
 * the window would be the original defect wearing a different hat.
 *
 * The row count rides along so an empty table reads as "no high-water mark"
 * rather than as `max()` over nothing, which parses to the epoch and would
 * make every event since 1970 look outstanding.
 */
async function fetchMirrorHighWater(): Promise<string | null> {
  const { rows } = await hogqlWithMeta<RawHighWater>(
    `SELECT
       count() AS rows_total,
       toString(max(parseDateTimeBestEffort(toString(completed_at)))) AS newest
     FROM test_results
     WHERE notEmpty(toString(completed_at))`,
    undefined,
    { refresh: "force_blocking" },
  );
  const row = rows[0];
  if (!row || Number(row.rows_total ?? 0) === 0) return null;
  return row.newest ? String(row.newest) : null;
}

interface RawWitness {
  at: string;
}

/**
 * PostHog's independent record of the completions the mirror exports.
 *
 * ===========================================================================
 * THREE THINGS ABOUT THIS QUERY ARE LOAD-BEARING
 * ===========================================================================
 * `answered > 0` MIRRORS THE EXPORT'S OWN FILTER. Both of 10 August's evening
 * attempts answered nothing, so the export was right to drop them and the
 * snapshot was right to be identical. A witness without this clause would have
 * called those two a missed run and replaced one false alarm with another.
 *
 * IT IS ALWAYS FILTERED, WHATEVER THE RAW TOGGLE SAYS. The toggle is a display
 * choice about who appears in the funnel; it does not change what the export
 * put in the mirror. Letting it through would make an operator inspecting raw
 * traffic see a stall that does not exist.
 *
 * IT IS BOUNDED BY ITS OWN LOOKBACK, NOT BY THE REPORTING RANGE. Same reason
 * `fetchMirrorHighWater` is not windowed: the freshness question is about now.
 * The bound is carried on the scope so it reaches PostHog through `{filters}`
 * alongside the test-account rules, rather than as a second hand-written
 * predicate that could disagree with it.
 */
async function fetchCompletionWitness(nowMs: number): Promise<string[]> {
  const { rows } = await hogqlWithMeta<RawWitness>(
    `SELECT toString(timestamp) AS at
     FROM events
     WHERE {filters}
       AND event = 'test_completed'
       AND ${EVENT_COLUMNS.answered} > 0
     ORDER BY timestamp DESC
     LIMIT 500`,
    {
      from: new Date(nowMs - WITNESS_LOOKBACK_MS).toISOString(),
      // A shade past now, so the second-precision bound cannot clip the very
      // completion that would prove the mirror is behind.
      to: new Date(nowMs + WITNESS_CLOCK_SLACK_MS).toISOString(),
      filtered: true,
    },
    { refresh: "force_blocking" },
  );
  return rows.map((row) => String(row.at));
}

/* --------------------------------------------------------------------------
 * Assembly
 * ------------------------------------------------------------------------ */

export interface GrowthPayload {
  funnel: GrowthFunnel;
  channels: GrowthChannelRow[];
  sides: GrowthSideTotals[];
  audiences: GrowthAudiences;
  /**
   * The same panel counted over people who genuinely FINISHED a test.
   *
   * Carried beside `audiences` rather than replacing it so the panel can show
   * both and name the difference — the people who left the test and gave an
   * address anyway, who have a real audience on the events but did not sit the
   * paper the column would credit them to.
   */
  audiencesFinished: GrowthAudiences;
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

    The hourly mirror behind `test_results` can stop without PostHog stopping —
    it has an AWS cost lockdown behind it in its history, and a paused export
    is a normal operational state rather than an exotic one. A stopped mirror
    still answers: it just answers with old rows, which is what the freshness
    stamp is for. But if the source is ever removed rather than merely stopped,
    these queries fail outright, and a failed email count must not take the
    funnel and the channel table down with it. Those are the two things the
    owner reads every time, and they come from PostHog, which is up.

    Measured 9 August 2026: the mirror is running normally, 42 minutes behind
    inside an hourly cadence. Earlier copies of this comment described it as
    frozen; that was true during the lockdown and stopped being true when
    credentials were restored, which is the hazard of writing an operational
    state into a comment at all. Read the stamp on the panel, not this.
  */
  /*
    The witness settles on its own, beside both halves.

    It is an events query, so it survives a removed warehouse source — which is
    the case where the panel most needs to say something precise. And it fails
    on its own: `settleWitness` answers null rather than throwing, because a
    freshness check that could take down the funnel it annotates would be a
    worse defect than the one it is here to fix.
  */
  const [funnelPart, channels, warehouse, witness] = await Promise.all([
    fetchFunnel(range, filtered),
    fetchChannels(range, filtered, nowMs),
    settleWarehouse(range),
    settleWitness(nowMs),
  ]);

  return {
    funnel: funnelPart.funnel,
    channels,
    sides: summariseSides(channels),
    audiences: summariseAudiences(channels, "any"),
    audiencesFinished: summariseAudiences(channels, "finished"),
    emails: warehouse.emails,
    warehouseError: warehouse.error,
    freshness: {
      posthog: freshness("posthog", funnelPart.computedAt, POSTHOG_STALE_AFTER_MS, nowMs, {
        live: "Live from PostHog. Events are queryable within seconds of happening.",
        stale:
          "This came out of PostHog's result cache rather than the event stream. Reload before acting on it.",
        unknown: "PostHog did not report when it calculated these. Treat them as of unknown age.",
      }),
      warehouse: warehouseFreshness(
        warehouse.syncedAt,
        mirrorBacklog(warehouse.newestRowAt, witness, nowMs),
        nowMs,
      ),
    },
  };
}

async function settleWarehouse(range: ResolvedRange): Promise<{
  emails: GrowthEmails | null;
  syncedAt: string | null;
  newestRowAt: string | null;
  error: string | null;
}> {
  try {
    const [emails, sync, newestRowAt] = await Promise.all([
      fetchEmails(range),
      fetchWarehouseSync(),
      fetchMirrorHighWater(),
    ]);
    return { emails, syncedAt: sync.get("test_results") ?? null, newestRowAt, error: null };
  } catch (error) {
    return {
      emails: null,
      syncedAt: null,
      newestRowAt: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/** Null on any failure, which `mirrorBacklog` reads as "cannot tell". */
async function settleWitness(nowMs: number): Promise<string[] | null> {
  try {
    return await fetchCompletionWitness(nowMs);
  } catch {
    return null;
  }
}
