# @ainative/ai-kit-testing API Reference

Testing utilities for AI Kit

## Installation

```bash
npm install -D @ainative/ai-kit-testing
```

## Overview

Comprehensive testing utilities:

- **Mocks**: Mock LLM responses, streams, and agents
- **Fixtures**: Pre-built test data
- **Helpers**: Test utilities and assertions
- **Custom Matchers**: Jest/Vitest matchers for AI testing

## Quick Start

```typescript
import { mockAIStream, mockAgent, expect } from '@ainative/ai-kit-testing';

describe('Chat', () => {
  it('should handle streaming', async () => {
    const stream = mockAIStream({
      messages: ['Hello', ' world', '!']
    });

    const result = await processStream(stream);
    expect(result).toMatchStreamOutput('Hello world!');
  });
});
```

---

## Mocks

### mockAIStream

Mock streaming responses.

```typescript
import { mockAIStream } from '@ainative/ai-kit-testing';

const stream = mockAIStream({
  messages: ['token1', 'token2', 'token3'],
  delay: 100,  // ms between tokens
  usage: {
    promptTokens: 10,
    completionTokens: 5,
    totalTokens: 15
  }
});
```

---

### mockAgent

Mock agent execution.

```typescript
import { mockAgent } from '@ainative/ai-kit-testing';

const agent = mockAgent({
  name: 'TestAgent',
  responses: [
    { input: 'hello', output: 'Hi there!' },
    { input: 'calculate 2+2', output: 'The answer is 4', toolCalls: ['calculator'] }
  ]
});

const result = await agent.execute('hello');
expect(result.output).toBe('Hi there!');
```

---

### mockLLM

Mock LLM provider.

```typescript
import { mockLLM } from '@ainative/ai-kit-testing';

const llm = mockLLM({
  provider: 'openai',
  model: 'gpt-4',
  responses: [
    { content: 'Response 1' },
    { content: 'Response 2' }
  ]
});
```

---

## Fixtures

Pre-built test data.

```typescript
import { fixtures } from '@ainative/ai-kit-testing';

const { conversations, messages, tools, agents } = fixtures;

// Use in tests
const mockConversation = conversations.simple;
const mockMessages = messages.chatHistory;
const calculatorTool = tools.calculator;
```

---

## Custom Matchers

### toMatchStreamOutput

Assert stream output matches expected text.

```typescript
expect(stream).toMatchStreamOutput('expected output');
```

---

### toHaveToolCall

Assert tool was called.

```typescript
expect(executionResult).toHaveToolCall('calculator');
expect(executionResult).toHaveToolCall('web_search', { query: 'AI news' });
```

---

### toHaveTokenCount

Assert token count is within range.

```typescript
expect(result).toHaveTokenCount({ min: 10, max: 100 });
```

---

## Complete Example

```typescript
import {
  mockAIStream,
  mockAgent,
  fixtures,
  expect
} from '@ainative/ai-kit-testing';

describe('Agent Execution', () => {
  it('should execute with tools', async () => {
    const agent = mockAgent({
      name: 'TestAgent',
      tools: [fixtures.tools.calculator],
      responses: [
        {
          input: 'calculate 5 + 3',
          output: 'The answer is 8',
          toolCalls: [{
            name: 'calculator',
            parameters: { operation: 'add', a: 5, b: 3 },
            result: 8
          }]
        }
      ]
    });

    const result = await agent.execute('calculate 5 + 3');

    expect(result.output).toBe('The answer is 8');
    expect(result).toHaveToolCall('calculator', {
      operation: 'add',
      a: 5,
      b: 3
    });
    expect(result).toHaveTokenCount({ min: 5, max: 50 });
  });

  it('should handle streaming', async () => {
    const stream = mockAIStream({
      messages: ['Calculating...', ' 5 + 3 = 8'],
      delay: 50
    });

    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    expect(chunks.join('')).toMatchStreamOutput('Calculating... 5 + 3 = 8');
  });
});
```

---

## See Also

- [Agent API](../core/agents.md)
- [Streaming API](../core/streaming.md)
