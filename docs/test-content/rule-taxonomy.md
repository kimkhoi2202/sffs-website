# Rule taxonomy for the Official Smart Fella Test

This is the authoring contract for every question in `lib/test/tests/`. Items are
generated **from the rules below**, never from real published items.

## Why this document exists at all

The obvious way to write 50 aptitude questions is to find 40 real ones and make
more like them. Do not do that, including paraphrased, including "same structure
different words". Producing items in the style of a known set is precisely the
fact pattern a derivative-work claim is built on, and the fact that a model did
the paraphrasing does not help.

Generating from an abstract rule instead means the provenance of every item is a
rule we wrote down. `TestItem.rule` records which one, so any item can be traced
back to its family. **An item with no `rule` field is an item whose origin nobody
can account for.**

Two further constraints that follow from the same reasoning:

- The real instruments' names stay out of the brand, the title, the domain and
  the metadata. "Cognitive Aptitude Test, 50 questions, 15 minutes" describes the
  format precisely and refers to nobody.
- Neither publisher's norms may be used to produce a score, a percentile, a
  standard age score or a stanine. Their norms describe a different population
  sitting a different instrument. See the note on `TestSubmission` in
  `lib/test/types.ts` for the only percentile that would be honest.

## Licensed generators for the figural items

Two existing generators produce figural items whose provenance is unambiguous:

| Tool | Licence | Produces |
|---|---|---|
| `matRiks` | MIT | rule-based figure matrices |
| `IMak` | GPL-3 | figural analogies |

Run both **offline, as authoring tools**, and map their output into `FigState`.
Neither may become a runtime dependency of this site. That matters twice for
IMak: GPL-3 is not a licence this codebase can take on, whereas item data
produced by running the tool is ours.

---

## Test structures

### The adult test — 50 items, 15 minutes, one-way

A single interleaved stream. **Not sectioned**: item 3 might be verbal and item 4
spatial. Difficulty climbs from start to finish, so the front of the test should
be answerable by almost everyone and the back by almost nobody. Roughly 18
seconds per item is the pace nobody sustains, which is the point.

One point per item, no penalty for a wrong answer, raw score out of 50.
`allowBack: false` — a one-way pass is part of what the format measures.

Target mix:

| Domain | Share | Items |
|---|---|---|
| verbal | 34% | 17 |
| quantitative (maths and logic) | 34% | 17 |
| spatial | 22% | 11 |
| logic puzzles | 10% | 5 |

Sentence completion alone is about 18% of the whole test — the single largest
item type. Weight it accordingly.

### The child tests — 15 items, 5 minutes, review allowed

Six grades, five banks (grades 7 and 8 share one; see `GRADE_BANKS`).

The structure mirrors the published **Screening Form**, which keeps only the
analogies subtest from each of the three batteries. That is the publisher's own
answer to "what is the minimum viable version of this", so following it gives a
rationale rather than an arbitrary truncation:

- 5 verbal analogies
- 5 number analogies
- 5 figure matrices

Around 20 seconds per item. `allowBack: true`.

**Paper folding is child-only.** It is not an adult item type. It is not in the
15-item screening structure either, so it belongs in a bank only if the bank
grows past 15 items.

**Letter series is adult-only.** The child quantitative battery uses number
series, not letters.

---

## Verbal rules

### `verbal/sentence-completion`

A sentence with one word removed, marked in the stem as `______`. The removed
word must be recoverable from the sentence alone. Distractors should be the
right part of speech and plausibly related, so the item tests comprehension
rather than grammar.

Difficulty levers, in order: vocabulary frequency of the target word; how far
the disambiguating clue sits from the blank; whether a distractor is defensible
under a careless reading.

### `verbal/analogy`

`A is to B as C is to ?`. Name the relation explicitly when authoring, and keep
it to one of these families:

| Family | Example relation |
|---|---|
| part-to-whole | a component and the thing it belongs to |
| category | a member and its category |
| function | a tool and what it does |
| degree | two words on the same scale, differing in intensity |
| cause and effect | an action and its result |
| antonym | direct opposition |
| agent | a doer and their domain |

The `C : ?` pair must instantiate the **same** relation in the **same
direction**. The commonest authoring bug is a reversed second pair.

### `verbal/classification`

Three words that share a property; the player picks the candidate that joins
them. This is **not** odd-one-out reworded — the shared property has to be
findable from three examples, which is a different task from spotting one
outlier among four.

The shared property must be the only one all three have. If the three are also
all two-syllable, a two-syllable distractor makes the item unanswerable.

### `verbal/odd-one-out`

Four words, one lacking a property the other three share. Same authoring hazard
in reverse: check that no *second* item is also excludable on some other axis.

### `verbal/synonym` and `verbal/antonym`

One target word, four candidates. Distractors should be near-misses on meaning
rather than random, or the item measures nothing.

### `verbal/attention-to-detail`

Two strings that either do or do not match: a reference code, an address, a
sequence of digits. The differences must be the kind a fast reader misses —
transposed characters, a doubled letter, a `0` for an `O`. Never a different
length.

---

## Quantitative rules

### `quant/number-series`

A sequence with one term missing. Rule families:

| Family | Shape |
|---|---|
| arithmetic | constant difference |
| geometric | constant ratio |
| alternating | two interleaved sub-sequences |
| second-difference | the difference itself progresses |
| squares / cubes | positional powers |
| accumulating | each term is a function of the previous two |

Exactly one rule per item, and it must fit every visible term. A sequence that
supports two rules has two right answers.

### `quant/number-analogy`

`2 is to 8 as 5 is to ?` — the relation is an operation rather than a meaning.
Keep the operation to one step, or two of the same kind. Distractors should
include the result of the *plausible wrong operation* (here, `5 + 6`), since
that is what separates reading the relation from guessing it.

### `quant/number-puzzle`

An equation with a missing operand or operator, or a small arrangement that has
to balance. Solvable by inspection in under twenty seconds.

### `quant/word-problem`

Two or three sentences, arithmetic only, no algebraic notation. The numbers
should be small enough to hold in your head — this measures whether you can set
the problem up, not whether you can do long division under time pressure.

### `quant/tables-and-graphs`

A small table (at most 4 columns by 4 rows) or a bar chart (at most 5 bars), and
a question that requires reading two cells and combining them. If the answer is
readable from a single cell, it is a comprehension item, not a quantitative one.

Keep it phone-sized. A table that scrolls sideways is an accessibility problem
wearing a question's clothes.

### `quant/compare`

Two quantities, and whether A is greater, B is greater, they are equal, or it
cannot be determined. The fourth option must be genuinely reachable in some
items or it is dead weight in all of them.

---

## Logic rules

### `logic/deductive`

Two or three premises and a conclusion; the answer is TRUE, FALSE or CAN'T TELL.
**Three options, not four** — the renderers all read `options.length`, so this
is supported, but do not pad it to four.

The commonest bug is a conclusion that is true in the real world but not entailed
by the premises. It must follow from the premises *alone*.

### `logic/letter-series` (adult only)

A letter sequence with one term missing. Rules operate on alphabet position:
constant step, alternating steps, or two interleaved sequences moving in opposite
directions. Do not mix in a step that wraps past Z unless the wrap is
demonstrated earlier in the same sequence.

---

## Spatial / figural rules

### The cell node

Every figural item — matrix, analogy, classification, odd-one-out — is built
from one node, `FigCellState`, and so is every answer option, because **an
option is just one more cell**. Five of the fifteen items in each child bank are
figure matrices, so a third of the child test renders through it.

A cell is a **set of shapes**, not one shape:

```ts
{
  arrange: "stack",           // or "auto" (default): side by side
  shapes: [
    { shape: "triangle", size: "l" },
    { shape: "heart", size: "s", filled: true },
  ],
}
```

Each element takes `shape`, `filled`, `color`, `rotate`, `size` (a named step or
a 0..1 fraction) and optionally an explicit `x`/`y` centre in normalised cell
coordinates.

**This is declarative geometry and it renders to inline SVG. It is never an
image.** There is no PNG step, no asset store and no CDN, and there must not be
one: drawn from geometry the figures inherit the brand ink colour, stay sharp at
any size, cost no image bytes on a phone during a timed test, and can be
restyled for dark mode or a 360px screen from CSS.

`matRiks` (MIT) generates the real matrices and emits exactly this — flat
declarative geometry, roughly 349 bytes a cell, about 4.5KB for a complete item
with its options. Map its output straight into these fields. Run it **offline as
an authoring tool**; it is never a runtime dependency. Same for `IMak` (GPL-3)
for figural analogies, where keeping it offline matters twice: GPL-3 is not a
licence this codebase can take on, whereas item data produced by running the
tool is ours.

### The transformations

The vocabulary is deliberately small, because a rule the player cannot name is a
rule they cannot apply.

| Rule | `rule` value | Transformation |
|---|---|---|
| fill | `figure/fill` | empty becomes filled |
| count | `figure/count-doubles`, `figure/count-increments` | how many elements in the set |
| rotation | `figure/rotate` | a quarter or half turn |
| size | `figure/resize` | grows or shrinks a step |
| substitution | `figure/shape-swap` | the shape changes, everything else holds |
| containment | `figure/containment` | one shape inside another (`arrange: "stack"`, a large outer and a small inner) |

Compose at most **two** rules in one item. Three is not harder in an interesting
way, it is just noisier.

### `figure/matrix`

2x2. The top row states the rule (cell 0 to cell 1), the bottom row applies it
(cell 2 to the answer). The rule must be visible from the top row alone.

Distractors should include: the right transformation on the wrong shape; the
wrong transformation on the right shape; and the untransformed cell 2, which is
the "forgot to apply it" trap and the strongest distractor of the three.

### `figure/analogy`

`A : B :: C : ?`. Same vocabulary, laid out as a relation rather than a grid.

### `figure/classification`

Three figures sharing a property, and the candidate that joins them. As with the
verbal version, the shared property must be the only one all three have.

### `figure/odd-one-out`

Four figures, one differing. No stimulus cells — the options are the stimulus.

### `figure/paper-folding` (child only)

A square sheet, at most one vertical and one horizontal fold, and a punch through
the folded stack. The answer is the unfolded hole pattern.

**Do not hand-author the answer.** `unfold(folds, punches, grid)` derives it and
`npm run verify:tests` checks the keyed option against the derivation, so an
authoring slip fails a check instead of marking a real child wrong. Punches must
land inside the folded packet; the validator checks that too.

---

## Deprioritised

`dot` (position) and `polygon` (figure series) render correctly and are used by
the video pipeline, but neither is a standalone item type in the instruments
these tests model — there they appear only as transformation rules inside
figural items. Do not reach for them ahead of a figure matrix.

---

## Checklist before an item lands

- [ ] `rule` names a family in this document
- [ ] exactly one rule fits every visible term or cell
- [ ] no second option is defensible
- [ ] the distractors include the specific mistake the item is trying to catch
- [ ] nothing is traceable to a published item, including by paraphrase
- [ ] the stem fits a 360px screen without a horizontal scroll
- [ ] `npm run verify:tests` passes
- [ ] the `placeholder` flag is gone
