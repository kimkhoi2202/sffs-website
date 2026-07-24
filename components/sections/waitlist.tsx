"use client";

import { useState, type FormEvent } from "react";

import { Section } from "@/components/ui/section";
import { Heading } from "@/components/ui/heading";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Button } from "@/components/ui/button";

type SectionBackground = NonNullable<React.ComponentProps<typeof Section>["background"]>;

export interface WaitlistProps {
  id?: string;
  className?: string;
  background?: SectionBackground;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  /** Button label. */
  cta?: string;
}

/**
 * Waitlist email capture for the landing page.
 *
 * `onSubmit` validates the address client-side, then POSTs it to the real
 * `/api/access-signup` Route Handler (which forwards it to Aurora via the
 * email proxy). Success only flips to the confirmation state on an `{ ok:
 * true }` response; a failed or unreachable request re-enables the form and
 * shows a retryable error instead.
 */
export function Waitlist({
  id,
  className,
  background = "coral",
  eyebrow = "You've seen us on TikTok",
  title = "Get in before everyone else",
  subtitle = "We're the fellas behind the brain quizzes. The game itself drops soon — drop your email and you're first in line, with a head start on the leaderboard.",
  cta = "Join the waitlist",
}: WaitlistProps = {}) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    const value = email.trim();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    if (!valid) {
      setError("Hmm, that doesn't look like an email.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/access-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;
      if (!res.ok || !data?.ok) {
        setError(data?.error ?? "That didn't go through. Give it another shot.");
        setSubmitting(false);
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      setSubmitting(false);
    }
  }

  return (
    <Section
      id={id}
      className={className}
      background={background}
      padding="lg"
      container="prose"
      containerClassName="text-center"
    >
      <Eyebrow>{eyebrow}</Eyebrow>
      <Heading as={2} size="xl" className="mt-4">
        {title}
      </Heading>

      {submitted ? (
        <div
          role="status"
          aria-live="polite"
          className="mx-auto mt-8 max-w-md rounded-2xl border-[2.5px] border-ink bg-paper px-6 py-8 shadow-hard"
        >
          <p className="font-display text-2xl uppercase leading-none tracking-[-0.01em]">
            You&apos;re on the list.
          </p>
          <p className="mt-3 text-base font-medium text-ink/80">
            We&apos;ll email you the second it&apos;s ready. Go tell a fart smella.
          </p>
        </div>
      ) : (
        <>
          <p className="mx-auto mt-6 max-w-xl text-pretty text-lg font-medium leading-snug">
            {subtitle}
          </p>
          <form
            onSubmit={onSubmit}
            noValidate
            className="mx-auto mt-8 flex w-full max-w-lg flex-col items-stretch gap-3 sm:flex-row"
          >
            <label htmlFor="waitlist-email" className="sr-only">
              Email address
            </label>
            <input
              id="waitlist-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "waitlist-error" : undefined}
              className="h-14 flex-1 rounded-full border-[2.5px] border-ink bg-paper px-6 font-sans text-base font-medium text-ink placeholder:text-ink/45 shadow-hard-sm outline-none focus-visible:ring-2 focus-visible:ring-ink disabled:cursor-not-allowed disabled:opacity-60"
            />
            <Button type="submit" variant="green" size="lg" className="shrink-0" disabled={submitting}>
              {cta}
            </Button>
          </form>
          {error ? (
            <p id="waitlist-error" role="alert" className="mt-3 text-sm font-bold text-ink">
              {error}
            </p>
          ) : null}
          {/* Honest trust line — the biggest lever against "this looks fake." */}
          <p className="mt-4 text-sm font-medium text-ink/70">
            One email when it launches. No spam, no selling your info.
          </p>
        </>
      )}
    </Section>
  );
}
