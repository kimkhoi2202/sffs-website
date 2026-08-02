/**
 * Prove the email store fails toward NOT writing to production.
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
 */
import { emailStoreMode } from "../lib/email-store-mode.ts";

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

console.log(
  failures === 0
    ? `\nverify-email-store: OK. ${CASES.length} cases, production writes only on an explicit opt-in or a production deployment.`
    : `\nverify-email-store: ${failures} failure(s).`,
);
if (failures > 0) process.exit(1);
