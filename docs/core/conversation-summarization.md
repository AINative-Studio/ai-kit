# Conversation Summarization

Automatic summarization of long conversations using various strategies and compression levels.

## Overview

The Conversation Summarization module provides intelligent summarization of chat conversations using multiple strategies:

- **Single-Pass**: Summarize entire conversation in one LLM call
- **Rolling**: Summarize in chunks, then combine summaries
- **Hierarchical**: Create multi-level summaries (tree structure)
- **Extractive**: Extract key sentences without LLM (fast, no API cost)
- **Hybrid**: Combine extractive and abstractive approaches

## Quick Start

```typescript
import { ConversationSummarizer, CompressionLevel } from '@ainative/ai-kit-core/summarization';

// Create summarizer
const summarizer = new ConversationSummarizer({
  strategy: 'single-pass',
  compressionLevel: CompressionLevel.MODERATE,
  provider: 'openai',
  providerConfig: {
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4',
  },
});

// Summarize conversation
const result = await summarizer.summarize('conversation-id', messages);

console.log(result.summary.content);
console.log('Key points:', result.summary.keyPoints);
```

## Strategies Comparison

### Single-Pass Strategy

**Best for**: Short to medium conversations (< 50 messages)

**Pros**:
- Simple and fast
- Single LLM call
- Coherent output

**Cons**:
- Token limit constraints
- May miss details in very long conversations

```typescript
const summarizer = new ConversationSummarizer({
  strategy: 'single-pass',
  compressionLevel: CompressionLevel.MODERATE,
  provider: 'openai',
  providerConfig: {
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4',
  },
});
```

### Rolling Strategy

**Best for**: Long conversations (50+ messages)

**Pros**:
- Handles unlimited conversation length
- Manageable token usage
- Good for incremental updates

**Cons**:
- Multiple LLM calls (higher cost)
- May lose some context between chunks

```typescript
const summarizer = new ConversationSummarizer({
  strategy: 'rolling',
  compressionLevel: CompressionLevel.MODERATE,
  provider: 'openai',
  providerConfig: {
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4',
  },
  chunkSize: 10, // Summarize every 10 messages
});
```

### Hierarchical Strategy

**Best for**: Very long conversations with distinct sections

**Pros**:
- Multi-level summaries (detailed + overview)
- Easy to drill down into specific sections
- Scalable to very large conversations

**Cons**:
- Multiple LLM calls
- More complex output structure

```typescript
const summarizer = new ConversationSummarizer({
  strategy: 'hierarchical',
  compressionLevel: CompressionLevel.MODERATE,
  provider: 'openai',
  providerConfig: {
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4',
  },
  chunkSize: 15,
});

const result = await summarizer.summarize('conv-id', messages);

// Access root summary
console.log('Overview:', result.summary.content);

// Access section summaries
result.additionalSummaries?.forEach((section, i) => {
  console.log(`Section ${i}:`, section.content);
  console.log(`Messages ${section.messageRange?.start}-${section.messageRange?.end}`);
});
```

### Extractive Strategy

**Best for**: Cost-sensitive applications, quick summaries

**Pros**:
- No LLM calls (free!)
- Very fast
- Deterministic output
- No API dependencies

**Cons**:
- Less coherent than LLM summaries
- May miss implicit connections
- Limited understanding of context

```typescript
const summarizer = new ConversationSummarizer({
  strategy: 'extractive',
  compressionLevel: CompressionLevel.MODERATE,
  provider: 'openai', // Still required for config, but not used
  providerConfig: {
    apiKey: 'not-needed',
    model: 'not-needed',
  },
});
```

### Hybrid Strategy

**Best for**: Balance between cost and quality

**Pros**:
- Lower token usage than single-pass
- More coherent than pure extractive
- Good quality/cost tradeoff

**Cons**:
- Still requires LLM calls
- More complex than single-pass

```typescript
const summarizer = new ConversationSummarizer({
  strategy: 'hybrid',
  compressionLevel: CompressionLevel.MODERATE,
  provider: 'openai',
  providerConfig: {
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4',
  },
});
```

## Compression Levels

### Brief
Very concise 2-3 sentence summary, only critical points.

```typescript
compressionLevel: CompressionLevel.BRIEF
```

### Moderate
Balanced paragraph summary covering main topics and decisions.

```typescript
compressionLevel: CompressionLevel.MODERATE
```

### Detailed
Comprehensive summary including all important topics and context.

```typescript
compressionLevel: CompressionLevel.DETAILED
```

## Advanced Features

### Caching

Summaries are cached by default to avoid regenerating identical summaries:

```typescript
const summarizer = new ConversationSummarizer({
  strategy: 'single-pass',
  compressionLevel: CompressionLevel.MODERATE,
  provider: 'openai',
  providerConfig: {
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4',
  },
  enableCache: true, // Default
  cacheTTL: 3600, // 1 hour (in seconds)
});

// First call - generates summary
const result1 = await summarizer.summarize('conv-id', messages);
console.log('Cached:', result1.cached); // false

// Second call - uses cache
const result2 = await summarizer.summarize('conv-id', messages);
console.log('Cached:', result2.cached); // true

// Force regeneration
const result3 = await summarizer.summarize('conv-id', messages, {
  forceRegenerate: true,
});
console.log('Cached:', result3.cached); // false

// Clear cache
summarizer.clearCache();
```

### Incremental Summarization

Update existing summaries with new messages:

```typescript
// Initial summary
const initial = await summarizer.summarize('conv-id', messages.slice(0, 10));

// New messages arrive
const newMessages = messages.slice(10);

// Append mode - add new summary to existing
const appendResult = await summarizer.summarizeIncremental({
  existingSummary: initial.summary,
  newMessages,
  mode: 'append',
});

// Merge mode - re-summarize with context
const mergeResult = await summarizer.summarizeIncremental({
  existingSummary: initial.summary,
  newMessages,
  mode: 'merge',
});
```

### Partial Summarization

Summarize specific message ranges:

```typescript
// Summarize only messages 10-20
const result = await summarizer.summarize('conv-id', messages, {
  startIndex: 10,
  endIndex: 20,
});

console.log('Range:', result.summary.messageRange);
// { start: 10, end: 20 }
```

### Custom Prompts

Override default prompts for domain-specific summarization:

```typescript
const summarizer = new ConversationSummarizer({
  strategy: 'single-pass',
  compressionLevel: CompressionLevel.MODERATE,
  provider: 'openai',
  providerConfig: {
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4',
  },
  customPrompt: `Summarize this technical support conversation, focusing on:
  1. The customer's issue
  2. Troubleshooting steps taken
  3. Final resolution
  Format as a support ticket summary.`,
});
```

### Statistics Tracking

Monitor summarization performance:

```typescript
// Get statistics
const stats = summarizer.getStats();
console.log('Total summaries:', stats.totalSummaries);
console.log('Cache hits:', stats.cacheHits);
console.log('Cache misses:', stats.cacheMisses);
console.log('Total tokens:', stats.totalTokens);
console.log('Average duration:', stats.averageDurationMs, 'ms');

// Reset statistics
summarizer.resetStats();
```

## Usage Examples

### Customer Support Summary

```typescript
const supportSummarizer = new ConversationSummarizer({
  strategy: 'single-pass',
  compressionLevel: CompressionLevel.DETAILED,
  provider: 'openai',
  providerConfig: {
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4',
  },
  customPrompt: `Create a support ticket summary including:
  - Customer issue
  - Steps taken
  - Resolution status
  - Follow-up needed`,
});

const result = await supportSummarizer.summarize('ticket-123', messages, {
  metadata: {
    ticketId: '123',
    customerId: '456',
    priority: 'high',
  },
});
```

### Research Interview Summary

```typescript
const interviewSummarizer = new ConversationSummarizer({
  strategy: 'hierarchical',
  compressionLevel: CompressionLevel.DETAILED,
  provider: 'anthropic',
  providerConfig: {
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: 'claude-3-opus-20240229',
  },
  chunkSize: 20,
  maxKeyPoints: 10,
});

const result = await interviewSummarizer.summarize('interview-1', messages);

// Generate report
console.log('Interview Summary:', result.summary.content);
console.log('\nKey Insights:');
result.summary.keyPoints?.forEach((point, i) => {
  console.log(`${i + 1}. ${point}`);
});

console.log('\nDetailed Sections:');
result.additionalSummaries?.forEach((section, i) => {
  console.log(`\nSection ${i + 1}:`, section.content);
});
```

### Real-time Chat Summary

```typescript
// For live chat, use extractive for speed
const liveSummarizer = new ConversationSummarizer({
  strategy: 'extractive',
  compressionLevel: CompressionLevel.BRIEF,
  provider: 'openai',
  providerConfig: {
    apiKey: 'not-needed',
    model: 'not-needed',
  },
  enableCache: false, // Disable for real-time
});

// Update summary as messages arrive
let currentSummary = null;

async function updateSummary(newMessage) {
  allMessages.push(newMessage);

  if (allMessages.length % 5 === 0) {
    // Re-summarize every 5 messages
    const result = await liveSummarizer.summarize('chat-room-1', allMessages);
    currentSummary = result.summary;

    // Broadcast to participants
    broadcastSummary(currentSummary.content);
  }
}
```

## Performance Tips

### Token Optimization

1. **Use appropriate compression levels**: Brief for quick overviews, Detailed only when needed
2. **Choose right strategy**: Extractive for cost savings, Single-pass for short conversations
3. **Set reasonable chunk sizes**: 10-20 messages per chunk is usually optimal
4. **Enable caching**: Avoid regenerating identical summaries

### Speed Optimization

1. **Use extractive for real-time**: No API latency
2. **Implement incremental updates**: Don't re-summarize entire conversation
3. **Parallel processing**: For hierarchical strategy, chunks can be processed in parallel (future enhancement)
4. **Cache aggressively**: Use longer TTL for static conversations

### Quality Optimization

1. **Use GPT-4 or Claude Opus**: Better understanding and coherence
2. **Detailed compression**: For important conversations
3. **Hybrid strategy**: Best quality/cost ratio
4. **Custom prompts**: Domain-specific instructions improve relevance

## Strategy Selection Guide

| Scenario | Recommended Strategy | Compression | Why |
|----------|---------------------|-------------|-----|
| Live chat dashboard | Extractive | Brief | Fast, free, real-time |
| Support ticket archive | Single-pass | Moderate | Good quality, simple |
| Long research interview | Hierarchical | Detailed | Multi-level detail |
| Daily conversation digest | Rolling | Moderate | Handles length well |
| Production cost-conscious | Hybrid | Moderate | Best quality/cost |
| API quota limited | Extractive | Any | No API calls |
| Quality critical | Single-pass (GPT-4) | Detailed | Best coherence |

## Extractive Utilities

For advanced use cases, use extractive functions directly:

```typescript
import {
  extractKeySentences,
  extractKeyPoints,
  extractKeywords,
  createExtractiveSummary,
  calculateDiversity,
} from '@ainative/ai-kit-core/summarization';

// Extract key sentences with scores
const sentences = extractKeySentences(messages, 5);
sentences.forEach(s => {
  console.log(`Score: ${s.score.toFixed(2)} - ${s.text}`);
});

// Extract key points (unique sentences)
const points = extractKeyPoints(messages, 5);

// Extract keywords (TF-IDF based)
const keywords = extractKeywords(messages, 10);

// Create summary
const summary = createExtractiveSummary(messages, 3);

// Calculate vocabulary diversity (0-1)
const diversity = calculateDiversity(messages);
console.log(`Diversity: ${diversity.toFixed(2)}`);
```

## Error Handling

```typescript
try {
  const result = await summarizer.summarize('conv-id', messages);
  console.log(result.summary.content);
} catch (error) {
  if (error.message.includes('No messages to summarize')) {
    console.error('Empty message list');
  } else if (error.message.includes('API key')) {
    console.error('Invalid API credentials');
  } else {
    console.error('Summarization failed:', error.message);
  }
}
```

## Integration with ConversationStore

```typescript
import { createStore } from '@ainative/ai-kit-core/store';
import { ConversationSummarizer } from '@ainative/ai-kit-core/summarization';

// Create store
const store = createStore({
  type: 'memory',
});

// Create summarizer
const summarizer = new ConversationSummarizer({
  strategy: 'single-pass',
  compressionLevel: CompressionLevel.MODERATE,
  provider: 'openai',
  providerConfig: {
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4',
  },
});

// Load conversation and summarize
const conversation = await store.load('conv-123');
if (conversation) {
  const summary = await summarizer.summarize(
    conversation.conversationId,
    conversation.messages
  );

  // Save summary in metadata
  await store.save(
    conversation.conversationId,
    conversation.messages,
    {
      metadata: {
        summary: summary.summary.content,
        keyPoints: summary.summary.keyPoints,
        lastSummarized: Date.now(),
      },
    }
  );
}
```

## API Reference

### ConversationSummarizer

#### Constructor

```typescript
new ConversationSummarizer(config: SummaryConfig)
```

#### Methods

##### summarize()
```typescript
async summarize(
  conversationId: string,
  messages: Message[],
  options?: SummarizeOptions
): Promise<SummarizationResult>
```

##### summarizeIncremental()
```typescript
async summarizeIncremental(
  options: IncrementalSummaryOptions
): Promise<SummarizationResult>
```

##### clearCache()
```typescript
clearCache(): void
```

##### getStats()
```typescript
getStats(): SummarizationStats
```

##### resetStats()
```typescript
resetStats(): void
```

## Best Practices

1. **Choose the right strategy** based on conversation length and use case
2. **Enable caching** for frequently accessed summaries
3. **Use extractive** for real-time or cost-sensitive applications
4. **Monitor token usage** with statistics tracking
5. **Implement error handling** for API failures
6. **Test compression levels** to find optimal balance
7. **Use custom prompts** for domain-specific summarization
8. **Consider incremental updates** for live conversations
9. **Cache invalidation** - clear cache when conversation is significantly updated
10. **Batch processing** - summarize multiple conversations in parallel

## Troubleshooting

### Summary quality issues
- Try detailed compression level
- Use GPT-4 or Claude Opus
- Provide custom prompt with specific instructions
- Use hybrid strategy for better coherence

### High API costs
- Switch to extractive strategy
- Enable caching with longer TTL
- Use brief compression level
- Consider rolling strategy with larger chunks

### Slow performance
- Use extractive for real-time needs
- Enable caching
- Use smaller models (gpt-3.5-turbo)
- Implement parallel processing for hierarchical strategy

### Token limit errors
- Use rolling or hierarchical strategy
- Reduce chunk size
- Use brief compression level
- Summarize in smaller ranges

## License

MIT
