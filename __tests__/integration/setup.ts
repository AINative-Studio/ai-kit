/**
 * Integration Test Setup
 *
 * Global setup for integration tests including:
 * - Mock service workers
 * - Test database setup
 * - Environment configuration
 * - Cleanup utilities
 */

import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// Mock API handlers
const handlers = [
  // Mock OpenAI API
  http.post('https://api.openai.com/v1/chat/completions', () => {
    return HttpResponse.json({
      id: 'chatcmpl-test',
      object: 'chat.completion',
      created: Date.now(),
      model: 'gpt-4',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: 'This is a test response',
          },
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: 10,
        completion_tokens: 5,
        total_tokens: 15,
      },
    });
  }),

  // Mock streaming endpoint
  http.post('https://api.openai.com/v1/chat/completions', ({ request }) => {
    const url = new URL(request.url);
    if (url.searchParams.get('stream') === 'true') {
      const stream = new ReadableStream({
        start(controller) {
          const chunks = [
            'data: {"id":"chatcmpl-test","choices":[{"delta":{"content":"Hello"}}]}\n\n',
            'data: {"id":"chatcmpl-test","choices":[{"delta":{"content":" world"}}]}\n\n',
            'data: [DONE]\n\n',
          ];

          chunks.forEach((chunk) => {
            controller.enqueue(new TextEncoder().encode(chunk));
          });

          controller.close();
        },
      });

      return new HttpResponse(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
        },
      });
    }

    return HttpResponse.json({});
  }),

  // Mock ZeroDB API
  http.post('https://api.zerodb.ai/v1/memory/store', () => {
    return HttpResponse.json({
      success: true,
      id: 'mem-test-id',
      stored_at: new Date().toISOString(),
    });
  }),

  http.post('https://api.zerodb.ai/v1/memory/search', () => {
    return HttpResponse.json({
      success: true,
      results: [
        {
          id: 'mem-1',
          content: 'Test memory',
          similarity: 0.95,
          metadata: { timestamp: Date.now() },
        },
      ],
    });
  }),

  // Mock tool execution endpoints
  http.post('https://api.example.com/tools/calculator', async ({ request }) => {
    const body = await request.json() as { operation: string; a: number; b: number };
    const { operation, a, b } = body;

    let result = 0;
    switch (operation) {
      case 'add':
      case '+':
        result = a + b;
        break;
      case 'subtract':
      case '-':
        result = a - b;
        break;
      case 'multiply':
      case '*':
        result = a * b;
        break;
      case 'divide':
      case '/':
        result = a / b;
        break;
    }

    return HttpResponse.json({ result });
  }),

  // Mock tool execute endpoint (generic)
  http.post('https://api.example.com/tools/execute', async ({ request }) => {
    const body = await request.json() as { tool: string; arguments: any };
    const { tool, arguments: args } = body;

    switch (tool) {
      case 'calculator':
        const calcResult = eval(`${args.a} ${args.operation} ${args.b}`);
        return HttpResponse.json({ success: true, result: calcResult });

      case 'search':
        return HttpResponse.json({
          success: true,
          results: [
            {
              title: 'Search Result',
              snippet: 'Relevant content',
              url: 'https://example.com/result',
            },
          ],
        });

      case 'weather':
        return HttpResponse.json({
          success: true,
          temperature: 72,
          condition: 'sunny',
          location: args.location || 'Unknown',
        });

      default:
        return HttpResponse.json(
          { success: false, error: 'Unknown tool' },
          { status: 400 }
        );
    }
  }),

  // Mock auth endpoints
  http.post('https://api.ainative.studio/v1/auth/login', async ({ request }) => {
    const body = await request.json() as { apiKey?: string; email?: string };

    if (body.apiKey && body.apiKey.startsWith('test-api-key')) {
      return HttpResponse.json({
        success: true,
        token: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 3600,
        user: {
          id: 'user-123',
          email: body.email || 'test@example.com',
          name: 'Test User',
        },
      });
    }

    return HttpResponse.json(
      { success: false, error: 'Invalid credentials' },
      { status: 401 }
    );
  }),

  http.post('https://api.ainative.studio/v1/auth/refresh', () => {
    return HttpResponse.json({
      success: true,
      token: 'new-mock-jwt-token',
      expiresIn: 3600,
    });
  }),

  http.post('https://api.ainative.studio/v1/auth/validate', ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (authHeader?.includes('mock-jwt-token') || authHeader?.includes('new-mock-jwt-token')) {
      return HttpResponse.json({
        success: true,
        valid: true,
        user: {
          id: 'user-123',
          email: 'test@example.com',
        },
      });
    }

    return HttpResponse.json(
      { success: false, valid: false, error: 'Invalid token' },
      { status: 401 }
    );
  }),

  http.post('https://api.ainative.studio/v1/auth/logout', () => {
    return HttpResponse.json({ success: true });
  }),

  // Mock assistant creation
  http.post('https://api.openai.com/v1/assistants', async ({ request }) => {
    const body = await request.json() as {
      name: string;
      instructions: string;
      tools?: any[];
      model: string;
    };

    return HttpResponse.json({
      id: `asst-${Date.now()}`,
      object: 'assistant',
      created_at: Date.now(),
      name: body.name,
      instructions: body.instructions,
      tools: body.tools || [],
      model: body.model,
    });
  }),
];

// Create MSW server
export const server = setupServer(...handlers);

// Global test setup
beforeAll(() => {
  // Start MSW server
  server.listen({ onUnhandledRequest: 'warn' });

  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.OPENAI_API_KEY = 'test-key';
  process.env.ZERODB_API_KEY = 'test-zerodb-key';
  process.env.TEST_MODE = 'true';

  // Mock console methods to reduce noise
  global.console = {
    ...console,
    error: vi.fn(),
    warn: vi.fn(),
  };
});

afterAll(() => {
  // Stop MSW server
  server.close();

  // Cleanup environment
  delete process.env.TEST_MODE;
});

beforeEach(() => {
  // Reset handlers before each test
  server.resetHandlers();

  // Clear all mocks
  vi.clearAllMocks();

  // Reset any global state
  if (typeof window !== 'undefined') {
    window.localStorage.clear();
    window.sessionStorage.clear();
  }
});

afterEach(() => {
  // Cleanup after each test
  vi.restoreAllMocks();
});

// Test utilities
export const waitForAsync = (ms: number = 100) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const createMockStream = (chunks: string[]) => {
  return new ReadableStream({
    start(controller) {
      chunks.forEach((chunk) => {
        controller.enqueue(new TextEncoder().encode(chunk));
      });
      controller.close();
    },
  });
};

export const collectStreamChunks = async (stream: ReadableStream): Promise<string[]> => {
  const reader = stream.getReader();
  const chunks: string[] = [];

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(new TextDecoder().decode(value));
    }
  } finally {
    reader.releaseLock();
  }

  return chunks;
};

// Mock data generators
export const generateMockConversation = (messageCount: number = 5) => {
  const messages = [];
  for (let i = 0; i < messageCount; i++) {
    messages.push({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `Message ${i + 1}`,
      timestamp: Date.now() - (messageCount - i) * 1000,
    });
  }
  return messages;
};

export const generateMockAgent = (overrides = {}) => ({
  id: 'agent-test',
  name: 'Test Agent',
  description: 'A test agent',
  systemPrompt: 'You are a helpful assistant',
  model: 'gpt-4',
  temperature: 0.7,
  maxTokens: 1000,
  tools: [],
  ...overrides,
});

// Database setup utilities
export const setupTestDatabase = async () => {
  // In a real scenario, this would set up a test database
  // For now, we'll use in-memory storage
  return {
    cleanup: async () => {
      // Cleanup test database
    },
  };
};

// Performance testing utilities
export const measurePerformance = async <T>(
  fn: () => Promise<T>,
  maxDuration: number = 5000
): Promise<{ result: T; duration: number }> => {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;

  if (duration > maxDuration) {
    throw new Error(`Performance test failed: ${duration}ms > ${maxDuration}ms`);
  }

  return { result, duration };
};

// Memory leak detection
export const checkMemoryLeaks = () => {
  if (typeof global.gc === 'function') {
    global.gc();
  }

  const usage = process.memoryUsage();
  const maxHeapUsed = 500 * 1024 * 1024; // 500MB

  if (usage.heapUsed > maxHeapUsed) {
    throw new Error(`Memory leak detected: ${usage.heapUsed} bytes used`);
  }
};

// Retry utility for flaky tests
export const retry = async <T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxAttempts) {
        await waitForAsync(delay);
      }
    }
  }

  throw lastError;
};

// Cleanup utility
export const cleanup = () => {
  // Clear any pending timers
  vi.clearAllTimers();

  // Clear mocks
  vi.clearAllMocks();

  // Reset modules
  vi.resetModules();
};
