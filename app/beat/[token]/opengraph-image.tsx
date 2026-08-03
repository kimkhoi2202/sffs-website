import {
  renderResultImage,
  resultImageAlt,
  resultImageContentType,
  resultImageSize,
} from "@/app/_og/result-image-route";

// Node runtime so the card can read the bundled fonts + stickers from disk.
export const runtime = "nodejs";

export const alt = resultImageAlt;
export const size = resultImageSize;
export const contentType = resultImageContentType;

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  return renderResultImage(params);
}
