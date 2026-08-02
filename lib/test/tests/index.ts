/**
 * The test registry: the one place that knows which static test a player gets.
 *
 * Six tests — one adult, five child banks — all imported eagerly. They are
 * small plain-data modules and importing them statically means the runner never
 * awaits a chunk mid-flow; a spinner between "start" and the first question
 * would be a bad moment for one, especially on the phone connection most of
 * this traffic arrives on.
 *
 * SIX GRADES, FIVE BANKS. Grades 7 and 8 share a bank. `getTest` is the only
 * thing that needs to know that, and `GRADE_BANKS` in ../types.ts is the only
 * place the mapping is written down.
 *
 * If real content lands and these files get much bigger, this is the seam to
 * make lazy: `getTest` becomes async and the intro screen prefetches while the
 * player reads the rules.
 */
import { GRADE_BANKS, type Audience, type BankId, type Grade, type Test } from "../types";
import { ADULT_TEST } from "./adult";
import { GRADE_3_TEST } from "./grade-3";
import { GRADE_4_TEST } from "./grade-4";
import { GRADE_5_TEST } from "./grade-5";
import { GRADE_6_TEST } from "./grade-6";
import { GRADE_7_8_TEST } from "./grade-7-8";

const BANKS: Record<BankId, Test> = {
  "grade-3": GRADE_3_TEST,
  "grade-4": GRADE_4_TEST,
  "grade-5": GRADE_5_TEST,
  "grade-6": GRADE_6_TEST,
  "grade-7-8": GRADE_7_8_TEST,
};

export { ADULT_TEST, BANKS };

/** Every test, for the validator and the dev tools. */
export const ALL_TESTS: Test[] = [ADULT_TEST, ...Object.values(BANKS)];

/**
 * The test for a given branch of the flow.
 *
 * Returns null rather than throwing when a child has not picked a grade yet,
 * because that is a normal intermediate state of the flow rather than an error.
 */
export function getTest(audience: Audience, grade: Grade | null): Test | null {
  if (audience === "adult") return ADULT_TEST;
  if (grade === null) return null;
  const bank = GRADE_BANKS[grade];
  return bank ? BANKS[bank] : null;
}

export function getTestById(id: string): Test | null {
  return ALL_TESTS.find((t) => t.id === id) ?? null;
}

/**
 * The title to SHOW someone: always their own grade, never the band.
 *
 * ===========================================================================
 * GRADE IS FOR DISPLAY. BAND IS FOR COMPARISON. THEY ARE NOT THE SAME FIELD.
 * ===========================================================================
 * Grades 7 and 8 share one item bank, so `Test.title` on that bank reads "Grade
 * 7 and 8". That is an implementation detail and it should never reach a
 * player: someone who tapped 7 should be told they took the Grade 7 test. Being
 * shown a band makes the product feel like it is guessing.
 *
 * The fix is a display title derived from the grade they picked, and the
 * discipline underneath it is that BOTH values stay stored, separately:
 *
 *   grade  what they picked. Drives every word of UI, the email subject, the
 *          results page heading.
 *   band   which items they actually sat. Drives scoring and any grouping.
 *
 * Collapsing them either way loses something real. Keep only the grade and a
 * future per-cohort percentile gets computed against an arbitrarily split
 * population, half the size it should be, because 7 and 8 answered identical
 * questions and belong in one pool. Keep only the band and there is no way to
 * say "Grade 7" back to the person who chose it.
 */
export function displayTestTitle(test: Test, grade: Grade | null): string {
  if (test.audience === "adult" || grade === null) return test.title;
  const minutes = Math.round(test.durationSeconds / 60);
  return `The ${minutes}-Minute Grade ${grade} Test`;
}
