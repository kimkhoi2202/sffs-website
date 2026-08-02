/**
 * Layer 4 of the dev-tools gating: prove the panel is not in the build.
 *
 *   npm run verify:no-devtools     (and automatically after every `npm run build`)
 *
 * Layers 1 to 3 (see components/test/dev/dev-tools-gate.tsx) are arguments
 * about how the bundler behaves. This one is a measurement: it walks the entire
 * production output and fails the build if a sentinel string that exists ONLY
 * inside the dev-tools module appears anywhere in it — minified chunk, server
 * bundle, source map, RSC payload, anything.
 *
 * It is wired as a `postbuild` script rather than documented as a step, so it
 * runs on a laptop, in CI and on Vercel without anyone choosing to run it. A
 * check you can forget is not a guarantee.
 *
 * If this ever fails: something reintroduced a path from shipped code into
 * components/test/dev/. Find the import, route it back through DevToolsGate,
 * and do not "fix" it by changing the sentinel.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BUILD_DIR = join(ROOT, ".next");

/**
 * Assembled at runtime from pieces so that THIS FILE does not itself contain
 * the literal. The script is not part of the build output, but keeping the
 * literal out of it means a careless `grep -r` across the repo returns exactly
 * one hit: the module that must never ship.
 */
const SENTINEL = ["SFFS", "DEVTOOLS", "MUST", "NOT", "SHIP"].join("_");

/**
 * Build artefacts that are development-only by definition.
 *
 * `dev` matters and was a real false positive: Next 16 writes the DEV server's
 * chunks and source maps to `.next/dev/`, and those legitimately contain the
 * dev tools. If a dev server has ever run in this working copy, that directory
 * is sitting inside `.next` next to the production output. Scanning it fails
 * every build on a developer's laptop while passing in CI, which is the worst
 * possible shape for a check: noisy where it is watched, silent where it is
 * not. Production output is `.next/server` and `.next/static`.
 */
const SKIP_DIRS = new Set(["cache", "trace", "dev"]);

/**
 * Files that prove we actually looked at the production bundle. Without this,
 * a future change to Next's output layout could make the walk find nothing and
 * the check would pass by scanning an empty set.
 */
const PROD_MARKERS = [/^\.next\/server\//, /^\.next\/static\//];
/** Text-ish output worth scanning. Fonts, images and the like cannot match. */
const SCAN_EXT = /\.(js|mjs|cjs|json|map|txt|html|rsc|body|meta)$/i;

function* walk(dir) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      yield* walk(full);
    } else if (SCAN_EXT.test(entry.name)) {
      yield full;
    }
  }
}

try {
  statSync(BUILD_DIR);
} catch {
  console.error(
    "verify-no-devtools: no .next directory. Run `npm run build` first.",
  );
  process.exit(1);
}

const hits = [];
let scanned = 0;
let prodFiles = 0;

for (const file of walk(BUILD_DIR)) {
  scanned++;
  const rel = relative(ROOT, file);
  if (PROD_MARKERS.some((re) => re.test(rel))) prodFiles++;
  let contents;
  try {
    contents = readFileSync(file, "utf8");
  } catch {
    continue; // unreadable or genuinely binary
  }
  if (contents.includes(SENTINEL)) hits.push(rel);
}

if (hits.length > 0) {
  console.error(
    `\nverify-no-devtools: FAILED\n\n` +
      `The test dev tools reached the production build. They must never ship.\n` +
      `Found the dev-tools sentinel in ${hits.length} file(s):\n\n` +
      hits.map((h) => `  ${h}`).join("\n") +
      `\n\nSomething now imports components/test/dev/ from code that survives a\n` +
      `production build. Route it back through <DevToolsGate />, which drops the\n` +
      `import inside a branch the bundler deletes. See the four layers documented\n` +
      `in components/test/dev/dev-tools-gate.tsx.\n`,
  );
  process.exit(1);
}

if (prodFiles === 0) {
  console.error(
    "\nverify-no-devtools: FAILED\n\n" +
      "Scanned .next but found nothing under server/ or static/, so there was " +
      "no production output to check. Run `npm run build` rather than relying " +
      "on a stale .next, and if Next's output layout has changed, update " +
      "PROD_MARKERS. A check that silently inspects nothing is worse than no " +
      "check.\n",
  );
  process.exit(1);
}

console.log(
  `verify-no-devtools: OK. Scanned ${scanned} files (${prodFiles} in the ` +
    `production bundle), dev tools absent.`,
);
