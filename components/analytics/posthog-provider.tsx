"use client";

import type { ReactNode } from "react";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";

/**
 * Shares the `posthog-js` singleton (initialized in instrumentation-client.ts)
 * with React context so client components can use `usePostHog()` and the
 * feature-flag hooks. No `apiKey`/`options` here — init already happened; this
 * only wires the provider to the existing instance.
 */
export function PostHogProvider({ children }: { children: ReactNode }) {
  return <PHProvider client={posthog}>{children}</PHProvider>;
}
