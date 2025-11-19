// Vitest setup file for Svelte package
import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/svelte'

// Cleanup after each test
afterEach(() => {
  cleanup()
})
