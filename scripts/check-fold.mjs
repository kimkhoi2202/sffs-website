/**
 * Assert that no step of the v3 flow shows the footer or any blue in the first
 * viewport, at every width we care about.
 *
 *   node scripts/check-fold.mjs
 *
 * Two independent checks per step, because either alone can be fooled:
 *
 *   1. NO FOOTER ELEMENT. `document.querySelector("footer")` must be absent
 *      from the flow entirely. Catches the case where the footer's contents
 *      were removed but its container still reserves height.
 *   2. NO BLUE PIXELS in the unscrolled viewport. Samples the rendered
 *      screenshot on a grid and fails on anything close to the footer blue
 *      (#839aff) or the wave ink beneath it. Catches anything the DOM check
 *      cannot see: the root's overscroll canvas showing through, a stray
 *      background, a spacer.
 *
 * The pixel check is the one that matters, because it tests what the person
 * actually sees rather than what the markup claims.
 */
import { chromium } from "playwright-core";
import { inflateSync } from "node:zlib";
import { mkdirSync, readFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";

const BASE = "http://127.0.0.1:3000";
const EXECUTABLE =
  process.env.CHROME_PATH ??
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const TMP = join(process.cwd(), ".shots", "_fold");
mkdirSync(TMP, { recursive: true });

const VIEWPORTS = [
  [360, 640],
  [390, 844],
  [768, 1024],
  [1440, 900],
];

/** Footer blue and the ink of its wave. */
const BLUE = [0x83, 0x9a, 0xff];

/** Decode a PNG far enough to sample pixels. No image library available. */
function decodePng(buf) {
  // Minimal inflate, then unfilter. PNG from Chromium is 8-bit RGBA.
  let pos = 8; // skip signature
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idat = [];

  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString("ascii", pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === "IDAT") {
      idat.push(data);
    } else if (type === "IEND") break;
    pos += 12 + len;
  }
  if (bitDepth !== 8) throw new Error(`unexpected bit depth ${bitDepth}`);
  const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : 0;
  if (!channels) throw new Error(`unexpected colour type ${colorType}`);

  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const out = Buffer.alloc(height * stride);

  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const prev = y > 0 ? out.subarray((y - 1) * stride, y * stride) : null;
    const cur = out.subarray(y * stride, (y + 1) * stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? cur[x - channels] : 0;
      const b = prev ? prev[x] : 0;
      const c = prev && x >= channels ? prev[x - channels] : 0;
      let v = line[x];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      cur[x] = v & 0xff;
    }
  }
  return { width, height, channels, data: out };
}

/** Any pixel within `tol` of the footer blue counts as a hit. */
function countBlue(png, tol = 26) {
  const { width, height, channels, data } = png;
  let hits = 0;
  let sample;
  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const i = y * width * channels + x * channels;
      if (
        Math.abs(data[i] - BLUE[0]) < tol &&
        Math.abs(data[i + 1] - BLUE[1]) < tol &&
        Math.abs(data[i + 2] - BLUE[2]) < tol
      ) {
        hits++;
        sample ??= { x, y };
      }
    }
  }
  return { hits, sample };
}

const browser = await chromium.launch({ executablePath: EXECUTABLE, headless: true });
let failures = 0;
let checks = 0;

for (const [W, H] of VIEWPORTS) {
  const page = await browser.newPage({
    viewport: { width: W, height: H },
    deviceScaleFactor: 1,
    isMobile: W < 768,
    hasTouch: W < 768,
  });
  const hide = `nextjs-portal{display:none!important}`;

  async function step(name, prepare) {
    checks++;
    await prepare(page);
    await page.waitForTimeout(500);

    const hasFooter = await page.evaluate(() => !!document.querySelector("footer"));
    const file = join(TMP, `${W}-${name}.png`);
    await page.screenshot({ path: file }); // viewport only, unscrolled
    const { hits, sample } = countBlue(decodePng(readFileSync(file)));
    unlinkSync(file);

    const ok = !hasFooter && hits === 0;
    if (!ok) failures++;
    const detail = [
      hasFooter ? "FOOTER ELEMENT PRESENT" : null,
      hits > 0 ? `${hits} blue px (first at ${sample.x},${sample.y})` : null,
    ]
      .filter(Boolean)
      .join(", ");
    console.log(`  ${ok ? "ok  " : "FAIL"} ${W}x${H} ${name}${detail ? " — " + detail : ""}`);
  }

  const goHome = async (p) => {
    await p.goto(BASE, { waitUntil: "networkidle", timeout: 180_000 });
    await p.addStyleTag({ content: hide });
    await p.evaluate(() => sessionStorage.clear());
    await p.reload({ waitUntil: "networkidle" });
    await p.addStyleTag({ content: hide });
  };

  console.log(`\n=== ${W}x${H} ===`);

  await step("1-fork", goHome);
  await step("2-parent-intent", async (p) => {
    await p.getByRole("button", { name: /I'm an adult/i }).click();
  });
  await step("3-grade-picker", async (p) => {
    await p.getByRole("button", { name: /^My kid/i }).click();
  });
  await step("4-intro-child", async (p) => {
    await p.getByRole("button", { name: "Grade 8" }).click();
  });
  await step("5-runner", async (p) => {
    await p.getByRole("button", { name: /start the test/i }).click();
    await p.waitForTimeout(600);
  });
  await step("6-runner-scrolled", async (p) => {
    // The timer must still be visible after scrolling inside a question.
    await p.evaluate(() => {
      const el = document.querySelector("[data-lenis-prevent]");
      if (el) el.scrollTop = el.scrollHeight;
    });
  });
  await step("7-results-gate", async (p) => {
    await p.getByRole("button", { name: "DEV", exact: true }).click();
    await p.getByRole("button", { name: "45%", exact: true }).click({ force: true });
    await p.waitForTimeout(1200);
    await p.getByRole("button", { name: "Close dev tools" }).click({ force: true });
  });
  await step("8-results-sent", async (p) => {
    await p.locator('input[type="email"]').fill(`delivered+${Date.now()}@resend.dev`);
    await p
      .getByRole("button", { name: /send my results|email me my results/i })
      .click();
    await p.waitForTimeout(2600);
  });
  await step("9-results-page", async (p) => {
    const token = await p.evaluate(() => {
      const raw = sessionStorage.getItem("sffs_test_v2");
      return raw ? JSON.parse(raw).token : null;
    });
    await p.goto(`${BASE}/results/${token}`, { waitUntil: "networkidle", timeout: 120_000 });
    await p.addStyleTag({ content: hide });
  });
  await step("10-intro-adult", async (p) => {
    await p.goto(BASE, { waitUntil: "networkidle", timeout: 120_000 });
    await p.addStyleTag({ content: hide });
    await p.evaluate(() => sessionStorage.clear());
    await p.reload({ waitUntil: "networkidle" });
    await p.addStyleTag({ content: hide });
    await p.getByRole("button", { name: /I'm an adult/i }).click();
    await p.getByRole("button", { name: /cognitive aptitude test/i }).click();
  });

  /* The timer has to survive a scroll inside a question — it is the thing
     creating the pressure, so it going off screen would defeat the runner. */
  await page.getByRole("button", { name: /start the test/i }).click();
  await page.waitForTimeout(600);
  await page.evaluate(() => {
    const el = document.querySelector("[data-lenis-prevent]");
    if (el) el.scrollTop = el.scrollHeight;
  });
  const timerVisible = await page.evaluate(() => {
    const clock = [...document.querySelectorAll("div")].find((d) =>
      /^\d{1,2}:\d{2}$/.test(d.textContent?.trim() ?? ""),
    );
    if (!clock) return false;
    const r = clock.getBoundingClientRect();
    return r.top >= 0 && r.bottom <= window.innerHeight && r.width > 0;
  });
  checks++;
  if (!timerVisible) failures++;
  console.log(`  ${timerVisible ? "ok  " : "FAIL"} ${W}x${H} timer-visible-after-scroll`);

  await page.close();
}

await browser.close();
console.log(
  `\n${checks - failures}/${checks} passed${failures ? ` — ${failures} FAILURE(S)` : ""}\n`,
);
process.exit(failures ? 1 : 0);
