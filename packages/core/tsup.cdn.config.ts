import { defineConfig } from 'tsup'

/**
 * CDN Bundle Configuration for @ainative/ai-kit-core
 * Generates UMD/IIFE bundles optimized for CDN distribution (jsDelivr, unpkg)
 *
 * Issues #65, #130 - CDN bundle generation and distribution
 *
 * Features:
 * - IIFE format for browser <script> tags
 * - Minified and non-minified versions
 * - Source maps for debugging
 * - Tree-shakeable exports
 * - Size optimization (<50KB core)
 * - Separate bundles for core and optional features
 */
export default defineConfig([
  // Main core bundle - non-minified with full comments
  {
    entry: {
      'core': 'src/cdn.ts',
    },
    format: ['iife'],
    globalName: 'AIKitCore',
    platform: 'browser',
    target: 'es2020',
    sourcemap: true,
    clean: true,
    minify: false,
    outDir: 'dist/cdn',
    outExtension: () => ({ js: '.js' }),
    treeshake: true,
    dts: false,
    splitting: false,
    // Bundle browser-safe dependencies
    noExternal: ['eventsource-parser', 'zod', 'zod-to-json-schema'],
    // Exclude Node.js modules and server-only dependencies
    external: [
      'tiktoken',
      'ioredis',
      'openai',
      '@anthropic-ai/sdk',
    ],
    esbuildOptions(options) {
      // Browser polyfills
      options.define = {
        'process.env.NODE_ENV': '"production"',
        global: 'window',
      }
      options.banner = {
        js: `/**
 * @ainative/ai-kit-core v${require('./package.json').version}
 * Browser-optimized CDN bundle
 * @license MIT
 * @see https://ainative.studio/ai-kit
 */`,
      }
    },
  },
  // Minified core bundle
  {
    entry: {
      'core.min': 'src/cdn.ts',
    },
    format: ['iife'],
    globalName: 'AIKitCore',
    platform: 'browser',
    target: 'es2020',
    sourcemap: true,
    clean: false,
    minify: true,
    outDir: 'dist/cdn',
    outExtension: () => ({ js: '.js' }),
    treeshake: true,
    dts: false,
    splitting: false,
    noExternal: ['eventsource-parser', 'zod', 'zod-to-json-schema'],
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
      options.define = {
        'process.env.NODE_ENV': '"production"',
        global: 'window',
      }
      options.banner = {
        js: `/*! @ainative/ai-kit-core v${require('./package.json').version} | MIT License | https://ainative.studio/ai-kit */`,
      }
      options.legalComments = 'inline'
    },
  },
])
