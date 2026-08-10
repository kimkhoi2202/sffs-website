/**
 * The timed test.
 *
 * ===========================================================================
 * THE TIMER DECISION: ONE CLOCK FOR THE WHOLE TEST
 * ===========================================================================
 * Not per question. Three reasons, in order of weight:
 *
 *   1. It is what the test being imitated does. A CCAT is fifty questions
 *      against a single fifteen-minute clock, and how far you get is part of
 *      the measurement rather than an accident of it. Per-question timers
 *      measure something else.
 *   2. A per-question clock on a phone measures reading speed and thumb
 *      accuracy at least as much as reasoning, and the child branch goes down
 *      to a six-year-old. One budget lets a slow reader spend it where they
 *      need to.
 *   3. It makes "skip it and come back" real, which is the actual skill a
 *      timed aptitude test is trying to reward.
 *
 * AT ZERO the test submits itself immediately. No grace period, no "are you
 * sure", no dialog to dismiss — a confirmation at time-up would be asking a
 * question after the point of the clock has already passed. Everything answered
 * is scored, everything unanswered counts as wrong, and the results screen says
 * plainly that time ran out so the score is not a mystery.
 *
 * REFRESH is survivable and is not a cheat. Answers, position and the deadline
 * live in sessionStorage, and the deadline is an ABSOLUTE timestamp, so a reload
 * restores the same clock rather than restarting it. See lib/test/session.ts.
 *
 * ===========================================================================
 * YOU CANNOT LEAVE A QUESTION UNANSWERED
 * ===========================================================================
 * Moving on — and finishing — requires a selection on the question in front of
 * you. There is no Skip. Note what this does to the shape of an attempt: the
 * only way to reach question N is to have answered N-1, so the questions a
 * finished paper leaves blank are exactly the ones the player never reached.
 * A submitted paper is therefore complete, and a timed-out one is answered up
 * to wherever the clock caught them.
 *
 * THE CLOCK IS UNAFFECTED, and that is what keeps this from being a trap. Time
 * up still submits from wherever the player is, answered or not, so the guard
 * can never leave somebody holding a question they cannot answer and a test
 * they cannot end. Quitting is untouched too. The three ways out of this screen
 * are: answer it, quit, or let the clock run.
 *
 * THE GUARD LIVES HERE, ON THE RUNNER, and not in any question renderer. Every
 * one of the seven kinds reports its selection through the same `onPick` into
 * the same answer map (see ./question/question-view.tsx, which switches on kind
 * for the DRAWING and shares one option group for the INTERACTION), so one
 * check covers every type that exists and every type anyone adds later. A guard
 * per renderer would be seven copies of one rule, and the eighth renderer would
 * ship without it.
 *
 * ===========================================================================
 * THE LAYOUT CONTRACT
 * ===========================================================================
 * A fixed, full-viewport, three-row shell: header, scrolling question, footer.
 * The header and footer are flex children with intrinsic heights, so they are
 * pinned by the layout rather than by `position: sticky` over content — which
 * is what makes "the timer is always visible" and "the timer never covers an
 * answer" the same statement instead of two competing ones. Only the middle row
 * scrolls, so no question can push the clock off screen and no change of
 * question can move a control.
 *
 * It also sits above the fixed music toggle (z-40), which is deliberate: a 56px
 * puck floating over the bottom-right corner of a timed test is sitting on top
 * of option D.
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { BrandMark } from "./brand-header";
import { ArrowLeftIcon, ArrowRightIcon, XMarkIcon } from "@/components/ui/icons";
import { FitToViewport } from "./question/fit-to-viewport";
import { QuestionView } from "./question/question-view";
import { Button } from "@/components/ui/button";
import {
  trackQuestionAnswered,
  trackQuestionViewed,
  trackTestQuit,
  trackTestTimedOut,
} from "@/lib/analytics/events";
import { formatClock, secondsLeft } from "@/lib/test/session";
import type { AnswerMap } from "@/lib/test/scoring";
import type { Test } from "@/lib/test/types";
import { cn } from "@/lib/utils";

/**
 * Reading the wall clock, hoisted out of the component. `react-hooks/purity`
 * flags `Date.now()` anywhere in a component body, including inside a handler
 * it cannot see is only called on a tap.
 */
const nowMs = () => Date.now();

/** Seconds left at which the clock turns yellow, then coral. */
const WARN_AT = 60;
const URGENT_AT = 10;

/**
 * How a forward control looks while it is waiting for an answer. Defined in
 * app/globals.css, because muting it means overriding `btn-press`'s hover and
 * press states and that takes real specificity — see the note there.
 */
const LOCKED = "locked-control";

export interface TestRunnerProps {
  test: Test;
  answers: AnswerMap;
  index: number;
  deadlineAt: number;
  /** Null disables the clock entirely. Dev tools only — see dev/dev-tools.tsx. */
  timerEnabled: boolean;
  onAnswer: (itemId: string, optionId: string) => void;
  onIndexChange: (index: number) => void;
  onFinish: (timedOut: boolean) => void;
  onQuit: () => void;
}

export function TestRunner({
  test,
  answers,
  index,
  deadlineAt,
  timerEnabled,
  onAnswer,
  onIndexChange,
  onFinish,
  onQuit,
}: TestRunnerProps) {
  const item = test.items[index];
  const total = test.items.length;
  const isLast = index === total - 1;
  const answeredCount = Object.keys(answers).length;
  /*
   * Presence, not truthiness. Option ids are "A".."E" today (lib/test/types.ts)
   * so `!answers[id]` would happen to work, but it would start silently letting
   * people through the day an id is ever "" or "0". The rule being expressed is
   * "is there a selection", so that is what is written.
   */
  const hasAnswer = answers[item.id] !== undefined;

  const [confirmQuit, setConfirmQuit] = useState(false);

  /* -- per-question analytics --------------------------------------------- */
  /**
   * Which questions have already been counted as seen, so `question_viewed`
   * fires ONCE per question per attempt. Without this it would fire again every
   * time a child navigates back, which inflates the middle of the drop-off
   * funnel and makes the curve say the opposite of what happened.
   */
  const seenRef = useRef<Set<string>>(new Set());
  /** When the question currently on screen appeared, for `dwell_ms`. */
  const shownAtRef = useRef<number>(nowMs());

  const questionProps = useCallback(
    (i: number) => ({
      test_id: test.id,
      audience: test.audience,
      band: test.band,
      question_index: i + 1,
      question_total: total,
      question_id: test.items[i].id,
      question_tier: test.items[i].tier,
      question_domain: test.items[i].domain,
    }),
    [test, total],
  );

  useEffect(() => {
    const current = test.items[index];
    if (!current) return;
    shownAtRef.current = nowMs();
    if (seenRef.current.has(current.id)) return;
    seenRef.current.add(current.id);
    trackQuestionViewed(questionProps(index));
  }, [index, test, questionProps]);

  /**
   * An answer is a deliberate tap, so this fires per tap rather than per render.
   * `changed` separates a first answer from a correction, which matters because
   * a question people keep changing their mind on is a different signal from one
   * they answer slowly.
   */
  const handleAnswer = useCallback(
    (itemId: string, optionId: string) => {
      const item = test.items[index];
      trackQuestionAnswered({
        ...questionProps(index),
        correct: optionId === item.answer,
        dwell_ms: Math.max(0, nowMs() - shownAtRef.current),
        changed: answers[itemId] !== undefined,
      });
      onAnswer(itemId, optionId);
    },
    [answers, index, onAnswer, questionProps, test.items],
  );

  /*
   * An item that will not fit even at the smallest scale is a content problem,
   * not a layout one, so it is reported rather than absorbed: the item wants
   * shortening, and shrinking it further would only make it unreadable instead
   * of clipped.
   *
   * Nothing in the current bank reaches this. Measured across all 125 items at
   * 360x640, the deepest scale needed is 0.69 (the three-by-three matrices) and
   * everything else is 0.845 or gentler. The warning exists for the next item
   * somebody writes.
   *
   * Dev-only, because a visitor can do nothing with it.
   */
  const reportOverflow = useCallback(
    (info: { contentKey: string; needed: number; available: number }) => {
      if (process.env.NODE_ENV === "production") return;
      console.warn(
        `[fit] ${info.contentKey} does not fit even scaled down: needs ${info.needed}px, has ${info.available}px. ` +
          `That item is too long and should be shortened rather than scaled further.`,
      );
    },
    [],
  );

  /* -- the clock ---------------------------------------------------------- */
  // Only meaningful while `timerEnabled`. When the dev tools switch the clock
  // off this simply stops being read, rather than being reset to a sentinel —
  // writing state from an effect to represent "not applicable" would be a
  // cascading render to express something the render can just not look at.
  const [remaining, setRemaining] = useState(() => secondsLeft(deadlineAt));
  // Guards the submit so a slow render or a double tick cannot fire it twice.
  const firedRef = useRef(false);

  useEffect(() => {
    if (!timerEnabled) return;

    const tick = () => {
      const left = secondsLeft(deadlineAt);
      setRemaining(left);
      if (left <= 0 && !firedRef.current) {
        firedRef.current = true;
        // Separate from `test_completed`, which fires either way. This says the
        // clock ended it rather than the player did, and it carries how far
        // they got, which is the number that says whether the limit is right.
        trackTestTimedOut({
          test_id: test.id,
          audience: test.audience,
          band: test.band,
          question_index: index + 1,
          question_total: total,
          answered: Object.keys(answers).length,
        });
        onFinish(true);
      }
    };

    tick();
    const id = window.setInterval(tick, 500);
    // A backgrounded tab has its intervals throttled hard on mobile, so recheck
    // the moment it comes back rather than waiting up to a second to notice the
    // clock ran out while the phone was locked. Recomputing from the absolute
    // deadline means the elapsed time was counted correctly either way.
    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
    // `answers` and `index` are read inside the tick for the timed-out event.
    // They are deliberately NOT dependencies: re-running this effect on every
    // answer would restart the interval, and the values are only read at the
    // moment the clock hits zero.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deadlineAt, timerEnabled, onFinish]);

  /* -- body scroll lock ----------------------------------------------------- */
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const goto = useCallback(
    (next: number) => onIndexChange(Math.max(0, Math.min(total - 1, next))),
    [onIndexChange, total],
  );

  /* -- pressing the unavailable control ------------------------------------
   *
   * The forward control is `aria-disabled` rather than `disabled`, so a press
   * still reaches this. See the footer for why it is that way round; this is
   * the other half of that decision. A control that swallows a press and does
   * nothing is worse than no control, so a blocked press ANSWERS:
   *
   *   the option group is ringed, which is the reply a phone gets — see
   *   `.awaiting-answer` in app/globals.css for why focus alone is not one;
   *   focus lands on the first option, which is the useful part: from there the
   *   answer is an arrow key away, which is exactly where somebody who just
   *   pressed Next wants to be;
   *   and the reason is announced, because neither of those two says anything
   *   out loud.
   *
   * WHICH QUESTION was refused, rather than a flag plus an effect to clear it.
   * The reply belongs to one question, and storing the index says so in a value
   * the render can just compare — no second render, and nothing to remember to
   * reset when the question changes.
   */
  const questionRef = useRef<HTMLDivElement>(null);
  const [refusedAt, setRefusedAt] = useState<number | null>(null);
  const refused = refusedAt === index && !hasAnswer;
  const blocked = useCallback(() => {
    setRefusedAt(index);
    questionRef.current?.querySelector<HTMLInputElement>('input[type="radio"]')?.focus();
  }, [index]);

  const urgent = timerEnabled && remaining <= URGENT_AT;
  const warning = timerEnabled && remaining <= WARN_AT && !urgent;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-paper">
      {/*
        -- header: brand, clock, progress, quit ----------------------------
        THE BAR IS CHROME, SO IT USES THE WHOLE WIDTH. Only the question and its
        options are column-constrained. Sharing the content column made a
        full-width bar look empty at both edges while its own items were packed
        into the middle, with the quit button pressed up against the counter.

        The clock is ABSOLUTELY centred rather than being a flex child, because
        the left and right groups are different widths and a flex centre would
        put it slightly off. It is the thing people glance at most, so it is
        worth centring properly.
      */}
      <header className="relative shrink-0 border-b-[2.5px] border-ink bg-cream">
        <div className="flex items-center justify-between gap-2 px-3 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] sm:px-5">
          {/* Hard left. The wordmark drops on small screens and the brain mark
              carries the brand on its own, which is the whole reason the mark
              exists. */}
          <BrandMark className="min-w-0" hideLabelOnSmall />

          {/* Hard right: counter, then a real gap, then quit. */}
          <div className="flex shrink-0 items-center">
            <span className="whitespace-nowrap font-sans text-xs font-extrabold uppercase leading-none tracking-[0.06em] text-ink/70">
              {index + 1} <span className="text-ink/40">/</span> {total}
            </span>
            {/*
              A gap AND a keyline before quit. This is the only destructive
              control on the screen and it sits next to the number people look
              at constantly; on a phone, "next to the thing you keep glancing
              at" is how mis-taps happen. The separation is deliberate, and it
              is the second of three guards — see the confirmation dialog below.
            */}
            <span
              aria-hidden="true"
              className="mx-3 h-5 w-px bg-ink/20 sm:mx-4"
            />
            <button
              type="button"
              onClick={() => setConfirmQuit(true)}
              aria-label="Quit the test"
              /* Same hard ink treatment as everything else: 2.5px border, no
                 washed-out grey. 17px glyph in a 36px control, matching the
                 40-50% rule the other icons follow. */
              className="btn-press grid size-9 shrink-0 cursor-pointer place-items-center rounded-full border-[2.5px] border-ink bg-paper text-ink"
            >
              <XMarkIcon size={17} />
            </button>
          </div>
        </div>

        {/* Centred on the BAR, not between its neighbours. `pointer-events-none`
            so it can overlap the flex row without stealing taps. */}
        <div className="pointer-events-none absolute inset-x-0 top-[max(0.5rem,env(safe-area-inset-top))] flex justify-center">
          <div
            data-surface="clock"
            className={cn(
              "grid min-w-[4.25rem] place-items-center rounded-full border-[2.5px] border-ink px-3 py-1.5",
              "font-mono text-base font-bold leading-none tabular-nums",
              !timerEnabled && "bg-gray-200 text-ink/60",
              timerEnabled && !warning && !urgent && "bg-paper text-ink",
              warning && "bg-yellow text-ink",
              urgent && "bg-coral text-ink motion-safe:animate-pulse",
            )}
          >
            {timerEnabled ? formatClock(remaining) : "--:--"}
          </div>
        </div>

        {/* Progress. `aria-hidden` because the "N / total" above already says it. */}
        <div aria-hidden="true" className="h-1.5 w-full bg-gray-200">
          <div
            className="h-full bg-ink transition-[width] duration-200 ease-press"
            style={{ width: `${((index + 1) / total) * 100}%` }}
          />
        </div>
      </header>

      {/* Time announcements for screen readers. The clock itself is a visual
          element that changes twice a second; announcing that would be unusable,
          so this fires only at the two thresholds that change what you would do. */}
      <p className="sr-only" role="status" aria-live="polite">
        {timerEnabled && remaining === WARN_AT ? "One minute remaining." : null}
        {timerEnabled && remaining === URGENT_AT ? "Ten seconds remaining." : null}
      </p>

      {/* -- the question ------------------------------------------------------ */}
      {/*
        THE QUESTION IS SCALED TO FIT, NEVER SCROLLED TO. See the header of
        ./question/fit-to-viewport.tsx. Under a clock, an option below the fold
        is an option that does not get read.

        A TEST SCREEN USES THE VIEWPORT. `max-w-2xl` is a reading measure and it
        is the wrong shape here: the job is to get a stimulus and four options on
        screen at once, not to keep a comfortable line length. The column widens
        through the breakpoints so a figure matrix and its options fit a desktop
        at full size, with no scaling needed at all.
      */}
      <FitToViewport contentKey={item.id} onOverflow={reportOverflow}>
        <div
          ref={questionRef}
          className={cn(
            "mx-auto w-full max-w-2xl md:max-w-3xl lg:max-w-5xl",
            refused && "awaiting-answer",
          )}
        >
          <QuestionView
            item={item}
            picked={answers[item.id] ?? null}
            onPick={(optionId) => handleAnswer(item.id, optionId)}
          />
        </div>
      </FitToViewport>

      {/* -- footer: navigation -------------------------------------------------- */}
      <footer className="shrink-0 border-t-[2.5px] border-ink bg-cream">
        <div className="mx-auto flex w-full max-w-2xl items-center gap-3 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:px-6">
          {/*
            The Back button only exists on tests that allow it. The adult test
            does not: a one-way pass under a clock is part of what that format
            measures. Rendering a disabled Back there would advertise a control
            that is never available, so it is simply absent, and the intro
            screen says so before the clock starts rather than letting someone
            discover it by losing a question.
          */}
          {test.allowBack ? (
            <Button
              variant="paper"
              size="lg"
              onClick={() => goto(index - 1)}
              disabled={index === 0}
              className="shrink-0 px-5"
            >
              <ArrowLeftIcon size={24} />
              <span className="sr-only">Previous question</span>
            </Button>
          ) : null}

          {/*
            THE FORWARD CONTROL. One button, two jobs, one guard: it needs a
            selection on this question before it will do either.

            THERE IS NO LONGER A "Skip" LABEL. It used to read Skip on the adult
            test until something was picked, because moving on unanswered was a
            real and irreversible act worth naming. It is not an act any more.

            `aria-disabled`, NOT `disabled`, AND THE DIFFERENCE MATTERS HERE.
            A real `disabled` attribute takes the button out of the tab order
            and out of the accessibility tree's reach: a screen-reader user
            tabbing this screen would find the options, then the end, and never
            learn that there is a way forward or what unlocks it. The control
            they cannot use yet is precisely the one they need told about. So it
            stays focusable and announces itself as unavailable, carries the
            reason on `aria-describedby`, and refuses the press in the handler —
            see `blocked` above for what a refused press does instead.

            Back is left on a real `disabled`, deliberately, and the two are not
            inconsistent. Back at question one is unavailable because there is
            nothing behind it and no action makes one appear; there is nothing
            to tell anybody. Forward is unavailable because of something the
            player can fix in one tap, right now, on this screen.
          */}
          {isLast ? (
            <Button
              variant="green"
              size="lg"
              onClick={() => (hasAnswer ? onFinish(false) : blocked())}
              aria-disabled={!hasAnswer || undefined}
              aria-describedby={hasAnswer ? undefined : "answer-required"}
              className={cn("flex-1", LOCKED)}
            >
              See my result
            </Button>
          ) : (
            <Button
              variant="blue"
              size="lg"
              onClick={() => (hasAnswer ? goto(index + 1) : blocked())}
              aria-disabled={!hasAnswer || undefined}
              aria-describedby={hasAnswer ? undefined : "answer-required"}
              className={cn("flex-1", LOCKED)}
            >
              Next
              <ArrowRightIcon size={22} />
            </Button>
          )}
        </div>

        {/*
          The reason, for whoever needs it.

          NOT A VISIBLE LINE OF TEXT, and that is a layout decision rather than
          a shrug. A hint that appears while unanswered and goes when answered
          changes the footer's height at the exact moment of tapping an option,
          and the footer's height is what sets the region the question is scaled
          into — so every first tap on a question would resize the question. The
          layout contract at the top of this file exists to stop precisely that.
          Reserving the line permanently instead would spend a row of a 360x640
          screen on a sentence that is empty most of the time.

          A sighted player does not need the sentence: four unanswered options
          sit directly above a visibly muted button. A screen-reader user gets
          it on focus through `aria-describedby`, and on a refused press through
          the live region below, which is where it is actually load-bearing.
        */}
        <p id="answer-required" className="sr-only">
          Pick an answer to {isLast ? "see your result" : "move on"}.
        </p>
        <p className="sr-only" role="status" aria-live="assertive">
          {refused ? `Pick an answer to ${isLast ? "see your result" : "move on"}.` : ""}
        </p>
      </footer>

      {/* -- quit confirmation ---------------------------------------------------- */}
      {confirmQuit ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="quit-title"
          className="absolute inset-0 z-10 grid place-items-center bg-ink/60 p-5"
        >
          <div
            /* The other modal. Same reasoning as the email gate: it sits on a
               scrim over the question and the depth is what separates them. */
            className="w-full max-w-sm rounded-2xl border-[2.5px] border-ink bg-paper p-5 shadow-hard-lg"
          >
            <h2 id="quit-title" className="font-display text-2xl uppercase leading-none">
              Quit the test?
            </h2>
            <p className="mt-2.5 text-[0.95rem] font-semibold leading-snug text-ink/75">
              {answeredCount > 0
                ? `You have answered ${answeredCount} of ${total}. Quitting throws that away and the clock does not stop for you.`
                : "The clock does not stop for you, so starting again means starting the whole thing again."}
            </p>
            <div className="mt-5 flex flex-col gap-2.5">
              <Button variant="paper" size="lg" onClick={() => setConfirmQuit(false)}>
                Keep going
              </Button>
              <Button
                variant="coral"
                size="lg"
                onClick={() => {
                  trackTestQuit({
                    test_id: test.id,
                    audience: test.audience,
                    band: test.band,
                    question_index: index + 1,
                    question_total: total,
                    answered: answeredCount,
                    elapsed_s: Math.max(
                      0,
                      Math.round(test.durationSeconds - secondsLeft(deadlineAt)),
                    ),
                  });
                  onQuit();
                }}
              >
                Quit
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
