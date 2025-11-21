import { defineConfig } from 'tsup';

export default defineConfig([
  // Core build - non-React observability features
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    external: ['@ainative/ai-kit-core', 'react', 'recharts'],
    treeshake: true,
    minify: false,
  },
  // React components build - Skip for now due to missing UI dependencies
  // TODO: Fix React component dependencies or create proper UI components
  // {
  //   entry: ['src/react/index.tsx'],
  //   format: ['esm', 'cjs'],
  //   dts: true,
  //   outDir: 'dist/react',
  //   splitting: false,
  //   sourcemap: true,
  //   external: ['@ainative/ai-kit-core', 'react', 'react-dom', 'recharts', '@tanstack/react-query', 'lucide-react'],
  //   treeshake: true,
  //   minify: false,
  //   esbuildOptions(options) {
  //     options.jsx = 'automatic';
  //   },
  // },
]);
