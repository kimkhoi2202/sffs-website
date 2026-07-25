export type ProductId = "fart-smella-tee" | "smart-fella-tee";

export interface Product {
  id: ProductId;
  name: string;
  blurb: string;
  priceCents: number;
  image: string;
  gated: boolean;
  sizes: string[];
}

export const SIZES: readonly string[] = ["S", "M", "L", "XL", "XXL"];

export const PRODUCTS: Record<ProductId, Product> = {
  "fart-smella-tee": {
    id: "fart-smella-tee",
    name: "Fart Smella Tee",
    blurb: "For the certified fart smella in your life. No judgment, just fumes.",
    priceCents: 2900,
    image: "/store/fart-smella-tee.png",
    gated: false,
    sizes: [...SIZES],
  },
  "smart-fella-tee": {
    id: "smart-fella-tee",
    name: "Smart Fella Tee",
    blurb: "Earned, not bought. Unlock this one with your Smart Fella code.",
    priceCents: 2900,
    image: "/store/smart-fella-tee.png",
    gated: true,
    sizes: [...SIZES],
  },
};

export function getProduct(id: string): Product | undefined {
  return (PRODUCTS as Record<string, Product>)[id];
}
