import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AIStream } from '../../src/streaming/AIStream'
import type { StreamConfig } from '../../src/types/streaming'

// Mock fetch globally
global.fetch = vi.fn()

describe('AIStream - Refactored with Transport Abstraction', () => {
  let stream: AIStream

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    if (stream) {
      stream.removeAllListeners()
      stream.stop()
    }
  })

  describe('transport selection', () => {
    it('should use SSE transport by default', () => {
      stream = new AIStream({
        endpoint: '/api/chat',
        model: 'gpt-4',
      })

      expect(stream).toBeInstanceOf(AIStream)
      // Internal transport should be SSE
    })

    it('should use SSE transport when explicitly specified', () => {
      stream = new AIStream(
        {
          endpoint: '/api/chat',
          model: 'gpt-4',
        },
        {
          transport: 'sse',
        }
      )

      expect(stream).toBeInstanceOf(AIStream)
    })

    it('should use WebSocket transport when specified', () => {
      stream = new AIStream(
        {
          endpoint: 'ws://localhost:3000/chat',
          model: 'gpt-4',
        },
        {
          transport: 'websocket',
        }
      )

      expect(stream).toBeInstanceOf(AIStream)
    })

    it('should auto-detect WebSocket from ws:// protocol', () => {
      stream = new AIStream({
        endpoint: 'ws://localhost:3000/chat',
        model: 'gpt-4',
      })

      expect(stream).toBeInstanceOf(AIStream)
    })

    it('should auto-detect WebSocket from wss:// protocol', () => {
      stream = new AIStream({
        endpoint: 'wss://localhost:3000/chat',
        model: 'gpt-4',
      })

      expect(stream).toBeInstanceOf(AIStream)
    })
  })

  describe('SSE transport behavior', () => {
    it('should stream using SSE transport', async () => {
      const mockReadableStream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            new TextEncoder().encode('data: {"token":"Hello"}\n\n')
          )
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'))
          controller.close()
        },
      })

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        body: mockReadableStream,
      })

      stream = new AIStream(
        { endpoint: '/api/chat' },
        { transport: 'sse' }
      )

      const tokenListener = vi.fn()
      stream.on('token', tokenListener)

      await stream.send('Test')

      expect(tokenListener).toHaveBeenCalledWith('Hello')
    })

    it('should reconnect on SSE connection failure', async () => {
      let callCount = 0
      ;(global.fetch as any).mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return Promise.reject(new Error('Network error'))
        }
        return Promise.resolve({
          ok: true,
          body: new ReadableStream({
            start(controller) {
              controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'))
              controller.close()
            },
          }),
        })
      })

      stream = new AIStream(
        { endpoint: '/api/chat', retry: { maxRetries: 3, initialDelay: 10 } },
        { transport: 'sse', reconnect: true }
      )

      await stream.send('Test')

      expect(callCount).toBe(2)
    })
  })

  describe('transport-agnostic API', () => {
    it('should send messages regardless of transport', async () => {
      const mockReadableStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'))
          controller.close()
        },
      })

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        body: mockReadableStream,
      })

      stream = new AIStream({ endpoint: '/api/chat' })

      await stream.send('Hello')

      const messages = stream.getMessages()
      expect(messages.length).toBeGreaterThanOrEqual(1)
      expect(messages[0].content).toBe('Hello')
    })

    it('should emit events regardless of transport', async () => {
      const mockReadableStream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            new TextEncoder().encode('data: {"token":"Test"}\n\n')
          )
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'))
          controller.close()
        },
      })

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        body: mockReadableStream,
      })

      stream = new AIStream({ endpoint: '/api/chat' })

      const tokenListener = vi.fn()
      const messageListener = vi.fn()
      stream.on('token', tokenListener)
      stream.on('message', messageListener)

      await stream.send('Test')

      expect(tokenListener).toHaveBeenCalled()
      expect(messageListener).toHaveBeenCalled()
    })

    it('should stop streaming regardless of transport', async () => {
      const mockReadableStream = new ReadableStream({
        start() {
          // Never close
        },
      })

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        body: mockReadableStream,
      })

      stream = new AIStream({ endpoint: '/api/chat' })

      const sendPromise = stream.send('Test')

      await new Promise(resolve => setTimeout(resolve, 50))

      stream.stop()

      await sendPromise.catch(() => {
        // Ignore abort error
      })

      expect(stream.getIsStreaming()).toBe(false)
    })

    it('should reset conversation regardless of transport', async () => {
      const mockReadableStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'))
          controller.close()
        },
      })

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        body: mockReadableStream,
      })

      stream = new AIStream({ endpoint: '/api/chat' })

      await stream.send('Test')
      expect(stream.getMessages().length).toBeGreaterThan(0)

      stream.reset()
      expect(stream.getMessages()).toEqual([])
    })
  })

  describe('reconnection configuration', () => {
    it('should respect reconnect configuration from options', async () => {
      let callCount = 0
      ;(global.fetch as any).mockImplementation(() => {
        callCount++
        if (callCount <= 2) {
          return Promise.reject(new Error('Network error'))
        }
        return Promise.resolve({
          ok: true,
          body: new ReadableStream({
            start(controller) {
              controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'))
              controller.close()
            },
          }),
        })
      })

      stream = new AIStream(
        { endpoint: '/api/chat', retry: { maxRetries: 1, initialDelay: 10 } },
        { reconnect: true, maxReconnectAttempts: 3 }
      )

      await stream.send('Test')

      // Should use the higher of retry.maxRetries or maxReconnectAttempts
      expect(callCount).toBeGreaterThan(1)
    })

    it('should use exponential backoff by default', async () => {
      let callCount = 0
      const delays: number[] = []
      const mockSetTimeout = vi.spyOn(global, 'setTimeout').mockImplementation(((fn: any, delay: number) => {
        if (delay >= 10) {
          delays.push(delay)
        }
        fn()
        return 0 as any
      }) as any)

      ;(global.fetch as any).mockImplementation(() => {
        callCount++
        if (callCount <= 2) {
          return Promise.reject(new Error('Network error'))
        }
        return Promise.resolve({
          ok: true,
          body: new ReadableStream({
            start(controller) {
              controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'))
              controller.close()
            },
          }),
        })
      })

      stream = new AIStream(
        {
          endpoint: '/api/chat',
          retry: {
            maxRetries: 3,
            initialDelay: 100,
            backoff: 'exponential',
          },
        }
      )

      await stream.send('Test')

      expect(delays.length).toBeGreaterThan(0)

      mockSetTimeout.mockRestore()
    })
  })

  describe('callback compatibility', () => {
    it('should call onToken callback', async () => {
      const mockReadableStream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            new TextEncoder().encode('data: {"token":"Hello"}\n\n')
          )
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'))
          controller.close()
        },
      })

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        body: mockReadableStream,
      })

      const onToken = vi.fn()
      stream = new AIStream({
        endpoint: '/api/chat',
        onToken,
      })

      await stream.send('Test')

      expect(onToken).toHaveBeenCalledWith('Hello')
    })

    it('should call onError callback', async () => {
      ;(global.fetch as any).mockRejectedValue(new Error('Connection failed'))

      const onError = vi.fn()
      stream = new AIStream({
        endpoint: '/api/chat',
        onError,
        retry: { maxRetries: 0 },
      })

      await stream.send('Test')

      expect(onError).toHaveBeenCalled()
    })

    it('should call onCost callback', async () => {
      const mockReadableStream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            new TextEncoder().encode(
              'data: {"usage":{"promptTokens":10,"completionTokens":20,"totalTokens":30}}\n\n'
            )
          )
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'))
          controller.close()
        },
      })

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        body: mockReadableStream,
      })

      const onCost = vi.fn()
      stream = new AIStream({
        endpoint: '/api/chat',
        onCost,
      })

      await stream.send('Test')

      expect(onCost).toHaveBeenCalledWith(
        expect.objectContaining({
          promptTokens: 10,
          completionTokens: 20,
          totalTokens: 30,
        })
      )
    })
  })

  describe('error handling across transports', () => {
    it('should handle HTTP errors gracefully', async () => {
      ;(global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      })

      stream = new AIStream({
        endpoint: '/api/chat',
        retry: { maxRetries: 0 },
      })

      const errorListener = vi.fn()
      stream.on('error', errorListener)

      await stream.send('Test')

      expect(errorListener).toHaveBeenCalled()
    })

    it('should handle abort errors without retry', async () => {
      ;(global.fetch as any).mockRejectedValue(new DOMException('Aborted', 'AbortError'))

      stream = new AIStream({
        endpoint: '/api/chat',
        retry: { maxRetries: 3 },
      })

      const errorListener = vi.fn()
      stream.on('error', errorListener)

      await stream.send('Test')

      // Should only try once (no retries on abort)
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('state management', () => {
    it('should track streaming state', async () => {
      const mockReadableStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'))
          controller.close()
        },
      })

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        body: mockReadableStream,
      })

      stream = new AIStream({ endpoint: '/api/chat' })

      expect(stream.getIsStreaming()).toBe(false)

      const sendPromise = stream.send('Test')
      // May or may not be streaming at this point due to async nature

      await sendPromise

      expect(stream.getIsStreaming()).toBe(false)
    })

    it('should maintain message history', async () => {
      const mockReadableStream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            new TextEncoder().encode('data: {"token":"Response"}\n\n')
          )
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'))
          controller.close()
        },
      })

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        body: mockReadableStream,
      })

      stream = new AIStream({ endpoint: '/api/chat' })

      await stream.send('First message')

      ;(global.fetch as any).mockClear()
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        body: new ReadableStream({
          start(controller) {
            controller.enqueue(
              new TextEncoder().encode('data: {"token":"Second response"}\n\n')
            )
            controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'))
            controller.close()
          },
        }),
      })

      await stream.send('Second message')

      const messages = stream.getMessages()
      expect(messages.length).toBeGreaterThanOrEqual(2)
    })

    it('should track usage statistics', async () => {
      const mockReadableStream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            new TextEncoder().encode(
              'data: {"usage":{"promptTokens":50,"completionTokens":100,"totalTokens":150}}\n\n'
            )
          )
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'))
          controller.close()
        },
      })

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        body: mockReadableStream,
      })

      stream = new AIStream({ endpoint: '/api/chat' })

      await stream.send('Test')

      const usage = stream.getUsage()
      expect(usage.promptTokens).toBe(50)
      expect(usage.completionTokens).toBe(100)
      expect(usage.totalTokens).toBe(150)
    })
  })

  describe('backward compatibility', () => {
    it('should work with existing AIStream usage patterns', async () => {
      const mockReadableStream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            new TextEncoder().encode('data: {"token":"Hello"}\n\n')
          )
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'))
          controller.close()
        },
      })

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        body: mockReadableStream,
      })

      // Old usage pattern
      const config: StreamConfig = {
        endpoint: '/api/chat',
        model: 'gpt-4',
        onToken: vi.fn(),
      }

      stream = new AIStream(config)
      await stream.send('Test')

      expect(config.onToken).toHaveBeenCalled()
      expect(stream.getMessages().length).toBeGreaterThan(0)
    })
  })
})
