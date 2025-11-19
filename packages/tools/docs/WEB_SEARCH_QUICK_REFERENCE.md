# Web Search Tool - Quick Reference

## Installation

```bash
pnpm add @ainative/ai-kit-tools
```

## Basic Usage

```typescript
import { createWebSearchTool } from '@ainative/ai-kit-tools';

const tool = createWebSearchTool({
  provider: 'brave',
  apiKey: process.env.BRAVE_API_KEY!,
});

const result = await tool.execute({
  query: 'your search query',
  maxResults: 10,
});
```

## Configuration Options

```typescript
{
  provider: 'brave',           // Required: Search provider
  apiKey: string,              // Required: API key
  maxResults?: number,         // Optional: Default 10
  timeoutMs?: number,          // Optional: Default 10000
  endpoint?: string,           // Optional: Custom endpoint
  rateLimit?: {
    requestsPerMinute?: number,  // Optional: Default 60
    requestsPerDay?: number,     // Optional: Default 1000
  }
}
```

## Response Structure

```typescript
{
  query: string,
  results: Array<{
    title: string,
    url: string,
    snippet: string,
    thumbnail?: string,
    publishedDate?: string,
  }>,
  provider: string,
  metadata: {
    durationMs: number,
    timestamp: string,
    rateLimit?: {
      remaining: number,
      reset: number,
    }
  }
}
```

## Error Handling

```typescript
import {
  RateLimitError,
  InvalidAPIKeyError,
  WebSearchError
} from '@ainative/ai-kit-tools';

try {
  const result = await tool.execute({ query: 'test' });
} catch (error) {
  if (error instanceof RateLimitError) {
    // Rate limited - retry after error.resetAt
  } else if (error instanceof InvalidAPIKeyError) {
    // Invalid API key
  } else if (error instanceof WebSearchError) {
    // General search error - check error.retryable
  }
}
```

## Environment Setup

```bash
# .env
BRAVE_API_KEY=your_api_key_here
```

Get your API key: https://brave.com/search/api/

## Common Patterns

### With Agent
```typescript
import { Agent } from '@ainative/ai-kit-core';
import { createWebSearchTool } from '@ainative/ai-kit-tools';

const agent = new Agent({
  // ... config
  tools: [createWebSearchTool({
    provider: 'brave',
    apiKey: process.env.BRAVE_API_KEY!
  })],
});
```

### Direct Client
```typescript
import { WebSearchClient } from '@ainative/ai-kit-tools';

const client = new WebSearchClient({
  provider: 'brave',
  apiKey: process.env.BRAVE_API_KEY!,
});

const response = await client.search('query');
```

### Custom Rate Limits
```typescript
createWebSearchTool({
  provider: 'brave',
  apiKey: process.env.BRAVE_API_KEY!,
  rateLimit: {
    requestsPerMinute: 30,
    requestsPerDay: 500,
  },
});
```

## Testing

```bash
# Run tests
cd packages/tools
pnpm test web-search

# With coverage
pnpm test:coverage
```

## Links

- Full Documentation: `./WEB_SEARCH_USAGE.md`
- Package README: `../README.md`
- API Reference: https://brave.com/search/api/
