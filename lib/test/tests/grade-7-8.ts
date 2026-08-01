/**
 * 5-MINUTE GRADE 7 AND 8 TEST — 15 items, 5 minutes, band L13/14.
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
 * At least one abstract noun per verbal item; non-unit ratios like three halves; the grid combines two cells with a logical operator.
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

export const GRADE_7_8_TEST: Test = {
  id: "grade-7-8",
  audience: "child",
  bank: "grade-7-8",
  grades: [7, 8],
  band: "grade-7-8",
  title: "The 5-Minute Grade 7 and 8 Test",
  durationSeconds: 5 * 60,
  allowBack: true,
  items: [
    {
      id: "grade-7-8-01",
      kind: "text",
      tier: "VERBAL ANALOGY",
      domain: "verbal",
      rule: "VA-R13 quality to the thing it lacks, tier 2",
      prompt: "Complete the analogy.",
      stem: "VACANT is to OCCUPANTS as MUTE is to ?",
      options: [
        { id: "A", text: "speech" },
        {
          id: "B",
          text: "silence",
          why: "WP-reverse: what a mute thing HAS rather than what it lacks.",
        },
        {
          id: "C",
          text: "listener",
          why: "WP-relation: the other party, not the thing withheld.",
        },
        {
          id: "D",
          text: "gesture",
          why: "D: another means of communication, licensed by no relation.",
        },
      ],
      explanation: "A vacant room is defined by the occupants it lacks; a mute thing by the speech it lacks.",
      answer: "A",
    },
    {
      id: "grade-7-8-02",
      kind: "text",
      tier: "NUMBER ANALOGY",
      domain: "quantitative",
      rule: "NA-6 non-unit ratio (x3/2)",
      prompt: "What number completes the last pair?",
      stem: "8 \u2192 12\n14 \u2192 21\n20 \u2192 ?",
      options: [
        {
          id: "A",
          text: "24",
          why: "WP-additive: added 4, the gap in the first pair, instead of scaling.",
        },
        { id: "B", text: "30" },
        {
          id: "C",
          text: "10",
          why: "IC-firststep: halved and stopped, without the multiplication by 3.",
        },
        {
          id: "D",
          text: "60",
          why: "IC: multiplied by 3 and forgot to halve.",
        },
      ],
      explanation: "Each number becomes one and a half times itself: 20 becomes 30.",
      answer: "B",
    },
    {
      id: "grade-7-8-03",
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
        { shapes: [{ shape: "heart", rotate: 90, size: 0.8 }] },
        {
          shapes: [
            { shape: "heart", filled: true, color: "var(--color-gray-300)", rotate: 90, size: 0.57 },
          ],
        },
        { shapes: [{ shape: "heart", filled: true, rotate: 90, size: 0.34 }] },
        { shapes: [{ shape: "heart", rotate: 180, size: 0.8 }] },
        {
          shapes: [
            { shape: "heart", filled: true, color: "var(--color-gray-300)", rotate: 180, size: 0.57 },
          ],
        },
      ],
      options: [
        {
          id: "A",
          fig: { shapes: [{ shape: "heart", size: 0.8 }] },
          why: "WP-copy: the figure the grid starts from, with the rule not applied at all.",
        },
        { id: "B", fig: { shapes: [{ shape: "heart", filled: true, rotate: 180, size: 0.34 }] } },
        {
          id: "C",
          fig: { shapes: [{ shape: "heart", filled: true, rotate: 270, size: 0.34 }] },
          why: "IC-flip: everything else right, and the turn carried one step too far.",
        },
        {
          id: "D",
          fig: {
            shapes: [
              { shape: "heart", filled: true, color: "var(--color-gray-300)", rotate: 180, size: 0.57 },
            ],
          },
          why: "R-left: copies the cell immediately to the left. Left-perseveration is the commonest matrix error.",
        },
      ],
      explanation: "Across a row, the shading goes from white to grey to solid and the figure gets smaller. Down a column, the figure turns a step further round. The missing cell is whatever both of those give at once.",
      answer: "B",
    },
    {
      id: "grade-7-8-04",
      kind: "text",
      tier: "VERBAL ANALOGY",
      domain: "verbal",
      rule: "VA-R13 quality to the thing it lacks, tier 3 capped at one rare word",
      prompt: "Complete the analogy.",
      stem: "STERILE is to LIFE as ARID is to ?",
      options: [
        {
          id: "A",
          text: "desert",
          why: "WP-relation: the place that is arid, not the thing absent from it.",
        },
        {
          id: "B",
          text: "heat",
          why: "WP-relation: what accompanies aridity, not what is missing.",
        },
        { id: "C", text: "moisture" },
        {
          id: "D",
          text: "sand",
          why: "D: a word from the same field, licensed by no relation.",
        },
      ],
      explanation: "Sterile ground has no life; arid ground has no moisture.",
      answer: "C",
    },
    {
      id: "grade-7-8-05",
      kind: "text",
      tier: "NUMBER ANALOGY",
      domain: "quantitative",
      rule: "NA-6 non-unit ratio (x2/3)",
      prompt: "What number completes the last pair?",
      stem: "45 \u2192 30\n21 \u2192 14\n36 \u2192 ?",
      options: [
        { id: "A", text: "24" },
        {
          id: "B",
          text: "12",
          why: "IC-firststep: divided by 3 and stopped, without multiplying back by 2.",
        },
        {
          id: "C",
          text: "21",
          why: "WP-additive: subtracted 15, the gap in the first pair, instead of scaling.",
        },
        {
          id: "D",
          text: "54",
          why: "WP-inverse: applied the ratio upside down, scaling up by three halves.",
        },
      ],
      explanation: "Each number becomes two thirds of itself: 36 becomes 24.",
      answer: "A",
    },
    {
      id: "grade-7-8-06",
      kind: "figure",
      tier: "FIGURE MATRIX",
      domain: "spatial",
      rule: "FM-12 logical combination (exclusive or) across rows (matRiks, 1 rule)",
      prompt: "Which figure completes the grid?",
      layout: "matrix",
      cells: [
        {
          shapes: [
            { shape: "circle", size: 0.357, x: 0.29, y: 0.29 },
            { shape: "square", size: 0.357, x: 0.71, y: 0.29 },
            { shape: "triangle", size: 0.357, x: 0.29, y: 0.71 },
          ],
        },
        {
          shapes: [
            { shape: "circle", size: 0.357, x: 0.29, y: 0.29 },
            { shape: "triangle", size: 0.357, x: 0.29, y: 0.71 },
            { shape: "star", size: 0.357, x: 0.71, y: 0.71 },
          ],
        },
        {
          shapes: [
            { shape: "square", size: 0.357, x: 0.71, y: 0.29 },
            { shape: "star", size: 0.357, x: 0.71, y: 0.71 },
          ],
        },
        {
          shapes: [
            { shape: "circle", size: 0.357, x: 0.29, y: 0.29 },
            { shape: "square", size: 0.357, x: 0.71, y: 0.29 },
            { shape: "triangle", size: 0.357, x: 0.29, y: 0.71 },
          ],
        },
        {
          shapes: [
            { shape: "square", size: 0.357, x: 0.71, y: 0.29 },
            { shape: "triangle", size: 0.357, x: 0.29, y: 0.71 },
            { shape: "star", size: 0.357, x: 0.71, y: 0.71 },
          ],
        },
        {
          shapes: [
            { shape: "circle", size: 0.357, x: 0.29, y: 0.29 },
            { shape: "star", size: 0.357, x: 0.71, y: 0.71 },
          ],
        },
        {
          shapes: [
            { shape: "circle", size: 0.357, x: 0.29, y: 0.29 },
            { shape: "square", size: 0.357, x: 0.71, y: 0.29 },
            { shape: "star", size: 0.357, x: 0.71, y: 0.71 },
          ],
        },
        {
          shapes: [
            { shape: "circle", size: 0.357, x: 0.29, y: 0.29 },
            { shape: "triangle", size: 0.357, x: 0.29, y: 0.71 },
            { shape: "star", size: 0.357, x: 0.71, y: 0.71 },
          ],
        },
      ],
      options: [
        {
          id: "A",
          fig: {
            shapes: [
              { shape: "circle", size: 0.357, x: 0.29, y: 0.29 },
              { shape: "square", size: 0.357, x: 0.71, y: 0.29 },
              { shape: "triangle", size: 0.357, x: 0.29, y: 0.71 },
              { shape: "star", size: 0.357, x: 0.71, y: 0.71 },
            ],
          },
          why: "WP-union: kept every shape that appears in either of the first two cells. That is 'or', not the rule the rows actually use.",
        },
        {
          id: "B",
          fig: { shapes: [{ shape: "square", size: 0.357, x: 0.71, y: 0.29 }] },
          why: "IC-inc: applied the rule and then dropped one of the shapes it produces.",
        },
        {
          id: "C",
          fig: {
            shapes: [
              { shape: "circle", size: 0.357, x: 0.29, y: 0.29 },
              { shape: "triangle", size: 0.357, x: 0.29, y: 0.71 },
              { shape: "star", size: 0.357, x: 0.71, y: 0.71 },
            ],
          },
          why: "R-left: copies the cell immediately to the left. Left-perseveration is the commonest matrix error.",
        },
        { id: "D", fig: {
          shapes: [
            { shape: "square", size: 0.357, x: 0.71, y: 0.29 },
            { shape: "triangle", size: 0.357, x: 0.29, y: 0.71 },
          ],
        } },
      ],
      explanation: "Along each row, the third cell keeps the shapes that appear in exactly one of the first two, and drops the ones in both. The missing cell is whatever both of those give at once.",
      answer: "D",
    },
    {
      id: "grade-7-8-07",
      kind: "text",
      tier: "VERBAL ANALOGY",
      domain: "verbal",
      rule: "VA-R10 degree on a scale, tier 3 capped at one rare word",
      prompt: "Complete the analogy.",
      stem: "ANNOYED is to FURIOUS as PLEASED is to ?",
      options: [
        {
          id: "A",
          text: "content",
          why: "IC-degree: the same direction but weaker than 'pleased', so the escalation runs backwards.",
        },
        { id: "B", text: "elated" },
        {
          id: "C",
          text: "grateful",
          why: "WP-relation: a related feeling rather than a stronger version of the same one.",
        },
        {
          id: "D",
          text: "calm",
          why: "D: a mood word, licensed by no relation.",
        },
      ],
      explanation: "Furious is the extreme of annoyed; elated is the extreme of pleased.",
      answer: "B",
    },
    {
      id: "grade-7-8-08",
      kind: "text",
      tier: "NUMBER ANALOGY",
      domain: "quantitative",
      rule: "NA-4 two-step (x4 then -2)",
      prompt: "What number completes the last pair?",
      stem: "7 \u2192 26\n4 \u2192 14\n11 \u2192 ?",
      options: [
        {
          id: "A",
          text: "44",
          why: "IC-firststep: multiplied and stopped, forgetting the -2.",
        },
        {
          id: "B",
          text: "30",
          why: "WP-additive: added 19, the gap in the first pair.",
        },
        { id: "C", text: "42" },
        {
          id: "D",
          text: "9",
          why: "IC-secondstep: subtracted 2 and skipped the multiplication.",
        },
      ],
      explanation: "Multiply by 4, then take 2 away: 11 times 4 is 44, minus 2 is 42.",
      answer: "C",
    },
    {
      id: "grade-7-8-09",
      kind: "figure",
      tier: "FIGURE MATRIX",
      domain: "spatial",
      rule: "FM-6 rotation + FM-4 size across rows, FM-3 shading down columns (matRiks, 3 rules)",
      prompt: "Which figure completes the grid?",
      layout: "matrix",
      cells: [
        { shapes: [{ shape: "arrow", size: 0.44 }, { shape: "teardrop", size: 0.44 }] },
        {
          shapes: [
            { shape: "arrow", rotate: 45, size: 0.34 },
            { shape: "teardrop", rotate: 45, size: 0.34 },
          ],
        },
        {
          shapes: [
            { shape: "arrow", rotate: 90, size: 0.24 },
            { shape: "teardrop", rotate: 90, size: 0.24 },
          ],
        },
        {
          shapes: [
            { shape: "arrow", filled: true, color: "var(--color-gray-300)", size: 0.44 },
            { shape: "teardrop", filled: true, color: "var(--color-gray-300)", size: 0.44 },
          ],
        },
        {
          shapes: [
            { shape: "arrow", filled: true, color: "var(--color-gray-300)", rotate: 45, size: 0.34 },
            { shape: "teardrop", filled: true, color: "var(--color-gray-300)", rotate: 45, size: 0.34 },
          ],
        },
        {
          shapes: [
            { shape: "arrow", filled: true, color: "var(--color-gray-300)", rotate: 90, size: 0.24 },
            { shape: "teardrop", filled: true, color: "var(--color-gray-300)", rotate: 90, size: 0.24 },
          ],
        },
        {
          shapes: [
            { shape: "arrow", filled: true, size: 0.44 },
            { shape: "teardrop", filled: true, size: 0.44 },
          ],
        },
        {
          shapes: [
            { shape: "arrow", filled: true, rotate: 45, size: 0.34 },
            { shape: "teardrop", filled: true, rotate: 45, size: 0.34 },
          ],
        },
      ],
      options: [
        {
          id: "A",
          fig: { shapes: [{ shape: "arrow", size: 0.44 }, { shape: "teardrop", size: 0.44 }] },
          why: "WP-copy: the figure the grid starts from, with the rule not applied at all.",
        },
        {
          id: "B",
          fig: {
            shapes: [
              { shape: "arrow", filled: true, rotate: 135, size: 0.24 },
              { shape: "teardrop", filled: true, rotate: 135, size: 0.24 },
            ],
          },
          why: "IC-flip: everything else right, and the turn carried one step too far.",
        },
        { id: "C", fig: {
          shapes: [
            { shape: "arrow", filled: true, rotate: 90, size: 0.24 },
            { shape: "teardrop", filled: true, rotate: 90, size: 0.24 },
          ],
        } },
        {
          id: "D",
          fig: {
            shapes: [
              { shape: "arrow", filled: true, rotate: 45, size: 0.34 },
              { shape: "teardrop", filled: true, rotate: 45, size: 0.34 },
            ],
          },
          why: "R-left: copies the cell immediately to the left. Left-perseveration is the commonest matrix error.",
        },
      ],
      explanation: "Across a row, the figure turns a step further round and the figure gets smaller. Down a column, the shading goes from white to grey to solid. The missing cell is whatever both of those give at once.",
      answer: "C",
    },
    {
      id: "grade-7-8-10",
      kind: "text",
      tier: "VERBAL ANALOGY",
      domain: "verbal",
      rule: "VA-R8 cause to effect, both terms abstract",
      prompt: "Complete the analogy.",
      stem: "NEGLECT is to DECAY as ISOLATION is to ?",
      options: [
        { id: "A", text: "loneliness" },
        {
          id: "B",
          text: "absence",
          why: "WP-relation: a restatement of isolation rather than what it produces.",
        },
        {
          id: "C",
          text: "distance",
          why: "WP-reverse: what causes isolation rather than what isolation causes.",
        },
        {
          id: "D",
          text: "freedom",
          why: "D: a state sometimes associated with solitude, licensed by no relation.",
        },
      ],
      explanation: "Neglect produces decay; isolation produces loneliness.",
      answer: "A",
    },
    {
      id: "grade-7-8-11",
      kind: "text",
      tier: "NUMBER ANALOGY",
      domain: "quantitative",
      rule: "NA-6 non-unit ratio (x3/4)",
      prompt: "What number completes the last pair?",
      stem: "80 \u2192 60\n48 \u2192 36\n120 \u2192 ?",
      options: [
        {
          id: "A",
          text: "30",
          why: "IC-firststep: divided by 4 and stopped, without multiplying back by 3.",
        },
        {
          id: "B",
          text: "160",
          why: "WP-inverse: applied the ratio upside down, scaling up by four thirds.",
        },
        {
          id: "C",
          text: "100",
          why: "WP-additive: subtracted 20, the gap in the first pair, instead of scaling.",
        },
        { id: "D", text: "90" },
      ],
      explanation: "Each number becomes three quarters of itself: 120 becomes 90.",
      answer: "D",
    },
    {
      id: "grade-7-8-12",
      kind: "figure",
      tier: "FIGURE MATRIX",
      domain: "spatial",
      rule: "FM-12 logical combination (and) across rows (matRiks, 1 rule)",
      prompt: "Which figure completes the grid?",
      layout: "matrix",
      cells: [
        {
          shapes: [
            { shape: "heart", size: 0.357, x: 0.29, y: 0.29 },
            { shape: "cross", size: 0.357, x: 0.71, y: 0.29 },
            { shape: "diamond", size: 0.357, x: 0.29, y: 0.71 },
          ],
        },
        {
          shapes: [
            { shape: "heart", size: 0.357, x: 0.29, y: 0.29 },
            { shape: "diamond", size: 0.357, x: 0.29, y: 0.71 },
            { shape: "lightning", size: 0.357, x: 0.71, y: 0.71 },
          ],
        },
        {
          shapes: [
            { shape: "heart", size: 0.357, x: 0.29, y: 0.29 },
            { shape: "diamond", size: 0.357, x: 0.29, y: 0.71 },
          ],
        },
        {
          shapes: [
            { shape: "heart", size: 0.357, x: 0.29, y: 0.29 },
            { shape: "cross", size: 0.357, x: 0.71, y: 0.29 },
            { shape: "diamond", size: 0.357, x: 0.29, y: 0.71 },
          ],
        },
        {
          shapes: [
            { shape: "cross", size: 0.357, x: 0.71, y: 0.29 },
            { shape: "diamond", size: 0.357, x: 0.29, y: 0.71 },
            { shape: "lightning", size: 0.357, x: 0.71, y: 0.71 },
          ],
        },
        {
          shapes: [
            { shape: "cross", size: 0.357, x: 0.71, y: 0.29 },
            { shape: "diamond", size: 0.357, x: 0.29, y: 0.71 },
          ],
        },
        {
          shapes: [
            { shape: "heart", size: 0.357, x: 0.29, y: 0.29 },
            { shape: "cross", size: 0.357, x: 0.71, y: 0.29 },
            { shape: "lightning", size: 0.357, x: 0.71, y: 0.71 },
          ],
        },
        {
          shapes: [
            { shape: "heart", size: 0.357, x: 0.29, y: 0.29 },
            { shape: "diamond", size: 0.357, x: 0.29, y: 0.71 },
            { shape: "lightning", size: 0.357, x: 0.71, y: 0.71 },
          ],
        },
      ],
      options: [
        { id: "A", fig: {
          shapes: [
            { shape: "heart", size: 0.357, x: 0.29, y: 0.29 },
            { shape: "lightning", size: 0.357, x: 0.71, y: 0.71 },
          ],
        } },
        {
          id: "B",
          fig: {
            shapes: [
              { shape: "heart", size: 0.357, x: 0.29, y: 0.29 },
              { shape: "cross", size: 0.357, x: 0.71, y: 0.29 },
              { shape: "diamond", size: 0.357, x: 0.29, y: 0.71 },
              { shape: "lightning", size: 0.357, x: 0.71, y: 0.71 },
            ],
          },
          why: "WP-union: kept every shape that appears in either of the first two cells. That is 'or', not the rule the rows actually use.",
        },
        {
          id: "C",
          fig: { shapes: [{ shape: "heart", size: 0.357, x: 0.29, y: 0.29 }] },
          why: "IC-inc: applied the rule and then dropped one of the shapes it produces.",
        },
        {
          id: "D",
          fig: {
            shapes: [
              { shape: "heart", size: 0.357, x: 0.29, y: 0.29 },
              { shape: "diamond", size: 0.357, x: 0.29, y: 0.71 },
              { shape: "lightning", size: 0.357, x: 0.71, y: 0.71 },
            ],
          },
          why: "R-left: copies the cell immediately to the left. Left-perseveration is the commonest matrix error.",
        },
      ],
      explanation: "Along each row, the third cell keeps only the shapes that appear in both of the first two. The missing cell is whatever both of those give at once.",
      answer: "A",
    },
    {
      id: "grade-7-8-13",
      kind: "text",
      tier: "VERBAL ANALOGY",
      domain: "verbal",
      rule: "VA-R6 disposition to the event it invites, tier 2-3",
      prompt: "Complete the analogy.",
      stem: "FRAGILE is to BREAK as FLAMMABLE is to ?",
      options: [
        {
          id: "A",
          text: "extinguish",
          why: "WP-reverse: what is done TO it to stop it, not what it readily does.",
        },
        {
          id: "B",
          text: "melt",
          why: "WP-relation: another thing heat does to a material, but not what 'flammable' names.",
        },
        { id: "C", text: "burn" },
        {
          id: "D",
          text: "shatter",
          why: "R-echo: the verb belonging to the first pair.",
        },
      ],
      explanation: "A fragile thing is liable to break; a flammable thing is liable to burn.",
      answer: "C",
    },
    {
      id: "grade-7-8-14",
      kind: "text",
      tier: "NUMBER ANALOGY",
      domain: "quantitative",
      rule: "NA-4 two-step (x3 then +5)",
      prompt: "What number completes the last pair?",
      stem: "13 \u2192 44\n9 \u2192 32\n16 \u2192 ?",
      options: [
        {
          id: "A",
          text: "48",
          why: "IC-firststep: multiplied and stopped, forgetting the +5.",
        },
        { id: "B", text: "53" },
        {
          id: "C",
          text: "21",
          why: "IC-secondstep: added 5 and skipped the multiplication.",
        },
        {
          id: "D",
          text: "47",
          why: "WP-additive: added 31, the gap in the first pair.",
        },
      ],
      explanation: "Multiply by 3, then add 5: 16 times 3 is 48, plus 5 is 53.",
      answer: "B",
    },
    {
      id: "grade-7-8-15",
      kind: "figure",
      tier: "FIGURE MATRIX",
      domain: "spatial",
      rule: "FM-3 shading + FM-6 rotation across rows, FM-4 size down columns (matRiks, 3 rules)",
      prompt: "Which figure completes the grid?",
      layout: "matrix",
      cells: [
        { shapes: [{ shape: "teardrop", size: 0.8 }] },
        {
          shapes: [
            { shape: "teardrop", filled: true, color: "var(--color-gray-300)", rotate: 45, size: 0.8 },
          ],
        },
        { shapes: [{ shape: "teardrop", filled: true, rotate: 90, size: 0.8 }] },
        { shapes: [{ shape: "teardrop", size: 0.57 }] },
        {
          shapes: [
            { shape: "teardrop", filled: true, color: "var(--color-gray-300)", rotate: 45, size: 0.57 },
          ],
        },
        { shapes: [{ shape: "teardrop", filled: true, rotate: 90, size: 0.57 }] },
        { shapes: [{ shape: "teardrop", size: 0.34 }] },
        {
          shapes: [
            { shape: "teardrop", filled: true, color: "var(--color-gray-300)", rotate: 45, size: 0.34 },
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
          fig: { shapes: [{ shape: "teardrop", filled: true, rotate: 135, size: 0.34 }] },
          why: "IC-flip: everything else right, and the turn carried one step too far.",
        },
        {
          id: "C",
          fig: {
            shapes: [
              { shape: "teardrop", filled: true, color: "var(--color-gray-300)", rotate: 45, size: 0.34 },
            ],
          },
          why: "R-left: copies the cell immediately to the left. Left-perseveration is the commonest matrix error.",
        },
        { id: "D", fig: { shapes: [{ shape: "teardrop", filled: true, rotate: 90, size: 0.34 }] } },
      ],
      explanation: "Across a row, the shading goes from white to grey to solid and the figure turns a step further round. Down a column, the figure gets smaller. The missing cell is whatever both of those give at once.",
      answer: "D",
    },
  ],
};
