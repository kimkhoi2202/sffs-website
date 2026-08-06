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
