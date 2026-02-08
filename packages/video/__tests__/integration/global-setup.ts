/**
 * Global setup for Playwright integration tests
 * Runs once before all tests
 */

import { chromium, FullConfig } from '@playwright/test';
import { spawn, ChildProcess } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

let devServer: ChildProcess | null = null;

async function globalSetup(config: FullConfig) {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const rootDir = join(__dirname, '../..');

  // Check if package is built
  const distExists = await checkDistExists(rootDir);

  if (!distExists) {
    console.log('⚠️  Package not built. Building package...');
    await buildPackage(rootDir);
  }

  // Start dev server for test page (if needed)
  // For now, we'll use Playwright's built-in web server feature
  // which is configured in playwright.config.ts

  console.log('✅ Global setup complete');
}

async function checkDistExists(rootDir: string): Promise<boolean> {
  try {
    const { access } = await import('fs/promises');
    const { constants } = await import('fs');
    await access(join(rootDir, 'dist'), constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function buildPackage(rootDir: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const build = spawn('npm', ['run', 'build'], {
      cwd: rootDir,
      stdio: 'inherit',
      shell: true,
    });

    build.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Build failed with code ${code}`));
      }
    });
  });
}

export default globalSetup;
