/**
 * One question: the tier pill, the prompt, the stimulus, and the options.
 *
 * A single switch on `item.kind` covers all twelve question types, because the
 * twelve types are only six data shapes (see the header of lib/test/types.ts).
 *
 * LAYOUT SHIFT. Nothing here reserves a fixed height, and it does not need to:
 * the runner puts this inside a flex region whose size is fixed by the viewport,
 * so a short question and a tall one both leave the header, the timer and the
 * Next button exactly where they were. That is the only place the guarantee can
 * live — trying to normalise the height of a 4-word text option and a 2x2 figure
 * matrix here would mean padding every short question with dead space.
 */
"use client";

import { Fragment } from "react";

import { FigCellContent, FigCell, FigureCell, QuestionCell } from "./figure";
import { OptionGroup, TextOptionCard, VisualOptionCard } from "./option-card";
import { DotSquare, FoldStrip, HoleGrid, PolygonShape, creaseAxes } from "./shapes";
import { describeDot, describeFig, describeHoles, describePoly } from "./describe";
import type { TableData, TestItem } from "@/lib/test/types";
import { cn } from "@/lib/utils";

/* ==========================================================================
 * Small shared pieces
 * ========================================================================== */

/** A sequence tile: one term of a series, or the "?" the player is filling. */
function SeqTile({ children, blank }: { children?: React.ReactNode; blank?: boolean }) {
  return (
    <div
      className={cn(
        "grid min-h-[3.25rem] min-w-[3.25rem] shrink-0 place-items-center rounded-xl border-[2.5px] border-ink px-2.5",
        "font-display text-[clamp(1.25rem,6vw,1.75rem)] leading-none tabular-nums",
        blank ? "bg-yellow" : "bg-paper",
      )}
    >
      {blank ? <span aria-hidden="true">?</span> : children}
    </div>
  );
}

/** A row of tiles that wraps rather than overflowing on a narrow phone. */
function SeqRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">{children}</div>
  );
}

/**
 * The stimulus block. Neutral surface so the drawn items sit on something.
 *
 * NO SHADOW. See the note on the option cards: the test screens are the one
 * place in the product that drops the brand's hard offset shadow, because
 * somebody sits in front of them for five minutes and a screen of floating
 * slabs is heavy. The thick ink keyline carries the house style on its own.
 */
function Stimulus({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-surface="stem"
      className="w-full rounded-2xl border-[2.5px] border-ink bg-cream p-3 sm:p-5"
    >
      {children}
    </div>
  );
}

/**
 * A stimulus that is a list of `a -> b` relations, laid out as real columns.
 *
 * ===========================================================================
 * WHY THIS IS NOT JUST CENTRED TEXT
 * ===========================================================================
 * A number analogy is three lines of `left arrow right`, and rendering them as
 * three centred lines centres each line INDEPENDENTLY. The moment one operand
 * is wider than another (11 against 7, or 120 against 8) that row shifts
 * sideways and the arrows stop lining up. On an item whose entire job is making
 * a numeric relationship legible, a broken column is not a cosmetic problem: the
 * relationship is the thing being read, and the eye reads it down the column.
 *
 * So the operands get their own columns, right-aligned and left-aligned against
 * a fixed arrow in the middle, and the BLOCK is centred rather than the lines.
 *
 * TABULAR FIGURES ARE LOAD-BEARING HERE. In a proportional face a 1 is narrower
 * than a 7, so even with real columns the digits inside a column would not
 * align and the block would drift on some items and not others, which is the
 * version of this bug that is hardest to notice and hardest to explain. This is
 * why the whole stem opts into tabular numerals rather than just this layout.
 */
function RelationRows({ rows }: { rows: Array<[string, string]> }) {
  return (
    <div
      className="mx-auto grid w-fit gap-x-2 gap-y-1 text-[clamp(1rem,4.5vw,1.375rem)] font-bold leading-snug tabular-nums text-ink"
      style={{ gridTemplateColumns: "1fr auto 1fr" }}
    >
      {rows.map(([left, right], i) => (
        <Fragment key={i}>
          <span className="text-right">{left}</span>
          <span aria-hidden="true" className="px-1 text-ink/60">
            &rarr;
          </span>
          <span className="text-left">{right}</span>
          <span className="sr-only">{`${left} goes to ${right}. `}</span>
        </Fragment>
      ))}
    </div>
  );
}

/**
 * Is this stem a list of relations rather than a sentence? Every non-empty line
 * has to be `something -> something`, so a prose stem that happens to contain
 * an arrow is not caught by accident.
 */
function asRelationRows(text: string): Array<[string, string]> | null {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return null;
  const rows: Array<[string, string]> = [];
  for (const line of lines) {
    const m = /^(.+?)\s*(?:\u2192|->)\s*(.+)$/.exec(line);
    if (!m) return null;
    rows.push([m[1].trim(), m[2].trim()]);
  }
  return rows;
}

/**
 * A text stem, with any run of underscores drawn as a real gap.
 *
 * Sentence completion is the single largest item type on the grown-up test and
 * appears at every child level, so the blank is worth rendering properly. Left
 * as literal underscores it is punctuation the eye slides straight over,
 * especially at phone size.
 *
 * IT IS A RULE, NOT A SLOT. An earlier version filled the gap with brand yellow
 * and rounded it, which read as a form field: something to type into, or a
 * highlighted word rather than a missing one. A plain line is the convention
 * every reader already knows from a printed test paper, and it does not compete
 * with the options for attention. Width is in `em` so it tracks the sentence's
 * own type size as the fitter scales it down, and `inline-block` means it wraps
 * as one atomic word rather than splitting across lines.
 *
 * The blank is also announced, since "SAMPLE ______ SAMPLE" read aloud is just
 * a pause.
 */
function Stem({ text }: { text: string }) {
  // A list of relations is a table, not a paragraph, and centring its lines
  // individually breaks the column the item is read down.
  const rows = asRelationRows(text);
  if (rows) return <RelationRows rows={rows} />;

  const parts = text.split(/(_{2,})/g);
  return (
    <p className="whitespace-pre-line text-balance text-center text-[clamp(1rem,4.5vw,1.375rem)] font-bold leading-snug tabular-nums text-ink">
      {parts.map((part, i) =>
        /^_{2,}$/.test(part) ? (
          <span
            key={i}
            className="mx-[0.2em] inline-block w-[3.25em] max-w-full border-b-[2.5px] border-ink align-baseline"
          >
            <span className="sr-only">blank</span>
            <span aria-hidden="true">&nbsp;</span>
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </p>
  );
}

/** The ":" and "::" separators of a figure analogy. */
function AnalogySep({ double }: { double?: boolean }) {
  return (
    <span aria-hidden="true" className="shrink-0 px-0.5 font-display text-xl leading-none text-ink/70">
      {double ? "::" : ":"}
    </span>
  );
}

/**
 * A table or a bar chart.
 *
 * The bar chart is HTML rather than SVG, deliberately: it is a list of labelled
 * lengths, which divs express natively and which stays legible when text is
 * zoomed. It is also a real `<table>` under the labels for screen readers,
 * because a chart nobody can read is not an accessible question — it is an
 * unanswerable one.
 */
function TableStimulus({ data, caption }: { data: TableData; caption?: string }) {
  if (data.type === "table") {
    return (
      <table className="w-full border-collapse text-left">
        {caption ? (
          <caption className="pb-2 text-[0.8rem] font-extrabold uppercase tracking-wide text-ink/60">
            {caption}
          </caption>
        ) : null}
        <thead>
          <tr>
            {data.columns.map((col) => (
              <th
                key={col}
                scope="col"
                className="border-b-[2.5px] border-ink px-2 py-1.5 text-[0.8rem] font-extrabold uppercase tracking-wide text-ink"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, i) => (
            <tr key={i} className="border-b-2 border-ink/15 last:border-0">
              {row.map((cell, j) => (
                <td key={j} className="px-2 py-1.5 text-[0.9rem] font-bold text-ink">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  const peak = Math.max(...data.bars.map((b) => b.value), 1);
  return (
    <div>
      {caption ? (
        <p className="pb-2 text-center text-[0.8rem] font-extrabold uppercase tracking-wide text-ink/60">
          {caption}
        </p>
      ) : null}
      <div className="flex flex-col gap-1.5">
        {data.bars.map((bar) => (
          <div key={bar.label} className="flex items-center gap-2">
            <span className="w-11 shrink-0 text-[0.8rem] font-extrabold uppercase tracking-wide text-ink">
              {bar.label}
            </span>
            <span aria-hidden="true" className="h-5 flex-1 border-[2.5px] border-ink bg-paper">
              <span
                className="block h-full bg-blue"
                style={{ width: `${(bar.value / peak) * 100}%` }}
              />
            </span>
            <span className="w-7 shrink-0 text-right font-mono text-[0.8rem] font-bold tabular-nums text-ink">
              {bar.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ==========================================================================
 * The question
 * ========================================================================== */

export interface QuestionViewProps {
  item: TestItem;
  /** The option id currently picked, or null. */
  picked: string | null;
  onPick: (optionId: string) => void;
}

/**
 * Tiers whose task is obvious from the item itself, so the instruction line is
 * hidden (it stays in the accessibility tree, see below).
 *
 * "PLACEHOLDER is to SAMPLE as FILLER is to ?" does not need to be preceded by
 * "Complete the analogy" — the question mark already is the instruction. Nor
 * does a sequence ending in a blank, or a sentence with a gap in it.
 *
 * TWO THAT ARE NOT ON THIS LIST AND ARGUABLY SHOULD BE. Synonyms and antonyms
 * were suggested as self-evident and they are not, for a specific reason: the
 * items are interleaved rather than grouped into announced sections, so a bare
 * word above four options gives the player no way to know whether we want the
 * same meaning or the opposite. The instruction is the only thing separating
 * the two tasks, so for those it is load-bearing rather than decorative.
 */
const TIERS_WITHOUT_PROMPT = new Set([
  "VERBAL ANALOGY",
  "NUMBER ANALOGY",
  "NUMBER SERIES",
  "LETTER SERIES",
  "SENTENCE COMPLETION",
  "WORD PROBLEM",
  "LOGIC",
]);

export function QuestionView({ item, picked, onPick }: QuestionViewProps) {
  const legend = item.prompt;
  const name = `q-${item.id}`;
  const shared = { name, onSelect: onPick };
  const showPrompt = !TIERS_WITHOUT_PROMPT.has(item.tier);

  return (
    <div className="flex w-full flex-col items-center gap-4 sm:gap-5">
      {/*
        NO ITEM-TYPE PILL. "VERBAL ANALOGY" was our internal taxonomy on the
        player's screen: it does not help anyone answer, it is jargon to an
        eight-year-old, and the real instruments do not label items by type to
        the person sitting them either.

        Dropping it and the redundant instruction gives back two lines on the
        screen where space is scarcest. On a 360x640 phone the stimulus, four
        options and a persistent timer are already competing, and that is the
        screen someone sits through fifteen times.

        The prompt stays in the ACCESSIBILITY TREE either way. When it is not
        shown it becomes `sr-only` rather than being removed: a sighted player
        reads the task off the item, and a screen-reader user still gets told
        what to do. It is also the options fieldset's legend.
      */}
      <h2
        className={
          showPrompt
            ? "text-balance text-center font-display text-[clamp(1.25rem,5.5vw,1.875rem)] uppercase leading-[1.05] tracking-[-0.01em]"
            : "sr-only"
        }
      >
        {item.prompt}
      </h2>

      {/* -- stimulus + options, per kind ----------------------------------- */}
      {item.kind === "text" ? (
        <>
          {item.stem ? (
            <Stimulus>
              <Stem text={item.stem} />
            </Stimulus>
          ) : null}
          <OptionGroup legend={legend} variant="text">
            {item.options.map((o) => (
              <TextOptionCard
                key={o.id}
                {...shared}
                id={o.id}
                checked={picked === o.id}
                label={o.text}
                text={o.text}
              />
            ))}
          </OptionGroup>
        </>
      ) : null}

      {item.kind === "series" ? (
        <>
          <Stimulus>
            <SeqRow>
              {item.seq.map((term, i) => (
                <SeqTile key={`${term}-${i}`} blank={term === "?"}>
                  {term}
                </SeqTile>
              ))}
            </SeqRow>
          </Stimulus>
          <OptionGroup legend={legend} variant="text">
            {item.options.map((o) => (
              <TextOptionCard
                key={o.id}
                {...shared}
                id={o.id}
                checked={picked === o.id}
                label={o.text}
                text={o.text}
              />
            ))}
          </OptionGroup>
        </>
      ) : null}

      {item.kind === "figure" ? (
        <>
          {item.layout === "matrix" ? (
            <Stimulus>
              {/* The top row states the rule, the bottom row applies it. */}
              {/*
                A 2x2 MATRIX IS LAID OUT AS A ROW OF FOUR, NOT A GRID.

                A 2x2 is logically an analogy: the top row states a relation and
                the bottom row applies it, which is exactly "A is to B as C is
                to ?". A row of four reads the same relation and costs about
                half the vertical space, which is what gets all four options
                above the fold on a phone. Figural analogies are commonly
                presented this way in the real instruments.

                THIS ONLY HOLDS FOR 2x2. A 3x3 encodes rules along BOTH axes, so
                flattening it destroys the thing that makes it solvable. The
                layout therefore keys off the item's actual dimensions — three
                stimulus cells means 2x2 and gets the row, anything larger keeps
                the grid — rather than off the screen width.
              */}
              {item.cells.length === 3 ? (
                <div className="flex items-center justify-center gap-1.5 sm:gap-2.5">
                  {[...item.cells.map((cell, i) => (
                    <div key={i} className="w-[min(6rem,20vw,15vh)]">
                      <FigureCell fig={cell} />
                    </div>
                  )), (
                    <div key="q" className="w-[min(6rem,20vw,15vh)]">
                      <QuestionCell />
                    </div>
                  )]}
                </div>
              ) : (
                <div
                  className="mx-auto grid w-[min(20rem,80vw,44vh)] gap-2.5 sm:gap-3"
                  style={{
                    gridTemplateColumns: `repeat(${Math.round(
                      Math.sqrt(item.cells.length + 1),
                    )}, minmax(0, 1fr))`,
                  }}
                >
                  {item.cells.map((cell, i) => (
                    <FigureCell key={i} fig={cell} />
                  ))}
                  <QuestionCell />
                </div>
              )}
            </Stimulus>
          ) : null}

          {item.layout === "analogy" ? (
            <Stimulus>
              <div className="flex items-center justify-center gap-1.5 sm:gap-2.5">
                <div className="w-[min(4.5rem,17vw,9vh)]">
                  <FigureCell fig={item.cells[0]} />
                </div>
                <AnalogySep />
                <div className="w-[min(4.5rem,17vw,9vh)]">
                  <FigureCell fig={item.cells[1]} />
                </div>
                <AnalogySep double />
                <div className="w-[min(4.5rem,17vw,9vh)]">
                  <FigureCell fig={item.cells[2]} />
                </div>
                <AnalogySep />
                <div className="w-[min(4.5rem,17vw,9vh)]">
                  <QuestionCell />
                </div>
              </div>
            </Stimulus>
          ) : null}

          {item.layout === "classification" ? (
            <Stimulus>
              {/*
                Three figures that share a property; the player picks the one
                that JOINS them. The inverse of odd-one-out, and a different
                task: the shared property has to be inferred from three
                examples rather than spotted as an outlier among four. The
                trailing "?" cell is what makes that read as "and one more"
                rather than "here are three pictures".
              */}
              <div className="flex items-center justify-center gap-1.5 sm:gap-2.5">
                {item.cells.map((cell, i) => (
                  <div key={i} className="w-[min(4.5rem,17vw)]">
                    <FigureCell fig={cell} />
                  </div>
                ))}
                <span
                  aria-hidden="true"
                  className="shrink-0 px-0.5 font-display text-xl leading-none text-ink/70"
                >
                  +
                </span>
                <div className="w-[min(4.5rem,17vw,9vh)]">
                  <QuestionCell />
                </div>
              </div>
            </Stimulus>
          ) : null}

          {/* odd-one-out has no stimulus: the options are the stimulus. */}

          <OptionGroup legend={legend} variant="visual">
            {item.options.map((o) => (
              <VisualOptionCard
                key={o.id}
                {...shared}
                id={o.id}
                checked={picked === o.id}
                label={describeFig(o.fig)}
              >
                <FigCellContent fig={o.fig} />
              </VisualOptionCard>
            ))}
          </OptionGroup>
        </>
      ) : null}

      {item.kind === "table" ? (
        <>
          <Stimulus>
            <TableStimulus data={item.data} caption={item.caption} />
          </Stimulus>
          <OptionGroup legend={legend} variant="text">
            {item.options.map((o) => (
              <TextOptionCard
                key={o.id}
                {...shared}
                id={o.id}
                checked={picked === o.id}
                label={o.text}
                text={o.text}
              />
            ))}
          </OptionGroup>
        </>
      ) : null}

      {item.kind === "polygon" ? (
        <>
          <Stimulus>
            <SeqRow>
              {item.seq.map((poly, i) => (
                <div key={i} className="w-[min(4rem,16vw)]">
                  <FigCell>
                    <PolygonShape shape={poly} size="76%" />
                  </FigCell>
                </div>
              ))}
              <div className="w-[min(4rem,16vw,8vh)]">
                <QuestionCell />
              </div>
            </SeqRow>
          </Stimulus>
          <OptionGroup legend={legend} variant="visual">
            {item.options.map((o) => (
              <VisualOptionCard
                key={o.id}
                {...shared}
                id={o.id}
                checked={picked === o.id}
                label={describePoly(o.poly)}
              >
                <PolygonShape shape={o.poly} size="86%" />
              </VisualOptionCard>
            ))}
          </OptionGroup>
        </>
      ) : null}

      {item.kind === "dot" ? (
        <>
          <Stimulus>
            <SeqRow>
              {item.seq.map((pos, i) => (
                <DotSquare key={i} pos={pos} size="min(4rem,16vw,8vh)" />
              ))}
              <div className="w-[min(4rem,16vw,8vh)]">
                <QuestionCell />
              </div>
            </SeqRow>
          </Stimulus>
          <OptionGroup legend={legend} variant="visual">
            {item.options.map((o) => (
              <VisualOptionCard
                key={o.id}
                {...shared}
                id={o.id}
                checked={picked === o.id}
                label={describeDot(o.pos)}
              >
                <DotSquare pos={o.pos} size="86%" />
              </VisualOptionCard>
            ))}
          </OptionGroup>
        </>
      ) : null}

      {item.kind === "fold" ? (
        <>
          <Stimulus>
            <FoldStrip folds={item.folds} punches={item.punches} grid={item.grid ?? 4} />
          </Stimulus>
          <OptionGroup legend={legend} variant="visual">
            {item.options.map((o) => (
              <VisualOptionCard
                key={o.id}
                {...shared}
                id={o.id}
                checked={picked === o.id}
                label={describeHoles(o.holes)}
              >
                <HoleGrid
                  holes={o.holes}
                  grid={item.grid ?? 4}
                  creases={creaseAxes(item.folds)}
                  size="86%"
                />
              </VisualOptionCard>
            ))}
          </OptionGroup>
        </>
      ) : null}
    </div>
  );
}
