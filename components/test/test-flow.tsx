/**
 * The whole flow, as one client state machine.
 *
 * ===========================================================================
 * WHY ONE ROUTE AND NOT SIX
 * ===========================================================================
 * Every step lives at `/`. The obvious alternative was a route per step
 * (/test/grade, /test/q/3) and it is wrong here for one reason: the browser
 * back button. Mid-test, back has to mean "the previous question", and it has
 * to not mean "leave the test and lose the clock". Pushing history entries per
 * question makes those two the same gesture, and pushing none while still
 * changing the URL makes the URL a lie. Keeping the flow in state means back
 * does what it always does — leaves the page — and the in-test Previous button
 * is unambiguous.
 *
 * The one thing that genuinely needs a URL is the hand-off link a parent sends
 * their kid, and that is a query param (`?for=child`) which seeds the initial
 * state and is then stripped.
 *
 * ===========================================================================
 * RESTORING A SESSION WITHOUT A FLASH
 * ===========================================================================
 * The server renders the first fork, which is the right thing for a cold
 * visitor and the right thing for SEO. A returning mid-test tab then has to
 * jump to wherever it was, and doing that in `useEffect` would paint the fork
 * for one frame first — a visible flicker of "First things first" before
 * question seven. `useLayoutEffect` runs after mutation but before paint, so
 * the restore is invisible; the isomorphic wrapper is only there to keep it
 * from warning during SSR, where it is a no-op by design.
 */
"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { BrandHeader } from "./brand-header";
import { DevToolsGate } from "./dev/dev-tools-gate";
import { GatedResults } from "./gated-results";
import { StepShell } from "./step-shell";
import { AudienceFork, GradePicker, ParentIntentFork, TestIntro } from "./steps/pre-test-steps";
import { TestRunner } from "./test-runner";
import {
  trackTestAudienceSelected,
  trackTestCompleted,
  trackTestForkSelected,
  trackTestGradeSelected,
  trackTestChildLinkOpened,
  trackTestRestarted,
  trackTestStarted,
  trackTestStepViewed,
} from "@/lib/analytics/events";
import { scoreTest } from "@/lib/test/scoring";
import {
  clearState,
  INITIAL_STATE,
  loadState,
  saveState,
  secondsLeft,
  type FlowState,
  type Step,
} from "@/lib/test/session";
import { getTest } from "@/lib/test/tests";
import type { Grade, Test } from "@/lib/test/types";

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

/** The step order, for the dev tools' "jump to step" control. */
export const STEP_ORDER: Step[] = [
  "audience",
  "parent-intent",
  "grade",
  "intro",
  "test",
  "results",
];

/**
 * What the dev tools are allowed to do. Defined here rather than in the dev
 * folder so the flow owns its own contract, and so the production build has a
 * type to satisfy even though nothing implements against it there.
 */
export interface FlowDevApi {
  state: FlowState;
  timerEnabled: boolean;
  patch: (partial: Partial<FlowState>) => void;
  /** Answer every question, `correctRatio` of them correctly, and jump to results. */
  fillAnswers: (correctRatio: number) => void;
  setTimerEnabled: (enabled: boolean) => void;
  reset: () => void;
}

/**
 * Stamped on every screen view so v2 and v3 funnels stay separable after the
 * cutover. Bump it when the flow changes shape, not for content edits.
 */
const FLOW_VERSION = "v3";

export function TestFlow() {
  const [state, setState] = useState<FlowState>(INITIAL_STATE);
  const [hydrated, setHydrated] = useState(false);
  /**
   * Dev-tools-only. In production the panel cannot render (see
   * dev/dev-tools-gate.tsx), so nothing can ever set this false and it is a
   * constant `true` that the bundler is free to see through.
   */
  const [timerEnabled, setTimerEnabled] = useState(true);

  const test = useMemo(
    () => (state.audience ? getTest(state.audience, state.grade) : null),
    [state.audience, state.grade],
  );

  /* -- screen views --------------------------------------------------------
   *
   * One effect for the whole funnel. Every screen the flow can show is a value
   * of `state.step`, so this is the entire drop-off curve, and a screen added
   * later is included without anyone remembering to instrument it.
   *
   * Waits for `hydrated` so a reload lands on the step the player is actually
   * on rather than firing "fork" first and inventing a visit to a screen they
   * never saw.
   */
  const stepRef = useRef(state.step);
  useEffect(() => {
    stepRef.current = state.step;
    if (!hydrated) return;
    trackTestStepViewed({
      step: state.step,
      version: FLOW_VERSION,
      audience: state.audience,
      grade: state.grade,
    });
  }, [state.step, state.audience, state.grade, hydrated]);

  /* -- restore, or seed from the hand-off link ----------------------------- */
  useIsomorphicLayoutEffect(() => {
    const saved = loadState();
    if (saved && saved.step !== "audience") {
      // A tab that reloaded past its deadline goes straight to the results
      // rather than back to a question with an expired clock.
      if (saved.step === "test" && saved.deadlineAt && secondsLeft(saved.deadlineAt) <= 0) {
        setState({ ...saved, step: "results", timedOut: true, finishedAt: Date.now() });
      } else {
        setState(saved);
      }
      setHydrated(true);
      return;
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get("for") === "child") {
      // The other half of the sharing loop. See trackTestChildLinkOpened.
      trackTestChildLinkOpened();
      setState({ ...INITIAL_STATE, step: "grade", fork: "child", audience: "child" });
      // Strip the param so a later refresh restores real progress rather than
      // re-seeding over the top of it.
      params.delete("for");
      const q = params.toString();
      window.history.replaceState(null, "", q ? `/?${q}` : "/");
    }
    setHydrated(true);
  }, []);

  /* -- persist ------------------------------------------------------------- */
  useEffect(() => {
    if (!hydrated) return;
    saveState(state);
  }, [state, hydrated]);

  const patch = useCallback(
    (partial: Partial<FlowState>) => setState((s) => ({ ...s, ...partial })),
    [],
  );

  /**
   * Save the finished attempt server-side and keep its token.
   *
   * Deliberately not awaited by its callers. Blocking the results screen on a
   * network round trip would put a spinner between finishing a timed test and
   * seeing how you did, which is the worst possible moment for one. The email
   * box handles a null token by asking the player to try again in a second,
   * which is the only case this can lose.
   */
  const saveResult = useCallback(
    (
      target: Test,
      grade: Grade | null,
      answers: Record<string, string>,
      elapsedSeconds: number,
      timedOut: boolean,
    ) => {
      void fetch("/api/test-results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testId: target.id,
          // Stored alongside the band, not instead of it. See the note in
          // app/api/test-results/route.ts.
          grade,
          answers,
          elapsedSeconds,
          timedOut,
        }),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data: { token?: string } | null) => {
          if (data?.token) setState((cur) => ({ ...cur, token: data.token! }));
        })
        .catch(() => {
          /* The gate reports "still saving" and the player can retry. */
        });
    },
    [],
  );

  /* -- transitions --------------------------------------------------------- */

  const pickFork = useCallback(
    (fork: "parent" | "child") => {
      trackTestForkSelected(fork);
      if (fork === "parent") {
        patch({ fork, step: "parent-intent", audience: null, grade: null });
      } else {
        patch({ fork, step: "grade", audience: "child", grade: null });
      }
    },
    [patch],
  );

  const pickParentIntent = useCallback(
    (who: "self" | "child") => {
      const audience = who === "self" ? "adult" : "child";
      trackTestAudienceSelected(audience);
      patch(
        who === "self"
          ? { audience: "adult", grade: null, step: "intro" }
          : { audience: "child", grade: null, step: "grade" },
      );
    },
    [patch],
  );

  const pickGrade = useCallback(
    (grade: Grade) => {
      trackTestGradeSelected(grade);
      patch({ grade, audience: "child", step: "intro" });
    },
    [patch],
  );

  const start = useCallback(() => {
    if (!test) return;
    const now = Date.now();
    trackTestStarted({
      test_id: test.id,
      audience: test.audience,
      band: test.band,
      grade: state.grade,
      item_count: test.items.length,
      duration_s: test.durationSeconds,
    });
    patch({
      step: "test",
      index: 0,
      answers: {},
      startedAt: now,
      deadlineAt: now + test.durationSeconds * 1000,
      finishedAt: null,
      timedOut: false,
      token: null,
    });
  }, [patch, test, state.grade]);

  /**
   * Finishing is guarded by a ref as well as by state, because the two ways in
   * (the player tapping "See my result", and the clock hitting zero) can land
   * in the same frame — tapping finish at 0:00 is exactly when a player taps.
   */
  const finishingRef = useRef(false);
  const finish = useCallback(
    (timedOut: boolean) => {
      if (finishingRef.current) return;
      finishingRef.current = true;

      setState((s) => {
        if (s.step !== "test" || !test) return s;
        const result = scoreTest(test, s.answers);
        const elapsed = s.startedAt ? Math.round((Date.now() - s.startedAt) / 1000) : 0;

        trackTestCompleted({
          test_id: test.id,
          audience: test.audience,
          band: test.band,
          grade: s.grade,
          score: result.score,
          max_score: result.max,
          percent: result.percent,
          answered: result.answered,
          verdict: result.verdict.id,
          elapsed_s: elapsed,
          timed_out: timedOut,
        });

        // Started the instant the test ends, so that by the time the player has
        // read a verdict and typed an address the token is already there.
        saveResult(test, s.grade, s.answers, elapsed, timedOut);

        return { ...s, step: "results", finishedAt: Date.now(), timedOut, token: null };
      });

      // Let the state settle before allowing another finish (a restart, later).
      window.setTimeout(() => {
        finishingRef.current = false;
      }, 0);
    },
    [test, saveResult],
  );

  const reset = useCallback(() => {
    trackTestRestarted(stepRef.current);
    clearState();
    finishingRef.current = false;
    setState(INITIAL_STATE);
  }, []);

  /* -- dev tools ------------------------------------------------------------ */
  const fillAnswers = useCallback(
    (correctRatio: number) => {
      if (!test) return;
      const target = Math.round(test.items.length * correctRatio);
      const answers: Record<string, string> = {};
      test.items.forEach((item, i) => {
        if (i < target) {
          answers[item.id] = item.answer;
        } else {
          // Deterministically pick something that is not the answer, so a forced
          // score is reproducible between runs.
          const wrong = item.options.find((o) => o.id !== item.answer);
          if (wrong) answers[item.id] = wrong.id;
        }
      });
      // Save it for real, exactly as a genuine finish would. Without this a
      // forced score lands on a results screen with no token, so the email gate
      // is stuck on "still saving" and the one path the dev tools exist to
      // exercise cannot be exercised.
      saveResult(test, state.grade, answers, 0, false);

      setState((s) => ({
        ...s,
        answers,
        step: "results",
        startedAt: s.startedAt ?? Date.now(),
        finishedAt: Date.now(),
        timedOut: false,
        token: null,
      }));
    },
    [test, state.grade, saveResult],
  );

  const devApi: FlowDevApi = {
    state,
    timerEnabled,
    patch,
    fillAnswers,
    setTimerEnabled,
    reset,
  };

  /* -- render ---------------------------------------------------------------- */

  /*
   * The real result is computed only for the analytics event fired at finish,
   * never for the gated screen. GatedResults renders the SHAPE of the results
   * with every earned value masked — see the note on `maskedResult` in
   * lib/test/scoring.ts.
   */
  const onResults = state.step === "results" && test !== null;

  /*
   * The runner is its own full-viewport shell, so it renders instead of the
   * page column rather than inside it.
   *
   * The dev tools mount ONCE, outside both, and that matters: an earlier
   * version rendered a <DevToolsGate /> in each branch, which meant moving
   * from the runner to the results unmounted one panel and mounted a
   * different one with fresh state. The panel closed itself every time the
   * flow changed step, which is exactly when you are using it.
   */
  const body =
    state.step === "test" && test && state.deadlineAt !== null ? (
      <TestRunner
        test={test}
        answers={state.answers}
        index={Math.min(state.index, test.items.length - 1)}
        deadlineAt={state.deadlineAt}
        timerEnabled={timerEnabled}
        onAnswer={(itemId, optionId) =>
          setState((s) => ({ ...s, answers: { ...s.answers, [itemId]: optionId } }))
        }
        onIndexChange={(index) => patch({ index })}
        onFinish={finish}
        onQuit={reset}
      />
    ) : (
      <StepShell>
      <div className="flex w-full max-w-md flex-col items-center gap-7 sm:max-w-lg">
        {/* The results screen carries its own headline, so the full lockup only
            appears on the way in. */}
        {state.step !== "results" ? <BrandHeader /> : null}

        {state.step === "audience" ? <AudienceFork onPick={pickFork} /> : null}

        {state.step === "parent-intent" ? (
          <ParentIntentFork
            onPick={pickParentIntent}
            onBack={() => patch({ step: "audience", fork: null })}
          />
        ) : null}

        {state.step === "grade" ? (
          <GradePicker
            forChild={state.fork === "parent"}
            onPick={pickGrade}
            onBack={() =>
              patch({
                step: state.fork === "parent" ? "parent-intent" : "audience",
                grade: null,
              })
            }
          />
        ) : null}

        {state.step === "intro" && test ? (
          <TestIntro
            test={test}
            grade={state.grade}
            onStart={start}
            onBack={() =>
              patch({
                step:
                  test.audience === "child"
                    ? "grade"
                    : state.fork === "parent"
                      ? "parent-intent"
                      : "audience",
              })
            }
          />
        ) : null}

        {onResults && test ? (
          <GatedResults
            test={test}
            timedOut={state.timedOut}
            token={state.token}
            onRestart={reset}
          />
        ) : null}

        {/*
          A step that cannot render (a saved state pointing at a grade that no
          longer exists, say) would otherwise be a blank page. Give it a way out.
        */}
        {(state.step === "intro" || state.step === "results") && !test ? (
          <div className="rounded-2xl border-[2.5px] border-ink bg-coral p-5 text-center shadow-hard-sm">
            <p className="font-display text-xl uppercase leading-none">
              Something went sideways
            </p>
            <button
              type="button"
              onClick={reset}
              className="btn-press mt-4 inline-flex min-h-11 cursor-pointer items-center rounded-full border-[2.5px] border-ink bg-paper px-5 font-sans text-sm font-bold uppercase text-ink"
            >
              Start over
            </button>
          </div>
        ) : null}
        </div>
      </StepShell>
    );

  return (
    <>
      {body}
      <DevToolsGate api={devApi} />
    </>
  );
}
