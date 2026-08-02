/**
 * The results email: subject, HTML and plain text.
 *
 * ===========================================================================
 * WHAT IT GIVES AWAY, AND WHAT IT HOLDS BACK
 * ===========================================================================
 * The email carries the SCORE and nothing else. Not the verdict, not the
 * domain breakdown, not the question-by-question with its explanations.
 *
 * That split is the whole design. A score with no context is the fact somebody
 * earned and will want to see; the verdict is the joke they came for and the
 * breakdown is where they find out which ones they blew. Putting all of it in
 * the email would make the link decorative. Putting none of it in would make
 * the email feel like a hoop.
 *
 * ===========================================================================
 * WHO IT IS ADDRESSED TO
 * ===========================================================================
 * On the child branch this lands in a GROWN-UP's inbox, because that is whose
 * address we asked for. So the copy addresses the adult and refers to the child
 * in the third person. Writing "here are your results" to a parent about their
 * nine-year-old's test would be both wrong and slightly alarming.
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
import { SUPPORT_EMAIL } from "@/lib/email/resend";
import type { Audience } from "./types";

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
  score: number;
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
    ? `Their Smart Fella test results are ready`
    : `Your Smart Fella test results are ready`;

  const opener = child
    ? `Someone just finished ${input.testTitle} and asked us to send you the results.`
    : `You just finished ${input.testTitle}. Here is how it went.`;

  const teaser = child
    ? `They scored ${input.score} out of ${input.maxScore}.`
    : `You scored ${input.score} out of ${input.maxScore}.`;

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

    <tr><td align="center" style="padding-bottom:18px;font-family:${BODY_FONT};font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:${INK};">
      The Official Smart Fella Test
    </td></tr>

    <tr><td style="background-color:${PAPER};border:3px solid ${INK};box-shadow:6px 6px 0 0 ${INK};">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">

        <tr><td style="padding:28px 24px 0 24px;font-family:${BODY_FONT};font-size:16px;line-height:1.5;color:${INK};">
          ${escapeHtml(opener)}
        </td></tr>

        <!-- The teaser block. Score only: the verdict and the breakdown are
             behind the link, on purpose. -->
        <tr><td style="padding:20px 24px 0 24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${CREAM};border:3px solid ${INK};">
            <tr><td align="center" style="padding:22px 16px;">
              <div style="font-family:${DISPLAY_FONT};font-size:52px;line-height:1;letter-spacing:-1px;color:${INK};">
                ${input.score}<span style="color:#9b9b9b;">/${input.maxScore}</span>
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
      You are getting this because ${child ? "someone asked us to send these results to this address" : "you asked us to send you these results"}.
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
    `${teaser}`,
    "",
    callToAction,
    "",
    input.resultsUrl,
    "",
    "---",
    `You are getting this because ${child ? "someone asked us to send these results to this address" : "you asked us to send you these results"}. We will not email you again unless you ask us to. Reply to this message, or write to ${SUPPORT_EMAIL}, and we will remove this address.`,
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
