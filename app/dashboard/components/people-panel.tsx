"use client";

import { cn } from "@/lib/utils";
import { OUTCOME_LABEL, OUTCOME_TINT, type WireHuman } from "@/lib/dashboard/wire";

import { ChannelChip, Empty, RungBadge, duration, flag, when } from "./primitives";

/**
 * The people list.
 *
 * An anonymous abandoner gets the same row treatment as a named completer,
 * because they are the same kind of fact and one of them is currently invisible
 * to everybody. The email address, where there is one, is an attribute — never
 * the thing that earns a person a row.
 */
export function PeoplePanel({
  humans,
  selectedId,
  onSelect,
  filterLabel,
  onClearFilter,
}: {
  humans: WireHuman[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  filterLabel: string | null;
  onClearFilter: () => void;
}) {
  return (
    /*
      TWO SEPARATE FAULTS WERE FIXED HERE, AND THEY LOOKED LIKE ONE.

      1. THE PANE DID NOT SCROLL. Measured, not guessed: a real wheel event
         moved it 0px while `scrollTop = 300` from script moved it 2714px, so
         the scroller was working and simply never saw the gesture. That is
         Lenis, the site's smooth-scroll library, intercepting wheel events at
         the window and driving the document instead. The same bug is written
         up at length in components/test/review/question-review.tsx, where five
         plausible local causes were each tested and all five were wrong.
         `data-lenis-prevent` on the scroller hands wheel events back to the
         browser. It is on the scroll element below.

      2. THE PANEL STRETCHED AND THE LIST DID NOT. This is a grid row, so the
         panel grew to match the journey column beside it — 2029px measured —
         while the scroller stayed at its own 659px cap. The result was a card
         sliced in half at the clip edge with 1300px of dead white beneath it,
         inside the same rounded box. `self-start` stops the stretch, the
         max-height makes the panel's height definite, and the scroller takes
         what is left with `flex-1 min-h-0`.

      `overflow-hidden` is the third small thing: a 40px `rounded-3xl` with
      `overflow: visible` does not clip its children to its own corners.
    */
    <div className="flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-3xl border-[2.5px] border-ink bg-paper shadow-hard-sm xl:sticky xl:top-4 xl:self-start">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b-[2.5px] border-ink px-5 py-3">
        <div>
          <h2 className="font-display text-lg uppercase leading-none">
            {filterLabel ?? "Everyone"}
          </h2>
          <p className="mt-1 text-xs font-semibold text-ink/60">
            {humans.length} {humans.length === 1 ? "person" : "people"}
            {filterLabel ? " matching this step" : " in this window"}
          </p>
        </div>
        {filterLabel && (
          <button
            type="button"
            onClick={onClearFilter}
            className="rounded-full border-2 border-ink bg-cream px-3 py-1 text-[0.68rem] font-bold uppercase"
          >
            Show everyone
          </button>
        )}
      </header>

      <div
        data-lenis-prevent
        /*
          The bottom padding is hover and focus clearance, not dead space. The
          cards carry pill badges and a focus ring that paints outside the
          element's own box, and a previous fix elsewhere on this site reclaimed
          exactly this kind of padding and clipped controls on hover. Do not
          take it back without checking what leaves the box.
        */
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-8 pt-3"
      >
        {humans.length === 0 ? (
          <Empty>Nobody here in this window.</Empty>
        ) : (
          <ul className="space-y-2">
            {humans.map((human) => (
              <li key={human.id}>
                <PersonCard
                  human={human}
                  selected={selectedId === human.id}
                  onSelect={() => onSelect(human.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function PersonCard({
  human,
  selected,
  onSelect,
}: {
  human: WireHuman;
  selected: boolean;
  onSelect: () => void;
}) {
  const place = [human.city, human.country].filter(Boolean).join(", ");
  const multi = human.personIds.length > 1;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full rounded-2xl border-[2.5px] border-ink px-4 py-3 text-left transition-colors",
        selected ? "bg-yellow shadow-hard-xs" : "bg-cream hover:bg-paper",
      )}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <ChannelChip channel={human.channel} />
        <RungBadge rung={human.rung} compact />
        <span
          className={cn(
            "rounded-full border-2 border-ink px-2 py-0.5 font-sans text-[0.6rem] font-bold uppercase tracking-[0.06em]",
            OUTCOME_TINT[human.outcome],
          )}
        >
          {OUTCOME_LABEL[human.outcome]}
        </span>
        {multi && (
          <span
            title="More than one PostHog person, one human"
            className="rounded-full border-2 border-ink bg-blue px-2 py-0.5 font-sans text-[0.6rem] font-bold uppercase"
          >
            {human.personIds.length} ids · probably one person
          </span>
        )}
        {human.untracked && (
          <span className="rounded-full border-2 border-ink bg-blue px-2 py-0.5 font-sans text-[0.6rem] font-bold uppercase">
            No analytics
          </span>
        )}
        {human.isInternal && (
          <span className="rounded-full border-2 border-ink bg-gray-200 px-2 py-0.5 font-sans text-[0.6rem] font-bold uppercase">
            Internal
          </span>
        )}
      </div>

      <p className="mt-2 font-sans text-sm font-bold leading-snug">
        {human.email ?? <span className="text-ink/60">Anonymous visitor</span>}
      </p>
      <p className="mt-0.5 text-[0.78rem] leading-snug text-ink/70">{human.headline}</p>

      <dl className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.68rem] font-semibold text-ink/60">
        <span>
          {flag(human.countryCode)} {place || "Location unknown"}
        </span>
        <span>
          {[human.device, human.browser, human.os].filter(Boolean).join(" · ") || "Unknown device"}
        </span>
        <span>{when(human.firstSeen)}</span>
        {human.score !== null && (
          <span className="rounded-full border-2 border-ink bg-paper px-2 py-0.5 text-ink">
            {human.score}/{human.maxScore}
            {human.answered !== null && ` · ${human.answered} answered`}
            {human.timedOut && " · clock ran out"}
          </span>
        )}
        {!human.startedTest && human.pageviews > 0 && <span>{human.pageviews} pageviews</span>}
        {human.startedTest && human.questionsAnswered > 0 && human.score === null && (
          <span className="rounded-full border-2 border-ink bg-paper px-2 py-0.5 text-ink">
            reached Q{human.furthestQuestion}
            {human.questionTotal ? ` of ${human.questionTotal}` : ""}
          </span>
        )}
        {human.resultsOpens > 0 && (
          <span className="rounded-full border-2 border-ink bg-mint px-2 py-0.5 text-ink">
            results opened {human.resultsOpens}× · {duration(human.resultsTotalSeconds)} total ·{" "}
            {duration(human.resultsDwellSeconds)} longest
          </span>
        )}
        {human.shareEvents > 0 && (
          <span className="rounded-full border-2 border-ink bg-yellow px-2 py-0.5 text-ink">
            shared{human.shareDestinations.length ? ` → ${human.shareDestinations.join(", ")}` : ""}
          </span>
        )}
        {human.deadClicks > 0 && (
          <span className="rounded-full border-2 border-ink bg-coral px-2 py-0.5 text-ink">
            {human.deadClicks} dead click{human.deadClicks === 1 ? "" : "s"}
          </span>
        )}
      </dl>
    </button>
  );
}
