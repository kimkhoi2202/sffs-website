/**
 * THE QUESTION SCHEMA for the Official Smart Fella Test.
 *
 * A test is a PLAIN DATA FILE: an ordered list of items plus a little metadata.
 * Nothing is generated per session. `lib/test/tests/adult.ts` and the five
 * `lib/test/tests/grade-*.ts` banks are the whole content layer; swapping in
 * real questions means editing those files and nothing else.
 *
 * ---------------------------------------------------------------------------
 * SEVEN KINDS, NOT ONE PER QUESTION TYPE
 * ---------------------------------------------------------------------------
 * The item types a cognitive aptitude test uses are a long list, but most of
 * them are the same data wearing different labels. An item here has:
 *
 *   kind  — the RENDERER, which decides the data shape. Seven of them.
 *   tier  — the human label shown in the header pill. One of TIERS.
 *
 * So the taxonomy maps onto seven shapes:
 *
 *   kind      tier(s) it serves
 *   --------  -----------------------------------------------------------------
 *   text      SENTENCE COMPLETION, VERBAL ANALOGY, CLASSIFICATION, ODD ONE OUT,
 *             SYNONYM, ANTONYM, LOGIC, COMPARE, WORD PROBLEM, NUMBER ANALOGY,
 *             NUMBER PUZZLE, ATTENTION TO DETAIL
 *   series    NUMBER SERIES, LETTER SERIES
 *   figure    FIGURE MATRIX, FIGURE ANALOGY, VISUAL ODD ONE OUT,
 *             VISUAL CLASSIFICATION
 *   table     TABLES AND GRAPHS
 *   fold      PAPER FOLDING
 *   dot       POSITION            (deprioritised — see below)
 *   polygon   FIGURE SERIES       (deprioritised — see below)
 *
 * Adding a new TIER usually costs nothing. Adding a new KIND means a new
 * renderer, so think before you do it.
 *
 * DEPRIORITISED KINDS. `dot` and `polygon` render fine and are used by the
 * video pipeline, but neither exists as a standalone item type in the
 * instruments these tests are modelled on — there, that kind of transformation
 * is a RULE inside a figural item rather than a question of its own. They are
 * kept because they cost nothing and the video content still uses them, but no
 * test file should reach for them ahead of a figure matrix.
 *
 * ---------------------------------------------------------------------------
 * THE ANSWER KEY IS ONE FIELD
 * ---------------------------------------------------------------------------
 * Every item stores exactly one answer field: `answer`, the id of the correct
 * option. Anything else a renderer might want (the correct figure, the correct
 * hole pattern) is DERIVED from that option at render time. One field cannot
 * disagree with itself.
 *
 * `validateTest` (lib/test/validate.ts) enforces that `answer` names a real
 * option, and for paper folding it additionally re-derives the unfolded hole
 * pattern from the fold geometry and checks the keyed option matches. Those
 * items are machine-verified, not trusted.
 *
 * ---------------------------------------------------------------------------
 * EVERY VISUAL IS DRAWN, NOT LOADED
 * ---------------------------------------------------------------------------
 * There are no images. Figure matrices, folded paper and the rest are
 * procedural SVG generated from these parameters at render time
 * (components/test/question/*). See the note in glyph.tsx for why.
 *
 * ---------------------------------------------------------------------------
 * CONTENT PROVENANCE
 * ---------------------------------------------------------------------------
 * Items must be generated from a documented rule taxonomy
 * (docs/test-content/rule-taxonomy.md), never from real published items and
 * never paraphrased from them. That is a legal constraint, not a style
 * preference: producing items "in the style of" a set of real ones is the
 * fact pattern a derivative-work claim is built on. The taxonomy exists so the
 * provenance of every item is a rule we wrote.
 */

/* ==========================================================================
 * Shared vocabulary
 * ========================================================================== */

/**
 * Option ids.
 *
 * Do NOT assume four. Logic items ship three (TRUE / FALSE / CAN'T TELL), and
 * every renderer reads `options.length` as it finds it.
 */
export type OptionId = "A" | "B" | "C" | "D" | "E";

export const OPTION_IDS: readonly OptionId[] = ["A", "B", "C", "D", "E"];

/** The header pill label. */
export type Tier =
  // verbal
  | "SENTENCE COMPLETION"
  | "VERBAL ANALOGY"
  | "CLASSIFICATION"
  | "ODD ONE OUT"
  | "SYNONYM"
  | "ANTONYM"
  // quantitative
  | "NUMBER SERIES"
  | "NUMBER ANALOGY"
  | "NUMBER PUZZLE"
  | "WORD PROBLEM"
  | "COMPARE"
  | "TABLES AND GRAPHS"
  // logic and attention
  | "LOGIC"
  | "ATTENTION TO DETAIL"
  | "LETTER SERIES"
  // spatial / figural
  | "FIGURE MATRIX"
  | "FIGURE ANALOGY"
  | "VISUAL CLASSIFICATION"
  | "VISUAL ODD ONE OUT"
  | "PAPER FOLDING"
  | "FIGURE SERIES"
  | "POSITION";

/**
 * The domain an item measures. Drives the mix of a test and the breakdown on
 * the results screen; never shown as a label on a question.
 */
export type Domain = "verbal" | "quantitative" | "spatial" | "logic";

/* ==========================================================================
 * The figure vocabulary
 * ========================================================================== */

/**
 * The thirteen glyph silhouettes. Every one is a distinct shape — nothing here
 * reads as a near-circle, so an options row is never ambiguous at phone size.
 *
 * PENTAGON AND HEXAGON EXIST FOR A RULE, NOT FOR VARIETY. A figure matrix can
 * vary shape identity across a row, and the most legible version of that rule
 * for an eight-year-old is a run of polygons whose side count climbs: triangle,
 * square, pentagon. Without the five- and six-sided shapes the set jumped
 * straight from a square to a star, which reads as "a different picture"
 * rather than as a sequence, and the youngest band lost the rule entirely.
 */
export type GlyphKind =
  | "circle"
  | "square"
  | "triangle"
  | "diamond"
  | "pentagon"
  | "hexagon"
  | "star"
  | "heart"
  | "cross"
  | "arrow"
  | "crescent"
  | "lightning"
  | "teardrop";

export const GLYPH_KINDS: readonly GlyphKind[] = [
  "circle",
  "square",
  "triangle",
  "diamond",
  "pentagon",
  "hexagon",
  "star",
  "heart",
  "cross",
  "arrow",
  "crescent",
  "lightning",
  "teardrop",
];

/** Named size steps. A raw number (a fraction of the cell) is also accepted. */
export type FigSize = "s" | "m" | "l";

/* ==========================================================================
 * THE TWO PALETTES, AND WHY THEY MUST NOT OVERLAP
 * ==========================================================================
 * A colour on this screen can mean one of exactly two things, and it must never
 * mean both.
 *
 *   PUZZLE INK    part of the question. Shading is a RULE DIMENSION on figure
 *                 matrices: a row can run white, grey, solid, and reading that
 *                 progression is how the item is solved.
 *   STATE         something about the interface. Which option you picked, which
 *                 cell is the one to fill in, which control destroys your work.
 *
 * THIS WAS A REAL DEFECT, not a tidiness rule invented after the fact. Brand
 * blue was the selected-option background AND the "solid" step of the shading
 * ladder at the same time. On a figural question that meant a blue card could
 * be blue because you picked it or because the figure inside it is blue as part
 * of the puzzle, with both appearing in the same row of options. Somebody can
 * misread the puzzle from that, which is a different order of problem from
 * something looking untidy.
 *
 * The fix moved the PUZZLE side, not the UI side, and that was the cleaner
 * direction for three reasons. White, grey and black is what the rule taxonomy
 * specifies for FM-3 and what matRiks itself emits, so blue was a substitution
 * that should never have happened. Black against paper separates from grey far
 * better than blue does (100%, 77% and 0% luminance against 100%, 77% and 61%),
 * which matters most at the deepest fit-to-viewport scale on a phone, where the
 * shading rule is hardest to read. And the alternative would have meant finding
 * a new selection colour: mint and green are the primary actions, yellow is the
 * letter badges and the missing-cell marker, coral is destructive, and orange is
 * the sound toggle, so there was no free slot on the UI side.
 *
 * ADDING A COLOUR TO EITHER SET MEANS CHECKING IT AGAINST THE OTHER.
 * `scripts/audit-content.mjs` fails the build if an item paints a figure in a
 * state colour, so the clash cannot come back quietly.
 * ========================================================================== */

/**
 * The only colours a figure may be painted in. Three steps of one ramp, so the
 * shading rule reads as an ordered progression rather than as three unrelated
 * colours.
 */
export const PUZZLE_INK = {
  /** Unfilled. The paper showing through. */
  empty: "var(--color-paper)",
  /** The middle step. */
  mid: "var(--color-gray-300)",
  /** The dark step, and the default for any filled element. */
  solid: "var(--color-ink)",
} as const;

/**
 * Colours that mean something about the INTERFACE. None of these may appear
 * inside a figure.
 *
 * They are listed here rather than only living in Tailwind classes so the audit
 * has something to check against, and so the disjointness is visible in one
 * place instead of being a property you would have to go and discover.
 */
/**
 * THE THIRD PALETTE: what a verdict means.
 *
 * ===========================================================================
 * WHY THIS IS ITS OWN RAMP AND NOT THE BRAND COLOURS
 * ===========================================================================
 * The verdict is large bold type on the YELLOW score card, and brand mint
 * (#c6fcd0) and coral (#fd7962) measure 1.75:1 and 2.00:1 against it. Both are
 * unreadable there, not merely weak — the pastel mint is close to invisible.
 * So these are darkened variants chosen against that specific background
 * rather than the tokens they are named after.
 *
 * EVERY BAND CLEARS WCAG AA FOR NORMAL TEXT (4.5:1) on #fce552, not just the
 * 3:1 that large text would have allowed. The verdict is the one line on the
 * page a person actually wants to read, and it is worth not gambling on
 * whether a given renderer counts it as "large".
 *
 *   certified-smart-fella   #0f5132   7.34:1
 *   mostly-smart-fella      #3f6b52   4.79:1
 *   borderline              ink       16.47:1
 *   mostly-fart-smella      #8a3f3a   5.77:1
 *   certified-fart-smella   #8f1d17   6.99:1
 *
 * THE RAMP IS SATURATION, NOT LIGHTNESS, because on a background this bright
 * every legible colour is dark, so lightness has almost nothing left to say.
 * The two extreme verdicts get the saturated colours and the near-middle ones
 * get muted versions of the same hue, which reads as intensity rather than as
 * five arbitrary shades. The middle band stays INK: it is the honest colour for
 * "could go either way", and a fifth hue there would have been decoration.
 *
 * A THIRD PALETTE RATHER THAN REUSING EITHER OF THE OTHER TWO. Blue is the
 * selected-option state and the greyscale is puzzle content — see the note
 * above on what went wrong when those two overlapped. These greens and reds
 * appear on exactly one surface, mean exactly one thing, and are far away in
 * colour space from both (nearest is 192 units from the UI blue).
 */
export const VERDICT_INK: Record<string, string> = {
  "smart-fella": "#0f5132",
  "fart-smella": "#8f1d17",
};

export const STATE_COLORS = {
  /** The option you picked. */
  selected: "var(--color-blue)",
  /** The letter badge, and the matrix cell you are filling in. */
  marker: "var(--color-yellow)",
  /** Destructive: quit. */
  destructive: "var(--color-coral)",
  /** Primary action: start, send. */
  action: "var(--color-green)",
} as const;

/**
 * ONE SHAPE inside a cell. Declarative geometry, never a picture.
 *
 * Everything a figural rule can do to a shape is a field here: which silhouette
 * it is, whether it is filled, what colour, how far it is turned, how big it
 * is, and where it sits. Nothing about it is rasterised at any point — see the
 * note on FigCellState below.
 */
export interface FigElement {
  shape: GlyphKind;
  /** Filled with `color` (default brand blue) rather than paper white. */
  filled?: boolean;
  /** Fill colour when `filled`. Defaults to the brand blue. */
  color?: string;
  /** Clockwise rotation in degrees. */
  rotate?: number;
  /**
   * A named step, or an explicit fraction of the cell (0..1) when a generator
   * has computed a precise size and a three-step scale would lose it.
   */
  size?: FigSize | number;
  /**
   * Explicit centre in normalised cell coordinates, 0..1 from the top left.
   * Set both or neither. When absent the element is placed by `arrange`.
   */
  x?: number;
  y?: number;
}

/**
 * ONE CELL: a SET of shapes, not a single shape.
 *
 * ===========================================================================
 * THIS IS THE LARGEST SCHEMA DECISION IN THE FEATURE
 * ===========================================================================
 * Five of the fifteen items in every child bank are figure matrices, so a third
 * of the child test renders through this node, and every future figural type
 * (analogy, classification, odd-one-out) shares it. The answer options share it
 * too, because an option IS one more cell.
 *
 * A CELL IS A SET, NOT A SHAPE-PLUS-A-COUNT. An earlier version of this node
 * held one glyph and a repeat count, which covers "the count doubles" and
 * nothing else. It cannot express a large empty square containing a small
 * filled circle, or three different silhouettes in one cell, and those are
 * ordinary matrix content. `matRiks` (MIT), which generates the real items,
 * emits flat declarative geometry — a list of shapes with attributes — so the
 * node takes a list of shapes with attributes. Roughly 349 bytes a cell, about
 * 4.5KB for a complete item with its options.
 *
 * ===========================================================================
 * THERE IS NO IMAGE PIPELINE, AND THERE MUST NOT BE ONE
 * ===========================================================================
 * These fields render straight to inline SVG in the browser
 * (components/test/question/figure.tsx). Nothing is rasterised, nothing is
 * uploaded, nothing is fetched.
 *
 * Had the schema stored a URL to a rendered PNG instead, it would have required
 * inventing a render step, an asset store, a CDN and a cache-busting scheme —
 * all to produce something strictly worse. Drawn from geometry, the figures
 * inherit the brand ink colour, stay sharp at any size, cost no image bytes on
 * a phone connection during a TIMED test, and can be restyled for dark mode or
 * a 360px screen by changing CSS. A PNG can do none of that, and authoring one
 * would need a designer in the loop for every item.
 *
 * ===========================================================================
 * MAPPING A GENERATOR'S OUTPUT IN
 * ===========================================================================
 * `matRiks` (MIT) generates rule-based matrices; `IMak` (GPL-3) generates
 * figural analogies. Both run OFFLINE as authoring tools that write into these
 * fields, and neither is ever a runtime dependency. That distinction matters
 * twice for IMak: GPL-3 is not a licence this codebase can take on, whereas the
 * item data produced by running the tool is ours.
 */
export interface FigCellState {
  /** In paint order: later elements draw on top. */
  shapes: FigElement[];
  /**
   * How to place elements that carry no explicit x/y.
   *
   *   auto  (default) lay them out side by side, scaled down as the count
   *         grows, which is what a "count" rule wants
   *   stack all centred on top of each other, which is what a containment or
   *         composition rule wants
   */
  arrange?: "auto" | "stack";
}

/* ==========================================================================
 * Kind-specific geometry
 * ========================================================================== */

/** A dot's slot in the 3x3 grid. Deprioritised kind — see the file header. */
export type DotPos =
  | "tl"
  | "tm"
  | "tr"
  | "rm"
  | "br"
  | "bm"
  | "bl"
  | "lm"
  | "center";

export const DOT_RING: readonly DotPos[] = [
  "tl",
  "tm",
  "tr",
  "rm",
  "br",
  "bm",
  "bl",
  "lm",
];

/** A regular polygon by side count, or a circle. Deprioritised kind. */
export type PolyShape = 3 | 4 | 5 | 6 | 7 | 8 | "circle";

/** Which way a flap folds over. */
export type FoldDir = "left" | "right" | "up" | "down";

/** A crease axis. Vertical creases come from left/right folds, horizontal from up/down. */
export type FoldAxis = "V" | "H";

/** One hole slot in the paper's NxN grid, zero-indexed from the top left. */
export interface HoleCell {
  r: number;
  c: number;
}

/* ==========================================================================
 * Options
 * ========================================================================== */

interface OptionBase {
  id: OptionId;
  /**
   * WHY A WRONG OPTION IS THERE: the specific mistake a solver who picks it
   * made. Empty on the key.
   *
   * This is an authoring field, never shown to a player. It exists because the
   * failure mode of a multiple-choice bank is four options where three are
   * obviously silly, and the only reliable defence is the discipline of
   * writing, for every distractor, the sentence "a solver who picks this made
   * THIS error". An option whose sentence cannot be written is decorative and
   * gets replaced — see the distractor framework in
   * docs/test-content/rule-taxonomy.md.
   *
   * It lives ON THE OPTION rather than in a parallel review file so it cannot
   * drift out of sync with the option it describes, and so `validateTest` can
   * hold the bank to 100% coverage. The dev review page reads it; nothing in
   * the player-facing flow does.
   */
  why?: string;
}

/** A text option. Keep it under ~24 characters so it fits a phone row. */
export interface TextOption extends OptionBase {
  text: string;
}

/** A figural option. The same cell node as the stimulus: an option IS one more cell. */
export interface FigureOption extends OptionBase {
  fig: FigCellState;
}

export interface PolygonOption extends OptionBase {
  poly: PolyShape;
}

export interface DotOption extends OptionBase {
  pos: DotPos;
}

/** A paper-folding option: the hole pattern on the unfolded sheet. */
export interface FoldOption extends OptionBase {
  holes: HoleCell[];
}

/* ==========================================================================
 * Items
 * ========================================================================== */

interface ItemBase {
  /** Stable within a test. The React key, the answer-map key, nothing else. */
  id: string;
  tier: Tier;
  domain: Domain;
  /** The question, above the stimulus. Sentence case, short. */
  prompt: string;
  /** The id of the correct option. The ONLY answer field. */
  answer: OptionId;
  /**
   * Shown on the results screen next to a wrong answer. Optional so a
   * placeholder is still valid; real content should always have one.
   */
  explanation?: string;
  /**
   * The rule family this item was generated from, e.g. "figure/count-doubles".
   * Not shown to anyone. It is the provenance record that makes
   * docs/test-content/rule-taxonomy.md auditable: an item with no `rule` is an
   * item nobody can prove we wrote from first principles.
   */
  rule?: string;
  /**
   * TRUE while this item is scaffolding rather than real content. The dev panel
   * counts these and `validateTest` reports them.
   */
  placeholder?: boolean;
}

/**
 * TEXT — the workhorse. Sentence completion, verbal analogy, classification,
 * odd-one-out, synonyms and antonyms, logic, number analogy, number puzzle,
 * word problem, attention to detail.
 *
 * `stem` is the line of content between the prompt and the options: the analogy
 * itself, the sentence with the blank, the three words a candidate has to join.
 * It renders larger than the prompt because it is the thing being reasoned
 * about. Newlines in it are honoured.
 *
 * SENTENCE COMPLETION is roughly a fifth of the adult test and appears at every
 * child level, so it is worth knowing how it is written: put the blank in the
 * stem as a run of underscores (`______`) and the renderer styles it as a real
 * gap rather than leaving it as punctuation the eye slides over.
 */
export interface TextItem extends ItemBase {
  kind: "text";
  stem?: string;
  options: TextOption[];
}

/**
 * SERIES — number series and letter series.
 *
 * `seq` is `string[]`, never `number[]`, which is why letter series needs no
 * separate renderer. Exactly one entry must be the literal "?".
 */
export interface SeriesItem extends ItemBase {
  kind: "series";
  seq: string[];
  options: TextOption[];
}

/**
 * FIGURE — one kind, four layouts, because only the arrangement differs.
 *
 *   matrix          `cells` = [top-left, top-right, bottom-left]; the player
 *                   completes the bottom-right. Top row states the rule,
 *                   bottom row applies it.
 *   analogy         `cells` = [A, B, C] laid out as A : B :: C : ?
 *   classification  `cells` = three figures that share a property; the player
 *                   picks the candidate that JOINS them. The inverse of
 *                   odd-one-out, and a distinct item type in the real
 *                   instruments rather than a rephrasing of it.
 *   odd-one-out     `cells` is EMPTY. The options are themselves the stimulus
 *                   and the player picks the one that does not belong.
 */
export interface FigureItem extends ItemBase {
  kind: "figure";
  layout: "matrix" | "analogy" | "classification" | "odd-one-out";
  cells: FigCellState[];
  options: FigureOption[];
}

/**
 * TABLE — tables and graphs. A small data display plus a question about it.
 *
 * Two shapes, because the real item type covers both and they are not the same
 * thing to read: a literal table of rows and columns, or a bar chart. Anything
 * more elaborate (line charts, stacked bars, pie) is out of scope until an item
 * actually needs it — this is a phone screen.
 */
export type TableData =
  | { type: "table"; columns: string[]; rows: string[][] }
  | { type: "bar"; unit?: string; bars: Array<{ label: string; value: number }> };

export interface TableItem extends ItemBase {
  kind: "table";
  caption?: string;
  data: TableData;
  options: TextOption[];
}

/**
 * FOLD — paper folding. CHILD TESTS ONLY; it is not an adult item type.
 *
 * A square sheet is folded (at most one vertical and one horizontal fold, which
 * keeps the mirror maths to a clean four-cell orbit), a hole is punched through
 * every layer, and the player picks the unfolded result.
 *
 * The correct hole pattern is NOT stored. `unfold(folds, punches, grid)`
 * derives it and `validateTest` checks it against the keyed option, so an
 * authoring mistake fails a check rather than shipping a wrong answer to a
 * nine-year-old.
 */
export interface FoldItem extends ItemBase {
  kind: "fold";
  /** NxN hole-slot grid. Even, default 4. */
  grid?: number;
  /** Applied in order to the flat sheet. At most one of V and one of H. */
  folds: FoldDir[];
  /** Punched through the folded stack, in folded-packet coordinates. */
  punches: HoleCell[];
  options: FoldOption[];
}

/** POLYGON — figure series. Deprioritised kind; see the file header. */
export interface PolygonItem extends ItemBase {
  kind: "polygon";
  seq: PolyShape[];
  options: PolygonOption[];
}

/** DOT — position. Deprioritised kind; see the file header. */
export interface DotItem extends ItemBase {
  kind: "dot";
  seq: DotPos[];
  options: DotOption[];
}

/** Any question. Switch on `kind` — TypeScript narrows the rest. */
export type TestItem =
  | TextItem
  | SeriesItem
  | FigureItem
  | TableItem
  | FoldItem
  | PolygonItem
  | DotItem;

export type ItemKind = TestItem["kind"];

/* ==========================================================================
 * Grades and banks
 * ========================================================================== */

/** Who a test is for. `adult` is the parent-taking-it-themselves test. */
export type Audience = "adult" | "child";

/**
 * GRADES 3 TO 8. Not 1 to 12, and both ends were cut for a reason.
 *
 * BELOW GRADE 3 there is no honest version of this. At grades 1 and 2 the real
 * instrument is entirely pictorial, requires no reading, and is UNTIMED. A
 * timed, text-bearing test for a six-year-old would not be a easier version of
 * this product, it would be a different and worse one, measuring reading speed
 * and stamina. Grade 3 is exactly where the real thing becomes timed and
 * text-based, so from grade 3 up the format transfers honestly.
 *
 * ABOVE GRADE 8 the player is close enough to the adult test that the adult
 * test is the better answer.
 */
export type Grade = 3 | 4 | 5 | 6 | 7 | 8;

export const GRADES: readonly Grade[] = [3, 4, 5, 6, 7, 8];

/**
 * SIX GRADES, FIVE BANKS.
 *
 * Grades 7 and 8 share one bank because cognitive development slows through
 * the upper grades and the instrument being modelled bands them for the same
 * reason. Splitting them here would mean authoring two banks whose difficulty
 * we could not actually distinguish, which is a worse lie than banding.
 *
 * Bank ids are named after the grades they serve rather than after any
 * publisher's level numbering, so nothing in the codebase, the URLs or the
 * analytics carries a reference to somebody else's product.
 */
export type BankId = "grade-3" | "grade-4" | "grade-5" | "grade-6" | "grade-7-8";

export const GRADE_BANKS: Record<Grade, BankId> = {
  3: "grade-3",
  4: "grade-4",
  5: "grade-5",
  6: "grade-6",
  7: "grade-7-8",
  8: "grade-7-8",
};

/**
 * The bucket a result is grouped into for any future cohort comparison. The
 * adult test is its own band; child results group by BANK, not by grade, since
 * two grade-7 and grade-8 players sat the identical test.
 */
export type GradeBand = "adult" | BankId;

/* ==========================================================================
 * The test
 * ========================================================================== */

/**
 * ONE STATIC, PRE-GENERATED TEST. Six of them: one adult, five child banks.
 * They are never assembled at runtime and never vary per session, so two people
 * who pick grade 4 sit the same test and their scores mean the same thing —
 * which is also the precondition for ever comparing them to each other.
 */
export interface Test {
  /** Stable id. "adult" or a BankId. Goes into analytics. */
  id: string;
  audience: Audience;
  /** Which bank this is. Absent on the adult test. */
  bank?: BankId;
  /** The grades this bank serves. Absent on the adult test. */
  grades?: Grade[];
  band: GradeBand;
  /** Shown on the intro screen. */
  title: string;
  /** The whole-test time budget in SECONDS. 900 adult, 300 child. */
  durationSeconds: number;
  /**
   * FALSE means the player cannot return to a question once they leave it.
   *
   * The adult test sets this false, and it is not an oversight: a one-way pass
   * under a clock is a real part of what the format measures, and removing it
   * would make the fifteen minutes mean something different. The child tests
   * set it true — a nine-year-old mis-tapping option C and being unable to fix
   * it is measuring their thumb.
   */
  allowBack: boolean;
  items: TestItem[];
  /** TRUE while any item is still scaffolding. Drives the dev-only banner. */
  placeholder?: boolean;
}

/** Max score. One point per item, no weighting, no penalty for a wrong answer. */
export function maxScore(test: Test): number {
  return test.items.length;
}

/* ==========================================================================
 * The submission record
 * ========================================================================== */

/**
 * ONE COMPLETED ATTEMPT, as it should be recorded.
 *
 * This type exists ahead of any storage for it, because of one decision worth
 * writing down: we may eventually show a player how they did AGAINST OUR OWN
 * USERS, and that is only possible if the raw material has been accumulating
 * from the start.
 *
 * It is also the only percentile that would be honest. A percentile borrowed
 * from a real publisher's norms describes a different population, sitting a
 * different instrument, under different stakes; against our own sample it
 * describes exactly what it claims to.
 *
 * WHAT HAS TO BE TRUE BEFORE ONE IS SHOWN:
 *   - a large sample, and large PER BAND. A grade-6 result compared against a
 *     pool that is mostly adults is not a percentile, it is a number.
 *   - computed per `band`, never pooled across them.
 *   - nothing here is or becomes personal data. Score, band, test id and
 *     duration only. No email, no answers, no identifier.
 *
 * Today this shape is carried by the `test_completed` analytics event, which
 * already records every field below and is therefore already accumulating the
 * sample. If a durable store is ever wanted, it should take this shape.
 */
export interface TestSubmission {
  testId: string;
  band: GradeBand;
  audience: Audience;
  /** The grade the player picked. Null on the adult test. */
  grade: Grade | null;
  score: number;
  maxScore: number;
  /** How many they attempted, which is not the same as how many they got right. */
  answered: number;
  /** Seconds from starting the test to it ending, however it ended. */
  elapsedSeconds: number;
  timedOut: boolean;
}
