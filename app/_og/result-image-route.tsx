import { renderFellaOgImage } from "./card";
import { ogSize, contentType, renderResultOgCard } from "./result-card";
import { resultCardDataFor } from "./result-card-data";

/**
 * The shared body of the four per-result link-preview images: an
 * `opengraph-image` and a `twitter-image` under both /results/[token] and
 * /beat/[token].
 *
 * Four convention files because that is how Next discovers them, one
 * implementation because a result that previews as a score on Discord and as
 * something else on X is a bug waiting to be noticed by a stranger.
 *
 * `alt` has to be a static export, so it describes the SHAPE of the card
 * rather than the score on it. The score is in the image and in the page
 * title; an unfurl's alt text is the one place it cannot be dynamic.
 */
export const resultImageSize = ogSize;
export const resultImageContentType = contentType;
export const resultImageAlt =
  "A result card from the Official Smart Fella Test, showing a score and a verdict.";

export async function renderResultImage(params: Promise<{ token: string }>) {
  const { token } = await params;
  const data = resultCardDataFor(token);

  /*
    A DEAD TOKEN FALLS BACK TO THE BRAND CARD rather than 404ing.

    An unfurler that gets a 404 for og:image renders the link with a broken
    image or no image at all, which looks like a broken site. An expired or
    mistyped link is not a broken site, and the honest preview for one is the
    product it points at. The page behind it still says the results have gone.
  */
  return data ? renderResultOgCard(data) : renderFellaOgImage();
}
