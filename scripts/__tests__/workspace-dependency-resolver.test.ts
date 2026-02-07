import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import {
  resolveWorkspaceDependencies,
  findAllPackageJsonFiles,
  getPackageVersion,
  replaceWorkspaceDependencies,
  validateResolvedDependencies
} from '../workspace-dependency-resolver';

describe('Workspace Dependency Resolver', () => {
  const testDir = join(process.cwd(), 'scripts/__tests__/fixtures/workspace-deps');

  beforeEach(() => {
    // Create test fixtures
    mkdirSync(testDir, { recursive: true });
    mkdirSync(join(testDir, 'packages/core'), { recursive: true });
    mkdirSync(join(testDir, 'packages/react'), { recursive: true });

    // Create core package.json
    writeFileSync(
      join(testDir, 'packages/core/package.json'),
      JSON.stringify({
        name: '@ainative/ai-kit-core',
        version: '0.1.4',
        dependencies: {}
      }, null, 2)
    );

    // Create react package.json with workspace dependency
    writeFileSync(
      join(testDir, 'packages/react/package.json'),
      JSON.stringify({
        name: '@ainative/ai-kit',
        version: '0.1.0-alpha.4',
        dependencies: {
          '@ainative/ai-kit-core': 'workspace:*',
          'react-markdown': '^10.1.0'
        }
      }, null, 2)
    );
  });

  afterEach(() => {
    // Clean up test fixtures
    rmSync(testDir, { recursive: true, force: true });
  });

  describe('findAllPackageJsonFiles', () => {
    it('should find all package.json files in workspace', () => {
      const files = findAllPackageJsonFiles(testDir);

      expect(files).toBeInstanceOf(Array);
      expect(files.length).toBeGreaterThan(0);
      expect(files.some(f => f.includes('packages/core/package.json'))).toBe(true);
      expect(files.some(f => f.includes('packages/react/package.json'))).toBe(true);
    });

    it('should exclude node_modules directories', () => {
      mkdirSync(join(testDir, 'node_modules/@test'), { recursive: true });
      writeFileSync(
        join(testDir, 'node_modules/@test/package.json'),
        JSON.stringify({ name: '@test/pkg' }, null, 2)
      );

      const files = findAllPackageJsonFiles(testDir);
      expect(files.some(f => f.includes('node_modules'))).toBe(false);
    });

    it('should exclude examples directories', () => {
      mkdirSync(join(testDir, 'examples/demo'), { recursive: true });
      writeFileSync(
        join(testDir, 'examples/demo/package.json'),
        JSON.stringify({ name: 'demo-app' }, null, 2)
      );

      const files = findAllPackageJsonFiles(testDir);
      expect(files.some(f => f.includes('examples'))).toBe(false);
    });
  });

  describe('getPackageVersion', () => {
    it('should retrieve the version of a package by name', () => {
      const version = getPackageVersion('@ainative/ai-kit-core', testDir);
      expect(version).toBe('0.1.4');
    });

    it('should return null for non-existent package', () => {
      const version = getPackageVersion('@ainative/non-existent', testDir);
      expect(version).toBeNull();
    });

    it('should handle scoped package names correctly', () => {
      const version = getPackageVersion('@ainative/ai-kit-core', testDir);
      expect(version).toBeTruthy();
      expect(typeof version).toBe('string');
    });
  });

  describe('replaceWorkspaceDependencies', () => {
    it('should replace workspace:* with actual version', () => {
      const packageJsonPath = join(testDir, 'packages/react/package.json');
      const result = replaceWorkspaceDependencies(packageJsonPath, testDir);

      expect(result.modified).toBe(true);
      expect(result.replacements).toHaveLength(1);
      expect(result.replacements[0]).toEqual({
        package: '@ainative/ai-kit-core',
        from: 'workspace:*',
        to: '0.1.4'
      });

      const updated = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      expect(updated.dependencies['@ainative/ai-kit-core']).toBe('0.1.4');
      expect(updated.dependencies['react-markdown']).toBe('^10.1.0');
    });

    it('should not modify packages without workspace dependencies', () => {
      const packageJsonPath = join(testDir, 'packages/core/package.json');
      const result = replaceWorkspaceDependencies(packageJsonPath, testDir);

      expect(result.modified).toBe(false);
      expect(result.replacements).toHaveLength(0);
    });

    it('should handle workspace:^ prefix', () => {
      const packageJsonPath = join(testDir, 'packages/react/package.json');
      const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      pkg.dependencies['@ainative/ai-kit-core'] = 'workspace:^';
      writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2));

      const result = replaceWorkspaceDependencies(packageJsonPath, testDir);

      expect(result.modified).toBe(true);
      const updated = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      expect(updated.dependencies['@ainative/ai-kit-core']).toBe('^0.1.4');
    });

    it('should handle workspace:~ prefix', () => {
      const packageJsonPath = join(testDir, 'packages/react/package.json');
      const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      pkg.dependencies['@ainative/ai-kit-core'] = 'workspace:~';
      writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2));

      const result = replaceWorkspaceDependencies(packageJsonPath, testDir);

      expect(result.modified).toBe(true);
      const updated = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      expect(updated.dependencies['@ainative/ai-kit-core']).toBe('~0.1.4');
    });

    it('should preserve formatting and indentation', () => {
      const packageJsonPath = join(testDir, 'packages/react/package.json');
      const originalContent = readFileSync(packageJsonPath, 'utf-8');

      replaceWorkspaceDependencies(packageJsonPath, testDir);

      const updatedContent = readFileSync(packageJsonPath, 'utf-8');
      // Both should have consistent 2-space indentation
      expect(updatedContent).toMatch(/\n {2}"/);
      expect(updatedContent).toMatch(/\n {4}"/);
    });

    it('should handle devDependencies with workspace protocol', () => {
      const packageJsonPath = join(testDir, 'packages/react/package.json');
      const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      pkg.devDependencies = {
        '@ainative/ai-kit-core': 'workspace:*'
      };
      writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2));

      const result = replaceWorkspaceDependencies(packageJsonPath, testDir);

      expect(result.modified).toBe(true);
      const updated = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      expect(updated.devDependencies['@ainative/ai-kit-core']).toBe('0.1.4');
    });

    it('should handle peerDependencies with workspace protocol', () => {
      const packageJsonPath = join(testDir, 'packages/react/package.json');
      const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      pkg.peerDependencies = {
        '@ainative/ai-kit-core': 'workspace:*'
      };
      writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2));

      const result = replaceWorkspaceDependencies(packageJsonPath, testDir);

      expect(result.modified).toBe(true);
      const updated = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      expect(updated.peerDependencies['@ainative/ai-kit-core']).toBe('0.1.4');
    });

    it('should throw error when referenced package version not found', () => {
      const packageJsonPath = join(testDir, 'packages/react/package.json');
      const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      pkg.dependencies['@ainative/non-existent'] = 'workspace:*';
      writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2));

      expect(() => {
        replaceWorkspaceDependencies(packageJsonPath, testDir);
      }).toThrow();
    });
  });

  describe('validateResolvedDependencies', () => {
    it('should validate that all workspace dependencies are resolved', () => {
      const packageJsonPath = join(testDir, 'packages/react/package.json');
      replaceWorkspaceDependencies(packageJsonPath, testDir);

      const result = validateResolvedDependencies(packageJsonPath);

      expect(result.valid).toBe(true);
      expect(result.workspaceDependencies).toHaveLength(0);
    });

    it('should detect unresolved workspace dependencies', () => {
      const packageJsonPath = join(testDir, 'packages/react/package.json');

      const result = validateResolvedDependencies(packageJsonPath);

      expect(result.valid).toBe(false);
      expect(result.workspaceDependencies.length).toBeGreaterThan(0);
      expect(result.workspaceDependencies).toContain('@ainative/ai-kit-core');
    });

    it('should check all dependency types', () => {
      const packageJsonPath = join(testDir, 'packages/react/package.json');
      const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      pkg.devDependencies = { '@test/dev': 'workspace:*' };
      pkg.peerDependencies = { '@test/peer': 'workspace:^' };
      writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2));

      const result = validateResolvedDependencies(packageJsonPath);

      expect(result.valid).toBe(false);
      expect(result.workspaceDependencies).toContain('@ainative/ai-kit-core');
      expect(result.workspaceDependencies).toContain('@test/dev');
      expect(result.workspaceDependencies).toContain('@test/peer');
    });
  });

  describe('resolveWorkspaceDependencies (Integration)', () => {
    it('should resolve all workspace dependencies in the monorepo', () => {
      const result = resolveWorkspaceDependencies(testDir);

      expect(result.success).toBe(true);
      expect(result.packagesProcessed).toBeGreaterThan(0);
      expect(result.totalReplacements).toBeGreaterThan(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should provide detailed replacement report', () => {
      const result = resolveWorkspaceDependencies(testDir);

      expect(result.details).toBeInstanceOf(Array);
      expect(result.details.length).toBeGreaterThan(0);

      const reactPackage = result.details.find(d =>
        d.package === '@ainative/ai-kit'
      );

      expect(reactPackage).toBeDefined();
      expect(reactPackage?.replacements.length).toBeGreaterThan(0);
    });

    it('should be idempotent - running twice should not change anything on second run', () => {
      const firstRun = resolveWorkspaceDependencies(testDir);
      const secondRun = resolveWorkspaceDependencies(testDir);

      expect(firstRun.totalReplacements).toBeGreaterThan(0);
      expect(secondRun.totalReplacements).toBe(0);
      expect(secondRun.packagesProcessed).toBeGreaterThan(0);
    });

    it('should handle circular dependencies gracefully', () => {
      // Create a circular dependency scenario
      const corePackageJsonPath = join(testDir, 'packages/core/package.json');
      const corePkg = JSON.parse(readFileSync(corePackageJsonPath, 'utf-8'));
      corePkg.dependencies = {
        '@ainative/ai-kit': 'workspace:*'
      };
      writeFileSync(corePackageJsonPath, JSON.stringify(corePkg, null, 2));

      // This should still work - it just resolves based on current versions
      expect(() => {
        resolveWorkspaceDependencies(testDir);
      }).not.toThrow();
    });

    it('should generate summary with all necessary information', () => {
      const result = resolveWorkspaceDependencies(testDir);

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('packagesProcessed');
      expect(result).toHaveProperty('totalReplacements');
      expect(result).toHaveProperty('details');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('timestamp');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle malformed package.json gracefully', () => {
      const badPackageJson = join(testDir, 'packages/bad/package.json');
      mkdirSync(join(testDir, 'packages/bad'), { recursive: true });
      writeFileSync(badPackageJson, 'not valid json{{{');

      expect(() => {
        replaceWorkspaceDependencies(badPackageJson, testDir);
      }).toThrow();
    });

    it('should handle empty dependencies object', () => {
      const packageJsonPath = join(testDir, 'packages/react/package.json');
      const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      pkg.dependencies = {};
      writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2));

      const result = replaceWorkspaceDependencies(packageJsonPath, testDir);
      expect(result.modified).toBe(false);
    });

    it('should handle missing dependencies field', () => {
      const packageJsonPath = join(testDir, 'packages/core/package.json');
      const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      delete pkg.dependencies;
      writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2));

      const result = replaceWorkspaceDependencies(packageJsonPath, testDir);
      expect(result.modified).toBe(false);
    });

    it('should handle files in nested directories', () => {
      mkdirSync(join(testDir, 'packages/nested/sub'), { recursive: true });
      writeFileSync(
        join(testDir, 'packages/nested/sub/package.json'),
        JSON.stringify({
          name: '@ainative/nested',
          version: '1.0.0',
          dependencies: {
            '@ainative/ai-kit-core': 'workspace:*'
          }
        }, null, 2)
      );

      const files = findAllPackageJsonFiles(testDir);
      expect(files.some(f => f.includes('packages/nested/sub/package.json'))).toBe(true);
    });

    it('should properly exclude node_modules at any depth', () => {
      mkdirSync(join(testDir, 'packages/react/node_modules/@test'), { recursive: true });
      writeFileSync(
        join(testDir, 'packages/react/node_modules/@test/package.json'),
        JSON.stringify({ name: '@test/pkg', version: '1.0.0' }, null, 2)
      );

      const files = findAllPackageJsonFiles(testDir);
      expect(files.every(f => !f.includes('node_modules'))).toBe(true);
    });

    it('should handle multiple workspace dependency types in same package', () => {
      const packageJsonPath = join(testDir, 'packages/react/package.json');
      const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      pkg.dependencies = { '@ainative/ai-kit-core': 'workspace:*' };
      pkg.devDependencies = { '@ainative/ai-kit-core': 'workspace:^' };
      pkg.peerDependencies = { '@ainative/ai-kit-core': 'workspace:~' };
      writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2));

      const result = replaceWorkspaceDependencies(packageJsonPath, testDir);

      expect(result.modified).toBe(true);
      expect(result.replacements).toHaveLength(3);

      const updated = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      expect(updated.dependencies['@ainative/ai-kit-core']).toBe('0.1.4');
      expect(updated.devDependencies['@ainative/ai-kit-core']).toBe('^0.1.4');
      expect(updated.peerDependencies['@ainative/ai-kit-core']).toBe('~0.1.4');
    });
  });

  describe('CLI and Main Function', () => {
    it('should export main function for CLI usage', () => {
      expect(typeof resolveWorkspaceDependencies).toBe('function');
    });

    it('should handle real-world monorepo structure', () => {
      // Create a more realistic structure
      const packages = ['core', 'react', 'vue', 'svelte', 'tools'];

      for (const pkg of packages) {
        mkdirSync(join(testDir, 'packages', pkg), { recursive: true });
        writeFileSync(
          join(testDir, 'packages', pkg, 'package.json'),
          JSON.stringify({
            name: `@ainative/ai-kit-${pkg}`,
            version: '1.0.0',
            dependencies: pkg !== 'core' ? { '@ainative/ai-kit-core': 'workspace:*' } : {}
          }, null, 2)
        );
      }

      const result = resolveWorkspaceDependencies(testDir);

      expect(result.success).toBe(true);
      expect(result.packagesProcessed).toBeGreaterThanOrEqual(packages.length);
      expect(result.totalReplacements).toBeGreaterThan(0);
    });

    it('should provide detailed error information on failure', () => {
      mkdirSync(join(testDir, 'packages/error-test'), { recursive: true });
      writeFileSync(
        join(testDir, 'packages/error-test/package.json'),
        JSON.stringify({
          name: '@ainative/error-test',
          version: '1.0.0',
          dependencies: {
            '@ainative/non-existent-package': 'workspace:*'
          }
        }, null, 2)
      );

      const result = resolveWorkspaceDependencies(testDir);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.includes('non-existent-package'))).toBe(true);
    });

    it('should handle packages without name field gracefully', () => {
      mkdirSync(join(testDir, 'packages/no-name'), { recursive: true });
      writeFileSync(
        join(testDir, 'packages/no-name/package.json'),
        JSON.stringify({
          version: '1.0.0'
        }, null, 2)
      );

      // Should not crash when searching for package versions
      const version = getPackageVersion('@ainative/non-existent', testDir);
      expect(version).toBeNull();
    });

    it('should skip package.json files that cannot be parsed as JSON', () => {
      mkdirSync(join(testDir, 'packages/corrupt'), { recursive: true });
      writeFileSync(
        join(testDir, 'packages/corrupt/package.json'),
        'this is not valid JSON {{{'
      );

      // Should not crash, just skip the corrupt file
      const version = getPackageVersion('@ainative/ai-kit-core', testDir);
      expect(version).toBe('0.1.4'); // Should still find the valid one
    });

    it('should handle deeply nested package directories', () => {
      mkdirSync(join(testDir, 'packages/level1/level2/level3'), { recursive: true });
      writeFileSync(
        join(testDir, 'packages/level1/level2/level3/package.json'),
        JSON.stringify({
          name: '@ainative/deep-package',
          version: '2.0.0',
          dependencies: {}
        }, null, 2)
      );

      const files = findAllPackageJsonFiles(testDir);
      expect(files.some(f => f.includes('level1/level2/level3'))).toBe(true);

      const version = getPackageVersion('@ainative/deep-package', testDir);
      expect(version).toBe('2.0.0');
    });

    it('should handle non-workspace dependencies correctly', () => {
      const packageJsonPath = join(testDir, 'packages/react/package.json');
      const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      pkg.dependencies = {
        '@ainative/ai-kit-core': 'workspace:*',
        'regular-package': '^1.0.0',
        'another-package': '~2.0.0'
      };
      writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2));

      const result = replaceWorkspaceDependencies(packageJsonPath, testDir);

      expect(result.modified).toBe(true);
      expect(result.replacements).toHaveLength(1);

      const updated = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      expect(updated.dependencies['@ainative/ai-kit-core']).toBe('0.1.4');
      expect(updated.dependencies['regular-package']).toBe('^1.0.0');
      expect(updated.dependencies['another-package']).toBe('~2.0.0');
    });
  });
});
