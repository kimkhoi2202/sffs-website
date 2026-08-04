"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import { DEFAULT_RANGE, resolveRange, type TimeRangeInput } from "@/lib/dashboard/time-range";
import type {
  JourneyResponse,
  PeopleResponse,
  TilesResponse,
  TrafficResponse,
  WireFunnelStage,
} from "@/lib/dashboard/wire";

import { FunnelPanel } from "./components/funnel-panel";
import { JourneyPanel } from "./components/journey-panel";
import { PeoplePanel } from "./components/people-panel";
import { Stat, duration, pct } from "./components/primitives";
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

type Tab = "journeys" | "funnel" | "traffic";

export function DashboardApp({ queryKeyConfigured }: { queryKeyConfigured: boolean }) {
  const [range, setRange] = useState<TimeRangeInput>(DEFAULT_RANGE);
  const [filtered, setFiltered] = useState(true);
  const [tab, setTab] = useState<Tab>("journeys");

  const [tilesData, setTilesData] = useState<TilesResponse | null>(null);
  const [people, setPeople] = useState<PeopleResponse | null>(null);
  const [traffic, setTraffic] = useState<TrafficResponse | null>(null);
  const [journey, setJourney] = useState<JourneyResponse | null>(null);
  const [trafficLoading, setTrafficLoading] = useState(false);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [subset, setSubset] = useState<{ ids: string[]; label: string } | null>(null);
  const [activeStage, setActiveStage] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [journeyLoading, setJourneyLoading] = useState(false);
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
    setLoading(true);
    setError(null);
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
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [range, filtered, post]);

  /* ---- The traffic tab pays for itself only when opened ----------------- */
  useEffect(() => {
    if (tab !== "traffic" || traffic || trafficLoading) return;
    let cancelled = false;
    setTrafficLoading(true);
    post({ section: "traffic", range, filtered })
      .then((t) => !cancelled && setTraffic(t as TrafficResponse))
      .catch((e: Error) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setTrafficLoading(false));
    return () => {
      cancelled = true;
    };
  }, [tab, traffic, trafficLoading, range, filtered, post]);

  /* ---- A changed window invalidates the open journey ------------------- */
  useEffect(() => {
    setSelectedId(null);
    setJourney(null);
    setSubset(null);
    setActiveStage(null);
    setTraffic(null);
  }, [range, filtered]);

  /* ---- Load one journey ------------------------------------------------ */
  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    setJourneyLoading(true);
    post({ section: "journey", range, filtered, humanId: selectedId })
      .then((j) => !cancelled && setJourney(j as JourneyResponse))
      .catch((e: Error) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setJourneyLoading(false));
    return () => {
      cancelled = true;
    };
  }, [selectedId, range, filtered, post]);

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
          <TimeRangePicker value={range} label={rangeLabel} onChange={setRange} />

          <button
            type="button"
            onClick={() => setFiltered((v) => !v)}
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
        <Stat label="Signups" value={tiles?.signups ?? "—"} hint="unique people" tone="mint" />
      </div>

      {/* ---- Tabs --------------------------------------------------------- */}
      <nav className="mt-4 flex flex-wrap gap-2">
        {(
          [
            ["journeys", "Journeys"],
            ["funnel", "Funnel & drop-off"],
            ["traffic", "Traffic & sources"],
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
              {trafficLoading ? "Loading traffic…" : "No traffic data."}
            </p>
          ))}
      </div>
    </div>
  );
}
