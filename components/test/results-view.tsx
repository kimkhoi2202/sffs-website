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
import { QuestionReview } from "./review/question-review";
import { ShareToChild } from "./share-to-child";
import { MASKED_VALUE, type TestResult, type VerdictId } from "@/lib/test/scoring";
import { VERDICT_INK } from "@/lib/test/types";
import type { Domain, Test } from "@/lib/test/types";
import { cn } from "@/lib/utils";

const DOMAIN_LABEL: Record<Domain, string> = {
  verbal: "Word puzzles",
  quantitative: "Number puzzles",
  spatial: "Shape puzzles",
  logic: "Logic puzzles",
};

const DOMAIN_ORDER: Domain[] = ["verbal", "quantitative", "spatial", "logic"];

/**
 * THE TWO END BANDS GET A STICKER INSTEAD OF THE WORDS.
 *
 * Each piece of art already spells its own verdict out, so rendering it next to
 * an <h1> saying the same thing would print the verdict twice. The image IS the
 * heading in these cases — it carries the title as its `alt`, so the heading
 * still has text for a screen reader, and it is sized past the score above it
 * because these are the two results people screenshot.
 *
 * EVERY VERDICT HAS ONE NOW, which it could not before. The rule used to be
 * that only the two CERTIFIED bands got a sticker, because both pieces of art
 * say "certified" and the three middle bands could not make that claim without
 * contradicting the score printed directly above them. Those bands are gone, so
 * the exception is gone with them: there are two outcomes and two stickers, and
 * each one's words match its own verdict.
 *
 * Intrinsic dimensions are the real pixel size of each PNG, present so the
 * browser reserves the right box before the image loads and the card does not
 * jump.
 */
const VERDICT_BADGE: Partial<
  Record<VerdictId, { src: string; width: number; height: number }>
> = {
  "smart-fella": {
    src: "/certified-smart-fella.png",
    width: 560,
    height: 651,
  },
  "fart-smella": {
    src: "/certified-fart-smella.png",
    width: 546,
    height: 592,
  },
};

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
  const badge = VERDICT_BADGE[result.verdict.id];

  const byDomain = DOMAIN_ORDER.map((d) => {
    const items = result.items.filter((i) => i.item.domain === d);
    return { domain: d, total: items.length, correct: items.filter((i) => i.correct).length };
  }).filter((row) => row.total > 0);

  return (
    <div className={cn("flex w-full flex-col gap-4", className)}>
      {/* -- score and verdict ------------------------------------------------ */}
      <div className="flex flex-col items-center gap-3 rounded-2xl border-[2.5px] border-ink bg-yellow p-5 text-center shadow-hard-lg sm:p-7">
        {/* NO "YOUR SCORE" LABEL. The number is the largest thing on the
            page and sits directly under the test's name; labelling it tells a
            reader something they worked out before they read the label. The
            timed-out case still says so, because that is news. */}
        {timedOut ? <span className="eyebrow text-ink/70">Time ran out</span> : null}
        <p className="font-display text-[clamp(3.5rem,18vw,6rem)] leading-[0.85] tracking-[-0.02em]">
          {/* The numerator is the thing being withheld. The denominator is not
              a secret and keeping it real is what stops the mask reading as an
              error state. */}
          {masked ? MASKED_VALUE : result.score}
          <span className="text-ink/40">/{result.max}</span>
        </p>
        {/*
          ONE MASKED ELEMENT IS ENOUGH, AND IT IS THE SCORE.

          This used to render "???" here too, under the "???/15" above it, with
          "your verdict is in the email" under that. Three lines saying the same
          absence, and repeated placeholder glyphs stop reading as a deliberate
          tease and start reading as a page that failed to load.

          Masking the verdict rather than inventing one is still right — a fake
          "Mostly Smart Fella" fails for the same reason a fake score does — but
          an absence does not need its own glyph when there is already a line
          explaining it.
        */}
        {masked ? null : badge ? (
          <h1 className="w-full">
            {/* eslint-disable-next-line @next/next/no-img-element -- static public asset */}
            <img
              src={badge.src}
              alt={result.verdict.title}
              width={badge.width}
              height={badge.height}
              /*
                SIZED SO THE CARD READS SCORE, THEN BADGE, THEN LINE. At 20-24rem
                it was the tallest thing on the page by a distance and pushed
                the subline off a laptop screen entirely, which inverted the
                order: the number is the information and the badge is the joke.
                Capped against the VIEWPORT HEIGHT as well as the column width,
                because the problem was never how wide it was.
              */
              className="mx-auto my-2 h-auto max-h-[28vh] w-[min(100%,11rem)] select-none object-contain sm:my-3 sm:w-[min(100%,13rem)]"
              draggable={false}
            />
          </h1>
        ) : (
          <h1
            /* Green at the top, red at the bottom, ink in the middle. Measured
               against this card's yellow, not picked from the brand tokens —
               see VERDICT_INK. */
            style={{ color: VERDICT_INK[result.verdict.id] ?? "var(--color-ink)" }}
            className="text-balance font-display text-[clamp(1.5rem,7vw,2.5rem)] uppercase leading-[1.02] tracking-[-0.015em]"
          >
            {result.verdict.title}
          </h1>
        )}
        <p className="text-pretty text-[0.975rem] font-semibold leading-snug text-ink/80">
          {result.verdict.subline}
        </p>
        {timedOut ? (
          <p className="text-pretty text-xs font-bold uppercase leading-snug tracking-wide text-ink/60">
            {result.answered} of {result.max} answered before the clock stopped.
          </p>
        ) : null}
      </div>

      {/* -- the split by domain ----------------------------------------------- */}
      {byDomain.length > 1 ? (
        <div className="flex flex-col gap-2.5 rounded-2xl border-[2.5px] border-ink bg-paper p-4 shadow-hard-sm sm:p-5">
          {/* No heading: four labelled bars with scores beside them are self
              evidently a breakdown. */}
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
              {/* Masked: the empty track is the whole message. A column of
                  "?/4" beside it was four more placeholders saying what the
                  empty bar already says. The width is reserved either way so
                  the rows do not shift when the real page loads. */}
              <span className="w-11 shrink-0 text-right font-mono text-sm font-bold tabular-nums text-ink">
                {masked ? "" : `${row.correct}/${row.total}`}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      {/* -- question by question ------------------------------------------------ */}
      {masked ? (
        /*
          A SHAPE, NOT A BLURRED COPY. The real review holds every question,
          every option and every answer, so the gated version does not render it
          and style it out — it renders none of it. A blurred element is still
          in the DOM and readable by anyone who opens a devtools panel, which is
          not a standard the rest of this gate is held to.

          The rows keep their count and height so the card does not jump when
          the real page loads from the emailed link.
        */
        <div className="flex flex-col gap-2 rounded-2xl border-[2.5px] border-ink bg-paper p-4 shadow-hard-sm sm:p-5">
          <h2 className="font-display text-lg uppercase leading-none">Question by question</h2>
          <ol className="flex flex-col gap-1.5">
            {result.items.map((scored, i) => (
              <li key={scored.item.id} className="flex items-center gap-2.5 py-1">
                <span
                  aria-hidden="true"
                  className="size-6 shrink-0 rounded-full border-[2.5px] border-ink bg-cream"
                />
                <span className="block text-[0.8rem] font-extrabold uppercase leading-tight tracking-wide text-ink/60">
                  {i + 1}. {scored.item.tier}
                </span>
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <QuestionReview items={result.items} />
      )}

      {/* Only on the adult results. It is the one screen whose reader has
          definitely not already been offered the child test, and handing a
          child a share tool is not something this flow should do. */}
      {test.audience === "adult" ? <ShareToChild /> : null}
    </div>
  );
}
