# Next.js Route Helpers

**@ainative/ai-kit-nextjs** provides powerful route helpers for building AI-powered streaming APIs in Next.js applications. These helpers support both the modern **App Router** (Next.js 13+) and the classic **Pages Router**, with built-in support for:

- ✅ Server-Sent Events (SSE) streaming
- ✅ CORS configuration
- ✅ Request validation
- ✅ Error handling
- ✅ Edge runtime compatibility
- ✅ TypeScript type safety

---

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [App Router (Next.js 13+)](#app-router-nextjs-13)
  - [createStreamingRoute](#createstreamingroute)
  - [createSSEStream](#createssestream)
- [Pages Router](#pages-router)
  - [createAPIRoute](#createapiroute)
- [Configuration Options](#configuration-options)
- [Utilities](#utilities)
- [Best Practices](#best-practices)
- [Examples](#examples)

---

## Installation

```bash
npm install @ainative/ai-kit-nextjs
# or
pnpm add @ainative/ai-kit-nextjs
# or
yarn add @ainative/ai-kit-nextjs
```

---

## Quick Start

### App Router Example

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

### Pages Router Example

```typescript
// pages/api/chat.ts
import { createAPIRoute } from '@ainative/ai-kit-nextjs'
import type { NextApiRequest, NextApiResponse } from 'next'

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

---

## App Router (Next.js 13+)

### createStreamingRoute

Creates a streaming route handler for the Next.js App Router with automatic SSE formatting, CORS handling, and error management.

#### Signature

```typescript
function createStreamingRoute(
  handler: StreamingRouteHandler,
  config?: StreamingRouteConfig
): (request: NextRequest, context?: { params?: Record<string, string | string[]> }) => Promise<Response>
```

#### Parameters

- **handler**: `StreamingRouteHandler` - Your route handler function
  - `context.request`: The Next.js request object
  - `context.params`: Route parameters (from dynamic routes)
  - `context.body`: Parsed request body (if applicable)
  - Returns: `ReadableStream<Uint8Array>` or `Response`

- **config**: `StreamingRouteConfig` (optional) - Configuration options
  - `cors`: CORS configuration
  - `validation`: Request validation schema
  - `headers`: Custom response headers
  - `timeout`: Request timeout in milliseconds
  - `enableHeartbeat`: Enable keep-alive heartbeats
  - `heartbeatInterval`: Heartbeat interval (default: 30000ms)
  - `onError`: Custom error handler
  - `logging`: Enable error logging

#### Example: Basic Streaming

```typescript
// app/api/stream/route.ts
import { createStreamingRoute, createSSEStream } from '@ainative/ai-kit-nextjs'

export const POST = createStreamingRoute(async ({ request, body }) => {
  const { stream, sendToken, end } = createSSEStream()

  // Simulate streaming tokens
  const tokens = ['Hello', ' ', 'from', ' ', 'AI', ' ', 'Kit!']
  for (const token of tokens) {
    sendToken(token)
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  end()
  return stream
})
```

#### Example: With OpenAI

```typescript
// app/api/chat/route.ts
import { createStreamingRoute, createSSEStream } from '@ainative/ai-kit-nextjs'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export const POST = createStreamingRoute(
  async ({ body }) => {
    const { stream, sendToken, sendUsage, sendError, end } = createSSEStream()

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: body.message }],
        stream: true,
      })

      for await (const chunk of completion) {
        const content = chunk.choices[0]?.delta?.content
        if (content) {
          sendToken(content)
        }
      }

      // Send usage if available
      const usage = completion.usage
      if (usage) {
        sendUsage({
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens,
        })
      }

      end()
    } catch (error) {
      sendError(error instanceof Error ? error.message : 'Unknown error')
      end()
    }

    return stream
  },
  {
    cors: {
      allowedOrigins: ['http://localhost:3000', 'https://myapp.com'],
      credentials: true,
    },
    validation: {
      required: ['message'],
      optional: {
        temperature: 'number',
        max_tokens: 'number',
      },
    },
    timeout: 30000, // 30 seconds
  }
)
```

#### Example: With CORS and Validation

```typescript
export const POST = createStreamingRoute(
  async ({ body }) => {
    // Your streaming logic here
    const { stream, sendToken, end } = createSSEStream()
    sendToken('Validated and streaming!')
    end()
    return stream
  },
  {
    cors: {
      allowedOrigins: ['https://example.com'],
      allowedMethods: ['POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
      maxAge: 86400, // 24 hours
    },
    validation: {
      required: ['message', 'userId'],
      optional: {
        temperature: 'number',
        systemPrompt: 'string',
      },
      validate: (data) => {
        if (data.message.length > 1000) {
          return { valid: false, error: 'Message too long (max 1000 chars)' }
        }
        return { valid: true }
      },
    },
  }
)
```

### createSSEStream

Creates a ReadableStream with helper functions for sending SSE events. This is the recommended way to build streaming responses.

#### Signature

```typescript
function createSSEStream(): {
  stream: ReadableStream<Uint8Array>
  sendToken: (token: string, index?: number) => void
  sendUsage: (usage: UsageEvent) => void
  sendError: (error: string | ErrorEvent) => void
  sendMetadata: (metadata: MetadataEvent) => void
  sendEvent: (event: string, data: any) => void
  end: () => void
}
```

#### Return Value

- **stream**: The ReadableStream to return from your route handler
- **sendToken**: Send a text token
- **sendUsage**: Send token usage information
- **sendError**: Send an error event
- **sendMetadata**: Send custom metadata
- **sendEvent**: Send a custom event type
- **end**: Close the stream

#### Example: Complete Streaming Workflow

```typescript
export const POST = createStreamingRoute(async ({ body }) => {
  const { stream, sendToken, sendMetadata, sendUsage, sendError, end } = createSSEStream()

  try {
    // Send metadata first
    sendMetadata({
      model: 'gpt-4',
      temperature: 0.7,
      requestId: crypto.randomUUID(),
    })

    // Stream tokens
    const response = 'This is a streaming response'
    for (const token of response.split(' ')) {
      sendToken(token + ' ')
      await new Promise(resolve => setTimeout(resolve, 50))
    }

    // Send usage information
    sendUsage({
      promptTokens: 15,
      completionTokens: 10,
      totalTokens: 25,
      estimatedCost: 0.0005,
    })

    // End the stream
    end()
  } catch (error) {
    sendError({
      error: error instanceof Error ? error.message : 'Unknown error',
      code: 'STREAM_ERROR',
    })
    end()
  }

  return stream
})
```

---

## Pages Router

### createAPIRoute

Creates an API route handler for the Next.js Pages Router with CORS, validation, and error handling.

#### Signature

```typescript
function createAPIRoute(
  handler: APIRouteHandler,
  config?: RouteConfig
): (req: NextApiRequest, res: NextApiResponse) => Promise<void>
```

#### Parameters

- **handler**: `APIRouteHandler` - Your route handler function
  - `context.req`: The Next.js API request object
  - `context.res`: The Next.js API response object
  - `context.body`: Parsed request body (if applicable)

- **config**: `RouteConfig` (optional) - Configuration options
  - `cors`: CORS configuration
  - `validation`: Request validation schema
  - `timeout`: Request timeout in milliseconds
  - `logging`: Enable error logging

#### Example: SSE Streaming

```typescript
// pages/api/stream.ts
import { createAPIRoute } from '@ainative/ai-kit-nextjs'
import { NextApiRequest, NextApiResponse } from 'next'

export default createAPIRoute(
  async ({ req, res, body }) => {
    // Set up SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    })

    // Send start event
    res.write(`event: start\ndata: {"timestamp":"${new Date().toISOString()}"}\n\n`)

    // Stream tokens
    const tokens = ['Hello', ' ', 'World', '!']
    for (const token of tokens) {
      res.write(`event: token\ndata: {"token":"${token}"}\n\n`)
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    // Send done event
    res.write(`event: done\ndata: {"timestamp":"${new Date().toISOString()}"}\n\n`)

    res.end()
  },
  {
    cors: { allowedOrigins: '*' },
  }
)
```

#### Example: JSON Response

```typescript
// pages/api/chat.ts
import { createAPIRoute } from '@ainative/ai-kit-nextjs'

export default createAPIRoute(
  async ({ req, res, body }) => {
    const response = {
      message: 'Hello, ' + body.name,
      timestamp: new Date().toISOString(),
    }

    res.status(200).json(response)
  },
  {
    validation: {
      required: ['name'],
      optional: {
        greeting: 'string',
      },
    },
  }
)
```

---

## Configuration Options

### StreamingRouteConfig

Configuration for App Router streaming routes.

```typescript
interface StreamingRouteConfig {
  // CORS configuration
  cors?: {
    allowedOrigins?: string[] | '*'
    allowedMethods?: string[]
    allowedHeaders?: string[]
    exposedHeaders?: string[]
    maxAge?: number
    credentials?: boolean
  }

  // Request validation
  validation?: {
    required?: string[]
    optional?: Record<string, 'string' | 'number' | 'boolean' | 'object' | 'array'>
    validate?: (data: any) => { valid: boolean; error?: string }
  }

  // Custom headers
  headers?: Record<string, string>

  // Request timeout (ms)
  timeout?: number

  // Enable heartbeat for long connections
  enableHeartbeat?: boolean
  heartbeatInterval?: number // Default: 30000ms

  // Error handling
  onError?: (error: Error) => void
  logging?: boolean

  // Metadata to include in stream start
  metadata?: Record<string, any>
}
```

### RouteConfig

Configuration for Pages Router API routes.

```typescript
interface RouteConfig {
  cors?: CORSConfig
  validation?: ValidationSchema
  timeout?: number
  logging?: boolean
}
```

---

## Utilities

### formatSSE

Format a message according to the SSE protocol.

```typescript
function formatSSE(message: SSEMessage): string
```

**Example:**

```typescript
import { formatSSE } from '@ainative/ai-kit-nextjs'

const sseMessage = formatSSE({
  event: 'token',
  data: { token: 'Hello' },
  id: '123',
})
// Returns: "event: token\nid: 123\ndata: {"token":"Hello"}\n\n"
```

### sendSSEMessage

Send an SSE message through a stream controller.

```typescript
function sendSSEMessage(
  controller: ReadableStreamDefaultController<Uint8Array>,
  message: SSEMessage
): void
```

**Example:**

```typescript
import { sendSSEMessage } from '@ainative/ai-kit-nextjs'

const stream = new ReadableStream({
  start(controller) {
    sendSSEMessage(controller, {
      event: 'token',
      data: { token: 'Hello' },
    })
    controller.close()
  },
})
```

### parseRequestBody

Safely parse request body from NextRequest.

```typescript
function parseRequestBody(request: NextRequest): Promise<any>
```

**Example:**

```typescript
import { parseRequestBody } from '@ainative/ai-kit-nextjs'

export const POST = async (request: NextRequest) => {
  const body = await parseRequestBody(request)
  // body is now parsed based on Content-Type
}
```

### createErrorResponse

Create a standardized error response.

```typescript
function createErrorResponse(
  message: string,
  status?: number,
  cors?: CORSConfig
): Response
```

**Example:**

```typescript
import { createErrorResponse } from '@ainative/ai-kit-nextjs'

return createErrorResponse('Invalid request', 400, {
  allowedOrigins: '*',
})
```

### createSuccessResponse

Create a standardized success response.

```typescript
function createSuccessResponse<T>(
  data: T,
  status?: number,
  cors?: CORSConfig
): Response
```

**Example:**

```typescript
import { createSuccessResponse } from '@ainative/ai-kit-nextjs'

return createSuccessResponse({ result: 'success' }, 200, {
  allowedOrigins: '*',
})
```

---

## Best Practices

### 1. Always Validate Inputs

```typescript
export const POST = createStreamingRoute(
  async ({ body }) => {
    // Your logic here
  },
  {
    validation: {
      required: ['message'],
      validate: (data) => {
        if (data.message.length > 5000) {
          return { valid: false, error: 'Message too long' }
        }
        return { valid: true }
      },
    },
  }
)
```

### 2. Use Heartbeats for Long Connections

```typescript
export const POST = createStreamingRoute(
  async ({ body }) => {
    // Long-running stream
  },
  {
    enableHeartbeat: true,
    heartbeatInterval: 15000, // 15 seconds
  }
)
```

### 3. Handle Errors Gracefully

```typescript
export const POST = createStreamingRoute(
  async ({ body }) => {
    const { stream, sendToken, sendError, end } = createSSEStream()

    try {
      // Your streaming logic
      sendToken('Success!')
    } catch (error) {
      sendError({
        error: error instanceof Error ? error.message : 'Unknown error',
        code: 'PROCESSING_ERROR',
      })
    } finally {
      end()
    }

    return stream
  },
  {
    onError: (error) => {
      // Log to your monitoring service
      console.error('Stream error:', error)
    },
    logging: true,
  }
)
```

### 4. Set Appropriate Timeouts

```typescript
export const POST = createStreamingRoute(
  async ({ body }) => {
    // Your logic
  },
  {
    timeout: 30000, // 30 seconds max
  }
)
```

### 5. Use Type-Safe Validation

```typescript
interface ChatRequest {
  message: string
  temperature?: number
  model?: string
}

export const POST = createStreamingRoute(
  async ({ body }) => {
    const request = body as ChatRequest
    // TypeScript knows the shape of request
  },
  {
    validation: {
      required: ['message'],
      optional: {
        temperature: 'number',
        model: 'string',
      },
    },
  }
)
```

---

## Examples

### Complete OpenAI Integration

```typescript
// app/api/chat/openai/route.ts
import { createStreamingRoute, createSSEStream } from '@ainative/ai-kit-nextjs'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

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

      // Send final usage (if available)
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
    timeout: 60000, // 60 seconds
    logging: true,
  }
)
```

### Client-Side Usage

```typescript
// Client-side code to consume the SSE stream
async function streamChat(message: string) {
  const response = await fetch('/api/chat/openai', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: [{ role: 'user', content: message }],
    }),
  })

  const reader = response.body?.getReader()
  const decoder = new TextDecoder()

  if (!reader) return

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value)
    const lines = chunk.split('\n')

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6)
        if (data === '[DONE]') continue

        try {
          const parsed = JSON.parse(data)
          console.log('Event:', parsed)

          if (parsed.token) {
            // Handle token
            console.log('Token:', parsed.token)
          } else if (parsed.usage) {
            // Handle usage
            console.log('Usage:', parsed.usage)
          }
        } catch (e) {
          // Ignore parsing errors
        }
      }
    }
  }
}
```

---

## Advanced Features

### Custom Event Types

```typescript
export const POST = createStreamingRoute(async ({ body }) => {
  const { stream, sendEvent, end } = createSSEStream()

  // Send custom events
  sendEvent('thinking', { status: 'analyzing' })
  sendEvent('progress', { percent: 50 })
  sendEvent('result', { data: 'Final answer' })

  end()
  return stream
})
```

### Edge Runtime Support

```typescript
// app/api/edge/route.ts
import { createStreamingRoute, createSSEStream } from '@ainative/ai-kit-nextjs'

export const runtime = 'edge'

export const POST = createStreamingRoute(async ({ body }) => {
  const { stream, sendToken, end } = createSSEStream()

  sendToken('Running on Edge!')
  end()

  return stream
})
```

### Rate Limiting

```typescript
// Combine with middleware for rate limiting
import { createStreamingRoute } from '@ainative/ai-kit-nextjs'
import { rateLimit } from '@/lib/rate-limit'

export const POST = createStreamingRoute(
  async ({ request, body }) => {
    // Check rate limit
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const { success } = await rateLimit.check(ip)

    if (!success) {
      throw new Error('Rate limit exceeded')
    }

    // Your streaming logic
  }
)
```

---

## TypeScript Types

All types are fully exported for your convenience:

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

---

## Troubleshooting

### Stream Not Closing

Make sure you always call `end()`:

```typescript
const { stream, sendToken, end } = createSSEStream()
try {
  sendToken('Hello')
} finally {
  end() // Always close the stream
}
```

### CORS Errors

Enable CORS properly:

```typescript
export const POST = createStreamingRoute(
  async ({ body }) => {
    // Your logic
  },
  {
    cors: {
      allowedOrigins: ['https://yourapp.com'],
      credentials: true,
    },
  }
)
```

### Validation Failing

Check your validation schema:

```typescript
validation: {
  required: ['message'],
  optional: {
    temperature: 'number', // Make sure types match
  },
}
```

---

## Support

For issues, questions, or contributions:
- GitHub: https://github.com/AINative-Studio/ai-kit
- Docs: https://ainative.studio/docs
