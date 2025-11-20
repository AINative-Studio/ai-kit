# Cost Threshold Alerts

The Alert Manager provides comprehensive cost and usage monitoring with configurable thresholds and multiple notification channels.

## Overview

The Alert Manager monitors your AI Kit usage in real-time and triggers alerts when thresholds are exceeded. It supports multiple threshold types, severity levels, and notification channels with built-in deduplication and rate limiting.

## Features

- **Multiple Threshold Types**: Monitor costs, token usage, request counts, rates, and budget percentages
- **Severity Levels**: INFO (approaching), WARNING (exceeded), CRITICAL (well over), and RECOVERY
- **Alert Channels**: Callbacks, console logging, webhooks, email, and custom handlers
- **Deduplication**: Prevent duplicate alerts within a configurable time window
- **Rate Limiting**: Limit the number of alerts sent within a time period
- **Recovery Notifications**: Get notified when usage returns to normal levels
- **Alert History**: Track all triggered alerts with delivery status

## Installation

```bash
npm install @ainative/ai-kit-core
```

## Basic Usage

```typescript
import { AlertManager, AlertConfig, ThresholdType, ThresholdPeriod, AlertChannel } from '@ainative/ai-kit-core';

// Configure alert manager
const config: AlertConfig = {
  thresholds: [
    {
      id: 'daily-cost',
      type: ThresholdType.COST,
      period: ThresholdPeriod.DAILY,
      value: 100, // $100 per day
      warningLevel: 0.75, // Alert at 75%
      criticalLevel: 1.5, // Critical at 150%
    },
  ],
  channels: [
    {
      type: AlertChannel.CONSOLE,
    },
  ],
};

const alertManager = new AlertManager(config);

// Check usage periodically
const metrics = {
  cost: 85, // Current daily cost
  timestamp: new Date(),
};

const alerts = await alertManager.checkThresholds(metrics);
```

## Threshold Types

### Cost Threshold

Monitor absolute dollar amounts:

```typescript
{
  id: 'monthly-cost',
  type: ThresholdType.COST,
  period: ThresholdPeriod.MONTHLY,
  value: 1000, // $1000 per month
}
```

### Token Usage Threshold

Monitor token consumption:

```typescript
{
  id: 'hourly-tokens',
  type: ThresholdType.TOKEN_USAGE,
  period: ThresholdPeriod.HOURLY,
  value: 100000, // 100K tokens per hour
}
```

### Request Count Threshold

Monitor number of requests:

```typescript
{
  id: 'daily-requests',
  type: ThresholdType.REQUEST_COUNT,
  period: ThresholdPeriod.DAILY,
  value: 10000, // 10K requests per day
}
```

### Rate Threshold

Monitor requests per unit time:

```typescript
{
  id: 'rate-limit',
  type: ThresholdType.RATE,
  period: ThresholdPeriod.MINUTE,
  value: 60, // 60 requests per minute
}
```

### Budget Percentage Threshold

Monitor budget consumption:

```typescript
{
  id: 'budget-alert',
  type: ThresholdType.BUDGET_PERCENTAGE,
  period: ThresholdPeriod.MONTHLY,
  value: 90, // 90% of budget
}
```

## Alert Severity Levels

### INFO (Approaching Threshold)

Triggered when usage reaches the warning level (default 75%):

```typescript
{
  warningLevel: 0.75, // Alert at 75% of threshold
}
```

### WARNING (Threshold Exceeded)

Triggered when usage exceeds 100% of the threshold.

### CRITICAL (Well Over Threshold)

Triggered when usage exceeds the critical level (default 150%):

```typescript
{
  criticalLevel: 1.5, // Critical at 150% of threshold
}
```

### RECOVERY (Returned to Normal)

Triggered when usage returns below the threshold after being in an alert state.

## Alert Channels

### Callback Channel

Execute a custom function when alerts are triggered:

```typescript
{
  type: AlertChannel.CALLBACK,
  callback: async (alert) => {
    console.log(`Alert triggered: ${alert.message}`);
    // Send to your monitoring system
    await sendToMonitoring(alert);
  },
}
```

### Console Channel

Log alerts to the console:

```typescript
{
  type: AlertChannel.CONSOLE,
}
```

### Webhook Channel

Send alerts to an HTTP endpoint:

```typescript
{
  type: AlertChannel.WEBHOOK,
  webhook: {
    url: 'https://your-api.com/alerts',
    method: 'POST',
    headers: {
      'Authorization': 'Bearer your-token',
      'X-API-Key': 'your-api-key',
    },
    timeout: 5000, // 5 seconds
    retries: 3, // Retry 3 times on failure
  },
}
```

### Email Channel

Send email notifications:

```typescript
{
  type: AlertChannel.EMAIL,
  email: {
    to: ['admin@example.com', 'ops@example.com'],
    from: 'alerts@example.com',
    subject: 'AI Kit Alert',
    smtp: {
      host: 'smtp.example.com',
      port: 587,
      secure: true,
      auth: {
        user: 'smtp-user',
        pass: 'smtp-password',
      },
    },
  },
}
```

### Custom Channel

Implement your own alert handler:

```typescript
{
  type: AlertChannel.CUSTOM,
  customHandler: async (alert) => {
    // Custom logic
    await yourCustomAlertSystem.send(alert);
  },
}
```

## Deduplication

Prevent duplicate alerts within a time window:

```typescript
const config: AlertConfig = {
  thresholds: [...],
  channels: [...],
  deduplication: {
    enabled: true,
    windowMs: 300000, // 5 minutes
  },
};
```

When enabled, the same alert (same threshold and severity) will only be sent once within the specified time window.

## Rate Limiting

Limit the total number of alerts sent:

```typescript
const config: AlertConfig = {
  thresholds: [...],
  channels: [...],
  rateLimit: {
    maxAlerts: 10, // Maximum 10 alerts
    periodMs: 60000, // Per minute
  },
};
```

This prevents alert spam by capping the total number of alerts sent within a time period.

## Recovery Notifications

Control whether to send recovery notifications:

```typescript
const config: AlertConfig = {
  thresholds: [...],
  channels: [...],
  sendRecoveryNotifications: true, // Default: true
};
```

When enabled, you'll receive a RECOVERY alert when usage returns to normal after being in an alert state.

## Managing Thresholds

### Add Threshold

```typescript
const newThreshold: Threshold = {
  id: 'new-threshold',
  type: ThresholdType.COST,
  period: ThresholdPeriod.WEEKLY,
  value: 500,
};

alertManager.addThreshold(newThreshold);
```

### Remove Threshold

```typescript
alertManager.removeThreshold('threshold-id');
```

### Update Threshold

```typescript
const updatedThreshold: Threshold = {
  id: 'existing-threshold',
  type: ThresholdType.COST,
  period: ThresholdPeriod.DAILY,
  value: 200, // Updated value
  warningLevel: 0.8, // Updated warning level
};

alertManager.updateThreshold(updatedThreshold);
```

### Get All Thresholds

```typescript
const thresholds = alertManager.getThresholds();
```

## Alert History

### Get History

```typescript
// Get all history
const allHistory = alertManager.getHistory();

// Get last 10 alerts
const recentHistory = alertManager.getHistory(10);
```

### Clear History

```typescript
alertManager.clearHistory();
```

### History Entry Structure

```typescript
interface AlertHistoryEntry {
  alert: Alert;
  channels: AlertChannel[];
  success: boolean;
  error?: string;
}
```

## Complete Example

```typescript
import {
  AlertManager,
  AlertConfig,
  ThresholdType,
  ThresholdPeriod,
  AlertChannel,
  AlertSeverity,
} from '@ainative/ai-kit-core';

// Configure comprehensive alert system
const config: AlertConfig = {
  thresholds: [
    // Daily cost threshold
    {
      id: 'daily-cost',
      type: ThresholdType.COST,
      period: ThresholdPeriod.DAILY,
      value: 100,
      warningLevel: 0.75,
      criticalLevel: 1.5,
    },
    // Hourly token usage
    {
      id: 'hourly-tokens',
      type: ThresholdType.TOKEN_USAGE,
      period: ThresholdPeriod.HOURLY,
      value: 50000,
    },
    // Request rate limiting
    {
      id: 'request-rate',
      type: ThresholdType.RATE,
      period: ThresholdPeriod.MINUTE,
      value: 100,
    },
    // Monthly budget
    {
      id: 'monthly-budget',
      type: ThresholdType.BUDGET_PERCENTAGE,
      period: ThresholdPeriod.MONTHLY,
      value: 90,
    },
  ],
  channels: [
    // Console logging
    {
      type: AlertChannel.CONSOLE,
    },
    // Webhook to monitoring system
    {
      type: AlertChannel.WEBHOOK,
      webhook: {
        url: 'https://monitoring.example.com/alerts',
        headers: {
          'Authorization': 'Bearer token123',
        },
        retries: 3,
      },
    },
    // Email notifications
    {
      type: AlertChannel.EMAIL,
      email: {
        to: ['admin@example.com'],
        from: 'alerts@example.com',
      },
    },
    // Custom callback
    {
      type: AlertChannel.CALLBACK,
      callback: async (alert) => {
        if (alert.severity === AlertSeverity.CRITICAL) {
          // Page on-call engineer
          await pagerDuty.trigger(alert);
        }
      },
    },
  ],
  // Prevent duplicate alerts for 5 minutes
  deduplication: {
    enabled: true,
    windowMs: 300000,
  },
  // Limit to 20 alerts per minute
  rateLimit: {
    maxAlerts: 20,
    periodMs: 60000,
  },
  // Send recovery notifications
  sendRecoveryNotifications: true,
};

// Initialize alert manager
const alertManager = new AlertManager(config);

// Monitor usage (call this periodically, e.g., every minute)
async function monitorUsage() {
  const metrics = {
    cost: 85, // Current cost in dollars
    tokens: 45000, // Current token count
    requests: 950, // Current request count
    rate: 95, // Current rate (requests/minute)
    budgetPercentage: 88, // Current budget percentage
    timestamp: new Date(),
  };

  const alerts = await alertManager.checkThresholds(metrics);

  if (alerts.length > 0) {
    console.log(`${alerts.length} alerts triggered`);
    for (const alert of alerts) {
      console.log(`- ${alert.severity}: ${alert.message}`);
    }
  }
}

// Run monitoring every minute
setInterval(monitorUsage, 60000);

// View alert history
const history = alertManager.getHistory(10);
console.log('Recent alerts:', history);
```

## Best Practices

### 1. Set Appropriate Warning Levels

Configure warning levels to give yourself time to react:

```typescript
{
  warningLevel: 0.75, // Alert at 75%
  criticalLevel: 1.5, // Critical at 150%
}
```

### 2. Use Multiple Channels

Configure multiple channels for redundancy:

```typescript
channels: [
  { type: AlertChannel.CONSOLE },
  { type: AlertChannel.WEBHOOK, webhook: {...} },
  { type: AlertChannel.EMAIL, email: {...} },
]
```

### 3. Enable Deduplication

Prevent alert fatigue with deduplication:

```typescript
deduplication: {
  enabled: true,
  windowMs: 300000, // 5 minutes
}
```

### 4. Monitor Multiple Periods

Set thresholds for different time periods:

```typescript
[
  { period: ThresholdPeriod.HOURLY, value: 10 },
  { period: ThresholdPeriod.DAILY, value: 100 },
  { period: ThresholdPeriod.MONTHLY, value: 2000 },
]
```

### 5. Disable Thresholds Temporarily

Use the `enabled` flag to temporarily disable thresholds:

```typescript
{
  id: 'test-threshold',
  enabled: false, // Temporarily disabled
  ...
}
```

### 6. Monitor Alert History

Regularly check alert history to identify patterns:

```typescript
const history = alertManager.getHistory();
const criticalAlerts = history.filter(
  h => h.alert.severity === AlertSeverity.CRITICAL
);
```

### 7. Implement Graceful Degradation

In your callback, implement fallback behavior:

```typescript
{
  type: AlertChannel.CALLBACK,
  callback: async (alert) => {
    if (alert.severity === AlertSeverity.CRITICAL) {
      // Pause non-critical operations
      await pauseNonCriticalTasks();
    }
  },
}
```

### 8. Test Your Alerts

Verify alerts are working before going to production:

```typescript
// Test with low threshold
const testConfig: AlertConfig = {
  thresholds: [
    {
      id: 'test',
      type: ThresholdType.COST,
      period: ThresholdPeriod.DAILY,
      value: 0.01, // Very low threshold for testing
    },
  ],
  channels: [...],
};
```

## Integration with Usage Tracking

Combine with UsageTracker for comprehensive monitoring:

```typescript
import { UsageTracker } from '@ainative/ai-kit-core';

// Track usage
const tracker = new UsageTracker();
tracker.trackUsage({
  model: 'gpt-4',
  promptTokens: 100,
  completionTokens: 50,
  cost: 0.05,
});

// Get metrics
const dailyMetrics = tracker.getUsage('daily');

// Check against thresholds
const alerts = await alertManager.checkThresholds({
  cost: dailyMetrics.totalCost,
  tokens: dailyMetrics.totalTokens,
  requests: dailyMetrics.requestCount,
  timestamp: new Date(),
});
```

## Troubleshooting

### Alerts Not Triggering

1. Check threshold is enabled: `threshold.enabled !== false`
2. Verify metrics match threshold type
3. Check if rate limited or deduplicated
4. Review alert history for errors

### Too Many Alerts

1. Adjust warning/critical levels
2. Enable or tune deduplication
3. Implement rate limiting
4. Increase threshold values

### Webhook Failures

1. Check URL is accessible
2. Verify authentication headers
3. Review timeout settings
4. Check alert history for error messages

### Missing Recovery Alerts

1. Ensure `sendRecoveryNotifications: true`
2. Verify threshold was in alert state
3. Check deduplication settings

## API Reference

See the [Type Definitions](../../packages/core/src/alerts/types.ts) for complete API documentation.

## License

MIT
