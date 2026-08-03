/**
 * One question, after the fact: what was asked, what they picked, what was
 * right, and why.
 *
 * ===========================================================================
 * THE QUESTION IS RENDERED, NOT DESCRIBED
 * ===========================================================================
 * This uses `QuestionView` — the same component the runner uses, with the same
 * figure renderers — rather than a summary of it. That is the whole point of
 * the rebuild. Half the bank is visual, and "FIGURE MATRIX" over a sentence of
 * prose teaches nobody anything about a matrix they got wrong; they need to see
 * the grid. Reusing the real component also means a change to how a question
 * looks can never drift away from how its review looks.
 *
 * It is rendered INERT: `picked` is null and the pick handler does nothing, so
 * the option cards below carry the answer state instead. Letting someone
 * "answer" a question they have already finished would be a puzzle in itself.
 *
 * ===========================================================================
 * THE OPTIONS SAY THREE DIFFERENT THINGS
 * ===========================================================================
 *   right       they picked it and it was correct. ONE state, not two
 *               overlapping highlights — this is the moment worth feeling good
 *               about and it should read as a win rather than as a collision
 *               between "your answer" and "the answer".
 *   correct     the right answer, which they did not pick.
 *   chosen      what they picked, which was wrong.
 *
 * A skipped question has a `correct` and nothing else, which is the honest
 * picture: there is no wrong answer to look at because they never gave one.
 */
"use client";

import { QuestionView } from "@/components/test/question/question-view";
import type { ScoredItem } from "@/lib/test/scoring";
import { cn } from "@/lib/utils";

type OptionState = "right" | "correct" | "chosen" | "neutral";

function stateFor(optionId: string, answerId: string, picked: string | null): OptionState {
  const isAnswer = optionId === answerId;
  const isPicked = optionId === picked;
  if (isAnswer && isPicked) return "right";
  if (isAnswer) return "correct";
  if (isPicked) return "chosen";
  return "neutral";
}

const STATE_STYLE: Record<OptionState, string> = {
  right: "border-ink bg-mint",
  correct: "border-ink bg-mint",
  chosen: "border-ink bg-coral",
  neutral: "border-ink/25 bg-paper",
};

const STATE_LABEL: Record<OptionState, string | null> = {
  right: "Your answer, and it is right",
  correct: "The right answer",
  chosen: "You picked this",
  neutral: null,
};

/**
 * The text of an option, whatever kind it is.
 *
 * A figural option has no text, and its own drawing is already visible in the
 * rendered question above, so the row names it by letter and lets the grid do
 * the showing. Repeating four SVGs at a smaller size next to four SVGs would be
 * noise, not information.
 */
function optionText(option: { id: string } & Record<string, unknown>): string | null {
  return typeof option.text === "string" ? option.text : null;
}

export function QuestionDetail({
  scored,
  index,
  total,
}: {
  scored: ScoredItem;
  index: number;
  total: number;
}) {
  const { item, picked } = scored;
  const answer = item.answer;

  /*
    THE DISTRACTOR'S OWN NOTE, SHOWN TO THE PERSON WHO PICKED IT.

    Every wrong option in the bank was authored against a specific named error —
    "WP-relation: what a gardener tends, not what they hold" — and until now
    none of it reached anybody. It was written for exactly this moment and read
    only by us. Surfacing it is the single biggest thing this page can do,
    because it is the difference between "you were wrong" and "here is the
    mistake you made, and it has a name".
  */
  const pickedOption = picked ? item.options.find((o) => o.id === picked) : null;
  const pickedWhy =
    pickedOption && picked !== answer && typeof pickedOption.why === "string"
      ? pickedOption.why
      : null;

  return (
    <article className="flex w-full flex-col gap-5">
      <header className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border-[2.5px] border-ink bg-yellow px-3 py-1 font-sans text-[0.7rem] font-extrabold uppercase leading-none tracking-[0.1em] text-ink">
          {index + 1} of {total}
        </span>
        <span className="font-sans text-[0.7rem] font-extrabold uppercase leading-none tracking-[0.1em] text-ink/55">
          {item.tier}
        </span>
        <span
          className={cn(
            "ml-auto rounded-full border-[2.5px] border-ink px-3 py-1 font-sans text-[0.7rem] font-extrabold uppercase leading-none tracking-[0.1em]",
            scored.correct ? "bg-mint" : picked === null ? "bg-gray-200" : "bg-coral",
          )}
        >
          {scored.correct ? "Correct" : picked === null ? "Skipped" : "Wrong"}
        </span>
      </header>

      {/* The real thing, inert. */}
      <div className="rounded-2xl border-[2.5px] border-ink bg-cream p-3 sm:p-4">
        <QuestionView item={item} picked={null} onPick={() => {}} />
      </div>

      <ul className="flex flex-col gap-2">
        {item.options.map((option) => {
          const state = stateFor(option.id, answer, picked);
          const label = STATE_LABEL[state];
          const text = optionText(option as never);
          return (
            <li
              key={option.id}
              className={cn(
                "flex items-start gap-3 rounded-xl border-[2.5px] p-3",
                STATE_STYLE[state],
              )}
            >
              <span
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-full border-[2.5px] border-ink font-sans text-xs font-extrabold leading-none",
                  state === "neutral" ? "bg-paper text-ink/60" : "bg-paper text-ink",
                )}
              >
                {option.id}
              </span>
              <span className="min-w-0 flex-1">
                {text ? (
                  <span className="block text-[0.95rem] font-bold leading-snug text-ink">
                    {text}
                  </span>
                ) : (
                  <span className="block text-[0.9rem] font-bold leading-snug text-ink/70">
                    Option {option.id} above
                  </span>
                )}
                {label ? (
                  <span className="mt-1 block text-[0.72rem] font-extrabold uppercase tracking-[0.08em] text-ink/70">
                    {label}
                  </span>
                ) : null}
              </span>
            </li>
          );
        })}
      </ul>

      {pickedWhy ? (
        <div className="rounded-2xl border-[2.5px] border-ink bg-coral/25 p-4">
          <h3 className="mb-1.5 font-sans text-[0.7rem] font-extrabold uppercase tracking-[0.1em] text-ink/70">
            Why that one is tempting
          </h3>
          <p className="text-pretty text-[0.95rem] font-semibold leading-relaxed text-ink">
            {pickedWhy}
          </p>
        </div>
      ) : null}

      {item.explanation ? (
        <div className="rounded-2xl border-[2.5px] border-ink bg-paper p-4">
          <h3 className="mb-1.5 font-sans text-[0.7rem] font-extrabold uppercase tracking-[0.1em] text-ink/70">
            {/* Confirmation reads differently from correction, and a person who
                reasoned it out should not get the same header as one who did
                not. */}
            {scored.correct ? "Why that is right" : "How it works"}
          </h3>
          <p className="text-pretty text-[0.95rem] font-semibold leading-relaxed text-ink">
            {item.explanation}
          </p>
        </div>
      ) : null}
    </article>
  );
}
