import { describe, expect, it } from "vitest";
import { getProduct, PRODUCTS } from "@/lib/store/products";

describe("PRODUCTS catalog", () => {
  it("has both product ids present", () => {
    expect(PRODUCTS["fart-smella-tee"]).toBeDefined();
    expect(PRODUCTS["smart-fella-tee"]).toBeDefined();
  });

  it("gives every product a positive price and at least one size", () => {
    for (const product of Object.values(PRODUCTS)) {
      expect(product.priceCents).toBeGreaterThan(0);
      expect(product.sizes.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("gates exactly the smart-fella tee", () => {
    const gated = Object.values(PRODUCTS).filter((product) => product.gated);
    expect(gated).toHaveLength(1);
    expect(gated[0]?.id).toBe("smart-fella-tee");
  });

  it("returns undefined for an unknown product id", () => {
    expect(getProduct("nope")).toBeUndefined();
  });
});
