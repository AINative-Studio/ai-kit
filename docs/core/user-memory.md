# User Memory System

The User Memory System provides persistent storage and management of user-specific information across conversations. It enables AI agents to remember facts, preferences, context, entities, and goals about users, creating more personalized and contextually aware experiences.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Memory Types](#memory-types)
- [Core Components](#core-components)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)
- [API Reference](#api-reference)

## Overview

The User Memory System consists of several key components:

1. **MemoryStore** - Abstract base class for memory persistence backends
2. **Memory Store Implementations** - In-memory, Redis, and ZeroDB implementations
3. **FactExtractor** - LLM-powered fact extraction from conversations
4. **UserMemory** - High-level API for memory management
5. **Memory Types** - Structured types for different kinds of memories

### Key Features

- **Multiple Storage Backends**: In-memory, Redis, and ZeroDB support
- **Automatic Fact Extraction**: LLM-powered extraction from conversations
- **Contradiction Detection**: Identify and resolve conflicting memories
- **Memory Consolidation**: Merge similar memories automatically
- **TTL Support**: Automatic expiration of time-sensitive memories
- **Priority Scoring**: Importance and confidence scores for each memory
- **Entity Tracking**: Named entity recognition and tracking
- **Type Safety**: Full TypeScript support with comprehensive types

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        UserMemory                           │
│  High-level API for memory management                       │
│  - Add/update/delete memories                               │
│  - Extract from conversations                               │
│  - Contradiction detection                                  │
│  - Memory consolidation                                     │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ├──────────────┬──────────────┬──────────────┐
                 │              │              │              │
         ┌───────▼──────┐ ┌────▼─────┐ ┌─────▼──────┐       │
         │MemoryStore   │ │MemoryStore│ │MemoryStore │       │
         │(In-Memory)   │ │(Redis)    │ │(ZeroDB)    │       │
         └──────────────┘ └───────────┘ └────────────┘       │
                                                              │
                                                      ┌───────▼──────┐
                                                      │FactExtractor │
                                                      │(LLM-powered) │
                                                      └──────────────┘
```

## Memory Types

The system supports five types of memories:

### 1. Facts
Objective, verifiable information about the user.

**Examples:**
- "Lives in San Francisco"
- "Works as a software engineer"
- "Has 5 years of experience in TypeScript"

### 2. Preferences
User likes, dislikes, and opinions.

**Examples:**
- "Prefers TypeScript over JavaScript"
- "Dislikes lengthy meetings"
- "Enjoys working remotely"

### 3. Context
Background information and situational context.

**Examples:**
- "Currently working on a React project"
- "Learning about AI agents"
- "Team lead for a distributed team"

### 4. Entities
Named entities mentioned in conversations (people, places, organizations, etc.).

**Examples:**
- "Google" (organization)
- "New York" (place)
- "John Smith" (person)

### 5. Goals
User objectives and intentions.

**Examples:**
- "Learn Rust programming language"
- "Build a production-ready AI agent"
- "Improve system architecture skills"

## Core Components

### UserMemory

The main interface for memory management.

```typescript
import { UserMemory, InMemoryMemoryStore } from '@aikit/core/memory'

const userMemory = new UserMemory({
  store: new InMemoryMemoryStore(),
  llmProvider: myLLMProvider,
  autoExtract: true,
  detectContradictions: true,
})
```

### MemoryStore

Abstract base class for memory storage backends. Three implementations are provided:

#### InMemoryMemoryStore
Fast, in-memory storage. Suitable for development and testing.

```typescript
import { InMemoryMemoryStore } from '@aikit/core/memory'

const store = new InMemoryMemoryStore({
  maxMemories: 10000,
  defaultTTL: 0, // No expiration
})
```

#### RedisMemoryStore
Persistent Redis-backed storage. Suitable for production with horizontal scaling.

```typescript
import { RedisMemoryStore } from '@aikit/core/memory'

const store = new RedisMemoryStore({
  url: 'redis://localhost:6379',
  // or
  host: 'localhost',
  port: 6379,
  password: 'secret',
  db: 0,
})
```

#### ZeroDBMemoryStore
Cloud-based ZeroDB storage. Suitable for serverless and distributed applications.

```typescript
import { ZeroDBMemoryStore } from '@aikit/core/memory'

const store = new ZeroDBMemoryStore({
  projectId: 'your-project-id',
  apiKey: 'your-api-key',
  tableName: 'user_memories',
})
```

### FactExtractor

LLM-powered fact extraction from conversations.

```typescript
import { FactExtractor } from '@aikit/core/memory'

const extractor = new FactExtractor({
  llmProvider: myLLMProvider,
  minConfidence: 0.6,
  extractEntities: true,
  extractPreferences: true,
  extractGoals: true,
})

const result = await extractor.extract(messages)
```

## Usage Examples

### Basic Memory Management

```typescript
import { UserMemory, InMemoryMemoryStore } from '@aikit/core/memory'

// Create memory system
const store = new InMemoryMemoryStore()
const userMemory = new UserMemory({ store })

// Add a fact
const fact = await userMemory.addMemory(
  'user-123',
  'Lives in San Francisco',
  'fact',
  {
    importance: 0.8,
    confidence: 0.9,
  }
)

// Add a preference
const pref = await userMemory.addMemory(
  'user-123',
  'Prefers dark mode',
  'preference',
  {
    importance: 0.6,
    confidence: 0.95,
  }
)

// Get all memories for a user
const memories = await userMemory.getUserMemories('user-123')
console.log(`User has ${memories.length} memories`)

// Search memories by type
const facts = await userMemory.getMemoriesByType('user-123', 'fact')

// Update a memory
await userMemory.updateMemory(fact.id, {
  content: 'Lives in San Francisco, California',
  importance: 0.85,
})

// Delete a memory
await userMemory.deleteMemory(fact.id)
```

### Automatic Fact Extraction

```typescript
import { UserMemory, InMemoryMemoryStore } from '@aikit/core/memory'
import { OpenAIProvider } from '@aikit/core/agents/llm'

// Create LLM provider
const llmProvider = new OpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4',
})

// Create memory system with LLM
const store = new InMemoryMemoryStore()
const userMemory = new UserMemory({
  store,
  llmProvider,
  autoExtract: true,
  minConfidence: 0.7,
})

// Extract memories from conversation
const messages = [
  {
    role: 'user',
    content: "I'm a software engineer at Google. I love TypeScript and I'm learning Rust.",
  },
  {
    role: 'assistant',
    content: "That's great! TypeScript is excellent for large-scale applications.",
  },
  {
    role: 'user',
    content: 'Yes, I use it for our React projects at work.',
  },
]

const extractedMemories = await userMemory.extractFromConversation(
  'user-123',
  messages,
  'conv-456' // source identifier
)

console.log(`Extracted ${extractedMemories.length} memories`)
// Possible memories:
// - Fact: "Works as a software engineer at Google"
// - Preference: "Loves TypeScript"
// - Goal: "Learning Rust"
// - Context: "Uses TypeScript for React projects"
// - Entity: "Google" (organization)
```

### Advanced Search

```typescript
// Search with multiple criteria
const memories = await userMemory.searchMemories('user-123', {
  type: 'fact',
  minImportance: 0.7,
  minConfidence: 0.8,
  maxAge: 86400 * 7, // Last 7 days in seconds
  limit: 10,
})

// Search by entity
const googleMemories = await userMemory.getMemoriesByEntity('user-123', 'Google')

// Search preferences
const preferences = await userMemory.getMemoriesByType('user-123', 'preference')
```

### Contradiction Detection

```typescript
const userMemory = new UserMemory({
  store,
  llmProvider,
  detectContradictions: true,
})

// Add initial fact
await userMemory.addMemory('user-123', 'Lives in New York', 'fact')

// Check for contradiction
const contradiction = await userMemory.checkContradiction(
  'user-123',
  'Lives in Los Angeles'
)

if (contradiction.hasContradiction) {
  console.log('Contradiction detected!')
  console.log('Explanation:', contradiction.explanation)
  console.log('Resolution:', contradiction.resolution)
  // Possible resolutions: 'keep_existing', 'replace', 'merge', 'keep_both'
}

// When extracting from conversation, contradictions are automatically handled
const messages = [
  {
    role: 'user',
    content: 'Actually, I moved to Los Angeles last month',
  },
]

await userMemory.extractFromConversation('user-123', messages)
// The system will detect the contradiction and resolve it based on the strategy
```

### Memory Consolidation

```typescript
const userMemory = new UserMemory({
  store,
  llmProvider,
  autoConsolidate: true,
})

// Add similar memories
await userMemory.addMemory('user-123', 'Likes coffee', 'preference')
await userMemory.addMemory('user-123', 'Enjoys espresso', 'preference')

// Manually trigger consolidation
const results = await userMemory.consolidateMemories('user-123')

for (const result of results) {
  if (result.consolidated) {
    console.log('Consolidated:', result.explanation)
    console.log('New memory:', result.consolidatedMemory?.content)
    console.log('Original memories:', result.originalMemories.length)
  }
}
```

### TTL and Cleanup

```typescript
// Add memory with TTL
await userMemory.addMemory(
  'user-123',
  'Currently working on Project X',
  'context',
  {
    ttl: 86400 * 7, // 7 days in seconds
    importance: 0.5,
  }
)

// Cleanup expired memories
const removed = await userMemory.cleanup()
console.log(`Removed ${removed} expired memories`)
```

### Entity Tracking

```typescript
// Add entity memory
await userMemory.addMemory(
  'user-123',
  'Works at Google headquarters',
  'entity',
  {
    entityName: 'Google',
    entityType: 'organization',
    importance: 0.8,
  }
)

// Get all memories related to an entity
const googleMemories = await userMemory.getMemoriesByEntity('user-123', 'Google')

console.log(`Found ${googleMemories.length} memories about Google`)
```

### Statistics and Monitoring

```typescript
// Get memory statistics
const stats = await userMemory.getStats()

console.log('Total memories:', stats.totalMemories)
console.log('Unique users:', stats.uniqueUsers)
console.log('Memories by type:', stats.memoriesByType)
console.log('Expired memories:', stats.expiredMemories)
```

## Best Practices

### 1. Choose the Right Storage Backend

- **In-Memory**: Development, testing, single-process applications
- **Redis**: Production, distributed systems, high-throughput requirements
- **ZeroDB**: Serverless, cloud-native, global distribution

### 2. Set Appropriate Importance Scores

```typescript
// Critical, identifying information
importance: 0.9 - 1.0  // Name, location, profession

// Important but changeable
importance: 0.7 - 0.9  // Current projects, recent preferences

// Contextual information
importance: 0.5 - 0.7  // Temporary context, recent activities

// Low priority
importance: 0.1 - 0.5  // Casual mentions, minor details
```

### 3. Use Confidence Scores Appropriately

```typescript
// Explicitly stated facts
confidence: 0.9 - 1.0

// Strongly implied information
confidence: 0.7 - 0.9

// Inferred or uncertain
confidence: 0.5 - 0.7

// Speculative
confidence: 0.1 - 0.5
```

### 4. Implement Regular Cleanup

```typescript
// Schedule periodic cleanup
setInterval(async () => {
  const removed = await userMemory.cleanup()
  console.log(`Cleaned up ${removed} expired memories`)
}, 3600000) // Every hour
```

### 5. Use Source Tracking

```typescript
// Always track the source of memories
await userMemory.addMemory('user-123', 'Fact', 'fact', {
  source: `conv-${conversationId}`,
  metadata: {
    timestamp: Date.now(),
    channel: 'web',
  },
})
```

### 6. Enable Contradiction Detection

```typescript
// Enable for important facts
const userMemory = new UserMemory({
  store,
  llmProvider,
  detectContradictions: true,
})
```

### 7. Batch Operations for Performance

```typescript
// Extract from full conversation instead of message-by-message
const memories = await userMemory.extractFromConversation(
  userId,
  allMessages,
  conversationId
)
```

### 8. Handle Privacy and Data Retention

```typescript
// Set appropriate TTLs for sensitive information
await userMemory.addMemory(userId, 'Temporary context', 'context', {
  ttl: 86400, // 1 day
})

// Implement user data deletion
async function deleteUserData(userId: string) {
  await userMemory.deleteUserMemories(userId)
}
```

### 9. Monitor Memory Growth

```typescript
// Regularly check statistics
const stats = await userMemory.getStats()

if (stats.totalMemories > threshold) {
  console.warn('Memory threshold exceeded')
  // Implement consolidation or cleanup
}
```

### 10. Type-Safe Memory Access

```typescript
// Use TypeScript for type safety
import { MemoryType, MemoryItem } from '@aikit/core/memory'

async function getFactsAboutUser(userId: string): Promise<MemoryItem[]> {
  return userMemory.getMemoriesByType(userId, 'fact')
}
```

## API Reference

### UserMemory

#### Constructor

```typescript
new UserMemory(config: UserMemoryConfig)
```

#### Methods

- `addMemory(userId, content, type, options?)` - Add a memory
- `extractFromConversation(userId, messages, source?)` - Extract memories from conversation
- `getMemory(memoryId)` - Get memory by ID
- `searchMemories(userId, options?)` - Search memories
- `getUserMemories(userId)` - Get all memories for user
- `getMemoriesByType(userId, type)` - Get memories by type
- `getMemoriesByEntity(userId, entityName)` - Get memories by entity
- `updateMemory(memoryId, updates)` - Update a memory
- `deleteMemory(memoryId)` - Delete a memory
- `deleteUserMemories(userId)` - Delete all memories for user
- `checkContradiction(userId, newContent)` - Check for contradictions
- `consolidateMemories(userId)` - Consolidate similar memories
- `cleanup()` - Remove expired memories
- `getStats()` - Get statistics
- `close()` - Close and cleanup

### MemoryStore

Base class for storage implementations.

#### Methods

- `save(memory, options?)` - Save a memory
- `get(memoryId)` - Get memory by ID
- `update(memoryId, updates)` - Update memory
- `delete(memoryId)` - Delete memory
- `search(userId, options?)` - Search memories
- `getByUser(userId, includeExpired?)` - Get user memories
- `getByType(userId, type, includeExpired?)` - Get by type
- `getByEntity(userId, entityName, includeExpired?)` - Get by entity
- `deleteByUser(userId)` - Delete user memories
- `clear()` - Clear all memories
- `getStats()` - Get statistics
- `cleanup()` - Remove expired
- `close()` - Close store

### FactExtractor

#### Constructor

```typescript
new FactExtractor(config: FactExtractorConfig)
```

#### Methods

- `extract(messages)` - Extract from messages
- `extractFromMessage(message)` - Extract from single message
- `deduplicateFacts(facts)` - Deduplicate facts

## Contributing

When contributing to the User Memory System:

1. Ensure all tests pass
2. Maintain test coverage above 80%
3. Follow TypeScript best practices
4. Update documentation for new features
5. Add examples for new functionality

## License

MIT
