"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";

export interface UnlockFormProps {
  /** Called with the minted checkout token once the code verifies. */
  onUnlocked: (token: string) => void;
}

/**
 * Smart Fella code redemption form.
 *
 * Mirrors `components/sections/waitlist.tsx`'s client-form UX exactly:
 * submitting/error states, disabled handling while in flight, an inline
 * retryable error on failure. POSTs to `/api/store/unlock`; on `{ok:true}`
 * lifts the returned checkout token to the parent so it can reveal the
 * `BuyButton` — this form never decides whether the gate is open, the API
 * response is the only source of truth.
 */
export function UnlockForm({ onUnlocked }: UnlockFormProps) {
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    const value = code.trim();
    if (!value) {
      setError("Drop your Smart Fella code in first.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/store/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: value }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; token?: string; error?: string }
        | null;
      if (!res.ok || !data?.ok || !data.token) {
        setError(data?.error ?? "That didn't go through. Give it another shot.");
        setSubmitting(false);
        return;
      }
      onUnlocked(data.token);
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-4">
      <form
        onSubmit={onSubmit}
        noValidate
        className="flex flex-col items-stretch gap-3 sm:flex-row"
      >
        <label htmlFor="unlock-code" className="sr-only">
          Smart Fella code
        </label>
        <input
          id="unlock-code"
          type="text"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          placeholder="SF1.xxxxx"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          disabled={submitting}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "unlock-error" : undefined}
          className="h-12 w-full rounded-full border-[2.5px] border-ink bg-paper px-5 font-sans text-sm font-medium text-ink placeholder:text-ink/45 shadow-hard-sm outline-none focus-visible:ring-2 focus-visible:ring-ink disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:flex-1"
        />
        <Button
          type="submit"
          variant="yellow"
          size="md"
          className="shrink-0"
          disabled={submitting}
        >
          {submitting ? "Checking…" : "Unlock"}
        </Button>
      </form>
      {error ? (
        <p id="unlock-error" role="alert" className="mt-3 text-sm font-bold">
          {error}
        </p>
      ) : null}
    </div>
  );
}
