/**
 * Where a SHARED result lands: somebody else's score, framed as a dare.
 *
 * ===========================================================================
 * THIS IS NOT /results/[token] AND MUST NOT BECOME IT
 * ===========================================================================
 * Same token, same signature, different reader. /results is a receipt for the
 * person who earned it. This page is for a stranger who was challenged, and
 * the only thing they can do with a receipt is close the tab. So the score is
 * here as the thing to beat, and the biggest control on the page starts the
 * test.
 *
 * ===========================================================================
 * NO QUESTION-BY-QUESTION REVIEW HERE, ON PURPOSE
 * ===========================================================================
 * `ResultsView` is deliberately NOT reused, even though it renders the score
 * card this page wants. It also renders `QuestionReview`, which lists every
 * item, the option the sharer picked and THE CORRECT ANSWER. Putting that on
 * the link somebody is about to be tested by would hand them the answer key
 * on the way in.
 *
 * Score and verdict only. That is the whole taunt, and it is the part that
 * gives nothing away.
 *
 * ===========================================================================
 * NOBODY IS NAMED
 * ===========================================================================
 * "Somebody" rather than a first name, because there is no name to use and
 * there should not be: the token carries no identity (see
 * lib/test/result-token.ts), children use this flow, and a name added as a URL
 * parameter would be unsigned personal data that anyone holding the link could
 * edit. The dare works without one.
 */
import type { Metadata } from "next";

import { BrandLockup } from "@/components/test/brand-header";
import { ChallengeBeacon } from "@/components/test/challenge-beacon";
import { Button } from "@/components/ui/button";
import { getResult } from "@/lib/test/result-store";
import { scoreTest } from "@/lib/test/scoring";
import { CHILD_ENTRY_PARAM } from "@/lib/test/share-url";
import { getTestById } from "@/lib/test/tests";
import { VERDICT_INK } from "@/lib/test/types";

export const dynamic = "force-dynamic";

const LEGAL_LINK = "font-bold text-ink underline decoration-2 underline-offset-2";

/** The sticker art, sized from its own intrinsic pixels so it cannot squash. */
const VERDICT_BADGE: Record<string, { src: string; width: number; height: number }> = {
  "smart-fella": { src: "/certified-smart-fella.png", width: 560, height: 651 },
  "fart-smella": { src: "/certified-fart-smella.png", width: 546, height: 592 },
};

/**
 * Per-result, so a pasted link says what it is in the preview.
 *
 * NOT noindex-free: these are still individual people's results and have no
 * business in a search index, so the same robots posture as /results applies.
 * A crawler being told not to index a page does not stop Discord, iMessage or
 * Slack from unfurling it, which is the whole point of the OG image.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const record = getResult(decodeURIComponent(token));
  const test = record ? getTestById(record.testId) : null;

  const robots = {
    index: false,
    follow: false,
    nocache: true,
    noimageindex: true,
    googleBot: { index: false, follow: false },
  } as const;

  if (!record || !test) {
    return {
      title: { absolute: "The Official Smart Fella Test" },
      description: "A cognitive aptitude test and a verdict you will not enjoy.",
      robots,
    };
  }

  const { score, max } = scoreTest(test, record.answers);
  const title = `Somebody scored ${score} out of ${max}. Can you beat it?`;
  const description =
    "They took the Official Smart Fella Test. Now it is your turn to find out which one you are.";

  return {
    title: { absolute: title },
    description,
    robots,
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

function Gone() {
  return (
    <div className="flex w-full max-w-md flex-col items-center gap-5 text-center">
      <div className="w-full rounded-2xl border-[2.5px] border-ink bg-coral p-6 shadow-hard-lg">
        <h1 className="text-balance font-display text-[clamp(1.75rem,7vw,2.5rem)] uppercase leading-[1.05]">
          That score has gone
        </h1>
        <p className="mt-3 text-pretty text-[0.975rem] font-semibold leading-snug text-ink/80">
          The link was either mistyped or it has been sitting around for more
          than a year. You can still take the test and set your own.
        </p>
      </div>
      <Button variant="green" size="lg" href="/" className="w-full">
        Take the test
      </Button>
    </div>
  );
}

export default async function BeatPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const record = getResult(decodeURIComponent(token));
  const test = record ? getTestById(record.testId) : null;

  if (!record || !test) {
    return (
      <main
        id="main"
        data-flow
        className="flex min-h-[100dvh] flex-1 items-center justify-center px-4 py-16"
      >
        <Gone />
      </main>
    );
  }

  const result = scoreTest(test, record.answers);
  const badge = VERDICT_BADGE[result.verdict.id];
  const minutes = Math.round(test.durationSeconds / 60);

  // Send a challenged child to the grade picker and a challenged grown-up to
  // the front door, matching the branch the sharer actually took.
  const startHref = test.audience === "child" ? `/?${CHILD_ENTRY_PARAM}` : "/";

  return (
    <main
      id="main"
      data-flow
      className="flex min-h-[100dvh] flex-1 flex-col items-center px-4 pb-24 pt-8 sm:pt-12"
    >
      <div className="flex w-full max-w-md flex-col items-center gap-5 sm:max-w-lg">
        <div className="flex flex-col items-center gap-2 text-center">
          <BrandLockup height="clamp(2.75rem,11vw,4.5rem)" />
          <span className="text-[0.8rem] font-bold uppercase tracking-wide text-ink/45">
            You have been challenged
          </span>
        </div>

        {/* The score to beat. Same yellow card as the results screen, so the
            two read as the same product, with the taunt where the breakdown
            would be. */}
        <div className="flex w-full flex-col items-center gap-3 rounded-2xl border-[2.5px] border-ink bg-yellow p-5 text-center shadow-hard-lg sm:p-7">
          <span className="eyebrow text-ink/70">Somebody scored</span>
          <p className="font-display text-[clamp(3.5rem,18vw,6rem)] leading-[0.85] tracking-[-0.02em]">
            {result.score}
            <span className="text-ink/40">/{result.max}</span>
          </p>

          {badge ? (
            /* eslint-disable-next-line @next/next/no-img-element -- static public asset */
            <img
              src={badge.src}
              alt={result.verdict.title}
              width={badge.width}
              height={badge.height}
              className="mx-auto my-2 h-auto max-h-[24vh] w-[min(100%,10rem)] select-none object-contain sm:my-3 sm:w-[min(100%,12rem)]"
              draggable={false}
            />
          ) : (
            <p
              style={{ color: VERDICT_INK[result.verdict.id] ?? "var(--color-ink)" }}
              className="text-balance font-display text-[clamp(1.5rem,7vw,2.5rem)] uppercase leading-[1.02] tracking-[-0.015em]"
            >
              {result.verdict.title}
            </p>
          )}

          <h1 className="text-balance font-display text-[clamp(1.5rem,7vw,2.25rem)] uppercase leading-[1.02] tracking-[-0.015em]">
            Think you can beat that?
          </h1>
        </div>

        <Button variant="green" size="lg" href={startHref} className="w-full">
          Take the test
        </Button>

        <p className="text-center text-[0.9rem] font-semibold leading-snug text-ink/70">
          {test.items.length} questions, {minutes} minutes, one very blunt
          verdict.
        </p>

        {/* Fires test_challenge_viewed. A tiny client island rather than
            making the whole page a client component for one analytics call. */}
        <ChallengeBeacon
          testId={test.id}
          audience={test.audience}
          verdict={result.verdict.id}
        />

        <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-xs font-medium leading-snug text-ink/55">
          <a href="/privacy" className={LEGAL_LINK}>
            Privacy
          </a>
          <span aria-hidden="true">&middot;</span>
          <a href="/terms" className={LEGAL_LINK}>
            Terms
          </a>
          <span aria-hidden="true">&middot;</span>
          <a href="/support" className={LEGAL_LINK}>
            Support
          </a>
        </p>
      </div>
    </main>
  );
}
