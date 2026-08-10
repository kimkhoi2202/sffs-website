import {
  EntryScreen,
  entryMetadata,
  type EntrySearchParams,
} from "@/app/_entry/entry-screen";
import { childSeedFromSegment } from "@/lib/test/entry";

/**
 * THE CHILD ENTRY URL. `/kids` — lands on the grade picker.
 *
 * ON THE GRADE PICKER, NOT ON QUESTION ONE, and that is the whole decision
 * worth reading before changing this: the child test is grade-banded, so there
 * is no single "child test" to open. The full argument is in lib/test/entry.ts.
 *
 * This still deletes the fork. `/kids` skips BOTH of them — the adult-or-kid
 * fork and the me-or-my-child fork — and opens on the first screen that asks
 * something the ad could not have answered.
 *
 * For a creative that IS grade-specific, /kids/5 skips this screen too.
 */

export async function generateMetadata({
  searchParams,
}: {
  searchParams: EntrySearchParams;
}) {
  return entryMetadata(searchParams);
}

export default async function KidsEntryPage({
  searchParams,
}: {
  searchParams: EntrySearchParams;
}) {
  // No segment at all, which is not the same as a segment we rejected — see
  // `gradeRejected`.
  return <EntryScreen seed={childSeedFromSegment(null)} searchParams={searchParams} />;
}
