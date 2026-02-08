import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['__tests__/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['**/*.html'],
      exclude: [
        'node_modules/',
        '__tests__/',
        'index.html', // Original (leaky) version excluded from coverage
      ],
    },
    testTimeout: 60000,
    hookTimeout: 30000,
  },
});
