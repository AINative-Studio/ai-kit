# Streaming API Reference

Real-time streaming from LLM providers with automatic reconnection and error handling.

## Overview

The streaming module provides framework-agnostic tools for handling real-time AI responses:

- **AIStream**: Client-side streaming with SSE (Server-Sent Events)
- **StreamingResponse**: Server-side SSE stream formatting
- **Provider Adapters**: OpenAI and Anthropic streaming adapters
- **Token Counting**: Real-time token usage tracking

## Installation

```bash
npm install @ainative/ai-kit-core
```

```typescript
import { AIStream, StreamingResponse } from '@ainative/ai-kit-core/streaming';
```

---

## AIStream

Client-side AI streaming with automatic reconnection and error handling.

### Constructor

```typescript
new AIStream(config: StreamConfig, options?: StreamOptions)
```

**Parameters:**

- `config: StreamConfig` - Stream configuration
  - `endpoint: string` - API endpoint URL
  - `model: string` - Model identifier (e.g., 'gpt-4', 'claude-3-opus')
  - `headers?: Record<string, string>` - Custom headers
  - `systemPrompt?: string` - System prompt for the conversation
  - `onToken?: (token: string) => void` - Callback for each token
  - `onCost?: (usage: Usage) => void` - Callback for usage updates
  - `onError?: (error: Error) => void` - Error callback
  - `retry?: RetryConfig` - Retry configuration

- `options?: StreamOptions` - Additional options (reserved for future use)

**Example:**

```typescript
import { AIStream } from '@ainative/ai-kit-core/streaming';

const stream = new AIStream({
  endpoint: '/api/chat',
  model: 'gpt-4',
  systemPrompt: 'You are a helpful assistant.',
  onToken: (token) => console.log('Token:', token),
  onCost: (usage) => console.log('Usage:', usage),
  retry: {
    maxRetries: 3,
    backoff: 'exponential',
    initialDelay: 1000,
    maxDelay: 10000
  }
});
```

### Methods

#### send(content: string): Promise<void>

Send a message and start streaming the response.

```typescript
await stream.send('Hello, how are you?');
```

**Parameters:**
- `content: string` - User message content

**Returns:** `Promise<void>`

**Events Emitted:**
- `message` - New message added (user or assistant)
- `streaming-start` - Streaming started
- `token` - New token received
- `usage` - Usage information updated
- `streaming-end` - Streaming completed

---

#### reset(): void

Reset the conversation, clearing all messages and usage statistics.

```typescript
stream.reset();
```

**Events Emitted:**
- `reset` - Conversation reset

---

#### retry(): Promise<void>

Retry the last message. Removes the last assistant response and re-streams.

```typescript
await stream.retry();
```

**Returns:** `Promise<void>`

---

#### stop(): void

Stop the current stream immediately.

```typescript
stream.stop();
```

---

#### getMessages(): Message[]

Get all messages in the conversation.

```typescript
const messages = stream.getMessages();
console.log(messages);
// [
//   { id: '...', role: 'user', content: 'Hello', timestamp: 1234567890 },
//   { id: '...', role: 'assistant', content: 'Hi there!', timestamp: 1234567891 }
// ]
```

**Returns:** `Message[]` - Copy of messages array

---

#### getIsStreaming(): boolean

Check if currently streaming a response.

```typescript
if (stream.getIsStreaming()) {
  console.log('Currently streaming...');
}
```

**Returns:** `boolean`

---

#### getUsage(): Usage

Get current token usage statistics.

```typescript
const usage = stream.getUsage();
console.log('Prompt tokens:', usage.promptTokens);
console.log('Completion tokens:', usage.completionTokens);
console.log('Total tokens:', usage.totalTokens);
```

**Returns:** `Usage` - Copy of usage object

### Events

AIStream extends EventEmitter and emits the following events:

```typescript
// Message added (user or assistant)
stream.on('message', (message: Message) => {
  console.log('New message:', message);
});

// Streaming started
stream.on('streaming-start', () => {
  console.log('Streaming started');
});

// New token received
stream.on('token', (token: string) => {
  process.stdout.write(token);
});

// Usage information updated
stream.on('usage', (usage: Usage) => {
  console.log('Usage:', usage);
});

// Streaming completed
stream.on('streaming-end', () => {
  console.log('Streaming ended');
});

// Error occurred
stream.on('error', (error: Error) => {
  console.error('Error:', error);
});

// Retry attempted
stream.on('retry', ({ attempt, delay }) => {
  console.log(`Retry attempt ${attempt} in ${delay}ms`);
});

// Conversation reset
stream.on('reset', () => {
  console.log('Conversation reset');
});
```

### Complete Example

```typescript
import { AIStream } from '@ainative/ai-kit-core/streaming';

const stream = new AIStream({
  endpoint: '/api/chat',
  model: 'gpt-4',
  systemPrompt: 'You are a helpful coding assistant.',
  retry: {
    maxRetries: 3,
    backoff: 'exponential'
  }
});

// Listen to events
stream.on('token', (token) => {
  process.stdout.write(token);
});

stream.on('usage', (usage) => {
  console.log(`\nTokens used: ${usage.totalTokens}`);
});

stream.on('error', (error) => {
  console.error('Stream error:', error.message);
});

// Send messages
await stream.send('Write a function to calculate factorial');

// Get conversation history
const messages = stream.getMessages();
console.log('Conversation:', messages);

// Reset when done
stream.reset();
```

---

## StreamingResponse

Server-side SSE (Server-Sent Events) stream formatting for Node.js/Express.

### Constructor

```typescript
new StreamingResponse(response: ResponseLike, options?: StreamingOptions)
```

**Parameters:**

- `response: ResponseLike` - Node.js ServerResponse or Express Response object
- `options?: StreamingOptions` - Configuration options
  - `enableHeartbeat?: boolean` - Enable heartbeat (default: false)
  - `heartbeatInterval?: number` - Heartbeat interval in ms (default: 30000)
  - `compressionEnabled?: boolean` - Enable compression (default: false)
  - `customHeaders?: Record<string, string>` - Custom HTTP headers

**Example:**

```typescript
import { StreamingResponse } from '@ainative/ai-kit-core/streaming';
import express from 'express';

const app = express();

app.post('/api/chat', async (req, res) => {
  const stream = new StreamingResponse(res, {
    enableHeartbeat: true,
    heartbeatInterval: 30000
  });

  stream.start();
  // ... send tokens ...
  stream.end();
});
```

### Methods

#### start(): this

Initialize the SSE stream with proper headers.

```typescript
const stream = new StreamingResponse(res);
stream.start();
```

**Returns:** `this` - For method chaining

**Headers Set:**
- `Content-Type: text/event-stream`
- `Cache-Control: no-cache, no-transform`
- `Connection: keep-alive`
- `X-Accel-Buffering: no` (disables nginx buffering)

---

#### sendToken(token: string, index?: number): this

Send a text token to the client.

```typescript
stream.sendToken('Hello');
stream.sendToken(' world!');
```

**Parameters:**
- `token: string` - Text token to send
- `index?: number` - Optional token index

**Returns:** `this` - For method chaining

---

#### sendUsage(usage: UsageEvent): this

Send token usage metadata to the client.

```typescript
stream.sendUsage({
  promptTokens: 100,
  completionTokens: 50,
  totalTokens: 150
});
```

**Parameters:**
- `usage: UsageEvent` - Token usage information
  - `promptTokens: number`
  - `completionTokens: number`
  - `totalTokens: number`

**Returns:** `this` - For method chaining

---

#### sendError(error: string | ErrorEvent): this

Send an error event to the client.

```typescript
stream.sendError('Rate limit exceeded');
// or
stream.sendError({
  error: 'Rate limit exceeded',
  code: 'RATE_LIMIT'
});
```

**Parameters:**
- `error: string | ErrorEvent` - Error message or error object

**Returns:** `this` - For method chaining

---

#### sendMetadata(metadata: MetadataEvent): this

Send custom metadata to the client.

```typescript
stream.sendMetadata({
  model: 'gpt-4',
  temperature: 0.7,
  customField: 'value'
});
```

**Parameters:**
- `metadata: MetadataEvent` - Metadata object (any key-value pairs)

**Returns:** `this` - For method chaining

---

#### end(): void

End the SSE stream gracefully.

```typescript
stream.end();
```

Sends a `DONE` event and closes the connection.

---

#### abort(error: string | ErrorEvent): void

Abort the stream with an error.

```typescript
stream.abort('Internal server error');
```

**Parameters:**
- `error: string | ErrorEvent` - Error message or error object

Sends an error event and then ends the stream.

---

#### isStreamActive(): boolean

Check if the stream is currently active.

```typescript
if (stream.isStreamActive()) {
  console.log('Stream is active');
}
```

**Returns:** `boolean`

---

#### getMessageCount(): number

Get the number of messages sent.

```typescript
const count = stream.getMessageCount();
console.log(`Sent ${count} messages`);
```

**Returns:** `number`

### SSE Event Types

The StreamingResponse sends different event types:

- `START` - Stream initialized
- `TOKEN` - Text token received
- `USAGE` - Usage metadata
- `ERROR` - Error occurred
- `METADATA` - Custom metadata
- `DONE` - Stream completed

### Complete Example

```typescript
import { StreamingResponse } from '@ainative/ai-kit-core/streaming';
import express from 'express';
import OpenAI from 'openai';

const app = express();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;

  const stream = new StreamingResponse(res, {
    enableHeartbeat: true
  });

  try {
    stream.start();

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      stream: true
    });

    for await (const chunk of completion) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        stream.sendToken(content);
      }

      // Send usage on last chunk
      if (chunk.usage) {
        stream.sendUsage({
          promptTokens: chunk.usage.prompt_tokens,
          completionTokens: chunk.usage.completion_tokens,
          totalTokens: chunk.usage.total_tokens
        });
      }
    }

    stream.end();
  } catch (error) {
    stream.abort(error.message);
  }
});

app.listen(3000);
```

---

## Provider Adapters

Adapters for streaming from different LLM providers.

### OpenAIAdapter

```typescript
import { OpenAIAdapter } from '@ainative/ai-kit-core/streaming/adapters';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Hello!' }],
  stream: true
});

// Convert to standard stream
const stream = OpenAIAdapter(response);

// Use in framework
return new Response(stream);
```

### AnthropicAdapter

```typescript
import { AnthropicAdapter } from '@ainative/ai-kit-core/streaming/adapters';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const response = await anthropic.messages.create({
  model: 'claude-3-opus-20240229',
  messages: [{ role: 'user', content: 'Hello!' }],
  stream: true
});

// Convert to standard stream
const stream = AnthropicAdapter(response);

// Use in framework
return new Response(stream);
```

---

## Types

### StreamConfig

```typescript
interface StreamConfig {
  endpoint: string;
  model: string;
  headers?: Record<string, string>;
  systemPrompt?: string;
  onToken?: (token: string) => void;
  onCost?: (usage: Usage) => void;
  onError?: (error: Error) => void;
  retry?: RetryConfig;
}
```

### RetryConfig

```typescript
interface RetryConfig {
  maxRetries?: number;          // Default: 3
  backoff?: 'exponential' | 'linear';  // Default: 'exponential'
  initialDelay?: number;        // Default: 1000ms
  maxDelay?: number;            // Default: 10000ms
}
```

### Message

```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}
```

### Usage

```typescript
interface Usage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}
```

### StreamingOptions

```typescript
interface StreamingOptions {
  enableHeartbeat?: boolean;
  heartbeatInterval?: number;
  compressionEnabled?: boolean;
  customHeaders?: Record<string, string>;
}
```

### SSEEventType

```typescript
enum SSEEventType {
  START = 'start',
  TOKEN = 'token',
  USAGE = 'usage',
  ERROR = 'error',
  METADATA = 'metadata',
  DONE = 'done'
}
```

---

## Framework Integration

### Next.js App Router

```typescript
// app/api/chat/route.ts
import { StreamingResponse } from '@ainative/ai-kit-core/streaming';
import { OpenAI } from 'openai';

export async function POST(req: Request) {
  const { messages } = await req.json();
  const openai = new OpenAI();

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages,
    stream: true
  });

  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of response) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ token: content })}\n\n`));
        }
      }
      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache'
    }
  });
}
```

### Express

```typescript
import express from 'express';
import { StreamingResponse } from '@ainative/ai-kit-core/streaming';
import { OpenAI } from 'openai';

const app = express();
const openai = new OpenAI();

app.post('/api/chat', async (req, res) => {
  const stream = new StreamingResponse(res);
  stream.start();

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: req.body.messages,
      stream: true
    });

    for await (const chunk of completion) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        stream.sendToken(content);
      }
    }

    stream.end();
  } catch (error) {
    stream.abort(error.message);
  }
});
```

---

## Best Practices

### 1. Always Handle Errors

```typescript
stream.on('error', (error) => {
  console.error('Stream error:', error);
  // Implement fallback logic
});
```

### 2. Implement Retry Logic

```typescript
const stream = new AIStream({
  endpoint: '/api/chat',
  model: 'gpt-4',
  retry: {
    maxRetries: 3,
    backoff: 'exponential',
    initialDelay: 1000
  }
});
```

### 3. Use Heartbeats for Long Connections

```typescript
const stream = new StreamingResponse(res, {
  enableHeartbeat: true,
  heartbeatInterval: 30000  // 30 seconds
});
```

### 4. Clean Up Resources

```typescript
// Stop streaming when component unmounts
useEffect(() => {
  return () => {
    stream.stop();
  };
}, []);
```

### 5. Monitor Token Usage

```typescript
stream.on('usage', (usage) => {
  if (usage.totalTokens > BUDGET_LIMIT) {
    console.warn('Token budget exceeded');
    stream.stop();
  }
});
```

### 6. Handle Client Disconnects

```typescript
const stream = new StreamingResponse(res);
stream.start();

res.on('close', () => {
  console.log('Client disconnected');
  // Clean up resources
});
```

---

## Error Handling

### Common Errors

```typescript
// Network error - will retry automatically
stream.on('error', (error) => {
  if (error.message.includes('fetch failed')) {
    console.log('Network error, retrying...');
  }
});

// Rate limit error
stream.on('error', (error) => {
  if (error.message.includes('429')) {
    console.log('Rate limited');
  }
});

// Authentication error
stream.on('error', (error) => {
  if (error.message.includes('401')) {
    console.log('Invalid API key');
  }
});
```

### Retry Strategy

```typescript
const stream = new AIStream({
  endpoint: '/api/chat',
  model: 'gpt-4',
  retry: {
    maxRetries: 5,
    backoff: 'exponential',
    initialDelay: 1000,
    maxDelay: 30000
  }
});

stream.on('retry', ({ attempt, delay }) => {
  console.log(`Retry ${attempt} in ${delay}ms`);
});
```

---

## Performance Tips

1. **Use Token Streaming**: Stream tokens as they arrive for better UX
2. **Implement Caching**: Cache responses for repeated queries
3. **Monitor Token Usage**: Track tokens to optimize costs
4. **Use Compression**: Enable compression for large responses
5. **Implement Timeouts**: Set reasonable timeouts for requests
6. **Pool Connections**: Reuse connections when possible

---

## See Also

- [Agent API](./agents.md)
- [Usage Tracking](./tracking.md)
- [React Hooks](../react/hooks.md)
- [Next.js Integration](../nextjs/streaming.md)
