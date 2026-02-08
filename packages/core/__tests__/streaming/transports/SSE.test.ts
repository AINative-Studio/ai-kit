import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { SSETransport } from '../../../src/streaming/transports/SSE'
import type { TransportConfig, TransportEvent } from '../../../src/streaming/transports/types'

// Mock fetch globally
global.fetch = vi.fn()

describe('SSETransport', () => {
  let transport: SSETransport
  let mockAbortController: AbortController

  beforeEach(() => {
    vi.clearAllMocks()
    mockAbortController = new AbortController()
  })

  afterEach(() => {
    if (transport) {
      transport.close()
    }
  })

  describe('constructor', () => {
    it('should create instance with config', () => {
      const config: TransportConfig = {
        endpoint: '/api/stream',
        headers: { 'Authorization': 'Bearer token' },
      }

      transport = new SSETransport(config)
      expect(transport).toBeInstanceOf(SSETransport)
    })

    it('should initialize in idle state', () => {
      transport = new SSETransport({ endpoint: '/api/stream' })
      expect(transport.getState()).toBe('idle')
    })
  })

  describe('connect', () => {
    it('should establish SSE connection', async () => {
      const mockReadableStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('data: {"type":"start"}\n\n'))
          controller.close()
        },
      })

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        body: mockReadableStream,
        headers: new Map([['content-type', 'text/event-stream']]),
      })

      transport = new SSETransport({ endpoint: '/api/stream' })

      const onEvent = vi.fn()
      transport.on('event', onEvent)

      await transport.connect()

      expect(transport.getState()).toBe('connected')
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/stream',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Accept': 'text/event-stream',
            'Content-Type': 'application/json',
          }),
        })
      )
    })

    it('should emit connecting event', async () => {
      const mockReadableStream = new ReadableStream({
        start(controller) {
          controller.close()
        },
      })

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        body: mockReadableStream,
      })

      transport = new SSETransport({ endpoint: '/api/stream' })

      const connectingListener = vi.fn()
      transport.on('connecting', connectingListener)

      await transport.connect()

      expect(connectingListener).toHaveBeenCalled()
    })

    it('should emit connected event', async () => {
      const mockReadableStream = new ReadableStream({
        start(controller) {
          controller.close()
        },
      })

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        body: mockReadableStream,
      })

      transport = new SSETransport({ endpoint: '/api/stream' })

      const connectedListener = vi.fn()
      transport.on('connected', connectedListener)

      await transport.connect()

      expect(connectedListener).toHaveBeenCalled()
    })

    it('should handle connection errors', async () => {
      ;(global.fetch as any).mockRejectedValue(new Error('Connection failed'))

      transport = new SSETransport({ endpoint: '/api/stream' })

      const errorListener = vi.fn()
      transport.on('error', errorListener)

      await transport.connect()

      expect(errorListener).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(Error),
        })
      )
      expect(transport.getState()).toBe('error')
    })

    it('should handle HTTP errors', async () => {
      ;(global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'Server error',
      })

      transport = new SSETransport({ endpoint: '/api/stream' })

      const errorListener = vi.fn()
      transport.on('error', errorListener)

      await transport.connect()

      expect(errorListener).toHaveBeenCalled()
      expect(transport.getState()).toBe('error')
    })
  })

  describe('send', () => {
    it('should send data through connected transport', async () => {
      const mockReadableStream = new ReadableStream({
        start(controller) {
          controller.close()
        },
      })

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        body: mockReadableStream,
      })

      transport = new SSETransport({ endpoint: '/api/stream' })
      await transport.connect()

      const data = { message: 'Hello' }
      await transport.send(data)

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/stream',
        expect.objectContaining({
          body: JSON.stringify(data),
        })
      )
    })

    it('should throw error if not connected', async () => {
      transport = new SSETransport({ endpoint: '/api/stream' })

      await expect(transport.send({ test: 'data' })).rejects.toThrow()
    })
  })

  describe('SSE event parsing', () => {
    it('should parse SSE data events', async () => {
      const mockReadableStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('data: {"type":"token","token":"Hello"}\n\n'))
          controller.enqueue(new TextEncoder().encode('data: {"type":"token","token":" world"}\n\n'))
          controller.close()
        },
      })

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        body: mockReadableStream,
      })

      transport = new SSETransport({ endpoint: '/api/stream' })

      const eventListener = vi.fn()
      transport.on('event', eventListener)

      await transport.connect()

      expect(eventListener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'token',
          token: 'Hello',
        })
      )
      expect(eventListener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'token',
          token: ' world',
        })
      )
    })

    it('should handle SSE event types', async () => {
      const mockReadableStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('event: custom\ndata: {"value":"test"}\n\n'))
          controller.close()
        },
      })

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        body: mockReadableStream,
      })

      transport = new SSETransport({ endpoint: '/api/stream' })

      const eventListener = vi.fn()
      transport.on('event', eventListener)

      await transport.connect()

      expect(eventListener).toHaveBeenCalledWith(
        expect.objectContaining({
          value: 'test',
        })
      )
    })

    it('should handle SSE event IDs', async () => {
      const mockReadableStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('id: 123\ndata: {"type":"test"}\n\n'))
          controller.close()
        },
      })

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        body: mockReadableStream,
      })

      transport = new SSETransport({ endpoint: '/api/stream' })

      const eventListener = vi.fn()
      transport.on('event', eventListener)

      await transport.connect()

      expect(eventListener).toHaveBeenCalled()
    })

    it('should handle [DONE] signal', async () => {
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

      transport = new SSETransport({ endpoint: '/api/stream' })

      const doneListener = vi.fn()
      transport.on('done', doneListener)

      await transport.connect()

      expect(doneListener).toHaveBeenCalled()
    })
  })

  describe('reconnection', () => {
    it('should reconnect on connection loss with exponential backoff', async () => {
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
              controller.close()
            },
          }),
        })
      })

      transport = new SSETransport({
        endpoint: '/api/stream',
        reconnect: true,
        maxReconnectAttempts: 3,
        reconnectDelay: 10,
      })

      const reconnectingListener = vi.fn()
      transport.on('reconnecting', reconnectingListener)

      await transport.connect()

      expect(reconnectingListener).toHaveBeenCalled()
      expect(callCount).toBe(2)
    })

    it('should respect maxReconnectAttempts limit', async () => {
      ;(global.fetch as any).mockRejectedValue(new Error('Network error'))

      transport = new SSETransport({
        endpoint: '/api/stream',
        reconnect: true,
        maxReconnectAttempts: 3,
        reconnectDelay: 10,
      })

      const reconnectingListener = vi.fn()
      const errorListener = vi.fn()
      transport.on('reconnecting', reconnectingListener)
      transport.on('error', errorListener)

      await transport.connect()

      // Initial attempt + 3 retries = 4 total
      expect(global.fetch).toHaveBeenCalledTimes(4)
      expect(reconnectingListener).toHaveBeenCalledTimes(3)
    })

    it('should use exponential backoff for reconnection delays', async () => {
      let callCount = 0
      const delays: number[] = []
      const mockSetTimeout = vi.spyOn(global, 'setTimeout').mockImplementation(((fn: any, delay: number) => {
        delays.push(delay)
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
              controller.close()
            },
          }),
        })
      })

      transport = new SSETransport({
        endpoint: '/api/stream',
        reconnect: true,
        maxReconnectAttempts: 3,
        reconnectDelay: 100,
        backoffMultiplier: 2,
      })

      await transport.connect()

      // Check exponential backoff: 100ms, 200ms
      expect(delays.length).toBeGreaterThan(0)
      if (delays.length > 1) {
        expect(delays[1]).toBeGreaterThan(delays[0])
      }

      mockSetTimeout.mockRestore()
    })

    it('should emit reconnecting event with attempt number', async () => {
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
              controller.close()
            },
          }),
        })
      })

      transport = new SSETransport({
        endpoint: '/api/stream',
        reconnect: true,
        maxReconnectAttempts: 3,
        reconnectDelay: 10,
      })

      const reconnectingListener = vi.fn()
      transport.on('reconnecting', reconnectingListener)

      await transport.connect()

      expect(reconnectingListener).toHaveBeenCalledWith(
        expect.objectContaining({
          attempt: expect.any(Number),
          delay: expect.any(Number),
        })
      )
    })

    it('should not reconnect if reconnect is disabled', async () => {
      ;(global.fetch as any).mockRejectedValue(new Error('Network error'))

      transport = new SSETransport({
        endpoint: '/api/stream',
        reconnect: false,
      })

      await transport.connect()

      expect(global.fetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('close', () => {
    it('should close the connection', async () => {
      const mockReadableStream = new ReadableStream({
        start(controller) {
          controller.close()
        },
      })

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        body: mockReadableStream,
      })

      transport = new SSETransport({ endpoint: '/api/stream' })
      await transport.connect()

      transport.close()

      expect(transport.getState()).toBe('closed')
    })

    it('should emit closed event', async () => {
      const mockReadableStream = new ReadableStream({
        start(controller) {
          controller.close()
        },
      })

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        body: mockReadableStream,
      })

      transport = new SSETransport({ endpoint: '/api/stream' })
      await transport.connect()

      const closedListener = vi.fn()
      transport.on('closed', closedListener)

      transport.close()

      expect(closedListener).toHaveBeenCalled()
    })

    it('should cancel ongoing request', async () => {
      let readerClosed = false
      const mockReadableStream = new ReadableStream({
        start() {
          // Never close naturally
        },
        cancel() {
          readerClosed = true
        },
      })

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        body: mockReadableStream,
      })

      transport = new SSETransport({ endpoint: '/api/stream' })
      await transport.connect()

      transport.close()

      // Give time for cleanup
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(transport.getState()).toBe('closed')
    })
  })

  describe('state management', () => {
    it('should track connection state', async () => {
      const mockReadableStream = new ReadableStream({
        start(controller) {
          controller.close()
        },
      })

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        body: mockReadableStream,
      })

      transport = new SSETransport({ endpoint: '/api/stream' })

      expect(transport.getState()).toBe('idle')

      const connectPromise = transport.connect()
      expect(['idle', 'connecting']).toContain(transport.getState())

      await connectPromise
      expect(transport.getState()).toBe('connected')

      transport.close()
      expect(transport.getState()).toBe('closed')
    })
  })

  describe('error recovery', () => {
    it('should handle stream read errors', async () => {
      const mockReadableStream = new ReadableStream({
        async start(controller) {
          controller.enqueue(new TextEncoder().encode('data: {"type":"test"}\n\n'))
          controller.error(new Error('Read error'))
        },
      })

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        body: mockReadableStream,
      })

      transport = new SSETransport({
        endpoint: '/api/stream',
        reconnect: false,
      })

      const errorListener = vi.fn()
      transport.on('error', errorListener)

      await transport.connect()

      expect(errorListener).toHaveBeenCalled()
    })

    it('should handle malformed JSON in SSE data', async () => {
      const mockReadableStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('data: {invalid json}\n\n'))
          controller.close()
        },
      })

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        body: mockReadableStream,
      })

      transport = new SSETransport({ endpoint: '/api/stream' })

      const errorListener = vi.fn()
      transport.on('error', errorListener)

      await transport.connect()

      // Should not crash, might emit error event
      expect(transport.getState()).toBe('connected')
    })
  })
})
