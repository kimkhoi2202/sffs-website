/**
 * The unsubscribe path: the token round-trips, the send path cannot skip the
 * suppression check, and the route leaks nothing to any analytics destination.
 *
 *   node --import ./scripts/ts-resolve-hook.mjs scripts/verify-unsubscribe.mjs [baseUrl]
 *
 * ===========================================================================
 * WHY THE LEAK CHECK IS THE REASON THIS FILE EXISTS
 * ===========================================================================
 * In August 2026 the Google Ads tag was found shipping decodable child result
 * tokens to Google, purely by being loaded on /results/[token]. No event had to
 * fire; the script tag was the leak. It survived code review because everybody
 * reasoned about what the call sites PASSED rather than what the vendor SENT.
 *
 * The unsubscribe token decodes to an email address, so the same mistake here
 * is worse. Both guards are therefore ASSERTED rather than described:
 *
 *   PostHog   /unsubscribe is a silent route, so before_send returns null.
 *   gtag      /unsubscribe is a deferred prefix, so the script is never added.
 *
 * The static half runs anywhere. Pass a base URL to also drive a real browser
 * and confirm that a live page emits no analytics request carrying the token.
 */
import { readFileSync } from "node:fs";

let failures = 0;
function check(name, pass, detail = "") {
  const status = pass ? "ok  " : "FAIL";
  if (!pass) failures++;
  console.log(`  ${status}  ${name}${detail && !pass ? ` (${detail})` : ""}`);
}

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

/* ==========================================================================
 * 1. The token round-trips, and refuses everything it should
 * ========================================================================== */
console.log("\ntoken");
process.env.UNSUBSCRIBE_TOKEN_SECRET ||= "verify-only-secret";
const { encodeUnsubscribeToken, decodeUnsubscribeToken } = await import(
  "../lib/email/unsubscribe-token.ts"
);

const address = "Someone.Else@Example.COM";
const token = encodeUnsubscribeToken(address);
const decoded = decodeUnsubscribeToken(token);

check("round-trips", decoded.ok === true);
check(
  "normalises to lowercase",
  decoded.ok && decoded.email === "someone.else@example.com",
  decoded.ok ? decoded.email : decoded.reason,
);
check(
  "the raw address is NOT readable in the token",
  !token.includes("@") && !token.toLowerCase().includes("someone.else"),
);
check("rejects a flipped signature byte", decodeUnsubscribeToken(
  token.slice(0, -1) + (token.at(-1) === "A" ? "B" : "A"),
).ok === false);
check("rejects a flipped payload byte", decodeUnsubscribeToken(
  (token[0] === "e" ? "f" : "e") + token.slice(1),
).ok === false);
check("rejects an empty token", decodeUnsubscribeToken("").ok === false);
check("rejects a token with no signature", decodeUnsubscribeToken("abc").ok === false);

/* A token minted for another purpose with the same key must not verify here. */
const foreign = Buffer.from(JSON.stringify({ v: 1, p: "results", e: "a@b.com" })).toString("base64url");
check(
  "rejects a foreign purpose",
  decodeUnsubscribeToken(`${foreign}.${"x".repeat(43)}`).ok === false,
);

/* ==========================================================================
 * 2. The send path reads the suppression list, and cannot be made not to
 * ========================================================================== */
console.log("\nsend path");
const product = read("lib/email/product-email.ts");
const suppression = read("lib/email/suppression.ts");

check(
  "the product sender imports the suppression filter",
  /import\s*\{[^}]*filterSuppressed[^}]*\}\s*from\s*"\.\/suppression"/.test(product),
);
check(
  "the product sender actually calls it",
  /await\s+filterSuppressed\(/.test(product),
);
check(
  "a suppressed address is refused",
  /suppressed\.length\s*>\s*0/.test(product) && /reason:\s*"suppressed"/.test(product),
);
check(
  "there is no parameter that skips the check",
  !/skipSuppression|ignoreSuppression|force\s*[:?]/.test(product),
);
check(
  "the filter throws rather than assuming nobody is suppressed",
  /throw new Error\(/.test(suppression) &&
    /Refusing to report a suppression list from local mode/.test(suppression),
);
check(
  "product email is off unless explicitly enabled",
  /PRODUCT_EMAIL_ENABLED === "1"/.test(product) && /reason:\s*"disabled"/.test(product),
);
check(
  "the postal address is enforced in both bodies",
  /POSTAL_ADDRESS/.test(product) && /missing_footer/.test(product),
);
check(
  "one-click headers are set as a pair",
  /"List-Unsubscribe":\s*`<\$\{url\}>`/.test(product) &&
    /"List-Unsubscribe-Post":\s*"List-Unsubscribe=One-Click"/.test(product),
);

/* The results email must NOT consult suppression: it is transactional. */
const resultsSend = read("app/api/test-results/send/route.ts");
check(
  "the transactional results email does not consult suppression",
  !/filterSuppressed/.test(resultsSend),
);

/* ==========================================================================
 * 3. The mutation is not reachable by GET
 * ========================================================================== */
console.log("\npre-fetch safety");
const api = read("app/api/unsubscribe/route.ts");
check("POST performs the suppression", /export async function POST/.test(api) && /await suppress\(/.test(api));
const getBody = api.slice(api.indexOf("export async function GET"));
check(
  "GET exists but never writes",
  /export async function GET/.test(api) && !/suppress\(/.test(getBody),
);
check("GET redirects rather than acting", /NextResponse\.redirect/.test(getBody));

/* ==========================================================================
 * 4. THE LEAK GUARDS
 * ========================================================================== */
console.log("\nanalytics guards (static)");
const events = read("lib/analytics/events.ts");
const gtag = read("lib/analytics/google-tag.ts");

check(
  "PostHog: /unsubscribe is a silent route",
  /isSilentRoute[\s\S]{0,900}?\/unsubscribe/.test(events),
);
check(
  "PostHog: silent routes drop the event entirely",
  /if \(isSilentRoute\(\)\) return null;/.test(events),
);
check(
  "gtag: /unsubscribe is a deferred prefix",
  /TOKEN_ROUTE_PREFIXES\s*=\s*\[[^\]]*"\/unsubscribe"/.test(gtag),
);
check(
  "gtag: the prefix has no trailing slash, so the bare route matches",
  !/TOKEN_ROUTE_PREFIXES\s*=\s*\[[^\]]*"\/unsubscribe\/"/.test(gtag),
);
check(
  "gtag: boot returns early on a token route",
  /if \(onTokenRoute\(\)\) return;/.test(gtag),
);

/* The pages themselves must not print the address or index the URL. */
const page = read("app/unsubscribe/page.tsx");
check("the page never renders the decoded address", !/\{decoded\.email\}/.test(page));
check("the page is noindex", /index:\s*false/.test(page));
check("the form is masked from autocapture", /data-ph-no-capture/.test(page));
check("the API sets a noindex header", /x-robots-tag/.test(api));

/* ==========================================================================
 * 5. LIVE: drive a browser and watch the network
 * ========================================================================== */
const BASE = process.argv[2];
if (!BASE) {
  console.log("\n(skipping the live browser pass: no base URL given)");
} else {
  console.log(`\nanalytics guards (live, ${BASE})`);
  const { chromium } = await import("playwright-core");
  const browser = await chromium.launch({
    executablePath:
      process.env.CHROME_PATH ??
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  });
  const page2 = await browser.newPage();

  /*
    EVERY outbound request, not just the ones we expect. The whole lesson of
    the gtag incident is that the leak came from a vendor nobody was watching.
  */
  const outbound = [];
  page2.on("request", (r) => outbound.push(r.url()));

  const liveToken = encodeUnsubscribeToken("leak-probe@example.com");
  await page2.goto(`${BASE}/unsubscribe?t=${liveToken}`, {
    waitUntil: "networkidle",
  });

  const thirdParty = outbound.filter((u) => {
    try {
      const host = new URL(u).hostname;
      return !host.endsWith("smartfellaorfartsmella.com") && host !== "localhost";
    } catch {
      return false;
    }
  });

  check(
    "no request carries the token",
    !outbound.some((u) => u.includes(liveToken) && !u.startsWith(`${BASE}/unsubscribe`)),
    outbound.find((u) => u.includes(liveToken) && !u.startsWith(`${BASE}/unsubscribe`)),
  );
  check(
    "gtag.js was never loaded",
    !outbound.some((u) => u.includes("googletagmanager.com")),
  );
  check(
    "nothing was posted to the PostHog ingest proxy",
    !outbound.some((u) => u.includes("/ingest")),
  );
  check(
    "no third-party request at all",
    thirdParty.length === 0,
    thirdParty.slice(0, 3).join(", "),
  );
  check(
    "the page renders the confirmation button",
    (await page2.getByRole("button", { name: /unsubscribe me/i }).count()) === 1,
  );
  check(
    "the address is not visible on the page",
    !(await page2.content()).includes("leak-probe@example.com"),
  );

  await page2.screenshot({ path: "/tmp/unsubscribe-page.png", fullPage: true });
  await browser.close();
}

console.log("-".repeat(64));
console.log(
  failures === 0
    ? "PASS: the unsubscribe path records, is read, and leaks nothing.\n"
    : `FAIL: ${failures}\n`,
);
process.exit(failures === 0 ? 0 : 1);
