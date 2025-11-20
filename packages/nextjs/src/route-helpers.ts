/**
 * Next.js route helpers for AI streaming
 * Provides utilities for both App Router (Next.js 13+) and Pages Router
 */

import type { NextRequest } from 'next/server'
import type { NextApiRequest, NextApiResponse } from 'next'
import {
  SSEEventType,
} from './types'
import type {
  StreamingRouteHandler,
  APIRouteHandler,
  StreamingRouteConfig,
  RouteConfig,
  AppRouterContext,
  PagesRouterContext,
  ErrorResponse,
  CORSConfig,
  ValidationSchema,
  SSEMessage,
  TokenEvent,
  UsageEvent,
  ErrorEvent,
  MetadataEvent,
} from './types'

/**
 * SSE Event Types (re-exported for convenience)
 */
export { SSEEventType }

/**
 * Create a streaming route handler for Next.js App Router
 * Handles SSE streaming with proper error handling and CORS
 *
 * @example
 * ```typescript
 * // app/api/stream/route.ts
 * import { createStreamingRoute } from '@ainative/ai-kit-nextjs'
 *
 * export const POST = createStreamingRoute(
 *   async ({ request, body }) => {
 *     const stream = new ReadableStream({
 *       async start(controller) {
 *         // Send tokens
 *         sendSSEMessage(controller, {
 *           event: 'token',
 *           data: { token: 'Hello' }
 *         })
 *         controller.close()
 *       }
 *     })
 *     return stream
 *   },
 *   {
 *     cors: { allowedOrigins: '*' },
 *     enableHeartbeat: true
 *   }
 * )
 * ```
 */
export function createStreamingRoute(
  handler: StreamingRouteHandler,
  config: StreamingRouteConfig = {}
): (request: NextRequest, context?: { params?: Record<string, string | string[]> }) => Promise<Response> {
  return async (request: NextRequest, routeContext?: { params?: Record<string, string | string[]> }) => {
    try {
      // Handle CORS preflight
      if (request.method === 'OPTIONS') {
        return handleCORSPreflight(config.cors)
      }

      // Parse request body
      let body: any
      try {
        const contentType = request.headers.get('content-type') || ''
        if (contentType.includes('application/json')) {
          body = await request.json()
        } else if (contentType.includes('text/')) {
          body = await request.text()
        }
      } catch (error) {
        // Body parsing is optional
        body = undefined
      }

      // Validate request body
      if (config.validation && body) {
        const validationResult = validateRequest(body, config.validation)
        if (!validationResult.valid) {
          return createErrorResponse(
            validationResult.error || 'Validation failed',
            400,
            config.cors
          )
        }
      }

      // Create context
      const context: AppRouterContext = {
        request,
        params: routeContext?.params,
        body,
      }

      // Execute handler with timeout if configured
      let result: ReadableStream<Uint8Array> | Response
      if (config.timeout) {
        result = await executeWithTimeout(
          () => handler(context),
          config.timeout,
          'Request timeout'
        )
      } else {
        result = await handler(context)
      }

      // If handler returns a Response, return it directly
      if (result instanceof Response) {
        return applyCORSHeaders(result, config.cors)
      }

      // Create streaming response
      const stream = result as ReadableStream<Uint8Array>

      // Add heartbeat if enabled
      let finalStream = stream
      if (config.enableHeartbeat) {
        finalStream = addHeartbeat(stream, config.heartbeatInterval || 30000)
      }

      const response = new Response(finalStream, {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no',
          ...(config.headers || {}),
        },
      })

      return applyCORSHeaders(response, config.cors)
    } catch (error) {
      // Log error if logging is enabled
      if (config.logging) {
        console.error('[createStreamingRoute] Error:', error)
      }

      // Call custom error handler if provided
      if (config.onError && error instanceof Error) {
        config.onError(error)
      }

      const message = error instanceof Error ? error.message : 'Internal server error'
      return createErrorResponse(message, 500, config.cors)
    }
  }
}

/**
 * Create an API route handler for Next.js Pages Router
 * Handles SSE streaming with proper error handling and CORS
 *
 * @example
 * ```typescript
 * // pages/api/chat.ts
 * import { createAPIRoute } from '@ainative/ai-kit-nextjs'
 *
 * export default createAPIRoute(
 *   async ({ req, res, body }) => {
 *     res.writeHead(200, {
 *       'Content-Type': 'text/event-stream',
 *       'Cache-Control': 'no-cache',
 *       'Connection': 'keep-alive',
 *     })
 *
 *     res.write(`data: ${JSON.stringify({ token: 'Hello' })}\n\n`)
 *     res.end()
 *   },
 *   {
 *     cors: { allowedOrigins: '*' }
 *   }
 * )
 * ```
 */
export function createAPIRoute(
  handler: APIRouteHandler,
  config: RouteConfig = {}
): (req: NextApiRequest, res: NextApiResponse) => Promise<void> {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      // Handle CORS preflight
      if (req.method === 'OPTIONS') {
        applyCORSHeadersToNextApiResponse(res, config.cors)
        res.status(204).end()
        return
      }

      // Apply CORS headers
      applyCORSHeadersToNextApiResponse(res, config.cors)

      // Parse request body if needed
      let body = req.body
      if (!body && req.method === 'POST' || req.method === 'PUT') {
        try {
          const chunks: Buffer[] = []
          for await (const chunk of req) {
            chunks.push(chunk)
          }
          const bodyText = Buffer.concat(chunks).toString()
          body = JSON.parse(bodyText)
        } catch (error) {
          // Body parsing failed, leave as undefined
          body = undefined
        }
      }

      // Validate request body
      if (config.validation && body) {
        const validationResult = validateRequest(body, config.validation)
        if (!validationResult.valid) {
          res.status(400).json({
            error: validationResult.error || 'Validation failed',
            code: 'VALIDATION_ERROR',
            statusCode: 400,
          } as ErrorResponse)
          return
        }
      }

      // Create context
      const context: PagesRouterContext = {
        req,
        res,
        body,
      }

      // Execute handler with timeout if configured
      if (config.timeout) {
        await executeWithTimeout(
          () => Promise.resolve(handler(context)),
          config.timeout,
          'Request timeout'
        )
      } else {
        await handler(context)
      }
    } catch (error) {
      // Log error if logging is enabled
      if (config.logging) {
        console.error('[createAPIRoute] Error:', error)
      }

      const message = error instanceof Error ? error.message : 'Internal server error'

      // Only send error response if headers not sent
      if (!res.headersSent) {
        res.status(500).json({
          error: message,
          code: 'INTERNAL_ERROR',
          statusCode: 500,
        } as ErrorResponse)
      }
    }
  }
}

/**
 * Send an SSE message through a stream controller
 *
 * @example
 * ```typescript
 * const stream = new ReadableStream({
 *   start(controller) {
 *     sendSSEMessage(controller, {
 *       event: 'token',
 *       data: { token: 'Hello' }
 *     })
 *     controller.close()
 *   }
 * })
 * ```
 */
export function sendSSEMessage(
  controller: ReadableStreamDefaultController<Uint8Array>,
  message: SSEMessage
): void {
  const formatted = formatSSE(message)
  const encoder = new TextEncoder()
  controller.enqueue(encoder.encode(formatted))
}

/**
 * Format an SSE message according to the SSE protocol
 */
export function formatSSE(message: SSEMessage): string {
  let output = ''

  if (message.event) {
    output += `event: ${message.event}\n`
  }

  if (message.id) {
    output += `id: ${message.id}\n`
  }

  if (message.retry) {
    output += `retry: ${message.retry}\n`
  }

  const dataString = typeof message.data === 'string'
    ? message.data
    : JSON.stringify(message.data)

  const dataLines = dataString.split('\n')
  dataLines.forEach(line => {
    output += `data: ${line}\n`
  })

  output += '\n'

  return output
}

/**
 * Create a streaming response with SSE helpers
 * Returns a ReadableStream and helper functions to send SSE events
 *
 * @example
 * ```typescript
 * export const POST = createStreamingRoute(async ({ request, body }) => {
 *   const { stream, sendToken, sendUsage, sendError, end } = createSSEStream()
 *
 *   sendToken('Hello')
 *   sendToken(' world')
 *   sendUsage({ promptTokens: 10, completionTokens: 5, totalTokens: 15 })
 *   end()
 *
 *   return stream
 * })
 * ```
 */
export function createSSEStream() {
  let controller: ReadableStreamDefaultController<Uint8Array> | null = null

  const stream = new ReadableStream<Uint8Array>({
    start(ctrl) {
      controller = ctrl

      // Send start event
      sendSSEMessage(ctrl, {
        event: SSEEventType.START,
        data: { timestamp: new Date().toISOString() },
      })
    },
  })

  const ensureController = () => {
    if (!controller) {
      throw new Error('Stream not initialized')
    }
    return controller
  }

  return {
    stream,

    /**
     * Send a token event
     */
    sendToken: (token: string, index?: number) => {
      const tokenEvent: TokenEvent = { token }
      if (index !== undefined) {
        tokenEvent.index = index
      }
      sendSSEMessage(ensureController(), {
        event: SSEEventType.TOKEN,
        data: tokenEvent,
      })
    },

    /**
     * Send a usage event
     */
    sendUsage: (usage: UsageEvent) => {
      sendSSEMessage(ensureController(), {
        event: SSEEventType.USAGE,
        data: usage,
      })
    },

    /**
     * Send an error event
     */
    sendError: (error: string | ErrorEvent) => {
      const errorEvent: ErrorEvent = typeof error === 'string'
        ? { error }
        : error
      sendSSEMessage(ensureController(), {
        event: SSEEventType.ERROR,
        data: errorEvent,
      })
    },

    /**
     * Send a metadata event
     */
    sendMetadata: (metadata: MetadataEvent) => {
      sendSSEMessage(ensureController(), {
        event: SSEEventType.METADATA,
        data: metadata,
      })
    },

    /**
     * Send a custom event
     */
    sendEvent: (event: string, data: any) => {
      sendSSEMessage(ensureController(), {
        event,
        data,
      })
    },

    /**
     * End the stream
     */
    end: () => {
      const ctrl = ensureController()
      sendSSEMessage(ctrl, {
        event: SSEEventType.DONE,
        data: { timestamp: new Date().toISOString() },
      })
      ctrl.close()
    },
  }
}

/**
 * Parse request body safely
 */
export async function parseRequestBody(request: NextRequest): Promise<any> {
  try {
    const contentType = request.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      return await request.json()
    } else if (contentType.includes('text/')) {
      return await request.text()
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const text = await request.text()
      return Object.fromEntries(new URLSearchParams(text))
    }

    return undefined
  } catch (error) {
    throw new Error('Failed to parse request body')
  }
}

/**
 * Create an error response with proper CORS headers
 */
export function createErrorResponse(
  message: string,
  status: number = 500,
  cors?: CORSConfig
): Response {
  const errorResponse: ErrorResponse = {
    error: message,
    code: status >= 500 ? 'INTERNAL_ERROR' : 'BAD_REQUEST',
    statusCode: status,
  }

  const response = new Response(JSON.stringify(errorResponse), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  return applyCORSHeaders(response, cors)
}

/**
 * Create a success response with proper CORS headers
 */
export function createSuccessResponse<T>(
  data: T,
  status: number = 200,
  cors?: CORSConfig
): Response {
  const response = new Response(JSON.stringify({ data }), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  return applyCORSHeaders(response, cors)
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Handle CORS preflight requests
 */
function handleCORSPreflight(cors?: CORSConfig): Response {
  const headers = getCORSHeaders(cors)
  return new Response(null, {
    status: 204,
    headers,
  })
}

/**
 * Get CORS headers based on configuration
 */
function getCORSHeaders(cors?: CORSConfig): HeadersInit {
  if (!cors) {
    return {}
  }

  const headers: Record<string, string> = {}

  // Access-Control-Allow-Origin
  if (cors.allowedOrigins) {
    headers['Access-Control-Allow-Origin'] =
      cors.allowedOrigins === '*' ? '*' : cors.allowedOrigins.join(', ')
  }

  // Access-Control-Allow-Methods
  if (cors.allowedMethods) {
    headers['Access-Control-Allow-Methods'] = cors.allowedMethods.join(', ')
  }

  // Access-Control-Allow-Headers
  if (cors.allowedHeaders) {
    headers['Access-Control-Allow-Headers'] = cors.allowedHeaders.join(', ')
  }

  // Access-Control-Expose-Headers
  if (cors.exposedHeaders) {
    headers['Access-Control-Expose-Headers'] = cors.exposedHeaders.join(', ')
  }

  // Access-Control-Max-Age
  if (cors.maxAge) {
    headers['Access-Control-Max-Age'] = cors.maxAge.toString()
  }

  // Access-Control-Allow-Credentials
  if (cors.credentials) {
    headers['Access-Control-Allow-Credentials'] = 'true'
  }

  return headers
}

/**
 * Apply CORS headers to a Response object
 */
function applyCORSHeaders(response: Response, cors?: CORSConfig): Response {
  if (!cors) {
    return response
  }

  const corsHeaders = getCORSHeaders(cors)
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  return response
}

/**
 * Apply CORS headers to NextApiResponse
 */
function applyCORSHeadersToNextApiResponse(
  res: NextApiResponse,
  cors?: CORSConfig
): void {
  if (!cors) {
    return
  }

  const corsHeaders = getCORSHeaders(cors)
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value)
  })
}

/**
 * Validate request body against schema
 */
function validateRequest(
  body: any,
  schema: ValidationSchema
): { valid: boolean; error?: string } {
  // Check required fields
  if (schema.required) {
    for (const field of schema.required) {
      if (!(field in body) || body[field] === undefined || body[field] === null) {
        return {
          valid: false,
          error: `Missing required field: ${field}`,
        }
      }
    }
  }

  // Check optional fields types
  if (schema.optional) {
    for (const [field, type] of Object.entries(schema.optional)) {
      if (field in body && body[field] !== undefined) {
        const actualType = Array.isArray(body[field]) ? 'array' : typeof body[field]
        if (actualType !== type) {
          return {
            valid: false,
            error: `Invalid type for field ${field}: expected ${type}, got ${actualType}`,
          }
        }
      }
    }
  }

  // Run custom validation
  if (schema.validate) {
    return schema.validate(body)
  }

  return { valid: true }
}

/**
 * Execute a function with timeout
 */
async function executeWithTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  errorMessage: string
): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    ),
  ])
}

/**
 * Add heartbeat to a stream to keep connection alive
 */
function addHeartbeat(
  stream: ReadableStream<Uint8Array>,
  intervalMs: number
): ReadableStream<Uint8Array> {
  const reader = stream.getReader()
  let heartbeatTimer: NodeJS.Timeout | null = null

  return new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()

      // Start heartbeat
      heartbeatTimer = setInterval(() => {
        controller.enqueue(encoder.encode(': heartbeat\n\n'))
      }, intervalMs)

      try {
        while (true) {
          const { done, value } = await reader.read()

          if (done) {
            break
          }

          controller.enqueue(value)
        }
      } finally {
        if (heartbeatTimer) {
          clearInterval(heartbeatTimer)
        }
        controller.close()
        reader.releaseLock()
      }
    },

    cancel() {
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer)
      }
      reader.cancel()
    },
  })
}
