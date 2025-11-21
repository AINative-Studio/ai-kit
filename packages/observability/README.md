# @ainative/ai-kit-observability

**Optional** observability, monitoring, and cost tracking package for AI Kit. Track API usage, monitor performance, set cost alerts, and visualize metrics with React dashboards.

## Why This Package is Optional

Many developers building MVPs or prototypes don't need comprehensive monitoring from day one. By extracting observability features into a separate package, we:

- **Reduce core bundle size** by ~30KB (from ~45KB to ~35KB)
- **Improve tree-shaking** - only import what you need
- **Speed up cold starts** - fewer dependencies to load
- **Keep costs predictable** - opt-in to advanced monitoring

Install this package when you're ready to monitor production usage, track costs, or need detailed insights into your AI application's performance.

## Installation

```bash
npm install @ainative/ai-kit-observability

# Or with pnpm
pnpm add @ainative/ai-kit-observability

# Or with yarn
yarn add @ainative/ai-kit-observability
```

## Features

- **Usage Tracking** - Track API calls, tokens, and costs across providers
- **Cost Monitoring** - Real-time cost calculation for OpenAI, Anthropic, and more
- **Alerts** - Set thresholds and get notified when limits are reached
- **Instrumentation** - Automatic tracing for LLM calls, tools, and agents
- **Query Monitoring** - Detect patterns, anomalies, and performance issues
- **Reporting** - Generate usage reports in JSON, CSV, Markdown, or HTML
- **React Dashboards** - Pre-built components for usage visualization

## Quick Start

### 1. Basic Usage Tracking

```typescript
import { UsageTracker, InMemoryStorage } from '@ainative/ai-kit-observability';

// Create a tracker with in-memory storage
const tracker = new UsageTracker({
  storage: new InMemoryStorage(),
  autoTrack: true,
});

// Track an API call
await tracker.track({
  provider: 'openai',
  model: 'gpt-4',
  operation: 'completion',
  promptTokens: 150,
  completionTokens: 50,
  totalTokens: 200,
  userId: 'user-123',
  conversationId: 'conv-456',
});

// Get aggregated usage
const usage = await tracker.getAggregatedUsage({
  startDate: new Date('2024-01-01'),
  endDate: new Date(),
});

console.log('Total cost:', usage.totalCost);
console.log('Total tokens:', usage.totalTokens);
```

### 2. Persistent Storage

```typescript
import { UsageTracker, FileStorage } from '@ainative/ai-kit-observability';

// Use file-based storage for persistence
const tracker = new UsageTracker({
  storage: new FileStorage({
    filepath: './data/usage.json',
    autoSave: true,
  }),
});
```

### 3. Cost Alerts

```typescript
import { AlertManager } from '@ainative/ai-kit-observability';

const alertManager = new AlertManager({
  rules: [
    {
      id: 'daily-cost-limit',
      name: 'Daily Cost Limit',
      type: 'cost',
      threshold: 100, // $100 per day
      window: '24h',
      severity: 'high',
    },
    {
      id: 'token-limit',
      name: 'Token Usage Alert',
      type: 'usage',
      threshold: 1000000, // 1M tokens
      window: '1h',
      severity: 'warning',
    },
  ],
  channels: [
    {
      type: 'console',
      enabled: true,
    },
    {
      type: 'webhook',
      url: 'https://your-app.com/api/alerts',
      enabled: true,
    },
  ],
});

// Check usage against rules
await alertManager.check(tracker);
```

### 4. Query Monitoring

```typescript
import { createQueryMonitor } from '@ainative/ai-kit-observability';

const monitor = createQueryMonitor({
  enabled: true,
  sampleRate: 1.0, // Track 100% of queries
  detectPatterns: true,
  detectAnomalies: true,
});

// Monitor a query
monitor.startQuery('query-1', {
  provider: 'openai',
  model: 'gpt-4',
  userId: 'user-123',
});

// ... perform the query ...

monitor.endQuery('query-1', {
  tokens: 200,
  cost: 0.004,
  success: true,
});

// Get metrics
const metrics = monitor.getMetrics();
console.log('Average latency:', metrics.avgLatency);
console.log('Error rate:', metrics.errorRate);
```

### 5. Instrumentation

Automatically track all LLM calls, tool executions, and agent operations:

```typescript
import {
  InstrumentationManager,
  OpenAIInterceptor,
  ToolCallInterceptor,
} from '@ainative/ai-kit-observability';

const instrumentation = new InstrumentationManager({
  enabled: true,
  tracingBackend: {
    name: 'console',
    export: (span) => console.log('Trace:', span),
  },
  metricsBackend: {
    name: 'console',
    record: (metric) => console.log('Metric:', metric),
  },
});

// Add interceptors
instrumentation.addInterceptor(new OpenAIInterceptor());
instrumentation.addInterceptor(new ToolCallInterceptor());

// Your LLM calls will now be automatically tracked
```

### 6. Generate Reports

```typescript
import { ReportGenerator, UsageTrackerAdapter } from '@ainative/ai-kit-observability';

const generator = new ReportGenerator({
  dataSource: new UsageTrackerAdapter(tracker),
  defaultFormat: 'markdown',
});

// Generate a daily report
const report = await generator.generate({
  type: 'usage',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-02'),
  format: 'markdown',
  sections: ['summary', 'by-model', 'by-user', 'costs'],
});

console.log(report.content);
```

## React Components

### Usage Dashboard

```tsx
import { UsageMetrics, CostAnalysis } from '@ainative/ai-kit-observability/react';

function DashboardPage() {
  return (
    <div>
      <h1>AI Usage Dashboard</h1>
      <UsageMetrics tracker={tracker} refreshInterval={30000} />
      <CostAnalysis
        tracker={tracker}
        groupBy="model"
        timeRange="7d"
      />
    </div>
  );
}
```

### Model Comparison

```tsx
import { ModelComparison } from '@ainative/ai-kit-observability/react';

function ComparisonPage() {
  return (
    <ModelComparison
      tracker={tracker}
      models={['gpt-4', 'gpt-3.5-turbo', 'claude-3-opus']}
      metrics={['cost', 'latency', 'tokens']}
    />
  );
}
```

## API Reference

### UsageTracker

Main class for tracking API usage and costs.

```typescript
class UsageTracker {
  constructor(config: TrackingConfig);

  // Track a single API call
  track(record: UsageRecord): Promise<void>;

  // Get aggregated usage data
  getAggregatedUsage(filter?: UsageFilter): Promise<AggregatedUsage>;

  // Get usage by provider
  getByProvider(provider: LLMProvider): Promise<ProviderUsage>;

  // Get usage by model
  getByModel(model: string): Promise<ModelUsage>;

  // Export data
  export(format: ExportFormat): Promise<string>;
}
```

### AlertManager

Manage cost and usage alerts.

```typescript
class AlertManager {
  constructor(config: AlertConfig);

  // Add a new alert rule
  addRule(rule: AlertRule): void;

  // Check usage against all rules
  check(tracker: UsageTracker): Promise<Alert[]>;

  // Get triggered alerts
  getAlerts(filter?: { severity?: AlertSeverity }): Alert[];
}
```

### InstrumentationManager

Automatic instrumentation for tracing and metrics.

```typescript
class InstrumentationManager {
  constructor(config: InstrumentationConfig);

  // Add an interceptor
  addInterceptor(interceptor: Interceptor): void;

  // Start a span
  startSpan(name: string, context?: SpanContext): Span;

  // Record a metric
  recordMetric(metric: Metric): void;
}
```

### QueryMonitor

Monitor query patterns and performance.

```typescript
class QueryMonitor {
  constructor(config: QueryMonitorConfig);

  // Start tracking a query
  startQuery(id: string, metadata: any): void;

  // End tracking a query
  endQuery(id: string, result: any): void;

  // Get metrics
  getMetrics(): QueryMetrics;

  // Get detected patterns
  getPatterns(): QueryPattern[];
}
```

## Storage Backends

### InMemoryStorage

Fast, ephemeral storage for development and testing.

```typescript
const storage = new InMemoryStorage({
  maxRecords: 10000, // Keep last 10k records
});
```

### FileStorage

JSON file-based persistence.

```typescript
const storage = new FileStorage({
  filepath: './data/usage.json',
  autoSave: true,
  saveInterval: 60000, // Save every minute
});
```

### Custom Storage

Implement your own storage backend:

```typescript
import { StorageBackend, UsageRecord } from '@ainative/ai-kit-observability';

class DatabaseStorage implements StorageBackend {
  async save(record: UsageRecord): Promise<void> {
    // Save to database
  }

  async load(filter?: UsageFilter): Promise<UsageRecord[]> {
    // Load from database
  }

  async clear(): Promise<void> {
    // Clear database
  }
}
```

## Cost Tracking

The package includes built-in pricing for major providers:

```typescript
import {
  OPENAI_PRICING,
  ANTHROPIC_PRICING,
  calculateCost
} from '@ainative/ai-kit-observability';

// Calculate cost for a specific call
const cost = calculateCost({
  provider: 'openai',
  model: 'gpt-4',
  promptTokens: 150,
  completionTokens: 50,
});

console.log('Cost:', cost); // $0.0115
```

Pricing is automatically updated, but you can override it:

```typescript
import { getModelPricing } from '@ainative/ai-kit-observability';

const pricing = getModelPricing('openai', 'gpt-4');
pricing.promptPrice = 0.03; // Custom pricing
```

## Reporting Formats

Generate reports in multiple formats:

- **JSON** - Structured data for programmatic processing
- **CSV** - Import into Excel, Google Sheets, etc.
- **Markdown** - Human-readable reports for documentation
- **HTML** - Rich formatted reports with charts

```typescript
// Generate HTML report with charts
const report = await generator.generate({
  type: 'usage',
  format: 'html',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-31'),
  sections: ['summary', 'charts', 'breakdown'],
});

// Save to file
fs.writeFileSync('report.html', report.content);
```

## Best Practices

### 1. Start Simple

Begin with basic usage tracking in development, add alerts and dashboards as you scale:

```typescript
// Development
const tracker = new UsageTracker({
  storage: new InMemoryStorage(),
});

// Production
const tracker = new UsageTracker({
  storage: new DatabaseStorage(),
  autoTrack: true,
  batchSize: 100,
  flushInterval: 5000,
});
```

### 2. Set Appropriate Alerts

Configure alerts based on your budget and usage patterns:

```typescript
const alertManager = new AlertManager({
  rules: [
    // Warning at 80% of budget
    { threshold: 80, severity: 'warning' },
    // Critical at 95% of budget
    { threshold: 95, severity: 'critical' },
  ],
});
```

### 3. Use Sampling in High-Traffic Scenarios

For high-throughput applications, use sampling to reduce overhead:

```typescript
const monitor = createQueryMonitor({
  sampleRate: 0.1, // Track 10% of queries
  detectPatterns: true,
});
```

### 4. Regular Reporting

Schedule regular usage reports:

```typescript
// Generate weekly reports
setInterval(async () => {
  const report = await generator.generate({
    type: 'usage',
    format: 'markdown',
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
  });

  await sendReport(report);
}, 7 * 24 * 60 * 60 * 1000);
```

## TypeScript Support

Full TypeScript support with comprehensive type definitions:

```typescript
import type {
  UsageRecord,
  AggregatedUsage,
  AlertRule,
  QueryMetrics,
} from '@ainative/ai-kit-observability';
```

## Migration from Core

If you were previously using observability features from `@ainative/ai-kit-core`, update your imports:

```typescript
// Before
import { UsageTracker } from '@ainative/ai-kit-core/observability';

// After
import { UsageTracker } from '@ainative/ai-kit-observability';
```

The API remains the same, only the package name has changed.

## Examples

See the [examples directory](../../examples/dashboard-apps) for complete working examples:

- **Basic Usage Tracking** - Simple console-based tracking
- **Cost Dashboard** - React dashboard with charts
- **Alert System** - Email and webhook notifications
- **Production Monitoring** - Full production setup with instrumentation

## Contributing

Contributions are welcome! Please read our [contributing guidelines](../../CONTRIBUTING.md) and submit pull requests to our [GitHub repository](https://github.com/AINative-Studio/ai-kit).

## License

MIT License - see [LICENSE](../../LICENSE) for details.

## Support

- Documentation: https://ainative.studio/ai-kit/docs/observability
- Issues: https://github.com/AINative-Studio/ai-kit/issues
- Discord: https://discord.gg/ainative-studio

---

**Made with ❤️ by [AINative Studio](https://ainative.studio)**
