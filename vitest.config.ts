/**
 * Vitest configuration for AI Kit
 * Comprehensive testing setup with coverage reporting
 */

import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    // Test environment (default to node, override for browser-based tests)
    environment: 'node',

    // Environment overrides for React/Vue tests that need DOM
    environmentMatchGlobs: [
      ['packages/react/**/*.{test,spec}.{ts,tsx}', 'jsdom'],
      ['packages/vue/**/*.{test,spec}.{ts,tsx}', 'jsdom'],
      ['packages/nextjs/**/*.{test,spec}.{ts,tsx}', 'jsdom'],
    ],

    // Global setup
    globals: true,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',

      // Coverage thresholds
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 85,
        statements: 90,
      },

      // Files to include in coverage
      include: [
        'packages/*/src/**/*.{ts,tsx}',
      ],

      // Files to exclude from coverage
      exclude: [
        'packages/*/src/**/*.test.{ts,tsx}',
        'packages/*/src/**/*.spec.{ts,tsx}',
        'packages/*/__tests__/**',
        'packages/*/dist/**',
        'packages/*/node_modules/**',
        '**/*.d.ts',
        '**/types/**',
        '**/index.ts', // Barrel files
        '**/__mocks__/**',
      ],

    },

    // Test match patterns
    include: [
      'packages/**/__tests__/**/*.{test,spec}.{ts,tsx}',
      'packages/**/*.{test,spec}.{ts,tsx}',
    ],

    // Files to exclude
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.idea/**',
      '**/.git/**',
      '**/.cache/**',
    ],

    // Test timeout
    testTimeout: 10000,

    // Hook timeout
    hookTimeout: 10000,

    // Setup files
    setupFiles: ['./packages/testing/src/test-utils/setup.ts'],

    // Watch mode settings
    watch: false,

    // Reporter configuration
    reporters: ['verbose', 'json', 'html'],

    // Benchmark configuration
    benchmark: {
      reporters: ['verbose'],
    },

    // Type checking
    typecheck: {
      enabled: false, // Use tsc for type checking
    },

    // Mocking
    mockReset: true,
    restoreMocks: true,
    clearMocks: true,
  },

  // Resolve configuration
  resolve: {
    alias: {
      '@ainative/ai-kit-core': resolve(__dirname, './packages/core/src'),
      '@ainative/ai-kit-react': resolve(__dirname, './packages/react/src'),
      '@ainative/ai-kit-nextjs': resolve(__dirname, './packages/nextjs/src'),
      '@ainative/ai-kit-tools': resolve(__dirname, './packages/tools/src'),
      '@ainative/ai-kit-testing': resolve(__dirname, './packages/testing/src'),
      '@ainative/ai-kit-cli': resolve(__dirname, './packages/cli/src'),
    },
  },
});
