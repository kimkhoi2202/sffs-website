import "server-only";

import { hogql, sqlString } from "./posthog-query";
import { readResultToken, tokenFromPath } from "./identity";
import type { Human } from "./funnel";
import type {
  JourneyEvent,
  JourneyEventKind,
  QuestionReview,
  ResultsVisit,
  ShareAction,
  TestAttempt,
} from "./types";

/**
 * One human's session, end to end.
 *
 * This is the view the whole dashboard is weighted around. At five external
 * completions and a dozen abandoners, being able to read one Reddit visitor's
 * arrival, their fifty questions, their score and the nineteen minutes they
 * then spent on their results page is worth more than any sparkline. The tiles
 * are context; this is the product.
 */

interface RawEvent {
  ts: string;
  person_id: string;
  event: string;
  session_id: string;
  path: string;
  url: string;
  referrer: string;
  utm_source: string;
  question_index: string;
  question_total: string;
  question_id: string;
  question_domain: string;
  correct: string;
  dwell_ms: string;
  changed: string;
  test_id: string;
  audience: string;
  grade: string;
  score: string;
  max_score: string;
  answered: string;
  elapsed_s: string;
  timed_out: string;
  verdict: string;
  mechanism: string;
  destination: string;
  step: string;
  reason: string;
  source: string;
  fork: string;
  depth_pct: string;
  section_name: string;
  server_side: string;
}

const num = (v: string | undefined): number | null => {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const bool = (v: string | undefined): boolean | null =>
  v === undefined || v === "" ? null : v.toLowerCase() === "true";
const parseTs = (value: string): number =>
  Date.parse(value.includes("T") ? value : `${value.replace(" ", "T")}Z`);

/**
 * The events that make up a journey.
 *
 * Deliberately NOT filtered by the internal rules: once you are looking at one
 * named person, hiding half their stream because the browser was flagged would
 * be actively misleading. The filter belongs on who appears in the list, not on
 * what a person did.
 */
async function fetchEvents(personIds: string[], fromIso: string): Promise<RawEvent[]> {
  const ids = personIds.map((id) => sqlString(id)).join(", ");
  return hogql<RawEvent>(`
    SELECT
      toString(timestamp) AS ts,
      toString(person_id) AS person_id,
      event,
      coalesce(toString(properties.$session_id), '') AS session_id,
      coalesce(toString(properties.$pathname), '') AS path,
      coalesce(toString(properties.$current_url), '') AS url,
      coalesce(toString(properties.$referrer), '') AS referrer,
      coalesce(toString(properties.utm_source), '') AS utm_source,
      coalesce(toString(properties.question_index), '') AS question_index,
      coalesce(toString(properties.question_total), '') AS question_total,
      coalesce(toString(properties.question_id), '') AS question_id,
      coalesce(toString(properties.question_domain), '') AS question_domain,
      coalesce(toString(properties.correct), '') AS correct,
      coalesce(toString(properties.dwell_ms), '') AS dwell_ms,
      coalesce(toString(properties.changed), '') AS changed,
      coalesce(toString(properties.test_id), '') AS test_id,
      coalesce(toString(properties.audience), '') AS audience,
      coalesce(toString(properties.grade), '') AS grade,
      coalesce(toString(properties.score), '') AS score,
      coalesce(toString(properties.max_score), '') AS max_score,
      coalesce(toString(properties.answered), '') AS answered,
      coalesce(toString(properties.elapsed_s), '') AS elapsed_s,
      coalesce(toString(properties.timed_out), '') AS timed_out,
      coalesce(toString(properties.verdict), '') AS verdict,
      coalesce(toString(properties.mechanism), '') AS mechanism,
      coalesce(toString(properties.destination), '') AS destination,
      coalesce(toString(properties.step), '') AS step,
      coalesce(toString(properties.reason), '') AS reason,
      coalesce(toString(properties.source), '') AS source,
      coalesce(toString(properties.fork), '') AS fork,
      coalesce(toString(properties.depth_pct), '') AS depth_pct,
      coalesce(toString(properties.section_name), '') AS section_name,
      coalesce(toString(properties.server_side), '') AS server_side
    FROM events
    WHERE person_id IN (${ids})
      AND timestamp >= toDateTime(${sqlString(fromIso.replace("T", " ").replace("Z", ""))})
      AND timestamp < now()
    ORDER BY timestamp
    LIMIT 3000`);
}

/** Events that are noise on a timeline: high-frequency, low-information. */
const MUTED = new Set(["$web_vitals", "$autocapture", "$set", "$opt_in", "survey shown"]);

function kindFor(event: string): JourneyEventKind {
  if (event === "$pageview" || event === "$pageleave") return "navigation";
  if (event.startsWith("question_")) return "question";
  if (event.startsWith("test_result_share")) return "share";
  if (event === "results_link_opened" || event === "test_email_sent") return "results";
  if (event.startsWith("email_") || event === "test_email_submitted") return "signup";
  if (event.startsWith("test_")) return "test";
  if (event === "$dead_click" || event === "$rageclick" || event === "$exception")
    return "friction";
  return "other";
}

const secs = (n: number): string => {
  const s = Math.max(0, Math.round(n));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return r ? `${m}m ${r}s` : `${m}m`;
};

/**
 * A results token is two hundred characters of base64 and says nothing to a
 * reader; it belongs in the decoded attempt above, not in a timeline row.
 */
function shortPath(path: string): string {
  if (path.startsWith("/results/")) return "/results/…";
  if (path.startsWith("/beat/")) return "/beat/…";
  return path || "/";
}

/** A plain sentence per event, so the timeline reads rather than decodes. */
function summarise(e: RawEvent): string {
  const qi = num(e.question_index);
  const qt = num(e.question_total);
  switch (e.event) {
    case "$pageview":
      return e.path.startsWith("/results/")
        ? "Opened their results page"
        : `Viewed ${shortPath(e.path)}`;
    case "$pageleave":
      return `Left ${shortPath(e.path)}`;
    case "test_cta_activated":
      return "Pressed the take-the-test call to action";
    case "test_fork_selected":
      return `Chose the ${e.fork || "?"} path`;
    case "test_audience_selected":
      return `Picked the ${e.audience || "?"} test`;
    case "test_grade_selected":
      return `Picked grade ${e.grade || "?"}`;
    case "test_step_viewed":
      return `Reached the ${e.step || "?"} step`;
    case "test_started":
      return `Started the ${e.audience || e.test_id || "?"} test`;
    case "question_viewed":
      return `Saw question ${qi ?? "?"} of ${qt ?? "?"}${e.question_domain ? ` (${e.question_domain})` : ""}`;
    case "question_answered": {
      const right = bool(e.correct);
      const dwell = num(e.dwell_ms);
      const parts = [`Answered question ${qi ?? "?"}`];
      if (right !== null) parts.push(right ? "correctly" : "incorrectly");
      if (dwell !== null) parts.push(`after ${secs(dwell / 1000)}`);
      if (bool(e.changed)) parts.push("(changed their mind)");
      return parts.join(" ");
    }
    case "test_timed_out":
      return `Ran out of time on question ${qi ?? "?"} with ${num(e.answered) ?? "?"} answered`;
    case "test_quit":
      return `Quit at question ${qi ?? "?"} with ${num(e.answered) ?? "?"} answered`;
    case "test_restarted":
      return "Restarted the test";
    case "test_completed":
      return `Finished: ${num(e.score) ?? "?"}/${num(e.max_score) ?? "?"}, ${num(e.answered) ?? "?"} answered in ${secs(num(e.elapsed_s) ?? 0)}${bool(e.timed_out) ? " — clock ran out" : ""}`;
    case "test_results_gate_viewed":
      return "Saw the email gate";
    case "email_form_viewed":
      return "Saw the email form";
    case "email_field_focused":
      return "Tapped into the email field";
    case "email_capture_started":
      return "Started typing an email";
    case "test_email_submitted":
      return "Submitted their email for results";
    case "email_capture_submitted":
      return "Submitted the email form";
    case "email_capture_validation_failed":
      return `Email rejected (${e.reason || "invalid"})`;
    case "email_captured":
      return bool(e.server_side)
        ? "Signup recorded server-side (ad-blocker-proof copy)"
        : `Signed up (${e.source || "unknown form"})`;
    case "test_email_sent":
      return "Results email sent";
    case "test_email_send_failed":
      return "Results email failed to send";
    case "test_resend_requested":
      return "Asked for the results email again";
    case "results_link_opened":
      return "Followed the link from their inbox";
    case "test_result_share_initiated":
      return `Opened a share — ${e.destination || e.mechanism || "?"}${e.step ? ` (${e.step})` : ""}`;
    case "test_result_share_completed":
      return `Share completed — ${e.destination || e.mechanism || "?"}${e.step ? ` (${e.step})` : ""}`;
    case "test_result_share_dismissed":
      return `Backed out of the share sheet — ${e.destination || e.mechanism || "?"}`;
    case "test_result_share_failed":
      return `Share failed — ${e.destination || e.mechanism || "?"} (${e.reason || "unknown"})`;
    case "test_challenge_viewed":
      return "Someone opened the challenge they shared";
    case "attribution_survey_shown":
      return "Saw the how-did-you-find-us card";
    case "attribution_survey_answered":
      return `Said they found us via ${e.source || "?"}`;
    case "attribution_survey_dismissed":
      return "Skipped the how-did-you-find-us card";
    case "$dead_click":
      return "Pressed something that did nothing (dead click)";
    case "$dead_swipe":
      return "Swiped somewhere that did not scroll";
    case "$rageclick":
      return "Rage-clicked";
    case "$exception":
      return "Hit a JavaScript error";
    case "scroll_depth_reached":
      return `Scrolled to ${num(e.depth_pct) ?? "?"}%`;
    case "scrolled_to_bottom":
      return "Scrolled to the bottom";
    case "section_viewed":
      return `Read the ${e.section_name || "?"} section`;
    default:
      return e.event;
  }
}

function detailFor(e: RawEvent): Record<string, string | number | boolean | null> {
  const detail: Record<string, string | number | boolean | null> = {};
  const put = (k: string, v: string | number | boolean | null) => {
    if (v !== null && v !== "" && v !== undefined) detail[k] = v;
  };
  put("mechanism", e.mechanism);
  put("destination", e.destination);
  put("step", e.step);
  put("reason", e.reason);
  put("domain", e.question_domain);
  put("dwell_ms", num(e.dwell_ms));
  put("correct", bool(e.correct));
  put("referrer", e.referrer);
  put("utm_source", e.utm_source);
  return detail;
}

export interface JourneyResult {
  attempt: TestAttempt | null;
  events: JourneyEvent[];
  resultsVisits: ResultsVisit[];
  questionReview: QuestionReview[];
  shares: ShareAction[];
  timeToFirstActionSeconds: number | null;
  totalDurationSeconds: number | null;
  notes: string[];
  mutedCount: number;
}

export async function buildJourney(human: Human): Promise<JourneyResult> {
  const personIds = human.members.map((m) => m.personId).filter((id) => !id.startsWith("signup:"));
  const notes: string[] = [];

  if (personIds.length === 0) {
    notes.push(
      "PostHog holds no events at all for this person. Everything shown here comes from the signup row in the product database — they took the test and were emailed their results, but the analytics library never loaded, so none of it was recorded.",
    );
    return {
      attempt: null,
      events: [],
      resultsVisits: [],
      questionReview: [],
      shares: [],
      timeToFirstActionSeconds: null,
      totalDurationSeconds: null,
      notes,
      mutedCount: 0,
    };
  }

  const earliest = human.members.reduce(
    (acc, m) => Math.min(acc, parseTs(m.firstSeen)),
    Number.POSITIVE_INFINITY,
  );
  const fromIso = new Date(earliest - 60_000).toISOString();
  const raw = await fetchEvents(personIds, fromIso);

  const kept = raw.filter((e) => !MUTED.has(e.event));
  const mutedCount = raw.length - kept.length;
  const t0 = kept.length ? parseTs(kept[0].ts) : 0;

  const events: JourneyEvent[] = kept.map((e) => ({
    timestamp: new Date(parseTs(e.ts)).toISOString(),
    event: e.event,
    personId: e.person_id,
    sessionId: e.session_id,
    path: e.path,
    summary: summarise(e),
    detail: detailFor(e),
    offsetSeconds: Math.round((parseTs(e.ts) - t0) / 1000),
    kind: kindFor(e.event),
  }));

  /* ---- The attempt: prefer the token, because it is the ground truth ---- */
  let attempt: TestAttempt | null = null;
  const resultsPath = kept.find(
    (e) => e.event === "$pageview" && e.path.startsWith("/results/"),
  );
  if (resultsPath) {
    const token = tokenFromPath(resultsPath.path);
    const decoded = token ? readResultToken(token) : null;
    if (decoded) {
      attempt = {
        testId: decoded.testId,
        audience: decoded.audience,
        grade: decoded.grade,
        score: decoded.score,
        maxScore: decoded.maxScore,
        answered: decoded.answered,
        questionTotal: decoded.questionTotal,
        timedOut: decoded.timedOut,
        elapsedSeconds: decoded.elapsedSeconds,
        verdict: decoded.verdict,
        fromToken: true,
      };
      if (!decoded.signatureVerified) {
        notes.push(
          "The results link was read without verifying its signature (RESULTS_TOKEN_SECRET was unavailable to this deployment). The numbers below come from the link itself.",
        );
      }
    }
  }
  if (!attempt) {
    const completed = kept.find((e) => e.event === "test_completed");
    if (completed) {
      attempt = {
        testId: completed.test_id,
        audience: completed.audience,
        grade: num(completed.grade) as TestAttempt["grade"],
        score: num(completed.score) ?? 0,
        maxScore: num(completed.max_score) ?? 0,
        answered: num(completed.answered) ?? 0,
        questionTotal: num(completed.question_total) ?? num(completed.max_score) ?? 0,
        timedOut: bool(completed.timed_out) ?? false,
        elapsedSeconds: num(completed.elapsed_s) ?? 0,
        verdict: completed.verdict || null,
        fromToken: false,
      };
    }
  }

  /* ---- Results visits, segmented by page load -------------------------- */
  /*
    A new `$pageview` on a results path opens a new visit; everything after it
    on that path belongs to that visit until the next one.

    Grouping by session instead would be wrong in the case that matters most:
    one real visitor read her results for nineteen minutes and then opened them
    again, and because she was active throughout, PostHog never rolled the
    session over. By session that is one visit. By page load it is two, which is
    what happened.
  */
  const resultsVisits: ResultsVisit[] = [];
  let current: { visit: ResultsVisit; last: number } | null = null;
  for (const e of kept) {
    const onResults = e.path.startsWith("/results/");
    if (!onResults) continue;
    const at = parseTs(e.ts);
    if (e.event === "$pageview" || !current || current.visit.personId !== e.person_id) {
      current = {
        visit: {
          personId: e.person_id,
          sessionId: e.session_id,
          start: new Date(at).toISOString(),
          end: new Date(at).toISOString(),
          seconds: 0,
          events: 1,
        },
        last: at,
      };
      resultsVisits.push(current.visit);
    } else {
      current.visit.events += 1;
      current.visit.end = new Date(at).toISOString();
      current.visit.seconds = Math.round((at - Date.parse(current.visit.start)) / 1000);
      current.last = at;
    }
  }

  /* ---- Question-by-question ------------------------------------------- */
  const questions = new Map<number, QuestionReview>();
  for (const e of kept) {
    if (e.event !== "question_viewed" && e.event !== "question_answered") continue;
    const index = num(e.question_index);
    if (index === null) continue;
    const existing = questions.get(index) ?? {
      questionIndex: index,
      questionId: e.question_id,
      domain: e.question_domain,
      viewed: 0,
      answered: false,
      correct: null,
      dwellMs: null,
      changed: null,
    };
    if (e.event === "question_viewed") existing.viewed += 1;
    if (e.event === "question_answered") {
      existing.answered = true;
      existing.correct = bool(e.correct);
      existing.dwellMs = num(e.dwell_ms);
      existing.changed = bool(e.changed);
    }
    questions.set(index, existing);
  }
  const questionReview = [...questions.values()].sort(
    (a, b) => a.questionIndex - b.questionIndex,
  );

  /* ---- Sharing --------------------------------------------------------- */
  const shares: ShareAction[] = kept
    .filter((e) => e.event.startsWith("test_result_share"))
    .map((e) => ({
      timestamp: new Date(parseTs(e.ts)).toISOString(),
      stage: e.event.replace("test_result_share_", "") as ShareAction["stage"],
      mechanism: e.mechanism,
      destination: e.destination,
      step: e.step || null,
      reason: e.reason || null,
    }));

  /* ---- Timings --------------------------------------------------------- */
  const firstAction = kept.find((e) =>
    ["test_cta_activated", "test_fork_selected", "test_audience_selected", "test_started"].includes(
      e.event,
    ),
  );
  const timeToFirstActionSeconds = firstAction
    ? Math.round((parseTs(firstAction.ts) - t0) / 1000)
    : null;
  const totalDurationSeconds = kept.length
    ? Math.round((parseTs(kept[kept.length - 1].ts) - t0) / 1000)
    : null;

  /* ---- Honest notes ---------------------------------------------------- */
  if (human.members.length > 1) {
    notes.push(
      `PostHog holds ${human.members.length} separate people here. They are shown together because the evidence says they are one human, and they are still listed individually below — nothing has been merged in PostHog.`,
    );
  }
  const deadClicks = kept.filter((e) => e.event === "$dead_click").length;
  if (deadClicks > 0) {
    notes.push(
      `${deadClicks} dead click${deadClicks === 1 ? "" : "s"} — a press that hit nothing. Worth checking against the share control, which registered exactly this before it was fixed.`,
    );
  }
  if (attempt?.timedOut) {
    notes.push(
      `The clock beat them: ${attempt.answered} of ${attempt.questionTotal} answered when time ran out. That is an engaged session, not a bounce.`,
    );
  }

  return {
    attempt,
    events,
    resultsVisits,
    questionReview,
    shares,
    timeToFirstActionSeconds,
    totalDurationSeconds,
    notes,
    mutedCount,
  };
}
