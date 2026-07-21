import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";

import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Heading } from "@/components/ui/heading";
import { TikTokStudio } from "@/components/tiktok/tiktok-studio";
import { COOKIE_SESSION, openSession } from "@/lib/tiktok";

export const metadata: Metadata = {
  title: "SFFS Creator Studio",
  description:
    "Connect the Smart Fella or Fart Smella TikTok account and auto-post rendered shorts via the TikTok Content Posting API.",
  // Internal tooling — keep it out of search results.
  robots: { index: false, follow: false },
  alternates: { canonical: "/tiktok" },
};

// Reads the session cookie, so this route is always rendered per-request.
export const dynamic = "force-dynamic";

export default async function TikTokPage({
  searchParams,
}: {
  searchParams: Promise<{
    connected?: string;
    disconnected?: string;
    error?: string;
  }>;
}) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const session = openSession(cookieStore.get(COOKIE_SESSION)?.value);
  const connected = Boolean(session);

  return (
    <div
      id="top"
      className="relative z-40 flex flex-1 flex-col bg-paper text-ink"
    >
      {/* On-brand header, mirroring the legal pages. */}
      <header className="border-b-[2.5px] border-ink bg-paper">
        <Container className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-3 md:py-4">
          <Link
            href="/"
            aria-label="Smart Fella or Fart Smella — home"
            className="col-start-1 inline-flex items-center justify-self-start"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- brand mark is a static /public asset */}
            <img
              src="/logo.png"
              alt=""
              draggable={false}
              className="h-10 w-auto select-none md:h-12"
            />
          </Link>
          <span className="col-start-2 hidden font-display text-xl uppercase tracking-[-0.01em] md:block">
            SFFS Creator Studio
          </span>
          <Link
            href="/"
            className="col-start-3 inline-flex shrink-0 items-center gap-2 justify-self-end rounded-full border-[2.5px] border-ink bg-yellow px-4 py-2 text-sm font-bold uppercase leading-none tracking-[0.02em] btn-press"
          >
            <span aria-hidden>←</span> Back to the test
          </Link>
        </Container>
      </header>

      <main id="main" className="flex-1">
        {/* Title band — signature yellow color-block. */}
        <section className="border-b-[2.5px] border-ink bg-yellow">
          <Container size="prose" className="py-14 md:py-20">
            <Eyebrow>TikTok integration</Eyebrow>
            <Heading as={1} size="xl" className="mt-4">
              SFFS Creator Studio
            </Heading>
            <p className="mt-6 max-w-prose text-[1.05rem] leading-[1.7] text-ink/80">
              Connect our TikTok account once, then publish rendered{" "}
              <em>Smart Fella or Fart Smella</em> shorts straight to it with the
              official TikTok Content Posting API — no manual uploads.
            </p>
          </Container>
        </section>

        {/* Studio. */}
        <section className="bg-paper">
          <Container size="prose" className="py-12 md:py-16">
            <TikTokStudio
              connected={connected}
              displayName={session?.displayName ?? null}
              openId={session?.openId ?? null}
              avatarUrl={session?.avatarUrl ?? null}
              justConnected={params.connected === "1"}
              justDisconnected={params.disconnected === "1"}
              initialError={params.error ?? null}
            />
          </Container>
        </section>
      </main>
    </div>
  );
}
