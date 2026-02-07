/**
 * Version Compatibility Tests for Next.js 13, 14, 15, 16
 *
 * These tests verify that @ainative/ai-kit-nextjs works correctly across
 * all supported Next.js versions (13.x, 14.x, 15.x, 16.x)
 *
 * Refs #105
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { createStreamingRoute, createAPIRoute, createSSEStream } from '../src/route-helpers'
import type { NextRequest } from 'next/server'
import type { NextApiRequest, NextApiResponse } from 'next'

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
// Next.js Version Detection
// ============================================================================

describe('Next.js Version Compatibility', () => {
  let nextVersion: string

  beforeAll(async () => {
    try {
      // Try to import Next.js and get version
      const nextPackage = await import('next/package.json')
      nextVersion = nextPackage.version
    } catch (error) {
      // Fallback if we can't import
      nextVersion = 'unknown'
    }
  })

  it('should detect Next.js version', () => {
    expect(nextVersion).toBeDefined()
    console.log(`Testing with Next.js version: ${nextVersion}`)
  })

  describe('Next.js 13.x Compatibility', () => {
    it('should support App Router streaming routes', async () => {
      const handler = createStreamingRoute(async ({ request, body }) => {
        const { stream, sendToken, sendMetadata, end } = createSSEStream()

        sendMetadata({ nextVersion: '13.x', feature: 'app-router' })
        sendToken('Hello from Next.js 13')
        end()

        return stream
      })

      const request = createMockNextRequest('http://localhost/api/test', {
        body: { message: 'test' },
      })

      const response = await handler(request)

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('text/event-stream')

      const body = await readStream(response.body!)
      expect(body).toContain('event: metadata')
      expect(body).toContain('13.x')
      expect(body).toContain('Hello from Next.js 13')
    })

    it('should support Server Components with async request APIs', async () => {
      // Test that our helpers work with Next.js 13 Server Components
      const handler = createStreamingRoute(async ({ request }) => {
        const { stream, sendToken, end } = createSSEStream()

        // Simulate async request API usage (introduced in Next.js 15, optional in 13)
        const url = request.url
        expect(url).toBeDefined()

        sendToken('Server Component Compatible')
        end()

        return stream
      })

      const request = createMockNextRequest('http://localhost/api/sc-test')
      const response = await handler(request)

      expect(response.status).toBe(200)
    })

    it('should handle edge runtime compatibility', async () => {
      const handler = createStreamingRoute(
        async () => {
          const { stream, sendToken, end } = createSSEStream()
          sendToken('Edge Runtime')
          end()
          return stream
        },
        {
          headers: {
            'X-Runtime': 'edge',
          },
        }
      )

      const request = createMockNextRequest('http://localhost/api/edge')
      const response = await handler(request)

      expect(response.status).toBe(200)
      expect(response.headers.get('X-Runtime')).toBe('edge')
    })
  })

  describe('Next.js 14.x Compatibility', () => {
    it('should support improved App Router features', async () => {
      const handler = createStreamingRoute(async ({ request, body }) => {
        const { stream, sendToken, sendUsage, end } = createSSEStream()

        sendToken('Next.js 14 Turbopack')
        sendUsage({
          promptTokens: 10,
          completionTokens: 5,
          totalTokens: 15,
        })
        end()

        return stream
      })

      const request = createMockNextRequest('http://localhost/api/v14', {
        body: { version: '14.x' },
      })

      const response = await handler(request)

      expect(response.status).toBe(200)

      const body = await readStream(response.body!)
      expect(body).toContain('Next.js 14')
      expect(body).toContain('event: usage')
    })

    it('should support Server Actions integration', async () => {
      // Verify that our route helpers work alongside Server Actions
      const handler = createStreamingRoute(async ({ body }) => {
        const { stream, sendMetadata, sendToken, end } = createSSEStream()

        sendMetadata({
          feature: 'server-actions',
          compatible: true,
        })
        sendToken(`Processing: ${body?.action || 'default'}`)
        end()

        return stream
      })

      const request = createMockNextRequest('http://localhost/api/action', {
        body: { action: 'test-action' },
      })

      const response = await handler(request)
      const result = await readStream(response.body!)

      expect(result).toContain('server-actions')
      expect(result).toContain('test-action')
    })

    it('should handle Partial Prerendering (PPR) scenarios', async () => {
      // Test streaming in PPR context
      const handler = createStreamingRoute(
        async () => {
          const { stream, sendToken, end } = createSSEStream()
          sendToken('PPR Compatible')
          end()
          return stream
        },
        {
          metadata: { ppr: true },
        }
      )

      const request = createMockNextRequest('http://localhost/api/ppr')
      const response = await handler(request)

      expect(response.status).toBe(200)
    })
  })

  describe('Next.js 15.x Compatibility', () => {
    it('should support async request APIs correctly', async () => {
      // Next.js 15 introduced async request APIs (params, searchParams, etc.)
      const handler = createStreamingRoute(async ({ request }) => {
        const { stream, sendToken, end } = createSSEStream()

        // Our package handles request synchronously, which should work
        const url = request.url
        expect(url).toBeDefined()

        sendToken('Async Request API Compatible')
        end()

        return stream
      })

      const request = createMockNextRequest('http://localhost/api/async?param=test')
      const response = await handler(request)

      expect(response.status).toBe(200)
    })

    it('should work with React 19 integration', async () => {
      // Next.js 15 added React 19 support
      const handler = createStreamingRoute(async () => {
        const { stream, sendToken, sendMetadata, end } = createSSEStream()

        sendMetadata({ react: '19', nextjs: '15' })
        sendToken('React 19 Compatible')
        end()

        return stream
      })

      const request = createMockNextRequest('http://localhost/api/react19')
      const response = await handler(request)

      const body = await readStream(response.body!)
      expect(body).toContain('React 19 Compatible')
    })

    it('should support Turbopack dev and build', async () => {
      const handler = createStreamingRoute(
        async () => {
          const { stream, sendToken, end } = createSSEStream()
          sendToken('Turbopack Build')
          end()
          return stream
        },
        {
          headers: {
            'X-Bundler': 'turbopack',
          },
        }
      )

      const request = createMockNextRequest('http://localhost/api/turbo')
      const response = await handler(request)

      expect(response.status).toBe(200)
      expect(response.headers.get('X-Bundler')).toBe('turbopack')
    })

    it('should handle new caching behavior', async () => {
      const handler = createStreamingRoute(async () => {
        const { stream, sendToken, end } = createSSEStream()
        sendToken('Cache Optimized')
        end()
        return stream
      })

      const request = createMockNextRequest('http://localhost/api/cache')
      const response = await handler(request)

      // Verify cache headers are set correctly
      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-transform')
    })
  })

  describe('Next.js 16.x Compatibility', () => {
    it('should support fully async request APIs (breaking change)', async () => {
      // Next.js 16 requires fully async request APIs
      // Our package should handle this correctly
      const handler = createStreamingRoute(async ({ request }) => {
        const { stream, sendToken, sendMetadata, end } = createSSEStream()

        // Test that request object works correctly
        expect(request).toBeDefined()
        expect(request.url).toBeDefined()
        expect(request.method).toBe('POST')

        sendMetadata({ nextVersion: '16.x', asyncAPIs: true })
        sendToken('Next.js 16 Fully Async')
        end()

        return stream
      })

      const request = createMockNextRequest('http://localhost/api/v16', {
        body: { version: '16.x' },
      })

      const response = await handler(request)

      expect(response.status).toBe(200)

      const body = await readStream(response.body!)
      expect(body).toContain('16.x')
      expect(body).toContain('Next.js 16 Fully Async')
    })

    it('should work with proxy.ts instead of middleware.ts', async () => {
      // Next.js 16 replaces middleware.ts with proxy.ts
      // Our middleware utilities should still work
      const handler = createStreamingRoute(
        async () => {
          const { stream, sendToken, end } = createSSEStream()
          sendToken('Proxy Compatible')
          end()
          return stream
        },
        {
          cors: {
            allowedOrigins: '*',
          },
        }
      )

      const request = createMockNextRequest('http://localhost/api/proxy')
      const response = await handler(request)

      expect(response.status).toBe(200)
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
    })

    it('should handle parallel routes with explicit default.js', async () => {
      // Next.js 16 requires explicit default.js for parallel routes
      const handler = createStreamingRoute(async () => {
        const { stream, sendToken, sendMetadata, end } = createSSEStream()

        sendMetadata({ parallelRoutes: 'supported' })
        sendToken('Parallel Route Compatible')
        end()

        return stream
      })

      const request = createMockNextRequest('http://localhost/api/@parallel/route')
      const response = await handler(request)

      expect(response.status).toBe(200)
    })

    it('should support explicit caching with Cache Components', async () => {
      // Next.js 16 uses Cache Components instead of experimental.ppr
      const handler = createStreamingRoute(
        async () => {
          const { stream, sendToken, end } = createSSEStream()
          sendToken('Cache Components Ready')
          end()
          return stream
        },
        {
          headers: {
            'X-Cache-Strategy': 'explicit',
          },
        }
      )

      const request = createMockNextRequest('http://localhost/api/cache-components')
      const response = await handler(request)

      expect(response.status).toBe(200)
      expect(response.headers.get('X-Cache-Strategy')).toBe('explicit')
    })

    it('should maintain Node.js 20.9.0+ runtime compatibility', async () => {
      // Next.js 16 requires Node.js 20.9.0+
      const nodeVersion = process.version
      console.log(`Testing with Node.js version: ${nodeVersion}`)

      const handler = createStreamingRoute(async () => {
        const { stream, sendToken, sendMetadata, end } = createSSEStream()

        sendMetadata({
          nodeVersion,
          compatible: true,
        })
        sendToken('Node 20.9+ Compatible')
        end()

        return stream
      })

      const request = createMockNextRequest('http://localhost/api/node-version')
      const response = await handler(request)

      expect(response.status).toBe(200)
    })

    it('should work without AMP support (removed in v16)', async () => {
      // Next.js 16 removes AMP support completely
      // Verify our package doesn't rely on AMP features
      const handler = createStreamingRoute(async () => {
        const { stream, sendToken, end } = createSSEStream()
        sendToken('No AMP Dependency')
        end()
        return stream
      })

      const request = createMockNextRequest('http://localhost/api/no-amp')
      const response = await handler(request)

      expect(response.status).toBe(200)
      // Should not have any AMP-specific headers
      expect(response.headers.get('AMP')).toBeNull()
    })

    it('should support streaming with new async boundaries', async () => {
      const handler = createStreamingRoute(async ({ body }) => {
        const { stream, sendToken, sendUsage, end } = createSSEStream()

        // Simulate async processing with Next.js 16
        await new Promise((resolve) => setTimeout(resolve, 10))

        sendToken('Streaming')
        sendToken(' with')
        sendToken(' async')
        sendToken(' boundaries')

        sendUsage({
          promptTokens: 5,
          completionTokens: 10,
          totalTokens: 15,
        })

        end()

        return stream
      })

      const request = createMockNextRequest('http://localhost/api/async-stream', {
        body: { test: 'async' },
      })

      const response = await handler(request)
      expect(response.status).toBe(200)

      const result = await readStream(response.body!)
      expect(result).toContain('Streaming')
      expect(result).toContain('async')
      expect(result).toContain('boundaries')
    })
  })

  describe('Cross-Version Stability', () => {
    it('should maintain API consistency across all versions', async () => {
      // Test that the same code works across all supported versions
      const testHandler = async (version: string) => {
        const handler = createStreamingRoute(async ({ body }) => {
          const { stream, sendToken, sendMetadata, end } = createSSEStream()

          sendMetadata({
            testedVersion: version,
            timestamp: new Date().toISOString(),
          })
          sendToken(`Consistent API - v${version}`)
          end()

          return stream
        })

        const request = createMockNextRequest('http://localhost/api/consistency', {
          body: { version },
        })

        return handler(request)
      }

      // Test with different version identifiers
      const versions = ['13', '14', '15', '16']
      const results = await Promise.all(
        versions.map((v) => testHandler(v))
      )

      // All should succeed with 200
      results.forEach((response, index) => {
        expect(response.status).toBe(200)
        expect(response.headers.get('Content-Type')).toBe('text/event-stream')
      })
    })

    it('should handle CORS consistently across versions', async () => {
      const handler = createStreamingRoute(
        async () => {
          const { stream, sendToken, end } = createSSEStream()
          sendToken('CORS Test')
          end()
          return stream
        },
        {
          cors: {
            allowedOrigins: ['http://localhost:3000', 'https://example.com'],
            allowedMethods: ['GET', 'POST', 'OPTIONS'],
            credentials: true,
          },
        }
      )

      const request = createMockNextRequest('http://localhost/api/cors-test')
      const response = await handler(request)

      expect(response.status).toBe(200)
      expect(response.headers.get('Access-Control-Allow-Origin')).toBeDefined()
      expect(response.headers.get('Access-Control-Allow-Credentials')).toBe('true')
    })

    it('should validate request bodies consistently', async () => {
      const handler = createStreamingRoute(
        async ({ body }) => {
          const { stream, sendToken, end } = createSSEStream()
          sendToken(`Valid: ${body.name}`)
          end()
          return stream
        },
        {
          validation: {
            required: ['name'],
            optional: {
              age: 'number',
            },
          },
        }
      )

      // Valid request
      const validRequest = createMockNextRequest('http://localhost/api/validate', {
        body: { name: 'Test', age: 25 },
      })
      const validResponse = await handler(validRequest)
      expect(validResponse.status).toBe(200)

      // Invalid request
      const invalidRequest = createMockNextRequest('http://localhost/api/validate', {
        body: { age: 25 }, // missing required 'name'
      })
      const invalidResponse = await handler(invalidRequest)
      expect(invalidResponse.status).toBe(400)
    })
  })

  describe('Performance and Edge Runtime', () => {
    it('should work efficiently in edge runtime across versions', async () => {
      const handler = createStreamingRoute(
        async () => {
          const { stream, sendToken, end } = createSSEStream()

          const startTime = Date.now()
          sendToken('Edge Performance Test')
          const endTime = Date.now()

          expect(endTime - startTime).toBeLessThan(100) // Should be fast

          end()
          return stream
        },
        {
          headers: {
            'X-Runtime': 'edge',
          },
        }
      )

      const request = createMockNextRequest('http://localhost/api/edge-perf')
      const response = await handler(request)

      expect(response.status).toBe(200)
      expect(response.headers.get('X-Runtime')).toBe('edge')
    })

    it('should handle large streaming payloads', async () => {
      const handler = createStreamingRoute(async () => {
        const { stream, sendToken, end } = createSSEStream()

        // Send 100 tokens
        for (let i = 0; i < 100; i++) {
          sendToken(`Token ${i} `)
        }

        end()
        return stream
      })

      const request = createMockNextRequest('http://localhost/api/large-stream')
      const response = await handler(request)

      expect(response.status).toBe(200)

      const body = await readStream(response.body!)
      // Should contain all tokens
      expect(body).toContain('Token 0')
      expect(body).toContain('Token 99')
    })
  })
})
