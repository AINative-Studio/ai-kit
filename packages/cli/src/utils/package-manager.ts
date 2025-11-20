import { existsSync } from 'fs';
import { join } from 'path';
import { execa } from 'execa';

export type PackageManager = 'npm' | 'yarn' | 'pnpm';

/**
 * Detect the package manager used in the current project
 */
export async function detectPackageManager(): Promise<PackageManager> {
  // Check for lock files
  if (existsSync('pnpm-lock.yaml')) return 'pnpm';
  if (existsSync('yarn.lock')) return 'yarn';
  if (existsSync('package-lock.json')) return 'npm';

  // Check if pnpm is available globally
  try {
    await execa('pnpm', ['--version']);
    return 'pnpm';
  } catch {
    // Continue
  }

  // Check if yarn is available
  try {
    await execa('yarn', ['--version']);
    return 'yarn';
  } catch {
    // Continue
  }

  // Default to npm
  return 'npm';
}

/**
 * Install dependencies using the specified package manager
 */
export async function installDependencies(
  projectPath: string,
  packageManager: PackageManager
): Promise<void> {
  const commands: Record<PackageManager, string[]> = {
    npm: ['install'],
    yarn: ['install'],
    pnpm: ['install'],
  };

  await execa(packageManager, commands[packageManager], {
    cwd: projectPath,
    stdio: 'inherit',
  });
}

/**
 * Add packages to the project
 */
export async function addPackage(
  packageName: string,
  options: {
    dev?: boolean;
    cwd?: string;
    packageManager?: PackageManager;
  } = {}
): Promise<void> {
  const pm = options.packageManager || (await detectPackageManager());
  const args: string[] = [];

  switch (pm) {
    case 'npm':
      args.push('install', packageName);
      if (options.dev) args.push('--save-dev');
      break;
    case 'yarn':
      args.push('add', packageName);
      if (options.dev) args.push('--dev');
      break;
    case 'pnpm':
      args.push('add', packageName);
      if (options.dev) args.push('--save-dev');
      break;
  }

  await execa(pm, args, {
    cwd: options.cwd || process.cwd(),
    stdio: 'inherit',
  });
}

/**
 * Remove packages from the project
 */
export async function removePackage(
  packageName: string,
  options: {
    cwd?: string;
    packageManager?: PackageManager;
  } = {}
): Promise<void> {
  const pm = options.packageManager || (await detectPackageManager());
  const commands: Record<PackageManager, string[]> = {
    npm: ['uninstall', packageName],
    yarn: ['remove', packageName],
    pnpm: ['remove', packageName],
  };

  await execa(pm, commands[pm], {
    cwd: options.cwd || process.cwd(),
    stdio: 'inherit',
  });
}

/**
 * Get the run command for scripts
 */
export function getRunCommand(packageManager: PackageManager): string {
  return packageManager === 'npm' ? 'npm run' : packageManager;
}
