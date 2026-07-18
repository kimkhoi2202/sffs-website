import { ogAlt, ogContentType, ogSize, renderFellaOgImage } from "./_og/card";

// summary_large_image reuses the exact same 1200×630 hero card as Open Graph.
export const runtime = "nodejs";

export const alt = ogAlt;
export const size = ogSize;
export const contentType = ogContentType;

export default function TwitterImage() {
  return renderFellaOgImage();
}
