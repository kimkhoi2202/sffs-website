/**
 * Render both launch-email variants to disk so they can be READ rather than
 * imagined, and screenshot the HTML so the owner sees what lands in an inbox.
 *
 *   node --import ./scripts/ts-resolve-hook.mjs scripts/render-launch-drafts.mjs [outDir]
 *
 * SENDS NOTHING. It imports the renderer and writes files. There is no Resend
 * call anywhere in this script and no import that could reach one:
 * lib/email/launch-email.ts is a pure template, and the only thing that can put
 * it in front of a person is lib/email/product-email.ts, which is off unless
 * PRODUCT_EMAIL_ENABLED is "1".
 *
 * The unsubscribe URL is a REAL signed token for a placeholder address, so the
 * footer in the draft is the footer that would ship, not a stand-in. That also
 * means the drafts are worth opening in a browser: the link resolves.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { registerHooks } from "node:module";
import { join } from "node:path";

/*
  `server-only` throws the moment plain Node loads it, and product-email.ts
  imports it, so this script could not actually be run as written — it died on
  the import before rendering a thing. Stubbed exactly as
  scripts/verify-send-recovery.mjs stubs it.

  Shimmed HERE rather than in scripts/ts-resolve-hook.mjs on purpose. That hook
  is shared by every verify script, and a client component importing a
  server-only module is a build error worth keeping for all of them.
*/
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === "server-only") {
      return { url: "data:text/javascript,export{}", shortCircuit: true };
    }
    return next(specifier, context);
  },
});

process.env.UNSUBSCRIBE_TOKEN_SECRET ||= "draft-preview-only-secret";

const { renderLaunchEmail } = await import("../lib/email/launch-email.ts");
const { unsubscribeUrlFor, POSTAL_ADDRESS } = await import("../lib/email/product-email.ts");

const outDir = process.argv[2] ?? "/tmp/sffs-launch-drafts";
mkdirSync(outDir, { recursive: true });

/*
  A visibly fake address. Using a real one from the list would put a live
  unsubscribe token for a real person into a file that gets passed around.
*/
const PREVIEW_ADDRESS = "you@example.com";
const unsubscribeUrl = unsubscribeUrlFor(PREVIEW_ADDRESS);
const previewCtaUrl = "https://www.smartfellaorfartsmella.com/go/app?t=preview-only";

const written = [];
for (const variant of ["a", "b"]) {
  const { subject, html, text } = renderLaunchEmail({
    variant,
    unsubscribeUrl,
    ctaUrl: previewCtaUrl,
  });

  const htmlPath = join(outDir, `launch-variant-${variant}.html`);
  const textPath = join(outDir, `launch-variant-${variant}.txt`);
  writeFileSync(htmlPath, html, "utf8");
  // The subject rides at the top of the text file so the draft is complete:
  // a plain-text body with no subject is half an email.
  writeFileSync(textPath, `Subject: ${subject}\n\n${text}\n`, "utf8");
  written.push({ variant, subject, htmlPath, textPath });

  /* House rules, checked rather than trusted. */
  const problems = [];
  for (const [label, body] of [["html", html], ["text", text]]) {
    // Variant A's sign-off intentionally uses the owner's approved en dash.
    const bodyWithoutApprovedSignoff = body.replaceAll("–Smart Fella", "Smart Fella");
    if (/[\u2014\u2013]/.test(bodyWithoutApprovedSignoff)) {
      problems.push(`${label}: contains an unapproved em or en dash`);
    }
    if (!body.includes(unsubscribeUrl)) problems.push(`${label}: no unsubscribe URL`);
    if (!body.includes(POSTAL_ADDRESS)) {
      problems.push(`${label}: no postal address`);
    }
  }
  // Strip the brand glyph before counting, exactly as the brand gate does, then
  // allow at most one other emoji.
  const emoji = [...text.replace(/\u{1F9E0}\u{1F4A8}/gu, "")].filter((c) =>
    /\p{Extended_Pictographic}/u.test(c),
  );
  if (emoji.length > 1) problems.push(`text: ${emoji.length} emoji, max is 1`);

  console.log(`variant ${variant.toUpperCase()}: "${subject}"`);
  console.log(`  ${htmlPath}`);
  console.log(`  ${textPath}`);
  console.log(problems.length ? `  PROBLEMS: ${problems.join("; ")}` : "  house rules: ok");
}

/* Screenshot both, at phone width, which is where most of this gets opened. */
try {
  const { chromium } = await import("playwright-core");
  const browser = await chromium.launch({
    executablePath:
      process.env.CHROME_PATH ??
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  });
  const page = await browser.newPage({
    viewport: { width: 420, height: 900 },
    deviceScaleFactor: 2,
  });
  for (const { variant, htmlPath } of written) {
    await page.goto(`file://${htmlPath}`, { waitUntil: "networkidle" });
    const shot = join(outDir, `launch-variant-${variant}.png`);
    await page.screenshot({ path: shot, fullPage: true });
    console.log(`shot: ${shot}`);
  }
  await browser.close();
} catch (err) {
  console.log(`(no screenshot: ${err instanceof Error ? err.message : err})`);
}
