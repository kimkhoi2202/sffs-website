/**
 * A distractor's authored note, with our taxonomy taken off the front.
 *
 * ===========================================================================
 * THE CODE IS FOR US, THE SENTENCE IS FOR THEM
 * ===========================================================================
 * Every wrong option carries a note like:
 *
 *   "WP-relation: who a doctor works alongside, not where."
 *
 * The sentence is written for a person. The prefix is the rule taxonomy that
 * says WHY this distractor exists, and it is an audit trail — it stays in the
 * data, where it lets us check that a bank covers the error types it claims to.
 * Rendering it puts internal jargon in front of somebody who just got a
 * question wrong, which is the same mistake as the item-type pills that were
 * taken off the test screens.
 *
 * ===========================================================================
 * WHY THE PATTERN IS THIS NARROW
 * ===========================================================================
 * Splitting on the first colon would be shorter and is wrong: it mangles any
 * note whose sentence legitimately contains one, and "Careful: check the
 * middle" would lose its first word. So the prefix has to be recognised rather
 * than assumed.
 *
 * Surveyed across all 376 notes in the bank before writing this. There are 53
 * distinct codes and every one of them is one to three capitals, optionally a
 * hyphen and a lower-case word, then a colon — `D:`, `IC:`, `IC-transpose:`,
 * `WP-overgeneralise:`, `R-left:`. Twenty-two notes have no code at all and
 * are already plain sentences. None has a second colon today, which is exactly
 * why a naive split would have passed review and then broken the first time
 * somebody wrote one.
 *
 * The capitals requirement is what makes it safe: an ordinary sentence opening
 * cannot match, because prose does not begin with a bare two-letter acronym
 * followed by a colon.
 */
const RULE_CODE = /^[A-Z]{1,3}(?:-[a-z]+)?:\s*/;

export function readableNote(note: string): string {
  const stripped = note.replace(RULE_CODE, "");
  /*
   * If stripping leaves nothing, the note WAS only a code and the honest thing
   * is to show the original rather than an empty box. No note in the bank looks
   * like that today; this is here so that a malformed one degrades to visible
   * rather than to invisible.
   */
  return stripped.length > 0 ? stripped : note;
}
