/**
 * Flatten the brand lockup into ONE image for the results email.
 *
 *   node scripts/build-email-logo.mjs
 *
 * ===========================================================================
 * WHY THIS IS A BUILD STEP AND NOT TWO <img> TAGS
 * ===========================================================================
 * On the web the lockup is a wordmark with the brain absolutely positioned over
 * its top-right corner (see BrandLockup). An inbox cannot be asked to do that.
 * Outlook's rendering engine drops or ignores positioning on images and stacks
 * them instead, so the same markup gives a brain sitting under the wordmark in
 * a meaningful share of clients — and it is the share least likely to tell us.
 *
 * So the overlap is resolved HERE, once, and the email ships a single <img>
 * with nothing to position.
 *
 * The geometry is copied from BrandLockup deliberately rather than imported:
 * that component states its numbers as percentages of the wordmark's height,
 * and this reproduces them in pixels. If they ever change, this file has to be
 * re-run, which is why the numbers are named rather than inlined.
 */
import sharp from "sharp";

/** Display width in the email. Everything else follows from it. */
const DISPLAY_W = 220;
/** 2x, so it stays sharp on the phone screens most mail is opened on. */
const SCALE = 2;

/* --- the three numbers from BrandLockup, as fractions of wordmark height --- */
const BRAIN_H = 0.46;
const BRAIN_TOP = -0.26;
/** Right edge overhangs by 10% of the brain's own width. */
const BRAIN_RIGHT = -0.1;
const BRAIN_ROTATE = 12;

/** The email header's own yellow. Flattening onto it kills the alpha channel. */
const YELLOW = "#fce552";

const wordmark = sharp("public/wordmark.png");
const wm = await wordmark.metadata();

// The WORDMARK is sized to the display width; the canvas ends up a little
// wider once the brain's overhang is added, which is correct — the <img> is
// scaled by its width attribute either way.
const wmW = DISPLAY_W * SCALE;
const wmH = Math.round((wm.height / wm.width) * wmW);

const brainH = Math.round(wmH * BRAIN_H);
const brainBuf = await sharp("public/logo.png")
  .resize({ height: brainH })
  .rotate(BRAIN_ROTATE, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .toBuffer();
const bm = await sharp(brainBuf).metadata();

/*
  THE CANVAS GROWS IN BOTH DIRECTIONS TO HOLD THE OVERHANG.

  The brain rides above the wordmark's top edge AND past its right edge, so a
  canvas the size of the wordmark crops it on two sides. Getting this wrong is
  invisible here and obvious in an inbox: the first version of this file only
  grew the canvas vertically and shipped a brain with its right side sliced off.
  Both overhangs are measured and added.
*/
const overhangTop = Math.max(0, Math.round(-BRAIN_TOP * wmH));
const overhangRight = Math.max(0, Math.round(-BRAIN_RIGHT * bm.width));
const canvasW = wmW + overhangRight;
const canvasH = wmH + overhangTop;

await sharp({
  create: { width: canvasW, height: canvasH, channels: 4, background: YELLOW },
})
  .composite([
    { input: await sharp("public/wordmark.png").resize({ width: wmW }).toBuffer(), top: overhangTop, left: 0 },
    { input: brainBuf, top: 0, left: canvasW - bm.width },
  ])
  .flatten({ background: YELLOW })
  .png({ palette: true, colours: 128, effort: 10 })
  .toFile("public/email-logo.png");

const { size } = await import("node:fs").then((m) => m.statSync("public/email-logo.png"));
const out = await sharp("public/email-logo.png").metadata();
console.log(`public/email-logo.png  ${out.width}x${out.height}  ${(size / 1024).toFixed(0)}KB`);
console.log(`display at ${DISPLAY_W}x${Math.round(out.height / SCALE)} (width/height attrs + inline CSS)`);
