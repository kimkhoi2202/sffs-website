/**
 * The gated screen must not contain the review, in the DOM or anywhere else.
 *
 *   node --import ./scripts/ts-resolve-hook.mjs scripts/verify-gate-leak.mjs [baseUrl]
 *
 * This got much more important with the master-detail rebuild. The gate used to
 * be hiding a score and a list of item types; it is now hiding every question,
 * every option, every correct answer and every explanation. A blur is a picture
 * — the text under it is still in the document and still in the page source —
 * so the check is not "is it hidden" but "is it absent".
 *
 * Searched in three places, because they fail differently: the rendered text a
 * person sees, the full serialized DOM after hydration, and the HTML that came
 * off the server before any JavaScript ran.
 */
import { chromium } from "playwright-core";

const BASE = process.argv[2] ?? "http://localhost:3000";
const { getTestById } = await import("../lib/test/tests/index.ts");
const test = getTestById("grade-5");

const answers = {};
test.items.forEach((it, i) => {
  answers[it.id] = i % 3 === 0 ? it.answer : it.options.find((o) => o.id !== it.answer).id;
});
const scoreShouldBe = test.items.filter((it, i) => i % 3 === 0).length;

const b = await chromium.launch({
  executablePath: process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto(BASE, { waitUntil: "networkidle" });
await p.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
await p.reload({ waitUntil: "networkidle" });
await p.getByRole("button", { name: /I'm a kid/i }).click();
await p.getByRole("button", { name: "Grade 5" }).click();
await p.getByRole("button", { name: /start the test/i }).click();
await p.waitForTimeout(700);

for (let i = 0; i < test.items.length; i++) {
  const item = test.items[i];
  const want = answers[item.id];
  const idx = item.options.findIndex((o) => o.id === want);
  const opts = p.locator("main label");
  await opts.first().waitFor({ state: "visible", timeout: 15000 });
  await opts.nth(idx).click();
  const fin = p.getByRole("button", { name: /see my result/i });
  if (await fin.count()) { await fin.click(); break; }
  await p.getByRole("button", { name: /^(Next|Skip)$/ }).click();
  await p.waitForTimeout(120);
}
await p.waitForTimeout(2500);

const text = await p.evaluate(() => document.body.innerText);
const dom = await p.evaluate(() => document.documentElement.outerHTML);
const ssr = await (await fetch(BASE)).text();

let failures = 0;
const check = (name, pass, detail = "") => {
  if (!pass) failures++;
  console.log(`${pass ? "  ok  " : "  FAIL"} ${name}${detail ? `  — ${detail}` : ""}`);
};

console.log(`\nGATED VIEW LEAK CHECK  ${BASE}\n${"-".repeat(64)}`);
check("the gate is showing", text.includes("???"), "score masked");

/* Nothing that belongs to the review may be present. */
const stems = test.items.map((i) => i.stem).filter(Boolean);
const explanations = test.items.map((i) => i.explanation).filter(Boolean);
/*
  Word options only. A number-analogy option is "9" or "17", and a bare number
  matches something in any page of markup — a class name, a pixel value, a
  count. Those produced three confident false positives on the first run. They
  are also not a leak worth the name: "17" on its own tells a reader nothing
  about a question they cannot see.
*/
const optionTexts = test.items
  .flatMap((i) => i.options.map((o) => o.text))
  .filter((t) => typeof t === "string" && t.length >= 4 && !/^[\d\s.,-]+$/.test(t));
const whys = test.items.flatMap((i) => i.options.map((o) => o.why).filter(Boolean));

const scan = (label, haystack, { skipSingleWords = false } = {}) => {
  for (const [what, list] of [
    ["question stems", stems],
    ["explanations", explanations],
    ["option text", optionTexts],
    ["distractor notes", whys],
  ]) {
    const candidates =
      skipSingleWords && what === "option text" ? list.filter((v) => /\s/.test(v)) : list;
    const hit = candidates.find((v) => haystack.includes(v));
    check(`${label}: no ${what}`, !hit, hit ? `found "${String(hit).slice(0, 46)}…"` : `${candidates.length} checked`);
  }
};
/*
  ATTRIBUTE VALUES ARE STRIPPED BEFORE SCANNING THE MARKUP. The music toggle
  carries a `music-toggle` class, which matched the option text "music" and
  reported a leak twice. Class names, ids and aria labels are our own vocabulary
  colliding with the bank's, not content anybody can read.

  Script contents are deliberately NOT stripped: the RSC payload lives in a
  script tag and is exactly where a real leak would sit, readable by anyone who
  views source.
*/
const stripAttrs = (html) => html.replace(/=\s*"[^"]*"/g, "=''").replace(/=\s*'[^']*'/g, "=''");

scan("visible text", text);
scan("hydrated DOM", stripAttrs(dom), { skipSingleWords: true });
scan("server HTML", stripAttrs(ssr), { skipSingleWords: true });

/*
  WHY SINGLE-WORD OPTIONS ARE SKIPPED IN THE MARKUP SCANS, and what replaces
  them. Grade 5 has an option that is the single word "music", and the floating
  audio button contributes `/music/final-round-fanfare.mp3`, `aria-label="Play
  music"` and a `music-toggle.tsx` chunk path. No pattern separates a one-word
  option from our own UI vocabulary, so that check reports a leak that is not
  one — it did, twice, convincingly.

  The structural assertions below are stronger than the substring scan anyway:
  the review is not styled out or blurred, it is NOT RENDERED, so the components
  that would carry a question simply do not exist in the document. If that holds
  there is nothing for a single word to have leaked from.
*/
const structural = [
  ["no detail panel element", !/<article/.test(dom)],
  ["no option state labels", !/The right answer|You picked this|Your answer, and it is right/.test(dom)],
  ["no distractor heading", !/Why that one is tempting/.test(dom)],
  ["no explanation heading", !/How it works|Why that is right/.test(dom)],
  ["no prev\/next controls", !/Previous question|Next question/.test(dom)],
  ["no rendered question figures", !/data-surface="stem"/.test(dom)],
];
for (const [name, pass] of structural) check(`structure: ${name}`, pass);

/* And no earned value. */
check("no real score in the DOM", !new RegExp(`>\\s*${scoreShouldBe}\\s*<`).test(dom) || !dom.includes(`${scoreShouldBe}/15`), `score would be ${scoreShouldBe}/15`);
check("no verdict title in the DOM", !/Smart Fella<\/|Fart Smella<\//.test(dom));
check("no per-question outcome markers", !/Correct<|Wrong<|Skipped</.test(dom));

await p.screenshot({ path: "/tmp/gate-leak.png" });
await b.close();
console.log("-".repeat(64));
console.log(failures === 0 ? "PASS: the gate contains none of it.\n" : `FAIL: ${failures}\n`);
process.exit(failures === 0 ? 0 : 1);
