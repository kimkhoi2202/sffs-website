"use client";

import { useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Floating background-music toggle for the /smart-or-fart quiz.
 *
 * A fixed neo-brutalist yellow puck pinned to the bottom-right corner that
 * plays/pauses a looping fanfare track. It defaults to OFF: nothing plays on
 * load and the page stays silent until the user explicitly clicks the button.
 * The first click starts the track (audible); clicking again pauses it.
 *
 * The <audio> element is the single source of truth: onPlay/onPause drive the
 * `playing` state (which swaps the icon + a11y labels), so the displayed state
 * always tracks reality.
 */
export function MusicToggle() {
  const audioRef = useRef<HTMLAudioElement>(null);
  // Default OFF: no autoplay and no first-gesture fallback. Playback only ever
  // starts from an explicit click on the button below.
  const [playing, setPlaying] = useState(false);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      // play() returns a promise that rejects if the browser blocks it; swallow
      // it so a failed start never throws. onPlay flips the state on success.
      void audio.play().catch(() => {
        /* Playback blocked/failed — leave the toggle in its paused state. */
      });
    } else {
      audio.pause();
    }
  };

  const label = playing ? "Pause music" : "Play music";

  return (
    <>
      <audio
        ref={audioRef}
        src="/music/final-round-fanfare.mp3"
        loop
        preload="auto"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={label}
        aria-pressed={playing}
        title={label}
        className={cn(
          // Always-on-top floating puck, clear of page content + the reveal nav.
          "fixed bottom-6 right-6 z-40 grid size-14 place-items-center",
          // Signature 30MPC surface: yellow, thick ink border.
          "cursor-pointer rounded-full border-[2.5px] border-ink bg-yellow text-ink",
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
        {playing ? (
          <Volume2 className="size-6" strokeWidth={2.5} aria-hidden />
        ) : (
          <VolumeX className="size-6" strokeWidth={2.5} aria-hidden />
        )}
      </button>
    </>
  );
}
