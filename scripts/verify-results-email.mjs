/**
 * The results email must not contain the score. Anywhere.
 *
 *   npm run verify:results-email
 *
 * Four surfaces, because the score leaked from one of them and the other three
 * are just as visible:
 *
 *   subject     shows in the inbox list before the mail is opened
 *   preheader   the grey line beside the subject, same visibility
 *   html        the body most people see
 *   text        the body the rest of them see
 *
 * The assertion is deliberately blunt. Rather than checking that the template
 * says "???", it renders with a score whose digits are distinctive and then
 * checks those digits appear nowhere they could be read as a score. That
 * catches a leak through a route nobody thought of, which is the only kind that
 * actually happens.
 */
const { renderResultsEmail } = await import("../lib/test/results-email.ts");

let failures = 0;
const check = (name, pass, detail = "") => {
  if (!pass) failures++;
  console.log(`${pass ? "  ok  " : "  FAIL"} ${name}${detail ? `  — ${detail}` : ""}`);
};

console.log("\nRESULTS EMAIL\n" + "-".repeat(62));

/*
  The renderer has no `score` parameter at all, which is the real guarantee. So
  the test asserts that first, then renders and greps for a score anyway, in
  case a future edit adds the field back and wires it up.
*/
for (const [label, input, max] of [
  ["adult", { audience: "adult", testTitle: "The Official Smart Fella Test", maxScore: 50, resultsUrl: "https://www.smartfellaorfartsmella.com/results/TOKEN" }, 50],
  ["child", { audience: "child", testTitle: "The 5-Minute Grade 4 Test", maxScore: 15, resultsUrl: "https://www.smartfellaorfartsmella.com/results/TOKEN" }, 15],
]) {
  const { subject, html, text } = renderResultsEmail(input);
  console.log(`\n  ${label} — subject: "${subject}"`);

  const preheader = (html.match(/max-height:0[^>]*>([^<]*)</) ?? [])[1] ?? "";

  // The masked block, with the real denominator kept.
  check(`${label}: html shows ??? and the real /${max}`, html.includes(`???<span`) && html.includes(`/${max}<`));
  check(`${label}: text shows ??? and the real /${max}`, text.includes(`??? / ${max}`), text.split("\n").find((l) => l.includes("???")) ?? "");

  // Nothing anywhere may read as "N out of max" or "N/max".
  const scoreShaped = /\b\d{1,2}\s*(?:\/|out of)\s*\d{1,2}\b/i;
  for (const [surface, value] of [
    ["subject", subject],
    ["preheader", preheader],
    ["html", html.replace(/https?:\/\/\S+/g, "")],
    ["text", text.replace(/https?:\/\/\S+/g, "")],
  ]) {
    const hit = value.match(scoreShaped);
    check(`${label}: no score in the ${surface}`, !hit, hit ? `found "${hit[0]}"` : "");
  }

  check(`${label}: subject says results are ready without saying how they went`, /results are ready/i.test(subject));
  check(`${label}: preheader is present and withholds`, preheader.length > 10 && !/\d/.test(preheader), preheader);
  check(`${label}: the link is still there in both bodies`, html.includes(input.resultsUrl) && text.includes(input.resultsUrl));
  check(`${label}: names the test`, html.includes(input.testTitle) && text.includes(input.testTitle));
}

/* The structural guarantee: passing a score must not compile in, and must not
   render even if a caller passes one anyway. */
const sneaky = renderResultsEmail({
  audience: "adult",
  testTitle: "The Official Smart Fella Test",
  maxScore: 50,
  resultsUrl: "https://example.com/results/T",
  score: 47,
});
console.log("");
check(
  "an ignored `score` argument cannot reach the output",
  !sneaky.html.includes("47") && !sneaky.text.includes("47") && !sneaky.subject.includes("47"),
);

console.log("-".repeat(62));
console.log(failures === 0 ? "PASS\n" : `FAIL: ${failures} assertion(s)\n`);
process.exit(failures === 0 ? 0 : 1);
