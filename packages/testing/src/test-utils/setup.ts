/**
 * Global test setup and configuration
 * This file is automatically imported by vitest for all test files
 */

import { beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';

// Mock global fetch API
global.fetch = vi.fn();

// Mock console methods to reduce noise in tests
const originalConsole = { ...console };

beforeAll(() => {
  // Suppress console output in tests unless explicitly needed
  global.console = {
    ...console,
    log: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };
});

afterAll(() => {
  // Restore original console
  global.console = originalConsole;
});

beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks();

  // Reset fetch mock
  (global.fetch as any).mockClear();
});

afterEach(() => {
  // Clean up after each test
  vi.restoreAllMocks();
});

/**
 * Setup function for streaming tests
 */
export function setupStreamingTest() {
  const mockReadableStream = {
    getReader: vi.fn(() => ({
      read: vi.fn(),
      releaseLock: vi.fn(),
    })),
  };

  return { mockReadableStream };
}

/**
 * Setup function for agent tests
 */
export function setupAgentTest() {
  const mockLLMProvider = {
    complete: vi.fn(),
    stream: vi.fn(),
  };

  return { mockLLMProvider };
}

/**
 * Wait for async operations to complete
 */
export async function waitFor(ms: number = 0): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wait for a condition to be true
 */
export async function waitForCondition(
  condition: () => boolean,
  timeout: number = 5000,
  interval: number = 50
): Promise<void> {
  const startTime = Date.now();

  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Timeout waiting for condition');
    }
    await waitFor(interval);
  }
}

/**
 * Flush all pending promises
 */
export async function flushPromises(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}
