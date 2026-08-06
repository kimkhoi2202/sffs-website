"use client";

import { useCallback, useRef, useState } from "react";
import { LoaderCircle, Volume2, VolumeX } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Floating background-music toggle for the /smart-or-fart quiz.
 *
 * A fixed neo-brutalist orange puck pinned to the bottom-right corner that
 * plays/pauses a looping fanfare track. It defaults to OFF: nothing plays on
 * load and the page stays silent until the user explicitly clicks the button.
 * The first click starts the track; clicking again pauses it.
 *
 * ===========================================================================
 * "PLAYING" MEANS AUDIBLE, NOT "PLAY() WAS CALLED"
 * ===========================================================================
 * This used to drive the icon off the `play` event, and that event fires the
 * instant playback is REQUESTED — before a single byte of audio has to exist.
 * The track is a 3.4 MB mp3, and iOS Safari ignores `preload` and fetches
 * nothing until the first gesture, so on a phone the first press reliably put
 * the button into its "playing" state over a silent page for as long as the
 * download took. Measured against production on a throttled connection, the
 * puck showed the speaker icon and read "Pause music" for the whole six-second
 * sample while `currentTime` never left 0.
 *
 * A visitor who came back to the site seventeen minutes after finishing their
 * test rageclicked this control four times in three and a half seconds and
 * left. The clicks were registering — the icon flipped every time — which is
 * exactly the problem: it kept promising sound that was not coming.
 *
 * So the displayed state is derived from the element rather than from the
 * request. Not paused but not yet holding enough data is its own state, and it
 * says so with a spinner: pressing did something, the sound is on its way, and
 * pressing again stops it. See `sync` below.
 */

/** `HTMLMediaElement.HAVE_FUTURE_DATA` — enough buffered to actually advance. */
const HAVE_FUTURE_DATA = 3;

type Status = "idle" | "loading" | "playing";

export function MusicToggle() {
  const audioRef = useRef<HTMLAudioElement>(null);
  // Default OFF: no autoplay and no first-gesture fallback. Playback only ever
  // starts from an explicit click on the button below.
  const [status, setStatus] = useState<Status>("idle");

  /**
   * Read the truth off the element instead of tracking it in parallel.
   *
   * Every media event that can change whether sound is coming out routes here,
   * so there is one definition of the three states and no ordering between
   * `play`, `waiting`, `canplay` and `playing` that can strand the icon on a
   * value the element disagrees with.
   */
  const sync = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) setStatus("idle");
    else setStatus(audio.readyState >= HAVE_FUTURE_DATA ? "playing" : "loading");
  }, []);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      // play() returns a promise that rejects if the browser blocks it or the
      // media will not load. Both mean no sound, so both go back to idle
      // rather than leaving the puck claiming to play.
      void audio.play().catch(() => setStatus("idle"));
    } else {
      // Also the way out of `loading`: a second press on a track that is still
      // fetching cancels it, because `paused` is already false by then.
      audio.pause();
    }
  };

  const playing = status === "playing";
  const loading = status === "loading";
  const label = status === "idle" ? "Play music" : "Pause music";

  return (
    <>
      <audio
        ref={audioRef}
        src="/music/final-round-fanfare.mp3"
        loop
        preload="auto"
        // `play` is the request, `playing`/`canplay` are the sound actually
        // arriving, and `waiting`/`stalled` are it going away again. All of
        // them re-read the element rather than asserting a state of their own.
        onPlay={sync}
        onPlaying={sync}
        onCanPlay={sync}
        onWaiting={sync}
        onStalled={sync}
        onPause={sync}
        // A media error leaves `paused` false on some browsers, so this one
        // does not go through `sync`: there is definitively no sound.
        onError={() => setStatus("idle")}
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={label}
        aria-pressed={status !== "idle"}
        aria-busy={loading}
        title={label}
        className={cn(
          // Always-on-top floating puck, clear of page content + the reveal nav.
          "fixed bottom-6 right-6 z-40 grid size-14 place-items-center",
          // Signature 30MPC surface: orange fill (no section background is
          // orange, so the puck never blends in), thick ink border.
          "cursor-pointer rounded-full border-[2.5px] border-ink bg-orange text-ink",
          // Shared button interaction (single source of truth for the press feel):
          // the hard offset shadow MOVES on hover — rest 4px/4px, hover lifts
          // up-left with a bigger 6px/6px shadow, active presses flat to 0. Owns
          // the rest shadow, transform, transition + reduced-motion handling.
          // See `btn-press` in app/globals.css.
          "btn-press",
          // Visible focus ring, matching the site's other interactive elements.
          "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ink",
        )}
      >
        {loading ? (
          <LoaderCircle
            className="size-6 motion-safe:animate-spin"
            strokeWidth={2.5}
            aria-hidden
          />
        ) : playing ? (
          <Volume2 className="size-6" strokeWidth={2.5} aria-hidden />
        ) : (
          <VolumeX className="size-6" strokeWidth={2.5} aria-hidden />
        )}
      </button>
    </>
  );
}
