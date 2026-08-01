/**
 * Flow state and its persistence across an accidental refresh.
 *
 * ---------------------------------------------------------------------------
 * THE TIMER DECISION, AND WHY REFRESH CANNOT BUY TIME
 * ---------------------------------------------------------------------------
 * The clock is stored as `deadlineAt`, an ABSOLUTE epoch timestamp, and never
 * as "seconds remaining". That single choice settles three questions at once:
 *
 *   - A refresh restores the same deadline, so remaining time is recomputed
 *     from the wall clock and reloading gains the player nothing. Storing
 *     seconds-remaining would have made F5 a cheat code.
 *   - A backgrounded tab (the phone locks, they take a call) keeps burning
 *     time, which is what a timed test means. An interval-driven countdown
 *     would have quietly paused and handed out free minutes.
 *   - Coming back after the deadline has already passed lands straight on the
 *     results rather than on a question with a negative clock.
 *
 * The only thing it does not defend against is someone changing their system
 * clock, and a joke IQ test does not need to defend against that.
 *
 * ---------------------------------------------------------------------------
 * WHY sessionStorage
 * ---------------------------------------------------------------------------
 * Per-tab and cleared when the tab closes. An accidental refresh mid-test is
 * the case that has to survive, and it does. A half-finished test resurrecting
 * a week later is not a feature; localStorage would have done that, and would
 * also have meant a shared phone showing one child the other's abandoned
 * attempt.
 */
import type { Audience, Grade } from "./types";
import type { AnswerMap } from "./scoring";

/** Which door they came in. Distinct from `audience`, which is the test they sit. */
export type Fork = "parent" | "child";

export type Step =
  | "audience" // fork one: are you a parent or a kid
  | "parent-intent" // fork two: taking it yourself, or is your child
  | "grade" // grade 1-12
  | "intro" // the rules, and the start button
  | "test" // the timed test itself
  | "results"; // score, verdict, and the email gate

export interface FlowState {
  step: Step;
  fork: Fork | null;
  /**
   * WHICH TEST is being sat, which is not the same as which fork was taken. A
   * parent who hands the phone to their child is `fork: "parent"` and
   * `audience: "child"`. The email-gate copy keys off THIS field, not the fork,
   * because in both paths that reach a child test a child may be the one
   * looking at the results screen. See components/test/email-gate.tsx.
   */
  audience: Audience | null;
  grade: Grade | null;
  /** item id -> chosen option id. */
  answers: AnswerMap;
  /** Zero-based index of the question on screen. */
  index: number;
  /** Absolute epoch ms when the clock runs out. Null before the test starts. */
  deadlineAt: number | null;
  startedAt: number | null;
  finishedAt: number | null;
  /** True when the test ended because the clock hit zero rather than by finishing. */
  timedOut: boolean;
  /**
   * The stored result's token, once the server has saved it. Null while that
   * request is in flight, and null forever if it failed.
   *
   * It is kept here rather than in a component so an accidental refresh on the
   * results screen does not orphan a saved result and create a second one.
   * sessionStorage is per-tab and cleared on close, which is the right lifetime:
   * the durable copy of this token is the link in the person's inbox.
   */
  token: string | null;
}

export const INITIAL_STATE: FlowState = {
  step: "audience",
  fork: null,
  audience: null,
  grade: null,
  answers: {},
  index: 0,
  deadlineAt: null,
  startedAt: null,
  finishedAt: null,
  timedOut: false,
  token: null,
};

/** Bump when the shape changes so a stale saved state is discarded, not crashed on. */
const STORAGE_KEY = "sffs_test_v2";

export function loadState(): FlowState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<FlowState>;
    // Trust nothing from storage: a hand-edited or half-written value should
    // start a clean flow rather than render a broken one.
    if (typeof parsed !== "object" || parsed === null) return null;
    if (typeof parsed.step !== "string") return null;
    return { ...INITIAL_STATE, ...parsed };
  } catch {
    return null; // storage blocked (private mode) or corrupt JSON
  }
}

export function saveState(state: FlowState): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage blocked — the flow still works, it just will not survive a refresh */
  }
}

export function clearState(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* nothing to clear */
  }
}

/** Whole seconds left on the clock, floored at zero. */
export function secondsLeft(deadlineAt: number | null, now = Date.now()): number {
  if (deadlineAt === null) return 0;
  return Math.max(0, Math.ceil((deadlineAt - now) / 1000));
}

/** "12:05" / "0:09". Minutes are never zero-padded; seconds always are. */
export function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
