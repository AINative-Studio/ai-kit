import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/recording/index.ts', 'src/processing/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false,
  external: ['openai'],
})
