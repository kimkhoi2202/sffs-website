"use client";

import { RUNG_LABEL } from "@/lib/dashboard/attribution";
import type { TrafficResponse } from "@/lib/dashboard/wire";

import { Bar, ChannelChip, Empty, Panel, RungBadge, flag } from "./primitives";

/**
 * Traffic: sources, geography, pages, devices.
 *
 * Sources is the interesting one and it is deliberately NOT collapsed to a
 * channel per row. "Reddit, from a UTM tag: 11 sessions" and "Reddit, inferred
 * from the referrer: 4 sessions" are separate rows, because the second number
 * is the one a UTM report loses and the whole reason this ladder exists.
 */
export function TrafficPanel({ data }: { data: TrafficResponse }) {
  const sourcesRows = data.sources ?? [];
  const geoRows = data.geo ?? [];
  const pageRows = data.pages ?? [];
  const deviceRows = data.devices ?? [];
  const rungRows = data.rungBreakdown ?? [];
  const maxSessions = Math.max(1, ...sourcesRows.map((s) => s.sessions));
  const maxGeo = Math.max(1, ...geoRows.map((g) => g.visitors));
  const maxPage = Math.max(1, ...pageRows.map((p) => p.views));
  const totalRung = rungRows.reduce((acc, r) => acc + r.sessions, 0);
  const weak = rungRows
    .filter((r) => r.rung === "referrer" || r.rung === "landing" || r.rung === "survey")
    .reduce((acc, r) => acc + r.sessions, 0);

  return (
    <div className="space-y-5">
      <Panel
        title="How each visit was resolved"
        subtitle="The rung of the fallback chain that produced the answer, not just the answer."
      >
        {totalRung === 0 ? (
          <Empty>No sessions in this window.</Empty>
        ) : (
          <>
            <ul className="space-y-2">
              {rungRows.map((r) => (
                <li key={r.rung} className="flex items-center gap-3">
                  <span className="w-28 shrink-0">
                    <RungBadge rung={r.rung} />
                  </span>
                  <span className="flex-1">
                    <Bar value={r.sessions} max={totalRung} />
                  </span>
                  <span className="w-24 shrink-0 text-right font-mono text-xs">
                    {r.sessions} · {Math.round((r.sessions / totalRung) * 100)}%
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-4 rounded-2xl border-2 border-ink bg-yellow px-4 py-3 text-[0.8rem] font-semibold leading-[1.55]">
              <strong>{weak}</strong> of {totalRung} sessions ({Math.round((weak / totalRung) * 100)}
              %) carry no UTM at all and were resolved from a referrer, a landing path or a
              survey answer. A UTM-only report would file every one of them as
              &ldquo;direct&rdquo;.
            </p>
          </>
        )}
      </Panel>

      <Panel
        title="Where they came from"
        subtitle="Channel × the rung it was resolved on. Same channel, different confidence, separate rows."
      >
        {sourcesRows.length === 0 ? (
          <Empty>No sessions in this window.</Empty>
        ) : (
          <ul className="space-y-2">
            {sourcesRows.map((s) => (
              <li
                key={`${s.channel}-${s.rung}`}
                className="rounded-2xl border-2 border-ink bg-cream px-4 py-2.5"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <ChannelChip channel={s.channel} />
                  <RungBadge rung={s.rung} />
                  <span className="ml-auto font-display text-xl leading-none">{s.sessions}</span>
                  <span className="text-[0.68rem] font-semibold text-ink/55">
                    session{s.sessions === 1 ? "" : "s"} · {s.visitors} visitor
                    {s.visitors === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="mt-2">
                  <Bar value={s.sessions} max={maxSessions} />
                </div>
                <p className="mt-1.5 font-mono text-[0.66rem] text-ink/55">{s.evidence}</p>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Where they are" subtitle="PostHog geoip, city where it has one.">
          {geoRows.length === 0 ? (
            <Empty>No pageviews in this window.</Empty>
          ) : (
            <ul className="space-y-1.5">
              {geoRows.slice(0, 25).map((g) => (
                <li key={`${g.country}-${g.city}-${g.region}`} className="flex items-center gap-3">
                  <span className="w-48 shrink-0 truncate text-[0.78rem] font-semibold">
                    {flag(g.countryCode)} {g.city || "—"}
                    <span className="text-ink/50">
                      {g.city ? ", " : ""}
                      {g.country}
                    </span>
                  </span>
                  <span className="flex-1">
                    <Bar value={g.visitors} max={maxGeo} tone="bg-mint" />
                  </span>
                  <span className="w-8 shrink-0 text-right font-mono text-xs">{g.visitors}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Pages" subtitle="Result and challenge tokens collapsed to one row each.">
          {pageRows.length === 0 ? (
            <Empty>No pageviews in this window.</Empty>
          ) : (
            <ul className="space-y-1.5">
              {pageRows.slice(0, 20).map((p) => (
                <li key={p.path} className="flex items-center gap-3">
                  <code className="w-48 shrink-0 truncate font-mono text-[0.72rem]">{p.path}</code>
                  <span className="flex-1">
                    <Bar value={p.views} max={maxPage} tone="bg-coral" />
                  </span>
                  <span className="w-8 shrink-0 text-right font-mono text-xs">{p.views}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel title="Devices">
        {deviceRows.length === 0 ? (
          <Empty>No pageviews in this window.</Empty>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {deviceRows.slice(0, 24).map((d) => (
              <li
                key={`${d.device}-${d.browser}-${d.os}`}
                className="rounded-2xl border-2 border-ink bg-cream px-3 py-2 text-[0.75rem] font-semibold"
              >
                {d.device} · {d.browser} · {d.os}
                <span className="ml-2 font-display text-base">{d.visitors}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
