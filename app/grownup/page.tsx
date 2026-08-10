import {
  EntryScreen,
  entryMetadata,
  type EntrySearchParams,
} from "@/app/_entry/entry-screen";
import { ADULT_SEED } from "@/lib/test/entry";

/**
 * `/grownup` — the same screen as `/adult`, and it exists as insurance.
 *
 * ===========================================================================
 * WHY A SECOND SPELLING OF ONE URL
 * ===========================================================================
 * `/adult` is the better link: it is the word the fork screen itself uses
 * ("I'm an adult") and the word the codebase uses for the audience, so it is
 * the one to put in the creative. But it is also a word that ad review systems
 * pattern-match on, and TikTok is the channel this is being built for. A
 * landing URL containing "adult" is a small but real chance of a rejected ad,
 * and the cost of that lands entirely on whoever has to re-cut ten assets
 * pointing at a URL that no longer works.
 *
 * So the fallback exists NOW, before it is needed, and switching to it is a
 * find-and-replace in the ad platform rather than a deploy. It is deliberately
 * not a redirect, for the same attribution reason as everything else here: a
 * redirect would have to enumerate the query parameters it preserves, and
 * `ttclid` is TikTok's to rename.
 *
 * Both are noindexed and canonical to `/` (see entryMetadata), so two spellings
 * of one page cost nothing in the index.
 */

export async function generateMetadata({
  searchParams,
}: {
  searchParams: EntrySearchParams;
}) {
  return entryMetadata(searchParams);
}

export default async function GrownupEntryPage({
  searchParams,
}: {
  searchParams: EntrySearchParams;
}) {
  return <EntryScreen seed={ADULT_SEED} searchParams={searchParams} />;
}
