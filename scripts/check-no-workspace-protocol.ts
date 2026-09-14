#!/usr/bin/env tsx
/**
 * Publish-time guard: fails the publish if this package still has an
 * unresolved `workspace:*` dependency specifier.
 *
 * Root cause this closes (insyteful issue #77 / core#7310-adjacent):
 * `pnpm run prepare:publish` rewrites `workspace:*` -> a real semver range
 * before publishing, but that step is a manual, un-enforced part of the
 * documented release process (docs/RELEASE.md) and this repo has no CI
 * publish workflow to run it automatically. When v0.2.0 of
 * `@ainative/ai-kit` (packages/react) was published, `prepare:publish` was
 * never run (or a plain `npm publish` was run directly inside the package
 * directory), so the tarball that reached npm still contained
 * `"@ainative/ai-kit-core": "workspace:*"` — a specifier only pnpm
 * understands, which throws EUNSUPPORTEDPROTOCOL for every consumer
 * outside this monorepo.
 *
 * Wiring this as `prepublishOnly` makes that failure mode structurally
 * impossible: `npm publish` / `pnpm publish` always runs `prepublishOnly`
 * before packing, so a publish attempted without first running
 * `prepare:publish` now hard-fails instead of silently shipping a broken
 * manifest.
 */

import { readFileSync } from 'fs';
import { join } from 'path';

function main(): void {
  const pkgPath = join(process.cwd(), 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));

  const dependencyTypes = ['dependencies', 'devDependencies', 'peerDependencies'] as const;
  const offenders: string[] = [];

  for (const depType of dependencyTypes) {
    const deps = pkg[depType];
    if (!deps) continue;

    for (const [depName, depVersion] of Object.entries(deps)) {
      if (typeof depVersion === 'string' && depVersion.startsWith('workspace:')) {
        offenders.push(`${depType}.${depName} = "${depVersion}"`);
      }
    }
  }

  if (offenders.length > 0) {
    console.error(
      `\nERROR: refusing to publish "${pkg.name}" — unresolved workspace: protocol dependencies found:\n`
    );
    for (const offender of offenders) {
      console.error(`  ${offender}`);
    }
    console.error(
      '\nThese must be rewritten to real semver versions before publishing, or every ' +
        'consumer outside this monorepo gets EUNSUPPORTEDPROTOCOL on `npm install`.\n' +
        'Run this from the repo root first:\n\n' +
        '  pnpm run prepare:publish\n\n' +
        'then publish, then:\n\n' +
        '  pnpm run restore:workspace\n'
    );
    process.exit(1);
  }
}

main();
