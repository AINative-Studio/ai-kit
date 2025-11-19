# Web Search Tool - Usage Guide

The Web Search Tool provides AI agents with the ability to search the web using the Brave Search API. It returns structured results with titles, URLs, and snippets, making it easy for agents to find and use current information from the internet.

## Features

- **Multiple Provider Support**: Currently supports Brave Search API (Google and Bing coming soon)
- **Structured Results**: Returns clean, typed results with title, URL, snippet, and optional metadata
- **Rate Limiting**: Built-in token bucket rate limiter to prevent API quota exhaustion
- **Error Handling**: Comprehensive error handling with specific error types
- **Type-Safe**: Full TypeScript support with Zod schemas for validation
- **Retry Logic**: Configurable retry mechanism for transient failures
- **Timeout Protection**: Configurable timeouts to prevent hanging requests

## Installation

The tool is part of the `@ainative/ai-kit-tools` package:

```bash
npm install @ainative/ai-kit-tools
# or
pnpm add @ainative/ai-kit-tools
# or
yarn add @ainative/ai-kit-tools
```

## Quick Start

### Basic Usage

```typescript
import { createWebSearchTool } from '@ainative/ai-kit-tools';

// Create the tool with your Brave Search API key
const webSearchTool = createWebSearchTool({
  provider: 'brave',
  apiKey: process.env.BRAVE_API_KEY!,
});

// Use the tool in your agent
const result = await webSearchTool.execute({
  query: 'latest AI developments 2025',
  maxResults: 10,
});

console.log(result.results);
// [
//   {
//     title: "AI Breakthroughs in 2025",
//     url: "https://example.com/ai-2025",
//     snippet: "The latest developments in artificial intelligence...",
//     thumbnail: "https://example.com/thumb.jpg",
//     publishedDate: "2 days ago"
//   },
//   ...
// ]
```

### Using with Agent

```typescript
import { Agent } from '@ainative/ai-kit-core';
import { createWebSearchTool } from '@ainative/ai-kit-tools';

const agent = new Agent({
  id: 'research-agent',
  name: 'Research Agent',
  systemPrompt: 'You are a research assistant that can search the web for information.',
  llm: {
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
    apiKey: process.env.ANTHROPIC_API_KEY!,
  },
  tools: [
    createWebSearchTool({
      provider: 'brave',
      apiKey: process.env.BRAVE_API_KEY!,
      maxResults: 5,
    }),
  ],
});

// The agent can now use web search automatically
const response = await agent.execute('What are the latest climate change findings?');
```

## Configuration

### WebSearchConfig

```typescript
interface WebSearchConfig {
  // Search provider to use (currently only 'brave' is fully implemented)
  provider: 'brave' | 'google' | 'bing';

  // API key for the search provider
  apiKey: string;

  // Maximum number of results to return (default: 10)
  maxResults?: number;

  // Rate limit configuration
  rateLimit?: {
    // Maximum requests per minute (default: 60)
    requestsPerMinute?: number;

    // Maximum requests per day (default: 1000)
    requestsPerDay?: number;
  };

  // Request timeout in milliseconds (default: 10000)
  timeoutMs?: number;

  // Custom endpoint URL (for testing or custom providers)
  endpoint?: string;
}
```

### Examples

#### With Custom Rate Limits

```typescript
const webSearchTool = createWebSearchTool({
  provider: 'brave',
  apiKey: process.env.BRAVE_API_KEY!,
  rateLimit: {
    requestsPerMinute: 30,  // Limit to 30 requests per minute
    requestsPerDay: 500,     // Limit to 500 requests per day
  },
});
```

#### With Custom Timeout

```typescript
const webSearchTool = createWebSearchTool({
  provider: 'brave',
  apiKey: process.env.BRAVE_API_KEY!,
  timeoutMs: 5000,  // 5 second timeout
});
```

#### For Testing with Mock Endpoint

```typescript
const webSearchTool = createWebSearchTool({
  provider: 'brave',
  apiKey: 'test-key',
  endpoint: 'http://localhost:3000/mock-search',
});
```

## API Reference

### createWebSearchTool(config)

Creates a web search tool for use in AI agents.

**Parameters:**
- `config: WebSearchConfig` - Configuration options

**Returns:**
- `ToolDefinition<WebSearchParams, WebSearchResponse>` - A tool definition compatible with the AI Kit agent system

### WebSearchClient

For direct usage without the agent framework:

```typescript
import { WebSearchClient } from '@ainative/ai-kit-tools';

const client = new WebSearchClient({
  provider: 'brave',
  apiKey: process.env.BRAVE_API_KEY!,
});

const response = await client.search('AI developments', { maxResults: 5 });
```

**Methods:**

- `search(query: string, options?: { maxResults?: number }): Promise<WebSearchResponse>`
  - Perform a web search

- `getRequestCount(): number`
  - Get the current request count

- `resetRequestCount(): void`
  - Reset the request counter (useful for testing)

## Response Format

### WebSearchResponse

```typescript
interface WebSearchResponse {
  // The search query that was executed
  query: string;

  // Array of search results
  results: SearchResult[];

  // Total number of results available (if provided by API)
  totalResults?: number;

  // Search provider used
  provider: string;

  // Metadata about the search
  metadata: {
    // Time taken for the search in milliseconds
    durationMs: number;

    // Timestamp of the search
    timestamp: string;

    // Whether results were cached
    cached?: boolean;

    // Rate limit information
    rateLimit?: {
      remaining: number;  // Remaining requests
      reset: number;      // Reset time (Unix timestamp)
    };
  };
}
```

### SearchResult

```typescript
interface SearchResult {
  // Title of the search result
  title: string;

  // URL of the search result
  url: string;

  // Text snippet/description from the page
  snippet: string;

  // Optional thumbnail image URL
  thumbnail?: string;

  // Optional publication/last modified date
  publishedDate?: string;

  // Optional relevance score (0-1)
  score?: number;
}
```

## Error Handling

The tool provides specific error classes for different failure scenarios:

### WebSearchError

Base error class for all search errors.

```typescript
try {
  await webSearchTool.execute({ query: 'test' });
} catch (error) {
  if (error instanceof WebSearchError) {
    console.log('Error code:', error.code);
    console.log('Provider:', error.provider);
    console.log('Status code:', error.statusCode);
    console.log('Retryable:', error.retryable);
  }
}
```

### RateLimitError

Thrown when rate limits are exceeded.

```typescript
try {
  await webSearchTool.execute({ query: 'test' });
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log('Rate limited. Reset at:', new Date(error.resetAt));
  }
}
```

### InvalidAPIKeyError

Thrown when the API key is invalid or unauthorized.

```typescript
try {
  await webSearchTool.execute({ query: 'test' });
} catch (error) {
  if (error instanceof InvalidAPIKeyError) {
    console.log('Invalid API key for provider:', error.provider);
  }
}
```

## Setting Up Brave Search API

### 1. Get an API Key

1. Go to [Brave Search API](https://brave.com/search/api/)
2. Sign up for an account
3. Subscribe to a plan (Free tier available with 2,000 queries/month)
4. Get your API key from the dashboard

### 2. Configure Environment

Add your API key to your environment variables:

```bash
# .env
BRAVE_API_KEY=your_api_key_here
```

### 3. Use in Your Application

```typescript
import { createWebSearchTool } from '@ainative/ai-kit-tools';

const webSearchTool = createWebSearchTool({
  provider: 'brave',
  apiKey: process.env.BRAVE_API_KEY!,
});
```

## Best Practices

### 1. Rate Limiting

Always configure rate limits to match your API plan:

```typescript
const webSearchTool = createWebSearchTool({
  provider: 'brave',
  apiKey: process.env.BRAVE_API_KEY!,
  rateLimit: {
    requestsPerMinute: 60,   // Stay within API limits
    requestsPerDay: 2000,    // Free tier limit
  },
});
```

### 2. Error Handling

Implement proper error handling and retries:

```typescript
const agent = new Agent({
  // ... config
  tools: [
    createWebSearchTool({
      provider: 'brave',
      apiKey: process.env.BRAVE_API_KEY!,
    }),
  ],
});

try {
  const result = await agent.execute('Search query');
} catch (error) {
  if (error instanceof RateLimitError) {
    // Wait and retry after reset time
    await new Promise(resolve => setTimeout(resolve, error.resetAt - Date.now()));
  } else if (error instanceof InvalidAPIKeyError) {
    // Update API key configuration
  } else {
    // Handle other errors
  }
}
```

### 3. Limit Results

Request only the number of results you need:

```typescript
// Good: Request only what you need
const result = await webSearchTool.execute({
  query: 'AI news',
  maxResults: 5,
});

// Avoid: Requesting too many results
const result = await webSearchTool.execute({
  query: 'AI news',
  maxResults: 20,  // Maximum allowed, but usually unnecessary
});
```

### 4. Specific Queries

Make queries as specific as possible:

```typescript
// Good: Specific query
await webSearchTool.execute({
  query: 'Claude 3.5 Sonnet capabilities 2025',
});

// Less effective: Vague query
await webSearchTool.execute({
  query: 'AI',
});
```

## Advanced Usage

### Custom Error Handling

```typescript
import {
  WebSearchClient,
  WebSearchError,
  RateLimitError
} from '@ainative/ai-kit-tools';

const client = new WebSearchClient({
  provider: 'brave',
  apiKey: process.env.BRAVE_API_KEY!,
});

async function searchWithRetry(query: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await client.search(query);
    } catch (error) {
      if (error instanceof RateLimitError) {
        // Wait until rate limit resets
        const waitMs = error.resetAt - Date.now();
        await new Promise(resolve => setTimeout(resolve, waitMs));
        continue;
      }

      if (error instanceof WebSearchError && error.retryable) {
        // Exponential backoff for retryable errors
        const backoffMs = Math.pow(2, i) * 1000;
        await new Promise(resolve => setTimeout(resolve, backoffMs));
        continue;
      }

      throw error;
    }
  }

  throw new Error('Max retries exceeded');
}
```

### Monitoring Usage

```typescript
const client = new WebSearchClient({
  provider: 'brave',
  apiKey: process.env.BRAVE_API_KEY!,
});

// Track usage
const results = await client.search('query');
console.log('Requests made:', client.getRequestCount());
console.log('Rate limit remaining:', results.metadata.rateLimit?.remaining);

// Reset counter for new billing period
client.resetRequestCount();
```

## Troubleshooting

### Issue: Rate Limit Errors

**Solution:** Reduce the `requestsPerMinute` or `requestsPerDay` in your configuration:

```typescript
rateLimit: {
  requestsPerMinute: 30,  // Reduce from default 60
  requestsPerDay: 500,    // Reduce from default 1000
}
```

### Issue: Timeout Errors

**Solution:** Increase the timeout value:

```typescript
timeoutMs: 15000,  // Increase to 15 seconds
```

### Issue: Invalid API Key

**Solution:** Verify your API key is correct and has proper permissions:

```typescript
// Check that environment variable is set
if (!process.env.BRAVE_API_KEY) {
  throw new Error('BRAVE_API_KEY environment variable is not set');
}
```

### Issue: Empty Results

**Solution:** Try more specific queries or check if the search provider is working:

```typescript
const result = await client.search('test query');
if (result.results.length === 0) {
  console.log('No results found. Try a different query.');
}
```

## Testing

For testing, you can use a mock endpoint:

```typescript
import { createWebSearchTool } from '@ainative/ai-kit-tools';
import { expect, vi } from 'vitest';

// Mock fetch globally
global.fetch = vi.fn();

const mockTool = createWebSearchTool({
  provider: 'brave',
  apiKey: 'test-key',
  endpoint: 'http://localhost:3000/mock',
});

// Your tests here
```

## Support

For issues, questions, or contributions:

- GitHub Issues: [ai-kit/issues](https://github.com/AINative-Studio/ai-kit/issues)
- Documentation: [ai-kit docs](https://github.com/AINative-Studio/ai-kit)

## License

MIT
