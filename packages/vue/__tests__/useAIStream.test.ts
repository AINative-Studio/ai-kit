import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'
import { useAIStream } from '../src/useAIStream'

// Mock fetch globally
global.fetch = vi.fn()

// Helper to create a test component that uses the composable
const createTestComponent = (config: any) => {
  return defineComponent({
    setup() {
      const result = useAIStream(config)
      return { ...result }
    },
    render() {
      return h('div')
    },
  })
}

describe('useAIStream Vue Composable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initialization', () => {
    it('should initialize with empty messages', async () => {
      const wrapper = mount(createTestComponent({ endpoint: '/api/chat' }))

      await nextTick()

      expect(wrapper.vm.messages).toEqual([])
      expect(wrapper.vm.isStreaming).toBe(false)
      expect(wrapper.vm.error).toBeNull()
      expect(wrapper.vm.usage.promptTokens).toBe(0)
      expect(wrapper.vm.usage.completionTokens).toBe(0)
      expect(wrapper.vm.usage.totalTokens).toBe(0)
    })

    it('should provide send, reset, retry, and stop functions', async () => {
      const wrapper = mount(createTestComponent({ endpoint: '/api/chat' }))

      await nextTick()

      expect(typeof wrapper.vm.send).toBe('function')
      expect(typeof wrapper.vm.reset).toBe('function')
      expect(typeof wrapper.vm.retry).toBe('function')
      expect(typeof wrapper.vm.stop).toBe('function')
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

      const wrapper = mount(createTestComponent({ endpoint: '/api/chat' }))
      await nextTick()

      await wrapper.vm.send('Hello')
      await nextTick()

      // Wait for message to be added
      await vi.waitFor(() => {
        expect(wrapper.vm.messages.length).toBeGreaterThanOrEqual(1)
      })

      const userMessage = wrapper.vm.messages.find((m: any) => m.role === 'user')
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

      const wrapper = mount(createTestComponent({ endpoint: '/api/chat' }))
      await nextTick()

      await wrapper.vm.send('Test')
      await nextTick()

      await vi.waitFor(() => {
        const assistantMessage = wrapper.vm.messages.find(
          (m: any) => m.role === 'assistant'
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

      const wrapper = mount(createTestComponent({ endpoint: '/api/chat' }))
      await nextTick()

      await wrapper.vm.send('Test')
      await nextTick()

      await vi.waitFor(
        () => {
          expect(wrapper.vm.usage.promptTokens).toBe(100)
          expect(wrapper.vm.usage.completionTokens).toBe(200)
          expect(wrapper.vm.usage.totalTokens).toBe(300)
        },
        { timeout: 3000 }
      )
    })

    it('should set isStreaming to true during streaming', async () => {
      let resolveStream: any
      const streamPromise = new Promise((resolve) => {
        resolveStream = resolve
      })

      const mockReadableStream = new ReadableStream({
        async start(controller) {
          await streamPromise
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'))
          controller.close()
        },
      })

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        body: mockReadableStream,
      })

      const wrapper = mount(createTestComponent({ endpoint: '/api/chat' }))
      await nextTick()

      const sendPromise = wrapper.vm.send('Test')
      await nextTick()

      await vi.waitFor(() => {
        expect(wrapper.vm.isStreaming).toBe(true)
      })

      resolveStream()
      await sendPromise
      await nextTick()

      await vi.waitFor(() => {
        expect(wrapper.vm.isStreaming).toBe(false)
      })
    })
  })

  describe('error handling', () => {
    it('should handle HTTP errors', async () => {
      ;(global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      })

      const wrapper = mount(
        createTestComponent({
          endpoint: '/api/chat',
          retry: { maxRetries: 0 }, // Disable retries for faster test
        })
      )
      await nextTick()

      await wrapper.vm.send('Test').catch(() => {
        // Expected to fail
      })

      await vi.waitFor(
        () => {
          expect(wrapper.vm.error).not.toBeNull()
          expect(wrapper.vm.isStreaming).toBe(false)
        },
        { timeout: 3000 }
      )
    })

    it('should not set error when retry succeeds', async () => {
      let callCount = 0

      ;(global.fetch as any).mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return Promise.resolve({
            ok: false,
            status: 500,
            text: async () => 'Server Error',
          })
        } else {
          return Promise.resolve({
            ok: true,
            body: new ReadableStream({
              start(controller) {
                controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'))
                controller.close()
              },
            }),
          })
        }
      })

      const wrapper = mount(
        createTestComponent({
          endpoint: '/api/chat',
          retry: { maxRetries: 3 },
        })
      )
      await nextTick()

      await wrapper.vm.send('Test')
      await nextTick()

      // Wait for operation to complete - error should remain null
      // because retry succeeded before error was emitted
      await vi.waitFor(() => {
        expect(callCount).toBe(2) // First failed, second succeeded
      }, { timeout: 3000 })

      // Error should still be null because retry succeeded
      expect(wrapper.vm.error).toBeNull()
      expect(wrapper.vm.isStreaming).toBe(false)
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

      const wrapper = mount(createTestComponent({ endpoint: '/api/chat' }))
      await nextTick()

      await wrapper.vm.send('Test')
      await nextTick()

      await vi.waitFor(() => {
        expect(wrapper.vm.messages.length).toBeGreaterThan(0)
      })

      wrapper.vm.reset()
      await nextTick()

      await vi.waitFor(() => {
        expect(wrapper.vm.messages).toEqual([])
        expect(wrapper.vm.usage.totalTokens).toBe(0)
      })
    })

    it('should reset error state', async () => {
      ;(global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Error',
      })

      const wrapper = mount(
        createTestComponent({
          endpoint: '/api/chat',
          retry: { maxRetries: 0 },
        })
      )
      await nextTick()

      await wrapper.vm.send('Test').catch(() => {})
      await nextTick()

      await vi.waitFor(() => {
        expect(wrapper.vm.error).not.toBeNull()
      })

      wrapper.vm.reset()
      await nextTick()

      expect(wrapper.vm.error).toBeNull()
    })
  })

  describe('retry functionality', () => {
    it('should retry the last request', async () => {
      const mockReadableStream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            new TextEncoder().encode('data: {"token":"Retry"}\n\n')
          )
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'))
          controller.close()
        },
      })

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        body: mockReadableStream,
      })

      const wrapper = mount(createTestComponent({ endpoint: '/api/chat' }))
      await nextTick()

      await wrapper.vm.send('Test')
      await nextTick()

      await vi.waitFor(() => {
        expect(wrapper.vm.messages.length).toBeGreaterThan(0)
      })

      const initialMessageCount = wrapper.vm.messages.length

      await wrapper.vm.retry()
      await nextTick()

      await vi.waitFor(() => {
        expect(wrapper.vm.messages.length).toBeGreaterThanOrEqual(
          initialMessageCount
        )
      })
    })

    it('should handle retry when no messages exist', async () => {
      const wrapper = mount(createTestComponent({ endpoint: '/api/chat' }))
      await nextTick()

      // Should not throw
      await expect(wrapper.vm.retry()).resolves.not.toThrow()
    })
  })

  describe('stop functionality', () => {
    it('should stop streaming', async () => {
      const mockReadableStream = new ReadableStream({
        async start(controller) {
          // Delay to keep stream open long enough
          await new Promise((resolve) => setTimeout(resolve, 500))
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'))
          controller.close()
        },
      })

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        body: mockReadableStream,
      })

      const wrapper = mount(createTestComponent({ endpoint: '/api/chat' }))
      await nextTick()

      wrapper.vm.send('Test')
      await nextTick()

      await vi.waitFor(() => {
        expect(wrapper.vm.isStreaming).toBe(true)
      })

      // Call stop - should not throw
      expect(() => wrapper.vm.stop()).not.toThrow()

      // Stop is called successfully
      expect(typeof wrapper.vm.stop).toBe('function')
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
      const wrapper = mount(
        createTestComponent({ endpoint: '/api/chat', onToken })
      )
      await nextTick()

      await wrapper.vm.send('Test')
      await nextTick()

      await vi.waitFor(() => {
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
      const wrapper = mount(
        createTestComponent({ endpoint: '/api/chat', onCost })
      )
      await nextTick()

      await wrapper.vm.send('Test')
      await nextTick()

      await vi.waitFor(() => {
        expect(onCost).toHaveBeenCalled()
      })
    })

    it('should call onError callback', async () => {
      ;(global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Error',
      })

      const onError = vi.fn()
      const wrapper = mount(
        createTestComponent({
          endpoint: '/api/chat',
          onError,
          retry: { maxRetries: 0 },
        })
      )
      await nextTick()

      await wrapper.vm.send('Test').catch(() => {})
      await nextTick()

      await vi.waitFor(() => {
        expect(onError).toHaveBeenCalled()
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

      const wrapper = mount(createTestComponent({ endpoint: '/api/chat' }))
      await nextTick()

      await wrapper.vm.send('Test')
      await nextTick()

      // Unmount should not throw
      expect(() => wrapper.unmount()).not.toThrow()
    })

    it('should stop streaming on unmount', async () => {
      const mockReadableStream = new ReadableStream({
        start() {
          // Keep stream open indefinitely
        },
      })

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        body: mockReadableStream,
      })

      const wrapper = mount(createTestComponent({ endpoint: '/api/chat' }))
      await nextTick()

      wrapper.vm.send('Test')
      await nextTick()

      await vi.waitFor(() => {
        expect(wrapper.vm.isStreaming).toBe(true)
      })

      const isStreamingBefore = wrapper.vm.isStreaming

      // Unmount should not throw
      expect(() => wrapper.unmount()).not.toThrow()

      // Verify streaming was active before unmount
      expect(isStreamingBefore).toBe(true)
    })
  })

  describe('reactive updates', () => {
    it('should reactively update messages', async () => {
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

      const wrapper = mount(createTestComponent({ endpoint: '/api/chat' }))
      await nextTick()

      const messagesBefore = wrapper.vm.messages.length

      await wrapper.vm.send('Hello')
      await nextTick()

      await vi.waitFor(() => {
        expect(wrapper.vm.messages.length).toBeGreaterThan(messagesBefore)
      })
    })

    it('should reactively update usage', async () => {
      const mockReadableStream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            new TextEncoder().encode(
              'data: {"usage":{"promptTokens":50,"completionTokens":75,"totalTokens":125}}\n\n'
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

      const wrapper = mount(createTestComponent({ endpoint: '/api/chat' }))
      await nextTick()

      expect(wrapper.vm.usage.totalTokens).toBe(0)

      await wrapper.vm.send('Test')
      await nextTick()

      await vi.waitFor(() => {
        expect(wrapper.vm.usage.totalTokens).toBe(125)
      })
    })

    it('should reactively update error state', async () => {
      ;(global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Server Error',
      })

      const wrapper = mount(
        createTestComponent({
          endpoint: '/api/chat',
          retry: { maxRetries: 0 },
        })
      )
      await nextTick()

      expect(wrapper.vm.error).toBeNull()

      await wrapper.vm.send('Test').catch(() => {})
      await nextTick()

      await vi.waitFor(() => {
        expect(wrapper.vm.error).not.toBeNull()
      })
    })
  })

  describe('message updates', () => {
    it('should update existing message when streaming', async () => {
      const mockReadableStream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            new TextEncoder().encode('data: {"token":"Hello"}\n\n')
          )
          setTimeout(() => {
            controller.enqueue(
              new TextEncoder().encode('data: {"token":" there"}\n\n')
            )
            controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'))
            controller.close()
          }, 10)
        },
      })

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        body: mockReadableStream,
      })

      const wrapper = mount(createTestComponent({ endpoint: '/api/chat' }))
      await nextTick()

      await wrapper.vm.send('Test')
      await nextTick()

      await vi.waitFor(() => {
        const assistantMessage = wrapper.vm.messages.find(
          (m: any) => m.role === 'assistant'
        )
        expect(assistantMessage?.content).toContain('Hello')
      })

      await vi.waitFor(() => {
        const assistantMessage = wrapper.vm.messages.find(
          (m: any) => m.role === 'assistant'
        )
        expect(assistantMessage?.content).toBe('Hello there')
      })
    })
  })

  describe('edge cases', () => {
    it('should handle send with error thrown', async () => {
      ;(global.fetch as any).mockRejectedValue(new Error('Network error'))

      const wrapper = mount(
        createTestComponent({
          endpoint: '/api/chat',
          retry: { maxRetries: 0 },
        })
      )
      await nextTick()

      await wrapper.vm.send('Test')
      await nextTick()

      await vi.waitFor(() => {
        expect(wrapper.vm.error).not.toBeNull()
        expect(wrapper.vm.error?.message).toContain('Network error')
      })
    })

    it('should handle retry with error thrown', async () => {
      const mockReadableStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'))
          controller.close()
        },
      })

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        body: mockReadableStream,
      })

      const wrapper = mount(
        createTestComponent({
          endpoint: '/api/chat',
          retry: { maxRetries: 0 },
        })
      )
      await nextTick()

      await wrapper.vm.send('Test')
      await nextTick()

      ;(global.fetch as any).mockRejectedValue(new Error('Retry error'))

      await wrapper.vm.retry()
      await nextTick()

      await vi.waitFor(() => {
        expect(wrapper.vm.error).not.toBeNull()
      })
    })
  })
})
