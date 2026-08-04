import "server-only";

import { hogql, sqlString, webOverview, type QueryScope } from "./posthog-query";
import {
  channelExpr,
  evidenceExpr,
  rungExpr,
  type AttributionRung,
  type LadderColumns,
} from "./attribution";
import type { ResolvedRange } from "./time-range";
import type { DeviceRow, GeoRow, PageRow, SourceRow, Tiles, TrendPoint } from "./types";

/**
 * Every HogQL statement the dashboard runs.
 *
 * ===========================================================================
 * WHAT EACH NUMBER MEANS, AND WHY THEY ALL MEAN THE SAME KIND OF THING
 * ===========================================================================
 * Every counter on this page is UNIQUE PEOPLE — `uniq(person_id)` — except the
 * three that are explicitly not, and those say so on the tile. An earlier
 * version counted events for "results opened" and people for everything else,
 * which produces a funnel whose steps cannot be compared to each other and a
 * reader who cannot tell whether six means six people or six clicks.
 *
 * The traffic five (visitors, views, sessions, duration, bounce) come from
 * PostHog's own `WebOverviewQuery` rather than being reimplemented here, so
 * they agree with PostHog's web analytics by construction. That also collapses
 * five queries into one, which is most of why this page stopped collecting
 * 429s.
 */

/** PostHog's `toDateTime` is happiest with a space-separated, zone-free string. */
function dt(iso: string): string {
  return `toDateTime(${sqlString(iso.replace("T", " ").replace("Z", ""))})`;
}

function scopeFor(range: ResolvedRange, filtered: boolean): QueryScope {
  return { from: range.from, to: range.to, filtered };
}

/* --------------------------------------------------------------------------
 * Tiles
 * ------------------------------------------------------------------------ */

/**
 * Nine tiles, two queries.
 *
 * The conversion four are all `uniq(person_id)`: people who signed up, people
 * who started a test, people who finished one, people who opened their results.
 * Not events. A person who opens their results three times is one person on
 * this tile and three rows on their own journey, which is where that detail
 * belongs.
 */
export async function fetchTiles(range: ResolvedRange, filtered: boolean): Promise<Tiles> {
  const scope = scopeFor(range, filtered);

  const [web, conv] = await Promise.all([
    webOverview(scope),
    hogql<{
      signups: number;
      tests_started: number;
      tests_completed: number;
      results_opened: number;
    }>(
      `SELECT
         uniqIf(person_id, event = 'email_captured') AS signups,
         uniqIf(person_id, event = 'test_started') AS tests_started,
         uniqIf(person_id, event = 'test_completed') AS tests_completed,
         uniqIf(person_id, event = 'results_link_opened') AS results_opened
       FROM events
       WHERE {filters}`,
      scope,
    ),
  ]);

  return {
    visitors: web.visitors ?? 0,
    pageviews: web.views ?? 0,
    sessions: web.sessions ?? 0,
    avgSessionSeconds: Math.round(web.sessionDurationSeconds ?? 0),
    bounceRate: web.bounceRate,
    signups: Number(conv[0]?.signups ?? 0),
    testsStarted: Number(conv[0]?.tests_started ?? 0),
    testsCompleted: Number(conv[0]?.tests_completed ?? 0),
    resultsOpened: Number(conv[0]?.results_opened ?? 0),
  };
}

/* --------------------------------------------------------------------------
 * Traffic panels — loaded only when that tab is opened
 * ------------------------------------------------------------------------ */

/** Where the ladder reads its inputs on the `sessions` table. */
const SESSION_LADDER: LadderColumns = {
  utmSource: "s.$entry_utm_source",
  refDomain: "s.$entry_referring_domain",
  entryPath: "s.$entry_pathname",
  surveySource: "coalesce(sv.survey_source, '')",
};

/**
 * Sessions carry no `person_id`, so PostHog's test-account filter cannot be
 * applied to them directly. The clean set is derived from events — where
 * `{filters}` does apply — and the sessions table is narrowed to those ids.
 */
function cleanSessionsCte(): string {
  return `
    SELECT DISTINCT toString(properties.$session_id) AS sid
    FROM events
    WHERE {filters}
      AND notEmpty(toString(properties.$session_id))`;
}

/**
 * The survey answer is a fact about a person, not about a visit, so it is read
 * across the whole project lifetime rather than the selected window — someone
 * who answered in July is still someone who came from Reddit in August.
 */
function surveyCte(range: ResolvedRange): string {
  return `
    SELECT distinct_id, argMax(toString(properties.source), timestamp) AS survey_source
    FROM events
    WHERE event = 'attribution_survey_answered'
      AND timestamp >= ${dt("2026-07-22T00:00:00Z")}
      AND timestamp < ${dt(range.to)}
    GROUP BY distinct_id`;
}

async function fetchTrend(range: ResolvedRange, filtered: boolean): Promise<TrendPoint[]> {
  const bucket =
    range.granularity === "hour"
      ? "toStartOfHour(timestamp)"
      : range.granularity === "week"
        ? "toStartOfWeek(timestamp, 1)"
        : "toStartOfDay(timestamp)";

  return hogql<TrendPoint>(
    `SELECT
       toString(${bucket}) AS bucket,
       uniq(person_id) AS visitors,
       count() AS pageviews,
       uniq(toString(properties.$session_id)) AS sessions
     FROM events
     WHERE {filters} AND event = '$pageview'
     GROUP BY bucket
     ORDER BY bucket`,
    scopeFor(range, filtered),
  );
}

/**
 * One row per (channel, rung), so "Reddit via a UTM tag" and "Reddit inferred
 * from the referrer" stay separate rows rather than being summed into a number
 * that hides how much of it was guessed.
 */
async function fetchSources(range: ResolvedRange, filtered: boolean): Promise<SourceRow[]> {
  return hogql<SourceRow>(
    `WITH clean AS (${cleanSessionsCte()}),
          survey AS (${surveyCte(range)})
     SELECT
       ${channelExpr(SESSION_LADDER)} AS channel,
       ${rungExpr(SESSION_LADDER)} AS rung,
       count() AS sessions,
       uniq(s.distinct_id) AS visitors,
       any(${evidenceExpr(SESSION_LADDER)}) AS evidence
     FROM sessions AS s
     LEFT ANY JOIN survey AS sv ON sv.distinct_id = s.distinct_id
     WHERE s.session_id IN (SELECT sid FROM clean)
       AND s.$start_timestamp >= ${dt(range.from)}
       AND s.$start_timestamp < ${dt(range.to)}
       -- WEBSITE SESSIONS ONLY. The React Native app shares this project and
       -- its sessions have no pathname, no referrer and no channel, so every
       -- one of them resolved to "Direct or unknown" — 136 of 187 sessions in
       -- a week where the sessions tile reads 42. That made the ladder look
       -- far worse at resolving traffic than it is.
       --
       -- Tested on the events side first, as \`properties.$lib = 'web'\` inside
       -- the CTE. That is a JSON lookup on every row of the scan and the query
       -- hit the execution-time limit. This is a native column on a table with
       -- one row per session, and it means the same thing: a session that
       -- viewed a page is a session on the website.
       AND s.$pageview_count > 0
     GROUP BY channel, rung
     ORDER BY sessions DESC, channel
     LIMIT 60`,
    scopeFor(range, filtered),
  );
}

async function fetchGeo(range: ResolvedRange, filtered: boolean): Promise<GeoRow[]> {
  return hogql<GeoRow>(
    `SELECT
       coalesce(nullIf(toString(properties.$geoip_country_name), ''), 'Unknown') AS country,
       coalesce(nullIf(toString(properties.$geoip_country_code), ''), '') AS countryCode,
       coalesce(nullIf(toString(properties.$geoip_city_name), ''), '') AS city,
       coalesce(nullIf(toString(properties.$geoip_subdivision_1_name), ''), '') AS region,
       uniq(person_id) AS visitors,
       uniq(toString(properties.$session_id)) AS sessions,
       count() AS pageviews
     FROM events
     WHERE {filters} AND event = '$pageview'
     GROUP BY country, countryCode, city, region
     ORDER BY visitors DESC, pageviews DESC
     LIMIT 100`,
    scopeFor(range, filtered),
  );
}

/**
 * Paths, with the high-cardinality tails collapsed. `/results/<token>` is a
 * different string for every attempt; grouping on the raw path would hold every
 * distinct token in memory to produce one row per person.
 */
const NORMALISED_PATH = `
  multiIf(
    toString(properties.$pathname) LIKE '/results/%', '/results/…',
    toString(properties.$pathname) LIKE '/beat/%', '/beat/…',
    toString(properties.$pathname) LIKE '/go/%', '/go/…',
    coalesce(nullIf(toString(properties.$pathname), ''), '(unknown)')
  )`;

async function fetchPages(range: ResolvedRange, filtered: boolean): Promise<PageRow[]> {
  return hogql<PageRow>(
    `SELECT
       ${NORMALISED_PATH} AS path,
       count() AS views,
       uniq(person_id) AS visitors
     FROM events
     WHERE {filters} AND event = '$pageview'
     GROUP BY path
     ORDER BY views DESC
     LIMIT 40`,
    scopeFor(range, filtered),
  );
}

async function fetchDevices(range: ResolvedRange, filtered: boolean): Promise<DeviceRow[]> {
  return hogql<DeviceRow>(
    `SELECT
       coalesce(nullIf(toString(properties.$device_type), ''), 'Unknown') AS device,
       coalesce(nullIf(toString(properties.$browser), ''), 'Unknown') AS browser,
       coalesce(nullIf(toString(properties.$os), ''), 'Unknown') AS os,
       uniq(person_id) AS visitors
     FROM events
     WHERE {filters} AND event = '$pageview'
     GROUP BY device, browser, os
     ORDER BY visitors DESC
     LIMIT 40`,
    scopeFor(range, filtered),
  );
}

export interface TrafficPayload {
  trend: TrendPoint[];
  sources: SourceRow[];
  rungBreakdown: { rung: AttributionRung; sessions: number }[];
  geo: GeoRow[];
  pages: PageRow[];
  devices: DeviceRow[];
}

export async function fetchTraffic(
  range: ResolvedRange,
  filtered: boolean,
): Promise<TrafficPayload> {
  const [trend, sources, geo, pages, devices] = await Promise.all([
    fetchTrend(range, filtered),
    fetchSources(range, filtered),
    fetchGeo(range, filtered),
    fetchPages(range, filtered),
    fetchDevices(range, filtered),
  ]);

  // Summed from the rows above rather than asked for separately: it is the same
  // GROUP BY with one fewer key, and the sessions scan behind it is the most
  // expensive query on the page.
  const rungTotals = new Map<AttributionRung, number>();
  for (const row of sources) {
    const rung = row.rung as AttributionRung;
    rungTotals.set(rung, (rungTotals.get(rung) ?? 0) + Number(row.sessions));
  }

  return {
    trend: trend.map((t) => ({
      bucket: String(t.bucket),
      visitors: Number(t.visitors),
      pageviews: Number(t.pageviews),
      sessions: Number(t.sessions),
    })),
    sources: sources.map((s) => ({
      channel: String(s.channel),
      rung: s.rung as AttributionRung,
      sessions: Number(s.sessions),
      visitors: Number(s.visitors),
      evidence: String(s.evidence ?? ""),
    })),
    rungBreakdown: [...rungTotals.entries()]
      .map(([rung, sessions]) => ({ rung, sessions }))
      .sort((a, b) => b.sessions - a.sessions),
    geo: geo.map((g) => ({
      country: String(g.country),
      countryCode: String(g.countryCode ?? ""),
      city: String(g.city ?? ""),
      region: String(g.region ?? ""),
      visitors: Number(g.visitors),
      sessions: Number(g.sessions),
      pageviews: Number(g.pageviews),
    })),
    pages: pages.map((p) => ({
      path: String(p.path),
      views: Number(p.views),
      visitors: Number(p.visitors),
    })),
    devices: devices.map((d) => ({
      device: String(d.device),
      browser: String(d.browser),
      os: String(d.os),
      visitors: Number(d.visitors),
    })),
  };
}
