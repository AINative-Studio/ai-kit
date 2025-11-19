import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { get } from 'svelte/store'
import { createAIStream } from '../src/createAIStream'
import type { Message } from '@ainative/ai-kit-core'

// Mock fetch globally
global.fetch = vi.fn()

/**
 * Helper to wait for store updates
 */
const waitFor = async (
  callback: () => boolean,
  options: { timeout?: number; interval?: number } = {}
): Promise<void> => {
  const { timeout = 3000, interval = 50 } = options
  const startTime = Date.now()

  while (Date.now() - startTime < timeout) {
    if (callback()) {
      return
    }
    await new Promise((resolve) => setTimeout(resolve, interval))
  }

  throw new Error('Timeout waiting for condition')
}

describe('createAIStream', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initialization', () => {
    it('should initialize with empty messages', () => {
      const aiStream = createAIStream({ endpoint: '/api/chat' })

      expect(get(aiStream.messages)).toEqual([])
      expect(get(aiStream.isStreaming)).toBe(false)
      expect(get(aiStream.error)).toBeNull()
      expect(get(aiStream.usage).promptTokens).toBe(0)
      expect(get(aiStream.usage).completionTokens).toBe(0)
      expect(get(aiStream.usage).totalTokens).toBe(0)

      aiStream.destroy()
    })

    it('should provide send, reset, retry, stop, and destroy functions', () => {
      const aiStream = createAIStream({ endpoint: '/api/chat' })

      expect(typeof aiStream.send).toBe('function')
      expect(typeof aiStream.reset).toBe('function')
      expect(typeof aiStream.retry).toBe('function')
      expect(typeof aiStream.stop).toBe('function')
      expect(typeof aiStream.destroy).toBe('function')

      aiStream.destroy()
    })

    it('should provide readable stores for reactive state', () => {
      const aiStream = createAIStream({ endpoint: '/api/chat' })

      expect(typeof aiStream.messages.subscribe).toBe('function')
      expect(typeof aiStream.isStreaming.subscribe).toBe('function')
      expect(typeof aiStream.error.subscribe).toBe('function')
      expect(typeof aiStream.usage.subscribe).toBe('function')

      aiStream.destroy()
    })
  })

  describe('send functionality', () => {
    it('should add user message when send is called', async () => {
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

      const aiStream = createAIStream({ endpoint: '/api/chat' })

      await aiStream.send('Hello')

      await waitFor(() => {
        return get(aiStream.messages).length >= 1
      })

      const messages = get(aiStream.messages)
      const userMessage = messages.find((m) => m.role === 'user')
      expect(userMessage?.content).toBe('Hello')

      aiStream.destroy()
    })

    it('should process tokens and build assistant message', async () => {
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

      const aiStream = createAIStream({ endpoint: '/api/chat' })

      await aiStream.send('Test')

      await waitFor(() => {
        const messages = get(aiStream.messages)
        const assistantMessage = messages.find((m) => m.role === 'assistant')
        return assistantMessage?.content === 'Hello world'
      })

      const messages = get(aiStream.messages)
      const assistantMessage = messages.find((m) => m.role === 'assistant')
      expect(assistantMessage?.content).toBe('Hello world')

      aiStream.destroy()
    })

    it('should update usage statistics', async () => {
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

      const aiStream = createAIStream({ endpoint: '/api/chat' })

      await aiStream.send('Test')

      await waitFor(() => {
        const usage = get(aiStream.usage)
        return usage.totalTokens === 300
      })

      const usage = get(aiStream.usage)
      expect(usage.promptTokens).toBe(100)
      expect(usage.completionTokens).toBe(200)
      expect(usage.totalTokens).toBe(300)

      aiStream.destroy()
    })

    it('should update isStreaming state during streaming', async () => {
      let resolveStream: (() => void) | null = null
      const streamPromise = new Promise<void>((resolve) => {
        resolveStream = resolve
      })

      const mockReadableStream = new ReadableStream({
        async start(controller) {
          controller.enqueue(
            new TextEncoder().encode('data: {"token":"Test"}\n\n')
          )
          await streamPromise
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'))
          controller.close()
        },
      })

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        body: mockReadableStream,
      })

      const aiStream = createAIStream({ endpoint: '/api/chat' })

      const sendPromise = aiStream.send('Test')

      // Should be streaming
      await waitFor(() => get(aiStream.isStreaming) === true)
      expect(get(aiStream.isStreaming)).toBe(true)

      // Complete the stream
      resolveStream!()
      await sendPromise

      // Should stop streaming
      await waitFor(() => get(aiStream.isStreaming) === false)
      expect(get(aiStream.isStreaming)).toBe(false)

      aiStream.destroy()
    })
  })

  describe('error handling', () => {
    it('should handle HTTP errors', async () => {
      ;(global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      })

      const aiStream = createAIStream({
        endpoint: '/api/chat',
        retry: { maxRetries: 0 }, // Disable retries for faster test
      })

      try {
        await aiStream.send('Test')
      } catch (err) {
        // Expected to fail
      }

      await waitFor(() => {
        return get(aiStream.error) !== null
      })

      expect(get(aiStream.error)).not.toBeNull()
      expect(get(aiStream.isStreaming)).toBe(false)

      aiStream.destroy()
    })

    it('should set error state on streaming failure', async () => {
      ;(global.fetch as any).mockRejectedValue(new Error('Network error'))

      const aiStream = createAIStream({
        endpoint: '/api/chat',
        retry: { maxRetries: 0 },
      })

      try {
        await aiStream.send('Test')
      } catch (err) {
        // Expected to fail
      }

      await waitFor(() => get(aiStream.error) !== null)

      const error = get(aiStream.error)
      expect(error).not.toBeNull()
      expect(error?.message).toContain('Network error')

      aiStream.destroy()
    })
  })

  describe('reset functionality', () => {
    it('should clear messages and state', async () => {
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

      const aiStream = createAIStream({ endpoint: '/api/chat' })

      await aiStream.send('Test')

      await waitFor(() => {
        return get(aiStream.messages).length > 0
      })

      expect(get(aiStream.messages).length).toBeGreaterThan(0)

      aiStream.reset()

      await waitFor(() => {
        return get(aiStream.messages).length === 0
      })

      expect(get(aiStream.messages)).toEqual([])
      expect(get(aiStream.usage).totalTokens).toBe(0)

      aiStream.destroy()
    })

    it('should clear error state on reset', async () => {
      ;(global.fetch as any).mockRejectedValue(new Error('Test error'))

      const aiStream = createAIStream({
        endpoint: '/api/chat',
        retry: { maxRetries: 0 },
      })

      try {
        await aiStream.send('Test')
      } catch (err) {
        // Expected to fail
      }

      await waitFor(() => get(aiStream.error) !== null)
      expect(get(aiStream.error)).not.toBeNull()

      aiStream.reset()

      await waitFor(() => get(aiStream.error) === null)
      expect(get(aiStream.error)).toBeNull()

      aiStream.destroy()
    })
  })

  describe('retry functionality', () => {
    it('should have retry method available', async () => {
      const aiStream = createAIStream({ endpoint: '/api/chat' })

      expect(typeof aiStream.retry).toBe('function')

      // Retry with no messages should not throw
      await expect(aiStream.retry()).resolves.not.toThrow()

      aiStream.destroy()
    })

    it('should retry after a successful message', async () => {
      const mockReadableStream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            new TextEncoder().encode('data: {"token":"Initial"}\n\n')
          )
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'))
          controller.close()
        },
      })

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        body: mockReadableStream,
      })

      const aiStream = createAIStream({ endpoint: '/api/chat' })

      await aiStream.send('Test')

      await waitFor(() => {
        const messages = get(aiStream.messages)
        return messages.some((m) => m.role === 'assistant' && m.content === 'Initial')
      })

      // Mock new stream for retry - create fresh stream
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        body: new ReadableStream({
          start(controller) {
            controller.enqueue(
              new TextEncoder().encode('data: {"token":"Retried"}\n\n')
            )
            controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'))
            controller.close()
          },
        }),
      })

      // Just test that retry can be called without error
      await expect(aiStream.retry()).resolves.not.toThrow()

      aiStream.destroy()
    }, 10000)
  })

  describe('stop functionality', () => {
    it('should have stop method available', () => {
      const aiStream = createAIStream({ endpoint: '/api/chat' })

      expect(typeof aiStream.stop).toBe('function')

      // Call stop when not streaming should not throw
      expect(() => aiStream.stop()).not.toThrow()

      aiStream.destroy()
    })
  })

  describe('callbacks', () => {
    it('should call onToken callback', async () => {
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
      const aiStream = createAIStream({ endpoint: '/api/chat', onToken })

      await aiStream.send('Test')

      await waitFor(() => {
        return onToken.mock.calls.length > 0
      })

      expect(onToken).toHaveBeenCalledWith('Test')

      aiStream.destroy()
    })

    it('should call onCost callback', async () => {
      const mockReadableStream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            new TextEncoder().encode(
              'data: {"usage":{"promptTokens":100}}\n\n'
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
      const aiStream = createAIStream({ endpoint: '/api/chat', onCost })

      await aiStream.send('Test')

      await waitFor(() => {
        return onCost.mock.calls.length > 0
      })

      expect(onCost).toHaveBeenCalled()

      aiStream.destroy()
    })

    it('should call onError callback', async () => {
      ;(global.fetch as any).mockRejectedValue(new Error('Test error'))

      const onError = vi.fn()
      const aiStream = createAIStream({
        endpoint: '/api/chat',
        onError,
        retry: { maxRetries: 0 },
      })

      try {
        await aiStream.send('Test')
      } catch (err) {
        // Expected to fail
      }

      await waitFor(() => {
        return onError.mock.calls.length > 0
      })

      expect(onError).toHaveBeenCalled()
      expect(onError.mock.calls[0][0]).toBeInstanceOf(Error)

      aiStream.destroy()
    })
  })

  describe('store subscriptions', () => {
    it('should notify subscribers on messages update', async () => {
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

      const aiStream = createAIStream({ endpoint: '/api/chat' })

      const messagesHistory: Message[][] = []
      const unsubscribe = aiStream.messages.subscribe((messages) => {
        messagesHistory.push([...messages])
      })

      await aiStream.send('Test')

      await waitFor(() => {
        return messagesHistory.length >= 3 // Initial [], user message, assistant message
      })

      expect(messagesHistory.length).toBeGreaterThanOrEqual(3)
      expect(messagesHistory[0]).toEqual([]) // Initial state
      expect(messagesHistory[1][0]?.role).toBe('user') // User message added
      expect(messagesHistory[messagesHistory.length - 1].length).toBe(2) // Both messages

      unsubscribe()
      aiStream.destroy()
    })

    it('should notify subscribers on isStreaming update', async () => {
      let resolveStream: (() => void) | null = null
      const streamPromise = new Promise<void>((resolve) => {
        resolveStream = resolve
      })

      const mockReadableStream = new ReadableStream({
        async start(controller) {
          controller.enqueue(
            new TextEncoder().encode('data: {"token":"Test"}\n\n')
          )
          await streamPromise
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'))
          controller.close()
        },
      })

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        body: mockReadableStream,
      })

      const aiStream = createAIStream({ endpoint: '/api/chat' })

      const streamingHistory: boolean[] = []
      const unsubscribe = aiStream.isStreaming.subscribe((isStreaming) => {
        streamingHistory.push(isStreaming)
      })

      const sendPromise = aiStream.send('Test')

      await waitFor(() => streamingHistory.includes(true))

      resolveStream!()
      await sendPromise

      await waitFor(() => {
        return streamingHistory.length >= 3
      })

      expect(streamingHistory[0]).toBe(false) // Initial
      expect(streamingHistory).toContain(true) // Started streaming
      expect(streamingHistory[streamingHistory.length - 1]).toBe(false) // Ended

      unsubscribe()
      aiStream.destroy()
    })

    it('should notify subscribers on usage update', async () => {
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

      const aiStream = createAIStream({ endpoint: '/api/chat' })

      const usageHistory: any[] = []
      const unsubscribe = aiStream.usage.subscribe((usage) => {
        usageHistory.push({ ...usage })
      })

      await aiStream.send('Test')

      await waitFor(() => {
        return usageHistory.some((u) => u.totalTokens === 300)
      })

      const finalUsage = usageHistory[usageHistory.length - 1]
      expect(finalUsage.promptTokens).toBe(100)
      expect(finalUsage.completionTokens).toBe(200)
      expect(finalUsage.totalTokens).toBe(300)

      unsubscribe()
      aiStream.destroy()
    })
  })

  describe('cleanup', () => {
    it('should cleanup on destroy', async () => {
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

      const aiStream = createAIStream({ endpoint: '/api/chat' })

      await aiStream.send('Test')

      // Destroy should not throw
      expect(() => aiStream.destroy()).not.toThrow()
    })

    it('should cleanup resources on destroy', () => {
      const aiStream = createAIStream({ endpoint: '/api/chat' })

      // Destroy should not throw even when called multiple times
      expect(() => aiStream.destroy()).not.toThrow()
      expect(() => aiStream.destroy()).not.toThrow()
    })
  })

  describe('message updates', () => {
    it('should update existing message content during streaming', async () => {
      const mockReadableStream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            new TextEncoder().encode('data: {"token":"First"}\n\n')
          )
          controller.enqueue(
            new TextEncoder().encode('data: {"token":" Second"}\n\n')
          )
          controller.enqueue(
            new TextEncoder().encode('data: {"token":" Third"}\n\n')
          )
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'))
          controller.close()
        },
      })

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        body: mockReadableStream,
      })

      const aiStream = createAIStream({ endpoint: '/api/chat' })

      await aiStream.send('Test')

      await waitFor(() => {
        const messages = get(aiStream.messages)
        const assistantMessage = messages.find((m) => m.role === 'assistant')
        return assistantMessage?.content === 'First Second Third'
      })

      const messages = get(aiStream.messages)
      const assistantMessage = messages.find((m) => m.role === 'assistant')
      expect(assistantMessage?.content).toBe('First Second Third')

      // Should only have 2 messages total (user + assistant)
      expect(messages.length).toBe(2)

      aiStream.destroy()
    })
  })
})
