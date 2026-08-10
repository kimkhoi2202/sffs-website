/**
 * Renders the figural item types a test-taker can actually meet and checks
 * that the A/B/C/D badge is gone, the spoken name still distinguishes four
 * options, and selection is legible at the smallest scale the fitter will use.
 *
 *   node scripts/verify-figural-options.mjs [baseUrl]
 */
import { chromium } from "playwright-core";

const BASE = process.argv[2] ?? "http://localhost:3000";
const EXE =
  process.env.CHROME_PATH ??
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const rows = [];
const check = (name, pass, detail = "") => {
  rows.push({ name, pass, detail });
  console.log(`${pass ? "  ok  " : "  FAIL"} ${name}${detail ? `  ${detail}` : ""}`);
};

const browser = await chromium.launch({ executablePath: EXE });

/** Walk the adult test to a 1-based question number. */
async function goToQuestion(page, n) {
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
  await page.getByRole("button", { name: /I'm an adult/i }).click();
  await page.getByRole("button", { name: /^Me/i }).click();
  await page.getByRole("button", { name: /start the test/i }).click();
  await page.waitForTimeout(700);
  for (let i = 1; i < n; i++) {
    await page.getByRole("button", { name: /^(Next|Skip)$/ }).click();
    await page.waitForTimeout(150);
  }
  await page.waitForTimeout(450);
}

async function inspect(page, tag) {
  return page.evaluate(() => {
    const opts = [...document.querySelectorAll("main label")];
    const badges = opts.map(
      (l) => !!l.querySelector("span[aria-hidden='true']:not(:empty)"),
    );
    const names = opts.map((l) => l.querySelector("input")?.getAttribute("aria-label") ?? "");
    const svgs = opts.map((l) => !!l.querySelector("svg"));
    const box = opts[0]?.getBoundingClientRect();
    const scaled = document.querySelector("[style*='scale']");
    const m = scaled?.getAttribute("style")?.match(/scale\(([\d.]+)\)/);
    return {
      count: opts.length,
      anyBadge: badges.some(Boolean),
      names,
      allDrawn: svgs.every(Boolean),
      cardPx: box ? Math.round(box.width) : 0,
      scale: m ? Number(m[1]) : 1,
    };
  }, tag);
}

for (const [w, h] of [
  [360, 640],
  [1440, 900],
]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  console.log(`\n=== ${w}x${h} ===`);

  for (const [label, qn] of [
    ["figural odd-one-out (a06)", 6],
    ["figure matrix (a09)", 9],
  ]) {
    await goToQuestion(page, qn);
    const info = await inspect(page);
    // Odd-one-out presents five and asks which does not belong; a matrix
    // presents four completions. Both are correct, so assert on "several,
    // all drawn" rather than on a number.
    check(
      `${label}: options are all drawn`,
      info.count >= 4 && info.allDrawn,
      `${info.count} options`,
    );
    check(`${label}: no letter badge`, !info.anyBadge);
    const distinct = new Set(info.names).size;
    check(
      `${label}: every option has a distinct spoken name`,
      distinct === info.count &&
        info.names.every((n, k) =>
          new RegExp(`^option ${k + 1} of ${info.count}: .+`, "i").test(n),
        ),
      info.names[1]?.slice(0, 52) ?? "",
    );

    await page.screenshot({ path: `/tmp/fig-${w}-${qn}-unselected.png` });

    // Select the second option and confirm the blue fill is the visible signal.
    await page.locator("main label").nth(1).click();
    await page.waitForTimeout(260);
    const contrast = await page.evaluate(() => {
      const opts = [...document.querySelectorAll("main label")];
      const bg = (el) => getComputedStyle(el).backgroundColor;
      return { picked: bg(opts[1]), other: bg(opts[0]) };
    });
    check(
      `${label}: selection changes the fill`,
      contrast.picked !== contrast.other,
      `${contrast.picked} vs ${contrast.other}`,
    );
    await page.screenshot({ path: `/tmp/fig-${w}-${qn}-selected.png` });
    console.log(`       card ${info.cardPx}px at scale ${info.scale}`);
  }
  await page.close();
}

await browser.close();

const bad = rows.filter((r) => !r.pass);
console.log("-".repeat(64));
console.log(bad.length === 0 ? `PASS: ${rows.length}/${rows.length} checks.\n` : `FAIL: ${bad.length} of ${rows.length}.\n`);
process.exit(bad.length === 0 ? 0 : 1);
