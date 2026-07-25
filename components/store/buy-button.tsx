"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { ProductId } from "@/lib/store/products";

export interface BuyButtonProps {
  productId: ProductId;
  /** Currently selected size, lifted from the product card's size <select>. */
  size: string;
  /** Checkout token from a successful unlock — required for gated products. */
  token?: string;
  label?: string;
  className?: string;
}

/**
 * Kicks off Stripe Checkout for a single product.
 *
 * Mirrors `components/sections/waitlist.tsx`'s client-form UX: a pending
 * state while the request is in flight, an inline retryable error on
 * failure, and — on success — a hard redirect to Stripe's hosted Checkout
 * page (there is no local success state to flip to, checkout finishes on
 * Stripe's domain and lands back on `/store/success`).
 */
export function BuyButton({ productId, size, token, label = "Buy now", className }: BuyButtonProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    if (pending) return;
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/store/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, size, token }),
      });
      const data = (await res.json().catch(() => null)) as
        | { url?: string; error?: string }
        | null;
      if (!res.ok || !data?.url) {
        setError(data?.error ?? "That didn't go through. Give it another shot.");
        setPending(false);
        return;
      }
      window.location.assign(data.url);
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      setPending(false);
    }
  }

  return (
    <div>
      <Button
        type="button"
        variant="green"
        size="lg"
        onClick={onClick}
        disabled={pending}
        className={className}
      >
        {pending ? "Redirecting…" : label}
      </Button>
      {error ? (
        <p role="alert" className="mt-3 text-sm font-bold">
          {error}
        </p>
      ) : null}
    </div>
  );
}
