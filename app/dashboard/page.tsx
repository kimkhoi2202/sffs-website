import { isAuthenticated, isUnconfigured } from "@/lib/dashboard/auth";
import { isQueryKeyConfigured } from "@/lib/dashboard/posthog-query";

import { DashboardApp } from "./dashboard-app";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

/**
 * The gate.
 *
 * Rendered on the server so an unauthenticated visitor never receives the
 * dashboard's markup at all — not hidden with CSS, not fetched and discarded.
 * The data route checks the same cookie independently, so neither half trusts
 * the other to have done it.
 */
export default async function DashboardPage() {
  if (isUnconfigured()) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center px-6">
        <div className="rounded-3xl border-[2.5px] border-ink bg-coral p-8 shadow-hard-lg">
          <h1 className="font-display text-3xl uppercase leading-none">Not configured</h1>
          <p className="mt-4 text-[1.05rem] font-semibold leading-[1.6]">
            <code>DASHBOARD_PASSWORD</code> is not set on this deployment, so this page
            refuses to serve. It fails closed on purpose: a dashboard that shows
            individual visitors&rsquo; journeys must never quietly become public because
            an environment variable went missing.
          </p>
        </div>
      </main>
    );
  }

  if (!(await isAuthenticated())) return <LoginForm />;

  return <DashboardApp queryKeyConfigured={isQueryKeyConfigured()} />;
}
