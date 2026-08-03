/**
 * The 1080x1920 PNG for one result.
 *
 * GET /results/<token>/share-card -> image/png
 *
 * This is the artefact the share button actually hands over. It is a route
 * handler rather than a Next `opengraph-image` convention file because nothing
 * about it is metadata: the browser fetches it as a blob to pass to
 * `navigator.share`, and downloads it to the camera roll. See
 * app/_og/result-card.tsx for why an image and not a link.
 *
 * SAME-ORIGIN ON PURPOSE. An `<a download>` is ignored cross-origin, so serving
 * this from the site's own origin is what makes "save the image" a one-tap save
 * rather than a long-press on an image in a new tab.
 */
import { renderResultStoryCard } from "@/app/_og/result-card";
import { resultCardDataFor } from "@/app/_og/result-card-data";

// Reads the font and sticker files off disk.
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const data = resultCardDataFor(token);

  // The same blank answer a bad token gets everywhere else. Nothing here tells
  // the holder of a broken link which byte was wrong.
  if (!data) return new Response("Not found", { status: 404 });

  const image = renderResultStoryCard(data);

  /*
    PRIVATE and cached for an hour. The card is one person's result, so it must
    not land in a shared cache, but the share button and the save button fetch
    the same URL seconds apart and re-rendering a 1080x1920 Satori image twice
    for one tap is waste the user pays for in latency.
  */
  image.headers.set("cache-control", "private, max-age=3600, must-revalidate");
  return image;
}
