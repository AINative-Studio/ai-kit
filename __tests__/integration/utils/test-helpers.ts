/**
 * Test Helper Utilities
 *
 * Common utilities for integration tests
 */

import { vi } from 'vitest';

/**
 * Creates a mock AI response stream
 */
export const createMockAIStream = (responses: string[], delayMs: number = 50) => {
  let index = 0;

  return new ReadableStream({
    async start(controller) {
      for (const response of responses) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        controller.enqueue(
          new TextEncoder().encode(
            `data: ${JSON.stringify({ choices: [{ delta: { content: response } }] })}\n\n`
          )
        );
        index++;
      }
      controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
      controller.close();
    },
  });
};

/**
 * Collects all chunks from a stream
 */
export const collectStreamData = async <T>(stream: ReadableStream<T>): Promise<T[]> => {
  const reader = stream.getReader();
  const chunks: T[] = [];

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  return chunks;
};

/**
 * Waits for a condition to be true
 */
export const waitFor = async (
  condition: () => boolean | Promise<boolean>,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> => {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error(`Condition not met within ${timeout}ms`);
};

/**
 * Creates a mock fetch response
 */
export const mockFetchResponse = (data: any, ok: boolean = true, status: number = 200) => {
  return Promise.resolve({
    ok,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    headers: new Headers(),
  } as Response);
};

/**
 * Creates a mock streaming fetch response
 */
export const mockStreamingFetchResponse = (chunks: string[]) => {
  const stream = new ReadableStream({
    start(controller) {
      chunks.forEach((chunk) => {
        controller.enqueue(new TextEncoder().encode(chunk));
      });
      controller.close();
    },
  });

  return Promise.resolve({
    ok: true,
    status: 200,
    body: stream,
    headers: new Headers({ 'Content-Type': 'text/event-stream' }),
  } as Response);
};

/**
 * Spies on console methods
 */
export const spyConsole = () => {
  const consoleSpy = {
    log: vi.spyOn(console, 'log').mockImplementation(() => {}),
    error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
    info: vi.spyOn(console, 'info').mockImplementation(() => {}),
  };

  return {
    ...consoleSpy,
    restore: () => {
      Object.values(consoleSpy).forEach((spy) => spy.mockRestore());
    },
  };
};

/**
 * Creates a mock event emitter
 */
export const createMockEventEmitter = () => {
  const listeners = new Map<string, Function[]>();

  return {
    on: (event: string, handler: Function) => {
      if (!listeners.has(event)) {
        listeners.set(event, []);
      }
      listeners.get(event)!.push(handler);
    },
    off: (event: string, handler: Function) => {
      const handlers = listeners.get(event);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    },
    emit: (event: string, ...args: any[]) => {
      const handlers = listeners.get(event);
      if (handlers) {
        handlers.forEach((handler) => handler(...args));
      }
    },
    removeAllListeners: () => {
      listeners.clear();
    },
  };
};

/**
 * Creates a mock timer
 */
export const createMockTimer = () => {
  let time = 0;

  return {
    advance: (ms: number) => {
      time += ms;
    },
    now: () => time,
    reset: () => {
      time = 0;
    },
  };
};

/**
 * Wraps a function with performance tracking
 */
export const trackPerformance = async <T>(
  fn: () => Promise<T>,
  name: string
): Promise<{ result: T; duration: number; memory: NodeJS.MemoryUsage }> => {
  const startMemory = process.memoryUsage();
  const startTime = performance.now();

  const result = await fn();

  const duration = performance.now() - startTime;
  const endMemory = process.memoryUsage();

  const memoryDiff = {
    rss: endMemory.rss - startMemory.rss,
    heapTotal: endMemory.heapTotal - startMemory.heapTotal,
    heapUsed: endMemory.heapUsed - startMemory.heapUsed,
    external: endMemory.external - startMemory.external,
    arrayBuffers: endMemory.arrayBuffers - startMemory.arrayBuffers,
  };

  return {
    result,
    duration,
    memory: memoryDiff,
  };
};

/**
 * Creates a mock WebSocket
 */
export const createMockWebSocket = () => {
  const messages: any[] = [];
  let readyState = 0; // CONNECTING

  return {
    send: (data: any) => {
      messages.push(data);
    },
    close: () => {
      readyState = 3; // CLOSED
    },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    get readyState() {
      return readyState;
    },
    set readyState(state: number) {
      readyState = state;
    },
    messages,
    simulateOpen: function () {
      this.readyState = 1; // OPEN
    },
    simulateMessage: function (data: any) {
      const event = new MessageEvent('message', { data });
      this.addEventListener.mock.calls.forEach(([type, handler]) => {
        if (type === 'message') {
          handler(event);
        }
      });
    },
  };
};

/**
 * Creates a deferred promise
 */
export const createDeferred = <T>() => {
  let resolve: (value: T) => void;
  let reject: (reason?: any) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return {
    promise,
    resolve: resolve!,
    reject: reject!,
  };
};

/**
 * Flushes all pending promises
 */
export const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

/**
 * Creates a mock localStorage
 */
export const createMockLocalStorage = () => {
  const storage = new Map<string, string>();

  return {
    getItem: (key: string) => storage.get(key) || null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
    clear: () => storage.clear(),
    get length() {
      return storage.size;
    },
    key: (index: number) => Array.from(storage.keys())[index] || null,
  };
};

/**
 * Asserts that an error is thrown
 */
export const expectError = async (
  fn: () => Promise<any>,
  expectedMessage?: string | RegExp
) => {
  let error: Error | null = null;

  try {
    await fn();
  } catch (e) {
    error = e as Error;
  }

  if (!error) {
    throw new Error('Expected function to throw an error');
  }

  if (expectedMessage) {
    if (typeof expectedMessage === 'string') {
      if (!error.message.includes(expectedMessage)) {
        throw new Error(
          `Expected error message to include "${expectedMessage}", got "${error.message}"`
        );
      }
    } else {
      if (!expectedMessage.test(error.message)) {
        throw new Error(
          `Expected error message to match ${expectedMessage}, got "${error.message}"`
        );
      }
    }
  }

  return error;
};

/**
 * Creates a mock file
 */
export const createMockFile = (
  content: string,
  filename: string = 'test.txt',
  type: string = 'text/plain'
) => {
  const blob = new Blob([content], { type });
  return new File([blob], filename, { type });
};

/**
 * Simulates user interaction delay
 */
export const simulateUserDelay = (min: number = 50, max: number = 200) => {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, delay));
};
