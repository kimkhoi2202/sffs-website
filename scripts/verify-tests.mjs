/**
 * Content check for the thirteen test data files.
 *
 *   npm run verify:tests
 *
 * Runs lib/test/validate.ts over every test. Errors fail the process; warnings
 * (missing explanations, remaining placeholders) are printed and do not, so
 * this is useful both now, while everything is scaffolding, and later, when it
 * should be clean.
 *
 * The check that earns its keep is paper folding: it re-derives the unfolded
 * hole pattern from the fold geometry and compares it to the keyed option, so
 * an authoring slip is caught here rather than being silently marked wrong on a
 * real child's results screen.
 *
 * Runs on plain `node` via scripts/ts-resolve-hook.mjs — no test runner, no
 * extra dependency.
 */
import { ALL_TESTS } from "../lib/test/tests/index.ts";
import { validateAll } from "../lib/test/validate.ts";

const issues = validateAll(ALL_TESTS);
const errors = issues.filter((i) => i.severity === "error");
const warnings = issues.filter((i) => i.severity === "warning");

for (const i of issues) {
  const where = i.itemId ? `${i.testId}/${i.itemId}` : i.testId;
  const tag = i.severity === "error" ? "ERROR " : "warn  ";
  console.log(`${tag} ${where}: ${i.message}`);
}

const itemCount = ALL_TESTS.reduce((n, t) => n + t.items.length, 0);
const placeholders = ALL_TESTS.reduce(
  (n, t) => n + t.items.filter((i) => i.placeholder).length,
  0,
);

console.log(
  `\n${ALL_TESTS.length} tests, ${itemCount} items ` +
    `(${placeholders} still placeholders), ` +
    `${errors.length} error(s), ${warnings.length} warning(s).`,
);

if (errors.length > 0) process.exit(1);
