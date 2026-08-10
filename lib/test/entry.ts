/**
 * Deep entry: dropping a visitor straight into a branch from the URL.
 *
 * ===========================================================================
 * THE PROBLEM THIS DELETES
 * ===========================================================================
 * The fork screen asks one question — adult or kid — and 91.8% of paid TikTok
 * traffic leaves without answering it. Everything after that question is
 * healthy: most people who pick a branch start a test, and most who finish one
 * hand over an email. So the fork is not a filter that removes bad traffic, it
 * is a toll gate in front of good traffic.
 *
 * A visitor who lands already inside their branch never sees the screen. That
 * is not persuasion, it is removal: the ad creative already said which test it
 * was selling, so the question has been answered before the page loads and
 * asking it again is asking twice.
 *
 * ===========================================================================
 * THESE ARE ROUTES, NOT REDIRECTS, AND THAT IS THE WHOLE ATTRIBUTION STORY
 * ===========================================================================
 * The obvious build is `/adult` -> 307 -> `/?entry=adult`. It is wrong here,
 * and this codebase already has the scar: app/go/[postid]/route.ts rebuilds its
 * destination query from scratch, so anything it was not told to copy is
 * dropped, and it once emitted a `utm_source` of its own invention and put a
 * month of Facebook traffic under a channel that does not exist.
 *
 * These URLs will carry `utm_source`, `utm_medium`, `utm_campaign`, a
 * per-creative `utm_content`, and a `ttclid` that TikTok appends itself and
 * nobody here controls the name of. A redirect has to enumerate what it
 * preserves; a route preserves everything by doing nothing. `/adult?...` IS the
 * landing URL, the query string is untouched from click to `$pageview`, and a
 * parameter TikTok invents next quarter survives without a code change.
 *
 * It costs nothing, either: the flow is one client state machine that never
 * navigates (see components/test/test-flow.tsx), so the address bar keeps the
 * full ad URL for the whole visit rather than for one hop.
 *
 * ===========================================================================
 * WHY THE CHILD LINK LANDS ON THE GRADE PICKER
 * ===========================================================================
 * `/kids` stops at the grade picker rather than at question one, because the
 * child test is grade-banded and `getTest("child", null)` is null — there is no
 * "the child test" to drop into. The alternatives were to guess a grade, which
 * serves a nine-year-old a test written for a thirteen-year-old and quietly
 * corrupts every score in the band, or to pick a default, which is the same
 * thing with a nicer name.
 *
 * That is still the fork deleted. `/kids` skips BOTH forks — "are you an adult
 * or a kid" and "is it you or your child" — and lands on the first screen that
 * asks something the ad could not answer. The grade picker is not the toll
 * gate; it is the product needing to know which test to hand over.
 *
 * `/kids/5` exists for when a creative IS grade-specific and skips it too.
 */
import { INITIAL_STATE, type FlowState } from "./session";
import { GRADES, type Grade } from "./types";

/** Which test an entry URL asks for. Distinct from `Fork`, which is the door. */
export type EntryBranch = "adult" | "child";

export interface EntrySeed {
  branch: EntryBranch;
  /** Only ever set on the child branch, and only from a valid grade segment. */
  grade: Grade | null;
  /**
   * The URL carried a grade segment that is not a real grade.
   *
   * Kept as a distinct fact rather than folded into `grade: null`, because the
   * two mean different things to the analytics: `/kids` is a visitor who was
   * never offered a grade, `/kids/99` is a visitor whose grade we threw away.
   */
  gradeRejected: boolean;
}

/**
 * The canonical entry paths, in the form they will be typed into ad platforms.
 *
 * Listed here so the verification suite and the route files cannot disagree
 * about what shipped, and so adding one is a single edit.
 */
export const ENTRY_PATHS = {
  adult: "/adult",
  /** Same screen as `/adult`. See the note on the route file. */
  adultAlias: "/grownup",
  child: "/kids",
  /** `/kids/3` … `/kids/8`. */
  childGrade: (grade: Grade) => `/kids/${grade}`,
} as const;

/**
 * Which branch a pathname enters, or null when it is not an entry path.
 *
 * Lives here, next to the routes' own vocabulary, because two places need the
 * answer and they must not drift: the route files, which seed the flow, and
 * `deriveEntry` in lib/analytics/events.ts, which stamps every event with where
 * the visit came in. A copy of this in the analytics module would go stale the
 * first time a path is added, and the failure would be silent — the routes
 * would work and the funnel would quietly file the traffic as fork traffic.
 *
 * Tolerant of a trailing slash and of case, because this reads the live
 * address bar rather than Next's matched route: `skipTrailingSlashRedirect` is
 * on, so `/adult/` reaches the app as written.
 */
export function entryBranchForPath(pathname: string): EntryBranch | null {
  const path = pathname.toLowerCase().replace(/\/+$/, "") || "/";
  if (path === ENTRY_PATHS.adult || path === ENTRY_PATHS.adultAlias) return "adult";
  if (path === ENTRY_PATHS.child || path.startsWith(`${ENTRY_PATHS.child}/`)) return "child";
  return null;
}

/**
 * A grade segment from the URL, or null if it is not one of ours.
 *
 * STRICT ON PURPOSE. Someone will try `/kids/99`, and something upstream will
 * eventually append a stray character to a link. `Number("")` is 0 and
 * `parseInt("3abc")` is 3, so neither is used: the segment has to be one or two
 * plain digits and then has to name a grade that exists. Everything else is
 * rejected and handled by the caller, which falls back rather than throwing.
 */
export function parseGradeSegment(raw: string | undefined | null): Grade | null {
  if (typeof raw !== "string" || !/^\d{1,2}$/.test(raw)) return null;
  const n = Number(raw);
  return (GRADES as readonly number[]).includes(n) ? (n as Grade) : null;
}

/**
 * Read a `/kids/[grade]` segment into a seed.
 *
 * A BAD GRADE FALLS BACK TO THE GRADE PICKER, NOT TO THE FORK. The audience is
 * not in doubt — it comes from the route file, which is static, so the only
 * user-controlled part of `/kids/99` is the part we are throwing away. Sending
 * that visitor to the fork would make them re-answer the one question the URL
 * got right, which is the exact screen this feature exists to skip.
 *
 * The fork is still the floor: a seed that cannot resolve to a real test at all
 * is handled in the flow (see `entryFlowState`), and any path that is not an
 * entry route 404s the way it always did.
 */
export function childSeedFromSegment(raw: string | undefined | null): EntrySeed {
  const grade = parseGradeSegment(raw);
  return {
    branch: "child",
    grade,
    gradeRejected: raw != null && grade === null,
  };
}

export const ADULT_SEED: EntrySeed = { branch: "adult", grade: null, gradeRejected: false };

/**
 * The flow state a seed starts on.
 *
 * ADULT lands on the intro — the rules and the start button — and not on
 * question one. The intro is where the clock is explained and where `start()`
 * sets the deadline, so skipping it would mean either starting a timed test
 * nobody was told about, or inventing a second way to start one. It is also one
 * tap, and it is the tap that makes the timer fair.
 *
 * CHILD lands on the grade picker, or on the intro when the URL named a grade.
 */
export function entryFlowState(seed: EntrySeed): FlowState {
  if (seed.branch === "adult") {
    return { ...INITIAL_STATE, step: "intro", fork: "parent", audience: "adult", grade: null };
  }
  return {
    ...INITIAL_STATE,
    step: seed.grade === null ? "grade" : "intro",
    fork: "child",
    audience: "child",
    grade: seed.grade,
  };
}
