/**
 * A ~30-line ESM resolver hook so plain `node` can run this repo's TypeScript.
 *
 * Node 22+ strips types natively, which is all the transpiling these scripts
 * need. The only thing it will not do is guess an extension, and this codebase
 * writes extensionless imports plus the `@/*` alias from tsconfig. That is the
 * entire gap, so this closes it rather than pulling in a runner (tsx, ts-node)
 * and its dependency tree for the sake of two scripts.
 *
 * Used by scripts/verify-tests.mjs via `node --import ./scripts/ts-resolve-hook.mjs`.
 */
import { existsSync } from "node:fs";
import { dirname, join, resolve as resolvePath } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { registerHooks } from "node:module";

const ROOT = resolvePath(dirname(fileURLToPath(import.meta.url)), "..");

/** Try `<base>.ts`, `<base>.tsx`, then `<base>/index.ts(x)`. */
function firstExisting(base) {
  const candidates = [
    `${base}.ts`,
    `${base}.tsx`,
    join(base, "index.ts"),
    join(base, "index.tsx"),
  ];
  return candidates.find(existsSync) ?? null;
}

registerHooks({
  resolve(specifier, context, next) {
    const isRelative = specifier.startsWith(".");
    const isAlias = specifier.startsWith("@/");
    const hasExt = /\.[a-z]+$/i.test(specifier);

    if ((isRelative || isAlias) && !hasExt) {
      const base = isAlias
        ? join(ROOT, specifier.slice(2))
        : resolvePath(dirname(fileURLToPath(context.parentURL)), specifier);
      const found = firstExisting(base);
      if (found) return next(pathToFileURL(found).href, context);
    }

    if (isAlias) {
      return next(pathToFileURL(join(ROOT, specifier.slice(2))).href, context);
    }

    return next(specifier, context);
  },
});
