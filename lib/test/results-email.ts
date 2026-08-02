/**
 * The results email: subject, HTML and plain text.
 *
 * ===========================================================================
 * THE EMAIL GIVES AWAY NOTHING. THE LINK IS THE ONLY ROUTE TO THE SCORE.
 * ===========================================================================
 * It shows "??? / 50" in a score block with real visual weight and a real
 * denominator, which is exactly what the gated page on the web shows. Not the
 * number, not the verdict, not the breakdown.
 *
 * This block previously printed the actual score, on the theory that a teaser
 * earns the click. It does the opposite: a person who can read "4 / 50" in the
 * preview pane has already got what they came for and the button is decoration.
 * The masked block still says "there is a result here and it is about you",
 * which is the part that makes somebody click.
 *
 * THE SCORE IS NOT A PARAMETER OF THIS FUNCTION. That is the enforcement, not a
 * convention: `ResultsEmailInput` carries `maxScore` and no `score`, so no
 * future edit to the template can print a number the renderer was never given.
 * Masking a value you still hold is one careless interpolation away from
 * leaking again.
 *
 * FOUR PLACES HAD TO BE CHECKED, not one. The HTML body is the obvious one; the
 * plain-text alternative is a real alternative that many clients render
 * instead; the preheader is the grey line an inbox shows next to the subject,
 * so a score there leaks before the mail is even opened; and the subject line
 * itself is worse still. All four are asserted in
 * scripts/verify-results-email.mjs.
 *
 * ===========================================================================
 * WHO IT IS ADDRESSED TO, AND THE LINE THE CHILD COPY WALKS
 * ===========================================================================
 * On the child branch this lands in a GROWN-UP's inbox, because that is whose
 * address we asked for. Writing "here are your results" to a parent about their
 * nine-year-old's test would be both wrong and slightly alarming.
 *
 * So the copy splits by WHAT IS BEING REFERRED TO, not by tone:
 *
 *   THE PERSON     "your kid". Warm, direct, and true — the reader does have a
 *                  kid and that kid did take the test. This used to say
 *                  "someone", which is accurate and reads like a form letter.
 *   THE SCORE AND  third person, always. "Their score", "which questions they
 *   THE RESULTS    got wrong", "see their results". The reader did not sit a
 *                  Grade 3 test, so "your score" is a claim they know is false,
 *                  and a warm email that opens with something untrue is worse
 *                  than a cool one that does not.
 *
 * The possessive is what gets the warmth without the falsehood: "your kid's
 * results" belongs to the parent by relation and to the child by fact.
 *
 * NONE OF THIS APPLIES TO THE ADULT BRANCH, where the reader took the test and
 * "you" and "your score" are simply correct.
 *
 * ===========================================================================
 * WHY THE HTML IS SO PLAIN
 * ===========================================================================
 * Email clients are not browsers. No web fonts (Anton will not load, so the
 * display type falls back to a heavy system stack), no flexbox or grid, no CSS
 * variables, everything inline, tables for layout. Gmail strips `box-shadow`,
 * so the hard offset shadow that carries the brand on the web is an
 * enhancement here rather than a load-bearing element: the thick black borders
 * and the flat colour blocks do the work, and where the shadow survives it is a
 * bonus. The result reads as this brand in Apple Mail and still reads as this
 * brand in Outlook, which is the bar.
 */
import { CANONICAL_ORIGIN } from "@/lib/site-url";
import { SUPPORT_EMAIL } from "@/lib/support-contact";
import { MASKED_VALUE } from "./scoring";
import type { Audience } from "./types";

/**
 * Where the logo is fetched from. Absolute, public, and always the canonical
 * host: an inbox has no page to resolve a relative path against, anything
 * behind auth renders as a broken image, and a localhost or preview origin is
 * unreachable from wherever the mail is actually opened.
 */
const LOGO_ORIGIN = CANONICAL_ORIGIN;

const INK = "#000000";
const PAPER = "#ffffff";
const YELLOW = "#fce552";
const CREAM = "#f6f4ee";
const GREEN = "#63c088";

/** Anton is not available in an inbox. This is the closest heavy system stack. */
const DISPLAY_FONT =
  "'Arial Black', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const BODY_FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";

export interface ResultsEmailInput {
  audience: Audience;
  /** "The 5-Minute Grade 4 Test". Used in the copy, so it must read naturally. */
  testTitle: string;
  /**
   * The denominator only. There is deliberately no `score` field — see the note
   * at the top of this file. The renderer cannot leak what it is never handed.
   */
  maxScore: number;
  /** Absolute. A relative path is not clickable in an inbox. */
  resultsUrl: string;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

export function renderResultsEmail(input: ResultsEmailInput): RenderedEmail {
  const child = input.audience === "child";

  const subject = child
    ? `Your kid's Smart Fella test results are ready`
    : `Your Smart Fella test results are ready`;

  const opener = child
    ? `Your kid just finished ${input.testTitle} and asked us to send you the results.`
    : `You just finished ${input.testTitle}. Here is how it went.`;

  /*
    The preheader and the plain-text line. Says a result exists and withholds
    it, in the same words for both, so the inbox preview cannot disagree with
    the body.
  */
  const teaser = child
    ? `Their score is waiting behind the button.`
    : `Your score is waiting behind the button.`;

  const callToAction = child
    ? `Open the results to see the verdict, which questions they got wrong, and why.`
    : `Open your results to see the verdict, which ones you got wrong, and why.`;

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light only">
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:${YELLOW};">
<!-- Preheader: the grey line an inbox shows next to the subject. Hidden in the
     body itself by the zero-size span, which is the standard trick. -->
<span style="display:none;font-size:1px;color:${YELLOW};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(teaser)}</span>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${YELLOW};">
<tr><td align="center" style="padding:28px 16px;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;width:100%;">

    <!--
      THE LOGO, WITH THE BRAND NAME AS ITS ALT TEXT.

      Outlook and a good share of other clients block remote images until the
      reader allows them, so "alt" is not a nicety here: it is what a real
      fraction of recipients actually read, and it says the same thing the old
      text header said. It is styled, because a blocked image shows its alt in
      whatever the surrounding CSS says, and unstyled alt text in a serif
      default would look like a fault rather than a brand.

      WIDTH AND HEIGHT ARE ON THE TAG as well as in the style. That reserves the
      box before the image loads, or forever if it never does, so the layout
      cannot collapse and reflow the button underneath it.

      RETINA: the file is 440px wide and displays at 220, so it stays sharp on
      the phone screens most of this mail is opened on. It is flattened onto the
      header's own yellow and palette-reduced, which takes it from 606KB to
      12KB — worth doing for something every recipient downloads.

      The URL is ABSOLUTE and on the production domain. A relative path is a
      broken image in an inbox, since there is no page for it to be relative to.
    -->
    <tr><td align="center" style="padding-bottom:18px;">
      <img src="${escapeAttr(`${LOGO_ORIGIN}/email-logo.png`)}"
           alt="Smart Fella or Fart Smella"
           width="220" height="139"
           style="display:block;width:220px;height:139px;max-width:100%;border:0;outline:none;text-decoration:none;font-family:${BODY_FONT};font-size:13px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:${INK};">
    </td></tr>

    <tr><td style="background-color:${PAPER};border:3px solid ${INK};box-shadow:6px 6px 0 0 ${INK};">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">

        <tr><td style="padding:28px 24px 0 24px;font-family:${BODY_FONT};font-size:16px;line-height:1.5;color:${INK};">
          ${escapeHtml(opener)}
        </td></tr>

        <!-- The score block, masked. Same treatment as the gated page on the
             web: real denominator, real weight, no number. -->
        <tr><td style="padding:20px 24px 0 24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${CREAM};border:3px solid ${INK};">
            <tr><td align="center" style="padding:22px 16px;">
              <div style="font-family:${DISPLAY_FONT};font-size:52px;line-height:1;letter-spacing:-1px;color:${INK};">
                ${MASKED_VALUE}<span style="color:#9b9b9b;">/${input.maxScore}</span>
              </div>
              <div style="padding-top:10px;font-family:${BODY_FONT};font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;color:${INK};">
                ${child ? "Their score" : "Your score"}
              </div>
            </td></tr>
          </table>
        </td></tr>

        <tr><td style="padding:20px 24px 0 24px;font-family:${BODY_FONT};font-size:16px;line-height:1.5;color:${INK};">
          ${escapeHtml(callToAction)}
        </td></tr>

        <!-- One button, and it is a real link so it works with images off. -->
        <tr><td align="center" style="padding:24px;">
          <a href="${escapeAttr(input.resultsUrl)}"
             style="display:inline-block;background-color:${GREEN};border:3px solid ${INK};box-shadow:4px 4px 0 0 ${INK};color:${INK};font-family:${BODY_FONT};font-size:16px;font-weight:bold;letter-spacing:0.5px;text-transform:uppercase;text-decoration:none;padding:16px 30px;">
            ${child ? "See their results" : "See my results"}
          </a>
        </td></tr>

        <tr><td style="padding:0 24px 26px 24px;font-family:${BODY_FONT};font-size:12px;line-height:1.6;color:#5a5a5a;word-break:break-all;">
          Button not working? Paste this in:<br>
          <a href="${escapeAttr(input.resultsUrl)}" style="color:#5a5a5a;">${escapeHtml(input.resultsUrl)}</a>
        </td></tr>

      </table>
    </td></tr>

    <tr><td style="padding:20px 8px 0 8px;font-family:${BODY_FONT};font-size:12px;line-height:1.6;color:${INK};opacity:0.7;">
      You are getting this because ${child ? "your kid asked us to send these results to this address" : "you asked us to send you these results"}.
      We will not email you again unless you ask us to.
      Reply to this message, or write to
      <a href="mailto:${SUPPORT_EMAIL}?subject=unsubscribe" style="color:${INK};">${SUPPORT_EMAIL}</a>,
      and we will remove this address.
    </td></tr>

  </table>

</td></tr>
</table>
</body>
</html>`;

  // The plain-text alternative is a real alternative, not a stripped copy: some
  // people read mail this way by choice, and every deliverability check looks
  // for one.
  const text = [
    "THE OFFICIAL SMART FELLA TEST",
    "",
    opener,
    "",
    // Masked exactly as in the HTML. A plain-text body reading "you scored 4
    // out of 50" beside a masked HTML one would be a silly way to lose this.
    `${MASKED_VALUE} / ${input.maxScore}`,
    teaser,
    "",
    callToAction,
    "",
    input.resultsUrl,
    "",
    "---",
    `You are getting this because ${child ? "your kid asked us to send these results to this address" : "you asked us to send you these results"}. We will not email you again unless you ask us to. Reply to this message, or write to ${SUPPORT_EMAIL}, and we will remove this address.`,
  ].join("\n");

  return { subject, html, text };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** URLs go into attributes, where a stray quote would break out of the value. */
function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/'/g, "&#39;");
}
