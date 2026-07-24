"use client";

import { useEffect, useSyncExternalStore } from "react";
import Link from "next/link";

import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Heading } from "@/components/ui/heading";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  clearInternalUser,
  isInternalUser,
  markInternalUser,
} from "@/lib/analytics/events";

/**
 * /internal — a bookmarkable, per-browser INTERNAL-USER toggle.
 *
 * The owner + teammates mark their OWN browser as internal so their visits don't
 * skew the PUBLIC metrics — without disappearing. Events still flow to PostHog;
 * they're just stamped `is_internal: true` and filtered out by the project's
 * "internal & test users" test-account filter. This page IS the control:
 *   • Visiting it (default) MARKS THE BROWSER INTERNAL — posthog.register({is_internal:true})
 *     plus a durable `sffs_ph_internal` localStorage flag the SDK reads at init,
 *     so every event (from the first pageview on) is tagged.
 *   • `?on=1` (or the on-page button) makes it a NORMAL visitor again —
 *     posthog.unregister('is_internal') and clears the flag.
 *
 * Additive to GPC/DNT: tagging keeps events flowing, but GPC/DNT still suppress
 * capture entirely when the browser asks for it.
 */

type Status = "loading" | "internal" | "normal";

/* --------------------------------------------------------------------------
 * A tiny external store so the UI reflects the live internal-tag state in an
 * SSR-safe way (useSyncExternalStore) — no setState-in-effect, no hydration
 * mismatch. `resolved` stays false until the mount effect applies the URL intent,
 * so the server render and the first client render agree on a stable "loading"
 * snapshot; after the intent is applied we emit and React re-reads the real state.
 * ------------------------------------------------------------------------ */
let resolved = false;
const listeners = new Set<() => void>();

function subscribe(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

function emit(): void {
  for (const listener of listeners) listener();
}

function getSnapshot(): Status {
  if (!resolved) return "loading";
  return isInternalUser() ? "internal" : "normal";
}

function getServerSnapshot(): Status {
  return "loading";
}

/** Mark this browser internal, then notify subscribers to re-render. */
function applyMarkInternal(): void {
  markInternalUser();
  resolved = true;
  emit();
}

/** Make this browser a normal visitor, then notify subscribers to re-render. */
function applyMakeNormal(): void {
  clearInternalUser();
  resolved = true;
  emit();
}

export function AnalyticsOptOut() {
  const status = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // On first load, apply the intent from the URL: `?on=1` makes this a normal
  // visitor, anything else marks it internal. Idempotent, so React 18 Strict
  // Mode's dev double-invoke is harmless (non-prod hosts never init PostHog).
  useEffect(() => {
    const wantsNormal =
      new URLSearchParams(window.location.search).get("on") === "1";
    if (wantsNormal) applyMakeNormal();
    else applyMarkInternal();
  }, []);

  const isInternal = status === "internal";
  const isNormal = status === "normal";

  return (
    <div id="top" className="relative z-40 flex flex-1 flex-col bg-paper text-ink">
      {/* On-brand header, mirroring the legal + Creator Studio pages. */}
      <header className="border-b-[2.5px] border-ink bg-paper">
        <Container className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-3 md:py-4">
          <Link
            href="/"
            aria-label="Smart Fella or Fart Smella — home"
            className="col-start-1 inline-flex items-center justify-self-start"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- brand mark is a static /public asset */}
            <img
              src="/logo.png"
              alt=""
              draggable={false}
              className="h-10 w-auto select-none md:h-12"
            />
          </Link>
          <span className="col-start-2 hidden font-display text-xl uppercase tracking-[-0.01em] md:block">
            Analytics settings
          </span>
          <Link
            href="/"
            className="col-start-3 inline-flex shrink-0 items-center gap-2 justify-self-end rounded-full border-[2.5px] border-ink bg-yellow px-4 py-2 text-sm font-bold uppercase leading-none tracking-[0.02em] btn-press"
          >
            <span aria-hidden>←</span> Back to the test
          </Link>
        </Container>
      </header>

      <main id="main" className="flex-1">
        {/* Title band — signature yellow color-block. */}
        <section className="border-b-[2.5px] border-ink bg-yellow">
          <Container size="prose" className="py-14 md:py-20">
            <Eyebrow>Team tool</Eyebrow>
            <Heading as={1} size="xl" className="mt-4">
              Internal user
            </Heading>
            <p className="mt-6 max-w-prose text-[1.05rem] leading-[1.7] text-ink/80">
              For the SFFS team. Mark this browser as{" "}
              <strong>internal</strong>{" "}so your own visits (and your
              teammates&rsquo;) still record but are{" "}
              <strong>kept out of the public metrics</strong> — dashboards,
              funnels, and reports.
            </p>
          </Container>
        </section>

        {/* Status + controls. */}
        <section className="bg-paper">
          <Container size="prose" className="py-12 md:py-16">
            {/* Live status card — its own color-block per state; announced to
                assistive tech via role="status" (implicit aria-live="polite"). */}
            <div
              role="status"
              aria-live="polite"
              className={cn(
                "rounded-3xl border-[2.5px] border-ink p-6 shadow-hard-lg sm:p-8",
                isInternal && "bg-mint",
                isNormal && "bg-coral",
                status === "loading" && "bg-cream",
              )}
            >
              <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
                {/* Big Anton status chip. */}
                <span
                  aria-hidden
                  className={cn(
                    "inline-flex shrink-0 items-center justify-center rounded-2xl border-[2.5px] border-ink px-5 py-3 font-display text-2xl uppercase leading-none tracking-[-0.01em] shadow-hard-sm sm:text-3xl",
                    isInternal && "bg-ink text-paper",
                    isNormal && "bg-paper text-ink",
                    status === "loading" && "bg-paper text-ink/40",
                  )}
                >
                  {status === "loading"
                    ? "···"
                    : isInternal
                      ? "Internal"
                      : "Normal"}
                </span>

                <div className="min-w-0">
                  {status === "loading" && (
                    <Heading as={2} size="sm">
                      Updating your preference&hellip;
                    </Heading>
                  )}

                  {isInternal && (
                    <>
                      <Heading as={2} size="sm">
                        This browser is marked INTERNAL{" "}
                        <span aria-hidden>🏷️</span>
                      </Heading>
                      <p className="mt-2 text-[1.05rem] font-semibold leading-[1.6] text-ink">
                        Your visits <strong>still record</strong> — they&rsquo;re
                        just tagged and excluded from the public metrics, so you
                        and your teammates never skew the numbers.
                      </p>
                    </>
                  )}

                  {isNormal && (
                    <>
                      <Heading as={2} size="sm">
                        This browser counts as a normal visitor{" "}
                        <span aria-hidden>👀</span>
                      </Heading>
                      <p className="mt-2 text-[1.05rem] font-semibold leading-[1.6] text-ink">
                        Your visits <strong>are counted</strong> in the public
                        metrics. If you&rsquo;re on the team, mark this browser
                        internal below.
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Primary control — ONE persistent button (so keyboard focus
                  survives the state flip). INTERNAL ⇒ a quiet "make normal";
                  NORMAL ⇒ the prominent "mark internal" that is this page's
                  whole purpose. */}
              {status !== "loading" && (
                <div className="mt-6 flex flex-wrap items-center gap-3 border-t-[2.5px] border-ink/15 pt-6">
                  <Button
                    type="button"
                    onClick={isInternal ? () => applyMakeNormal() : () => applyMarkInternal()}
                    variant={isInternal ? "paper" : "ink"}
                    size={isInternal ? "sm" : "lg"}
                    // Soften the mark-internal CTA's hard drop shadow from black
                    // to an on-brand gray so it reads gentler on the coral card.
                    className={!isInternal ? "[--btn-shadow-color:var(--color-gray-600)]" : undefined}
                  >
                    {isInternal
                      ? "Make this a normal visitor"
                      : "Mark this browser as internal"}
                  </Button>
                </div>
              )}
            </div>

            {/* The one instruction that actually matters. */}
            <div className="mt-8 flex items-start gap-3 rounded-2xl border-[2.5px] border-ink bg-blue p-5 shadow-hard-sm selection:bg-yellow selection:text-ink">
              <span aria-hidden className="text-2xl leading-none">
                📌
              </span>
              <p className="text-[1.05rem] font-bold leading-[1.6] text-ink">
                Do this once on every browser and device you use — phone, laptop,
                work machine, and any private/incognito windows.
              </p>
            </div>

            {/* Plain-language explainer. */}
            <div className="mt-8 space-y-4 text-[1rem] leading-[1.7] text-ink/80">
              <p>
                This sets a small preference in <em>this</em> browser and tags
                its events as <code>is_internal</code> in our analytics (PostHog).
                Nothing is hidden from us — your visits still record — they&rsquo;re
                just filtered out of the <em>public</em> numbers. It clears if you
                wipe this browser&rsquo;s storage, switch browsers, or use a
                different device — that&rsquo;s why you repeat it per browser.
              </p>
              <p>
                It doesn&rsquo;t change what we collect from real visitors, and it
                never sends any personal info. Curious what we track (and how
                little)? Read the{" "}
                <Link
                  href="/privacy"
                  className="font-semibold text-ink underline decoration-2 underline-offset-2 hover:text-ink/70"
                >
                  privacy policy
                </Link>
                .
              </p>
            </div>
          </Container>
        </section>
      </main>
    </div>
  );
}
