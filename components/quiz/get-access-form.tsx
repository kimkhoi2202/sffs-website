"use client";

import { useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Status = "idle" | "submitting" | "error" | "success";

/** Client-side shape check for instant feedback; the API route re-validates. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Inline email lead-capture that replaces the pricing card's CTA button.
 *
 * Flow: client-validate -> POST /api/access-signup -> loading state -> on success
 * swap the whole form for an on-brand "You're in!" confirmation; on failure show
 * a friendly, retryable error. Fully keyboard-accessible: real <label>, native
 * focus outline (from globals.css :focus-visible), aria-invalid + aria-describedby
 * wiring, an assertive error alert, a polite success status that receives focus,
 * and inputs disabled while submitting.
 */
export function GetAccessForm({ className }: { className?: string }) {
  const inputId = useId();
  const errorId = useId();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const successRef = useRef<HTMLDivElement>(null);

  const submitting = status === "submitting";
  const invalid = status === "error" && Boolean(error);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setStatus("error");
      setError("Hmm, that email looks off. Mind double-checking it?");
      inputRef.current?.focus();
      return;
    }

    setStatus("submitting");
    setError(null);

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
        return;
      }

      setStatus("success");
      // Move focus to the confirmation so screen-reader users hear it announced.
      requestAnimationFrame(() => successRef.current?.focus());
    } catch {
      setStatus("error");
      setError("Couldn't reach the server. Check your connection and try again.");
    }
  }

  if (status === "success") {
    return (
      <div
        ref={successRef}
        tabIndex={-1}
        role="status"
        aria-live="polite"
        className={cn(
          "mt-8 rounded-2xl border-[2.5px] border-ink bg-mint p-6 text-center shadow-hard-sm outline-none",
          className,
        )}
      >
        <p className="font-display text-3xl uppercase leading-none tracking-tight">
          You&apos;re in! <span aria-hidden="true">🧠</span>
        </p>
        <p className="mt-3 text-sm font-medium leading-relaxed text-ink/80">
          Certified smart move. That&apos;s exactly what a smart fella would do.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
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
        onChange={(event) => {
          setEmail(event.target.value);
          if (status === "error") {
            setStatus("idle");
            setError(null);
          }
        }}
        className={cn(
          "h-14 w-full rounded-full border-[2.5px] bg-paper px-5 text-base font-medium text-ink shadow-hard-sm",
          "placeholder:text-ink/40 disabled:cursor-not-allowed disabled:opacity-60",
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
