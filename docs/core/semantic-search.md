# Semantic Search

Semantic search for conversation history using OpenAI embeddings API.

## Overview

The SemanticSearch module provides vector-based semantic search capabilities for conversation messages. It uses OpenAI's embedding models to convert text into high-dimensional vectors and performs similarity searches using cosine similarity.

## Features

- Vector embedding generation using OpenAI API
- Semantic similarity search across conversation history
- Multiple embedding models support (text-embedding-3-small, text-embedding-3-large, text-embedding-ada-002)
- Batch embedding generation for performance
- Configurable similarity thresholds
- Advanced filtering (by role, date range, conversation ID)
- Ranking and scoring system
- Built-in caching for improved performance
- Comprehensive statistics tracking

## Installation

```bash
pnpm add @ainative/ai-kit-core
```

## Quick Start

```typescript
import { SemanticSearch } from '@ainative/ai-kit-core/search'
import { MemoryStore } from '@ainative/ai-kit-core/store'

// Initialize store and search
const store = new MemoryStore()
const search = new SemanticSearch(store, {
  apiKey: process.env.OPENAI_API_KEY!,
  model: 'text-embedding-3-small',
})

// Add some conversations
await store.save('conv-1', [
  {
    id: '1',
    role: 'user',
    content: 'What is machine learning?',
    timestamp: Date.now(),
  },
  {
    id: '2',
    role: 'assistant',
    content: 'Machine learning is a subset of AI that enables systems to learn from data.',
    timestamp: Date.now(),
  },
])

// Search messages
const results = await search.searchMessages('explain AI', {
  topK: 5,
  threshold: 0.7,
})

console.log(results)
```

## Configuration

### SemanticSearch Constructor

```typescript
const search = new SemanticSearch(store, {
  apiKey: string              // Required: OpenAI API key
  model?: EmbeddingModel      // Optional: Model to use (default: 'text-embedding-3-small')
  batchSize?: number          // Optional: Batch size for embeddings (default: 100)
  dimensions?: number         // Optional: Embedding dimensions (for text-embedding-3-* models)
  maxRetries?: number         // Optional: Max API retries (default: 3)
  timeout?: number            // Optional: Request timeout in ms (default: 30000)
})
```

### Supported Embedding Models

- `text-embedding-3-small` (default) - Fast and cost-effective, 1536 dimensions
- `text-embedding-3-large` - Higher accuracy, 3072 dimensions
- `text-embedding-ada-002` - Legacy model, 1536 dimensions

## API Reference

### searchMessages

Search messages by semantic similarity to a query.

```typescript
async searchMessages(
  query: string,
  options?: SearchOptions
): Promise<SearchResult[]>
```

**Parameters:**
- `query` - The search query text
- `options.topK` - Number of results to return (default: 10)
- `options.threshold` - Minimum similarity score 0-1 (default: 0.0)
- `options.filter` - Filter criteria (see Filtering section)
- `options.includeQuery` - Include query message in results (default: false)

**Returns:** Array of search results with messages and similarity scores

**Example:**

```typescript
const results = await search.searchMessages('deep learning tutorial', {
  topK: 5,
  threshold: 0.75,
  filter: {
    role: 'assistant',
    startDate: Date.now() - 86400000, // Last 24 hours
  },
})

results.forEach((result) => {
  console.log(`Score: ${result.similarity.score}`)
  console.log(`Message: ${result.message.content}`)
  console.log(`Rank: ${result.similarity.rank}`)
})
```

### findSimilarMessages

Find messages similar to a given message.

```typescript
async findSimilarMessages(
  messageId: string,
  options?: SimilarMessageOptions
): Promise<SearchResult[]>
```

**Parameters:**
- `messageId` - ID of the source message
- `options.topK` - Number of similar messages (default: 5)
- `options.threshold` - Minimum similarity score (default: 0.5)
- `options.includeSelf` - Include source message (default: false)
- `options.filter` - Filter criteria

**Example:**

```typescript
const similar = await search.findSimilarMessages('msg-123', {
  topK: 3,
  threshold: 0.8,
  filter: { role: 'user' },
})
```

### searchConversations

Search across multiple conversations.

```typescript
async searchConversations(
  query: string,
  options?: ConversationSearchOptions
): Promise<SearchResult[]>
```

**Parameters:**
- `query` - The search query
- `options.conversationIds` - Specific conversations to search
- `options.maxConversations` - Limit number of conversations
- `options.topK` - Number of results
- `options.threshold` - Minimum similarity score
- `options.filter` - Filter criteria

**Example:**

```typescript
const results = await search.searchConversations('neural networks', {
  conversationIds: ['conv-1', 'conv-2', 'conv-3'],
  topK: 10,
  threshold: 0.7,
})
```

### generateBatchEmbeddings

Generate embeddings for multiple texts efficiently.

```typescript
async generateBatchEmbeddings(
  request: BatchEmbeddingRequest
): Promise<BatchEmbeddingResponse>
```

**Parameters:**
- `request.texts` - Array of texts to embed
- `request.model` - Optional model override
- `request.dimensions` - Optional dimension override

**Example:**

```typescript
const result = await search.generateBatchEmbeddings({
  texts: ['Text 1', 'Text 2', 'Text 3'],
  model: 'text-embedding-3-large',
  dimensions: 256,
})

console.log(result.embeddings) // Array of vectors
console.log(result.usage) // Token usage info
```

## Filtering

### Filter by Role

```typescript
const results = await search.searchMessages('question', {
  filter: { role: 'user' },
})
```

### Filter by Conversation

```typescript
const results = await search.searchMessages('query', {
  filter: { conversationId: 'conv-123' },
})
```

### Filter by Date Range

```typescript
const results = await search.searchMessages('query', {
  filter: {
    startDate: Date.now() - 7 * 24 * 60 * 60 * 1000, // Last 7 days
    endDate: Date.now(),
  },
})
```

### Combined Filters

```typescript
const results = await search.searchMessages('AI concepts', {
  filter: {
    role: 'assistant',
    conversationId: 'conv-1',
    startDate: lastWeek,
    endDate: now,
  },
  topK: 10,
  threshold: 0.8,
})
```

## Similarity Scoring

Each search result includes a similarity score object:

```typescript
interface SimilarityScore {
  score: number      // Cosine similarity (0-1, higher is more similar)
  distance: number   // Distance metric (1 - similarity)
  rank: number       // Rank in results (1-based)
}
```

**Score Interpretation:**
- `0.9 - 1.0` - Highly similar (nearly identical meaning)
- `0.7 - 0.9` - Very similar (related concepts)
- `0.5 - 0.7` - Moderately similar (same topic)
- `0.3 - 0.5` - Somewhat similar (tangentially related)
- `0.0 - 0.3` - Not very similar (different topics)

## Caching

SemanticSearch includes built-in caching to reduce API calls and improve performance.

```typescript
// Check cache size
const size = search.getCacheSize()
console.log(`Cached embeddings: ${size}`)

// Clear cache
search.clearCache()

// Cache is automatically used for duplicate texts
await search.generateBatchEmbeddings({
  texts: ['Same text', 'Same text', 'Different text'],
})
// Only 2 API calls made (cache hit for second occurrence)
```

## Statistics

Track usage and performance with built-in statistics:

```typescript
const stats = search.getStats()

console.log(`Total messages indexed: ${stats.totalMessages}`)
console.log(`Total conversations: ${stats.totalConversations}`)
console.log(`Total embeddings generated: ${stats.totalEmbeddings}`)
console.log(`Cache hit rate: ${stats.cacheHitRate}`)
console.log(`Avg embedding time: ${stats.avgEmbeddingTime}ms`)
```

## Best Practices

### 1. Choose the Right Model

- Use `text-embedding-3-small` for most use cases (good balance of speed and accuracy)
- Use `text-embedding-3-large` when you need higher accuracy
- Consider using custom dimensions to reduce costs

```typescript
const search = new SemanticSearch(store, {
  apiKey: process.env.OPENAI_API_KEY!,
  model: 'text-embedding-3-small',
  dimensions: 512, // Reduce from 1536 to save costs
})
```

### 2. Set Appropriate Thresholds

- Start with a threshold around 0.7 for general searches
- Adjust based on your use case and result quality
- Lower thresholds (0.5-0.6) for broader searches
- Higher thresholds (0.8-0.9) for precise matches

### 3. Use Batch Operations

```typescript
// Good: Process multiple texts in one batch
const results = await search.generateBatchEmbeddings({
  texts: messages.map((m) => m.content),
})

// Avoid: Processing one at a time
for (const message of messages) {
  await search.generateBatchEmbeddings({ texts: [message.content] })
}
```

### 4. Implement Proper Error Handling

```typescript
try {
  const results = await search.searchMessages('query')
} catch (error) {
  if (error.message.includes('rate limit')) {
    // Handle rate limiting
    await delay(1000)
    // Retry with exponential backoff
  } else {
    console.error('Search failed:', error)
  }
}
```

### 5. Monitor Performance

```typescript
const startTime = Date.now()
const results = await search.searchMessages('query')
const duration = Date.now() - startTime

console.log(`Search took ${duration}ms`)
console.log(`Cache hit rate: ${search.getStats().cacheHitRate}`)
```

## Advanced Usage

### Custom Similarity Calculations

The SemanticSearch class uses cosine similarity internally. You can extend it for custom similarity metrics:

```typescript
import { SemanticSearch } from '@ainative/ai-kit-core/search'

class CustomSearch extends SemanticSearch {
  // Override or add custom methods
}
```

### Integration with Different Stores

```typescript
import { RedisStore } from '@ainative/ai-kit-core/store'

// Use Redis for production
const redisStore = new RedisStore({
  type: 'redis',
  url: process.env.REDIS_URL,
})

const search = new SemanticSearch(redisStore, {
  apiKey: process.env.OPENAI_API_KEY!,
})
```

### Combining with Other Features

```typescript
// Search and then process results
const results = await search.searchMessages('AI concepts', {
  topK: 10,
  threshold: 0.7,
})

// Group by conversation
const byConversation = results.reduce((acc, result) => {
  const convId = result.conversationId || 'unknown'
  acc[convId] = acc[convId] || []
  acc[convId].push(result)
  return acc
}, {} as Record<string, SearchResult[]>)

// Get top result per conversation
const topPerConversation = Object.values(byConversation).map(
  (results) => results[0]
)
```

## Performance Considerations

### API Rate Limits

OpenAI has rate limits on embeddings API:
- Free tier: 3 requests/minute
- Paid tier: Higher limits based on usage

Use batch operations and caching to minimize API calls.

### Memory Usage

Embeddings are cached in memory by default:
- text-embedding-3-small: ~6KB per message (1536 dims × 4 bytes)
- text-embedding-3-large: ~12KB per message (3072 dims × 4 bytes)

For large-scale applications, consider implementing persistent caching.

### Search Performance

- Linear search across all messages: O(n) where n = number of messages
- For large datasets (>10,000 messages), consider using a vector database
- Use filters to reduce the search space

## Error Handling

Common errors and how to handle them:

```typescript
try {
  const results = await search.searchMessages('query')
} catch (error) {
  if (error.message.includes('API key')) {
    // Invalid or missing API key
    console.error('Check your OpenAI API key')
  } else if (error.message.includes('rate limit')) {
    // Rate limit exceeded
    console.error('Rate limit hit, implement retry logic')
  } else if (error.message.includes('timeout')) {
    // Request timeout
    console.error('Request timed out, increase timeout setting')
  } else {
    console.error('Unexpected error:', error)
  }
}
```

## Examples

### Example 1: FAQ Search

```typescript
// Index FAQ conversations
const faqMessages = [
  {
    id: '1',
    role: 'user',
    content: 'How do I reset my password?',
    timestamp: Date.now(),
  },
  {
    id: '2',
    role: 'assistant',
    content: 'Click on "Forgot Password" and follow the instructions.',
    timestamp: Date.now(),
  },
]

await store.save('faq-1', faqMessages)

// Search for similar questions
const results = await search.searchMessages('password recovery', {
  topK: 3,
  threshold: 0.7,
})
```

### Example 2: Conversation Analysis

```typescript
// Find all messages discussing a specific topic
const aiMessages = await search.searchMessages('artificial intelligence', {
  topK: 20,
  threshold: 0.6,
})

// Analyze sentiment or extract insights
const insights = aiMessages.map((result) => ({
  content: result.message.content,
  relevance: result.similarity.score,
  timestamp: result.message.timestamp,
}))
```

### Example 3: Context Retrieval for RAG

```typescript
// Retrieve relevant context for a user query
const query = 'How does the payment system work?'

const context = await search.searchMessages(query, {
  topK: 5,
  threshold: 0.75,
  filter: { role: 'assistant' }, // Get only responses
})

// Use context for generating response
const contextText = context
  .map((r) => r.message.content)
  .join('\n\n')

// Feed to LLM with context
```

## TypeScript Support

Full TypeScript support with comprehensive type definitions:

```typescript
import type {
  SearchOptions,
  SearchResult,
  SimilarityScore,
  EmbeddingConfig,
  SearchFilter,
} from '@ainative/ai-kit-core/search'
```

## Troubleshooting

### Issue: Low similarity scores

**Solution:** Try lowering the threshold or using a larger embedding model.

### Issue: Slow search performance

**Solution:**
- Reduce the number of messages being searched
- Use filters to narrow the search space
- Implement batch operations
- Consider using a vector database for large datasets

### Issue: High API costs

**Solution:**
- Use smaller embedding dimensions
- Implement aggressive caching
- Use batch operations to reduce API calls
- Consider text-embedding-3-small instead of large

### Issue: Cache not working

**Solution:** Ensure you're searching for exact text matches. The cache uses text content as keys.

## License

MIT

## Contributing

Contributions are welcome! Please see the main repository for contribution guidelines.

## Support

For issues and questions:
- GitHub Issues: https://github.com/AINative-Studio/ai-kit/issues
- Documentation: https://ainative.studio/docs
