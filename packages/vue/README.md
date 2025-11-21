# @ainative/ai-kit-vue

Vue 3 composables for building AI-powered applications with streaming support and conversation persistence.

## Installation

```bash
npm install @ainative/ai-kit-vue @ainative/ai-kit-core
# or
pnpm add @ainative/ai-kit-vue @ainative/ai-kit-core
# or
yarn add @ainative/ai-kit-vue @ainative/ai-kit-core
```

## Features

- **Vue 3 Composition API** - Modern composable pattern with full TypeScript support
- **Reactive State Management** - Automatic reactivity with Vue refs
- **Streaming Support** - Real-time AI response streaming with `useAIStream`
- **Conversation Persistence** - Save and load conversations with `useConversation`
- **Error Handling** - Built-in error management and recovery
- **Token Usage Tracking** - Monitor API usage and costs
- **Auto-Save** - Automatic conversation persistence with debouncing
- **Retry Logic** - Automatic retry with exponential backoff
- **Lifecycle Management** - Automatic cleanup on component unmount

## Quick Start

### Basic Streaming

```vue
<script setup lang="ts">
import { useAIStream } from '@ainative/ai-kit-vue'

const { messages, isStreaming, error, send, reset, usage } = useAIStream({
  endpoint: '/api/chat',
  model: 'gpt-4',
})

const handleSend = () => {
  send('Hello, AI!')
}
</script>

<template>
  <div>
    <div v-for="message in messages" :key="message.id">
      <strong>{{ message.role }}:</strong> {{ message.content }}
    </div>

    <div v-if="isStreaming">Streaming...</div>
    <div v-if="error">Error: {{ error.message }}</div>

    <button @click="handleSend" :disabled="isStreaming">
      Send Message
    </button>
    <button @click="reset">Reset</button>

    <div>Tokens: {{ usage.totalTokens }}</div>
  </div>
</template>
```

### Persistent Conversations

```vue
<script setup lang="ts">
import { useConversation } from '@ainative/ai-kit-vue'
import { createStore } from '@ainative/ai-kit-core'

const store = createStore({ type: 'memory' })

const {
  messages,
  isLoading,
  isSaving,
  error,
  appendMessage,
  clearConversation,
  saveConversation,
} = useConversation({
  store,
  conversationId: 'chat-session-1',
  autoSave: true,
  autoSaveDelay: 1000,
})

const handleAddMessage = () => {
  appendMessage({
    id: Date.now().toString(),
    role: 'user',
    content: 'Hello!',
    timestamp: Date.now(),
  })
}
</script>

<template>
  <div>
    <div v-if="isLoading">Loading conversation...</div>
    <div v-if="isSaving">Saving...</div>

    <div v-for="message in messages" :key="message.id">
      {{ message.content }}
    </div>

    <button @click="handleAddMessage">Add Message</button>
    <button @click="clearConversation">Clear</button>
    <button @click="saveConversation">Save Now</button>
  </div>
</template>
```

## API Reference

### `useAIStream(config)`

A Vue 3 composable for managing AI streaming conversations.

**Parameters:**
- `config: StreamConfig` - Configuration object for the AI stream

**Returns:**
- `messages: Ref<Message[]>` - Reactive array of conversation messages
- `isStreaming: Ref<boolean>` - Reactive streaming status
- `error: Ref<Error | null>` - Reactive error state
- `usage: Ref<Usage>` - Reactive token usage statistics
- `send: (content: string) => Promise<void>` - Send a message
- `reset: () => void` - Reset the conversation
- `retry: () => Promise<void>` - Retry the last message
- `stop: () => void` - Stop the current stream

### `useConversation(options)`

A Vue 3 composable for managing persistent conversations.

**Parameters:**
- `options: UseConversationOptions` - Configuration object

**Options:**
- `store: ConversationStore` - Store instance for persistence
- `conversationId: string` - Unique conversation identifier
- `autoSave?: boolean` - Enable auto-save (default: true)
- `autoSaveDelay?: number` - Debounce delay in ms (default: 1000)
- `autoLoad?: boolean` - Auto-load on mount (default: true)
- `ttl?: number` - Time-to-live in seconds
- `metadata?: Record<string, any>` - Custom metadata
- `onLoad?: (conversation: Conversation) => void` - Load callback
- `onSave?: (conversation: Conversation) => void` - Save callback
- `onError?: (error: Error) => void` - Error callback
- `onAutoSave?: (conversation: Conversation) => void` - Auto-save callback

**Returns:**
- `messages: Ref<Message[]>` - Reactive messages array
- `isLoading: Ref<boolean>` - Loading state
- `isSaving: Ref<boolean>` - Saving state
- `error: Ref<Error | null>` - Error state
- `hasMore: Ref<boolean>` - Pagination state
- `metadata: Ref<ConversationMetadata | null>` - Conversation metadata
- `currentOffset: Ref<number>` - Pagination offset
- `loadConversation: (id?: string) => Promise<void>` - Load conversation
- `saveConversation: () => Promise<void>` - Save conversation
- `appendMessage: (message: Message) => Promise<void>` - Add message
- `appendMessages: (messages: Message[]) => Promise<void>` - Add multiple messages
- `deleteMessage: (messageId: string) => Promise<void>` - Delete message
- `updateMessage: (messageId: string, updates: Partial<Message>) => Promise<void>` - Update message
- `clearConversation: () => Promise<void>` - Clear all messages
- `loadMore: () => Promise<void>` - Load older messages
- `reload: () => Promise<void>` - Reload from store
- `clearError: () => void` - Clear error state

## Migration from React Package

If you were previously using Vue composables from `@ainative/ai-kit-react`, you should now import from `@ainative/ai-kit-vue`:

```typescript
// Before
import { useAIStream } from '@ainative/ai-kit-react/vue'

// After
import { useAIStream } from '@ainative/ai-kit-vue'
```

The API remains the same, ensuring a smooth transition.

## Storage Backends

The `useConversation` composable supports multiple storage backends:

### Memory Store (Development)
```typescript
import { createStore } from '@ainative/ai-kit-core'
const store = createStore({ type: 'memory' })
```

### Redis Store (Production)
```typescript
const store = createStore({
  type: 'redis',
  redis: {
    host: 'localhost',
    port: 6379,
  },
})
```

### ZeroDB Store (Cloud)
```typescript
const store = createStore({
  type: 'zerodb',
  zerodb: {
    apiKey: 'your-api-key',
    projectId: 'your-project-id',
  },
})
```

## TypeScript Support

This package is written in TypeScript and provides full type definitions. All composables return properly typed reactive refs.

```typescript
import type {
  UseAIStreamResult,
  UseConversationReturn,
  Message,
  Usage,
  StreamConfig,
} from '@ainative/ai-kit-vue'
```

## Browser Compatibility

Same as Vue 3 requirements:
- Modern browsers with ES2015 support
- Chrome >= 64
- Firefox >= 67
- Safari >= 12
- Edge >= 79

## Documentation

For full documentation, visit [AI Kit Documentation](https://github.com/AINative-Studio/ai-kit).

## License

MIT
