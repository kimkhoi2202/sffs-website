"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function LoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        // A full reload, not a client transition: the page is a server
        // component whose whole job is to re-read the cookie.
        window.location.reload();
        return;
      }
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setError(body.error ?? "That passphrase is not right.");
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6">
      <form
        onSubmit={submit}
        className="rounded-3xl border-[2.5px] border-ink bg-paper p-8 shadow-hard-lg"
      >
        <p className="font-sans text-xs font-bold uppercase tracking-[0.14em] text-ink/60">
          Smart Fella or Fart Smella
        </p>
        <h1 className="mt-3 font-display text-4xl uppercase leading-none tracking-[-0.01em]">
          Traffic dashboard
        </h1>
        <p className="mt-4 text-[0.95rem] leading-[1.6] text-ink/70">
          Internal. This page shows individual visitors — where they came from, their
          city, their device, their score and their email address.
        </p>

        <label
          htmlFor="dash-pass"
          className="mt-8 block font-sans text-xs font-bold uppercase tracking-[0.12em]"
        >
          Passphrase
        </label>
        <input
          id="dash-pass"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          autoFocus
          className="mt-2 w-full rounded-2xl border-[2.5px] border-ink bg-cream px-4 py-3 font-mono text-sm outline-none focus-visible:bg-paper focus-visible:[box-shadow:0_0_0_4px_var(--color-blue)]"
        />

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-2xl border-[2.5px] border-ink bg-coral px-4 py-3 text-sm font-bold"
          >
            {error}
          </p>
        )}

        <div className="mt-6">
          <Button type="submit" variant="ink" size="lg" disabled={busy}>
            {busy ? "Checking…" : "Enter"}
          </Button>
        </div>
      </form>
    </main>
  );
}
