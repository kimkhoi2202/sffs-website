/**
 * The ONLY way the dev tools can mount.
 *
 * ===========================================================================
 * HOW THE DEV SUITE IS MADE UNSHIPPABLE
 * ===========================================================================
 * Four layers, three of which are structural rather than a rule someone has to
 * remember, and the last of which proves the other three actually worked.
 *
 * 1. THIS GATE IS THE ONLY MOUNT POINT. Nothing else in the app imports the
 *    panel. Adding a second call site means importing this file, which carries
 *    the guard with it.
 *
 * 2. THE IMPORT SITS INSIDE A BRANCH THE BUNDLER DELETES. Next replaces
 *    `process.env.NODE_ENV` with a string literal at build time, so in a
 *    production build the condition below reads `if ("production" !== "production")`
 *    and webpack removes the whole branch before it ever creates a dependency
 *    for the `import()`. The panel is therefore not a lazily-loaded chunk that
 *    nobody requests — it is not emitted at all. The dynamic import is doing
 *    the work here; a static import with a runtime `if` would still ship the
 *    module's code.
 *
 * 3. THE PANEL REFUSES TO BE IMPORTED IN PRODUCTION. It throws at module scope
 *    (see dev-tools-panel.tsx). So if a future change reintroduces a static
 *    import from somewhere, the failure is a loud crash at build or boot rather
 *    than a dev panel quietly appearing on the live site.
 *
 * 4. THE BUILD CHECKS. `npm run build` runs `verify:no-devtools` afterwards as
 *    a `postbuild` script, which greps the entire production output for a
 *    sentinel string that exists only inside the dev-tools module. If the
 *    sentinel is in the bundle, the build fails. This is the layer that makes
 *    the other three trustworthy: they are arguments about how a bundler
 *    behaves, and this one is a measurement. It runs in CI and on Vercel too,
 *    because it is attached to the build rather than to a habit.
 *
 * That sentinel is deliberately not written out anywhere in THIS file, because
 * this file does ship and the check would then find itself.
 */
"use client";

import { useEffect, useState, type ComponentType } from "react";

import type { FlowDevApi } from "../test-flow";

type PanelComponent = ComponentType<{ api: FlowDevApi }>;

export function DevToolsGate({ api }: { api: FlowDevApi }) {
  const [Panel, setPanel] = useState<PanelComponent | null>(null);

  useEffect(() => {
    // Layer 2. In a production build this condition is `"production" !== "production"`,
    // the branch is removed, and the import below is never turned into a chunk.
    if (process.env.NODE_ENV !== "production") {
      let cancelled = false;
      void import("./dev-tools-panel").then((mod) => {
        // setState with a component value needs the updater form, or React
        // calls the component as a lazy initialiser.
        if (!cancelled) setPanel(() => mod.DevToolsPanel);
      });
      return () => {
        cancelled = true;
      };
    }
  }, []);

  if (process.env.NODE_ENV === "production") return null;
  if (!Panel) return null;
  return <Panel api={api} />;
}
