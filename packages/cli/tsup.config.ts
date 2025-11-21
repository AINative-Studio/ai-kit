import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: false, // Skip DTS for CLI since it's a binary, not a library
  splitting: false,
  sourcemap: true,
  clean: true,
  shims: true,
  minify: false,
  external: [],
})
