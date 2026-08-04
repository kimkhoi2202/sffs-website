"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { RANGE_PRESETS, type TimeRangeInput } from "@/lib/dashboard/time-range";

/**
 * PostHog's date filter, rebuilt in the site's own idiom.
 *
 * Every option the owner asked for is here: the four recent windows, the six
 * rolling day counts, the calendar windows, all time, the "in the last N days"
 * stepper, "from a date until now", and a fixed custom range.
 *
 * The stepper and the two date modes commit on Apply rather than on every
 * keystroke — typing "30" in a number field passes through "3", and a dashboard
 * that fires a fresh set of ClickHouse queries for every intermediate value is
 * both slow and misleading.
 */
export function TimeRangePicker({
  value,
  label,
  onChange,
}: {
  value: TimeRangeInput;
  label: string;
  onChange: (next: TimeRangeInput) => void;
}) {
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState(value.days ?? 7);
  const [since, setSince] = useState(value.from ?? today());
  const [customFrom, setCustomFrom] = useState(value.from ?? today());
  const [customTo, setCustomTo] = useState(value.to ?? today());
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pick = (next: TimeRangeInput) => {
    onChange(next);
    setOpen(false);
  };

  const groups = ["Recent", "Rolling", "Calendar"] as const;

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="btn-press inline-flex items-center gap-2 rounded-full border-[2.5px] border-ink bg-yellow px-4 py-2 font-sans text-sm font-bold uppercase leading-none tracking-[0.02em]"
      >
        <span aria-hidden>🗓</span>
        {label}
        <span aria-hidden className="text-[0.7em]">
          ▼
        </span>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[min(92vw,30rem)] rounded-3xl border-[2.5px] border-ink bg-paper p-4 shadow-hard-lg">
          {groups.map((group) => (
            <div key={group} className="mb-3">
              <p className="mb-2 font-sans text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink/50">
                {group}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {RANGE_PRESETS.filter((p) => p.group === group).map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => pick({ preset: preset.id })}
                    className={cn(
                      "rounded-full border-2 border-ink px-3 py-1.5 font-sans text-xs font-bold",
                      value.preset === preset.id ? "bg-ink text-paper" : "bg-cream hover:bg-yellow",
                    )}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="mt-4 space-y-3 border-t-[2.5px] border-ink/15 pt-4">
            <div className="flex flex-wrap items-end gap-2">
              <label className="font-sans text-[0.62rem] font-bold uppercase tracking-[0.12em] text-ink/50">
                In the last
                <span className="mt-1 flex items-center gap-1">
                  <button
                    type="button"
                    aria-label="Fewer days"
                    onClick={() => setDays((d) => Math.max(1, d - 1))}
                    className="h-8 w-8 rounded-lg border-2 border-ink bg-cream font-bold"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={730}
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value) || 1)}
                    className="h-8 w-16 rounded-lg border-2 border-ink bg-paper px-2 text-center font-mono text-sm"
                  />
                  <button
                    type="button"
                    aria-label="More days"
                    onClick={() => setDays((d) => Math.min(730, d + 1))}
                    className="h-8 w-8 rounded-lg border-2 border-ink bg-cream font-bold"
                  >
                    +
                  </button>
                </span>
              </label>
              <span className="pb-2 text-xs font-bold">days</span>
              <button
                type="button"
                onClick={() => pick({ preset: "last_n_days", days })}
                className="btn-press ml-auto rounded-full border-2 border-ink bg-blue px-3 py-1.5 text-xs font-bold uppercase"
              >
                Apply
              </button>
            </div>

            <div className="flex flex-wrap items-end gap-2">
              <label className="font-sans text-[0.62rem] font-bold uppercase tracking-[0.12em] text-ink/50">
                From date until now
                <input
                  type="date"
                  value={since}
                  onChange={(e) => setSince(e.target.value)}
                  className="mt-1 block h-8 rounded-lg border-2 border-ink bg-paper px-2 font-mono text-xs"
                />
              </label>
              <button
                type="button"
                onClick={() => pick({ preset: "since_date", from: since })}
                className="btn-press ml-auto rounded-full border-2 border-ink bg-blue px-3 py-1.5 text-xs font-bold uppercase"
              >
                Apply
              </button>
            </div>

            <div className="flex flex-wrap items-end gap-2">
              <label className="font-sans text-[0.62rem] font-bold uppercase tracking-[0.12em] text-ink/50">
                From
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="mt-1 block h-8 rounded-lg border-2 border-ink bg-paper px-2 font-mono text-xs"
                />
              </label>
              <label className="font-sans text-[0.62rem] font-bold uppercase tracking-[0.12em] text-ink/50">
                To
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="mt-1 block h-8 rounded-lg border-2 border-ink bg-paper px-2 font-mono text-xs"
                />
              </label>
              <button
                type="button"
                onClick={() => pick({ preset: "custom", from: customFrom, to: customTo })}
                className="btn-press ml-auto rounded-full border-2 border-ink bg-blue px-3 py-1.5 text-xs font-bold uppercase"
              >
                Apply
              </button>
            </div>
          </div>

          <p className="mt-4 border-t-[2.5px] border-ink/15 pt-3 text-[0.68rem] font-semibold leading-snug text-ink/50">
            All windows resolve in <strong>UTC</strong>, which is the PostHog project&rsquo;s
            timezone — so these numbers line up with PostHog&rsquo;s own, rather than
            drifting by six hours against them.
          </p>
        </div>
      )}
    </div>
  );
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}
