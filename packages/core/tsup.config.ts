import { defineConfig } from 'tsup'

// Two separate build configs, not one: the browser entry is built with
// platform: 'browser' so esbuild hard-fails at build time if anything in
// its module graph statically imports a Node builtin (fs, ioredis, etc.)
// instead of silently bundling it - that silent-bundle failure mode is
// exactly what broke Next.js client builds consuming this package
// (Refs #206). Every other entry needs real Node builtins and stays on
// the default 'node' platform.
export default defineConfig([
  {
    name: 'browser',
    entry: { browser: 'src/browser.ts' },
    format: ['cjs', 'esm'],
    platform: 'browser',
    // dts generation uses its own tsconfig that restores @types/node
    // (tsconfig.json otherwise sets types: ["vitest/globals"] only, which
    // leaves 'events' unresolvable to tsc even though it's a known,
    // intentionally-externalized module below). This is a type-checking
    // concession only - it does NOT relax the JS/ESM build's platform:
    // 'browser' guard above, which independently still hard-fails on any
    // non-externalized Node builtin.
    tsconfig: './tsconfig.browser.json',
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    treeshake: true,
    minify: false,
    // 'events' is externalized, not polyfilled or rewritten: every real
    // bundler (webpack 5+, Vite, Turbopack) already provides a working
    // shim for it, so it's safe to leave as a plain import for the
    // consuming bundler to resolve - unlike 'fs'/'ioredis'/'crypto' (the
    // AES functions, not randomUUID), which have no browser equivalent at
    // all and must never appear here. platform: 'browser' stays strict for
    // everything else, which is what caught SessionManager/RLHFLogger
    // leaking those - both removed from this entry's exports, see
    // browser.ts (Refs #206).
    external: ['tiktoken', 'events'],
  },
  {
    name: 'node',
    entry: {
      // Main entry points for browser/server conditional exports
      // Refs #106 - Browser/server split to avoid Node.js dependencies in browser
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
    platform: 'node',
    // DTS generation re-enabled after consolidating duplicate type definitions
    // Issue #72: Fixed TokenCount and PerformanceMetrics duplications
    // Issue #106: Added browser/server entry points for conditional exports
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: false, // the browser config already cleaned dist/ once
    treeshake: true,
    minify: false,
    external: ['tiktoken', 'ioredis'],
  },
])
