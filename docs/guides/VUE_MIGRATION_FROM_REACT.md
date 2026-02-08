# AIKIT-7: Vue useAIStream Composable

## Implementation Summary

Successfully implemented a Vue 3 composable that mirrors the React `useAIStream` hook functionality using the Composition API.

## Files Created

### Core Implementation
- **`/Users/aideveloper/ai-kit/packages/react/src/useAIStream.vue.ts`** - Vue 3 composable implementation
- **`/Users/aideveloper/ai-kit/packages/react/__tests__/useAIStream.vue.test.ts`** - Comprehensive test suite (24 tests)
- **`/Users/aideveloper/ai-kit/packages/react/vitest.vue.config.ts`** - Vue-specific Vitest configuration

### Build Configuration Updates
- Updated `package.json` with Vue exports and test scripts
- Updated `tsup.config.ts` to build Vue composable
- Added Vue dependencies: `vue@^3.4.0`, `@vue/test-utils@^2.4.0`, `happy-dom@^12.10.3`

## Test Coverage

```
Coverage Report:
- Statements: 94.35%
- Branches: 68.18%
- Functions: 100%
- Lines: 94.35%

Total Tests: 24 passed
- Initialization tests
- Send functionality tests
- Error handling tests
- Reset functionality tests
- Retry functionality tests
- Stop functionality tests
- Callback tests
- Cleanup tests
- Reactive updates tests
- Message updates tests
- Edge cases tests
```

## Usage Examples

### Basic Usage

```vue
<script setup lang="ts">
import { useAIStream } from '@ainative/ai-kit/vue'

const {
  messages,
  isStreaming,
  error,
  send,
  reset,
  retry,
  stop,
  usage
} = useAIStream({
  endpoint: '/api/chat',
  model: 'gpt-4',
  systemPrompt: 'You are a helpful assistant.'
})

const handleSend = async () => {
  await send('Hello, how are you?')
}
</script>

<template>
  <div class="chat">
    <div v-for="message in messages" :key="message.id" class="message">
      <div :class="`message-${message.role}`">
        {{ message.content }}
      </div>
    </div>

    <div v-if="isStreaming" class="loading">
      AI is typing...
    </div>

    <div v-if="error" class="error">
      Error: {{ error.message }}
      <button @click="retry">Retry</button>
    </div>

    <div class="controls">
      <button @click="handleSend" :disabled="isStreaming">
        Send Message
      </button>
      <button @click="stop" :disabled="!isStreaming">
        Stop
      </button>
      <button @click="reset">
        Clear Chat
      </button>
    </div>

    <div class="usage">
      Tokens used: {{ usage.totalTokens }}
    </div>
  </div>
</template>
```

### With Callbacks

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useAIStream } from '@ainative/ai-kit/vue'

const currentToken = ref('')
const totalCost = ref(0)

const { messages, send } = useAIStream({
  endpoint: '/api/chat',
  onToken: (token) => {
    currentToken.value = token
    console.log('Received token:', token)
  },
  onCost: (usage) => {
    // Calculate cost based on model pricing
    const cost = (usage.promptTokens * 0.01 + usage.completionTokens * 0.02) / 1000
    totalCost.value = cost
  },
  onError: (error) => {
    console.error('Stream error:', error)
  }
})
</script>

<template>
  <div>
    <p>Current token: {{ currentToken }}</p>
    <p>Estimated cost: ${{ totalCost.toFixed(4) }}</p>
  </div>
</template>
```

### With Retry Configuration

```vue
<script setup lang="ts">
import { useAIStream } from '@ainative/ai-kit/vue'

const { messages, send, error } = useAIStream({
  endpoint: '/api/chat',
  retry: {
    maxRetries: 3,
    backoff: 'exponential',
    initialDelay: 1000,
    maxDelay: 10000
  }
})
</script>
```

### Custom Headers

```vue
<script setup lang="ts">
import { useAIStream } from '@ainative/ai-kit/vue'

const { messages, send } = useAIStream({
  endpoint: '/api/chat',
  headers: {
    'Authorization': 'Bearer your-api-key',
    'X-Custom-Header': 'value'
  }
})
</script>
```

### Reactive Computed Values

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useAIStream } from '@ainative/ai-kit/vue'

const { messages, usage, isStreaming } = useAIStream({
  endpoint: '/api/chat'
})

const messageCount = computed(() => messages.value.length)
const userMessages = computed(() =>
  messages.value.filter(m => m.role === 'user')
)
const aiMessages = computed(() =>
  messages.value.filter(m => m.role === 'assistant')
)
const tokensPerMessage = computed(() =>
  messages.value.length > 0
    ? (usage.value.totalTokens / messages.value.length).toFixed(2)
    : 0
)
</script>

<template>
  <div class="stats">
    <p>Total messages: {{ messageCount }}</p>
    <p>User messages: {{ userMessages.length }}</p>
    <p>AI messages: {{ aiMessages.length }}</p>
    <p>Avg tokens/message: {{ tokensPerMessage }}</p>
  </div>
</template>
```

## API Reference

### UseAIStreamResult

```typescript
interface UseAIStreamResult {
  messages: Ref<Message[]>        // Reactive array of messages
  isStreaming: Ref<boolean>       // Reactive streaming state
  error: Ref<Error | null>        // Reactive error state
  send: (content: string) => Promise<void>
  reset: () => void
  retry: () => Promise<void>
  stop: () => void
  usage: Ref<Usage>               // Reactive usage statistics
}
```

### Message Type

```typescript
interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
}
```

### Usage Type

```typescript
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

### StreamConfig

```typescript
interface StreamConfig {
  endpoint: string
  model?: string
  systemPrompt?: string
  onToken?: (token: string) => void
  onCost?: (usage: Usage) => void
  onError?: (error: Error) => void
  retry?: RetryConfig
  cache?: boolean | CacheConfig
  timeout?: number
  headers?: Record<string, string>
}
```

## Key Differences from React Hook

1. **Reactive Refs**: All state values are wrapped in Vue `ref()` instead of React's `useState()`
2. **Lifecycle**: Uses `onMounted()` and `onUnmounted()` instead of `useEffect()`
3. **No useCallback**: Vue doesn't require memoization like React, functions are defined directly
4. **Reactive Updates**: Vue's reactivity system automatically tracks changes to refs

## Testing

Run Vue tests:
```bash
pnpm test:vue
```

Run Vue tests with coverage:
```bash
pnpm test:vue:coverage
```

## Build

The composable is built alongside the React package:
```bash
pnpm build
```

Output files:
- `dist/useAIStream.vue.js` (CommonJS)
- `dist/useAIStream.vue.mjs` (ES Module)
- `dist/useAIStream.vue.d.ts` (TypeScript definitions)

## Import Methods

### Named Import (Recommended)
```typescript
import { useAIStream } from '@ainative/ai-kit/vue'
```

### Full Import
```typescript
import * as VueAIKit from '@ainative/ai-kit/vue'
const { useAIStream } = VueAIKit
```

## Browser Compatibility

Same as Vue 3 requirements:
- Modern browsers with ES2015 support
- Chrome >= 64
- Firefox >= 67
- Safari >= 12
- Edge >= 79

## Best Practices

1. **Always use in setup()**: The composable should only be called in the `setup()` function or `<script setup>`
2. **Destructure what you need**: Only destructure the reactive refs and methods you'll use
3. **Don't reassign refs**: Use `.value` to access/modify ref values
4. **Error handling**: Always display error state and provide retry option
5. **Loading states**: Show loading indicators when `isStreaming.value === true`
6. **Cleanup**: No manual cleanup needed - Vue handles it automatically via `onUnmounted`

## Performance Considerations

- Messages are stored as a reactive array - for large chat histories, consider virtualization
- The composable creates a single AIStream instance per component instance
- Event listeners are automatically cleaned up on unmount
- Consider debouncing user input to avoid excessive API calls

## Future Enhancements

Potential future improvements tracked in separate issues:
- WebSocket transport support
- Message pagination/virtualization helpers
- Built-in retry UI components
- Streaming response animations
- Multi-model comparison mode
