import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AIStream } from '../../src/streaming/AIStream'

// Mock fetch globally
global.fetch = vi.fn()

describe('AIStream', () => {
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

  describe('constructor', () => {
    it('should create instance with config', () => {
      stream = new AIStream({
        endpoint: '/api/chat',
        model: 'gpt-4',
      })

      expect(stream).toBeInstanceOf(AIStream)
    })

    it('should initialize with empty messages', () => {
      stream = new AIStream({ endpoint: '/api/chat' })
      expect(stream.getMessages()).toEqual([])
    })

    it('should initialize with not streaming state', () => {
      stream = new AIStream({ endpoint: '/api/chat' })
      expect(stream.getIsStreaming()).toBe(false)
    })

    it('should initialize with zero usage', () => {
      stream = new AIStream({ endpoint: '/api/chat' })
      const usage = stream.getUsage()
      expect(usage.promptTokens).toBe(0)
      expect(usage.completionTokens).toBe(0)
      expect(usage.totalTokens).toBe(0)
    })
  })

  describe('send', () => {
    it('should add user message to messages array', async () => {
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
      expect(messages[0].role).toBe('user')
      expect(messages[0].content).toBe('Hello')
    })

    it('should emit message event for user message', async () => {
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

      const messageListener = vi.fn()
      stream.on('message', messageListener)

      await stream.send('Hello')

      expect(messageListener).toHaveBeenCalled()
    })

    it('should emit streaming-start event', async () => {
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

      const startListener = vi.fn()
      stream.on('streaming-start', startListener)

      await stream.send('Hello')

      expect(startListener).toHaveBeenCalled()
    })

    it('should emit streaming-end event', async () => {
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

      const endListener = vi.fn()
      stream.on('streaming-end', endListener)

      await stream.send('Hello')

      expect(endListener).toHaveBeenCalled()
    })

    it('should make POST request to endpoint with correct payload', async () => {
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

      stream = new AIStream({
        endpoint: '/api/chat',
        model: 'gpt-4',
        systemPrompt: 'You are helpful',
      })

      await stream.send('Hello')

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/chat',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      )
    })
  })

  describe('stream processing', () => {
    it('should process SSE tokens correctly', async () => {
      const mockReadableStream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            new TextEncoder().encode('data: {"token":"Hello"}\n\n')
          )
          controller.enqueue(
            new TextEncoder().encode('data: {"token":" world"}\n\n')
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
      stream.on('token', tokenListener)

      await stream.send('Test')

      expect(tokenListener).toHaveBeenCalledWith('Hello')
      expect(tokenListener).toHaveBeenCalledWith(' world')
    })

    it('should call onToken callback for each token', async () => {
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

      const onToken = vi.fn()
      stream = new AIStream({
        endpoint: '/api/chat',
        onToken,
      })

      await stream.send('Test')

      expect(onToken).toHaveBeenCalledWith('Test')
    })

    it('should process usage data', async () => {
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

      stream = new AIStream({ endpoint: '/api/chat' })

      await stream.send('Test')

      const usage = stream.getUsage()
      expect(usage.promptTokens).toBe(10)
      expect(usage.completionTokens).toBe(20)
      expect(usage.totalTokens).toBe(30)
    })

    it('should call onCost callback with usage data', async () => {
      const mockReadableStream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            new TextEncoder().encode(
              'data: {"usage":{"promptTokens":100,"completionTokens":200}}\n\n'
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
          promptTokens: 100,
          completionTokens: 200,
        })
      )
    })

    it('should accumulate assistant message content', async () => {
      const mockReadableStream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            new TextEncoder().encode('data: {"token":"Hello"}\n\n')
          )
          controller.enqueue(
            new TextEncoder().encode('data: {"token":" world"}\n\n')
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

      const messages = stream.getMessages()
      const assistantMessage = messages.find((m) => m.role === 'assistant')

      expect(assistantMessage?.content).toBe('Hello world')
    })
  })

  describe('error handling', () => {
    it('should emit error event on HTTP error', async () => {
      ;(global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      })

      stream = new AIStream({
        endpoint: '/api/chat',
        retry: { maxRetries: 0 }, // Disable retries for this test
      })

      const errorListener = vi.fn()
      stream.on('error', errorListener)

      await stream.send('Test')

      expect(errorListener).toHaveBeenCalled()
    })

    it('should call onError callback on error', async () => {
      ;(global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      })

      const onError = vi.fn()
      stream = new AIStream({
        endpoint: '/api/chat',
        onError,
        retry: { maxRetries: 0 }, // Disable retries for this test
      })

      // Errors are emitted, not thrown when onError is provided
      await stream.send('Test').catch(() => {
        // Ignore error - we're testing that onError was called
      })

      expect(onError).toHaveBeenCalled()
    })

    it('should retry on retriable errors', async () => {
      let callCount = 0
      ;(global.fetch as any).mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return Promise.resolve({
            ok: false,
            status: 500,
            text: async () => 'Server Error',
          })
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

      stream = new AIStream({
        endpoint: '/api/chat',
        retry: {
          maxRetries: 3,
          initialDelay: 10,
        },
      })

      await stream.send('Test')

      expect(callCount).toBe(2)
    })

    it('should not retry on abort error', async () => {
      ;(global.fetch as any).mockRejectedValue(new DOMException('Aborted', 'AbortError'))

      stream = new AIStream({
        endpoint: '/api/chat',
        retry: {
          maxRetries: 3,
        },
      })

      const errorListener = vi.fn()
      stream.on('error', errorListener)

      await stream.send('Test')

      expect(global.fetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('retry logic', () => {
    it('should use exponential backoff by default', async () => {
      let callCount = 0
      ;(global.fetch as any).mockImplementation(() => {
        callCount++
        if (callCount <= 2) {
          return Promise.resolve({
            ok: false,
            status: 500,
            text: async () => 'Error',
          })
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

      stream = new AIStream({
        endpoint: '/api/chat',
        retry: {
          maxRetries: 3,
          initialDelay: 10,
          backoff: 'exponential',
        },
      })

      const retryListener = vi.fn()
      stream.on('retry', retryListener)

      await stream.send('Test')

      expect(retryListener).toHaveBeenCalledTimes(2)
    })

    it('should respect maxRetries limit', async () => {
      ;(global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Error',
      })

      stream = new AIStream({
        endpoint: '/api/chat',
        retry: {
          maxRetries: 2,
          initialDelay: 10,
        },
        onError: vi.fn(), // Prevent error from propagating
      })

      await stream.send('Test').catch(() => {
        // Ignore error
      })

      // 1 initial + 2 retries = 3 total
      expect(global.fetch).toHaveBeenCalledTimes(3)
    })
  })

  describe('reset', () => {
    it('should clear messages', async () => {
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

    it('should reset usage statistics', async () => {
      const mockReadableStream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            new TextEncoder().encode(
              'data: {"usage":{"promptTokens":100,"completionTokens":200,"totalTokens":300}}\n\n'
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
      expect(stream.getUsage().totalTokens).toBeGreaterThan(0)

      stream.reset()
      const usage = stream.getUsage()
      expect(usage.promptTokens).toBe(0)
      expect(usage.completionTokens).toBe(0)
      expect(usage.totalTokens).toBe(0)
    })

    it('should emit reset event', () => {
      stream = new AIStream({ endpoint: '/api/chat' })

      const resetListener = vi.fn()
      stream.on('reset', resetListener)

      stream.reset()

      expect(resetListener).toHaveBeenCalled()
    })
  })

  describe('retry', () => {
    it('should re-send the last user message', async () => {
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

      // Reset mock to track retry call
      ;(global.fetch as any).mockClear()
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        body: mockReadableStream,
      })

      await stream.retry()

      expect(global.fetch).toHaveBeenCalled()
    })

    it('should do nothing if no messages exist', async () => {
      stream = new AIStream({ endpoint: '/api/chat' })

      await stream.retry()

      expect(global.fetch).not.toHaveBeenCalled()
    })
  })

  describe('stop', () => {
    it('should abort current stream', async () => {
      let controllerRef: ReadableStreamDefaultController | null = null
      const mockReadableStream = new ReadableStream({
        start(controller) {
          controllerRef = controller
          // Never close automatically
        },
      })

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        body: mockReadableStream,
      })

      stream = new AIStream({ endpoint: '/api/chat' })

      // Start sending but don't await
      const sendPromise = stream.send('Test')

      // Give it a moment to start
      await new Promise((resolve) => setTimeout(resolve, 50))

      // Stop the stream
      stream.stop()

      // Clean up the stream controller
      if (controllerRef) {
        try {
          controllerRef.close()
        } catch (e) {
          // Controller might already be closed
        }
      }

      // Wait for send to complete
      await sendPromise.catch(() => {
        // Ignore abort error
      })

      expect(stream.getIsStreaming()).toBe(false)
    })

    it('should set isStreaming to false', () => {
      stream = new AIStream({ endpoint: '/api/chat' })
      stream.stop()
      expect(stream.getIsStreaming()).toBe(false)
    })
  })

  describe('getters', () => {
    it('getMessages should return copy of messages', async () => {
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

      const messages1 = stream.getMessages()
      const messages2 = stream.getMessages()

      expect(messages1).not.toBe(messages2) // Different references
      expect(messages1).toEqual(messages2) // Same content
    })

    it('getUsage should return copy of usage', () => {
      stream = new AIStream({ endpoint: '/api/chat' })

      const usage1 = stream.getUsage()
      const usage2 = stream.getUsage()

      expect(usage1).not.toBe(usage2) // Different references
      expect(usage1).toEqual(usage2) // Same content
    })
  })
})
