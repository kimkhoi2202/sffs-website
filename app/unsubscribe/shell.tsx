import type { ReactNode } from "react";

/**
 * The frame both unsubscribe screens sit in.
 *
 * Deliberately standalone rather than part of app/(site): that group renders
 * the nav and footer, and a page whose whole job is "you are done, nothing else
 * is being asked of you" should not open with a menu of other things to do.
 * It is still unmistakably the brand, because a plain white page with the word
 * "Unsubscribed" on it reads like a phishing landing.
 *
 * A server component with no interactivity, so the route ships no JavaScript of
 * its own. That is also what makes the form work with scripting off.
 */
export function UnsubscribeShell({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}) {
  return (
    <main
      id="main"
      className="flex min-h-dvh flex-col items-center justify-center bg-yellow px-4 py-12"
    >
      <div className="w-full max-w-md rounded-2xl border-[2.5px] border-ink bg-paper p-6 text-center shadow-hard-lg sm:p-8">
        {/* eslint-disable-next-line @next/next/no-img-element -- brand mark is a static /public asset */}
        <img
          src="/logo.png"
          alt="Smart Fella or Fart Smella"
          width={72}
          height={72}
          className="mx-auto h-16 w-auto select-none"
        />
        {/*
          THE ONLY H1 ON THE PAGE. The shell owns it so neither screen can add a
          second one, and so the heading is always the thing the page is about
          rather than the brand name.
        */}
        <h1 className="mt-5 text-balance font-display text-[clamp(1.6rem,7vw,2.25rem)] uppercase leading-[1.05] tracking-[-0.01em]">
          {heading}
        </h1>
        <div className="mt-4 space-y-3 text-pretty text-[0.98rem] font-medium leading-relaxed text-ink/75 [&_a]:font-bold [&_a]:text-ink [&_a]:underline [&_a]:decoration-2 [&_a]:underline-offset-2 [&_a]:break-words">
          {children}
        </div>
      </div>
      <p className="mt-6 max-w-md text-center text-xs font-medium leading-relaxed text-ink/60">
        Kim Khoi Lam, 1143 Sultana Spgs Ct, Houston, TX 77090
      </p>
    </main>
  );
}
