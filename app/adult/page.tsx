import {
  EntryScreen,
  entryMetadata,
  type EntrySearchParams,
} from "@/app/_entry/entry-screen";
import { ADULT_SEED } from "@/lib/test/entry";

/**
 * THE ADULT ENTRY URL. `/adult` — lands on the 15-minute test's intro.
 *
 * Paid creative points here instead of at `/`, so the visitor never sees the
 * fork screen they were leaving at. The reasoning, and the reason this is a
 * route rather than a redirect, is in lib/test/entry.ts.
 *
 * IT DOES NOT COLLIDE. The top level already holds the social vanity redirects
 * (/tiktok, /instagram, /youtube, /reddit, /x, /threads), /go/<postid>,
 * /hermes-dashboard, /analytics-optout, the legal and support pages, /about,
 * /internal, /dashboard, /results, /beat and /app-store-copy. This is a new
 * path, and so is its neighbour /grownup.
 */

export async function generateMetadata({
  searchParams,
}: {
  searchParams: EntrySearchParams;
}) {
  return entryMetadata(searchParams);
}

export default async function AdultEntryPage({
  searchParams,
}: {
  searchParams: EntrySearchParams;
}) {
  return <EntryScreen seed={ADULT_SEED} searchParams={searchParams} />;
}
