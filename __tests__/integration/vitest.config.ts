/**
 * Vitest Configuration for Integration Tests
 *
 * Specialized configuration for integration tests and benchmarks
 * with appropriate timeouts and test isolation.
 */

import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    // Test environment
    environment: 'jsdom',

    // Global setup
    globals: true,

    // Test filtering
    include: [
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/*.bench.ts',
    ],

    // Exclude patterns
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.{idea,git,cache,output,temp}/**',
    ],

    // Timeouts for integration tests (longer than unit tests)
    testTimeout: 30000, // 30 seconds
    hookTimeout: 30000,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: [
        'packages/*/src/**/*.ts',
        'packages/*/src/**/*.tsx',
      ],
      exclude: [
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.bench.ts',
        '**/*.d.ts',
        '**/node_modules/**',
        '**/dist/**',
      ],
      // Integration test coverage thresholds
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 85,
        statements: 90,
      },
    },

    // Benchmark configuration
    benchmark: {
      include: ['**/*.bench.ts'],
      exclude: ['node_modules'],
    },

    // Test isolation
    isolate: true,

    // Parallel execution
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        minThreads: 1,
        maxThreads: 4,
      },
    },

    // Reporter configuration
    reporters: ['verbose', 'json', 'html'],

    // Output configuration
    outputFile: {
      json: path.join(__dirname, 'results', 'test-results.json'),
      html: path.join(__dirname, 'results', 'test-results.html'),
    },

    // Setup files
    setupFiles: [
      path.join(__dirname, 'setup.ts'),
    ],

    // Mock configuration
    mockReset: true,
    restoreMocks: true,
    clearMocks: true,

    // Retry failed tests
    retry: 0, // No retries for integration tests (they should be deterministic)

    // Sequence configuration
    sequence: {
      shuffle: false, // Keep deterministic order for integration tests
    },
  },

  // Resolve configuration
  resolve: {
    alias: {
      '@ainative/ai-kit-core': path.resolve(__dirname, '../../packages/core/src'),
      '@ainative/ai-kit-video': path.resolve(__dirname, '../../packages/video/src'),
      '@ainative/ai-kit-react': path.resolve(__dirname, '../../packages/react/src'),
      '@ainative/ai-kit-rlhf': path.resolve(__dirname, '../../packages/rlhf/src'),
    },
  },
})
