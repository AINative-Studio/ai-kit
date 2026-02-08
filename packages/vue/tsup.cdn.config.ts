import { defineConfig } from 'tsup'

/**
 * CDN Bundle Configuration for @ainative/ai-kit-vue
 * Generates UMD/IIFE bundles optimized for CDN distribution
 *
 * Issues #65, #130 - CDN bundle generation and distribution
 *
 * Expects Vue and AIKitCore to be available as globals:
 * - window.Vue
 * - window.AIKitCore
 */
export default defineConfig([
  // Non-minified bundle
  {
    entry: {
      'vue': 'src/index.ts',
    },
    format: ['iife'],
    globalName: 'AIKitVue',
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
    external: ['vue', '@ainative/ai-kit-core'],
    esbuildOptions(options) {
      options.define = {
        'process.env.NODE_ENV': '"production"',
        global: 'window',
        '__VUE_OPTIONS_API__': 'true',
        '__VUE_PROD_DEVTOOLS__': 'false',
      }
      options.alias = {
        vue: 'Vue',
        '@ainative/ai-kit-core': 'AIKitCore',
      }
      options.banner = {
        js: `/**
 * @ainative/ai-kit-vue v${require('./package.json').version}
 * Vue 3 composables for AI Kit
 * @license MIT
 * @see https://ainative.studio/ai-kit
 * @requires Vue, AIKitCore
 */`,
      }
    },
  },
  // Minified bundle
  {
    entry: {
      'vue.min': 'src/index.ts',
    },
    format: ['iife'],
    globalName: 'AIKitVue',
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
    external: ['vue', '@ainative/ai-kit-core'],
    esbuildOptions(options) {
      options.define = {
        'process.env.NODE_ENV': '"production"',
        global: 'window',
        '__VUE_OPTIONS_API__': 'true',
        '__VUE_PROD_DEVTOOLS__': 'false',
      }
      options.alias = {
        vue: 'Vue',
        '@ainative/ai-kit-core': 'AIKitCore',
      }
      options.banner = {
        js: `/*! @ainative/ai-kit-vue v${require('./package.json').version} | MIT License | Requires Vue, AIKitCore */`,
      }
      options.legalComments = 'inline'
    },
  },
])
