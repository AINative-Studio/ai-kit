# @ainative/ai-kit-tools

Production-ready tools for AI Kit agents.

## Overview

This package provides a collection of built-in tools that AI agents can use to perform various tasks. Each tool is designed to be:

- **Type-safe**: Full TypeScript support with Zod schemas
- **Well-tested**: 80%+ test coverage
- **Production-ready**: Comprehensive error handling and rate limiting
- **Agent-compatible**: Works seamlessly with the AI Kit agent framework

## Available Tools

### Web Search Tool

Search the web using Brave Search API with structured results.

```typescript
import { createWebSearchTool } from '@ainative/ai-kit-tools';

const webSearchTool = createWebSearchTool({
  provider: 'brave',
  apiKey: process.env.BRAVE_API_KEY!,
  maxResults: 10,
});

const result = await webSearchTool.execute({
  query: 'latest AI developments 2025',
  maxResults: 5,
});
```

**Features:**
- Multiple search provider support (Brave, Google, Bing)
- Built-in rate limiting (token bucket algorithm)
- Structured results with title, URL, snippet, and metadata
- Comprehensive error handling
- Configurable timeouts and retry logic

**Documentation:** [Web Search Usage Guide](./docs/WEB_SEARCH_USAGE.md)

**Story Points:** 8

### Calculator Tool

Safe mathematical expression evaluation with support for statistics.

```typescript
import { calculator } from '@ainative/ai-kit-tools';

const result = calculator.execute({
  expression: '(10 + 5) * 2',
});
```

**Features:**
- Safe expression evaluation (no eval)
- Statistical operations (mean, median, mode, etc.)
- Equation solving
- Batch calculations
- Input validation

**Story Points:** 5

### Code Interpreter Tool

Execute code in a sandboxed environment with multiple language support.

```typescript
import { codeInterpreterTool } from '@ainative/ai-kit-tools';

const result = await codeInterpreterTool.execute({
  language: 'javascript',
  code: 'console.log("Hello, World!")',
});
```

**Features:**
- JavaScript execution
- Python support (coming soon)
- Sandboxed environment
- Timeout protection
- Memory limits
- Output capture

**Story Points:** 13

### ZeroDB Query Tool

Query and manage ZeroDB resources with natural language.

```typescript
import { createZeroDBQueryTool } from '@ainative/ai-kit-tools';

const zerodbTool = createZeroDBQueryTool({
  apiKey: process.env.ZERODB_API_KEY!,
  projectId: 'my-project',
});
```

**Features:**
- Natural language query parsing
- Vector search support
- Table operations
- Event stream access
- Result formatting

**Story Points:** 13

## Installation

```bash
npm install @ainative/ai-kit-tools
# or
pnpm add @ainative/ai-kit-tools
# or
yarn add @ainative/ai-kit-tools
```

## Usage with Agents

```typescript
import { Agent } from '@ainative/ai-kit-core';
import {
  createWebSearchTool,
  calculator,
  codeInterpreterTool,
} from '@ainative/ai-kit-tools';

const agent = new Agent({
  id: 'research-agent',
  name: 'Research Agent',
  systemPrompt: 'You are a research assistant with web search and calculation capabilities.',
  llm: {
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
    apiKey: process.env.ANTHROPIC_API_KEY!,
  },
  tools: [
    createWebSearchTool({
      provider: 'brave',
      apiKey: process.env.BRAVE_API_KEY!,
    }),
    calculator,
    codeInterpreterTool,
  ],
});

const response = await agent.execute('Find the latest AI news and calculate market growth');
```

## API Reference

### Tool Definition Interface

All tools follow the standard `ToolDefinition` interface from `@ainative/ai-kit-core`:

```typescript
interface ToolDefinition<TParams = any, TResult = any> {
  name: string;
  description: string;
  parameters: z.ZodObject<any> | z.ZodType<any>;
  execute: (params: TParams) => Promise<TResult>;
  retry?: {
    maxAttempts: number;
    backoffMs: number;
  };
  timeoutMs?: number;
  metadata?: Record<string, unknown>;
}
```

## Environment Variables

### Required

- `BRAVE_API_KEY` - For web search tool (get from [Brave Search API](https://brave.com/search/api/))

### Optional

- `ZERODB_API_KEY` - For ZeroDB query tool
- `ZERODB_PROJECT_ID` - Your ZeroDB project ID

## Testing

Each tool comes with comprehensive test coverage:

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run specific tool tests
pnpm test web-search
pnpm test calculator
```

## Development

### Building

```bash
pnpm build
```

### Type Checking

```bash
pnpm type-check
```

### Linting

```bash
pnpm lint
```

## Contributing

When adding a new tool:

1. Create the tool implementation in `src/`
2. Add comprehensive tests in `__tests__/`
3. Ensure 80%+ test coverage
4. Update exports in `src/index.ts`
5. Create usage documentation in `docs/`
6. Update this README

## Error Handling

All tools provide specific error classes for better error handling:

```typescript
import {
  WebSearchError,
  RateLimitError,
  InvalidAPIKeyError,
} from '@ainative/ai-kit-tools';

try {
  await webSearchTool.execute({ query: 'test' });
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log('Rate limited. Retry after:', error.resetAt);
  } else if (error instanceof InvalidAPIKeyError) {
    console.log('Invalid API key');
  } else if (error instanceof WebSearchError) {
    console.log('Search error:', error.message);
  }
}
```

## Performance

All tools are optimized for production use:

- **Rate Limiting**: Built-in rate limiting prevents API quota exhaustion
- **Timeouts**: Configurable timeouts prevent hanging requests
- **Retries**: Automatic retry with exponential backoff for transient failures
- **Caching**: Response caching where appropriate

## License

MIT

## Support

- GitHub Issues: [ai-kit/issues](https://github.com/AINative-Studio/ai-kit/issues)
- Documentation: [https://ainative.studio/ai-kit](https://ainative.studio/ai-kit)
