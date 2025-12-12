// Setup file for React tests
import { cleanup } from '@testing-library/react'
import { afterEach, beforeAll } from 'vitest'
import '@testing-library/jest-dom'

// Mock Element.scrollIntoView since it's not available in jsdom
beforeAll(() => {
  Element.prototype.scrollIntoView = () => {}
})

// Cleanup after each test
afterEach(() => {
  cleanup()
})
