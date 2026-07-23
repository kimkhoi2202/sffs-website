"use client";

import { useEffect, useId, useRef, useState } from "react";
import posthog from "posthog-js";

import {
  trackAttributionSurveyAnswered,
  trackAttributionSurveyDismissed,
  trackAttributionSurveyShown,
  type AttributionSource,
} from "@/lib/analytics/events";
import { cn } from "@/lib/utils";

/**
 * Our OWN post-signup "How did you find us?" survey — the on-brand, neo-brutalist
 * replacement for the native PostHog popover (which carried a "Survey by PostHog"
 * watermark). Renders right under the "You're in!" success state.
 *
 * On answer it does BOTH (best of both worlds):
 *   1. fires the `attribution_survey_answered` PostHog event (source only, NO PII)
 *      so attribution shows in funnels/dashboards, AND
 *   2. POSTs to /api/attribution-survey -> the keyless Lambda proxy -> Aurora
 *      `survey_responses` (durable, tied to the signup via email + distinct_id).
 *
 * Fully responsive (mobile-first — most traffic is TikTok/IG in-app browsers),
 * keyboard-accessible (native radios in a labelled group), and skippable so it
 * never gets in the way. The signup email is used only to tie the answer to the
 * signup in Aurora — it is NEVER sent to PostHog.
 */

type Phase = "idle" | "submitting" | "done" | "skipped";

const OPTIONS: { value: AttributionSource; label: string }[] = [
  { value: "tiktok", label: "TikTok" },
  { value: "instagram", label: "Instagram" },
  { value: "friend", label: "A friend" },
  { value: "search", label: "Search" },
  { value: "other", label: "Somewhere else" },
];

/** Best-effort PostHog distinct_id so the answer stitches to the same person.
 * Returns undefined when the SDK isn't initialized (e.g. off the prod domain). */
function currentDistinctId(): string | undefined {
  try {
    const id = posthog.get_distinct_id?.();
    return typeof id === "string" && id.length > 0 ? id : undefined;
  } catch {
    return undefined;
  }
}

export function AttributionSurvey({
  email,
  className,
}: {
  email?: string;
  className?: string;
}) {
  const legendId = useId();
  const groupName = useId();
  const [selected, setSelected] = useState<AttributionSource | null>(null);
  const [openText, setOpenText] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const doneRef = useRef<HTMLDivElement>(null);

  // Fire the "shown" event once per mount (i.e. once per signup).
  useEffect(() => {
    trackAttributionSurveyShown();
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!selected || phase === "submitting") return;
    setPhase("submitting");

    // 1) The analytics truth — source only, no PII. Fire first so attribution
    //    lands even if the durable write below is blocked.
    trackAttributionSurveyAnswered(selected);

    // 2) The durable write (best-effort — the event already captured attribution).
    try {
      await fetch("/api/attribution-survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: selected,
          open_text: openText.trim() || undefined,
          email: email || undefined,
          distinct_id: currentDistinctId(),
        }),
      });
    } catch {
      // Swallow — analytics already fired; never show the user an error here.
    }

    setPhase("done");
    requestAnimationFrame(() => doneRef.current?.focus());
  }

  function handleSkip() {
    trackAttributionSurveyDismissed();
    setPhase("skipped");
  }

  // Skipped → collapse entirely so it never lingers.
  if (phase === "skipped") return null;

  if (phase === "done") {
    return (
      <div
        ref={doneRef}
        tabIndex={-1}
        role="status"
        aria-live="polite"
        className={cn(
          "mt-4 rounded-2xl border-[2.5px] border-ink bg-blue p-5 text-center shadow-hard-sm outline-none",
          className,
        )}
      >
        <p className="font-display text-2xl uppercase leading-none tracking-tight">
          Thanks! <span aria-hidden="true">🧠</span>
        </p>
        <p className="mt-2 text-sm font-medium leading-relaxed text-ink/80">
          That helps us make more of what you like.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "mt-4 rounded-2xl border-[2.5px] border-ink bg-paper p-5 text-left shadow-hard-sm",
        className,
      )}
    >
      <fieldset className="min-w-0" disabled={phase === "submitting"}>
        <legend id={legendId} className="eyebrow text-ink">
          One quick thing — how did you find us?
        </legend>

        <div
          role="radiogroup"
          aria-labelledby={legendId}
          className="mt-4 grid grid-cols-2 gap-2.5"
        >
          {OPTIONS.map((opt, i) => {
            const isChecked = selected === opt.value;
            // The 5th option ("Somewhere else") spans the full width for balance.
            const spanFull = i === OPTIONS.length - 1;
            return (
              <label
                key={opt.value}
                className={cn("min-w-0", spanFull && "col-span-2")}
              >
                <input
                  type="radio"
                  name={groupName}
                  value={opt.value}
                  checked={isChecked}
                  onChange={() => setSelected(opt.value)}
                  className="peer sr-only"
                />
                <span
                  className={cn(
                    "press flex h-12 w-full items-center justify-center rounded-full border-[2.5px] border-ink bg-paper px-3 text-center text-sm font-bold uppercase tracking-wide text-ink shadow-hard-xs",
                    "cursor-pointer select-none",
                    "peer-checked:bg-blue peer-checked:shadow-none peer-checked:translate-x-[2px] peer-checked:translate-y-[2px]",
                    "peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink",
                  )}
                >
                  {opt.label}
                </span>
              </label>
            );
          })}
        </div>

        {/* Optional detail + submit reveal only after a choice — keeps the card
            compact on first paint (mobile), and makes "answering" explicit. */}
        {selected ? (
          <div className="mt-3">
            <label htmlFor={`${groupName}-note`} className="sr-only">
              Anything to add? (optional)
            </label>
            <input
              id={`${groupName}-note`}
              type="text"
              value={openText}
              maxLength={2000}
              placeholder={
                selected === "other"
                  ? "Where'd you spot us? (optional)"
                  : "Anything to add? (optional)"
              }
              onChange={(e) => setOpenText(e.target.value)}
              className={cn(
                "h-12 w-full rounded-full border-[2.5px] border-ink bg-paper px-5 text-base font-medium text-ink shadow-hard-xs",
                "placeholder:text-ink/40",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-transparent",
              )}
            />
          </div>
        ) : null}

        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleSkip}
            className="rounded-full px-2 py-1 text-sm font-semibold text-ink/60 underline decoration-2 underline-offset-4 transition-colors hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            Skip
          </button>

          <button
            type="submit"
            disabled={!selected || phase === "submitting"}
            aria-busy={phase === "submitting"}
            className={cn(
              "btn-press inline-flex h-12 items-center justify-center gap-2 rounded-full border-[2.5px] border-ink bg-green px-7 text-sm font-bold uppercase tracking-wide leading-none text-ink",
              "cursor-pointer select-none disabled:cursor-not-allowed disabled:opacity-50",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-transparent",
            )}
          >
            {phase === "submitting" ? (
              <>
                <svg
                  className="size-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="opacity-25"
                  />
                  <path
                    d="M21 12a9 9 0 0 0-9-9"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
                Sending…
              </>
            ) : (
              "Send"
            )}
          </button>
        </div>
      </fieldset>
    </form>
  );
}
