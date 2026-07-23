"use client";

import { useEffect, useSyncExternalStore } from "react";
import Link from "next/link";

import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Heading } from "@/components/ui/heading";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  hasStoredOptOut,
  isCapturingOptedOut,
  optInThisBrowser,
  optOutThisBrowser,
} from "@/lib/analytics/events";

/**
 * /analytics-optout — a bookmarkable, per-browser "exclude my traffic" switch.
 *
 * Because SFFS analytics are ANONYMOUS (no stored IP/email to filter server-side),
 * the owner + teammates keep their own visits out of PostHog with the vendor's
 * recommended opt-out-capturing. This page IS the control:
 *   • Visiting it (default) OPTS THE BROWSER OUT — posthog.opt_out_capturing()
 *     plus a durable `sffs_ph_optout` localStorage flag the SDK reads at init, so
 *     zero events fire from the very first pageview on every later visit.
 *   • `?on=1` (or the on-page button) RE-ENABLES — posthog.opt_in_capturing()
 *     and clears the flag.
 *
 * The opt-out is additive to GPC/DNT; it never re-enables a browser that the
 * browser's own privacy signals already suppressed.
 */

type Status = "loading" | "off" | "on";

/* --------------------------------------------------------------------------
 * A tiny external store so the UI reflects PostHog's live consent state in an
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
  return isCapturingOptedOut() || hasStoredOptOut() ? "off" : "on";
}

function getServerSnapshot(): Status {
  return "loading";
}

/** Opt this browser out, then notify subscribers to re-render. */
function applyOptOut(): void {
  optOutThisBrowser();
  resolved = true;
  emit();
}

/** Re-enable this browser, then notify subscribers to re-render. */
function applyOptIn(): void {
  optInThisBrowser();
  resolved = true;
  emit();
}

export function AnalyticsOptOut() {
  const status = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // On first load, apply the intent from the URL: `?on=1` re-enables, anything
  // else opts this browser out. Idempotent, so React 18 Strict Mode's dev
  // double-invoke is harmless (and non-prod hosts never init PostHog anyway).
  useEffect(() => {
    const wantsReEnable =
      new URLSearchParams(window.location.search).get("on") === "1";
    if (wantsReEnable) applyOptIn();
    else applyOptOut();
  }, []);

  const isOff = status === "off";
  const isOn = status === "on";

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
              Exclude my traffic
            </Heading>
            <p className="mt-6 max-w-prose text-[1.05rem] leading-[1.7] text-ink/80">
              For the SFFS team. Turn product analytics{" "}
              <strong>off for this browser</strong> so your own visits (and your
              teammates&rsquo;) don&rsquo;t get counted in the numbers.
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
                isOff && "bg-mint",
                isOn && "bg-coral",
                status === "loading" && "bg-cream",
              )}
            >
              <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
                {/* Big Anton on/off chip. */}
                <span
                  aria-hidden
                  className={cn(
                    "inline-flex shrink-0 items-center justify-center rounded-2xl border-[2.5px] border-ink px-5 py-3 font-display text-3xl uppercase leading-none tracking-[-0.01em] shadow-hard-sm sm:text-4xl",
                    isOff && "bg-paper text-ink",
                    isOn && "bg-ink text-paper",
                    status === "loading" && "bg-paper text-ink/40",
                  )}
                >
                  {status === "loading" ? "···" : isOff ? "Off" : "On"}
                </span>

                <div className="min-w-0">
                  {status === "loading" && (
                    <Heading as={2} size="sm">
                      Updating your preference&hellip;
                    </Heading>
                  )}

                  {isOff && (
                    <>
                      <Heading as={2} size="sm">
                        Analytics are OFF on this browser{" "}
                        <span aria-hidden>✅</span>
                      </Heading>
                      <p className="mt-2 text-[1.05rem] font-semibold leading-[1.6] text-ink">
                        You&rsquo;re excluded — you and your teammates won&rsquo;t
                        be counted here.
                      </p>
                    </>
                  )}

                  {isOn && (
                    <>
                      <Heading as={2} size="sm">
                        Analytics are ON for this browser{" "}
                        <span aria-hidden>👀</span>
                      </Heading>
                      <p className="mt-2 text-[1.05rem] font-semibold leading-[1.6] text-ink">
                        This browser <strong>is being counted</strong>. If
                        you&rsquo;re on the team, switch it off below.
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Primary control — ONE persistent button (so keyboard focus
                  survives the state flip). OFF ⇒ a quiet "re-enable"; ON ⇒ the
                  prominent "turn off" that is this page's whole purpose. */}
              {status !== "loading" && (
                <div className="mt-6 flex flex-wrap items-center gap-3 border-t-[2.5px] border-ink/15 pt-6">
                  <Button
                    type="button"
                    onClick={isOff ? () => applyOptIn() : () => applyOptOut()}
                    variant={isOff ? "paper" : "ink"}
                    size={isOff ? "sm" : "lg"}
                  >
                    {isOff
                      ? "Re-enable analytics"
                      : "Turn analytics off for this browser"}
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
                This sets a small preference in <em>this</em> browser that tells
                our analytics (PostHog) to stop counting your visits. It clears if
                you wipe this browser&rsquo;s storage, switch browsers, or use a
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
