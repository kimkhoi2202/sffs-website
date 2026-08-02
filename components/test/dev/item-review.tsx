/**
 * THE ITEM REVIEW: all 125 questions, grouped by demographic, rendered exactly
 * as a test-taker sees them.
 *
 * Reachable from the dev panel, or with Ctrl+Shift+R.
 *
 * ===========================================================================
 * WHY THIS IS A PAGE AND NOT A DOCUMENT
 * ===========================================================================
 * Half the bank is visual. A figure matrix cannot be reviewed as text — you
 * cannot tell from a list of shape names whether the rotation rule is visible,
 * whether a fill has swallowed the element another rule acts on, or whether two
 * options are the same picture. Those are the defects that actually ship, and
 * every one of them is only findable by looking. So the review surface renders
 * the real `QuestionView`, the same component the runner uses, with the same
 * option cards at the same sizes.
 *
 * ===========================================================================
 * WHAT IS SHOWN BESIDE EACH ITEM
 * ===========================================================================
 * The rendered question, then everything a reviewer needs and a player must
 * never see: the item type, the rule id it was generated from, the key, and for
 * every wrong option the specific mistake it is there to catch. That last one
 * is the deliverable. A distractor with no error behind it is decoration, and
 * decoration is how a four-way item quietly becomes a one-way one.
 *
 * Items the blind solve did not agree with, or hesitated over, carry a marker.
 * See ./blind-solve.ts — it is a highlighter, not a verdict.
 *
 * ===========================================================================
 * THE THING ONLY A HUMAN CAN JUDGE
 * ===========================================================================
 * The banks are laid out in gradient order — adult first, then grade 3 up to
 * grades 7 and 8 — because the question this page exists to answer is whether
 * the difficulty curve is real. Every mechanical property of these items is
 * checked by `npm run verify:tests` and `npm run audit:content`. Whether a
 * grade 5 item is actually harder than a grade 4 one is not mechanical, and
 * this is the only place to see it.
 */
"use client";

import { useEffect, useMemo, useState } from "react";

import { BLIND_SOLVE } from "./blind-solve";
import { OptionLettersProvider } from "../question/option-card";
import { QuestionView } from "../question/question-view";
import { ALL_TESTS } from "@/lib/test/tests";
import type { Test, TestItem } from "@/lib/test/types";
import { cn } from "@/lib/utils";

if (process.env.NODE_ENV === "production") {
  throw new Error(
    "SFFS_DEVTOOLS_MUST_NOT_SHIP: the item review was imported in a " +
      "production build. It is development-only and mounts through DevToolsGate.",
  );
}

/** Adult first, then the child banks in gradient order. */
const BAND_LABEL: Record<string, string> = {
  adult: "Grown-ups · 50 items · 15 minutes",
  "grade-3": "Grade 3 · 15 items · 5 minutes",
  "grade-4": "Grade 4 · 15 items · 5 minutes",
  "grade-5": "Grade 5 · 15 items · 5 minutes",
  "grade-6": "Grade 6 · 15 items · 5 minutes",
  "grade-7-8": "Grades 7 and 8 · 15 items · 5 minutes",
};

const ORDER = ["adult", "grade-3", "grade-4", "grade-5", "grade-6", "grade-7-8"];

function Meta({ item, index }: { item: TestItem; index: number }) {
  const flag = BLIND_SOLVE[item.id];
  const key = item.options.find((o) => o.id === item.answer);
  const keyText = "text" in (key ?? {}) ? (key as { text: string }).text : "the figure shown";

  return (
    <div className="mt-4 w-full rounded-xl border-2 border-ink/15 bg-cream/70 p-3 font-mono text-[0.68rem] leading-relaxed text-ink/75">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="rounded bg-ink px-1.5 py-0.5 font-bold text-paper">
          {index + 1}. {item.tier}
        </span>
        <span className="font-bold text-ink">
          key {item.answer}
          {keyText ? ` — ${keyText}` : ""}
        </span>
      </div>

      {item.rule ? (
        <div className="mt-1.5">
          <span className="text-ink/45">rule </span>
          {item.rule}
        </div>
      ) : (
        <div className="mt-1.5 text-coral">no rule recorded — this item has no provenance</div>
      )}

      {item.explanation ? (
        <div className="mt-1.5">
          <span className="text-ink/45">shown when wrong </span>
          {item.explanation}
        </div>
      ) : null}

      <ul className="mt-2 flex flex-col gap-1 border-t border-ink/10 pt-2">
        {item.options
          .filter((o) => o.id !== item.answer)
          .map((o) => (
            <li key={o.id} className="flex gap-2">
              <span className="shrink-0 font-bold text-ink/50">{o.id}</span>
              <span className={o.why ? "" : "text-coral"}>
                {o.why ?? "NO INTENDED ERROR RECORDED — this option is decoration"}
              </span>
            </li>
          ))}
      </ul>

      {flag ? (
        <div
          className={cn(
            "mt-2 rounded-lg border-2 border-ink p-2",
            flag.kind === "disagree" ? "bg-coral" : "bg-yellow",
          )}
        >
          <span className="font-bold uppercase tracking-wide">
            {flag.kind === "disagree"
              ? `Blind solve disagreed — it picked ${flag.picked}`
              : "Blind solve agreed, but hesitated"}
          </span>
          <p className="mt-1 font-sans text-[0.75rem] font-medium leading-snug">{flag.note}</p>
        </div>
      ) : null}
    </div>
  );
}

function Bank({ test }: { test: Test }) {
  const flags = test.items.filter((i) => BLIND_SOLVE[i.id]);
  const tiers = [...new Set(test.items.map((i) => i.tier))];

  return (
    <section id={`bank-${test.id}`} className="scroll-mt-16">
      <header className="sticky top-0 z-10 -mx-4 mb-6 border-y-[2.5px] border-ink bg-yellow px-4 py-3">
        <h2 className="font-display text-2xl uppercase leading-none">{BAND_LABEL[test.id] ?? test.id}</h2>
        <p className="mt-1 font-mono text-[0.68rem] text-ink/70">
          {tiers.join(" · ")}
          {flags.length > 0 ? ` · ${flags.length} flagged by the blind solve` : ""}
        </p>
      </header>

      <div className="flex flex-col gap-10">
        {test.items.map((item, i) => (
          <article
            key={item.id}
            className="flex flex-col items-center rounded-2xl border-[2.5px] border-ink bg-paper p-4 shadow-hard-sm"
          >
            {/*
              The real renderer, not a summary of it. `picked` is always null and
              the click handler does nothing: this is a mirror, and a reviewer
              accidentally "answering" a question here would be confusing rather
              than useful.
            */}
            {/*
              Figural options show their A/B/C/D badge HERE and nowhere else.
              The Meta line below prints "key C", and without letters on the
              cards there is no way to tell which of four shapes that is, which
              is the one thing this page exists to let a reviewer check.
            */}
            <OptionLettersProvider>
              <QuestionView item={item} picked={null} onPick={() => {}} />
            </OptionLettersProvider>
            <Meta item={item} index={i} />
          </article>
        ))}
      </div>
    </section>
  );
}

export function ItemReview({ onClose }: { onClose: () => void }) {
  const [only, setOnly] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const banks = useMemo(
    () =>
      [...ALL_TESTS].sort((a, b) => ORDER.indexOf(a.id) - ORDER.indexOf(b.id)),
    [],
  );
  const shown = only ? banks.filter((b) => b.id === only) : banks;
  const totalFlags = ALL_TESTS.reduce(
    (n, t) => n + t.items.filter((i) => BLIND_SOLVE[i.id]).length,
    0,
  );

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-cream">
      <div className="sticky top-0 z-20 flex flex-wrap items-center gap-2 border-b-[2.5px] border-ink bg-ink px-4 py-2.5">
        <span className="mr-2 font-mono text-[0.7rem] font-bold text-yellow">
          ITEM REVIEW
          <span className="ml-1.5 font-normal text-paper/40">
            {ALL_TESTS.reduce((n, t) => n + t.items.length, 0)} items · {totalFlags} flagged
          </span>
        </span>

        <button
          type="button"
          onClick={() => setOnly(null)}
          className={cn(
            "cursor-pointer rounded-md border px-2 py-1 font-mono text-[0.65rem] leading-none",
            only === null
              ? "border-yellow bg-yellow text-ink"
              : "border-paper/25 bg-paper/5 text-paper hover:bg-paper/15",
          )}
        >
          all
        </button>
        {banks.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => setOnly(b.id)}
            className={cn(
              "cursor-pointer rounded-md border px-2 py-1 font-mono text-[0.65rem] leading-none",
              only === b.id
                ? "border-yellow bg-yellow text-ink"
                : "border-paper/25 bg-paper/5 text-paper hover:bg-paper/15",
            )}
          >
            {b.id}
          </button>
        ))}

        <button
          type="button"
          onClick={onClose}
          className="ml-auto cursor-pointer rounded-md border border-paper/25 bg-paper/5 px-2 py-1 font-mono text-[0.65rem] leading-none text-paper hover:bg-paper/15"
        >
          close (esc)
        </button>
      </div>

      {/* A single column at the width the runner uses, so an item that is
          cramped on a phone is cramped here too. Reviewing these at desktop
          width would hide the one problem the layout can actually cause. */}
      <div className="mx-auto w-full max-w-md px-4 pb-24 pt-6">
        {shown.map((test) => (
          <div key={test.id} className="mb-16">
            <Bank test={test} />
          </div>
        ))}
      </div>
    </div>
  );
}
