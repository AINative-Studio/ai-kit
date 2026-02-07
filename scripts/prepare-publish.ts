#!/usr/bin/env tsx
/**
 * Prepare packages for publishing by resolving workspace:* dependencies
 * This script creates backups and can be reversed with restore-workspace-deps.ts
 */

import { resolveWorkspaceDependencies } from './workspace-dependency-resolver';
import { copyFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const BACKUP_DIR = join(process.cwd(), '.workspace-backup');

function createBackups(details: any[]): void {
  if (!existsSync(BACKUP_DIR)) {
    mkdirSync(BACKUP_DIR, { recursive: true });
  }

  console.log('\nCreating backups...');
  for (const detail of details) {
    if (detail.replacements.length > 0) {
      const backupPath = join(BACKUP_DIR, detail.package.replace(/\//g, '-') + '.json');
      copyFileSync(detail.path, backupPath);
      console.log(`  Backed up: ${detail.package}`);
    }
  }
}

function main(): void {
  const rootDir = process.cwd();

  console.log('==================================================');
  console.log('   Preparing Packages for Publishing');
  console.log('==================================================\n');

  const result = resolveWorkspaceDependencies(rootDir);

  console.log(`\nPackages processed: ${result.packagesProcessed}`);
  console.log(`Total replacements: ${result.totalReplacements}`);

  if (result.totalReplacements > 0) {
    createBackups(result.details);

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
