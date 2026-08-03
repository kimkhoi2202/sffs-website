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
 * ONE BUTTON. WHETHER IT OPENS A MENU DEPENDS ON WHETHER THE OS SHEET IS
 * ACTUALLY ENOUGH, WHICH IS NOT THE SAME QUESTION AS canShare()
 * ===========================================================================
 * On a phone the OS share sheet already knows every app on the device and can
 * put the PNG into any of them, including the camera roll. One tap, no menu of
 * ours: a chooser in front of the chooser is two layers for no reason.
 *
 * On a desktop it is not enough, and the obvious test for that is WRONG.
 * Desktop Chrome on macOS returns TRUE from `canShare({ files })` and will
 * happily take the PNG, so a pure capability check routes desktop down the
 * menu-less path. But the macOS sharing picker offers Messages and Mail and
 * AirDrop, not "put this file somewhere I can post it from", which is the one
 * thing a person at a desk actually wants. Capability is not sufficiency.
 *
 * So the test is capability AND a coarse pointer. Phones and tablets get the
 * sheet; everything else gets our own small menu with the two things the
 * desktop sheet cannot do (save the image, copy the link) plus the native
 * sheet itself where it exists.
 *
 * ===========================================================================
 * WHAT WENT WRONG THE FIRST TIME, SO IT DOES NOT AGAIN
 * ===========================================================================
 * The first version of this locked the whole card up on desktop, and the
 * failure is worth writing down because every step of it looked reasonable.
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
 * Three rules come out of that and all three are load-bearing below:
 *
 *   NEVER GATE THE UI ON A PROMISE THE OS OWNS. `busy` is released BEFORE the
 *   sheet is opened, and re-entry is prevented by a ref instead. A sheet that
 *   never answers can then cost at most one ignored tap.
 *
 *   NEVER BE SILENT. Every path changes something visible within a frame of
 *   the tap, and the fetch has its own label.
 *
 *   FETCH BEFORE THE TAP WHERE POSSIBLE. The card is pulled on first hover,
 *   focus or touch, so by the time the click lands it is usually already in
 *   hand. That also protects the iOS case, where a long await between the
 *   gesture and `share()` can cost the transient activation the call needs.
 */
"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

import { buttonVariants } from "@/components/ui/button";
import {
  isTouchDevice,
  trackTestResultShareCompleted,
  trackTestResultShareDismissed,
  trackTestResultShareFailed,
  trackTestResultShareInitiated,
  type ShareMechanism,
} from "@/lib/analytics/events";
import { beatUrlFor, shareCardPathFor } from "@/lib/test/share-url";
import type { Audience } from "@/lib/test/types";
import { cn } from "@/lib/utils";

/** How long a confirmation stays up before the control goes back to normal. */
const CONFIRM_MS = 2600;

/** A cold Satori render is slow; an unbounded one is a hung button. */
const CARD_TIMEOUT_MS = 12_000;

const SHARE_TEXT = "I took the Official Smart Fella Test. Think you can beat me?";
const SHARE_TITLE = "The Official Smart Fella Test";
const CARD_FILENAME = "smart-fella-or-fart-smella.png";

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
 * Whether ONE TAP can finish the job on this device.
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
const readSheetIsEnough = (): boolean => {
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
  const [menuOpen, setMenuOpen] = useState(false);

  /**
   * False on the server and on the first client render, then whatever the
   * device actually is. THE BUTTON IS IDENTICAL EITHER WAY, so nothing
   * flickers: only what the click does changes.
   */
  const sheetIsEnough = useSyncExternalStore(
    neverChanges,
    readSheetIsEnough,
    notOnTheServer,
  );

  const timerRef = useRef<number | null>(null);
  const runningRef = useRef(false);
  const cardRef = useRef<Promise<File> | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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

  const base = { test_id: testId, audience, verdict };

  /* -- the three things that can actually happen -------------------------- */

  /**
   * Copy, without the `initiated` event.
   *
   * Split from `runCopy` because this is also the LANDING PLACE when a share
   * fails, and a fallback must not file a second intent for a tap that was
   * already counted. That is the exact defect this codebase found once before
   * on ShareToChild, where three exits reported two.
   */
  const copyCore = useCallback(
    async (mechanism: ShareMechanism) => {
      const url = beatUrlFor(token, window.location.origin, "copy_link");
      try {
        await navigator.clipboard.writeText(url);
        confirm("Link copied");
        trackTestResultShareCompleted({ ...base, mechanism: "copy_link" });
      } catch {
        confirm("Could not copy. Copy it from the address bar instead.");
        trackTestResultShareFailed({ ...base, mechanism, reason: "clipboard" });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [token, testId, audience, verdict, confirm],
  );

  /**
   * Hand the result to the OS.
   *
   * `setBusy(false)` happens BEFORE the await, deliberately. See the note at
   * the top: the sheet's promise belongs to the operating system, and the
   * first version of this file bricked the card by making the enabled state
   * depend on it settling.
   */
  const runShare = useCallback(
    async (withFile: boolean) => {
      if (runningRef.current) return;
      runningRef.current = true;
      trackTestResultShareInitiated({ ...base, mechanism: "native_sheet" });

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
          trackTestResultShareFailed({
            ...base,
            mechanism: "native_sheet",
            reason: "card_fetch",
          });
        } finally {
          setFetching(false);
          setBusy(false);
        }
      }

      try {
        await navigator.share(payload);
        trackTestResultShareCompleted({ ...base, mechanism: "native_sheet" });
        // The OS gives us no way to know WHICH app was picked, so this is the
        // most we can honestly say back to the person.
        confirm("Shared");
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          // Backing out of a sheet is a normal thing to do, not a failure. It
          // still needs to say something: a dismissed sheet and a dead button
          // look identical from the outside, which is half of what made the
          // first version of this feel broken.
          trackTestResultShareDismissed({ ...base, mechanism: "native_sheet" });
          confirm("Not shared");
        } else {
          trackTestResultShareFailed({
            ...base,
            mechanism: "native_sheet",
            reason: "share_api",
          });
          await copyCore("native_sheet");
        }
      } finally {
        runningRef.current = false;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [token, testId, audience, verdict, loadCard, copyCore, confirm],
  );

  const runSave = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    trackTestResultShareInitiated({ ...base, mechanism: "image_download" });
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
      trackTestResultShareCompleted({ ...base, mechanism: "image_download" });
    } catch {
      confirm("Could not save the picture. Try again in a moment.");
      trackTestResultShareFailed({
        ...base,
        mechanism: "image_download",
        reason: "download",
      });
    } finally {
      setFetching(false);
      setBusy(false);
      runningRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testId, audience, verdict, loadCard, confirm]);

  const runCopy = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    trackTestResultShareInitiated({ ...base, mechanism: "copy_link" });
    try {
      await copyCore("copy_link");
    } finally {
      runningRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testId, audience, verdict, copyCore]);

  /* -- the menu ------------------------------------------------------------ */

  const closeMenu = useCallback((returnFocus = true) => {
    setMenuOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }, []);

  /* Escape closes it, and a click anywhere else does too. */
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        closeMenu();
      }
    };
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!menuRef.current?.contains(t) && !triggerRef.current?.contains(t)) {
        closeMenu(false);
      }
    };
    document.addEventListener("keydown", onKey, true);
    document.addEventListener("pointerdown", onDown, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.removeEventListener("pointerdown", onDown, true);
    };
  }, [menuOpen, closeMenu]);

  /* Opening a menu should put the keyboard in it. */
  useEffect(() => {
    if (!menuOpen) return;
    const first = menuRef.current?.querySelector<HTMLButtonElement>("[role=menuitem]");
    first?.focus();
  }, [menuOpen]);

  /** Up and down move between items, which is what `role="menu"` promises. */
  const onMenuKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const items = [
      ...(menuRef.current?.querySelectorAll<HTMLButtonElement>("[role=menuitem]") ?? []),
    ];
    if (!items.length) return;
    const i = items.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      items[(i + 1) % items.length]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      items[(i - 1 + items.length) % items.length]?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      items[0]?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      items[items.length - 1]?.focus();
    } else if (e.key === "Tab") {
      closeMenu(false);
    }
  };

  const choose = (run: () => Promise<void>) => {
    closeMenu(false);
    void run();
  };

  /* -- the one control ----------------------------------------------------- */

  const onPrimary = () => {
    if (sheetIsEnough) {
      void runShare(true);
      return;
    }
    setMenuOpen((v) => !v);
  };

  const hasNativeShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  const label = fetching ? "Getting your picture" : "Share my result";

  const MENU_ITEM = cn(
    "flex w-full cursor-pointer items-center gap-2 rounded-xl border-[2.5px] border-transparent px-3 py-2.5",
    "text-left text-sm font-bold uppercase tracking-wide text-ink",
    "hover:[@media(hover:hover)]:bg-cream",
    // Drawn INSIDE the item's own box. The menu is a bordered card and an
    // outline sitting outside the item would be clipped by it.
    "focus-visible:outline focus-visible:outline-[3px] focus-visible:-outline-offset-[3px] focus-visible:outline-ink",
    "disabled:cursor-not-allowed disabled:opacity-50",
  );

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

      {/* `relative` so the menu can hang off the button, and the wrapper stays
          in flow so nothing below it jumps when the menu opens. */}
      <div className="relative">
        {/*
          A raw <button> with the shared variants rather than <Button>, only
          because this one needs a ref (focus has to come back to it when the
          menu closes) and that component does not take one. Same classes, so
          it is the same button.
        */}
        <button
          ref={triggerRef}
          type="button"
          onClick={onPrimary}
          onPointerEnter={prefetch}
          onFocus={prefetch}
          onTouchStart={prefetch}
          disabled={busy}
          aria-haspopup={sheetIsEnough ? undefined : "menu"}
          aria-expanded={sheetIsEnough ? undefined : menuOpen}
          className={cn(buttonVariants({ variant: "paper", size: "lg" }), "w-full")}
        >
          {label}
        </button>

        {menuOpen ? (
          <div
            ref={menuRef}
            role="menu"
            aria-label="Share this result"
            onKeyDown={onMenuKeyDown}
            className={cn(
              "absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20",
              "flex flex-col gap-1 rounded-2xl border-[2.5px] border-ink bg-paper p-2 shadow-hard-lg",
            )}
          >
            <button
              type="button"
              role="menuitem"
              tabIndex={-1}
              onClick={() => choose(runSave)}
              className={MENU_ITEM}
            >
              Save the picture
            </button>
            <button
              type="button"
              role="menuitem"
              tabIndex={-1}
              onClick={() => choose(runCopy)}
              className={MENU_ITEM}
            >
              Copy the link
            </button>
            {hasNativeShare ? (
              <button
                type="button"
                role="menuitem"
                tabIndex={-1}
                /*
                  No file on this path. Desktop Chrome would accept one, but
                  the desktop sheet's useful destinations are Messages and Mail,
                  where a link is the thing that travels; anyone here who wants
                  the image has "Save the picture" one item above.
                */
                onClick={() => choose(() => runShare(false))}
                className={MENU_ITEM}
              >
                Send it somewhere else
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

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
    </div>
  );
}
