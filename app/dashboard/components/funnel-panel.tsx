"use client";

import { cn } from "@/lib/utils";
import type { WireAbandonSummary, WireFunnelStage } from "@/lib/dashboard/wire";

import { Bar, Empty, Panel } from "./primitives";

/**
 * The funnel, and the people who fell out of it.
 *
 * Every stage row is a button. Pressing one filters the people list to the
 * humans who reached that stage and went no further, which is the number that
 * actually tells you something: "eleven landed" is context, "four started the
 * test and stopped at question ten" is a to-do list.
 */
export function FunnelPanel({
  stages,
  abandonment,
  activeStage,
  onSelectStage,
  onSelectQuestion,
}: {
  stages: WireFunnelStage[];
  abandonment: WireAbandonSummary[];
  activeStage: string | null;
  onSelectStage: (stage: WireFunnelStage | null) => void;
  onSelectQuestion: (ids: string[], label: string) => void;
}) {
  const top = stages[0]?.count ?? 0;

  return (
    <div className="space-y-5">
      <Panel
        title="Where people fall out"
        subtitle="One row per stage. Press a row to read the people who stopped there."
        right={
          activeStage && (
            <button
              type="button"
              onClick={() => onSelectStage(null)}
              className="rounded-full border-2 border-ink bg-cream px-3 py-1 text-[0.68rem] font-bold uppercase"
            >
              Clear filter
            </button>
          )
        }
      >
        {/*
          THE DISAGREEMENT GOES ON SCREEN, NOT IN A FOOTNOTE.

          Step one reads 61 while the Visitors tile a few inches above reads 41,
          and both are correct. Left unexplained where the two are visible at the
          same time, that is the kind of thing that costs a dashboard its
          credibility in one glance — the reader does not conclude "these measure
          different things", they conclude "this page cannot add up".
        */}
        {top > 0 && (
          <p className="mb-4 rounded-2xl border-[2.5px] border-ink bg-blue px-4 py-3 text-[0.8rem] font-semibold leading-[1.55]">
            <strong>{top} here, and a different number in the tiles above — both right.</strong>{" "}
            These rows count stitched <em>humans</em>; the tiles count PostHog <em>persons</em>.
            Someone whose results visit minted a second person id is one human here and two
            people up there. Someone whose client library was blocked is counted here as
            having taken the test, because they demonstrably did, even though PostHog holds
            no <code className="font-mono text-[0.72rem]">test_started</code> for them.
          </p>
        )}

        {/*
          READ THE COUNTS, NOT THE RATES. At this volume a percentage is a
          headline attached to two or three people, and the gap between a 68%
          step and a 55% step is one visitor changing their mind. Saying so on
          the page is cheaper than watching someone plan a quarter around it.
        */}
        {top > 0 && top < 200 && (
          <p className="mb-4 text-[0.75rem] font-semibold leading-snug text-ink/60">
            {top} people in this window. Percentages are shown because they are asked for,
            but at this size one person moves a step by about{" "}
            {Math.round((1 / top) * 100)} points — read the counts first and treat the rates
            as a shape, not a rate.
          </p>
        )}

        <ol className="space-y-2">
          {stages.map((stage, i) => {
            const dropped = stage.droppedHumanIds.length;
            const isActive = activeStage === stage.id;
            return (
              <li key={stage.id}>
                <button
                  type="button"
                  onClick={() => onSelectStage(isActive ? null : stage)}
                  disabled={dropped === 0}
                  className={cn(
                    "w-full rounded-2xl border-[2.5px] border-ink px-4 py-3 text-left transition-colors",
                    isActive ? "bg-ink text-paper" : "bg-cream",
                    dropped > 0 ? "cursor-pointer hover:bg-yellow" : "cursor-default opacity-90",
                    isActive && dropped > 0 && "hover:bg-ink",
                  )}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-sans text-sm font-bold">
                      <span className={cn("mr-2", isActive ? "text-paper/50" : "text-ink/40")}>
                        {i + 1}
                      </span>
                      {stage.label}
                    </span>
                    <span className="font-display text-2xl leading-none">{stage.count}</span>
                  </div>

                  <div className="mt-2">
                    <Bar
                      value={stage.count}
                      max={top}
                      tone={isActive ? "bg-yellow" : "bg-blue"}
                    />
                  </div>

                  <div
                    className={cn(
                      "mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.7rem] font-semibold",
                      isActive ? "text-paper/70" : "text-ink/55",
                    )}
                  >
                    <code className="font-mono text-[0.65rem]">{stage.hint}</code>
                    {i > 0 && stage.conversionFromPrevious !== null && (
                      <span>
                        {Math.round(stage.conversionFromPrevious * 100)}% carried on from the step
                        above
                      </span>
                    )}
                    {/*
                      Per-step and end-to-end answer different questions and the
                      row now says both. "83% carried on" reads like a healthy
                      step right up until you notice it is the fifth such step
                      and eight percent of the people who landed are still here.
                      Spelled out as "n of N" as well as a percentage, because
                      at these volumes the percentage alone invites more
                      confidence than five people can carry.
                    */}
                    {i > 0 && top > 0 && (
                      <span
                        className={cn(
                          "rounded-full border-2 border-ink px-2 py-0.5",
                          isActive ? "bg-paper text-ink" : "bg-mint",
                        )}
                      >
                        {stage.count} of {top} overall · {Math.round((stage.count / top) * 100)}%
                      </span>
                    )}
                    {dropped > 0 && (
                      <span
                        className={cn(
                          "rounded-full border-2 border-ink px-2 py-0.5",
                          isActive ? "bg-coral text-ink" : "bg-coral",
                        )}
                      >
                        {dropped} stopped here — read them
                      </span>
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ol>
      </Panel>

      {abandonment.length === 0 ? (
        <Panel title="Where in the test they give up">
          <Empty>Nobody started a test in this window.</Empty>
        </Panel>
      ) : (
        abandonment.map((summary) => (
          <Panel
            key={summary.testId}
            title={`Where they give up — ${summary.testId} test`}
            subtitle={`${summary.questionTotal || "?"} questions, ${summary.testId === "adult" ? "15" : "5"}-minute clock`}
          >
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              <Fact label="Started" value={summary.starters} />
              <Fact label="Finished" value={summary.finishers} tone="bg-mint" />
              <Fact
                label="Beat by the clock"
                value={summary.timedOutFinishers + summary.timedOutAbandoners}
                tone="bg-yellow"
              />
              <Fact label="Pressed quit" value={summary.quitters} tone="bg-coral" />
              <Fact label="Walked away" value={summary.silentAbandoners} tone="bg-coral" />
            </div>

            <p className="mt-4 text-[0.8rem] leading-[1.6] text-ink/70">
              {/*
                The `{" "}` AFTER the value is load-bearing, not decoration. The
                plain space that used to follow the closing brace was eaten and
                the sentence rendered "48 of 50and hits the limit". Same shape as
                the "wantto play" bug on the marketing pages. It bites when an
                interpolation ends a source line and the text after it runs on to
                a second line; a value with text on ONE line either side is fine,
                which is why the neighbouring counters read correctly and this
                one did not.
              */}
              <strong>Timed out is not walked away.</strong> Someone who answers 48 of{" "}
              {summary.questionTotal || "?"}{" "}
              and hits the limit engaged completely; someone who answers ten and
              vanishes did not. Counting only &ldquo;did not finish&rdquo; would put
              them in the same bucket and they mean opposite things.
            </p>

            {summary.points.length === 0 ? (
              <div className="mt-4">
                <Empty>Nobody abandoned this test in this window.</Empty>
              </div>
            ) : (
              <>
                <p className="mt-5 font-sans text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink/50">
                  Question they stopped on
                  {summary.medianAbandonQuestion !== null && (
                    <span className="ml-2 normal-case tracking-normal text-ink/60">
                      median {summary.medianAbandonQuestion}
                    </span>
                  )}
                </p>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {summary.points.map((point) => (
                    <li key={point.question}>
                      <button
                        type="button"
                        onClick={() =>
                          onSelectQuestion(
                            point.humanIds,
                            `Stopped on question ${point.question}`,
                          )
                        }
                        className="btn-press rounded-xl border-2 border-ink bg-coral px-3 py-2 text-center"
                      >
                        <span className="block font-display text-lg leading-none">
                          Q{point.question}
                        </span>
                        <span className="block text-[0.6rem] font-bold uppercase">
                          {point.humans} {point.humans === 1 ? "person" : "people"}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Panel>
        ))
      )}
    </div>
  );
}

function Fact({ label, value, tone = "bg-cream" }: { label: string; value: number; tone?: string }) {
  return (
    <div className={cn("rounded-2xl border-2 border-ink px-3 py-2", tone)}>
      <p className="font-sans text-[0.6rem] font-bold uppercase tracking-[0.1em] text-ink/60">
        {label}
      </p>
      <p className="font-display text-2xl leading-none">{value}</p>
    </div>
  );
}
