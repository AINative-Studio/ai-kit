import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false,
  external: ['react', 'react-dom', 'react-syntax-highlighter', 'react-markdown', 'remark-gfm', '@ainative/ai-kit-core'],
  esbuildOptions(options) {
    options.jsx = 'automatic'
  },
})
