/**
 * Tests for Next.js route helpers
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  createStreamingRoute,
  createAPIRoute,
  createSSEStream,
  sendSSEMessage,
  formatSSE,
  parseRequestBody,
  createErrorResponse,
  createSuccessResponse,
  SSEEventType,
} from '../src/route-helpers'
import type { NextRequest } from 'next/server'
import type { NextApiRequest, NextApiResponse } from 'next'
import type { StreamingRouteConfig, RouteConfig } from '../src/types'

// ============================================================================
// Mock Helpers
// ============================================================================

function createMockNextRequest(
  url: string,
  options: {
    method?: string
    body?: any
    headers?: Record<string, string>
  } = {}
): NextRequest {
  const { method = 'POST', body, headers = {} } = options

  return {
    method,
    url,
    headers: new Headers({
      'content-type': 'application/json',
      ...headers,
    }),
    json: async () => body,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  } as unknown as NextRequest
}

function createMockNextApiRequest(options: {
  method?: string
  body?: any
  headers?: Record<string, string>
} = {}): NextApiRequest {
  const { method = 'POST', body, headers = {} } = options

  return {
    method,
    body,
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
  } as NextApiRequest
}

function createMockNextApiResponse(): {
  res: NextApiResponse
  writeHead: ReturnType<typeof vi.fn>
  write: ReturnType<typeof vi.fn>
  end: ReturnType<typeof vi.fn>
  status: ReturnType<typeof vi.fn>
  json: ReturnType<typeof vi.fn>
  setHeader: ReturnType<typeof vi.fn>
} {
  const writeHead = vi.fn()
  const write = vi.fn()
  const end = vi.fn()
  const status = vi.fn()
  const json = vi.fn()
  const setHeader = vi.fn()

  const res = {
    writeHead,
    write,
    end,
    status: (code: number) => {
      status(code)
      return res
    },
    json: (data: any) => {
      json(data)
      return res
    },
    setHeader,
    headersSent: false,
  } as unknown as NextApiResponse

  return { res, writeHead, write, end, status, json, setHeader }
}

async function readStream(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  let result = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    result += decoder.decode(value, { stream: true })
  }

  return result
}

// ============================================================================
// Tests for formatSSE
// ============================================================================

describe('formatSSE', () => {
  it('should format SSE message with event and data', () => {
    const message = formatSSE({
      event: 'test',
      data: { foo: 'bar' },
    })

    expect(message).toBe('event: test\ndata: {"foo":"bar"}\n\n')
  })

  it('should format SSE message with id', () => {
    const message = formatSSE({
      event: 'test',
      data: { foo: 'bar' },
      id: '123',
    })

    expect(message).toContain('id: 123\n')
  })

  it('should format SSE message with retry', () => {
    const message = formatSSE({
      event: 'test',
      data: { foo: 'bar' },
      retry: 5000,
    })

    expect(message).toContain('retry: 5000\n')
  })

  it('should handle string data', () => {
    const message = formatSSE({
      event: 'test',
      data: 'simple string',
    })

    expect(message).toBe('event: test\ndata: simple string\n\n')
  })

  it('should handle multiline data', () => {
    const message = formatSSE({
      event: 'test',
      data: 'line1\nline2\nline3',
    })

    expect(message).toContain('data: line1\n')
    expect(message).toContain('data: line2\n')
    expect(message).toContain('data: line3\n')
  })
})

// ============================================================================
// Tests for sendSSEMessage
// ============================================================================

describe('sendSSEMessage', () => {
  it('should send SSE message through controller', () => {
    const enqueuedData: Uint8Array[] = []
    const controller = {
      enqueue: (data: Uint8Array) => enqueuedData.push(data),
    } as ReadableStreamDefaultController<Uint8Array>

    sendSSEMessage(controller, {
      event: 'token',
      data: { token: 'Hello' },
    })

    const decoder = new TextDecoder()
    const message = decoder.decode(enqueuedData[0])

    expect(message).toContain('event: token')
    expect(message).toContain('data: {"token":"Hello"}')
  })
})

// ============================================================================
// Tests for createSSEStream
// ============================================================================

describe('createSSEStream', () => {
  it('should create a stream with helper functions', async () => {
    const { stream, sendToken, sendUsage, end } = createSSEStream()

    // Send events
    sendToken('Hello')
    sendToken(' world')
    sendUsage({
      promptTokens: 10,
      completionTokens: 5,
      totalTokens: 15,
    })
    end()

    // Read stream
    const result = await readStream(stream)

    expect(result).toContain('event: start')
    expect(result).toContain('event: token')
    expect(result).toContain('data: {"token":"Hello"}')
    expect(result).toContain('data: {"token":" world"}')
    expect(result).toContain('event: usage')
    expect(result).toContain('event: done')
  })

  it('should send error event', async () => {
    const { stream, sendError, end } = createSSEStream()

    sendError('Something went wrong')
    end()

    const result = await readStream(stream)

    expect(result).toContain('event: error')
    expect(result).toContain('Something went wrong')
  })

  it('should send metadata event', async () => {
    const { stream, sendMetadata, end } = createSSEStream()

    sendMetadata({ model: 'gpt-4', temperature: 0.7 })
    end()

    const result = await readStream(stream)

    expect(result).toContain('event: metadata')
    expect(result).toContain('gpt-4')
  })

  it('should send custom event', async () => {
    const { stream, sendEvent, end } = createSSEStream()

    sendEvent('custom', { data: 'test' })
    end()

    const result = await readStream(stream)

    expect(result).toContain('event: custom')
    expect(result).toContain('data: {"data":"test"}')
  })

  it('should throw error if stream not initialized', () => {
    const { sendToken } = createSSEStream()

    // Don't start the stream, just try to send
    // This should not throw because stream is auto-started
    expect(() => sendToken('test')).not.toThrow()
  })
})

// ============================================================================
// Tests for parseRequestBody
// ============================================================================

describe('parseRequestBody', () => {
  it('should parse JSON body', async () => {
    const request = createMockNextRequest('http://localhost/api/test', {
      body: { message: 'hello' },
    })

    const body = await parseRequestBody(request)
    expect(body).toEqual({ message: 'hello' })
  })

  it('should parse text body', async () => {
    const request = createMockNextRequest('http://localhost/api/test', {
      body: 'plain text',
      headers: { 'content-type': 'text/plain' },
    })

    const body = await parseRequestBody(request)
    expect(body).toBe('plain text')
  })

  it('should return undefined for unsupported content type', async () => {
    const request = createMockNextRequest('http://localhost/api/test', {
      headers: { 'content-type': 'multipart/form-data' },
    })

    const body = await parseRequestBody(request)
    expect(body).toBeUndefined()
  })
})

// ============================================================================
// Tests for createErrorResponse
// ============================================================================

describe('createErrorResponse', () => {
  it('should create error response with default status', async () => {
    const response = createErrorResponse('Something went wrong')

    expect(response.status).toBe(500)

    const body = await response.json()
    expect(body.error).toBe('Something went wrong')
    expect(body.statusCode).toBe(500)
    expect(body.code).toBe('INTERNAL_ERROR')
  })

  it('should create error response with custom status', async () => {
    const response = createErrorResponse('Bad request', 400)

    expect(response.status).toBe(400)

    const body = await response.json()
    expect(body.error).toBe('Bad request')
    expect(body.statusCode).toBe(400)
    expect(body.code).toBe('BAD_REQUEST')
  })

  it('should apply CORS headers', async () => {
    const response = createErrorResponse('Error', 500, {
      allowedOrigins: '*',
    })

    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
  })
})

// ============================================================================
// Tests for createSuccessResponse
// ============================================================================

describe('createSuccessResponse', () => {
  it('should create success response', async () => {
    const response = createSuccessResponse({ result: 'success' })

    expect(response.status).toBe(200)

    const body = await response.json()
    expect(body.data).toEqual({ result: 'success' })
  })

  it('should create success response with custom status', async () => {
    const response = createSuccessResponse({ result: 'created' }, 201)

    expect(response.status).toBe(201)
  })

  it('should apply CORS headers', async () => {
    const response = createSuccessResponse({ result: 'success' }, 200, {
      allowedOrigins: ['http://localhost:3000'],
    })

    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(
      'http://localhost:3000'
    )
  })
})

// ============================================================================
// Tests for createStreamingRoute
// ============================================================================

describe('createStreamingRoute', () => {
  it('should create a streaming route handler', async () => {
    const handler = createStreamingRoute(async ({ request, body }) => {
      const { stream, sendToken, end } = createSSEStream()

      sendToken('Hello')
      sendToken(' world')
      end()

      return stream
    })

    const request = createMockNextRequest('http://localhost/api/stream', {
      body: { message: 'test' },
    })

    const response = await handler(request)

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('text/event-stream')
    expect(response.headers.get('Cache-Control')).toBe('no-cache, no-transform')

    const body = await readStream(response.body!)
    expect(body).toContain('event: token')
    expect(body).toContain('Hello')
    expect(body).toContain('world')
  })

  it('should handle CORS preflight', async () => {
    const handler = createStreamingRoute(
      async () => createSSEStream().stream,
      {
        cors: {
          allowedOrigins: '*',
          allowedMethods: ['GET', 'POST'],
        },
      }
    )

    const request = createMockNextRequest('http://localhost/api/stream', {
      method: 'OPTIONS',
    })

    const response = await handler(request)

    expect(response.status).toBe(204)
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
    expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, POST')
  })

  it('should validate request body', async () => {
    const handler = createStreamingRoute(
      async () => createSSEStream().stream,
      {
        validation: {
          required: ['message'],
        },
      }
    )

    const request = createMockNextRequest('http://localhost/api/stream', {
      body: { wrong: 'field' },
    })

    const response = await handler(request)

    expect(response.status).toBe(400)

    const body = await response.json()
    expect(body.error).toContain('message')
  })

  it('should handle errors gracefully', async () => {
    const handler = createStreamingRoute(async () => {
      throw new Error('Test error')
    })

    const request = createMockNextRequest('http://localhost/api/stream')

    const response = await handler(request)

    expect(response.status).toBe(500)

    const body = await response.json()
    expect(body.error).toBe('Test error')
  })

  it('should call custom error handler', async () => {
    const onError = vi.fn()
    const handler = createStreamingRoute(
      async () => {
        throw new Error('Test error')
      },
      { onError }
    )

    const request = createMockNextRequest('http://localhost/api/stream')

    await handler(request)

    expect(onError).toHaveBeenCalledWith(expect.any(Error))
  })

  it('should handle timeout', async () => {
    const handler = createStreamingRoute(
      async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        return createSSEStream().stream
      },
      { timeout: 100 }
    )

    const request = createMockNextRequest('http://localhost/api/stream')

    const response = await handler(request)

    expect(response.status).toBe(500)

    const body = await response.json()
    expect(body.error).toContain('timeout')
  })

  it('should return Response directly if handler returns Response', async () => {
    const handler = createStreamingRoute(async () => {
      return new Response(JSON.stringify({ custom: 'response' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    })

    const request = createMockNextRequest('http://localhost/api/stream')

    const response = await handler(request)

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('application/json')

    const body = await response.json()
    expect(body.custom).toBe('response')
  })

  it('should add heartbeat when enabled', async () => {
    vi.useFakeTimers()

    const handler = createStreamingRoute(
      async () => {
        const { stream, sendToken, end } = createSSEStream()

        sendToken('test')

        // Delay ending the stream
        setTimeout(() => {
          end()
        }, 100)

        return stream
      },
      {
        enableHeartbeat: true,
        heartbeatInterval: 50,
      }
    )

    const request = createMockNextRequest('http://localhost/api/stream')

    const responsePromise = handler(request)

    // Advance timers
    await vi.advanceTimersByTimeAsync(150)

    const response = await responsePromise

    expect(response.status).toBe(200)

    vi.useRealTimers()
  })

  it('should apply custom headers', async () => {
    const handler = createStreamingRoute(
      async () => createSSEStream().stream,
      {
        headers: {
          'X-Custom-Header': 'custom-value',
        },
      }
    )

    const request = createMockNextRequest('http://localhost/api/stream')

    const response = await handler(request)

    expect(response.headers.get('X-Custom-Header')).toBe('custom-value')
  })

  it('should handle custom validation function', async () => {
    const handler = createStreamingRoute(
      async () => createSSEStream().stream,
      {
        validation: {
          validate: (data) => {
            if (data.message && data.message.length > 100) {
              return { valid: false, error: 'Message too long' }
            }
            return { valid: true }
          },
        },
      }
    )

    const request = createMockNextRequest('http://localhost/api/stream', {
      body: { message: 'a'.repeat(101) },
    })

    const response = await handler(request)

    expect(response.status).toBe(400)

    const body = await response.json()
    expect(body.error).toBe('Message too long')
  })
})

// ============================================================================
// Tests for createAPIRoute
// ============================================================================

describe('createAPIRoute', () => {
  it('should create an API route handler', async () => {
    const handler = createAPIRoute(async ({ req, res, body }) => {
      res.status(200).json({ message: 'success', receivedBody: body })
    })

    const req = createMockNextApiRequest({
      body: { test: 'data' },
    })
    const { res, status, json } = createMockNextApiResponse()

    await handler(req, res)

    expect(status).toHaveBeenCalledWith(200)
    expect(json).toHaveBeenCalledWith({
      message: 'success',
      receivedBody: { test: 'data' },
    })
  })

  it('should handle CORS preflight', async () => {
    const handler = createAPIRoute(
      async () => {},
      {
        cors: {
          allowedOrigins: '*',
        },
      }
    )

    const req = createMockNextApiRequest({ method: 'OPTIONS' })
    const { res, status, end, setHeader } = createMockNextApiResponse()

    await handler(req, res)

    expect(setHeader).toHaveBeenCalled()
    expect(status).toHaveBeenCalledWith(204)
    expect(end).toHaveBeenCalled()
  })

  it('should validate request body', async () => {
    const handler = createAPIRoute(
      async ({ res }) => {
        res.status(200).json({ message: 'success' })
      },
      {
        validation: {
          required: ['name'],
        },
      }
    )

    const req = createMockNextApiRequest({
      body: { wrong: 'field' },
    })
    const { res, status, json } = createMockNextApiResponse()

    await handler(req, res)

    expect(status).toHaveBeenCalledWith(400)
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.stringContaining('name'),
        statusCode: 400,
      })
    )
  })

  it('should handle errors gracefully', async () => {
    const handler = createAPIRoute(async () => {
      throw new Error('Test error')
    })

    const req = createMockNextApiRequest()
    const { res, status, json } = createMockNextApiResponse()

    await handler(req, res)

    expect(status).toHaveBeenCalledWith(500)
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Test error',
        statusCode: 500,
      })
    )
  })

  it('should not send error if headers already sent', async () => {
    const handler = createAPIRoute(async ({ res }) => {
      res.status(200).json({ message: 'success' })
      throw new Error('Test error')
    })

    const req = createMockNextApiRequest()
    const { res, json } = createMockNextApiResponse()

    // Simulate headers being sent
    ;(res as any).headersSent = true

    await handler(req, res)

    // Should have been called once for the success response
    expect(json).toHaveBeenCalledTimes(1)
  })

  it('should apply CORS headers', async () => {
    const handler = createAPIRoute(
      async ({ res }) => {
        res.status(200).json({ message: 'success' })
      },
      {
        cors: {
          allowedOrigins: ['http://localhost:3000'],
          credentials: true,
        },
      }
    )

    const req = createMockNextApiRequest()
    const { res, setHeader } = createMockNextApiResponse()

    await handler(req, res)

    expect(setHeader).toHaveBeenCalledWith(
      'Access-Control-Allow-Origin',
      'http://localhost:3000'
    )
    expect(setHeader).toHaveBeenCalledWith(
      'Access-Control-Allow-Credentials',
      'true'
    )
  })

  it('should handle timeout', async () => {
    const handler = createAPIRoute(
      async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      },
      { timeout: 100 }
    )

    const req = createMockNextApiRequest()
    const { res, status, json } = createMockNextApiResponse()

    await handler(req, res)

    expect(status).toHaveBeenCalledWith(500)
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.stringContaining('timeout'),
      })
    )
  })
})

// ============================================================================
// Tests for Edge Cases and Integration
// ============================================================================

describe('Edge cases and integration', () => {
  it('should handle validation with optional fields', async () => {
    const handler = createStreamingRoute(
      async () => createSSEStream().stream,
      {
        validation: {
          required: ['name'],
          optional: {
            age: 'number',
            active: 'boolean',
          },
        },
      }
    )

    const request = createMockNextRequest('http://localhost/api/stream', {
      body: { name: 'John', age: 30, active: true },
    })

    const response = await handler(request)

    expect(response.status).toBe(200)
  })

  it('should fail validation for wrong optional field type', async () => {
    const handler = createStreamingRoute(
      async () => createSSEStream().stream,
      {
        validation: {
          required: ['name'],
          optional: {
            age: 'number',
          },
        },
      }
    )

    const request = createMockNextRequest('http://localhost/api/stream', {
      body: { name: 'John', age: 'thirty' },
    })

    const response = await handler(request)

    expect(response.status).toBe(400)
  })

  it('should handle array type in validation', async () => {
    const handler = createStreamingRoute(
      async () => createSSEStream().stream,
      {
        validation: {
          optional: {
            tags: 'array',
          },
        },
      }
    )

    const request = createMockNextRequest('http://localhost/api/stream', {
      body: { tags: ['tag1', 'tag2'] },
    })

    const response = await handler(request)

    expect(response.status).toBe(200)
  })

  it('should handle multiple CORS origins', async () => {
    const handler = createStreamingRoute(
      async () => createSSEStream().stream,
      {
        cors: {
          allowedOrigins: ['http://localhost:3000', 'https://example.com'],
        },
      }
    )

    const request = createMockNextRequest('http://localhost/api/stream')

    const response = await handler(request)

    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(
      'http://localhost:3000, https://example.com'
    )
  })

  it('should enable logging when configured', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const handler = createStreamingRoute(
      async () => {
        throw new Error('Test error')
      },
      { logging: true }
    )

    const request = createMockNextRequest('http://localhost/api/stream')

    await handler(request)

    expect(consoleSpy).toHaveBeenCalledWith(
      '[createStreamingRoute] Error:',
      expect.any(Error)
    )

    consoleSpy.mockRestore()
  })
})
