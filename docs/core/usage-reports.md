# Usage Reports

The Usage Reports module provides comprehensive analytics and reporting capabilities for tracking LLM API usage, costs, and performance metrics.

## Overview

The reporting system builds on top of the Usage Tracking module (AIKIT-26) to generate detailed reports in multiple formats. It supports various report types, time-based aggregations, trend analysis, and anomaly detection.

## Features

- **Multiple Report Types**: Summary, Detailed, Cost, Model Comparison, User, and Trend reports
- **Multiple Formats**: JSON, CSV, HTML, and Markdown output
- **Time-Based Aggregation**: Hourly, daily, weekly, monthly, and custom periods
- **Trend Analysis**: Automatic detection of usage trends with projections
- **Anomaly Detection**: Identify unusual patterns in cost, tokens, or latency
- **Top Consumers**: Identify highest-cost users, models, or conversations
- **Cost Projections**: Daily, weekly, and monthly cost forecasts

## Quick Start

```typescript
import { UsageTracker, ReportGenerator, UsageTrackerAdapter, JSONFormatter } from '@ainative/ai-kit-core';

// Initialize usage tracker
const tracker = new UsageTracker({
  enabled: true,
  storage: 'memory',
});

// Track some usage
await tracker.trackSuccess({
  model: 'gpt-4',
  promptTokens: 100,
  completionTokens: 50,
  durationMs: 1500,
  userId: 'user123',
});

// Create report generator
const adapter = new UsageTrackerAdapter(tracker);
const generator = new ReportGenerator(adapter);

// Generate a report
const report = await generator.generate({
  type: 'summary',
  format: 'json',
  period: {
    start: new Date('2024-01-01'),
    end: new Date('2024-12-31'),
  },
  includeCharts: true,
  includeAnomalies: true,
  topN: 10,
});

// Format the report
const formatter = new JSONFormatter();
const output = formatter.format(report, config);
console.log(output);
```

## Report Types

### Summary Report

High-level overview of usage with trends and top consumers.

```typescript
const report = await generator.generate({
  type: 'summary',
  format: 'json',
  period: {
    start: new Date('2024-01-01'),
    end: new Date('2024-12-31'),
  },
  includeAnomalies: true,
  topN: 10,
});

// Report includes:
// - overview: Aggregated usage statistics
// - topConsumers: Top 10 users, models, or conversations by cost
// - trends: Cost, token, and request trends with projections
// - anomalies: Unusual patterns detected in the data
```

### Detailed Report

Per-request breakdown with all usage records.

```typescript
const report = await generator.generate({
  type: 'detailed',
  format: 'csv',
  period: {
    start: new Date('2024-01-01'),
    end: new Date('2024-12-31'),
  },
  filter: {
    userId: 'user123', // Optional: filter by user
    model: 'gpt-4',    // Optional: filter by model
  },
});

// Report includes:
// - records: All usage records matching the filter
// - aggregated: Summary statistics for filtered records
```

### Cost Report

Financial analysis with breakdown by model, user, and day.

```typescript
const report = await generator.generate({
  type: 'cost',
  format: 'html',
  period: {
    start: new Date('2024-01-01'),
    end: new Date('2024-12-31'),
  },
  includeCharts: true,
});

// Report includes:
// - totalCost: Total cost for the period
// - breakdown: Cost breakdown by model, user, and day
// - projections: Daily, weekly, and monthly cost forecasts
// - charts: Visual data for charting libraries
```

### Model Comparison Report

Compare performance and costs across different models.

```typescript
const report = await generator.generate({
  type: 'model-comparison',
  format: 'markdown',
  period: {
    start: new Date('2024-01-01'),
    end: new Date('2024-12-31'),
  },
  includeCharts: true,
});

// Report includes:
// - models: Array of model statistics including:
//   - Total cost and average cost per request
//   - Total tokens and average tokens per request
//   - Request count and success rate
//   - Average duration
```

### User Report

Per-user usage statistics.

```typescript
const report = await generator.generate({
  type: 'user',
  format: 'json',
  period: {
    start: new Date('2024-01-01'),
    end: new Date('2024-12-31'),
  },
  includeCharts: true,
});

// Report includes:
// - users: Array of user statistics including:
//   - Total cost and tokens
//   - Request count and average cost per request
//   - Favorite model
//   - Last active date
```

### Trend Report

Usage trends over time with projections.

```typescript
const report = await generator.generate({
  type: 'trend',
  format: 'json',
  period: {
    start: new Date('2024-01-01'),
    end: new Date('2024-12-31'),
  },
  aggregationPeriod: 'daily', // or 'hourly', 'weekly', 'monthly'
  includeCharts: true,
});

// Report includes:
// - trends: Time series data for cost, tokens, requests, and duration
// - analysis: Trend analysis with direction, percentage change, and projections
// - charts: Chart data for visualization
```

## Report Formats

### JSON Format

Structured JSON output for programmatic use.

```typescript
import { JSONFormatter } from '@ainative/ai-kit-core';

const formatter = new JSONFormatter();
const json = formatter.format(report, config);
const parsed = JSON.parse(json);
```

### CSV Format

Tabular CSV output for Excel or spreadsheet applications.

```typescript
import { CSVFormatter } from '@ainative/ai-kit-core';

const formatter = new CSVFormatter();
const csv = formatter.format(report, config);
// Save to file or stream to client
```

### HTML Format

Interactive HTML reports with styling.

```typescript
import { HTMLFormatter } from '@ainative/ai-kit-core';

const formatter = new HTMLFormatter();
const html = formatter.format(report, config);
// Serve as web page or save to file
```

### Markdown Format

Documentation-friendly Markdown output.

```typescript
import { MarkdownFormatter } from '@ainative/ai-kit-core';

const formatter = new MarkdownFormatter();
const markdown = formatter.format(report, config);
// Use in documentation or GitHub
```

## Aggregation Periods

Control how data is grouped over time:

```typescript
const config = {
  type: 'trend',
  format: 'json',
  period: {
    start: new Date('2024-01-01'),
    end: new Date('2024-12-31'),
  },
  aggregationPeriod: 'daily', // Options: 'hourly', 'daily', 'weekly', 'monthly', 'custom'
};
```

- **hourly**: Group by hour
- **daily**: Group by day
- **weekly**: Group by week (Sunday-Saturday)
- **monthly**: Group by month
- **custom**: Use the raw timestamps

## Trend Analysis

The trend analyzer examines usage patterns and provides:

- **Direction**: `increasing`, `decreasing`, or `stable`
- **Percentage Change**: Percentage change between first and second half of period
- **Projection**: Forecast of future value based on trend
- **Confidence**: Confidence level (0-1) based on data quantity

```typescript
const report = await generator.generate({
  type: 'summary',
  // ...
});

console.log(report.trends.cost);
// {
//   direction: 'increasing',
//   percentageChange: 25.5,
//   projection: 150.25,
//   confidence: 0.85
// }
```

## Anomaly Detection

Automatically detects unusual patterns in:

- **Cost**: Unusually high or low costs (> 2 standard deviations)
- **Tokens**: Unexpected token usage
- **Latency**: Performance issues
- **Error Rate**: Higher than normal failure rates

```typescript
const report = await generator.generate({
  type: 'summary',
  includeAnomalies: true,
  // ...
});

report.anomalies.forEach(anomaly => {
  console.log(`${anomaly.type} anomaly at ${anomaly.timestamp}`);
  console.log(`Value: ${anomaly.value}, Expected: ${anomaly.expectedValue}`);
  console.log(`Severity: ${anomaly.severity}`);
});
```

## Top Consumers

Identify who or what is consuming the most resources:

```typescript
const report = await generator.generate({
  type: 'summary',
  topN: 10, // Top 10 consumers
  // ...
});

report.topConsumers.forEach(consumer => {
  console.log(`${consumer.type}: ${consumer.id}`);
  console.log(`Cost: $${consumer.totalCost}`);
  console.log(`Percentage: ${consumer.percentageOfTotal}%`);
});
```

Consumer types include:
- **user**: Top users by cost
- **model**: Top models by cost
- **conversation**: Top conversations by cost

## Cost Projections

Get forecasts for future costs:

```typescript
const report = await generator.generate({
  type: 'cost',
  // ...
});

console.log('Daily projection:', report.projections.daily);
console.log('Weekly projection:', report.projections.weekly);
console.log('Monthly projection:', report.projections.monthly);
```

Projections are based on the average daily cost during the report period.

## Filtering

All reports support filtering to narrow down the data:

```typescript
const report = await generator.generate({
  type: 'detailed',
  period: {
    start: new Date('2024-01-01'),
    end: new Date('2024-12-31'),
  },
  filter: {
    userId: 'user123',           // Filter by user
    conversationId: 'conv456',   // Filter by conversation
    provider: 'openai',          // Filter by provider
    model: 'gpt-4',              // Filter by model
    success: true,               // Filter by success status
  },
});
```

## Chart Data

When `includeCharts: true`, reports include chart-ready data:

```typescript
const report = await generator.generate({
  type: 'cost',
  includeCharts: true,
  // ...
});

report.charts.forEach(chart => {
  console.log(`Chart: ${chart.title}`);
  console.log(`Type: ${chart.type}`); // 'line', 'bar', 'pie', 'area'
  console.log(`X-axis: ${chart.xAxis}`);
  console.log(`Y-axis: ${chart.yAxis}`);
  console.log('Data:', chart.data);
});

// Use with charting libraries like Chart.js, Recharts, etc.
```

## Custom Data Sources

You can implement custom data sources by implementing the `UsageDataSource` interface:

```typescript
import { UsageDataSource, ReportGenerator } from '@ainative/ai-kit-core';

class CustomDataSource implements UsageDataSource {
  async getRecords(filter?: UsageFilter): Promise<UsageRecord[]> {
    // Fetch from your custom storage
    return [];
  }

  async getAggregated(filter?: UsageFilter): Promise<AggregatedUsage> {
    // Return aggregated data
    return {
      // ... aggregation data
    };
  }
}

const dataSource = new CustomDataSource();
const generator = new ReportGenerator(dataSource);
```

## Best Practices

1. **Use Appropriate Report Types**: Choose the right report type for your use case
   - Summary for dashboards
   - Detailed for debugging
   - Cost for financial analysis
   - Trend for monitoring

2. **Set Reasonable Time Periods**: Avoid very large date ranges that may impact performance

3. **Use Filtering**: Filter data to focus on specific users, models, or time periods

4. **Cache Reports**: Cache generated reports for frequently accessed data

5. **Automate Report Generation**: Schedule reports to run periodically

6. **Monitor Trends**: Set up alerts based on trend analysis and anomaly detection

7. **Export for Analysis**: Use CSV format for deeper analysis in spreadsheet tools

## Example: Monthly Cost Report Email

```typescript
import { UsageTracker, ReportGenerator, UsageTrackerAdapter, HTMLFormatter } from '@ainative/ai-kit-core';
import { sendEmail } from './email-service';

async function sendMonthlyCostReport() {
  const tracker = new UsageTracker({ storage: 'file', filePath: './usage.jsonl' });
  const adapter = new UsageTrackerAdapter(tracker);
  const generator = new ReportGenerator(adapter);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const report = await generator.generate({
    type: 'cost',
    format: 'html',
    period: {
      start: startOfMonth,
      end: endOfMonth,
    },
    includeCharts: true,
  });

  const formatter = new HTMLFormatter();
  const html = formatter.format(report, config);

  await sendEmail({
    to: 'team@example.com',
    subject: 'Monthly LLM Cost Report',
    html,
  });
}

// Run monthly
setInterval(sendMonthlyCostReport, 30 * 24 * 60 * 60 * 1000);
```

## API Reference

### ReportGenerator

```typescript
class ReportGenerator {
  constructor(dataSource: UsageDataSource);

  generate(config: ReportConfig): Promise<Report>;
}
```

### ReportConfig

```typescript
interface ReportConfig {
  type: ReportType;
  format: ReportFormat;
  period: {
    start: Date;
    end: Date;
  };
  filter?: UsageFilter;
  aggregationPeriod?: AggregationPeriod;
  includeCharts?: boolean;
  includeAnomalies?: boolean;
  topN?: number;
}
```

### Formatters

```typescript
class JSONFormatter implements ReportFormatter {
  format(report: Report, config: ReportConfig): string;
}

class CSVFormatter implements ReportFormatter {
  format(report: Report, config: ReportConfig): string;
}

class HTMLFormatter implements ReportFormatter {
  format(report: Report, config: ReportConfig): string;
}

class MarkdownFormatter implements ReportFormatter {
  format(report: Report, config: ReportConfig): string;
}
```

## TypeScript Types

All types are fully documented with TypeScript. See:
- `ReportConfig` - Report configuration
- `Report` - Union of all report types
- `SummaryReport`, `DetailedReport`, `CostReport`, etc. - Specific report types
- `TrendAnalysis` - Trend analysis results
- `Anomaly` - Anomaly detection results
- `ChartData` - Chart data format

## See Also

- [Usage Tracking](./usage-tracking.md) - Usage tracking module documentation
- [Cost Management](./cost-management.md) - Cost tracking and alerting
- [Monitoring](./monitoring.md) - Real-time monitoring
