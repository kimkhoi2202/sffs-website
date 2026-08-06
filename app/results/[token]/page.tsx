/**
 * The page the link in the email opens: someone's results, unblurred.
 *
 * ===========================================================================
 * NOINDEX
 * ===========================================================================
 * These are individual people's result pages. They should not be in a search
 * index, and the tokens should not end up in anyone's crawl logs, so the
 * metadata says noindex/nofollow AND nocache/noimageindex. The token is
 * unguessable, so this is not what keeps a page private — it is what keeps
 * thousands of near-identical thin pages out of the site's search footprint.
 *
 * ===========================================================================
 * EXPIRY
 * ===========================================================================
 * Twelve months, and within that the link simply works. The reasoning is
 * written out at the top of lib/test/result-store.ts; the short version is that
 * mailing someone a link exists precisely so they can come back to it, and a
 * seven-day token would break the behaviour the feature was built to create.
 *
 * Past twelve months the record is gone and this renders the same "not found"
 * screen as a bad token. A visitor cannot tell the two apart, and should not
 * have to: both mean "there is nothing here", and the useful thing to offer in
 * either case is the test again.
 */
import type { Metadata } from "next";

import { BrandLockup } from "@/components/test/brand-header";
import { ResultsOpenedBeacon } from "@/components/test/results-opened-beacon";
import { ResultsView } from "@/components/test/results-view";
import { ShareResults } from "@/components/test/share-results";
import { Button } from "@/components/ui/button";
import { getResult } from "@/lib/test/result-store";
import { resultsOpenSource } from "@/lib/test/results-url";
import { scoreTest } from "@/lib/test/scoring";
import { displayTestTitle, getTestById } from "@/lib/test/tests";

export const dynamic = "force-dynamic";

const LEGAL_LINK = "font-bold text-ink underline decoration-2 underline-offset-2";

const ROBOTS = {
  index: false,
  follow: false,
  nocache: true,
  noimageindex: true,
  googleBot: { index: false, follow: false },
} as const;

/**
 * The TAB TITLE stays "Your results", because the person reading it is the
 * person who earned them. The UNFURL says the score, because the only time
 * anyone else sees this link is when it has been pasted somewhere, and a
 * preview reading "Your results" is a preview about nobody.
 *
 * The two are set separately for exactly that reason: `title` alone would feed
 * both. Being noindex does not stop Discord, Slack or iMessage from unfurling
 * a link somebody pasted, which is the case this serves.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const record = getResult(decodeURIComponent(token));
  const test = record ? getTestById(record.testId) : null;

  const base: Metadata = {
    title: { absolute: "Your results · The Official Smart Fella Test" },
    description: "Your results from the Official Smart Fella Test.",
    robots: ROBOTS,
  };
  if (!record || !test) return base;

  const { score, max, verdict } = scoreTest(test, record.answers);
  const shared = `${verdict.title}. Scored ${score} out of ${max}.`;

  return {
    ...base,
    openGraph: {
      title: shared,
      description: "Take the Official Smart Fella Test and find out which one you are.",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: shared,
      description: "Take the Official Smart Fella Test and find out which one you are.",
    },
  };
}

function NotFound() {
  return (
    <div className="flex w-full max-w-md flex-col items-center gap-5 text-center">
      <div className="w-full rounded-2xl border-[2.5px] border-ink bg-coral p-6 shadow-hard-lg">
        <h1 className="text-balance font-display text-[clamp(1.75rem,7vw,2.5rem)] uppercase leading-[1.05]">
          These results have gone
        </h1>
        <p className="mt-3 text-pretty text-[0.975rem] font-semibold leading-snug text-ink/80">
          Either that link was mistyped, or it has been sitting in an inbox for
          more than a year and we have since cleared the result away. Nothing you
          did.
        </p>
      </div>
      <Button variant="green" size="lg" href="/" className="w-full">
        Take the test
      </Button>
    </div>
  );
}

export default async function ResultsPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  /** `?from=saved` when a returning visitor took the offer. See resultsOpenSource. */
  searchParams: Promise<{ from?: string | string[] }>;
}) {
  const { token } = await params;
  const record = getResult(decodeURIComponent(token));
  const test = record ? getTestById(record.testId) : null;

  if (!record || !test) {
    return (
      <main id="main" data-flow className="flex min-h-[100dvh] flex-1 items-center justify-center px-4 py-16">
        <NotFound />
      </main>
    );
  }

  // Re-scored from the stored answers rather than from a stored score, so the
  // number and the breakdown next to it can never disagree.
  const result = scoreTest(test, record.answers);

  return (
    <main id="main" data-flow className="flex min-h-[100dvh] flex-1 flex-col items-center px-4 pb-24 pt-8 sm:pt-12">
      <div className="flex w-full max-w-md flex-col items-center gap-5 sm:max-w-lg">
        {/*
          The lockup rather than the words. This page is often the first thing a
          parent sees of the brand — they arrive on it from an email link having
          never visited the site — so it is worth showing the mark rather than
          setting its name in small caps. Same component as the front door, so
          the two cannot drift apart. See BrandLockup.
        */}
        <div className="flex flex-col items-center gap-2 text-center">
          <BrandLockup height="clamp(2.75rem,11vw,4.5rem)" />
          <span className="text-[0.8rem] font-bold uppercase tracking-wide text-ink/45">
            {displayTestTitle(test, record.grade)}
          </span>
        </div>

        <ResultsView test={test} result={result} timedOut={record.timedOut} />

        {/*
          Only on the real results page, never on the gated screen behind the
          email box. A masked result has no score and no verdict to put on a
          card, and offering to share one would be offering to share "???".
        */}
        <ShareResults
          token={record.token}
          testId={test.id}
          audience={test.audience}
          verdict={result.verdict.id}
        />

        {/* Fires results_link_opened. A tiny client island rather than making
            this whole page a client component for one analytics call. */}
        <ResultsOpenedBeacon
          testId={test.id}
          audience={test.audience}
          source={resultsOpenSource((await searchParams).from)}
        />

        <Button variant="paper" size="lg" href="/" className="w-full">
          Take it again
        </Button>

        {/*
          The other place a legal line is needed. Someone can land here straight
          from their inbox without ever passing through the flow, so this may be
          the only page of the site they see — and it is a page about them. With
          no site footer on the v3 routes, this is the path to the policy.
        */}
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
