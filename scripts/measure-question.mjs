/**
 * How much of a question screen fits without scrolling, per item type.
 *
 *   node scripts/measure-question.mjs [width] [height]
 *
 * Walks a whole test and reports, for each question: the content height, the
 * height of the scroll region it has to live in, and whether the LAST OPTION is
 * reachable without scrolling. That last column is the one that matters — a
 * question whose fourth option is below the fold is one a hurried player will
 * answer from three choices.
 */
import { chromium } from "playwright-core";

const W = Number(process.argv[2] ?? 360);
const H = Number(process.argv[3] ?? 640);
/*
  `localhost`, not `127.0.0.1`, and the difference is not cosmetic: `next dev`
  binds the host by name, so the loopback address serves the page but its HMR
  socket never connects, React never finishes booting, and every click lands on
  markup with no handlers behind it. The failure looks exactly like a broken
  button — this script sat timing out on the grade picker, having clicked a
  fork that was never listening. Every verify:* script already defaults here.
*/
const BASE = "http://localhost:3000";
const EXECUTABLE =
  process.env.CHROME_PATH ??
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const browser = await chromium.launch({ executablePath: EXECUTABLE, headless: true });
const page = await browser.newPage({
  viewport: { width: W, height: H },
  isMobile: W < 768,
  hasTouch: W < 768,
});

await page.goto(BASE, { waitUntil: "networkidle", timeout: 180_000 });
await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
await page.evaluate(() => sessionStorage.clear());
await page.reload({ waitUntil: "networkidle" });
await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });

// Straight into a child test.
await page.getByRole("button", { name: /I'm a kid/i }).click();
await page.getByRole("button", { name: "Grade 5" }).click();
await page.getByRole("button", { name: /start the test/i }).click();
await page.waitForTimeout(700);

console.log(`\n=== question screens at ${W}x${H} ===\n`);
console.log("  #   type                     content   region   last option");
console.log("  --- ------------------------ --------- -------- -----------");

let tight = 0;
const total = 15;

for (let i = 0; i < total; i++) {
  await page.waitForTimeout(180);
  const m = await page.evaluate(() => {
    const region = document.querySelector("[data-lenis-prevent]");
    const inner = region?.firstElementChild;
    const options = [...document.querySelectorAll('label:has(input[type="radio"])')];
    const last = options[options.length - 1];
    const regionBox = region?.getBoundingClientRect();
    const lastBox = last?.getBoundingClientRect();
    // The legend is the prompt; the tier is no longer rendered, so identify the
    // item by its stimulus shape instead.
    const legend = document.querySelector("fieldset legend")?.textContent ?? "";
    return {
      content: inner?.scrollHeight ?? 0,
      region: region?.clientHeight ?? 0,
      lastBottom: lastBox && regionBox ? Math.round(lastBox.bottom - regionBox.top) : 0,
      regionBottom: regionBox ? Math.round(regionBox.height) : 0,
      legend: legend.slice(0, 24),
      count: options.length,
    };
  });

  const fits = m.lastBottom > 0 && m.lastBottom <= m.regionBottom;
  if (!fits) tight++;
  console.log(
    `  ${String(i + 1).padStart(2)}  ${m.legend.padEnd(24)} ${String(m.content).padStart(6)}px ${String(m.region).padStart(6)}px   ${
      fits ? "visible" : `+${m.lastBottom - m.regionBottom}px below`
    }`,
  );

  /*
    MEASURE FIRST, THEN ANSWER. The forward control will not move without a
    selection on the question in front of it, so getting to the next screen
    means picking something — but the measurement above has already been taken
    against the unanswered screen, which is the one a player meets. Selecting
    cannot perturb it either way: the option cards hold their border weight,
    padding and box size across both states on purpose, so only the fill
    colour changes. See the note on CARD_BASE in question/option-card.tsx.
  */
  if (i < total - 1) {
    await page.locator("main label").first().click();
    await page.getByRole("button", { name: /^Next$/ }).click();
  }
}

console.log(
  `\n  ${total - tight}/${total} questions show every option without scrolling.\n`,
);
await browser.close();
