import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useAIStream } from '../src/useAIStream'

// Mock fetch globally
global.fetch = vi.fn()

describe('useAIStream', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initialization', () => {
    it('should initialize with empty messages', () => {
      const { result } = renderHook(() =>
        useAIStream({ endpoint: '/api/chat' })
      )

      expect(result.current.messages).toEqual([])
      expect(result.current.isStreaming).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current.usage.promptTokens).toBe(0)
      expect(result.current.usage.completionTokens).toBe(0)
      expect(result.current.usage.totalTokens).toBe(0)
    })

    it('should provide send, reset, retry, and stop functions', () => {
      const { result } = renderHook(() =>
        useAIStream({ endpoint: '/api/chat' })
      )

      expect(typeof result.current.send).toBe('function')
      expect(typeof result.current.reset).toBe('function')
      expect(typeof result.current.retry).toBe('function')
      expect(typeof result.current.stop).toBe('function')
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

      const { result } = renderHook(() =>
        useAIStream({ endpoint: '/api/chat' })
      )

      await result.current.send('Hello')

      await waitFor(() => {
        expect(result.current.messages.length).toBeGreaterThanOrEqual(1)
      })

      const userMessage = result.current.messages.find((m) => m.role === 'user')
      expect(userMessage?.content).toBe('Hello')
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

      const { result } = renderHook(() =>
        useAIStream({ endpoint: '/api/chat' })
      )

      await result.current.send('Test')

      await waitFor(() => {
        const assistantMessage = result.current.messages.find(
          (m) => m.role === 'assistant'
        )
        expect(assistantMessage?.content).toBe('Hello world')
      })
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

      const { result } = renderHook(() =>
        useAIStream({ endpoint: '/api/chat' })
      )

      await result.current.send('Test')

      await waitFor(
        () => {
          expect(result.current.usage.promptTokens).toBe(100)
          expect(result.current.usage.completionTokens).toBe(200)
          expect(result.current.usage.totalTokens).toBe(300)
        },
        { timeout: 3000 }
      )
    })
  })

  describe('error handling', () => {
    it('should handle HTTP errors', async () => {
      ;(global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      })

      const { result } = renderHook(() =>
        useAIStream({
          endpoint: '/api/chat',
          retry: { maxRetries: 0 }, // Disable retries for faster test
        })
      )

      await result.current.send('Test').catch(() => {
        // Expected to fail
      })

      await waitFor(
        () => {
          expect(result.current.error).not.toBeNull()
          expect(result.current.isStreaming).toBe(false)
        },
        { timeout: 3000 }
      )
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

      const { result } = renderHook(() =>
        useAIStream({ endpoint: '/api/chat' })
      )

      await result.current.send('Test')

      await waitFor(() => {
        expect(result.current.messages.length).toBeGreaterThan(0)
      })

      result.current.reset()

      await waitFor(() => {
        expect(result.current.messages).toEqual([])
        expect(result.current.usage.totalTokens).toBe(0)
      })
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
      const { result } = renderHook(() =>
        useAIStream({ endpoint: '/api/chat', onToken })
      )

      await result.current.send('Test')

      await waitFor(() => {
        expect(onToken).toHaveBeenCalledWith('Test')
      })
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
      const { result } = renderHook(() =>
        useAIStream({ endpoint: '/api/chat', onCost })
      )

      await result.current.send('Test')

      await waitFor(() => {
        expect(onCost).toHaveBeenCalled()
      })
    })
  })

  describe('cleanup', () => {
    it('should cleanup on unmount', async () => {
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

      const { result, unmount } = renderHook(() =>
        useAIStream({ endpoint: '/api/chat' })
      )

      await result.current.send('Test')

      // Unmount should not throw
      expect(() => unmount()).not.toThrow()
    })
  })
})
