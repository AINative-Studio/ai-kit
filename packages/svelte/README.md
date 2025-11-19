# @ainative/ai-kit-svelte

Svelte adapter for AI Kit with reactive stores for AI streaming.

## Installation

```bash
pnpm add @ainative/ai-kit-svelte
```

## Usage

### Basic Example

```svelte
<script lang="ts">
  import { createAIStream } from '@ainative/ai-kit-svelte'

  const aiStream = createAIStream({
    endpoint: '/api/chat',
    model: 'gpt-4',
    systemPrompt: 'You are a helpful assistant.'
  })

  // Subscribe to reactive stores
  $: messages = $aiStream.messages
  $: isStreaming = $aiStream.isStreaming
  $: error = $aiStream.error

  let userInput = ''

  async function handleSend() {
    if (!userInput.trim()) return
    await aiStream.send(userInput)
    userInput = ''
  }

  // Clean up when component is destroyed
  import { onDestroy } from 'svelte'
  onDestroy(() => {
    aiStream.destroy()
  })
</script>

<div class="chat-container">
  {#each $messages as message (message.id)}
    <div class="message {message.role}">
      <strong>{message.role}:</strong>
      <p>{message.content}</p>
    </div>
  {/each}
</div>

<form on:submit|preventDefault={handleSend}>
  <input
    type="text"
    bind:value={userInput}
    disabled={$isStreaming}
    placeholder="Type your message..."
  />
  <button type="submit" disabled={$isStreaming}>
    {$isStreaming ? 'Sending...' : 'Send'}
  </button>
</form>

{#if $error}
  <div class="error">Error: {$error.message}</div>
{/if}
```

### Advanced Example with Callbacks

```svelte
<script lang="ts">
  import { createAIStream } from '@ainative/ai-kit-svelte'

  const aiStream = createAIStream({
    endpoint: '/api/chat',
    model: 'gpt-4',
    onToken: (token) => {
      console.log('Received token:', token)
    },
    onCost: (usage) => {
      console.log('Token usage:', usage)
    },
    onError: (error) => {
      console.error('Stream error:', error)
    },
    retry: {
      maxRetries: 3,
      backoff: 'exponential',
      initialDelay: 1000,
      maxDelay: 10000
    }
  })

  // Usage statistics
  $: usage = $aiStream.usage
  $: console.log('Total tokens:', $usage.totalTokens)

  function handleRetry() {
    aiStream.retry()
  }

  function handleReset() {
    aiStream.reset()
  }

  function handleStop() {
    aiStream.stop()
  }
</script>

<!-- UI implementation -->
```

## API Reference

### `createAIStream(config: StreamConfig): AIStreamStore`

Creates a new AI streaming store.

#### Parameters

- `config.endpoint` (string, required): The API endpoint for streaming
- `config.model` (string, optional): The AI model to use
- `config.systemPrompt` (string, optional): System prompt for the AI
- `config.onToken` (function, optional): Callback fired for each token
- `config.onCost` (function, optional): Callback fired when usage stats update
- `config.onError` (function, optional): Callback fired on errors
- `config.retry` (object, optional): Retry configuration
  - `maxRetries` (number): Maximum number of retries
  - `backoff` ('linear' | 'exponential'): Backoff strategy
  - `initialDelay` (number): Initial retry delay in ms
  - `maxDelay` (number): Maximum retry delay in ms
- `config.headers` (object, optional): Additional HTTP headers

#### Returns

An `AIStreamStore` object with the following properties:

##### Stores (Readable)

- `messages`: Readable store containing the message history
- `isStreaming`: Readable store indicating if currently streaming
- `error`: Readable store containing any errors
- `usage`: Readable store with token usage statistics

##### Methods

- `send(content: string): Promise<void>`: Send a user message
- `reset(): void`: Clear all messages and reset state
- `retry(): Promise<void>`: Retry the last message
- `stop(): void`: Stop the current stream
- `destroy(): void`: Clean up resources and event listeners

### Types

```typescript
interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
}

interface Usage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
  estimatedCost?: number
  latency?: number
  model?: string
  cacheHit?: boolean
}
```

## Features

- ✅ Reactive Svelte stores for all state
- ✅ Automatic message history management
- ✅ Server-sent events (SSE) streaming
- ✅ Automatic retry with exponential backoff
- ✅ Token usage tracking
- ✅ Error handling
- ✅ TypeScript support
- ✅ Framework-agnostic core

## Testing

```bash
# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Type check
pnpm type-check
```

## License

MIT
