#!/usr/bin/env tsx
/**
 * Restore workspace:* dependencies from backups
 * Use this after publishing to revert to workspace protocol
 */

import { readdirSync, copyFileSync, existsSync, rmSync } from 'fs';
import { join } from 'path';

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

  for (const backupFile of backupFiles) {
    const packageName = backupFile.replace('.json', '').replace(/-/g, '/');
    const backupPath = join(BACKUP_DIR, backupFile);

    // Find the original package.json location
    const possiblePaths = [
      join(process.cwd(), 'packages', packageName.split('/').pop()!, 'package.json'),
      join(process.cwd(), 'packages', packageName.replace('@ainative/ai-kit-', ''), 'package.json'),
      join(process.cwd(), 'packages', packageName.replace('@ainative/', ''), 'package.json')
    ];

    let restored = false;
    for (const targetPath of possiblePaths) {
      if (existsSync(targetPath)) {
        copyFileSync(backupPath, targetPath);
        console.log(`  Restored: ${packageName}`);
        restored = true;
        break;
      }
    }

    if (!restored) {
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
