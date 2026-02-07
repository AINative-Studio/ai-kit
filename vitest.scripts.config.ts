/**
 * Vitest configuration for scripts testing
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,

    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage/scripts',

      thresholds: {
        lines: 75,
        functions: 80,
        branches: 70,
        statements: 75,
      },

      include: [
        'scripts/workspace-dependency-resolver.ts',
      ],

      exclude: [
        'scripts/**/*.test.ts',
        'scripts/**/*.spec.ts',
        'scripts/__tests__/**',
        '**/*.d.ts',
      ],
    },

    include: [
      'scripts/__tests__/**/*.{test,spec}.ts',
    ],

    exclude: [
      '**/node_modules/**',
      '**/dist/**',
    ],

    testTimeout: 30000,
    hookTimeout: 10000,
  },
});
