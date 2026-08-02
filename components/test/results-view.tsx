/**
 * The results themselves: score, verdict, breakdown, question by question.
 *
 * Presentational and audience-agnostic about WHERE it is rendered. Two callers:
 *
 *   - components/test/gated-results.tsx, which blurs it behind the email box
 *     immediately after a test
 *   - app/results/[token]/page.tsx, which renders it unblurred from the stored
 *     record when someone follows the link in their email
 *
 * One component for both, so the thing in the email is the same thing they were
 * looking at through the blur. Deliberately not a client component: the results
 * page is a server render, and only the share button below needs the browser.
 *
 * ===========================================================================
 * WHAT IS NOT HERE
 * ===========================================================================
 * No IQ number, no standard age score, no stanine, no percentile. Neither can
 * be substantiated: a score like that is a normed measurement against a
 * representative sample, and any percentile borrowed from a real publisher's
 * norms describes a different population sitting a different instrument under
 * different stakes. Printing one next to a brand that says "Official" would be
 * inventing a number for a page a parent may show their child.
 *
 * A percentile against OUR OWN users would be honest, and the record shape for
 * it already exists — see `TestSubmission` in lib/test/types.ts. It needs a
 * large per-band sample first, and it is not shown until then.
 *
 * What is honest, and is here: how many out of how many, how that split across
 * the domains, and a joke.
 */
import { ShareToChild } from "./share-to-child";
import { MASKED_VALUE, type TestResult } from "@/lib/test/scoring";
import type { Domain, Test } from "@/lib/test/types";
import { cn } from "@/lib/utils";

const DOMAIN_LABEL: Record<Domain, string> = {
  verbal: "Word puzzles",
  quantitative: "Number puzzles",
  spatial: "Shape puzzles",
  logic: "Logic puzzles",
};

const DOMAIN_ORDER: Domain[] = ["verbal", "quantitative", "spatial", "logic"];

export function ResultsView({
  test,
  result,
  timedOut,
  masked,
  className,
}: {
  test: Test;
  result: TestResult;
  timedOut: boolean;
  /**
   * WITHHOLD EVERY VALUE THE PLAYER EARNED, and show that it is being withheld.
   *
   * Set only by the gated screen. In this mode nothing reads `result.score`,
   * `result.percent`, `result.verdict`, `result.answered` or any item's
   * `correct` flag — the caller does not have them (see `maskedResult`), and
   * the markup below does not go looking.
   *
   * Every total STAYS REAL and every element keeps its box, so the page holds
   * its exact shape and nothing jumps when the unmasked version loads from the
   * emailed link.
   */
  masked?: boolean;
  className?: string;
}) {
  const byDomain = DOMAIN_ORDER.map((d) => {
    const items = result.items.filter((i) => i.item.domain === d);
    return { domain: d, total: items.length, correct: items.filter((i) => i.correct).length };
  }).filter((row) => row.total > 0);

  return (
    <div className={cn("flex w-full flex-col gap-4", className)}>
      {/* -- score and verdict ------------------------------------------------ */}
      <div className="flex flex-col items-center gap-3 rounded-2xl border-[2.5px] border-ink bg-yellow p-5 text-center sm:p-7">
        <span className="eyebrow text-ink/70">
          {timedOut ? "Time ran out" : "Your score"}
        </span>
        <p className="font-display text-[clamp(3.5rem,18vw,6rem)] leading-[0.85] tracking-[-0.02em]">
          {/* The numerator is the thing being withheld. The denominator is not
              a secret and keeping it real is what stops the mask reading as an
              error state. */}
          {masked ? MASKED_VALUE : result.score}
          <span className="text-ink/40">/{result.max}</span>
        </p>
        <h1 className="text-balance font-display text-[clamp(1.5rem,7vw,2.5rem)] uppercase leading-[1.02] tracking-[-0.015em]">
          {result.verdict.title}
        </h1>
        <p className="text-pretty text-[0.975rem] font-semibold leading-snug text-ink/80">
          {result.verdict.subline}
        </p>
        {timedOut ? (
          <p className="text-pretty text-xs font-bold uppercase leading-snug tracking-wide text-ink/60">
            {masked ? MASKED_VALUE : result.answered} of {result.max} answered before the
            clock stopped.
          </p>
        ) : null}
      </div>

      {/* -- the split by domain ----------------------------------------------- */}
      {byDomain.length > 1 ? (
        <div className="flex flex-col gap-2.5 rounded-2xl border-[2.5px] border-ink bg-paper p-4 sm:p-5">
          <h2 className="font-display text-lg uppercase leading-none">How it broke down</h2>
          {byDomain.map((row) => (
            <div key={row.domain} className="flex items-center gap-3">
              <span className="w-[7.5rem] shrink-0 text-[0.85rem] font-bold leading-tight text-ink">
                {DOMAIN_LABEL[row.domain]}
              </span>
              {/* An empty track, not a plausible fill. A bar at 60% is a
                  number stated in pixels, and it is the same fake the score
                  used to be. */}
              <span
                aria-hidden="true"
                className="h-3 flex-1 rounded-full border-[2px] border-ink bg-gray-100"
              >
                <span
                  className="block h-full rounded-full bg-blue"
                  style={{ width: masked ? "0%" : `${(row.correct / row.total) * 100}%` }}
                />
              </span>
              <span className="w-11 shrink-0 text-right font-mono text-sm font-bold tabular-nums text-ink">
                {masked ? "?" : row.correct}/{row.total}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      {/* -- question by question ------------------------------------------------ */}
      <div className="flex flex-col gap-2 rounded-2xl border-[2.5px] border-ink bg-paper p-4 sm:p-5">
        <h2 className="font-display text-lg uppercase leading-none">Question by question</h2>
        <ol className="flex flex-col gap-1.5">
          {result.items.map((scored, i) => (
            <li key={scored.item.id} className="flex items-start gap-2.5 py-1">
              {/* Masked: one neutral chip per question rather than a made-up
                  run of ticks and crosses. Same chip, same size, same row
                  height, so the list does not reflow on the real page. */}
              <span
                aria-hidden="true"
                className={cn(
                  "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border-[2.5px] border-ink text-xs font-black leading-none",
                  masked
                    ? "bg-cream text-ink/50"
                    : scored.correct
                      ? "bg-mint"
                      : scored.picked === null
                        ? "bg-gray-200"
                        : "bg-coral",
                )}
              >
                {masked
                  ? "?"
                  : scored.correct
                    ? "\u2713"
                    : scored.picked === null
                      ? "\u2013"
                      : "\u2715"}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[0.8rem] font-extrabold uppercase leading-tight tracking-wide text-ink/60">
                  {i + 1}. {scored.item.tier}
                  {masked ? null : (
                    <span className="sr-only">
                      {scored.correct
                        ? " \u2014 correct"
                        : scored.picked === null
                          ? " \u2014 not answered"
                          : " \u2014 incorrect"}
                    </span>
                  )}
                </span>
                {/* The explanation only appears under a wrong answer, so in
                    masked mode showing it would both invent an outcome and
                    hand over the reasoning for every question at once. */}
                {!masked && !scored.correct && scored.item.explanation ? (
                  <span className="mt-0.5 block text-pretty text-[0.85rem] font-medium leading-snug text-ink/75">
                    {scored.item.explanation}
                  </span>
                ) : null}
              </span>
            </li>
          ))}
        </ol>
      </div>

      {/* Only on the adult results. It is the one screen whose reader has
          definitely not already been offered the child test, and handing a
          child a share tool is not something this flow should do. */}
      {test.audience === "adult" ? <ShareToChild /> : null}
    </div>
  );
}
