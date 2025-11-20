# Usage Tracking

Automatic usage tracking and cost monitoring for LLM API calls.

## Overview

The Usage Tracking module provides comprehensive tracking of LLM API usage, including:

- Automatic token counting
- Cost calculation per provider (OpenAI, Anthropic, etc.)
- Request/response timing
- Success/failure tracking
- Aggregation by user, conversation, model, and date
- Export to various formats (JSON, CSV, JSON Lines)
- Multiple storage backends (memory, file, database)

## Quick Start

```typescript
import { UsageTracker } from '@ainative/ai-kit-core/tracking';

// Create tracker with default in-memory storage
const tracker = new UsageTracker();

// Track a successful API call
await tracker.trackSuccess({
  model: 'gpt-4',
  promptTokens: 100,
  completionTokens: 50,
  durationMs: 1000,
  userId: 'user-123',
  conversationId: 'conv-456',
});

// Get aggregated statistics
const stats = await tracker.getAggregated();
console.log(`Total cost: $${stats.totalCost}`);
console.log(`Total tokens: ${stats.totalTokens}`);
```

## Configuration

### Memory Storage (Default)

```typescript
const tracker = new UsageTracker({
  enabled: true,
  storage: 'memory',
  maxRecords: 10000, // Keep last 10k records
});
```

### File Storage

```typescript
const tracker = new UsageTracker({
  enabled: true,
  storage: 'file',
  filePath: './usage-logs.jsonl',
  exportFormat: 'jsonl', // or 'json', 'csv'
});
```

### With Auto-flush

```typescript
const tracker = new UsageTracker({
  enabled: true,
  storage: 'memory',
  autoFlush: true,
  flushIntervalMs: 60000, // Flush every minute
});
```

## Tracking API Calls

### Basic Tracking

```typescript
// Track success
await tracker.trackSuccess({
  model: 'gpt-4',
  promptTokens: 100,
  completionTokens: 50,
  durationMs: 1000,
});

// Track failure
await tracker.trackFailure({
  model: 'claude-3-opus',
  promptTokens: 100,
  completionTokens: 0,
  durationMs: 500,
  error: 'API rate limit exceeded',
});
```

### With Context

```typescript
await tracker.trackSuccess({
  model: 'gpt-3.5-turbo',
  promptTokens: 50,
  completionTokens: 25,
  durationMs: 300,
  userId: 'user-123',
  conversationId: 'conv-456',
  metadata: {
    endpoint: '/api/chat',
    version: '1.0',
    environment: 'production',
  },
});
```

### Automatic Wrapping

Automatically track any LLM API call:

```typescript
const result = await tracker.wrap(
  async () => {
    // Your LLM API call
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: 'Hello!' }],
    });
    return response;
  },
  {
    model: 'gpt-4',
    userId: 'user-123',
    extractTokens: (response) => ({
      promptTokens: response.usage?.prompt_tokens || 0,
      completionTokens: response.usage?.completion_tokens || 0,
    }),
  }
);
```

## Querying Usage Data

### Get All Records

```typescript
const records = await tracker.getRecords();
```

### Filter Records

```typescript
// Filter by user
const userRecords = await tracker.getRecords({
  userId: 'user-123',
});

// Filter by conversation
const convRecords = await tracker.getRecords({
  conversationId: 'conv-456',
});

// Filter by provider
const openaiRecords = await tracker.getRecords({
  provider: 'openai',
});

// Filter by model
const gpt4Records = await tracker.getRecords({
  model: 'gpt-4',
});

// Filter by success status
const failedRecords = await tracker.getRecords({
  success: false,
});

// Filter by date range
const recentRecords = await tracker.getRecords({
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
});

// Combine filters
const filteredRecords = await tracker.getRecords({
  userId: 'user-123',
  provider: 'openai',
  success: true,
});
```

## Aggregated Statistics

### Overall Statistics

```typescript
const stats = await tracker.getAggregated();

console.log('Total Requests:', stats.totalRequests);
console.log('Successful:', stats.successfulRequests);
console.log('Failed:', stats.failedRequests);
console.log('Total Tokens:', stats.totalTokens);
console.log('Total Cost:', `$${stats.totalCost}`);
console.log('Average Cost:', `$${stats.avgCostPerRequest}`);
console.log('Average Duration:', `${stats.avgDurationMs}ms`);
```

### By Provider

```typescript
const stats = await tracker.getAggregated();

console.log('OpenAI Usage:');
console.log('- Requests:', stats.byProvider.openai.totalRequests);
console.log('- Tokens:', stats.byProvider.openai.totalTokens);
console.log('- Cost:', `$${stats.byProvider.openai.totalCost}`);

console.log('Anthropic Usage:');
console.log('- Requests:', stats.byProvider.anthropic.totalRequests);
console.log('- Tokens:', stats.byProvider.anthropic.totalTokens);
console.log('- Cost:', `$${stats.byProvider.anthropic.totalCost}`);
```

### By Model

```typescript
const stats = await tracker.getAggregated();

for (const [model, usage] of Object.entries(stats.byModel)) {
  console.log(`${model}:`);
  console.log('- Requests:', usage.totalRequests);
  console.log('- Tokens:', usage.totalTokens);
  console.log('- Cost:', `$${usage.totalCost}`);
}
```

### By User

```typescript
const stats = await tracker.getAggregated();

if (stats.byUser) {
  for (const [userId, usage] of Object.entries(stats.byUser)) {
    console.log(`User ${userId}:`);
    console.log('- Requests:', usage.totalRequests);
    console.log('- Tokens:', usage.totalTokens);
    console.log('- Cost:', `$${usage.totalCost}`);
  }
}
```

### By Date

```typescript
const stats = await tracker.getAggregated();

if (stats.byDate) {
  for (const [date, usage] of Object.entries(stats.byDate)) {
    console.log(`${date}:`);
    console.log('- Requests:', usage.totalRequests);
    console.log('- Tokens:', usage.totalTokens);
    console.log('- Cost:', `$${usage.totalCost}`);
  }
}
```

## Exporting Data

### JSON Format

```typescript
const json = await tracker.export('json');
const records = JSON.parse(json);
```

### CSV Format

```typescript
const csv = await tracker.export('csv');
// Save to file or process
await fs.writeFile('usage-report.csv', csv);
```

### JSON Lines Format

```typescript
const jsonl = await tracker.export('jsonl');
// Each line is a separate JSON object
const lines = jsonl.split('\n');
```

### Export with Filters

```typescript
// Export only user's data
const userJson = await tracker.export('json', {
  userId: 'user-123',
});

// Export only failed requests
const failedCsv = await tracker.export('csv', {
  success: false,
});
```

## Pricing

The tracker includes built-in pricing for:

### OpenAI Models

- GPT-4 Turbo: $0.01 / 1K prompt tokens, $0.03 / 1K completion tokens
- GPT-4: $0.03 / 1K prompt tokens, $0.06 / 1K completion tokens
- GPT-3.5 Turbo: $0.0005 / 1K prompt tokens, $0.0015 / 1K completion tokens
- Embeddings models

### Anthropic Models

- Claude 3 Opus: $0.015 / 1K prompt tokens, $0.075 / 1K completion tokens
- Claude 3.5 Sonnet: $0.003 / 1K prompt tokens, $0.015 / 1K completion tokens
- Claude 3 Haiku: $0.00025 / 1K prompt tokens, $0.00125 / 1K completion tokens

### Custom Pricing

```typescript
import { calculateCost } from '@ainative/ai-kit-core/tracking';

const cost = calculateCost(
  'gpt-4',
  'openai',
  1000, // prompt tokens
  500   // completion tokens
);

console.log('Prompt cost:', cost.promptCost);
console.log('Completion cost:', cost.completionCost);
console.log('Total cost:', cost.totalCost);
```

## Storage Backends

### InMemoryStorage

Fast, ephemeral storage. Data is lost when the process exits.

```typescript
import { InMemoryStorage } from '@ainative/ai-kit-core/tracking';

const storage = new InMemoryStorage(10000); // max 10k records
```

### FileStorage

Persistent storage using JSON Lines format.

```typescript
import { FileStorage } from '@ainative/ai-kit-core/tracking';

const storage = new FileStorage('./usage.jsonl', 'jsonl');
```

### Custom Storage Backend

Implement the `StorageBackend` interface:

```typescript
import { StorageBackend, UsageRecord } from '@ainative/ai-kit-core/tracking';

class DatabaseStorage implements StorageBackend {
  async store(record: UsageRecord): Promise<void> {
    // Store in database
  }

  async getAll(filter?: UsageFilter): Promise<UsageRecord[]> {
    // Query database
  }

  async getAggregated(filter?: UsageFilter): Promise<AggregatedUsage> {
    // Aggregate from database
  }

  async clear(): Promise<void> {
    // Clear database
  }

  async export(format: ExportFormat, filter?: UsageFilter): Promise<string> {
    // Export from database
  }
}
```

## Best Practices

### 1. Use Context Information

Always include `userId` and `conversationId` for better analytics:

```typescript
await tracker.trackSuccess({
  model: 'gpt-4',
  promptTokens: 100,
  completionTokens: 50,
  durationMs: 1000,
  userId: user.id,
  conversationId: conversation.id,
});
```

### 2. Handle Errors Gracefully

Don't let tracking failures break your application:

```typescript
try {
  await tracker.trackSuccess({...});
} catch (error) {
  console.error('Tracking failed:', error);
  // Continue with your application logic
}
```

### 3. Use File Storage for Production

For production environments, use file storage or implement database storage:

```typescript
const tracker = new UsageTracker({
  storage: 'file',
  filePath: process.env.USAGE_LOG_PATH || './usage-logs.jsonl',
});
```

### 4. Regular Exports

Export data regularly for analysis and archival:

```typescript
// Daily export
setInterval(async () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const csv = await tracker.export('csv', {
    startDate: yesterday,
    endDate: new Date(),
  });

  await fs.writeFile(`usage-${yesterday.toISOString().split('T')[0]}.csv`, csv);
}, 24 * 60 * 60 * 1000);
```

### 5. Monitor Costs

Set up alerts for unusual spending:

```typescript
const stats = await tracker.getAggregated();

if (stats.totalCost > DAILY_BUDGET) {
  await sendAlert(`Daily budget exceeded: $${stats.totalCost}`);
}
```

## Types

### UsageRecord

```typescript
interface UsageRecord {
  id: string;
  timestamp: Date;
  userId?: string;
  conversationId?: string;
  provider: 'openai' | 'anthropic' | 'unknown';
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  durationMs: number;
  success: boolean;
  error?: string;
  cost: CostBreakdown;
  metadata?: Record<string, any>;
}
```

### AggregatedUsage

```typescript
interface AggregatedUsage {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokens: number;
  totalCost: number;
  avgCostPerRequest: number;
  avgDurationMs: number;
  byProvider: Record<LLMProvider, ProviderUsage>;
  byModel: Record<string, ModelUsage>;
  byUser?: Record<string, UserUsage>;
  byConversation?: Record<string, ConversationUsage>;
  byDate?: Record<string, DateUsage>;
}
```

## API Reference

### UsageTracker

#### Constructor

```typescript
new UsageTracker(config?: Partial<TrackingConfig>)
```

#### Methods

- `track(params)` - Track a single API call
- `trackSuccess(params)` - Track a successful call
- `trackFailure(params)` - Track a failed call
- `getRecords(filter?)` - Get all records with optional filtering
- `getAggregated(filter?)` - Get aggregated statistics
- `export(format, filter?)` - Export data
- `clear()` - Clear all records
- `wrap(fn, params)` - Wrap an API call with automatic tracking
- `destroy()` - Clean up resources

## Examples

See the [examples directory](../../examples/tracking) for complete examples.

## License

MIT
