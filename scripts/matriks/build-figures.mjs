/**
 * matRiks geometry -> the site's FigCellState, and the four options to ship.
 *
 *   Rscript scripts/matriks/generate.R && node scripts/matriks/build-figures.mjs
 *
 * Reads scripts/matriks/matrices.json (raw matRiks output) and writes
 * scripts/matriks/figure-items.txt: a TypeScript literal per matrix, ready to
 * paste into lib/test/tests/*.ts. The test files stay plain hand-edited data —
 * this only exists so the nine cells and four options of a matrix are
 * TRANSCRIBED rather than retyped.
 *
 * ---------------------------------------------------------------------------
 * WHAT IS AND IS NOT A TRANSLATION
 * ---------------------------------------------------------------------------
 * Three things here change how a matrix LOOKS without touching what it TESTS,
 * and it is worth being explicit about which:
 *
 *   glyph relabelling   matRiks reasons about attributes, not silhouettes.
 *                       Calling its `pentagon` our `arrow` is a bijection
 *                       applied to every cell and every option at once.
 *   size laddering      matRiks' sizes are ordinal (three steps). They are
 *                       re-spaced onto a legibility ladder that preserves the
 *                       order, because a linear map of its ratios puts a
 *                       three-element cell's smallest glyph at 13% of a 96px
 *                       tile, which nobody can see on a phone.
 *   rotation scaling    an integer multiplier on the rotation delta, so a
 *                       45-degree step can be shown as a quarter turn.
 *
 * Three things are NOT translations and are computed here rather than by
 * matRiks, for logical matrices only: the wrong-principle option (the union
 * where the rule was XOR or AND), the incomplete-correlate option (the right
 * answer with one element dropped) and nothing else. matRiks' own distractors
 * for logical matrices are attribute perturbations — a filled or shrunken copy
 * of the correct set — and an option that is the only filled figure in an
 * all-outline item is eliminable without solving anything. The KEY still comes
 * from matRiks in every case.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const raw = JSON.parse(readFileSync(join(HERE, "matrices.json"), "utf8"));

/* -------------------------------------------------------------------------
 * Where the key sits, per item, so the bank is not answerable by position.
 * Audited across the whole bank in scripts/audit-content.mjs.
 * ------------------------------------------------------------------------- */
const KEY_POS = {
  "g4-m2": "D", "g4-m4": "C",
  "g5-m1": "D", "g5-m2": "C", "g5-m3": "B", "g5-m4": "A", "g5-m5": "C",
  "g6-m1": "A", "g6-m2": "C", "g6-m3": "D", "g6-m4": "B", "g6-m5": "A",
  "g78-m1": "B", "g78-m2": "D", "g78-m3": "C", "g78-m4": "A", "g78-m5": "D",
  "a-m1": "B", "a-m2": "D", "a-m3": "A",
};

/**
 * The size ladder, as a share of the cell.
 *
 * matRiks' sizes are ORDINAL — a size rule steps through three values and the
 * ratios between them mean nothing beyond their order. Mapping the ratios
 * linearly puts the smallest glyph of a three-element cell at 11% of a 96px
 * tile, and the size distractor smaller still. So the distinct sizes an item
 * uses are re-spaced evenly across a band chosen for the element count, which
 * preserves the order (the thing the rule encodes) and guarantees every step is
 * visible on a phone.
 */
const SIZE_BAND = { 1: [0.34, 0.8], 2: [0.24, 0.44], 3: [0.18, 0.28], 4: [0.3, 0.42] };

function sizeLadder(steps, elements) {
  const [lo, hi] = SIZE_BAND[elements] ?? SIZE_BAND[3];
  if (steps <= 1) return [hi * 0.85];
  return Array.from({ length: steps }, (_, i) => lo + ((hi - lo) * i) / (steps - 1));
}
/** Fixed slots for logical matrices, so a missing element leaves a hole. */
const LOGIC_SLOTS = [
  [0.29, 0.29],
  [0.71, 0.29],
  [0.29, 0.71],
  [0.71, 0.71],
];

const asArray = (v) => (Array.isArray(v) ? v : [v]);
const round = (n, p = 3) => Number(n.toFixed(p));

/** A matRiks response we cannot draw: it reached outside the glyph set. */
function isUnmappable(rec, base) {
  const shapes = asArray(rec.shape);
  const baseShapes = asArray(base.shape);
  if (shapes.length !== baseShapes.length) return true;
  return shapes.some((s, i) => s !== baseShapes[i]);
}

function shadeStyle(shade) {
  if (shade === "grey") return { filled: true, color: "var(--color-gray-300)" };
  if (shade === "black") return { filled: true };
  return {}; // white, or unshaded
}

/**
 * One matRiks record -> one FigCellState.
 *
 * `sizeRank` maps a raw matRiks size onto its ordinal position among all the
 * sizes this item uses, so the ladder is consistent across the nine cells and
 * the four options.
 */
function toCell(rec, ctx) {
  const shapes = asArray(rec.shape);
  const sizes = asArray(rec.size);
  const rotations = asArray(rec.rotation);
  const shades = asArray(rec.shade);
  const visible = asArray(rec.visible);

  const n = shapes.length;
  const ladder = sizeLadder(ctx.sizeValues.length, n);

  const out = [];
  for (let i = 0; i < n; i++) {
    if (visible[i] === 0) continue;
    const el = { shape: ctx.glyphs[i] };

    const ratio = round(sizes[i] / ctx.baseSizes[i], 4);
    const rank = ctx.sizeValues.indexOf(ratio);
    if (rank >= 0) {
      el.size = round(ladder[rank]);
    } else {
      // Off the ladder: a distractor-only size. Keep it clearly outside the
      // range the grid uses, in the direction it actually lies.
      el.size = round(
        ratio < ctx.sizeValues[0] ? ladder[0] * 0.6 : Math.min(0.86, ladder[ladder.length - 1] * 1.22),
      );
    }

    const deg =
      Math.round((((rotations[i] - ctx.baseRotations[i]) * 180) / Math.PI) * ctx.rot) % 360;
    const norm = ((deg % 360) + 360) % 360;
    if (norm !== 0) el.rotate = norm;

    Object.assign(el, shadeStyle(shades[i]));

    if (ctx.logic) {
      el.x = LOGIC_SLOTS[i][0];
      el.y = LOGIC_SLOTS[i][1];
    }
    out.push(el);
  }
  return { shapes: out };
}

/** A value that is equal iff two cells draw the same picture. */
const signature = (cell) =>
  JSON.stringify(
    cell.shapes.map((s) => [s.shape, s.size, s.rotate ?? 0, s.filled ?? false, s.color ?? "", s.x ?? -1, s.y ?? -1]),
  );

/** Elementwise OR of two visibility vectors, as a synthetic matRiks record. */
function logicVariant(base, visible) {
  return { ...base, visible };
}

const results = {};
const report = [];

for (const [id, m] of Object.entries(raw)) {
  const base = m.base;
  const glyphs = asArray(m.glyphs);
  const baseSizes = asArray(base.size);
  const baseRotations = asArray(base.rotation);
  const hrules = asArray(m.hrules);
  const vrules = asArray(m.vrules);
  const rules = [...hrules, ...vrules].filter((r) => r !== "identity");
  const logic = rules.some((r) => r === "AND" || r === "OR" || r === "XOR");

  // The ladder is built over the sizes the NINE CELLS use, so the grid always
  // spans the whole legible band. A size that only a distractor uses (matRiks'
  // IC-Size picks a value below the smallest in the grid) is placed off the
  // bottom of the ladder rather than being given a rung, which would squeeze
  // the three real steps into two thirds of the band and turn "which one is
  // smaller" into a coin flip.
  const sizeValues = [
    ...new Set(
      m.cells.flatMap((r) =>
        asArray(r.size).map((s, i) => round(s / baseSizes[i % baseSizes.length], 4)),
      ),
    ),
  ].sort((a, b) => a - b);

  const ctx = { glyphs, baseSizes, baseRotations, rot: m.rot, sizeValues, logic };

  const cells = m.cells.map((c) => toCell(c, ctx));
  const correct = toCell(m.responses.correct, ctx);

  /* ---- pick three distractors -------------------------------------------
   * Correct + WP + IC + R, per the taxonomy's composition rule. Never two
   * from one family, and never the Difference family, which matRiks builds
   * out of its own silhouettes.
   */
  const picks = [{ tag: "correct", cell: correct }];
  const seen = new Set([signature(correct)]);

  const tryPick = (tag, cell) => {
    if (!cell || cell.shapes.length === 0) return false;
    const sig = signature(cell);
    if (seen.has(sig)) return false;
    seen.add(sig);
    picks.push({ tag, cell });
    return true;
  };

  const fromResponse = (name) => {
    const r = m.responses[name];
    if (!r || isUnmappable(r, base)) return null;
    return toCell(r, ctx);
  };

  if (logic) {
    const c7 = asArray(m.cells[6].visible);
    const c8 = asArray(m.cells[7].visible);
    const key = asArray(m.responses.correct.visible);

    // WP: the union. The commonest wrong principle on a logical matrix is
    // reading AND or XOR as "everything that appears in either cell".
    const union = c7.map((v, i) => (v || c8[i] ? 1 : 0));
    tryPick("wp-union", toCell(logicVariant(base, union), ctx));

    // IC: the right set with its last member dropped.
    const dropped = [...key];
    for (let i = dropped.length - 1; i >= 0; i--) {
      if (dropped[i] === 1) {
        dropped[i] = 0;
        break;
      }
    }
    if (dropped.some((v) => v === 1)) tryPick("ic-dropped", toCell(logicVariant(base, dropped), ctx));

    for (const f of ["r_left", "r_top", "r_diag"]) if (tryPick(f, fromResponse(f))) break;
  } else {
    for (const f of ["wp_copy", "wp_matrix"]) if (tryPick(f, fromResponse(f))) break;

    // Prefer the IC family that perturbs a rule the matrix ACTUALLY runs: that
    // is the "right rule, one attribute wrong" error worth catching. IC-Flip is
    // last unless rotation is active, because on a still matrix it turns a
    // figure the grid never turns — and on a symmetric glyph it turns it
    // invisibly, which produces two options that draw the same picture.
    const icOrder = [];
    if (rules.includes("rotate")) icOrder.push("ic_flip");
    if (rules.includes("shade")) icOrder.push("ic_neg");
    if (rules.includes("size")) icOrder.push("ic_size");
    for (const f of ["ic_size", "ic_neg", "ic_flip"]) if (!icOrder.includes(f)) icOrder.push(f);
    for (const f of icOrder) if (tryPick(f, fromResponse(f))) break;

    for (const f of ["r_left", "r_top", "r_diag"]) if (tryPick(f, fromResponse(f))) break;
  }

  // Backfill. 43% of matRiks rule pairs collapse at least one distractor onto
  // another option (measured in the taxonomy's probe), so the preferred family
  // is not always available. Walk the rest of the typology rather than shipping
  // a three-option matrix.
  if (picks.length < 4) {
    for (const f of ["ic_size", "ic_neg", "ic_flip", "r_top", "r_diag", "r_left", "wp_matrix", "wp_copy"]) {
      if (picks.length === 4) break;
      tryPick(f, fromResponse(f));
    }
  }
  if (picks.length !== 4) {
    report.push(
      `!! ${id}: only ${picks.length} distinct options (${picks.map((p) => p.tag).join(", ")})`,
    );
    continue;
  }

  // Place the key where KEY_POS says, distractors in order around it.
  const ids = ["A", "B", "C", "D"].slice(0, picks.length);
  const keyPos = KEY_POS[id] ?? "A";
  const order = [];
  const rest = picks.slice(1);
  for (const oid of ids) order.push(oid === keyPos ? picks[0] : rest.shift());

  results[id] = {
    id,
    rules: { h: hrules, v: vrules },
    ruleCount: rules.length,
    rot: m.rot,
    cells,
    options: order.map((p, i) => ({ id: ids[i], tag: p.tag, fig: p.cell })),
    answer: keyPos,
    warnings: asArray(m.warnings ?? []),
  };
  report.push(
    `${id}  rules=${rules.length} [${hrules.join("+")} / ${vrules.join("+")}]  key=${keyPos}  options=${order
      .map((p) => p.tag)
      .join(", ")}`,
  );
}

/* =========================================================================
 * A SECOND ENGINE, for the two rules matRiks cannot express here
 * =========================================================================
 * matRiks covers shading, size, rotation and the logical operators. It cannot
 * give us the other two the taxonomy asks for at the youngest band:
 *
 *   FM-1 shape identity   its `shape` rule permutes among its OWN compound
 *                         silhouettes (s_lily, s_malta, s_ninja and friends),
 *                         which have no glyph in this codebase. Mapping them
 *                         would mean drawing a dozen shapes that exist for no
 *                         other reason.
 *   FM-2 element count    it has no count rule at all.
 *
 * Losing both left Grade 3 with shading and size and nothing else, which is why
 * that bank was five variations on one idea with no ramp in it. So these two
 * rules are generated here instead.
 *
 * THE PROPERTY THAT MATTERS IS PRESERVED. Cell nine is produced by the same
 * function as cells one through eight, from the rules, rather than being
 * asserted separately: `cellSpec(2, 2)` is the same call as `cellSpec(0, 0)`.
 * A wrong key would require the rule itself to be wrong, in which case every
 * other cell is wrong too and it is visible immediately. That is the same
 * guarantee matRiks gives and it is the reason the taxonomy prefers a generator
 * to a person, not any property of matRiks specifically.
 *
 * The distractors are derived the same way: each one is the correct cell with a
 * named thing done to it, so its error sentence is a fact about how it was
 * built rather than a claim made afterwards.
 * ========================================================================= */

/** Sizes when an item has no size rule, by how many glyphs share the cell. */
const COUNT_FIT = { 1: 0.68, 2: 0.4, 3: 0.28, 4: 0.24 };
/**
 * The three steps of a size rule, single-glyph cells only.
 *
 * Each step is about 1.4x the one below it. Evenly spaced steps (0.40, 0.54,
 * 0.68) put the top two only 26% apart, which is under what the legibility
 * check allows and, more to the point, is a coin flip at option-card size on a
 * phone. Size is an ORDINAL attribute here: nothing depends on the ratios
 * being uniform, only on the order being unmistakable.
 */
const SIZE_STEPS = [0.36, 0.5, 0.7];
const SHADES = ["white", "grey", "solid"];

const LOCAL_SPECS = [
  /* ---- Grade 3 (L9). One rule, one rule, one rule, two, two. ------------- */
  {
    id: "g3-m1",
    h: "shape",
    v: "identity",
    glyphs: ["triangle", "square", "pentagon"],
    key: "C",
  },
  { id: "g3-m2", h: "count", v: "identity", glyphs: ["circle"], counts: [1, 2, 3], key: "A" },
  { id: "g3-m3", h: "identity", v: "shade", glyphs: ["heart"], key: "D" },
  {
    id: "g3-m4",
    h: "shape",
    v: "shade",
    glyphs: ["diamond", "hexagon", "star"],
    key: "B",
  },
  {
    id: "g3-m5",
    h: "count",
    v: "shape",
    glyphs: ["cross", "teardrop", "square"],
    counts: [3, 2, 1],
    key: "D",
  },

  /* ---- Grade 4 (L10). Shape and count join size and shading. ------------- */
  { id: "g4-m1", h: "size", v: "identity", glyphs: ["diamond"], key: "B" },
  {
    id: "g4-m3",
    h: "shape",
    v: "size",
    glyphs: ["triangle", "pentagon", "hexagon"],
    key: "A",
  },
  {
    id: "g4-m5",
    h: "count",
    v: "shade",
    glyphs: ["star"],
    counts: [1, 2, 3],
    key: "B",
  },
];

/** What a cell looks like, from the rules and nothing else. */
function cellSpec(spec, row, col) {
  const glyphs = spec.glyphs;
  const counts = spec.counts ?? [1, 1, 1];
  const pick = (rule, byCol, byRow, fallback) =>
    spec.h === rule ? byCol[col] : spec.v === rule ? byRow[row] : fallback;

  return {
    shape: pick("shape", glyphs, glyphs, glyphs[0]),
    count: pick("count", counts, counts, counts[0] ?? 1),
    shade: pick("shade", SHADES, SHADES, "white"),
    sizeStep: pick("size", [2, 1, 0], [2, 1, 0], null),
  };
}

function specToCell(spec, s) {
  const n = Math.max(1, s.count);
  const size = s.sizeStep === null ? (COUNT_FIT[n] ?? 0.28) : SIZE_STEPS[s.sizeStep];
  const fill =
    s.shade === "grey"
      ? { filled: true, color: "var(--color-gray-300)" }
      : s.shade === "solid"
        ? { filled: true }
        : {};
  return {
    shapes: Array.from({ length: n }, () => ({ shape: s.shape, size: round(size), ...fill })),
  };
}

function buildLocal(spec) {
  const cells = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) cells.push(specToCell(spec, cellSpec(spec, r, c)));
  }

  const correctSpec = cellSpec(spec, 2, 2);
  const picks = [{ tag: "correct", cell: specToCell(spec, correctSpec) }];
  const seen = new Set([signature(picks[0].cell)]);
  const take = (tag, cell) => {
    if (!cell || cell.shapes.length === 0) return false;
    const sig = signature(cell);
    if (seen.has(sig)) return false;
    seen.add(sig);
    picks.push({ tag, cell });
    return true;
  };

  // WP: the figure the grid starts from, with no rule applied.
  take("wp_copy", specToCell(spec, cellSpec(spec, 0, 0)));

  /*
   * IC: the correct cell with exactly one thing wrong.
   *
   * Stepping an ACTIVE rule back is the strongest version, but on a one-rule
   * matrix that lands on the cell to the left, which is already the R option.
   * So the fallbacks perturb something the grid holds CONSTANT, which is a real
   * error of its own: the solver read the rule and did not notice what the rule
   * was not allowed to touch.
   */
  const active = [spec.h, spec.v].filter((r) => r && r !== "identity");
  const back = (s) => ({ ...s });
  const candidates = [];
  if (active.includes("shape")) {
    const i = spec.glyphs.indexOf(correctSpec.shape);
    candidates.push(["ic_shape", { ...back(correctSpec), shape: spec.glyphs[(i + 2) % 3] }]);
  }
  if (active.includes("count")) {
    candidates.push(["ic_count", { ...back(correctSpec), count: correctSpec.count + 1 }]);
  }
  if (active.includes("shade")) {
    const i = SHADES.indexOf(correctSpec.shade);
    candidates.push(["ic_shade", { ...back(correctSpec), shade: SHADES[(i + 2) % 3] }]);
  }
  if (active.includes("size")) {
    candidates.push(["ic_size", { ...back(correctSpec), sizeStep: (correctSpec.sizeStep + 2) % 3 }]);
  }
  // Held-constant perturbations, for the one-rule case.
  candidates.push(["ic_count", { ...back(correctSpec), count: correctSpec.count + 1 }]);
  candidates.push(["ic_shade", { ...back(correctSpec), shade: correctSpec.shade === "white" ? "grey" : "white" }]);
  candidates.push(["ic_size", { ...back(correctSpec), sizeStep: correctSpec.sizeStep === null ? null : (correctSpec.sizeStep + 1) % 3 }]);

  for (const [tag, s] of candidates) if (take(tag, specToCell(spec, s))) break;

  for (const [tag, rc] of [["r_left", [2, 1]], ["r_top", [1, 2]], ["r_diag", [1, 1]]]) {
    if (take(tag, specToCell(spec, cellSpec(spec, rc[0], rc[1])))) break;
  }

  /*
   * Backfill. A ONE-RULE matrix has very little to be wrong about: with a
   * single rule running along the rows, stepping it back lands on the cell to
   * the left, so the Incomplete-Correlate option and the Repetition option are
   * the same picture and one of them is lost. The remaining candidates perturb
   * something the grid holds CONSTANT, which is a real error rather than a
   * filler: the solver read the rule and did not notice what the rule was not
   * allowed to touch.
   */
  if (picks.length < 4) {
    for (const [tag, s] of candidates) {
      if (picks.length === 4) break;
      take(tag, specToCell(spec, s));
    }
  }

  if (picks.length !== 4) {
    report.push(`!! ${spec.id}: only ${picks.length} distinct options`);
    return null;
  }

  const ids = ["A", "B", "C", "D"];
  const rest = picks.slice(1);
  const order = ids.map((id) => (id === spec.key ? picks[0] : rest.shift()));

  return {
    id: spec.id,
    engine: "local",
    rules: { h: [spec.h], v: [spec.v] },
    ruleCount: active.length,
    rot: 1,
    cells,
    options: order.map((p, i) => ({ id: ids[i], tag: p.tag, fig: p.cell })),
    answer: spec.key,
    warnings: [],
  };
}

for (const spec of LOCAL_SPECS) {
  const built = buildLocal(spec);
  if (!built) continue;
  results[spec.id] = built;
  report.push(
    `${spec.id}  rules=${built.ruleCount} [${spec.h} / ${spec.v}]  key=${spec.key}  options=${built.options
      .map((o) => o.tag)
      .join(", ")}  (local engine)`,
  );
}

/* ---- emit ---------------------------------------------------------------- */

const fmtEl = (el) => {
  const parts = [`shape: "${el.shape}"`];
  if (el.filled) parts.push("filled: true");
  if (el.color) parts.push(`color: "${el.color}"`);
  if (el.rotate) parts.push(`rotate: ${el.rotate}`);
  if (el.size !== undefined) parts.push(`size: ${el.size}`);
  if (el.x !== undefined) parts.push(`x: ${el.x}`, `y: ${el.y}`);
  return `{ ${parts.join(", ")} }`;
};
const fmtCell = (cell, indent) =>
  `{ shapes: [${cell.shapes.map(fmtEl).join(", ")}] }`.length + indent.length < 100
    ? `{ shapes: [${cell.shapes.map(fmtEl).join(", ")}] }`
    : `{\n${indent}  shapes: [\n${cell.shapes.map((e) => `${indent}    ${fmtEl(e)},`).join("\n")}\n${indent}  ],\n${indent}}`;

let out = "";
for (const r of Object.values(results)) {
  out += `\n/* ===== ${r.id} — ${r.ruleCount} rule(s): rows ${r.rules.h.join("+")}, columns ${r.rules.v.join("+")}; key ${r.answer} (${r.options.find((o) => o.tag === "correct").id}) ===== */\n`;
  out += `      cells: [\n`;
  for (const c of r.cells) out += `        ${fmtCell(c, "        ")},\n`;
  out += `      ],\n      options: [\n`;
  for (const o of r.options) {
    out += `        // ${o.tag}\n        { id: "${o.id}", fig: ${fmtCell(o.fig, "        ")} },\n`;
  }
  out += `      ],\n      answer: "${r.answer}",\n`;
}

writeFileSync(join(HERE, "figure-items.txt"), out);
writeFileSync(join(HERE, "figures.json"), JSON.stringify(results, null, 2));
console.log(report.join("\n"));
console.log(`\nwrote figure-items.txt and figures.json (${Object.keys(results).length} matrices)`);
