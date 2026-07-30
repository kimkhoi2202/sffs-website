"use client";

import { useEffect, useId, useRef, useState } from "react";

import { AttributionSurvey } from "@/components/quiz/attribution-survey";
import { Button } from "@/components/ui/button";
import {
  trackEmailCaptureStarted,
  trackEmailCaptureSubmitted,
  trackEmailCaptureValidationFailed,
  trackEmailFieldFocused,
  trackEmailFormViewed,
  type ValidationFailReason,
} from "@/lib/analytics/events";
import { cn } from "@/lib/utils";

type Status = "idle" | "submitting" | "error" | "success";

/** Client-side shape check for instant feedback; the API route re-validates. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * The site's only email lead-capture. Now the whole job of the homepage
 * (components/sections/early-access.tsx).
 *
 * Flow: client-validate -> POST /api/access-signup -> loading state -> on success
 * swap the whole form for an on-brand confirmation; on failure show a friendly,
 * retryable error. Fully keyboard-accessible: real <label>, a focus state that
 * matches the resting input with a forced-colors-only ring fallback (see the
 * input's className), aria-invalid + aria-describedby wiring, an assertive error
 * alert, a polite success status that receives focus, and inputs disabled while
 * submitting.
 *
 * `email_captured` is deliberately NOT fired from here. It fires exactly once,
 * server-side in /api/access-signup, and only when Aurora genuinely inserted a
 * row (see the reasoning in commit 2d43faf). A client-side capture alongside it
 * would double every conversion, and would count re-submits of an address that
 * is already on the list. Every other step of the funnel IS client-side, since
 * only the browser can see a focus, a keystroke, or a client-side validation
 * failure.
 */
export function GetAccessForm({ className }: { className?: string }) {
  const inputId = useId();
  const errorId = useId();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Once-per-mount analytics guards so focus/first-keystroke/view fire once.
  const focusedRef = useRef(false);
  const startedRef = useRef(false);
  /**
   * Synchronous re-entry guard. The `status` state is NOT enough on its own:
   * setState is async, so several clicks landing in the same frame all read the
   * old value and all fire a POST before React re-renders and disables the
   * button. Three clicks in one frame really did produce three signup requests,
   * three server-side conversion events, and one database row. This ref is read
   * and written in the same tick, so the 2nd and 3rd clicks return immediately.
   * The state below stays for the visual disabled affordance; the ref is the
   * correctness guard.
   */
  const submittingRef = useRef(false);

  const submitting = status === "submitting";
  const invalid = status === "error" && Boolean(error);

  // email_form_viewed — fire once when the form scrolls into view (plan §2.2).
  useEffect(() => {
    const el = formRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          trackEmailFormViewed();
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;

    try {
      const trimmed = email.trim();
      if (!EMAIL_RE.test(trimmed)) {
        setStatus("error");
        setError("Hmm, that email looks off. Mind double-checking it?");
        trackEmailCaptureValidationFailed("invalid_format_client");
        inputRef.current?.focus();
        return;
      }

      setStatus("submitting");
      setError(null);
      // Passed the client regex → a real attempt. NOTE: the email is NEVER sent to
      // PostHog; this event carries no properties (source/attribution ride super props).
      trackEmailCaptureSubmitted();

      try {
        const res = await fetch("/api/access-signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: trimmed, source: "pricing-get-access" }),
        });
        const data = (await res.json().catch(() => null)) as
          | { ok?: boolean; error?: string }
          | null;

        if (!res.ok || !data?.ok) {
          setStatus("error");
          setError(
            data?.error ?? "That didn't go through. Give it another shot.",
          );
          // Map the HTTP status 1:1 to a typed reason (plan §2.2).
          const reason: ValidationFailReason =
            res.status === 400
              ? "invalid_format_server"
              : res.status === 413
                ? "payload_too_large"
                : res.status === 429
                  ? "rate_limited"
                  : "server_error";
          trackEmailCaptureValidationFailed(reason);
          return;
        }

        // THE conversion event is NOT fired here. /api/access-signup fires it
        // server-side, once, and only when a row was genuinely inserted.
        setStatus("success");
        // Move focus to the confirmation so screen-reader users hear it announced.
        requestAnimationFrame(() => successRef.current?.focus());
      } catch {
        setStatus("error");
        setError("Couldn't reach the server. Check your connection and try again.");
        trackEmailCaptureValidationFailed("network_error");
      }
    } finally {
      submittingRef.current = false;
    }
  }

  if (status === "success") {
    return (
      <div className={cn("mt-8", className)}>
        <div
          ref={successRef}
          tabIndex={-1}
          role="status"
          aria-live="polite"
          className="rounded-2xl border-[2.5px] border-ink bg-mint p-6 text-center shadow-hard-sm outline-none"
        >
          {/*
            Submitting writes one row to Aurora. It sends no email, because
            there is no transactional email provider wired up. So this state may
            promise a FUTURE notification (the address really is stored and the
            intent is real) but must never imply something is arriving now.
            "Check your inbox" was removed for exactly that reason; do not let
            it back in, in any wording, until an email actually gets sent.
          */}
          <p className="font-display text-3xl uppercase leading-none tracking-tight">
            You&apos;re on the list <span aria-hidden="true">🧠</span>
          </p>
          <p className="mt-3 text-sm font-medium leading-relaxed text-ink/80">
            Your spot is saved. We&apos;ll let you know when the app is ready.
            Nothing hits your inbox before then.
          </p>
        </div>
        {/* Our OWN on-brand attribution survey (replaces the native PostHog
            popover). Skippable; writes to Aurora + fires a no-PII PostHog event.
            The email ties the answer to the signup in Aurora only. */}
        <AttributionSurvey email={email.trim().toLowerCase()} />
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      noValidate
      // Belt-and-suspenders session-replay masking: maskAllInputs already masks
      // the value; data-ph-mask (maskTextSelector) also masks any text in here.
      data-ph-mask
      className={cn("mt-8 flex flex-col gap-3 text-left", className)}
    >
      <label htmlFor={inputId} className="eyebrow text-ink">
        Enter your email to get access
      </label>

      <input
        ref={inputRef}
        id={inputId}
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="you@example.com"
        value={email}
        required
        disabled={submitting}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? errorId : undefined}
        onFocus={() => {
          if (focusedRef.current) return;
          focusedRef.current = true;
          trackEmailFieldFocused();
        }}
        onChange={(event) => {
          if (!startedRef.current && event.target.value.length > 0) {
            startedRef.current = true;
            trackEmailCaptureStarted(); // first keystroke
          }
          setEmail(event.target.value);
          if (status === "error") {
            setStatus("idle");
            setError(null);
          }
        }}
        className={cn(
          "h-14 w-full rounded-full border-[2.5px] bg-paper px-5 text-base font-medium text-ink shadow-hard-sm",
          "placeholder:text-ink/40 disabled:cursor-not-allowed disabled:opacity-60",
          // Focus: make the focused state look IDENTICAL to the resting state —
          // no visible ring, no color change. We only neutralize the global
          // black :focus-visible outline by swapping it for a TRANSPARENT real
          // outline: invisible in normal rendering, but forced-colors / Windows
          // High Contrast ignores the transparent color and still paints a focus
          // ring for those users. Deliberately NO focus box-shadow override, so
          // the resting neo-brutalist hard shadow (shadow-hard-sm) carries
          // through unchanged on focus.
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-transparent",
          invalid ? "border-coral" : "border-ink",
        )}
      />

      {invalid ? (
        <p id={errorId} role="alert" className="text-sm font-semibold text-coral">
          {error}
        </p>
      ) : null}

      <Button
        type="submit"
        variant="green"
        size="lg"
        disabled={submitting}
        aria-busy={submitting}
        className="w-full"
      >
        {submitting ? (
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
          "Get access"
        )}
      </Button>
    </form>
  );
}
