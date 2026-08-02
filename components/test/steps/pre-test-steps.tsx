/**
 * The four screens before the clock starts: the two forks, the grade picker and
 * the intro.
 *
 * They live together because they share one shell (a centred column under the
 * brand lockup) and each is only a headline and some buttons. The runner and
 * the results are their own files because they are not that.
 *
 * ===========================================================================
 * THE COPY BAR: AN EIGHT-YEAR-OLD READS THIS WITHOUT HELP
 * ===========================================================================
 * The grade range starts at 3, so the youngest person reading the child-facing
 * screens is eight. That sets the register for all of them, and it is a harder
 * bar than it looks — the natural voice for this kind of screen is editorial
 * ("the questions are pitched at that year"), and every word of that sentence
 * is wrong here: "pitched" is jargon, "year" is British, and the whole shape is
 * a brochure talking about a child rather than to one.
 *
 * The rules, in order of how often they are broken:
 *   - short, concrete words. No "pitched", no "calibrated", no "tailored".
 *   - grade, never year.
 *   - say what happens, not what we have done. "We'll match the questions to
 *     it", not "the questions are matched to it".
 *   - no em or en dashes anywhere in rendered copy, site-wide rule.
 *   - playful, never smug, and NEVER condescending about a wrong answer.
 *
 * The grown-up screens can sit a little higher, but plain still beats clever.
 */
"use client";

import { ChoiceCard, GradeButton } from "./choice-card";
import { Button } from "@/components/ui/button";
import { displayTestTitle } from "@/lib/test/tests";
import { GRADES, type Grade, type Test } from "@/lib/test/types";
import { cn } from "@/lib/utils";

/* ==========================================================================
 * Shared bits
 * ========================================================================== */

function StepHeading({ children, sub }: { children: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <h1 className="text-balance font-display text-[clamp(1.75rem,7.5vw,3rem)] uppercase leading-[1] tracking-[-0.015em]">
        {children}
      </h1>
      {sub ? (
        <p className="text-pretty text-[0.975rem] font-semibold leading-snug text-ink/75 sm:text-base">
          {sub}
        </p>
      ) : null}
    </div>
  );
}

function BackLink({ onClick, label = "Back" }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "btn-press inline-flex min-h-11 cursor-pointer items-center gap-2 self-center rounded-full",
        "border-[2.5px] border-ink bg-paper px-4 py-2 font-sans text-xs font-bold uppercase leading-none tracking-[0.02em] text-ink",
      )}
    >
      <span aria-hidden="true">&larr;</span>
      {label}
    </button>
  );
}

/* ==========================================================================
 * Fork one: parent or kid
 * ========================================================================== */

export function AudienceFork({ onPick }: { onPick: (fork: "parent" | "child") => void }) {
  return (
    /*
      NO HEADING ON THIS STEP, deliberately. It carried "First things first"
      over "Pick the one that sounds like you", and both were restating the
      question the two cards already ask: a card that says "I'm a grown-up" and
      a card that says "I'm a kid" do not need to be told apart for you. Two
      lines of instruction above two obvious choices is the kind of thing that
      reads as helpful and measures as friction.

      The document's h1 moved to the wordmark in BrandHeader, which is where the
      page's real title was all along. See the note there.
    */
    <div className="grid w-full gap-4">
      <ChoiceCard
        tone="blue"
        onClick={() => onPick("parent")}
        title="I'm a grown-up"
        subtitle="Take the 15-minute test yourself, or set one up for your kid."
      />
      <ChoiceCard
        tone="mint"
        onClick={() => onPick("child")}
        title="I'm a kid"
        subtitle="Tell us your grade and take a quick 5-minute test."
      />
    </div>
  );
}

/* ==========================================================================
 * Fork two: the parent takes it, or their child does
 * ========================================================================== */

export function ParentIntentFork({
  onPick,
  onBack,
}: {
  onPick: (who: "self" | "child") => void;
  onBack: () => void;
}) {
  return (
    <div className="flex w-full flex-col gap-5">
      <StepHeading sub="Both work. They are different tests.">
        Who is taking it?
      </StepHeading>
      <div className="grid gap-4">
        <ChoiceCard
          tone="coral"
          onClick={() => onPick("self")}
          // Describes the FORMAT, which is accurate and names nobody's product.
          title="Me"
          subtitle="A cognitive aptitude test. 50 questions, 15 minutes, no going back."
        />
        <ChoiceCard
          tone="yellow"
          onClick={() => onPick("child")}
          title="My kid"
          subtitle="Grades 3 to 8. Fifteen questions in five minutes, matched to their grade."
        />
      </div>
      <BackLink onClick={onBack} />
    </div>
  );
}

/* ==========================================================================
 * The grade picker
 * ========================================================================== */

export function GradePicker({
  forChild,
  onPick,
  onBack,
}: {
  /** True when a grown-up is setting this up rather than the kid picking. */
  forChild: boolean;
  onPick: (grade: Grade) => void;
  onBack: () => void;
}) {
  return (
    <div className="flex w-full flex-col gap-5">
      <StepHeading
        sub={
          forChild
            ? "Pick their grade and we'll match the questions to it."
            : "Pick your grade and we'll match the questions to it."
        }
      >
        {forChild ? "What grade is your kid in?" : "What grade are you in?"}
      </StepHeading>

      {/*
        Six grades, three across: a tidy 2x3 block, and about 100px per button
        on a 360px phone. (Six across would be 50px each, under the tap-target
        floor once the gaps are taken out.)

        GRADES IS 3 TO 8 AND NOT 1 TO 12, which is a content decision rather
        than a layout one — see the note on `Grade` in lib/test/types.ts. The
        short version: below grade 3 the honest version of this test is untimed
        and wordless, so there is nothing to offer a six-year-old here, and
        above grade 8 the grown-up test is the better answer.
      */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        {GRADES.map((g) => (
          <GradeButton key={g} grade={g} onClick={() => onPick(g)} />
        ))}
      </div>

      {/* Nothing sits between the grades and Back. There was an "out of range?"
          line here and it was cut: Back already goes where it pointed, and a
          screen whose job is "tap a number" should not also be explaining who
          the numbers are not for. */}
      <BackLink onClick={onBack} />
    </div>
  );
}

/* ==========================================================================
 * The intro: the rules, and the button that starts the clock
 * ========================================================================== */

export function TestIntro({
  test,
  grade,
  onStart,
  onBack,
}: {
  test: Test;
  /** The grade the player picked. Shown back to them; never the band. */
  grade: Grade | null;
  onStart: () => void;
  onBack: () => void;
}) {
  const minutes = Math.round(test.durationSeconds / 60);
  const child = test.audience === "child";

  /*
    THE TWO TESTS DIFFER HERE, DELIBERATELY, AND THE COPY SAYS SO.

    Adult: answers LOCK. The instrument this mirrors works that way, and not
    being able to revisit is a real part of what makes fifteen minutes feel
    like fifteen minutes. It is stated here rather than discovered at question
    two, because a rule you find out by losing a question is a bad surprise.

    Child: going back is allowed. The child instrument permits review, and a
    ten-year-old who mis-taps and then watches a clock run down on an answer
    they cannot fix is a bad five minutes for no gain in measurement.

    That split is in the data (`Test.allowBack`) and the runner honours it by
    not rendering a Back button at all on the adult test.

    Kept SHORT. Every bullet has to earn its line: a column of five makes a
    friendly screen look like terms and conditions.
  */
  /*
    NO TRAILING PERIODS. Each card is a standalone label rather than prose, and
    a full stop at the end of a centred one-liner reads like a typo. Periods
    BETWEEN sentences stay, because they are doing real work.
  */
  const rules: string[] = [
    `${test.items.length} questions. ${minutes} minute${minutes === 1 ? "" : "s"} for all of them`,
    "One timer for the whole test, not one per question",
    test.allowBack
      ? "You can go back and change an answer any time before you finish"
      : "Once you move on, your answer locks. There is no going back",
    ...(child
      ? []
      : [
          "At zero we score what you answered. Anything unanswered counts as wrong, and there is no penalty for guessing",
        ]),
  ];

  return (
    <div className="flex w-full flex-col gap-5">
      {/* Their grade, not the bank's. Grades 7 and 8 share a bank whose own
          title reads "Grade 7 and 8"; showing that to someone who tapped 7
          makes the product look like it is guessing. */}
      {/* No subhead on the child screen: "Ready when you are" said nothing the
          Start button does not, and it sat between the headline and the rules
          doing no work. The heading's own gap is unchanged, so the rules move
          up into the space it was holding. */}
      <StepHeading sub={child ? undefined : "Here is how it works."}>
        {displayTestTitle(test, grade)}
      </StepHeading>

      {/* No icons. A yellow "!" on every row turned a friendly screen into
          something that looked like an error state, and the bullets read
          perfectly well as plain statements on their own cards. */}
      <ul className="flat-surface flex flex-col gap-2.5">
        {rules.map((rule) => (
          <li
            key={rule}
            /* Centred to sit under a centred headline and above a centred
               button. `text-balance` rather than `text-pretty` because these
               wrap to two lines at 360 and balance splits them evenly, which
               is what centred text needs; pretty only protects the last line. */
            className="text-balance rounded-2xl border-[2.5px] border-ink bg-cream p-3.5 text-center text-[0.95rem] font-semibold leading-snug text-ink shadow-hard-xs"
          >
            {rule}
          </li>
        ))}
      </ul>

      <Button variant="green" size="lg" onClick={onStart} className="w-full">
        Start the test
      </Button>

      <BackLink onClick={onBack} />
    </div>
  );
}
