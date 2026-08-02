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
 * the sentence, read carefully, supports A, caught only by writing the
 * distractor rationales out longhand. That class of error survives a careful
 * read of 125 items, because by item 90 you are reading what you meant rather
 * than what you wrote.
 *
 * ===========================================================================
 * WHAT IS NOT IN HERE, AND WHY
 * ===========================================================================
 * Items that failed the cold solve outright were FIXED rather than flagged,
 * because in each case the item was broken rather than borderline:
 *
 *   grade-5 verbal analogy    had "music" against a key of "symphony". The
 *       relation sentence is "an author writes a novel"; "a composer writes
 *       music" is also true, so the item had two defensible answers. Now
 *       "concert".
 *   grade-6 verbal analogy    used PUBLIC, whose opposite is "private" on the
 *       access dimension and "hidden" on the visibility one, which is the exact
 *       two-dimensional trap the antonym gate exists to catch. Now VOLUNTARY.
 *   adult 29    asked which team was "most productive", ambiguous between most
 *       tasks and most tasks per member. Reworded to name the operation.
 *   adult 21    asked for "repetition" and carried "summary", which took a
 *       judgement about what summaries are like to rule out rather than
 *       anything the sentence said. Replaced outright with a new item at the
 *       same point in the curve; the cold solve on the replacement is clean.
 *   grade 7-8 verbal analogy 3    was STERILE : LIFE :: ARID : ?, which spent
 *       two curriculum-dependent words where the cap is one and measured which
 *       syllabus a child sat rather than whether they can hold a relation.
 *       Replaced with FAMINE : FOOD :: DROUGHT : ?, same relation, same level,
 *       vocabulary that travels. ELATED went the same way, to OVERJOYED, which
 *       a solver can work out from its parts.
 *
 * TWO FLAGS IN HERE WERE ON THE WRONG ITEM until this revision. The child banks
 * number their items by SLOT (verbal, number, figure, repeating), so
 * `grade-7-8-05` is a number analogy, not the verbal item the note described.
 * Both are now keyed off the emitted files rather than off arithmetic done in
 * my head, which is the same class of mistake this file exists to catch.
 *
 * WHY IT IS A LIST OF EXCEPTIONS. Recording all 125 cold answers would make
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
  a38: {
    picked: "B",
    kind: "hesitant",
    note: "Agreed with the key, and it resolved cleanly, but this item sits exactly on the cap the taxonomy sets: 'though' and 'almost nothing' are two negations and no more are allowed. Worth a decision about whether an eighteen-second item should ask for two negation flips at all, rather than about whether this one is correct.",
  },
  "grade-3-03": {
    picked: "C",
    kind: "hesitant",
    note: "Agreed with the key, and flagged for a property this item shares with every ONE-RULE matrix in the bank rather than for anything wrong with it. With a single rule running along the rows, stepping that rule back lands on the cell to the left, so the fourth option has to perturb something the grid holds constant instead: here, the number of shapes. That is a real error (the solver read the rule and did not notice what it was not allowed to touch) but it is the weakest of the four families, and it is the option a sharp eight-year-old will eliminate first. Same shape at grade-3-06, grade-3-09 and grade-4-03.",
  },
  "grade-7-8-13": {
    picked: "A",
    kind: "hesitant",
    note: "Agreed with the key (loneliness). The distractor 'distance' is tagged as the relation run backwards, since distance causes isolation rather than the other way round, but a reader can construct a sense in which isolation produces emotional distance. It is the weakest distractor in the grade 7-8 verbal set and the one most likely to be argued with.",
  },
};

/** Items where the cold solve actually landed somewhere else. */
export const BLIND_DISAGREEMENTS = Object.entries(BLIND_SOLVE)
  .filter(([, f]) => f.kind === "disagree")
  .map(([id]) => id);
