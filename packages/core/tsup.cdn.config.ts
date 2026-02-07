import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    'ai-kit-core': 'src/index.ts',
  },
  format: ['iife'],
  globalName: 'AINativeCore',
  dts: false,
  splitting: false,
  sourcemap: true,
  clean: false,
  treeshake: true,
  minify: true,
  outDir: 'dist/cdn',
  platform: 'browser',
  // Bundle all dependencies except peer dependencies
  noExternal: ['eventsource-parser', 'openai', 'zod', 'zod-to-json-schema'],
  // Exclude Node.js-specific dependencies
  external: ['tiktoken', 'ioredis'],
  esbuildOptions(options) {
    // Polyfills for browser
    options.define = {
      'process.env.NODE_ENV': '"production"',
      global: 'window',
    }
  },
})
