# @ainative/ai-kit

React hooks and components for building AI-powered applications with AI Kit.

## Installation

```bash
npm install @ainative/ai-kit
# or
pnpm add @ainative/ai-kit
# or
yarn add @ainative/ai-kit
```

## Quick usage

This package has two distinct hooks that are easy to confuse — pick the one that matches what you need:

| Hook | Purpose | Returns |
|------|---------|---------|
| `useAIStream` | Sends a message and streams the AI response over SSE | `{ messages, isStreaming, error, send, reset, retry, stop, usage }` |
| `useConversation` | Loads/saves conversation history to a `ConversationStore` (no network streaming) | `{ messages, isLoading, isSaving, error, appendMessage, clearConversation, ... }` |

### Streaming a response with `useAIStream`

```tsx
import { useAIStream } from '@ainative/ai-kit'

function StreamingChat() {
  const { messages, send, isStreaming, error } = useAIStream({
    endpoint: '/api/chat',
    model: 'gpt-4o',
  })

  return (
    <div>
      {messages.map((m) => (
        <div key={m.id}><strong>{m.role}:</strong> {m.content}</div>
      ))}
      {error && <p>Error: {error.message}</p>}
      <button disabled={isStreaming} onClick={() => send('Hello!')}>
        Send
      </button>
    </div>
  )
}
```

`useAIStream`'s `endpoint` must implement this wire contract:

1. Accept a `POST` with body `{ messages: Message[], model?: string, systemPrompt?: string, stream: true }`.
2. Respond with `Content-Type: text/event-stream`.
3. Emit each SSE event's `data:` as a JSON string shaped `{"token": "<text>"}` for each chunk of content, and optionally `{"usage": {...}}` for token/cost accounting. Both are accumulated and surfaced via `messages`/`usage` on the client.
4. End the stream with a literal `data: [DONE]`.

Fields outside `{token}`/`{usage}` are currently discarded by the client — see the full write-up and a minimal matching server route example in [`docs/guides/ai-stream-wire-contract.md`](https://github.com/AINative-Studio/ai-kit/blob/main/docs/guides/ai-stream-wire-contract.md).

### Persisting a conversation with `useConversation`

```tsx
import { useConversation } from '@ainative/ai-kit/react'
import { MemoryStore } from '@ainative/ai-kit-core/store'

function ChatHistory() {
  const store = new MemoryStore()
  const { messages, appendMessage, isLoading } = useConversation({
    store,
    conversationId: 'chat-123',
  })

  // ...
}
```

See [`docs/react/use-conversation.md`](https://github.com/AINative-Studio/ai-kit/blob/main/docs/react/use-conversation.md) for the full API.

## Documentation

For full documentation, visit [https://ainative.studio/ai-kit](https://ainative.studio/ai-kit)

## License

MIT © AINative Studio
