/**
 * 5-MINUTE GRADE 5 TEST — 15 items, 5 minutes, band L11.
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
 * An instrument, a measurement or a cause-and-effect chain appears; two operations on numbers under 100; rotation appears in the grid, in quarter turns.
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

export const GRADE_5_TEST: Test = {
  id: "grade-5",
  audience: "child",
  bank: "grade-5",
  grades: [5],
  band: "grade-5",
  title: "The 5-Minute Grade 5 Test",
  durationSeconds: 5 * 60,
  allowBack: true,
  items: [
    {
      id: "grade-5-01",
      kind: "text",
      tier: "VERBAL ANALOGY",
      domain: "verbal",
      rule: "VA-R9 instrument to what it shows, tier 2",
      prompt: "Complete the analogy.",
      stem: "COMPASS is to DIRECTION as CLOCK is to ?",
      options: [
        {
          id: "A",
          text: "hour",
          why: "IC-partial: a unit of the quantity rather than the quantity itself.",
        },
        { id: "B", text: "time" },
        {
          id: "C",
          text: "hands",
          why: "WP-relation: a part of a clock, not what it shows.",
        },
        {
          id: "D",
          text: "north",
          why: "R-echo: an answer to the first pair rather than the second.",
        },
      ],
      explanation: "A compass shows direction; a clock shows time.",
      answer: "B",
    },
    {
      id: "grade-5-02",
      kind: "text",
      tier: "NUMBER ANALOGY",
      domain: "quantitative",
      rule: "NA-3 two-step (x2 then +1)",
      prompt: "What number completes the last pair?",
      stem: "3 \u2192 7\n5 \u2192 11\n8 \u2192 ?",
      options: [
        { id: "A", text: "17" },
        {
          id: "B",
          text: "16",
          why: "IC-firststep: doubled and stopped, forgetting the +1.",
        },
        {
          id: "C",
          text: "9",
          why: "IC-secondstep: added 1 and skipped the doubling.",
        },
        {
          id: "D",
          text: "13",
          why: "WP-additive: added 4, the gap in the first pair.",
        },
      ],
      explanation: "Double, then add 1: 8 doubles to 16, plus 1 is 17.",
      answer: "A",
    },
    {
      id: "grade-5-03",
      kind: "figure",
      tier: "FIGURE MATRIX",
      domain: "spatial",
      rule: "FM-6 rotation across rows, FM-3 shading down columns (matRiks, 2 rules)",
      prompt: "Which figure completes the grid?",
      layout: "matrix",
      cells: [
        { shapes: [{ shape: "triangle", size: 0.68 }] },
        { shapes: [{ shape: "triangle", rotate: 90, size: 0.68 }] },
        { shapes: [{ shape: "triangle", rotate: 180, size: 0.68 }] },
        {
          shapes: [
            { shape: "triangle", filled: true, color: "var(--color-gray-300)", size: 0.68 },
          ],
        },
        {
          shapes: [
            { shape: "triangle", filled: true, color: "var(--color-gray-300)", rotate: 90, size: 0.68 },
          ],
        },
        {
          shapes: [
            { shape: "triangle", filled: true, color: "var(--color-gray-300)", rotate: 180, size: 0.68 },
          ],
        },
        { shapes: [{ shape: "triangle", filled: true, size: 0.68 }] },
        { shapes: [{ shape: "triangle", filled: true, rotate: 90, size: 0.68 }] },
      ],
      options: [
        {
          id: "A",
          fig: { shapes: [{ shape: "triangle", size: 0.68 }] },
          why: "WP-copy: the figure the grid starts from, with the rule not applied at all.",
        },
        {
          id: "B",
          fig: { shapes: [{ shape: "triangle", filled: true, rotate: 270, size: 0.68 }] },
          why: "IC-flip: everything else right, and the turn carried one step too far.",
        },
        {
          id: "C",
          fig: { shapes: [{ shape: "triangle", filled: true, rotate: 90, size: 0.68 }] },
          why: "R-left: copies the cell immediately to the left. Left-perseveration is the commonest matrix error.",
        },
        { id: "D", fig: { shapes: [{ shape: "triangle", filled: true, rotate: 180, size: 0.68 }] } },
      ],
      explanation: "Across a row, the figure turns a step further round. Down a column, the shading goes from white to grey to solid. The missing cell is whatever both of those give at once.",
      answer: "D",
    },
    {
      id: "grade-5-04",
      kind: "text",
      tier: "VERBAL ANALOGY",
      domain: "verbal",
      rule: "VA-R8 cause to effect, tier 2",
      prompt: "Complete the analogy.",
      stem: "EXERCISE is to STRENGTH as PRACTICE is to ?",
      options: [
        { id: "A", text: "skill" },
        {
          id: "B",
          text: "effort",
          why: "WP-reverse: what practice takes, not what it produces.",
        },
        {
          id: "C",
          text: "music",
          why: "D: a thing people practise. Same field, no relation.",
        },
        {
          id: "D",
          text: "repetition",
          why: "WP-relation: what practice consists of, not what it produces.",
        },
      ],
      explanation: "Exercise builds strength; practice builds skill.",
      answer: "A",
    },
    {
      id: "grade-5-05",
      kind: "text",
      tier: "NUMBER ANALOGY",
      domain: "quantitative",
      rule: "NA-3 two-step (x3 then +2)",
      prompt: "What number completes the last pair?",
      stem: "4 \u2192 14\n6 \u2192 20\n9 \u2192 ?",
      options: [
        {
          id: "A",
          text: "27",
          why: "IC-firststep: multiplied and stopped, forgetting the +2.",
        },
        {
          id: "B",
          text: "11",
          why: "IC-secondstep: added 2 and skipped the multiplication.",
        },
        { id: "C", text: "29" },
        {
          id: "D",
          text: "19",
          why: "WP-additive: added 10, the gap in the first pair.",
        },
      ],
      explanation: "Multiply by 3, then add 2: 9 times 3 is 27, plus 2 is 29.",
      answer: "C",
    },
    {
      id: "grade-5-06",
      kind: "figure",
      tier: "FIGURE MATRIX",
      domain: "spatial",
      rule: "FM-4 size across rows, FM-6 rotation down columns (matRiks, 2 rules)",
      prompt: "Which figure completes the grid?",
      layout: "matrix",
      cells: [
        { shapes: [{ shape: "arrow", size: 0.8 }] },
        { shapes: [{ shape: "arrow", size: 0.57 }] },
        { shapes: [{ shape: "arrow", size: 0.34 }] },
        { shapes: [{ shape: "arrow", rotate: 90, size: 0.8 }] },
        { shapes: [{ shape: "arrow", rotate: 90, size: 0.57 }] },
        { shapes: [{ shape: "arrow", rotate: 90, size: 0.34 }] },
        { shapes: [{ shape: "arrow", rotate: 180, size: 0.8 }] },
        { shapes: [{ shape: "arrow", rotate: 180, size: 0.57 }] },
      ],
      options: [
        {
          id: "A",
          fig: { shapes: [{ shape: "arrow", size: 0.8 }] },
          why: "WP-copy: the figure the grid starts from, with the rule not applied at all.",
        },
        {
          id: "B",
          fig: { shapes: [{ shape: "arrow", rotate: 270, size: 0.34 }] },
          why: "IC-flip: everything else right, and the turn carried one step too far.",
        },
        { id: "C", fig: { shapes: [{ shape: "arrow", rotate: 180, size: 0.34 }] } },
        {
          id: "D",
          fig: { shapes: [{ shape: "arrow", rotate: 180, size: 0.57 }] },
          why: "R-left: copies the cell immediately to the left. Left-perseveration is the commonest matrix error.",
        },
      ],
      explanation: "Across a row, the figure gets smaller. Down a column, the figure turns a step further round. The missing cell is whatever both of those give at once.",
      answer: "C",
    },
    {
      id: "grade-5-07",
      kind: "text",
      tier: "VERBAL ANALOGY",
      domain: "verbal",
      rule: "VA-R8 small cause to the thing it becomes, tier 2",
      prompt: "Complete the analogy.",
      stem: "SPARK is to FLAME as SEED is to ?",
      options: [
        {
          id: "A",
          text: "soil",
          why: "WP-relation: what a seed needs, not what it becomes.",
        },
        {
          id: "B",
          text: "shell",
          why: "WP-relation: a part of a seed rather than what it turns into.",
        },
        {
          id: "C",
          text: "harvest",
          why: "IC-degree: further along the same chain than the first pair goes.",
        },
        { id: "D", text: "plant" },
      ],
      explanation: "A spark becomes a flame; a seed becomes a plant.",
      answer: "D",
    },
    {
      id: "grade-5-08",
      kind: "text",
      tier: "NUMBER ANALOGY",
      domain: "quantitative",
      rule: "NA-3 two-step (x4 then +1)",
      prompt: "What number completes the last pair?",
      stem: "2 \u2192 9\n5 \u2192 21\n6 \u2192 ?",
      options: [
        {
          id: "A",
          text: "24",
          why: "IC-firststep: multiplied and stopped, forgetting the +1.",
        },
        {
          id: "B",
          text: "7",
          why: "IC-secondstep: added 1 and skipped the multiplication.",
        },
        {
          id: "C",
          text: "13",
          why: "WP-additive: added 7, the gap in the first pair.",
        },
        { id: "D", text: "25" },
      ],
      explanation: "Multiply by 4, then add 1: 6 times 4 is 24, plus 1 is 25.",
      answer: "D",
    },
    {
      id: "grade-5-09",
      kind: "figure",
      tier: "FIGURE MATRIX",
      domain: "spatial",
      rule: "FM-6 rotation across rows, FM-4 size down columns (matRiks, 2 rules)",
      prompt: "Which figure completes the grid?",
      layout: "matrix",
      cells: [
        { shapes: [{ shape: "teardrop", size: 0.44 }, { shape: "arrow", size: 0.44 }] },
        {
          shapes: [
            { shape: "teardrop", rotate: 90, size: 0.44 },
            { shape: "arrow", rotate: 90, size: 0.44 },
          ],
        },
        {
          shapes: [
            { shape: "teardrop", rotate: 180, size: 0.44 },
            { shape: "arrow", rotate: 180, size: 0.44 },
          ],
        },
        { shapes: [{ shape: "teardrop", size: 0.34 }, { shape: "arrow", size: 0.34 }] },
        {
          shapes: [
            { shape: "teardrop", rotate: 90, size: 0.34 },
            { shape: "arrow", rotate: 90, size: 0.34 },
          ],
        },
        {
          shapes: [
            { shape: "teardrop", rotate: 180, size: 0.34 },
            { shape: "arrow", rotate: 180, size: 0.34 },
          ],
        },
        { shapes: [{ shape: "teardrop", size: 0.24 }, { shape: "arrow", size: 0.24 }] },
        {
          shapes: [
            { shape: "teardrop", rotate: 90, size: 0.24 },
            { shape: "arrow", rotate: 90, size: 0.24 },
          ],
        },
      ],
      options: [
        {
          id: "A",
          fig: { shapes: [{ shape: "teardrop", size: 0.44 }, { shape: "arrow", size: 0.44 }] },
          why: "WP-copy: the figure the grid starts from, with the rule not applied at all.",
        },
        { id: "B", fig: {
          shapes: [
            { shape: "teardrop", rotate: 180, size: 0.24 },
            { shape: "arrow", rotate: 180, size: 0.24 },
          ],
        } },
        {
          id: "C",
          fig: {
            shapes: [
              { shape: "teardrop", rotate: 270, size: 0.24 },
              { shape: "arrow", rotate: 270, size: 0.24 },
            ],
          },
          why: "IC-flip: everything else right, and the turn carried one step too far.",
        },
        {
          id: "D",
          fig: {
            shapes: [
              { shape: "teardrop", rotate: 90, size: 0.24 },
              { shape: "arrow", rotate: 90, size: 0.24 },
            ],
          },
          why: "R-left: copies the cell immediately to the left. Left-perseveration is the commonest matrix error.",
        },
      ],
      explanation: "Across a row, the figure turns a step further round. Down a column, the figure gets smaller. The missing cell is whatever both of those give at once.",
      answer: "B",
    },
    {
      id: "grade-5-10",
      kind: "text",
      tier: "VERBAL ANALOGY",
      domain: "verbal",
      rule: "VA-R7 maker to what they make, tier 2",
      prompt: "Complete the analogy.",
      stem: "AUTHOR is to NOVEL as COMPOSER is to ?",
      options: [
        {
          id: "A",
          text: "orchestra",
          why: "WP-relation: who performs the work, not the work itself.",
        },
        {
          id: "B",
          text: "concert",
          why: "WP-relation: the event where the work is heard, not the thing written.",
        },
        { id: "C", text: "symphony" },
        {
          id: "D",
          text: "piano",
          why: "WP-relation: an instrument, so a tool rather than an output.",
        },
      ],
      explanation: "An author writes a novel; a composer writes a symphony.",
      answer: "C",
    },
    {
      id: "grade-5-11",
      kind: "text",
      tier: "NUMBER ANALOGY",
      domain: "quantitative",
      rule: "NA-3 two-step (x3 then +1)",
      prompt: "What number completes the last pair?",
      stem: "10 \u2192 31\n4 \u2192 13\n7 \u2192 ?",
      options: [
        {
          id: "A",
          text: "21",
          why: "IC-firststep: multiplied and stopped, forgetting the +1.",
        },
        { id: "B", text: "22" },
        {
          id: "C",
          text: "8",
          why: "IC-secondstep: added 1 and skipped the multiplication.",
        },
        {
          id: "D",
          text: "28",
          why: "WP-additive: added 21, the gap in the first pair.",
        },
      ],
      explanation: "Multiply by 3, then add 1: 7 times 3 is 21, plus 1 is 22.",
      answer: "B",
    },
    {
      id: "grade-5-12",
      kind: "figure",
      tier: "FIGURE MATRIX",
      domain: "spatial",
      rule: "FM-3 shading across rows, FM-6 rotation down columns (matRiks, 2 rules)",
      prompt: "Which figure completes the grid?",
      layout: "matrix",
      cells: [
        { shapes: [{ shape: "heart", size: 0.68 }] },
        {
          shapes: [
            { shape: "heart", filled: true, color: "var(--color-gray-300)", size: 0.68 },
          ],
        },
        { shapes: [{ shape: "heart", filled: true, size: 0.68 }] },
        { shapes: [{ shape: "heart", rotate: 90, size: 0.68 }] },
        {
          shapes: [
            { shape: "heart", filled: true, color: "var(--color-gray-300)", rotate: 90, size: 0.68 },
          ],
        },
        { shapes: [{ shape: "heart", filled: true, rotate: 90, size: 0.68 }] },
        { shapes: [{ shape: "heart", rotate: 180, size: 0.68 }] },
        {
          shapes: [
            { shape: "heart", filled: true, color: "var(--color-gray-300)", rotate: 180, size: 0.68 },
          ],
        },
      ],
      options: [
        { id: "A", fig: { shapes: [{ shape: "heart", filled: true, rotate: 180, size: 0.68 }] } },
        {
          id: "B",
          fig: { shapes: [{ shape: "heart", size: 0.68 }] },
          why: "WP-copy: the figure the grid starts from, with the rule not applied at all.",
        },
        {
          id: "C",
          fig: { shapes: [{ shape: "heart", filled: true, rotate: 270, size: 0.68 }] },
          why: "IC-flip: everything else right, and the turn carried one step too far.",
        },
        {
          id: "D",
          fig: {
            shapes: [
              { shape: "heart", filled: true, color: "var(--color-gray-300)", rotate: 180, size: 0.68 },
            ],
          },
          why: "R-left: copies the cell immediately to the left. Left-perseveration is the commonest matrix error.",
        },
      ],
      explanation: "Across a row, the shading goes from white to grey to solid. Down a column, the figure turns a step further round. The missing cell is whatever both of those give at once.",
      answer: "A",
    },
    {
      id: "grade-5-13",
      kind: "text",
      tier: "VERBAL ANALOGY",
      domain: "verbal",
      rule: "VA-R6 object to characteristic property, tier 2",
      prompt: "Complete the analogy.",
      stem: "FEATHER is to LIGHT as STONE is to ?",
      options: [
        {
          id: "A",
          text: "soft",
          why: "WP-direction: the property matched to FEATHER rather than to STONE.",
        },
        { id: "B", text: "heavy" },
        {
          id: "C",
          text: "hard",
          why: "IC-partial: a real property of stone, but on a different dimension from the weight the stem uses.",
        },
        {
          id: "D",
          text: "grey",
          why: "D: a property from another dimension entirely.",
        },
      ],
      explanation: "A feather is light; a stone is heavy. The property is weight both times.",
      answer: "B",
    },
    {
      id: "grade-5-14",
      kind: "text",
      tier: "NUMBER ANALOGY",
      domain: "quantitative",
      rule: "NA-3 two-step (x2 then +2)",
      prompt: "What number completes the last pair?",
      stem: "12 \u2192 26\n9 \u2192 20\n15 \u2192 ?",
      options: [
        { id: "A", text: "32" },
        {
          id: "B",
          text: "30",
          why: "IC-firststep: doubled and stopped, forgetting the +2.",
        },
        {
          id: "C",
          text: "17",
          why: "IC-secondstep: added 2 and skipped the doubling.",
        },
        {
          id: "D",
          text: "29",
          why: "WP-additive: added 14, the gap in the first pair.",
        },
      ],
      explanation: "Double, then add 2: 15 doubles to 30, plus 2 is 32.",
      answer: "A",
    },
    {
      id: "grade-5-15",
      kind: "figure",
      tier: "FIGURE MATRIX",
      domain: "spatial",
      rule: "FM-6 rotation across rows, FM-3 shading down columns (matRiks, 2 rules)",
      prompt: "Which figure completes the grid?",
      layout: "matrix",
      cells: [
        { shapes: [{ shape: "triangle", size: 0.374 }, { shape: "teardrop", size: 0.374 }] },
        {
          shapes: [
            { shape: "triangle", rotate: 90, size: 0.374 },
            { shape: "teardrop", rotate: 90, size: 0.374 },
          ],
        },
        {
          shapes: [
            { shape: "triangle", rotate: 180, size: 0.374 },
            { shape: "teardrop", rotate: 180, size: 0.374 },
          ],
        },
        {
          shapes: [
            { shape: "triangle", filled: true, color: "var(--color-gray-300)", size: 0.374 },
            { shape: "teardrop", filled: true, color: "var(--color-gray-300)", size: 0.374 },
          ],
        },
        {
          shapes: [
            { shape: "triangle", filled: true, color: "var(--color-gray-300)", rotate: 90, size: 0.374 },
            { shape: "teardrop", filled: true, color: "var(--color-gray-300)", rotate: 90, size: 0.374 },
          ],
        },
        {
          shapes: [
            { shape: "triangle", filled: true, color: "var(--color-gray-300)", rotate: 180, size: 0.374 },
            { shape: "teardrop", filled: true, color: "var(--color-gray-300)", rotate: 180, size: 0.374 },
          ],
        },
        {
          shapes: [
            { shape: "triangle", filled: true, size: 0.374 },
            { shape: "teardrop", filled: true, size: 0.374 },
          ],
        },
        {
          shapes: [
            { shape: "triangle", filled: true, rotate: 90, size: 0.374 },
            { shape: "teardrop", filled: true, rotate: 90, size: 0.374 },
          ],
        },
      ],
      options: [
        {
          id: "A",
          fig: { shapes: [{ shape: "triangle", size: 0.374 }, { shape: "teardrop", size: 0.374 }] },
          why: "WP-copy: the figure the grid starts from, with the rule not applied at all.",
        },
        {
          id: "B",
          fig: {
            shapes: [
              { shape: "triangle", filled: true, rotate: 270, size: 0.374 },
              { shape: "teardrop", filled: true, rotate: 270, size: 0.374 },
            ],
          },
          why: "IC-flip: everything else right, and the turn carried one step too far.",
        },
        { id: "C", fig: {
          shapes: [
            { shape: "triangle", filled: true, rotate: 180, size: 0.374 },
            { shape: "teardrop", filled: true, rotate: 180, size: 0.374 },
          ],
        } },
        {
          id: "D",
          fig: {
            shapes: [
              { shape: "triangle", filled: true, rotate: 90, size: 0.374 },
              { shape: "teardrop", filled: true, rotate: 90, size: 0.374 },
            ],
          },
          why: "R-left: copies the cell immediately to the left. Left-perseveration is the commonest matrix error.",
        },
      ],
      explanation: "Across a row, the figure turns a step further round. Down a column, the shading goes from white to grey to solid. The missing cell is whatever both of those give at once.",
      answer: "C",
    },
  ],
};
