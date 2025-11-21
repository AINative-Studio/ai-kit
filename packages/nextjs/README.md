# @ainative/ai-kit-nextjs

> Next.js route helpers for building AI-powered streaming APIs

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-13%2B-black)](https://nextjs.org/)

Next.js-specific utilities for AI Kit, providing powerful route helpers for both **App Router** (Next.js 13+) and **Pages Router** with built-in support for:

- ✅ Server-Sent Events (SSE) streaming
- ✅ CORS configuration
- ✅ Request validation
- ✅ Error handling
- ✅ Edge runtime compatibility
- ✅ TypeScript type safety
- ✅ Heartbeat support for long connections

---

## Installation

```bash
npm install @ainative/ai-kit-nextjs
# or
pnpm add @ainative/ai-kit-nextjs
# or
yarn add @ainative/ai-kit-nextjs
```

## Quick Start

### App Router (Next.js 13+)

```typescript
// app/api/chat/route.ts
import { createStreamingRoute, createSSEStream } from '@ainative/ai-kit-nextjs'

export const POST = createStreamingRoute(
  async ({ request, body }) => {
    const { stream, sendToken, sendUsage, end } = createSSEStream()

    // Send tokens as they arrive
    sendToken('Hello')
    sendToken(' ')
    sendToken('world')

    // Send usage information
    sendUsage({
      promptTokens: 10,
      completionTokens: 5,
      totalTokens: 15,
    })

    // End the stream
    end()

    return stream
  },
  {
    cors: { allowedOrigins: '*' },
    validation: {
      required: ['message'],
    },
  }
)
```

### Pages Router

```typescript
// pages/api/chat.ts
import { createAPIRoute } from '@ainative/ai-kit-nextjs'

export default createAPIRoute(
  async ({ req, res, body }) => {
    // Set up SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    })

    // Send events
    res.write(`event: token\ndata: {"token":"Hello"}\n\n`)
    res.write(`event: token\ndata: {"token":" world"}\n\n`)
    res.write(`event: done\ndata: {"timestamp":"${new Date().toISOString()}"}\n\n`)

    res.end()
  },
  {
    cors: { allowedOrigins: '*' },
  }
)
```

## Features

### Route Helpers

#### `createStreamingRoute(handler, config)`

Creates a streaming route handler for Next.js App Router with automatic SSE formatting.

**Features:**
- Automatic SSE protocol formatting
- CORS handling with preflight support
- Request body parsing and validation
- Error handling with custom error handlers
- Timeout support
- Heartbeat for long-lived connections
- Edge runtime compatible

#### `createAPIRoute(handler, config)`

Creates an API route handler for Next.js Pages Router.

**Features:**
- CORS handling
- Request validation
- Error handling
- Timeout support

#### `createSSEStream()`

Creates a ReadableStream with helper functions for sending SSE events.

**Returns:**
- `stream`: ReadableStream to return from handler
- `sendToken(token, index?)`: Send text token
- `sendUsage(usage)`: Send token usage info
- `sendError(error)`: Send error event
- `sendMetadata(metadata)`: Send custom metadata
- `sendEvent(event, data)`: Send custom event
- `end()`: Close the stream

### Utilities

- `formatSSE(message)`: Format SSE message
- `sendSSEMessage(controller, message)`: Send SSE via controller
- `parseRequestBody(request)`: Parse NextRequest body
- `createErrorResponse(message, status, cors)`: Create error response
- `createSuccessResponse(data, status, cors)`: Create success response

## Configuration Options

### StreamingRouteConfig

```typescript
interface StreamingRouteConfig {
  cors?: {
    allowedOrigins?: string[] | '*'
    allowedMethods?: string[]
    allowedHeaders?: string[]
    exposedHeaders?: string[]
    maxAge?: number
    credentials?: boolean
  }
  validation?: {
    required?: string[]
    optional?: Record<string, 'string' | 'number' | 'boolean' | 'object' | 'array'>
    validate?: (data: any) => { valid: boolean; error?: string }
  }
  headers?: Record<string, string>
  timeout?: number
  enableHeartbeat?: boolean
  heartbeatInterval?: number
  onError?: (error: Error) => void
  logging?: boolean
  metadata?: Record<string, any>
}
```

## Complete Example with OpenAI

```typescript
// app/api/chat/openai/route.ts
import { createStreamingRoute, createSSEStream } from '@ainative/ai-kit-nextjs'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export const POST = createStreamingRoute(
  async ({ body }) => {
    const { stream, sendToken, sendUsage, sendMetadata, sendError, end } = createSSEStream()

    try {
      // Send initial metadata
      sendMetadata({
        model: body.model || 'gpt-4',
        requestId: crypto.randomUUID(),
      })

      // Create streaming completion
      const completion = await openai.chat.completions.create({
        model: body.model || 'gpt-4',
        messages: body.messages,
        temperature: body.temperature || 0.7,
        stream: true,
      })

      // Stream the response
      for await (const chunk of completion) {
        const content = chunk.choices[0]?.delta?.content
        if (content) {
          sendToken(content)
        }
      }

      // Send final usage
      if (completion.usage) {
        sendUsage({
          promptTokens: completion.usage.prompt_tokens,
          completionTokens: completion.usage.completion_tokens,
          totalTokens: completion.usage.total_tokens,
        })
      }

      end()
    } catch (error) {
      sendError({
        error: error instanceof Error ? error.message : 'Unknown error',
        code: 'OPENAI_ERROR',
      })
      end()
    }

    return stream
  },
  {
    cors: {
      allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true,
    },
    validation: {
      required: ['messages'],
      optional: {
        model: 'string',
        temperature: 'number',
        max_tokens: 'number',
      },
      validate: (data) => {
        if (!Array.isArray(data.messages) || data.messages.length === 0) {
          return { valid: false, error: 'Messages must be a non-empty array' }
        }
        return { valid: true }
      },
    },
    enableHeartbeat: true,
    timeout: 60000,
    logging: true,
  }
)
```

## Documentation

For complete documentation, see:
- [Route Helpers Guide](../../docs/nextjs/route-helpers.md)
- [API Reference](../../docs/api/nextjs.md)

## TypeScript Support

This package is written in TypeScript and provides full type definitions.

```typescript
import type {
  StreamingRouteConfig,
  RouteConfig,
  AppRouterContext,
  PagesRouterContext,
  StreamingRouteHandler,
  APIRouteHandler,
  CORSConfig,
  ValidationSchema,
  SSEMessage,
  TokenEvent,
  UsageEvent,
  ErrorEvent,
  MetadataEvent,
} from '@ainative/ai-kit-nextjs'
```

## Testing

The package includes comprehensive tests with >95% coverage.

```bash
pnpm test
pnpm test:coverage
```

## License

MIT

## Contributing

Contributions are welcome! Please read our [Contributing Guide](../../CONTRIBUTING.md) for details.

## Support

- GitHub: https://github.com/AINative-Studio/ai-kit
- Documentation: https://ainative.studio/ai-kit
- Issues: https://github.com/AINative-Studio/ai-kit/issues
