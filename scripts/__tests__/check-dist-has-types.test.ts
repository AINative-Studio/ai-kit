import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { checkDistHasTypes, collectDeclaredTypesPaths } from '../check-dist-has-types';

describe('collectDeclaredTypesPaths', () => {
  it('collects the top-level types field', () => {
    const pkg = { types: './dist/index.d.ts' };
    expect(collectDeclaredTypesPaths(pkg)).toEqual(['./dist/index.d.ts']);
  });

  it('collects types from every exports condition, deduplicated', () => {
    const pkg = {
      types: './dist/index.d.ts',
      exports: {
        '.': { types: './dist/index.d.ts', import: './dist/index.mjs' },
        './react': { types: './dist/index.d.ts', import: './dist/index.mjs' },
      },
    };
    expect(collectDeclaredTypesPaths(pkg)).toEqual(['./dist/index.d.ts']);
  });

  it('collects distinct types paths across multiple export conditions', () => {
    const pkg = {
      exports: {
        '.': { types: './dist/index.d.ts' },
        './browser': { types: './dist/browser.d.ts' },
      },
    };
    expect(collectDeclaredTypesPaths(pkg).sort()).toEqual(['./dist/browser.d.ts', './dist/index.d.ts']);
  });

  it('returns an empty array when no types are declared', () => {
    expect(collectDeclaredTypesPaths({})).toEqual([]);
  });
});

describe('checkDistHasTypes', () => {
  const testDir = join(process.cwd(), 'scripts/__tests__/fixtures/dist-types-check');

  beforeEach(() => {
    mkdirSync(join(testDir, 'dist'), { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it('passes when the declared types file exists and is non-empty', () => {
    writeFileSync(join(testDir, 'dist/index.d.ts'), 'export declare const x: number;');
    const result = checkDistHasTypes(testDir, { types: './dist/index.d.ts' });
    expect(result).toEqual({ ok: true, missing: [] });
  });

  it('fails when the declared types file does not exist on disk', () => {
    const result = checkDistHasTypes(testDir, { types: './dist/index.d.ts' });
    expect(result.ok).toBe(false);
    expect(result.missing).toEqual(['./dist/index.d.ts']);
  });

  it('fails when the declared types file exists but is empty', () => {
    writeFileSync(join(testDir, 'dist/index.d.ts'), '');
    const result = checkDistHasTypes(testDir, { types: './dist/index.d.ts' });
    expect(result.ok).toBe(false);
    expect(result.missing).toEqual(['./dist/index.d.ts']);
  });

  it('reports every missing path when multiple exports conditions point at different files', () => {
    writeFileSync(join(testDir, 'dist/index.d.ts'), 'export declare const x: number;');
    const pkg = {
      exports: {
        '.': { types: './dist/index.d.ts' },
        './browser': { types: './dist/browser.d.ts' },
      },
    };
    const result = checkDistHasTypes(testDir, pkg);
    expect(result.ok).toBe(false);
    expect(result.missing).toEqual(['./dist/browser.d.ts']);
  });

  it('passes when the package declares no types at all', () => {
    const result = checkDistHasTypes(testDir, {});
    expect(result).toEqual({ ok: true, missing: [] });
  });
});
