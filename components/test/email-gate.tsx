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
    resentNote: "Sent again. Check your inbox.",
    /*
     * Names the actual rule rather than shrugging. Somebody who just pressed a
     * button and got "ok!" has learned nothing; somebody told we will not send
     * the same thing twice inside a window knows why, and knows what to do next.
     *
     * THE NUMBER HERE IS A COPY OF SEND_DEDUPE_WINDOW_MS in
     * lib/test/result-store.ts, and it cannot be imported: that module is
     * `server-only`, and this is a client component. So the two are held
     * together by scripts/verify-send-recovery.mjs, which fails if this string
     * stops agreeing with the constant. A product that misstates its own rule
     * is the failure being guarded against — the window moved from one minute
     * to fifteen and these strings still said "a minute".
     */
    alreadyNote:
      "Already on its way. We do not send the same results twice within 15 minutes, so give it a moment to land.",
  },
  /*
   * PARENT, NOT ADULT, ON THIS BRANCH.
   *
   * The reason we ask for an adult's address rather than the child's is the
   * PARENTAL relationship specifically, and "an adult" is vague enough to
   * mean any adult at all. "Parent" states who should actually be receiving a
   * child's test results, which is the posture /privacy takes too.
   *
   * The FIELD LABEL says "Parent or guardian's" because guardians,
   * grandparents and foster carers are real, and the label is the one place
   * precision beats brevity. Headline and body stay at "parent", which an
   * eight-year-old reads without effort.
   *
   * NOTE THE OPPOSITE RULE on the opening fork, which says "I'm an adult" and
   * should: that card is an adult self-identifying in order to take the test,
   * and plenty of them have no children. Parent language for who RECEIVES a
   * child's results; audience language for who is TAKING the test.
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
    resentNote: "Sent again! Ask your parent to look.",
    /** Same rule as the adult string above, and held to the same constant. */
    alreadyNote:
      "It is already on its way. We only send it once every 15 minutes, so give it a moment.",
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
}

export function EmailGate({ audience, testId, source, token, onSent }: EmailGateProps) {
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
          THE RECOVERY BLOCK: TWO EXITS, AND NOTHING ELSE
          ===================================================================
          "Send it again" used to be a 331px full-width bordered button
          sitting directly under the confirmation, which made it the loudest
          thing on the card — the same full-width weight the submit button had
          carried a second earlier. On a screen whose actual payload is the
          score underneath, the most emphatic control was the one that mails a
          duplicate, and somebody duly pressed it two and a half seconds after
          their mail was already in flight.

          It is 157px now: same 44px target, half the width.

          WHAT USED TO SEPARATE IT AND WHAT DOES NOW. A dashed rule and a line
          of prompt copy ("Not in your inbox? Mail can take a minute to
          arrive.") used to sit between the confirmation and these controls,
          putting a band of nothing between where the eye lands and anything
          that fires a request. Both were removed at the owner's request. The
          separation is now carried by spacing alone, and the gap the rule
          occupied was closed rather than left behind as a hole — an empty
          40px band is what a divider looks like after somebody deletes only
          the border.

          DO NOT REACH FOR GEOMETRY TO FIX A DUPLICATE SEND, which is why
          losing the rule costs less than it looks. The tempting theory is
          that this button inherits the submit button's screen position and
          catches a stray second tap; position was never the defence. What
          actually holds is the server's dedupe claim, and that claim got
          fifteen times stronger in the same change that removed the rule —
          see SEND_DEDUPE_WINDOW_MS in lib/test/result-store.ts, now fifteen
          minutes rather than one.

          Both exits are still here and still labelled. Burying them would
          swap a duplicate email for somebody with a mistyped address and no
          way back, which is the worse trade. Quieter, not hidden.

          Typos are the whole reason the second one exists: someone who
          mistyped sees a confirmation for mail they will never get, and needs
          a way out that is not "take the test again". THERE IS NO LONGER A
          THIRD EXIT: "Start over" is gone from this card entirely, because
          restarting the test is not something a results screen should offer.
        */}
        <div className="mt-5">
          {/*
            THE ANSWER LANDS WHERE THE QUESTION WAS ASKED.
            ===================================================================
            This slot is empty at rest. After a press it carries what the press
            did, appearing above the control that caused it rather than
            stacking underneath — so the sentence cannot be misread as
            belonging to whichever button happens to sit above it.

            It used to hold prompt copy at rest, which also meant the card did
            not change height when an outcome replaced it. With the prompt
            removed the card grows by a line when something is announced; that
            is the direct cost of the removal and is preferred to reserving an
            empty band, which is the gap we were asked to close.

            THE LIVE REGION IS THE SLOT, not the message. It is present from
            first render and never unmounted, so content arriving into it is
            announced. A region that appears at the same instant as its content
            frequently is not, and the entire point of this element is that
            somebody who is not looking at the screen still learns what
            happened.

            A suppressed ask is NOT tinted like a failure: nothing went wrong,
            and colouring it red would tell somebody their results are lost at
            the exact moment they are in flight. A genuine failure IS tinted,
            and on this card that includes the honest quota message from the
            send route — which is long, wraps to three lines, and is meant to.
          */}
          <div role="status" aria-live="polite">
            {resendState.kind === "idle" || resendState.kind === "sending" ? null : (
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

          {/*
            The margin is on the controls and is conditional, so an empty slot
            takes up no room at all. A fixed `mt-3` here would reintroduce a
            smaller version of the gap that was just removed.
          */}
          <div
            className={cn(
              "flex flex-col items-center gap-1",
              resendState.kind !== "idle" && resendState.kind !== "sending" && "mt-3",
            )}
          >
            {/*
              `md` rather than `sm`, and auto-width rather than `w-full`. The
              demotion this button needed was in WIDTH and weight, not in
              height: `sm` is 36px, and the rule this card keeps is that a
              quiet control is still a 44px target. Fiddly is not the same as
              understated.
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

      <CollectionNotice />
      <Footnote />
    </Card>
  );
}

/**
 * What this address will be used for, said where it is typed.
 *
 * ===========================================================================
 * THIS IS WHAT MAKES /privacy TRUE RATHER THAN ASPIRATIONAL
 * ===========================================================================
 * The policy allows the occasional note about our own app to addresses given
 * from 12 August 2026 onward. A permission granted in a document nobody opens,
 * attached to a form that mentions only the results, describes a product we do
 * not ship. Consent is given at the box, not on the legal page, so the box has
 * to say it.
 *
 * IT RENDERS ONLY ON THE FORM, not on the confirmation. Notice given after the
 * address has been handed over is not notice, and the confirmation card is
 * already carrying the "we sent it to this address" job.
 *
 * ONE SENTENCE, AND THE RESULTS COME FIRST. The results are what the person is
 * here for and what the address is chiefly for; the notes are the secondary
 * thing being disclosed. Leading with the secondary thing would read as a
 * newsletter signup wearing a results gate, which is both a worse description
 * and a worse conversion.
 *
 * THE WORDING WORKS ON BOTH BRANCHES. On the child branch the reader is the
 * parent whose address this is, so "you" is correct there without a second
 * string to keep in sync.
 */
function CollectionNotice() {
  return (
    <p className="mt-3 text-center text-xs font-medium leading-snug text-ink/55">
      We use this to send the results, and now and then to tell you about our
      app. You can stop that any time.
    </p>
  );
}

/*
 * ===========================================================================
 * THERE IS NO "START OVER" ON THIS CARD, AND THE PROP IS GONE WITH IT
 * ===========================================================================
 * It had already been pushed once. It used to render under the FORM as well,
 * and a grade-3 child who had just scored a perfect 15 out of 15 — the most
 * shareable result this product can produce — pressed it five seconds after
 * the gate appeared. Offering "throw this away" beside "tell us where to send
 * it" makes the two read as a pair of equal options, and it cost conversions.
 * So it moved to the confirmation, where the attempt had already been banked.
 *
 * It is now removed from the confirmation too: restarting the test is not
 * something a results screen should offer at all. The `onRestart` prop went
 * with it rather than being left plumbed through three components to nothing,
 * so ./gated-results.tsx and ./test-flow.tsx no longer pass one.
 *
 * RESTARTING IS STILL POSSIBLE and this did not orphan anyone. `reset` in
 * ./test-flow.tsx still backs the in-test quit control and the "Something went
 * sideways" escape hatch, which is the one screen that would otherwise be a
 * dead end.
 */

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
