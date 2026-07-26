"use client";

import { useRef, useState, type FormEvent } from "react";

import { Section } from "@/components/ui/section";
import { Heading } from "@/components/ui/heading";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  subtitle = "We're the fellas behind the brain quizzes. The game itself drops soon. Drop your email and you're first in line, with a head start on the leaderboard.",
  cta = "Join the waitlist",
}: WaitlistProps = {}) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /**
   * Synchronous re-entry guard. `submitting` state is NOT enough on its own:
   * setState is async, so several clicks landing in the same frame all read the
   * old `false` and all fire a POST before React re-renders and disables the
   * button. Three clicks in one frame really did produce three signup requests.
   * This ref is read and written in the same tick, so the 2nd and 3rd clicks
   * return immediately. The state below stays for the visual disabled
   * affordance; the ref is the correctness guard.
   */
  const submittingRef = useRef(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
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
    } finally {
      submittingRef.current = false;
    }
  }

  return (
    <Section
      id={id}
      className={cn(
        // FULL-VIEWPORT coral panel. This is the primary conversion section, so it
        // fills a whole screen — when it's in view (chiefly via the "Join the
        // waitlist" CTAs, which pin its top just under the fixed nav) the coral
        // reaches from under the nav to the fold and the FAQ below stays under the
        // fold instead of peeking up.
        //
        // Height: 100dvh MINUS the live nav height. dvh (not svh) because this is
        // a SCROLLED-TO section — by the time it's reached the mobile URL bar is
        // already collapsed, so dvh matches the real visible height; svh would be
        // sized to the small (bar-shown) viewport and leave the FAQ peeking once
        // the bar hides. The fixed nav is an overlay (not in flow), so we subtract
        // its measured height (--nav-h, published by smooth-scroll.tsx; 4.5rem
        // fallback pre-hydration) so the panel fills exactly the area below it.
        //
        // Flex-centered so the eyebrow/headline/subtext/form sit balanced in the
        // panel; min-height (not height) lets it grow on very short phones so the
        // email input + button are never clipped. py shrinks on small screens to
        // keep that form on-screen.
        "flex min-h-[calc(100dvh_-_var(--nav-h,4.5rem))] flex-col justify-center py-10 md:py-16",
        className,
      )}
      background={background}
      padding="none"
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
              // w-full + sm:flex-1: on mobile the form is a flex-COLUMN, where
              // `flex-1` would collapse the input's height to its min-content
              // (~26px) and leave it shorter than the button. Keep the fixed h-14
              // via full width on mobile, and only grow horizontally (flex-1) once
              // the form switches to a row at sm+.
              className="h-14 w-full rounded-full border-[2.5px] border-ink bg-paper px-6 font-sans text-base font-medium text-ink placeholder:text-ink/45 shadow-hard-sm outline-none focus-visible:ring-2 focus-visible:ring-ink disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:flex-1"
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
