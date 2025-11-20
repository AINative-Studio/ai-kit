# Query Monitoring

Real-time monitoring of LLM queries with event emission, performance tracking, pattern detection, and alerting.

## Overview

The Query Monitoring system provides comprehensive observability for LLM queries in your AI applications. It tracks performance metrics, detects patterns, emits events for real-time monitoring, and triggers alerts based on configurable thresholds.

## Features

- **Real-time Event Emission**: Track query lifecycle events as they happen
- **Performance Metrics**: Monitor duration, token usage, and costs
- **Pattern Detection**: Identify repeated, expensive, slow, and failing queries
- **Alerting**: Get notified when thresholds are exceeded
- **Statistics**: Aggregate metrics across all queries
- **Flexible Configuration**: Customize thresholds and behaviors

## Installation

```typescript
import { QueryMonitor, createQueryMonitor } from '@ainative/ai-kit-core/monitoring';
```

## Basic Usage

### Creating a Monitor

```typescript
import { createQueryMonitor } from '@ainative/ai-kit-core/monitoring';

// Create with default configuration
const monitor = createQueryMonitor();

// Create with custom configuration
const customMonitor = createQueryMonitor({
  slowQueryThresholdMs: 3000,
  enablePatternDetection: true,
  alerts: {
    enabled: true,
    thresholds: {
      errorRate: 0.1,
      avgDuration: 5000,
      costPerQuery: 0.5,
    },
  },
});
```

### Tracking Queries

```typescript
// Start tracking a query
monitor.startQuery({
  queryId: 'unique-query-id',
  prompt: 'What is the weather today?',
  model: {
    provider: 'openai',
    name: 'gpt-4',
  },
  startTime: new Date().toISOString(),
  agentId: 'agent-123',
  tags: ['weather', 'user-query'],
});

// Complete the query
monitor.completeQuery('unique-query-id', {
  tokens: {
    input: 50,
    output: 100,
  },
  llmDuration: 1500,
  response: 'The weather is sunny today.',
});

// Or record an error
monitor.recordError('unique-query-id', new Error('API timeout'));

// Record a retry
monitor.recordRetry('unique-query-id', 1);

// Record a cache hit
monitor.recordCacheHit('unique-query-id', { result: 'cached response' });
```

## Event Reference

### Event Types

The QueryMonitor emits the following events:

#### `query:start`

Emitted when a query begins.

```typescript
monitor.on('query:start', (event) => {
  console.log(`Query ${event.queryId} started`);
  console.log(`Model: ${event.metrics.model}`);
});
```

#### `query:complete`

Emitted when a query completes successfully.

```typescript
monitor.on('query:complete', (event) => {
  console.log(`Query ${event.queryId} completed`);
  console.log(`Duration: ${event.metrics.totalDuration}ms`);
  console.log(`Tokens: ${event.metrics.tokens.total}`);
  console.log(`Cost: $${event.metrics.cost}`);
});
```

#### `query:error`

Emitted when a query fails.

```typescript
monitor.on('query:error', (event) => {
  console.error(`Query ${event.queryId} failed`);
  console.error(`Error: ${event.metrics.error?.message}`);
});
```

#### `query:slow`

Emitted when a query exceeds the slow query threshold.

```typescript
monitor.on('query:slow', (event) => {
  console.warn(`Slow query detected: ${event.queryId}`);
  console.warn(`Duration: ${event.metrics.totalDuration}ms`);
  console.warn(`Threshold: ${event.data?.threshold}ms`);
});
```

#### `query:retry`

Emitted when a query is retried.

```typescript
monitor.on('query:retry', (event) => {
  console.log(`Query ${event.queryId} retry #${event.data?.retryCount}`);
});
```

#### `query:cached`

Emitted when a query result is served from cache.

```typescript
monitor.on('query:cached', (event) => {
  console.log(`Cache hit for query ${event.queryId}`);
});
```

#### `pattern:detected`

Emitted when a query pattern is detected.

```typescript
monitor.on('pattern:detected', (pattern) => {
  console.log(`Pattern detected: ${pattern.type}`);
  console.log(`Description: ${pattern.description}`);
  console.log(`Occurrences: ${pattern.occurrences}`);
  console.log(`Avg Duration: ${pattern.aggregateMetrics.avgDuration}ms`);
  console.log(`Total Cost: $${pattern.aggregateMetrics.totalCost}`);
});
```

#### `alert`

Emitted when an alert threshold is exceeded.

```typescript
monitor.on('alert', (alert) => {
  console.error(`[${alert.severity.toUpperCase()}] ${alert.message}`);
  console.error('Suggestions:', alert.suggestions);
});
```

## Configuration

### MonitorConfig

```typescript
interface MonitorConfig {
  // Enable/disable monitoring
  enabled?: boolean;

  // Slow query threshold in milliseconds
  slowQueryThresholdMs?: number;

  // Enable pattern detection
  enablePatternDetection?: boolean;

  // Pattern detection configuration
  patternDetection?: {
    maxPatterns?: number;
    timeWindowMs?: number;
    minOccurrences?: number;
    similarityThreshold?: number;
  };

  // Alert configuration
  alerts?: {
    enabled?: boolean;
    thresholds?: {
      errorRate?: number; // 0-1
      avgDuration?: number; // milliseconds
      costPerQuery?: number; // USD
      totalCost?: number; // USD
    };
    onAlert?: (alert: Alert) => void | Promise<void>;
  };

  // Metrics retention
  retention?: {
    maxQueries?: number;
    maxAgeMs?: number;
  };

  // Instrumentation integration
  instrumentation?: {
    customReporter?: (metrics: QueryMetrics) => void | Promise<void>;
  };
}
```

### Default Configuration

```typescript
{
  enabled: true,
  slowQueryThresholdMs: 5000,
  enablePatternDetection: true,
  patternDetection: {
    maxPatterns: 100,
    timeWindowMs: 3600000, // 1 hour
    minOccurrences: 3,
    similarityThreshold: 0.85,
  },
  alerts: {
    enabled: true,
    thresholds: {
      errorRate: 0.1, // 10%
      avgDuration: 10000, // 10 seconds
      costPerQuery: 0.5, // $0.50
      totalCost: 100, // $100
    },
  },
  retention: {
    maxQueries: 10000,
    maxAgeMs: 86400000, // 24 hours
  },
}
```

## Pattern Detection

The QueryMonitor automatically detects various query patterns:

### Repeated Queries

Identifies queries with the same prompt being executed multiple times.

```typescript
monitor.on('pattern:detected', (pattern) => {
  if (pattern.type === 'repeated') {
    console.log(`Repeated query detected: ${pattern.description}`);
    console.log(`Consider implementing caching for this query`);
  }
});
```

### Expensive Queries

Detects queries that cost more than the configured threshold.

```typescript
monitor.on('pattern:detected', (pattern) => {
  if (pattern.type === 'expensive') {
    console.log(`Expensive queries on ${pattern.description}`);
    console.log(`Total cost: $${pattern.aggregateMetrics.totalCost}`);
  }
});
```

### Slow Queries

Identifies queries that consistently take longer than expected.

```typescript
monitor.on('pattern:detected', (pattern) => {
  if (pattern.type === 'slow') {
    console.log(`Slow query pattern: ${pattern.description}`);
    console.log(`Avg duration: ${pattern.aggregateMetrics.avgDuration}ms`);
  }
});
```

### Failing Queries

Tracks queries that frequently fail.

```typescript
monitor.on('pattern:detected', (pattern) => {
  if (pattern.type === 'failing') {
    console.log(`Failing query pattern: ${pattern.description}`);
    console.log(`Success rate: ${pattern.aggregateMetrics.successRate * 100}%`);
  }
});
```

## Statistics

Get aggregate statistics across all queries:

```typescript
const stats = monitor.getStats();

console.log(`Total Queries: ${stats.totalQueries}`);
console.log(`Success Rate: ${(stats.successfulQueries / stats.totalQueries) * 100}%`);
console.log(`Average Duration: ${stats.aggregateMetrics.avgDuration}ms`);
console.log(`Total Cost: $${stats.aggregateMetrics.totalCost}`);
console.log(`Total Tokens: ${stats.aggregateMetrics.totalTokens}`);

// Breakdown by model
Object.entries(stats.byModel).forEach(([model, data]) => {
  console.log(`${model}: ${data.queries} queries, $${data.totalCost} cost`);
});

// Breakdown by provider
Object.entries(stats.byProvider).forEach(([provider, data]) => {
  console.log(`${provider}: ${data.queries} queries, ${data.totalTokens} tokens`);
});
```

## Alerting

### Built-in Alerts

The QueryMonitor provides several built-in alert types:

- **high_error_rate**: Triggered when error rate exceeds threshold
- **high_cost**: Triggered when total cost exceeds threshold
- **slow_queries**: Triggered when average duration exceeds threshold

### Custom Alert Handler

```typescript
const monitor = createQueryMonitor({
  alerts: {
    enabled: true,
    thresholds: {
      errorRate: 0.15,
      avgDuration: 8000,
      totalCost: 50,
    },
    onAlert: async (alert) => {
      // Send to monitoring service
      await sendToMonitoringService({
        type: alert.type,
        severity: alert.severity,
        message: alert.message,
        timestamp: alert.timestamp,
        data: alert.data,
      });

      // Send notification
      if (alert.severity === 'critical' || alert.severity === 'error') {
        await sendSlackNotification(alert.message);
      }
    },
  },
});
```

## Advanced Usage

### Integration with Agent Execution

```typescript
import { Agent } from '@ainative/ai-kit-core/agents';
import { createQueryMonitor } from '@ainative/ai-kit-core/monitoring';

const monitor = createQueryMonitor();

// Track agent queries
monitor.on('query:complete', (event) => {
  console.log(`Agent query completed in ${event.metrics.totalDuration}ms`);
});

async function executeAgentWithMonitoring(agent: Agent, input: string) {
  const queryId = generateId();

  monitor.startQuery({
    queryId,
    prompt: input,
    model: {
      provider: agent.config.llm.provider,
      name: agent.config.llm.model,
    },
    startTime: new Date().toISOString(),
    agentId: agent.config.id,
  });

  try {
    const result = await agent.execute(input);

    monitor.completeQuery(queryId, {
      tokens: result.tokens,
      llmDuration: result.llmDuration,
      response: result.response,
    });

    return result;
  } catch (error) {
    monitor.recordError(queryId, error as Error);
    throw error;
  }
}
```

### Custom Metrics Reporter

```typescript
const monitor = createQueryMonitor({
  instrumentation: {
    customReporter: async (metrics) => {
      // Send to OpenTelemetry
      await otel.recordMetric({
        name: 'llm.query.duration',
        value: metrics.totalDuration,
        attributes: {
          model: metrics.model,
          provider: metrics.provider,
          success: metrics.success,
        },
      });

      // Send to custom analytics
      await analytics.track('llm_query', {
        duration: metrics.totalDuration,
        tokens: metrics.tokens.total,
        cost: metrics.cost,
      });
    },
  },
});
```

### Pattern Analysis

```typescript
// Get all detected patterns
const patterns = monitor.getPatterns();

// Analyze patterns
const repeatedPatterns = patterns.filter(p => p.type === 'repeated');
const expensivePatterns = patterns.filter(p => p.type === 'expensive');

console.log(`Found ${repeatedPatterns.length} repeated query patterns`);
console.log(`Found ${expensivePatterns.length} expensive query patterns`);

// Get most expensive pattern
const mostExpensive = patterns.reduce((max, p) =>
  p.aggregateMetrics.totalCost > max.aggregateMetrics.totalCost ? p : max
);

console.log(`Most expensive pattern: ${mostExpensive.description}`);
console.log(`Total cost: $${mostExpensive.aggregateMetrics.totalCost}`);
```

## Best Practices

### 1. Use Unique Query IDs

Always generate unique query IDs to avoid conflicts:

```typescript
import { generateId } from '@ainative/ai-kit-core/utils';

const queryId = generateId();
monitor.startQuery({
  queryId,
  // ... other fields
});
```

### 2. Enable Pattern Detection for Optimization

Pattern detection helps identify optimization opportunities:

```typescript
const monitor = createQueryMonitor({
  enablePatternDetection: true,
  patternDetection: {
    minOccurrences: 3, // Alert after 3 occurrences
  },
});

monitor.on('pattern:detected', (pattern) => {
  if (pattern.type === 'repeated') {
    console.log('Consider implementing caching');
  }
  if (pattern.type === 'expensive') {
    console.log('Consider using a cheaper model');
  }
});
```

### 3. Set Appropriate Thresholds

Configure thresholds based on your application's requirements:

```typescript
const monitor = createQueryMonitor({
  slowQueryThresholdMs: 3000, // 3 seconds
  alerts: {
    thresholds: {
      errorRate: 0.05, // 5% error rate
      avgDuration: 5000, // 5 second average
      costPerQuery: 0.1, // $0.10 per query
      totalCost: 100, // $100 total budget
    },
  },
});
```

### 4. Monitor Multiple Metrics

Track both performance and cost:

```typescript
monitor.on('query:complete', (event) => {
  const { metrics } = event;

  // Log slow queries
  if (metrics.totalDuration > 2000) {
    console.warn(`Slow query: ${metrics.totalDuration}ms`);
  }

  // Log expensive queries
  if (metrics.cost && metrics.cost > 0.5) {
    console.warn(`Expensive query: $${metrics.cost}`);
  }

  // Log high token usage
  if (metrics.tokens.total > 10000) {
    console.warn(`High token usage: ${metrics.tokens.total} tokens`);
  }
});
```

### 5. Implement Retention Policies

Configure retention to prevent memory issues:

```typescript
const monitor = createQueryMonitor({
  retention: {
    maxQueries: 5000, // Keep only 5000 most recent queries
    maxAgeMs: 3600000, // Keep queries for 1 hour
  },
});
```

### 6. Use Tags for Categorization

Add tags to queries for better analysis:

```typescript
monitor.startQuery({
  queryId: generateId(),
  prompt: input,
  model: { provider: 'openai', name: 'gpt-4' },
  startTime: new Date().toISOString(),
  tags: ['user-facing', 'high-priority', 'production'],
});
```

### 7. Clean Up Resources

Remove listeners when done:

```typescript
// Remove specific listener
monitor.off('query:complete', myListener);

// Remove all listeners for an event
monitor.removeAllListeners('query:complete');

// Remove all listeners
monitor.removeAllListeners();
```

### 8. Disable Monitoring in Development

```typescript
const monitor = createQueryMonitor({
  enabled: process.env.NODE_ENV === 'production',
});
```

## API Reference

### QueryMonitor

#### Methods

- `startQuery(context: QueryContext): void` - Begin tracking a query
- `completeQuery(queryId: string, result: CompletionResult): void` - Record query completion
- `recordError(queryId: string, error: Error): void` - Record query error
- `recordRetry(queryId: string, retryCount: number): void` - Record retry attempt
- `recordCacheHit(queryId: string, result: any): void` - Record cache hit
- `getStats(): MonitoringStats` - Get aggregate statistics
- `getPatterns(): Pattern[]` - Get detected patterns
- `getQueryMetrics(queryId: string): QueryMetrics | undefined` - Get specific query metrics
- `getAllMetrics(): QueryMetrics[]` - Get all query metrics
- `on(event, listener): this` - Register event listener
- `once(event, listener): this` - Register one-time listener
- `off(event, listener): this` - Remove event listener
- `removeAllListeners(event?): this` - Remove all listeners
- `enable(): void` - Enable monitoring
- `disable(): void` - Disable monitoring
- `isEnabled(): boolean` - Check if monitoring is enabled
- `reset(): void` - Reset all metrics and patterns
- `clearQuery(queryId: string): void` - Clear specific query data

## Examples

### Complete Example with Agent Integration

```typescript
import { createAgent } from '@ainative/ai-kit-core/agents';
import { createQueryMonitor } from '@ainative/ai-kit-core/monitoring';
import { generateId } from '@ainative/ai-kit-core/utils';

// Create monitor
const monitor = createQueryMonitor({
  slowQueryThresholdMs: 2000,
  enablePatternDetection: true,
  alerts: {
    enabled: true,
    thresholds: {
      errorRate: 0.1,
      avgDuration: 5000,
    },
    onAlert: (alert) => {
      console.error(`[ALERT] ${alert.message}`);
    },
  },
});

// Set up event listeners
monitor.on('query:slow', (event) => {
  console.warn(`Slow query detected: ${event.metrics.totalDuration}ms`);
});

monitor.on('pattern:detected', (pattern) => {
  console.log(`Pattern detected: ${pattern.description}`);
});

// Create agent
const agent = createAgent({
  id: 'assistant',
  name: 'Assistant',
  systemPrompt: 'You are a helpful assistant.',
  llm: {
    provider: 'openai',
    model: 'gpt-4',
  },
  tools: [],
});

// Execute queries with monitoring
async function executeQuery(prompt: string) {
  const queryId = generateId();

  monitor.startQuery({
    queryId,
    prompt,
    model: {
      provider: agent.config.llm.provider,
      name: agent.config.llm.model,
    },
    startTime: new Date().toISOString(),
    agentId: agent.config.id,
  });

  try {
    // Execute agent
    const result = await agent.execute(prompt);

    // Record completion
    monitor.completeQuery(queryId, {
      tokens: result.tokens,
      llmDuration: result.duration,
      response: result.response,
    });

    return result;
  } catch (error) {
    monitor.recordError(queryId, error as Error);
    throw error;
  }
}

// Usage
await executeQuery('What is the weather today?');
await executeQuery('Tell me a joke');

// Get statistics
const stats = monitor.getStats();
console.log(`Processed ${stats.totalQueries} queries`);
console.log(`Average duration: ${stats.aggregateMetrics.avgDuration}ms`);
console.log(`Total cost: $${stats.aggregateMetrics.totalCost}`);
```

## Support

For issues and questions, please visit the [GitHub repository](https://github.com/AINative-Studio/ai-kit).
