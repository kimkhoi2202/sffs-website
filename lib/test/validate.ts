/**
 * Content validation for test data files.
 *
 * The tests are hand-authored data, and the failure mode of hand-authored data
 * is a wrong answer key shipped to a nine-year-old. These checks catch the
 * mistakes that are mechanically catchable:
 *
 *   - an `answer` that names an option that does not exist
 *   - duplicate item ids or duplicate option ids
 *   - a series with no "?" blank, or more than one
 *   - a figure layout with the wrong number of stimulus cells
 *   - a paper-folding item whose keyed option is not what the fold geometry
 *     actually produces (re-derived with `unfold`, not trusted)
 *   - a punch authored outside the folded packet
 *
 * Where this runs: `npm run verify:tests` checks every test file, and the
 * dev-only content panel surfaces the same output in the browser. It is
 * deliberately NOT wired into the request path — validating on every page load
 * would cost every visitor for a problem only an author can create.
 */
import { inActiveRegion, sameHoles, unfold } from "./fold";
import type { Test, TestItem } from "./types";

export interface ValidationIssue {
  testId: string;
  itemId: string | null;
  severity: "error" | "warning";
  message: string;
}

function validateItem(testId: string, item: TestItem): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const err = (message: string) =>
    issues.push({ testId, itemId: item.id, severity: "error", message });
  const warn = (message: string) =>
    issues.push({ testId, itemId: item.id, severity: "warning", message });

  const ids = item.options.map((o) => o.id);
  if (new Set(ids).size !== ids.length) {
    err(`duplicate option ids: ${ids.join(", ")}`);
  }
  if (item.options.length < 2) {
    err(`only ${item.options.length} option(s)`);
  }
  if (!ids.includes(item.answer)) {
    err(`answer "${item.answer}" is not one of the options (${ids.join(", ")})`);
  }
  if (!item.prompt.trim()) err("empty prompt");
  if (!item.placeholder && !item.explanation) {
    warn("no explanation — real content should always have one");
  }

  switch (item.kind) {
    case "series": {
      const blanks = item.seq.filter((s) => s === "?").length;
      if (blanks !== 1) {
        err(`series must have exactly one "?" blank, found ${blanks}`);
      }
      if (item.seq.length < 3) warn(`only ${item.seq.length} terms in the series`);
      break;
    }

    case "figure": {
      // matrix: [TL, TR, BL] and the player supplies BR.
      // analogy: A : B :: C : ?
      // classification: three that share a property, plus the one that joins.
      // odd-one-out: no stimulus at all — the options ARE the stimulus.
      const expected = item.layout === "odd-one-out" ? 0 : 3;
      if (item.cells.length !== expected) {
        err(
          `figure layout "${item.layout}" expects ${expected} stimulus cells, found ${item.cells.length}`,
        );
      }

      // A cell is a SET of shapes. An empty set renders as a blank tile, which
      // silently turns a matrix into an unanswerable question, so it is an
      // error rather than a warning.
      const cells = [
        ...item.cells.map((c, i) => [`cell ${i}`, c] as const),
        ...item.options.map((o) => [`option ${o.id}`, o.fig] as const),
      ];
      for (const [where, cell] of cells) {
        if (!cell.shapes || cell.shapes.length === 0) {
          err(`${where} has no shapes`);
          continue;
        }
        if (cell.shapes.length > 6) {
          warn(`${where} has ${cell.shapes.length} shapes and will be cramped at 360px`);
        }
        for (const [i, el] of cell.shapes.entries()) {
          const hasX = el.x !== undefined;
          const hasY = el.y !== undefined;
          if (hasX !== hasY) {
            err(`${where} shape ${i} sets only one of x/y — set both or neither`);
          }
          if (typeof el.size === "number" && (el.size <= 0 || el.size > 1)) {
            err(`${where} shape ${i} has size ${el.size}; a numeric size is a 0..1 fraction`);
          }
        }
      }
      break;
    }

    case "table": {
      if (item.data.type === "table") {
        const width = item.data.columns.length;
        if (width === 0) err("table has no columns");
        if (width > 4) warn(`${width} columns will not fit a 360px screen`);
        for (const [i, row] of item.data.rows.entries()) {
          if (row.length !== width) {
            err(`row ${i} has ${row.length} cells but there are ${width} columns`);
          }
        }
      } else if (item.data.bars.length === 0) {
        err("bar chart has no bars");
      } else if (item.data.bars.length > 5) {
        warn(`${item.data.bars.length} bars will not fit a 360px screen`);
      }
      break;
    }

    case "polygon":
    case "dot": {
      if (item.seq.length < 2) warn(`only ${item.seq.length} terms in the sequence`);
      // Neither kind is a standalone item type in the instruments these tests
      // model; there, that transformation lives inside a figural item. See the
      // "deprioritised" note in ./types.ts.
      warn(`"${item.kind}" is a deprioritised kind — prefer a figure item`);
      break;
    }

    case "fold": {
      const grid = item.grid ?? 4;
      if (grid % 2 !== 0) err(`fold grid must be even, got ${grid}`);

      const axes = new Set(item.folds.map((d) => (d === "left" || d === "right" ? "V" : "H")));
      if (item.folds.length > axes.size) {
        err("at most one vertical and one horizontal fold");
      }
      if (item.folds.length === 0) err("no folds");
      if (item.punches.length === 0) err("no punches");

      const inPacket = inActiveRegion(item.folds, grid);
      for (const p of item.punches) {
        if (p.r < 0 || p.r >= grid || p.c < 0 || p.c >= grid) {
          err(`punch {r:${p.r},c:${p.c}} is off the ${grid}x${grid} grid`);
        } else if (!inPacket(p)) {
          err(
            `punch {r:${p.r},c:${p.c}} is outside the folded packet, so it would not go through the paper`,
          );
        }
      }

      // The real check: re-derive the answer from the geometry rather than
      // trusting the author's option.
      const derived = unfold(item.folds, item.punches, grid);
      const keyed = item.options.find((o) => o.id === item.answer);
      if (keyed && !sameHoles(keyed.holes, derived)) {
        err(
          `keyed option ${item.answer} does not match the unfolded geometry. ` +
            `folds [${item.folds.join(", ")}] with punches ` +
            `[${item.punches.map((p) => `${p.r},${p.c}`).join(" ")}] unfold to ` +
            `[${derived.map((p) => `${p.r},${p.c}`).join(" ")}]`,
        );
      }
      for (const opt of item.options) {
        if (opt.id === item.answer) continue;
        if (sameHoles(opt.holes, derived)) {
          err(`distractor ${opt.id} is identical to the correct answer`);
        }
      }
      break;
    }

    case "text":
      break;
  }

  return issues;
}

export function validateTest(test: Test): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (test.items.length === 0) {
    issues.push({
      testId: test.id,
      itemId: null,
      severity: "error",
      message: "test has no items",
    });
  }

  const ids = test.items.map((i) => i.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dupes.length > 0) {
    issues.push({
      testId: test.id,
      itemId: null,
      severity: "error",
      message: `duplicate item ids: ${[...new Set(dupes)].join(", ")}`,
    });
  }

  const placeholders = test.items.filter((i) => i.placeholder).length;
  if (placeholders > 0) {
    issues.push({
      testId: test.id,
      itemId: null,
      severity: "warning",
      message: `${placeholders}/${test.items.length} items are still placeholders`,
    });
  }

  for (const item of test.items) issues.push(...validateItem(test.id, item));
  return issues;
}

export function validateAll(tests: Test[]): ValidationIssue[] {
  return tests.flatMap(validateTest);
}
