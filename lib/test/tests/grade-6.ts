/**
 * 5-MINUTE GRADE 6 TEST — 15 items, 5 minutes, band L12.
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
 * The solver has to rank on a scale or handle an opposite; two operations, one of them a division; the grid turns by less than a quarter turn, or carries three rules.
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

export const GRADE_6_TEST: Test = {
  id: "grade-6",
  audience: "child",
  bank: "grade-6",
  grades: [6],
  band: "grade-6",
  title: "The 5-Minute Grade 6 Test",
  durationSeconds: 5 * 60,
  allowBack: true,
  items: [
    {
      id: "grade-6-01",
      kind: "text",
      tier: "VERBAL ANALOGY",
      domain: "verbal",
      rule: "VA-R10 degree on a scale, tier 2",
      prompt: "Complete the analogy.",
      stem: "DAMP is to SOAKED as CHILLY is to ?",
      options: [
        {
          id: "A",
          text: "lukewarm",
          why: "IC-degree: a temperature word that fails to escalate — it moves the other way along the same scale.",
        },
        { id: "B", text: "freezing" },
        {
          id: "C",
          text: "drenched",
          why: "WP-direction: the extreme of DAMP. Matched to the first pair rather than the second.",
        },
        {
          id: "D",
          text: "overcast",
          why: "D: a weather word, licensed by no relation in the stem.",
        },
      ],
      explanation: "Soaked is an extreme version of damp; freezing is an extreme version of chilly.",
      answer: "B",
    },
    {
      id: "grade-6-02",
      kind: "text",
      tier: "NUMBER ANALOGY",
      domain: "quantitative",
      rule: "NA-4 two-step (x3 then -2)",
      prompt: "What number completes the last pair?",
      stem: "6 \u2192 16\n9 \u2192 25\n11 \u2192 ?",
      options: [
        {
          id: "A",
          text: "33",
          why: "IC-firststep: multiplied and stopped, forgetting the -2.",
        },
        {
          id: "B",
          text: "9",
          why: "IC-secondstep: subtracted 2 and skipped the multiplication.",
        },
        { id: "C", text: "31" },
        {
          id: "D",
          text: "21",
          why: "WP-additive: added 10, the gap in the first pair.",
        },
      ],
      explanation: "Multiply by 3, then take 2 away: 11 times 3 is 33, minus 2 is 31.",
      answer: "C",
    },
    {
      id: "grade-6-03",
      kind: "figure",
      tier: "FIGURE MATRIX",
      domain: "spatial",
      rule: "FM-6 rotation across rows, FM-4 size down columns (matRiks, 2 rules)",
      prompt: "Which figure completes the grid?",
      layout: "matrix",
      cells: [
        { shapes: [{ shape: "teardrop", size: 0.8 }] },
        { shapes: [{ shape: "teardrop", rotate: 45, size: 0.8 }] },
        { shapes: [{ shape: "teardrop", rotate: 90, size: 0.8 }] },
        { shapes: [{ shape: "teardrop", size: 0.57 }] },
        { shapes: [{ shape: "teardrop", rotate: 45, size: 0.57 }] },
        { shapes: [{ shape: "teardrop", rotate: 90, size: 0.57 }] },
        { shapes: [{ shape: "teardrop", size: 0.34 }] },
        { shapes: [{ shape: "teardrop", rotate: 45, size: 0.34 }] },
      ],
      options: [
        { id: "A", fig: { shapes: [{ shape: "teardrop", rotate: 90, size: 0.34 }] } },
        {
          id: "B",
          fig: { shapes: [{ shape: "teardrop", size: 0.8 }] },
          why: "WP-copy: the figure the grid starts from, with the rule not applied at all.",
        },
        {
          id: "C",
          fig: { shapes: [{ shape: "teardrop", rotate: 135, size: 0.34 }] },
          why: "IC-flip: everything else right, and the turn carried one step too far.",
        },
        {
          id: "D",
          fig: { shapes: [{ shape: "teardrop", rotate: 45, size: 0.34 }] },
          why: "R-left: copies the cell immediately to the left. Left-perseveration is the commonest matrix error.",
        },
      ],
      explanation: "Across a row, the figure turns a step further round. Down a column, the figure gets smaller. The missing cell is whatever both of those give at once.",
      answer: "A",
    },
    {
      id: "grade-6-04",
      kind: "text",
      tier: "VERBAL ANALOGY",
      domain: "verbal",
      rule: "VA-R10 degree on a scale, tier 2",
      prompt: "Complete the analogy.",
      stem: "WHISPER is to YELL as SIP is to ?",
      options: [
        {
          id: "A",
          text: "taste",
          why: "IC-degree: smaller than a sip, so the escalation runs backwards.",
        },
        {
          id: "B",
          text: "pour",
          why: "WP-relation: something done TO a drink by someone else.",
        },
        {
          id: "C",
          text: "drink",
          why: "WP-relation: the general category rather than the intense version.",
        },
        { id: "D", text: "gulp" },
      ],
      explanation: "A yell is the loud version of a whisper; a gulp is the large version of a sip.",
      answer: "D",
    },
    {
      id: "grade-6-05",
      kind: "text",
      tier: "NUMBER ANALOGY",
      domain: "quantitative",
      rule: "NA-4 two-step (x3 then -3)",
      prompt: "What number completes the last pair?",
      stem: "8 \u2192 21\n12 \u2192 33\n15 \u2192 ?",
      options: [
        {
          id: "A",
          text: "45",
          why: "IC-firststep: multiplied and stopped, forgetting the -3.",
        },
        {
          id: "B",
          text: "12",
          why: "IC-secondstep: subtracted 3 and skipped the multiplication.",
        },
        { id: "C", text: "42" },
        {
          id: "D",
          text: "28",
          why: "WP-additive: added 13, the gap in the first pair.",
        },
      ],
      explanation: "Multiply by 3, then take 3 away: 15 times 3 is 45, minus 3 is 42.",
      answer: "C",
    },
    {
      id: "grade-6-06",
      kind: "figure",
      tier: "FIGURE MATRIX",
      domain: "spatial",
      rule: "FM-6 rotation across rows, FM-3 shading down columns (matRiks, 2 rules)",
      prompt: "Which figure completes the grid?",
      layout: "matrix",
      cells: [
        { shapes: [{ shape: "arrow", size: 0.68 }] },
        { shapes: [{ shape: "arrow", rotate: 90, size: 0.68 }] },
        { shapes: [{ shape: "arrow", rotate: 180, size: 0.68 }] },
        {
          shapes: [
            { shape: "arrow", filled: true, color: "var(--color-gray-300)", size: 0.68 },
          ],
        },
        {
          shapes: [
            { shape: "arrow", filled: true, color: "var(--color-gray-300)", rotate: 90, size: 0.68 },
          ],
        },
        {
          shapes: [
            { shape: "arrow", filled: true, color: "var(--color-gray-300)", rotate: 180, size: 0.68 },
          ],
        },
        { shapes: [{ shape: "arrow", filled: true, size: 0.68 }] },
        { shapes: [{ shape: "arrow", filled: true, rotate: 90, size: 0.68 }] },
      ],
      options: [
        {
          id: "A",
          fig: { shapes: [{ shape: "arrow", size: 0.68 }] },
          why: "WP-copy: the figure the grid starts from, with the rule not applied at all.",
        },
        {
          id: "B",
          fig: { shapes: [{ shape: "arrow", filled: true, rotate: 270, size: 0.68 }] },
          why: "IC-flip: everything else right, and the turn carried one step too far.",
        },
        { id: "C", fig: { shapes: [{ shape: "arrow", filled: true, rotate: 180, size: 0.68 }] } },
        {
          id: "D",
          fig: { shapes: [{ shape: "arrow", filled: true, rotate: 90, size: 0.68 }] },
          why: "R-left: copies the cell immediately to the left. Left-perseveration is the commonest matrix error.",
        },
      ],
      explanation: "Across a row, the figure turns a step further round. Down a column, the shading goes from white to gray to solid. The missing cell is whatever both of those give at once.",
      answer: "C",
    },
    {
      id: "grade-6-07",
      kind: "text",
      tier: "VERBAL ANALOGY",
      domain: "verbal",
      rule: "VA-R11 synonym, tier 2",
      prompt: "Complete the analogy.",
      stem: "BEGIN is to COMMENCE as END is to ?",
      options: [
        { id: "A", text: "conclude" },
        {
          id: "B",
          text: "start",
          why: "R-echo: a synonym of BEGIN, echoing the first pair instead of matching the second.",
        },
        {
          id: "C",
          text: "continue",
          why: "WP-relation: an adjacent stage rather than a synonym.",
        },
        {
          id: "D",
          text: "delay",
          why: "D: a time verb, licensed by no relation.",
        },
      ],
      explanation: "Commence is a formal word for begin; conclude is a formal word for end.",
      answer: "A",
    },
    {
      id: "grade-6-08",
      kind: "text",
      tier: "NUMBER ANALOGY",
      domain: "quantitative",
      rule: "NA-4 two-step (x5 then -2)",
      prompt: "What number completes the last pair?",
      stem: "7 \u2192 33\n5 \u2192 23\n9 \u2192 ?",
      options: [
        {
          id: "A",
          text: "45",
          why: "IC-firststep: multiplied and stopped, forgetting the -2.",
        },
        { id: "B", text: "43" },
        {
          id: "C",
          text: "35",
          why: "WP-additive: added 26, the gap in the first pair.",
        },
        {
          id: "D",
          text: "41",
          why: "IC-offby: subtracted 4 rather than 2.",
        },
      ],
      explanation: "Multiply by 5, then take 2 away: 9 times 5 is 45, minus 2 is 43.",
      answer: "B",
    },
    {
      id: "grade-6-09",
      kind: "figure",
      tier: "FIGURE MATRIX",
      domain: "spatial",
      rule: "FM-6 rotation across rows, FM-3 shading + FM-4 size down columns (matRiks, 3 rules)",
      prompt: "Which figure completes the grid?",
      layout: "matrix",
      cells: [
        { shapes: [{ shape: "teardrop", size: 0.44 }, { shape: "heart", size: 0.44 }] },
        {
          shapes: [
            { shape: "teardrop", rotate: 90, size: 0.44 },
            { shape: "heart", rotate: 90, size: 0.44 },
          ],
        },
        {
          shapes: [
            { shape: "teardrop", rotate: 180, size: 0.44 },
            { shape: "heart", rotate: 180, size: 0.44 },
          ],
        },
        {
          shapes: [
            { shape: "teardrop", filled: true, color: "var(--color-gray-300)", size: 0.34 },
            { shape: "heart", filled: true, color: "var(--color-gray-300)", size: 0.34 },
          ],
        },
        {
          shapes: [
            { shape: "teardrop", filled: true, color: "var(--color-gray-300)", rotate: 90, size: 0.34 },
            { shape: "heart", filled: true, color: "var(--color-gray-300)", rotate: 90, size: 0.34 },
          ],
        },
        {
          shapes: [
            { shape: "teardrop", filled: true, color: "var(--color-gray-300)", rotate: 180, size: 0.34 },
            { shape: "heart", filled: true, color: "var(--color-gray-300)", rotate: 180, size: 0.34 },
          ],
        },
        {
          shapes: [
            { shape: "teardrop", filled: true, size: 0.24 },
            { shape: "heart", filled: true, size: 0.24 },
          ],
        },
        {
          shapes: [
            { shape: "teardrop", filled: true, rotate: 90, size: 0.24 },
            { shape: "heart", filled: true, rotate: 90, size: 0.24 },
          ],
        },
      ],
      options: [
        {
          id: "A",
          fig: { shapes: [{ shape: "teardrop", size: 0.44 }, { shape: "heart", size: 0.44 }] },
          why: "WP-copy: the figure the grid starts from, with the rule not applied at all.",
        },
        {
          id: "B",
          fig: {
            shapes: [
              { shape: "teardrop", filled: true, rotate: 270, size: 0.24 },
              { shape: "heart", filled: true, rotate: 270, size: 0.24 },
            ],
          },
          why: "IC-flip: everything else right, and the turn carried one step too far.",
        },
        {
          id: "C",
          fig: {
            shapes: [
              { shape: "teardrop", filled: true, rotate: 90, size: 0.24 },
              { shape: "heart", filled: true, rotate: 90, size: 0.24 },
            ],
          },
          why: "R-left: copies the cell immediately to the left. Left-perseveration is the commonest matrix error.",
        },
        { id: "D", fig: {
          shapes: [
            { shape: "teardrop", filled: true, rotate: 180, size: 0.24 },
            { shape: "heart", filled: true, rotate: 180, size: 0.24 },
          ],
        } },
      ],
      explanation: "Across a row, the figure turns a step further round. Down a column, the shading goes from white to gray to solid and the figure gets smaller. The missing cell is whatever both of those give at once.",
      answer: "D",
    },
    {
      id: "grade-6-10",
      kind: "text",
      tier: "VERBAL ANALOGY",
      domain: "verbal",
      rule: "VA-R11 antonym, tier 2",
      prompt: "Complete the analogy.",
      stem: "GENEROUS is to STINGY as BRAVE is to ?",
      options: [
        {
          id: "A",
          text: "heroic",
          why: "WP-reverse: a synonym of BRAVE, so the relation runs the wrong way.",
        },
        { id: "B", text: "cowardly" },
        {
          id: "C",
          text: "careless",
          why: "IC-partial: opposed on a neighbouring dimension — caution rather than courage.",
        },
        {
          id: "D",
          text: "loyal",
          why: "D: a character word, licensed by no relation.",
        },
      ],
      explanation: "Stingy is the opposite of generous; cowardly is the opposite of brave.",
      answer: "B",
    },
    {
      id: "grade-6-11",
      kind: "text",
      tier: "NUMBER ANALOGY",
      domain: "quantitative",
      rule: "NA-5 division then adjustment (/3 then +2)",
      prompt: "What number completes the last pair?",
      stem: "24 \u2192 10\n36 \u2192 14\n48 \u2192 ?",
      options: [
        {
          id: "A",
          text: "16",
          why: "IC-firststep: divided and stopped, forgetting the +2.",
        },
        {
          id: "B",
          text: "50",
          why: "IC-secondstep: added 2 and skipped the division.",
        },
        {
          id: "C",
          text: "20",
          why: "IC-offby: divided correctly, then added 4 rather than 2.",
        },
        { id: "D", text: "18" },
      ],
      explanation: "Divide by 3, then add 2: 48 over 3 is 16, plus 2 is 18.",
      answer: "D",
    },
    {
      id: "grade-6-12",
      kind: "figure",
      tier: "FIGURE MATRIX",
      domain: "spatial",
      rule: "FM-3 shading + FM-4 size across rows, FM-6 rotation down columns (matRiks, 3 rules)",
      prompt: "Which figure completes the grid?",
      layout: "matrix",
      cells: [
        { shapes: [{ shape: "heart", size: 0.8 }] },
        {
          shapes: [
            { shape: "heart", filled: true, color: "var(--color-gray-300)", size: 0.57 },
          ],
        },
        { shapes: [{ shape: "heart", filled: true, size: 0.34 }] },
        { shapes: [{ shape: "heart", rotate: 45, size: 0.8 }] },
        {
          shapes: [
            { shape: "heart", filled: true, color: "var(--color-gray-300)", rotate: 45, size: 0.57 },
          ],
        },
        { shapes: [{ shape: "heart", filled: true, rotate: 45, size: 0.34 }] },
        { shapes: [{ shape: "heart", rotate: 90, size: 0.8 }] },
        {
          shapes: [
            { shape: "heart", filled: true, color: "var(--color-gray-300)", rotate: 90, size: 0.57 },
          ],
        },
      ],
      options: [
        {
          id: "A",
          fig: { shapes: [{ shape: "heart", size: 0.8 }] },
          why: "WP-copy: the figure the grid starts from, with the rule not applied at all.",
        },
        { id: "B", fig: { shapes: [{ shape: "heart", filled: true, rotate: 90, size: 0.34 }] } },
        {
          id: "C",
          fig: { shapes: [{ shape: "heart", filled: true, rotate: 135, size: 0.34 }] },
          why: "IC-flip: everything else right, and the turn carried one step too far.",
        },
        {
          id: "D",
          fig: {
            shapes: [
              { shape: "heart", filled: true, color: "var(--color-gray-300)", rotate: 90, size: 0.57 },
            ],
          },
          why: "R-left: copies the cell immediately to the left. Left-perseveration is the commonest matrix error.",
        },
      ],
      explanation: "Across a row, the shading goes from white to gray to solid and the figure gets smaller. Down a column, the figure turns a step further round. The missing cell is whatever both of those give at once.",
      answer: "B",
    },
    {
      id: "grade-6-13",
      kind: "text",
      tier: "VERBAL ANALOGY",
      domain: "verbal",
      rule: "VA-R11 antonym, single-dimension opposition, tier 2",
      prompt: "Complete the analogy.",
      stem: "ABUNDANT is to SCARCE as VOLUNTARY is to ?",
      options: [
        {
          id: "A",
          text: "optional",
          why: "WP-reverse: a synonym of VOLUNTARY, so the relation runs backwards.",
        },
        {
          id: "B",
          text: "reluctant",
          why: "IC-partial: opposed on willingness rather than on whether there is a choice at all.",
        },
        { id: "C", text: "required" },
        {
          id: "D",
          text: "unpaid",
          why: "D: a word from the same field, licensed by no relation.",
        },
      ],
      explanation: "Scarce is the opposite of abundant; required is the opposite of voluntary.",
      answer: "C",
    },
    {
      id: "grade-6-14",
      kind: "text",
      tier: "NUMBER ANALOGY",
      domain: "quantitative",
      rule: "NA-5 division then adjustment (/4 then +3)",
      prompt: "What number completes the last pair?",
      stem: "60 \u2192 18\n44 \u2192 14\n80 \u2192 ?",
      options: [
        { id: "A", text: "23" },
        {
          id: "B",
          text: "20",
          why: "IC-firststep: divided and stopped, forgetting the +3.",
        },
        {
          id: "C",
          text: "83",
          why: "IC-secondstep: added 3 and skipped the division.",
        },
        {
          id: "D",
          text: "17",
          why: "WP-direction: divided correctly, then subtracted the 3 instead of adding it.",
        },
      ],
      explanation: "Divide by 4, then add 3: 80 over 4 is 20, plus 3 is 23.",
      answer: "A",
    },
    {
      id: "grade-6-15",
      kind: "figure",
      tier: "FIGURE MATRIX",
      domain: "spatial",
      rule: "FM-4 size + FM-6 rotation across rows, FM-3 shading down columns (matRiks, 3 rules)",
      prompt: "Which figure completes the grid?",
      layout: "matrix",
      cells: [
        { shapes: [{ shape: "triangle", size: 0.44 }, { shape: "arrow", size: 0.44 }] },
        {
          shapes: [
            { shape: "triangle", rotate: 90, size: 0.34 },
            { shape: "arrow", rotate: 90, size: 0.34 },
          ],
        },
        {
          shapes: [
            { shape: "triangle", rotate: 180, size: 0.24 },
            { shape: "arrow", rotate: 180, size: 0.24 },
          ],
        },
        {
          shapes: [
            { shape: "triangle", filled: true, color: "var(--color-gray-300)", size: 0.44 },
            { shape: "arrow", filled: true, color: "var(--color-gray-300)", size: 0.44 },
          ],
        },
        {
          shapes: [
            { shape: "triangle", filled: true, color: "var(--color-gray-300)", rotate: 90, size: 0.34 },
            { shape: "arrow", filled: true, color: "var(--color-gray-300)", rotate: 90, size: 0.34 },
          ],
        },
        {
          shapes: [
            { shape: "triangle", filled: true, color: "var(--color-gray-300)", rotate: 180, size: 0.24 },
            { shape: "arrow", filled: true, color: "var(--color-gray-300)", rotate: 180, size: 0.24 },
          ],
        },
        {
          shapes: [
            { shape: "triangle", filled: true, size: 0.44 },
            { shape: "arrow", filled: true, size: 0.44 },
          ],
        },
        {
          shapes: [
            { shape: "triangle", filled: true, rotate: 90, size: 0.34 },
            { shape: "arrow", filled: true, rotate: 90, size: 0.34 },
          ],
        },
      ],
      options: [
        { id: "A", fig: {
          shapes: [
            { shape: "triangle", filled: true, rotate: 180, size: 0.24 },
            { shape: "arrow", filled: true, rotate: 180, size: 0.24 },
          ],
        } },
        {
          id: "B",
          fig: { shapes: [{ shape: "triangle", size: 0.44 }, { shape: "arrow", size: 0.44 }] },
          why: "WP-copy: the figure the grid starts from, with the rule not applied at all.",
        },
        {
          id: "C",
          fig: {
            shapes: [
              { shape: "triangle", filled: true, rotate: 270, size: 0.24 },
              { shape: "arrow", filled: true, rotate: 270, size: 0.24 },
            ],
          },
          why: "IC-flip: everything else right, and the turn carried one step too far.",
        },
        {
          id: "D",
          fig: {
            shapes: [
              { shape: "triangle", filled: true, rotate: 90, size: 0.34 },
              { shape: "arrow", filled: true, rotate: 90, size: 0.34 },
            ],
          },
          why: "R-left: copies the cell immediately to the left. Left-perseveration is the commonest matrix error.",
        },
      ],
      explanation: "Across a row, the figure gets smaller and the figure turns a step further round. Down a column, the shading goes from white to gray to solid. The missing cell is whatever both of those give at once.",
      answer: "A",
    },
  ],
};
