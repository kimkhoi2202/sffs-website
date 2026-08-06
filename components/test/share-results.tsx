/**
 * Getting a result off this page and onto somebody else's screen.
 *
 * ===========================================================================
 * ONE BUTTON, STRAIGHT INTO THE OS SHEET
 * ===========================================================================
 * There was a sheet of our own here: eight destinations, per-app copy, and a
 * `destination` property on every event. It has been removed on purpose, and
 * the reasoning is recorded because the arguments for it were real and will
 * occur to the next person too.
 *
 * What it bought was per-destination BEHAVIOUR (a Story-specific route into
 * Instagram, our text pre-filled in X's composer) and per-destination
 * REPORTING. What it cost was a chooser in front of the chooser: two taps to
 * reach the thing every phone already has a button for, and six destinations
 * we had to maintain against other people's URL schemes. The owner's call was
 * that the OS sheet reaches more places than our list ever will — "so I can
 * send it anywhere" — and that a picture in the OS sheet gets to Instagram,
 * WhatsApp and the rest by itself.
 *
 * THE COST IS ACCEPTED AND IS NOT A BUG TO FIX LATER. `navigator.share()`
 * deliberately does not say which app was chosen; that is a privacy property
 * of the API, not a gap. So there is no `destination` on these events any
 * more, and any funnel that broke it down by destination stops splitting from
 * the day this shipped. Do not reintroduce a sheet to win the property back.
 *
 * ===========================================================================
 * THE IMAGE IS THE PRODUCT, NOT THE LINK
 * ===========================================================================
 * Traffic arrives from TikTok and Instagram, and on both a link is close to
 * useless: not tappable in feed, and not in a Story without a swipe-up nobody
 * has. What spreads there is a SCREENSHOT. So the payload carries the
 * 1080x1920 PNG wherever the browser will take one, and the link rides along
 * for the places links do work. A file in the sheet is also what makes the
 * OS offer Instagram and WhatsApp at all, which is how the destinations the
 * old sheet listed survive its removal.
 *
 * CAPABILITY IS CHECKED, NOT ASSUMED. Plenty of browsers have
 * `navigator.share` and cannot take a file — every one of them would throw on
 * a `files` payload — so `canShare({ files })` decides, with the real file,
 * and anything that says no gets the link on its own instead.
 *
 * That check used to be capability AND a coarse pointer, on the measured
 * ground that desktop Chrome takes the PNG happily while the macOS picker
 * offers Messages and Mail, where a link is what travels. The pointer half is
 * gone with the sheet: it was only defensible while "Save the picture" sat in
 * our own list as the desk-bound way to get the image, and there is no list
 * now. Windows and ChromeOS present a real sheet on a fine pointer and can
 * take the file, and denying them the picture to spare macOS a menu it will
 * ignore is the worse trade.
 *
 * ===========================================================================
 * WHAT WENT WRONG BEFORE, SO IT DOES NOT AGAIN
 * ===========================================================================
 * Two lock-ups were fixed on this control, and REMOVING THE SHEET PUTS EVERY
 * DESKTOP USER ON THE PATH THAT CAUSED THEM. Both fixes are still here and
 * both are load-bearing.
 *
 *   1. A `busy` flag disabled the card, was cleared in a `finally` attached to
 *      `navigator.share()`, and that promise does not always settle. The card
 *      stayed dead until a reload.
 *   2. The same `finally` released the re-entry ref, so when the promise never
 *      settled the flag stayed true for the life of the page and every
 *      subsequent press returned immediately, silently.
 *
 * Three rules come out of that and all three are still below:
 *
 *   NEVER GATE THE UI ON A PROMISE THE OS OWNS. Nothing this component does
 *   after calling `share()` depends on it answering. The re-entry guard is
 *   released by the watchdog as well as by the `finally`, because the watchdog
 *   is the only one of the two that runs when the promise hangs.
 *
 *   NEVER BE SILENT. Every path changes something visible within a frame of
 *   the tap, and the fetch has its own label.
 *
 *   FETCH BEFORE THE TAP WHERE POSSIBLE. The card is pulled on first hover,
 *   focus or touch, so by the time the button is pressed it is usually already
 *   in hand. That also protects the iOS case, where a long await between the
 *   gesture and `share()` can cost the transient activation the call needs.
 */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import {
  trackTestResultShareCompleted,
  trackTestResultShareDismissed,
  trackTestResultShareFailed,
  trackTestResultShareInitiated,
} from "@/lib/analytics/events";
import { beatUrlFor, shareCardPathFor } from "@/lib/test/share-url";
import type { Audience } from "@/lib/test/types";
import { cn } from "@/lib/utils";

/** How long a confirmation stays up before the control goes back to normal. */
const CONFIRM_MS = 2600;

/** A cold Satori render is slow; an unbounded one is a hung button. */
const CARD_TIMEOUT_MS = 12_000;

/**
 * How long to wait for the OS sheet to show itself before assuming it never
 * will. See the watchdog in `runNativeShare` for why this is not just a timeout.
 */
const SHEET_WATCHDOG_MS = 2000;

const SHARE_TEXT = "I took the Official Smart Fella Test. Think you can beat me?";
const SHARE_TITLE = "The Official Smart Fella Test";
const CARD_FILENAME = "smart-fella-or-fart-smella.png";

/**
 * Can this browser put a FILE into the share sheet AT ALL?
 *
 * Asked with a four-byte dummy rather than the real card, because the answer
 * depends on the MIME type and not the bytes, and fetching 600KB to find out
 * whether we are allowed to send it would be the wrong way round. The real
 * file is asked about again at the call site, which is the answer that counts.
 *
 * Called from event handlers only, never during render: `navigator.share`
 * exists on the client and not on the server, so reading it in a render would
 * be a hydration mismatch waiting for a browser that has it.
 */
function canShareFiles(): boolean {
  if (typeof navigator === "undefined") return false;
  if (typeof navigator.share !== "function") return false;
  if (typeof navigator.canShare !== "function") return false;
  try {
    const probe = new File([new Uint8Array([137, 80, 78, 71])], "probe.png", {
      type: "image/png",
    });
    return navigator.canShare({ files: [probe] });
  } catch {
    return false;
  }
}

export function ShareResults({
  token,
  testId,
  audience,
  verdict,
}: {
  token: string;
  testId: string;
  audience: Audience;
  /** The verdict band id, for analytics. Never rendered. */
  verdict: string;
}) {
  /** True only while the card is being fetched. Never while the OS holds a sheet. */
  const [fetching, setFetching] = useState(false);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const timerRef = useRef<number | null>(null);
  const runningRef = useRef(false);
  const cardRef = useRef<Promise<File> | null>(null);

  useEffect(() => () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
  }, []);

  const confirm = useCallback((message: string) => {
    setConfirmation(message);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setConfirmation(null), CONFIRM_MS);
  }, []);

  /**
   * The card, fetched at most once and remembered.
   *
   * Kicked off on hover, focus or touch so the click usually finds it already
   * resolved. A failed attempt clears the memo so the next try is a real
   * retry rather than a replay of the same rejection.
   */
  const loadCard = useCallback((): Promise<File> => {
    if (cardRef.current) return cardRef.current;
    const p = (async () => {
      const controller = new AbortController();
      const t = window.setTimeout(() => controller.abort(), CARD_TIMEOUT_MS);
      try {
        const res = await fetch(shareCardPathFor(token), { signal: controller.signal });
        if (!res.ok) throw new Error(`share card responded ${res.status}`);
        const blob = await res.blob();
        return new File([blob], CARD_FILENAME, { type: "image/png" });
      } finally {
        window.clearTimeout(t);
      }
    })();
    p.catch(() => {
      cardRef.current = null;
    });
    cardRef.current = p;
    return p;
  }, [token]);

  /** Only worth 600KB if the sheet could actually carry it. */
  const prefetch = useCallback(() => {
    if (!canShareFiles()) return;
    void loadCard().catch(() => {});
  }, [loadCard]);

  /* -- the analytics shape ------------------------------------------------- */

  /*
    NO `destination` PROPERTY ANY MORE, AND NOTHING SHOULD PUT ONE BACK.

    While there was a sheet, every event carried where the person had chosen
    to send their result. The OS sheet cannot answer that question — see the
    note at the top — so a `destination` on these events could only ever
    repeat `mechanism`, which is already there. A property that is a copy of
    another property is worse than no property: it reads like a second fact.

    What is left is the four outcomes, and they are what made today's two
    diagnoses possible: a press was recorded, and so was how it ended.

    Memoised so it can be an honest dependency of the callbacks below rather
    than an excuse for a lint suppression in each of them.
  */
  const base = useMemo(
    () => ({ test_id: testId, audience, verdict }),
    [testId, audience, verdict],
  );

  /* -- what the button actually does --------------------------------------- */

  /**
   * Copy, without the `initiated` event.
   *
   * Split out because this is also the LANDING PLACE when a share fails, and a
   * fallback must not file a second intent for a tap that was already counted.
   * That is the exact defect this codebase found once before on ShareToChild,
   * where three exits reported two.
   *
   * `okMessage` is how the caller says WHY the clipboard is what happened. A
   * bare "Link copied" after a sheet that never appeared explains nothing.
   *
   * ALWAYS FILED AS `copy_link`, on both branches, because that is how the
   * share actually resolved. When this is a fallback, the native attempt has
   * already filed its own `failed` with the reason it fell back, so the pair
   * reads in order: the sheet did not work, and then the clipboard did.
   *
   * IT CAN ITSELF FAIL, and on the fallback paths it is quite likely to: the
   * gesture's transient activation is spent by then, and `writeText` refuses
   * without it. That is why the catch says something rather than shrugging —
   * a share that got the person nowhere is the one outcome worth seeing.
   */
  const copyCore = useCallback(
    async (okMessage = "Link copied") => {
      const url = beatUrlFor(token, window.location.origin, "copy_link");
      try {
        await navigator.clipboard.writeText(url);
        confirm(okMessage);
        trackTestResultShareCompleted({ ...base, mechanism: "copy_link" });
      } catch {
        confirm("Could not copy. Copy it from the address bar instead.");
        trackTestResultShareFailed({ ...base, mechanism: "copy_link", reason: "clipboard" });
      }
    },
    [token, confirm, base],
  );

  /**
   * No Web Share API here at all: the clipboard is the whole interaction.
   *
   * Taken FIRST rather than after a failed sheet, so it runs inside the
   * gesture with its activation intact, which is what makes it instant.
   */
  const runCopy = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    trackTestResultShareInitiated({ ...base, mechanism: "copy_link" });
    try {
      await copyCore();
    } finally {
      runningRef.current = false;
    }
  }, [copyCore, base]);

  /**
   * Hand the result to the OS.
   *
   * `setFetching(false)` happens BEFORE the sheet is opened, deliberately. See
   * the note at the top: the sheet's promise belongs to the operating system,
   * and the first version of this file bricked the card by making the enabled
   * state depend on it settling.
   */
  const runNativeShare = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    trackTestResultShareInitiated({ ...base, mechanism: "native_sheet" });

    const url = beatUrlFor(token, window.location.origin, "native_sheet");
    /*
      No `title` alongside `files`. Targets that take a file generally ignore
      it, and the ones that do not show it as a second line above text that
      already says the same thing. Without a file it is what names the share
      in a mail subject, so it stays on that branch.
    */
    let payload: ShareData = { title: SHARE_TITLE, text: SHARE_TEXT, url };

    if (canShareFiles()) {
      setFetching(true);
      try {
        const file = await loadCard();
        // Asked again, with the REAL file. The probe above answers for PNGs in
        // general; this answers for this one, including any size limit.
        if (navigator.canShare?.({ files: [file] })) {
          payload = { files: [file], text: SHARE_TEXT, url };
        }
      } catch {
        // The card did not render or did not arrive. The link is still worth
        // sharing, so this degrades instead of failing the tap.
        trackTestResultShareFailed({
          ...base,
          mechanism: "native_sheet",
          reason: "card_fetch",
        });
      } finally {
        setFetching(false);
      }
    }

    /*
      THE WATCHDOG, AND WHY IT IS NOT JUST A TIMEOUT.

      `navigator.share()` can be called successfully and then simply never
      settle: measured on desktop Chrome, and reproducible on any device where
      the OS declines to present a sheet. With our own sheet gone this is no
      longer a corner that one item in a menu could reach — it is the ONLY
      path every desktop visitor takes, so it had better end somewhere.

      A plain timeout cannot fix it, because a sheet a person is actually
      READING also leaves the promise pending, for as long as they like.
      Firing an error at 2 seconds would cry wolf on every successful share.

      What separates the two is FOCUS. When the OS puts a sheet up, this
      document loses it. So the watchdog only acts when the promise has not
      settled AND this page still has focus and is still visible, which
      together mean no sheet was ever presented.
    */
    let settled = false;
    const watchdog = window.setTimeout(() => {
      if (settled) return;
      const noSheetAppeared =
        document.visibilityState === "visible" && document.hasFocus();
      if (!noSheetAppeared) return;
      settled = true; // the rejection that may follow is now redundant
      /*
        THE RE-ENTRY GUARD COMES OFF HERE, AND LEAVING IT ON WAS THE WHOLE BUG.

        `runningRef` is released in the `finally` below — which is attached to
        `await navigator.share(payload)`, the one promise on this page that can
        never settle. When it doesn't, that `finally` never runs, the flag stays
        true for the life of the page, and every later press returns on it. The
        button was silent forever, and it took two goes to find.

        It is the same rule the file states at the top — never gate the UI on a
        promise the OS owns — applied to the flag that was quietly exempt.
      */
      runningRef.current = false;
      trackTestResultShareFailed({
        ...base,
        mechanism: "native_sheet",
        reason: "sheet_never_opened",
      });
      // The tap has to end somewhere, and with no sheet of ours to fall back
      // into, the link on the clipboard is the somewhere.
      void copyCore("That did not open, so the link is copied instead.");
    }, SHEET_WATCHDOG_MS);

    try {
      await navigator.share(payload);
      if (settled) return;
      settled = true;
      trackTestResultShareCompleted({ ...base, mechanism: "native_sheet" });
      // The OS gives us no way to know WHICH app was picked, so this is the
      // most we can honestly say back to the person.
      confirm("Shared");
    } catch (err) {
      if (settled) return;
      settled = true;
      if (err instanceof DOMException && err.name === "AbortError") {
        // Backing out of a sheet is a normal thing to do, not a failure. It
        // still needs to say something: a dismissed sheet and a dead button
        // look identical from the outside.
        trackTestResultShareDismissed({ ...base, mechanism: "native_sheet" });
        confirm("Not shared");
      } else {
        trackTestResultShareFailed({
          ...base,
          mechanism: "native_sheet",
          reason: "share_api",
        });
        await copyCore("Sharing failed, so the link is copied instead.");
      }
    } finally {
      window.clearTimeout(watchdog);
      runningRef.current = false;
    }
  }, [token, loadCard, copyCore, confirm, base]);

  /**
   * The one control.
   *
   * The capability read is HERE rather than in the render, so the server and
   * the first client render agree and there is no hydration mismatch. A
   * browser with no Web Share API gets the clipboard, which is the only other
   * thing a web page can honestly offer.
   */
  const onShare = useCallback(() => {
    if (runningRef.current) return;
    if (typeof navigator.share === "function") void runNativeShare();
    else void runCopy();
  }, [runNativeShare, runCopy]);

  const label = fetching ? "Getting your picture" : "Share my result";

  return (
    /*
      OVERFLOW IS NOT CLIPPED AND THE PADDING IS NOT DECORATION. The control
      paints a hard offset shadow that grows from 4px to 6px on hover and
      travels up-left, so a container sized to it at rest crops the shadow the
      moment a pointer touches it. The padding is what it displaces into.

      THE BOTTOM IS TIGHTER THAN THE TOP, AND THAT IS THE POINT. This card
      reserved a 16px line under the button for a confirmation that is absent
      almost all of the time, on top of a full pad, and it read as a dead band
      below the only thing here worth pressing. Measured from the button's
      bottom edge to the card's, at rest:

        390x844    46px -> 26px
        1440x900   50px -> 28px

      Two changes get that: the status line no longer reserves height until it
      speaks, and the bottom pad is one step smaller than the rest. Verified in
      scripts/verify-share-visible.mjs so it cannot drift back.

      CREAM, WHICH IS THE FLOW'S NEUTRAL SURFACE. Not blue: blue means "the
      option you picked" everywhere else in this flow (see STATE_COLORS in
      lib/test/types.ts), and a large blue slab on the results page would be
      the only blue thing there that does not mean that. Not mint either, which
      the hand-it-to-your-kid card directly below this one already owns.
    */
    <div className="flex w-full flex-col gap-3 rounded-2xl border-[2.5px] border-ink bg-cream p-4 pb-3 shadow-hard-sm sm:p-5 sm:pb-3.5">
      <h2 className="text-balance font-display text-xl uppercase leading-none">
        Go on then, show someone
      </h2>
      <p className="text-pretty text-[0.925rem] font-semibold leading-snug text-ink/75">
        Send the picture to your story, or the link to a friend who thinks they
        are cleverer.
      </p>

      {/*
        A raw <button> with the shared variants rather than <Button>, so the
        busy state can be `aria-disabled` rather than `disabled`. A real
        `disabled` attribute blows focus off whatever is holding it, and this
        button disables itself for the second or so the card takes to arrive —
        which would drop a keyboard user onto <body> in the middle of their own
        share. `aria-disabled` says the same thing to a screen reader and stays
        focusable; re-entry is prevented by `runningRef`, which is the real
        guard either way.
      */}
      <button
        type="button"
        onClick={onShare}
        onPointerEnter={prefetch}
        onFocus={prefetch}
        onTouchStart={prefetch}
        aria-disabled={fetching || undefined}
        className={cn(
          buttonVariants({ variant: "paper", size: "lg" }),
          "w-full aria-disabled:cursor-progress",
        )}
      >
        {label}
      </button>

      {/*
        SPOKEN, NOT JUST SHOWN. For a copy this is the only feedback there is,
        and a sighted user gets it from the text appearing. A screen reader
        user gets nothing unless it is announced, so this is a live region that
        is always in the DOM: one added at the same moment its text is set is
        frequently missed by the announcement.

        NO RESERVED HEIGHT, which is the difference from the version that read
        as dead space. It is empty and therefore zero-tall at rest, and it is
        still rendered, still in the accessibility tree, and still able to
        announce — which `empty:hidden` would not be, because `display: none`
        takes an element out of that tree and puts it back populated.
      */}
      <p
        role="status"
        aria-live="polite"
        className="text-center text-xs font-bold uppercase tracking-wide text-ink/70"
      >
        {confirmation}
      </p>
    </div>
  );
}
