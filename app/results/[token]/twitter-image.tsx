import {
  renderResultImage,
  resultImageAlt,
  resultImageContentType,
  resultImageSize,
} from "@/app/_og/result-image-route";

export const runtime = "nodejs";

export const alt = resultImageAlt;
export const size = resultImageSize;
export const contentType = resultImageContentType;

export default async function TwitterImage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  return renderResultImage(params);
}
