/**
 * The email box over the blurred results.
 *
 * ===========================================================================
 * NOTHING IS EVER UNBLURRED IN PLACE
 * ===========================================================================
 * Submitting an address does not reveal the results on this page. It sends an
 * email containing a link, and the link opens the real results page. The blur
 * stays; the box turns into a "go and check your inbox" confirmation.
 *
 * That is the point of the design rather than an inconvenience in it. If the
 * email is the ONLY way to see the score, then a junk address gets the person
 * nothing, so the addresses that come out of this are addresses that work. An
 * unblur-on-submit gate collects `a@a.com` all day and cannot tell.
 *
 * THE COPY SAYS SO, PLAINLY, because it is true. An in-place reveal shipped
 * for part of one afternoon and was taken back out (see the note in
 * ./gated-results.tsx); while it existed this line was softened to "so you
 * keep them after this tab is gone", which was the honest wording THEN. The
 * claim below is the honest wording now, and the two must keep moving
 * together: a gate that overstates its own terms is worse than one that asks
 * plainly, and a gate that understates them collects throwaway addresses.
 *
 * It also means the failure path matters more than usual, which is why this
 * component has a real one: if the send fails, it says so and offers a retry.
 * It never shows "check your inbox" for a message that did not leave. Somebody
 * waiting on mail that was never sent has no way to work out what went wrong.
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

/**
 * What the last "Send it again" press did.
 *
 * ===========================================================================
 * A RESEND IS NOT A SUBMISSION AND MUST NOT SHARE ITS STATE
 * ===========================================================================
 * It used to. `send` set `status` to "submitting" whichever button called it,
 * and since the confirmation only renders while `status` is "sent", every
 * resend UNMOUNTED the confirmation, showed the empty form for as long as the
 * request took, and then put the confirmation back. Measured on the real
 * screen: a 112ms flash to a form nobody asked for, ending on a card identical
 * to the one they started with.
 *
 * That is a dead button. The person who presses it is, by definition, someone
 * who thinks their mail has not arrived, and the answer they got was a flicker.
 * The one in the incident pressed again a second later and PostHog logged it as
 * a `$dead_click`, which is the instrumentation agreeing.
 *
 * So the resend keeps its own state, the confirmation stays mounted throughout,
 * and every outcome says what it was — including the suppressed one, which is
 * not a failure and must not be dressed as one.
 */
type ResendState =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent" }
  /** The server refused a repeat inside its dedupe window. Nothing went wrong. */
  | { kind: "already" }
  | { kind: "failed"; message: string };

/** What one call to the send endpoint did. */
type SendOutcome =
  | { ok: true; deduped: boolean }
  | { ok: false; message: string };

const COPY = {
  adult: {
    title: "Where should we send it?",
    body: "We will email you a link to your full results. It is the only way to see them.",
    label: "Your email",
    placeholder: "you@example.com",
    cta: "Email me my results",
    sentTitle: "Check your email",
    sentBody: "Your results are on their way. Open the link in the email to see them.",
    /*
     * THE RECOVERY BLOCK, WHICH IS A MINORITY PATH AND NOW READS LIKE ONE.
     *
     * The prompt is what turns two controls into an offer: it names the
     * situation they are for, so nobody has to work out from a bare button
     * whether pressing it is the next step. It is also what stands between
     * the eye and those controls, which is the point — see the note on the
     * confirmation layout below.
     */
    resendPrompt: "Not in your inbox? Mail can take a minute to arrive.",
    resentNote: "Sent again. Check your inbox.",
    // Names the actual rule rather than shrugging. Somebody who just pressed a
    // button and got "ok!" has learned nothing; somebody told we will not send
    // the same thing twice in a minute knows why, and knows what to do next.
    alreadyNote:
      "Already on its way. We do not send the same results twice in a minute, so give it a moment to land.",
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
      "Ask your parent to check their email. The link in it shows your results.",
    resendPrompt: "Not there yet? Email can take a minute.",
    resentNote: "Sent again! Ask your parent to look.",
    alreadyNote:
      "It is already on its way. We only send it once a minute, so give it a moment.",
  },
} as const;

export interface EmailGateProps {
  audience: Audience;
  testId: string;
  source: string;
  /** The stored result's token. Null until the server has created the record. */
  token: string | null;
  /**
   * A message has genuinely left, so there is now a link worth remembering.
   *
   * It reveals NOTHING on this screen. Its only consumer is the browser-local
   * pointer behind ./saved-result-offer.tsx, and it is called on exactly one
   * branch — after the API has confirmed the send, next to the confirmation
   * this card shows. A validation failure, a capped result, a rejected
   * provider and a dead network all miss it, which is what keeps the offer
   * from pointing at a result whose owner never got the mail. Fires again on
   * a second address, which is harmless: it overwrites with the same token.
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
  /** The outcome of the last "Send it again". See ResendState. */
  const [resendState, setResendState] = useState<ResendState>({ kind: "idle" });

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

  /**
   * One call to the endpoint, with the analytics that belong to it and no
   * opinion about the UI. Both buttons go through here; what they do with the
   * answer is their own business, which is the whole reason it is split out.
   */
  async function postSend(address: string, isResend: boolean): Promise<SendOutcome> {
    try {
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
        if (data?.code === "send_cap") setCapped(true);
        trackTestEmailSendFailed({
          test_id: testId,
          audience,
          code: data?.code ?? "unknown",
        });
        return {
          ok: false,
          message: data?.error ?? "That didn't go through. Give it another shot.",
        };
      }

      /*
        ONLY A MESSAGE THAT LEFT IS REPORTED AS ONE. The server suppresses a
        repeat of a send it made moments ago (see SEND_DEDUPE_WINDOW_MS in
        lib/test/result-store.ts) and says so. The confirmation is still right —
        results are on their way to that address — but counting the suppressed
        attempt would inflate the exact number this bug was diagnosed from.
      */
      if (!data.deduped) trackTestEmailSent({ test_id: testId, audience, resend: isResend });
      return { ok: true, deduped: data.deduped === true };
    } catch {
      trackTestEmailSendFailed({ test_id: testId, audience, code: "network" });
      return {
        ok: false,
        message: "Couldn't reach the server. Check your connection and try again.",
      };
    }
  }

  /** The typed submission. Owns `status`, and is the only thing that reports a send. */
  async function submit(address: string) {
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
      trackTestEmailSubmitted({ test_id: testId, audience, source });

      const outcome = await postSend(address, false);
      if (!outcome.ok) {
        setStatus("error");
        setError(outcome.message);
        return;
      }

      setSentTo(address);
      setResendState({ kind: "idle" });
      setStatus("sent");
      onSent();
    } finally {
      sendingRef.current = false;
    }
  }

  /**
   * "Send it again". Never touches `status`, so the confirmation stays on
   * screen for the whole round trip and the answer lands next to the button
   * that asked for it.
   */
  async function resend() {
    if (sendingRef.current || !sentTo) return;
    sendingRef.current = true;

    try {
      setResendState({ kind: "sending" });
      trackTestResendRequested({ test_id: testId, audience });

      const outcome = await postSend(sentTo, true);
      setResendState(
        !outcome.ok
          ? { kind: "failed", message: outcome.message }
          : outcome.deduped
            ? { kind: "already" }
            : { kind: "sent" },
      );
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
    void submit(trimmed);
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
          {/*
            THE TICK SITS BESIDE THE HEADLINE, NOT ABOVE IT, and that is a
            budget decision rather than a stylistic one. Stacked, the mark and
            its gap spent 56px of card height on decoration, and every pixel
            spent above the recovery block pushes everything below it further
            down. The first draft of that block cost 49px and shifted "Start
            over" — the one control here that throws the attempt away — down
            into the band the submit button had occupied on the viewport being
            measured. Reclaiming this space put the card at 426px against the
            429px it replaces, so nothing below it moved down at all and no
            screen is worse off than before.

            The measurement is what this rests on, and it survives the reveal
            being taken back out: both numbers are heights of THIS card, and
            neither depended on what was underneath it.
          */}
          <div className="flex items-center justify-center gap-2.5">
            <span
              aria-hidden="true"
              className="grid size-9 shrink-0 place-items-center rounded-full border-[2.5px] border-ink bg-mint text-base font-black"
            >
              &#10003;
            </span>
            <h2 className="text-balance font-display text-[clamp(1.5rem,6vw,2rem)] uppercase leading-[1.05] tracking-[-0.01em]">
              {copy.sentTitle}
            </h2>
          </div>
          <p className="text-pretty text-[0.95rem] font-semibold leading-snug text-ink/75">
            {copy.sentBody}
          </p>
          <p className="mt-1 break-all rounded-lg border-[2.5px] border-ink bg-cream px-3 py-1.5 font-mono text-[0.8rem] font-bold text-ink">
            {sentTo}
          </p>
        </div>

        {/*
          ===================================================================
          THE RECOVERY BLOCK, BELOW A RULE AND BELOW A REASON
          ===================================================================
          "Send it again" used to be a 331px full-width bordered button
          sitting directly under the confirmation, which made it the loudest
          thing on the card — the same full-width weight the submit button had
          carried a second earlier. On a screen whose actual payload is the
          score underneath, the most emphatic control was the one that mails a
          duplicate, and somebody duly pressed it two and a half seconds after
          their mail was already in flight.

          It is 157px now: same 44px target, half the width, under a line that
          says when to use it. The divider is doing real work rather than
          decorating — it puts a band of nothing between where the eye lands
          and anything that fires a request.

          DO NOT REACH FOR GEOMETRY TO FIX A DUPLICATE SEND. The tempting
          theory is that this button inherits the submit button's screen
          position and catches a stray second tap. It was briefly true that
          the layout ruled that out — while the in-place reveal existed the
          page grew to several thousand pixels, the shell stopped centring and
          the card jumped to the top. The reveal is gone, so that argument is
          gone with it: this screen is one card again, centred, and the two
          controls sit within a card-height of each other on any viewport.

          Which changes nothing about the fix, because position was never the
          defence. A layout that clears one screen's danger band does not
          clear another's, and the card moves with viewport height anyway. The
          two things that actually hold are the server's dedupe claim (see
          SEND_DEDUPE_WINDOW_MS in lib/test/result-store.ts) and the fact that
          every press below answers in the slot the prompt occupies.

          Both exits are still here and still labelled. Burying them would
          swap a duplicate email for somebody with a mistyped address and no
          way back, which is the worse trade. Quieter, not hidden.

          Typos are the whole reason the second one exists: someone who
          mistyped sees a confirmation for mail they will never get, and needs
          a way out that is not "take the test again".
        */}
        <div className="mt-5 border-t-[2.5px] border-dashed border-ink/15 pt-5">
          {/*
            ONE SLOT, TWO JOBS, AND THE ANSWER LANDS WHERE THE QUESTION WAS.
            ===================================================================
            At rest this says when the controls below are for. After a press it
            says what the press did, replacing the prompt rather than stacking
            under the buttons — which is both why the card barely grows and why
            the sentence cannot be misread as belonging to whichever control
            happens to sit above it.

            The live region is the slot itself, present from first render and
            never unmounted, so a replacement is announced. A region that
            appears at the same instant as its content frequently is not, and
            the entire point of this element is that somebody who is not
            looking at the screen still learns what happened.

            Three outcomes, three appearances. A suppressed ask is NOT tinted
            like a failure: nothing went wrong, and colouring it red would tell
            somebody their results are lost at the exact moment they are in
            flight.
          */}
          <div role="status" aria-live="polite">
            {resendState.kind === "idle" || resendState.kind === "sending" ? (
              <p className="text-pretty text-center text-xs font-semibold leading-snug text-ink/55">
                {copy.resendPrompt}
              </p>
            ) : (
              <p
                className={cn(
                  "text-pretty rounded-lg border-[2.5px] border-ink px-3 py-2 text-center text-xs font-semibold leading-snug",
                  resendState.kind === "failed" ? "bg-coral" : "bg-cream",
                )}
              >
                {resendState.kind === "sent"
                  ? copy.resentNote
                  : resendState.kind === "already"
                    ? copy.alreadyNote
                    : resendState.message}
              </p>
            )}
          </div>

          <div className="mt-3 flex flex-col items-center gap-1">
            {/*
              `md` rather than `sm`, and auto-width rather than `w-full`. The
              demotion this button needed was in WIDTH and weight, not in
              height: `sm` is 36px, and the rule the rest of this card keeps —
              see StartOver below — is that a quiet control is still a 44px
              target. Fiddly is not the same as understated.
            */}
            <Button
              variant="paper"
              size="md"
              onClick={() => void resend()}
              disabled={capped || resendState.kind === "sending"}
              aria-busy={resendState.kind === "sending"}
            >
              {resendState.kind === "sending" ? "Sending…" : "Send it again"}
            </Button>
            <button
              type="button"
              onClick={() => {
                setStatus("idle");
                setError(null);
                setEmail("");
                setResendState({ kind: "idle" });
                requestAnimationFrame(() => inputRef.current?.focus());
              }}
              className="min-h-11 cursor-pointer px-2 text-center text-xs font-bold uppercase tracking-wide text-ink/60 underline decoration-2 underline-offset-2"
            >
              Wrong address? Use a different one
            </button>
          </div>
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
