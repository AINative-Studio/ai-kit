/**
 * Global test setup and configuration
 * This file is automatically imported by vitest for all test files
 */

// Lazy import vitest to avoid CommonJS require() errors
let vitestInstance: any;

function getVitest() {
  if (!vitestInstance) {
    try {
      vitestInstance = require('vitest');
    } catch (e) {
      // Vitest not available - this is OK, these functions are only used in test environments
      return null;
    }
  }
  return vitestInstance;
}

// Lazy getter for vi
function getVi() {
  const vitest = getVitest();
  if (!vitest) {
    throw new Error('vitest is required to use testing utilities. Install it with: npm install -D vitest');
  }
  return vitest.vi;
}

// Only initialize vitest if it's available (in test environments)
// This allows the package to be loaded without vitest installed
const vitest = getVitest();

if (vitest) {
  // Mock global fetch API
  global.fetch = vitest.vi.fn();

  // Mock console methods to reduce noise in tests
  const originalConsole = { ...console };

  vitest.beforeAll(() => {
    // Suppress console output in tests unless explicitly needed
    global.console = {
      ...console,
      log: vitest.vi.fn(),
      debug: vitest.vi.fn(),
      info: vitest.vi.fn(),
      warn: vitest.vi.fn(),
      error: vitest.vi.fn(),
    };
  });

  vitest.afterAll(() => {
    // Restore original console
    global.console = originalConsole;
  });

  vitest.beforeEach(() => {
    // Clear all mocks before each test
    vitest.vi.clearAllMocks();

    // Reset fetch mock
    (global.fetch as any).mockClear();
  });

  vitest.afterEach(() => {
    // Clean up after each test
    vitest.vi.restoreAllMocks();
  });
}

/**
 * Setup function for streaming tests
 */
export function setupStreamingTest() {
  const vi = getVi();
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
  const vi = getVi();
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
