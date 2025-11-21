/**
 * Test helper utilities for AI Kit
 */

import { vi } from 'vitest';

/**
 * Create a mock fetch response
 */
export function createMockFetchResponse(
  body: any,
  options: {
    status?: number;
    statusText?: string;
    headers?: Record<string, string>;
  } = {}
) {
  const { status = 200, statusText = 'OK', headers = {} } = options;

  return {
    ok: status >= 200 && status < 300,
    status,
    statusText,
    headers: new Headers(headers),
    json: async () => body,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
    body: null,
  };
}

/**
 * Create a mock streaming response
 */
export function createMockStreamingResponse(chunks: string[]) {
  const encoder = new TextEncoder();
  let index = 0;

  const stream = new ReadableStream({
    async pull(controller) {
      if (index < chunks.length) {
        controller.enqueue(encoder.encode(chunks[index]));
        index++;
      } else {
        controller.close();
      }
    },
  });

  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: new Headers({ 'Content-Type': 'text/event-stream' }),
    body: stream,
    json: async () => {
      throw new Error('Cannot parse stream as JSON');
    },
    text: async () => chunks.join(''),
  };
}

/**
 * Create a mock SSE event
 */
export function createSSEEvent(
  event: string,
  data: any,
  options: { id?: string; retry?: number } = {}
) {
  let output = '';

  if (event) {
    output += `event: ${event}\n`;
  }

  if (options.id) {
    output += `id: ${options.id}\n`;
  }

  if (options.retry) {
    output += `retry: ${options.retry}\n`;
  }

  const dataString = typeof data === 'string' ? data : JSON.stringify(data);
  output += `data: ${dataString}\n\n`;

  return output;
}

/**
 * Create a series of SSE events
 */
export function createSSEEventSeries(events: Array<{ event: string; data: any }>) {
  return events.map((e) => createSSEEvent(e.event, e.data)).join('');
}

/**
 * Mock a server response object
 */
export function createMockServerResponse() {
  const headers: Record<string, string> = {};
  const writtenData: string[] = [];
  let ended = false;

  const mockResponse = {
    setHeader: vi.fn((key: string, value: string) => {
      headers[key] = value;
    }),
    writeHead: vi.fn((_status: number, headersObj?: Record<string, string>) => {
      if (headersObj) {
        Object.assign(headers, headersObj);
      }
    }),
    write: vi.fn((data: string) => {
      if (!ended) {
        writtenData.push(data);
      }
    }),
    end: vi.fn(() => {
      ended = true;
    }),
    on: vi.fn(),

    // Test helpers
    getHeaders: () => headers,
    getWrittenData: () => writtenData,
    getFullOutput: () => writtenData.join(''),
    isEnded: () => ended,
  };

  return mockResponse;
}

/**
 * Create a mock EventEmitter
 */
export function createMockEventEmitter() {
  const listeners: Record<string, Array<(...args: any[]) => void>> = {};

  return {
    on: vi.fn((event: string, handler: (...args: any[]) => void) => {
      if (!listeners[event]) {
        listeners[event] = [];
      }
      listeners[event].push(handler);
    }),

    emit: vi.fn((event: string, ...args: any[]) => {
      if (listeners[event]) {
        listeners[event].forEach((handler) => handler(...args));
      }
    }),

    removeListener: vi.fn((event: string, handler: (...args: any[]) => void) => {
      if (listeners[event]) {
        const index = listeners[event].indexOf(handler);
        if (index > -1) {
          listeners[event].splice(index, 1);
        }
      }
    }),

    // Test helper
    getListeners: (event?: string) => (event ? listeners[event] || [] : listeners),
  };
}

/**
 * Create a spy for tracking method calls
 */
export function createMethodSpy<T extends object>(
  obj: T,
  methodName: keyof T
): ReturnType<typeof vi.fn> {
  const spy = vi.fn();
  const original = obj[methodName];

  if (typeof original === 'function') {
    (obj[methodName] as any) = function (this: any, ...args: any[]) {
      spy(...args);
      return (original as any).apply(this, args);
    };
  }

  return spy;
}

/**
 * Create a mock timer controller
 */
export function createMockTimerController() {
  let currentTime = Date.now();
  const timers: Array<{
    callback: () => void;
    time: number;
    interval?: number;
  }> = [];

  return {
    setTimeout: (callback: () => void, delay: number) => {
      const id = timers.length;
      timers.push({ callback, time: currentTime + delay });
      return id;
    },

    setInterval: (callback: () => void, interval: number) => {
      const id = timers.length;
      timers.push({ callback, time: currentTime + interval, interval });
      return id;
    },

    clearTimeout: (id: number) => {
      if (timers[id]) {
        timers[id].interval = undefined;
      }
    },

    clearInterval: (id: number) => {
      if (timers[id]) {
        timers[id].interval = undefined;
      }
    },

    tick: (ms: number) => {
      currentTime += ms;
      timers.forEach((timer, id) => {
        if (timer.interval === undefined && timer.time <= currentTime) {
          timer.callback();
          timers[id] = { callback: () => {}, time: Infinity };
        } else if (timer.interval !== undefined) {
          while (timer.time <= currentTime) {
            timer.callback();
            timer.time += timer.interval;
          }
        }
      });
    },

    getCurrentTime: () => currentTime,
  };
}

/**
 * Create a test logger
 */
export function createTestLogger() {
  const logs: Array<{ level: string; message: string; args: any[] }> = [];

  return {
    debug: (...args: any[]) => logs.push({ level: 'debug', message: args[0], args }),
    info: (...args: any[]) => logs.push({ level: 'info', message: args[0], args }),
    warn: (...args: any[]) => logs.push({ level: 'warn', message: args[0], args }),
    error: (...args: any[]) => logs.push({ level: 'error', message: args[0], args }),

    // Test helpers
    getLogs: (level?: string) =>
      level ? logs.filter((l) => l.level === level) : logs,
    clear: () => (logs.length = 0),
    hasLog: (level: string, message: string) =>
      logs.some((l) => l.level === level && l.message.includes(message)),
  };
}

/**
 * Create a mock abort controller
 */
export function createMockAbortController() {
  let aborted = false;
  const listeners: Array<() => void> = [];

  const signal = {
    aborted: false,
    addEventListener: (event: string, listener: () => void) => {
      if (event === 'abort') {
        listeners.push(listener);
      }
    },
    removeEventListener: (event: string, listener: () => void) => {
      if (event === 'abort') {
        const index = listeners.indexOf(listener);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    },
  };

  return {
    signal,
    abort: () => {
      aborted = true;
      signal.aborted = true;
      listeners.forEach((listener) => listener());
    },
    isAborted: () => aborted,
  };
}

/**
 * Capture console output
 */
export function captureConsole() {
  const output: Record<string, string[]> = {
    log: [],
    info: [],
    warn: [],
    error: [],
    debug: [],
  };

  const originalConsole = { ...console };

  Object.keys(output).forEach((level) => {
    (console as any)[level] = (...args: any[]) => {
      const levelOutput = output[level];
      if (levelOutput) {
        levelOutput.push(args.join(' '));
      }
    };
  });

  return {
    getOutput: (level?: string) => (level ? output[level] : output),
    restore: () => {
      Object.assign(console, originalConsole);
    },
  };
}

/**
 * Create a mock file system
 */
export function createMockFileSystem() {
  const files: Map<string, string> = new Map();

  return {
    writeFile: (path: string, content: string) => files.set(path, content),
    readFile: (path: string) => files.get(path) || null,
    exists: (path: string) => files.has(path),
    delete: (path: string) => files.delete(path),
    list: () => Array.from(files.keys()),
    clear: () => files.clear(),
  };
}

/**
 * Wait for an event to be emitted
 */
export function waitForEvent(
  emitter: any,
  event: string,
  timeout: number = 5000
): Promise<any> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      emitter.removeListener(event, handler);
      reject(new Error(`Timeout waiting for event: ${event}`));
    }, timeout);

    const handler = (...args: any[]) => {
      clearTimeout(timer);
      resolve(args.length === 1 ? args[0] : args);
    };

    emitter.once(event, handler);
  });
}
