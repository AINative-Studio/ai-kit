import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    // Main entry points for browser/server conditional exports
    // Refs #106 - Browser/server split to avoid Node.js dependencies in browser
    browser: 'src/browser.ts',
    server: 'src/server.ts',
    // Legacy main entry point (for backwards compatibility)
    index: 'src/index.ts',
    // Individual module exports
    'streaming/index': 'src/streaming/index.ts',
    'context/index': 'src/context/index.ts',
    'zerodb/index': 'src/zerodb/index.ts',
    'agents/index': 'src/agents/index.ts',
    'store/index': 'src/store/index.ts',
    'auth/index': 'src/auth/index.ts',
    'design/index': 'src/design/index.ts',
    'search/index': 'src/search/index.ts',
    'summarization/index': 'src/summarization/index.ts',
    'session/index': 'src/session/index.ts',
    'rlhf/index': 'src/rlhf/index.ts',
  },
  format: ['cjs', 'esm'],
  // DTS generation re-enabled after consolidating duplicate type definitions
  // Issue #72: Fixed TokenCount and PerformanceMetrics duplications
  // Issue #106: Added browser/server entry points for conditional exports
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false,
  external: ['tiktoken', 'ioredis'],
})
