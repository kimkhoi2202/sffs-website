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
      rule: "VA-R6 disposition to the event it invites, tier 2-3",
      prompt: "Complete the analogy.",
      stem: "FRAGILE is to BREAK as FLAMMABLE is to ?",
      options: [
        { id: "A", text: "burn" },
        {
          id: "B",
          text: "extinguish",
          why: "WP-reverse: what is done TO it to stop it, not what it readily does.",
        },
        {
          id: "C",
          text: "melt",
          why: "WP-relation: another thing heat does to a material, but not what 'flammable' names.",
        },
        {
          id: "D",
          text: "shatter",
          why: "R-echo: the verb belonging to the first pair.",
        },
      ],
      explanation: "Each first word describes what a thing is liable to do: fragile things break, flammable things burn. 'Extinguish' is what someone does TO a fire, not what the flammable thing itself does, and 'shatter' belongs to the fragile half of the pair.",
      answer: "A",
    },
    {
      id: "grade-7-8-02",
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
        { id: "B", text: "42" },
        {
          id: "C",
          text: "30",
          why: "WP-additive: added 19, the gap in the first pair.",
        },
        {
          id: "D",
          text: "9",
          why: "IC-secondstep: subtracted 2 and skipped the multiplication.",
        },
      ],
      explanation: "Multiply by 4, then take 2 away: 11 times 4 is 44, minus 2 is 42.",
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
      explanation: "Across a row, the shading goes from white to gray to solid and the figure gets smaller. Down a column, the figure turns a step further round. The missing cell is whatever both of those give at once.",
      answer: "B",
    },
    {
      id: "grade-7-8-04",
      kind: "text",
      tier: "VERBAL ANALOGY",
      domain: "verbal",
      rule: "VA-R13 quality to the thing it lacks, tier 2",
      prompt: "Complete the analogy.",
      stem: "VACANT is to OCCUPANTS as MUTE is to ?",
      options: [
        {
          id: "A",
          text: "silence",
          why: "WP-reverse: what a mute thing HAS rather than what it lacks.",
        },
        {
          id: "B",
          text: "listener",
          why: "WP-relation: the other party, not the thing withheld.",
        },
        { id: "C", text: "speech" },
        {
          id: "D",
          text: "gesture",
          why: "D: another means of communication, licensed by no relation.",
        },
      ],
      explanation: "Each pair names a state by what is missing from it: a vacant room lacks occupants, a mute thing lacks speech. 'Silence' is the strong near-miss — it is the RESULT of that absence rather than the thing that is absent.",
      answer: "C",
    },
    {
      id: "grade-7-8-05",
      kind: "text",
      tier: "NUMBER ANALOGY",
      domain: "quantitative",
      rule: "NA-4 two-step (x3 then +5)",
      prompt: "What number completes the last pair?",
      stem: "13 \u2192 44\n9 \u2192 32\n16 \u2192 ?",
      options: [
        { id: "A", text: "53" },
        {
          id: "B",
          text: "48",
          why: "IC-firststep: multiplied and stopped, forgetting the +5.",
        },
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
      answer: "A",
    },
    {
      id: "grade-7-8-06",
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
        {
          id: "C",
          fig: {
            shapes: [
              { shape: "arrow", filled: true, rotate: 45, size: 0.34 },
              { shape: "teardrop", filled: true, rotate: 45, size: 0.34 },
            ],
          },
          why: "R-left: copies the cell immediately to the left. Left-perseveration is the commonest matrix error.",
        },
        { id: "D", fig: {
          shapes: [
            { shape: "arrow", filled: true, rotate: 90, size: 0.24 },
            { shape: "teardrop", filled: true, rotate: 90, size: 0.24 },
          ],
        } },
      ],
      explanation: "Across a row, the figure turns a step further round and the figure gets smaller. Down a column, the shading goes from white to gray to solid. The missing cell is whatever both of those give at once.",
      answer: "D",
    },
    {
      id: "grade-7-8-07",
      kind: "text",
      tier: "VERBAL ANALOGY",
      domain: "verbal",
      rule: "VA-R13 state defined by what is absent, tier 2, curriculum-neutral",
      prompt: "Complete the analogy.",
      stem: "FAMINE is to FOOD as DROUGHT is to ?",
      options: [
        {
          id: "A",
          text: "flood",
          why: "WP-reverse: the opposite condition rather than the thing that is missing.",
        },
        { id: "B", text: "rain" },
        {
          id: "C",
          text: "desert",
          why: "WP-relation: a place where drought is normal, not the thing absent from it.",
        },
        {
          id: "D",
          text: "heat",
          why: "WP-relation: what accompanies a drought rather than what it is a shortage of.",
        },
      ],
      explanation: "Each first word is a shortage of the second: a famine is a shortage of food, a drought is a shortage of rain. 'Desert' is tempting because it is dry, but it is a place where the shortage is normal rather than the thing in short supply.",
      answer: "B",
    },
    {
      id: "grade-7-8-08",
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
        {
          id: "B",
          text: "10",
          why: "IC-firststep: halved and stopped, without the multiplication by 3.",
        },
        { id: "C", text: "30" },
        {
          id: "D",
          text: "60",
          why: "IC: multiplied by 3 and forgot to halve.",
        },
      ],
      explanation: "Each number becomes one and a half times itself: 20 becomes 30.",
      answer: "C",
    },
    {
      id: "grade-7-8-09",
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
        { id: "C", fig: { shapes: [{ shape: "teardrop", filled: true, rotate: 90, size: 0.34 }] } },
        {
          id: "D",
          fig: {
            shapes: [
              { shape: "teardrop", filled: true, color: "var(--color-gray-300)", rotate: 45, size: 0.34 },
            ],
          },
          why: "R-left: copies the cell immediately to the left. Left-perseveration is the commonest matrix error.",
        },
      ],
      explanation: "Across a row, the shading goes from white to gray to solid and the figure turns a step further round. Down a column, the figure gets smaller. The missing cell is whatever both of those give at once.",
      answer: "C",
    },
    {
      id: "grade-7-8-10",
      kind: "text",
      tier: "VERBAL ANALOGY",
      domain: "verbal",
      rule: "VA-R10 degree on a scale, tier 2, compositional vocabulary",
      prompt: "Complete the analogy.",
      stem: "ANNOYED is to FURIOUS as PLEASED is to ?",
      options: [
        { id: "A", text: "overjoyed" },
        {
          id: "B",
          text: "satisfied",
          why: "IC-degree: the same direction but no stronger than 'pleased', so the escalation runs backwards.",
        },
        {
          id: "C",
          text: "grateful",
          why: "WP-relation: a related feeling rather than a stronger version of the same one.",
        },
        {
          id: "D",
          text: "untroubled",
          why: "D: a mood word, licensed by no relation in the stem.",
        },
      ],
      explanation: "Mild feeling to intense feeling on the same scale. Furious is extreme annoyance, so we need extreme pleasure: overjoyed. 'Satisfied' is roughly as strong as pleased, so it does not move up the scale at all, which is what the pair requires.",
      answer: "A",
    },
    {
      id: "grade-7-8-11",
      kind: "text",
      tier: "NUMBER ANALOGY",
      domain: "quantitative",
      rule: "NA-6 non-unit ratio (x2/3)",
      prompt: "What number completes the last pair?",
      stem: "45 \u2192 30\n21 \u2192 14\n36 \u2192 ?",
      options: [
        {
          id: "A",
          text: "12",
          why: "IC-firststep: divided by 3 and stopped, without multiplying back by 2.",
        },
        {
          id: "B",
          text: "21",
          why: "WP-additive: subtracted 15, the gap in the first pair, instead of scaling.",
        },
        {
          id: "C",
          text: "54",
          why: "WP-inverse: applied the ratio upside down, scaling up by three halves.",
        },
        { id: "D", text: "24" },
      ],
      explanation: "Each number becomes two thirds of itself: 36 becomes 24.",
      answer: "D",
    },
    {
      id: "grade-7-8-12",
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
        { id: "A", fig: {
          shapes: [
            { shape: "square", size: 0.357, x: 0.71, y: 0.29 },
            { shape: "triangle", size: 0.357, x: 0.29, y: 0.71 },
          ],
        } },
        {
          id: "B",
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
          id: "C",
          fig: { shapes: [{ shape: "square", size: 0.357, x: 0.71, y: 0.29 }] },
          why: "IC-inc: applied the rule and then dropped one of the shapes it produces.",
        },
        {
          id: "D",
          fig: {
            shapes: [
              { shape: "circle", size: 0.357, x: 0.29, y: 0.29 },
              { shape: "triangle", size: 0.357, x: 0.29, y: 0.71 },
              { shape: "star", size: 0.357, x: 0.71, y: 0.71 },
            ],
          },
          why: "R-left: copies the cell immediately to the left. Left-perseveration is the commonest matrix error.",
        },
      ],
      explanation: "Along each row, the third cell keeps the shapes that appear in exactly one of the first two, and drops the ones in both.",
      answer: "A",
    },
    {
      id: "grade-7-8-13",
      kind: "text",
      tier: "VERBAL ANALOGY",
      domain: "verbal",
      rule: "VA-R8 cause to effect, both terms abstract",
      prompt: "Complete the analogy.",
      stem: "NEGLECT is to DECAY as ISOLATION is to ?",
      options: [
        {
          id: "A",
          text: "absence",
          why: "WP-relation: a restatement of isolation rather than what it produces.",
        },
        {
          id: "B",
          text: "distance",
          why: "WP-reverse: what causes isolation rather than what isolation causes.",
        },
        { id: "C", text: "loneliness" },
        {
          id: "D",
          text: "freedom",
          why: "D: a state sometimes associated with solitude, licensed by no relation.",
        },
      ],
      explanation: "Each pair is a cause and what it leads to: neglect leads to decay, isolation leads to loneliness. 'Distance' is the near-miss, and it fails in an interesting way — it is a CAUSE of isolation rather than its effect, so it runs the pair backwards.",
      answer: "C",
    },
    {
      id: "grade-7-8-14",
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
        { id: "B", text: "90" },
        {
          id: "C",
          text: "160",
          why: "WP-inverse: applied the ratio upside down, scaling up by four thirds.",
        },
        {
          id: "D",
          text: "100",
          why: "WP-additive: subtracted 20, the gap in the first pair, instead of scaling.",
        },
      ],
      explanation: "Each number becomes three quarters of itself: 120 becomes 90.",
      answer: "B",
    },
    {
      id: "grade-7-8-15",
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
        {
          id: "A",
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
          id: "B",
          fig: { shapes: [{ shape: "heart", size: 0.357, x: 0.29, y: 0.29 }] },
          why: "IC-inc: applied the rule and then dropped one of the shapes it produces.",
        },
        {
          id: "C",
          fig: {
            shapes: [
              { shape: "heart", size: 0.357, x: 0.29, y: 0.29 },
              { shape: "diamond", size: 0.357, x: 0.29, y: 0.71 },
              { shape: "lightning", size: 0.357, x: 0.71, y: 0.71 },
            ],
          },
          why: "R-left: copies the cell immediately to the left. Left-perseveration is the commonest matrix error.",
        },
        { id: "D", fig: {
          shapes: [
            { shape: "heart", size: 0.357, x: 0.29, y: 0.29 },
            { shape: "lightning", size: 0.357, x: 0.71, y: 0.71 },
          ],
        } },
      ],
      explanation: "Along each row, the third cell keeps only the shapes that appear in both of the first two.",
      answer: "D",
    },
  ],
};
