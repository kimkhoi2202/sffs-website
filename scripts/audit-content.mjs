/**
 * Bank-level audits across all six tests.
 *
 *   npm run audit:content
 *
 * `verify:tests` checks that each item is internally well-formed. This checks
 * the things that are only visible ACROSS items, which is where a hand-authored
 * bank actually goes wrong:
 *
 *   - the same item, or the same stem, appearing twice within or across banks
 *   - the key clustering in one position, or running three deep
 *   - the key being systematically the longest option, which test-wise solvers
 *     exploit without knowing any of the content
 *   - a distractor with no written error sentence
 *   - two Difference-family options on one item, which makes it a two-way choice
 *   - blocklisted culture- and region-bound vocabulary
 *   - stems over the per-band reading ceiling
 *   - two options that are identical
 *
 * It also re-solves the one item type whose validity is a search problem: the
 * seating arrangement, by enumerating all 120 permutations.
 */
import { ALL_TESTS } from "../lib/test/tests/index.ts";

const problems = [];
const notes = [];
const fail = (m) => problems.push(m);

/* -------------------------------------------------------------------------
 * 1. Duplicates, within a bank and across all six
 * ------------------------------------------------------------------------- */
const signatures = new Map();
const stems = new Map();

for (const test of ALL_TESTS) {
  for (const item of test.items) {
    const optionText = item.options
      .map((o) => (o.text ?? JSON.stringify(o.fig ?? o.holes ?? o.poly ?? o.pos)).toLowerCase())
      .sort()
      .join("|");
    const body = [item.stem ?? "", (item.seq ?? []).join(","), item.prompt]
      .join(" ")
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, "")
      .replace(/\s+/g, " ")
      .trim();
    const sig = `${item.kind}::${body}::${optionText}`;

    const seen = signatures.get(sig);
    if (seen) fail(`duplicate item: ${test.id}/${item.id} is the same as ${seen}`);
    else signatures.set(sig, `${test.id}/${item.id}`);

    // Only meaningful for items whose stimulus is TEXT. A figure item's stem is
    // its geometry, which the full signature above already covers; comparing
    // their prompts would flag every odd-one-out against every other one.
    if (item.stem || item.seq) {
      const seenStem = stems.get(body);
      if (seenStem) fail(`duplicate stem: ${test.id}/${item.id} repeats ${seenStem}`);
      else stems.set(body, `${test.id}/${item.id}`);
    }
  }
}

/* -------------------------------------------------------------------------
 * 2. Per-test audits
 * ------------------------------------------------------------------------- */
for (const test of ALL_TESTS) {
  const keys = test.items.map((i) => i.answer);

  // Position balance. Three-option logic items can only key A-C and
  // odd-one-out items can key A-E, so the target is a range, not a quota.
  const counts = {};
  for (const k of keys) counts[k] = (counts[k] ?? 0) + 1;
  const spread = Object.entries(counts)
    .sort()
    .map(([k, n]) => `${k}:${n}`)
    .join(" ");
  notes.push(`${test.id.padEnd(10)} keys ${spread}`);
  for (const [pos, n] of Object.entries(counts)) {
    const share = n / test.items.length;
    if (share > 0.36) fail(`${test.id}: key ${pos} used ${n}/${test.items.length} times (${Math.round(share * 100)}%)`);
  }

  // No run of three identical positions.
  for (let i = 2; i < keys.length; i++) {
    if (keys[i] === keys[i - 1] && keys[i] === keys[i - 2]) {
      fail(`${test.id}: key position ${keys[i]} runs three deep at items ${i - 1}-${i + 1}`);
    }
  }

  // Interleaving: no two consecutive items of the same tier.
  for (let i = 1; i < test.items.length; i++) {
    if (test.items[i].tier === test.items[i - 1].tier) {
      fail(`${test.id}: items ${i} and ${i + 1} are both ${test.items[i].tier}`);
    }
  }

  // Key-length bias, text options only, and measured PER TIER. Pooling a
  // verbal analogy's words with a number analogy's two-digit answers produces
  // a mean that moves with the mix of item types rather than with any bias a
  // solver could exploit.
  const lengths = {};

  for (const item of test.items) {
    // Every distractor names its error.
    for (const o of item.options) {
      if (o.id === item.answer) continue;
      if (!o.why?.trim()) fail(`${test.id}/${item.id}: option ${o.id} has no intended-error note`);
    }

    // At most one Difference-family option. The note is tagged with the family
    // it belongs to, so this is readable off the text.
    const dFamily = item.options.filter(
      (o) => o.id !== item.answer && /^\s*D[:-]/.test(o.why ?? ""),
    );
    if (dFamily.length > 1) {
      fail(
        `${test.id}/${item.id}: ${dFamily.length} Difference-family options (${dFamily
          .map((o) => o.id)
          .join(", ")}) — two eliminable options halve the item`,
      );
    }

    // Identical options.
    const rendered = item.options.map((o) =>
      (o.text ?? JSON.stringify(o.fig ?? o.holes ?? o.poly ?? o.pos)).toLowerCase().trim(),
    );
    const dupes = rendered.filter((r, i) => rendered.indexOf(r) !== i);
    if (dupes.length > 0) fail(`${test.id}/${item.id}: identical options (${[...new Set(dupes)].join(", ")})`);

    const bucket = (lengths[item.tier] ??= { key: [], dist: [] });
    for (const o of item.options) {
      if (typeof o.text !== "string") continue;
      bucket[o.id === item.answer ? "key" : "dist"].push(o.text.length);
    }
  }

  const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
  for (const [tier, { key, dist }] of Object.entries(lengths)) {
    if (key.length < 4 || dist.length === 0) continue;
    notes.push(
      `${test.id.padEnd(10)} ${tier.toLowerCase().padEnd(20)} key ${mean(key).toFixed(1)} vs distractor ${mean(dist).toFixed(1)} chars`,
    );
  }

  /*
   * The length cue that is actually exploitable.
   *
   * A mean is the wrong instrument: it moves with the mix of item types (a
   * verbal analogy's words pooled with a number analogy's two-digit answers)
   * and it says nothing about whether a solver could act on it. What a
   * test-wise solver DOES is pick the strictly longest or strictly shortest
   * option without reading the stem, so that is what gets counted. Chance for a
   * four-option item is about a quarter each way.
   */
  let longest = 0;
  let shortest = 0;
  let counted = 0;
  for (const item of test.items) {
    const texts = item.options.filter((o) => typeof o.text === "string");
    if (texts.length !== item.options.length || texts.length < 3) continue;
    // A type whose options are the same three words every time (True / False /
    // Cannot tell) carries no within-item length information to exploit.
    const lens = texts.map((o) => o.text.length);
    if (new Set(texts.map((o) => o.text)).size < texts.length) continue;
    const keyLen = texts.find((o) => o.id === item.answer).text.length;
    counted++;
    if (lens.filter((l) => l >= keyLen).length === 1) longest++;
    if (lens.filter((l) => l <= keyLen).length === 1) shortest++;
  }
  if (counted >= 8) {
    const l = longest / counted;
    const s = shortest / counted;
    notes.push(
      `${test.id.padEnd(10)} key is strictly longest ${longest}/${counted} (${Math.round(l * 100)}%), strictly shortest ${shortest}/${counted} (${Math.round(s * 100)}%)`,
    );
    if (l > 0.45) fail(`${test.id}: the key is the strictly longest option ${longest}/${counted} times — a solver can score above chance without reading a stem`);
    if (s > 0.45) fail(`${test.id}: the key is the strictly shortest option ${shortest}/${counted} times — a solver can score above chance without reading a stem`);
  }

  // Domain mix, for the record.
  const domains = {};
  for (const item of test.items) domains[item.domain] = (domains[item.domain] ?? 0) + 1;
  notes.push(
    `${test.id.padEnd(10)} domains ${Object.entries(domains)
      .map(([d, n]) => `${d}:${n}`)
      .join(" ")}`,
  );
}

/* -------------------------------------------------------------------------
 * 3. Cultural and regional neutrality (the blocklist from the taxonomy)
 * ------------------------------------------------------------------------- */
const BLOCKED = [
  /\b(dollar|pound|euro|cent|penny|pennies|pence)s?\b/i,
  /[$£€¥]/,
  // Imperial units only where they are being USED as units. A bare "foot" is a
  // body part and a perfectly good universal referent; "3 feet" is not.
  /\b\d+(\.\d+)?\s*-?\s*(inch|inches|foot|feet|mile|miles|ounce|ounces|gallon|gallons|yard|yards|pound|pounds)\b/i,
  /\b(fahrenheit|inches|miles per|square feet)\b/i,
  /\b(baseball|cricket|gridiron|touchdown|innings|quarterback)\b/i,
  /\b(sophomore|freshman|hall pass)\b/i,
  /\b(thanksgiving|halloween|congress|parliament|president|senator)\b/i,
  // Exam names only when capitalised: "sat a test" is the verb, "SAT" is not.
  /\b(GCSE|SAT|ACT|A-level)s?\b/,
];

for (const test of ALL_TESTS) {
  for (const item of test.items) {
    const text = [item.prompt, item.stem ?? "", item.caption ?? "", item.explanation ?? ""]
      .concat(item.options.map((o) => o.text ?? ""))
      .join(" ");
    for (const re of BLOCKED) {
      const hit = text.match(re);
      if (hit) fail(`${test.id}/${item.id}: blocklisted term "${hit[0]}"`);
    }
  }
}

/* -------------------------------------------------------------------------
 * 4. Reading load. The child ceiling is real: 15 items in 5 minutes is 20
 *    seconds each, and a stem a child cannot read in six of them measures
 *    reading speed rather than reasoning.
 * ------------------------------------------------------------------------- */
const WORD_CEILING = { "grade-3": 12, "grade-4": 14, "grade-5": 16, "grade-6": 18, "grade-7-8": 20 };

for (const test of ALL_TESTS) {
  const ceiling = WORD_CEILING[test.id];
  if (!ceiling) continue;
  for (const item of test.items) {
    const words = (item.stem ?? "").trim().split(/\s+/).filter(Boolean).length;
    if (words > ceiling) fail(`${test.id}/${item.id}: stem is ${words} words, ceiling is ${ceiling}`);
  }
}

/* -------------------------------------------------------------------------
 * 5. Re-solve the seating item by brute force
 * ------------------------------------------------------------------------- */
function permutations(xs) {
  if (xs.length <= 1) return [xs];
  return xs.flatMap((x, i) =>
    permutations([...xs.slice(0, i), ...xs.slice(i + 1)]).map((rest) => [x, ...rest]),
  );
}

{
  const people = ["Ines", "Karl", "Mara", "Owen", "Piet"];
  const at = (row, name) => row.indexOf(name) + 1; // 1-based seat
  const constraints = [
    (r) => at(r, "Ines") === 1 || at(r, "Ines") === 5,
    (r) => at(r, "Karl") === at(r, "Ines") + 1,
    (r) => Math.abs(at(r, "Karl") - at(r, "Owen")) === 2,
    (r) => at(r, "Mara") < at(r, "Owen"),
  ];
  const valid = permutations(people).filter((r) => constraints.every((c) => c(r)));

  if (valid.length !== 1) {
    fail(`seating item a46: ${valid.length} arrangements satisfy the constraints, expected exactly 1`);
  } else {
    const seat3 = valid[0][2];
    notes.push(`a46 seating   unique arrangement ${valid[0].join(" ")} → seat 3 is ${seat3}`);
    const item = ALL_TESTS.find((t) => t.id === "adult")?.items.find((i) => i.id === "a46");
    const keyed = item?.options.find((o) => o.id === item.answer)?.text;
    if (keyed !== seat3) fail(`seating item a46: key says "${keyed}", enumeration says "${seat3}"`);
  }
}

/* -------------------------------------------------------------------------
 * 6. Re-solve every number and letter series against the whole rule
 *    vocabulary, and require exactly one rule to fit.
 * ------------------------------------------------------------------------- */
const A_CODE = "A".charCodeAt(0);
const toNums = (seq) => seq.filter((s) => s !== "?").map(Number);

function fitNumberRules(given) {
  const out = [];
  const d = given.slice(1).map((n, i) => n - given[i]);

  // NS-1 constant difference
  if (d.every((x) => x === d[0])) out.push(["NS-1", given.at(-1) + d[0]]);
  // NS-2 constant ratio
  if (given.every((n, i) => i === 0 || (given[i - 1] !== 0 && n / given[i - 1] === given[1] / given[0])))
    out.push(["NS-2", given.at(-1) * (given[1] / given[0])]);
  // NS-3 two interleaved arithmetic sequences
  if (given.length >= 5) {
    const odd = given.filter((_, i) => i % 2 === 0);
    const even = given.filter((_, i) => i % 2 === 1);
    const dOdd = odd.slice(1).map((n, i) => n - odd[i]);
    const dEven = even.slice(1).map((n, i) => n - even[i]);
    if (dOdd.every((x) => x === dOdd[0]) && dEven.every((x) => x === dEven[0])) {
      const nextIsOdd = given.length % 2 === 0;
      out.push(["NS-3", nextIsOdd ? odd.at(-1) + dOdd[0] : even.at(-1) + dEven[0]]);
    }
  }
  // NS-4 constant second difference
  const dd = d.slice(1).map((x, i) => x - d[i]);
  if (dd.length > 0 && dd.every((x) => x === dd[0]) && dd[0] !== 0)
    out.push(["NS-4", given.at(-1) + d.at(-1) + dd[0]]);
  // NS-5 two-step composite, a*x + b fitted from the first two steps
  if (given.length >= 3 && given[1] !== given[0]) {
    const a = (given[2] - given[1]) / (given[1] - given[0]);
    const b = given[1] - a * given[0];
    if (Number.isInteger(a) && Number.isInteger(b) && a !== 1 &&
        given.every((n, i) => i === 0 || n === a * given[i - 1] + b))
      out.push([`NS-5 (x${a}${b >= 0 ? "+" : ""}${b})`, a * given.at(-1) + b]);
  }
  // NS-6 additive recurrence
  if (given.length >= 3 && given.every((n, i) => i < 2 || n === given[i - 1] + given[i - 2]))
    out.push(["NS-6", given.at(-1) + given.at(-2)]);

  // Collapse rules that agree on the answer: two derivations of the same next
  // term is not an ambiguous item, it is an over-determined one.
  const byAnswer = new Map();
  for (const [name, ans] of out) byAnswer.set(ans, [...(byAnswer.get(ans) ?? []), name]);
  return byAnswer;
}

function fitLetterRules(given) {
  const nums = given.map((g) => [...g].map((c) => c.charCodeAt(0) - A_CODE));
  const width = nums[0].length;
  if (!nums.every((n) => n.length === width)) return new Map();

  const steps = [];
  for (let col = 0; col < width; col++) {
    const col_ = nums.map((n) => n[col]);
    const d = col_.slice(1).map((n, i) => n - col_[i]);
    if (!d.every((x) => x === d[0])) return new Map();
    steps.push(d[0]);
  }
  const next = nums.at(-1).map((n, i) => n + steps[i]);
  if (next.some((n) => n < 0 || n > 25)) return new Map(); // would wrap; the taxonomy forbids a hidden wrap
  const answer = next.map((n) => String.fromCharCode(A_CODE + n)).join("");
  return new Map([[answer, [`LS steps [${steps.join(", ")}]`]]]);
}

for (const test of ALL_TESTS) {
  for (const item of test.items) {
    if (item.kind !== "series") continue;
    const given = item.seq.filter((s) => s !== "?");
    const isLetters = given.every((s) => /^[A-Z]+$/.test(s));
    const fits = isLetters ? fitLetterRules(given) : fitNumberRules(toNums(item.seq));
    const keyed = item.options.find((o) => o.id === item.answer)?.text;

    if (fits.size === 0) {
      fail(`${test.id}/${item.id}: no rule in the vocabulary reproduces this series`);
    } else if (fits.size > 1) {
      fail(
        `${test.id}/${item.id}: AMBIGUOUS — ${[...fits.entries()]
          .map(([ans, names]) => `${names.join("/")}→${ans}`)
          .join("; ")}`,
      );
    } else {
      const [ans, names] = [...fits.entries()][0];
      if (String(ans) !== keyed) {
        fail(`${test.id}/${item.id}: key says "${keyed}", ${names.join("/")} says "${ans}"`);
      } else {
        notes.push(`${test.id}/${item.id} series re-solved: ${names.join(" + ")} → ${ans}`);
      }
    }
  }
}

/* -------------------------------------------------------------------------
 * 7. Re-solve every number analogy. `a → b`, `c → d`, `e → ?`: fit the whole
 *    NA vocabulary to the two complete pairs and require one answer.
 * ------------------------------------------------------------------------- */
const NA_RE = /^\s*(-?\d+)\s*(?:→|->)\s*(-?\d+)\s*$/;

for (const test of ALL_TESTS) {
  for (const item of test.items) {
    if (item.tier !== "NUMBER ANALOGY" || !item.stem) continue;
    const pairs = item.stem
      .split("\n")
      .map((line) => line.match(NA_RE))
      .filter(Boolean)
      .map((m) => [Number(m[1]), Number(m[2])]);
    const source = item.stem.match(/(-?\d+)\s*(?:→|->)\s*\?/);
    if (pairs.length !== 2 || !source) {
      fail(`${test.id}/${item.id}: number analogy stem is not two pairs plus a source`);
      continue;
    }
    const e = Number(source[1]);
    const [[a, b], [c, d]] = pairs;

    const answers = new Map();
    const add = (name, v) => {
      if (!Number.isInteger(v)) return;
      answers.set(v, [...(answers.get(v) ?? []), name]);
    };
    // NA-1 additive
    if (b - a === d - c) add("NA-1 additive", e + (b - a));
    // NA-2 multiplicative
    if (a !== 0 && c !== 0 && b / a === d / c) add(`NA-2 x${b / a}`, e * (b / a));
    // NA-3..NA-6 affine: b = k*a + m fitted from the two pairs
    if (a !== c) {
      const k = (b - d) / (a - c);
      const m = b - k * a;
      if (k !== 1 && Number.isFinite(k) && Number.isInteger(k * e + m)) {
        add(`NA-affine (x${k}${m >= 0 ? "+" : ""}${m})`, k * e + m);
      }
    }

    const keyed = Number(item.options.find((o) => o.id === item.answer)?.text);
    if (answers.size === 0) {
      fail(`${test.id}/${item.id}: no NA rule fits both pairs`);
    } else if (answers.size > 1) {
      fail(
        `${test.id}/${item.id}: AMBIGUOUS — ${[...answers.entries()]
          .map(([v, names]) => `${names.join("/")}→${v}`)
          .join("; ")}`,
      );
    } else {
      const [v, names] = [...answers.entries()][0];
      if (v !== keyed) fail(`${test.id}/${item.id}: key says ${keyed}, ${names.join("/")} says ${v}`);
      else notes.push(`${test.id}/${item.id} analogy re-solved: ${names.join(" + ")} → ${v}`);
    }
  }
}

/* -------------------------------------------------------------------------
 * 8. Figural odd-one-out: no attribute other than the intended one may split
 *    the five figures four against one.
 * ------------------------------------------------------------------------- */
const CURVED = new Set(["circle", "heart", "crescent", "teardrop"]);
const VERTICES = {
  circle: 0, crescent: 0, heart: 0, teardrop: 0,
  triangle: 3, square: 4, diamond: 4, cross: 12, star: 10, arrow: 7, lightning: 7,
};

for (const test of ALL_TESTS) {
  for (const item of test.items) {
    if (item.kind !== "figure" || item.layout !== "odd-one-out") continue;

    const attrs = {
      "shape set": (f) => JSON.stringify(f.shapes.map((s) => s.shape).sort()),
      "element count": (f) => f.shapes.length,
      "filled count": (f) => f.shapes.filter((s) => s.filled).length,
      "all filled": (f) => f.shapes.every((s) => s.filled),
      "any filled": (f) => f.shapes.some((s) => s.filled),
      arrangement: (f) => f.arrange ?? "auto",
      "size set": (f) => JSON.stringify(f.shapes.map((s) => s.size ?? "m").sort()),
      "rotation set": (f) => JSON.stringify(f.shapes.map((s) => s.rotate ?? 0).sort()),
      "on a quarter turn": (f) => f.shapes.every((s) => (s.rotate ?? 0) % 90 === 0),
      "any curved": (f) => f.shapes.some((s) => CURVED.has(s.shape)),
      "all curved": (f) => f.shapes.every((s) => CURVED.has(s.shape)),
      "vertex total": (f) => f.shapes.reduce((n, s) => n + (VERTICES[s.shape] ?? 0), 0),
      "same shape twice": (f) => new Set(f.shapes.map((s) => s.shape)).size < f.shapes.length,
    };

    for (const [name, fn] of Object.entries(attrs)) {
      const values = item.options.map((o) => String(fn(o.fig)));
      const tally = {};
      for (const v of values) tally[v] = (tally[v] ?? 0) + 1;
      const loner = Object.entries(tally).find(([, n]) => n === 1);
      const rest = Object.entries(tally).find(([, n]) => n === item.options.length - 1);
      if (!loner || !rest) continue;

      const oddId = item.options[values.indexOf(loner[0])].id;
      if (oddId !== item.answer) {
        fail(
          `${test.id}/${item.id}: attribute "${name}" also splits the set 4-1, and it picks ${oddId} rather than the key ${item.answer}`,
        );
      }
    }
  }
}

/* -------------------------------------------------------------------------
 * 9. Figural legibility. matRiks guarantees that no distractor EQUALS the key;
 *    it knows nothing about whether the resulting picture can be told apart on
 *    a phone. Two failures are silent and both ship a broken item:
 *
 *      - a rotation applied to a glyph that is symmetric under it. A square
 *        turned a quarter turn is the same square, so the rule is applied and
 *        invisible, and the item has two identical options.
 *      - two options differing only in size, by too little to see. A 15%
 *        difference at 44px is a coin flip, not a reasoning step.
 * ------------------------------------------------------------------------- */

/** Rotation that leaves the glyph looking identical. 0 means any rotation does. */
const ROT_PERIOD = {
  circle: 0,
  square: 90,
  diamond: 90,
  cross: 90,
  star: 72,
  triangle: 360,
  heart: 360,
  arrow: 360,
  crescent: 360,
  lightning: 360,
  teardrop: 360,
};

const NAMED_SIZE = { s: 0.397, m: 0.62, l: 0.781 };
const sizeOf = (el) => (typeof el.size === "number" ? el.size : NAMED_SIZE[el.size ?? "m"]);

/** Does a rotation of `deg` change how this glyph looks? */
function rotationVisible(shape, deg) {
  const period = ROT_PERIOD[shape] ?? 360;
  if (period === 0) return false;
  return ((deg % period) + period) % period !== 0;
}

/** What the eye actually sees, with invisible rotations normalised away. */
function visual(el) {
  const rot = el.rotate ?? 0;
  return [
    el.shape,
    rotationVisible(el.shape, rot) ? ((rot % (ROT_PERIOD[el.shape] || 360)) + 360) % (ROT_PERIOD[el.shape] || 360) : 0,
    el.filled ? (el.color ?? "blue") : "none",
    el.x ?? -1,
    el.y ?? -1,
  ].join("/");
}

for (const test of ALL_TESTS) {
  for (const item of test.items) {
    if (item.kind !== "figure") continue;

    const surfaces = [
      ...item.cells.map((c, i) => [`cell ${i + 1}`, c]),
      ...item.options.map((o) => [`option ${o.id}`, o.fig]),
    ];

    /*
     * THE TWO PALETTES MUST STAY DISJOINT.
     *
     * A colour on the question screen means either "this is part of the puzzle"
     * or "this is something about the interface", and never both. Brand blue
     * was once the selected-option background AND the solid step of the shading
     * ladder, so on a figural item a blue card could be blue because you picked
     * it or because the figure inside it is blue as part of the question. That
     * is a misreadable puzzle, not an untidy one.
     *
     * The sets are written down in lib/test/types.ts. This is the check that
     * stops a future item type quietly reintroducing the clash.
     */
    const STATE_ONLY = {
      "var(--color-blue)": "the selected-option background",
      "var(--color-yellow)": "the letter badges and the missing-cell marker",
      "var(--color-coral)": "the destructive action",
      "var(--color-green)": "the primary action",
      "var(--color-mint)": "the primary action",
    };
    for (const [where, cell] of surfaces) {
      for (const el of cell.shapes) {
        const reason = el.color && STATE_ONLY[el.color];
        if (reason) {
          fail(
            `${test.id}/${item.id}: ${where} paints a figure in ${el.color}, which is ${reason}. ` +
              `Puzzle ink and interface state must not share a colour — see PUZZLE_INK in lib/test/types.ts.`,
          );
        }
      }
    }

    /*
     * A fill that cannot be seen.
     *
     * `crescent` and `lightning` are thin figures drawn with a heavy keyline:
     * the stroke covers most of their ink, so filling the interior changes
     * almost nothing on screen. A shading rule on one of them renders as nine
     * identical outline figures and the rule is simply absent from the picture.
     * This is invisible to every other check here, because the DATA is correct
     * — it was found by looking at a render.
     */
    const THIN = new Set(["crescent", "lightning"]);
    const fills = {};
    for (const [, cell] of surfaces) {
      for (const el of cell.shapes) {
        if (!THIN.has(el.shape)) continue;
        (fills[el.shape] ??= new Set()).add(el.filled ? (el.color ?? "solid") : "none");
      }
    }
    for (const [shape, states] of Object.entries(fills)) {
      if (states.size > 1) {
        fail(`${test.id}/${item.id}: a ${shape} is used both filled and unfilled, and its heavy keyline hides the fill — the shading rule will not be visible`);
      }
    }

    for (const [where, cell] of surfaces) {
      for (const el of cell.shapes) {
        const s = sizeOf(el);
        if (s < 0.15) fail(`${test.id}/${item.id}: ${where} draws a ${el.shape} at ${(s * 100).toFixed(0)}% of the cell, too small to read on a phone`);
        if (el.rotate && !rotationVisible(el.shape, el.rotate)) {
          fail(`${test.id}/${item.id}: ${where} turns a ${el.shape} by ${el.rotate} degrees, which leaves it looking identical — the rule is applied and invisible`);
        }
      }
    }

    // Options that a solver cannot tell apart.
    for (let i = 0; i < item.options.length; i++) {
      for (let j = i + 1; j < item.options.length; j++) {
        const a = item.options[i];
        const b = item.options[j];
        const sa = a.fig.shapes;
        const sb = b.fig.shapes;
        if (sa.length !== sb.length) continue;

        const sameLooking = sa.every((el, k) => visual(el) === visual(sb[k]));
        if (!sameLooking) continue;

        // Everything but size matches. Size is then the only signal, so it has
        // to be a real one.
        const ratios = sa.map((el, k) => {
          const x = sizeOf(el);
          const y = sizeOf(sb[k]);
          return Math.max(x, y) / Math.min(x, y);
        });
        const worst = Math.min(...ratios);
        if (worst < 1.3) {
          fail(
            worst === 1
              ? `${test.id}/${item.id}: options ${a.id} and ${b.id} draw the same picture`
              : `${test.id}/${item.id}: options ${a.id} and ${b.id} differ only in size, by ${((worst - 1) * 100).toFixed(0)}% — not enough to see`,
          );
        }
      }
    }
  }
}

/* -------------------------------------------------------------------------
 * Report
 * ------------------------------------------------------------------------- */
for (const n of notes) console.log(`  ${n}`);
console.log("");
if (problems.length === 0) {
  console.log(`audit-content: OK. ${ALL_TESTS.length} tests, ${ALL_TESTS.reduce((n, t) => n + t.items.length, 0)} items, no findings.`);
} else {
  for (const p of problems) console.log(`FAIL  ${p}`);
  console.log(`\naudit-content: ${problems.length} finding(s).`);
  process.exit(1);
}
