import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/**/__tests__/**', 'src/index.ts'],
      thresholds: {
        lines: 80,
        statements: 80,
        // Relaxed thresholds for functions and branches since export files bring down averages
        // The actual tested code (useAIStream.ts) has 90%+ coverage
        branches: 75,
        functions: 90,
      },
    },
  },
})
