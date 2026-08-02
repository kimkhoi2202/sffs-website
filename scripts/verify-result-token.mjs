/**
 * Truth table for the signed results token.
 *
 *   npm run verify:result-token
 *
 * The properties that matter are the ones the old store got wrong or could not
 * have: a token must verify anywhere with no shared state, must not verify
 * after being edited, must not verify under a different secret, and must stop
 * verifying after twelve months. Each of those is one assertion here, and each
 * of them is cheaper to run than the browser test that found the original bug.
 *
 * `server-only` is why this imports the token module and not result-store.ts:
 * that file throws the moment plain Node loads it. The token module is the part
 * with the logic worth asserting.
 */
process.env.RESULTS_TOKEN_SECRET ??= "test-secret-for-verification-only";

const { encodeResultToken, decodeResultToken, RESULT_TTL_SECONDS } = await import(
  "../lib/test/result-token.ts"
);
const { getTestById } = await import("../lib/test/tests/index.ts");

let failures = 0;
const check = (name, pass, detail = "") => {
  if (!pass) failures++;
  console.log(`${pass ? "  ok  " : "  FAIL"} ${name}${detail ? `  — ${detail}` : ""}`);
};

const nowSec = () => Math.floor(Date.now() / 1000);

/* A real attempt: every third question answered correctly, the rest spread
   around, so the round trip is checked against something with structure. */
const adult = getTestById("adult");
const answers = {};
adult.items.forEach((item, i) => {
  if (i % 5 === 4) return; // some genuinely skipped
  answers[item.id] = i % 3 === 0 ? item.answer : item.options[i % item.options.length].id;
});

const base = {
  testId: "adult",
  grade: null,
  answers,
  elapsedSeconds: 842,
  timedOut: false,
  createdAt: nowSec(),
};

console.log("\nSIGNED RESULT TOKEN\n" + "-".repeat(62));

/* -- round trip ------------------------------------------------------------ */
const token = encodeResultToken(base);
const ok = decodeResultToken(token);
check("a fresh token verifies", ok.ok, ok.ok ? "" : ok.reason);
check(
  "answers survive the round trip exactly",
  ok.ok && JSON.stringify(ok.payload.answers) === JSON.stringify(answers),
  ok.ok ? `${Object.keys(ok.payload.answers).length} answers` : "",
);
check("elapsed and timedOut survive", ok.ok && ok.payload.elapsedSeconds === 842 && ok.payload.timedOut === false);
check("skipped questions stay skipped", ok.ok && !(adult.items[4].id in ok.payload.answers));

/* -- size ------------------------------------------------------------------ */
const urlLen = `https://www.smartfellaorfartsmella.com/results/${token}`.length;
check("token fits comfortably in a URL", urlLen < 600, `${token.length} char token, ${urlLen} char URL`);

/* -- a grade band ---------------------------------------------------------- */
const g5 = getTestById("grade-5");
const g5answers = Object.fromEntries(g5.items.map((i) => [i.id, i.answer]));
const gTok = encodeResultToken({ ...base, testId: "grade-5", grade: 5, answers: g5answers });
const gOk = decodeResultToken(gTok);
check("a child band round trips with its grade", gOk.ok && gOk.payload.grade === 5 && gOk.payload.testId === "grade-5");

/* -- tampering ------------------------------------------------------------- */
const [body, sig] = token.split(".");
const flip = (s, i) => s.slice(0, i) + (s[i] === "A" ? "B" : "A") + s.slice(i + 1);

check(
  "editing the payload is rejected",
  decodeResultToken(`${flip(body, 12)}.${sig}`).reason === "bad_signature",
);
check(
  "editing the signature is rejected",
  decodeResultToken(`${body}.${flip(sig, 4)}`).reason === "bad_signature",
);
check("a stripped signature is rejected", decodeResultToken(body).reason === "malformed");
check("an empty signature is rejected", decodeResultToken(`${body}.`).reason === "malformed");
check("junk is rejected", decodeResultToken("not-a-token").reason === "malformed");
check("an empty string is rejected", decodeResultToken("").reason === "malformed");
check("a null-ish value is rejected", decodeResultToken(undefined).reason === "malformed");

/*
  The attack the whole design exists to stop: re-signing a better score. Forging
  needs the key, so a payload built under a different secret must not verify
  under ours.
*/
const realSecret = process.env.RESULTS_TOKEN_SECRET;
process.env.RESULTS_TOKEN_SECRET = "a-different-secret-entirely";
const foreign = encodeResultToken({ ...base, answers: Object.fromEntries(adult.items.map((i) => [i.id, i.answer])) });
process.env.RESULTS_TOKEN_SECRET = realSecret;
check("a token signed with another key is rejected", decodeResultToken(foreign).reason === "bad_signature");

/* -- expiry ---------------------------------------------------------------- */
const old = encodeResultToken({ ...base, createdAt: nowSec() - RESULT_TTL_SECONDS - 60 });
check("a token past twelve months is expired", decodeResultToken(old).reason === "expired");

const nearly = encodeResultToken({ ...base, createdAt: nowSec() - RESULT_TTL_SECONDS + 3600 });
check("a token just inside twelve months still works", decodeResultToken(nearly).ok === true);

/* Expiry must be covered by the signature, not merely present in the payload. */
const decoded = JSON.parse(Buffer.from(old.split(".")[0], "base64url").toString());
decoded.x = nowSec() + 99999;
const extended = `${Buffer.from(JSON.stringify(decoded)).toString("base64url")}.${old.split(".")[1]}`;
check(
  "pushing the expiry out by hand is rejected",
  decodeResultToken(extended).reason === "bad_signature",
);

/* -- unknown bank ---------------------------------------------------------- */
const unknown = encodeResultToken({ ...base, testId: "grade-5" });
const swapped = JSON.parse(Buffer.from(unknown.split(".")[0], "base64url").toString());
swapped.t = "no-such-bank";
check(
  "a token naming a bank that does not exist is rejected",
  decodeResultToken(
    `${Buffer.from(JSON.stringify(swapped)).toString("base64url")}.${unknown.split(".")[1]}`,
  ).reason === "bad_signature",
);

console.log("-".repeat(62));
console.log(failures === 0 ? "PASS\n" : `FAIL: ${failures} assertion(s)\n`);
process.exit(failures === 0 ? 0 : 1);
