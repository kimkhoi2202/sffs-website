/**
 * THE ADULT TEST — 50 items, 15 minutes, one-way.
 *
 * ===========================================================================
 * WHERE THESE ITEMS COME FROM
 * ===========================================================================
 * Every item is generated from a rule in docs/test-content/rule-taxonomy.md and
 * carries that rule's id in its `rule` field. None of them started life as a
 * real published item with the nouns swapped — that is a derivative work and
 * paraphrase is not a defence. The taxonomy is the provenance record: pick any
 * item here and the recipe that produced it is written down there, ahead of it.
 *
 * The three FIGURE MATRICES are the exception to "hand-authored", and
 * deliberately so. They come out of `matRiks` (MIT), which CONSTRUCTS the ninth
 * cell from the rules rather than being told what it is, so their answer key
 * cannot be mistyped. See scripts/matriks/generate.R.
 *
 * ===========================================================================
 * EVERY WRONG OPTION NAMES A MISTAKE
 * ===========================================================================
 * The `why` on each distractor is the sentence "a solver who picks this made
 * THIS error". It is the one discipline that separates a test from a formality:
 * an option nobody can write that sentence for is decorative, and three
 * decorative options turn a four-way item into a one-way one. Composition per
 * item is Correct + Wrong-Principle + Incomplete-Correlate + (Repetition or
 * Difference), and never two Difference-family options, because a Difference
 * option can be eliminated WITHOUT solving the item and two of them halve the
 * item's information.
 *
 * ===========================================================================
 * THE STRUCTURE
 * ===========================================================================
 * 50 questions, 15 minutes, roughly 18 seconds an item, which almost nobody
 * sustains. That is the design rather than a flaw — how far you get is part of
 * what it measures. It also constrains every item: difficulty has to come from
 * the reasoning step and never from the reading time, so the stems stay short.
 *
 * ONE INTERLEAVED STREAM, NOT SECTIONS. No two consecutive items share a type,
 * no three share a domain, and difficulty climbs in five blocks of ten:
 * warm-up, easy-moderate, moderate, hard, very hard. The seating-arrangement
 * item is at 46 because it is the most time-expensive item on the test and
 * placing it early would wreck the pacing of everyone who does not skip it.
 *
 * Domain mix: 18 verbal, 16 quantitative, 11 spatial, 5 logic. Sentence
 * completion is the largest single type at 9.
 *
 * ONE POINT PER ITEM. No weighting, no penalty for a wrong answer.
 *
 * `allowBack: false` — see the field's note in lib/test/types.ts. A one-way
 * pass is part of what the format measures, not an interaction oversight.
 *
 * NO PAPER FOLDING. It is a child item type only.
 */
import type { Test } from "../types";

export const ADULT_TEST: Test = {
  id: "adult",
  audience: "adult",
  band: "adult",
  title: "The 15-Minute Test",
  durationSeconds: 15 * 60,
  allowBack: false,
  items: [
    /* ===================================================================== */
    /* BLOCK 1 (1-10) — warm-up. Single-rule items, ~12 seconds each.        */
    /* ===================================================================== */
    {
      id: "a01",
      kind: "text",
      tier: "SENTENCE COMPLETION",
      domain: "verbal",
      rule: "SC-1a support + SC-3b causal + SC-2a, tier 1",
      prompt: "Which word completes the sentence?",
      stem: "Nobody had watered the garden for three weeks, so the soil was completely ______.",
      options: [
        {
          id: "A",
          text: "damp",
          why: "WP-direction: matched the valence of 'watered' without noticing the sentence says it did not happen.",
        },
        { id: "B", text: "dry" },
        {
          id: "C",
          text: "rich",
          why: "WP-assoc: a garden-register word, keyword-matched to 'garden' rather than licensed by the three weeks without water.",
        },
        {
          id: "D",
          text: "cool",
          why: "D: a weather word from the right field, derivable from no part of the sentence.",
        },
      ],
      explanation: "Three weeks with no water leaves soil dry. 'So' means the blank agrees with the cause.",
      answer: "B",
    },
    {
      id: "a02",
      kind: "series",
      tier: "NUMBER SERIES",
      domain: "quantitative",
      rule: "NS-1 constant difference (+4)",
      prompt: "What number comes next?",
      seq: ["7", "11", "15", "19", "?"],
      options: [
        { id: "A", text: "22", why: "IC-offby: right rule, one out." },
        {
          id: "B",
          text: "24",
          why: "WP-growing: assumed the gaps were themselves growing (4 then 5), which is the commonest wrong rule for an arithmetic series.",
        },
        {
          id: "C",
          text: "27",
          why: "WP-step: took the gap between alternate terms (8) as the step.",
        },
        { id: "D", text: "23" },
      ],
      explanation: "Each number is 4 more than the one before, so 19 + 4 = 23.",
      answer: "D",
    },
    {
      id: "a03",
      kind: "text",
      tier: "ATTENTION TO DETAIL",
      domain: "verbal",
      rule: "AD-1 exact match, edit distance 1, short string",
      prompt: "Which code exactly matches KD-40715?",
      stem: "KD-40715",
      options: [
        { id: "A", text: "KD-40715" },
        {
          id: "B",
          text: "KD-40175",
          why: "IC-transpose: two adjacent digits swapped mid-string, the position a reader is least likely to check.",
        },
        {
          id: "C",
          text: "KD-4O715",
          why: "IC-confuse: the zero replaced by a capital O, the hardest single-character substitution to see.",
        },
        {
          id: "D",
          text: "KB-40715",
          why: "IC-initial: the second letter changed. Easiest to catch, so it is the option a solver who checked only the start rejects last.",
        },
      ],
      explanation: "Only A is character-for-character identical.",
      answer: "A",
    },
    {
      id: "a04",
      kind: "text",
      tier: "WORD PROBLEM",
      domain: "quantitative",
      rule: "WP-1 single operation (division)",
      prompt: "Work out the answer.",
      stem: "Six people share 84 tokens equally. How many tokens does each person get?",
      options: [
        { id: "A", text: "12", why: "IC-offby: divided by seven rather than six." },
        {
          id: "B",
          text: "78",
          why: "WP-inverse: subtracted the group size instead of dividing by it.",
        },
        { id: "C", text: "14" },
        {
          id: "D",
          text: "90",
          why: "WP-inverse: added the group size instead of dividing by it.",
        },
      ],
      explanation: "84 shared between 6 is 14 each.",
      answer: "C",
    },
    {
      id: "a05",
      kind: "text",
      tier: "VERBAL ANALOGY",
      domain: "verbal",
      rule: "VA-R9 instrument to what it measures, tier 1-2",
      prompt: "Complete the analogy.",
      stem: "RULER is to LENGTH as SCALE is to ?",
      options: [
        {
          id: "A",
          text: "volume",
          why: "WP-relation: a physical quantity, but the one a measuring jug reads rather than the one a scale reads.",
        },
        { id: "B", text: "weight" },
        {
          id: "C",
          text: "distance",
          why: "R-echo: the quantity the FIRST pair names, restated. Picked by a solver who completed the stem instead of the analogy.",
        },
        {
          id: "D",
          text: "kitchen",
          why: "D: where a scale is often found. Same field, no relation to the stem's.",
        },
      ],
      explanation: "A ruler measures length; a scale measures weight.",
      answer: "B",
    },
    {
      id: "a06",
      kind: "figure",
      tier: "VISUAL ODD ONE OUT",
      domain: "spatial",
      rule: "OO fill, one attribute varied, all others held constant",
      prompt: "Which figure does not belong?",
      layout: "odd-one-out",
      cells: [],
      options: [
        { id: "A", fig: { shapes: [{ shape: "square", filled: true }] }, why: "One of the four filled figures." },
        { id: "B", fig: { shapes: [{ shape: "triangle", filled: true }] }, why: "One of the four filled figures." },
        { id: "C", fig: { shapes: [{ shape: "diamond" }] } },
        { id: "D", fig: { shapes: [{ shape: "star", filled: true }] }, why: "One of the four filled figures." },
        { id: "E", fig: { shapes: [{ shape: "cross", filled: true }] }, why: "One of the four filled figures." },
      ],
      explanation: "Four are filled in and one is not. Every figure is a different shape and the same size, so fill is the only thing that splits them four against one.",
      answer: "C",
    },
    {
      id: "a07",
      kind: "table",
      tier: "TABLES AND GRAPHS",
      domain: "quantitative",
      rule: "TG-2 compare two cells",
      prompt: "How many more boxes were packed on Tuesday than on Wednesday?",
      caption: "Boxes packed each day",
      data: {
        type: "bar",
        unit: "boxes",
        bars: [
          { label: "Mon", value: 12 },
          { label: "Tue", value: 18 },
          { label: "Wed", value: 9 },
          { label: "Thu", value: 15 },
        ],
      },
      options: [
        { id: "A", text: "9" },
        {
          id: "B",
          text: "3",
          why: "WP-cell: compared Tuesday with Thursday, the next-tallest bar, rather than with Wednesday.",
        },
        {
          id: "C",
          text: "6",
          why: "WP-cell: compared Tuesday with Monday rather than with Wednesday.",
        },
        {
          id: "D",
          text: "27",
          why: "WP-inverse: added the two bars instead of taking the difference.",
        },
      ],
      explanation: "Tuesday is 18 and Wednesday is 9, a difference of 9.",
      answer: "A",
    },
    {
      id: "a08",
      kind: "text",
      tier: "SENTENCE COMPLETION",
      domain: "verbal",
      rule: "SC-1b contrast + SC-3c contrastive + SC-2a, tier 1-2",
      prompt: "Which word completes the sentence?",
      stem: "Although the room was crowded, it stayed remarkably ______ until the doors opened.",
      options: [
        {
          id: "A",
          text: "noisy",
          why: "WP-direction: matched what a crowded room implies and failed to reverse across 'although'.",
        },
        { id: "B", text: "quiet" },
        {
          id: "C",
          text: "empty",
          why: "IC-degree: right direction, but it overshoots into contradicting 'crowded' rather than contrasting with it.",
        },
        {
          id: "D",
          text: "warm",
          why: "D: a room-register word, licensed by nothing in the sentence.",
        },
      ],
      explanation: "'Although' reverses the direction: a crowded room would normally be loud, so the surprise is that it was quiet.",
      answer: "B",
    },
    {
      id: "a09",
      kind: "figure",
      tier: "FIGURE SERIES",
      domain: "spatial",
      rule: "FS rotation, one rule on a single axis (FM-6 applied linearly)",
      prompt: "Which figure comes next?",
      layout: "matrix",
      cells: [
        { shapes: [{ shape: "arrow" }] },
        { shapes: [{ shape: "arrow", rotate: 45 }] },
        { shapes: [{ shape: "arrow", rotate: 90 }] },
      ],
      options: [
        {
          id: "A",
          fig: { shapes: [{ shape: "arrow", rotate: 90 }] },
          why: "R-last: repeats the figure immediately before the gap without applying the turn.",
        },
        {
          id: "B",
          fig: { shapes: [{ shape: "arrow", rotate: 180 }] },
          why: "IC-degree: right rule, applied twice — turned two steps instead of one.",
        },
        {
          id: "C",
          fig: { shapes: [{ shape: "arrow", rotate: 315 }] },
          why: "IC-flip: right size of turn, wrong direction.",
        },
        { id: "D", fig: { shapes: [{ shape: "arrow", rotate: 135 }] } },
      ],
      explanation: "The arrow turns an eighth of a full turn clockwise each time.",
      answer: "D",
    },
    {
      id: "a10",
      kind: "text",
      tier: "WORD PROBLEM",
      domain: "quantitative",
      rule: "WP-2 two operations, sequential",
      prompt: "Work out the answer.",
      stem: "A tank holds 200 liters and starts full. 45 liters are drawn off in the morning and 68 in the afternoon. How much is left?",
      options: [
        { id: "A", text: "87" },
        {
          id: "B",
          text: "155",
          why: "IC-partial: subtracted the morning draw and stopped, forgetting the second operation.",
        },
        {
          id: "C",
          text: "113",
          why: "IC-partial: the total drawn off. A correct intermediate value reported as the final answer, which is the single most tempting distractor in any multi-step problem.",
        },
        {
          id: "D",
          text: "313",
          why: "WP-inverse: added the withdrawals to the tank instead of taking them away.",
        },
      ],
      explanation: "200 − 45 − 68 = 87 liters.",
      answer: "A",
    },

    /* ===================================================================== */
    /* BLOCK 2 (11-20) — easy-moderate. Two-step arithmetic, contrast items. */
    /* ===================================================================== */
    {
      id: "a11",
      kind: "text",
      tier: "LOGIC",
      domain: "logic",
      rule: "SY-3 some A are B; x is A — cannot be determined",
      prompt: "If the statements are true, is the conclusion true?",
      stem: "Some engineers are cyclists.\nRowan is an engineer.\nTherefore: Rowan is a cyclist.",
      options: [
        {
          id: "A",
          text: "True",
          why: "WP-overgeneralise: read 'some' as 'all'. The commonest quantifier error there is.",
        },
        {
          id: "B",
          text: "False",
          why: "WP-negate: treated a gap in the argument as a refutation. Nothing rules Rowan out either.",
        },
        { id: "C", text: "Cannot tell" },
      ],
      explanation: "'Some engineers are cyclists' leaves it open whether Rowan is one of them. Neither conclusion follows.",
      answer: "C",
    },
    {
      id: "a12",
      kind: "text",
      tier: "ANTONYM",
      domain: "verbal",
      rule: "AN single-dimension opposition (duration), tier 2",
      prompt: "Which word means most nearly the opposite?",
      stem: "TEMPORARY",
      options: [
        {
          id: "A",
          text: "delayed",
          why: "D: a time word from the same field, orthogonal to how long something lasts.",
        },
        { id: "B", text: "permanent" },
        {
          id: "C",
          text: "fleeting",
          why: "WP-synonym: a near-synonym of the stem. Picked by a solver who found the right dimension and went the wrong way along it.",
        },
        {
          id: "D",
          text: "frequent",
          why: "IC-partial: opposed on a related time dimension — how OFTEN rather than how LONG.",
        },
      ],
      explanation: "Temporary means lasting a short time; permanent means lasting indefinitely.",
      answer: "B",
    },
    {
      id: "a13",
      kind: "series",
      tier: "NUMBER SERIES",
      domain: "quantitative",
      rule: "NS-3 two interleaved sequences (+3 and −3)",
      prompt: "What number comes next?",
      seq: ["3", "20", "6", "17", "9", "?"],
      options: [
        {
          id: "A",
          text: "12",
          why: "WP-series: continued the rising sequence when the gap falls in the falling one.",
        },
        {
          id: "B",
          text: "17",
          why: "R-last: repeated the falling sequence's previous value without applying its step.",
        },
        { id: "C", text: "14" },
        { id: "D", text: "13", why: "IC-offby: right sequence, right direction, one out." },
      ],
      explanation: "Two sequences alternate: 3, 6, 9 going up by 3, and 20, 17 going down by 3. The next term belongs to the falling one: 17 − 3 = 14.",
      answer: "C",
    },
    {
      id: "a14",
      kind: "text",
      tier: "SENTENCE COMPLETION",
      domain: "verbal",
      rule: "SC-1d restatement + SC-3d enumerative + SC-2a, tier 2",
      prompt: "Which word completes the sentence?",
      stem: "The audit was exhaustive: every claim was tested, every source named, and every number ______ twice.",
      options: [
        { id: "A", text: "checked" },
        {
          id: "B",
          text: "printed",
          why: "D: a document-register word that fits the slot grammatically and shares nothing with the property the list is building.",
        },
        {
          id: "C",
          text: "disputed",
          why: "WP-direction: a real thing to do to a number, but it breaks the list's direction — the other items confirm, they do not challenge.",
        },
        {
          id: "D",
          text: "rounded",
          why: "WP-assoc: keyword-matched to 'number' rather than to the property 'tested' and 'named' share.",
        },
      ],
      explanation: "The list gives the shared property: everything was verified. The blank has to restate that.",
      answer: "A",
    },
    {
      id: "a15",
      kind: "text",
      tier: "WORD PROBLEM",
      domain: "quantitative",
      rule: "WP-3 ratio and proportion",
      prompt: "Work out the answer.",
      stem: "A mixture uses 3 parts sand to 5 parts gravel. A batch contains 45 kilograms of sand. How many kilograms of gravel is that?",
      options: [
        {
          id: "A",
          text: "27",
          why: "WP-inverse: applied the ratio the wrong way round, taking three fifths of the sand instead of five thirds.",
        },
        { id: "B", text: "75" },
        {
          id: "C",
          text: "120",
          why: "IC-partial: the total mass of the batch. Correct arithmetic, wrong question.",
        },
        {
          id: "D",
          text: "15",
          why: "IC-partial: the size of one part. The first step of the calculation, reported as the answer.",
        },
      ],
      explanation: "45 kilograms is 3 parts, so one part is 15. Gravel is 5 parts: 75 kilograms.",
      answer: "B",
    },
    {
      id: "a16",
      kind: "figure",
      tier: "VISUAL ODD ONE OUT",
      domain: "spatial",
      rule: "OO containment versus adjacency; every shape distinct so no second 4-1 split exists",
      prompt: "Which figure does not belong?",
      layout: "odd-one-out",
      cells: [],
      options: [
        {
          id: "A",
          fig: { arrange: "stack", shapes: [{ shape: "square", size: "l" }, { shape: "triangle", size: "s" }] },
          why: "One of the four with the small shape inside the large one.",
        },
        {
          id: "B",
          fig: { arrange: "stack", shapes: [{ shape: "diamond", size: "l" }, { shape: "cross", size: "s" }] },
          why: "One of the four with the small shape inside the large one.",
        },
        {
          id: "C",
          fig: { arrange: "stack", shapes: [{ shape: "star", size: "l" }, { shape: "square", size: "s" }] },
          why: "One of the four with the small shape inside the large one.",
        },
        {
          id: "D",
          fig: { shapes: [{ shape: "triangle", size: "l" }, { shape: "diamond", size: "s" }] },
        },
        {
          id: "E",
          fig: { arrange: "stack", shapes: [{ shape: "cross", size: "l" }, { shape: "star", size: "s" }] },
          why: "One of the four with the small shape inside the large one.",
        },
      ],
      explanation: "In four of them the small shape sits inside the large one. In D the two sit side by side.",
      answer: "D",
    },
    {
      id: "a17",
      kind: "text",
      tier: "VERBAL ANALOGY",
      domain: "verbal",
      rule: "VA-R8 cause to effect, tier 2",
      prompt: "Complete the analogy.",
      stem: "RAIN is to FLOOD as SPARK is to ?",
      options: [
        { id: "A", text: "fire" },
        {
          id: "B",
          text: "smoke",
          why: "WP-relation: the effect of the effect. A spark does not produce smoke; the fire does.",
        },
        {
          id: "C",
          text: "flint",
          why: "WP-reverse: what CAUSES a spark rather than what a spark causes. The relation run backwards.",
        },
        {
          id: "D",
          text: "metal",
          why: "D: sparks come off metal, so it is field-matched, but no relation in the stem licenses it.",
        },
      ],
      explanation: "Enough rain produces a flood; a spark produces a fire. Small cause, large consequence.",
      answer: "A",
    },
    {
      id: "a18",
      kind: "figure",
      tier: "FIGURE SERIES",
      domain: "spatial",
      rule: "FS two rules on one axis: rotation (FM-6) and alternating fill (FM-3)",
      prompt: "Which figure comes next?",
      layout: "matrix",
      cells: [
        { shapes: [{ shape: "heart" }] },
        { shapes: [{ shape: "heart", filled: true, rotate: 90 }] },
        { shapes: [{ shape: "heart", rotate: 180 }] },
      ],
      options: [
        {
          id: "A",
          fig: { shapes: [{ shape: "heart", filled: true, rotate: 90 }] },
          why: "R: copies the second figure, the only other filled one in the row.",
        },
        {
          id: "B",
          fig: { shapes: [{ shape: "heart", rotate: 270 }] },
          why: "IC-neg: got the turn and missed that the fill alternates.",
        },
        {
          id: "C",
          fig: { shapes: [{ shape: "heart", filled: true, rotate: 180 }] },
          why: "IC-inc: applied the fill rule and not the turn.",
        },
        { id: "D", fig: { shapes: [{ shape: "heart", filled: true, rotate: 270 }] } },
      ],
      explanation: "Two things happen each step: a quarter turn clockwise, and the fill switches on and off.",
      answer: "D",
    },
    {
      id: "a19",
      kind: "text",
      tier: "ATTENTION TO DETAIL",
      domain: "verbal",
      rule: "AD-2 count the identical pairs, mixed confusable classes",
      prompt: "How many of these four pairs are identical?",
      stem: "R7K0LM94   R7KOLM94\nBX41TQ38   BX41TQ38\nZN6WD52P   ZN6WD52P\nVJ8SGT16   VJ8S6T16",
      options: [
        {
          id: "A",
          text: "1",
          why: "IC-over: found both real differences and flagged a third that is not there — the cost of scanning fast after two hits.",
        },
        { id: "B", text: "2" },
        {
          id: "C",
          text: "3",
          why: "IC-partial: caught one difference and read past the other. The zero-for-O substitution mid-string is the one that survives a quick pass.",
        },
        {
          id: "D",
          text: "4",
          why: "WP-shape: compared the pairs by overall shape rather than character by character, so both single-character swaps disappeared.",
        },
      ],
      explanation: "Pair 1 swaps a zero for a letter O and pair 4 swaps a G for a 6. The middle two match, so two are identical.",
      answer: "B",
    },
    {
      id: "a20",
      kind: "table",
      tier: "TABLES AND GRAPHS",
      domain: "quantitative",
      rule: "TG-3 aggregate a row",
      prompt: "How many units did the busiest line complete in total?",
      caption: "Units completed",
      data: {
        type: "table",
        columns: ["Line", "Morning", "Afternoon"],
        rows: [
          ["A", "52", "23"],
          ["B", "30", "48"],
          ["C", "44", "37"],
        ],
      },
      options: [
        {
          id: "A",
          text: "44",
          why: "IC-partial: the busiest line's morning figure alone, without adding the afternoon.",
        },
        {
          id: "B",
          text: "78",
          why: "WP-row: totalled line B, which leads the afternoon column and looks like the busiest if you read only that column.",
        },
        { id: "C", text: "81" },
        {
          id: "D",
          text: "52",
          why: "WP-cell: the single largest number in the table, taken as the answer without any addition.",
        },
      ],
      explanation: "The row totals are 75, 78 and 81. Line C is busiest with 81.",
      answer: "C",
    },

    /* ===================================================================== */
    /* BLOCK 3 (21-30) — moderate. Degree comparisons, percentages, 3 rules. */
    /* ===================================================================== */
    {
      id: "a21",
      kind: "text",
      tier: "SENTENCE COMPLETION",
      domain: "verbal",
      /*
       * REPLACED. The first version of this item asked for "repetition" and
       * carried "summary" as a distractor, and ruling that out took a judgement
       * about what summaries are like rather than anything the sentence stated.
       * An item whose elimination step is a matter of taste is an item that
       * gets argued with, and no amount of rewording the rationale fixes that.
       * This one turns on the anchor instead: two careful people diverging is
       * what ambiguity does, and nothing else in the option set produces it.
       */
      rule: "SC-1f degree comparison (so ... that) + SC-3a definitional + SC-2a, tier 2",
      prompt: "Which word completes the sentence?",
      stem: "The instructions were so ______ that two people following them carefully arrived at different answers.",
      options: [
        {
          id: "A",
          text: "detailed",
          why: "WP-direction: apt for instructions, and the opposite of what the anchor licenses. Detail makes two careful readers converge; these diverged.",
        },
        {
          id: "B",
          text: "repetitive",
          why: "D: an instruction-register word that fits the slot grammatically and is licensed by nothing in the sentence.",
        },
        {
          id: "C",
          text: "incorrect",
          why: "IC-degree: right that something is wrong with them, but it overshoots. Instructions that are simply wrong send two careful people to the SAME wrong answer, not to different ones.",
        },
        { id: "D", text: "ambiguous" },
      ],
      explanation: "'So ... that' makes the result define the blank. Two people following the same instructions carefully and getting different answers is what ambiguity does.",
      answer: "D",
    },
    {
      id: "a22",
      kind: "text",
      tier: "WORD PROBLEM",
      domain: "quantitative",
      rule: "WP-4 percentage of a base",
      prompt: "Work out the answer.",
      stem: "640 seedlings are planted and 15% of them fail to sprout. How many sprout?",
      options: [
        { id: "A", text: "544" },
        {
          id: "B",
          text: "96",
          why: "IC-partial: the number that failed. Correct arithmetic, the other half of the question.",
        },
        {
          id: "C",
          text: "625",
          why: "WP-base: subtracted 15 rather than 15 per cent.",
        },
        {
          id: "D",
          text: "736",
          why: "WP-direction: added the 15 per cent instead of taking it away.",
        },
      ],
      explanation: "15% of 640 is 96, so 640 − 96 = 544 sprout.",
      answer: "A",
    },
    /* ===== a-m1 — 2 rules: rows rotate, columns shade. matRiks-generated. ===== */
    {
      id: "a23",
      kind: "figure",
      tier: "FIGURE MATRIX",
      domain: "spatial",
      rule: "FM-6 rotation across rows + FM-3 shading down columns (matRiks, 2 rules)",
      prompt: "Which figure completes the grid?",
      layout: "matrix",
      cells: [
        { shapes: [{ shape: "arrow", size: 0.374 }, { shape: "teardrop", size: 0.374 }] },
        {
          shapes: [
            { shape: "arrow", rotate: 90, size: 0.374 },
            { shape: "teardrop", rotate: 90, size: 0.374 },
          ],
        },
        {
          shapes: [
            { shape: "arrow", rotate: 180, size: 0.374 },
            { shape: "teardrop", rotate: 180, size: 0.374 },
          ],
        },
        {
          shapes: [
            { shape: "arrow", filled: true, color: "var(--color-gray-300)", size: 0.374 },
            { shape: "teardrop", filled: true, color: "var(--color-gray-300)", size: 0.374 },
          ],
        },
        {
          shapes: [
            { shape: "arrow", filled: true, color: "var(--color-gray-300)", rotate: 90, size: 0.374 },
            { shape: "teardrop", filled: true, color: "var(--color-gray-300)", rotate: 90, size: 0.374 },
          ],
        },
        {
          shapes: [
            { shape: "arrow", filled: true, color: "var(--color-gray-300)", rotate: 180, size: 0.374 },
            { shape: "teardrop", filled: true, color: "var(--color-gray-300)", rotate: 180, size: 0.374 },
          ],
        },
        {
          shapes: [
            { shape: "arrow", filled: true, size: 0.374 },
            { shape: "teardrop", filled: true, size: 0.374 },
          ],
        },
        {
          shapes: [
            { shape: "arrow", filled: true, rotate: 90, size: 0.374 },
            { shape: "teardrop", filled: true, rotate: 90, size: 0.374 },
          ],
        },
      ],
      options: [
        {
          id: "A",
          fig: { shapes: [{ shape: "arrow", size: 0.374 }, { shape: "teardrop", size: 0.374 }] },
          why: "WP-copy: the figure the grid starts from, with neither rule applied.",
        },
        {
          id: "B",
          fig: {
            shapes: [
              { shape: "arrow", filled: true, rotate: 180, size: 0.374 },
              { shape: "teardrop", filled: true, rotate: 180, size: 0.374 },
            ],
          },
        },
        {
          id: "C",
          fig: {
            shapes: [
              { shape: "arrow", filled: true, rotate: 270, size: 0.374 },
              { shape: "teardrop", filled: true, rotate: 270, size: 0.374 },
            ],
          },
          why: "IC-flip: right shading, and the turn carried one step too far.",
        },
        {
          id: "D",
          fig: {
            shapes: [
              { shape: "arrow", filled: true, rotate: 90, size: 0.374 },
              { shape: "teardrop", filled: true, rotate: 90, size: 0.374 },
            ],
          },
          why: "R-left: copies the cell immediately to the left. Left-perseveration is the commonest matrix error.",
        },
      ],
      explanation: "Across a row the figure turns a quarter turn each step. Down a column the shading goes white, gray, solid. The last cell is both: turned twice and solid.",
      answer: "B",
    },
    {
      id: "a24",
      kind: "series",
      tier: "LETTER SERIES",
      domain: "logic",
      rule: "LS-3 two-letter groups, each letter on its own step (+2 and −2)",
      prompt: "Which pair comes next?",
      seq: ["AZ", "CX", "EV", "GT", "?"],
      options: [
        { id: "A", text: "IR" },
        {
          id: "B",
          text: "IS",
          why: "IC-partial: right first letter, second letter moved one place instead of two.",
        },
        {
          id: "C",
          text: "HR",
          why: "IC-offby: first letter moved one place instead of two.",
        },
        {
          id: "D",
          text: "RI",
          why: "WP-reverse: the right two letters in the wrong order.",
        },
      ],
      explanation: "The first letter moves forward two each time (A, C, E, G, I) and the second moves back two (Z, X, V, T, R).",
      answer: "A",
    },
    {
      id: "a25",
      kind: "figure",
      tier: "VISUAL ODD ONE OUT",
      domain: "spatial",
      rule: "OO exactly-one-filled; each shape used twice so no shape gives a second 4-1 split",
      prompt: "Which figure does not belong?",
      layout: "odd-one-out",
      cells: [],
      options: [
        {
          id: "A",
          fig: { shapes: [{ shape: "square", filled: true }, { shape: "triangle" }] },
          why: "One of the four with exactly one of its two shapes filled.",
        },
        {
          id: "B",
          fig: { shapes: [{ shape: "star" }, { shape: "cross", filled: true }] },
          why: "One of the four with exactly one of its two shapes filled.",
        },
        {
          id: "C",
          fig: { shapes: [{ shape: "diamond", filled: true }, { shape: "square" }] },
          why: "One of the four with exactly one of its two shapes filled.",
        },
        {
          id: "D",
          fig: { shapes: [{ shape: "triangle", filled: true }, { shape: "star", filled: true }] },
        },
        {
          id: "E",
          fig: { shapes: [{ shape: "cross" }, { shape: "diamond", filled: true }] },
          why: "One of the four with exactly one of its two shapes filled.",
        },
      ],
      explanation: "Every figure has two shapes. In four of them exactly one is filled; in D both are. Which SIDE is filled varies, so that is not the rule.",
      answer: "D",
    },
    {
      id: "a26",
      kind: "text",
      tier: "WORD PROBLEM",
      domain: "quantitative",
      rule: "WP-5 percentage change",
      prompt: "Work out the answer.",
      stem: "A workshop made 250 chairs in its first year and 300 in its second. By what percentage did production rise?",
      options: [
        {
          id: "A",
          text: "16.7%",
          why: "WP-base: took the rise as a share of the second year instead of the first.",
        },
        {
          id: "B",
          text: "120%",
          why: "WP-level: the second year as a share of the first. That is the level, not the rise.",
        },
        {
          id: "C",
          text: "50%",
          why: "IC-partial: the raw increase, reported as though it were a percentage.",
        },
        { id: "D", text: "20%" },
      ],
      explanation: "The rise is 50, against a starting figure of 250: 50/250 = 20%.",
      answer: "D",
    },
    {
      id: "a27",
      kind: "text",
      tier: "SENTENCE COMPLETION",
      domain: "verbal",
      rule: "SC-1e condition + SC-3b causal + SC-2a, tier 2",
      prompt: "Which word completes the sentence?",
      stem: "The scheme will collapse unless enough volunteers are ______ before the season begins — at present there are four.",
      options: [
        {
          id: "A",
          text: "consulted",
          why: "WP-assoc: volunteer-register, and a real activity, but consulting the four you already have cannot be what stops the collapse.",
        },
        {
          id: "B",
          text: "dismissed",
          why: "WP-direction: matched the negative valence of 'collapse' and missed that 'unless' makes the blank the thing that PREVENTS it.",
        },
        { id: "C", text: "recruited" },
        {
          id: "D",
          text: "rewarded",
          why: "D: a volunteer-register word, licensed by nothing in the sentence.",
        },
      ],
      explanation: "'Unless' makes the blank the condition that averts collapse, and 'at present there are four' says the shortage is of people.",
      answer: "C",
    },
    {
      id: "a28",
      kind: "figure",
      tier: "FIGURE SERIES",
      domain: "spatial",
      rule: "FS two rules on one axis: rotation (FM-6) and growing size (FM-4)",
      prompt: "Which figure comes next?",
      layout: "matrix",
      cells: [
        { shapes: [{ shape: "teardrop", size: 0.3 }] },
        { shapes: [{ shape: "teardrop", rotate: 45, size: 0.45 }] },
        { shapes: [{ shape: "teardrop", rotate: 90, size: 0.6 }] },
      ],
      options: [
        {
          id: "A",
          fig: { shapes: [{ shape: "teardrop", rotate: 90, size: 0.8 }] },
          why: "IC-inc: applied the growth and not the turn.",
        },
        {
          id: "B",
          fig: { shapes: [{ shape: "teardrop", rotate: 135, size: 0.6 }] },
          why: "R-last: applied the turn but kept the previous size.",
        },
        {
          id: "C",
          fig: { shapes: [{ shape: "teardrop", rotate: 180, size: 0.8 }] },
          why: "IC-degree: right rules, but the turn applied twice.",
        },
        { id: "D", fig: { shapes: [{ shape: "teardrop", rotate: 135, size: 0.8 }] } },
      ],
      explanation: "Each step the figure grows by one size and turns an eighth of a full turn clockwise.",
      answer: "D",
    },
    {
      id: "a29",
      kind: "table",
      tier: "TABLES AND GRAPHS",
      domain: "quantitative",
      rule: "TG-4 derived quantity (per-unit rate)",
      // "Which team was most productive?" would be ambiguous between the most
      // tasks and the most tasks per member, and the taxonomy's table gate says
      // the question must name the operation. This one names it.
      prompt: "Work out tasks per member for each team. What is the highest?",
      caption: "Tasks completed",
      data: {
        type: "table",
        columns: ["Team", "Members", "Tasks"],
        rows: [
          ["North", "12", "132"],
          ["South", "5", "70"],
          ["East", "9", "108"],
          ["West", "6", "78"],
        ],
      },
      options: [
        {
          id: "A",
          text: "11",
          why: "WP-absolute: found the team with the most TASKS (North, 132) and gave its rate, answering 'which team did the most work' rather than the question asked.",
        },
        {
          id: "B",
          text: "13",
          why: "IC-partial: West's rate. Right method, applied to the rows with the tidiest numbers rather than to all four.",
        },
        { id: "C", text: "14" },
        {
          id: "D",
          text: "132",
          why: "IC-partial: the largest total in the table, which is not a rate at all.",
        },
      ],
      explanation: "The rates are 11, 14, 12 and 13. South is highest at 14 tasks per member.",
      answer: "C",
    },
    {
      id: "a30",
      kind: "text",
      tier: "VERBAL ANALOGY",
      domain: "verbal",
      rule: "VA-R10 degree on a scale, tier 2",
      prompt: "Complete the analogy.",
      stem: "MURMUR is to SHOUT as GLANCE is to ?",
      options: [
        { id: "A", text: "stare" },
        {
          id: "B",
          text: "blink",
          why: "WP-relation: another brief eye movement. It matches the intensity of GLANCE instead of escalating from it.",
        },
        {
          id: "C",
          text: "squint",
          why: "IC-degree: an eye action of altered intensity, but on the wrong dimension — focus rather than duration.",
        },
        {
          id: "D",
          text: "listen",
          why: "D: a perception verb, and the sense the first pair belongs to. Field-matched and licensed by nothing.",
        },
      ],
      explanation: "A murmur is the quiet version of a shout; a glance is the brief version of a stare.",
      answer: "A",
    },

    /* ===================================================================== */
    /* BLOCK 4 (31-40) — hard. Two-blank sentences, rates, composite series.  */
    /* ===================================================================== */
    {
      id: "a31",
      kind: "text",
      tier: "ATTENTION TO DETAIL",
      domain: "verbal",
      rule: "AD-3 which pair differs; every option carries a confusable class, only one resolves as different",
      prompt: "Which pair does NOT match?",
      options: [
        {
          id: "A",
          text: "R0S0T4 — R0S0T4",
          why: "Contains two zeros, so a solver scanning for the zero-and-O confusion flags it. Both halves are identical.",
        },
        { id: "B", text: "8LT0R9 — 8LTOR9" },
        {
          id: "C",
          text: "1IJ5K7 — 1IJ5K7",
          why: "Puts a one next to a capital I, the other classic confusion. Both halves are identical.",
        },
        {
          id: "D",
          text: "MN6WV2 — MN6WV2",
          why: "Contains W next to V, which invites the vv-for-w check. Both halves are identical.",
        },
      ],
      explanation: "In B the zero in the first half is a capital O in the second. The other three are identical despite looking risky.",
      answer: "B",
    },
    {
      id: "a32",
      kind: "text",
      tier: "WORD PROBLEM",
      domain: "quantitative",
      rule: "WP-6 combined rates",
      prompt: "Work out the answer.",
      stem: "One pump empties a tank in 6 hours. A second empties the same tank in 12 hours. Working together, how long do they take?",
      options: [
        { id: "A", text: "4 hours" },
        {
          id: "B",
          text: "9 hours",
          why: "WP-naive: averaged the two times. Rates combine, times do not — the classic error on this item type.",
        },
        {
          id: "C",
          text: "18 hours",
          why: "WP-inverse: added the two times, which would make two pumps slower than one.",
        },
        {
          id: "D",
          text: "3 hours",
          why: "IC-offby: halved the faster pump's time instead of inverting the sum of the rates.",
        },
      ],
      explanation: "In an hour they empty a sixth and a twelfth, so a quarter together. Four hours.",
      answer: "A",
    },
    {
      id: "a33",
      kind: "text",
      tier: "SENTENCE COMPLETION",
      domain: "verbal",
      rule: "SC-2b two parallel blanks + SC-3b causal anchor, tier 2",
      prompt: "Which pair completes the sentence?",
      stem: "The report was ______ in its detail and ______ in its conclusions, which is why nobody disputed it.",
      options: [
        {
          id: "A",
          text: "thorough … sweeping",
          why: "IC-half: first blank right, second wrong. A sweeping conclusion is precisely what invites dispute.",
        },
        {
          id: "B",
          text: "selective … cautious",
          why: "IC-half: second blank right, first wrong. Selective detail invites dispute too.",
        },
        {
          id: "C",
          text: "selective … sweeping",
          why: "WP-direction: both blanks taken from the wrong side. Picked by a solver who read 'detail' and 'conclusions' as the anchor and ignored 'nobody disputed it'.",
        },
        { id: "D", text: "thorough … cautious" },
      ],
      explanation: "'Nobody disputed it' sets the direction for both blanks at once: the detail was complete and the conclusions did not overreach.",
      answer: "D",
    },
    {
      id: "a34",
      kind: "series",
      tier: "NUMBER SERIES",
      domain: "quantitative",
      rule: "NS-5 two-step composite (x2 then -1)",
      prompt: "What number comes next?",
      seq: ["3", "5", "9", "17", "?"],
      options: [
        {
          id: "A",
          text: "25",
          why: "WP-linear: continued the last gap of 8 as though the differences were constant.",
        },
        {
          id: "B",
          text: "26",
          why: "WP-recurrence: read it as each term being the sum of the previous two (9 + 17).",
        },
        { id: "C", text: "33" },
        {
          id: "D",
          text: "34",
          why: "IC-onestep: doubled and forgot to take one away.",
        },
      ],
      explanation: "Double and subtract one each time: 17 × 2 − 1 = 33. (The gaps 2, 4, 8 doubling gives the same answer.)",
      answer: "C",
    },
    {
      id: "a35",
      kind: "text",
      tier: "ANTONYM",
      domain: "verbal",
      rule: "AN single-dimension opposition (how much it bends), tier 2",
      prompt: "Which word means most nearly the opposite?",
      stem: "RIGID",
      options: [
        {
          id: "A",
          text: "brittle",
          why: "IC-partial: opposed on a neighbouring material dimension — how a thing FAILS rather than how much it bends.",
        },
        { id: "B", text: "flexible" },
        {
          id: "C",
          text: "stiff",
          why: "WP-synonym: a near-synonym of the stem. Picked by a solver who found the dimension and went the wrong way.",
        },
        {
          id: "D",
          text: "hollow",
          why: "D: a material property from the same field, orthogonal to bending.",
        },
      ],
      explanation: "Rigid means it does not bend; flexible means it does.",
      answer: "B",
    },
    /* ===== a-m2 — 3 rules: shading and size across rows, rotation down columns. ===== */
    {
      id: "a36",
      kind: "figure",
      tier: "FIGURE MATRIX",
      domain: "spatial",
      rule: "FM-3 shading + FM-4 size across rows, FM-10 rotation down columns (matRiks, 3 rules)",
      prompt: "Which figure completes the grid?",
      layout: "matrix",
      cells: [
        { shapes: [{ shape: "teardrop", size: 0.8 }] },
        { shapes: [{ shape: "teardrop", filled: true, color: "var(--color-gray-300)", size: 0.57 }] },
        { shapes: [{ shape: "teardrop", filled: true, size: 0.34 }] },
        { shapes: [{ shape: "teardrop", rotate: 45, size: 0.8 }] },
        {
          shapes: [
            { shape: "teardrop", filled: true, color: "var(--color-gray-300)", rotate: 45, size: 0.57 },
          ],
        },
        { shapes: [{ shape: "teardrop", filled: true, rotate: 45, size: 0.34 }] },
        { shapes: [{ shape: "teardrop", rotate: 90, size: 0.8 }] },
        {
          shapes: [
            { shape: "teardrop", filled: true, color: "var(--color-gray-300)", rotate: 90, size: 0.57 },
          ],
        },
      ],
      options: [
        {
          id: "A",
          fig: { shapes: [{ shape: "teardrop", size: 0.8 }] },
          why: "WP-copy: the figure the grid starts from, with none of the three rules applied.",
        },
        {
          id: "B",
          fig: { shapes: [{ shape: "teardrop", filled: true, rotate: 135, size: 0.34 }] },
          why: "IC-flip: shading and size right, and the rotation carried one step too far.",
        },
        {
          id: "C",
          fig: {
            shapes: [
              { shape: "teardrop", filled: true, color: "var(--color-gray-300)", rotate: 90, size: 0.57 },
            ],
          },
          why: "R-left: copies the cell immediately to the left, so it is one step short on both the shading and the size.",
        },
        { id: "D", fig: { shapes: [{ shape: "teardrop", filled: true, rotate: 90, size: 0.34 }] } },
      ],
      explanation: "Across a row the figure shrinks and darkens. Down a column it turns. The missing cell is the smallest, solid, turned twice.",
      answer: "D",
    },
    {
      id: "a37",
      kind: "text",
      tier: "LOGIC",
      domain: "logic",
      rule: "SY-7 affirming the consequent — cannot be determined",
      prompt: "If the statements are true, is the conclusion true?",
      stem: "All alloys in this batch are magnetic.\nThis sample is magnetic.\nTherefore: this sample is an alloy from the batch.",
      options: [
        {
          id: "A",
          text: "True",
          why: "WP-overgeneralise: affirming the consequent. 'All A are B' was read as though it also said 'all B are A'.",
        },
        {
          id: "B",
          text: "False",
          why: "WP-negate: treated the gap in the argument as a refutation. Nothing rules the sample out either.",
        },
        { id: "C", text: "Cannot tell" },
      ],
      explanation: "Other things can be magnetic. Being magnetic does not put the sample in the batch, and it does not keep it out.",
      answer: "C",
    },
    {
      id: "a38",
      kind: "text",
      tier: "SENTENCE COMPLETION",
      domain: "verbal",
      rule: "SC-1c double reversal (two negations, no negated adjective slot) + SC-3c, tier 2",
      prompt: "Which word completes the sentence?",
      stem: "Though the interface was praised as effortless, users found that almost nothing about it was ______.",
      options: [
        {
          id: "A",
          text: "confusing",
          why: "WP-direction: applied one of the two reversals and stopped. It leaves the sentence agreeing with the praise, which makes 'though' do nothing.",
        },
        { id: "B", text: "intuitive" },
        {
          id: "C",
          text: "original",
          why: "WP-assoc: interface-register, keyword-matched rather than licensed by the two reversals.",
        },
        {
          id: "D",
          text: "decorative",
          why: "D: grammatical in the slot, from the right field, and derivable from nothing in the sentence.",
        },
      ],
      explanation: "Two reversals: 'though' flips the praise, and 'almost nothing was' flips it back. The blank therefore takes the positive word the praise used.",
      answer: "B",
    },
    {
      id: "a39",
      kind: "text",
      tier: "WORD PROBLEM",
      domain: "quantitative",
      rule: "WP-7 weighted average",
      prompt: "Work out the answer.",
      stem: "Thirty people sat a test. The 12 who revised averaged 80 points; the other 18 averaged 55. What was the average for all thirty?",
      options: [
        { id: "A", text: "65" },
        {
          id: "B",
          text: "67.5",
          why: "WP-naive: averaged the two averages, which is only right when the groups are the same size.",
        },
        {
          id: "C",
          text: "70",
          why: "WP-base: weighted correctly but with the group sizes swapped.",
        },
        {
          id: "D",
          text: "1950",
          why: "IC-partial: the total points. A correct intermediate, one step short of the answer.",
        },
      ],
      explanation: "12 × 80 + 18 × 55 = 1950 points across 30 people, so 65 each.",
      answer: "A",
    },
    {
      id: "a40",
      kind: "table",
      tier: "TABLES AND GRAPHS",
      domain: "quantitative",
      rule: "TG-5 percentage change between two cells",
      prompt: "Which site's output rose by the largest percentage?",
      caption: "Output by site",
      data: {
        type: "table",
        columns: ["Site", "Year 1", "Year 2"],
        rows: [
          ["North", "60", "84"],
          ["South", "100", "135"],
          ["East", "400", "500"],
          ["West", "20", "25"],
        ],
      },
      options: [
        {
          id: "A",
          text: "South",
          why: "WP-literal: its rise is 35 and its base is 100, so the raw increase looks like a percentage. It is 35%, which is not the largest.",
        },
        {
          id: "B",
          text: "East",
          why: "WP-absolute: the largest raw rise (100) and the largest figures, which answers 'grew most' rather than 'largest percentage'.",
        },
        { id: "C", text: "North" },
        {
          id: "D",
          text: "West",
          why: "WP-heuristic: the smallest starting figure, on the assumption that the smallest base always gives the biggest percentage. Here it gives 25%.",
        },
      ],
      explanation: "The rises are 40%, 35%, 25% and 25%. North is largest at 24 on a base of 60.",
      answer: "C",
    },

    /* ===================================================================== */
    /* BLOCK 5 (41-50) — very hard. Opposed blanks, set overlap, the seating  */
    /* item, and the logical-operator matrix.                                 */
    /* ===================================================================== */
    {
      id: "a41",
      kind: "text",
      tier: "VERBAL ANALOGY",
      domain: "verbal",
      rule: "VA-R13 quality to the thing it lacks, tier 2 with a directionality trap",
      prompt: "Complete the analogy.",
      stem: "OPAQUE is to LIGHT as MUTE is to ?",
      options: [
        {
          id: "A",
          text: "silence",
          why: "WP-reverse: what a mute thing HAS rather than what it lacks. The relation run backwards.",
        },
        {
          id: "B",
          text: "color",
          why: "R-echo: a property matched to OPAQUE in the stem rather than to MUTE.",
        },
        {
          id: "C",
          text: "hearing",
          why: "WP-relation: the faculty on the receiving side. Mute is about what is not given out, not what is not taken in.",
        },
        { id: "D", text: "sound" },
      ],
      explanation: "Something opaque is defined by the light it withholds; something mute by the sound it withholds.",
      answer: "D",
    },
    {
      id: "a42",
      kind: "figure",
      tier: "VISUAL ODD ONE OUT",
      domain: "spatial",
      rule: "OO rotation class: four diagonals against one quarter turn; no upright figure so 'upright' cannot give a second split",
      prompt: "Which figure does not belong?",
      layout: "odd-one-out",
      cells: [],
      options: [
        {
          id: "A",
          fig: { shapes: [{ shape: "arrow", rotate: 45 }] },
          why: "One of the four turned to a diagonal.",
        },
        {
          id: "B",
          fig: { shapes: [{ shape: "arrow", rotate: 135 }] },
          why: "One of the four turned to a diagonal.",
        },
        { id: "C", fig: { shapes: [{ shape: "arrow", rotate: 90 }] } },
        {
          id: "D",
          fig: { shapes: [{ shape: "arrow", rotate: 225 }] },
          why: "One of the four turned to a diagonal.",
        },
        {
          id: "E",
          fig: { shapes: [{ shape: "arrow", rotate: 315 }] },
          why: "One of the four turned to a diagonal.",
        },
      ],
      explanation: "Four arrows point diagonally. C is the only one on a quarter turn. Same shape, same size, same fill throughout, so the angle is the only thing that splits them.",
      answer: "C",
    },
    {
      id: "a43",
      kind: "text",
      tier: "WORD PROBLEM",
      domain: "quantitative",
      rule: "WP-8 two-set inclusion-exclusion",
      prompt: "Work out the answer.",
      stem: "Of 60 members, 38 play chess and 27 play cards. Every member plays at least one. How many play both?",
      options: [
        {
          id: "A",
          text: "11",
          why: "IC-partial: the difference between the two groups, which answers nothing the question asked.",
        },
        {
          id: "B",
          text: "65",
          why: "WP-doublecount: added the two groups and never removed the overlap — the error the item exists to catch.",
        },
        {
          id: "C",
          text: "22",
          why: "IC-partial: the members who do NOT play chess. A correct quantity, one step short.",
        },
        { id: "D", text: "5" },
      ],
      explanation: "38 + 27 = 65 counts the overlap twice. There are 60 members, so 65 − 60 = 5 play both.",
      answer: "D",
    },
    {
      id: "a44",
      kind: "text",
      tier: "SENTENCE COMPLETION",
      domain: "verbal",
      rule: "SC-2c two opposed blanks + SC-3c contrastive; difficulty from opposed content, not stacked negation",
      prompt: "Which pair completes the sentence?",
      stem: "The lecture was ______ in its argument and ______ in its delivery: the audience followed every step and forgot the whole thing by evening.",
      options: [
        { id: "A", text: "lucid … flat" },
        {
          id: "B",
          text: "lucid … lively",
          why: "IC-half: first blank right, second wrong. A lively delivery is not one an audience forgets by evening.",
        },
        {
          id: "C",
          text: "muddled … flat",
          why: "IC-half: second blank right, first wrong. A muddled argument is not one an audience follows step by step.",
        },
        {
          id: "D",
          text: "muddled … lively",
          why: "WP-direction: both blanks crossed over. Picked by a solver who attached 'forgot the whole thing' to the argument and 'followed every step' to the delivery.",
        },
      ],
      explanation: "The colon supplies both halves: they followed it, so the argument was clear; they forgot it, so the delivery was not.",
      answer: "A",
    },
    {
      id: "a45",
      kind: "figure",
      tier: "FIGURE SERIES",
      domain: "spatial",
      rule: "FS three rules on one axis: rotation (FM-6), alternating fill (FM-3), shrinking size (FM-4)",
      prompt: "Which figure comes next?",
      layout: "matrix",
      cells: [
        { shapes: [{ shape: "triangle", size: 0.75 }] },
        { shapes: [{ shape: "triangle", filled: true, rotate: 90, size: 0.62 }] },
        { shapes: [{ shape: "triangle", rotate: 180, size: 0.49 }] },
      ],
      options: [
        {
          id: "A",
          fig: { shapes: [{ shape: "triangle", filled: true, rotate: 270, size: 0.49 }] },
          why: "IC-inc: turn and fill right, size held at the previous step.",
        },
        { id: "B", fig: { shapes: [{ shape: "triangle", filled: true, rotate: 270, size: 0.36 }] } },
        {
          id: "C",
          fig: { shapes: [{ shape: "triangle", rotate: 270, size: 0.36 }] },
          why: "IC-neg: turn and size right, and the fill left off — two rules out of three.",
        },
        {
          id: "D",
          fig: { shapes: [{ shape: "triangle", filled: true, rotate: 180, size: 0.36 }] },
          why: "R-last: fill and size right, and the angle kept from the previous figure.",
        },
      ],
      explanation: "Three things happen each step: a quarter turn clockwise, the fill switching on and off, and the figure shrinking.",
      answer: "B",
    },
    {
      id: "a46",
      kind: "text",
      tier: "LOGIC",
      domain: "logic",
      rule: "SA-1 end + SA-2 adjacency + SA-4 relative order + SA-5 fixed gap; unique arrangement verified by enumeration",
      prompt: "Who sits in seat 3?",
      stem: "Five people sit in seats numbered 1 to 5, left to right.\nInes sits at one end.\nKarl sits immediately to Ines's right.\nThere is exactly one seat between Karl and Owen.\nMara sits somewhere to the left of Owen.",
      options: [
        {
          id: "A",
          text: "Karl",
          why: "The answer if you drop 'Karl sits immediately to Ines's right' — without it Karl is free to take the middle seat.",
        },
        { id: "B", text: "Mara" },
        {
          id: "C",
          text: "Owen",
          why: "The answer if you drop the one-seat gap between Karl and Owen, which is the constraint most easily read as 'next to'.",
        },
        {
          id: "D",
          text: "Piet",
          why: "The answer if you drop 'Mara sits to the left of Owen' — Mara and Piet then swap freely.",
        },
      ],
      explanation: "Ines must be at seat 1 for Karl to be on her right, so Karl is 2. One seat between Karl and Owen puts Owen at 4. Mara has to be left of Owen, so Mara is 3 and Piet is 5.",
      answer: "B",
    },
    {
      id: "a47",
      kind: "text",
      tier: "WORD PROBLEM",
      domain: "quantitative",
      rule: "WP-9 counting and arrangement",
      prompt: "Work out the answer.",
      stem: "A lock has three dials. The first shows a letter from A to E; the other two each show a digit from 0 to 9. How many settings are there?",
      options: [
        {
          id: "A",
          text: "25",
          why: "WP-inverse: added the three dials instead of multiplying them.",
        },
        {
          id: "B",
          text: "450",
          why: "IC-offby: counted nine positions on one digit dial, forgetting zero.",
        },
        {
          id: "C",
          text: "5000",
          why: "IC-inc: counted three digit dials instead of two.",
        },
        { id: "D", text: "500" },
      ],
      explanation: "5 letters × 10 digits × 10 digits = 500.",
      answer: "D",
    },
    {
      id: "a48",
      kind: "text",
      tier: "LOGIC",
      domain: "logic",
      rule: "SY-8 no A are B; some C are B; therefore some C are not A — true",
      prompt: "If the statements are true, is the conclusion true?",
      stem: "No tool in the red box is sharp.\nSome tools on the bench are sharp.\nTherefore: some tools on the bench are not in the red box.",
      options: [
        { id: "A", text: "True" },
        {
          id: "B",
          text: "False",
          why: "WP-negate: read the two premises as unconnected and rejected the link between them.",
        },
        {
          id: "C",
          text: "Cannot tell",
          why: "WP-underdetermine: treated 'some' as too weak to license any conclusion. It is weak, but it is enough here.",
        },
      ],
      explanation: "The sharp tools on the bench cannot be in the red box, because nothing in the red box is sharp. So at least some bench tools are outside it.",
      answer: "A",
    },
    {
      id: "a49",
      kind: "text",
      tier: "SENTENCE COMPLETION",
      domain: "verbal",
      rule: "SC-2c two opposed blanks + SC-1f degree comparison; the sentence states a trade-off",
      prompt: "Which pair completes the sentence?",
      stem: "A safety rule ______ enough to be followed without judgement is usually too ______ to cover the situation that actually arises.",
      options: [
        {
          id: "A",
          text: "precise … general",
          why: "IC-half: first blank right, second wrong. A general rule would cover MORE situations, not fewer, so it breaks the trade-off.",
        },
        {
          id: "B",
          text: "vague … narrow",
          why: "IC-half: second blank right, first wrong. A vague rule is exactly the kind that cannot be followed without judgement.",
        },
        { id: "C", text: "precise … narrow" },
        {
          id: "D",
          text: "vague … general",
          why: "WP-direction: read the sentence as one continuous complaint rather than a trade-off, so both blanks took the same negative valence.",
        },
      ],
      explanation: "The sentence sets one property against its cost: the precision that removes judgement is the same precision that stops the rule generalising.",
      answer: "C",
    },
    /* ===== a-m3 — a logical operator: each row is the exclusive-or of its first two cells. ===== */
    {
      id: "a50",
      kind: "figure",
      tier: "FIGURE MATRIX",
      domain: "spatial",
      rule: "FM-12 logical combination (XOR) across rows (matRiks)",
      prompt: "Which figure completes the grid?",
      layout: "matrix",
      cells: [
        {
          shapes: [
            { shape: "crescent", size: 0.357, x: 0.29, y: 0.29 },
            { shape: "diamond", size: 0.357, x: 0.71, y: 0.29 },
            { shape: "cross", size: 0.357, x: 0.29, y: 0.71 },
          ],
        },
        {
          shapes: [
            { shape: "crescent", size: 0.357, x: 0.29, y: 0.29 },
            { shape: "cross", size: 0.357, x: 0.29, y: 0.71 },
            { shape: "triangle", size: 0.357, x: 0.71, y: 0.71 },
          ],
        },
        {
          shapes: [
            { shape: "diamond", size: 0.357, x: 0.71, y: 0.29 },
            { shape: "triangle", size: 0.357, x: 0.71, y: 0.71 },
          ],
        },
        {
          shapes: [
            { shape: "crescent", size: 0.357, x: 0.29, y: 0.29 },
            { shape: "diamond", size: 0.357, x: 0.71, y: 0.29 },
            { shape: "cross", size: 0.357, x: 0.29, y: 0.71 },
          ],
        },
        {
          shapes: [
            { shape: "diamond", size: 0.357, x: 0.71, y: 0.29 },
            { shape: "cross", size: 0.357, x: 0.29, y: 0.71 },
            { shape: "triangle", size: 0.357, x: 0.71, y: 0.71 },
          ],
        },
        {
          shapes: [
            { shape: "crescent", size: 0.357, x: 0.29, y: 0.29 },
            { shape: "triangle", size: 0.357, x: 0.71, y: 0.71 },
          ],
        },
        {
          shapes: [
            { shape: "crescent", size: 0.357, x: 0.29, y: 0.29 },
            { shape: "diamond", size: 0.357, x: 0.71, y: 0.29 },
            { shape: "triangle", size: 0.357, x: 0.71, y: 0.71 },
          ],
        },
        {
          shapes: [
            { shape: "crescent", size: 0.357, x: 0.29, y: 0.29 },
            { shape: "cross", size: 0.357, x: 0.29, y: 0.71 },
            { shape: "triangle", size: 0.357, x: 0.71, y: 0.71 },
          ],
        },
      ],
      options: [
        {
          id: "A",
          fig: {
            shapes: [
              { shape: "diamond", size: 0.357, x: 0.71, y: 0.29 },
              { shape: "cross", size: 0.357, x: 0.29, y: 0.71 },
            ],
          },
        },
        {
          id: "B",
          fig: {
            shapes: [
              { shape: "crescent", size: 0.357, x: 0.29, y: 0.29 },
              { shape: "diamond", size: 0.357, x: 0.71, y: 0.29 },
              { shape: "cross", size: 0.357, x: 0.29, y: 0.71 },
              { shape: "triangle", size: 0.357, x: 0.71, y: 0.71 },
            ],
          },
          why: "WP-union: kept everything that appears in either of the first two cells. That is OR, not exclusive-or, and it is the commonest wrong principle on a logical matrix.",
        },
        {
          id: "C",
          fig: { shapes: [{ shape: "diamond", size: 0.357, x: 0.71, y: 0.29 }] },
          why: "IC-inc: applied the rule and dropped one of the two shapes it produces.",
        },
        {
          id: "D",
          fig: {
            shapes: [
              { shape: "crescent", size: 0.357, x: 0.29, y: 0.29 },
              { shape: "cross", size: 0.357, x: 0.29, y: 0.71 },
              { shape: "triangle", size: 0.357, x: 0.71, y: 0.71 },
            ],
          },
          why: "R-left: copies the cell immediately to the left.",
        },
      ],
      explanation: "In each row the third cell keeps the shapes that appear in exactly one of the first two, and drops the ones that appear in both. Here that leaves the diamond and the cross.",
      answer: "A",
    },
  ],
};
