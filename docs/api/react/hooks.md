# React Hooks API Reference

React hooks for AI streaming and conversation management.

## useAIStream

Hook for streaming AI responses.

### Usage

```typescript
import { useAIStream } from '@ainative/ai-kit-react';

function Chat() {
  const {
    messages,
    isStreaming,
    usage,
    send,
    retry,
    stop,
    reset
  } = useAIStream({
    endpoint: '/api/chat',
    model: 'gpt-4',
    systemPrompt: 'You are a helpful assistant',
    onToken: (token) => console.log('Token:', token),
    onError: (error) => console.error('Error:', error)
  });

  return (
    <div>
      {messages.map(msg => (
        <div key={msg.id}>
          <strong>{msg.role}:</strong> {msg.content}
        </div>
      ))}

      <input
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            send(e.target.value);
            e.target.value = '';
          }
        }}
        disabled={isStreaming}
      />

      {isStreaming && <button onClick={stop}>Stop</button>}
      {usage && <div>Tokens: {usage.totalTokens}</div>}
    </div>
  );
}
```

### Parameters

```typescript
interface UseAIStreamConfig {
  endpoint: string;
  model: string;
  systemPrompt?: string;
  headers?: Record<string, string>;
  onToken?: (token: string) => void;
  onError?: (error: Error) => void;
  onCost?: (usage: Usage) => void;
  retry?: RetryConfig;
}
```

### Return Value

```typescript
interface UseAIStreamReturn {
  messages: Message[];
  isStreaming: boolean;
  usage: Usage | null;
  error: Error | null;
  send: (content: string) => Promise<void>;
  retry: () => Promise<void>;
  stop: () => void;
  reset: () => void;
}
```

---

## useConversation

Hook for managing conversations with persistence.

### Usage

```typescript
import { useConversation } from '@ainative/ai-kit-react';

function PersistentChat() {
  const {
    conversationId,
    messages,
    isStreaming,
    send,
    loadConversation,
    saveConversation,
    listConversations
  } = useConversation({
    userId: 'user-123',
    storage: 'localStorage'  // or 'indexedDB', 'memory'
  });

  return (
    <div>
      <select onChange={(e) => loadConversation(e.target.value)}>
        {conversations.map(conv => (
          <option key={conv.id} value={conv.id}>
            {conv.title}
          </option>
        ))}
      </select>

      {messages.map(msg => (
        <div key={msg.id}>{msg.content}</div>
      ))}

      <input onKeyPress={(e) => {
        if (e.key === 'Enter') send(e.target.value);
      }} />
    </div>
  );
}
```

### Parameters

```typescript
interface UseConversationConfig {
  userId: string;
  conversationId?: string;
  storage?: 'memory' | 'localStorage' | 'indexedDB';
  autoSave?: boolean;
  endpoint?: string;
  model?: string;
}
```

### Return Value

```typescript
interface UseConversationReturn {
  conversationId: string;
  messages: Message[];
  isStreaming: boolean;
  send: (content: string) => Promise<void>;
  loadConversation: (id: string) => Promise<void>;
  saveConversation: () => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  listConversations: () => Promise<Conversation[]>;
  createNewConversation: () => void;
}
```

---

## Complete Examples

### Chat with Auto-Save

```typescript
import { useConversation } from '@ainative/ai-kit-react';

function AutoSaveChat() {
  const {
    messages,
    send,
    conversationId
  } = useConversation({
    userId: 'user-123',
    storage: 'localStorage',
    autoSave: true,  // Automatically saves after each message
    endpoint: '/api/chat',
    model: 'gpt-4'
  });

  return (
    <div>
      <p>Conversation ID: {conversationId}</p>
      {messages.map(msg => (
        <div key={msg.id}>{msg.content}</div>
      ))}
      <input onKeyPress={(e) => {
        if (e.key === 'Enter') {
          send(e.target.value);
          e.target.value = '';
        }
      }} />
    </div>
  );
}
```

### Multi-Conversation Manager

```typescript
import { useConversation } from '@ainative/ai-kit-react';
import { useState, useEffect } from 'react';

function ConversationManager() {
  const {
    conversationId,
    messages,
    send,
    loadConversation,
    listConversations,
    createNewConversation,
    deleteConversation
  } = useConversation({
    userId: 'user-123',
    storage: 'indexedDB'
  });

  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    async function load() {
      const convs = await listConversations();
      setConversations(convs);
    }
    load();
  }, []);

  return (
    <div>
      {/* Sidebar with conversation list */}
      <aside>
        <button onClick={createNewConversation}>New Chat</button>
        {conversations.map(conv => (
          <div key={conv.id}>
            <button onClick={() => loadConversation(conv.id)}>
              {conv.title || 'Untitled'}
            </button>
            <button onClick={() => deleteConversation(conv.id)}>Delete</button>
          </div>
        ))}
      </aside>

      {/* Main chat area */}
      <main>
        {messages.map(msg => (
          <div key={msg.id}>{msg.content}</div>
        ))}
        <input onKeyPress={(e) => {
          if (e.key === 'Enter') send(e.target.value);
        }} />
      </main>
    </div>
  );
}
```

---

## Best Practices

### 1. Handle Errors Gracefully

```typescript
const { error, send } = useAIStream({
  endpoint: '/api/chat',
  model: 'gpt-4',
  onError: (err) => {
    toast.error(err.message);
  }
});

if (error) {
  return <ErrorBoundary error={error} />;
}
```

### 2. Show Loading States

```typescript
const { isStreaming, send } = useAIStream(config);

return (
  <div>
    <button onClick={() => send(input)} disabled={isStreaming}>
      {isStreaming ? 'Sending...' : 'Send'}
    </button>
  </div>
);
```

### 3. Implement Retry Logic

```typescript
const { retry, error } = useAIStream({
  endpoint: '/api/chat',
  model: 'gpt-4',
  retry: {
    maxRetries: 3,
    backoff: 'exponential'
  }
});

if (error) {
  return (
    <div>
      <p>Error: {error.message}</p>
      <button onClick={retry}>Retry</button>
    </div>
  );
}
```

### 4. Clean Up on Unmount

```typescript
const { stop, reset } = useAIStream(config);

useEffect(() => {
  return () => {
    stop();  // Stop streaming if component unmounts
  };
}, []);
```

---

## See Also

- [Components](./components.md)
- [Streaming API](../core/streaming.md)
- [Next.js Integration](../nextjs/README.md)
