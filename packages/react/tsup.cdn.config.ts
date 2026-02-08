import { defineConfig } from 'tsup'

/**
 * CDN Bundle Configuration for @ainative/ai-kit (React)
 * Generates UMD/IIFE bundles optimized for CDN distribution
 *
 * Issues #65, #130 - CDN bundle generation and distribution
 *
 * Expects React and AIKitCore to be available as globals:
 * - window.React
 * - window.ReactDOM
 * - window.AIKitCore
 */
export default defineConfig([
  // Non-minified bundle
  {
    entry: {
      'react': 'src/index.ts',
    },
    format: ['iife'],
    globalName: 'AIKitReact',
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
    // Bundle dependencies except React, ReactDOM, and core
    noExternal: ['react-markdown', 'react-syntax-highlighter', 'remark-gfm'],
    external: ['react', 'react-dom', 'react/jsx-runtime', '@ainative/ai-kit-core'],
    esbuildOptions(options) {
      options.jsx = 'automatic'
      options.define = {
        'process.env.NODE_ENV': '"production"',
        global: 'window',
      }
      // Map external modules to globals
      options.alias = {
        react: 'React',
        'react-dom': 'ReactDOM',
        '@ainative/ai-kit-core': 'AIKitCore',
      }
      options.banner = {
        js: `/**
 * @ainative/ai-kit (React) v${require('./package.json').version}
 * React hooks and components for AI Kit
 * @license MIT
 * @see https://ainative.studio/ai-kit
 * @requires React, ReactDOM, AIKitCore
 */`,
      }
    },
  },
  // Minified bundle
  {
    entry: {
      'react.min': 'src/index.ts',
    },
    format: ['iife'],
    globalName: 'AIKitReact',
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
    noExternal: ['react-markdown', 'react-syntax-highlighter', 'remark-gfm'],
    external: ['react', 'react-dom', 'react/jsx-runtime', '@ainative/ai-kit-core'],
    esbuildOptions(options) {
      options.jsx = 'automatic'
      options.define = {
        'process.env.NODE_ENV': '"production"',
        global: 'window',
      }
      options.alias = {
        react: 'React',
        'react-dom': 'ReactDOM',
        '@ainative/ai-kit-core': 'AIKitCore',
      }
      options.banner = {
        js: `/*! @ainative/ai-kit (React) v${require('./package.json').version} | MIT License | Requires React, ReactDOM, AIKitCore */`,
      }
      options.legalComments = 'inline'
    },
  },
])
