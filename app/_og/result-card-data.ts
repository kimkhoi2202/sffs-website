import "server-only";

import { getResult } from "@/lib/test/result-store";
import { scoreTest } from "@/lib/test/scoring";
import { getTestById } from "@/lib/test/tests";

import type { ResultCardData } from "./result-card";

/**
 * Turn a results token into the handful of values every share surface needs.
 *
 * One resolver rather than five, because the story card, the two OG images,
 * the two Twitter images and the challenge page all answer the same question
 * and must never answer it differently. Null for a token that is missing,
 * edited or expired — the caller decides whether that is a 404 or a fallback.
 *
 * RE-SCORED FROM THE ANSWERS, exactly like the results page. The token carries
 * what the player did, not what we concluded, so a card can never show a score
 * that disagrees with the page it links to.
 */
export function resultCardDataFor(rawToken: string): ResultCardData | null {
  const record = getResult(decodeURIComponent(rawToken));
  if (!record) return null;

  const test = getTestById(record.testId);
  if (!test) return null;

  const result = scoreTest(test, record.answers);
  return {
    score: result.score,
    max: result.max,
    verdictId: result.verdict.id,
    verdictTitle: result.verdict.title,
  };
}
