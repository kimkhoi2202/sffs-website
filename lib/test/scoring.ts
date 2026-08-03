/**
 * Scoring and the verdict.
 *
 * ---------------------------------------------------------------------------
 * NO IQ NUMBER, NO STANDARD AGE SCORE, NO STANINE, NO PERCENTILE. DO NOT ADD ONE.
 * ---------------------------------------------------------------------------
 * All four were considered and all four were cut. Each is a NORMED measurement:
 * the number only means something if the instrument has been standardised
 * against a representative sample, and this one has not been standardised
 * against anything.
 *
 * Borrowing a real publisher's norms does not fix that, it makes it worse.
 * Their norms describe a different population, sitting a different instrument,
 * under different stakes — a supervised school assessment is not a phone tapped
 * in bed. A percentile computed from them would be precise and wrong, on a page
 * a parent may show their child.
 *
 * What we can honestly say is how many they got right out of how many, and a
 * joke. So that is what this returns.
 *
 * THE ONE PERCENTILE THAT WOULD BE HONEST is against our own users, per grade
 * band, once there is a large enough sample in each. The record shape for it
 * already exists (`TestSubmission` in ./types.ts) and the `test_completed`
 * event is already accumulating it. It is not shown until the sample is there,
 * and when it is, it is computed per band and never pooled across them.
 */
import type { Audience, Test, TestItem } from "./types";

/** A player's answers: item id -> the option they picked. Missing = skipped. */
export type AnswerMap = Record<string, string>;

export interface ScoredItem {
  item: TestItem;
  /** What they picked, or null if they ran out of time or skipped it. */
  picked: string | null;
  correct: boolean;
}

export interface TestResult {
  score: number;
  max: number;
  /** 0-100, rounded. For band selection and analytics only — never shown as a percentile. */
  percent: number;
  answered: number;
  verdict: Verdict;
  items: ScoredItem[];
}

export interface Verdict {
  /** The band id. Stable — analytics groups on it. */
  id: VerdictId;
  /** The big line. Same for both audiences: the joke is the whole brand. */
  title: string;
  /** The line under it. Tuned per audience — see the note in VERDICTS. */
  subline: string;
}

export type VerdictId =
  | "smart-fella"
  | "fart-smella"
  /**
   * Not a band. The placeholder the gated screen carries so that the object it
   * renders has no verdict in it at all — see `maskedResult`. `verdictFor`
   * never returns this and no scored result ever holds it.
   */
  | "masked";

/**
 * TWO OUTCOMES. THE BRAND ASKS A TWO-WAY QUESTION AND THIS IS THE ANSWER.
 *
 * ===========================================================================
 * WHY NOT A SCALE
 * ===========================================================================
 * There were five bands and the middle three were "Mostly Smart Fella",
 * "Smart Fella, Faint Smell" and "Mostly Fart Smella". A five-point scale
 * answers a question nobody asked: the product is called Smart Fella or Fart
 * Smella, so the only verdict it can deliver is which one you are. "Smart
 * Fella, Faint Smell" is not a thing a person would ever say about themselves,
 * and it is not a thing anyone screenshots.
 *
 * NO PRECISION IS LOST, because the exact score sits directly above the
 * verdict. The number carries the nuance and the verdict carries the joke,
 * which is the right division of labour between them — a hedged verdict was
 * doing the number's job badly and its own job not at all.
 *
 * ===========================================================================
 * SEVENTY PERCENT, AND IT IS MEANT TO HURT
 * ===========================================================================
 * 35 of 50 on the adult test, against a measured average of 24 on the
 * instrument this format models — roughly the 95th percentile. 11 of 15 for a
 * child, which a sharp one reaches.
 *
 * So MOST PEOPLE WILL BE FART SMELLAS, and that is the design rather than a
 * side effect. A Smart Fella nobody can get is a joke with no winners; one
 * everybody gets is a participation award and worth nothing to post. Rare and
 * reachable is the combination that makes the good outcome worth bragging
 * about and the common outcome funny.
 *
 * ===========================================================================
 * THE TITLE IS THE SAME FOR EVERYONE. THE SUBLINE IS NOT.
 * ===========================================================================
 * "Fart Smella" is the entire joke the brand is built on and a nine-year-old
 * who gets it will screenshot it, so softening the title for children would be
 * softening the product.
 *
 * The subline is where they split, and the split matters more now than it did
 * on a scale. The low verdict is no longer the bottom of five bands reached by
 * the worst performers — it is where MOST PEOPLE LAND. So it cannot read as a
 * booby prize. The old line, "you have achieved the highest possible smell",
 * was written for a floor that no longer exists and would now be aimed at the
 * average player.
 *
 * An adult gets a ribbing that lets them in on the joke about the threshold. A
 * child gets the same verdict with "for now" attached, because the child branch
 * is reached by a six-year-old sitting a test a grown-up handed them, and the
 * encouraging move is to frame the score as a starting point.
 */
const VERDICTS: Array<{
  min: number;
  id: VerdictId;
  title: string;
  adult: string;
  child: string;
}> = [
  {
    min: 70,
    id: "smart-fella",
    title: "Smart Fella",
    adult: "About one in twenty gets here. Go and be insufferable about it.",
    child: "That is a brilliant score, and hardly anyone gets it. Go and find a grown-up to tell.",
  },
  {
    min: 0,
    id: "fart-smella",
    title: "Fart Smella",
    adult: "The bar for Smart Fella is set deliberately high. You are in enormous company down here.",
    child: "For now, anyway. The bar is set really high on purpose, and these get easier every single time you meet one.",
  },
];

export function verdictFor(percent: number, audience: Audience): Verdict {
  const band = VERDICTS.find((v) => percent >= v.min) ?? VERDICTS[VERDICTS.length - 1];
  return {
    id: band.id,
    title: band.title,
    subline: audience === "child" ? band.child : band.adult,
  };
}

/** Both verdicts, for the dev tools' score forcer. */
export const VERDICT_BANDS = VERDICTS.map((v) => ({ id: v.id, min: v.min, title: v.title }));

/**
 * The token that stands in for every hidden value on the gated screen.
 *
 * One string, used everywhere something is withheld, so the masking reads as a
 * deliberate treatment rather than as several unrelated blanks.
 */
export const MASKED_VALUE = "???";

/**
 * A STRUCTURE-ONLY RESULT for the blurred state behind the email gate.
 *
 * ===========================================================================
 * WHY THIS EXISTS: BLUR IS COSMETIC
 * ===========================================================================
 * A CSS blur is a filter on painted pixels. The text underneath is still in the
 * DOM, so the real score was readable in devtools or view-source in about five
 * seconds — and worse, a big bold "11/15" in Anton survives any blur radius
 * weak enough to still look deliberate. Raising the radius until the numerals
 * are unrecoverable produces a smear that reads as a rendering bug.
 *
 * So the gated view never receives the real numbers at all. It receives THIS,
 * and the true result exists only on the page behind the emailed token.
 *
 * ===========================================================================
 * WHY IT IS A MASK AND NOT A DECOY
 * ===========================================================================
 * This used to return a plausible fake — a believable mid-band score with a
 * real verdict attached, on the reasoning that "??? / 15" would break the
 * illusion that the result was sitting right there.
 *
 * That was a bad trade. It is a small deception, and it is one the person
 * catches: they read "10 / 15" through the blur, open the email, and find 3.
 * Nothing about that reads as a privacy measure — it reads as a bug, or as a
 * site that lies. The credibility cost lands at the exact moment the product is
 * asking to be trusted with an address.
 *
 * `???` says "hidden" out loud and gates the score just as completely. It is
 * also strictly simpler: there is no fake to generate, nothing to keep
 * plausible, and no second value that can drift away from the real one.
 *
 * WHAT IS NOT MASKED: the DENOMINATOR. "??? out of 15" is honest and grounded;
 * "??? out of ???" is theatre, and the number of questions is not a secret —
 * they just answered them. The same rule runs through the breakdown: every
 * total is real, every count of theirs is hidden.
 *
 * The object below therefore carries the SHAPE of a result and none of its
 * values: the same items in the same order, so the row count, the tier labels
 * and the domain rows are all exactly what the real page will show, and nothing
 * moves when it loads. `score`, `percent` and `answered` are zeroes that
 * `ResultsView` never reads in masked mode; they exist because `TestResult`
 * has the fields, not because anything renders them.
 */
export function maskedResult(test: Test): TestResult {
  return {
    score: 0,
    max: test.items.length,
    percent: 0,
    answered: 0,
    verdict: {
      id: "masked",
      title: MASKED_VALUE,
      subline: "Your verdict is in the email.",
    },
    items: test.items.map((item) => ({ item, picked: null, correct: false })),
  };
}

export function scoreTest(test: Test, answers: AnswerMap): TestResult {
  const items: ScoredItem[] = test.items.map((item) => {
    const picked = answers[item.id] ?? null;
    return { item, picked, correct: picked === item.answer };
  });

  const score = items.filter((i) => i.correct).length;
  const max = test.items.length;
  // A zero-item test can only happen if a content file is broken, but dividing
  // by it would render "NaN%" to a real visitor, so guard rather than assume.
  const percent = max === 0 ? 0 : Math.round((score / max) * 100);

  return {
    score,
    max,
    percent,
    answered: items.filter((i) => i.picked !== null).length,
    verdict: verdictFor(percent, test.audience),
    items,
  };
}
