"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import {
  RUNG_LABEL,
  RUNG_SHORT,
  RUNG_STRENGTH,
  channelTint,
  type AttributionRung,
} from "@/lib/dashboard/attribution";

/**
 * The dashboard's shared furniture, in the site's own language: 2.5px ink
 * borders, hard offset shadows, Anton for numbers, DM Sans everywhere else.
 *
 * The `/internal` page next door uses `shadow-hard-lg` and `shadow-hard-sm` on
 * its cards, so this does too. The v3 no-drop-shadow rule applies to the newer
 * test surfaces, not to the internal tooling, and having the two internal pages
 * disagree with each other would be the worse outcome.
 */

export function Panel({
  title,
  subtitle,
  right,
  children,
  tone = "paper",
  className,
}: {
  title?: string;
  subtitle?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
  tone?: "paper" | "cream" | "yellow" | "mint" | "blue";
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-3xl border-[2.5px] border-ink shadow-hard-sm",
        tone === "paper" && "bg-paper",
        tone === "cream" && "bg-cream",
        tone === "yellow" && "bg-yellow",
        tone === "mint" && "bg-mint",
        tone === "blue" && "bg-blue",
        className,
      )}
    >
      {(title || right) && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b-[2.5px] border-ink px-5 py-3">
          <div className="min-w-0">
            {title && (
              <h2 className="font-display text-lg uppercase leading-none tracking-[-0.01em]">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-1 text-xs font-semibold leading-snug text-ink/60">{subtitle}</p>
            )}
          </div>
          {right}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Stat({
  label,
  value,
  hint,
  tone = "paper",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "paper" | "yellow" | "mint" | "coral" | "blue";
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border-[2.5px] border-ink px-4 py-3 shadow-hard-xs",
        tone === "paper" && "bg-paper",
        tone === "yellow" && "bg-yellow",
        tone === "mint" && "bg-mint",
        tone === "coral" && "bg-coral",
        tone === "blue" && "bg-blue",
      )}
    >
      <p className="font-sans text-[0.65rem] font-bold uppercase tracking-[0.12em] text-ink/60">
        {label}
      </p>
      <p className="mt-1 font-display text-3xl leading-none tracking-[-0.02em]">{value}</p>
      {hint && <p className="mt-1 text-[0.7rem] font-semibold leading-tight text-ink/55">{hint}</p>}
    </div>
  );
}

/** A rung badge — the honest part of the attribution answer. */
export function RungBadge({ rung, compact }: { rung: AttributionRung; compact?: boolean }) {
  const strength = RUNG_STRENGTH[rung];
  return (
    <span
      title={`Resolved on the ${RUNG_LABEL[rung].toLowerCase()} rung`}
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full border-2 border-ink px-2 py-0.5 font-sans text-[0.6rem] font-bold uppercase tracking-[0.08em]",
        strength === "strong" && "bg-mint",
        strength === "medium" && "bg-yellow",
        strength === "weak" && "bg-coral",
        strength === "none" && "bg-gray-100 text-ink/60",
      )}
    >
      {compact ? RUNG_SHORT[rung] : RUNG_LABEL[rung]}
    </span>
  );
}

export function ChannelChip({ channel }: { channel: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border-2 border-ink px-2.5 py-0.5 font-sans text-[0.68rem] font-bold uppercase tracking-[0.05em]",
        channelTint(channel),
      )}
    >
      {channel}
    </span>
  );
}

export function Bar({
  value,
  max,
  tone = "bg-blue",
}: {
  value: number;
  max: number;
  tone?: string;
}) {
  const pct = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-3 w-full overflow-hidden rounded-full border-2 border-ink bg-paper">
      <div className={cn("h-full", tone)} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-2xl border-2 border-dashed border-ink/30 px-4 py-6 text-center text-sm font-semibold text-ink/50">
      {children}
    </p>
  );
}

/* --------------------------------------------------------------------------
 * Formatting
 * ------------------------------------------------------------------------ */

export function duration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined) return "—";
  const s = Math.max(0, Math.round(seconds));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m < 60) return r ? `${m}m ${r}s` : `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

export function pct(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `${Math.round(value * 100)}%`;
}

export function when(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

export function clockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "UTC",
  });
}

export function flag(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return "";
  return String.fromCodePoint(
    ...[...countryCode.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65),
  );
}
