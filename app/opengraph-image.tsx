import { ogAlt, ogContentType, ogSize, renderFellaOgImage } from "./_og/card";

// Node runtime so the card can read the bundled font + logo files from disk.
export const runtime = "nodejs";

export const alt = ogAlt;
export const size = ogSize;
export const contentType = ogContentType;

export default function OpengraphImage() {
  return renderFellaOgImage();
}
