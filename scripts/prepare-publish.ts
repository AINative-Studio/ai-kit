#!/usr/bin/env tsx
/**
 * Prepare packages for publishing by resolving workspace:* dependencies
 * This script creates backups and can be reversed with restore-workspace-deps.ts
 *
 * IMPORTANT: backups MUST be taken of the ORIGINAL (workspace:*) files,
 * before resolveWorkspaceDependencies() mutates them in place. A previous
 * version of this script called resolveWorkspaceDependencies() first and
 * only backed up afterward, which silently backed up the already-resolved
 * (real-semver) package.json files instead of the originals. That made
 * `restore-workspace-deps.ts` a no-op that appeared to work (it copied a
 * file back over itself) while never actually restoring the workspace:*
 * protocol — root cause contributor to insyteful issue #77 / the
 * @ainative/ai-kit EUNSUPPORTEDPROTOCOL bug: the working tree could be left
 * permanently pinned to real versions after a release with no working way
 * back to workspace:* short of `git checkout`.
 */

import { findAllPackageJsonFiles, resolveWorkspaceDependencies } from './workspace-dependency-resolver';
import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';

const BACKUP_DIR = join(process.cwd(), '.workspace-backup');

function createBackupsOfOriginals(rootDir: string): void {
  if (!existsSync(BACKUP_DIR)) {
    mkdirSync(BACKUP_DIR, { recursive: true });
  }

  console.log('\nCreating backups of original package.json files...');
  for (const file of findAllPackageJsonFiles(rootDir)) {
    const pkg = JSON.parse(readFileSync(file, 'utf-8'));
    const backupPath = join(BACKUP_DIR, pkg.name.replace(/\//g, '-') + '.json');
    copyFileSync(file, backupPath);
    console.log(`  Backed up: ${pkg.name}`);
  }
}

function main(): void {
  const rootDir = process.cwd();

  console.log('==================================================');
  console.log('   Preparing Packages for Publishing');
  console.log('==================================================\n');

  // Back up every package.json BEFORE mutating any of them, so restoration
  // always has the true original (workspace:*) state to fall back to.
  createBackupsOfOriginals(rootDir);

  const result = resolveWorkspaceDependencies(rootDir);

  console.log(`\nPackages processed: ${result.packagesProcessed}`);
  console.log(`Total replacements: ${result.totalReplacements}`);

  if (result.totalReplacements > 0) {
    console.log('\nReplacements made:');
    for (const detail of result.details) {
      if (detail.replacements.length > 0) {
        console.log(`\n  ${detail.package}:`);
        for (const replacement of detail.replacements) {
          console.log(`    ${replacement.package}: ${replacement.from} -> ${replacement.to}`);
        }
      }
    }
  } else {
    console.log('\nNo workspace dependencies to resolve.');
  }

  if (result.errors.length > 0) {
    console.error('\nErrors encountered:');
    for (const error of result.errors) {
      console.error(`  ${error}`);
    }
    process.exit(1);
  }

  console.log('\n==================================================');
  console.log('   Packages ready for publishing!');
  console.log('==================================================');
  console.log('\nNext steps:');
  console.log('  1. Run your build process: pnpm build');
  console.log('  2. Publish packages: pnpm publish -r');
  console.log('  3. Restore workspace deps: pnpm run restore:workspace');
  console.log('\n');
}

main();
