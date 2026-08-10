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
  /**
   * `total` split by whether the person finished or the countdown wrote it.
   * The two add to `total` exactly. See `CompletionAccounting`.
   */
  finished: number;
  abandoned: number;
  /** Of `finished`, how many carry an address. */
  finishedWithEmail: number;
}

/** One finished test. */
export interface TestCompletionRow {
  id: string;
  /** Null when nobody asked for the result by email. Still a real completion. */
  email: string | null;
  testType: string;
  /** "3", "5", "7-8" for children; "adult" for the adult test. */
  gradeBand: string;
  score: number;
  maxScore: number;
  platform: string;
  completedAt: string;
  /** Items answered. `maxScore` is the item count, so the pair is a share. */
  answered: number;
  /** The countdown ended this attempt rather than the person. */
  timedOut: boolean;
  /**
   * The countdown wrote this row for somebody who had already left.
   *
   * Carried per row so the list can mark them rather than making the reader
   * divide two columns in their head. Strictly `timedOut` AND under the share.
   */
  abandoned: boolean;
}

export interface TestResultTotals {
  completions: number;
  adult: number;
  child: number;
  anonymous: number;
  withEmail: number;
}

/* --------------------------------------------------------------------------
 * Finished tests against tests the countdown wrote.
 *
 * A quarter of the rows this dashboard called completions are attempts the
 * clock auto-submitted for somebody who had already left. Adding them to the
 * real finishers and dividing by the address count is what made the page report
 * that half of all finishers decline to give an email.
 *
 * The rule, the evidence for it and the 9 August outage correction are all in
 * lib/dashboard/completion-rule.ts. These are the shapes it produces.
 *
 * NOTHING HERE REPLACES AN EXISTING FIELD. Every count that was on this page
 * before still means exactly what it meant, so the two can be shown side by
 * side and the change can be read rather than taken on trust.
 * ------------------------------------------------------------------------ */

/** Finished against abandoned, with the address counts for each. */
export interface CompletionSplit {
  /** Ended by the person, or by the clock after they had worked the paper. */
  finished: number;
  /** Rows the countdown wrote for somebody who had already gone. */
  abandoned: number;
  finishedWithEmail: number;
  /**
   * Abandonments that carry an address anyway.
   *
   * Not a rounding error: the gate goes up on the auto-submitted results
   * screen, and some people come back to the tab and fill it in. They are real
   * addresses from people who did not finish the test.
   */
  abandonedWithEmail: number;
  /** The headline. `finishedWithEmail / finished`, null on an empty window. */
  finishedEmailRate: number | null;
  /** `abandonedWithEmail / abandoned`. Null on an empty window. */
  abandonedEmailRate: number | null;
}

/**
 * The rule itself, and the two measures it is built from.
 *
 * On the payload rather than in a constant somewhere because a reader of a page
 * that reports completions is entitled to know what the word means on it. The
 * disagreement counts are here for the same reason: `timedOut` and `sparse`
 * are both defensible cuts on their own, they do not pick out the same rows,
 * and the honest thing is to show where they part company rather than to
 * present the chosen one as though it were the only candidate.
 */
export interface CompletionRuleSummary {
  /** Share of items a timed-out attempt must have answered to count as finished. */
  answeredShare: number;
  /** Rows the countdown ended. Necessary for an abandonment, not sufficient. */
  timedOut: number;
  /** Rows under `answeredShare`. Also necessary, also not sufficient. */
  sparse: number;
  /** Rows that are both — the abandonments. */
  both: number;
  /** Beaten by the clock having worked the paper. Counted as finished. */
  timedOutOnly: number;
  /** Submitted deliberately below the share. Counted as finished. */
  sparseOnly: number;
}

/**
 * The hours of total email delivery failure, held out of the rates above.
 *
 * Reported rather than silently excluded. A range of hours disappearing from a
 * denominator with no note on the page is exactly the sort of quiet correction
 * this dashboard refuses to make.
 */
export interface OutageHoldout {
  /** ISO-8601 bounds of the window. Fixed history, never recomputed. */
  from: string;
  to: string;
  /** False when the reporting window does not reach the outage at all. */
  overlaps: boolean;
  /** Finished tests inside it, by the same rule as everything else. */
  finished: number;
  /** How few of those recorded an address. The reason for the hold-out. */
  finishedWithEmail: number;
}

/** Everything the page needs to say what it counted and what it left out. */
export interface CompletionAccounting {
  rule: CompletionRuleSummary;
  /** Every row in the reporting window, split. */
  all: CompletionSplit;
  /** The same split with the delivery outage held out. Lead with this one. */
  corrected: CompletionSplit;
  outage: OutageHoldout;
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

  /* ------------------------------------------------------------------------
   * The completion stage, split. Added alongside `completed`, which still
   * means what it always meant: everyone with a `test_completed`.
   * ---------------------------------------------------------------------- */

  /** Of `completed`, the people who genuinely finished at least one test. */
  finished: number;
  /**
   * People whose ONLY completion was written by the countdown.
   *
   * `finished + abandonedOnly = completed`. Somebody who abandoned once and
   * finished once is a finisher, not both — the rule is applied per attempt
   * and then rolled up to the person by "did any attempt count".
   */
  abandonedOnly: number;
  /** Finishers who gave an address. */
  finishedEmailed: number;
  /**
   * Finishers who gave an address, plus those whose address the 9 August
   * outage swallowed.
   *
   * Measured, not estimated: a person with a `test_email_submitted` inside the
   * outage window and no `email_captured` anywhere in the range demonstrably
   * typed in a valid address and was never recorded as converted. 77 people.
   */
  finishedEmailedCorrected: number;
  /** `finishedEmailed / finished`. Before the outage correction. */
  finishedEmailRate: number | null;
  /** `finishedEmailedCorrected / finished`. The one to lead with. */
  finishedEmailRateCorrected: number | null;
  /** The 77. Zero when the reporting window misses the outage. */
  outageLostConversions: number;
  /**
   * The share of items behind the split above, carried so the panel can print
   * it.
   *
   * Duplicated from `CompletionAccounting.rule` on purpose: that one describes
   * the warehouse mirror and arrives with it, and the mirror can fail while the
   * funnel renders. A funnel that applied a rule must be able to state the rule
   * whether or not the other half of the page loaded.
   */
  answeredShare: number;
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
   * audience, so somebody who sat the adult paper and then their child's is
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
  /**
   * `completed` split, the same way the funnel splits it, so the table and the
   * funnel above it move together. `finished + abandonedOnly = completed`.
   */
  finished: number;
  abandonedOnly: number;
  /**
   * The audience decomposition again, over people with a GENUINE finish.
   *
   * The four `emailed*` fields above decompose `emailed` by any completion,
   * abandonments included; these four decompose it by finished ones only, and
   * satisfy the same identity:
   *
   *   emailed = finishedAdult + finishedChild − finishedBoth + finishedAudienceUnknown
   *
   * Both sets are carried because they answer different questions and the
   * difference between them is the 44 people who left the test and gave an
   * address anyway. `finishedAudienceUnknown` absorbs those, which is why the
   * identity still closes.
   */
  finishedAdult: number;
  finishedChild: number;
  finishedBoth: number;
  finishedAudienceUnknown: number;
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

/* --------------------------------------------------------------------------
 * The channel table, read the other way round.
 *
 * The table answers "for this channel, how many adults and children". This
 * answers "for this audience, which channels bring them", which is the
 * question the numbers actually pose once you notice that the two biggest
 * channels are close to inverted — one is effectively an adults' pipeline and
 * the other a children's, and reading that off fifteen rows means doing the
 * comparison in your head.
 *
 * IT DESCRIBES ONE POPULATION, AND IT IS A NARROW ONE. Every count here is a
 * person who GAVE AN ADDRESS and finished a test. It is not the audience mix
 * of a channel's traffic, and it must never be labelled as one: "TikTok is 69%
 * children" is a claim about everyone TikTok sends, which nobody has measured
 * and this cannot measure. Whether the people who convert look like the people
 * who bounce is exactly the assumption that would be smuggled in.
 * ------------------------------------------------------------------------ */

/** One channel's contribution to one audience. */
export interface AudienceChannelSlice {
  channel: string;
  people: number;
  /** Share of this audience, 0–1. Null when the audience is empty. */
  share: number | null;
  /**
   * True for the pooled tail.
   *
   * Most channels contribute one or two people, and giving each its own row in
   * both columns buries the comparison the panel exists to make under a dozen
   * rows of noise. Pooled rather than dropped: the count still has to be on
   * the page.
   */
  pooled: boolean;
  /** How many channels this row covers — always 1 unless `pooled`. */
  channels: number;
}

export interface GrowthAudienceSplit {
  audience: "adult" | "child";
  /** Emailed people who finished a test of this audience. */
  people: number;
  /**
   * Both audiences carry THE SAME channels in THE SAME order, so the two
   * columns can be read across. A column that ranked its own channels would
   * make the inversion invisible, which is the one thing this panel is for.
   */
  slices: AudienceChannelSlice[];
}

/** The channel table inverted: two audiences, each by channel. */
export interface GrowthAudiences {
  adult: GrowthAudienceSplit;
  child: GrowthAudienceSplit;
  /** Emailed people who finished tests in both audiences — in both columns. */
  both: number;
  /** Emailed people with no finished test — in neither column. */
  neither: number;
  /** The population the two columns are drawn from. */
  emailed: number;
}

export interface GrowthSideTotals {
  side: "paid" | "organic";
  landed: number;
  started: number;
  completed: number;
  /** `completed` split. Summed from the channel rows, never re-queried. */
  finished: number;
  abandonedOnly: number;
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
  /**
   * The same rows, split into finished tests and tests the countdown wrote,
   * with the 9 August outage held out of the corrected rate.
   *
   * `finishedTests` above is unchanged and still counts every row, so the
   * panel can show the old figure and the split beside each other. The number
   * to lead with is `accounting.corrected.finishedEmailRate`.
   */
  accounting: CompletionAccounting;
}

/**
 * How a source's age should be read.
 *
 * ===========================================================================
 * "NOTHING HAPPENED" AND "NOTHING IS WORKING" ARE OPPOSITE CONDITIONS
 * ===========================================================================
 * This used to be a boolean, and the boolean could not tell them apart. The
 * warehouse stamp reported an age and called anything past the cadence stale,
 * which is right for a dead exporter and wrong for a quiet evening — and the
 * quiet evening is the common case. It fired on 10 August over three runs that
 * had all succeeded, and the owner was told his pipeline had failed. It had
 * not. See the freshness section of lib/dashboard/growth.ts for the mechanism.
 *
 *   current   The source published something inside its own cadence. Nothing
 *             to argue about: it demonstrably ran, and it demonstrably had
 *             something to say.
 *   idle      The source has published nothing for longer than its cadence,
 *             and nothing is overdue — either nothing has qualified for
 *             export, or what has is not yet due at the next scheduled run.
 *             The figures carry everything the dashboard can see. This is NOT
 *             stale, and colouring it as though it were is the defect above.
 *   stalled   Work is outstanding and has missed a scheduled run, or the age
 *             could be established but the outstanding work could not be. The
 *             figures are behind and the reader must not act on them.
 *   unknown   The age itself could not be established. Counts as stale: the
 *             one thing this page may never do is imply a number is current
 *             because it failed to find out whether it was.
 */
export type FreshnessState = "current" | "idle" | "stalled" | "unknown";

/**
 * What the hourly mirror has not carried across yet, and how long it has had.
 *
 * ===========================================================================
 * WHY THIS EXISTS AT ALL
 * ===========================================================================
 * The mirror's timestamp only advances when the exported CONTENT changes — the
 * export skips the upload when the snapshot it built is byte-identical to the
 * one already there. So the timestamp alone cannot separate a stopped export
 * from a quiet hour, and reading it as liveness is what produced a false alarm.
 *
 * The separator is a second, independent witness: PostHog's own event stream,
 * which is live within seconds and records a `test_completed` for every
 * completion Aurora receives. If PostHog has seen nothing the mirror lacks,
 * the mirror is caught up whatever its timestamp says. If PostHog has seen
 * completions the mirror has not carried across a full scheduled run, the
 * export really is behind — and that is true no matter how recently it last
 * managed to publish.
 *
 * IT IS A WITNESS, NOT A LEDGER. The export's filters live on the Aurora row
 * (`synthetic`, `internal`) and PostHog's live in project settings; they are
 * different rule sets over different systems and they do not pick out exactly
 * the same humans. So `outstanding` is the count of completions PostHog
 * recorded and the mirror does not carry — which is what the panel says, word
 * for word — rather than a claim about what the exporter owes.
 */
export interface MirrorBacklog {
  /**
   * The newest completion the mirror actually carries.
   *
   * The mirror's high-water mark, and the honest anchor for "how current are
   * the figures below" — the content-change time is only when the export last
   * had something to write, which is always later and answers a different
   * question.
   */
  newestRowAt: string | null;
  /** Qualifying completions PostHog recorded after `newestRowAt`. */
  outstanding: number;
  /** The oldest of those: the one that has waited longest for a run. */
  oldestOutstandingAt: string | null;
  oldestOutstandingAgeSeconds: number | null;
  /**
   * Whether the witness could be consulted at all.
   *
   * False when the event stream or the high-water mark could not be read, and
   * the verdict then falls back to treating unchanged content as stale. Doubt
   * resolves towards the alarm, never away from it — a freshness indicator
   * that goes quiet when its own inputs fail is worse than none.
   */
  witnessed: boolean;
}

/** When one of the two sources behind this page was last brought up to date. */
export interface SourceFreshness {
  source: "posthog" | "warehouse";
  /** ISO-8601, or null when it could not be established. */
  at: string | null;
  ageSeconds: number | null;
  /**
   * Whether the reader must discount the figures this source feeds.
   *
   * Exactly `state === "stalled" || state === "unknown"`. Kept alongside
   * `state` because it is the question every consumer actually asks, and
   * because an `idle` source answering `true` here is the whole defect.
   */
  stale: boolean;
  state: FreshnessState;
  note: string;
  /**
   * The evidence behind an `idle` or `stalled` verdict.
   *
   * Null on the PostHog stamp, which has no mirror behind it and needs no
   * witness: its own answer carries the moment it was computed.
   */
  backlog: MirrorBacklog | null;
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
