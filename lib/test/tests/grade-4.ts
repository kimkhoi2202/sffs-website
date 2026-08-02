/**
 * 5-MINUTE GRADE 4 TEST — 15 items, 5 minutes, band L10.
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
 * One term may be a place or a role; one operation needing a times-table fact; two things change in the grid, independently.
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

export const GRADE_4_TEST: Test = {
  id: "grade-4",
  audience: "child",
  bank: "grade-4",
  grades: [4],
  band: "grade-4",
  title: "The 5-Minute Grade 4 Test",
  durationSeconds: 5 * 60,
  allowBack: true,
  items: [
    {
      id: "grade-4-01",
      kind: "text",
      tier: "VERBAL ANALOGY",
      domain: "verbal",
      rule: "VA-R4 worker to workplace, tier 1",
      prompt: "Complete the analogy.",
      stem: "TEACHER is to SCHOOL as DOCTOR is to ?",
      options: [
        { id: "A", text: "hospital" },
        {
          id: "B",
          text: "patient",
          why: "WP-relation: who a doctor treats, not where they work.",
        },
        {
          id: "C",
          text: "medicine",
          why: "WP-relation: what a doctor uses, not where they work.",
        },
        {
          id: "D",
          text: "nurse",
          why: "WP-relation: who a doctor works alongside, not where.",
        },
      ],
      explanation: "A teacher works in a school; a doctor works in a hospital.",
      answer: "A",
    },
    {
      id: "grade-4-02",
      kind: "text",
      tier: "NUMBER ANALOGY",
      domain: "quantitative",
      rule: "NA-1 single additive (+9)",
      prompt: "What number completes the last pair?",
      stem: "7 \u2192 16\n12 \u2192 21\n20 \u2192 ?",
      options: [
        {
          id: "A",
          text: "28",
          why: "IC-offby: added 8 instead of 9.",
        },
        {
          id: "B",
          text: "11",
          why: "WP-direction: subtracted 9 instead of adding it.",
        },
        {
          id: "C",
          text: "21",
          why: "R-pair: copied the answer from the second pair.",
        },
        { id: "D", text: "29" },
      ],
      explanation: "Each number goes up by 9, so 20 becomes 29.",
      answer: "D",
    },
    {
      id: "grade-4-03",
      kind: "figure",
      tier: "FIGURE MATRIX",
      domain: "spatial",
      rule: "FM-4 size across rows (generated, 1 rule)",
      prompt: "Which figure completes the grid?",
      layout: "matrix",
      cells: [
        { shapes: [{ shape: "diamond", size: 0.7 }] },
        { shapes: [{ shape: "diamond", size: 0.5 }] },
        { shapes: [{ shape: "diamond", size: 0.36 }] },
        { shapes: [{ shape: "diamond", size: 0.7 }] },
        { shapes: [{ shape: "diamond", size: 0.5 }] },
        { shapes: [{ shape: "diamond", size: 0.36 }] },
        { shapes: [{ shape: "diamond", size: 0.7 }] },
        { shapes: [{ shape: "diamond", size: 0.5 }] },
      ],
      options: [
        {
          id: "A",
          fig: { shapes: [{ shape: "diamond", size: 0.7 }] },
          why: "WP-copy: the figure the grid starts from, with the rule not applied at all.",
        },
        { id: "B", fig: { shapes: [{ shape: "diamond", size: 0.36 }] } },
        {
          id: "C",
          fig: { shapes: [{ shape: "diamond", size: 0.36 }, { shape: "diamond", size: 0.36 }] },
          why: "IC-count: right on the rule, but the number of shapes has changed, which this grid holds constant.",
        },
        {
          id: "D",
          fig: { shapes: [{ shape: "diamond", size: 0.5 }] },
          why: "R-left: copies the cell immediately to the left. Left-perseveration is the commonest matrix error.",
        },
      ],
      explanation: "Across a row, the figure gets smaller. Nothing else changes.",
      answer: "B",
    },
    {
      id: "grade-4-04",
      kind: "text",
      tier: "VERBAL ANALOGY",
      domain: "verbal",
      rule: "VA-R7 source to product, tier 1",
      prompt: "Complete the analogy.",
      stem: "COW is to MILK as BEE is to ?",
      options: [
        {
          id: "A",
          text: "hive",
          why: "WP-relation: where a bee lives, not what it produces.",
        },
        {
          id: "B",
          text: "wing",
          why: "WP-relation: a part of a bee rather than something it makes.",
        },
        { id: "C", text: "honey" },
        {
          id: "D",
          text: "sting",
          why: "WP-relation: what a bee does, not what it makes.",
        },
      ],
      explanation: "A cow gives milk; a bee gives honey.",
      answer: "C",
    },
    {
      id: "grade-4-05",
      kind: "text",
      tier: "NUMBER ANALOGY",
      domain: "quantitative",
      rule: "NA-1 single subtractive (-14)",
      prompt: "What number completes the last pair?",
      stem: "30 \u2192 16\n45 \u2192 31\n40 \u2192 ?",
      options: [
        {
          id: "A",
          text: "54",
          why: "WP-direction: added 14 instead of taking it away.",
        },
        { id: "B", text: "26" },
        {
          id: "C",
          text: "25",
          why: "IC-offby: subtracted 15 instead of 14.",
        },
        {
          id: "D",
          text: "31",
          why: "R-pair: copied the answer from the second pair.",
        },
      ],
      explanation: "Each number goes down by 14, so 40 becomes 26.",
      answer: "B",
    },
    {
      id: "grade-4-06",
      kind: "figure",
      tier: "FIGURE MATRIX",
      domain: "spatial",
      rule: "FM-3 shading across rows, FM-4 size down columns (matRiks, 2 rules)",
      prompt: "Which figure completes the grid?",
      layout: "matrix",
      cells: [
        { shapes: [{ shape: "teardrop", size: 0.8 }] },
        {
          shapes: [
            { shape: "teardrop", filled: true, color: "var(--color-gray-300)", size: 0.8 },
          ],
        },
        { shapes: [{ shape: "teardrop", filled: true, size: 0.8 }] },
        { shapes: [{ shape: "teardrop", size: 0.57 }] },
        {
          shapes: [
            { shape: "teardrop", filled: true, color: "var(--color-gray-300)", size: 0.57 },
          ],
        },
        { shapes: [{ shape: "teardrop", filled: true, size: 0.57 }] },
        { shapes: [{ shape: "teardrop", size: 0.34 }] },
        {
          shapes: [
            { shape: "teardrop", filled: true, color: "var(--color-gray-300)", size: 0.34 },
          ],
        },
      ],
      options: [
        {
          id: "A",
          fig: { shapes: [{ shape: "teardrop", size: 0.8 }] },
          why: "WP-copy: the figure the grid starts from, with the rule not applied at all.",
        },
        {
          id: "B",
          fig: { shapes: [{ shape: "teardrop", size: 0.34 }] },
          why: "IC-neg: everything else right, and the shading one step out.",
        },
        {
          id: "C",
          fig: {
            shapes: [
              { shape: "teardrop", filled: true, color: "var(--color-gray-300)", size: 0.34 },
            ],
          },
          why: "R-left: copies the cell immediately to the left. Left-perseveration is the commonest matrix error.",
        },
        { id: "D", fig: { shapes: [{ shape: "teardrop", filled: true, size: 0.34 }] } },
      ],
      explanation: "Across a row, the shading goes from white to grey to solid. Down a column, the figure gets smaller. The missing cell is whatever both of those give at once.",
      answer: "D",
    },
    {
      id: "grade-4-07",
      kind: "text",
      tier: "VERBAL ANALOGY",
      domain: "verbal",
      rule: "VA-R5 worker to tool, tier 1",
      prompt: "Complete the analogy.",
      stem: "PAINTER is to BRUSH as GARDENER is to ?",
      options: [
        {
          id: "A",
          text: "garden",
          why: "WP-relation: where a gardener works, not what they work with.",
        },
        {
          id: "B",
          text: "flower",
          why: "WP-relation: what a gardener tends, not what they hold.",
        },
        {
          id: "C",
          text: "paint",
          why: "R-echo: belongs to the first pair, not the second.",
        },
        { id: "D", text: "spade" },
      ],
      explanation: "A painter works with a brush; a gardener works with a spade.",
      answer: "D",
    },
    {
      id: "grade-4-08",
      kind: "text",
      tier: "NUMBER ANALOGY",
      domain: "quantitative",
      rule: "NA-2 single multiplicative (x3)",
      prompt: "What number completes the last pair?",
      stem: "6 \u2192 18\n9 \u2192 27\n12 \u2192 ?",
      options: [
        {
          id: "A",
          text: "24",
          why: "WP-additive: added 12, the gap in the first pair, instead of multiplying.",
        },
        {
          id: "B",
          text: "48",
          why: "IC-offby: multiplied by 4 instead of 3.",
        },
        { id: "C", text: "36" },
        {
          id: "D",
          text: "27",
          why: "R-pair: copied the answer from the second pair.",
        },
      ],
      explanation: "Each number is multiplied by 3, so 12 becomes 36.",
      answer: "C",
    },
    {
      id: "grade-4-09",
      kind: "figure",
      tier: "FIGURE MATRIX",
      domain: "spatial",
      rule: "FM-1 shape identity across rows, FM-4 size down columns (generated, 2 rules)",
      prompt: "Which figure completes the grid?",
      layout: "matrix",
      cells: [
        { shapes: [{ shape: "triangle", size: 0.7 }] },
        { shapes: [{ shape: "pentagon", size: 0.7 }] },
        { shapes: [{ shape: "hexagon", size: 0.7 }] },
        { shapes: [{ shape: "triangle", size: 0.5 }] },
        { shapes: [{ shape: "pentagon", size: 0.5 }] },
        { shapes: [{ shape: "hexagon", size: 0.5 }] },
        { shapes: [{ shape: "triangle", size: 0.36 }] },
        { shapes: [{ shape: "pentagon", size: 0.36 }] },
      ],
      options: [
        { id: "A", fig: { shapes: [{ shape: "hexagon", size: 0.36 }] } },
        {
          id: "B",
          fig: { shapes: [{ shape: "triangle", size: 0.7 }] },
          why: "WP-copy: the figure the grid starts from, with the rule not applied at all.",
        },
        {
          id: "C",
          fig: { shapes: [{ shape: "pentagon", size: 0.36 }] },
          why: "IC-shape: everything else right, and the shape one step behind where the row had got to.",
        },
        {
          id: "D",
          fig: { shapes: [{ shape: "hexagon", size: 0.5 }] },
          why: "R-top: copies the cell immediately above.",
        },
      ],
      explanation: "Across a row, the shape goes triangle, pentagon, hexagon. Down a column, the figure gets smaller. The missing cell is whatever both of those give at once.",
      answer: "A",
    },
    {
      id: "grade-4-10",
      kind: "text",
      tier: "VERBAL ANALOGY",
      domain: "verbal",
      rule: "VA-R2 part to whole, tier 1-2",
      prompt: "Complete the analogy.",
      stem: "WHEEL is to BICYCLE as SAIL is to ?",
      options: [
        { id: "A", text: "boat" },
        {
          id: "B",
          text: "wind",
          why: "WP-relation: what makes a sail work, not what it is part of.",
        },
        {
          id: "C",
          text: "mast",
          why: "WP-relation: another part at the same level, not the whole.",
        },
        {
          id: "D",
          text: "sea",
          why: "D: where boats are found. Same field, no relation.",
        },
      ],
      explanation: "A wheel is part of a bicycle; a sail is part of a boat.",
      answer: "A",
    },
    {
      id: "grade-4-11",
      kind: "text",
      tier: "NUMBER ANALOGY",
      domain: "quantitative",
      rule: "NA-2 single multiplicative (x7)",
      prompt: "What number completes the last pair?",
      stem: "4 \u2192 28\n6 \u2192 42\n7 \u2192 ?",
      options: [
        {
          id: "A",
          text: "31",
          why: "WP-additive: added 24, the gap in the first pair, instead of multiplying.",
        },
        { id: "B", text: "49" },
        {
          id: "C",
          text: "42",
          why: "R-pair: copied the answer from the second pair.",
        },
        {
          id: "D",
          text: "56",
          why: "IC-offby: multiplied by 8 instead of 7.",
        },
      ],
      explanation: "Each number is multiplied by 7, so 7 becomes 49.",
      answer: "B",
    },
    {
      id: "grade-4-12",
      kind: "figure",
      tier: "FIGURE MATRIX",
      domain: "spatial",
      rule: "FM-3 shading across rows, FM-4 size down columns (matRiks, 2 rules)",
      prompt: "Which figure completes the grid?",
      layout: "matrix",
      cells: [
        { shapes: [{ shape: "cross", size: 0.8 }] },
        {
          shapes: [
            { shape: "cross", filled: true, color: "var(--color-gray-300)", size: 0.8 },
          ],
        },
        { shapes: [{ shape: "cross", filled: true, size: 0.8 }] },
        { shapes: [{ shape: "cross", size: 0.57 }] },
        {
          shapes: [
            { shape: "cross", filled: true, color: "var(--color-gray-300)", size: 0.57 },
          ],
        },
        { shapes: [{ shape: "cross", filled: true, size: 0.57 }] },
        { shapes: [{ shape: "cross", size: 0.34 }] },
        {
          shapes: [
            { shape: "cross", filled: true, color: "var(--color-gray-300)", size: 0.34 },
          ],
        },
      ],
      options: [
        {
          id: "A",
          fig: { shapes: [{ shape: "cross", size: 0.8 }] },
          why: "WP-copy: the figure the grid starts from, with the rule not applied at all.",
        },
        {
          id: "B",
          fig: { shapes: [{ shape: "cross", size: 0.34 }] },
          why: "IC-neg: everything else right, and the shading one step out.",
        },
        { id: "C", fig: { shapes: [{ shape: "cross", filled: true, size: 0.34 }] } },
        {
          id: "D",
          fig: {
            shapes: [
              { shape: "cross", filled: true, color: "var(--color-gray-300)", size: 0.34 },
            ],
          },
          why: "R-left: copies the cell immediately to the left. Left-perseveration is the commonest matrix error.",
        },
      ],
      explanation: "Across a row, the shading goes from white to grey to solid. Down a column, the figure gets smaller. The missing cell is whatever both of those give at once.",
      answer: "C",
    },
    {
      id: "grade-4-13",
      kind: "text",
      tier: "VERBAL ANALOGY",
      domain: "verbal",
      rule: "VA-R6 object to characteristic property, tier 1",
      prompt: "Complete the analogy.",
      stem: "ICE is to COLD as FIRE is to ?",
      options: [
        {
          id: "A",
          text: "cold",
          why: "R-echo: the word the first pair already used.",
        },
        {
          id: "B",
          text: "wet",
          why: "WP-relation: a property of what ice becomes, not a property of fire.",
        },
        { id: "C", text: "hot" },
        {
          id: "D",
          text: "bright",
          why: "IC-partial: a real property of fire, but on a different dimension from the temperature the stem uses.",
        },
      ],
      explanation: "Ice is cold; fire is hot. The property is temperature both times.",
      answer: "C",
    },
    {
      id: "grade-4-14",
      kind: "text",
      tier: "NUMBER ANALOGY",
      domain: "quantitative",
      rule: "NA-2 single division (/6)",
      prompt: "What number completes the last pair?",
      stem: "36 \u2192 6\n48 \u2192 8\n30 \u2192 ?",
      options: [
        { id: "A", text: "5" },
        {
          id: "B",
          text: "24",
          why: "WP-inverse: subtracted 6 instead of dividing by it.",
        },
        {
          id: "C",
          text: "6",
          why: "IC-offby: divided by 5 instead of 6.",
        },
        {
          id: "D",
          text: "36",
          why: "R-echo: copied a number straight out of the first pair.",
        },
      ],
      explanation: "Each number is divided by 6, so 30 becomes 5.",
      answer: "A",
    },
    {
      id: "grade-4-15",
      kind: "figure",
      tier: "FIGURE MATRIX",
      domain: "spatial",
      rule: "FM-2 element count across rows, FM-3 shading down columns (generated, 2 rules)",
      prompt: "Which figure completes the grid?",
      layout: "matrix",
      cells: [
        { shapes: [{ shape: "star", size: 0.68 }] },
        { shapes: [{ shape: "star", size: 0.4 }, { shape: "star", size: 0.4 }] },
        {
          shapes: [
            { shape: "star", size: 0.28 },
            { shape: "star", size: 0.28 },
            { shape: "star", size: 0.28 },
          ],
        },
        {
          shapes: [
            { shape: "star", filled: true, color: "var(--color-gray-300)", size: 0.68 },
          ],
        },
        {
          shapes: [
            { shape: "star", filled: true, color: "var(--color-gray-300)", size: 0.4 },
            { shape: "star", filled: true, color: "var(--color-gray-300)", size: 0.4 },
          ],
        },
        {
          shapes: [
            { shape: "star", filled: true, color: "var(--color-gray-300)", size: 0.28 },
            { shape: "star", filled: true, color: "var(--color-gray-300)", size: 0.28 },
            { shape: "star", filled: true, color: "var(--color-gray-300)", size: 0.28 },
          ],
        },
        { shapes: [{ shape: "star", filled: true, size: 0.68 }] },
        {
          shapes: [
            { shape: "star", filled: true, size: 0.4 },
            { shape: "star", filled: true, size: 0.4 },
          ],
        },
      ],
      options: [
        {
          id: "A",
          fig: { shapes: [{ shape: "star", size: 0.68 }] },
          why: "WP-copy: the figure the grid starts from, with the rule not applied at all.",
        },
        { id: "B", fig: {
          shapes: [
            { shape: "star", filled: true, size: 0.28 },
            { shape: "star", filled: true, size: 0.28 },
            { shape: "star", filled: true, size: 0.28 },
          ],
        } },
        {
          id: "C",
          fig: {
            shapes: [
              { shape: "star", filled: true, size: 0.24 },
              { shape: "star", filled: true, size: 0.24 },
              { shape: "star", filled: true, size: 0.24 },
              { shape: "star", filled: true, size: 0.24 },
            ],
          },
          why: "IC-count: everything else right, and one shape too many.",
        },
        {
          id: "D",
          fig: {
            shapes: [
              { shape: "star", filled: true, size: 0.4 },
              { shape: "star", filled: true, size: 0.4 },
            ],
          },
          why: "R-left: copies the cell immediately to the left. Left-perseveration is the commonest matrix error.",
        },
      ],
      explanation: "Across a row, the number of shapes goes 1, 2, 3. Down a column, the shading goes from white to grey to solid. The missing cell is whatever both of those give at once.",
      answer: "B",
    },
  ],
};
