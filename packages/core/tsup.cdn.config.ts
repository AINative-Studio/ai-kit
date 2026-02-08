import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    'ai-kit-core': 'src/cdn.ts',
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
  // Bundle all browser-safe dependencies
  noExternal: [/.*/],
  // Exclude ALL Node.js built-ins and problematic packages
  external: [
    'tiktoken',
    'ioredis',
    'openai',
    '@anthropic-ai/sdk',
    'fs',
    'path',
    'crypto',
    'stream',
    'zlib',
    'net',
    'tls',
    'dns',
    'events',
    'http',
    'https',
    'url',
    'querystring',
    'buffer',
    'util',
  ],
  esbuildOptions(options) {
    // Polyfills for browser
    options.define = {
      'process.env.NODE_ENV': '"production"',
      global: 'window',
    }
  },
})
