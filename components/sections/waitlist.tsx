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
 * ⚠️ NOT WIRED TO A BACKEND YET. `onSubmit` validates the address client-side
 * and shows a success state, but the email is DISCARDED — nothing is stored or
 * sent anywhere. Before this goes live, connect an email service (ConvertKit /
 * Mailchimp / Beehiiv / a Route Handler that writes somewhere) at the TODO
 * below. Until then, do not present this as a working signup in production.
 */
export function Waitlist({
  id,
  className,
  background = "coral",
  eyebrow = "Launching soon",
  title = "Get in before everyone else",
  subtitle = "Drop your email and we'll tell you the moment it's ready — plus a first crack at the leaderboard.",
  cta = "Join the waitlist",
}: WaitlistProps = {}) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = email.trim();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    if (!valid) {
      setError("Hmm, that doesn't look like an email.");
      return;
    }
    setError(null);
    // TODO(email): wire this to a real email service. Right now the address is
    // NOT stored or sent anywhere — this only flips the UI to a success state.
    setSubmitted(true);
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
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "waitlist-error" : undefined}
              className="h-14 flex-1 rounded-full border-[2.5px] border-ink bg-paper px-6 font-sans text-base font-medium text-ink placeholder:text-ink/45 shadow-hard-sm outline-none focus-visible:ring-2 focus-visible:ring-ink"
            />
            <Button type="submit" variant="green" size="lg" className="shrink-0">
              {cta}
            </Button>
          </form>
          {error ? (
            <p id="waitlist-error" role="alert" className="mt-3 text-sm font-bold text-ink">
              {error}
            </p>
          ) : null}
        </>
      )}
    </Section>
  );
}
