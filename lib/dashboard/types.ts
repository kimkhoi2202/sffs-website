import type { AttributionRung } from "./attribution";

/** Shared wire types. Imported by both the route handlers and the client UI. */

export interface Tiles {
  visitors: number;
  pageviews: number;
  sessions: number;
  /** Mean of `sessions.$session_duration`, seconds. */
  avgSessionSeconds: number;
  /** Mean of `sessions.$is_bounce`, 0–1, over sessions where PostHog set it. */
  bounceRate: number | null;
  signups: number;
  testsStarted: number;
  testsCompleted: number;
  resultsOpened: number;
}

export interface TrendPoint {
  bucket: string;
  visitors: number;
  pageviews: number;
  sessions: number;
}

export interface SourceRow {
  channel: string;
  rung: AttributionRung;
  sessions: number;
  visitors: number;
  /** One real example of the evidence this row was resolved on. */
  evidence: string;
}

export interface GeoRow {
  country: string;
  countryCode: string;
  city: string;
  region: string;
  visitors: number;
  sessions: number;
  pageviews: number;
}

export interface PageRow {
  path: string;
  views: number;
  visitors: number;
}

export interface DeviceRow {
  device: string;
  browser: string;
  os: string;
  visitors: number;
}

/* --------------------------------------------------------------------------
 * Test completions, from the `test_results` warehouse mirror.
 *
 * These describe real finished tests rather than analytics events, so they
 * carry an email address where one was given. See lib/dashboard/test-results.ts
 * for why nothing here is filtered a second time.
 * ------------------------------------------------------------------------ */

/** One acquisition platform's completions. `platform` may be "unattributable". */
export interface TestPlatformRow {
  platform: string;
  adult: number;
  child: number;
  total: number;
  /** Completions in this bucket that carry no email address. */
  anonymous: number;
}

/** One finished test. */
export interface TestCompletionRow {
  id: string;
  /** Null when nobody asked for the result by email. Still a real completion. */
  email: string | null;
  testType: string;
  /** "3", "5", "7-8" for children; "adult" for the grown-up test. */
  gradeBand: string;
  score: number;
  maxScore: number;
  platform: string;
  completedAt: string;
}

export interface TestResultTotals {
  completions: number;
  adult: number;
  child: number;
  anonymous: number;
  withEmail: number;
}

/* --------------------------------------------------------------------------
 * Growth: the funnel, the channel table, paid against organic, and the list.
 *
 * Every count in this block is DISTINCT PEOPLE over one population — those who
 * loaded a page in the window — except the ones on `GrowthEmails`, which are
 * distinct email ADDRESSES out of the warehouse mirror. The two are labelled
 * separately on the panel and carry separate freshness stamps, because they
 * come from two systems that can be, and currently are, different ages.
 * ------------------------------------------------------------------------ */

export interface GrowthFunnel {
  /** People who loaded a page. The denominator for everything else here. */
  landed: number;
  started: number;
  completed: number;
  emailed: number;
  /** Fractions, 0–1. Null when the stage above them was empty. */
  startRate: number | null;
  completionRate: number | null;
  emailRate: number | null;
  /**
   * People PostHog saw who never recorded a pageview, and so are in none of
   * the four counts above. Mostly ad clicks that left before the page
   * finished loading. Printed on the panel rather than dropped.
   */
  seenWithoutPageview: number;
  /** How many of those still gave an email — the ad-blocked signups. */
  withoutPageviewEmailed: number;
  /**
   * How many of those finished a test, and so are missing from `completed`.
   *
   * Measured rather than assumed, because "the pageview-only population is
   * hiding completers" is the first explanation anyone reaches for when this
   * stage is compared against the warehouse figure, and on this project it is
   * false — it read zero when this was added. A standing number settles that
   * on the page every time it is asked, which a comment saying "it was zero
   * once" would not.
   */
  withoutPageviewCompleted: number;
}

/** One channel, on one side of the paid/organic line. */
export interface GrowthChannelRow {
  channel: string;
  /** True when the first pageview carried `utm_medium=cpc`. */
  paid: boolean;
  landed: number;
  started: number;
  completed: number;
  emailed: number;
  /**
   * The `emailed` figure split by which test they finished, read off the
   * `audience` property of `test_completed` — see the note on `fetchChannels`
   * for why this cannot come from the warehouse mirror.
   *
   * These four decompose `emailed` exactly, and the identity is the reason
   * all four are carried rather than two:
   *
   *   emailed = emailedAdult + emailedChild − emailedBoth + emailedAudienceUnknown
   *
   * `emailedAdult` and `emailedChild` are each counted within their own
   * audience, so somebody who sat the grown-up paper and then their child's is
   * in both and the pair overcounts by `emailedBoth`.
   */
  emailedAdult: number;
  emailedChild: number;
  /** People in BOTH columns above, so the pair sums past `emailed`. */
  emailedBoth: number;
  /**
   * Emailed people with no finished test in the window, so no audience.
   *
   * Carried as its own number so the panel can show them. Dropping them, or
   * sharing them out across the channels that do resolve, would make the split
   * add up by inventing an answer for people who have not given one.
   */
  emailedAudienceUnknown: number;
  startRate: number | null;
  /** Landed to gave-an-email, end to end. */
  signupRate: number | null;
  /** Last event from anyone in this row — how a quiet channel gets noticed. */
  lastActivity: string;
  /**
   * Age of `lastActivity` in seconds, measured server-side against the same
   * clock as the freshness stamps.
   *
   * Computed here rather than in the browser so the whole payload describes one
   * instant. It also keeps the render pure: a `Date.now()` in a component body
   * is a lint error in this codebase, and rightly — the row would silently
   * re-age on every unrelated re-render.
   */
  lastActivityAgeSeconds: number | null;
}

export interface GrowthSideTotals {
  side: "paid" | "organic";
  landed: number;
  started: number;
  completed: number;
  emailed: number;
  signupRate: number | null;
  shareOfTraffic: number | null;
  /** How many channels make up this side. */
  channels: number;
}

/** Deduplicated addresses from the `test_results` warehouse mirror. */
export interface GrowthEmails {
  /**
   * Finished TESTS in the window, one per row of the mirror. NOT people.
   *
   * Named `finishedTests` rather than `completions` because the short word is
   * what caused the trouble: "completions" was read off this page as the
   * number of people who finished the test, and it is not that number in
   * either direction. Someone who retakes the test, or who sits the adult
   * paper and then their child's, is two finished tests and one person; and a
   * finished test that gave no address cannot be attributed to a person at
   * all, so the people behind this figure can only be bounded, never counted.
   * `GrowthFunnel.completed` is the people number.
   */
  finishedTests: number;
  /** Rows carrying an address. Larger than `addresses` when someone repeats. */
  rowsWithEmail: number;
  /** Distinct addresses. The real size of the list. */
  addresses: number;
  adult: number;
  child: number;
  /** Addresses appearing in both audiences, so `adult + child` overcounts. */
  both: number;
}

/** When one of the two sources behind this page was last brought up to date. */
export interface SourceFreshness {
  source: "posthog" | "warehouse";
  /** ISO-8601, or null when it could not be established. */
  at: string | null;
  ageSeconds: number | null;
  /** Unknown counts as stale. Never imply currency that was not verified. */
  stale: boolean;
  note: string;
}

/** A person as they appear in the list, before their journey is loaded. */
export interface PersonSummary {
  personId: string;
  /** Every distinct_id PostHog has for this person. */
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
  /** Set when they finished a test. */
  testId: string | null;
  score: number | null;
  maxScore: number | null;
  answered: number | null;
  timedOut: boolean | null;
  elapsedSeconds: number | null;
  signedUp: boolean;
  /** Pageviews on a `/results/<token>` path. */
  resultsViews: number;
  /** Longest single visit to a results page, seconds. */
  resultsDwellSeconds: number;
  shareEvents: number;
  deadClicks: number;
  /** Email, when a signup row could be matched to this person. */
  email: string | null;
  /**
   * Set when this person is really the same human as another person id. The
   * dashboard never merges them — it labels them.
   */
  linkedTo: PersonLink[];
  /** True for a signup row with no analytics events at all. */
  untracked: boolean;
}

export interface PersonLink {
  personId: string;
  /** How sure we are. Nothing here is a PostHog identity merge. */
  confidence: "strong" | "probable";
  reason: string;
  role: "took the test" | "opened the results";
}

export interface JourneyEvent {
  timestamp: string;
  event: string;
  personId: string;
  sessionId: string;
  path: string;
  /** Short human sentence describing what happened. */
  summary: string;
  /** Extra key/values worth showing inline. */
  detail: Record<string, string | number | boolean | null>;
  /** Seconds since the journey's first event. */
  offsetSeconds: number;
  kind: JourneyEventKind;
}

export type JourneyEventKind =
  | "arrival"
  | "navigation"
  | "test"
  | "question"
  | "signup"
  | "results"
  | "share"
  | "friction"
  | "other";

export interface ResultsVisit {
  personId: string;
  sessionId: string;
  start: string;
  end: string;
  seconds: number;
  events: number;
}

export interface TestAttempt {
  testId: string;
  audience: string;
  grade: number | null;
  score: number;
  maxScore: number;
  answered: number;
  questionTotal: number;
  timedOut: boolean;
  elapsedSeconds: number;
  verdict: string | null;
  /** Decoded from the results URL rather than read off an event. */
  fromToken: boolean;
}

export interface QuestionReview {
  questionIndex: number;
  questionId: string;
  domain: string;
  viewed: number;
  answered: boolean;
  correct: boolean | null;
  dwellMs: number | null;
  changed: boolean | null;
}

export interface ShareAction {
  timestamp: string;
  stage: "initiated" | "completed" | "dismissed" | "failed";
  mechanism: string;
  destination: string;
  step: string | null;
  reason: string | null;
}

export interface Journey {
  person: PersonSummary;
  /** Person ids folded into this journey, including the primary. */
  memberPersonIds: string[];
  links: PersonLink[];
  attempt: TestAttempt | null;
  events: JourneyEvent[];
  resultsVisits: ResultsVisit[];
  questionReview: QuestionReview[];
  shares: ShareAction[];
  /** Seconds between landing and their first deliberate action. */
  timeToFirstActionSeconds: number | null;
  totalDurationSeconds: number | null;
  notes: string[];
}

export interface OverviewPayload {
  range: { from: string; to: string; label: string; granularity: string };
  filtered: boolean;
  tiles: Tiles;
  trend: TrendPoint[];
  sources: SourceRow[];
  rungBreakdown: { rung: AttributionRung; sessions: number }[];
  geo: GeoRow[];
  pages: PageRow[];
  devices: DeviceRow[];
}

export interface PeoplePayload {
  range: { from: string; to: string; label: string };
  filtered: boolean;
  people: PersonSummary[];
  /** Signups in the window with no analytics events at all. */
  untrackedCount: number;
}
