import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'mocks/index': 'src/mocks/index.ts',
    'fixtures/index': 'src/fixtures/index.ts',
    'helpers/index': 'src/helpers/index.ts',
    'matchers/index': 'src/matchers/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  splitting: false,
  sourcemap: true,
  external: ['@ainative/ai-kit-core'],
});
