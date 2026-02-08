import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    'ai-kit-react': 'src/index.ts',
  },
  format: ['iife'],
  globalName: 'AINativeReact',
  dts: false,
  splitting: false,
  sourcemap: true,
  clean: false,
  treeshake: true,
  minify: true,
  outDir: 'dist/cdn',
  platform: 'browser',
  // Bundle dependencies but keep React and core as external globals
  external: ['react', 'react-dom', '@ainative/ai-kit-core'],
  // Map external modules to globals
  globalExternal: {
    react: 'React',
    'react-dom': 'ReactDOM',
    '@ainative/ai-kit-core': 'AINativeCore',
  },
  esbuildOptions(options) {
    options.jsx = 'automatic'
    options.define = {
      'process.env.NODE_ENV': '"production"',
      global: 'window',
    }
  },
})
