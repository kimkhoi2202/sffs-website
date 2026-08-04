"use client";

import { cn } from "@/lib/utils";
import { RUNG_LABEL } from "@/lib/dashboard/attribution";
import { OUTCOME_LABEL, OUTCOME_TINT, type JourneyResponse } from "@/lib/dashboard/wire";

import { ChannelChip, Empty, RungBadge, clockTime, duration, flag, when } from "./primitives";

/**
 * One human, end to end — the view the rest of the dashboard exists to get you
 * to.
 *
 * The order is the order you would want it if you were reconstructing this by
 * hand, which somebody had to before this existed: where they came from and how
 * we know, who and where they are, what they scored and how that score was
 * earned, what happened after the email, what they shared, and only then the
 * raw stream.
 */
const KIND_TINT: Record<string, string> = {
  arrival: "bg-blue",
  navigation: "bg-cream",
  test: "bg-yellow",
  question: "bg-paper",
  signup: "bg-mint",
  results: "bg-mint",
  share: "bg-yellow",
  friction: "bg-coral",
  other: "bg-cream",
};

export function JourneyPanel({
  journey,
  loading,
  onOpenPerson,
}: {
  journey: JourneyResponse | null;
  loading: boolean;
  onOpenPerson: (personId: string) => void;
}) {
  if (loading) {
    return (
      <Shell>
        <p className="animate-pulse text-sm font-bold text-ink/50">Reading their session…</p>
      </Shell>
    );
  }
  if (!journey) {
    return (
      <Shell>
        <Empty>Pick somebody on the left to read their whole session.</Empty>
      </Shell>
    );
  }

  const h = journey.human;
  const place = [h.city, h.region, h.country].filter(Boolean).join(", ");
  const attempt = journey.attempt;

  return (
    <div className="space-y-4">
      {/* ---- Who ---------------------------------------------------------- */}
      <section className="rounded-3xl border-[2.5px] border-ink bg-paper p-5 shadow-hard-sm">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={cn(
              "rounded-full border-2 border-ink px-2.5 py-0.5 font-sans text-[0.62rem] font-bold uppercase tracking-[0.06em]",
              OUTCOME_TINT[h.outcome],
            )}
          >
            {OUTCOME_LABEL[h.outcome]}
          </span>
          {h.untracked && (
            <span className="rounded-full border-2 border-ink bg-blue px-2.5 py-0.5 font-sans text-[0.62rem] font-bold uppercase">
              Analytics never loaded
            </span>
          )}
        </div>

        <h2 className="mt-3 font-display text-2xl uppercase leading-none tracking-[-0.01em]">
          {h.email ?? "Anonymous visitor"}
        </h2>
        <p className="mt-2 text-sm leading-[1.6] text-ink/75">{h.headline}</p>

        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Where they came from">
            <div className="flex flex-wrap items-center gap-1.5">
              <ChannelChip channel={h.channel} />
              <RungBadge rung={h.rung} />
            </div>
            <p className="mt-1.5 font-mono text-[0.7rem] leading-snug text-ink/65">
              {h.evidence}
            </p>
            <p className="mt-1 text-[0.7rem] font-semibold text-ink/50">
              Resolved on the {RUNG_LABEL[h.rung].toLowerCase()} rung of the fallback chain.
            </p>
          </Field>

          <Field label="Who and where">
            <p className="text-sm font-bold">
              {flag(h.countryCode)} {place || "Location unknown"}
            </p>
            <p className="mt-1 text-[0.78rem] font-semibold text-ink/70">
              {[h.device, h.browser, h.os].filter(Boolean).join(" · ") || "Unknown device"}
            </p>
            <p className="mt-1 text-[0.7rem] text-ink/55">
              First seen {when(h.firstSeen)} · last seen {when(h.lastSeen)} (UTC)
            </p>
          </Field>
        </dl>

        <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Mini label="Sessions" value={h.sessions} />
          <Mini label="Pageviews" value={h.pageviews} />
          <Mini label="Events" value={h.events} />
          <Mini
            label="Time to first action"
            value={duration(journey.timeToFirstActionSeconds)}
          />
        </dl>

        {journey.notes.length > 0 && (
          <ul className="mt-4 space-y-2">
            {journey.notes.map((note) => (
              <li
                key={note}
                className="rounded-2xl border-2 border-ink bg-blue px-4 py-2.5 text-[0.8rem] font-semibold leading-[1.5]"
              >
                {note}
              </li>
            ))}
          </ul>
        )}

        {h.personIds.length > 1 && (
          <div className="mt-4 rounded-2xl border-2 border-ink bg-cream p-4">
            <p className="font-sans text-[0.62rem] font-bold uppercase tracking-[0.12em] text-ink/60">
              PostHog persons folded together here
            </p>
            <ul className="mt-2 space-y-1.5">
              {h.personIds.map((id) => (
                <li key={id} className="flex flex-wrap items-center gap-2">
                  <code className="font-mono text-[0.68rem] text-ink/70">{id}</code>
                  {journey.human.links
                    .filter((l) => l.personId === id)
                    .map((l) => (
                      <span
                        key={l.reason + l.personId}
                        className={cn(
                          "rounded-full border-2 border-ink px-2 py-0.5 text-[0.6rem] font-bold uppercase",
                          l.confidence === "strong" ? "bg-mint" : "bg-yellow",
                        )}
                      >
                        {l.confidence} · {l.role}
                      </span>
                    ))}
                  <button
                    type="button"
                    onClick={() => onOpenPerson(id)}
                    className="rounded-full border-2 border-ink bg-paper px-2 py-0.5 text-[0.6rem] font-bold uppercase"
                  >
                    Open alone
                  </button>
                </li>
              ))}
            </ul>
            {journey.human.links[0] && (
              <p className="mt-2 text-[0.72rem] leading-snug text-ink/65">
                <strong>Why:</strong> {journey.human.links[0].reason}. Nothing has been merged
                in PostHog — this is a labelled claim, and the ids above are still separate
                people there.
              </p>
            )}
          </div>
        )}
      </section>

      {/* ---- Their result ------------------------------------------------- */}
      {attempt && (
        <section className="rounded-3xl border-[2.5px] border-ink bg-mint p-5 shadow-hard-sm">
          <h3 className="font-display text-lg uppercase leading-none">Their result</h3>
          <div className="mt-3 flex flex-wrap items-end gap-4">
            <p className="font-display text-5xl leading-none tracking-[-0.02em]">
              {attempt.score}
              <span className="text-2xl text-ink/50">/{attempt.maxScore}</span>
            </p>
            <div className="text-sm font-bold leading-snug">
              <p>
                {attempt.answered} of {attempt.questionTotal} questions answered
              </p>
              <p className={cn(attempt.timedOut && "text-ink")}>
                {attempt.timedOut
                  ? `Clock ran out after ${duration(attempt.elapsedSeconds)}`
                  : `Finished in ${duration(attempt.elapsedSeconds)}`}
              </p>
            </div>
          </div>
          <p className="mt-3 text-[0.8rem] leading-[1.55] text-ink/75">
            {attempt.answered === attempt.questionTotal
              ? "They answered every question — a complete attempt."
              : attempt.timedOut
                ? `They left ${attempt.questionTotal - attempt.answered} unanswered because time ran out, not because they lost interest.`
                : `They skipped ${attempt.questionTotal - attempt.answered}.`}{" "}
            {attempt.fromToken
              ? "Read from the signed results link itself, which is the same source the results page uses."
              : "Read from the test_completed event."}
          </p>
          <p className="mt-2 font-mono text-[0.68rem] text-ink/55">
            {attempt.testId}
            {attempt.grade ? ` · grade ${attempt.grade}` : ""}
            {attempt.verdict ? ` · ${attempt.verdict}` : ""}
          </p>
        </section>
      )}

      {/* ---- What happened after ------------------------------------------ */}
      {journey.resultsVisits.length > 0 && (
        <section className="rounded-3xl border-[2.5px] border-ink bg-paper p-5 shadow-hard-sm">
          <h3 className="font-display text-lg uppercase leading-none">
            After the email — did they read it
          </h3>
          <p className="mt-1 text-xs font-semibold text-ink/60">
            The strongest engagement signal the site produces, and it lives nowhere else.
          </p>
          <ul className="mt-3 space-y-2">
            {journey.resultsVisits.map((visit) => (
              <li
                key={`${visit.personId}-${visit.sessionId}-${visit.start}`}
                className="flex flex-wrap items-baseline justify-between gap-2 rounded-2xl border-2 border-ink bg-mint px-4 py-2.5"
              >
                <span className="text-sm font-bold">{when(visit.start)}</span>
                <span className="font-display text-xl leading-none">
                  {duration(visit.seconds)}
                </span>
                <span className="text-[0.7rem] font-semibold text-ink/60">
                  {visit.events} events on the page
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[0.75rem] leading-snug text-ink/60">
            Opened {journey.resultsVisits.length}{" "}
            {journey.resultsVisits.length === 1 ? "time" : "times"}. Duration is last event
            minus first on the results page, so it is a floor, not a ceiling.
          </p>
        </section>
      )}

      {/* ---- Sharing ------------------------------------------------------- */}
      {journey.shares.length > 0 && (
        <section className="rounded-3xl border-[2.5px] border-ink bg-yellow p-5 shadow-hard-sm">
          <h3 className="font-display text-lg uppercase leading-none">Sharing</h3>
          <ul className="mt-3 space-y-1.5">
            {journey.shares.map((share, i) => (
              <li
                key={`${share.timestamp}-${i}`}
                className="flex flex-wrap items-center gap-2 rounded-2xl border-2 border-ink bg-paper px-3 py-2 text-[0.78rem] font-semibold"
              >
                <span className="font-mono text-[0.68rem] text-ink/55">
                  {clockTime(share.timestamp)}
                </span>
                <span
                  className={cn(
                    "rounded-full border-2 border-ink px-2 py-0.5 text-[0.6rem] font-bold uppercase",
                    share.stage === "completed" && "bg-mint",
                    share.stage === "initiated" && "bg-blue",
                    share.stage === "dismissed" && "bg-cream",
                    share.stage === "failed" && "bg-coral",
                  )}
                >
                  {share.stage}
                </span>
                <span>{share.destination || "destination not recorded"}</span>
                <span className="text-ink/55">via {share.mechanism || "?"}</span>
                {share.step && (
                  <span className="rounded-full border-2 border-ink bg-cream px-2 py-0.5 text-[0.6rem] font-bold uppercase">
                    {share.step}
                  </span>
                )}
                {share.reason && <span className="text-ink/55">({share.reason})</span>}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[0.75rem] leading-snug text-ink/70">
            A share that was initiated and never completed is an abandoned share sheet, not a
            failure. Instagram and TikTok are two-step, so a{" "}
            <code className="font-mono text-[0.7rem]">tapped</code> without a matching{" "}
            <code className="font-mono text-[0.7rem]">saved</code> means they opened the card
            and never took it.
          </p>
        </section>
      )}

      {/* ---- Question review ---------------------------------------------- */}
      {journey.questionReview.length > 0 && (
        <section className="rounded-3xl border-[2.5px] border-ink bg-paper p-5 shadow-hard-sm">
          <h3 className="font-display text-lg uppercase leading-none">
            Question by question
          </h3>
          <p className="mt-1 text-xs font-semibold text-ink/60">
            How far they went, and how long each one held them.
          </p>
          <ul className="mt-3 flex flex-wrap gap-1">
            {journey.questionReview.map((q) => (
              <li
                key={q.questionIndex}
                title={[
                  `Question ${q.questionIndex}`,
                  q.domain && `domain: ${q.domain}`,
                  q.answered
                    ? `answered ${q.correct === null ? "" : q.correct ? "correctly" : "incorrectly"}`
                    : "never answered",
                  q.dwellMs !== null && `${Math.round(q.dwellMs / 1000)}s on it`,
                  q.viewed > 1 && `revisited ${q.viewed} times`,
                  q.changed && "changed their answer",
                ]
                  .filter(Boolean)
                  .join(" · ")}
                className={cn(
                  "flex h-9 w-9 flex-col items-center justify-center rounded-lg border-2 border-ink text-[0.62rem] font-bold leading-none",
                  !q.answered && "bg-gray-100 text-ink/40",
                  q.answered && q.correct === true && "bg-mint",
                  q.answered && q.correct === false && "bg-coral",
                  q.answered && q.correct === null && "bg-cream",
                )}
              >
                {q.questionIndex}
                {q.viewed > 1 && <span className="text-[0.5rem] text-ink/60">×{q.viewed}</span>}
              </li>
            ))}
          </ul>
          <p className="mt-3 flex flex-wrap gap-3 text-[0.68rem] font-semibold text-ink/60">
            <Legend tint="bg-mint">right</Legend>
            <Legend tint="bg-coral">wrong</Legend>
            <Legend tint="bg-gray-100">seen, never answered</Legend>
            <span>×n = revisited</span>
          </p>
        </section>
      )}

      {/* ---- The stream ---------------------------------------------------- */}
      <section className="overflow-hidden rounded-3xl border-[2.5px] border-ink bg-paper shadow-hard-sm">
        {/* No rule under the header — same reasoning as the people list: the
            <ol> below is its own scroller, not something passing underneath. */}
        <header className="flex flex-wrap items-baseline justify-between gap-2 px-5 py-3">
          <h3 className="font-display text-lg uppercase leading-none">Everything they did</h3>
          <p className="text-[0.7rem] font-semibold text-ink/55">
            {journey.events.length} events
            {journey.mutedCount > 0 &&
              ` · ${journey.mutedCount} autocapture and web-vitals events hidden`}
            {journey.totalDurationSeconds !== null &&
              ` · ${duration(journey.totalDurationSeconds)} end to end`}
          </p>
        </header>
        {/* Same Lenis opt-out as the people list: without it a wheel gesture
            inside this pane scrolls the page and leaves the timeline at zero. */}
        <ol
          data-lenis-prevent
          className="max-h-[36rem] overflow-y-auto overscroll-contain px-4 pb-8 pt-4"
        >
          {journey.events.length === 0 ? (
            <Empty>PostHog has no events for this person.</Empty>
          ) : (
            journey.events.map((e, i) => {
              const newPerson = i > 0 && journey.events[i - 1].personId !== e.personId;
              return (
                <li key={`${e.timestamp}-${i}`}>
                  {newPerson && (
                    <p className="my-2 rounded-xl border-2 border-dashed border-ink/40 bg-blue/30 px-3 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.06em]">
                      New PostHog person id from here — same human
                    </p>
                  )}
                  <div className="flex gap-3 py-1">
                    <span className="w-16 shrink-0 pt-0.5 text-right font-mono text-[0.62rem] text-ink/45">
                      {clockTime(e.timestamp)}
                    </span>
                    <span
                      className={cn(
                        "mt-1 h-2.5 w-2.5 shrink-0 rounded-full border-2 border-ink",
                        KIND_TINT[e.kind] ?? "bg-cream",
                      )}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[0.82rem] font-semibold leading-snug">
                        {e.summary}
                      </span>
                      <span className="block font-mono text-[0.62rem] text-ink/45">
                        {e.event}
                        {e.offsetSeconds > 0 && ` · +${duration(e.offsetSeconds)}`}
                      </span>
                    </span>
                  </div>
                </li>
              );
            })
          )}
        </ol>
      </section>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[24rem] items-center justify-center rounded-3xl border-[2.5px] border-ink bg-paper p-8 shadow-hard-sm">
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border-2 border-ink bg-cream p-3">
      <dt className="font-sans text-[0.6rem] font-bold uppercase tracking-[0.12em] text-ink/55">
        {label}
      </dt>
      <dd className="mt-1.5">{children}</dd>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border-2 border-ink bg-cream px-3 py-2">
      <p className="font-sans text-[0.58rem] font-bold uppercase tracking-[0.1em] text-ink/55">
        {label}
      </p>
      <p className="font-display text-xl leading-none">{value}</p>
    </div>
  );
}

function Legend({ tint, children }: { tint: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={cn("inline-block h-3 w-3 rounded border-2 border-ink", tint)} />
      {children}
    </span>
  );
}
