import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    'ai-kit-svelte': 'src/index.ts',
  },
  format: ['iife'],
  globalName: 'AINativeSvelte',
  dts: false,
  splitting: false,
  sourcemap: true,
  clean: false,
  treeshake: true,
  minify: true,
  outDir: 'dist/cdn',
  platform: 'browser',
  // Keep Svelte and core as external globals
  external: ['svelte', 'svelte/store', '@ainative/ai-kit-core'],
  // Map external modules to globals
  globalExternal: {
    svelte: 'Svelte',
    'svelte/store': 'SvelteStore',
    '@ainative/ai-kit-core': 'AINativeCore',
  },
  esbuildOptions(options) {
    options.define = {
      'process.env.NODE_ENV': '"production"',
      global: 'window',
    }
  },
})
