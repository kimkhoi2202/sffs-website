/**
 * The local-only dev suite for driving the test flow without playing it.
 *
 * Reachable at http://localhost:3000 as a small floating tab in the bottom-left
 * corner, or with the keyboard shortcut Ctrl+Shift+D. Bottom-LEFT because the
 * site's music toggle owns the bottom-right, and above the runner's z-50 so it
 * still works during a test.
 *
 * IT CANNOT SHIP. See the four layers documented in dev-tools-gate.tsx. The
 * first thing this module does is refuse to exist in a production build.
 */

"use client";

import { useEffect, useState } from "react";

import { ItemReview } from "./item-review";
import type { FlowDevApi } from "../test-flow";
import { STEP_ORDER } from "../test-flow";
import { setForceSendFailure } from "@/lib/test/dev-flags";
import { VERDICT_BANDS } from "@/lib/test/scoring";
import type { Step } from "@/lib/test/session";
import { getTest } from "@/lib/test/tests";
import { validateTest } from "@/lib/test/validate";
import { GRADES } from "@/lib/test/types";
import { cn } from "@/lib/utils";

/*
 * Layer 3: a module-scope refusal. If a future refactor ever imports this file
 * from code that survives into a production bundle, this throws the moment the
 * module is evaluated — a loud crash rather than a dev panel quietly appearing
 * on the live site.
 *
 * The string below is also the sentinel that scripts/verify-no-devtools.mjs
 * greps the production build for (layer 4). It is a plain string literal so it
 * survives minification, and it appears nowhere else in the application source,
 * so finding it anywhere in the output means this module shipped and the build
 * must fail.
 */
if (process.env.NODE_ENV === "production") {
  throw new Error(
    "SFFS_DEVTOOLS_MUST_NOT_SHIP: the test dev tools were imported in a " +
      "production build. They are development-only. Mount them through " +
      "DevToolsGate, which removes them at build time.",
  );
}

/**
 * Reading the wall clock, hoisted out of the component.
 *
 * `react-hooks/purity` flags `Date.now()` anywhere inside a component body,
 * including in a function that is only ever called from a click handler,
 * because it cannot tell the difference. Behind a module-scope helper the rule
 * is satisfied and the call site stays readable.
 */
const nowMs = () => Date.now();

const STEP_LABEL: Record<Step, string> = {
  audience: "1 Fork",
  "parent-intent": "2 Parent",
  grade: "3 Grade",
  intro: "4 Intro",
  test: "5 Test",
  results: "6 Results",
};

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[0.6rem] font-black uppercase tracking-[0.1em] text-paper/50">
        {label}
      </span>
      <div className="flex flex-wrap gap-1">{children}</div>
    </div>
  );
}

function Chip({
  onClick,
  active,
  children,
  wide,
}: {
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "cursor-pointer rounded-md border px-2 py-1 font-mono text-[0.65rem] leading-none transition-colors",
        wide && "flex-1",
        active
          ? "border-yellow bg-yellow text-ink"
          : "border-paper/25 bg-paper/5 text-paper hover:bg-paper/15",
      )}
    >
      {children}
    </button>
  );
}

interface StoreInfo {
  mode: "proxy" | "local";
  reason: string;
}

export function DevToolsPanel({ api }: { api: FlowDevApi }) {
  const [open, setOpen] = useState(false);
  const [review, setReview] = useState(false);
  /**
   * Which store a signup would land in RIGHT NOW. Shown before anything is
   * submitted, because that is when it matters: the whole point of the boundary
   * is that you never accidentally put a test address into the real list, and a
   * boundary you have to remember is one you eventually forget.
   */
  const [store, setStore] = useState<StoreInfo | null>(null);
  // Mirrors the module flag in lib/test/dev-flags.ts so the chip can show its
  // state. The module is the source of truth that the email box reads.
  const [failSends, setFailSends] = useState(false);
  const { state } = api;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.ctrlKey || !e.shiftKey) return;
      const k = e.key.toLowerCase();
      if (k === "d") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      // The review surface gets its own shortcut because it is the thing most
      // often wanted on its own, without the flow underneath it.
      if (k === "r") {
        e.preventDefault();
        setReview((r) => !r);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/dev/email-store")
      .then((r) => (r.ok ? (r.json() as Promise<StoreInfo>) : null))
      .then((info) => {
        if (!cancelled && info) setStore(info);
      })
      .catch(() => {
        /* the panel is still useful without it */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const test = state.audience ? getTest(state.audience, state.grade) : null;
  const issues = test ? validateTest(test) : [];
  const errors = issues.filter((i) => i.severity === "error");
  const placeholders = test ? test.items.filter((i) => i.placeholder).length : 0;

  /**
   * Jumping to a step has to bring the state that step needs with it, or the
   * flow lands on a screen that cannot render. Picking "5 Test" with no
   * audience chosen means the adult test, a live deadline, and index zero.
   */
  function jumpTo(step: Step) {
    const audience = state.audience ?? (step === "grade" ? "child" : "adult");
    const grade = audience === "child" ? (state.grade ?? 5) : null;
    const target = getTest(audience, grade);
    const now = nowMs();

    api.patch({
      step,
      audience,
      grade,
      fork: state.fork ?? (audience === "child" ? "child" : "parent"),
      ...(step === "test" && target
        ? {
            index: 0,
            startedAt: state.startedAt ?? now,
            deadlineAt: now + target.durationSeconds * 1000,
            finishedAt: null,
            timedOut: false,
          }
        : {}),
      ...(step === "results" ? { finishedAt: state.finishedAt ?? now } : {}),
    });
  }

  if (review) return <ItemReview onClose={() => setReview(false)} />;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Dev tools (Ctrl+Shift+D)"
        /*
         * A tab on the LEFT EDGE, vertically centred. Every other corner is
         * taken: the site's music toggle owns bottom-right, Next's own dev
         * overlay owns bottom-left (and its portal swallows clicks aimed at
         * anything under it), and the runner's footer owns the bottom strip —
         * at bottom-left this button sat directly on the Back arrow. The mid
         * left edge is the only place that is clear in all three states.
         * Above z-50 so it still works over the runner's full-screen shell.
         */
        className="fixed left-0 top-1/2 z-[60] -translate-y-1/2 cursor-pointer rounded-r-lg border-2 border-l-0 border-ink bg-ink px-2 py-3 font-mono text-[0.6rem] font-bold leading-none text-yellow [writing-mode:vertical-rl]"
      >
        DEV
      </button>
    );
  }

  return (
    // No hard shadow: this is a debug surface, not product UI. The
    // neo-brutalist shadow treatment belongs on the things a visitor sees.
    <div className="fixed bottom-4 left-4 top-4 z-[60] flex w-[17.5rem] flex-col overflow-hidden rounded-xl border-2 border-ink bg-ink text-paper">
      <div className="flex shrink-0 items-center justify-between border-b border-paper/20 px-3 py-2">
        <span className="font-mono text-[0.7rem] font-bold text-yellow">
          DEV TOOLS
          <span className="ml-1.5 font-normal text-paper/40">local only</span>
        </span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close dev tools"
          className="cursor-pointer px-1 font-mono text-sm leading-none text-paper/60 hover:text-paper"
        >
          &times;
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
        {/* Every question in every bank, rendered as a player sees it, with the
            rule, the key and each distractor's intended error. It is the only
            way to review the figural half, and the only way to look at the
            difficulty gradient across the grades. */}
        <Row label="Content">
          <Chip wide onClick={() => setReview(true)}>
            review all 125 items (Ctrl+Shift+R)
          </Chip>
        </Row>

        <Row label="Jump to step">
          {STEP_ORDER.map((step) => (
            <Chip key={step} onClick={() => jumpTo(step)} active={state.step === step}>
              {STEP_LABEL[step]}
            </Chip>
          ))}
        </Row>

        <Row label="Audience">
          <Chip
            wide
            active={state.audience === "adult"}
            onClick={() => api.patch({ audience: "adult", grade: null, fork: "parent" })}
          >
            adult 15m
          </Chip>
          <Chip
            wide
            active={state.audience === "child"}
            onClick={() =>
              api.patch({ audience: "child", grade: state.grade ?? 5, fork: "child" })
            }
          >
            child 5m
          </Chip>
        </Row>

        <Row label="Grade">
          {GRADES.map((g) => (
            <Chip
              key={g}
              active={state.grade === g}
              onClick={() => api.patch({ audience: "child", grade: g, fork: "child" })}
            >
              {g}
            </Chip>
          ))}
        </Row>

        <Row label="Skip / force score">
          <Chip wide onClick={() => api.fillAnswers(1)}>
            100%
          </Chip>
          {/*
            The verdict is binary, so the useful forced scores are the two sides
            of the threshold and the boundary itself — a row of chips per band
            made sense when there were five. `min - 1` is the highest score that
            is still the low verdict, which is the case most worth being able to
            reach in one click.
          */}
          {VERDICT_BANDS.filter((b) => b.min > 0).flatMap((band) => [
            <Chip key={`${band.id}-under`} onClick={() => api.fillAnswers((band.min - 1) / 100)}>
              {band.min - 1}%
            </Chip>,
            <Chip key={band.id} onClick={() => api.fillAnswers(band.min / 100)}>
              {band.min}% ({band.title.toLowerCase()})
            </Chip>,
          ])}
          <Chip wide onClick={() => api.fillAnswers(0)}>
            0% (fart smella)
          </Chip>
        </Row>

        <Row label="Timer">
          <Chip
            wide
            active={!api.timerEnabled}
            onClick={() => api.setTimerEnabled(!api.timerEnabled)}
          >
            {api.timerEnabled ? "disable timer" : "timer: OFF"}
          </Chip>
          <Chip wide onClick={() => api.patch({ deadlineAt: nowMs() + 11_000 })}>
            set clock to 0:10
          </Chip>
        </Row>

        {/*
          The email gate can no longer be "skipped" — the blur never lifts in
          place, so there is nothing to unlock. These three replace it: open the
          real results page for the current token, read the email that would be
          sent without sending it, and make the next send fail so that path can
          actually be exercised rather than assumed.
        */}
        <Row label={state.token ? "Results & email" : "Results & email (finish a test first)"}>
          <Chip
            wide
            onClick={() => {
              if (state.token) window.open(`/results/${state.token}`, "_blank");
            }}
          >
            open results page
          </Chip>
          <Chip
            wide
            onClick={() => {
              if (state.token) {
                window.open(
                  `/api/test-results/preview-email?token=${encodeURIComponent(state.token)}`,
                  "_blank",
                );
              }
            }}
          >
            preview email (html)
          </Chip>
          <Chip
            wide
            onClick={() => {
              if (state.token) {
                window.open(
                  `/api/test-results/preview-email?token=${encodeURIComponent(state.token)}&format=text`,
                  "_blank",
                );
              }
            }}
          >
            preview email (text)
          </Chip>
          <Chip
            wide
            active={failSends}
            onClick={() => {
              const next = !failSends;
              setFailSends(next);
              setForceSendFailure(next);
            }}
          >
            {failSends ? "send WILL fail" : "force send failure"}
          </Chip>
        </Row>

        {state.step === "test" && test ? (
          <Row label={`Question (${state.index + 1}/${test.items.length})`}>
            {test.items.map((item, i) => (
              <Chip key={item.id} active={state.index === i} onClick={() => api.patch({ index: i })}>
                {i + 1}
              </Chip>
            ))}
          </Row>
        ) : null}

        <Row label="Reset">
          <Chip wide onClick={api.reset}>
            clear state &amp; restart
          </Chip>
        </Row>

        {/* A live read on the content, so a broken answer key or a forgotten
            placeholder is visible while working rather than at review time. */}
        {test ? (
          <div className="rounded-md border border-paper/20 bg-paper/5 p-2 font-mono text-[0.6rem] leading-relaxed text-paper/70">
            <div>
              test <span className="text-yellow">{test.id}</span> &middot; {test.items.length} items
            </div>
            <div>
              placeholders{" "}
              <span className={placeholders > 0 ? "text-yellow" : "text-paper/40"}>
                {placeholders}
              </span>
              {" \u00b7 "}
              content errors{" "}
              <span className={errors.length > 0 ? "text-coral" : "text-paper/40"}>
                {errors.length}
              </span>
            </div>
            {errors.slice(0, 3).map((e) => (
              <div key={`${e.itemId}-${e.message}`} className="mt-1 text-coral">
                {e.itemId}: {e.message}
              </div>
            ))}
            <div className="mt-1 text-paper/40">
              answered {Object.keys(state.answers).length} &middot; step {state.step}
            </div>
          </div>
        ) : null}

        {/* Where a signup would actually go. Coral when it would reach the real
            Aurora table, because that is the state worth noticing. */}
        {store ? (
          <div
            className={cn(
              "rounded-md border p-2 font-mono text-[0.6rem] leading-relaxed",
              store.mode === "proxy"
                ? "border-coral bg-coral/20 text-paper"
                : "border-paper/20 bg-paper/5 text-paper/70",
            )}
          >
            <div>
              signups &rarr;{" "}
              <span className={store.mode === "proxy" ? "font-bold text-coral" : "text-mint"}>
                {store.mode === "proxy" ? "REAL AURORA TABLE" : "local file"}
              </span>
            </div>
            <div className="mt-0.5 text-paper/40">{store.reason}</div>
            {store.mode === "local" ? (
              <div className="mt-0.5 text-paper/40">.data/email-signups.local.json</div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
