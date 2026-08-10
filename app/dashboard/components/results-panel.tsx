"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import type { TestResultsResponse } from "@/lib/dashboard/wire";

import { Empty, Panel, Stat, when } from "./primitives";

/**
 * Finished tests, read from the `test_results` warehouse mirror.
 *
 * ===========================================================================
 * WHY THESE ARE REAL TABLES AND THE REST OF THE DASHBOARD IS NOT
 * ===========================================================================
 * Every other panel here renders a `<ul>` of flex rows, because every other
 * panel ranks ONE metric — sessions per source, views per page — and a bar is
 * a better read of that than a column of digits.
 *
 * Both of these are genuinely two-dimensional: platform × audience for the
 * summary, and six parallel fields per person for the list. A `<ul>` carrying
 * six values per row is a table that a screen reader cannot navigate, so these
 * use `<table>` with real `<th scope>`. The horizontal scroller and its
 * focusable region follow the pattern already used by the table on the privacy
 * page.
 *
 * ===========================================================================
 * ANONYMOUS COMPLETIONS ARE COMPLETIONS
 * ===========================================================================
 * Roughly a quarter of these rows carry no email address, because the person
 * finished the test and never asked for the result. They are real people who
 * really finished, so they are IN every total on this panel and are labelled
 * where the address would be, rather than filtered out to make the list tidy.
 * The summary prints the anonymous count next to the total so that the reader
 * can see it has not been quietly dropped.
 *
 * ===========================================================================
 * BUT A ROW THE CLOCK WROTE IS NOT A COMPLETION
 * ===========================================================================
 * That doctrine has one edge it did not cover. Anonymous FINISHERS are
 * finishers; rows the countdown submitted for somebody who had already walked
 * away are not, and about a quarter of this table is those. They are still
 * every bit as real and they stay in the table, in the totals and in the list
 * — but they are marked, counted separately and kept out of the conversion
 * arithmetic, because "finished and declined to give an address" and "left and
 * the timer filed a result" are opposite findings that were being added
 * together. The rule lives in lib/dashboard/completion-rule.ts and is printed
 * on the Growth tab next to the rate it produces.
 */
export function ResultsPanel({ data }: { data: TestResultsResponse }) {
  const platforms = data.platforms ?? [];
  const completions = data.completions ?? [];
  const totals = data.totals;
  const accounting = data.accounting;

  if (!totals || totals.completions === 0) {
    return (
      <div className="space-y-5">
        <Panel title="Test completions" subtitle="From the test_results warehouse mirror.">
          <Empty>No completed tests in this window.</Empty>
        </Panel>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* The headline counts are read straight from the table on every load.
          Nothing here is compared against a remembered figure: a real person
          finishing a test moves all of these, and a check that asserted
          yesterday's number would fail for the best possible reason. */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        <Stat
          label="Results written"
          value={totals.completions}
          hint="rows in the mirror, not people"
          tone="mint"
        />
        {accounting && (
          <Stat
            label="Left mid-test"
            value={accounting.all.abandoned}
            hint="the clock submitted for them"
            tone="coral"
          />
        )}
        <Stat label="Adult" value={totals.adult} hint="adult test" />
        <Stat label="Child" value={totals.child} hint="grade 3 upward" tone="blue" />
        <Stat label="With an address" value={totals.withEmail} hint="asked for the result" />
        <Stat
          label="Anonymous"
          value={totals.anonymous}
          hint="finished, never asked"
          tone="yellow"
        />
      </div>

      {accounting && accounting.all.abandoned > 0 && (
        <p className="rounded-2xl border-2 border-dashed border-ink/30 px-4 py-3 text-xs font-semibold leading-relaxed text-ink/65">
          <strong className="font-bold text-ink">
            {accounting.all.finished.toLocaleString("en-GB")} of these{" "}
            {totals.completions.toLocaleString("en-GB")} results were finished by the person
          </strong>
          . The other {accounting.all.abandoned.toLocaleString("en-GB")} were written by the
          countdown after they had left — the clock reaches zero, the test submits whatever is
          on screen and the email gate goes up on a tab nobody is looking at. They are kept in
          every total here and marked in the list below, because they are real attempts by real
          people and a walk-away is a genuine loss. What they are not is finishers, so they are
          out of the conversion rate on the Growth tab, which is where that rate and the rule
          behind it are printed.{" "}
          {accounting.corrected.finishedEmailRate !== null && (
            <>
              Among people who did finish,{" "}
              <strong className="font-bold text-ink">
                {(accounting.corrected.finishedEmailRate * 100).toFixed(1)}% gave an address
              </strong>
              {accounting.outage.overlaps && accounting.outage.finished > 0
                ? ", holding out the 9 August delivery outage."
                : "."}
            </>
          )}
        </p>
      )}

      <Panel
        title="Completions by platform"
        subtitle="Where the person came from, split by which test they took. Finished and Left mid-test decompose Total exactly. Unattributable is its own row, not a rounding difference."
      >
        <div
          role="region"
          aria-label="Completions by acquisition platform"
          tabIndex={0}
          className="-mx-1 overflow-x-auto px-1 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          <table className="w-full min-w-[44rem] border-collapse text-left text-[0.82rem]">
            <thead>
              <tr className="border-b-[2.5px] border-ink">
                <th scope="col" className="py-2 pr-3 font-sans text-xs font-bold uppercase">
                  Platform
                </th>
                <Numeric as="th">Adult</Numeric>
                <Numeric as="th">Child</Numeric>
                <Numeric as="th">Total</Numeric>
                <Numeric as="th">Finished</Numeric>
                <Numeric as="th">Left mid-test</Numeric>
                <Numeric as="th">Anonymous</Numeric>
              </tr>
            </thead>
            <tbody>
              {platforms.map((row) => (
                <tr key={row.platform} className="border-b-2 border-ink/15">
                  <th scope="row" className="py-2 pr-3 font-normal">
                    <PlatformChip platform={row.platform} />
                  </th>
                  <Numeric>{row.adult}</Numeric>
                  <Numeric>{row.child}</Numeric>
                  <Numeric strong>{row.total}</Numeric>
                  <Numeric>{row.finished}</Numeric>
                  <Numeric muted>{row.abandoned}</Numeric>
                  <Numeric muted>{row.anonymous}</Numeric>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-[2.5px] border-ink">
                <th scope="row" className="py-2 pr-3 font-sans text-xs font-bold uppercase">
                  All platforms
                </th>
                <Numeric strong>{totals.adult}</Numeric>
                <Numeric strong>{totals.child}</Numeric>
                <Numeric strong>{totals.completions}</Numeric>
                <Numeric strong>{platforms.reduce((a, r) => a + r.finished, 0)}</Numeric>
                <Numeric muted>{platforms.reduce((a, r) => a + r.abandoned, 0)}</Numeric>
                <Numeric muted>{totals.anonymous}</Numeric>
              </tr>
            </tfoot>
          </table>
        </div>
      </Panel>

      <Panel
        title="Every completion"
        subtitle={`${completions.length} row${completions.length === 1 ? "" : "s"}, newest first. One row per finished test, so somebody who took it twice appears twice.`}
      >
        <div
          role="region"
          aria-label="Individual test completions"
          tabIndex={0}
          className="-mx-1 overflow-x-auto px-1 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          <table className="w-full min-w-[48rem] border-collapse text-left text-[0.82rem]">
            <thead>
              <tr className="border-b-[2.5px] border-ink">
                <th scope="col" className="py-2 pr-3 font-sans text-xs font-bold uppercase">
                  Email
                </th>
                <th scope="col" className="py-2 pr-3 font-sans text-xs font-bold uppercase">
                  Test
                </th>
                <th scope="col" className="py-2 pr-3 font-sans text-xs font-bold uppercase">
                  Grade
                </th>
                <Numeric as="th">Score</Numeric>
                <Numeric as="th">Answered</Numeric>
                <th scope="col" className="py-2 pr-3 font-sans text-xs font-bold uppercase">
                  Platform
                </th>
                <th scope="col" className="py-2 font-sans text-xs font-bold uppercase">
                  Completed
                </th>
              </tr>
            </thead>
            <tbody>
              {completions.map((row) => {
                const child = row.testType === "child";
                return (
                  <tr key={row.id} className="border-b-2 border-ink/15">
                    <td className="py-2 pr-3">
                      {row.email ? (
                        <span className="font-mono text-[0.74rem] break-all">{row.email}</span>
                      ) : (
                        <span className="font-semibold text-ink/45">anonymous</span>
                      )}
                    </td>
                    <td className="py-2 pr-3">
                      <span className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={cn(
                            "inline-flex shrink-0 items-center rounded-full border-2 border-ink px-2 py-0.5 font-sans text-[0.6rem] font-bold uppercase tracking-[0.06em]",
                            child ? "bg-blue" : "bg-cream",
                          )}
                        >
                          {child ? "Child" : "Adult"}
                        </span>
                        {row.abandoned && (
                          <span
                            title={`The countdown submitted this one. ${row.answered} of ${row.maxScore} answered, so it is counted as somebody who left rather than as somebody who finished.`}
                            className="inline-flex shrink-0 items-center rounded-full border-2 border-ink bg-coral px-2 py-0.5 font-sans text-[0.6rem] font-bold uppercase tracking-[0.06em]"
                          >
                            Left mid-test
                          </span>
                        )}
                        {row.timedOut && !row.abandoned && (
                          <span
                            title={`The clock ran out, but ${row.answered} of ${row.maxScore} were answered — they worked the paper and the timer caught them at the end, so this is a finish.`}
                            className="inline-flex shrink-0 items-center rounded-full border-2 border-ink bg-yellow px-2 py-0.5 font-sans text-[0.6rem] font-bold uppercase tracking-[0.06em]"
                          >
                            Beat the clock
                          </span>
                        )}
                      </span>
                    </td>
                    {/* Only the children's test has a grade. The adult rows
                        carry grade_band = "adult", which would read as a grade
                        called "adult" if it were printed here. */}
                    <td className="py-2 pr-3 font-mono text-[0.74rem]">
                      {child ? row.gradeBand : <span className="text-ink/35">—</span>}
                    </td>
                    <Numeric>
                      <span className="font-mono text-[0.74rem]">
                        {row.score}
                        <span className="text-ink/45"> / {row.maxScore}</span>
                      </span>
                    </Numeric>
                    {/* The evidence behind the badge, so the reader can check
                        the call rather than take it: 3 of 50 with the clock
                        run out is a different row from 48 of 50. */}
                    <Numeric>
                      <span className="font-mono text-[0.74rem]">
                        {row.answered}
                        <span className="text-ink/45"> / {row.maxScore}</span>
                      </span>
                    </Numeric>
                    <td className="py-2 pr-3">
                      <PlatformChip platform={row.platform} />
                    </td>
                    <td className="whitespace-nowrap py-2 font-mono text-[0.72rem] text-ink/70">
                      {when(row.completedAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

/**
 * A platform chip.
 *
 * "unattributable" gets the muted treatment on purpose: it is the ABSENCE of a
 * platform, and giving it the same solid chip as Reddit would read as a
 * referrer by that name.
 */
function PlatformChip({ platform }: { platform: string }) {
  const none = platform === "unattributable";
  return (
    <span
      title={
        none
          ? "No acquisition platform was recorded for this completion."
          : `Arrived from ${platform}`
      }
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border-2 px-2.5 py-0.5 font-sans text-[0.66rem] font-bold uppercase tracking-[0.05em]",
        none
          ? "border-dashed border-ink/40 bg-transparent text-ink/55"
          : "border-ink bg-cream text-ink",
      )}
    >
      {platform}
    </span>
  );
}

/** A right-aligned numeric cell, so the columns line up on the digit. */
function Numeric({
  children,
  as = "td",
  strong,
  muted,
}: {
  children: ReactNode;
  as?: "td" | "th";
  strong?: boolean;
  muted?: boolean;
}) {
  const className = cn(
    "py-2 pr-3 text-right tabular-nums",
    as === "th" && "font-sans text-xs font-bold uppercase",
    as === "td" && "font-mono text-[0.78rem]",
    strong && "font-bold",
    muted && "text-ink/50",
  );
  if (as === "th") {
    return (
      <th scope="col" className={className}>
        {children}
      </th>
    );
  }
  return <td className={className}>{children}</td>;
}
