"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { DEFAULT_RANGE, resolveRange, type TimeRangeInput } from "@/lib/dashboard/time-range";
import { SIGNUP_BASIS_NOTE } from "@/lib/dashboard/signup-rule";
import type {
  GrowthResponse,
  JourneyResponse,
  PeopleResponse,
  TestResultsResponse,
  TilesResponse,
  TrafficResponse,
  WireFunnelStage,
} from "@/lib/dashboard/wire";

import { FunnelPanel } from "./components/funnel-panel";
import { GrowthPanel } from "./components/growth-panel";
import { JourneyPanel } from "./components/journey-panel";
import { PeoplePanel } from "./components/people-panel";
import { Stat, duration, pct } from "./components/primitives";
import { ResultsPanel } from "./components/results-panel";
import { TimeRangePicker } from "./components/time-range-picker";
import { TrafficPanel } from "./components/traffic-panel";

/**
 * The dashboard shell.
 *
 * ===========================================================================
 * WHY THE LAYOUT IS WEIGHTED THE WAY IT IS
 * ===========================================================================
 * Five external people have ever completed a test. Every tile on this page will
 * read a single digit, and that is fine — it is not a scale problem to be
 * designed around, it is the actual size of the thing. What is worth screen
 * space at this volume is being able to read ONE Reddit visitor's session end
 * to end, so the tiles are a thin strip and the journey gets half the width.
 */

type Tab = "growth" | "journeys" | "funnel" | "traffic" | "results";

export function DashboardApp({ queryKeyConfigured }: { queryKeyConfigured: boolean }) {
  const [range, setRange] = useState<TimeRangeInput>(DEFAULT_RANGE);
  const [filtered, setFiltered] = useState(true);
  /*
    Growth opens the page.

    The four numbers on it were being pulled by hand every few hours and read
    off a chat message; the point of building them was that the owner can open
    this URL instead. Landing him on Journeys and asking him to find a tab
    would leave the manual pull as the path of least resistance.
  */
  const [tab, setTab] = useState<Tab>("growth");

  const [tilesData, setTilesData] = useState<TilesResponse | null>(null);
  const [people, setPeople] = useState<PeopleResponse | null>(null);
  const [traffic, setTraffic] = useState<TrafficResponse | null>(null);
  const [journey, setJourney] = useState<JourneyResponse | null>(null);
  const [results, setResults] = useState<TestResultsResponse | null>(null);
  const [growth, setGrowth] = useState<GrowthResponse | null>(null);

  /*
    THE IN-FLIGHT GUARDS ARE REFS, THE THINGS ON SCREEN ARE STATE.
    Both on-demand tabs need to know "a request is already out" the instant
    their effect runs, which is a question no render has to answer. A ref can
    be set in the effect body without the cascading render that
    `react-hooks/set-state-in-effect` exists to prevent; a `setLoading(true)`
    there cannot. What a person actually sees is derived from the data instead.
  */
  const trafficPending = useRef(false);
  const resultsPending = useRef(false);
  const growthPending = useRef(false);

  /** A traffic request has come back for this window, with data or without. */
  const [trafficSettled, setTrafficSettled] = useState(false);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  /** Who the journey we are holding belongs to. See journeyLoading below. */
  const [journeyFor, setJourneyFor] = useState<string | null>(null);
  const [subset, setSubset] = useState<{ ids: string[]; label: string } | null>(null);
  const [activeStage, setActiveStage] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  const rangeLabel = useMemo(() => resolveRange(range).label, [range]);

  const post = useCallback(async (body: Record<string, unknown>) => {
    const res = await fetch("/api/dashboard/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = await res.json();
    if (!res.ok) throw new Error(payload?.error ?? `Request failed (${res.status})`);
    return payload;
  }, []);

  /* ---- Changing the window clears everything scoped to it ----------------
     Every panel below the picker answers a question about one time window, so
     none of them survive a change of window. This used to be an effect on
     [range, filtered] whose entire body was six setState calls, which is the
     second thing `react-hooks/set-state-in-effect` is pointing at: work caused
     by an action, done in an effect watching the result of that action.

     The two callbacks below are the ONLY things that can change the window, so
     doing it there is complete rather than merely equivalent. */
  const resetWindow = useCallback(() => {
    setError(null);
    setSelectedId(null);
    setJourney(null);
    setJourneyFor(null);
    setSubset(null);
    setActiveStage(null);
    setTraffic(null);
    setTrafficSettled(false);
    trafficPending.current = false;
    setResults(null);
    resultsPending.current = false;
    setGrowth(null);
    growthPending.current = false;
  }, []);

  const changeRange = useCallback(
    (next: TimeRangeInput) => {
      setRange(next);
      resetWindow();
    },
    [resetWindow],
  );

  const toggleFiltered = useCallback(() => {
    setFiltered((v) => !v);
    resetWindow();
  }, [resetWindow]);

  /* ---- Load the window --------------------------------------------------
     Only what the default tab needs: the tiles (two PostHog queries) and the
     people set (five). The traffic panels are another five and nobody has
     asked for them yet, so they wait until that tab is opened — this page used
     to fire thirteen queries at once and PostHog answered several of them with
     "too many queries are running right now".

     Each section is awaited separately and its error kept separately, so one
     busy query cluster no longer blanks the whole page. */
  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([
      post({ section: "tiles", range, filtered }),
      post({ section: "people", range, filtered }),
    ])
      .then(([t, p]) => {
        if (cancelled) return;
        if (t.status === "fulfilled") setTilesData(t.value as TilesResponse);
        else
          setTilesData({
            range: { from: "", to: "", label: rangeLabel, granularity: "day" },
            filtered,
            tiles: null,
            error: t.reason?.message ?? "Could not load the tiles.",
          });
        if (p.status === "fulfilled") setPeople(p.value as PeopleResponse);
        else setError(p.reason?.message ?? "Could not load people.");
      });
    return () => {
      cancelled = true;
    };
  }, [range, filtered, post]);

  /* ---- The traffic tab pays for itself only when opened -----------------
     The guard is the ref rather than a loading flag, which also ends a retry
     loop that was here: a `trafficLoading` in the dependency array flips back
     to false when a request fails, the effect re-runs, `traffic` is still null,
     and it asks again — forever, for as long as the tab is open, against the
     query cluster this file already had to stop overloading. */
  useEffect(() => {
    if (tab !== "traffic" || traffic || trafficPending.current) return;
    trafficPending.current = true;
    let cancelled = false;
    post({ section: "traffic", range, filtered })
      .then((t) => !cancelled && setTraffic(t as TrafficResponse))
      .catch((e: Error) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setTrafficSettled(true));
    return () => {
      cancelled = true;
    };
  }, [tab, traffic, range, filtered, post]);

  /* ---- Completions, likewise only when that tab is opened ---------------
     Two warehouse queries rather than five event queries, and they are the
     only ones on the page that read real email addresses, so there is no
     reason to run them for somebody who never opens the tab.

     The in-flight guard is a ref, and "loading" is fully derivable from
     `tab === "results" && !results`. That was written here first, against four
     `react-hooks/set-state-in-effect` errors elsewhere in this file that were
     then a known debt; the rest of the file has since been brought to it and
     the debt is gone. */
  useEffect(() => {
    if (tab !== "results" || results || resultsPending.current) return;
    resultsPending.current = true;
    let cancelled = false;
    post({ section: "results", range, filtered })
      .then((r) => !cancelled && setResults(r as TestResultsResponse))
      .catch((e: Error) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [tab, results, range, filtered, post]);

  /* ---- Growth, the tab the page opens on --------------------------------
     Four queries: two over events for the funnel and the channel table, two
     against the warehouse for the address count and the mirror's own sync
     time. Same ref-guard shape as the two above — see the note on the traffic
     effect for why the guard is a ref and why "loading" is derived rather
     than stored. */
  useEffect(() => {
    if (tab !== "growth" || growth || growthPending.current) return;
    growthPending.current = true;
    let cancelled = false;
    post({ section: "growth", range, filtered })
      .then((g) => !cancelled && setGrowth(g as GrowthResponse))
      .catch((e: Error) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [tab, growth, range, filtered, post]);

  /* ---- Load one journey ------------------------------------------------
     What is recorded on the way out is WHO the answer was for, not that an
     answer is pending. Both endings record it, so a failed request stops the
     spinner exactly as it did when a `.finally` cleared a loading flag. */
  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    post({ section: "journey", range, filtered, humanId: selectedId })
      .then((j) => !cancelled && setJourney(j as JourneyResponse))
      .catch((e: Error) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setJourneyFor(selectedId));
    return () => {
      cancelled = true;
    };
  }, [selectedId, range, filtered, post]);

  /*
    Derived, not stored. The journey pane is loading exactly when the selection
    has moved ahead of the answer we hold — true from the click, false the
    moment the request settles either way. Storing that meant setting it in the
    effect that started the fetch, which is what the rule was pointing at.
  */
  const journeyLoading = selectedId !== null && journeyFor !== selectedId;

  const visibleHumans = useMemo(() => {
    if (!people) return [];
    if (!subset) return people.humans;
    const ids = new Set(subset.ids);
    return people.humans.filter((h) => ids.has(h.id));
  }, [people, subset]);

  const onSelectStage = (stage: WireFunnelStage | null) => {
    if (!stage) {
      setSubset(null);
      setActiveStage(null);
      return;
    }
    setSubset({
      ids: stage.droppedHumanIds,
      label: `Stopped at “${stage.label}”`,
    });
    setActiveStage(stage.id);
    setTab("journeys");
    setSelectedId(stage.droppedHumanIds[0] ?? null);
  };

  const tiles = tilesData?.tiles ?? null;

  return (
    <div className="mx-auto max-w-[110rem] px-4 py-5 sm:px-6">
      {/* ---- Header ------------------------------------------------------- */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-sans text-[0.62rem] font-bold uppercase tracking-[0.16em] text-ink/50">
            Smart Fella or Fart Smella · internal
          </p>
          <h1 className="font-display text-3xl uppercase leading-none tracking-[-0.015em]">
            Traffic &amp; journeys
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <TimeRangePicker value={range} label={rangeLabel} onChange={changeRange} />

          <button
            type="button"
            onClick={toggleFiltered}
            aria-pressed={filtered}
            title={
              filtered
                ? "Internal browsers, the team's distinct_ids and the Meta link-scanner bot are excluded, matching PostHog's own test-account filter."
                : "Showing every event, including the team's own browsing and the Meta link-preview bot."
            }
            className={cn(
              "btn-press rounded-full border-[2.5px] border-ink px-4 py-2 font-sans text-sm font-bold uppercase leading-none",
              filtered ? "bg-mint" : "bg-coral",
            )}
          >
            {filtered ? "Filtered" : "Raw"}
          </button>

          <button
            type="button"
            onClick={async () => {
              await fetch("/api/dashboard/auth", { method: "DELETE" });
              window.location.reload();
            }}
            className="rounded-full border-[2.5px] border-ink bg-paper px-4 py-2 font-sans text-sm font-bold uppercase leading-none"
          >
            Sign out
          </button>
        </div>
      </header>

      {!queryKeyConfigured && (
        <p className="mt-4 rounded-2xl border-[2.5px] border-ink bg-coral px-4 py-3 text-sm font-bold">
          POSTHOG_PERSONAL_API_KEY is not set on this deployment.
        </p>
      )}
      {error && (
        <p className="mt-4 rounded-2xl border-[2.5px] border-ink bg-coral px-4 py-3 text-sm font-bold">
          {error}
        </p>
      )}

      {tilesData?.error && (
        <p className="mt-4 rounded-2xl border-[2.5px] border-ink bg-coral px-4 py-3 text-sm font-bold">
          Tiles: {tilesData.error}
        </p>
      )}

      {/* ---- Tiles --------------------------------------------------------
          Every counter below is UNIQUE PEOPLE except the three marked
          otherwise, and each tile says which it is. Mixing people and events
          across a row makes a funnel nobody can read.

          The first five come from PostHog's own WebOverviewQuery rather than
          being recomputed here, so they match PostHog's web analytics exactly
          rather than approximately. */}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8">
        <Stat label="Visitors" value={tiles?.visitors ?? "—"} hint="unique people" />
        <Stat label="Pageviews" value={tiles?.pageviews ?? "—"} hint="page loads, not people" />
        <Stat label="Sessions" value={tiles?.sessions ?? "—"} hint="sessions, not people" />
        <Stat
          label="Avg session"
          value={tiles ? duration(tiles.avgSessionSeconds) : "—"}
          hint="PostHog session duration"
        />
        {/* The definition, not the name of the definition. PostHog's bounce is
            all three of: one pageview, no autocaptured interaction, and under
            ten seconds — stricter than the "one pageview" most people picture,
            so the number reads lower than expected and gets mistrusted. */}
        <Stat
          label="Bounce rate"
          value={tiles ? pct(tiles.bounceRate) : "—"}
          hint="1 pageview, no click, under 10s"
        />
        <Stat
          label="Tests started"
          value={tiles?.testsStarted ?? "—"}
          hint="unique people"
          tone="yellow"
        />
        <Stat
          label="Completed"
          value={tiles?.testsCompleted ?? "—"}
          hint="unique people"
          tone="mint"
        />
        {/* "Gave an address", not "was successfully mailed". The two were the
            same number until a quota outage made them differ by a third, and
            the tile now says which one it is rather than leaving the reader to
            assume the flattering reading. See lib/dashboard/signup-rule.ts. */}
        <Stat
          label="Signups"
          value={tiles?.signups ?? "—"}
          hint="people who gave an address"
          tone="mint"
        />
      </div>
      <SignupBasisNote tiles={tiles} />

      {/* ---- Tabs --------------------------------------------------------- */}
      <nav className="mt-4 flex flex-wrap gap-2">
        {(
          [
            ["growth", "Growth"],
            ["journeys", "Journeys"],
            ["funnel", "Funnel & drop-off"],
            ["traffic", "Traffic & sources"],
            ["results", "Completions"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "btn-press rounded-full border-[2.5px] border-ink px-4 py-2 font-sans text-sm font-bold uppercase leading-none",
              tab === id ? "bg-green" : "bg-paper",
            )}
          >
            {label}
          </button>
        ))}
      </nav>

      {/* ---- Body --------------------------------------------------------- */}
      <div className="mt-4 pb-16">
        {tab === "growth" &&
          (growth ? (
            <>
              {growth.error && (
                <p className="mb-4 rounded-2xl border-[2.5px] border-ink bg-coral px-4 py-3 text-sm font-bold">
                  Growth: {growth.error}
                </p>
              )}
              <GrowthPanel data={growth} />
            </>
          ) : (
            <p className="rounded-2xl border-[2.5px] border-ink bg-paper px-4 py-6 text-center text-sm font-bold text-ink/50">
              Loading growth…
            </p>
          ))}

        {tab === "journeys" && (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
            <PeoplePanel
              humans={visibleHumans}
              selectedId={selectedId}
              onSelect={setSelectedId}
              filterLabel={subset?.label ?? null}
              onClearFilter={() => {
                setSubset(null);
                setActiveStage(null);
              }}
            />
            <JourneyPanel
              journey={journey}
              loading={journeyLoading}
              onOpenPerson={(personId) => setSelectedId(personId)}
            />
          </div>
        )}

        {tab === "funnel" && people && (
          <FunnelPanel
            stages={people.funnel}
            abandonment={people.abandonment}
            activeStage={activeStage}
            onSelectStage={onSelectStage}
            onSelectQuestion={(ids, label) => {
              setSubset({ ids, label });
              setActiveStage(null);
              setTab("journeys");
              setSelectedId(ids[0] ?? null);
            }}
          />
        )}

        {tab === "traffic" &&
          (traffic ? (
            <TrafficPanel data={traffic} />
          ) : (
            <p className="rounded-2xl border-[2.5px] border-ink bg-paper px-4 py-6 text-center text-sm font-bold text-ink/50">
              {trafficSettled ? "No traffic data." : "Loading traffic…"}
            </p>
          ))}

        {tab === "results" &&
          (results ? (
            <>
              {results.error && (
                <p className="mb-4 rounded-2xl border-[2.5px] border-ink bg-coral px-4 py-3 text-sm font-bold">
                  Completions: {results.error}
                </p>
              )}
              <ResultsPanel data={results} />
            </>
          ) : (
            <p className="rounded-2xl border-[2.5px] border-ink bg-paper px-4 py-6 text-center text-sm font-bold text-ink/50">
              Loading completions…
            </p>
          ))}
      </div>
    </div>
  );
}

/**
 * What the Signups tile is counting, said on the page.
 *
 * ===========================================================================
 * THE DISTINCTION THAT GETS MISREAD IF IT IS NOT WRITTEN DOWN
 * ===========================================================================
 * "Signups" is the tile the owner quotes. It used to mean "we successfully
 * emailed them" and now means "they gave us an address", and those two agree
 * on every ordinary day — which is exactly what makes the difference dangerous
 * rather than obvious. They came apart by a third on 11 August, and a reader
 * comparing this week's figure to a screenshot from last week has no way to
 * know which definition either one is on unless the page says.
 *
 * So it says. And it prints the OLD reading next to it whenever they differ,
 * because the honest way to change a headline number is to show your working,
 * not to quietly restate it a third higher.
 */
function SignupBasisNote({ tiles }: { tiles: TilesResponse["tiles"] }) {
  if (!tiles) return null;
  const undelivered = Math.max(0, tiles.signups - tiles.signupsDelivered);

  return (
    <p className="mt-2 text-xs font-semibold leading-relaxed text-ink/55">
      <strong className="font-bold text-ink/75">{SIGNUP_BASIS_NOTE}</strong>{" "}
      {undelivered > 0 ? (
        <>
          In this window{" "}
          <strong className="font-bold text-ink/75">
            {undelivered} of the {tiles.signups} never received their results email
          </strong>{" "}
          — a quota outage, not a change in behaviour. Counted the old, send-gated way this
          tile would read {tiles.signupsDelivered}.
        </>
      ) : (
        <>Every address given in this window was also delivered to, so both readings agree.</>
      )}
    </p>
  );
}
