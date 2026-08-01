/**
 * 5-MINUTE GRADE 3 TEST — 15 items, 5 minutes, band L9.
 *
 * ===========================================================================
 * WHERE THESE ITEMS COME FROM
 * ===========================================================================
 * Every item is generated from a rule in docs/test-content/rule-taxonomy.md and
 * carries that rule's id. None of them started as a real published item with
 * the nouns swapped, which is a derivative work whatever the surface says.
 *
 * The five FIGURE MATRICES come out of `matRiks` (MIT), which CONSTRUCTS the
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
 * Both terms name something you can point at; one operation on numbers under 20; exactly one thing changes across a row of the grid.
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
 * Every wrong option carries `why`, the specific mistake that produces it.
 */
import type { Test } from "../types";

export const GRADE_3_TEST: Test = {
  id: "grade-3",
  audience: "child",
  bank: "grade-3",
  grades: [3],
  band: "grade-3",
  title: "The 5-Minute Grade 3 Test",
  durationSeconds: 5 * 60,
  allowBack: true,
  items: [
    {
      id: "grade-3-01",
      kind: "text",
      tier: "VERBAL ANALOGY",
      domain: "verbal",
      rule: "VA-R7 young to adult, tier 1",
      prompt: "Complete the analogy.",
      stem: "CHICK is to HEN as LAMB is to ?",
      options: [
        {
          id: "A",
          text: "wool",
          why: "WP-relation: what a lamb gives us, not what it grows into.",
        },
        { id: "B", text: "sheep" },
        {
          id: "C",
          text: "calf",
          why: "WP-relation: another baby animal. Matched 'young' instead of completing the pair.",
        },
        {
          id: "D",
          text: "farm",
          why: "D: where lambs live. Same field, no relation to the one in the stem.",
        },
      ],
      explanation: "A chick grows into a hen; a lamb grows into a sheep.",
      answer: "B",
    },
    {
      id: "grade-3-02",
      kind: "text",
      tier: "NUMBER ANALOGY",
      domain: "quantitative",
      rule: "NA-1 single additive (+3)",
      prompt: "What number completes the last pair?",
      stem: "4 \u2192 7\n6 \u2192 9\n10 \u2192 ?",
      options: [
        { id: "A", text: "13" },
        {
          id: "B",
          text: "30",
          why: "WP-multiplicative: read the 3 as a multiplier rather than an amount to add.",
        },
        {
          id: "C",
          text: "12",
          why: "IC-offby: added 2 instead of 3.",
        },
        {
          id: "D",
          text: "7",
          why: "R-pair: copied the answer from the first pair.",
        },
      ],
      explanation: "Each number goes up by 3, so 10 becomes 13.",
      answer: "A",
    },
    {
      id: "grade-3-03",
      kind: "figure",
      tier: "FIGURE MATRIX",
      domain: "spatial",
      rule: "FM-3 shading across rows (matRiks, 1 rule)",
      prompt: "Which figure completes the grid?",
      layout: "matrix",
      cells: [
        { shapes: [{ shape: "circle", size: 0.68 }] },
        {
          shapes: [
            { shape: "circle", filled: true, color: "var(--color-gray-300)", size: 0.68 },
          ],
        },
        { shapes: [{ shape: "circle", filled: true, size: 0.68 }] },
        { shapes: [{ shape: "circle", size: 0.68 }] },
        {
          shapes: [
            { shape: "circle", filled: true, color: "var(--color-gray-300)", size: 0.68 },
          ],
        },
        { shapes: [{ shape: "circle", filled: true, size: 0.68 }] },
        { shapes: [{ shape: "circle", size: 0.68 }] },
        {
          shapes: [
            { shape: "circle", filled: true, color: "var(--color-gray-300)", size: 0.68 },
          ],
        },
      ],
      options: [
        {
          id: "A",
          fig: { shapes: [{ shape: "circle", size: 0.68 }] },
          why: "WP-copy: the figure the grid starts from, with the rule not applied at all.",
        },
        {
          id: "B",
          fig: { shapes: [{ shape: "circle", filled: true, size: 0.408 }] },
          why: "IC-size: right on the rule, but the size has changed, which this grid holds constant.",
        },
        { id: "C", fig: { shapes: [{ shape: "circle", filled: true, size: 0.68 }] } },
        {
          id: "D",
          fig: {
            shapes: [
              { shape: "circle", filled: true, color: "var(--color-gray-300)", size: 0.68 },
            ],
          },
          why: "R-left: copies the cell immediately to the left. Left-perseveration is the commonest matrix error.",
        },
      ],
      explanation: "Across a row, the shading goes from white to grey to solid. Nothing else changes.",
      answer: "C",
    },
    {
      id: "grade-3-04",
      kind: "text",
      tier: "VERBAL ANALOGY",
      domain: "verbal",
      rule: "VA-R3 object to function, tier 1",
      prompt: "Complete the analogy.",
      stem: "PENCIL is to WRITE as SCISSORS is to ?",
      options: [
        {
          id: "A",
          text: "draw",
          why: "WP-relation: what the FIRST tool does. Completed the stem instead of the analogy.",
        },
        { id: "B", text: "cut" },
        {
          id: "C",
          text: "fold",
          why: "WP-relation: something done to paper, matched to the material rather than to the tool.",
        },
        {
          id: "D",
          text: "hold",
          why: "D: something you do with scissors, licensed by no relation in the stem.",
        },
      ],
      explanation: "A pencil is used to write; scissors are used to cut.",
      answer: "B",
    },
    {
      id: "grade-3-05",
      kind: "text",
      tier: "NUMBER ANALOGY",
      domain: "quantitative",
      rule: "NA-2 single multiplicative (x2)",
      prompt: "What number completes the last pair?",
      stem: "3 \u2192 6\n7 \u2192 14\n9 \u2192 ?",
      options: [
        {
          id: "A",
          text: "12",
          why: "WP-additive: added 3, the gap in the first pair, instead of doubling.",
        },
        {
          id: "B",
          text: "16",
          why: "IC-offby: doubled 8 rather than 9.",
        },
        { id: "C", text: "18" },
        {
          id: "D",
          text: "14",
          why: "R-pair: copied the answer from the second pair.",
        },
      ],
      explanation: "Each number doubles, so 9 becomes 18.",
      answer: "C",
    },
    {
      id: "grade-3-06",
      kind: "figure",
      tier: "FIGURE MATRIX",
      domain: "spatial",
      rule: "FM-3 shading down columns (matRiks, 1 rule)",
      prompt: "Which figure completes the grid?",
      layout: "matrix",
      cells: [
        { shapes: [{ shape: "heart", size: 0.68 }] },
        { shapes: [{ shape: "heart", size: 0.68 }] },
        { shapes: [{ shape: "heart", size: 0.68 }] },
        {
          shapes: [
            { shape: "heart", filled: true, color: "var(--color-gray-300)", size: 0.68 },
          ],
        },
        {
          shapes: [
            { shape: "heart", filled: true, color: "var(--color-gray-300)", size: 0.68 },
          ],
        },
        {
          shapes: [
            { shape: "heart", filled: true, color: "var(--color-gray-300)", size: 0.68 },
          ],
        },
        { shapes: [{ shape: "heart", filled: true, size: 0.68 }] },
        { shapes: [{ shape: "heart", filled: true, size: 0.68 }] },
      ],
      options: [
        { id: "A", fig: { shapes: [{ shape: "heart", filled: true, size: 0.68 }] } },
        {
          id: "B",
          fig: { shapes: [{ shape: "heart", size: 0.68 }] },
          why: "WP-copy: the figure the grid starts from, with the rule not applied at all.",
        },
        {
          id: "C",
          fig: { shapes: [{ shape: "heart", filled: true, size: 0.408 }] },
          why: "IC-size: right on the rule, but the size has changed, which this grid holds constant.",
        },
        {
          id: "D",
          fig: {
            shapes: [
              { shape: "heart", filled: true, color: "var(--color-gray-300)", size: 0.68 },
            ],
          },
          why: "R-top: copies the cell immediately above.",
        },
      ],
      explanation: "Down a column, the shading goes from white to grey to solid. The missing cell is whatever both of those give at once.",
      answer: "A",
    },
    {
      id: "grade-3-07",
      kind: "text",
      tier: "VERBAL ANALOGY",
      domain: "verbal",
      rule: "VA-R1 category to member, tier 1",
      prompt: "Complete the analogy.",
      stem: "TOOL is to HAMMER as FRUIT is to ?",
      options: [
        {
          id: "A",
          text: "tree",
          why: "WP-reverse: where fruit comes from. The relation run backwards.",
        },
        {
          id: "B",
          text: "basket",
          why: "D: where fruit is kept. Same field, no relation.",
        },
        { id: "C", text: "banana" },
        {
          id: "D",
          text: "vegetable",
          why: "WP-relation: another category rather than a member of this one.",
        },
      ],
      explanation: "A hammer is a kind of tool; a banana is a kind of fruit.",
      answer: "C",
    },
    {
      id: "grade-3-08",
      kind: "text",
      tier: "NUMBER ANALOGY",
      domain: "quantitative",
      rule: "NA-1 single subtractive (-4)",
      prompt: "What number completes the last pair?",
      stem: "12 \u2192 8\n15 \u2192 11\n20 \u2192 ?",
      options: [
        { id: "A", text: "16" },
        {
          id: "B",
          text: "24",
          why: "WP-direction: added 4 instead of taking it away.",
        },
        {
          id: "C",
          text: "15",
          why: "IC-offby: subtracted 5 instead of 4.",
        },
        {
          id: "D",
          text: "11",
          why: "R-pair: copied the answer from the second pair.",
        },
      ],
      explanation: "Each number goes down by 4, so 20 becomes 16.",
      answer: "A",
    },
    {
      id: "grade-3-09",
      kind: "figure",
      tier: "FIGURE MATRIX",
      domain: "spatial",
      rule: "FM-4 size across rows (matRiks, 1 rule)",
      prompt: "Which figure completes the grid?",
      layout: "matrix",
      cells: [
        { shapes: [{ shape: "star", size: 0.8 }] },
        { shapes: [{ shape: "star", size: 0.57 }] },
        { shapes: [{ shape: "star", size: 0.34 }] },
        { shapes: [{ shape: "star", size: 0.8 }] },
        { shapes: [{ shape: "star", size: 0.57 }] },
        { shapes: [{ shape: "star", size: 0.34 }] },
        { shapes: [{ shape: "star", size: 0.8 }] },
        { shapes: [{ shape: "star", size: 0.57 }] },
      ],
      options: [
        {
          id: "A",
          fig: { shapes: [{ shape: "star", size: 0.8 }] },
          why: "WP-copy: the figure the grid starts from, with the rule not applied at all.",
        },
        {
          id: "B",
          fig: { shapes: [{ shape: "star", size: 0.204 }] },
          why: "IC-size: everything else right, and the size off the ladder the grid uses.",
        },
        {
          id: "C",
          fig: { shapes: [{ shape: "star", size: 0.57 }] },
          why: "R-left: copies the cell immediately to the left. Left-perseveration is the commonest matrix error.",
        },
        { id: "D", fig: { shapes: [{ shape: "star", size: 0.34 }] } },
      ],
      explanation: "Across a row, the figure gets smaller. Nothing else changes.",
      answer: "D",
    },
    {
      id: "grade-3-10",
      kind: "text",
      tier: "VERBAL ANALOGY",
      domain: "verbal",
      rule: "VA-R2 whole to part, tier 1",
      prompt: "Complete the analogy.",
      stem: "TREE is to BRANCH as HAND is to ?",
      options: [
        {
          id: "A",
          text: "arm",
          why: "WP-reverse: the whole a hand is part of, rather than a part of the hand.",
        },
        {
          id: "B",
          text: "glove",
          why: "D: what covers a hand. Same field, no relation.",
        },
        {
          id: "C",
          text: "foot",
          why: "WP-relation: another body part at the same level, not a part of the hand.",
        },
        { id: "D", text: "finger" },
      ],
      explanation: "A branch is part of a tree; a finger is part of a hand.",
      answer: "D",
    },
    {
      id: "grade-3-11",
      kind: "text",
      tier: "NUMBER ANALOGY",
      domain: "quantitative",
      rule: "NA-1 single additive (+7)",
      prompt: "What number completes the last pair?",
      stem: "5 \u2192 12\n8 \u2192 15\n13 \u2192 ?",
      options: [
        {
          id: "A",
          text: "21",
          why: "IC-offby: added 8 instead of 7.",
        },
        { id: "B", text: "20" },
        {
          id: "C",
          text: "15",
          why: "R-pair: copied the answer from the second pair.",
        },
        {
          id: "D",
          text: "6",
          why: "WP-direction: subtracted 7 instead of adding it.",
        },
      ],
      explanation: "Each number goes up by 7, so 13 becomes 20.",
      answer: "B",
    },
    {
      id: "grade-3-12",
      kind: "figure",
      tier: "FIGURE MATRIX",
      domain: "spatial",
      rule: "FM-3 shading across rows (matRiks, 1 rule)",
      prompt: "Which figure completes the grid?",
      layout: "matrix",
      cells: [
        { shapes: [{ shape: "square", size: 0.374 }, { shape: "circle", size: 0.374 }] },
        {
          shapes: [
            { shape: "square", filled: true, color: "var(--color-gray-300)", size: 0.374 },
            { shape: "circle", filled: true, color: "var(--color-gray-300)", size: 0.374 },
          ],
        },
        {
          shapes: [
            { shape: "square", filled: true, size: 0.374 },
            { shape: "circle", filled: true, size: 0.374 },
          ],
        },
        { shapes: [{ shape: "square", size: 0.374 }, { shape: "circle", size: 0.374 }] },
        {
          shapes: [
            { shape: "square", filled: true, color: "var(--color-gray-300)", size: 0.374 },
            { shape: "circle", filled: true, color: "var(--color-gray-300)", size: 0.374 },
          ],
        },
        {
          shapes: [
            { shape: "square", filled: true, size: 0.374 },
            { shape: "circle", filled: true, size: 0.374 },
          ],
        },
        { shapes: [{ shape: "square", size: 0.374 }, { shape: "circle", size: 0.374 }] },
        {
          shapes: [
            { shape: "square", filled: true, color: "var(--color-gray-300)", size: 0.374 },
            { shape: "circle", filled: true, color: "var(--color-gray-300)", size: 0.374 },
          ],
        },
      ],
      options: [
        {
          id: "A",
          fig: { shapes: [{ shape: "square", size: 0.374 }, { shape: "circle", size: 0.374 }] },
          why: "WP-copy: the figure the grid starts from, with the rule not applied at all.",
        },
        { id: "B", fig: {
          shapes: [
            { shape: "square", filled: true, size: 0.374 },
            { shape: "circle", filled: true, size: 0.374 },
          ],
        } },
        {
          id: "C",
          fig: {
            shapes: [
              { shape: "square", filled: true, size: 0.224 },
              { shape: "circle", filled: true, size: 0.224 },
            ],
          },
          why: "IC-size: right on the rule, but the size has changed, which this grid holds constant.",
        },
        {
          id: "D",
          fig: {
            shapes: [
              { shape: "square", filled: true, color: "var(--color-gray-300)", size: 0.374 },
              { shape: "circle", filled: true, color: "var(--color-gray-300)", size: 0.374 },
            ],
          },
          why: "R-left: copies the cell immediately to the left. Left-perseveration is the commonest matrix error.",
        },
      ],
      explanation: "Across a row, the shading goes from white to grey to solid. Nothing else changes.",
      answer: "B",
    },
    {
      id: "grade-3-13",
      kind: "text",
      tier: "VERBAL ANALOGY",
      domain: "verbal",
      rule: "VA-R1 category to member, tier 1",
      prompt: "Complete the analogy.",
      stem: "FURNITURE is to CHAIR as CLOTHING is to ?",
      options: [
        { id: "A", text: "shirt" },
        {
          id: "B",
          text: "cotton",
          why: "WP-relation: what clothing is made of, not a kind of clothing.",
        },
        {
          id: "C",
          text: "button",
          why: "WP-relation: a part of a garment rather than a kind of garment.",
        },
        {
          id: "D",
          text: "closet",
          why: "D: where clothing is kept. Same field, no relation.",
        },
      ],
      explanation: "A chair is a kind of furniture; a shirt is a kind of clothing.",
      answer: "A",
    },
    {
      id: "grade-3-14",
      kind: "text",
      tier: "NUMBER ANALOGY",
      domain: "quantitative",
      rule: "NA-1 single subtractive (-6)",
      prompt: "What number completes the last pair?",
      stem: "16 \u2192 10\n13 \u2192 7\n20 \u2192 ?",
      options: [
        {
          id: "A",
          text: "26",
          why: "WP-direction: added 6 instead of taking it away.",
        },
        {
          id: "B",
          text: "13",
          why: "IC-offby: subtracted 7 instead of 6.",
        },
        { id: "C", text: "14" },
        {
          id: "D",
          text: "7",
          why: "R-pair: copied the answer from the second pair.",
        },
      ],
      explanation: "Each number goes down by 6, so 20 becomes 14.",
      answer: "C",
    },
    {
      id: "grade-3-15",
      kind: "figure",
      tier: "FIGURE MATRIX",
      domain: "spatial",
      rule: "FM-4 size down columns (matRiks, 1 rule)",
      prompt: "Which figure completes the grid?",
      layout: "matrix",
      cells: [
        { shapes: [{ shape: "arrow", size: 0.8 }] },
        { shapes: [{ shape: "arrow", size: 0.8 }] },
        { shapes: [{ shape: "arrow", size: 0.8 }] },
        { shapes: [{ shape: "arrow", size: 0.57 }] },
        { shapes: [{ shape: "arrow", size: 0.57 }] },
        { shapes: [{ shape: "arrow", size: 0.57 }] },
        { shapes: [{ shape: "arrow", size: 0.34 }] },
        { shapes: [{ shape: "arrow", size: 0.34 }] },
      ],
      options: [
        {
          id: "A",
          fig: { shapes: [{ shape: "arrow", size: 0.8 }] },
          why: "WP-copy: the figure the grid starts from, with the rule not applied at all.",
        },
        {
          id: "B",
          fig: { shapes: [{ shape: "arrow", size: 0.204 }] },
          why: "IC-size: everything else right, and the size off the ladder the grid uses.",
        },
        {
          id: "C",
          fig: { shapes: [{ shape: "arrow", size: 0.57 }] },
          why: "R-top: copies the cell immediately above.",
        },
        { id: "D", fig: { shapes: [{ shape: "arrow", size: 0.34 }] } },
      ],
      explanation: "Down a column, the figure gets smaller. The missing cell is whatever both of those give at once.",
      answer: "D",
    },
  ],
};
