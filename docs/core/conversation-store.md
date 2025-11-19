# Conversation Store

The Conversation Store provides a unified interface for persisting AI conversations across different storage backends. It supports Memory, Redis, and ZeroDB with configurable TTL, metadata, and comprehensive CRUD operations.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Backend Comparison](#backend-comparison)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [Backend Guides](#backend-guides)
- [Best Practices](#best-practices)
- [Migration Guide](#migration-guide)

## Overview

The Conversation Store is designed to solve the challenge of persisting AI conversation history across sessions. It provides:

- **Multiple Backends**: Memory, Redis, and ZeroDB support
- **Type Safety**: Full TypeScript support with comprehensive type definitions
- **TTL Support**: Automatic expiration of conversations
- **Metadata**: Custom metadata for conversations
- **CRUD Operations**: Complete Create, Read, Update, Delete operations
- **LRU Eviction**: Automatic memory management for in-memory storage

## Architecture

### Core Components

```
ConversationStore (Abstract Base Class)
├── MemoryStore (In-memory implementation)
├── RedisStore (Redis implementation)
└── ZeroDBStore (ZeroDB implementation)
```

### Key Concepts

**Conversation**: A collection of messages with metadata
- `conversationId`: Unique identifier
- `messages`: Array of Message objects
- `metadata`: ConversationMetadata object

**Message**: A single message in a conversation
- `id`: Unique message identifier
- `role`: 'user' | 'assistant' | 'system'
- `content`: Message content
- `timestamp`: Message timestamp

**ConversationMetadata**: Metadata about a conversation
- `conversationId`: Conversation identifier
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp
- `messageCount`: Number of messages
- `ttl`: Time-to-live in seconds (optional)
- `metadata`: Custom metadata object (optional)

## Backend Comparison

| Feature | Memory | Redis | ZeroDB |
|---------|--------|-------|--------|
| **Persistence** | No (in-memory only) | Yes | Yes |
| **Scalability** | Single process | Multi-process/server | Cloud-scale |
| **Performance** | Fastest | Fast | Fast |
| **TTL Support** | Manual cleanup | Automatic | Automatic |
| **Setup Complexity** | None | Moderate (Redis server) | Low (managed service) |
| **Best For** | Development, testing | Production, single region | Production, multi-region |
| **Cost** | Free | Infrastructure cost | Usage-based pricing |

### When to Use Each Backend

**MemoryStore**
- Development and testing
- Single-process applications
- Short-lived conversations
- No persistence requirements

**RedisStore**
- Production environments
- Multi-process applications
- Need for fast access
- Existing Redis infrastructure

**ZeroDBStore**
- Production environments
- Multi-region deployments
- Need for analytics
- Serverless architectures

## Installation

The Conversation Store is included in `@ainative/ai-kit-core`. For Redis support, install `ioredis`:

```bash
# Core package (includes Memory and ZeroDB stores)
pnpm add @ainative/ai-kit-core

# For Redis support
pnpm add ioredis
```

## Quick Start

### Memory Store

```typescript
import { createStore } from '@ainative/ai-kit-core/store'

// Create a memory store
const store = createStore({
  type: 'memory',
  maxConversations: 1000,
  defaultTTL: 3600 // 1 hour
})

// Save a conversation
await store.save('conversation-1', [
  { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
  { id: '2', role: 'assistant', content: 'Hi!', timestamp: Date.now() }
])

// Load a conversation
const conversation = await store.load('conversation-1')
console.log(conversation?.messages)

// Append messages
await store.append('conversation-1', [
  { id: '3', role: 'user', content: 'How are you?', timestamp: Date.now() }
])

// Delete a conversation
await store.delete('conversation-1')
```

### Redis Store

```typescript
import { createStore } from '@ainative/ai-kit-core/store'

// Create a Redis store
const store = createStore({
  type: 'redis',
  host: 'localhost',
  port: 6379,
  password: 'your-password', // optional
  db: 0, // optional
  keyPrefix: 'myapp:chat',
  defaultTTL: 7200 // 2 hours
})

// Use the same API as Memory store
await store.save('conversation-1', messages)
const conversation = await store.load('conversation-1')

// Redis-specific: Get TTL
const ttl = await store.getTTL('conversation-1')

// Redis-specific: Set TTL
await store.setTTL('conversation-1', 3600)

// Clean up
await store.close()
```

### ZeroDB Store

```typescript
import { createStore } from '@ainative/ai-kit-core/store'

// Create a ZeroDB store
const store = createStore({
  type: 'zerodb',
  projectId: 'your-project-id',
  apiKey: 'your-api-key',
  tableName: 'conversations', // optional
  defaultTTL: 86400 // 24 hours
})

// Use the same API as other stores
await store.save('conversation-1', messages)
const conversation = await store.load('conversation-1')

// ZeroDB-specific: Cleanup expired
const removed = await store.cleanup()
```

## API Reference

### ConversationStore

Abstract base class that all stores implement.

#### Methods

**save(conversationId, messages, options?)**

Save a complete conversation.

```typescript
const conversation = await store.save(
  'conversation-1',
  messages,
  {
    ttl: 3600, // Optional: TTL in seconds
    metadata: { userId: 'user-123', source: 'web' } // Optional: Custom metadata
  }
)
```

**load(conversationId, options?)**

Load a conversation by ID.

```typescript
const conversation = await store.load('conversation-1', {
  includeExpired: false // Optional: Include expired conversations
})
```

**append(conversationId, messages, options?)**

Append messages to an existing conversation.

```typescript
const conversation = await store.append(
  'conversation-1',
  newMessages,
  {
    updateTimestamp: true // Optional: Update updatedAt timestamp
  }
)
```

**delete(conversationId)**

Delete a conversation.

```typescript
const deleted = await store.delete('conversation-1') // Returns true if deleted
```

**clear()**

Clear all conversations.

```typescript
const count = await store.clear() // Returns number of conversations cleared
```

**list()**

List all conversation IDs.

```typescript
const ids = await store.list() // Returns string[]
```

**exists(conversationId)**

Check if a conversation exists.

```typescript
const exists = await store.exists('conversation-1') // Returns boolean
```

**getStats()**

Get store statistics.

```typescript
const stats = await store.getStats()
// Returns { totalConversations, totalMessages, expiredConversations?, storageSize? }
```

**close()**

Close the store and cleanup resources.

```typescript
await store.close()
```

### MemoryStore-specific

**size()**

Get current number of conversations in memory.

```typescript
const count = store.size()
```

**cleanup()**

Remove expired conversations.

```typescript
const removed = await store.cleanup()
```

### RedisStore-specific

**getTTL(conversationId)**

Get remaining TTL for a conversation.

```typescript
const ttl = await store.getTTL('conversation-1')
// Returns TTL in seconds, -1 if no TTL, -2 if key doesn't exist
```

**setTTL(conversationId, ttl)**

Set a new TTL for a conversation.

```typescript
const success = await store.setTTL('conversation-1', 3600)
```

### ZeroDBStore-specific

**cleanup()**

Remove expired conversations from ZeroDB.

```typescript
const removed = await store.cleanup()
```

## Backend Guides

### Memory Store Configuration

```typescript
const store = createStore({
  type: 'memory',
  maxConversations: 1000, // LRU eviction when exceeded
  defaultTTL: 3600, // Default TTL in seconds (0 = no expiration)
  namespace: 'aikit' // Namespace for key generation
})
```

**LRU Eviction**: When `maxConversations` is reached, the least recently used conversation is automatically evicted. Conversations are marked as "used" when saved, loaded, or accessed.

**Manual Cleanup**: Call `store.cleanup()` periodically to remove expired conversations:

```typescript
// Run cleanup every hour
setInterval(async () => {
  const removed = await store.cleanup()
  console.log(`Removed ${removed} expired conversations`)
}, 3600000)
```

### Redis Store Configuration

```typescript
// Option 1: Connection URL
const store = createStore({
  type: 'redis',
  url: 'redis://username:password@host:port/db'
})

// Option 2: Individual parameters
const store = createStore({
  type: 'redis',
  host: 'localhost',
  port: 6379,
  password: 'secret',
  db: 0,
  keyPrefix: 'aikit:conversation',
  defaultTTL: 7200
})
```

**Key Structure**: Redis keys are structured as `{keyPrefix}:{conversationId}`
- Default: `aikit:conversation:conversation-1`
- Custom: `myapp:chat:conversation-1`

**TTL Handling**: Redis automatically handles TTL expiration. No manual cleanup needed.

**Connection Management**:

```typescript
// Always close the connection when done
try {
  await store.save('conv-1', messages)
} finally {
  await store.close() // Closes Redis connection
}
```

### ZeroDB Store Configuration

```typescript
const store = createStore({
  type: 'zerodb',
  projectId: 'your-project-id', // Required
  apiKey: 'your-api-key', // Required
  tableName: 'conversations', // Optional, default: 'conversations'
  defaultTTL: 86400, // Optional, default: 0 (no expiration)
  namespace: 'aikit' // Optional, default: 'aikit'
})
```

**Table Structure**: Conversations are stored in a NoSQL table with the following schema:

```typescript
{
  conversationId: string  // Primary key
  data: string           // JSON stringified conversation
  createdAt: number      // Timestamp
  updatedAt: number      // Timestamp
  expiresAt?: number     // Expiration timestamp (if TTL set)
}
```

**Integration with ZeroDB MCP**: The ZeroDBStore is designed to work with ZeroDB's MCP commands:
- `/zerodb-table-insert` - Insert new conversations
- `/zerodb-table-query` - Query conversations
- `/zerodb-table-update` - Update conversations
- `/zerodb-table-delete` - Delete conversations

## Best Practices

### 1. Choose the Right Backend

```typescript
// Development
const devStore = createStore({ type: 'memory' })

// Production - Single Server
const prodStore = createStore({
  type: 'redis',
  host: process.env.REDIS_HOST,
  password: process.env.REDIS_PASSWORD
})

// Production - Serverless/Multi-Region
const cloudStore = createStore({
  type: 'zerodb',
  projectId: process.env.ZERODB_PROJECT_ID,
  apiKey: process.env.ZERODB_API_KEY
})
```

### 2. Set Appropriate TTLs

```typescript
// Short-lived sessions (1 hour)
const store = createStore({
  type: 'memory',
  defaultTTL: 3600
})

// Long-lived conversations (7 days)
const store = createStore({
  type: 'redis',
  host: 'localhost',
  defaultTTL: 604800
})

// Per-conversation TTL
await store.save('conv-1', messages, { ttl: 86400 }) // 24 hours
```

### 3. Use Metadata for Context

```typescript
await store.save('conversation-1', messages, {
  metadata: {
    userId: 'user-123',
    sessionId: 'session-456',
    source: 'web',
    language: 'en',
    tags: ['support', 'billing']
  }
})
```

### 4. Handle Errors Gracefully

```typescript
try {
  const conversation = await store.load('conversation-1')
  if (!conversation) {
    // Handle missing conversation
    console.log('Conversation not found or expired')
  }
} catch (error) {
  console.error('Failed to load conversation:', error)
  // Fallback logic
}
```

### 5. Clean Up Resources

```typescript
// Use try-finally for cleanup
try {
  await store.save('conv-1', messages)
} finally {
  await store.close() // Important for Redis/ZeroDB
}

// Or use a context manager pattern
async function withStore<T>(
  config: StoreConfig,
  fn: (store: ConversationStore) => Promise<T>
): Promise<T> {
  const store = createStore(config)
  try {
    return await fn(store)
  } finally {
    await store.close()
  }
}

// Usage
await withStore({ type: 'redis', host: 'localhost' }, async (store) => {
  await store.save('conv-1', messages)
  return await store.load('conv-1')
})
```

### 6. Implement Pagination for Large Conversations

```typescript
// For very long conversations, consider splitting into pages
const MAX_MESSAGES_PER_SAVE = 100

async function saveWithPagination(
  store: ConversationStore,
  conversationId: string,
  messages: Message[]
) {
  // Save in chunks
  for (let i = 0; i < messages.length; i += MAX_MESSAGES_PER_SAVE) {
    const chunk = messages.slice(i, i + MAX_MESSAGES_PER_SAVE)
    if (i === 0) {
      await store.save(conversationId, chunk)
    } else {
      await store.append(conversationId, chunk)
    }
  }
}
```

### 7. Use Type Guards for Backend-Specific Features

```typescript
import { createStore, isRedisStore, isMemoryStore } from '@ainative/ai-kit-core/store'

const store = createStore(config)

if (isRedisStore(store)) {
  // Use Redis-specific methods
  const ttl = await store.getTTL('conversation-1')
  console.log(`TTL: ${ttl} seconds`)
}

if (isMemoryStore(store)) {
  // Use Memory-specific methods
  console.log(`Conversations in memory: ${store.size()}`)
}
```

## Migration Guide

### Migrating from Memory to Redis

```typescript
// Before (Memory)
const oldStore = createStore({ type: 'memory' })

// After (Redis)
const newStore = createStore({
  type: 'redis',
  host: 'localhost',
  port: 6379,
  defaultTTL: 3600 // Set same TTL
})

// Migration script
async function migrateToRedis() {
  const ids = await oldStore.list()

  for (const id of ids) {
    const conversation = await oldStore.load(id, { includeExpired: true })
    if (conversation) {
      await newStore.save(
        conversation.conversationId,
        conversation.messages,
        {
          ttl: conversation.metadata.ttl,
          metadata: conversation.metadata.metadata
        }
      )
    }
  }

  console.log(`Migrated ${ids.length} conversations to Redis`)
}

await migrateToRedis()
```

### Migrating from Redis to ZeroDB

```typescript
// Source (Redis)
const redisStore = createStore({
  type: 'redis',
  host: 'localhost'
})

// Destination (ZeroDB)
const zerodbStore = createStore({
  type: 'zerodb',
  projectId: 'your-project',
  apiKey: 'your-api-key'
})

// Migration script
async function migrateToZeroDB() {
  const ids = await redisStore.list()
  let migrated = 0

  for (const id of ids) {
    try {
      const conversation = await redisStore.load(id)
      if (conversation) {
        await zerodbStore.save(
          conversation.conversationId,
          conversation.messages,
          {
            ttl: conversation.metadata.ttl,
            metadata: conversation.metadata.metadata
          }
        )
        migrated++
      }
    } catch (error) {
      console.error(`Failed to migrate ${id}:`, error)
    }
  }

  console.log(`Migrated ${migrated}/${ids.length} conversations to ZeroDB`)
}

await migrateToZeroDB()
await redisStore.close()
await zerodbStore.close()
```

### Environment-Based Configuration

```typescript
// config.ts
import { StoreConfig } from '@ainative/ai-kit-core/store'

export function getStoreConfig(): StoreConfig {
  const env = process.env.NODE_ENV

  switch (env) {
    case 'development':
      return {
        type: 'memory',
        maxConversations: 100
      }

    case 'test':
      return {
        type: 'memory',
        maxConversations: 50,
        defaultTTL: 60 // 1 minute for tests
      }

    case 'production':
      if (process.env.REDIS_URL) {
        return {
          type: 'redis',
          url: process.env.REDIS_URL,
          defaultTTL: 86400 // 24 hours
        }
      } else {
        return {
          type: 'zerodb',
          projectId: process.env.ZERODB_PROJECT_ID!,
          apiKey: process.env.ZERODB_API_KEY!,
          defaultTTL: 86400
        }
      }

    default:
      throw new Error(`Unknown environment: ${env}`)
  }
}

// Usage
import { createStore } from '@ainative/ai-kit-core/store'
import { getStoreConfig } from './config'

const store = createStore(getStoreConfig())
```

## Performance Considerations

### Memory Store
- **Fastest**: No network latency
- **Limited**: Constrained by available memory
- **No persistence**: Data lost on restart

### Redis Store
- **Fast**: Low network latency (< 1ms in same datacenter)
- **Scalable**: Supports clustering and replication
- **Persistent**: Survives restarts with persistence enabled

### ZeroDB Store
- **Good**: HTTP API overhead (typically 10-50ms)
- **Highly scalable**: Cloud-native architecture
- **Persistent**: Fully managed with automatic backups

## Troubleshooting

### Memory Store Issues

**Problem**: Out of memory errors
**Solution**: Reduce `maxConversations` or implement more aggressive TTLs

**Problem**: Conversations disappear
**Solution**: Check if LRU eviction is occurring; increase `maxConversations`

### Redis Store Issues

**Problem**: Connection timeout
**Solution**: Check Redis server is running and accessible

```bash
# Test Redis connection
redis-cli -h localhost -p 6379 ping
```

**Problem**: Memory full
**Solution**: Check Redis memory usage and configure maxmemory policy

```bash
# Check memory usage
redis-cli info memory
```

### ZeroDB Store Issues

**Problem**: API rate limiting
**Solution**: Implement retry logic with exponential backoff

**Problem**: Large conversations
**Solution**: Split conversations into multiple records or implement pagination

## Examples

### Complete Example: Chat Application

```typescript
import { createStore, ConversationStore } from '@ainative/ai-kit-core/store'
import { Message } from '@ainative/ai-kit-core'

class ChatService {
  private store: ConversationStore

  constructor(store: ConversationStore) {
    this.store = store
  }

  async createConversation(userId: string): Promise<string> {
    const conversationId = `${userId}-${Date.now()}`
    await this.store.save(conversationId, [], {
      metadata: { userId, createdAt: Date.now() }
    })
    return conversationId
  }

  async addMessage(
    conversationId: string,
    role: 'user' | 'assistant',
    content: string
  ): Promise<void> {
    const message: Message = {
      id: `${Date.now()}-${Math.random()}`,
      role,
      content,
      timestamp: Date.now()
    }

    await this.store.append(conversationId, [message])
  }

  async getHistory(conversationId: string): Promise<Message[]> {
    const conversation = await this.store.load(conversationId)
    return conversation?.messages || []
  }

  async deleteConversation(conversationId: string): Promise<boolean> {
    return await this.store.delete(conversationId)
  }

  async cleanup(): Promise<void> {
    await this.store.close()
  }
}

// Usage
const store = createStore({
  type: 'redis',
  host: 'localhost',
  defaultTTL: 86400
})

const chat = new ChatService(store)

// Create a conversation
const convId = await chat.createConversation('user-123')

// Add messages
await chat.addMessage(convId, 'user', 'Hello!')
await chat.addMessage(convId, 'assistant', 'Hi there!')

// Get history
const history = await chat.getHistory(convId)
console.log(history)

// Cleanup
await chat.cleanup()
```

## License

MIT
