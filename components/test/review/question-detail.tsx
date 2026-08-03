/**
 * One question, after the fact: what was asked, what they picked, what was
 * right, and why.
 *
 * ===========================================================================
 * THE STIMULUS IS RENDERED, THE OPTIONS ARE RENDERED ONCE
 * ===========================================================================
 * The question comes from `QuestionView` — the same component the runner uses,
 * with the same figure renderers — because half the bank is visual and a
 * sentence of prose about a matrix teaches nobody anything about the matrix
 * they got wrong.
 *
 * But that component draws the stimulus AND the options, so the first version
 * of this panel showed both: four neutral options from the question, then the
 * same four again underneath carrying the answer state. A reader met "A 54,
 * B 26, C 25, D 31" and then immediately "A 54, B 26 THE RIGHT ANSWER, C 25,
 * D 31 YOU PICKED THIS", which reads as a second, different question and
 * doubled the panel's height. `stimulusOnly` suppresses the group so the state
 * list below is the only one.
 *
 * ===========================================================================
 * FIGURAL OPTIONS KEEP THEIR FIGURE, AND THE STATE GOES ROUND IT
 * ===========================================================================
 * On a matrix or an odd-one-out the options ARE shapes, so a text row saying
 * "Option B" would throw away the only content the option has. They are drawn
 * with the same renderer as the question.
 *
 * The state cannot be a fill behind them. These figures are black line work on
 * paper, and a mint or coral wash behind one drops its contrast and makes the
 * thing being examined harder to see — on the item where a person is trying to
 * work out what they missed. So a figural row keeps a paper background and
 * carries its state on the BORDER and the label instead. Text rows, which have
 * no such problem, keep the fill.
 */
"use client";

import { FigCellContent } from "@/components/test/question/figure";
import { QuestionView } from "@/components/test/question/question-view";
import { readableNote } from "@/lib/test/distractor-note";
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

/** Text rows take the fill. Figural rows take the border only — see above. */
const FILL_STYLE: Record<OptionState, string> = {
  right: "border-ink bg-mint",
  correct: "border-ink bg-mint",
  chosen: "border-ink bg-coral",
  neutral: "border-ink/25 bg-paper",
};
const OUTLINE_STYLE: Record<OptionState, string> = {
  right: "border-[#0f5132] bg-paper",
  correct: "border-[#0f5132] bg-paper",
  chosen: "border-[#8f1d17] bg-paper",
  neutral: "border-ink/25 bg-paper",
};

const STATE_LABEL: Record<OptionState, string | null> = {
  right: "Your answer, and it is right",
  correct: "The right answer",
  chosen: "You picked this",
  neutral: null,
};

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

    Every wrong option was authored against a specific named error and until
    now none of it reached anybody. `readableNote` takes our rule code off the
    front — that part is an audit trail, not copy.
  */
  const pickedOption = picked ? item.options.find((o) => o.id === picked) : null;
  const pickedWhy =
    pickedOption && picked !== answer && typeof pickedOption.why === "string"
      ? readableNote(pickedOption.why)
      : null;

  return (
    <article className="flex w-full flex-col gap-4">
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

      {/* NO CARD AROUND IT. A bordered box inside a bordered panel is a frame
          around a frame; the panel is already the container. */}
      <QuestionView item={item} picked={null} onPick={() => {}} stimulusOnly />

      <ul className="flex flex-col gap-2">
        {item.options.map((option) => {
          const state = stateFor(option.id, answer, picked);
          const label = STATE_LABEL[state];
          const text = typeof (option as { text?: unknown }).text === "string"
            ? (option as { text: string }).text
            : null;
          const fig = (option as { fig?: Parameters<typeof FigCellContent>[0]["fig"] }).fig;
          return (
            <li
              key={option.id}
              className={cn(
                "flex items-center gap-3 rounded-xl border-[2.5px] p-2.5",
                fig ? OUTLINE_STYLE[state] : FILL_STYLE[state],
              )}
            >
              <span
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-full border-[2.5px] border-ink bg-paper font-sans text-xs font-extrabold leading-none",
                  state === "neutral" ? "text-ink/60" : "text-ink",
                )}
              >
                {option.id}
              </span>

              {fig ? (
                <span className="grid size-14 shrink-0 place-items-center">
                  <FigCellContent fig={fig} />
                </span>
              ) : null}

              <span className="min-w-0 flex-1">
                {text ? (
                  <span className="block text-[0.95rem] font-bold leading-snug text-ink">
                    {text}
                  </span>
                ) : null}
                {label ? (
                  <span
                    className={cn(
                      "block text-[0.72rem] font-extrabold uppercase leading-tight tracking-[0.08em]",
                      fig && state === "chosen" ? "text-[#8f1d17]" : "",
                      fig && (state === "right" || state === "correct") ? "text-[#0f5132]" : "",
                      !fig ? "text-ink/70" : "",
                    )}
                  >
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
            {/* Confirmation reads differently from correction. */}
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
