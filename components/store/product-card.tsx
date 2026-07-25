"use client";

import { useState } from "react";
import { ChevronDown, Lock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import type { Product } from "@/lib/store/products";
import { BuyButton } from "./buy-button";
import { UnlockForm } from "./unlock-form";

export interface ProductCardProps {
  product: Product;
}

/**
 * One store product: art, name, blurb, price, a size picker, and the
 * buy/unlock flow.
 *
 * A client component because even the open product needs the size `<select>`
 * lifted into state so the currently-picked size can be passed down to
 * `BuyButton` on click. The gated product additionally holds the checkout
 * token returned by a successful `UnlockForm` submission — until that token
 * exists, no `BuyButton` is rendered at all, so the gate can't be bypassed
 * from the client (the checkout route re-verifies the token server-side
 * regardless).
 */
export function ProductCard({ product }: ProductCardProps) {
  const [size, setSize] = useState(product.sizes[0] ?? "");
  const [token, setToken] = useState<string | null>(null);

  const unlocked = !product.gated || token !== null;
  const price = (product.priceCents / 100).toFixed(2);
  const selectId = `size-${product.id}`;

  return (
    <Card
      color={product.gated ? "ink" : "paper"}
      shadow="lg"
      padding="lg"
      className="flex flex-col"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- static /public placeholder art (SVG) */}
      <img
        src={product.image}
        alt={`${product.name} — placeholder art`}
        className="mx-auto h-52 w-52 select-none"
        draggable={false}
      />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <Heading as={2} size="sm">
          {product.name}
        </Heading>
        {product.gated ? (
          <Badge color="yellow" shadow="hard">
            <Lock className="h-3 w-3" aria-hidden />
            Locked
          </Badge>
        ) : null}
      </div>

      <p className="mt-3 text-base font-medium leading-snug opacity-80">{product.blurb}</p>

      <p className="mt-4 font-display text-2xl">${price}</p>

      <div className="mt-6">
        <label htmlFor={selectId} className="block text-xs font-bold uppercase tracking-wide opacity-70">
          Size
        </label>
        <div className="relative mt-2">
          <select
            id={selectId}
            value={size}
            onChange={(e) => setSize(e.target.value)}
            className="h-12 w-full appearance-none rounded-xl border-[2.5px] border-ink bg-paper pl-4 pr-10 font-sans text-sm font-bold uppercase text-ink outline-none focus-visible:ring-2 focus-visible:ring-ink"
          >
            {product.sizes.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <ChevronDown
            aria-hidden
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink"
          />
        </div>
      </div>

      <div className="mt-6">
        {unlocked ? (
          <BuyButton productId={product.id} size={size} token={token ?? undefined} label={`Buy — $${price}`} />
        ) : (
          <>
            <Heading as={3} size="sm" uppercase={false}>
              Unlock with your Smart Fella code
            </Heading>
            <p className="mt-2 text-sm font-medium opacity-70">
              Hit smart-fella tier in the app to get your code, then paste it below.
            </p>
            <UnlockForm onUnlocked={setToken} />
          </>
        )}
      </div>
    </Card>
  );
}
