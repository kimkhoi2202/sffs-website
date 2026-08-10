import "server-only";

import type { PersonRow } from "./people";
import type { PersonLink } from "./types";

/**
 * The funnel, and — the part that matters — who fell out of it.
 *
 * ===========================================================================
 * WHY THIS IS DERIVED AND NOT QUERIED
 * ===========================================================================
 * Every stage below is computed from the SAME person rows the people list is
 * built from. Not for speed: so the two cannot disagree. A funnel that says
 * "six people abandoned" while the list underneath it shows five is worse than
 * no funnel, and separately-queried aggregates drift apart the first time a
 * filter changes on one side only.
 *
 * ===========================================================================
 * WHY IT COUNTS HUMANS, NOT POSTHOG PERSONS
 * ===========================================================================
 * Opening an emailed results link mints a fresh anonymous id, so the last stage
 * of the funnel usually belongs to a DIFFERENT PostHog person than the first
 * six. Counted naively, every completer looks like two people: one who started
 * and never opened their results, and one who arrived from nowhere and opened
 * results without ever taking a test. Both halves are wrong. So linked persons
 * are folded into one human first — labelled, never silently — and the funnel
 * counts humans.
 */

export type FunnelStageId =
  | "landed"
  | "cta"
  | "started"
  | "engaged"
  | "gate"
  | "submitted"
  | "opened";

export interface FunnelStage {
  id: FunnelStageId;
  label: string;
  hint: string;
  count: number;
  /** How many were lost between the previous stage and this one. */
  droppedFromPrevious: number;
  /** Share of the previous stage that carried on, 0–1. */
  conversionFromPrevious: number | null;
  /** Humans who reached this stage and went no further. Clickable. */
  droppedHumanIds: string[];
  /** Humans who reached this stage at all. */
  reachedHumanIds: string[];
  /**
   * How many of `count` arrived on a deep entry URL and never saw the fork.
   *
   * On the `cta` stage this is the difference between a rate that means
   * something and one that does not — see the note on that stage below. It is
   * computed for every stage because the same split is worth having further
   * down (do deep-linked visitors finish at the same rate?), and because a
   * field that exists only on one row is a field somebody will misread.
   */
  deepLinkedCount: number;
}

/** One human, possibly stitched from more than one PostHog person. */
export interface Human {
  id: string;
  primary: PersonRow;
  members: PersonRow[];
  links: PersonLink[];
  /** Merged funnel facts across every member. */
  landed: boolean;
  ctaActivated: boolean;
  /** Any member arrived on a deep entry URL rather than through the fork. */
  deepLinked: boolean;
  startedTest: boolean;
  answeredAny: boolean;
  reachedGate: boolean;
  submittedEmail: boolean;
  submittedTestEmail: boolean;
  openedResults: boolean;
  furthestQuestion: number;
  questionsAnswered: number;
  questionTotal: number;
  resultsOpens: number;
  resultsDwellSeconds: number;
  resultsTotalSeconds: number;
  email: string | null;
  untracked: boolean;
}

/**
 * Fold linked persons together.
 *
 * The link edges come from `identity.ts`, which only ever draws one when a
 * results token decodes to an attempt that a recorded completion matches on
 * test, score, answered count and time. Union-find rather than a single pass,
 * because a human can in principle be three persons — quiz, results open on
 * the phone, results open again on a laptop — and a chain must collapse to one.
 */
export function groupIntoHumans(people: PersonRow[]): Human[] {
  const parent = new Map<string, string>();
  const find = (id: string): string => {
    let root = id;
    while (parent.get(root) && parent.get(root) !== root) root = parent.get(root)!;
    return root;
  };
  const union = (a: string, b: string) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(rb, ra);
  };

  for (const p of people) parent.set(p.personId, p.personId);
  for (const p of people) {
    for (const link of p.links) {
      if (parent.has(link.personId)) union(p.personId, link.personId);
    }
  }

  const groups = new Map<string, PersonRow[]>();
  for (const p of people) {
    const root = find(p.personId);
    const list = groups.get(root) ?? [];
    list.push(p);
    groups.set(root, list);
  }

  return [...groups.values()].map(buildHuman);
}

function buildHuman(members: PersonRow[]): Human {
  // The richest member leads: the one who actually took the test if there is
  // one, because that half carries the source, the geography and the score.
  const primary =
    members.find((m) => m.startedTest) ??
    members.find((m) => m.pageviews > 0) ??
    members[0];

  const any = (pick: (m: PersonRow) => boolean) => members.some(pick);
  const maxOf = (pick: (m: PersonRow) => number) =>
    members.reduce((acc, m) => Math.max(acc, pick(m)), 0);
  const sumOf = (pick: (m: PersonRow) => number) =>
    members.reduce((acc, m) => acc + pick(m), 0);

  return {
    id: primary.personId,
    primary,
    members,
    links: members.flatMap((m) => m.links),
    landed: any((m) => m.landed),
    ctaActivated: any((m) => m.ctaActivated || m.startedTest),
    // `any`, not "the primary member", because the deep link is a fact about
    // how the human arrived and it belongs to whichever person id carried the
    // landing session. The results-page person id, minted later on a different
    // URL, will not have it.
    deepLinked: any((m) => m.deepLinked),
    startedTest: any((m) => m.startedTest),
    answeredAny: maxOf((m) => m.questionsAnswered) > 0,
    reachedGate: any((m) => m.reachedGate),
    submittedEmail: any((m) => m.submittedEmail || m.signedUp),
    submittedTestEmail: any((m) => m.submittedTestEmail),
    openedResults: any((m) => m.resultsOpens > 0 || m.resultsViews > 0),
    furthestQuestion: maxOf((m) => m.furthestQuestion),
    questionsAnswered: maxOf((m) => m.questionsAnswered),
    questionTotal: maxOf((m) => m.questionTotal),
    // Visits, not events: `resultsViews` is already distinct sessions.
    resultsOpens: sumOf((m) => m.resultsViews),
    resultsDwellSeconds: maxOf((m) => m.resultsDwellSeconds),
    resultsTotalSeconds: sumOf((m) => m.resultsTotalSeconds),
    email: members.find((m) => m.email)?.email ?? null,
    untracked: any((m) => m.untracked),
  };
}

const STAGES: {
  id: FunnelStageId;
  label: string;
  hint: string;
  reached: (h: Human) => boolean;
}[] = [
  {
    id: "landed",
    label: "Landed on the site",
    // Any event, not just a $pageview: about a third of real arrivals reach
    // PostHog with the pageview missing and only a $pageleave or a
    // section_viewed surviving, because something ate the first capture.
    hint: "Any event at all — a pageview can be blocked while a pageleave still lands",
    reached: (h) => h.landed,
  },
  /*
    THE FIRST STAGE THAT MEANS ANYTHING, AND IT USED TO BE MIS-NAMED.

    "Landed" and "reached the fork" are the same event in disguise. The test IS
    the homepage now, so `test_step_viewed step=audience` fires passively on
    page load — nobody presses anything to arrive at the fork. Counting that as
    a funnel step makes bouncers look like engaged visitors, which is how
    "answered a question" ends up LOWER than "reached the fork".

    Choosing a branch is the first moment a person deliberately does something,
    so it is the first honest measurement of intent, and it is where the largest
    single loss in the funnel actually happens.

    The old label said "Activated the test" and the old hint named
    `test_cta_activated`. That event is RETIRED — it last fired on 24 July, when
    the take-the-test call to action was deleted along with the old homepage. It
    stays in the predicate only so that pre-cutover windows still read correctly;
    on any window since launch it contributes nothing, and naming it in the UI
    invited people to look for a button that no longer exists.

    ------------------------------------------------------------------------
    SINCE DEEP ENTRY, TWO POPULATIONS REACH THIS ROW AND ONLY ONE SAW THE FORK
    ------------------------------------------------------------------------
    Paid traffic can now land on /adult or /kids and open inside a branch. Those
    visitors fire `test_fork_selected` with `method: "deep_link"` — they did
    choose a branch, by choosing which ad to tap — so they belong on this row
    and the funnel has no phantom gap. What they did NOT do is survive the fork
    screen, because they were never shown it.

    That makes "Landed -> Chose a branch" a BLEND the moment the ads start, and
    a blend is exactly the shape of number that quietly improves while nothing
    gets better. So `deepLinkedCount` travels with every stage and the panel
    prints the split on this row. Do not delete it and leave the rate: the whole
    reason the entry URLs exist is that 91.8% of paid traffic was dying here,
    and that measurement has to survive its own fix.
  */
  {
    id: "cta",
    label: "Chose a branch",
    hint: "test_fork_selected — a tap on the fork, or an ad that named the branch",
    reached: (h) => h.ctaActivated,
  },
  {
    id: "started",
    label: "Started a test",
    hint: "test_started",
    reached: (h) => h.startedTest,
  },
  {
    id: "engaged",
    label: "Answered a question",
    hint: "At least one question_answered",
    reached: (h) => h.answeredAny || h.untracked,
  },
  {
    id: "gate",
    label: "Reached the email gate",
    hint: "test_results_gate_viewed",
    reached: (h) => h.reachedGate,
  },
  {
    id: "submitted",
    label: "Gave an email",
    hint: "test_email_submitted, or an email_captured from the results gate",
    // NOT any email_captured: the homepage pricing form fires the same event
    // and is not a step in this funnel. Counting it made the gate look like it
    // converted every single person who saw it.
    reached: (h) => h.submittedTestEmail,
  },
  {
    id: "opened",
    label: "Opened their results",
    hint: "results_link_opened, or a pageview on /results/…",
    reached: (h) => h.openedResults,
  },
];

/**
 * A later stage implies every earlier one.
 *
 * Capture is lossy in exactly the places that matter: a `$pageview` gets eaten
 * by an ad-blocker, a gate view goes missing, and a person who demonstrably
 * finished the test appears never to have started it. Taken literally that
 * produces negative drop-off — stage five larger than stage four — and a funnel
 * that reads as nonsense gets ignored.
 *
 * So reach is back-filled: whoever opened their results also gave an email,
 * also reached the gate, also started, also landed, whether or not each event
 * survived. It is the same assumption PostHog's own non-strict funnels make,
 * and it is a claim about physics rather than about data.
 */
function backfillReach(humans: Human[]): Map<string, boolean[]> {
  const reach = new Map<string, boolean[]>();
  for (const human of humans) {
    const flags = STAGES.map((stage) => stage.reached(human));
    for (let i = flags.length - 1; i > 0; i -= 1) {
      if (flags[i]) flags[i - 1] = true;
    }
    reach.set(human.id, flags);
  }
  return reach;
}

export function buildFunnel(humans: Human[]): FunnelStage[] {
  const reach = backfillReach(humans);
  const reachedPerStage = STAGES.map((_, i) =>
    humans.filter((h) => reach.get(h.id)?.[i]),
  );

  return STAGES.map((stage, i) => {
    const reached = reachedPerStage[i];
    const next = reachedPerStage[i + 1] ?? [];
    const nextIds = new Set(next.map((h) => h.id));
    const previous = i === 0 ? null : reachedPerStage[i - 1];

    return {
      id: stage.id,
      label: stage.label,
      hint: stage.hint,
      count: reached.length,
      droppedFromPrevious: previous ? Math.max(0, previous.length - reached.length) : 0,
      conversionFromPrevious:
        previous && previous.length > 0 ? reached.length / previous.length : null,
      // "Reached here and went no further" is the actionable set: these are the
      // people to go and read.
      droppedHumanIds: reached.filter((h) => !nextIds.has(h.id)).map((h) => h.id),
      reachedHumanIds: reached.map((h) => h.id),
      deepLinkedCount: reached.filter((h) => h.deepLinked).length,
    };
  });
}

/* --------------------------------------------------------------------------
 * Where in the test people give up
 * ------------------------------------------------------------------------ */

export interface AbandonPoint {
  /** Question number they stopped on. */
  question: number;
  humans: number;
  humanIds: string[];
}

export interface AbandonSummary {
  /** Per test, because 50 questions in 15 minutes is a different shape to 15 in 5. */
  testId: string;
  questionTotal: number;
  starters: number;
  finishers: number;
  /** Finished, but the clock beat them. Engaged, not uninterested. */
  timedOutFinishers: number;
  /** Never finished because the clock ran out. */
  timedOutAbandoners: number;
  /** Pressed quit. */
  quitters: number;
  /** Simply stopped, no quit and no timeout. */
  silentAbandoners: number;
  medianAbandonQuestion: number | null;
  points: AbandonPoint[];
}

/**
 * "Timed out" and "walked away" are opposite findings and they must not share
 * a bucket.
 *
 * Someone who answers 48 of 50 and hits the fifteen-minute limit engaged with
 * the product completely; someone who answers ten and vanishes did not. Counted
 * only by "questions answered", both are simply non-completers, and the product
 * conclusion you would draw from that is the wrong one — you would shorten the
 * test for the person who wanted more of it.
 */
export function summariseAbandonment(humans: Human[]): AbandonSummary[] {
  const byTest = new Map<string, Human[]>();
  for (const h of humans) {
    if (!h.startedTest) continue;
    const testId = h.primary.startedTestId ?? "unknown";
    const list = byTest.get(testId) ?? [];
    list.push(h);
    byTest.set(testId, list);
  }

  return [...byTest.entries()]
    .map(([testId, list]) => {
      const abandoners = list.filter(
        (h) => !h.primary.untracked && h.primary.outcome.startsWith("abandoned"),
      );
      const points = new Map<number, string[]>();
      for (const h of abandoners) {
        const q = h.furthestQuestion || 0;
        points.set(q, [...(points.get(q) ?? []), h.id]);
      }
      const stops = abandoners.map((h) => h.furthestQuestion).sort((a, b) => a - b);

      return {
        testId,
        questionTotal: list.reduce((acc, h) => Math.max(acc, h.questionTotal), 0),
        starters: list.length,
        finishers: list.filter(
          (h) => h.primary.outcome === "completed" || h.primary.outcome === "completed_timed_out",
        ).length,
        timedOutFinishers: list.filter((h) => h.primary.outcome === "completed_timed_out").length,
        timedOutAbandoners: list.filter((h) => h.primary.outcome === "abandoned_timed_out").length,
        quitters: list.filter((h) => h.primary.outcome === "abandoned_quit").length,
        silentAbandoners: list.filter((h) => h.primary.outcome === "abandoned_silent").length,
        medianAbandonQuestion: stops.length ? stops[Math.floor(stops.length / 2)] : null,
        points: [...points.entries()]
          .map(([question, humanIds]) => ({ question, humans: humanIds.length, humanIds }))
          .sort((a, b) => a.question - b.question),
      };
    })
    .sort((a, b) => b.starters - a.starters);
}
