/**
 * Writes the five child bank files.
 *
 *   node scripts/build-child-banks.mjs
 *
 * WHY A BUILDER AND NOT FIVE HAND-TYPED FILES. Ten of the fifteen items in each
 * bank are hand-authored and live below as data. The other five are figure
 * matrices whose nine cells and four options come out of matRiks — about 40
 * lines of geometry each, 25 of them, none of which a person should be
 * transcribing by hand. This assembles the two halves once.
 *
 * THE OUTPUT IS THE SOURCE OF TRUTH. `lib/test/tests/grade-*.ts` are committed,
 * plain, hand-editable data files, exactly as their headers say. Nothing
 * regenerates them at build time and nothing imports this script. It exists so
 * the first landing was a transcription rather than a retyping, and so the
 * provenance of the figural half is a rule file rather than a memory.
 *
 * The figural distractors' error notes are DERIVED from the matRiks family tag
 * plus the rules actually active in that matrix, because the error genuinely is
 * the family: "IC-Flip" on a rotating matrix means the turn went one step too
 * far, and on a still one it means the figure was turned at all. Writing 75
 * near-identical sentences by hand would have produced 75 chances to attach the
 * wrong one.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const figures = JSON.parse(readFileSync(join(HERE, "matriks", "figures.json"), "utf8"));

/* =========================================================================
 * The hand-authored half: five verbal analogies and five number analogies
 * per bank, in difficulty order within the bank.
 *
 * Every option carries `why` except the key. `k` is the key's index in the
 * list as written here; the emitter shuffles the options so the key lands on
 * the letter named in KEYS below, which is what keeps the bank from being
 * answerable by position.
 * ========================================================================= */

const VA = {
  /* -- L9: relations R1-R3 only, both terms name things you can point at ---- */
  "grade-3": [
    {
      rule: "VA-R7 young to adult, tier 1",
      stem: "CHICK is to HEN as LAMB is to ?",
      explain: "A chick grows into a hen; a lamb grows into a sheep.",
      k: 0,
      opts: [
        ["sheep"],
        ["wool", "WP-relation: what a lamb gives us, not what it grows into."],
        ["calf", "WP-relation: another baby animal. Matched 'young' instead of completing the pair."],
        ["farm", "D: where lambs live. Same field, no relation to the one in the stem."],
      ],
    },
    {
      rule: "VA-R3 object to function, tier 1",
      stem: "PENCIL is to WRITE as SCISSORS is to ?",
      explain: "A pencil is used to write; scissors are used to cut.",
      k: 0,
      opts: [
        ["cut"],
        ["draw", "WP-relation: what the FIRST tool does. Completed the stem instead of the analogy."],
        ["fold", "WP-relation: something done to paper, matched to the material rather than to the tool."],
        ["hold", "D: something you do with scissors, licensed by no relation in the stem."],
      ],
    },
    {
      rule: "VA-R1 category to member, tier 1",
      stem: "TOOL is to HAMMER as FRUIT is to ?",
      explain: "A hammer is a kind of tool; a banana is a kind of fruit.",
      k: 0,
      opts: [
        ["banana"],
        ["tree", "WP-reverse: where fruit comes from. The relation run backwards."],
        ["basket", "D: where fruit is kept. Same field, no relation."],
        ["vegetable", "WP-relation: another category rather than a member of this one."],
      ],
    },
    {
      rule: "VA-R2 whole to part, tier 1",
      stem: "TREE is to BRANCH as HAND is to ?",
      explain: "A branch is part of a tree; a finger is part of a hand.",
      k: 0,
      opts: [
        ["finger"],
        ["arm", "WP-reverse: the whole a hand is part of, rather than a part of the hand."],
        ["glove", "D: what covers a hand. Same field, no relation."],
        ["foot", "WP-relation: another body part at the same level, not a part of the hand."],
      ],
    },
    {
      rule: "VA-R1 category to member, tier 1",
      stem: "FURNITURE is to CHAIR as CLOTHING is to ?",
      explain: "A chair is a kind of furniture; a shirt is a kind of clothing.",
      k: 0,
      opts: [
        ["shirt"],
        ["cotton", "WP-relation: what clothing is made of, not a kind of clothing."],
        ["button", "WP-relation: a part of a garment rather than a kind of garment."],
        ["closet", "D: where clothing is kept. Same field, no relation."],
      ],
    },
  ],

  /* -- L10: adds R4-R7. One term may be a place or a role. ----------------- */
  "grade-4": [
    {
      rule: "VA-R4 worker to workplace, tier 1",
      stem: "TEACHER is to SCHOOL as DOCTOR is to ?",
      explain: "A teacher works in a school; a doctor works in a hospital.",
      k: 0,
      opts: [
        ["hospital"],
        ["patient", "WP-relation: who a doctor treats, not where they work."],
        ["medicine", "WP-relation: what a doctor uses, not where they work."],
        ["nurse", "WP-relation: who a doctor works alongside, not where."],
      ],
    },
    {
      rule: "VA-R5 worker to tool, tier 1",
      stem: "PAINTER is to BRUSH as GARDENER is to ?",
      explain: "A painter works with a brush; a gardener works with a spade.",
      k: 0,
      opts: [
        ["spade"],
        ["garden", "WP-relation: where a gardener works, not what they work with."],
        ["flower", "WP-relation: what a gardener tends, not what they hold."],
        ["paint", "R-echo: belongs to the first pair, not the second."],
      ],
    },
    {
      rule: "VA-R7 source to product, tier 1",
      stem: "COW is to MILK as BEE is to ?",
      explain: "A cow gives milk; a bee gives honey.",
      k: 0,
      opts: [
        ["honey"],
        ["hive", "WP-relation: where a bee lives, not what it produces."],
        ["wing", "WP-relation: a part of a bee rather than something it makes."],
        ["sting", "WP-relation: what a bee does, not what it makes."],
      ],
    },
    {
      rule: "VA-R6 object to characteristic property, tier 1",
      stem: "ICE is to COLD as FIRE is to ?",
      explain: "Ice is cold; fire is hot. The property is temperature both times.",
      k: 0,
      opts: [
        ["hot"],
        ["cold", "R-echo: the word the first pair already used."],
        ["wet", "WP-relation: a property of what ice becomes, not a property of fire."],
        ["bright", "IC-partial: a real property of fire, but on a different dimension from the temperature the stem uses."],
      ],
    },
    {
      rule: "VA-R2 part to whole, tier 1-2",
      stem: "WHEEL is to BICYCLE as SAIL is to ?",
      explain: "A wheel is part of a bicycle; a sail is part of a boat.",
      k: 0,
      opts: [
        ["boat"],
        ["wind", "WP-relation: what makes a sail work, not what it is part of."],
        ["mast", "WP-relation: another part at the same level, not the whole."],
        ["sea", "D: where boats are found. Same field, no relation."],
      ],
    },
  ],

  /* -- L11: adds R8-R9. An instrument, a measurement or a cause appears. ---- */
  "grade-5": [
    {
      rule: "VA-R9 instrument to what it shows, tier 2",
      stem: "COMPASS is to DIRECTION as CLOCK is to ?",
      explain: "A compass shows direction; a clock shows time.",
      k: 0,
      opts: [
        ["time"],
        ["hour", "IC-partial: a unit of the quantity rather than the quantity itself."],
        ["hands", "WP-relation: a part of a clock, not what it shows."],
        ["north", "R-echo: an answer to the first pair rather than the second."],
      ],
    },
    {
      rule: "VA-R8 cause to effect, tier 2",
      stem: "EXERCISE is to STRENGTH as PRACTICE is to ?",
      explain: "Exercise builds strength; practice builds skill.",
      k: 0,
      opts: [
        ["skill"],
        ["effort", "WP-reverse: what practice takes, not what it produces."],
        ["music", "D: a thing people practise. Same field, no relation."],
        ["repetition", "WP-relation: what practice consists of, not what it produces."],
      ],
    },
    {
      rule: "VA-R8 small cause to the thing it becomes, tier 2",
      stem: "SPARK is to FLAME as SEED is to ?",
      explain: "A spark becomes a flame; a seed becomes a plant.",
      k: 0,
      opts: [
        ["plant"],
        ["soil", "WP-relation: what a seed needs, not what it becomes."],
        ["shell", "WP-relation: a part of a seed rather than what it turns into."],
        ["harvest", "IC-degree: further along the same chain than the first pair goes."],
      ],
    },
    {
      rule: "VA-R7 maker to what they make, tier 2",
      stem: "AUTHOR is to NOVEL as COMPOSER is to ?",
      explain: "An author writes a novel; a composer writes a symphony.",
      k: 0,
      opts: [
        ["symphony"],
        ["orchestra", "WP-relation: who performs the work, not the work itself."],
        ["concert", "WP-relation: the event where the work is heard, not the thing written."],
        ["piano", "WP-relation: an instrument, so a tool rather than an output."],
      ],
    },
    {
      rule: "VA-R6 object to characteristic property, tier 2",
      stem: "FEATHER is to LIGHT as STONE is to ?",
      explain: "A feather is light; a stone is heavy. The property is weight both times.",
      k: 0,
      opts: [
        ["heavy"],
        ["soft", "WP-direction: the property matched to FEATHER rather than to STONE."],
        ["hard", "IC-partial: a real property of stone, but on a different dimension from the weight the stem uses."],
        ["grey", "D: a property from another dimension entirely."],
      ],
    },
  ],

  /* -- L12: adds R10-R11. Rank on a scale, or a two-step category jump. ----- */
  "grade-6": [
    {
      rule: "VA-R10 degree on a scale, tier 2",
      stem: "DAMP is to SOAKED as CHILLY is to ?",
      explain: "Soaked is an extreme version of damp; freezing is an extreme version of chilly.",
      k: 0,
      opts: [
        ["freezing"],
        ["lukewarm", "IC-degree: a temperature word that fails to escalate — it moves the other way along the same scale."],
        ["drenched", "WP-direction: the extreme of DAMP. Matched to the first pair rather than the second."],
        ["overcast", "D: a weather word, licensed by no relation in the stem."],
      ],
    },
    {
      rule: "VA-R11 synonym, tier 2",
      stem: "BEGIN is to COMMENCE as END is to ?",
      explain: "Commence is a formal word for begin; conclude is a formal word for end.",
      k: 0,
      opts: [
        ["conclude"],
        ["start", "R-echo: a synonym of BEGIN, echoing the first pair instead of matching the second."],
        ["continue", "WP-relation: an adjacent stage rather than a synonym."],
        ["delay", "D: a time verb, licensed by no relation."],
      ],
    },
    {
      rule: "VA-R10 degree on a scale, tier 2",
      stem: "WHISPER is to YELL as SIP is to ?",
      explain: "A yell is the loud version of a whisper; a gulp is the large version of a sip.",
      k: 0,
      opts: [
        ["gulp"],
        ["taste", "IC-degree: smaller than a sip, so the escalation runs backwards."],
        ["pour", "WP-relation: something done TO a drink by someone else."],
        ["drink", "WP-relation: the general category rather than the intense version."],
      ],
    },
    {
      rule: "VA-R11 antonym, tier 2",
      stem: "GENEROUS is to STINGY as BRAVE is to ?",
      explain: "Stingy is the opposite of generous; cowardly is the opposite of brave.",
      k: 0,
      opts: [
        ["cowardly"],
        ["heroic", "WP-reverse: a synonym of BRAVE, so the relation runs the wrong way."],
        ["careless", "IC-partial: opposed on a neighbouring dimension — caution rather than courage."],
        ["loyal", "D: a character word, licensed by no relation."],
      ],
    },
    {
      // PUBLIC was the first draft here and it is exactly the word the taxonomy
      // warns off: it opposes on two dimensions at once (open to all, and known
      // to all), so "private" and "hidden" are both defensible and the item has
      // no single answer. VOLUNTARY varies on one thing only.
      rule: "VA-R11 antonym, single-dimension opposition, tier 2",
      stem: "ABUNDANT is to SCARCE as VOLUNTARY is to ?",
      explain: "Scarce is the opposite of abundant; required is the opposite of voluntary.",
      k: 0,
      opts: [
        ["required"],
        ["optional", "WP-reverse: a synonym of VOLUNTARY, so the relation runs backwards."],
        ["reluctant", "IC-partial: opposed on willingness rather than on whether there is a choice at all."],
        ["unpaid", "D: a word from the same field, licensed by no relation."],
      ],
    },
  ],

  /* -- L13/14: adds R12-R13. At least one abstract noun per item. ---------- */
  "grade-7-8": [
    {
      rule: "VA-R13 quality to the thing it lacks, tier 2",
      stem: "VACANT is to OCCUPANTS as MUTE is to ?",
      explain: "A vacant room is defined by the occupants it lacks; a mute thing by the speech it lacks.",
      k: 0,
      opts: [
        ["speech"],
        ["silence", "WP-reverse: what a mute thing HAS rather than what it lacks."],
        ["listener", "WP-relation: the other party, not the thing withheld."],
        ["gesture", "D: another means of communication, licensed by no relation."],
      ],
    },
    {
      /*
       * STERILE and ARID were the first version of this item, and both are the
       * wrong kind of hard. The problem is not the difficulty, it is the
       * CURRICULUM DEPENDENCE: they are words one syllabus teaches and another
       * does not, so the item measures which classroom a child sat in. Worse,
       * it spent two rare words where the cap is one.
       *
       * FAMINE and DROUGHT carry the same relation at the same level and are
       * taught everywhere the subject is taught at all. The relation is what is
       * being tested; the vocabulary should be the part that gets out of the
       * way.
       */
      rule: "VA-R13 state defined by what is absent, tier 2, curriculum-neutral",
      stem: "FAMINE is to FOOD as DROUGHT is to ?",
      explain: "A famine is a shortage of food; a drought is a shortage of rain.",
      k: 0,
      opts: [
        ["rain"],
        ["flood", "WP-reverse: the opposite condition rather than the thing that is missing."],
        ["desert", "WP-relation: a place where drought is normal, not the thing absent from it."],
        ["heat", "WP-relation: what accompanies a drought rather than what it is a shortage of."],
      ],
    },
    {
      /*
       * ELATED was the key here and it has the same curriculum problem in a
       * milder form. OVERJOYED means the same thing, sits at the same point on
       * the scale, and is built out of two words a child already has, so a
       * solver who has never met it can still work out what it must mean. That
       * is the line: hard to REASON about is the point, hard to have
       * ENCOUNTERED is not.
       */
      rule: "VA-R10 degree on a scale, tier 2, compositional vocabulary",
      stem: "ANNOYED is to FURIOUS as PLEASED is to ?",
      explain: "Furious is the extreme of annoyed; overjoyed is the extreme of pleased.",
      k: 0,
      opts: [
        ["overjoyed"],
        ["satisfied", "IC-degree: the same direction but no stronger than 'pleased', so the escalation runs backwards."],
        ["grateful", "WP-relation: a related feeling rather than a stronger version of the same one."],
        ["untroubled", "D: a mood word, licensed by no relation in the stem."],
      ],
    },
    {
      rule: "VA-R8 cause to effect, both terms abstract",
      stem: "NEGLECT is to DECAY as ISOLATION is to ?",
      explain: "Neglect produces decay; isolation produces loneliness.",
      k: 0,
      opts: [
        ["loneliness"],
        ["absence", "WP-relation: a restatement of isolation rather than what it produces."],
        ["distance", "WP-reverse: what causes isolation rather than what isolation causes."],
        ["freedom", "D: a state sometimes associated with solitude, licensed by no relation."],
      ],
    },
    {
      rule: "VA-R6 disposition to the event it invites, tier 2-3",
      stem: "FRAGILE is to BREAK as FLAMMABLE is to ?",
      explain: "A fragile thing is liable to break; a flammable thing is liable to burn.",
      k: 0,
      opts: [
        ["burn"],
        ["extinguish", "WP-reverse: what is done TO it to stop it, not what it readily does."],
        ["melt", "WP-relation: another thing heat does to a material, but not what 'flammable' names."],
        ["shatter", "R-echo: the verb belonging to the first pair."],
      ],
    },
  ],
};

const NA = {
  /* -- L9: one operation, nothing over 20, computable on fingers ----------- */
  "grade-3": [
    {
      rule: "NA-1 single additive (+3)",
      pairs: [[4, 7], [6, 9]],
      from: 10,
      explain: "Each number goes up by 3, so 10 becomes 13.",
      k: 0,
      opts: [
        [13],
        [30, "WP-multiplicative: read the 3 as a multiplier rather than an amount to add."],
        [12, "IC-offby: added 2 instead of 3."],
        [7, "R-pair: copied the answer from the first pair."],
      ],
    },
    {
      rule: "NA-2 single multiplicative (x2)",
      pairs: [[3, 6], [7, 14]],
      from: 9,
      explain: "Each number doubles, so 9 becomes 18.",
      k: 0,
      opts: [
        [18],
        [12, "WP-additive: added 3, the gap in the first pair, instead of doubling."],
        [16, "IC-offby: doubled 8 rather than 9."],
        [14, "R-pair: copied the answer from the second pair."],
      ],
    },
    {
      rule: "NA-1 single subtractive (-4)",
      pairs: [[12, 8], [15, 11]],
      from: 20,
      explain: "Each number goes down by 4, so 20 becomes 16.",
      k: 0,
      opts: [
        [16],
        [24, "WP-direction: added 4 instead of taking it away."],
        [15, "IC-offby: subtracted 5 instead of 4."],
        [11, "R-pair: copied the answer from the second pair."],
      ],
    },
    {
      rule: "NA-1 single additive (+7)",
      pairs: [[5, 12], [8, 15]],
      from: 13,
      explain: "Each number goes up by 7, so 13 becomes 20.",
      k: 0,
      opts: [
        [20],
        [21, "IC-offby: added 8 instead of 7."],
        [15, "R-pair: copied the answer from the second pair."],
        [6, "WP-direction: subtracted 7 instead of adding it."],
      ],
    },
    {
      rule: "NA-1 single subtractive (-6)",
      pairs: [[16, 10], [13, 7]],
      from: 20,
      explain: "Each number goes down by 6, so 20 becomes 14.",
      k: 0,
      opts: [
        [14],
        [26, "WP-direction: added 6 instead of taking it away."],
        [13, "IC-offby: subtracted 7 instead of 6."],
        [7, "R-pair: copied the answer from the second pair."],
      ],
    },
  ],

  /*
   * L10: one operation, nothing over 50, needs a times-table fact.
   *
   * FOUR MULTIPLICATIONS AND A SUBTRACTION was the first version of this set,
   * and five items testing one operation is not five items. This runs all four
   * operations and ramps them: addition, subtraction, an easy multiplication, a
   * harder times-table fact, and division last, which is the operation a Grade
   * 4 child is least fluent in.
   */
  "grade-4": [
    {
      rule: "NA-1 single additive (+9)",
      pairs: [[7, 16], [12, 21]],
      from: 20,
      explain: "Each number goes up by 9, so 20 becomes 29.",
      k: 0,
      opts: [
        [29],
        [28, "IC-offby: added 8 instead of 9."],
        [11, "WP-direction: subtracted 9 instead of adding it."],
        [21, "R-pair: copied the answer from the second pair."],
      ],
    },
    {
      rule: "NA-1 single subtractive (-14)",
      pairs: [[30, 16], [45, 31]],
      from: 40,
      explain: "Each number goes down by 14, so 40 becomes 26.",
      k: 0,
      opts: [
        [26],
        [54, "WP-direction: added 14 instead of taking it away."],
        [25, "IC-offby: subtracted 15 instead of 14."],
        [31, "R-pair: copied the answer from the second pair."],
      ],
    },
    {
      rule: "NA-2 single multiplicative (x3)",
      pairs: [[6, 18], [9, 27]],
      from: 12,
      explain: "Each number is multiplied by 3, so 12 becomes 36.",
      k: 0,
      opts: [
        [36],
        [24, "WP-additive: added 12, the gap in the first pair, instead of multiplying."],
        [48, "IC-offby: multiplied by 4 instead of 3."],
        [27, "R-pair: copied the answer from the second pair."],
      ],
    },
    {
      rule: "NA-2 single multiplicative (x7)",
      pairs: [[4, 28], [6, 42]],
      from: 7,
      explain: "Each number is multiplied by 7, so 7 becomes 49.",
      k: 0,
      opts: [
        [49],
        [31, "WP-additive: added 24, the gap in the first pair, instead of multiplying."],
        [42, "R-pair: copied the answer from the second pair."],
        [56, "IC-offby: multiplied by 8 instead of 7."],
      ],
    },
    {
      rule: "NA-2 single division (/6)",
      pairs: [[36, 6], [48, 8]],
      from: 30,
      explain: "Each number is divided by 6, so 30 becomes 5.",
      k: 0,
      opts: [
        [5],
        [24, "WP-inverse: subtracted 6 instead of dividing by it."],
        [6, "IC-offby: divided by 5 instead of 6."],
        [36, "R-echo: copied a number straight out of the first pair."],
      ],
    },
  ],

  /* -- L11: two operations, both small, nothing over 100 ------------------- */
  "grade-5": [
    {
      rule: "NA-3 two-step (x2 then +1)",
      pairs: [[3, 7], [5, 11]],
      from: 8,
      explain: "Double, then add 1: 8 doubles to 16, plus 1 is 17.",
      k: 0,
      opts: [
        [17],
        [16, "IC-firststep: doubled and stopped, forgetting the +1."],
        [9, "IC-secondstep: added 1 and skipped the doubling."],
        [13, "WP-additive: added 4, the gap in the first pair."],
      ],
    },
    {
      rule: "NA-3 two-step (x3 then +2)",
      pairs: [[4, 14], [6, 20]],
      from: 9,
      explain: "Multiply by 3, then add 2: 9 times 3 is 27, plus 2 is 29.",
      k: 0,
      opts: [
        [29],
        [27, "IC-firststep: multiplied and stopped, forgetting the +2."],
        [11, "IC-secondstep: added 2 and skipped the multiplication."],
        [19, "WP-additive: added 10, the gap in the first pair."],
      ],
    },
    {
      rule: "NA-3 two-step (x4 then +1)",
      pairs: [[2, 9], [5, 21]],
      from: 6,
      explain: "Multiply by 4, then add 1: 6 times 4 is 24, plus 1 is 25.",
      k: 0,
      opts: [
        [25],
        [24, "IC-firststep: multiplied and stopped, forgetting the +1."],
        [7, "IC-secondstep: added 1 and skipped the multiplication."],
        [13, "WP-additive: added 7, the gap in the first pair."],
      ],
    },
    {
      rule: "NA-3 two-step (x3 then +1)",
      pairs: [[10, 31], [4, 13]],
      from: 7,
      explain: "Multiply by 3, then add 1: 7 times 3 is 21, plus 1 is 22.",
      k: 0,
      opts: [
        [22],
        [21, "IC-firststep: multiplied and stopped, forgetting the +1."],
        [8, "IC-secondstep: added 1 and skipped the multiplication."],
        [28, "WP-additive: added 21, the gap in the first pair."],
      ],
    },
    {
      rule: "NA-3 two-step (x2 then +2)",
      pairs: [[12, 26], [9, 20]],
      from: 15,
      explain: "Double, then add 2: 15 doubles to 30, plus 2 is 32.",
      k: 0,
      opts: [
        [32],
        [30, "IC-firststep: doubled and stopped, forgetting the +2."],
        [17, "IC-secondstep: added 2 and skipped the doubling."],
        [29, "WP-additive: added 14, the gap in the first pair."],
      ],
    },
  ],

  /* -- L12: two operations, one a division or a larger multiplier ---------- */
  "grade-6": [
    {
      rule: "NA-4 two-step (x3 then -2)",
      pairs: [[6, 16], [9, 25]],
      from: 11,
      explain: "Multiply by 3, then take 2 away: 11 times 3 is 33, minus 2 is 31.",
      k: 0,
      opts: [
        [31],
        [33, "IC-firststep: multiplied and stopped, forgetting the -2."],
        [9, "IC-secondstep: subtracted 2 and skipped the multiplication."],
        [21, "WP-additive: added 10, the gap in the first pair."],
      ],
    },
    {
      rule: "NA-5 division then adjustment (/3 then +2)",
      pairs: [[24, 10], [36, 14]],
      from: 48,
      explain: "Divide by 3, then add 2: 48 over 3 is 16, plus 2 is 18.",
      k: 0,
      opts: [
        [18],
        [16, "IC-firststep: divided and stopped, forgetting the +2."],
        [50, "IC-secondstep: added 2 and skipped the division."],
        [20, "IC-offby: divided correctly, then added 4 rather than 2."],
      ],
    },
    {
      rule: "NA-4 two-step (x5 then -2)",
      pairs: [[7, 33], [5, 23]],
      from: 9,
      explain: "Multiply by 5, then take 2 away: 9 times 5 is 45, minus 2 is 43.",
      k: 0,
      opts: [
        [43],
        [45, "IC-firststep: multiplied and stopped, forgetting the -2."],
        [35, "WP-additive: added 26, the gap in the first pair."],
        [41, "IC-offby: subtracted 4 rather than 2."],
      ],
    },
    {
      rule: "NA-5 division then adjustment (/4 then +3)",
      pairs: [[60, 18], [44, 14]],
      from: 80,
      explain: "Divide by 4, then add 3: 80 over 4 is 20, plus 3 is 23.",
      k: 0,
      opts: [
        [23],
        [20, "IC-firststep: divided and stopped, forgetting the +3."],
        [83, "IC-secondstep: added 3 and skipped the division."],
        [17, "WP-direction: divided correctly, then subtracted the 3 instead of adding it."],
      ],
    },
    {
      rule: "NA-4 two-step (x3 then -3)",
      pairs: [[8, 21], [12, 33]],
      from: 15,
      explain: "Multiply by 3, then take 3 away: 15 times 3 is 45, minus 3 is 42.",
      k: 0,
      opts: [
        [42],
        [45, "IC-firststep: multiplied and stopped, forgetting the -3."],
        [12, "IC-secondstep: subtracted 3 and skipped the multiplication."],
        [28, "WP-additive: added 13, the gap in the first pair."],
      ],
    },
  ],

  /* -- L13/14: non-unit ratios and two-steps that need a held intermediate - */
  "grade-7-8": [
    {
      rule: "NA-6 non-unit ratio (x3/2)",
      pairs: [[8, 12], [14, 21]],
      from: 20,
      explain: "Each number becomes one and a half times itself: 20 becomes 30.",
      k: 0,
      opts: [
        [30],
        [24, "WP-additive: added 4, the gap in the first pair, instead of scaling."],
        [10, "IC-firststep: halved and stopped, without the multiplication by 3."],
        [60, "IC: multiplied by 3 and forgot to halve."],
      ],
    },
    {
      rule: "NA-6 non-unit ratio (x2/3)",
      pairs: [[45, 30], [21, 14]],
      from: 36,
      explain: "Each number becomes two thirds of itself: 36 becomes 24.",
      k: 0,
      opts: [
        [24],
        [12, "IC-firststep: divided by 3 and stopped, without multiplying back by 2."],
        [21, "WP-additive: subtracted 15, the gap in the first pair, instead of scaling."],
        [54, "WP-inverse: applied the ratio upside down, scaling up by three halves."],
      ],
    },
    {
      rule: "NA-4 two-step (x4 then -2)",
      pairs: [[7, 26], [4, 14]],
      from: 11,
      explain: "Multiply by 4, then take 2 away: 11 times 4 is 44, minus 2 is 42.",
      k: 0,
      opts: [
        [42],
        [44, "IC-firststep: multiplied and stopped, forgetting the -2."],
        [30, "WP-additive: added 19, the gap in the first pair."],
        [9, "IC-secondstep: subtracted 2 and skipped the multiplication."],
      ],
    },
    {
      rule: "NA-6 non-unit ratio (x3/4)",
      pairs: [[80, 60], [48, 36]],
      from: 120,
      explain: "Each number becomes three quarters of itself: 120 becomes 90.",
      k: 0,
      opts: [
        [90],
        [30, "IC-firststep: divided by 4 and stopped, without multiplying back by 3."],
        [160, "WP-inverse: applied the ratio upside down, scaling up by four thirds."],
        [100, "WP-additive: subtracted 20, the gap in the first pair, instead of scaling."],
      ],
    },
    {
      rule: "NA-4 two-step (x3 then +5)",
      pairs: [[13, 44], [9, 32]],
      from: 16,
      explain: "Multiply by 3, then add 5: 16 times 3 is 48, plus 5 is 53.",
      k: 0,
      opts: [
        [53],
        [48, "IC-firststep: multiplied and stopped, forgetting the +5."],
        [21, "IC-secondstep: added 5 and skipped the multiplication."],
        [47, "WP-additive: added 31, the gap in the first pair."],
      ],
    },
  ],
};

/* =========================================================================
 * THE RAMP
 * =========================================================================
 * Each bank is ordered so difficulty rises across it: the first items are
 * accessible to a typical child in that grade, and the last two are the ones
 * that separate. The banks were first written to a flat spec, which produced
 * fifteen items at one level and nothing that told a child who has got it from
 * a child who has not.
 *
 * These are indices into the arrays above, which stay in authoring order so a
 * change to an item does not silently move it in the test. Reading a row tells
 * you the ramp; reading the array tells you the content.
 *
 * WHAT MAKES ONE HARDER THAN THE NEXT, per type:
 *
 *   verbal analogy   how concrete the terms are, and how many steps the
 *                    relation takes. Two things you can point at is the floor;
 *                    two abstract nouns is the ceiling.
 *   number analogy   the operation. Addition, then subtraction, then
 *                    multiplication, then two steps, then a non-unit ratio.
 *   figure matrix    the number of rules running at once, which is set in
 *                    scripts/matriks/generate.R and the local engine beside it.
 */
const ORDER = {
  "grade-3": { va: [2, 0, 3, 1, 4], na: [0, 3, 2, 4, 1] },
  "grade-4": { va: [0, 2, 1, 4, 3], na: [0, 1, 2, 3, 4] },
  "grade-5": { va: [0, 2, 3, 1, 4], na: [0, 4, 3, 1, 2] },
  "grade-6": { va: [0, 2, 1, 3, 4], na: [0, 4, 2, 1, 3] },
  "grade-7-8": { va: [4, 0, 1, 2, 3], na: [2, 4, 0, 1, 3] },
};

/* =========================================================================
 * Where each key sits. Balanced within each bank at 4/4/4/3 with no run of
 * three, and the figure-matrix column is whatever scripts/matriks put there.
 *
 * Indexed by SLOT, not by item, so reordering the ramp above leaves the
 * position balance untouched.
 * ========================================================================= */
const KEYS = {
  "grade-3": { va: ["B", "B", "C", "D", "A"], na: ["A", "C", "A", "B", "C"] },
  "grade-4": { va: ["A", "C", "D", "A", "C"], na: ["D", "B", "C", "B", "A"] },
  "grade-5": { va: ["B", "A", "D", "C", "B"], na: ["A", "C", "D", "B", "A"] },
  "grade-6": { va: ["B", "D", "A", "B", "C"], na: ["C", "C", "B", "D", "A"] },
  "grade-7-8": { va: ["A", "C", "B", "A", "C"], na: ["B", "A", "C", "D", "B"] },
};

const BANKS = [
  { id: "grade-3", grades: [3], level: "L9", title: "The 5-Minute Grade 3 Test", fm: "g3", export: "GRADE_3_TEST" },
  { id: "grade-4", grades: [4], level: "L10", title: "The 5-Minute Grade 4 Test", fm: "g4", export: "GRADE_4_TEST" },
  { id: "grade-5", grades: [5], level: "L11", title: "The 5-Minute Grade 5 Test", fm: "g5", export: "GRADE_5_TEST" },
  { id: "grade-6", grades: [6], level: "L12", title: "The 5-Minute Grade 6 Test", fm: "g6", export: "GRADE_6_TEST" },
  { id: "grade-7-8", grades: [7, 8], level: "L13/14", title: "The 5-Minute Grade 7 and 8 Test", fm: "g78", export: "GRADE_7_8_TEST" },
];

const MARKER = {
  "grade-3": "Both terms name something you can point at; one operation on numbers under 20; exactly one thing changes across a row of the grid.",
  "grade-4": "One term may be a place or a role; one operation needing a times-table fact; two things change in the grid, independently.",
  "grade-5": "An instrument, a measurement or a cause-and-effect chain appears; two operations on numbers under 100; rotation appears in the grid, in quarter turns.",
  "grade-6": "The solver has to rank on a scale or handle an opposite; two operations, one of them a division; the grid turns by less than a quarter turn, or carries three rules.",
  "grade-7-8": "At least one abstract noun per verbal item; non-unit ratios like three halves; the grid combines two cells with a logical operator.",
};

/* =========================================================================
 * Emitting
 * ========================================================================= */

const esc = (s) => s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
const ID = ["A", "B", "C", "D"];

/** Reorder a written option list so the key lands on `keyLetter`. */
function place(opts, keyIndex, keyLetter) {
  const key = opts[keyIndex];
  const rest = opts.filter((_, i) => i !== keyIndex);
  return ID.map((id) => (id === keyLetter ? { id, o: key } : { id, o: rest.shift() }));
}

function emitTextOptions(placed, render) {
  return placed
    .map(({ id, o }) => {
      const text = render(o[0]);
      return o[1]
        ? `        {\n          id: "${id}",\n          text: "${esc(text)}",\n          why: "${esc(o[1])}",\n        },`
        : `        { id: "${id}", text: "${esc(text)}" },`;
    })
    .join("\n");
}

const fmtEl = (el) => {
  const parts = [`shape: "${el.shape}"`];
  if (el.filled) parts.push("filled: true");
  if (el.color) parts.push(`color: "${el.color}"`);
  if (el.rotate) parts.push(`rotate: ${el.rotate}`);
  if (el.size !== undefined) parts.push(`size: ${el.size}`);
  if (el.x !== undefined) parts.push(`x: ${el.x}`, `y: ${el.y}`);
  return `{ ${parts.join(", ")} }`;
};

function fmtCell(cell, indent) {
  const oneLine = `{ shapes: [${cell.shapes.map(fmtEl).join(", ")}] }`;
  if (oneLine.length + indent.length <= 96) return oneLine;
  return `{\n${indent}  shapes: [\n${cell.shapes
    .map((e) => `${indent}    ${fmtEl(e)},`)
    .join("\n")}\n${indent}  ],\n${indent}}`;
}

/**
 * The error sentence for a matRiks distractor, from its family tag and the
 * rules actually running in that matrix.
 */
function figureWhy(tag, rules) {
  const rotating = rules.includes("rotate");
  const shading = rules.includes("shade");
  const sizing = rules.includes("size");
  switch (tag) {
    case "wp_copy":
      return "WP-copy: the figure the grid starts from, with the rule not applied at all.";
    case "wp_matrix":
      return "WP-matrix: a cell borrowed from elsewhere in the grid rather than worked out.";
    case "wp-union":
      return "WP-union: kept every shape that appears in either of the first two cells. That is 'or', not the rule the rows actually use.";
    case "ic-dropped":
      return "IC-inc: applied the rule and then dropped one of the shapes it produces.";
    case "ic_shape":
      return rules.includes("shape")
        ? "IC-shape: everything else right, and the shape one step behind where the row had got to."
        : "IC-shape: right on the rule, but the shape has changed, which this grid holds constant.";
    case "ic_count":
      return rules.includes("count")
        ? "IC-count: everything else right, and one shape too many."
        : "IC-count: right on the rule, but the number of shapes has changed, which this grid holds constant.";
    case "ic_shade":
      return rules.includes("shade")
        ? "IC-shade: everything else right, and the shading one step behind."
        : "IC-shade: right on the rule, but the shading has changed, which this grid holds constant.";
    case "ic_flip":
      return rotating
        ? "IC-flip: everything else right, and the turn carried one step too far."
        : "IC-flip: right on the rule, but the figure has been turned, which nothing in this grid does.";
    case "ic_neg":
      return shading
        ? "IC-neg: everything else right, and the shading one step out."
        : "IC-neg: right on the rule, but the shading has changed, which this grid holds constant.";
    case "ic_size":
      return sizing
        ? "IC-size: everything else right, and the size off the ladder the grid uses."
        : "IC-size: right on the rule, but the size has changed, which this grid holds constant.";
    case "r_left":
      return "R-left: copies the cell immediately to the left. Left-perseveration is the commonest matrix error.";
    case "r_top":
      return "R-top: copies the cell immediately above.";
    case "r_diag":
      return "R-diag: copies the cell diagonally up and to the left.";
    default:
      return `Distractor family ${tag}.`;
  }
}

const LOGIC_PHRASE = {
  XOR: "the third cell keeps the shapes that appear in exactly one of the first two, and drops the ones in both",
  AND: "the third cell keeps only the shapes that appear in both of the first two",
  OR: "the third cell keeps every shape that appears in either of the first two",
};

/**
 * What a rule does, READ OFF THE CELLS IT PRODUCED rather than assumed from its
 * name. A size rule can run either way and a shape rule runs through whichever
 * three shapes this matrix happens to use, so a fixed phrase per rule name gets
 * it wrong about half the time. `a`, `b` and `c` are the three cells the rule
 * moves through.
 */
function rulePhrase(rule, a, b, c) {
  const count = (cell) => cell.shapes.length;
  const size = (cell) => cell.shapes[0]?.size ?? 0;
  const shape = (cell) => cell.shapes[0]?.shape ?? "";

  switch (rule) {
    case "shade":
      return "the shading goes from white to grey to solid";
    case "size":
      return size(c) < size(a) ? "the figure gets smaller" : "the figure gets bigger";
    case "rotate":
      return "the figure turns a step further round";
    case "shape":
      return `the shape goes ${shape(a)}, ${shape(b)}, ${shape(c)}`;
    case "count":
      return count(c) > count(a)
        ? `the number of shapes goes ${count(a)}, ${count(b)}, ${count(c)}`
        : `the number of shapes drops from ${count(a)} to ${count(b)} to ${count(c)}`;
    default:
      return rule;
  }
}

function figureExplanation(m) {
  const h = m.rules.h.filter((r) => r !== "identity");
  const v = m.rules.v.filter((r) => r !== "identity");
  const cells = m.cells;
  const row = [cells[0], cells[1], cells[2]];
  const col = [cells[0], cells[3], cells[6]];
  const parts = [];

  const logic = [...h, ...v].find((r) => LOGIC_PHRASE[r]);
  if (logic) return `Along each row, ${LOGIC_PHRASE[logic]}.`;

  if (h.length) parts.push(`Across a row, ${h.map((r) => rulePhrase(r, ...row)).join(" and ")}.`);
  if (v.length) parts.push(`Down a column, ${v.map((r) => rulePhrase(r, ...col)).join(" and ")}.`);
  parts.push(
    h.length && v.length
      ? "The missing cell is whatever both of those give at once."
      : "Nothing else changes.",
  );
  return parts.join(" ");
}

function emitFigureItem(id, m, ruleId) {
  const rules = [...m.rules.h, ...m.rules.v].filter((r) => r !== "identity");
  // The first EIGHT. matRiks hands back all nine, and the ninth is the answer —
  // shipping it as a stimulus cell would print the key on the question.
  const cells = m.cells
    .slice(0, 8)
    .map((c) => `        ${fmtCell(c, "        ")},`)
    .join("\n");
  const options = m.options
    .map((o) => {
      const fig = fmtCell(o.fig, "        ");
      return o.tag === "correct"
        ? `        { id: "${o.id}", fig: ${fig} },`
        : `        {\n          id: "${o.id}",\n          fig: ${fmtCell(o.fig, "          ")},\n          why: "${esc(figureWhy(o.tag, rules))}",\n        },`;
    })
    .join("\n");

  return `    {
      id: "${id}",
      kind: "figure",
      tier: "FIGURE MATRIX",
      domain: "spatial",
      rule: "${esc(ruleId)}",
      prompt: "Which figure completes the grid?",
      layout: "matrix",
      cells: [
${cells}
      ],
      options: [
${options}
      ],
      explanation: "${esc(figureExplanation(m))}",
      answer: "${m.answer}",
    },`;
}

const FM_RULE_ID = {
  shape: "FM-1 shape identity",
  count: "FM-2 element count",
  shade: "FM-3 shading",
  size: "FM-4 size",
  rotate: "FM-6 rotation",
  XOR: "FM-12 logical combination (exclusive or)",
  AND: "FM-12 logical combination (and)",
  OR: "FM-12 logical combination (or)",
};

function fmRuleId(m) {
  const h = m.rules.h.filter((r) => r !== "identity").map((r) => FM_RULE_ID[r] ?? r);
  const v = m.rules.v.filter((r) => r !== "identity").map((r) => FM_RULE_ID[r] ?? r);
  const bits = [];
  if (h.length) bits.push(`${h.join(" + ")} across rows`);
  if (v.length) bits.push(`${v.join(" + ")} down columns`);
  const n = m.ruleCount;
  // Which engine produced it is part of the provenance: the two rules matRiks
  // cannot express here come from the local generator beside it.
  const engine = m.engine === "local" ? "generated" : "matRiks";
  return `${bits.join(", ")} (${engine}, ${n} rule${n === 1 ? "" : "s"})`;
}

/* -- build ---------------------------------------------------------------- */

for (const bank of BANKS) {
  const order = ORDER[bank.id];
  const va = order.va.map((i) => VA[bank.id][i]);
  const na = order.na.map((i) => NA[bank.id][i]);
  const keys = KEYS[bank.id];
  const items = [];

  for (let i = 0; i < 5; i++) {
    const n = (k) => String(k).padStart(2, "0");

    /* verbal analogy */
    {
      const it = va[i];
      const placed = place(it.opts, it.k, keys.va[i]);
      items.push(`    {
      id: "${bank.id}-${n(i * 3 + 1)}",
      kind: "text",
      tier: "VERBAL ANALOGY",
      domain: "verbal",
      rule: "${esc(it.rule)}",
      prompt: "Complete the analogy.",
      stem: "${esc(it.stem)}",
      options: [
${emitTextOptions(placed, String)}
      ],
      explanation: "${esc(it.explain)}",
      answer: "${keys.va[i]}",
    },`);
    }

    /* number analogy */
    {
      const it = na[i];
      const placed = place(it.opts, it.k, keys.na[i]);
      const stem = `${it.pairs.map(([a, b]) => `${a} \\u2192 ${b}`).join("\\n")}\\n${it.from} \\u2192 ?`;
      items.push(`    {
      id: "${bank.id}-${n(i * 3 + 2)}",
      kind: "text",
      tier: "NUMBER ANALOGY",
      domain: "quantitative",
      rule: "${esc(it.rule)}",
      prompt: "What number completes the last pair?",
      stem: "${stem}",
      options: [
${emitTextOptions(placed, String)}
      ],
      explanation: "${esc(it.explain)}",
      answer: "${keys.na[i]}",
    },`);
    }

    /* figure matrix */
    {
      const m = figures[`${bank.fm}-m${i + 1}`];
      items.push(emitFigureItem(`${bank.id}-${n(i * 3 + 3)}`, m, fmRuleId(m)));
    }
  }

  const gradesLine = bank.grades.length === 1 ? `grades: [${bank.grades[0]}],` : `grades: [${bank.grades.join(", ")}],`;

  const file = `/**
 * ${bank.title.toUpperCase().replace("THE ", "")} — 15 items, 5 minutes, band ${bank.level}.
 *
 * ===========================================================================
 * WHERE THESE ITEMS COME FROM
 * ===========================================================================
 * Every item is generated from a rule in docs/test-content/rule-taxonomy.md and
 * carries that rule's id. None of them started as a real published item with
 * the nouns swapped, which is a derivative work whatever the surface says.
 *
 * The five FIGURE MATRICES come out of \`matRiks\` (MIT), which CONSTRUCTS the
 * ninth cell from the rules rather than being told what it is, so their key
 * cannot be mistyped. See scripts/matriks/generate.R.
 *
 * Assembled once by scripts/build-child-banks.mjs. THIS FILE IS NOW THE SOURCE
 * OF TRUTH: nothing regenerates it at build time, and editing an item here is
 * the right way to change it.
 *
 * ===========================================================================
 * WHAT MAKES THIS BAND THIS BAND
 * ===========================================================================
 * ${MARKER[bank.id]}
 *
 * The markers are checkable by eye, which is the point of them: you should be
 * able to tell a grade 3 item from a grade 6 item by looking at it, without
 * knowing what the author intended. What they CANNOT tell you is whether a
 * grade 5 item is actually at the median for a grade 5 child — that needs
 * response data from children, and there is none yet.
 *
 * ===========================================================================
 * THE STRUCTURE
 * ===========================================================================
 * 5 verbal analogies, 5 number analogies, 5 figure matrices, interleaved so no
 * two neighbours share a type. That split is not an arbitrary truncation: the
 * publisher of the instrument this mirrors sells a short form that keeps only
 * the analogies subtest from each of its three batteries, which is their own
 * answer to "what is the minimum viable version of this".
 *
 * Fifteen items in five minutes is twenty seconds each, and that is why the
 * stems are short. A stem a child in this grade cannot read in six seconds
 * leaves no time to reason, which turns a reasoning item into a reading-speed
 * item.
 *
 * NO LETTER SERIES: the child quantitative battery uses numbers. No paper
 * folding: it is available to child tests but is not part of this structure.
 *
 * Every wrong option carries \`why\`, the specific mistake that produces it.
 */
import type { Test } from "../types";

export const ${bank.export}: Test = {
  id: "${bank.id}",
  audience: "child",
  bank: "${bank.id}",
  ${gradesLine}
  band: "${bank.id}",
  title: "${bank.title}",
  durationSeconds: 5 * 60,
  allowBack: true,
  items: [
${items.join("\n")}
  ],
};
`;

  writeFileSync(join(ROOT, "lib", "test", "tests", `${bank.id}.ts`), file);
  console.log(`wrote lib/test/tests/${bank.id}.ts (${items.length} items)`);
}
