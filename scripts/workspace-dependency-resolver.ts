import { readdirSync, readFileSync, writeFileSync, statSync } from 'fs';
import { join, dirname } from 'path';

export interface PackageJson {
  name: string;
  version: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  [key: string]: any;
}

export interface Replacement {
  package: string;
  from: string;
  to: string;
}

export interface ReplacementResult {
  modified: boolean;
  replacements: Replacement[];
}

export interface ValidationResult {
  valid: boolean;
  workspaceDependencies: string[];
}

export interface PackageDetail {
  package: string;
  path: string;
  replacements: Replacement[];
}

export interface ResolveResult {
  success: boolean;
  packagesProcessed: number;
  totalReplacements: number;
  details: PackageDetail[];
  errors: string[];
  timestamp: string;
}

/**
 * Recursively finds all package.json files in the workspace
 * Excludes node_modules, examples, and other non-publishable directories
 */
export function findAllPackageJsonFiles(rootDir: string): string[] {
  const packageJsonFiles: string[] = [];
  const excludeDirs = ['node_modules', 'examples', 'dist', '.git', 'coverage'];

  function walk(dir: string): void {
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        if (!excludeDirs.includes(entry.name)) {
          walk(fullPath);
        }
      } else if (entry.isFile() && entry.name === 'package.json') {
        // Only include package.json files in packages/ directory
        if (fullPath.includes('/packages/')) {
          packageJsonFiles.push(fullPath);
        }
      }
    }
  }

  walk(rootDir);
  return packageJsonFiles;
}

/**
 * Gets the version of a package by searching all package.json files
 */
export function getPackageVersion(packageName: string, rootDir: string): string | null {
  const packageJsonFiles = findAllPackageJsonFiles(rootDir);

  for (const file of packageJsonFiles) {
    try {
      const content = readFileSync(file, 'utf-8');
      const pkg: PackageJson = JSON.parse(content);

      if (pkg.name === packageName) {
        return pkg.version;
      }
    } catch (error) {
      // Skip malformed package.json files
      continue;
    }
  }

  return null;
}

/**
 * Replaces workspace:* dependencies with actual version numbers
 */
export function replaceWorkspaceDependencies(
  packageJsonPath: string,
  rootDir: string
): ReplacementResult {
  const content = readFileSync(packageJsonPath, 'utf-8');
  const pkg: PackageJson = JSON.parse(content);
  const replacements: Replacement[] = [];

  const dependencyTypes = ['dependencies', 'devDependencies', 'peerDependencies'] as const;

  for (const depType of dependencyTypes) {
    const deps = pkg[depType];
    if (!deps) continue;

    for (const [depName, depVersion] of Object.entries(deps)) {
      // Check if it's a workspace dependency
      if (depVersion.startsWith('workspace:')) {
        const version = getPackageVersion(depName, rootDir);

        if (!version) {
          throw new Error(
            `Cannot resolve workspace dependency "${depName}" - package not found in workspace`
          );
        }

        // Extract the workspace prefix type (*, ^, ~)
        const prefix = depVersion.replace('workspace:', '');
        let resolvedVersion = version;

        // Preserve semver prefix if specified
        if (prefix === '^') {
          resolvedVersion = `^${version}`;
        } else if (prefix === '~') {
          resolvedVersion = `~${version}`;
        }

        replacements.push({
          package: depName,
          from: depVersion,
          to: resolvedVersion
        });

        deps[depName] = resolvedVersion;
      }
    }
  }

  if (replacements.length > 0) {
    // Write back with preserved formatting (2-space indentation)
    writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n');
  }

  return {
    modified: replacements.length > 0,
    replacements
  };
}

/**
 * Validates that all workspace dependencies have been resolved
 */
export function validateResolvedDependencies(packageJsonPath: string): ValidationResult {
  const content = readFileSync(packageJsonPath, 'utf-8');
  const pkg: PackageJson = JSON.parse(content);
  const workspaceDependencies: string[] = [];

  const dependencyTypes = ['dependencies', 'devDependencies', 'peerDependencies'] as const;

  for (const depType of dependencyTypes) {
    const deps = pkg[depType];
    if (!deps) continue;

    for (const [depName, depVersion] of Object.entries(deps)) {
      if (depVersion.startsWith('workspace:')) {
        workspaceDependencies.push(depName);
      }
    }
  }

  return {
    valid: workspaceDependencies.length === 0,
    workspaceDependencies
  };
}

/**
 * Main function to resolve all workspace dependencies in the monorepo
 */
export function resolveWorkspaceDependencies(rootDir: string): ResolveResult {
  const packageJsonFiles = findAllPackageJsonFiles(rootDir);
  const details: PackageDetail[] = [];
  const errors: string[] = [];
  let totalReplacements = 0;

  for (const file of packageJsonFiles) {
    try {
      const content = readFileSync(file, 'utf-8');
      const pkg: PackageJson = JSON.parse(content);

      const result = replaceWorkspaceDependencies(file, rootDir);

      if (result.modified) {
        totalReplacements += result.replacements.length;
      }

      details.push({
        package: pkg.name,
        path: file,
        replacements: result.replacements
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push(`Error processing ${file}: ${errorMessage}`);
    }
  }

  return {
    success: errors.length === 0,
    packagesProcessed: packageJsonFiles.length,
    totalReplacements,
    details,
    errors,
    timestamp: new Date().toISOString()
  };
}

/**
 * CLI entry point
 */
export function main(): void {
  const rootDir = process.cwd();

  console.log('Resolving workspace dependencies...\n');

  const result = resolveWorkspaceDependencies(rootDir);

  console.log(`Packages processed: ${result.packagesProcessed}`);
  console.log(`Total replacements: ${result.totalReplacements}\n`);

  if (result.totalReplacements > 0) {
    console.log('Replacements made:');
    for (const detail of result.details) {
      if (detail.replacements.length > 0) {
        console.log(`\n${detail.package}:`);
        for (const replacement of detail.replacements) {
          console.log(`  ${replacement.package}: ${replacement.from} -> ${replacement.to}`);
        }
      }
    }
  } else {
    console.log('No workspace dependencies found or all already resolved.');
  }

  if (result.errors.length > 0) {
    console.error('\nErrors:');
    for (const error of result.errors) {
      console.error(`  ${error}`);
    }
    process.exit(1);
  }

  console.log('\nWorkspace dependencies resolved successfully!');
}

// Run if called directly
if (require.main === module) {
  main();
}
