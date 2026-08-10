"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { channelTint } from "@/lib/dashboard/attribution";
import type {
  FreshnessState,
  GrowthAudiences,
  GrowthAudienceSplit,
  GrowthChannelRow,
  SourceFreshness,
} from "@/lib/dashboard/types";
import type { GrowthResponse } from "@/lib/dashboard/wire";

import { Empty, Panel, Stat, when } from "./primitives";

/**
 * The page the owner reads instead of asking for a fresh pull.
 *
 * ===========================================================================
 * TWO SOURCES, TWO CLOCKS, NEVER ONE "AS OF"
 * ===========================================================================
 * The funnel and the channel table come from PostHog's event stream, which is
 * current within seconds. The address count comes from an hourly mirror of the
 * product database, so it is an hour behind at best and can stop entirely
 * without PostHog stopping — which it has done before, behind an AWS cost
 * lockdown. Whether it is behind right now is a question for the stamp on the
 * panel, and deliberately not for this comment: the last one to name a state
 * here said "frozen" and was still saying it after the mirror recovered.
 *
 * Printing one shared timestamp over both would be a lie about whichever half
 * is older, and this project has twice been bitten by a number that looked
 * current and was not. So each panel carries the stamp of the source it was
 * built from, and a stale source says so in words on the panel itself rather
 * than leaving the reader to compare two timestamps and infer it.
 *
 * ===========================================================================
 * WHY TABLES AND NOT CHARTS
 * ===========================================================================
 * Asked for explicitly: "easy to understand". A funnel with three transition
 * rates and a channel table with eight columns are both things you read a
 * single figure out of, and a bar chart makes that harder rather than easier.
 * The only ranking device on the page is the row order.
 */
export function GrowthPanel({ data }: { data: GrowthResponse }) {
  const funnel = data.funnel;
  const channels = data.channels ?? [];
  const sides = data.sides ?? [];
  const emails = data.emails ?? null;
  /*
    The finished-only basis, not `data.audiences`.

    Both are on the payload. This one counts a person into an audience only
    once they have FINISHED a test of it, so the people the countdown submitted
    for — who carry an audience on the event but never sat the paper — fall
    into the residual instead of being credited to a column. The channel table
    above uses the same basis, so the two cannot disagree.
  */
  const audiences = data.audiencesFinished ?? data.audiences ?? null;
  const posthog = data.freshness?.posthog ?? null;
  const warehouse = data.freshness?.warehouse ?? null;

  if (!funnel) {
    return (
      <Panel title="Funnel" subtitle="Distinct people at every stage.">
        <Empty>No data for this window.</Empty>
      </Panel>
    );
  }

  return (
    <div className="space-y-5">
      <FreshnessStrip posthog={posthog} warehouse={warehouse} />

      {/* ---- 1. The funnel ------------------------------------------------
          First on the page because it is one of the two things read every
          time. Four stages, one population, distinct people throughout. */}
      <Panel
        title="The funnel"
        subtitle="Distinct PEOPLE at every stage, not events, and all four counted over the same group — everyone who loaded a page in this window."
        right={posthog ? <Stamp freshness={posthog} /> : undefined}
      >
        <div
          role="region"
          aria-label="Four-stage funnel in distinct people"
          tabIndex={0}
          className="-mx-1 overflow-x-auto px-1 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          <table className="w-full min-w-[30rem] border-collapse text-left text-[0.82rem]">
            <thead>
              <tr className="border-b-[2.5px] border-ink">
                <th scope="col" className="py-2 pr-3 font-sans text-xs font-bold uppercase">
                  Stage
                </th>
                <Cell as="th">People</Cell>
                <Cell as="th">Conversion</Cell>
              </tr>
            </thead>
            <tbody>
              <FunnelRow label="Landed" hint="loaded a page" people={funnel.landed} rate={null} />
              <FunnelRow
                label="Started the test"
                hint="fired test_started"
                people={funnel.started}
                rate={funnel.startRate}
                rateNote="of the people who landed"
              />
              {/*
                THE STAGE THAT USED TO BE ONE ROW.

                It read "Completed" and carried everybody with a
                `test_completed`, which silently included the attempts the
                countdown submitted for people who had already gone. Those are
                not finishers, and dividing the address count by the two added
                together is what made this page report that half of everyone
                who takes the test refuses to give an address.

                So the stage is the finishers, and the walk-aways branch out of
                it. The branch is indented and tinted because it is an EXIT,
                not a step: nothing below it descends from it.
              */}
              <FunnelRow
                label="Finished the test"
                hint="ended it themselves, or beat the clock to the end"
                people={funnel.finished}
                rate={rateOf(funnel.finished, funnel.started)}
                rateNote="of the people who started"
              />
              <FunnelRow
                variant="branch"
                label="Left; the clock submitted for them"
                hint={`answered under ${Math.round(funnel.answeredShare * 100)}% and stopped`}
                people={funnel.abandonedOnly}
                rate={rateOf(funnel.abandonedOnly, funnel.started)}
                rateNote="of the people who started"
              />
              <FunnelRow
                label="Gave an email"
                hint="of the people who finished, at the results gate"
                people={funnel.finishedEmailedCorrected}
                rate={funnel.finishedEmailRateCorrected}
                rateNote="of the people who finished"
                note={
                  funnel.outageLostConversions > 0
                    ? `includes ${count(funnel.outageLostConversions)} the 9 Aug outage lost`
                    : undefined
                }
              />
            </tbody>
          </table>
        </div>

        <CompletionSplitNote funnel={funnel} />

        {/*
          The people the funnel cannot hold, named rather than dropped.

          They are the reason this panel's last stage is smaller than the
          Signups tile at the top of the page, and stating the difference is
          cheaper than letting somebody find it and stop trusting both.
        */}
        {funnel.seenWithoutPageview > 0 && (
          <p className="mt-4 rounded-2xl border-2 border-dashed border-ink/30 px-4 py-3 text-xs font-semibold leading-relaxed text-ink/65">
            <strong className="font-bold text-ink">
              {count(funnel.seenWithoutPageview)} more people
            </strong>{" "}
            reached PostHog in this window without ever recording a pageview — almost all of them
            ad clicks that left before the page finished loading. They are in none of the four
            rows above, because a person with no pageview has no arrival to attribute and would
            land in the channel table as traffic from nowhere.
            {funnel.withoutPageviewEmailed > 0 && (
              <>
                {" "}
                <strong className="font-bold text-ink">
                  {count(funnel.withoutPageviewEmailed)} of them still gave an email
                </strong>
                , which is why “Gave an email” here reads {count(funnel.withoutPageviewEmailed)}{" "}
                lower than the Signups tile above.
              </>
            )}{" "}
            {/*
              Stated whether or not it is zero.

              "The pageview-only population must be hiding the missing
              finishers" is the first explanation anyone reaches for when
              Completed is compared against the finished-tests count below,
              and on this project it has been false. Printing the number every
              time answers it on the page instead of costing somebody an
              investigation.
            */}
            {funnel.withoutPageviewCompleted === 0 ? (
              <>
                <strong className="font-bold text-ink">None of them finished a test</strong>,
                so “Completed” above is every finisher PostHog recorded — the missing pageview
                costs that row nobody.
              </>
            ) : (
              <>
                <strong className="font-bold text-ink">
                  {count(funnel.withoutPageviewCompleted)} of them finished a test
                </strong>
                , so “Completed” above is that many short of every finisher PostHog recorded.
              </>
            )}
          </p>
        )}
      </Panel>

      {/* ---- 2. The channel table ----------------------------------------- */}
      <Panel
        title="Channels"
        subtitle="One row per channel per side. A channel running both appears twice, adjacent, because a blended row describes neither half. Adult and Child split the Emailed column by which test the person finished."
        right={posthog ? <Stamp freshness={posthog} /> : undefined}
      >
        {channels.length === 0 ? (
          <Empty>No attributed traffic in this window.</Empty>
        ) : (
          <ChannelTable rows={channels} />
        )}
      </Panel>

      {/* ---- 3. The same numbers, read by audience ------------------------- */}
      <Panel
        title="Where each audience comes from"
        subtitle="The table above, read the other way round. Same people, regrouped — no second count. Counted only once somebody finished the test, so a walk-away the clock submitted for is in neither column."
        right={posthog ? <Stamp freshness={posthog} /> : undefined}
      >
        {!audiences || audiences.emailed === 0 ? (
          <Empty>Nobody gave an address in this window.</Empty>
        ) : (
          <AudienceSplit audiences={audiences} />
        )}
      </Panel>

      {/* ---- 4. Paid against organic --------------------------------------- */}
      <Panel
        title="Paid against organic"
        subtitle="The comparison the spend decision turns on. Paid is utm_medium=cpc on the person's first pageview."
        right={posthog ? <Stamp freshness={posthog} /> : undefined}
      >
        {sides.length === 0 ? (
          <Empty>No attributed traffic in this window.</Empty>
        ) : (
          <div
            role="region"
            aria-label="Paid against organic"
            tabIndex={0}
            className="-mx-1 overflow-x-auto px-1 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            <table className="w-full min-w-[34rem] border-collapse text-left text-[0.82rem]">
              <thead>
                <tr className="border-b-[2.5px] border-ink">
                  <th scope="col" className="py-2 pr-3 font-sans text-xs font-bold uppercase">
                    Side
                  </th>
                  <Cell as="th">Visitors</Cell>
                  <Cell as="th">Share of traffic</Cell>
                  <Cell as="th">Sign-ups</Cell>
                  <Cell as="th">Conversion</Cell>
                </tr>
              </thead>
              <tbody>
                {sides.map((side) => (
                  <tr key={side.side} className="border-b-2 border-ink/15">
                    <th scope="row" className="py-2 pr-3 font-normal">
                      <SideChip paid={side.side === "paid"} />
                      <span className="ml-2 text-[0.72rem] font-semibold text-ink/50">
                        {side.channels} channel{side.channels === 1 ? "" : "s"}
                      </span>
                    </th>
                    <Cell strong>{count(side.landed)}</Cell>
                    <Cell muted>{rate(side.shareOfTraffic)}</Cell>
                    <Cell>{count(side.emailed)}</Cell>
                    <Cell strong>{rate(side.signupRate)}</Cell>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* ---- 5. The address list ------------------------------------------
          Warehouse-sourced, so it carries the OTHER stamp. If the mirror is
          behind, these four numbers are behind and the stamp says so. */}
      <Panel
        title="Email addresses"
        subtitle="Distinct addresses from the finished-tests mirror, deduplicated. Somebody who took two tests is one address."
        right={warehouse ? <Stamp freshness={warehouse} /> : undefined}
      >
        {data.warehouseError ? (
          <p className="rounded-2xl border-[2.5px] border-ink bg-coral px-4 py-3 text-sm font-bold">
            The completions mirror could not be read, so there is no address count to show:{" "}
            {data.warehouseError}
          </p>
        ) : !emails ? (
          <Empty>No completions in this window.</Empty>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Stat
                label="Addresses"
                value={count(emails.addresses)}
                hint="distinct, deduplicated"
                tone="mint"
              />
              <Stat label="Adult" value={count(emails.adult)} hint="took the adult test" />
              <Stat
                label="Child"
                value={count(emails.child)}
                hint="took a children's test"
                tone="blue"
              />
              <Stat
                label="Both"
                value={count(emails.both)}
                hint="counted in each column above"
                tone="yellow"
              />
            </div>
            <CompletionAccountingBlock accounting={emails.accounting} />
            <FinishedTests emails={emails} peopleWhoFinished={funnel.finished} />
          </>
        )}
      </Panel>
    </div>
  );
}

/* --------------------------------------------------------------------------
 * What counts as a completion, and the rate that follows from it
 * ------------------------------------------------------------------------ */

/**
 * The number this whole change exists to correct, and its working shown.
 *
 * ===========================================================================
 * WHY THE RATE IS PRINTED WITH ITS TWO CORRECTIONS VISIBLE
 * ===========================================================================
 * The uncorrected figure — every result row divided into every address — read
 * about 50% and was understood as "half the people who finish the test refuse
 * to give us an email". It is not that number and never was. Two separate
 * things were wrong with it, in the same direction, and each is worth roughly
 * ten points:
 *
 *   THE CLOCK'S ROWS. A quarter of the rows were attempts the countdown
 *   submitted for somebody who had already left, sitting in the denominator as
 *   though they were finishers who declined.
 *   THE OUTAGE. Six and a half hours on 9-10 August where every results email
 *   failed, so the address never reached the row. A delivery failure counted
 *   as a refusal.
 *
 * Printing only the corrected figure would be an improvement and still a bad
 * idea: the owner has been reading ~50% for a week and a number that silently
 * becomes 71% is a number nobody can trust either. So the page shows the old
 * reading, both corrections and the result, and the reader can follow it.
 *
 * The threshold is on screen for the same reason. It is a choice somebody
 * made, it changes what the headline says, and a reader is entitled to see it
 * rather than to discover it in a source file.
 */
function CompletionAccountingBlock({
  accounting,
}: {
  accounting: NonNullable<GrowthResponse["emails"]>["accounting"];
}) {
  const { rule, all, corrected, outage } = accounting;
  const everyRow = all.finished + all.abandoned;
  const everyAddress = all.finishedWithEmail + all.abandonedWithEmail;
  const uncorrected = everyRow > 0 ? everyAddress / everyRow : null;
  const share = Math.round(rule.answeredShare * 100);

  if (everyRow === 0) return null;

  return (
    <div className="mt-5 space-y-2">
      <div className="grid gap-2 sm:grid-cols-3">
        <Stat
          label="Finished the test"
          value={count(corrected.finished)}
          hint={outage.overlaps ? "outside the outage hours" : "results the person ended"}
          tone="mint"
        />
        <Stat
          label="Gave an address"
          value={rate(corrected.finishedEmailRate)}
          hint={`${count(corrected.finishedWithEmail)} of ${count(corrected.finished)} finishers`}
          tone="paper"
        />
        <Stat
          label="Left mid-test"
          value={count(all.abandoned)}
          hint={`the clock submitted for them · ${rate(all.abandonedEmailRate)} still gave an address`}
          tone="coral"
        />
      </div>

      {/*
        The arithmetic, in the order it happened. Every figure here is one of
        the figures above, so a reader can check the sentence rather than
        having to believe it.
      */}
      <p className="rounded-2xl border-2 border-dashed border-ink/30 px-4 py-3 text-xs font-semibold leading-relaxed text-ink/65">
        <strong className="font-bold text-ink">
          This page used to read {rate(uncorrected)} here
        </strong>
        , and it was wrong twice over in the same direction. It divided{" "}
        {count(everyAddress)} addresses by all {count(everyRow)} result rows — but{" "}
        <strong className="font-bold text-ink">
          {count(all.abandoned)} of those rows were written by the countdown
        </strong>{" "}
        for people who had already left, so they sat in the denominator as though they were
        finishers who had declined.
        {outage.overlaps && outage.finished > 0 && (
          <>
            {" "}
            And{" "}
            <strong className="font-bold text-ink">
              {count(outage.finished)} finished tests fall inside the 9 August delivery outage
            </strong>{" "}
            — 17:47 to 00:16 UTC, when every results email failed and only{" "}
            {count(outage.finishedWithEmail)} address reached a row. Those hours are held out
            of the rate above, and named here rather than quietly dropped: a range of hours
            disappearing from a denominator with no note is its own kind of dishonesty.
          </>
        )}{" "}
        Corrected for both,{" "}
        <strong className="font-bold text-ink">
          {count(corrected.finishedWithEmail)} of {count(corrected.finished)} people who
          finished the test gave an address — {rate(corrected.finishedEmailRate)}
        </strong>
        .
      </p>

      {/* The rule, and where its two halves disagree. */}
      <p className="rounded-2xl border-2 border-dashed border-ink/30 px-4 py-3 text-xs font-semibold leading-relaxed text-ink/65">
        <strong className="font-bold text-ink">
          A result counts as finished when the person ended it themselves, or when the clock
          ended it after they had answered {share}% or more of the paper.
        </strong>{" "}
        Two facts decide it and neither is enough alone. The product writes no row at all for
        somebody who quits or closes the tab, so the countdown is the only thing that can
        produce a result nobody wanted — {count(rule.timedOut)} rows carry it.{" "}
        {count(rule.sparse)} rows fall under {share}%. The{" "}
        <strong className="font-bold text-ink">{count(rule.both)} that do both</strong> are the
        abandonments.
        {rule.timedOutOnly > 0 && (
          <>
            {" "}
            The other {count(rule.timedOutOnly)} that ran out of time had worked through the
            paper and are counted as finishers — somebody who answers 48 of 50 and hits the
            limit engaged completely, which is what the Funnel tab has always said.
          </>
        )}
        {rule.sparseOnly > 0 && (
          <>
            {" "}
            The {count(rule.sparseOnly)} that stopped short but submitted deliberately are
            finishers too: they finished and declined, which is a different thing from leaving.
          </>
        )}
      </p>
    </div>
  );
}

/* --------------------------------------------------------------------------
 * Finished tests, and what they are not
 * ------------------------------------------------------------------------ */

/**
 * The sentence that stops this figure being read as a headcount.
 *
 * ===========================================================================
 * WHY THIS IS PROSE AND NOT ANOTHER TILE
 * ===========================================================================
 * This number used to read "N completions in this window" and nothing else,
 * and it was read — reasonably — as the number of people who finished the
 * test. It is not that, it cannot be turned into that, and the honest move is
 * to say what it IS and give the range the headcount lies in rather than to
 * print a single figure that would have to be wrong at one end.
 *
 * Three facts have to survive together, which is why they are spelled out
 * rather than compressed into a label:
 *
 *   1. The unit is a finished TEST. Retakes and a household sitting both
 *      audiences are two tests and one person.
 *   2. Anonymous finishers cannot be resolved to people at all, so the
 *      headcount has a floor and a ceiling and no exact value.
 *   3. The funnel above DOES count people, and reads a different number for
 *      that reason and not because either half is broken.
 */
function FinishedTests({
  emails,
  peopleWhoFinished,
}: {
  emails: NonNullable<GrowthResponse["emails"]>;
  peopleWhoFinished: number;
}) {
  const anonymous = Math.max(0, emails.finishedTests - emails.rowsWithEmail);
  return (
    <>
      <p className="mt-4 text-xs font-semibold leading-relaxed text-ink/60">
        <strong className="font-bold text-ink">
          {count(emails.finishedTests)} results were written
        </strong>{" "}
        in this window — tests, not people, and{" "}
        {count(emails.accounting.all.abandoned)} of them by the clock rather than by anybody.{" "}
        {count(emails.rowsWithEmail)} carry an address and those deduplicate to{" "}
        {count(emails.addresses)} people
        {anonymous > 0 && (
          <>
            ; the other {count(anonymous)} gave none, so the number of PEOPLE behind this figure
            is somewhere between {count(emails.addresses)} and{" "}
            {count(emails.addresses + anonymous)} and cannot be pinned down from this table
          </>
        )}
        . The funnel above counts people, and reads {count(peopleWhoFinished)} at its Finished
        row for exactly that reason.
      </p>
      <p className="mt-2 text-xs font-semibold leading-relaxed text-ink/60">
        Adult and child are each distinct within their own audience, so they sum to{" "}
        {count(emails.adult + emails.child)} rather than {count(emails.addresses)} — the
        difference is the {count(emails.both)} household{emails.both === 1 ? "" : "s"} that did
        both.
      </p>
      {/*
        The reconciliation somebody will need at some point.

        Counting rows in Aurora `test_results` by hand gives roughly 1.7x this
        number, and has already been reported as a dashboard defect once. The
        gap is the export's definition of a completion, so the definition
        belongs on the page next to the figure it produces.
      */}
      <p className="mt-2 text-xs font-semibold leading-relaxed text-ink/50">
        Counting rows in the product database directly gives a considerably larger number, and
        that is expected rather than a disagreement: a test that is finished and then emailed is
        stored there as two rows, and attempts where nobody answered a question are kept. The
        export collapses each pair and drops the unanswered, so one finished test is one row
        here.
      </p>
      <SignupsTileNote addresses={emails.addresses} />
    </>
  );
}

/**
 * Why this figure and the Signups tile at the top of the page disagree.
 *
 * ===========================================================================
 * FOUR DIFFERENCES, PULLING BOTH WAYS, WHICH IS WHY THE GAP IS NOT A NUMBER
 * ===========================================================================
 * The obvious move is to name the difference — "the tile is N lower because of
 * X". That was tried and it does not survive contact with a second window.
 * Measured on 9 August: since launch the tile read 320 against 326 addresses,
 * but 3–8 August was 66 addresses against 68 people, 5–7 August 22 against 25,
 * and 8–9 August 88 against 87. The gap changes SIGN. Any single-cause
 * explanation printed on this page would be wrong within a day, and a
 * confident wrong explanation is worse than the discrepancy it explains.
 *
 * What is stable is the list of reasons, and each was checked rather than
 * assumed:
 *
 *   UNIT      The tile counts PEOPLE. This counts ADDRESSES. Over the launch
 *             window PostHog recorded 347 signup events across 326 people, so
 *             some people gave more than one address.
 *   POPULATION The tile counts anyone who triggered a signup. This counts only
 *             addresses attached to a FINISHED TEST. Measured: 343 distinct
 *             addresses in the signups table against 326 on finished tests —
 *             17 people gave an address without finishing one in the window.
 *   EXCLUSION The tile is filtered by PostHog's test-account rules, which
 *             removed 6 people from it on 9 August. This table is filtered by
 *             the export's Aurora markers instead. They are different rule
 *             sets over different systems and they do not cover the same
 *             humans.
 *   CLOCK     The tile is live; this is an hourly mirror.
 *
 * They cannot be netted off against each other on the page, because events
 * carry no address — that is the privacy invariant in lib/analytics/events.ts,
 * not an oversight — so no row-by-row reconciliation between the two is
 * possible by construction. Saying that plainly is the honest end of this.
 */
function SignupsTileNote({ addresses }: { addresses: number }) {
  return (
    <p className="mt-2 text-xs font-semibold leading-relaxed text-ink/50">
      <strong className="font-bold text-ink/70">
        The Signups tile at the top of this page will not match {count(addresses)}
      </strong>
      , and neither figure is wrong. That tile counts PEOPLE who triggered a signup, live from
      PostHog and with its internal-user filter applied. This counts ADDRESSES attached to a
      finished test, from the hourly mirror, filtered instead by the export&rsquo;s own rules —
      so somebody who gave two addresses, or gave one without finishing a test, or was excluded
      by one filter and not the other, lands in one and not the other. The difference is small
      but it is a net of four such effects and it runs in both directions depending on the
      window, so it is not a fixed number and no single cause explains it. The two cannot be
      reconciled row by row on purpose: events never carry an email address, so there is nothing
      to join them on.
    </p>
  );
}

/* --------------------------------------------------------------------------
 * The audiences, side by side
 * ------------------------------------------------------------------------ */

/**
 * Two columns, one row order, bars in the channel's own colour.
 *
 * ===========================================================================
 * WHY THIS IS NOT TWO PIE CHARTS
 * ===========================================================================
 * The question is not "what is the adult mix" — it is "do these two mixes
 * differ", and that is a comparison between two distributions. Comparing
 * angles across two pies is the hardest read there is: you cannot line up a
 * slice on the left with its twin on the right, and the eye is bad at angle
 * even within one pie. Two bar columns sharing a row order turn the same
 * question into "is this row longer on the left or the right", which is
 * answered without counting anything.
 *
 * The channel keeps its tint from `channelTint`, the same one it wears
 * everywhere else on this dashboard, so Reddit is the same colour in both
 * columns and the crossover is visible before any label is read.
 */
function AudienceSplit({ audiences }: { audiences: GrowthAudiences }) {
  return (
    <>
      <Inversion audiences={audiences} />
      <div className="grid gap-4 sm:grid-cols-2">
        <AudienceColumn
          split={audiences.adult}
          title="Adults"
          hint="finished the adult test"
        />
        <AudienceColumn
          split={audiences.child}
          title="Children"
          hint="finished a children's test"
        />
      </div>
      <AudiencePopulationNote audiences={audiences} />
    </>
  );
}

function AudienceColumn({
  split,
  title,
  hint,
}: {
  split: GrowthAudienceSplit;
  title: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border-[2.5px] border-ink p-4">
      <p className="flex flex-wrap items-baseline gap-x-2">
        <span className="font-display text-2xl uppercase leading-none tracking-[-0.01em]">
          {title}
        </span>
        <span className="font-mono text-sm font-bold">{count(split.people)}</span>
        <span className="font-sans text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-ink/50">
          people
        </span>
      </p>
      <p className="mt-1 text-[0.72rem] font-semibold text-ink/55">{hint}</p>

      {split.people === 0 ? (
        <p className="mt-4 text-xs font-semibold text-ink/50">
          Nobody in this window finished one.
        </p>
      ) : (
        <ul className="mt-4 space-y-2.5">
          {split.slices.map((slice) => (
            <li key={slice.channel}>
              <p className="flex items-baseline justify-between gap-2 text-[0.78rem]">
                <span className="min-w-0 truncate font-semibold">
                  {slice.channel}
                  {slice.pooled && (
                    <span className="ml-1.5 font-sans text-[0.68rem] font-semibold text-ink/45">
                      {slice.channels} channel{slice.channels === 1 ? "" : "s"}
                    </span>
                  )}
                </span>
                <span className="shrink-0 font-mono tabular-nums">
                  {count(slice.people)}
                  <span className="ml-1.5 text-ink/50">{rate(slice.share)}</span>
                </span>
              </p>
              <ShareBar
                people={slice.people}
                total={split.people}
                channel={slice.pooled ? "" : slice.channel}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * A share of the column's own audience.
 *
 * NOT the primitive `Bar`, which floors every value at 2% so a bar is always
 * visible. That is right where it is used and wrong here: a channel that
 * brought nobody would draw a sliver, and a sliver in the column this panel
 * exists to compare reads as "a few" rather than as none.
 */
function ShareBar({
  people,
  total,
  channel,
}: {
  people: number;
  total: number;
  channel: string;
}) {
  const width = total > 0 ? (people / total) * 100 : 0;
  return (
    <div className="mt-1 h-3 w-full overflow-hidden rounded-full border-2 border-ink bg-paper">
      {people > 0 && (
        <div
          className={cn("h-full", channel ? channelTint(channel) : "bg-gray-100")}
          style={{ width: `${Math.max(2, width)}%` }}
        />
      )}
    </div>
  );
}

/**
 * The finding, in a sentence, above the thing that shows it.
 *
 * The panel was asked for because two channels are close to inverted and that
 * was only visible to somebody who read fifteen rows and held them in their
 * head. Bars fix that for anyone who looks; a sentence fixes it for anyone who
 * glances, which is the stated reason this page exists.
 *
 * Computed, never written down. A hardcoded "Reddit brings adults" would still
 * be on the page the week Reddit stops doing that, and would be believed.
 */
function Inversion({ audiences }: { audiences: GrowthAudiences }) {
  const skews = audiences.adult.slices
    .filter((slice) => !slice.pooled)
    .map((slice) => {
      const child = audiences.child.slices.find((s) => s.channel === slice.channel);
      const people = slice.people + (child?.people ?? 0);
      return { channel: slice.channel, adult: slice.people, people };
    })
    // Below this a single person swings the ratio, and a claim about a channel
    // that sent nine people is not a finding.
    .filter((s) => s.people >= 10);

  if (skews.length < 2) return null;

  const mostAdult = skews.reduce((a, b) => (b.adult / b.people > a.adult / a.people ? b : a));
  const mostChild = skews.reduce((a, b) => (b.adult / b.people < a.adult / a.people ? b : a));
  if (mostAdult.channel === mostChild.channel) return null;

  const adultShare = mostAdult.adult / mostAdult.people;
  const childShare = 1 - mostChild.adult / mostChild.people;
  // Two channels that lean the same way are not an inversion, and saying so
  // would be reading a pattern into noise.
  if (adultShare < 0.5 || childShare < 0.5) return null;

  return (
    <p className="mb-4 rounded-2xl border-[2.5px] border-ink bg-cream px-4 py-3 text-sm font-semibold leading-relaxed">
      <strong className="font-bold">{mostAdult.channel}</strong> brings mostly adults —{" "}
      {rate(adultShare)} of the addresses it earned finished the adult test. Of the ones{" "}
      <strong className="font-bold">{mostChild.channel}</strong> earned, {rate(childShare)}{" "}
      finished a children&rsquo;s test. Same funnel, different households.
    </p>
  );
}

/**
 * What this panel is a mix OF, said before anyone can read it as something
 * bigger.
 *
 * ===========================================================================
 * THE SENTENCE THIS EXISTS TO PREVENT
 * ===========================================================================
 * "TikTok's audience is 69% children." The panel does not say that and cannot:
 * it describes people who finished a test AND gave an address, which is under
 * two percent of what TikTok sends. Whether the converters look like the
 * bouncers is precisely the unmeasured assumption that would be smuggled in,
 * and it is the kind of claim that ends up in a deck.
 */
function AudiencePopulationNote({ audiences }: { audiences: GrowthAudiences }) {
  return (
    <p className="mt-4 rounded-2xl border-2 border-dashed border-ink/30 px-4 py-3 text-xs font-semibold leading-relaxed text-ink/65">
      <strong className="font-bold text-ink">
        This is the mix of people who gave an address
      </strong>{" "}
      — {count(audiences.emailed)}{" "}
      of them — and not the mix of a channel&rsquo;s traffic. A channel that reads mostly
      children here sends mostly children{" "}
      <em>among the people who finished a test and asked for the result</em>; what the rest of
      its visitors were after is not measured anywhere on this page.
      {(audiences.both > 0 || audiences.neither > 0) && (
        <>
          {" "}
          The two columns come to{" "}
          {count(audiences.adult.people + audiences.child.people)} rather than{" "}
          {count(audiences.emailed)}{" "}
          for the reasons the table above prints on the rows:
          {audiences.both > 0 && (
            <>
              {" "}
              <strong className="font-bold text-ink">{count(audiences.both)} sat both</strong>{" "}
              and are counted in each column
            </>
          )}
          {audiences.both > 0 && audiences.neither > 0 && ","}
          {audiences.neither > 0 && (
            <>
              {" "}
              <strong className="font-bold text-ink">
                {count(audiences.neither)} finished no test
              </strong>{" "}
              and are in neither — including the ones who walked away mid-test and gave an
              address at the gate the countdown raised for them
            </>
          )}
          .
        </>
      )}
    </p>
  );
}

/* --------------------------------------------------------------------------
 * Freshness
 * ------------------------------------------------------------------------ */

/**
 * The two clocks, at the top of the page where they are read before the
 * numbers rather than after them.
 *
 * ===========================================================================
 * THREE TONES, BECAUSE TWO CANNOT SAY WHAT NEEDS SAYING
 * ===========================================================================
 * This was coral-or-mint off a boolean, and the boolean folded together two
 * opposite conditions. The mirror publishes only when its content CHANGES, so
 * on a quiet evening its timestamp ages while the pipeline is perfectly
 * healthy — and the panel turned coral and said a run had been missed. It did
 * that on 10 August across three runs that had all succeeded, and the owner was
 * told his pipeline had failed.
 *
 * So an unchanged-but-caught-up mirror gets its own tone. Cream is deliberately
 * not mint: nothing reachable from this page can prove the exporter ran, only
 * that nothing is missing from the figures, and a green badge would be claiming
 * the stronger fact. Coral is kept for exactly the case it was built for — work
 * PostHog has seen that the mirror has not carried across a scheduled run.
 */
function FreshnessStrip({
  posthog,
  warehouse,
}: {
  posthog: SourceFreshness | null;
  warehouse: SourceFreshness | null;
}) {
  const items = [posthog, warehouse].filter((f): f is SourceFreshness => f !== null);
  if (items.length === 0) return null;
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {items.map((f) => (
        <div
          key={f.source}
          className={cn("rounded-2xl border-[2.5px] border-ink px-4 py-3", STATE_TINT[state(f)])}
        >
          <p className="flex flex-wrap items-baseline gap-x-2 font-sans text-[0.65rem] font-bold uppercase tracking-[0.12em] text-ink/70">
            {SOURCE_LABEL[f.source]}
            <span className="font-sans text-[0.62rem] tracking-[0.08em]">
              · {STATE_WORD[state(f)]}
            </span>
          </p>
          <p className="mt-1 font-display text-xl leading-none tracking-[-0.01em]">
            {f.at ? `${when(f.at)} UTC` : "unknown"}
            {f.ageSeconds !== null && (
              <span className="ml-2 font-sans text-xs font-bold text-ink/60">
                {ago(f.ageSeconds)} ago
              </span>
            )}
          </p>
          <p className="mt-1 text-[0.72rem] font-semibold leading-snug text-ink/70">{f.note}</p>
        </div>
      ))}
    </div>
  );
}

/**
 * The state, tolerating a payload written before it existed.
 *
 * A cached page or an in-flight deploy can hand this component the old shape,
 * and falling back to the boolean keeps such a payload readable rather than
 * blank. It cannot resurrect the defect: the old `stale` was only ever true on
 * a mirror this version would also call stalled or unknown.
 */
function state(f: SourceFreshness): FreshnessState {
  return f.state ?? (f.stale ? "stalled" : "current");
}

const STATE_TINT: Record<FreshnessState, string> = {
  current: "bg-mint",
  idle: "bg-cream",
  stalled: "bg-coral",
  unknown: "bg-coral",
};

const STATE_WORD: Record<FreshnessState, string> = {
  current: "current",
  idle: "unchanged",
  stalled: "stale",
  unknown: "unknown",
};

const SOURCE_LABEL: Record<SourceFreshness["source"], string> = {
  posthog: "Visitors, funnel & channels · PostHog",
  warehouse: "Completions & addresses · hourly mirror",
};

/**
 * The same fact, small enough to sit in a panel header.
 *
 * The state word is printed for everything except a current source, where the
 * bare timestamp already says it. An unchanged mirror is labelled rather than
 * left to its colour alone: it is the reading most likely to be glanced at and
 * misread as the alarm it used to be.
 */
function Stamp({ freshness }: { freshness: SourceFreshness }) {
  const s = state(freshness);
  return (
    <span
      title={freshness.note}
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border-2 border-ink px-2.5 py-0.5 font-sans text-[0.62rem] font-bold uppercase tracking-[0.06em]",
        STATE_TINT[s],
      )}
    >
      {freshness.at
        ? `${s === "current" ? "" : `${STATE_WORD[s]} · `}${when(freshness.at)}`
        : "age unknown"}
    </span>
  );
}

/* --------------------------------------------------------------------------
 * The channel table
 * ------------------------------------------------------------------------ */

function ChannelTable({ rows }: { rows: GrowthChannelRow[] }) {
  return (
    <>
      <div
        role="region"
        aria-label="Channels, paid and organic separated"
        tabIndex={0}
        className="-mx-1 overflow-x-auto px-1 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        <table className="w-full min-w-[60rem] border-collapse text-left text-[0.82rem]">
          <thead>
            <tr className="border-b-[2.5px] border-ink">
              <th scope="col" className="py-2 pr-3 font-sans text-xs font-bold uppercase">
                Channel
              </th>
              <Cell as="th">Landed</Cell>
              <Cell as="th">Started</Cell>
              <Cell as="th">Start rate</Cell>
              <Cell
                as="th"
                title="People who finished a test. Attempts the countdown submitted for somebody who had already left are counted underneath, not in this figure."
              >
                Finished
              </Cell>
              <Cell as="th">Emailed</Cell>
              <Cell as="th" title="Of the emailed, how many finished the adult test.">
                Adult
              </Cell>
              <Cell as="th" title="Of the emailed, how many finished a children's test.">
                Child
              </Cell>
              <Cell as="th">Visitor to signup</Cell>
              <th scope="col" className="py-2 font-sans text-xs font-bold uppercase">
                Last activity
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.channel}:${row.paid ? "paid" : "organic"}`} className="border-b-2 border-ink/15">
                <th scope="row" className="py-2 pr-3 font-normal">
                  <span className="flex flex-wrap items-center gap-1.5">
                    <span className="font-semibold">{row.channel}</span>
                    <SideChip paid={row.paid} />
                  </span>
                </th>
                <Cell strong>{count(row.landed)}</Cell>
                <Cell>{count(row.started)}</Cell>
                <Cell muted>{rate(row.startRate)}</Cell>
                <FinishedCell row={row} />
                <EmailedCell row={row} />
                <Cell>{count(row.finishedAdult)}</Cell>
                <Cell>{count(row.finishedChild)}</Cell>
                <Cell strong>{rate(row.signupRate)}</Cell>
                <td className="whitespace-nowrap py-2">
                  <LastActivity iso={row.lastActivity} seconds={row.lastActivityAgeSeconds} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AudienceSplitNote rows={rows} />
    </>
  );
}

/**
 * The emailed total, and — only where it applies — why its two parts do not
 * add up to it.
 *
 * The residual is printed ON THE ROW rather than left to the note below,
 * because the note cannot say WHICH rows it is talking about without listing
 * fourteen channels, and a reader doing the subtraction in their head on
 * TikTok's row needs the answer there and not four paragraphs later.
 */
/**
 * Finishers, and the walk-aways the countdown filed alongside them.
 *
 * The abandonments sit UNDER the figure rather than in a column of their own,
 * for the same reason the emailed residual does: this table is already ten
 * columns wide and the number is only interesting on the rows that have one.
 * It is on the row rather than in the note below because the note cannot say
 * which channel it means without listing all fourteen, and TikTok's row is
 * where the reader is standing when the question occurs to them.
 */
function FinishedCell({ row }: { row: GrowthChannelRow }) {
  return (
    <td className="py-2 pr-3 text-right font-mono text-[0.78rem] tabular-nums">
      {count(row.finished)}
      {row.abandonedOnly > 0 && (
        <span
          title={`${count(row.abandonedOnly)} more attempts from this channel were submitted by the countdown after the person had left. They are a real loss, but they did not finish, so they are not in this figure or in the Adult and Child columns.`}
          className="block font-sans text-[0.62rem] font-semibold leading-tight text-ink/50"
        >
          {count(row.abandonedOnly)} left mid-test
        </span>
      )}
    </td>
  );
}

function EmailedCell({ row }: { row: GrowthChannelRow }) {
  const parts: string[] = [];
  if (row.finishedBoth > 0) parts.push(`${count(row.finishedBoth)} both`);
  if (row.finishedAudienceUnknown > 0) {
    parts.push(`${count(row.finishedAudienceUnknown)} no finish`);
  }
  return (
    <td className="py-2 pr-3 text-right font-mono text-[0.78rem] tabular-nums">
      {count(row.emailed)}
      {parts.length > 0 && (
        <span
          title={residualTitle(row)}
          className="block font-sans text-[0.62rem] font-semibold leading-tight text-ink/50"
        >
          {parts.join(" · ")}
        </span>
      )}
    </td>
  );
}

function residualTitle(row: GrowthChannelRow): string {
  const said: string[] = [];
  if (row.finishedBoth > 0) {
    said.push(
      `${count(row.finishedBoth)} of these people finished both an adult test and a children's one, so they are counted in Adult AND in Child.`,
    );
  }
  if (row.finishedAudienceUnknown > 0) {
    said.push(
      `${count(row.finishedAudienceUnknown)} gave an email without finishing a test in this window — some walked away mid-test and came back to the gate — so they are in neither column.`,
    );
  }
  return said.join(" ");
}

/**
 * Why Adult + Child is not Emailed, stated once under the table.
 *
 * ===========================================================================
 * THE ARITHMETIC IS PRINTED BECAUSE THE ALTERNATIVES ARE BOTH LIES
 * ===========================================================================
 * Two numbers that do not sum to the third next to them is the fastest way to
 * lose a reader, and there were only ever three ways to handle it. Dropping
 * the people who cannot be resolved would make the column add up by quietly
 * shrinking the population. Sharing them out across the channels that DO
 * resolve would make it add up by inventing an answer on their behalf, which
 * is the failure mode that has already cost this project twice. Saying it out
 * loud is the third, and it is the only one that leaves the reader with a
 * number they can act on.
 *
 * Rendered only when there is something to explain: on a window where every
 * emailed person resolves to exactly one audience the two columns DO sum to
 * Emailed, and a standing paragraph explaining a discrepancy that is not on
 * screen would be its own kind of noise.
 */
function AudienceSplitNote({ rows }: { rows: GrowthChannelRow[] }) {
  const total = (key: keyof GrowthChannelRow) =>
    rows.reduce((acc, row) => acc + (row[key] as number), 0);
  const both = total("finishedBoth");
  const unknown = total("finishedAudienceUnknown");
  if (both === 0 && unknown === 0) return null;

  return (
    <p className="mt-4 rounded-2xl border-2 border-dashed border-ink/30 px-4 py-3 text-xs font-semibold leading-relaxed text-ink/65">
      <strong className="font-bold text-ink">Adult and Child will not always sum to Emailed</strong>
      , and the two reasons are both printed on the rows they apply to. They come from the test
      itself — the signup does not record which paper was sat — so a person is counted in an
      audience only once they have finished one.
      {both > 0 && (
        <>
          {" "}
          <strong className="font-bold text-ink">
            {count(both)} {both === 1 ? "person" : "people"} finished both
          </strong>{" "}
          an adult test and a children&rsquo;s one, and are counted in each column — the same
          overlap the addresses panel below reports for households, here broken out per channel.
          The two are measured off different systems and need not agree exactly.
        </>
      )}
      {unknown > 0 && (
        <>
          {" "}
          <strong className="font-bold text-ink">
            {count(unknown)} gave an email without finishing a test
          </strong>{" "}
          in this window, so there is no audience to file them under. Some of them walked away
          mid-test and came back to the gate afterwards — a real address, but not from anybody
          who sat the paper it would be credited to. They are left in neither column rather
          than picked for them or shared out across the channels that do resolve, which would
          make the split add up by inventing an answer.
        </>
      )}{" "}
      Every row still reconciles exactly: Emailed = Adult + Child − both + no finish.
    </p>
  );
}

/**
 * How long since anyone from this channel did anything.
 *
 * Relative rather than absolute, because the question being asked of this
 * column is "has this gone quiet", and answering it from a wall-clock time
 * costs the reader a subtraction every time. A channel silent for more than a
 * day is marked, since that has happened twice and was noticed late both times.
 *
 * The age arrives already measured. Working it out here would mean calling the
 * clock during render, which re-ages the row on every unrelated re-render and
 * measures it against a different instant from the freshness stamps above.
 */
function LastActivity({ iso, seconds }: { iso: string; seconds: number | null }) {
  if (!iso || seconds === null) {
    return <span className="font-mono text-[0.72rem] text-ink/35">—</span>;
  }
  const quiet = seconds > QUIET_AFTER_SECONDS;
  return (
    <span
      title={`${when(iso)} UTC`}
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[0.72rem]",
        quiet ? "border-2 border-ink bg-coral font-bold" : "text-ink/70",
      )}
    >
      {ago(seconds)} ago
    </span>
  );
}

/** A day of silence is worth marking. Both times a channel died, it was a day. */
const QUIET_AFTER_SECONDS = 24 * 3600;

function SideChip({ paid }: { paid: boolean }) {
  return (
    <span
      title={
        paid
          ? "Arrived with utm_medium=cpc on their first pageview."
          : "No paid medium on their first pageview."
      }
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border-2 border-ink px-2 py-0.5 font-sans text-[0.6rem] font-bold uppercase tracking-[0.06em]",
        paid ? "bg-yellow" : "bg-cream",
      )}
    >
      {paid ? "Paid" : "Organic"}
    </span>
  );
}

function FunnelRow({
  label,
  hint,
  people,
  rate: value,
  rateNote,
  note,
  variant = "stage",
}: {
  label: string;
  hint: string;
  people: number;
  rate: number | null;
  /** What the percentage is measured against. Each row names its own base. */
  rateNote?: string;
  /** A qualification on the count itself, printed under it. */
  note?: string;
  /** A branch leaves the funnel; nothing below it descends from it. */
  variant?: "stage" | "branch";
}) {
  const branch = variant === "branch";
  return (
    <tr className={cn("border-b-2 border-ink/15", branch && "bg-coral/20")}>
      <th scope="row" className={cn("py-2 pr-3 font-normal", branch && "pl-4")}>
        <span className={cn("font-semibold", branch && "text-ink/80")}>
          {branch && <span className="mr-1.5 text-ink/40">↳</span>}
          {label}
        </span>
        <span className="ml-2 text-[0.72rem] font-semibold text-ink/45">{hint}</span>
      </th>
      <Cell strong>
        {count(people)}
        {note && (
          <span className="block font-sans text-[0.62rem] font-semibold leading-tight text-ink/50">
            {note}
          </span>
        )}
      </Cell>
      <Cell muted>
        {value === null ? "—" : rate(value)}
        {value !== null && rateNote && (
          <span className="block font-sans text-[0.62rem] font-semibold leading-tight text-ink/40">
            {rateNote}
          </span>
        )}
      </Cell>
    </tr>
  );
}

/**
 * What "finished" means, and what the row above it used to include.
 *
 * ===========================================================================
 * THE DEFECT THIS PARAGRAPH IS THE FIX FOR
 * ===========================================================================
 * The test runs on a countdown. When it reaches zero the runner submits
 * whatever is on screen, writes a result, fires `test_completed` and raises
 * the email gate — on a tab whose owner left ten minutes ago. Roughly a
 * quarter of everything this page called a completion was that.
 *
 * Added to the real finishers and divided into the address count, they made
 * the page report that about half of everyone who finishes the test declines
 * to give an address. The true figure among people who actually sat it is
 * around seventy per cent. That is not a rounding difference; it is the
 * difference between a broken funnel and a working one, and somebody could
 * have spent a quarter trying to fix the wrong thing.
 *
 * THE ABANDONMENTS ARE NOT DELETED, AND MUST NOT BE. They are real people who
 * started the test and walked away, which is a genuine and expensive loss —
 * arguably the most expensive one on the page, since they cost an acquisition
 * and returned nothing. They keep their own row, their own count and their own
 * share. What changed is that they are no longer added to the finishers and
 * the sum called a conversion rate.
 *
 * The rule is printed rather than kept in a constant, because a reader of a
 * page that reports completions is entitled to know what the word means on it.
 */
function CompletionSplitNote({ funnel }: { funnel: NonNullable<GrowthResponse["funnel"]> }) {
  const share = Math.round(funnel.answeredShare * 100);
  const completions = funnel.finished + funnel.abandonedOnly;
  const emailedWithoutFinishing = Math.max(0, funnel.emailed - funnel.finishedEmailed);

  return (
    <div className="mt-4 space-y-2">
      {funnel.abandonedOnly > 0 && (
        <p className="rounded-2xl border-2 border-dashed border-ink/30 px-4 py-3 text-xs font-semibold leading-relaxed text-ink/65">
          <strong className="font-bold text-ink">
            {count(funnel.abandonedOnly)} of the {count(completions)} completions in this window
            were written by the clock
          </strong>
          , not by the person. The countdown reaches zero, the test submits whatever is on
          screen and the email gate goes up on a tab nobody is looking at. This row used to be
          a single &ldquo;Completed&rdquo; line of {count(completions)} with those two groups
          added together, and dividing the address count by that sum is what made this page
          report that about half of all finishers refuse to give an email. They do not.{" "}
          <strong className="font-bold text-ink">
            A completion counts as finished when the person ended it themselves, or when the
            clock ended it after they had answered {share}% or more of the paper
          </strong>{" "}
          — so somebody who worked to the last question and ran out of time is a finisher,
          which is what the Funnel tab has always said. The walk-aways keep their own row
          above: they are a real loss and worth reading, they are simply not finishers.
        </p>
      )}
      {(funnel.outageLostConversions > 0 || emailedWithoutFinishing > 0) && (
        <p className="rounded-2xl border-2 border-dashed border-ink/30 px-4 py-3 text-xs font-semibold leading-relaxed text-ink/65">
          {funnel.outageLostConversions > 0 && (
            <>
              <strong className="font-bold text-ink">
                Gave an email is corrected for the 9 August outage
              </strong>
              . Between 17:47 and 00:16 UTC every results email failed, and the conversion is
              only recorded when the address is genuinely stored — so{" "}
              {count(funnel.outageLostConversions)}{" "}
              {funnel.outageLostConversions === 1 ? "person who typed" : "people who typed"} in
              a valid address in those hours{" "}
              {funnel.outageLostConversions === 1 ? "was" : "were"} never counted as converted.
              They are counted above. Leaving them out reads a mail failure as a refusal.{" "}
            </>
          )}
          {emailedWithoutFinishing > 0 && (
            <>
              Separately,{" "}
              <strong className="font-bold text-ink">
                {count(emailedWithoutFinishing)}{" "}
                {emailedWithoutFinishing === 1 ? "person gave" : "people gave"} an address
                without finishing a test
              </strong>{" "}
              in this window — some of them walk-aways who came back to the gate, some who
              signed up without sitting one. They are real addresses and they are in the
              Signups tile, but they are not in the row above, because that row is finishers
              and they did not finish.
            </>
          )}
        </p>
      )}
    </div>
  );
}

/** A share, or null when the base is empty — never a silent 0%. */
function rateOf(part: number, whole: number): number | null {
  return whole > 0 ? part / whole : null;
}

/* --------------------------------------------------------------------------
 * Formatting
 * ------------------------------------------------------------------------ */

/**
 * A count with a thousands separator.
 *
 * The rest of the dashboard prints raw digits, which was fine while every
 * figure on it was two digits long. This page opens with a five-figure visitor
 * count and "6528" is measurably harder to read at a glance than "6,528".
 */
function count(value: number): string {
  return value.toLocaleString("en-GB");
}

/**
 * A percentage to one decimal place.
 *
 * NOT the shared `pct`, which rounds to whole numbers. The decision this page
 * exists to support is 2.5% against 32.3%, and whole percentages render the
 * paid side as "3%" — which reads as a rounding artefact rather than a rate,
 * and collapses the gap between 12.5% and 12.9% that separates two live ad
 * campaigns.
 */
function rate(value: number | null): string {
  if (value === null) return "—";
  return `${(value * 100).toFixed(1)}%`;
}

/** A compact age: 45s, 12m, 3h, 2d. */
function ago(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

/** A right-aligned numeric cell, so the columns line up on the digit. */
function Cell({
  children,
  as = "td",
  strong,
  muted,
  title,
}: {
  children: ReactNode;
  as?: "td" | "th";
  strong?: boolean;
  muted?: boolean;
  title?: string;
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
      <th scope="col" className={className} title={title}>
        {children}
      </th>
    );
  }
  return (
    <td className={className} title={title}>
      {children}
    </td>
  );
}
