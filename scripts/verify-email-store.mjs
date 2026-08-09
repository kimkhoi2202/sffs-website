/**
 * Prove the email store fails toward NOT writing to production, and that a
 * verification run's signup admits what it is.
 *
 *   npm run verify:email-store
 *
 * This exists because "it fails safe" is an argument until something checks it,
 * and the cost of the argument being wrong is real signups mixed with junk in a
 * live table. The rule under test is one sentence: writing to production
 * requires a positive signal, and everything else is local.
 *
 * The mode logic is duplicated here ON PURPOSE, as an independent statement of
 * the rule. Importing `emailStoreMode` would make this a test that the function
 * equals itself; writing the truth table out means the two have to agree.
 *
 * The second half covers the OTHER way junk reaches that table: a run that
 * tagged itself and was written down as real anyway. See `signupMeta`.
 */
import { readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import { dirname, join, resolve as resolvePath } from "node:path";
import { fileURLToPath } from "node:url";

import { emailStoreMode } from "../lib/email-store-mode.ts";

const ROOT = resolvePath(dirname(fileURLToPath(import.meta.url)), "..");

// `email-store.ts` is server-only, which plain node refuses to import. The
// module does nothing at load time, so a stub is enough to reach the function.
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === "server-only") {
      return { url: "data:text/javascript,export{}", shortCircuit: true };
    }
    return next(specifier, context);
  },
});

/** [EMAIL_STORE, VERCEL_ENV, expected mode, why this case matters] */
const CASES = [
  [undefined, undefined, "local", "a plain laptop"],
  ["", undefined, "local", "an empty value in .env.local"],
  ["   ", undefined, "local", "whitespace"],
  ["garbage", undefined, "local", "a typo"],
  ["Local", undefined, "local", "case does not matter"],
  ["PROXY", undefined, "proxy", "an explicit opt-in, case-insensitive"],
  ["proxy", undefined, "proxy", "the explicit opt-in a developer types once"],
  [undefined, "development", "local", "Vercel dev"],
  [undefined, "preview", "local", "a preview deployment is not production"],
  [undefined, "production", "proxy", "the real deployment"],
  ["local", "production", "local", "overriding INTO the safe direction always works"],
  ["garbage", "preview", "local", "a typo on a preview stays local"],
  ["garbage", "production", "proxy", "a typo on production still writes, as it must"],
];

let failures = 0;

for (const [store, vercel, expected, why] of CASES) {
  if (store === undefined) delete process.env.EMAIL_STORE;
  else process.env.EMAIL_STORE = store;
  if (vercel === undefined) delete process.env.VERCEL_ENV;
  else process.env.VERCEL_ENV = vercel;

  const actual = emailStoreMode();
  const ok = actual === expected;
  if (!ok) failures++;
  console.log(
    `${ok ? "ok  " : "FAIL"}  EMAIL_STORE=${JSON.stringify(store)} VERCEL_ENV=${JSON.stringify(vercel)} -> ${actual}` +
      (ok ? `  (${why})` : `  EXPECTED ${expected}  (${why})`),
  );
}

/*
 * The property that actually matters, stated once rather than inferred from the
 * table: nothing writes to production unless somebody said so.
 */
const positiveSignals = CASES.filter(([s, v]) => s?.trim().toLowerCase() === "proxy" || v === "production");
const writesToProd = CASES.filter(([, , expected]) => expected === "proxy");
if (writesToProd.some((c) => !positiveSignals.includes(c))) {
  console.log("FAIL  a case writes to production with no positive signal");
  failures++;
}

/* ==========================================================================
 * The synthetic marker, which is the other way this table gets polluted
 *
 * The header was honoured on `test_results` and dropped here, so a tagged run
 * still wrote an untagged signup. Two things have to hold, and the second is
 * the one that is easy to get wrong.
 * ========================================================================== */

const { signupMeta } = await import(`${ROOT}/lib/email-store.ts`);

function check(ok, label, detail = "") {
  if (!ok) failures++;
  console.log(`${ok ? "ok  " : "FAIL"}  ${label}${ok || !detail ? "" : `  — ${detail}`}`);
}

const headers = (extra = {}) =>
  new Headers({ referer: "https://example.test/", "user-agent": "probe/1", ...extra });

{
  const plain = signupMeta(headers());
  const tagged = signupMeta(headers({ "x-sffs-synthetic": "1" }));

  check(tagged.synthetic === true, "a request that admits to being a verification run is marked");
  check(
    plain.referrer === "https://example.test/" && plain.userAgent === "probe/1",
    "the attribution a real signup carries is unchanged",
  );

  /*
    ABSENT, NOT FALSE — the load-bearing one.

    The export filters with `meta->>'synthetic' IS NULL`. A row carrying
    `synthetic: false` is not null, so writing the key on every row would
    silently exclude EVERY signup from the warehouse and the dashboard's
    address count would read zero with nothing erroring.
  */
  check(
    !("synthetic" in plain),
    "an ordinary signup carries no synthetic key at all, so `IS NULL` still selects it",
    JSON.stringify(plain),
  );

  // A header that is present but not "1" is not an admission.
  for (const value of ["0", "", "true", "yes", " "]) {
    const meta = signupMeta(headers({ "x-sffs-synthetic": value }));
    check(
      !("synthetic" in meta),
      `x-sffs-synthetic=${JSON.stringify(value)} is not an admission`,
      JSON.stringify(meta),
    );
  }
}

/*
 * Every route that writes a signup goes through the builder.
 *
 * Asserted against the source rather than the behaviour, because the failure
 * being prevented is a FUTURE call site assembling its own meta and leaving the
 * marker out — which is exactly how the two existing ones drifted apart. A test
 * that only exercises today's routes could not see that coming.
 */
{
  const writers = ["app/api/access-signup/route.ts", "app/api/test-results/send/route.ts"];
  for (const rel of writers) {
    const src = readFileSync(join(ROOT, rel), "utf8");
    check(src.includes("signupMeta("), `${rel} builds its signup meta with signupMeta()`);
    check(
      !/meta:\s*\{/.test(src),
      `${rel} does not hand-assemble a signup meta object alongside it`,
    );
  }
}

console.log(
  failures === 0
    ? `\nverify-email-store: OK. ${CASES.length} mode cases plus the synthetic marker; production writes only on an explicit opt-in, and a tagged run cannot be written down as real.`
    : `\nverify-email-store: ${failures} failure(s).`,
);
if (failures > 0) process.exit(1);
