import { describe, it, expect } from 'vitest';
import { defineConfig } from '../../src/config/loader';

describe('config loader', () => {
  describe('defineConfig', () => {
    it('should create a valid config with defaults', () => {
      const config = defineConfig({});
      expect(config.framework).toBe('node');
      expect(config.typescript).toBe(true);
      expect(config.features).toEqual([]);
    });

    it('should merge custom config with defaults', () => {
      const config = defineConfig({
        framework: 'nextjs',
        features: ['auth', 'database'],
      });
      expect(config.framework).toBe('nextjs');
      expect(config.typescript).toBe(true);
      expect(config.features).toEqual(['auth', 'database']);
    });

    it('should accept all config options', () => {
      const config = defineConfig({
        framework: 'express',
        typescript: false,
        features: ['auth'],
        requiredEnvVars: ['API_KEY'],
        testRunner: 'jest',
        devPort: 4000,
        distDir: 'build',
        entry: 'server.js',
      });

      expect(config.framework).toBe('express');
      expect(config.typescript).toBe(false);
      expect(config.testRunner).toBe('jest');
      expect(config.devPort).toBe(4000);
      expect(config.distDir).toBe('build');
    });
  });
});
