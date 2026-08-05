/**
 * Getting a result off this page and onto somebody else's screen.
 *
 * ===========================================================================
 * THE IMAGE IS THE PRODUCT, NOT THE LINK
 * ===========================================================================
 * Traffic arrives from TikTok and Instagram, and on both a link is close to
 * useless: not tappable in feed, and not in a Story without a swipe-up nobody
 * has. What spreads there is a SCREENSHOT. So the thing this hands over is a
 * 1080x1920 PNG carrying the score and the verdict, and the link rides along
 * for the places links do work.
 *
 * ===========================================================================
 * ONE BUTTON, AND IT OPENS OUR SHEET RATHER THAN THE OS ONE
 * ===========================================================================
 * The previous version opened the OS share sheet directly on phones, on the
 * reasoning that a chooser in front of the chooser is two layers for no
 * reason. That reasoning was wrong about what the second layer is FOR.
 *
 * The OS sheet is a generic hand-off. It can put the PNG into Instagram, but
 * it lands in Instagram's generic import and it cannot say "Story", it cannot
 * carry our text to X, and it cannot offer "save the picture and then post it"
 * as one motion. Every destination it reaches, it reaches identically, which
 * is precisely the thing a share sheet built for ONE product should not do.
 *
 * So the button opens a sheet of ours holding every destination, and the OS
 * sheet becomes one entry in it ("More") so that nothing on a phone is
 * unreachable. What we gain is per-destination copy, per-destination
 * behaviour, and a `destination` property on the analytics, which the OS sheet
 * deliberately refuses to tell us.
 *
 * ===========================================================================
 * INSTAGRAM AND TIKTOK ARE TWO TAPS, AND THAT IS NOT A BUG WE CAN FIX
 * ===========================================================================
 * There is no way for a web page to open either composer with our image
 * already in it.
 *
 *   `instagram-stories://share` is the one that would work, and it is gated
 *   behind a registered Facebook App ID delivered through their SDK. Without
 *   one it does nothing.
 *
 *   `instagram://library?LocalIdentifier=...` needs a PHAsset identifier from
 *   the device's Photos database. A browser cannot produce one; it does not
 *   have and will never have read access to the camera roll's index.
 *
 * TikTok is the same story with fewer public hooks. So the only flow that
 * exists is: save the picture, open the app, pick it from the camera roll. It
 * is built here as two explicit steps rather than hidden behind one button,
 * because a tap that silently downloads a file and then throws you into
 * another app is a tap nobody understands.
 *
 * The cost of that second step is the thing worth measuring, so both halves
 * are instrumented separately (`step: "tapped"` and `step: "saved"`) and the
 * gap between them is the answer to "is the two-step losing us shares".
 *
 * ===========================================================================
 * WHAT WENT WRONG BEFORE, SO IT DOES NOT AGAIN
 * ===========================================================================
 * An earlier version of this locked the whole card up on desktop, and the
 * failure is worth keeping written down because every step of it looked
 * reasonable.
 *
 *   1. The click set a `busy` flag that disabled every control.
 *   2. It then awaited the card, which takes 1.0 to 1.8 seconds. Nothing on
 *      screen changed in that window. That alone is the entire user-visible
 *      bug report: "I click it and nothing happens."
 *   3. It called `navigator.share()`, whose promise settles when the OS sheet
 *      is dealt with, and which in some environments does not settle at all.
 *   4. `busy` was cleared in a `finally`, so when the promise never settled
 *      the card stayed disabled until a reload.
 *
 * Three rules come out of that and all three are still load-bearing below:
 *
 *   NEVER GATE THE UI ON A PROMISE THE OS OWNS. `busy` is released BEFORE the
 *   sheet is opened, and re-entry is prevented by a ref instead. A sheet that
 *   never answers can then cost at most one ignored tap.
 *
 *   NEVER BE SILENT. Every path changes something visible within a frame of
 *   the tap, and the fetch has its own label.
 *
 *   FETCH BEFORE THE TAP WHERE POSSIBLE. The card is pulled on first hover,
 *   focus or touch, and again the moment the sheet opens, so by the time a
 *   destination is chosen it is usually already in hand. That also protects
 *   the iOS case, where a long await between the gesture and `share()` can
 *   cost the transient activation the call needs.
 */
"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import { XIcon } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  isTouchDevice,
  trackTestResultShareCompleted,
  trackTestResultShareDismissed,
  trackTestResultShareFailed,
  trackTestResultShareInitiated,
  type ShareMechanism,
} from "@/lib/analytics/events";
import {
  beatUrlFor,
  shareCardPathFor,
  type LinkDestination,
  type ShareDestination,
} from "@/lib/test/share-url";
import type { Audience } from "@/lib/test/types";
import { cn } from "@/lib/utils";

/** How long a confirmation stays up before the control goes back to normal. */
const CONFIRM_MS = 2600;

/** A cold Satori render is slow; an unbounded one is a hung button. */
const CARD_TIMEOUT_MS = 12_000;

/**
 * How long to wait for the OS sheet to show itself before assuming it never
 * will. See the watchdog in `runNativeSheet` for why this is not just a timeout.
 */
const SHEET_WATCHDOG_MS = 2000;

const SHARE_TEXT = "I took the Official Smart Fella Test. Think you can beat me?";
const SHARE_TITLE = "The Official Smart Fella Test";
const CARD_FILENAME = "smart-fella-or-fart-smella.png";

/** The destinations that take a picture and open an app, in that order. */
type TwoStepDestination = "instagram" | "tiktok";

/** The destinations that are one link handed to somebody else's composer. */
type IntentDestination = "x" | "whatsapp" | "reddit";

/**
 * Composer URLs.
 *
 * All three take the link in a query parameter and none of them can take the
 * picture, which is the split this whole sheet is organised around: these are
 * the places a URL is the thing that travels.
 */
const WEB_INTENT: Record<IntentDestination, (url: string) => string> = {
  x: (url) =>
    `https://twitter.com/intent/tweet?${new URLSearchParams({ text: SHARE_TEXT, url })}`,
  // wa.me takes ONE text field, so the link goes inside the sentence.
  whatsapp: (url) =>
    `https://wa.me/?${new URLSearchParams({ text: `${SHARE_TEXT} ${url}` })}`,
  reddit: (url) =>
    `https://www.reddit.com/submit?${new URLSearchParams({ url, title: SHARE_TEXT })}`,
};

/**
 * The second half of the two-step, per app.
 *
 * `app` is the custom scheme, used only on a coarse pointer, where the app
 * plausibly exists. It opens the app; it CANNOT open it holding our picture,
 * for the reasons at the top of this file. `web` is what a desktop gets, where
 * the useful thing is the upload page rather than a scheme nothing will answer.
 *
 * WHERE THE PICTURE ACTUALLY LANDS IS NOT THE SAME ON EVERY PHONE, and the
 * copy says so rather than promising the camera roll. An `<a download>` puts
 * it in the gallery on most Android builds and in Files on iOS, and Instagram
 * only reads the first of those. The route that reaches Photos on iOS is
 * `navigator.share({ files })`, whose sheet offers "Save Image", but wiring
 * the save half through the OS sheet turns two steps into three and puts the
 * generic hand-off back in the middle of the one flow that is deliberately
 * explicit. That is a trade worth making only if the numbers say so, and the
 * `tapped` / `saved` split exists precisely to answer that.
 */
const TWO_STEP: Record<
  TwoStepDestination,
  { name: string; app: string; web: string; where: string }
> = {
  instagram: {
    name: "Instagram",
    app: "instagram://story-camera",
    web: "https://www.instagram.com/",
    where:
      "Instagram cannot be handed it by a web page, so pick it out of your camera roll once the app opens. In the story camera it is the square at the bottom left. On some phones it lands in your downloads instead.",
  },
  tiktok: {
    name: "TikTok",
    app: "tiktok://",
    web: "https://www.tiktok.com/upload",
    where:
      "TikTok cannot be handed it by a web page, so tap the plus, choose Upload, and pick it out of your camera roll. On some phones it lands in your downloads instead.",
  },
};

/** What each destination is called on screen, and to a screen reader. */
const DESTINATION_LABEL: Record<ShareDestination, string> = {
  save: "Save the picture",
  copy_link: "Copy the link",
  instagram: "Instagram",
  tiktok: "TikTok",
  x: "X",
  whatsapp: "WhatsApp",
  reddit: "Reddit",
  native_sheet: "More",
};

/**
 * Can this browser put a FILE into the share sheet?
 *
 * Asked with a four-byte dummy rather than the real card, because the answer
 * depends on the MIME type and not the bytes, and fetching 600KB to find out
 * whether we are allowed to send it would be the wrong way round.
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

/**
 * Should the OS sheet be handed the PICTURE, or just the link?
 *
 * The obvious test is wrong on its own. Desktop Chrome on macOS returns TRUE
 * from `canShare({ files })` and will happily take the PNG, but the macOS
 * picker offers Messages and Mail and AirDrop, where a link is what travels.
 * Capability is not sufficiency, so the test is capability AND a coarse
 * pointer. Anyone at a desk who wants the file has "Save the picture" as the
 * first item in the sheet.
 *
 * Read through `useSyncExternalStore` rather than set from an effect, so React
 * gets a server snapshot and a client snapshot instead of a render followed by
 * a state write. Nothing subscribes because nothing changes: a device does not
 * grow a share sheet mid-session.
 *
 * Memoised at module scope because `getSnapshot` runs on every render and must
 * return a stable value, and because building the probe File each time would
 * be work for an answer that cannot change.
 */
let cached: boolean | null = null;
const readSheetTakesFiles = (): boolean => {
  if (cached === null) cached = canShareFiles() && isTouchDevice();
  return cached;
};
const neverChanges = () => () => {};
const notOnTheServer = () => false;

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
  const [fetching, setFetching] = useState(false);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  /** Non-null when the sheet has moved on to "now open the app". */
  const [twoStep, setTwoStep] = useState<TwoStepDestination | null>(null);

  const sheetTakesFiles = useSyncExternalStore(
    neverChanges,
    readSheetTakesFiles,
    notOnTheServer,
  );

  const dialogId = useId();
  const titleId = useId();

  const timerRef = useRef<number | null>(null);
  const runningRef = useRef(false);
  const cardRef = useRef<Promise<File> | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  /** Which destination opened the second screen, so Back can return to it. */
  const cameFrom = useRef<TwoStepDestination | null>(null);

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

  const prefetch = useCallback(() => {
    void loadCard().catch(() => {});
  }, [loadCard]);

  /* -- the analytics shape ------------------------------------------------- */

  /*
    DESTINATION IS A PROPERTY, NEVER AN EVENT NAME.

    Eight destinations times four outcomes is thirty-two event names, none of
    which segment against each other and every one of which has to be added by
    hand to every funnel. One event with a `destination` property is a single
    breakdown, and a ninth destination shows up in it the day it ships.

    Built here rather than in lib/analytics/events.ts so that file does not
    have to grow a field for a decision that belongs to this component. The
    helpers there take the shared base plus a mechanism; these builders add
    the destination on the way past. Passing through a function is also what
    keeps TypeScript's excess-property check happy without widening the
    helpers' signatures.
  */
  const shareProps = useCallback(
    (mechanism: ShareMechanism, destination: ShareDestination) => ({
      test_id: testId,
      audience,
      verdict,
      mechanism,
      destination,
    }),
    [testId, audience, verdict],
  );

  /**
   * The two-step halves. `tapped` is the intent, `saved` is the picture
   * actually reaching the device, and the gap between them is the cost of the
   * second step.
   */
  const stepProps = useCallback(
    (destination: TwoStepDestination, step: "tapped" | "saved") => ({
      ...shareProps("image_download", destination),
      step,
    }),
    [shareProps],
  );

  /** `reason` is a short enum of ours, never a thrown message. */
  const failProps = useCallback(
    (mechanism: ShareMechanism, destination: ShareDestination, reason: string) => ({
      ...shareProps(mechanism, destination),
      reason,
    }),
    [shareProps],
  );

  /* -- the sheet ----------------------------------------------------------- */

  const closeSheet = useCallback((returnFocus = true) => {
    setSheetOpen(false);
    setTwoStep(null);
    if (returnFocus) triggerRef.current?.focus();
  }, []);

  const openSheet = useCallback(() => {
    setTwoStep(null);
    // A fresh open starts at the top of the list, not wherever the LAST open
    // happened to end up. See `cameFrom`, which is only about going back a
    // screen within one visit to the sheet.
    cameFrom.current = null;
    setSheetOpen(true);
    prefetch();
  }, [prefetch]);

  /* -- what a destination actually does ------------------------------------ */

  /**
   * Copy, without the `initiated` event.
   *
   * Split out because this is also the LANDING PLACE when a share fails, and a
   * fallback must not file a second intent for a tap that was already counted.
   * That is the exact defect this codebase found once before on ShareToChild,
   * where three exits reported two.
   *
   * `destination` is the one the person CHOSE, not the clipboard, so a tap that
   * started at "More" and ended in the clipboard still reconciles one-to-one
   * against its own initiation. `mechanism` records how it actually resolved.
   */
  const copyCore = useCallback(
    async (destination: LinkDestination) => {
      const url = beatUrlFor(token, window.location.origin, destination);
      try {
        await navigator.clipboard.writeText(url);
        confirm("Link copied");
        trackTestResultShareCompleted(shareProps("copy_link", destination));
      } catch {
        confirm("Could not copy. Copy it from the address bar instead.");
        trackTestResultShareFailed(failProps("copy_link", destination, "clipboard"));
      }
    },
    [token, confirm, shareProps, failProps],
  );

  const runCopy = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    trackTestResultShareInitiated(shareProps("copy_link", "copy_link"));
    try {
      await copyCore("copy_link");
    } finally {
      runningRef.current = false;
    }
  }, [copyCore, shareProps]);

  /**
   * Put the PNG on the device.
   *
   * Shared by "Save the picture" and by the first half of Instagram and
   * TikTok, because it is the identical operation: the only difference is
   * where the person is sent next. Returns whether it worked, so the two-step
   * only advances to its second screen when there is something to post.
   */
  const saveCard = useCallback(
    async (destination: "save" | TwoStepDestination): Promise<boolean> => {
      if (runningRef.current) return false;
      runningRef.current = true;
      const isTwoStep = destination !== "save";
      trackTestResultShareInitiated(
        isTwoStep ? stepProps(destination, "tapped") : shareProps("image_download", "save"),
      );
      setBusy(true);
      setFetching(true);
      try {
        const file = await loadCard();
        const href = URL.createObjectURL(file);
        const a = document.createElement("a");
        a.href = href;
        // Same-origin, so the browser honours this and saves rather than
        // navigating. Cross-origin it would be ignored.
        a.download = file.name;
        document.body.append(a);
        a.click();
        a.remove();
        // Revoked a beat later: revoking synchronously races the download in
        // Safari and produces an empty file.
        window.setTimeout(() => URL.revokeObjectURL(href), 1000);
        confirm("Picture saved");
        trackTestResultShareCompleted(
          isTwoStep ? stepProps(destination, "saved") : shareProps("image_download", "save"),
        );
        return true;
      } catch {
        confirm("Could not save the picture. Try again in a moment.");
        trackTestResultShareFailed(failProps("image_download", destination, "download"));
        return false;
      } finally {
        setFetching(false);
        setBusy(false);
        runningRef.current = false;
      }
    },
    [loadCard, confirm, shareProps, stepProps, failProps],
  );

  /**
   * Somebody else's composer, in a new tab.
   *
   * NEW TAB, NOT THIS ONE. The results page is the only copy of a result a
   * person has in front of them, and navigating away from it to X means the
   * back button is the only route home. `noopener` because a named window with
   * a handle on `window.opener` is a cross-origin footgun for no gain.
   *
   * THE EVENT FIRES BEFORE THE HOP, deliberately. `window.open` can hand the
   * thread straight to the new document, and an event queued after that is an
   * event that may never leave.
   */
  const runWebIntent = useCallback(
    (destination: IntentDestination) => {
      if (runningRef.current) return;
      runningRef.current = true;
      try {
        const url = beatUrlFor(token, window.location.origin, destination);
        trackTestResultShareInitiated(shareProps("web_intent", destination));
        const opened = window.open(
          WEB_INTENT[destination](url),
          "_blank",
          "noopener,noreferrer",
        );
        if (opened) {
          // As much as can honestly be claimed: the composer was reached. What
          // happens in it belongs to a site that will never tell us.
          trackTestResultShareCompleted(shareProps("web_intent", destination));
          confirm(`Opened ${DESTINATION_LABEL[destination]}`);
        } else {
          trackTestResultShareFailed(
            failProps("web_intent", destination, "popup_blocked"),
          );
          confirm("That window was blocked, so the link is on your clipboard instead.");
          // Started synchronously, so the clipboard write still runs inside the
          // gesture that opened it and keeps its user activation.
          void copyCore(destination);
        }
      } finally {
        runningRef.current = false;
      }
    },
    [token, confirm, copyCore, shareProps, failProps],
  );

  /**
   * Hand the result to the OS.
   *
   * `setBusy(false)` happens BEFORE the await, deliberately. See the note at
   * the top: the sheet's promise belongs to the operating system, and the
   * first version of this file bricked the card by making the enabled state
   * depend on it settling.
   */
  const runNativeSheet = useCallback(
    async (withFile: boolean) => {
      if (runningRef.current) return;
      runningRef.current = true;
      trackTestResultShareInitiated(shareProps("native_sheet", "native_sheet"));

      const url = beatUrlFor(token, window.location.origin, "native_sheet");
      let payload: ShareData = { title: SHARE_TITLE, text: SHARE_TEXT, url };

      if (withFile) {
        setBusy(true);
        setFetching(true);
        try {
          const file = await loadCard();
          if (navigator.canShare?.({ files: [file] })) {
            payload = { files: [file], text: SHARE_TEXT, url };
          }
        } catch {
          // The card did not render or did not arrive. The link is still worth
          // sharing, so this degrades instead of failing the tap.
          trackTestResultShareFailed(
            failProps("native_sheet", "native_sheet", "card_fetch"),
          );
        } finally {
          setFetching(false);
          setBusy(false);
        }
      }

      /*
        THE WATCHDOG, AND WHY IT IS NOT JUST A TIMEOUT.

        `navigator.share()` can be called successfully and then simply never
        settle: measured on desktop Chrome, and reproducible on any device
        where the OS declines to present a sheet. The earlier fix stopped that
        from disabling the card, but stopping short of a lock-up is not the
        same as telling somebody what happened. What was left was a 250ms
        label flicker and then silence, which is indistinguishable from a dead
        button and is exactly what was reported.

        A plain timeout cannot fix it, because a sheet a person is actually
        READING also leaves the promise pending, for as long as they like.
        Firing an error at 2 seconds would cry wolf on every successful share.

        What separates the two is FOCUS. When the OS puts a sheet up, this
        document loses it. So the watchdog only acts when the promise has not
        settled AND this page still has focus and is still visible, which
        together mean no sheet was ever presented. Then it says so and puts our
        own sheet back, so the tap ends somewhere instead of nowhere.
      */
      let settled = false;
      const watchdog = window.setTimeout(() => {
        if (settled) return;
        const noSheetAppeared =
          document.visibilityState === "visible" && document.hasFocus();
        if (!noSheetAppeared) return;
        settled = true; // the rejection that may follow is now redundant
        /*
          THE RE-ENTRY GUARD COMES OFF WITH IT, AND LEAVING IT ON WAS THE WHOLE
          BUG.

          `runningRef` is released in the `finally` below — which is attached to
          `await navigator.share(payload)`, the one promise on this page that
          can never settle. When it doesn't, that `finally` never runs, the flag
          stays true for the life of the page, and `choose()` starts by
          returning on it. So every destination in this sheet went dead: Save,
          Copy, X, WhatsApp, Reddit, all of them, silently, forever.

          Which made this watchdog a liar. It said "Pick another way" and then
          there was no other way. Reproduced on the live page in Chrome for
          macOS: Copy worked, one press of More, and afterwards neither Copy nor
          Save did anything at all.

          It is the same rule the file already applies to `busy` and states at
          the top — never gate the UI on a promise the OS owns — applied to the
          other flag, which was quietly exempt from it.
        */
        runningRef.current = false;
        trackTestResultShareFailed(
          failProps("native_sheet", "native_sheet", "sheet_never_opened"),
        );
        confirm("That did not open. Pick another way.");
        setTwoStep(null);
        setSheetOpen(true);
      }, SHEET_WATCHDOG_MS);

      try {
        await navigator.share(payload);
        if (settled) return;
        settled = true;
        trackTestResultShareCompleted(shareProps("native_sheet", "native_sheet"));
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
          trackTestResultShareDismissed(shareProps("native_sheet", "native_sheet"));
          confirm("Not shared");
        } else {
          trackTestResultShareFailed(
            failProps("native_sheet", "native_sheet", "share_api"),
          );
          await copyCore("native_sheet");
        }
      } finally {
        window.clearTimeout(watchdog);
        runningRef.current = false;
      }
    },
    [token, loadCard, copyCore, confirm, shareProps, failProps],
  );

  /**
   * Step two: into the app, where they pick the picture up off the camera roll.
   *
   * The scheme only on a coarse pointer, because that is where the app can
   * exist. A desktop gets the upload page, which is the useful end of the same
   * journey.
   */
  const openApp = useCallback(
    (destination: TwoStepDestination) => {
      const { name, app, web } = TWO_STEP[destination];
      confirm(`Opening ${name}`);
      if (isTouchDevice()) {
        window.location.href = app;
      } else {
        window.open(web, "_blank", "noopener,noreferrer");
      }
    },
    [confirm],
  );

  /* -- choosing from the sheet --------------------------------------------- */

  /*
    Every exit closes the sheet WITH focus, rather than letting the portal
    unmount out from under it. An unmounting element takes focus to <body>,
    and from <body> a keyboard user has lost their place on a long page and
    the trap below has nothing to trap.

    The two-step is the exception, because it is not an exit: it swaps the
    sheet's contents and keeps the focus ring inside.
  */
  const choose = useCallback(
    (destination: ShareDestination) => {
      if (runningRef.current) return;
      switch (destination) {
        case "save":
          closeSheet();
          void saveCard("save");
          return;
        case "copy_link":
          closeSheet();
          void runCopy();
          return;
        case "instagram":
        case "tiktok":
          // The sheet STAYS OPEN. The picture has to land before the second
          // step means anything, and the second step is the part that needs
          // explaining, so it gets its own screen rather than a toast.
          void saveCard(destination).then((ok) => {
            if (ok) setTwoStep(destination);
          });
          return;
        case "native_sheet":
          closeSheet();
          void runNativeSheet(sheetTakesFiles);
          return;
        default:
          closeSheet();
          runWebIntent(destination);
      }
    },
    [closeSheet, saveCard, runCopy, runNativeSheet, runWebIntent, sheetTakesFiles],
  );

  /* -- keyboard, focus and dismissal --------------------------------------- */

  /* Escape closes it, from anywhere, including if focus has escaped the sheet. */
  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      // From the second step, Escape goes back a screen before it goes away.
      // Losing the whole sheet on the way out of a sub-screen is the kind of
      // over-eager dismissal that makes people stop pressing Escape.
      if (twoStep) setTwoStep(null);
      else closeSheet();
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [sheetOpen, twoStep, closeSheet]);

  /*
    THERE IS NO SCROLL LOCK HERE, AND THAT IS A MEASUREMENT RATHER THAN AN
    OVERSIGHT. Please do not add one back without repeating the measurement.

    The usual lock is `overflow: hidden` on the root while the modal is open.
    It was written, and then measured, and it does nothing on this page: a
    `position: fixed; inset: 0` overlay defeats it in Chrome. Reduced to a
    plain div with no React involved, on this same page, scrolled to y=900:

      root overflow hidden, no overlay      wheel 900   PageDown 900
      root overflow hidden, fixed overlay   wheel 1074  PageDown 1083

    A fixed element is associated with the layout viewport, and a wheel over
    one chains straight past the root's overflow. So the lock cost a restore
    path that could leave the page's scroll position or padding wrong, and
    bought nothing.

    What is left is the property that actually matters and that is verified in
    scripts/verify-share-sheet.mjs: the sheet is pinned, so the page moving
    behind it changes neither where the sheet is nor what is reachable.
  */

  /*
    Opening puts the keyboard in the sheet, and moving between its two screens
    puts it on the thing that screen is about. Coming BACK from the second step
    returns it to the destination it came from rather than to the top of the
    list, because landing somewhere you did not leave from is disorienting.
  */
  useEffect(() => {
    if (!sheetOpen) return;
    if (twoStep) {
      cameFrom.current = twoStep;
      dialogRef.current
        ?.querySelector<HTMLButtonElement>("[data-open-app]")
        ?.focus();
      return;
    }
    const back = cameFrom.current;
    cameFrom.current = null;
    const target =
      (back &&
        menuRef.current?.querySelector<HTMLButtonElement>(
          `[data-destination="${back}"]`,
        )) ??
      menuRef.current?.querySelector<HTMLButtonElement>("[role=menuitem]");
    target?.focus();
  }, [sheetOpen, twoStep]);

  /** Everything you can press inside the sheet, in the order you meet it. */
  const tabStops = () => [
    ...(dialogRef.current?.querySelectorAll<HTMLButtonElement>(
      "button:not([disabled])",
    ) ?? []),
  ];

  const menuItems = () => [
    ...(menuRef.current?.querySelectorAll<HTMLButtonElement>(
      "[role=menuitem]:not([disabled])",
    ) ?? []),
  ];

  /**
   * A focus trap and the menu's own key contract, in one handler.
   *
   * Tab is handled explicitly rather than by juggling `tabindex`, because the
   * sheet has two screens with different contents and an explicit ring is the
   * only version that cannot be left in a wrong state by a screen swap.
   */
  const onDialogKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Tab") {
      const stops = tabStops();
      if (!stops.length) return;
      e.preventDefault();
      const i = stops.indexOf(document.activeElement as HTMLButtonElement);
      const next = e.shiftKey ? i - 1 : i + 1;
      stops[(next + stops.length) % stops.length]?.focus();
      return;
    }

    const items = menuItems();
    if (!items.length) return;
    const i = items.indexOf(document.activeElement as HTMLButtonElement);
    // Right and left as well as down and up: the destinations are laid out as
    // a grid, and an arrow that points along a row should walk along it.
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      items[(i + 1) % items.length]?.focus();
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      items[(i - 1 + items.length) % items.length]?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      items[0]?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      items[items.length - 1]?.focus();
    }
  };

  /* -- the one control ----------------------------------------------------- */

  const hasNativeShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  const label = fetching ? "Getting your picture" : "Share my result";

  /*
    ARIA-DISABLED, NOT DISABLED, on the items inside the sheet.

    A real `disabled` attribute blows focus off whatever is holding it, and
    Instagram and TikTok keep the sheet open while their picture is fetched.
    The item the person just pressed would go grey and drop focus to <body>,
    outside the trap, in the middle of the one flow that has a second step.
    `aria-disabled` says the same thing to a screen reader and stays
    focusable; re-entry is already prevented by `runningRef`.
  */
  const BUSY = "aria-disabled:cursor-not-allowed aria-disabled:opacity-50";

  /* A grid cell. Same button conventions as the rest of the page, tightened
     horizontally so three of them fit across a 360px phone. */
  const TILE = cn(
    buttonVariants({ variant: "paper", size: "sm" }),
    "w-full px-1 text-[0.7rem]",
    BUSY,
  );
  const ROW = (variant: "yellow" | "paper") =>
    cn(buttonVariants({ variant, size: "md" }), "col-span-3 w-full", BUSY);

  const destinations: ShareDestination[] = [
    "instagram",
    "tiktok",
    "x",
    "whatsapp",
    "reddit",
    ...(hasNativeShare ? (["native_sheet"] as const) : []),
  ];

  return (
    /*
      OVERFLOW IS NOT CLIPPED AND THE PADDING IS NOT DECORATION. The control
      paints a hard offset shadow that grows from 4px to 6px on hover and
      travels up-left, so a container sized to it at rest crops the shadow the
      moment a pointer touches it. The padding is what it displaces into.

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
        Send the picture to your story, or the link to a friend who thinks they
        are cleverer.
      </p>

      {/*
        A raw <button> with the shared variants rather than <Button>, only
        because this one needs a ref (focus has to come back to it when the
        sheet closes) and that component does not take one. Same classes, so
        it is the same button.
      */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (sheetOpen ? closeSheet() : openSheet())}
        onPointerEnter={prefetch}
        onFocus={prefetch}
        onTouchStart={prefetch}
        disabled={busy}
        /* `dialog` rather than `menu`, because that is what opens: a modal
           holding a menu, a title and a close control. Saying "menu" would
           promise a lighter thing than arrives. */
        aria-haspopup="dialog"
        aria-expanded={sheetOpen}
        aria-controls={sheetOpen ? dialogId : undefined}
        className={cn(buttonVariants({ variant: "paper", size: "lg" }), "w-full")}
      >
        {label}
      </button>

      {/*
        SPOKEN, NOT JUST SHOWN. For a copy this is the only feedback there is,
        and a sighted user gets it from the text appearing. A screen reader
        user gets nothing unless it is announced, so this is a live region that
        is always in the DOM: one added at the same moment its text is set is
        frequently missed by the announcement.
      */}
      <p
        role="status"
        aria-live="polite"
        className="min-h-[1rem] text-center text-xs font-bold uppercase tracking-wide text-ink/70"
      >
        {confirmation}
      </p>

      {sheetOpen
        ? createPortal(
            /*
              IN A PORTAL, ON A SCRIM, PINNED TO THE VIEWPORT.

              The version before this hung off the button as an absolutely
              positioned dropdown, and at every width it landed squarely on the
              card underneath: measured at 390x844 the menu occupied 597..757
              and "Take it again" occupied 655..711, so the two shared 56
              pixels of the same column. A panel that eats the control below it
              reads as a rendering fault, and it is one.

              Pinned to the viewport instead, the sheet cannot collide with
              page content because no page content is in front of it. The scrim
              is what says so: everything else is behind a deliberate layer
              rather than half-covered by an accidental one.

              NO SHADOW ON THIS PANEL. The flat rule holds for it; only the
              email gate and the quit modal are exempt. The controls inside it
              keep their hard offsets, which is where the brand lives anyway.
            */
            <div
              onPointerDown={(e) => {
                if (e.target === e.currentTarget) closeSheet(false);
              }}
              /* z-50 clears the fixed music toggle at z-40. */
              className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 p-3 sm:items-center sm:p-5"
            >
              <div
                ref={dialogRef}
                id={dialogId}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                onKeyDown={onDialogKeyDown}
                className="w-full max-w-md rounded-2xl border-[2.5px] border-ink bg-cream p-4 sm:p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2
                    id={titleId}
                    className="text-balance font-display text-xl uppercase leading-none"
                  >
                    {twoStep ? `Now open ${TWO_STEP[twoStep].name}` : "Send it to"}
                  </h2>
                  {/*
                    A sheet is heavier than a menu, so it gets a visible way
                    out as well as Escape and the scrim.
                  */}
                  <button
                    type="button"
                    onClick={() => closeSheet()}
                    aria-label="Close"
                    className={cn(
                      buttonVariants({ variant: "paper", size: "sm" }),
                      "size-9 shrink-0 px-0",
                    )}
                  >
                    <XIcon size={18} strokeWidth={3} aria-hidden="true" />
                  </button>
                </div>

                {twoStep ? (
                  <div className="mt-3 flex flex-col gap-3">
                    {/*
                      THE FIRST HALF IS CONFIRMED IN ITS OWN SENTENCE. The
                      status line below says "Picture saved" too, but it clears
                      itself after a couple of seconds and this screen does
                      not, and a screen that opens by telling you to go and
                      find a picture had better first say that there is one.
                    */}
                    <p className="text-[0.925rem] font-extrabold leading-snug text-ink">
                      The picture is saved.
                    </p>
                    <p className="text-pretty text-[0.925rem] font-semibold leading-snug text-ink/80">
                      {TWO_STEP[twoStep].where}
                    </p>
                    <button
                      type="button"
                      data-open-app
                      onClick={() => openApp(twoStep)}
                      className={cn(
                        buttonVariants({ variant: "yellow", size: "md" }),
                        "w-full",
                      )}
                    >
                      Open {TWO_STEP[twoStep].name}
                    </button>
                    <button
                      type="button"
                      onClick={() => setTwoStep(null)}
                      className={cn(
                        buttonVariants({ variant: "paper", size: "sm" }),
                        "w-full",
                      )}
                    >
                      Somewhere else instead
                    </button>
                  </div>
                ) : (
                  <div
                    ref={menuRef}
                    role="menu"
                    aria-label="Where to send your result"
                    className="mt-3 grid grid-cols-3 gap-2"
                  >
                    {/*
                      The two that need no other app come first and take the
                      full width, because they are the two that always work.
                    */}
                    <button
                      type="button"
                      role="menuitem"
                      tabIndex={-1}
                      data-destination="save"
                      aria-disabled={busy || undefined}
                      onPointerEnter={prefetch}
                      onClick={() => choose("save")}
                      className={ROW("yellow")}
                    >
                      {fetching ? "Getting your picture" : DESTINATION_LABEL.save}
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      tabIndex={-1}
                      data-destination="copy_link"
                      aria-disabled={busy || undefined}
                      onClick={() => choose("copy_link")}
                      className={ROW("paper")}
                    >
                      {DESTINATION_LABEL.copy_link}
                    </button>

                    {destinations.map((d) => (
                      <button
                        key={d}
                        type="button"
                        role="menuitem"
                        tabIndex={-1}
                        data-destination={d}
                        aria-disabled={busy || undefined}
                        onPointerEnter={
                          d === "instagram" || d === "tiktok" ? prefetch : undefined
                        }
                        onClick={() => choose(d)}
                        className={TILE}
                      >
                        {DESTINATION_LABEL[d]}
                      </button>
                    ))}
                  </div>
                )}

                {/*
                  The same words the live region above is announcing, shown
                  here because that one is behind the scrim while this is open.
                  `aria-hidden`, so it is a second copy on screen and not a
                  second announcement.
                */}
                <p
                  aria-hidden="true"
                  className="mt-3 min-h-[1rem] text-center text-xs font-bold uppercase tracking-wide text-ink/70"
                >
                  {confirmation}
                </p>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
