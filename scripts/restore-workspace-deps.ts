#!/usr/bin/env tsx
/**
 * Restore workspace:* dependencies from backups
 * Use this after publishing to revert to workspace protocol
 */

import { readdirSync, readFileSync, copyFileSync, existsSync, rmSync } from 'fs';
import { join } from 'path';
import { findAllPackageJsonFiles } from './workspace-dependency-resolver';

const BACKUP_DIR = join(process.cwd(), '.workspace-backup');

function main(): void {
  console.log('==================================================');
  console.log('   Restoring Workspace Dependencies');
  console.log('==================================================\n');

  if (!existsSync(BACKUP_DIR)) {
    console.log('No backups found. Nothing to restore.');
    return;
  }

  const backupFiles = readdirSync(BACKUP_DIR).filter(f => f.endsWith('.json'));

  if (backupFiles.length === 0) {
    console.log('No backup files found.');
    return;
  }

  console.log(`Found ${backupFiles.length} backup(s) to restore:\n`);

  // Build a name -> path index of every real package.json in the workspace,
  // so restoration doesn't depend on reverse-engineering the package name
  // from its backup filename (previously `.replace(/-/g, '/')`, which is
  // not a true inverse of `.replace(/\//g, '-')` for any package whose name
  // contains a hyphen, e.g. "@ainative/ai-kit" or
  // "@ainative/ai-kit-design-system" — those silently failed to restore).
  const packageJsonFiles = findAllPackageJsonFiles(process.cwd());
  const pathsByName = new Map<string, string>();
  for (const file of packageJsonFiles) {
    try {
      const pkg = JSON.parse(readFileSync(file, 'utf-8'));
      if (pkg.name) {
        pathsByName.set(pkg.name, file);
      }
    } catch {
      // Skip malformed package.json files
      continue;
    }
  }

  for (const backupFile of backupFiles) {
    const backupPath = join(BACKUP_DIR, backupFile);
    const backedUpPkg = JSON.parse(readFileSync(backupPath, 'utf-8'));
    const packageName = backedUpPkg.name;

    const targetPath = pathsByName.get(packageName);

    if (targetPath && existsSync(targetPath)) {
      copyFileSync(backupPath, targetPath);
      console.log(`  Restored: ${packageName}`);
    } else {
      console.warn(`  Warning: Could not find target for ${packageName}`);
    }
  }

  // Clean up backup directory
  rmSync(BACKUP_DIR, { recursive: true, force: true });

  console.log('\n==================================================');
  console.log('   Workspace dependencies restored!');
  console.log('==================================================\n');
}

main();
