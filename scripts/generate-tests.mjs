/**
 * Authoring tool: emit the six test data files.
 *
 *   node scripts/generate-tests.mjs [--force]
 *
 * WHY A GENERATOR. The tests are scaffolding waiting on rule-derived content.
 * Hand-writing 125 placeholder items would produce six files that all say the
 * same thing while looking like each was considered, which is a worse lie than
 * an obviously mechanical one.
 *
 * WHAT IT EMITS ARE STILL PLAIN DATA FILES. The output is committed, readable,
 * hand-editable TypeScript. Whoever lands the real content edits the files and
 * deletes this script; nothing in the app imports it and nothing regenerates at
 * build time. It refuses to overwrite without --force.
 *
 * WHAT IS AND IS NOT REAL IN THE OUTPUT:
 *   - the STRUCTURE is real: item counts, domain mix, interleaving, difficulty
 *     ordering, and which item types are allowed on which test.
 *   - the FIGURAL and NUMERIC items are genuine solvable puzzles, generated
 *     from the rule families in docs/test-content/rule-taxonomy.md. Their
 *     correctness is arithmetic or geometry, so there is nothing for the
 *     content work to overturn except calibration.
 *   - the VERBAL items are plainly filler. Real verbal content has to be
 *     written from the taxonomy by someone who can judge vocabulary level, and
 *     faking it convincingly here would only make it easy to miss.
 * Everything carries `placeholder: true` either way.
 */
import { existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(HERE, "..", "lib", "test", "tests");
const FORCE = process.argv.includes("--force");

const GLYPHS = ["circle", "square", "triangle", "diamond", "star", "heart", "cross", "arrow"];

/* -------------------------------------------------------------------------
 * Item builders, one per rule family in the taxonomy.
 * Each returns a plain object; `answerValue`/`answerKey` are scratch fields
 * that `finalise` resolves into the single `answer` field the schema wants.
 * `n` varies the puzzle so no two banks are the same fifteen questions.
 * ----------------------------------------------------------------------- */

/** Rotate the correct value into a different slot each time so it is not always A. */
function options(values, wrap, seed) {
  const letters = ["A", "B", "C", "D", "E"];
  const rotation = seed % values.length;
  const rotated = [...values.slice(rotation), ...values.slice(0, rotation)];
  return rotated.map((v, i) => ({ id: letters[i], ...wrap(v) }));
}

const text = (v) => ({ text: String(v) });
const fig = (v) => ({ fig: v });

/**
 * Build a FigCellState from an authoring shorthand.
 *
 * A cell is a SET of shapes (see lib/test/types.ts), which is the right storage
 * shape because that is what matRiks emits — but writing four identical
 * elements by hand for a "count doubles" rule is noise, so this expands
 * `count` into that many elements. Real generated content will emit the
 * elements directly and skip this.
 */
const cell = ({ shape, filled = false, rotate, size, count = 1 }) => ({
  shapes: Array.from({ length: count }, () => ({
    shape,
    ...(filled ? { filled: true } : {}),
    ...(rotate ? { rotate } : {}),
    ...(size ? { size } : {}),
  })),
});


/* -- verbal (filler content, real structure) ------------------------------ */

function sentenceCompletion(id) {
  return {
    id,
    kind: "text",
    tier: "SENTENCE COMPLETION",
    domain: "verbal",
    rule: "verbal/sentence-completion",
    placeholder: true,
    prompt: "Which word completes the sentence?",
    stem: "This item is a ______ and will be replaced with rule-derived content.",
    options: [
      { id: "A", text: "placeholder" },
      { id: "B", text: "conclusion" },
      { id: "C", text: "diagram" },
      { id: "D", text: "rehearsal" },
    ],
    __fixedAnswer: "A",
    explanation: "Placeholder. Real content pending, generated from the rule taxonomy.",
  };
}

function verbalAnalogy(id, n) {
  return {
    id,
    kind: "text",
    tier: "VERBAL ANALOGY",
    domain: "verbal",
    rule: "verbal/analogy",
    placeholder: true,
    prompt: "Complete the analogy.",
    stem: "PLACEHOLDER is to SAMPLE as FILLER is to ?",
    options: [
      { id: "A", text: "example" },
      { id: "B", text: "padding" },
      { id: "C", text: "draft" },
      { id: "D", text: "outline" },
    ],
    __fixedAnswer: ["A", "B", "C", "D"][n % 4],
    explanation: "Placeholder. Real content pending, generated from the rule taxonomy.",
  };
}

function verbalClassification(id) {
  return {
    id,
    kind: "text",
    tier: "CLASSIFICATION",
    domain: "verbal",
    rule: "verbal/classification",
    placeholder: true,
    prompt: "Which word goes with these three?",
    stem: "sample, specimen, placeholder",
    options: [
      { id: "A", text: "stand-in" },
      { id: "B", text: "conclusion" },
      { id: "C", text: "velocity" },
      { id: "D", text: "harbour" },
    ],
    __fixedAnswer: "A",
    explanation: "Placeholder. Real content pending, generated from the rule taxonomy.",
  };
}

function oddOneOut(id) {
  return {
    id,
    kind: "text",
    tier: "ODD ONE OUT",
    domain: "verbal",
    rule: "verbal/odd-one-out",
    placeholder: true,
    prompt: "Which one does not belong?",
    options: [
      { id: "A", text: "placeholder one" },
      { id: "B", text: "placeholder two" },
      { id: "C", text: "the odd sample" },
      { id: "D", text: "placeholder four" },
    ],
    __fixedAnswer: "C",
    explanation: "Placeholder. Real content pending, generated from the rule taxonomy.",
  };
}

function synonym(id, n) {
  return {
    id,
    kind: "text",
    tier: n % 2 === 0 ? "SYNONYM" : "ANTONYM",
    domain: "verbal",
    rule: n % 2 === 0 ? "verbal/synonym" : "verbal/antonym",
    placeholder: true,
    prompt:
      n % 2 === 0
        ? "Which word means most nearly the same?"
        : "Which word means most nearly the opposite?",
    stem: "PLACEHOLDER",
    options: [
      { id: "A", text: "stand-in" },
      { id: "B", text: "original" },
      { id: "C", text: "remainder" },
      { id: "D", text: "quantity" },
    ],
    __fixedAnswer: n % 2 === 0 ? "A" : "B",
    explanation: "Placeholder. Real content pending, generated from the rule taxonomy.",
  };
}

function attentionToDetail(id, n) {
  const a = `SF-${4820 + n}-QX`;
  // A transposition, which is the specific mistake this item type catches.
  const b = `SF-${4820 + n}-XQ`;
  return {
    id,
    kind: "text",
    tier: "ATTENTION TO DETAIL",
    domain: "verbal",
    rule: "verbal/attention-to-detail",
    placeholder: true,
    prompt: "Do the two codes match?",
    stem: `${a}\n${b}`,
    options: [
      { id: "A", text: "They match" },
      { id: "B", text: "They do not match" },
    ],
    __fixedAnswer: "B",
    explanation: "The last two characters are transposed.",
  };
}

/* -- quantitative (genuine puzzles) --------------------------------------- */

function numberSeries(id, n) {
  const families = [
    () => {
      const a = 2 + (n % 5);
      const d = 3 + (n % 4);
      return { seq: [a, a + d, a + 2 * d, a + 3 * d], ans: a + 4 * d, rule: "arithmetic", why: `Each number goes up by ${d}.` };
    },
    () => {
      const a = 2 + (n % 3);
      return { seq: [a, a * 2, a * 4, a * 8], ans: a * 16, rule: "geometric", why: "Each number doubles." };
    },
    () => {
      const a = 1 + (n % 4);
      const s = [a, a + 1, a + 3, a + 6];
      return { seq: s, ans: a + 10, rule: "second-difference", why: "The gaps grow by one each time: 1, 2, 3, then 4." };
    },
    () => {
      const a = 1 + (n % 3);
      return { seq: [a * a, (a + 1) ** 2, (a + 2) ** 2, (a + 3) ** 2], ans: (a + 4) ** 2, rule: "squares", why: "These are square numbers in order." };
    },
  ];
  const f = families[n % families.length]();
  return {
    id,
    kind: "series",
    tier: "NUMBER SERIES",
    domain: "quantitative",
    rule: `quant/number-series/${f.rule}`,
    placeholder: true,
    prompt: "What number comes next?",
    seq: [...f.seq.map(String), "?"],
    options: options(
      [f.ans, f.ans + 1, f.ans - 2, f.seq[3] + (f.seq[3] - f.seq[2])].map(String),
      text,
      n,
    ),
    answerValue: String(f.ans),
    answerKey: "text",
    explanation: f.why,
  };
}

function numberAnalogy(id, n) {
  const mult = 3 + (n % 4);
  const a = 2 + (n % 4);
  const c = 5 + (n % 5);
  const ans = c * mult;
  return {
    id,
    kind: "text",
    tier: "NUMBER ANALOGY",
    domain: "quantitative",
    rule: "quant/number-analogy",
    placeholder: true,
    prompt: "Complete the analogy.",
    stem: `${a} is to ${a * mult} as ${c} is to ?`,
    // The plausible-wrong-operation distractor (adding the difference instead
    // of applying the ratio) is the one that separates reading the relation
    // from guessing it.
    options: options(
      [ans, c + (a * mult - a), ans - c, ans + c].map(String),
      text,
      n,
    ),
    answerValue: String(ans),
    answerKey: "text",
    explanation: `The rule is multiply by ${mult}, so ${c} becomes ${ans}.`,
  };
}

function numberPuzzle(id, n) {
  const a = 4 + (n % 6);
  const b = 3 + (n % 5);
  const ans = a * b;
  return {
    id,
    kind: "text",
    tier: "NUMBER PUZZLE",
    domain: "quantitative",
    rule: "quant/number-puzzle",
    placeholder: true,
    prompt: "What number belongs in the box?",
    stem: `${a} \u00d7 ? = ${ans}`,
    options: options([b, b + 1, b - 1, b + 2].map(String), text, n),
    answerValue: String(b),
    answerKey: "text",
    explanation: `${ans} divided by ${a} is ${b}.`,
  };
}

function wordProblem(id, n) {
  const each = 3 + (n % 4);
  const many = 4 + (n % 3);
  const ans = each * many;
  return {
    id,
    kind: "text",
    tier: "WORD PROBLEM",
    domain: "quantitative",
    rule: "quant/word-problem",
    placeholder: true,
    prompt: "Work out the answer.",
    stem: `A box holds ${each} things. There are ${many} boxes. How many things is that?`,
    options: options([ans, ans + each, each + many, ans - each].map(String), text, n),
    answerValue: String(ans),
    answerKey: "text",
    explanation: `${many} boxes of ${each} is ${ans}.`,
  };
}

function tablesAndGraphs(id, n) {
  const bars = [
    { label: "Mon", value: 4 + (n % 3) },
    { label: "Tue", value: 7 + (n % 4) },
    { label: "Wed", value: 3 + (n % 2) },
    { label: "Thu", value: 9 + (n % 3) },
  ];
  const top = bars.reduce((a, b) => (b.value > a.value ? b : a));
  const low = bars.reduce((a, b) => (b.value < a.value ? b : a));
  const ans = top.value - low.value;
  return {
    id,
    kind: "table",
    tier: "TABLES AND GRAPHS",
    domain: "quantitative",
    rule: "quant/tables-and-graphs",
    placeholder: true,
    prompt: "How many more on the busiest day than the quietest?",
    caption: "Things counted each day",
    data: { type: "bar", unit: "things", bars },
    options: options([ans, ans + 1, ans - 1, top.value].map(String), text, n),
    answerValue: String(ans),
    answerKey: "text",
    explanation: `${top.label} had ${top.value} and ${low.label} had ${low.value}, a difference of ${ans}.`,
  };
}

function compare(id, n) {
  const a = 6 + (n % 5);
  const b = a; // equal, so option C is genuinely reachable
  return {
    id,
    kind: "text",
    tier: "COMPARE",
    domain: "quantitative",
    rule: "quant/compare",
    placeholder: true,
    prompt: "Compare the two quantities.",
    stem: `Quantity A: ${a} \u00d7 2\nQuantity B: ${b} + ${b}`,
    options: [
      { id: "A", text: "A is greater" },
      { id: "B", text: "B is greater" },
      { id: "C", text: "They are equal" },
      { id: "D", text: "Cannot be determined" },
    ],
    __fixedAnswer: "C",
    explanation: "Doubling and adding a number to itself are the same thing.",
  };
}

/* -- logic ----------------------------------------------------------------- */

function deductiveLogic(id) {
  return {
    id,
    kind: "text",
    tier: "LOGIC",
    domain: "logic",
    rule: "logic/deductive",
    placeholder: true,
    prompt: "If the statements are true, is the conclusion true?",
    stem:
      "All placeholders are samples.\nSome samples are filler.\nTherefore: some placeholders are filler.",
    // Three options, not four. The renderers read options.length.
    options: [
      { id: "A", text: "True" },
      { id: "B", text: "False" },
      { id: "C", text: "Cannot tell" },
    ],
    __fixedAnswer: "C",
    explanation:
      "The samples that are filler need not be the ones that are placeholders, so it does not follow.",
  };
}

function letterSeries(id, n) {
  const A = "A".charCodeAt(0);
  const start = n % 10;
  const step = 2 + (n % 3);
  const letters = [0, 1, 2, 3].map((k) => String.fromCharCode(A + start + k * step));
  const ans = String.fromCharCode(A + start + 4 * step);
  return {
    id,
    kind: "series",
    tier: "LETTER SERIES",
    domain: "logic",
    rule: "logic/letter-series",
    placeholder: true,
    prompt: "Which letter comes next?",
    seq: [...letters, "?"],
    options: options(
      [
        ans,
        String.fromCharCode(A + start + 4 * step + 1),
        String.fromCharCode(A + start + 3 * step),
        String.fromCharCode(A + start + 5 * step),
      ],
      text,
      n,
    ),
    answerValue: ans,
    answerKey: "text",
    explanation: `Each letter moves ${step} places forward in the alphabet.`,
  };
}

/* -- spatial (genuine puzzles) ---------------------------------------------- */

function figureMatrix(id, n) {
  const a = GLYPHS[n % GLYPHS.length];
  const b = GLYPHS[(n + 3) % GLYPHS.length];

  /*
   * CONTAINMENT: a large outer shape with a small filled shape inside it, and
   * the rule is that the inner shape fills in.
   *
   * This family exists partly because it is a real matrix rule and partly
   * because it is the one that proves the cell node is a SET of shapes rather
   * than a shape with a count. A cell here holds two different silhouettes at
   * two different sizes, stacked — which the old one-shape-plus-count model
   * could not express at all.
   */
  if (n % 3 === 2) {
    const outer = { shape: a, size: "l" };
    const inner = (filled) => ({ shape: b, size: "s", ...(filled ? { filled: true } : {}) });
    const composite = (filled) => ({ arrange: "stack", shapes: [outer, inner(filled)] });
    const c = GLYPHS[(n + 5) % GLYPHS.length];
    const outerC = { shape: c, size: "l" };
    const compositeC = (filled) => ({ arrange: "stack", shapes: [outerC, inner(filled)] });

    return {
      id,
      kind: "figure",
      tier: "FIGURE MATRIX",
      domain: "spatial",
      rule: "figure/containment+fill",
      placeholder: true,
      prompt: "Which shape completes the grid?",
      layout: "matrix",
      cells: [composite(false), composite(true), compositeC(false)],
      options: options(
        [
          compositeC(true),
          compositeC(false),
          composite(true),
          { arrange: "stack", shapes: [outerC, { shape: c, size: "s", filled: true }] },
        ],
        fig,
        n,
      ),
      answerValue: compositeC(true),
      answerKey: "fig",
      explanation:
        "The outer shape stays the same and the small shape inside it fills in.",
    };
  }

  // Count doubles, and empty becomes filled.
  if (n % 2 === 0) {
    return {
      id,
      kind: "figure",
      tier: "FIGURE MATRIX",
      domain: "spatial",
      rule: "figure/count-doubles",
      placeholder: true,
      prompt: "Which shape completes the grid?",
      layout: "matrix",
      cells: [
        cell({ shape: a, filled: true, count: 1 }),
        cell({ shape: a, filled: true, count: 2 }),
        cell({ shape: b, filled: true, count: 1 }),
      ],
      options: options(
        [
          cell({ shape: b, filled: true, count: 2 }),
          cell({ shape: b, filled: true, count: 1 }),
          cell({ shape: b, filled: true, count: 3 }),
          cell({ shape: a, filled: true, count: 2 }),
        ],
        fig,
        n,
      ),
      answerValue: cell({ shape: b, filled: true, count: 2 }),
      answerKey: "fig",
      explanation: "The count doubles across the row while the shape stays the same.",
    };
  }
  return {
    id,
    kind: "figure",
    tier: "FIGURE MATRIX",
    domain: "spatial",
    rule: "figure/fill",
    placeholder: true,
    prompt: "Which shape completes the grid?",
    layout: "matrix",
    cells: [
      cell({ shape: a, filled: false }),
      cell({ shape: a, filled: true }),
      cell({ shape: b, filled: false }),
    ],
    options: options(
      [
        cell({ shape: b, filled: true }),
        cell({ shape: b, filled: false }),
        cell({ shape: a, filled: true }),
        cell({ shape: GLYPHS[(n + 5) % GLYPHS.length], filled: true }),
      ],
      fig,
      n,
    ),
    answerValue: cell({ shape: b, filled: true }),
    answerKey: "fig",
    explanation: "The shape stays the same and fills in.",
  };
}

function figureAnalogy(id, n) {
  const a = GLYPHS[(n * 2) % GLYPHS.length];
  const b = GLYPHS[(n * 2 + 4) % GLYPHS.length];
  return {
    id,
    kind: "figure",
    tier: "FIGURE ANALOGY",
    domain: "spatial",
    rule: "figure/rotate",
    placeholder: true,
    prompt: "Which shape completes the pattern?",
    layout: "analogy",
    cells: [
      cell({ shape: a, filled: true }),
      cell({ shape: a, filled: true, rotate: 90 }),
      cell({ shape: b, filled: true }),
    ],
    options: options(
      [
        cell({ shape: b, filled: true, rotate: 90 }),
        cell({ shape: b, filled: true }),
        cell({ shape: b, filled: false, rotate: 90 }),
        cell({ shape: a, filled: true, rotate: 90 }),
      ],
      fig,
      n,
    ),
    answerValue: cell({ shape: b, filled: true, rotate: 90 }),
    answerKey: "fig",
    explanation: "The figure turns a quarter turn clockwise and nothing else changes.",
  };
}

function visualClassification(id, n) {
  const base = GLYPHS[(n + 1) % GLYPHS.length];
  const other = GLYPHS[(n + 6) % GLYPHS.length];
  return {
    id,
    kind: "figure",
    tier: "VISUAL CLASSIFICATION",
    domain: "spatial",
    rule: "figure/classification",
    placeholder: true,
    prompt: "Which figure goes with these three?",
    layout: "classification",
    cells: [
      cell({ shape: base, filled: true }),
      cell({ shape: base, filled: true, rotate: 90 }),
      cell({ shape: base, filled: true, rotate: 180 }),
    ],
    options: options(
      [
        cell({ shape: base, filled: true, rotate: 270 }),
        cell({ shape: base, filled: false }),
        cell({ shape: other, filled: true }),
        cell({ shape: other, filled: false, rotate: 90 }),
      ],
      fig,
      n,
    ),
    answerValue: cell({ shape: base, filled: true, rotate: 270 }),
    answerKey: "fig",
    explanation:
      "All three are the same filled shape at a different turn, so the fourth is the same shape turned again.",
  };
}

function visualOddOneOut(id, n) {
  const base = GLYPHS[(n + 2) % GLYPHS.length];
  const odd = GLYPHS[(n + 7) % GLYPHS.length];
  return {
    id,
    kind: "figure",
    tier: "VISUAL ODD ONE OUT",
    domain: "spatial",
    rule: "figure/odd-one-out",
    placeholder: true,
    prompt: "Which figure does not belong?",
    layout: "odd-one-out",
    cells: [],
    options: options(
      [
        cell({ shape: odd, filled: false }),
        cell({ shape: base, filled: true }),
        cell({ shape: base, filled: true, rotate: 90 }),
        cell({ shape: base, filled: true, rotate: 180 }),
      ],
      fig,
      n,
    ),
    answerValue: cell({ shape: odd, filled: false }),
    answerKey: "fig",
    explanation:
      "Three are the same filled shape turned around, and one is a different empty shape.",
  };
}

/*
 * PAPER FOLDING has no builder here, and that is deliberate rather than an
 * omission. It is a CHILD-ONLY item type (it does not appear on the adult
 * test at all), but the 15-item child structure is five verbal analogies,
 * five number analogies and five figure matrices — the screening form's own
 * shape — so there is currently nowhere for it to go.
 *
 * The renderer, the schema and the fold solver all exist and are validated
 * (lib/test/fold.ts re-derives every answer, and validate.ts checks it), so
 * the day a bank grows past fifteen items, fold items can be authored
 * straight into it from docs/test-content/rule-taxonomy.md. Writing a
 * generator for content that has no slot would just be dead code.
 */

/* -------------------------------------------------------------------------
 * Test composition
 * ----------------------------------------------------------------------- */

/**
 * THE ADULT MIX. 50 items: 17 verbal, 17 quantitative, 11 spatial, 5 logic
 * puzzles, per docs/test-content/rule-taxonomy.md. Sentence completion is the
 * single largest type at 9 of 50, matching its roughly 18% share.
 *
 * Within each domain the builders are listed easy to hard, and the interleaver
 * below consumes each domain's queue in order — so the stream is mixed by
 * domain while difficulty still climbs from front to back.
 *
 * NOTE what is absent: no paper folding (not an adult item type).
 */
const ADULT_PLAN = {
  verbal: [
    sentenceCompletion, verbalAnalogy, sentenceCompletion, synonym,
    sentenceCompletion, verbalAnalogy, oddOneOut, sentenceCompletion,
    verbalClassification, sentenceCompletion, verbalAnalogy, attentionToDetail,
    sentenceCompletion, verbalClassification, sentenceCompletion,
    sentenceCompletion, sentenceCompletion,
  ],
  quantitative: [
    numberSeries, numberAnalogy, numberPuzzle, numberSeries, wordProblem,
    numberAnalogy, tablesAndGraphs, numberSeries, numberPuzzle, wordProblem,
    numberAnalogy, tablesAndGraphs, numberSeries, compare, wordProblem,
    numberAnalogy, numberSeries,
  ],
  spatial: [
    figureMatrix, figureAnalogy, figureMatrix, visualOddOneOut, figureMatrix,
    visualClassification, figureAnalogy, figureMatrix, visualClassification,
    figureAnalogy, figureMatrix,
  ],
  logic: [deductiveLogic, letterSeries, deductiveLogic, letterSeries, deductiveLogic],
};

/**
 * THE CHILD MIX. 15 items, mirroring the published Screening Form's logic of
 * keeping only the analogies subtest from each of the three batteries: 5 verbal
 * analogies, 5 number analogies, 5 figure matrices, interleaved so the player
 * never faces five of the same thing in a row.
 *
 * NOTE what is absent: no letter series (the child quantitative battery uses
 * numbers, not letters).
 */
const CHILD_PLAN = {
  verbal: [verbalAnalogy, verbalAnalogy, verbalAnalogy, verbalAnalogy, verbalAnalogy],
  quantitative: [numberAnalogy, numberAnalogy, numberAnalogy, numberAnalogy, numberAnalogy],
  spatial: [figureMatrix, figureMatrix, figureMatrix, figureMatrix, figureMatrix],
};

/**
 * Interleave the domain queues proportionally.
 *
 * At each slot, take from whichever domain has consumed the smallest share of
 * its own queue. That spreads each domain evenly across the whole stream
 * (rather than clumping), consumes every queue in its authored easy-to-hard
 * order, and needs no shuffling — so the same plan always produces the same
 * test, which is the point of a static test.
 */
function interleave(plan) {
  const queues = Object.entries(plan).map(([domain, builders]) => ({
    domain,
    builders,
    taken: 0,
  }));
  const total = queues.reduce((n, q) => n + q.builders.length, 0);
  const out = [];

  for (let i = 0; i < total; i++) {
    const next = queues
      .filter((q) => q.taken < q.builders.length)
      .sort(
        (a, b) =>
          a.taken / a.builders.length - b.taken / b.builders.length ||
          b.builders.length - a.builders.length,
      )[0];
    out.push(next.builders[next.taken]);
    next.taken++;
  }
  return out;
}

/** Resolve the scratch answer fields into the single `answer` the schema wants. */
function finalise(raw) {
  const { answerValue, answerKey, __fixedAnswer, ...item } = raw;
  let answer = __fixedAnswer;
  if (!answer) {
    const match = item.options.find(
      (o) => JSON.stringify(o[answerKey]) === JSON.stringify(answerValue),
    );
    if (!match) throw new Error(`no option matches the answer for ${item.id}`);
    answer = match.id;
  }
  return { ...item, answer };
}

/** Serialise a value as TypeScript source, compact where it fits. */
function ts(value, indent = 0) {
  const pad = "  ".repeat(indent);
  const padIn = "  ".repeat(indent + 1);
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    const parts = value.map((v) => ts(v, indent + 1));
    const oneLine = `[${parts.join(", ")}]`;
    if (oneLine.length <= 72 && !oneLine.includes("\n")) return oneLine;
    return `[\n${parts.map((p) => padIn + p).join(",\n")},\n${pad}]`;
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value).map(([k, v]) => `${k}: ${ts(v, indent + 1)}`);
    const oneLine = `{ ${entries.join(", ")} }`;
    if (oneLine.length <= 72 && !oneLine.includes("\n")) return oneLine;
    return `{\n${entries.map((e) => padIn + e).join(",\n")},\n${pad}}`;
  }
  if (typeof value === "string") return JSON.stringify(value);
  return String(value);
}

const body = (items) => items.map((item) => "    " + ts(item, 2)).join(",\n");

/* -------------------------------------------------------------------------
 * File emitters
 * ----------------------------------------------------------------------- */

function adultFile() {
  const builders = interleave(ADULT_PLAN);
  const items = builders.map((build, i) =>
    finalise(build(`a${String(i + 1).padStart(2, "0")}`, i)),
  );

  return `/**
 * THE ADULT TEST — 50 items, 15 minutes, one-way.
 *
 * ===========================================================================
 * THIS IS SCAFFOLDING. THE CONTENT IS NOT FINAL.
 * ===========================================================================
 * Generated by scripts/generate-tests.mjs. Every item carries
 * \`placeholder: true\`. The figural and numeric items are genuine puzzles
 * derived from the rule families in docs/test-content/rule-taxonomy.md; the
 * verbal items are plainly filler, because real verbal content needs somebody
 * who can judge vocabulary level and faking it here would make it easy to miss.
 *
 * ===========================================================================
 * THE STRUCTURE, WHICH IS REAL
 * ===========================================================================
 * A cognitive aptitude format: 50 questions, 15 minutes, roughly 18 seconds an
 * item, which almost nobody sustains. That is the design rather than a flaw —
 * how far you get is part of what it measures.
 *
 * ONE INTERLEAVED STREAM, NOT SECTIONS. Item 3 may be verbal and item 4
 * spatial. Difficulty climbs front to back: each domain's items are authored
 * easy to hard and the generator consumes them in order while spreading them
 * across the stream.
 *
 * Domain mix: 17 verbal, 17 quantitative, 11 spatial, 5 logic puzzles. Sentence
 * completion is the largest single type at 9 items, matching its roughly 18%
 * share of the real format.
 *
 * ONE POINT PER ITEM. No weighting, no penalty for a wrong answer, raw score
 * out of 50.
 *
 * \`allowBack: false\` — see the field's note in lib/test/types.ts. A one-way
 * pass is part of what the format measures, not an interaction oversight.
 *
 * NO PAPER FOLDING. It is a child item type only.
 */
import type { Test } from "../types";

export const ADULT_TEST: Test = {
  id: "adult",
  audience: "adult",
  band: "adult",
  title: "The 15-Minute Test",
  durationSeconds: 15 * 60,
  allowBack: false,
  placeholder: true,
  items: [
${body(items)},
  ],
};
`;
}

const BANKS = [
  { id: "grade-3", grades: [3], konst: "GRADE_3_TEST", label: "Grade 3" },
  { id: "grade-4", grades: [4], konst: "GRADE_4_TEST", label: "Grade 4" },
  { id: "grade-5", grades: [5], konst: "GRADE_5_TEST", label: "Grade 5" },
  { id: "grade-6", grades: [6], konst: "GRADE_6_TEST", label: "Grade 6" },
  { id: "grade-7-8", grades: [7, 8], konst: "GRADE_7_8_TEST", label: "Grade 7 and 8" },
];

function bankFile(bank, bankIndex) {
  const builders = interleave(CHILD_PLAN);
  const items = builders.map((build, i) =>
    // Offset by the bank so no two banks are the same fifteen questions.
    finalise(build(`${bank.id}-${String(i + 1).padStart(2, "0")}`, bankIndex * 7 + i)),
  );

  const banded = bank.grades.length > 1;

  return `/**
 * ${bank.label.toUpperCase()} BANK — 15 items, 5 minutes.
 *
 * ===========================================================================
 * THIS IS SCAFFOLDING. THE CONTENT IS NOT FINAL.
 * ===========================================================================
 * Generated by scripts/generate-tests.mjs. Every item carries
 * \`placeholder: true\`. The figure matrices and number analogies are genuine
 * puzzles derived from docs/test-content/rule-taxonomy.md; the verbal analogies
 * are plainly filler. Difficulty is UNCALIBRATED for this grade.
 *
 * ===========================================================================
 * THE STRUCTURE, WHICH IS REAL
 * ===========================================================================
 * Fifteen items in five minutes, about twenty seconds each: 5 verbal analogies,
 * 5 number analogies, 5 figure matrices, interleaved.
 *
 * That is not an arbitrary truncation. The publisher of the instrument this
 * mirrors sells an official Screening Form that keeps ONLY the analogies
 * subtest from each of the three batteries — their own answer to "what is the
 * minimum viable version of this". Following that logic gives the short test a
 * rationale instead of a guess.
 *
 * NO LETTER SERIES: the child quantitative battery uses number series, not
 * letters. Paper folding is available to child tests but is not part of the
 * fifteen-item screening structure, so it belongs here only if this bank grows.
 *${
   banded
     ? `
 * BANDED. Grades 7 and 8 share this bank, because cognitive development slows
 * through the upper grades and the source instrument bands them for the same
 * reason. Two separate banks would mean authoring a difficulty difference we
 * cannot actually distinguish.
 *`
     : ""
 }
 * TO LAND REAL CONTENT: edit this file. It is plain data, nothing regenerates
 * it at build time. Delete the \`placeholder\` flags as you go and run
 * \`npm run verify:tests\`.
 */
import type { Test } from "../types";

export const ${bank.konst}: Test = {
  id: "${bank.id}",
  audience: "child",
  bank: "${bank.id}",
  grades: [${bank.grades.join(", ")}],
  band: "${bank.id}",
  title: "The 5-Minute ${bank.label} Test",
  durationSeconds: 5 * 60,
  allowBack: true,
  placeholder: true,
  items: [
${body(items)},
  ],
};
`;
}

/* -------------------------------------------------------------------------
 * Write
 * ----------------------------------------------------------------------- */

const files = [
  ["adult.ts", adultFile()],
  ...BANKS.map((bank, i) => [`${bank.id}.ts`, bankFile(bank, i)]),
];

let written = 0;
let skipped = 0;
for (const [name, contents] of files) {
  const path = join(OUT_DIR, name);
  if (existsSync(path) && !FORCE) {
    console.log(`skip  ${name} (exists — pass --force to overwrite)`);
    skipped++;
    continue;
  }
  writeFileSync(path, contents, "utf8");
  console.log(`write ${name}`);
  written++;
}
console.log(`\n${written} written, ${skipped} skipped.`);
if (skipped > 0) {
  console.log("Existing files were left alone. If they hold real content, keep it that way.");
}
