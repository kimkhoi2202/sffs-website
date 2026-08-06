/**
 * The email box over the blurred results.
 *
 * ===========================================================================
 * NOTHING IS UNBLURRED UNTIL A MESSAGE HAS ACTUALLY LEFT
 * ===========================================================================
 * Before a send, this box is the only thing on the screen and the results
 * behind it are a masked shape with no score in them at all. That has not
 * changed and must not: the gate is what the address is exchanged for.
 *
 * What changed is what happens AFTER. A successful send calls `onSent`, and
 * the caller then shows the real results underneath this card — see the note
 * on the reveal in ./gated-results.tsx. The email still goes, and this card
 * still says so, because the mail is the durable copy: it survives the tab
 * closing, this device, and next year.
 *
 * THE COPY NO LONGER CLAIMS THE EMAIL IS THE ONLY ROUTE, because it is not,
 * and a gate that lies about its own terms is worse than one that asks
 * plainly. It also does not advertise the reveal before the send. Both of
 * those are deliberate: stating "you will see them here anyway" turns every
 * address into a throwaway, and stating the opposite would be untrue.
 *
 * The failure path matters as much as it ever did, which is why this component
 * has a real one: if the send fails, it says so and offers a retry. It never
 * shows "check your inbox" for a message that did not leave, and it never
 * reveals a score for one either — `onSent` fires on the same branch as the
 * confirmation, and only there.
 *
 * ===========================================================================
 * THE CHILD BRANCH NEVER ASKS A CHILD FOR THEIR OWN EMAIL
 * ===========================================================================
 * The site is positioned 13 and up and /privacy says so, while the grade picker
 * starts at grade 3, which is an eight-year-old. Those are only compatible if
 * the child branch never solicits a child's own contact details, so there the
 * ask is explicitly for a grown-up's address, in words an eight-year-old reads
 * as "go and get a grown-up".
 *
 * The wording keys off which TEST was sat, not which fork was taken. A parent
 * who picks "my kid" and hands the phone over produces a child sitting in front
 * of a child test's results, so both routes to a child test get the grown-up
 * wording. Only an adult giving their own address gets the plain version.
 *
 * The two branches also write different `source` values to Aurora, so the
 * records stay distinguishable. See EMAIL_SOURCES in lib/analytics/events.ts.
 *
 * NOTHING ELSE IS COLLECTED. No name, no age, no birthday, no free text.
 */
"use client";

import { useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  trackEmailCaptureStarted,
  trackEmailCaptureValidationFailed,
  trackEmailFieldFocused,
  trackTestEmailSendFailed,
  trackTestEmailSent,
  trackTestEmailSubmitted,
  trackTestResendRequested,
  isInternalUser,
} from "@/lib/analytics/events";
import { shouldForceSendFailure } from "@/lib/test/dev-flags";
import type { Audience } from "@/lib/test/types";
import { cn } from "@/lib/utils";

/** Client-side shape check for instant feedback. The API route re-validates. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Status = "idle" | "submitting" | "error" | "sent";

const COPY = {
  adult: {
    title: "Where should we send it?",
    // NOT "it is the only way to see them" any more, which is what this line
    // used to end on. The results appear on this page once the send lands, so
    // that sentence became false the day the reveal shipped. What replaces it
    // is the reason the email is still worth giving a real address for: it
    // outlives this tab.
    body: "We will email you a link to your full results, so you keep them after this tab is gone.",
    label: "Your email",
    placeholder: "you@example.com",
    cta: "Email me my results",
    sentTitle: "Check your email",
    sentBody: "Your results are on their way. You can also see them right below.",
  },
  /*
   * PARENT, NOT GROWN-UP, ON THIS BRANCH.
   *
   * The reason we ask for an adult's address rather than the child's is the
   * PARENTAL relationship specifically, and "a grown-up" is vague enough to
   * mean any adult at all. "Parent" states who should actually be receiving a
   * child's test results, which is the posture /privacy takes too.
   *
   * The FIELD LABEL says "Parent or guardian's" because guardians,
   * grandparents and foster carers are real, and the label is the one place
   * precision beats brevity. Headline and body stay at "parent", which an
   * eight-year-old reads without effort.
   *
   * NOTE THE OPPOSITE RULE on the opening fork, which still says "I'm a
   * grown-up" and should: that card is an adult self-identifying in order to
   * take the test, and plenty of them have no children. Parent language for
   * who RECEIVES a child's results; grown-up language for who is TAKING the
   * test.
   */
  child: {
    title: "Ask a parent!",
    // It opens by acknowledging they finished, which is doing real work. The
    // intro no longer mentions the email step, so this is the first a child
    // hears of it, five minutes in. Leading with "you did it" makes the ask
    // read as the next step in something they completed rather than a wall
    // dropped in front of the thing they just earned.
    //
    // WHOSE ADDRESS IT IS NO LONGER STATED HERE, so the other three strings in
    // this block are the only thing carrying it: the title, the field label and
    // the placeholder. An eight-year-old has to come away knowing the address
    // is not theirs, so none of those three may drift to a generic "email"
    // without putting the requirement back into this line.
    body: "You did it. Now we will send your results.",
    label: "Parent or guardian's email",
    placeholder: "parent@example.com",
    cta: "Send my results",
    sentTitle: "Sent!",
    sentBody:
      "Ask your parent to check their email. You can see your results right below.",
  },
} as const;

export interface EmailGateProps {
  audience: Audience;
  testId: string;
  source: string;
  /** The stored result's token. Null until the server has created the record. */
  token: string | null;
  /**
   * A message has genuinely left. THE ONLY SIGNAL THAT UNLOCKS THE SCORE, so
   * it is called on exactly one branch: after the API has confirmed the send,
   * next to the confirmation this card shows. A validation failure, a capped
   * result, a rejected provider and a dead network all miss it, which is the
   * whole point. Fires again on a second address, which is harmless: the
   * caller latches it.
   */
  onSent: () => void;
  /** Throw the attempt away and go back to the start. Rendered inside the card. */
  onRestart: () => void;
}

export function EmailGate({
  audience,
  testId,
  source,
  token,
  onSent,
  onRestart,
}: EmailGateProps) {
  const inputId = useId();
  const errorId = useId();
  const copy = COPY[audience === "child" ? "child" : "adult"];

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  /** The address the last successful send went to. Shown on the confirmation. */
  const [sentTo, setSentTo] = useState<string | null>(null);
  /** Set when the server says this result has had all the sends it gets. */
  const [capped, setCapped] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const focusedRef = useRef(false);
  const startedRef = useRef(false);
  /**
   * Synchronous re-entry guard. `status` alone is not enough: setState is
   * async, so several taps in one frame all read the old value and all fire a
   * request. The homepage form learned this the hard way. The state below is
   * the visual affordance; this ref is the correctness guard — and here it
   * guards an outbound email rather than a database row.
   */
  const sendingRef = useRef(false);

  const submitting = status === "submitting";
  const invalid = status === "error" && Boolean(error);

  async function send(address: string, isResend: boolean) {
    if (sendingRef.current) return;
    if (!token) {
      setStatus("error");
      setError("Still saving your results. Give it a second and try again.");
      return;
    }
    sendingRef.current = true;

    try {
      setStatus("submitting");
      setError(null);

      if (isResend) trackTestResendRequested({ test_id: testId, audience });
      else trackTestEmailSubmitted({ test_id: testId, audience, source });

      const res = await fetch("/api/test-results/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          email: address,
          /*
            Whether this is the "Send it again" button rather than a typed
            submission.

            The server counts submissions per address and a resend is not one:
            it is the same person asking for the same mail a second time
            because the first did not arrive, not a fresh expression of
            interest. Only the browser knows which button was pressed, so the
            distinction has to travel with the request.
          */
          isResend,
          // Always false outside development; the reader folds to `return
          // false` in a production build, and the server ignores the field
          // there regardless. See lib/test/dev-flags.ts.
          forceFailure: shouldForceSendFailure(),
          // The server cannot see this browser's internal flag, so it travels
          // with the submission. Without it the server-side conversion event
          // escapes the project's internal-user filter. See lib/posthog-server.ts.
          isInternal: isInternalUser(),
        }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; deduped?: boolean; error?: string; code?: string }
        | null;

      if (!res.ok || !data?.ok) {
        setStatus("error");
        setError(data?.error ?? "That didn't go through. Give it another shot.");
        if (data?.code === "send_cap") setCapped(true);
        trackTestEmailSendFailed({
          test_id: testId,
          audience,
          code: data?.code ?? "unknown",
        });
        return;
      }

      setSentTo(address);
      setStatus("sent");
      /*
        ONLY A MESSAGE THAT LEFT IS REPORTED AS ONE. The server suppresses a
        repeat of a send it made moments ago (see SEND_DEDUPE_WINDOW_MS in
        lib/test/result-store.ts) and says so. The confirmation is still right —
        results are on their way to that address — but counting the suppressed
        attempt would inflate the exact number this bug was diagnosed from.
      */
      if (!data.deduped) trackTestEmailSent({ test_id: testId, audience, resend: isResend });
      onSent();
    } catch {
      setStatus("error");
      setError("Couldn't reach the server. Check your connection and try again.");
      trackTestEmailSendFailed({ test_id: testId, audience, code: "network" });
    } finally {
      sendingRef.current = false;
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setStatus("error");
      setError(
        audience === "child"
          ? "That does not look like an email address. Check it with a parent."
          : "Hmm, that email looks off. Mind double-checking it?",
      );
      trackEmailCaptureValidationFailed("invalid_format_client");
      inputRef.current?.focus();
      return;
    }
    void send(trimmed, false);
  }

  /* -- the confirmation ---------------------------------------------------- */
  if (status === "sent" && sentTo) {
    return (
      <Card>
        <div
          role="status"
          aria-live="polite"
          className="flex flex-col items-center gap-2 text-center"
        >
          <span
            aria-hidden="true"
            className="grid size-12 place-items-center rounded-full border-[2.5px] border-ink bg-mint text-xl font-black"
          >
            &#10003;
          </span>
          <h2 className="text-balance font-display text-[clamp(1.5rem,6vw,2rem)] uppercase leading-[1.05] tracking-[-0.01em]">
            {copy.sentTitle}
          </h2>
          <p className="text-pretty text-[0.95rem] font-semibold leading-snug text-ink/75">
            {copy.sentBody}
          </p>
          <p className="mt-1 break-all rounded-lg border-[2.5px] border-ink bg-cream px-3 py-1.5 font-mono text-[0.8rem] font-bold text-ink">
            {sentTo}
          </p>
        </div>

        {/* Typos are the whole reason this exists: someone who mistyped their
            address sees a confirmation for mail they will never get, and needs
            a way out that is not "take the test again".

            IT PUTS THE FORM BACK, NOT THE BLUR. Once a message has left, the
            results below stay where they are for the rest of the visit — see
            the latch in ./gated-results.tsx. Re-hiding a score somebody has
            already paid for, because they want to correct the address it was
            paid to, would punish exactly the recovery this button is for. */}
        <div className="mt-4 flex flex-col gap-2">
          <Button
            variant="paper"
            size="md"
            onClick={() => void send(sentTo, true)}
            disabled={capped}
            className="w-full"
          >
            Send it again
          </Button>
          <button
            type="button"
            onClick={() => {
              setStatus("idle");
              setError(null);
              setEmail("");
              requestAnimationFrame(() => inputRef.current?.focus());
            }}
            className="min-h-11 cursor-pointer text-center text-xs font-bold uppercase tracking-wide text-ink/60 underline decoration-2 underline-offset-2"
          >
            Wrong address? Use a different one
          </button>
        </div>

        <Footnote />
        <StartOver onRestart={onRestart} />
      </Card>
    );
  }

  /* -- the form ------------------------------------------------------------- */
  return (
    <Card>
      <h2 className="text-balance font-display text-[clamp(1.5rem,6vw,2rem)] uppercase leading-[1.05] tracking-[-0.01em]">
        {copy.title}
      </h2>
      <p className="mt-2 text-pretty text-[0.95rem] font-semibold leading-snug text-ink/75">
        {copy.body}
      </p>

      <form
        onSubmit={handleSubmit}
        noValidate
        // Belt and braces on session-replay masking: maskAllInputs already masks
        // the value, and data-ph-mask masks any text inside too.
        data-ph-mask
        className="mt-4 flex flex-col gap-3"
      >
        <label htmlFor={inputId} className="eyebrow text-ink">
          {copy.label}
        </label>
        <input
          ref={inputRef}
          id={inputId}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder={copy.placeholder}
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
          onChange={(e) => {
            if (!startedRef.current && e.target.value.length > 0) {
              startedRef.current = true;
              trackEmailCaptureStarted();
            }
            setEmail(e.target.value);
            if (status === "error") {
              setStatus("idle");
              setError(null);
            }
          }}
          className={cn(
            // Flat, like every other surface in the flow. The CARD it sits in is the
            // elevated thing; a field inside an elevated card does not need its own
            // depth, and the flat-flow rule would strip it anyway.
            "h-14 w-full rounded-full border-[2.5px] bg-paper px-5 text-base font-medium text-ink",
            "placeholder:text-ink/40 disabled:cursor-not-allowed disabled:opacity-60",
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
          disabled={submitting || capped}
          aria-busy={submitting}
          className="w-full"
        >
          {submitting ? (
            <>
              <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              Sending&hellip;
            </>
          ) : (
            copy.cta
          )}
        </Button>
      </form>

      <Footnote />
    </Card>
  );
}

/**
 * The way out, and deliberately the smallest thing on the card.
 *
 * ===========================================================================
 * IT ONLY EXISTS AFTER THE SEND HAS SUCCEEDED
 * ===========================================================================
 * It used to render under the form as well, and a grade-3 child who had just
 * scored a perfect 15 out of 15 — the most shareable result this product can
 * produce — pressed it five seconds after the gate appeared. The control
 * worked. It was simply the one they chose, because it was sitting next to the
 * request for their parent's address at the exact moment the result was worth
 * the most. Offering "throw this away" beside "tell us where to send it" makes
 * the two read as a pair of equal options, and it costs conversions.
 *
 * So the form now has one next step and no alternative to it. Retaking stays
 * possible, but on the confirmation below, where the attempt has already been
 * banked and starting again costs nothing.
 *
 * It is a text button rather than a filled one because the confirmation already
 * has a paper secondary above it, and a second button-shaped object turns a
 * single obvious next step into a menu. Still a full 44px target: quiet is not
 * the same as fiddly.
 */
function StartOver({ onRestart }: { onRestart: () => void }) {
  return (
    <div className="mt-1 flex justify-center">
      <button
        type="button"
        onClick={onRestart}
        className="min-h-11 cursor-pointer px-2 text-center text-xs font-bold uppercase tracking-wide text-ink/45 underline decoration-2 underline-offset-2 transition-colors hover:text-ink/70"
      >
        Start over
      </button>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      /*
       * A modal lifting off deliberately blurred content: the depth is what
       * says "this is on top and it is the thing to deal with". Nothing strips
       * it, since the flat scope is now only on the question surfaces.
       *
       * It keeps the lift after the send too, where there is no longer a blur
       * under it. That is right rather than leftover: this card is still the
       * transaction the screen is about, and it is one of the two documented
       * exemptions from the flat rule (the other being the quit modal), so
       * dropping the shadow here would be the change that needs arguing for.
       */
      className="w-full max-w-sm rounded-2xl border-[2.5px] border-ink bg-paper p-5 shadow-hard-lg sm:p-6"
    >
      {children}
    </div>
  );
}

/**
 * The legal line under the email box.
 *
 * ===========================================================================
 * THIS IS NOT DECORATION AND IT IS NOT OPTIONAL
 * ===========================================================================
 * The v3 flow has no site footer, so the links the footer used to carry have
 * to live somewhere, and the right somewhere for a privacy policy is exactly
 * where the collection happens. Two reasons it matters more here than it did
 * on the waitlist page:
 *
 *   1. This is the end of a flow that CHILDREN use, and the address being
 *      asked for on that branch belongs to their grown-up. A policy a parent
 *      has to go hunting for is a policy they will not read at the moment they
 *      are deciding.
 *   2. Apple's reviewer opens /privacy directly from the listing, so the site
 *      has to offer a reachable path to it. With the footer gone, this is the
 *      path.
 *
 * Privacy, Terms and Support, in that order: Privacy because it governs what
 * we are about to do with the address, Terms because it is the other half of
 * the agreement, and Support because it is where a deletion request goes and
 * the policy tells people to use it. Discreet by design — a quiet line, not a
 * reinstated footer.
 */
function Footnote() {
  const link =
    "font-bold text-ink underline decoration-2 underline-offset-2";
  return (
    <p className="mt-3 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-xs font-medium leading-snug text-ink/55">
      <a href="/privacy" className={link}>
        Privacy
      </a>
      <span aria-hidden="true">&middot;</span>
      <a href="/terms" className={link}>
        Terms
      </a>
      <span aria-hidden="true">&middot;</span>
      <a href="/support" className={link}>
        Support
      </a>
    </p>
  );
}
