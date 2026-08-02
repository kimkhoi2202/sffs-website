/**
 * The shared in-memory rate limiter.
 *
 * Lifted verbatim out of app/api/access-signup/route.ts, where it had lived
 * since the signup form was the only thing that could be abused. The results
 * email endpoint needs the same behaviour with different numbers, and two
 * copies of a limiter is how the two drift apart, so it moved here rather than
 * being reimplemented.
 *
 * WHAT THIS IS AND IS NOT. Serverless instances are ephemeral and not shared,
 * so this bounds abuse PER INSTANCE. It is a speed bump, not a distributed
 * guarantee, and it was always documented as one. It is enough to stop a bored
 * person with a browser tab, which is the actual threat. It is not enough to
 * stop someone who wants to be a problem, and the mitigation for that is that
 * the email endpoint also caps total sends on the record itself — a limit that
 * lives in the stored result rather than in a process's memory, and therefore
 * survives both a restart and a different instance.
 */

interface Bucket {
  windowMs: number;
  max: number;
  hits: Map<string, number[]>;
}

const buckets = new Map<string, Bucket>();

function bucketFor(name: string, windowMs: number, max: number): Bucket {
  let bucket = buckets.get(name);
  if (!bucket) {
    bucket = { windowMs, max, hits: new Map() };
    buckets.set(name, bucket);
  }
  return bucket;
}

/**
 * Record a hit against `key` in the named bucket and report whether it went
 * over. Counts the current request, matching the original behaviour: the call
 * that trips the limit is itself rejected.
 */
export function isRateLimited(
  name: string,
  key: string,
  { windowMs, max }: { windowMs: number; max: number },
): boolean {
  const bucket = bucketFor(name, windowMs, max);
  const now = Date.now();
  const recent = (bucket.hits.get(key) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  bucket.hits.set(key, recent);

  // Opportunistically bound memory so a bucket cannot grow without limit.
  if (bucket.hits.size > 5000) {
    for (const [k, times] of bucket.hits) {
      if (times.every((t) => now - t >= windowMs)) bucket.hits.delete(k);
    }
  }

  return recent.length > max;
}

/** The client IP, best effort. Behind Vercel `x-forwarded-for` is set. */
export function clientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}
