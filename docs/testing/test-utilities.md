# AI Kit Test Utilities

Comprehensive test utilities for building reliable AI-powered applications with AI Kit.

## Overview

The `@ainative/ai-kit-testing` package provides:

- **Mocks**: Test doubles for core AI Kit classes
- **Fixtures**: Pre-built test data for common scenarios
- **Helpers**: Utility functions for testing streaming, messages, and network conditions
- **Matchers**: Custom Vitest/Jest matchers for AI-specific assertions

## Installation

```bash
npm install --save-dev @ainative/ai-kit-testing
# or
pnpm add -D @ainative/ai-kit-testing
# or
yarn add -D @ainative/ai-kit-testing
```

## Quick Start

```typescript
import { describe, it, expect } from 'vitest';
import { MockAIStream, createUserMessage, extendExpect } from '@ainative/ai-kit-testing';

// Register custom matchers
extendExpect(expect);

describe('My AI Feature', () => {
  it('should stream responses', async () => {
    const stream = new MockAIStream({
      mockResponses: ['Hello, world!'],
    });

    await stream.send('Test message');

    expect(stream).toHaveStreamed({
      minTokens: 1,
      content: 'Hello',
    });
  });
});
```

## Mock Classes

### MockAIStream

Simulates streaming AI responses for testing.

#### Basic Usage

```typescript
import { MockAIStream } from '@ainative/ai-kit-testing';

const stream = new MockAIStream({
  mockResponses: ['Response 1', 'Response 2'],
  tokenDelay: 10, // Delay between tokens in ms
});

// Send a message
await stream.send('Hello');

// Get messages
const messages = stream.getMessages();
expect(messages).toHaveLength(2); // user + assistant

// Get usage stats
const usage = stream.getUsage();
expect(usage.totalTokens).toBeGreaterThan(0);
```

#### Simulating Errors

```typescript
const errorStream = new MockAIStream({
  simulateError: true,
  error: new Error('Rate limit exceeded'),
});

await expect(errorStream.send('Test')).rejects.toThrow('Rate limit exceeded');
```

#### Simulating Retries

```typescript
const retryStream = new MockAIStream({
  retriesBeforeSuccess: 2,
});

// First two attempts will fail
await expect(retryStream.send('Test')).rejects.toThrow();
await expect(retryStream.send('Test')).rejects.toThrow();

// Third attempt succeeds
await retryStream.send('Test');
expect(retryStream.getMessages()).toHaveLength(2);
```

#### Event Listeners

```typescript
const stream = new MockAIStream();

stream.on('token', (token) => {
  console.log('Token:', token);
});

stream.on('usage', (usage) => {
  console.log('Usage:', usage);
});

stream.on('error', (error) => {
  console.error('Error:', error);
});

await stream.send('Test');
```

### MockLLMProvider

Mock LLM provider for testing agent systems.

#### Basic Usage

```typescript
import { MockLLMProvider } from '@ainative/ai-kit-testing';

const provider = new MockLLMProvider({
  provider: 'openai',
  model: 'gpt-4',
  mockResponses: ['Response 1', 'Response 2'],
});

const response = await provider.chat({
  messages: [
    { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() }
  ],
});

expect(response.content).toBe('Response 1');
expect(response.usage).toBeDefined();
```

#### Mocking Tool Calls

```typescript
const provider = new MockLLMProvider({
  provider: 'openai',
  model: 'gpt-4',
  mockToolCalls: [
    {
      id: 'call-1',
      name: 'get_weather',
      parameters: { location: 'San Francisco' },
    },
  ],
});

const response = await provider.chat({
  messages: [
    { id: '1', role: 'user', content: 'What is the weather?', timestamp: Date.now() }
  ],
  tools: [/* tool definitions */],
});

expect(response.toolCalls).toHaveLength(1);
expect(response.finishReason).toBe('tool_calls');
```

#### Streaming Support

```typescript
const chunks: string[] = [];

await provider.chat({
  messages: [
    { id: '1', role: 'user', content: 'Test', timestamp: Date.now() }
  ],
  streaming: true,
  onStream: (chunk) => {
    chunks.push(chunk);
  },
});

expect(chunks.length).toBeGreaterThan(0);
```

#### Assertions

```typescript
await provider.chat({
  messages: [
    { id: '1', role: 'user', content: 'Test', timestamp: Date.now() }
  ],
  temperature: 0.7,
});

// Assert specific parameters
expect(provider.assertCalledWith({ temperature: 0.7 })).toBe(true);

// Assert with matcher function
expect(
  provider.assertCalledWith((params) => params.messages.length > 0)
).toBe(true);

// Assert call count
expect(provider.assertCallCount(1)).toBe(true);
```

### MockUsageTracker

Mock usage tracker for testing cost tracking and analytics.

#### Basic Usage

```typescript
import { MockUsageTracker } from '@ainative/ai-kit-testing';

const tracker = new MockUsageTracker({
  mockCostCalculation: (prompt, completion) => {
    return (prompt + completion) * 0.00001;
  },
});

const record = await tracker.track({
  model: 'gpt-4',
  promptTokens: 100,
  completionTokens: 50,
  durationMs: 1000,
  success: true,
});

expect(record.cost.totalCost).toBeGreaterThan(0);
```

#### Pre-populated Records

```typescript
import { usageRecordFixtures } from '@ainative/ai-kit-testing';

const tracker = new MockUsageTracker({
  initialRecords: usageRecordFixtures.mixed,
});

const records = await tracker.getRecords();
expect(records.length).toBeGreaterThan(0);

const aggregated = await tracker.getAggregated();
expect(aggregated.totalCost).toBeGreaterThan(0);
```

#### Filtering

```typescript
const records = await tracker.getRecords({
  provider: 'openai',
  success: true,
  startDate: new Date('2024-01-01'),
});

expect(records.every((r) => r.provider === 'openai')).toBe(true);
expect(records.every((r) => r.success === true)).toBe(true);
```

### MockAgentExecutor

Mock agent executor for testing multi-step agent workflows.

#### Basic Usage

```typescript
import { MockAgentExecutor } from '@ainative/ai-kit-testing';

const executor = new MockAgentExecutor({
  agentConfig: {
    id: 'test-agent',
    name: 'Test Agent',
    systemPrompt: 'You are a test assistant',
    llm: { provider: 'openai', model: 'gpt-4' },
    tools: [],
  },
  mockResult: {
    response: 'Test response',
    success: true,
  },
});

const result = await executor.execute('Test input');

expect(result.success).toBe(true);
expect(result.response).toBe('Test response');
expect(result.trace).toBeDefined();
```

#### Simulating Tool Execution

```typescript
const executor = new MockAgentExecutor({
  agentConfig: {
    id: 'tool-agent',
    name: 'Tool Agent',
    systemPrompt: 'You use tools',
    llm: { provider: 'openai', model: 'gpt-4' },
    tools: [],
  },
  mockToolResults: [
    {
      toolCallId: 'call-1',
      toolName: 'get_weather',
      result: { temperature: 72 },
      metadata: {
        durationMs: 50,
        timestamp: new Date().toISOString(),
      },
    },
  ],
});

const result = await executor.execute('What is the weather?');

expect(result.trace.stats.totalToolCalls).toBe(1);
expect(result.trace.stats.successfulToolCalls).toBe(1);
```

#### Streaming Events

```typescript
const events: any[] = [];

const result = await executor.execute('Test input', {
  streaming: true,
  onStream: (event) => {
    events.push(event);
  },
});

expect(events).toContainEqual(
  expect.objectContaining({ type: 'start' })
);
expect(events).toContainEqual(
  expect.objectContaining({ type: 'complete' })
);
```

## Test Helpers

### Message Helpers

```typescript
import {
  createUserMessage,
  createAssistantMessage,
  createSystemMessage,
  createToolMessage,
  createTestConversation,
} from '@ainative/ai-kit-testing';

// Create individual messages
const userMsg = createUserMessage('Hello');
const assistantMsg = createAssistantMessage('Hi there!');
const systemMsg = createSystemMessage('You are helpful');
const toolMsg = createToolMessage('call-1', 'get_weather', '{"temp": 72}');

// Create a conversation
const conversation = createTestConversation([
  { role: 'user', content: 'Hello' },
  { role: 'assistant', content: 'Hi!' },
]);
```

### Stream Helpers

```typescript
import {
  waitForStream,
  collectStreamTokens,
  collectStreamMessages,
  mockStreamingResponse,
} from '@ainative/ai-kit-testing';

// Wait for stream to complete
const result = await waitForStream(stream, {
  timeout: 5000,
  expectedMessages: 2,
  collectTokens: true,
});

expect(result.completed).toBe(true);
expect(result.tokens).toBeDefined();

// Collect all tokens
const tokens = await collectStreamTokens(stream, 5000);
expect(tokens.length).toBeGreaterThan(0);

// Mock SSE response
const sseStream = mockStreamingResponse({
  events: [
    { data: JSON.stringify({ token: 'Hello' }) },
    { data: JSON.stringify({ token: ' world' }) },
    { data: '[DONE]' },
  ],
  eventDelay: 10,
});
```

### Network Helpers

```typescript
import {
  simulateNetworkError,
  createFailingFetch,
  createRetryableFetch,
  createSlowFetch,
  simulateNetworkLatency,
} from '@ainative/ai-kit-testing';

// Simulate network errors
const error = simulateNetworkError({
  type: 'timeout',
  message: 'Request timed out',
});

// Create failing fetch
const failingFetch = createFailingFetch({
  type: 'rate_limit',
  statusCode: 429,
  retryAfter: 60,
});

// Create retryable fetch (fails N times, then succeeds)
const retryableFetch = createRetryableFetch(2, {
  type: 'server_error',
  statusCode: 503,
});

// Create slow fetch (with latency)
const slowFetch = createSlowFetch(2000); // 2 second delay

// Simulate network latency
await simulateNetworkLatency(100, 50); // 100ms + random 0-50ms jitter
```

## Test Fixtures

### Conversation Fixtures

```typescript
import { conversationFixtures } from '@ainative/ai-kit-testing';

// Simple Q&A
const simple = conversationFixtures.simpleQA;

// Multi-turn conversation
const multiTurn = conversationFixtures.multiTurn;

// Conversation with tool calls
const toolCall = conversationFixtures.toolCall;

// Error conversation
const error = conversationFixtures.error;

// Long conversation (20 messages)
const long = conversationFixtures.long;
```

### Usage Record Fixtures

```typescript
import { usageRecordFixtures } from '@ainative/ai-kit-testing';

// Successful GPT-4 request
const gpt4Success = usageRecordFixtures.gpt4Success;

// Successful Claude request
const claudeSuccess = usageRecordFixtures.claudeSuccess;

// Rate limit error
const rateLimitError = usageRecordFixtures.rateLimitError;

// Timeout error
const timeoutError = usageRecordFixtures.timeoutError;

// Large request
const largeRequest = usageRecordFixtures.largeRequest;

// Mixed records (array)
const mixed = usageRecordFixtures.mixed;
```

## Custom Matchers

### Setup

```typescript
import { expect } from 'vitest';
import { extendExpect } from '@ainative/ai-kit-testing';

// Register custom matchers once in setup file
extendExpect(expect);
```

### toHaveStreamed

Assert that streaming occurred with optional constraints.

```typescript
// Basic usage
expect(stream).toHaveStreamed();

// With token count constraints
expect(stream).toHaveStreamed({
  minTokens: 5,
  maxTokens: 100,
});

// With content matching
expect(stream).toHaveStreamed({
  content: 'expected text',
});

// With completion status
expect(stream).toHaveStreamed({
  completed: true,
});
```

### toHaveCost

Assert cost calculations with tolerance.

```typescript
// Exact cost
expect(usage).toHaveCost({
  exact: 0.005,
  tolerance: 0.0001,
});

// Min/max cost
expect(usage).toHaveCost({
  min: 0.001,
  max: 0.01,
});

// Currency check
expect(usage).toHaveCost({
  currency: 'USD',
});
```

### toMatchTokenCount

Assert token counts with optional tolerance.

```typescript
// Exact match
expect(usage).toMatchTokenCount({
  promptTokens: 100,
  completionTokens: 50,
  totalTokens: 150,
});

// Approximate match
expect(usage).toMatchTokenCount({
  totalTokens: 150,
  approximate: true, // Within 10%
});

// With tolerance
expect(usage).toMatchTokenCount({
  totalTokens: 150,
  tolerance: 10,
});
```

### toHaveError

Assert error states and properties.

```typescript
// Basic error check
expect(result).toHaveError();

// With message matching
expect(result).toHaveError({
  message: 'Rate limit',
});

// With error type
expect(result).toHaveError({
  type: 'RateLimitError',
});

// With error code
expect(result).toHaveError({
  code: 'RATE_LIMIT_EXCEEDED',
});

// With metadata
expect(result).toHaveError({
  metadata: {
    retryAfter: 60,
  },
});
```

## Best Practices

### 1. Use Fixtures for Common Scenarios

```typescript
import { conversationFixtures, usageRecordFixtures } from '@ainative/ai-kit-testing';

describe('Analytics Dashboard', () => {
  it('should display usage statistics', () => {
    const tracker = new MockUsageTracker({
      initialRecords: usageRecordFixtures.mixed,
    });

    // Test your analytics logic
  });
});
```

### 2. Mock Network Conditions

```typescript
import { createRetryableFetch, simulateNetworkLatency } from '@ainative/ai-kit-testing';

it('should handle rate limits with retry', async () => {
  const mockFetch = createRetryableFetch(2, {
    type: 'rate_limit',
    statusCode: 429,
  });

  // Replace global fetch
  global.fetch = mockFetch;

  // Test retry logic
});
```

### 3. Test Streaming Behavior

```typescript
import { MockAIStream, waitForStream } from '@ainative/ai-kit-testing';

it('should stream responses correctly', async () => {
  const stream = new MockAIStream({
    mockResponses: ['Streaming response'],
    tokenDelay: 10,
  });

  const sendPromise = stream.send('Test');

  const result = await waitForStream(stream, {
    timeout: 5000,
    collectTokens: true,
  });

  expect(result.completed).toBe(true);
  expect(result.tokens).toBeDefined();
});
```

### 4. Use Custom Matchers

```typescript
import { extendExpect } from '@ainative/ai-kit-testing';

extendExpect(expect);

it('should track costs accurately', async () => {
  const tracker = new MockUsageTracker();

  await tracker.track({
    model: 'gpt-4',
    promptTokens: 100,
    completionTokens: 50,
    durationMs: 1000,
    success: true,
  });

  const aggregated = await tracker.getAggregated();

  expect(aggregated).toHaveCost({
    min: 0.001,
    max: 0.01,
  });
});
```

### 5. Test Error Scenarios

```typescript
import { MockAgentExecutor } from '@ainative/ai-kit-testing';

it('should handle agent errors gracefully', async () => {
  const executor = new MockAgentExecutor({
    agentConfig: { /* ... */ },
    simulateError: true,
    error: new Error('LLM API Error'),
  });

  await expect(executor.execute('Test')).rejects.toThrow('LLM API Error');
});
```

## Integration with Testing Frameworks

### Vitest

```typescript
// vitest.setup.ts
import { expect } from 'vitest';
import { extendExpect } from '@ainative/ai-kit-testing';

extendExpect(expect);
```

### Jest

```typescript
// jest.setup.ts
import { extendExpect } from '@ainative/ai-kit-testing';

extendExpect(expect);
```

## Example Test Suite

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import {
  MockAIStream,
  MockUsageTracker,
  createUserMessage,
  waitForStream,
  extendExpect,
} from '@ainative/ai-kit-testing';

extendExpect(expect);

describe('AI Chat Application', () => {
  let stream: MockAIStream;
  let tracker: MockUsageTracker;

  beforeEach(() => {
    stream = new MockAIStream({
      mockResponses: ['Hello! How can I help you today?'],
      tokenDelay: 5,
    });

    tracker = new MockUsageTracker();
  });

  it('should handle user messages', async () => {
    const message = createUserMessage('Hello');

    await stream.send(message.content);

    const messages = stream.getMessages();
    expect(messages).toHaveLength(2);
    expect(messages[0].role).toBe('user');
    expect(messages[1].role).toBe('assistant');
  });

  it('should track usage', async () => {
    await stream.send('Test message');

    const usage = stream.getUsage();

    expect(usage).toMatchTokenCount({
      totalTokens: expect.any(Number),
      approximate: true,
    });

    expect(usage).toHaveCost({
      min: 0,
      max: 1,
    });
  });

  it('should stream responses', async () => {
    const sendPromise = stream.send('Test');

    const result = await waitForStream(stream, {
      timeout: 5000,
      collectTokens: true,
    });

    expect(result).toMatchObject({
      completed: true,
      messages: expect.arrayContaining([
        expect.objectContaining({ role: 'assistant' }),
      ]),
    });

    expect(stream).toHaveStreamed({
      minTokens: 1,
      content: 'help',
    });
  });
});
```

## TypeScript Support

All test utilities are fully typed with TypeScript. Type definitions are exported and can be used in your tests:

```typescript
import type {
  MockAIStreamConfig,
  MockLLMProviderConfig,
  WaitForStreamOptions,
  ToHaveStreamedOptions,
} from '@ainative/ai-kit-testing';

const config: MockAIStreamConfig = {
  mockResponses: ['Test'],
  tokenDelay: 10,
};
```

## License

MIT
