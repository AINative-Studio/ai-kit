import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    'ai-kit-vue': 'src/index.ts',
  },
  format: ['iife'],
  globalName: 'AINativeVue',
  dts: false,
  splitting: false,
  sourcemap: true,
  clean: false,
  treeshake: true,
  minify: true,
  outDir: 'dist/cdn',
  platform: 'browser',
  // Keep Vue and core as external globals
  external: ['vue', '@ainative/ai-kit-core'],
  // Map external modules to globals
  globalExternal: {
    vue: 'Vue',
    '@ainative/ai-kit-core': 'AINativeCore',
  },
  esbuildOptions(options) {
    options.define = {
      'process.env.NODE_ENV': '"production"',
      global: 'window',
    }
  },
})
