/**
 * The blind solve: every item worked cold, with the key hidden, and everything
 * that did not fall out cleanly recorded here.
 *
 * ===========================================================================
 * THIS IS A HIGHLIGHTER, NOT A GATE
 * ===========================================================================
 * Nothing below was auto-corrected and nothing was auto-rejected. Where the
 * cold solve disagreed with the key, the item is STILL SHIPPED AS AUTHORED and
 * the review page marks it. The point is to aim a human's attention at the
 * handful of items worth a second look, out of a hundred and twenty-five that
 * all look fine.
 *
 * It earns its cost because of a specific failure mode. The rule taxonomy
 * contains a worked sentence-completion example where the author intended B and
 * the sentence, read carefully, supports A — caught only by writing the
 * distractor rationales out longhand. That class of error survives a careful
 * read of 125 items, because by item 90 you are reading what you meant rather
 * than what you wrote.
 *
 * ===========================================================================
 * WHAT IS NOT IN HERE, AND WHY
 * ===========================================================================
 * Three items failed the cold solve outright and were FIXED rather than
 * flagged, because in each case the item was broken rather than borderline:
 *
 *   grade-5 verbal analogy 4  had "music" against a key of "symphony". The
 *       relation sentence is "an author writes a novel"; "a composer writes
 *       music" is also true, so the item had two defensible answers. Replaced
 *       with "concert".
 *   grade-6 verbal analogy 5  used PUBLIC, whose opposite is "private" on the
 *       access dimension and "hidden" on the visibility one — the exact
 *       two-dimensional trap the antonym gate exists to catch. Replaced with
 *       VOLUNTARY, which varies on one thing.
 *   adult 29  asked which team was "most productive", which is ambiguous
 *       between most tasks and most tasks per member. Reworded to name the
 *       operation.
 *
 * WHY THIS IS A LIST OF EXCEPTIONS. Recording all 125 cold answers would make
 * this file a second answer key, which is exactly the thing that drifts out of
 * sync. Only the items worth a second look are stored; every other item is, by
 * omission, one the cold solve agreed with without hesitating.
 */

export interface BlindSolveFlag {
  /** What the cold solve picked, with the key hidden. */
  picked: string;
  /**
   * `disagree`  the cold solve landed on a different option from the key
   * `hesitant`  it landed on the key, but only after ruling a second option out
   *             on a judgement rather than on something the item states
   */
  kind: "disagree" | "hesitant";
  /** What the second look should be looking for. */
  note: string;
}

export const BLIND_SOLVE: Record<string, BlindSolveFlag> = {
  a14: {
    picked: "A",
    kind: "hesitant",
    note: "Agreed with the key. Flagged because 'checked' restates 'tested' from the same sentence, so a solver can reach it by surface matching without ever reading the list's shared property. The item is not wrong; it is easier than its position at 14 implies.",
  },
  a21: {
    picked: "D",
    kind: "hesitant",
    note: "Agreed with the key (repetition), but 'summary' took a second pass to rule out. A second draft that condenses the first is a real thing. What kills it is 'the same errors appeared in the same order', which a summary would not preserve — and that is a judgement about what summaries are like rather than something the sentence states. The weakest gate on any adult sentence-completion item.",
  },
  a38: {
    picked: "B",
    kind: "hesitant",
    note: "Agreed with the key, and it resolved cleanly, but this item sits exactly on the cap the taxonomy sets: 'though' and 'almost nothing' are two negations and no more are allowed. Worth a decision about whether an eighteen-second item should ask for two negation flips at all, rather than about whether this one is correct.",
  },
  "grade-7-8-05": {
    picked: "A",
    kind: "hesitant",
    note: "Agreed with the key (moisture) and the relation is clean, but the item spends TWO rare words — 'sterile' and 'arid' — where the taxonomy caps a band at one. It is also the item whose answer depends most on knowing a word rather than on working a relation out, so it is the likeliest of the twenty-five child verbal items to be rejected on vocabulary grounds.",
  },
  "grade-7-8-11": {
    picked: "A",
    kind: "hesitant",
    note: "Agreed with the key (loneliness). The distractor 'distance' is tagged as the relation run backwards — distance causes isolation, not the other way round — but a reader can construct a sense in which isolation produces emotional distance. It is the weakest distractor in the grade 7-8 verbal set and the one most likely to be argued with.",
  },
};

/** Items where the cold solve actually landed somewhere else. */
export const BLIND_DISAGREEMENTS = Object.entries(BLIND_SOLVE)
  .filter(([, f]) => f.kind === "disagree")
  .map(([id]) => id);
