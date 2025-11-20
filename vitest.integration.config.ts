/**
 * Vitest Configuration for Integration Tests
 */

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    name: 'integration',
    include: ['__tests__/integration/**/*.test.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    globals: true,
    environment: 'jsdom',
    setupFiles: ['__tests__/integration/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['packages/*/src/**/*.{ts,tsx}'],
      exclude: [
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/node_modules/**',
        '**/dist/**',
        '**/__tests__/**',
        '**/types/**',
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
    testTimeout: 30000,
    hookTimeout: 30000,
    teardownTimeout: 10000,
    isolate: true,
    threads: true,
    maxThreads: 4,
    minThreads: 1,
    reporters: ['default', 'json', 'html'],
    outputFile: {
      json: '__tests__/integration/results/results.json',
      html: '__tests__/integration/results/index.html',
    },
    onConsoleLog: (log, type) => {
      // Filter out noise from logs
      if (log.includes('Download the React DevTools')) return false;
      if (log.includes('Warning: ReactDOM.render')) return false;
      return true;
    },
  },
  resolve: {
    alias: {
      '@ainative/core': path.resolve(__dirname, 'packages/core/src'),
      '@ainative/react': path.resolve(__dirname, 'packages/react/src'),
      '@ainative/nextjs': path.resolve(__dirname, 'packages/nextjs/src'),
      '@ainative/tools': path.resolve(__dirname, 'packages/tools/src'),
      '@ainative/cli': path.resolve(__dirname, 'packages/cli/src'),
      '@ainative/testing': path.resolve(__dirname, 'packages/testing/src'),
    },
  },
});
