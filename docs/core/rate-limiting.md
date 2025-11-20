# Rate Limiting

The AI Kit Rate Limiter provides flexible, multi-algorithm rate limiting to control LLM API usage and prevent abuse. It supports multiple storage backends, various limiting strategies, and comprehensive cost tracking.

## Features

- **Multiple Algorithms**: Token bucket, fixed window, sliding window, leaky bucket, and cost-based limiting
- **Flexible Scopes**: Per-user, per-IP, per-API-key, and global rate limits
- **Time Windows**: Support for second, minute, hour, and day windows
- **Cost Tracking**: Track usage by tokens, dollars, or custom metrics
- **Storage Backends**: In-memory (default) and Redis (planned)
- **Configurable Actions**: Reject, queue, or warn when limits are exceeded
- **Burst Support**: Allow temporary bursts while maintaining average rates
- **Statistics**: Track allowed, blocked, and queued requests

## Installation

The rate limiter is part of the `@ainative/ai-kit-core` package:

```bash
npm install @ainative/ai-kit-core
```

## Quick Start

```typescript
import { RateLimiter, RateLimitAlgorithm, RateLimitScope, TimeWindow } from '@ainative/ai-kit-core';

// Create a rate limiter
const limiter = new RateLimiter({
  rules: {
    [RateLimitScope.USER]: [
      {
        algorithm: RateLimitAlgorithm.TOKEN_BUCKET,
        limit: 100,
        window: TimeWindow.MINUTE,
        burst: 150,
      },
    ],
  },
});

// Check if a request is allowed
const result = await limiter.check({
  identifier: 'user123',
  scope: RateLimitScope.USER,
});

if (result.allowed) {
  // Process the request
  console.log(`Request allowed. Remaining: ${result.remaining}`);
} else {
  // Reject the request
  console.log(`Rate limited. Retry after: ${result.retryAfter}ms`);
}
```

## Rate Limiting Algorithms

### Token Bucket

**Best for**: Smooth rate limiting with burst capacity

The token bucket algorithm allows requests as long as there are tokens in the bucket. Tokens are added at a constant rate (refill rate), and each request consumes tokens. This allows for temporary bursts while maintaining an average rate.

**Characteristics**:
- Allows bursts up to bucket capacity
- Smooth refilling over time
- Good for APIs with variable load
- Prevents sustained abuse while allowing occasional spikes

**Configuration**:
```typescript
{
  algorithm: RateLimitAlgorithm.TOKEN_BUCKET,
  limit: 100,        // Steady-state rate (tokens per window)
  window: TimeWindow.MINUTE,
  burst: 150,        // Maximum burst capacity
  refillRate: 100,   // Tokens per second (optional, defaults to limit/window)
}
```

**Example**:
```typescript
const limiter = new RateLimiter({
  rules: {
    [RateLimitScope.USER]: [
      {
        algorithm: RateLimitAlgorithm.TOKEN_BUCKET,
        limit: 100,
        window: TimeWindow.MINUTE,
        burst: 150,
        refillRate: 1.67, // ~100 per minute
      },
    ],
  },
});

// User can make up to 150 requests instantly (burst)
// Then limited to ~100 per minute
```

### Fixed Window

**Best for**: Simple, predictable rate limits

Fixed window counting divides time into fixed windows and counts requests in each window. Limits reset at window boundaries.

**Characteristics**:
- Simple and predictable
- Low memory usage
- Can allow up to 2x limit at window boundaries
- Good for APIs with predictable traffic

**Configuration**:
```typescript
{
  algorithm: RateLimitAlgorithm.FIXED_WINDOW,
  limit: 100,
  window: TimeWindow.MINUTE,
}
```

**Example**:
```typescript
const limiter = new RateLimiter({
  rules: {
    [RateLimitScope.USER]: [
      {
        algorithm: RateLimitAlgorithm.FIXED_WINDOW,
        limit: 100,
        window: TimeWindow.MINUTE,
      },
    ],
  },
});

// User can make 100 requests per minute
// Counter resets at the minute boundary
```

### Sliding Window Log

**Best for**: Precise rate limiting

Sliding window maintains a log of request timestamps and counts requests within a sliding time window. This provides the most accurate rate limiting but uses more memory.

**Characteristics**:
- Most accurate rate limiting
- No boundary effects
- Higher memory usage
- Best for critical APIs requiring precise limits

**Configuration**:
```typescript
{
  algorithm: RateLimitAlgorithm.SLIDING_WINDOW,
  limit: 100,
  window: TimeWindow.MINUTE,
}
```

**Example**:
```typescript
const limiter = new RateLimiter({
  rules: {
    [RateLimitScope.USER]: [
      {
        algorithm: RateLimitAlgorithm.SLIDING_WINDOW,
        limit: 100,
        window: TimeWindow.MINUTE,
      },
    ],
  },
});

// Precisely 100 requests in any 60-second period
// No boundary effects
```

### Leaky Bucket

**Best for**: Consistent output rate

Leaky bucket processes requests at a constant rate, regardless of input rate. Excess requests are queued or rejected.

**Characteristics**:
- Constant output rate
- Smooths traffic spikes
- Good for downstream rate limiting
- Can queue requests for later processing

**Configuration**:
```typescript
{
  algorithm: RateLimitAlgorithm.LEAKY_BUCKET,
  limit: 100,        // Bucket capacity
  window: TimeWindow.MINUTE,
  refillRate: 1.67,  // Process 1.67 requests per second
}
```

**Example**:
```typescript
const limiter = new RateLimiter({
  rules: {
    [RateLimitScope.USER]: [
      {
        algorithm: RateLimitAlgorithm.LEAKY_BUCKET,
        limit: 100,
        window: TimeWindow.MINUTE,
        refillRate: 1.67,
      },
    ],
  },
});

// Processes requests at ~1.67 per second
// Bucket can hold up to 100 pending requests
```

### Cost-Based

**Best for**: Token or dollar-based limiting

Cost-based limiting tracks usage by cost (tokens, dollars, API calls, etc.) rather than request count. Perfect for LLM APIs where different requests have different costs.

**Characteristics**:
- Tracks actual resource usage
- Flexible cost metrics
- Ideal for LLM token limits
- Supports monetary budgets

**Configuration**:
```typescript
{
  algorithm: RateLimitAlgorithm.COST_BASED,
  limit: 1000000,    // 1M tokens
  window: TimeWindow.DAY,
  costPerRequest: 100, // Default cost if not specified
}
```

**Example**:
```typescript
const limiter = new RateLimiter({
  rules: {
    [RateLimitScope.USER]: [
      {
        algorithm: RateLimitAlgorithm.COST_BASED,
        limit: 1000000, // 1M tokens per day
        window: TimeWindow.DAY,
      },
    ],
  },
});

// Check with actual token usage
const result = await limiter.check({
  identifier: 'user123',
  scope: RateLimitScope.USER,
  cost: {
    totalTokens: 1500,
    inputTokens: 1000,
    outputTokens: 500,
  },
});

console.log(`Cost consumed: ${result.costConsumed}`);
console.log(`Remaining: ${result.remaining} tokens`);
```

## Algorithm Comparison

| Algorithm | Accuracy | Memory | Bursts | Use Case |
|-----------|----------|--------|--------|----------|
| **Token Bucket** | Good | Low | Yes | Variable load APIs |
| **Fixed Window** | Fair | Lowest | No* | Simple rate limits |
| **Sliding Window** | Excellent | High | No | Precise limiting |
| **Leaky Bucket** | Good | Low | Queue | Smooth traffic |
| **Cost-Based** | Good | Low | No | Resource tracking |

\* Can allow 2x at boundaries

## Rate Limit Scopes

### User Scope

Limit requests per user (by user ID):

```typescript
const result = await limiter.check({
  identifier: 'user123',
  scope: RateLimitScope.USER,
});
```

### IP Scope

Limit requests per IP address:

```typescript
const result = await limiter.check({
  identifier: '192.168.1.1',
  scope: RateLimitScope.IP,
});
```

### API Key Scope

Limit requests per API key:

```typescript
const result = await limiter.check({
  identifier: 'api_key_abc123',
  scope: RateLimitScope.API_KEY,
});
```

### Global Scope

Global rate limit across all users:

```typescript
const result = await limiter.check({
  identifier: 'global',
  scope: RateLimitScope.GLOBAL,
});
```

## Multiple Rules

You can apply multiple rate limiting rules to the same scope:

```typescript
const limiter = new RateLimiter({
  rules: {
    [RateLimitScope.USER]: [
      // Per-second limit
      {
        algorithm: RateLimitAlgorithm.FIXED_WINDOW,
        limit: 10,
        window: TimeWindow.SECOND,
      },
      // Per-minute limit
      {
        algorithm: RateLimitAlgorithm.FIXED_WINDOW,
        limit: 100,
        window: TimeWindow.MINUTE,
      },
      // Per-day cost limit
      {
        algorithm: RateLimitAlgorithm.COST_BASED,
        limit: 1000000, // 1M tokens
        window: TimeWindow.DAY,
      },
    ],
  },
});
```

The rate limiter will check all rules and return the most restrictive result.

## Rate Limit Actions

Configure what happens when a limit is exceeded:

```typescript
{
  algorithm: RateLimitAlgorithm.FIXED_WINDOW,
  limit: 100,
  window: TimeWindow.MINUTE,
  action: RateLimitAction.REJECT, // or QUEUE, WARN
}
```

**Actions**:
- `REJECT`: Block the request (default)
- `QUEUE`: Queue for later processing
- `WARN`: Allow but flag as warning

## Cost Tracking

Track LLM API costs with flexible metrics:

### Token-Based Cost

```typescript
const result = await limiter.check({
  identifier: 'user123',
  scope: RateLimitScope.USER,
  cost: {
    inputTokens: 1000,
    outputTokens: 500,
    totalTokens: 1500,
  },
});
```

### Monetary Cost

```typescript
const result = await limiter.check({
  identifier: 'user123',
  scope: RateLimitScope.USER,
  cost: {
    cost: 0.015, // $0.015
  },
});
```

### Custom Cost

```typescript
const result = await limiter.check({
  identifier: 'user123',
  scope: RateLimitScope.USER,
  cost: {
    customCost: 42, // Custom metric
  },
});
```

## Storage Backends

### In-Memory (Default)

Fast, built-in storage. Good for single-server deployments:

```typescript
const limiter = new RateLimiter({
  storage: StorageBackend.MEMORY,
  rules: { /* ... */ },
});
```

**Pros**:
- Fast
- No external dependencies
- Easy to use

**Cons**:
- Not distributed
- Data lost on restart
- Memory usage grows with users

### Redis (Planned)

Distributed storage for multi-server deployments:

```typescript
const limiter = new RateLimiter({
  storage: StorageBackend.REDIS,
  redis: {
    host: 'localhost',
    port: 6379,
    password: 'your-password',
    db: 0,
  },
  rules: { /* ... */ },
});
```

**Pros**:
- Distributed
- Persists across restarts
- Scales horizontally

**Cons**:
- Requires Redis server
- Network latency
- Additional complexity

## Utility Methods

### Reset Rate Limits

Reset rate limits for a specific identifier:

```typescript
await limiter.reset(RateLimitScope.USER, 'user123');
```

### Get Remaining Limit

Check remaining limit without consuming:

```typescript
const remaining = await limiter.getRemaining(
  RateLimitScope.USER,
  'user123',
  RateLimitAlgorithm.FIXED_WINDOW
);

console.log(`User has ${remaining} requests remaining`);
```

### Get Statistics

Track rate limiter performance:

```typescript
const stats = limiter.getStats();

console.log(`Total requests: ${stats.totalRequests}`);
console.log(`Allowed: ${stats.allowed}`);
console.log(`Blocked: ${stats.blocked}`);
console.log(`Queued: ${stats.queued}`);
```

### Reset Statistics

```typescript
limiter.resetStats();
```

### Cleanup

Clean up resources when done:

```typescript
await limiter.close();
```

## Integration Examples

### Express.js Middleware

```typescript
import express from 'express';
import { RateLimiter, RateLimitScope } from '@ainative/ai-kit-core';

const limiter = new RateLimiter({
  rules: {
    [RateLimitScope.IP]: [
      {
        algorithm: RateLimitAlgorithm.TOKEN_BUCKET,
        limit: 100,
        window: TimeWindow.MINUTE,
        burst: 120,
      },
    ],
  },
});

const rateLimitMiddleware = async (req, res, next) => {
  const result = await limiter.check({
    identifier: req.ip,
    scope: RateLimitScope.IP,
  });

  // Set rate limit headers
  res.set({
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.resetAt).toISOString(),
  });

  if (!result.allowed) {
    res.set('Retry-After', Math.ceil(result.retryAfter! / 1000).toString());
    return res.status(429).json({
      error: 'Too many requests',
      retryAfter: result.retryAfter,
    });
  }

  next();
};

app.use(rateLimitMiddleware);
```

### LLM API Wrapper

```typescript
import { OpenAI } from 'openai';
import { RateLimiter, RateLimitScope, RateLimitAlgorithm } from '@ainative/ai-kit-core';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const limiter = new RateLimiter({
  rules: {
    [RateLimitScope.USER]: [
      {
        algorithm: RateLimitAlgorithm.COST_BASED,
        limit: 1000000, // 1M tokens per day
        window: TimeWindow.DAY,
      },
    ],
  },
});

async function chat(userId: string, messages: any[]) {
  // Estimate token usage (simplified)
  const estimatedTokens = messages.reduce((sum, msg) =>
    sum + msg.content.length / 4, 0
  );

  // Check rate limit
  const rateLimit = await limiter.check({
    identifier: userId,
    scope: RateLimitScope.USER,
    cost: { totalTokens: estimatedTokens },
  });

  if (!rateLimit.allowed) {
    throw new Error(`Rate limit exceeded. Retry after ${rateLimit.retryAfter}ms`);
  }

  // Make API call
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages,
  });

  // Update with actual usage
  await limiter.check({
    identifier: userId,
    scope: RateLimitScope.USER,
    cost: {
      totalTokens: response.usage?.total_tokens || 0,
      inputTokens: response.usage?.prompt_tokens || 0,
      outputTokens: response.usage?.completion_tokens || 0,
    },
  });

  return response;
}
```

### Multi-Tier Rate Limiting

```typescript
enum UserTier {
  FREE = 'free',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}

const limiters = {
  [UserTier.FREE]: new RateLimiter({
    rules: {
      [RateLimitScope.USER]: [
        {
          algorithm: RateLimitAlgorithm.COST_BASED,
          limit: 10000, // 10K tokens per day
          window: TimeWindow.DAY,
        },
      ],
    },
  }),
  [UserTier.PRO]: new RateLimiter({
    rules: {
      [RateLimitScope.USER]: [
        {
          algorithm: RateLimitAlgorithm.COST_BASED,
          limit: 1000000, // 1M tokens per day
          window: TimeWindow.DAY,
        },
      ],
    },
  }),
  [UserTier.ENTERPRISE]: new RateLimiter({
    rules: {
      [RateLimitScope.USER]: [
        {
          algorithm: RateLimitAlgorithm.COST_BASED,
          limit: 10000000, // 10M tokens per day
          window: TimeWindow.DAY,
        },
      ],
    },
  }),
};

async function checkUserRateLimit(userId: string, userTier: UserTier, cost: number) {
  const limiter = limiters[userTier];
  return await limiter.check({
    identifier: userId,
    scope: RateLimitScope.USER,
    cost: { totalTokens: cost },
  });
}
```

## Best Practices

### 1. Choose the Right Algorithm

- **Token Bucket**: Most versatile, good default choice
- **Fixed Window**: Simplest, best for basic limits
- **Sliding Window**: Most accurate, use when precision matters
- **Leaky Bucket**: Best for smoothing traffic
- **Cost-Based**: Essential for LLM APIs

### 2. Set Appropriate Limits

```typescript
// Too restrictive
limit: 1, window: TimeWindow.MINUTE // Only 1 request per minute

// Better
limit: 60, window: TimeWindow.MINUTE // 1 request per second on average

// With burst
limit: 60, window: TimeWindow.MINUTE, burst: 100 // Allow bursts
```

### 3. Use Multiple Rules

Combine different time windows for better protection:

```typescript
rules: {
  [RateLimitScope.USER]: [
    { algorithm: RateLimitAlgorithm.TOKEN_BUCKET, limit: 10, window: TimeWindow.SECOND },
    { algorithm: RateLimitAlgorithm.FIXED_WINDOW, limit: 600, window: TimeWindow.MINUTE },
    { algorithm: RateLimitAlgorithm.COST_BASED, limit: 1000000, window: TimeWindow.DAY },
  ],
}
```

### 4. Provide Clear Error Messages

```typescript
if (!result.allowed) {
  throw new Error(
    `Rate limit exceeded. You have made ${result.totalRequests} requests. ` +
    `Limit is ${result.limit}. Please retry after ${Math.ceil(result.retryAfter! / 1000)} seconds.`
  );
}
```

### 5. Log Rate Limit Events

```typescript
const result = await limiter.check(options);

if (!result.allowed) {
  console.warn('Rate limit exceeded', {
    identifier: options.identifier,
    scope: options.scope,
    limit: result.limit,
    remaining: result.remaining,
    retryAfter: result.retryAfter,
  });
}
```

### 6. Monitor Statistics

```typescript
setInterval(() => {
  const stats = limiter.getStats();
  console.log('Rate limiter stats:', stats);

  if (stats.blocked / stats.totalRequests > 0.1) {
    console.warn('High rate limit rejection rate:', stats);
  }
}, 60000); // Check every minute
```

### 7. Handle Gracefully

```typescript
try {
  const result = await limiter.check(options);

  if (!result.allowed) {
    // Option 1: Return error to user
    return { error: 'Rate limit exceeded', retryAfter: result.retryAfter };

    // Option 2: Queue for later
    await queue.add({ userId, request }, { delay: result.retryAfter });

    // Option 3: Use fallback
    return await fallbackHandler(request);
  }

  return await processRequest(request);
} catch (error) {
  console.error('Rate limiter error:', error);
  // Fail open or closed based on your requirements
  return await processRequest(request); // Fail open
}
```

## Configuration Examples

### Basic API Rate Limiting

```typescript
const limiter = new RateLimiter({
  rules: {
    [RateLimitScope.IP]: [
      {
        algorithm: RateLimitAlgorithm.FIXED_WINDOW,
        limit: 100,
        window: TimeWindow.MINUTE,
      },
    ],
  },
});
```

### LLM Token Limiting

```typescript
const limiter = new RateLimiter({
  rules: {
    [RateLimitScope.USER]: [
      {
        algorithm: RateLimitAlgorithm.COST_BASED,
        limit: 1000000, // 1M tokens per day
        window: TimeWindow.DAY,
      },
    ],
  },
});
```

### Multi-Level Protection

```typescript
const limiter = new RateLimiter({
  rules: {
    [RateLimitScope.IP]: [
      {
        algorithm: RateLimitAlgorithm.TOKEN_BUCKET,
        limit: 10,
        window: TimeWindow.SECOND,
        burst: 20,
      },
    ],
    [RateLimitScope.USER]: [
      {
        algorithm: RateLimitAlgorithm.SLIDING_WINDOW,
        limit: 1000,
        window: TimeWindow.HOUR,
      },
    ],
    [RateLimitScope.GLOBAL]: [
      {
        algorithm: RateLimitAlgorithm.LEAKY_BUCKET,
        limit: 10000,
        window: TimeWindow.MINUTE,
        refillRate: 166.67, // ~10K per minute
      },
    ],
  },
});
```

## Troubleshooting

### Memory Usage Growing

If using in-memory storage with many users:

```typescript
// Use shorter windows
window: TimeWindow.MINUTE // Instead of TimeWindow.DAY

// Or switch to Redis (when available)
storage: StorageBackend.REDIS
```

### Rate Limits Not Resetting

Ensure you're using the correct time window:

```typescript
// This resets every second
window: TimeWindow.SECOND

// This resets every hour
window: TimeWindow.HOUR
```

### Bursts Not Working

Make sure you're using token bucket with burst configured:

```typescript
{
  algorithm: RateLimitAlgorithm.TOKEN_BUCKET,
  limit: 100,
  window: TimeWindow.MINUTE,
  burst: 150, // Must specify burst capacity
}
```

### Cost Not Tracked

Ensure you're passing cost information:

```typescript
await limiter.check({
  identifier: 'user123',
  scope: RateLimitScope.USER,
  cost: { totalTokens: 1500 }, // Must provide cost
});
```

## API Reference

See the [types.ts](../../packages/core/src/utils/types.ts) file for complete type definitions.

### Main Classes

- `RateLimiter`: Main rate limiter class
- `MemoryStorage`: In-memory storage backend
- `RedisStorage`: Redis storage backend (planned)

### Enums

- `RateLimitAlgorithm`: Available algorithms
- `RateLimitScope`: Rate limit scopes
- `RateLimitAction`: Actions when limit exceeded
- `TimeWindow`: Common time windows
- `StorageBackend`: Storage backend types

### Interfaces

- `RateLimiterConfig`: Rate limiter configuration
- `RateLimitRule`: Individual rate limit rule
- `RateLimitCheckOptions`: Options for checking rate limits
- `RateLimitResult`: Result of rate limit check
- `RequestCost`: Cost information for a request
- `RateLimiterStats`: Statistics tracking

## Contributing

To add new algorithms or features:

1. Update types in `types.ts`
2. Implement algorithm in `RateLimiter.ts`
3. Add comprehensive tests
4. Update documentation
5. Submit PR

## License

MIT
