#!/usr/bin/env tsx
/**
 * Publish-time guard: fails the publish if this package declares TypeScript
 * types in package.json but the declared file is missing or empty from the
 * built dist/ output.
 *
 * Root cause this closes (#211): @ainative/ai-kit@0.2.1 was published to npm
 * with package.json declaring `"types": "./dist/index.d.ts"` and every
 * `exports` condition pointing a `types` field at the same file, but the
 * published tarball never contained it — only index.js/.mjs and their
 * sourcemaps. A fresh `pnpm build` today reproduces a correct
 * dist/index.d.ts (tsup's `dts: true` works), so the defect was not in the
 * build config itself but in the manual, unenforced release process: like
 * the workspace:* bug this mirrors (check-no-workspace-protocol.ts), there
 * is no CI publish workflow, so a publish run against a stale or partially
 * cleaned dist/ silently ships without types and nothing catches it before
 * the tarball reaches npm.
 *
 * Wiring this as `prepublishOnly` makes that failure mode structurally
 * impossible: every declared types path must exist and be non-empty before
 * a publish is allowed to proceed.
 */

import { existsSync, readFileSync, statSync } from 'fs';
import { dirname, join } from 'path';

export interface TypesCheckResult {
  ok: boolean;
  missing: string[];
}

export function collectDeclaredTypesPaths(pkg: Record<string, unknown>): string[] {
  const paths = new Set<string>();

  if (typeof pkg.types === 'string') {
    paths.add(pkg.types);
  }
  if (typeof pkg.typings === 'string') {
    paths.add(pkg.typings);
  }

  const exportsField = pkg.exports as Record<string, unknown> | undefined;
  if (exportsField && typeof exportsField === 'object') {
    for (const condition of Object.values(exportsField)) {
      if (condition && typeof condition === 'object') {
        const types = (condition as Record<string, unknown>).types;
        if (typeof types === 'string') {
          paths.add(types);
        }
      }
    }
  }

  return Array.from(paths);
}

export function checkDistHasTypes(packageDir: string, pkg: Record<string, unknown>): TypesCheckResult {
  const declaredPaths = collectDeclaredTypesPaths(pkg);
  const missing: string[] = [];

  for (const relativePath of declaredPaths) {
    const absolutePath = join(packageDir, relativePath);
    if (!existsSync(absolutePath) || statSync(absolutePath).size === 0) {
      missing.push(relativePath);
    }
  }

  return { ok: missing.length === 0, missing };
}

function main(): void {
  const packageDir = process.cwd();
  const pkgPath = join(packageDir, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));

  const result = checkDistHasTypes(packageDir, pkg);

  if (!result.ok) {
    console.error(
      `\nERROR: refusing to publish "${pkg.name}" — package.json declares TypeScript ` +
        `types but the built file is missing or empty:\n`
    );
    for (const missingPath of result.missing) {
      console.error(`  ${missingPath}`);
    }
    console.error(
      '\nRun a clean build before publishing:\n\n' +
        `  cd ${dirname(pkgPath)} && pnpm run clean && pnpm run build\n\n` +
        'then verify the file exists and is non-empty before retrying publish.\n'
    );
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
