# Context Truncation

Automatic context window management with intelligent truncation strategies for AI Kit.

## Overview

The Context Truncation module provides automatic token counting and intelligent context window management for AI applications. It helps you:

- **Stay within token limits** - Automatically truncate conversations to fit model context windows
- **Preserve important context** - Keep system messages, recent history, and critical information
- **Optimize costs** - Reduce token usage by removing less relevant content
- **Support multiple models** - Works with GPT-4, GPT-3.5, Claude, and more

## Installation

```bash
npm install @ainative/ai-kit-core
# or
pnpm add @ainative/ai-kit-core
```

## Quick Start

```typescript
import { ContextManager } from '@ainative/ai-kit-core/context';

// Create a context manager
const manager = new ContextManager({
  model: 'gpt-4',
  maxTokens: 8000,
  reservedTokens: 1000, // Reserve tokens for completion
  truncationStrategy: 'oldest-first',
  preserveSystemMessages: true,
  preserveRecentCount: 2,
});

// Your messages
const messages = [
  { role: 'system', content: 'You are a helpful assistant.' },
  { role: 'user', content: 'Hello!' },
  { role: 'assistant', content: 'Hi! How can I help?' },
  // ... many more messages
];

// Add a new message with automatic truncation
const newMessage = { role: 'user', content: 'What is AI?' };
const updatedMessages = manager.addMessage(messages, newMessage);

// Check token usage
const usage = manager.getTokenUsage(updatedMessages);
console.log(`Using ${usage.totalTokens} tokens, ${usage.remainingTokens} remaining`);
```

## Core Components

### ContextManager

The main class for managing context windows.

```typescript
interface ContextConfig {
  model: ModelType;
  maxTokens: number;
  reservedTokens?: number; // Default: 1000
  truncationStrategy?: TruncationStrategyType; // Default: 'oldest-first'
  preserveSystemMessages?: boolean; // Default: true
  preserveRecentCount?: number; // Default: 1
  slidingWindowConfig?: {
    keepFirst: number;
    keepLast: number;
  };
  warningThreshold?: number; // Default: 0.8 (80%)
  onWarning?: (usage: TokenUsage) => void;
  onTruncate?: (removed: ContextMessage[], remaining: ContextMessage[]) => void;
  customTruncationFn?: (messages: ContextMessage[], maxTokens: number) => ContextMessage[];
}
```

### TokenCounter

Accurate token counting using tiktoken.

```typescript
import { TokenCounter } from '@ainative/ai-kit-core/context';

const counter = new TokenCounter();

// Count tokens in a string
const tokens = counter.countStringTokens('Hello, world!', 'gpt-4');

// Count tokens in a message
const message = { role: 'user', content: 'Hello!' };
const result = counter.countMessageTokens(message, 'gpt-4');
console.log(result.tokens); // Total tokens
console.log(result.breakdown); // Detailed breakdown

// Count tokens for multiple messages
const total = counter.countMessagesTokens(messages, 'gpt-4');

// Cleanup
counter.dispose();
```

## Truncation Strategies

### 1. Oldest-First (Default)

Removes oldest messages first while preserving system messages and recent context.

**Best for:** General-purpose applications, chat interfaces

```typescript
const manager = new ContextManager({
  model: 'gpt-4',
  maxTokens: 8000,
  truncationStrategy: 'oldest-first',
  preserveSystemMessages: true,
  preserveRecentCount: 3, // Keep last 3 messages
});
```

**How it works:**
1. Always preserves system messages (if enabled)
2. Preserves N most recent messages
3. Removes oldest messages in the middle until under limit
4. Maintains conversation order

### 2. Sliding Window

Keeps first N and last M messages, removing the middle.

**Best for:** Maintaining context from both start and end of conversation

```typescript
const manager = new ContextManager({
  model: 'gpt-4',
  maxTokens: 8000,
  truncationStrategy: 'sliding-window',
  slidingWindowConfig: {
    keepFirst: 5,  // Keep first 5 messages
    keepLast: 10,  // Keep last 10 messages
  },
});
```

**How it works:**
1. Preserves system messages
2. Keeps first N messages (initial context)
3. Keeps last M messages (recent context)
4. Removes everything in between
5. Trims from middle if still over limit

### 3. Importance-Based

Preserves messages based on importance level.

**Best for:** Applications with critical instructions or data

```typescript
const manager = new ContextManager({
  model: 'gpt-4',
  maxTokens: 8000,
  truncationStrategy: 'importance-based',
});

const messages = [
  {
    role: 'system',
    content: 'Instructions...',
    importance: MessageImportance.SYSTEM, // Always kept
  },
  {
    role: 'user',
    content: 'Critical requirement!',
    importance: MessageImportance.CRITICAL, // High priority
  },
  {
    role: 'user',
    content: 'Nice to have...',
    importance: MessageImportance.LOW, // Removed first
  },
];
```

**Importance Levels:**
- `SYSTEM` - System messages (highest priority)
- `CRITICAL` - Must be preserved
- `HIGH` - Important context
- `NORMAL` - Standard messages
- `LOW` - Can be dropped first

### 4. Least-Relevant (Semantic)

Removes messages with lowest semantic relevance to recent context.

**Best for:** Advanced applications with embeddings, RAG systems

```typescript
const manager = new ContextManager({
  model: 'gpt-4',
  maxTokens: 8000,
  truncationStrategy: 'least-relevant',
  preserveRecentCount: 2,
});

// Messages with embeddings
const messages = [
  {
    role: 'user',
    content: 'Tell me about cats.',
    embedding: [0.1, 0.2, 0.3, ...], // Vector embedding
  },
  {
    role: 'user',
    content: 'What about dogs?',
    embedding: [0.15, 0.25, 0.35, ...],
  },
  {
    role: 'user',
    content: 'Explain quantum physics.',
    embedding: [0.9, 0.8, 0.7, ...], // Less relevant
  },
];
```

**How it works:**
1. Calculates average embedding of recent messages
2. Scores other messages by cosine similarity
3. Removes messages with lowest relevance scores
4. Preserves system messages and recent context
5. Falls back to oldest-first if no embeddings

### 5. Custom Strategy

Implement your own truncation logic.

```typescript
const manager = new ContextManager({
  model: 'gpt-4',
  maxTokens: 8000,
  truncationStrategy: 'custom',
  customTruncationFn: (messages, maxTokens) => {
    // Your custom logic
    // Example: Keep only user questions
    return messages.filter(m => m.role === 'user' || m.role === 'system');
  },
});
```

## Strategy Comparison

| Strategy | Pros | Cons | Best For |
|----------|------|------|----------|
| **Oldest-First** | Simple, predictable, preserves recent context | May lose important early context | General chat, simple bots |
| **Sliding Window** | Preserves both start and end context | May lose critical middle context | Multi-turn conversations |
| **Importance-Based** | Keeps critical information | Requires manual importance tagging | Task-oriented apps |
| **Least-Relevant** | Semantically aware, intelligent pruning | Requires embeddings, more complex | RAG, search, complex reasoning |
| **Custom** | Full control | Must implement yourself | Specialized use cases |

## Advanced Usage

### Warning Callbacks

Get notified when approaching token limits:

```typescript
const manager = new ContextManager({
  model: 'gpt-4',
  maxTokens: 8000,
  warningThreshold: 0.8, // Warn at 80%
  onWarning: (usage) => {
    console.warn(`Token usage at ${usage.totalTokens}/${8000}`);
    // Maybe summarize older messages
  },
});
```

### Truncation Callbacks

Track what gets removed:

```typescript
const manager = new ContextManager({
  model: 'gpt-4',
  maxTokens: 8000,
  onTruncate: (removed, remaining) => {
    console.log(`Removed ${removed.length} messages`);
    // Log to analytics, store in archive, etc.
  },
});
```

### Dynamic Configuration

Update configuration on the fly:

```typescript
const manager = new ContextManager({
  model: 'gpt-4',
  maxTokens: 8000,
});

// Switch to different model
manager.updateConfig({
  model: 'gpt-3.5-turbo',
  maxTokens: 4000,
});

// Change strategy
manager.updateConfig({
  truncationStrategy: 'sliding-window',
  slidingWindowConfig: { keepFirst: 3, keepLast: 5 },
});
```

### Custom Strategies (Advanced)

Register your own strategy:

```typescript
import { TruncationStrategy } from '@ainative/ai-kit-core/context';

const myStrategy: TruncationStrategy = {
  name: 'my-strategy',
  truncate: (messages, maxTokens, currentTokens, config) => {
    // Your implementation
    return filteredMessages;
  },
};

manager.registerStrategy(myStrategy);
manager.updateConfig({ truncationStrategy: 'my-strategy' });
```

### Batch Operations

Add multiple messages at once:

```typescript
const newMessages = [
  { role: 'user', content: 'Question 1' },
  { role: 'assistant', content: 'Answer 1' },
  { role: 'user', content: 'Question 2' },
];

const result = manager.addMessages(messages, newMessages);
```

### Token Estimation

Check if a message will fit:

```typescript
const counter = new TokenCounter();

const wouldExceed = counter.wouldExceedLimit(
  currentMessages,
  newMessage,
  8000,
  'gpt-4'
);

if (wouldExceed) {
  console.log('Need to truncate first');
}
```

## Supported Models

- **OpenAI**: GPT-4, GPT-4 Turbo, GPT-4o, GPT-3.5, GPT-3.5 16k
- **Anthropic**: Claude 3 Opus, Claude 3 Sonnet, Claude 3 Haiku, Claude 3.5 Sonnet, Claude 3.5 Haiku

Default token limits:

```typescript
{
  'gpt-4': 8192,
  'gpt-4-32k': 32768,
  'gpt-4-turbo': 128000,
  'gpt-4o': 128000,
  'gpt-3.5-turbo': 4096,
  'gpt-3.5-turbo-16k': 16384,
  'claude-3-opus': 200000,
  'claude-3-sonnet': 200000,
  'claude-3-haiku': 200000,
  'claude-3-5-sonnet': 200000,
  'claude-3-5-haiku': 200000,
}
```

## Best Practices

### 1. Set Appropriate Reserved Tokens

Always reserve tokens for the model's completion:

```typescript
const manager = new ContextManager({
  model: 'gpt-4',
  maxTokens: 8192,
  reservedTokens: 2000, // Reserve for response
});
```

### 2. Use System Messages Wisely

System messages are always preserved, so keep them concise:

```typescript
// Good
{ role: 'system', content: 'You are a helpful assistant.' }

// Too long - will eat into context
{ role: 'system', content: 'Very long instructions...' } // 1000+ tokens
```

### 3. Choose the Right Strategy

- **Simple chat**: `oldest-first`
- **Need early context**: `sliding-window`
- **Have priorities**: `importance-based`
- **Have embeddings**: `least-relevant`

### 4. Monitor Token Usage

```typescript
const usage = manager.getTokenUsage(messages);

if (usage.totalTokens > usage.remainingTokens * 3) {
  // Consider summarizing
}
```

### 5. Handle Function/Tool Calls

Function calls add tokens - account for them:

```typescript
const message = {
  role: 'assistant',
  content: null,
  function_call: {
    name: 'search',
    arguments: JSON.stringify({ query: 'AI' }),
  },
};

// Token counter handles this automatically
const tokens = counter.countMessageTokens(message, 'gpt-4');
```

### 6. Clean Up Resources

```typescript
// When done
manager.dispose();
counter.dispose();
```

## Performance Tips

1. **Reuse TokenCounter** - Create once, use many times
2. **Batch operations** - Use `addMessages()` instead of multiple `addMessage()` calls
3. **Cache embeddings** - Don't regenerate embeddings on every truncation
4. **Monitor overhead** - Check `TokenUsage.overheadTokens` to understand format costs

## Common Patterns

### Chat Application

```typescript
const manager = new ContextManager({
  model: 'gpt-4',
  maxTokens: 8000,
  reservedTokens: 1000,
  truncationStrategy: 'oldest-first',
  preserveRecentCount: 5,
  warningThreshold: 0.8,
  onWarning: (usage) => {
    analytics.track('approaching_token_limit', usage);
  },
});
```

### RAG System

```typescript
const manager = new ContextManager({
  model: 'gpt-4',
  maxTokens: 8000,
  truncationStrategy: 'least-relevant',
  preserveRecentCount: 2,
  onTruncate: (removed) => {
    // Archive removed messages
    archive.store(removed);
  },
});
```

### Task Assistant

```typescript
const manager = new ContextManager({
  model: 'gpt-4',
  maxTokens: 8000,
  truncationStrategy: 'importance-based',
  onWarning: (usage) => {
    if (usage.remainingTokens < 500) {
      // Summarize conversation
      const summary = await summarize(messages);
      messages = [
        { role: 'system', content: summary },
        ...messages.slice(-3),
      ];
    }
  },
});
```

## TypeScript Types

```typescript
import type {
  ContextMessage,
  ContextConfig,
  TokenUsage,
  TruncationStrategy,
  MessageImportance,
  ModelType,
} from '@ainative/ai-kit-core/context';
```

## Error Handling

```typescript
try {
  const manager = new ContextManager(config);
  const result = manager.addMessage(messages, newMessage);
} catch (error) {
  console.error('Context management error:', error);
  // Fallback: use messages as-is or truncate manually
} finally {
  manager.dispose();
}
```

## FAQ

**Q: What happens if my system message is too long?**
A: System messages are always preserved. If they exceed the limit, you'll need to shorten them or increase `maxTokens`.

**Q: Can I use multiple strategies?**
A: Not simultaneously, but you can switch strategies dynamically with `updateConfig()`.

**Q: How accurate is the token counting?**
A: Very accurate - we use tiktoken, the same library OpenAI uses.

**Q: Does this work with streaming?**
A: Yes! Count tokens before sending to ensure you're under the limit.

**Q: Can I preserve specific messages?**
A: Yes, use `importance-based` strategy and set `importance: MessageImportance.CRITICAL`.

**Q: What if I don't have embeddings for least-relevant?**
A: It automatically falls back to `oldest-first` strategy.

## Related Documentation

- [Streaming](./streaming.md) - Stream AI responses
- [Agents](./agents.md) - Build AI agents
- [Memory](./memory.md) - Persistent memory management

## Contributing

Found a bug or have a feature request? Please open an issue on [GitHub](https://github.com/AINative-Studio/ai-kit).

## License

MIT
