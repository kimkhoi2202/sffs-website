import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase admin client (SERVICE ROLE).
 *
 * The service role key bypasses Row Level Security, so this module must NEVER be
 * imported from client code. The `server-only` import above turns any accidental
 * client import into a build error — a hard guardrail on top of the fact that
 * `SUPABASE_SERVICE_ROLE_KEY` is not `NEXT_PUBLIC_` and so is never inlined into
 * the browser bundle.
 *
 * Env vars are read at call time (not module load) and the client is cached, so
 * a missing key fails the specific request with a clear message instead of
 * crashing the whole server at boot.
 */
let cached: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase is not configured: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  cached = createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  return cached;
}
