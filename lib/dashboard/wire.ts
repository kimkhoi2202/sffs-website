import type { AttributionRung } from "./attribution";
import type {
  DeviceRow,
  GeoRow,
  GrowthAudiences,
  GrowthChannelRow,
  GrowthEmails,
  GrowthFunnel,
  GrowthSideTotals,
  PageRow,
  SourceFreshness,
  SourceRow,
  TestCompletionRow,
  TestPlatformRow,
  TestResultTotals,
  Tiles,
  TrendPoint,
} from "./types";

/** The exact shapes the data route sends. Imported by both sides of the wire. */

export type Outcome =
  | "completed"
  | "completed_timed_out"
  | "abandoned_quit"
  | "abandoned_timed_out"
  | "abandoned_silent"
  | "never_started"
  | "untracked";

export interface WireLink {
  personId: string;
  confidence: "strong" | "probable";
  reason: string;
  role: "took the test" | "opened the results";
}

export interface WireHuman {
  id: string;
  personIds: string[];
  email: string | null;
  untracked: boolean;
  headline: string;
  firstSeen: string;
  lastSeen: string;
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
  outcome: Outcome;
  audience: string | null;
  testId: string | null;
  score: number | null;
  maxScore: number | null;
  answered: number | null;
  timedOut: boolean;
  elapsedSeconds: number | null;
  verdict: string | null;
  furthestQuestion: number;
  questionsAnswered: number;
  questionTotal: number;
  landed: boolean;
  ctaActivated: boolean;
  startedTest: boolean;
  reachedGate: boolean;
  submittedEmail: boolean;
  openedResults: boolean;
  resultsOpens: number;
  resultsDwellSeconds: number;
  resultsTotalSeconds: number;
  events: number;
  pageviews: number;
  sessions: number;
  shareEvents: number;
  shareDestinations: string[];
  deadClicks: number;
  links: WireLink[];
}

export interface WireFunnelStage {
  id: string;
  label: string;
  hint: string;
  count: number;
  droppedFromPrevious: number;
  conversionFromPrevious: number | null;
  droppedHumanIds: string[];
  reachedHumanIds: string[];
}

export interface WireAbandonSummary {
  testId: string;
  questionTotal: number;
  starters: number;
  finishers: number;
  timedOutFinishers: number;
  timedOutAbandoners: number;
  quitters: number;
  silentAbandoners: number;
  medianAbandonQuestion: number | null;
  points: { question: number; humans: number; humanIds: string[] }[];
}

export interface PeopleResponse {
  range: WireRange;
  filtered: boolean;
  humans: WireHuman[];
  funnel: WireFunnelStage[];
  abandonment: WireAbandonSummary[];
  error: string | null;
}

export interface WireRange {
  from: string;
  to: string;
  label: string;
  granularity: string;
}

export interface TilesResponse {
  range: WireRange;
  filtered: boolean;
  tiles: Tiles | null;
  error: string | null;
}

export interface TrafficResponse {
  range: WireRange;
  filtered: boolean;
  trend?: TrendPoint[];
  sources?: SourceRow[];
  rungBreakdown?: { rung: AttributionRung; sessions: number }[];
  geo?: GeoRow[];
  pages?: PageRow[];
  devices?: DeviceRow[];
  error: string | null;
}

export interface TestResultsResponse {
  range: WireRange;
  filtered: boolean;
  platforms?: TestPlatformRow[];
  completions?: TestCompletionRow[];
  totals?: TestResultTotals;
  error: string | null;
}

export interface GrowthResponse {
  range: WireRange;
  filtered: boolean;
  funnel?: GrowthFunnel;
  channels?: GrowthChannelRow[];
  sides?: GrowthSideTotals[];
  /** The channel table inverted: each audience by the channels that bring it. */
  audiences?: GrowthAudiences;
  /** Null when the warehouse half failed; `warehouseError` says why. */
  emails?: GrowthEmails | null;
  warehouseError?: string | null;
  freshness?: { posthog: SourceFreshness; warehouse: SourceFreshness };
  error: string | null;
}

export interface WireJourneyEvent {
  timestamp: string;
  event: string;
  personId: string;
  sessionId: string;
  path: string;
  summary: string;
  detail: Record<string, string | number | boolean | null>;
  offsetSeconds: number;
  kind: string;
}

export interface JourneyResponse {
  human: WireHuman;
  attempt: {
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
    fromToken: boolean;
  } | null;
  events: WireJourneyEvent[];
  resultsVisits: {
    personId: string;
    sessionId: string;
    start: string;
    end: string;
    seconds: number;
    events: number;
  }[];
  questionReview: {
    questionIndex: number;
    questionId: string;
    domain: string;
    viewed: number;
    answered: boolean;
    correct: boolean | null;
    dwellMs: number | null;
    changed: boolean | null;
  }[];
  shares: {
    timestamp: string;
    stage: string;
    mechanism: string;
    destination: string;
    step: string | null;
    reason: string | null;
  }[];
  timeToFirstActionSeconds: number | null;
  totalDurationSeconds: number | null;
  notes: string[];
  mutedCount: number;
}

export const OUTCOME_LABEL: Record<Outcome, string> = {
  completed: "Completed",
  completed_timed_out: "Completed — timed out",
  abandoned_quit: "Quit",
  abandoned_timed_out: "Timed out, never finished",
  abandoned_silent: "Walked away",
  never_started: "Never started",
  untracked: "Untracked",
};

export const OUTCOME_TINT: Record<Outcome, string> = {
  completed: "bg-mint",
  completed_timed_out: "bg-mint",
  abandoned_quit: "bg-coral",
  abandoned_timed_out: "bg-yellow",
  abandoned_silent: "bg-coral",
  never_started: "bg-gray-100",
  untracked: "bg-blue",
};
