/**
 * Rewritten explanations, keyed by item id.
 *
 * ===========================================================================
 * WHAT AN EXPLANATION HAS TO DO NOW
 * ===========================================================================
 * The old ones restated the relation and stopped: "A hammer is a kind of tool;
 * a banana is a kind of fruit." That is the answer written out, not a reason,
 * and it is no use at all to the person who picked "tree".
 *
 * Each one here does three things in order:
 *
 *   1. NAME THE RULE, in plain words rather than our taxonomy. "The first word
 *      is an instrument and the second is what it measures" — not "VA-R3".
 *   2. SHOW THE KEY SATISFYING IT, so a correct answer is confirmed rather than
 *      just ticked. Somebody who reasoned it out and somebody who guessed used
 *      to see the same screen.
 *   3. TAKE APART THE TEMPTING WRONG ONE. Every item has a distractor that is
 *      wrong in an interesting way, and naming why it fails teaches more than
 *      the rule does. This is the sentence a person actually needs.
 *
 * CHILD ITEMS ARE READ BY EIGHT-YEAR-OLDS. Short sentences, ordinary words, and
 * never a hint that the mistake was stupid — the wrong answer is described as
 * tempting, because it was.
 *
 * These live here rather than inline because the child banks are generated:
 * scripts/build-child-banks.mjs reads this map, so a rebuild cannot silently
 * revert them to the template.
 */

export const EXPLANATIONS = {
  /* -- adult verbal analogies --------------------------------------------- */
  a05: "The first word is an instrument and the second is the quantity it measures: a ruler measures length, a scale measures weight. 'Distance' is the trap, because it is a quantity and it is very close to length — but it is what the RULER measures. It belongs to the first half of the analogy, not the second.",
  a17: "Small cause, large consequence. Enough rain makes a flood; a spark makes a fire. 'Smoke' is tempting because it genuinely does follow from a fire, but it is the consequence of the consequence — one step too far along the chain. 'Flint' runs the relation backwards: it makes the spark rather than being made by it.",
  a30: "Both pairs run from a small version of an action to a large one: a murmur is a quiet shout, a glance is a brief stare. 'Blink' is the tempting one because it is also something eyes do quickly, but it is not a longer or more intense glance — it is a different action that happens to be short.",
  a41: "Each first word names a thing by what it withholds: opaque withholds light, mute withholds sound. 'Silence' is the near-miss, and a good one — but silence is what being mute PRODUCES, not what is withheld. The analogy wants the thing that is absent, not the state its absence creates.",

  /* -- grade 3 ------------------------------------------------------------ */
  "grade-3-01":
    "A hammer is one kind of tool, so we need one kind of fruit. A banana is a fruit, so that fits. A tree is where fruit grows and a basket is what you carry it in — close to fruit, but neither of them IS a fruit.",
  "grade-3-04":
    "A chick is a baby and a hen is the grown-up it turns into, so we need the grown-up a lamb turns into. That is a sheep. A calf is also a baby animal, which is why it looks right, but it is a baby cow — it is on the wrong side of the pair.",
  "grade-3-07":
    "A branch is a part of a tree, so we need a part of a hand. A finger is part of a hand. An arm is the tempting one, but it works the other way round: the hand is part of the arm, not the arm part of the hand.",
  "grade-3-10":
    "A pencil is for writing, so we need what scissors are for. Scissors are for cutting. Drawing is also something you do with a pencil, so it belongs with the first word — the answer has to be about the scissors.",
  "grade-3-13":
    "A chair is one kind of furniture, so we need one kind of clothing. A shirt is clothing. Cotton is what clothing is made of and a button is a part of it, and being made of something or being part of something is not the same as being one.",

  /* -- grade 4 ------------------------------------------------------------ */
  "grade-4-01":
    "A teacher works in a school, so we need the place a doctor works. That is a hospital. A patient is who a doctor works with and medicine is what they use — both are true about doctors, but the pair is asking about the place.",
  "grade-4-04":
    "A cow gives us milk, so we need what a bee gives us. Bees make honey. A hive is where bees live and a sting is something they do, so both belong to bees — but neither is something the bee makes for us.",
  "grade-4-07":
    "A painter works with a brush, so we need the tool a gardener holds. That is a shovel. A garden is where they work and a flower is what they grow, which is why both feel right — the pair is asking what is in their hand.",
  "grade-4-10":
    "A wheel is part of a bicycle, so we need the thing a sail is part of. A sail is part of a boat. A mast is the tempting one, because a sail really does hang on a mast — but that makes it another part, not the whole thing the sail belongs to.",
  "grade-4-13":
    "Each pair is a thing and a property it always has. Ice is cold, so fire is hot — the property is temperature both times. Bright is true of fire as well, which is what makes it tempting, but the first pair already decided that temperature is the property to follow.",

  /* -- grade 5 ------------------------------------------------------------ */
  "grade-5-01":
    "An instrument and what it shows: a compass shows direction, a clock shows time. 'Hour' is a unit you measure time IN rather than the thing itself, and 'hands' are a part of the clock. 'North' is something a compass shows, so it belongs in the first half.",
  "grade-5-04":
    "A small beginning and what it grows into: a spark becomes a flame, a seed becomes a plant. Soil is what a seed needs in order to do that, and a harvest comes much later — the pair wants the very next thing it turns into.",
  "grade-5-07":
    "A maker and the work they make: an author writes a novel, a composer writes a symphony. An orchestra performs it and a concert is where you hear it, so both come after the work already exists. The pair is about what the composer creates.",
  "grade-5-10":
    "An activity and what it builds up over time: exercise builds strength, practice builds skill. 'Repetition' is the interesting near-miss — it is what practice IS, not what practice produces, and the pair is about the result.",
  "grade-5-13":
    "A thing and the property it is known for. A feather is light, so a stone is heavy: the property is weight both times. 'Hard' and 'gray' are both true of a stone, which is what makes them tempting, but neither one answers the question the first pair asked.",

  /* -- grade 6 ------------------------------------------------------------ */
  "grade-6-01":
    "Both pairs run from mild to extreme on the same scale. Soaked is very damp; freezing is very chilly. 'Drenched' is the trap: it IS the extreme version, but of the first pair — it is about wetness, and the second pair is about cold.",
  "grade-6-04":
    "Small version to large version: a yell is a loud whisper, a gulp is a big sip. 'Drink' is the general word that covers both a sip and a gulp, so it is the category rather than the large version, and the pair wants the large version.",
  "grade-6-07":
    "Each pair is an everyday word and its formal twin. Commence is a formal way of saying begin; conclude is a formal way of saying end. 'Start' is a synonym for the wrong half — it matches begin, not end.",
  "grade-6-10":
    "Each pair is a word and its opposite. Stingy is the opposite of generous, so we need the opposite of brave, which is cowardly. 'Heroic' is a synonym for brave — that is the reverse of what this pair does.",
  "grade-6-13":
    "Opposites both times. Scarce is the opposite of abundant, and required is the opposite of voluntary. 'Optional' is the tempting one because it is so close to voluntary — but it MEANS the same thing rather than the opposite, so it fails the rule.",

  /* -- grades 7 and 8 ------------------------------------------------------ */
  "grade-7-8-01":
    "Each first word describes what a thing is liable to do: fragile things break, flammable things burn. 'Extinguish' is what someone does TO a fire, not what the flammable thing itself does, and 'shatter' belongs to the fragile half of the pair.",
  "grade-7-8-04":
    "Each pair names a state by what is missing from it: a vacant room lacks occupants, a mute thing lacks speech. 'Silence' is the strong near-miss — it is the RESULT of that absence rather than the thing that is absent.",
  "grade-7-8-07":
    "Each first word is a shortage of the second: a famine is a shortage of food, a drought is a shortage of rain. 'Desert' is tempting because it is dry, but it is a place where the shortage is normal rather than the thing in short supply.",
  "grade-7-8-10":
    "Mild feeling to intense feeling on the same scale. Furious is extreme annoyance, so we need extreme pleasure: overjoyed. 'Satisfied' is roughly as strong as pleased, so it does not move up the scale at all, which is what the pair requires.",
  "grade-7-8-13":
    "Each pair is a cause and what it leads to: neglect leads to decay, isolation leads to loneliness. 'Distance' is the near-miss, and it fails in an interesting way — it is a CAUSE of isolation rather than its effect, so it runs the pair backwards.",
  /* -- the four that stayed thin in context -------------------------------
   *
   * The rest of the bank was reviewed item by item AFTER the distractor notes
   * started surfacing, and almost all of it reads adequately now: a number
   * analogy saying "each number goes up by 3, so 10 becomes 13" already names
   * the rule and shows the key satisfying it, and the note supplies the third
   * part. Padding those would make them worse, not better — a child does not
   * need four sentences for "add 3".
   *
   * These four do not clear the bar even in context. Each is a bare
   * calculation or a bare assertion: it states what the answer IS without
   * naming the method that produces it, so somebody who got it wrong learns
   * only that they got it wrong.
   */
  a03: "Matching a code means checking every character in order rather than recognising its shape, which is what the eye wants to do instead. A is identical the whole way through. The other three each differ by exactly one character, and each is placed to catch a different habit: two adjacent digits swapped in the middle, a zero replaced by a capital O, and a change to the second letter, which is the one people check least. Reading left to right and stopping at the first mismatch is the method.",
  a04: "Sharing a total equally between a number of people is division: 84 divided by 6 is 14. The check worth building the habit of is multiplying back the other way — 6 times 14 is 84 — because it catches a slip on the division immediately and costs a second.",
  a10: "Both withdrawals come off the same starting amount, so they subtract one after the other: 200 minus 45 is 155, minus 68 is 87. The order does not matter and adding the two withdrawals first gives the same answer. What goes wrong is subtracting only one of them, or reading the second figure as what was LEFT after the morning rather than as a second amount drawn off.",
  a47: "The dials are set independently, so the settings multiply rather than add. Each of the 5 letters can go with any of the 10 first digits, which is 50 combinations, and each of those with any of the 10 second digits: 5 times 10 times 10 is 500. Adding the dials gives 25, which is the usual way this one goes wrong — it counts the choices available rather than the ways of combining them.",
};
