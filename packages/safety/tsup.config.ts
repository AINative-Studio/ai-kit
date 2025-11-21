import { defineConfig } from 'tsup'

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/PromptInjectionDetector.ts',
    'src/JailbreakDetector.ts',
    'src/PIIDetector.ts',
    'src/ContentModerator.ts'
  ],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['@ainative/ai-kit-core']
})
