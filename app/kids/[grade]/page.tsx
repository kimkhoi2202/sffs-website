import {
  EntryScreen,
  entryMetadata,
  type EntrySearchParams,
} from "@/app/_entry/entry-screen";
import { childSeedFromSegment } from "@/lib/test/entry";
import { GRADES } from "@/lib/test/types";

/**
 * `/kids/3` … `/kids/8` — the child test for one grade, intro screen first.
 *
 * For creative that already names a grade. The grade picker is a real question
 * when the ad did not answer it and pure friction when it did.
 *
 * ===========================================================================
 * A BAD GRADE RENDERS THE GRADE PICKER. IT DOES NOT 404 AND IT DOES NOT THROW
 * ===========================================================================
 * `GRADES` is 3 to 8, so `/kids/9` is one keystroke away from a real link and
 * `/kids/99` is what somebody will type into the address bar to see what
 * happens. Both reach this file, `childSeedFromSegment` refuses to turn either
 * into a grade, and the flow opens on the picker with the child branch already
 * chosen — the one part of the URL that was not in doubt.
 *
 * NOT A 404, because a 404 on a paid landing URL is money on the floor and the
 * visitor did nothing wrong. NOT THE FORK, because the path said "kids" and
 * making them answer that again is the screen this feature exists to skip. The
 * arrival still reports `grade_rejected` so a broken ad link shows up as a
 * number rather than as nothing at all.
 *
 * `generateStaticParams` prerenders the six real grades; anything else is
 * rendered on demand and still works, which is why there is no `dynamicParams`
 * override here.
 */

export function generateStaticParams() {
  return GRADES.map((grade) => ({ grade: String(grade) }));
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: EntrySearchParams;
}) {
  return entryMetadata(searchParams);
}

export default async function KidsGradeEntryPage({
  params,
  searchParams,
}: {
  params: Promise<{ grade: string }>;
  searchParams: EntrySearchParams;
}) {
  const { grade } = await params;
  return <EntryScreen seed={childSeedFromSegment(grade)} searchParams={searchParams} />;
}
