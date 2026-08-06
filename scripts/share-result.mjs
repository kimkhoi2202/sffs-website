/**
 * The finished attempt the two share suites open, minted rather than frozen.
 *
 * ===========================================================================
 * WHY A HARD-CODED TOKEN COULD NOT WORK, AND DID NOT, EVER
 * ===========================================================================
 * Both suites used to carry a literal token with the payload below baked into
 * it. A results token is an HMAC over that payload (see lib/test/result-token.ts),
 * and the signature on that literal was produced by a secret that is not in this
 * repository and is not in anyone's environment. `decodeResultToken` checks the
 * signature before it looks at anything else, so `getResult` returned null, the
 * page rendered "These results have gone", and there was no share button on it.
 *
 * The suites therefore timed out waiting for "Share my result" — a failure that
 * reads exactly like a broken share control and is nothing of the kind. Both
 * `npm run` entries had never once passed; the green runs were people invoking
 * the scripts by hand with a re-signed token in argv[3], which is a step that
 * lives in someone's shell history rather than in the repository.
 *
 * That is the same lesson scripts/verify-review-nav.mjs already wrote down:
 * "A literal token in a script expires against whatever secret signed it and
 * then the suite has to be edited to stay green, which is how assertions get
 * loosened." These two were written before that and never caught up.
 *
 * Asking the running server removes the question. Whatever secret it is using,
 * the token agrees with it, because the server signed it.
 *
 * ===========================================================================
 * THE SAME ATTEMPT, NOT A NEW ONE
 * ===========================================================================
 * The answers below are the ones that were inside the old literal, unpacked
 * against the real bank in the bank's own order — which is exactly what
 * `unpackAnswers` does on read. So the page these suites open is the page they
 * have always opened: same test, same grade, same fifteen answers, same score,
 * same verdict, same eight destinations in the sheet. Only `createdAt` differs,
 * because it is now today rather than the day the string was written.
 *
 * Nothing about what either suite asserts changes as a result. This replaces a
 * dead signature with a live one and touches nothing else.
 */
import { GRADE_4_TEST } from "../lib/test/tests/grade-4.ts";
import { resolveWriteTarget, SYNTHETIC } from "./harness-target.mjs";

/**
 * One character per item, in the bank's order, as the token itself stores them.
 * Fifteen characters for the fifteen grade 4 items; option ids are A-D.
 */
const PACKED_ANSWERS = "DDCDDCDCCDDCCDC";

/** Matches the old literal, so the results page renders what it always did. */
const ELAPSED_SECONDS = 20;

/**
 * Ask the running server for a signed result, and hand back its token.
 *
 * PRODUCTION IS REFUSED HERE AND NOT AT THE TOP OF THE CALLER, deliberately.
 * Minting is a write — on production it is a real row in Aurora next to real
 * people's scores, which is the whole reason scripts/harness-target.mjs exists.
 * But a token supplied in argv[3] needs no write at all, and running these
 * suites against the live site read-only is a thing they are built for: the
 * stray-event check in verify-share-sheet.mjs exists precisely so it can be
 * pointed at production, "which is where the last two reports came from".
 * Guarding the mint rather than the script keeps that possible and still makes
 * it impossible to invent a result on the real table.
 */
export async function mintShareToken(base, script) {
  const target = resolveWriteTarget(base, script);

  const answers = {};
  GRADE_4_TEST.items.forEach((item, i) => {
    const picked = PACKED_ANSWERS[i];
    if (picked && picked !== "-") answers[item.id] = picked;
  });

  const res = await fetch(`${target}/api/test-results`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...SYNTHETIC },
    body: JSON.stringify({
      testId: GRADE_4_TEST.id,
      grade: 4,
      answers,
      elapsedSeconds: ELAPSED_SECONDS,
      timedOut: false,
    }),
  });

  const body = await res.json().catch(() => null);
  if (!body?.ok || !body.token) {
    throw new Error(
      `could not mint a result at ${target}: ${JSON.stringify(body)}. ` +
        `Is the dev server running?`,
    );
  }
  return body.token;
}
