import "server-only";

import { hogql, sqlString, type QueryScope } from "./posthog-query";
import { WEBSITE_SURFACE } from "./filters";
import {
  channelExpr,
  evidenceExpr,
  rungExpr,
  type AttributionRung,
  type LadderColumns,
} from "./attribution";
import {
  buildLink,
  fetchCompletions,
  fetchResultsVisits,
  matchAttemptToCompletion,
  readResultToken,
  tokenFromPath,
  type DecodedAttempt,
} from "./identity";
import type { ResolvedRange } from "./time-range";
import type { PersonLink } from "./types";

/**
 * People, and how far each of them got.
 *
 * ===========================================================================
 * ANONYMOUS PEOPLE ARE THE POINT, NOT THE REMAINDER
 * ===========================================================================
 * The only people currently visible to anyone are the ones in the Resend
 * delivery log, which by construction lists only those who finished the test
 * and earned a results email. Everyone who started and walked away is absent
 * from that log and therefore absent from the picture — and there are more of
 * them than there are completers. On 4 August six people started the adult test
 * and left: Oss, Eindhoven, Lake Geneva, Brookfield, Stockholm, Boise. Five of
 * the six arrived from Reddit. Reddit is doing roughly twice the work the
 * signup count credits it with.
 *
 * So a person here is a PostHog person, named or not. An email address is an
 * attribute someone may or may not have, never the thing that makes them real.
 */

/**
 * The website surface: the browser SDK, plus the server-side conversion.
 *
 * `posthog-node` is included deliberately. `/api/access-signup` fires
 * `email_captured` from the server precisely so a blocked client library cannot
 * hide a signup, and excluding it here would drop the one person whose entire
 * PostHog footprint is that single event.
 */
function dt(iso: string): string {
  return `toDateTime(${sqlString(iso.replace("T", " ").replace("Z", ""))})`;
}

function scopeFor(range: ResolvedRange, filtered: boolean): QueryScope {
  return { from: range.from, to: range.to, filtered };
}

/** The ladder, reading a person's FIRST pageview rather than a session row. */
const PERSON_LADDER: LadderColumns = {
  utmSource: "f_utm",
  refDomain: "f_ref",
  entryPath: "f_path",
  surveySource: "survey_source",
};

export type Outcome =
  | "completed"
  | "completed_timed_out"
  | "abandoned_quit"
  | "abandoned_timed_out"
  | "abandoned_silent"
  | "never_started"
  | "untracked";

export interface PersonRow {
  personId: string;
  distinctIds: string[];
  firstSeen: string;
  lastSeen: string;
  events: number;
  pageviews: number;
  sessions: number;
  channel: string;
  rung: AttributionRung;
  evidence: string;
  country: string;
  countryCode: string;
  city: string;
  region: string;
  device: string;
  browser: string;
  os: string;
  isInternal: boolean;

  /** Funnel progress. */
  landed: boolean;
  ctaActivated: boolean;
  startedTest: boolean;
  startedTestId: string | null;
  audience: string | null;
  furthestQuestion: number;
  questionsAnswered: number;
  questionTotal: number;
  reachedGate: boolean;
  submittedEmail: boolean;
  /** Specifically the results gate, not the homepage pricing form. */
  submittedTestEmail: boolean;
  signedUp: boolean;

  /** Outcome. */
  outcome: Outcome;
  score: number | null;
  maxScore: number | null;
  answeredAtEnd: number | null;
  timedOut: boolean;
  elapsedSeconds: number | null;
  verdict: string | null;

  /** After the email. */
  resultsOpens: number;
  resultsViews: number;
  resultsDwellSeconds: number;
  /** Time across every results-page visit, not just the longest one. */
  resultsTotalSeconds: number;

  /** Sharing and friction. */
  shareEvents: number;
  shareDestinations: string[];
  deadClicks: number;

  email: string | null;
  links: PersonLink[];
  untracked: boolean;
  /** Human sentence for the list row. */
  headline: string;
}

interface RawPersonRow {
  personId: string;
  distinctIds: string[];
  firstSeen: string;
  lastSeen: string;
  events: number;
  pageviews: number;
  sessions: number;
  channel: string;
  rung: string;
  evidence: string;
  country: string;
  countryCode: string;
  city: string;
  region: string;
  device: string;
  browser: string;
  os: string;
  isInternal: number;
  ctaActivations: number;
  starts: number;
  startedTestId: string;
  furthestQuestion: number | null;
  questionsAnswered: number;
  questionTotal: number | null;
  gateViews: number;
  emailSubmits: number;
  signups: number;
  testEmailSubmits: number;
  completions: number;
  timeouts: number;
  quits: number;
  score: number | null;
  maxScore: number | null;
  answeredAtEnd: number | null;
  elapsedSeconds: number | null;
  verdict: string;
  completedTimedOut: string;
  completedTestId: string;
  resultsOpens: number;
  resultsViews: number;
  shareEvents: number;
  shareDestinations: string[];
  deadClicks: number;
}

/**
 * One row per person, with everything the list and the funnel both need.
 *
 * A single scan with conditional aggregates rather than a query per stage: the
 * funnel and the people list are the same facts asked two ways, and computing
 * them twice is how the two end up disagreeing.
 */
async function fetchPersonRows(
  range: ResolvedRange,
  filtered: boolean,
): Promise<RawPersonRow[]> {
  return hogql<RawPersonRow>(`
    WITH base AS (
      SELECT
        toString(person_id) AS personId,
        groupUniqArray(distinct_id) AS distinctIds,
        toString(min(timestamp)) AS firstSeen,
        toString(max(timestamp)) AS lastSeen,
        count() AS events,
        countIf(event = '$pageview') AS pageviews,
        uniqIf(toString(properties.$session_id), notEmpty(toString(properties.$session_id))) AS sessions,

        -- Acquisition evidence: the person's FIRST pageview in the window.
        argMinIf(coalesce(toString(properties.utm_source), ''), timestamp, event = '$pageview') AS f_utm,
        argMinIf(coalesce(toString(properties.$referring_domain), ''), timestamp, event = '$pageview') AS f_ref,
        argMinIf(coalesce(toString(properties.$pathname), ''), timestamp, event = '$pageview') AS f_path,
        argMaxIf(coalesce(toString(properties.source), ''), timestamp, event = 'attribution_survey_answered') AS survey_source,

        -- Who and where: taken from the LAST pageview, which is the most
        -- complete once geoip and UA parsing have settled.
        argMaxIf(coalesce(toString(properties.$geoip_country_name), ''), timestamp, event = '$pageview') AS country,
        argMaxIf(coalesce(toString(properties.$geoip_country_code), ''), timestamp, event = '$pageview') AS countryCode,
        argMaxIf(coalesce(toString(properties.$geoip_city_name), ''), timestamp, event = '$pageview') AS city,
        argMaxIf(coalesce(toString(properties.$geoip_subdivision_1_name), ''), timestamp, event = '$pageview') AS region,
        argMaxIf(coalesce(toString(properties.$device_type), ''), timestamp, event = '$pageview') AS device,
        argMaxIf(coalesce(toString(properties.$browser), ''), timestamp, event = '$pageview') AS browser,
        argMaxIf(coalesce(toString(properties.$os), ''), timestamp, event = '$pageview') AS os,
        maxIf(1, coalesce(toString(properties.is_internal), '') = 'true') AS isInternal,

        -- Funnel stages.
        countIf(event IN ('test_cta_activated', 'test_fork_selected')) AS ctaActivations,
        countIf(event = 'test_started') AS starts,
        argMaxIf(coalesce(toString(properties.test_id), ''), timestamp, event = 'test_started') AS startedTestId,
        countIf(event = 'test_results_gate_viewed') AS gateViews,
        countIf(event = 'test_email_submitted') AS emailSubmits,
        countIf(event = 'email_captured') AS signups,
        -- The homepage pricing form and the results gate both fire
        -- email_captured; only the second one is a step in the test funnel,
        -- and conflating them makes the gate look like it converts perfectly.
        countIf(
          event = 'test_email_submitted'
          OR (event = 'email_captured' AND toString(properties.source) LIKE 'smart-fella-test%')
        ) AS testEmailSubmits,

        -- Progress through the questions. question_index is 1-based in the
        -- capture, so this is literally "the highest numbered question they
        -- laid eyes on", which is what "where did they give up" means.
        maxIf(toFloat(properties.question_index), event IN ('question_viewed', 'question_answered')) AS furthestQuestion,
        uniqIf(toString(properties.question_id), event = 'question_answered') AS questionsAnswered,
        maxIf(toFloat(properties.question_total), event IN ('question_viewed', 'question_answered', 'test_timed_out', 'test_quit')) AS questionTotal,

        -- Outcome.
        countIf(event = 'test_completed') AS completions,
        countIf(event = 'test_timed_out') AS timeouts,
        countIf(event = 'test_quit') AS quits,
        maxIf(toFloat(properties.score), event = 'test_completed') AS score,
        maxIf(toFloat(properties.max_score), event = 'test_completed') AS maxScore,
        maxIf(toFloat(properties.answered), event IN ('test_completed', 'test_timed_out', 'test_quit')) AS answeredAtEnd,
        maxIf(toFloat(properties.elapsed_s), event IN ('test_completed', 'test_quit')) AS elapsedSeconds,
        argMaxIf(coalesce(toString(properties.verdict), ''), timestamp, event = 'test_completed') AS verdict,
        argMaxIf(coalesce(toString(properties.timed_out), ''), timestamp, event = 'test_completed') AS completedTimedOut,
        argMaxIf(coalesce(toString(properties.test_id), ''), timestamp, event = 'test_completed') AS completedTestId,

        -- After the email.
        countIf(event = 'results_link_opened') AS resultsOpens,
        -- One PAGE LOAD is one visit. Not distinct sessions: a visitor who
        -- reads her results for nineteen minutes and comes back to them later
        -- is still inside the same PostHog session, so counting sessions would
        -- record that as a single visit. And not pageviews PLUS
        -- results_link_opened, which both fire per load and would double it.
        countIf(
          event = '$pageview' AND toString(properties.$pathname) LIKE '/results/%'
        ) AS resultsViews,

        -- Sharing and friction.
        countIf(event LIKE 'test_result_share%') AS shareEvents,
        arrayFilter(x -> x != '', groupUniqArrayIf(
          coalesce(toString(properties.destination), ''), event LIKE 'test_result_share%'
        )) AS shareDestinations,
        countIf(event = '$dead_click') AS deadClicks
      FROM events
      WHERE {filters} AND ${WEBSITE_SURFACE}
      GROUP BY person_id
    )
    SELECT
      *,
      ${channelExpr(PERSON_LADDER)} AS channel,
      ${rungExpr(PERSON_LADDER)} AS rung,
      ${evidenceExpr(PERSON_LADDER)} AS evidence
    FROM base
    ORDER BY firstSeen DESC
    LIMIT 500`, scopeFor(range, filtered));
}

/* --------------------------------------------------------------------------
 * Signups from the product database
 * ------------------------------------------------------------------------ */

interface SignupRow {
  id: string;
  email: string;
  source: string;
  created_at: string;
  user_agent: string;
  referrer: string;
}

/**
 * The signups table is Aurora's, synced into PostHog's warehouse. It is the
 * only place a person has a name, and — crucially — it contains people PostHog
 * has no events for at all.
 */
async function fetchSignups(range: ResolvedRange): Promise<SignupRow[]> {
  return hogql<SignupRow>(`
    SELECT
      toString(id) AS id,
      toString(email) AS email,
      toString(source) AS source,
      toString(created_at) AS created_at,
      coalesce(JSONExtractString(toString(meta), 'userAgent'), '') AS user_agent,
      coalesce(JSONExtractString(toString(meta), 'referrer'), '') AS referrer
    FROM email_signups
    -- created_at is a String on the warehouse table, so it is parsed rather
    -- than compared. HogQL exposes parseDateTimeBestEffort but not the OrNull
    -- variant, hence the non-empty guard doing the work instead.
    WHERE notEmpty(toString(created_at))
      AND parseDateTimeBestEffort(toString(created_at)) >= ${dt(range.from)}
      AND parseDateTimeBestEffort(toString(created_at)) < ${dt(range.to)}
    ORDER BY created_at DESC
    LIMIT 500`);
}

interface CaptureRow {
  person_id: string;
  ts: string;
  source: string;
}

async function fetchEmailCaptures(
  range: ResolvedRange,
  filtered: boolean,
): Promise<CaptureRow[]> {
  return hogql<CaptureRow>(`
    SELECT
      toString(person_id) AS person_id,
      toString(timestamp) AS ts,
      coalesce(toString(properties.source), '') AS source
    FROM events
    WHERE {filters} AND event = 'email_captured'
    ORDER BY timestamp`, scopeFor(range, filtered));
}

/**
 * Team and synthetic addresses.
 *
 * The cohort-based internal filter works on EVENTS, so it cannot reach a signup
 * row that produced no event — which is precisely the untracked case this
 * dashboard is meant to surface. Without this list, turning the internal filter
 * on would still leave `delivered+link…@resend.dev` sitting in the people list
 * looking like a real customer.
 *
 * THIS LIST IS THE LAST RESORT, NOT THE FIRST LINE, AND IT IS NOT THE THING TO
 * EXTEND. It is deliberately shorter than PostHog's own filter and that is not
 * a gap: PostHog already wins wherever it can see the person at all. A signup
 * that matches an UNFILTERED capture but no filtered one is dropped further
 * down on exactly that basis, which catches a teammate whose address this list
 * has never heard of — a personal gmail, say — as long as PostHog saw them.
 *
 * So the only rows this list decides are the ones PostHog never recorded, where
 * there is nothing else to go on. Adding addresses here to "keep up with"
 * PostHog duplicates a filter that has already run and drifts out of date
 * silently; if someone internal is showing up, check whether their browser is
 * marked via /internal first, because that fixes it everywhere at once.
 */
const INTERNAL_EMAIL_PATTERNS = [
  /@alphaaiengineering\.com$/i,
  /@gauntlethq\.com$/i,
  /@resend\.dev$/i,
  /^kimkhoi2202@gmail\.com$/i,
];

function isInternalEmail(email: string): boolean {
  return INTERNAL_EMAIL_PATTERNS.some((re) => re.test(email.trim()));
}

const parseTs = (value: string): number =>
  Date.parse(value.includes("T") ? value : `${value.replace(" ", "T")}Z`);

/* --------------------------------------------------------------------------
 * Assembly
 * ------------------------------------------------------------------------ */

export interface PeopleResult {
  people: PersonRow[];
  /** Person id -> the decoded attempt behind the results page they opened. */
  attemptsByPerson: Map<string, DecodedAttempt>;
}

/**
 * A very short-lived cache of the assembled people set.
 *
 * Assembling it costs five ClickHouse queries, and opening a journey needs the
 * same set again to find which human a person belongs to — so without this,
 * clicking three people in a row costs fifteen queries for data that has not
 * changed. PostHog answers "queries are a little too busy right now" well
 * before that becomes theoretical.
 *
 * Thirty seconds: long enough to cover a burst of clicking, short enough that
 * nobody is ever looking at yesterday's numbers. Per-instance and in-memory,
 * which is the right lifetime for something this cheap to rebuild.
 */
const CACHE_TTL_MS = 30_000;
const cache = new Map<string, { at: number; value: PeopleResult }>();

export async function fetchPeople(
  range: ResolvedRange,
  filtered: boolean,
): Promise<PeopleResult> {
  const bucket = Math.floor(Date.parse(range.to) / CACHE_TTL_MS);
  const key = `${range.from.slice(0, 16)}|${bucket}|${filtered}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value;

  const value = await assemblePeople(range, filtered);
  cache.set(key, { at: Date.now(), value });
  if (cache.size > 24) {
    for (const [k, v] of cache) {
      if (Date.now() - v.at >= CACHE_TTL_MS) cache.delete(k);
    }
  }
  return value;
}

async function assemblePeople(
  range: ResolvedRange,
  filtered: boolean,
): Promise<PeopleResult> {
  const [rows, signups, captures, capturesRaw, resultsVisits, completions] = await Promise.all([
    fetchPersonRows(range, filtered),
    fetchSignups(range),
    fetchEmailCaptures(range, filtered),
    // The same conversions with the internal filter OFF. Needed to tell an
    // untracked human apart from an EXCLUDED one — see the note where signups
    // are matched below.
    filtered ? fetchEmailCaptures(range, false) : Promise.resolve([]),
    fetchResultsVisits(scopeFor(range, filtered)),
    fetchCompletions(scopeFor(range, filtered)),
  ]);

  const people: PersonRow[] = rows.map(toPersonRow);
  const byId = new Map(people.map((p) => [p.personId, p]));

  /* ---- Attach the attempt behind every results page that was opened ----- */
  const attemptsByPerson = new Map<string, DecodedAttempt>();
  const dwellByPerson = new Map<string, number>();
  const totalDwellByPerson = new Map<string, number>();

  for (const visit of resultsVisits) {
    const person = byId.get(visit.person_id);
    const seconds = Math.max(
      0,
      Math.round((parseTs(visit.last_seen) - parseTs(visit.first_seen)) / 1000),
    );
    dwellByPerson.set(
      visit.person_id,
      Math.max(dwellByPerson.get(visit.person_id) ?? 0, seconds),
    );
    totalDwellByPerson.set(
      visit.person_id,
      (totalDwellByPerson.get(visit.person_id) ?? 0) + seconds,
    );

    const token = tokenFromPath(visit.path);
    if (!token) continue;
    const attempt = readResultToken(token);
    if (!attempt) continue;
    attemptsByPerson.set(visit.person_id, attempt);

    /* ---- The Sebastian case: link the reader back to the taker ---------- */
    const match = matchAttemptToCompletion(attempt, completions);
    if (match && match.row.person_id !== visit.person_id) {
      const taker = byId.get(match.row.person_id);
      if (person) {
        person.links.push(
          buildLink(match.row.person_id, "took the test", match.confidence, match.reason),
        );
      }
      if (taker) {
        taker.links.push(
          buildLink(visit.person_id, "opened the results", match.confidence, match.reason),
        );
      }
    }

    // Even with no link, the token tells us what they scored — so a person who
    // only ever opened a results page is not a blank row.
    if (person && person.score === null) {
      person.score = attempt.score;
      person.maxScore = attempt.maxScore;
      person.answeredAtEnd = attempt.answered;
      person.timedOut = attempt.timedOut;
      person.elapsedSeconds = attempt.elapsedSeconds;
      person.verdict = attempt.verdict;
      person.audience = attempt.audience;
      person.startedTestId = person.startedTestId ?? attempt.testId;
    }
  }

  for (const [personId, seconds] of dwellByPerson) {
    const person = byId.get(personId);
    if (person) {
      person.resultsDwellSeconds = seconds;
      person.resultsTotalSeconds = totalDwellByPerson.get(personId) ?? seconds;
    }
  }

  /* ---- Put names on the people who gave one --------------------------- */
  const usedCaptures = new Set<number>();
  const untracked: PersonRow[] = [];

  for (const signup of signups) {
    if (filtered && isInternalEmail(signup.email)) continue;
    const signupMs = parseTs(signup.created_at);

    // The server-side `email_captured` is written in the same request that
    // inserts the row, so the nearest capture within three minutes is the same
    // event seen from the other side of the wire.
    let bestIndex = -1;
    let bestGap = Number.POSITIVE_INFINITY;
    captures.forEach((capture, i) => {
      if (usedCaptures.has(i)) return;
      const gap = Math.abs(parseTs(capture.ts) - signupMs);
      if (gap < bestGap && gap <= 180_000) {
        bestGap = gap;
        bestIndex = i;
      }
    });

    if (bestIndex >= 0) {
      usedCaptures.add(bestIndex);
      const person = byId.get(captures[bestIndex].person_id);
      if (person) {
        person.email = signup.email;
        person.signedUp = true;
        markUntrackedIfBlindSpot(person, signup);
        continue;
      }
    }

    /*
      Nothing to attach it to. That means one of two very different things, and
      getting them the wrong way round is how an excluded teammate reappears as
      a customer.

        (a) PostHog genuinely never saw this person — an ad-blocked client, or
            a signup whose events fall outside the window. They belong on the
            dashboard, flagged as untracked.
        (b) PostHog saw them fine and the internal filter removed them. The
            warehouse table has no `is_internal` and no cohort membership, so
            nothing in the signup row itself says so.

      Re-running the same match against the UNFILTERED conversions separates
      the two: a signup that matches a raw capture but not a filtered one was
      excluded on purpose. Grace Yan is the live example — an internal identity
      on the exclusion list whose signup row would otherwise have walked back
      into the filtered funnel and made "gave an email" read 6 against a
      signups tile of 5.
    */
    if (filtered) {
      const excludedByFilter = capturesRaw.some(
        (capture) => Math.abs(parseTs(capture.ts) - signupMs) <= 180_000,
      );
      if (excludedByFilter) continue;
    }

    untracked.push(untrackedPerson(signup));
  }

  // Fold linked pairs' names across, so the person who took the test carries
  // the address even though the signup matched the other half of them.
  for (const person of people) {
    if (person.email) continue;
    for (const link of person.links) {
      const other = byId.get(link.personId);
      if (other?.email) {
        person.email = other.email;
        break;
      }
    }
  }

  for (const person of people) person.headline = headlineFor(person);
  for (const person of untracked) person.headline = headlineFor(person);

  const all = [...people, ...untracked].sort(
    (a, b) => parseTs(b.firstSeen) - parseTs(a.firstSeen),
  );

  return { people: all, attemptsByPerson };
}

function toPersonRow(raw: RawPersonRow): PersonRow {
  const completions = Number(raw.completions ?? 0);
  const timeouts = Number(raw.timeouts ?? 0);
  const quits = Number(raw.quits ?? 0);
  const starts = Number(raw.starts ?? 0);
  const completedTimedOut = String(raw.completedTimedOut ?? "").toLowerCase() === "true";

  const outcome: Outcome = completions
    ? completedTimedOut
      ? "completed_timed_out"
      : "completed"
    : starts
      ? quits
        ? "abandoned_quit"
        : timeouts
          ? "abandoned_timed_out"
          : "abandoned_silent"
      : "never_started";

  const testId = String(raw.completedTestId || raw.startedTestId || "") || null;

  return {
    personId: String(raw.personId),
    distinctIds: (raw.distinctIds ?? []).map(String).slice(0, 10),
    firstSeen: String(raw.firstSeen),
    lastSeen: String(raw.lastSeen),
    events: Number(raw.events ?? 0),
    pageviews: Number(raw.pageviews ?? 0),
    sessions: Number(raw.sessions ?? 0),
    channel: String(raw.channel ?? "Direct or unknown"),
    rung: (raw.rung ?? "unknown") as AttributionRung,
    evidence: String(raw.evidence ?? ""),
    country: String(raw.country ?? ""),
    countryCode: String(raw.countryCode ?? ""),
    city: String(raw.city ?? ""),
    region: String(raw.region ?? ""),
    device: String(raw.device ?? ""),
    browser: String(raw.browser ?? ""),
    os: String(raw.os ?? ""),
    isInternal: Number(raw.isInternal ?? 0) === 1,

    // ANY event, not just a $pageview. Roughly a third of real arrivals reach
    // PostHog with the pageview missing and only a $pageleave or a
    // section_viewed surviving — an ad-blocker or a slow init eats the first
    // capture. Those people landed. Counting pageviews only would quietly drop
    // them out of the top of the funnel, which is the same class of mistake as
    // filing an untagged Reddit visit under "direct".
    landed: Number(raw.events ?? 0) > 0,
    ctaActivated: Number(raw.ctaActivations ?? 0) > 0,
    // `test_started` fired, not merely "we know which test their results were
    // for" — a person who only ever opened an emailed results link inherits a
    // test id from the token and must not be counted as having taken it.
    startedTest: starts > 0,
    startedTestId: testId,
    audience: testId ? (testId === "adult" ? "adult" : "child") : null,
    furthestQuestion: Math.round(Number(raw.furthestQuestion ?? 0)),
    questionsAnswered: Number(raw.questionsAnswered ?? 0),
    questionTotal: Math.round(Number(raw.questionTotal ?? 0)),
    reachedGate: Number(raw.gateViews ?? 0) > 0,
    submittedEmail: Number(raw.emailSubmits ?? 0) > 0,
    submittedTestEmail: Number(raw.testEmailSubmits ?? 0) > 0,
    signedUp: Number(raw.signups ?? 0) > 0,

    outcome,
    score: raw.score === null || raw.score === undefined ? null : Number(raw.score),
    maxScore: raw.maxScore === null || raw.maxScore === undefined ? null : Number(raw.maxScore),
    answeredAtEnd:
      raw.answeredAtEnd === null || raw.answeredAtEnd === undefined
        ? null
        : Number(raw.answeredAtEnd),
    timedOut: completedTimedOut || timeouts > 0,
    elapsedSeconds:
      raw.elapsedSeconds === null || raw.elapsedSeconds === undefined
        ? null
        : Number(raw.elapsedSeconds),
    verdict: String(raw.verdict ?? "") || null,

    resultsOpens: Number(raw.resultsOpens ?? 0),
    resultsViews: Number(raw.resultsViews ?? 0),
    resultsDwellSeconds: 0,
    resultsTotalSeconds: 0,

    shareEvents: Number(raw.shareEvents ?? 0),
    shareDestinations: (raw.shareDestinations ?? []).map(String),
    deadClicks: Number(raw.deadClicks ?? 0),

    email: null,
    links: [],
    untracked: false,
    headline: "",
  };
}

/**
 * The blocked-client case: a person whose ENTIRE PostHog footprint is the
 * server-side conversion.
 *
 * `raywot@gmail.com` is the one that proves it matters. Firefox's tracking
 * protection blocked the client library outright, so a human who sat for
 * fifteen minutes and answered 48 of 50 questions produced no pageview, no
 * test_started and no test_completed — only the ad-blocker-proof
 * `email_captured` that /api/access-signup fires from the server. Read
 * literally, PostHog says he never started a test.
 *
 * He earned and was sent a results email, which cannot happen without finishing
 * the test, so "never started" is not merely unhelpful, it is false. Marking
 * him untracked turns "our analytics could not see him" into a visible fact
 * instead of silently converting it into "he was not interested" — the single
 * most misleading thing this dashboard could do, and it would happen to exactly
 * the users it can see least.
 */
function markUntrackedIfBlindSpot(person: PersonRow, signup: SignupRow): void {
  const seenDoingAnything = person.pageviews > 0 || person.startedTest || person.reachedGate;
  const cameFromTheTestGate = signup.source.startsWith("smart-fella-test");
  if (seenDoingAnything || !cameFromTheTestGate) return;

  const shadow = untrackedPerson(signup);
  person.untracked = true;
  person.outcome = "untracked";
  person.startedTest = true;
  person.ctaActivated = true;
  person.reachedGate = true;
  person.submittedEmail = true;
  person.submittedTestEmail = true;
  person.audience = shadow.audience;
  person.startedTestId = shadow.startedTestId;
  // The user agent on the signup row is the only description of the device we
  // have, since no client event ever reached PostHog to be enriched.
  person.device ||= shadow.device;
  person.browser ||= shadow.browser;
  person.os ||= shadow.os;
  if (person.rung === "unknown" && shadow.rung !== "unknown") {
    person.channel = shadow.channel;
    person.rung = shadow.rung;
    person.evidence = shadow.evidence;
  }
}

/**
 * A signup row with no analytics events behind it at all.
 *
 * `raywot@gmail.com` is the canonical one: Firefox's tracking protection
 * blocked the client library outright, so a human who sat for fifteen minutes
 * and answered 48 of 50 questions produced exactly one PostHog event — the
 * server-side conversion — and in this window not even that matched. He
 * COMPLETED. Rendering him as an abandoner, or leaving him out, would turn
 * "our analytics could not see him" into "he was not interested", which is the
 * single most misleading thing this dashboard could do.
 */
function untrackedPerson(signup: SignupRow): PersonRow {
  const ua = signup.user_agent;
  const browser = /Firefox/i.test(ua)
    ? "Firefox"
    : /Edg\//i.test(ua)
      ? "Edge"
      : /Chrome/i.test(ua)
        ? "Chrome"
        : /Safari/i.test(ua)
          ? "Safari"
          : "";
  const os = /Windows/i.test(ua)
    ? "Windows"
    : /iPhone|iPad|iOS/i.test(ua)
      ? "iOS"
      : /Android/i.test(ua)
        ? "Android"
        : /Mac OS X/i.test(ua)
          ? "Mac OS X"
          : "";
  const device = /Mobile|iPhone|Android/i.test(ua) ? "Mobile" : ua ? "Desktop" : "";

  let channel = "Direct or unknown";
  let rung: AttributionRung = "unknown";
  let evidence = "no analytics events; signup row only";
  const utm = /[?&]utm_source=([^&]+)/.exec(signup.referrer)?.[1];
  if (utm) {
    channel = utm.charAt(0).toUpperCase() + utm.slice(1);
    rung = "utm";
    evidence = `utm_source=${utm} on the signup referrer`;
  }

  const iso = new Date(parseTs(signup.created_at)).toISOString();
  return {
    personId: `signup:${signup.id}`,
    distinctIds: [],
    firstSeen: iso,
    lastSeen: iso,
    events: 0,
    pageviews: 0,
    sessions: 0,
    channel,
    rung,
    evidence,
    country: "",
    countryCode: "",
    city: "",
    region: "",
    device,
    browser,
    os,
    isInternal: false,
    landed: true,
    ctaActivated: true,
    // They demonstrably took the test — a results email was earned and
    // delivered. The events are missing, the engagement is not.
    startedTest: true,
    startedTestId: signup.source.includes("child") ? "child" : "adult",
    audience: signup.source.includes("child") ? "child" : "adult",
    furthestQuestion: 0,
    questionsAnswered: 0,
    questionTotal: 0,
    reachedGate: true,
    submittedEmail: true,
    submittedTestEmail: true,
    signedUp: true,
    outcome: "untracked",
    score: null,
    maxScore: null,
    answeredAtEnd: null,
    timedOut: false,
    elapsedSeconds: null,
    verdict: null,
    resultsOpens: 0,
    resultsViews: 0,
    resultsDwellSeconds: 0,
    resultsTotalSeconds: 0,
    shareEvents: 0,
    shareDestinations: [],
    deadClicks: 0,
    email: signup.email,
    links: [],
    untracked: true,
    headline: "",
  };
}

function headlineFor(p: PersonRow): string {
  if (p.untracked) {
    const device = [p.browser, p.os].filter(Boolean).join(" on ");
    return `Completed the test and was emailed their results, but the analytics library never loaded${
      device ? ` (${device})` : ""
    } — so the session itself is missing. They engaged; PostHog did not see it.`;
  }
  const where = [p.city, p.country].filter(Boolean).join(", ") || "location unknown";
  switch (p.outcome) {
    case "completed":
      return `Finished the ${p.audience ?? ""} test, ${p.score}/${p.maxScore} with ${p.answeredAtEnd ?? "?"} answered. From ${where}.`;
    case "completed_timed_out":
      return `Ran out of time but finished with ${p.answeredAtEnd ?? "?"} of ${p.questionTotal || "?"} answered, scoring ${p.score}/${p.maxScore}. From ${where}.`;
    case "abandoned_quit":
      return `Quit deliberately at question ${p.furthestQuestion} of ${p.questionTotal || "?"}. From ${where}.`;
    case "abandoned_timed_out":
      return `Clock ran out at question ${p.furthestQuestion} and they never reached the results. From ${where}.`;
    case "abandoned_silent":
      return `Started the test and stopped at question ${p.furthestQuestion} of ${p.questionTotal || "?"}. From ${where}.`;
    default:
      return p.pageviews > 0
        ? `Visited ${p.pageviews} page${p.pageviews === 1 ? "" : "s"} and never started a test. From ${where}.`
        : `One event only, no pageview. From ${where}.`;
  }
}
