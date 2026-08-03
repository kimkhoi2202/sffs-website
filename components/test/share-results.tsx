/**
 * Getting a result off this page and onto somebody else's screen.
 *
 * ===========================================================================
 * THE IMAGE IS THE PRODUCT, NOT THE LINK
 * ===========================================================================
 * Traffic arrives from TikTok and Instagram, and on both of those a link is
 * close to useless: not tappable in feed, and not in a Story without a
 * swipe-up nobody has. What actually spreads there is a SCREENSHOT. So the
 * thing this component hands over is a 1080x1920 PNG carrying the score and
 * the verdict, and the link rides along for the places links do work.
 *
 * ===========================================================================
 * ONE SHEET, NOT A ROW OF PLATFORM BUTTONS
 * ===========================================================================
 * No Twitter button, no WhatsApp button, no Facebook button. The OS share
 * sheet already knows every app on the device, including the ones we would
 * never think to add and the ones that did not exist when this shipped, and it
 * is the affordance people already use. A row of branded buttons is a worse
 * version of a thing the phone does better, and it dates.
 *
 * ===========================================================================
 * WHAT RUNS WHERE
 * ===========================================================================
 * `navigator.share` with files is the modern iOS and Android path and is the
 * only one that puts a real image into Instagram. Desktop Safari and Chrome
 * have `navigator.share` but usually refuse files, so they get text plus a
 * URL. Firefox and older desktop browsers have neither and fall back to the
 * clipboard with a spoken confirmation.
 *
 * The primary button's LABEL DOES NOT DEPEND ON ANY OF THAT. Feature detection
 * has to happen in an effect to avoid a hydration mismatch, which would mean
 * the button visibly changing its own name a moment after the page settles.
 * It says "Share my verdict", every path underneath it shares the verdict, and
 * the one that ends at the clipboard says so when it lands.
 */
"use client";

import { useCallback, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  trackTestResultShareCompleted,
  trackTestResultShareDismissed,
  trackTestResultShareFailed,
  trackTestResultShareInitiated,
  type ShareMechanism,
} from "@/lib/analytics/events";
import { beatUrlFor, shareCardPathFor } from "@/lib/test/share-url";
import type { Audience } from "@/lib/test/types";

/** How long a confirmation stays up before the button goes back to normal. */
const CONFIRM_MS = 2600;

/** The words that travel with the link. Kid-safe, and no score in the text:
    the image and the page both carry it, and a bare number with no card around
    it reads like spam in a message thread. */
const SHARE_TEXT = "I took the Official Smart Fella Test. Think you can beat me?";
const SHARE_TITLE = "The Official Smart Fella Test";

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
  const [busy, setBusy] = useState(false);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  const base = { test_id: testId, audience, verdict };

  const confirm = useCallback((message: string) => {
    setConfirmation(message);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setConfirmation(null), CONFIRM_MS);
  }, []);

  /**
   * The card as a File, ready for the share sheet.
   *
   * Fetched rather than generated here: it is a 1080x1920 Satori render that
   * needs fonts and the sticker art, all of which live on the server. The
   * route sets a private one-hour cache, so pressing share and then save costs
   * one render rather than two.
   */
  const fetchCard = useCallback(async (): Promise<File> => {
    const res = await fetch(shareCardPathFor(token));
    if (!res.ok) throw new Error(`share card responded ${res.status}`);
    const blob = await res.blob();
    return new File([blob], "smart-fella-or-fart-smella.png", { type: "image/png" });
  }, [token]);

  const copyLink = useCallback(
    async (mechanism: ShareMechanism) => {
      const url = beatUrlFor(token, window.location.origin, "copy_link");
      try {
        await navigator.clipboard.writeText(url);
        confirm("Link copied");
        trackTestResultShareCompleted({ ...base, mechanism: "copy_link" });
      } catch {
        confirm("Could not copy. Long press the address bar instead.");
        trackTestResultShareFailed({ ...base, mechanism, reason: "clipboard" });
      }
    },
    // `base` is rebuilt every render from three stable props; listing the
    // props themselves keeps the callback identity stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [token, testId, audience, verdict, confirm],
  );

  /* -- the main button --------------------------------------------------- */
  const share = useCallback(async () => {
    if (busy) return;
    setBusy(true);

    // Decided before the await so the event records the path we intended to
    // take, not the one we fell back to.
    const canShareFiles = typeof navigator.share === "function" && "canShare" in navigator;
    const mechanism: ShareMechanism = canShareFiles ? "native_sheet" : "copy_link";
    trackTestResultShareInitiated({ ...base, mechanism });

    try {
      if (typeof navigator.share !== "function") {
        await copyLink("copy_link");
        return;
      }

      const url = beatUrlFor(token, window.location.origin, "native_sheet");

      /*
        FILES FIRST, AND ONLY IF THE BROWSER SAYS YES.

        `canShare({ files })` is the only reliable test: Safari and Chrome both
        expose `share` on desktop and both reject a file payload, and calling
        share with files it will not take throws instead of degrading. A
        fetch of the card is not cheap, so it only happens once the browser has
        agreed to take one.
      */
      let payload: ShareData = { title: SHARE_TITLE, text: SHARE_TEXT, url };
      if (typeof navigator.canShare === "function") {
        try {
          const file = await fetchCard();
          if (navigator.canShare({ files: [file] })) {
            payload = { files: [file], text: SHARE_TEXT, url };
          }
        } catch {
          // The card did not render or did not download. The link is still
          // worth sharing, so this degrades rather than failing the tap.
          trackTestResultShareFailed({
            ...base,
            mechanism: "native_sheet",
            reason: "card_fetch",
          });
        }
      }

      await navigator.share(payload);
      trackTestResultShareCompleted({ ...base, mechanism: "native_sheet" });
    } catch (err) {
      /*
        A DISMISSED SHEET IS NOT AN ERROR. `navigator.share` rejects with an
        AbortError when somebody swipes the sheet away, which is a normal thing
        to do and would otherwise be counted as a broken feature.
      */
      if (err instanceof DOMException && err.name === "AbortError") {
        trackTestResultShareDismissed({ ...base, mechanism: "native_sheet" });
      } else {
        trackTestResultShareFailed({
          ...base,
          mechanism: "native_sheet",
          reason: "share_api",
        });
        // The sheet failed for a real reason. Do not leave the tap with
        // nothing to show for it.
        await copyLink("native_sheet");
      }
    } finally {
      setBusy(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busy, token, testId, audience, verdict, copyLink, fetchCard]);

  /* -- save the image ---------------------------------------------------- */
  const saveImage = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    trackTestResultShareInitiated({ ...base, mechanism: "image_download" });

    try {
      const file = await fetchCard();
      const href = URL.createObjectURL(file);
      const a = document.createElement("a");
      a.href = href;
      // Same-origin, so the browser honours this and saves rather than
      // navigating. Cross-origin it would be ignored.
      a.download = file.name;
      document.body.append(a);
      a.click();
      a.remove();
      // Revoked on the next frame: revoking synchronously races the download
      // in Safari and produces an empty file.
      window.setTimeout(() => URL.revokeObjectURL(href), 1000);

      confirm("Image saved");
      trackTestResultShareCompleted({ ...base, mechanism: "image_download" });
    } catch {
      confirm("Could not save the image. Try again in a moment.");
      trackTestResultShareFailed({
        ...base,
        mechanism: "image_download",
        reason: "download",
      });
    } finally {
      setBusy(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busy, token, testId, audience, verdict, confirm, fetchCard]);

  return (
    /*
      OVERFLOW IS NOT CLIPPED AND THE PADDING IS NOT DECORATION. Every control
      in here paints a hard offset shadow that GROWS from 4px to 6px on hover
      and travels up-left, so a container sized to the buttons at rest crops
      the shadow the moment a pointer touches one. The padding below is what
      the shadow displaces into.

      CREAM, WHICH IS THE FLOW'S NEUTRAL SURFACE. Not blue: blue means "the
      option you picked" everywhere else in this flow (see STATE_COLORS in
      lib/test/types.ts), and a large blue slab on the results page would be
      the only blue thing there that does not mean that. Not mint either, which
      the hand-it-to-your-kid card directly below this one already owns.
    */
    <div className="flex w-full flex-col gap-3 rounded-2xl border-[2.5px] border-ink bg-cream p-4 shadow-hard-sm sm:p-5">
      <h2 className="text-balance font-display text-xl uppercase leading-none">
        Go on then, show someone
      </h2>
      <p className="text-pretty text-[0.925rem] font-semibold leading-snug text-ink/75">
        Save the picture for your story, or send the link and make them try it.
      </p>

      <Button
        variant="ink"
        size="lg"
        onClick={share}
        disabled={busy}
        className="w-full"
      >
        Share my verdict
      </Button>

      <Button
        variant="paper"
        size="lg"
        onClick={saveImage}
        disabled={busy}
        className="w-full"
      >
        Save the picture
      </Button>

      {/*
        A quiet third exit rather than a third slab, matching the shape of the
        "Or open the grade picker here" line on the card below this one. It is
        the only obvious copy affordance on a desktop browser, where the main
        button's share sheet may not exist.
      */}
      <button
        type="button"
        onClick={() => copyLink("copy_link")}
        disabled={busy}
        className="rounded-full text-center text-xs font-bold uppercase tracking-wide text-ink/70 underline decoration-2 underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-50"
      >
        Or just copy the link
      </button>

      {/*
        SPOKEN, NOT JUST SHOWN. The confirmation is the only feedback a copy
        gives, and a sighted user gets it from the text appearing. A screen
        reader user gets nothing unless it is announced, so this is a live
        region that is always in the DOM (one that is added at the same moment
        its text is set is frequently missed by the announcement).
      */}
      <p
        role="status"
        aria-live="polite"
        className="min-h-[1rem] text-center text-xs font-bold uppercase tracking-wide text-ink/70"
      >
        {confirmation}
      </p>
    </div>
  );
}
