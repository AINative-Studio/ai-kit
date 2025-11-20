# useConversation Hook

The `useConversation` hook provides a powerful and flexible way to manage conversation state with persistent storage using ConversationStore.

## Features

- **Persistent Storage**: Load and save conversations using ConversationStore
- **Auto-save**: Automatic debounced saving on message updates
- **Optimistic Updates**: Instant UI updates with background persistence
- **Pagination**: Support for loading older messages (pagination ready)
- **Error Handling**: Comprehensive error handling with callbacks
- **Loading States**: Fine-grained loading and saving states
- **Flexible Configuration**: Customizable auto-save, TTL, and metadata

## Installation

```bash
npm install @ainative/ai-kit
# or
pnpm add @ainative/ai-kit
# or
yarn add @ainative/ai-kit
```

## Basic Usage

```tsx
import { useConversation } from '@ainative/ai-kit/react'
import { MemoryStore } from '@ainative/ai-kit-core/store'

function ChatComponent() {
  const store = new MemoryStore()

  const {
    messages,
    isLoading,
    isSaving,
    error,
    appendMessage,
    clearConversation,
  } = useConversation({
    store,
    conversationId: 'chat-123',
  })

  const handleSendMessage = async (content: string) => {
    await appendMessage({
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      timestamp: Date.now(),
    })
  }

  return (
    <div>
      {messages.map((message) => (
        <div key={message.id}>
          <strong>{message.role}:</strong> {message.content}
        </div>
      ))}
      {isSaving && <span>Saving...</span>}
    </div>
  )
}
```

## API Reference

### Options

```typescript
interface UseConversationOptions {
  store: ConversationStore          // Required: Store instance
  conversationId: string             // Required: Conversation ID
  autoSave?: boolean                 // Auto-save on changes (default: true)
  autoSaveDelay?: number            // Debounce delay in ms (default: 1000)
  pageSize?: number                 // Page size for pagination (default: 50)
  autoLoad?: boolean                // Auto-load on mount (default: true)
  ttl?: number                      // TTL in seconds
  metadata?: Record<string, any>    // Custom metadata
  onLoad?: (conversation: Conversation) => void
  onSave?: (conversation: Conversation) => void
  onError?: (error: Error) => void
  onAutoSave?: (conversation: Conversation) => void
}
```

### Return Value

```typescript
interface UseConversationReturn {
  // State
  messages: Message[]               // Current messages
  isLoading: boolean                // Loading state
  isSaving: boolean                 // Saving state
  error: Error | null               // Error state
  hasMore: boolean                  // More messages available
  metadata: ConversationMetadata | null  // Conversation metadata
  currentOffset: number             // Current pagination offset

  // Actions
  loadConversation: (conversationId?: string) => Promise<void>
  saveConversation: () => Promise<void>
  appendMessage: (message: Message) => Promise<void>
  appendMessages: (messages: Message[]) => Promise<void>
  deleteMessage: (messageId: string) => Promise<void>
  updateMessage: (messageId: string, updates: Partial<Message>) => Promise<void>
  clearConversation: () => Promise<void>
  loadMore: () => Promise<void>
  reload: () => Promise<void>
  clearError: () => void
}
```

## Advanced Examples

### With Redis Store

```tsx
import { useConversation } from '@ainative/ai-kit/react'
import { RedisStore } from '@ainative/ai-kit-core/store'

function PersistentChat() {
  const store = new RedisStore({
    type: 'redis',
    url: 'redis://localhost:6379',
  })

  const conversation = useConversation({
    store,
    conversationId: 'user-123-chat',
    ttl: 86400, // 24 hours
    metadata: {
      userId: '123',
      topic: 'support',
    },
  })

  return <ChatUI {...conversation} />
}
```

### With Auto-save Disabled

```tsx
function ManualSaveChat() {
  const {
    messages,
    isSaving,
    appendMessage,
    saveConversation,
  } = useConversation({
    store,
    conversationId: 'draft-123',
    autoSave: false, // Disable auto-save
  })

  const handleSave = async () => {
    await saveConversation()
  }

  return (
    <div>
      {/* Messages */}
      <button onClick={handleSave} disabled={isSaving}>
        {isSaving ? 'Saving...' : 'Save Draft'}
      </button>
    </div>
  )
}
```

### With Custom Debounce Delay

```tsx
function FastAutoSaveChat() {
  const conversation = useConversation({
    store,
    conversationId: 'chat-123',
    autoSave: true,
    autoSaveDelay: 500, // Save after 500ms of inactivity
  })

  return <ChatUI {...conversation} />
}
```

### With Error Handling

```tsx
function RobustChat() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const conversation = useConversation({
    store,
    conversationId: 'chat-123',
    onError: (error) => {
      console.error('Conversation error:', error)
      setErrorMessage(error.message)
    },
    onSave: (conv) => {
      console.log('Conversation saved:', conv.metadata)
      setErrorMessage(null)
    },
  })

  return (
    <div>
      {errorMessage && (
        <div className="error">
          {errorMessage}
          <button onClick={conversation.clearError}>Dismiss</button>
        </div>
      )}
      <ChatUI {...conversation} />
    </div>
  )
}
```

### With Pagination

```tsx
function LongConversationChat() {
  const {
    messages,
    hasMore,
    isLoading,
    loadMore,
  } = useConversation({
    store,
    conversationId: 'long-chat-123',
    pageSize: 25, // Load 25 messages at a time
  })

  return (
    <div>
      {hasMore && (
        <button onClick={loadMore} disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Load More'}
        </button>
      )}
      {messages.map((msg) => (
        <MessageComponent key={msg.id} message={msg} />
      ))}
    </div>
  )
}
```

### Multi-action Updates

```tsx
function ChatWithActions() {
  const conversation = useConversation({
    store,
    conversationId: 'chat-123',
  })

  const handleDeleteMessage = async (messageId: string) => {
    await conversation.deleteMessage(messageId)
  }

  const handleEditMessage = async (messageId: string, newContent: string) => {
    await conversation.updateMessage(messageId, {
      content: newContent,
    })
  }

  const handleClearAll = async () => {
    if (confirm('Clear all messages?')) {
      await conversation.clearConversation()
    }
  }

  return (
    <div>
      <button onClick={handleClearAll}>Clear All</button>
      {conversation.messages.map((msg) => (
        <div key={msg.id}>
          <p>{msg.content}</p>
          <button onClick={() => handleEditMessage(msg.id, 'Updated!')}>
            Edit
          </button>
          <button onClick={() => handleDeleteMessage(msg.id)}>
            Delete
          </button>
        </div>
      ))}
    </div>
  )
}
```

### With Callbacks

```tsx
function MonitoredChat() {
  const conversation = useConversation({
    store,
    conversationId: 'chat-123',
    onLoad: (conv) => {
      console.log(`Loaded ${conv.messages.length} messages`)
    },
    onSave: (conv) => {
      console.log(`Saved at ${new Date(conv.metadata.updatedAt)}`)
    },
    onAutoSave: (conv) => {
      console.log('Auto-save completed')
    },
    onError: (error) => {
      // Send to error tracking service
      trackError('conversation-error', error)
    },
  })

  return <ChatUI {...conversation} />
}
```

### Switching Conversations

```tsx
function MultiConversationChat() {
  const [currentConvId, setCurrentConvId] = useState('chat-1')

  const conversation = useConversation({
    store,
    conversationId: currentConvId,
  })

  const switchConversation = async (newId: string) => {
    setCurrentConvId(newId)
    // The hook will automatically reload when conversationId changes
  }

  return (
    <div>
      <select
        value={currentConvId}
        onChange={(e) => switchConversation(e.target.value)}
      >
        <option value="chat-1">Conversation 1</option>
        <option value="chat-2">Conversation 2</option>
        <option value="chat-3">Conversation 3</option>
      </select>
      <ChatUI {...conversation} />
    </div>
  )
}
```

## Best Practices

### 1. Store Initialization

Create your store instance once and reuse it:

```tsx
// stores.ts
export const conversationStore = new MemoryStore({
  type: 'memory',
  maxConversations: 100,
})

// component.tsx
import { conversationStore } from './stores'

function Chat() {
  const conversation = useConversation({
    store: conversationStore,
    conversationId: 'chat-123',
  })
}
```

### 2. Message ID Generation

Use consistent message ID generation:

```tsx
import { nanoid } from 'nanoid'

function Chat() {
  const conversation = useConversation({
    store,
    conversationId: 'chat-123',
  })

  const addMessage = (content: string, role: 'user' | 'assistant') => {
    conversation.appendMessage({
      id: nanoid(),
      role,
      content,
      timestamp: Date.now(),
    })
  }
}
```

### 3. Error Recovery

Implement proper error recovery:

```tsx
function ResilientChat() {
  const conversation = useConversation({
    store,
    conversationId: 'chat-123',
    onError: async (error) => {
      console.error('Error:', error)

      // Retry after delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      await conversation.reload()
    },
  })
}
```

### 4. Optimistic Updates

The hook handles optimistic updates automatically:

```tsx
// Messages appear immediately in UI
await conversation.appendMessage(newMessage)
// Auto-save happens in background
```

### 5. Auto-save Tuning

Adjust auto-save delay based on your use case:

```tsx
// Frequent updates (typing indicators)
autoSaveDelay: 2000 // Wait 2 seconds

// Infrequent updates (user messages only)
autoSaveDelay: 500  // Save quickly

// Manual control
autoSave: false     // Save on button click
```

### 6. Cleanup

The hook automatically cleans up on unmount. No manual cleanup needed.

### 7. Loading States

Show appropriate loading indicators:

```tsx
function Chat() {
  const { isLoading, isSaving, messages } = useConversation({
    store,
    conversationId: 'chat-123',
  })

  if (isLoading) return <Spinner />

  return (
    <div>
      {messages.map(msg => <Message key={msg.id} {...msg} />)}
      {isSaving && <SaveIndicator />}
    </div>
  )
}
```

## Performance Considerations

- **Auto-save Debouncing**: The hook debounces auto-save operations to prevent excessive saves
- **Optimistic Updates**: Messages are added to state immediately for instant UI feedback
- **Concurrent Save Protection**: The hook prevents concurrent save operations
- **Memory Management**: Clean up timers and listeners on unmount

## TypeScript Support

The hook is fully typed with TypeScript:

```tsx
import type { Message } from '@ainative/ai-kit-core'
import type { UseConversationOptions } from '@ainative/ai-kit/react'

const options: UseConversationOptions = {
  store,
  conversationId: 'chat-123',
  autoSave: true,
}

const conversation = useConversation(options)
// All return values are properly typed
```

## Integration with Other Hooks

### With useAIStream

```tsx
import { useConversation } from '@ainative/ai-kit/react'
import { useAIStream } from '@ainative/ai-kit/react'

function AIChat() {
  const conversation = useConversation({
    store,
    conversationId: 'ai-chat-123',
  })

  const { send, isStreaming } = useAIStream({
    endpoint: '/api/chat',
    onMessage: (message) => {
      conversation.appendMessage(message)
    },
  })

  const handleSend = async (content: string) => {
    const userMessage = {
      id: nanoid(),
      role: 'user' as const,
      content,
      timestamp: Date.now(),
    }

    await conversation.appendMessage(userMessage)
    await send(content)
  }

  return <ChatUI {...conversation} onSend={handleSend} />
}
```

## Troubleshooting

### Messages not saving

- Check that `autoSave` is enabled (default: true)
- Verify store is properly initialized
- Check browser console for errors
- Ensure `conversationId` is valid

### Slow performance

- Increase `autoSaveDelay` to reduce save frequency
- Use pagination for long conversations
- Consider using Redis instead of Memory store for large datasets

### State not updating

- Ensure you're not mutating messages directly
- Use the provided methods (`appendMessage`, `updateMessage`, etc.)
- Check that component is properly mounted

## Related

- [ConversationStore Documentation](../core/conversation-store.md)
- [useAIStream Hook](./use-ai-stream.md)
- [Message Types](../core/types.md)
