import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, nextTick } from 'vue'
import { useConversation } from '../src/useConversation'
import type { Message } from '@ainative/ai-kit-core'
import type { Conversation } from '@ainative/ai-kit-core/store'

// Mock conversation store
const createMockStore = () => {
  const conversations = new Map<string, Conversation>()

  return {
    load: vi.fn(async (id: string) => {
      return conversations.get(id) || null
    }),
    save: vi.fn(async (id: string, messages: Message[], options?: any) => {
      const conversation: Conversation = {
        id,
        messages,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        metadata: options?.metadata || null,
      }
      conversations.set(id, conversation)
      return conversation
    }),
    delete: vi.fn(async (id: string) => {
      conversations.delete(id)
    }),
    list: vi.fn(async () => Array.from(conversations.values())),
    clear: () => conversations.clear(),
  }
}

describe('useConversation', () => {
  let mockStore: ReturnType<typeof createMockStore>

  beforeEach(() => {
    mockStore = createMockStore()
    vi.clearAllTimers()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    mockStore.clear()
  })

  describe('initialization', () => {
    it('should initialize with empty state', async () => {
      const TestComponent = defineComponent({
        setup() {
          return useConversation({
            store: mockStore,
            conversationId: 'test-conv-1',
            autoLoad: false,
          })
        },
        template: '<div></div>',
      })

      const wrapper = mount(TestComponent)
      const vm = wrapper.vm as any

      expect(vm.messages).toEqual([])
      expect(vm.isLoading).toBe(false)
      expect(vm.isSaving).toBe(false)
      expect(vm.error).toBeNull()
      expect(vm.hasMore).toBe(false)
    })

    it('should auto-load conversation on mount when autoLoad is true', async () => {
      const messages: Message[] = [
        { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
      ]

      mockStore.save('test-conv-2', messages)
      await vi.runAllTimersAsync()

      const TestComponent = defineComponent({
        setup() {
          return useConversation({
            store: mockStore,
            conversationId: 'test-conv-2',
            autoLoad: true,
          })
        },
        template: '<div></div>',
      })

      const wrapper = mount(TestComponent)
      await nextTick()
      await vi.runAllTimersAsync()

      expect(mockStore.load).toHaveBeenCalledWith('test-conv-2')
    })

    it('should not auto-load when autoLoad is false', async () => {
      const TestComponent = defineComponent({
        setup() {
          return useConversation({
            store: mockStore,
            conversationId: 'test-conv-3',
            autoLoad: false,
          })
        },
        template: '<div></div>',
      })

      mount(TestComponent)
      await nextTick()

      expect(mockStore.load).not.toHaveBeenCalled()
    })
  })

  describe('loadConversation', () => {
    it('should load existing conversation', async () => {
      const messages: Message[] = [
        { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
        { id: '2', role: 'assistant', content: 'Hi there', timestamp: Date.now() },
      ]

      await mockStore.save('test-conv-4', messages)

      const TestComponent = defineComponent({
        setup() {
          return useConversation({
            store: mockStore,
            conversationId: 'test-conv-4',
            autoLoad: false,
          })
        },
        template: '<div></div>',
      })

      const wrapper = mount(TestComponent)
      const vm = wrapper.vm as any

      await vm.loadConversation()
      await nextTick()

      expect(vm.messages).toEqual(messages)
      expect(vm.isLoading).toBe(false)
    })

    it('should handle non-existent conversation', async () => {
      const TestComponent = defineComponent({
        setup() {
          return useConversation({
            store: mockStore,
            conversationId: 'non-existent',
            autoLoad: false,
          })
        },
        template: '<div></div>',
      })

      const wrapper = mount(TestComponent)
      const vm = wrapper.vm as any

      await vm.loadConversation()
      await nextTick()

      expect(vm.messages).toEqual([])
      expect(vm.metadata).toBeNull()
    })

    it('should set loading state during load', async () => {
      const TestComponent = defineComponent({
        setup() {
          return useConversation({
            store: mockStore,
            conversationId: 'test-conv-5',
            autoLoad: false,
          })
        },
        template: '<div></div>',
      })

      const wrapper = mount(TestComponent)
      const vm = wrapper.vm as any

      const loadPromise = vm.loadConversation()
      await nextTick()

      expect(vm.isLoading).toBe(true)

      await loadPromise
      await nextTick()

      expect(vm.isLoading).toBe(false)
    })

    it('should call onLoad callback', async () => {
      const messages: Message[] = [
        { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
      ]
      await mockStore.save('test-conv-6', messages)

      const onLoad = vi.fn()

      const TestComponent = defineComponent({
        setup() {
          return useConversation({
            store: mockStore,
            conversationId: 'test-conv-6',
            autoLoad: false,
            onLoad,
          })
        },
        template: '<div></div>',
      })

      const wrapper = mount(TestComponent)
      const vm = wrapper.vm as any

      await vm.loadConversation()
      await nextTick()

      expect(onLoad).toHaveBeenCalled()
    })
  })

  describe('saveConversation', () => {
    it('should save conversation', async () => {
      const TestComponent = defineComponent({
        setup() {
          return useConversation({
            store: mockStore,
            conversationId: 'test-conv-7',
            autoLoad: false,
          })
        },
        template: '<div></div>',
      })

      const wrapper = mount(TestComponent)
      const vm = wrapper.vm as any

      const message: Message = {
        id: '1',
        role: 'user',
        content: 'Test',
        timestamp: Date.now(),
      }

      vm.messages.push(message)
      await vm.saveConversation()
      await nextTick()

      expect(mockStore.save).toHaveBeenCalledWith('test-conv-7', [message], expect.any(Object))
    })

    it('should call onSave callback', async () => {
      const onSave = vi.fn()

      const TestComponent = defineComponent({
        setup() {
          return useConversation({
            store: mockStore,
            conversationId: 'test-conv-8',
            autoLoad: false,
            onSave,
          })
        },
        template: '<div></div>',
      })

      const wrapper = mount(TestComponent)
      const vm = wrapper.vm as any

      await vm.saveConversation()
      await nextTick()

      expect(onSave).toHaveBeenCalled()
    })

    it('should set saving state', async () => {
      const TestComponent = defineComponent({
        setup() {
          return useConversation({
            store: mockStore,
            conversationId: 'test-conv-9',
            autoLoad: false,
          })
        },
        template: '<div></div>',
      })

      const wrapper = mount(TestComponent)
      const vm = wrapper.vm as any

      const savePromise = vm.saveConversation()
      await nextTick()

      expect(vm.isSaving).toBe(true)

      await savePromise
      await nextTick()

      expect(vm.isSaving).toBe(false)
    })
  })

  describe('appendMessage', () => {
    it('should append a message', async () => {
      const TestComponent = defineComponent({
        setup() {
          return useConversation({
            store: mockStore,
            conversationId: 'test-conv-10',
            autoLoad: false,
            autoSave: false,
          })
        },
        template: '<div></div>',
      })

      const wrapper = mount(TestComponent)
      const vm = wrapper.vm as any

      const message: Message = {
        id: '1',
        role: 'user',
        content: 'Hello',
        timestamp: Date.now(),
      }

      await vm.appendMessage(message)
      await nextTick()

      expect(vm.messages).toContainEqual(message)
    })

    it('should trigger auto-save when enabled', async () => {
      const TestComponent = defineComponent({
        setup() {
          return useConversation({
            store: mockStore,
            conversationId: 'test-conv-11',
            autoLoad: false,
            autoSave: true,
            autoSaveDelay: 500,
          })
        },
        template: '<div></div>',
      })

      const wrapper = mount(TestComponent)
      const vm = wrapper.vm as any

      const message: Message = {
        id: '1',
        role: 'user',
        content: 'Hello',
        timestamp: Date.now(),
      }

      await vm.appendMessage(message)
      await nextTick()

      // Fast-forward time
      await vi.advanceTimersByTimeAsync(600)

      expect(mockStore.save).toHaveBeenCalled()
    })
  })

  describe('appendMessages', () => {
    it('should append multiple messages', async () => {
      const TestComponent = defineComponent({
        setup() {
          return useConversation({
            store: mockStore,
            conversationId: 'test-conv-12',
            autoLoad: false,
            autoSave: false,
          })
        },
        template: '<div></div>',
      })

      const wrapper = mount(TestComponent)
      const vm = wrapper.vm as any

      const messages: Message[] = [
        { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
        { id: '2', role: 'assistant', content: 'Hi', timestamp: Date.now() },
      ]

      await vm.appendMessages(messages)
      await nextTick()

      expect(vm.messages).toHaveLength(2)
      expect(vm.messages).toEqual(messages)
    })
  })

  describe('deleteMessage', () => {
    it('should delete a message by ID', async () => {
      const TestComponent = defineComponent({
        setup() {
          return useConversation({
            store: mockStore,
            conversationId: 'test-conv-13',
            autoLoad: false,
            autoSave: false,
          })
        },
        template: '<div></div>',
      })

      const wrapper = mount(TestComponent)
      const vm = wrapper.vm as any

      const messages: Message[] = [
        { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
        { id: '2', role: 'assistant', content: 'Hi', timestamp: Date.now() },
      ]

      await vm.appendMessages(messages)
      await nextTick()

      await vm.deleteMessage('1')
      await nextTick()

      expect(vm.messages).toHaveLength(1)
      expect(vm.messages[0].id).toBe('2')
    })
  })

  describe('updateMessage', () => {
    it('should update a message', async () => {
      const TestComponent = defineComponent({
        setup() {
          return useConversation({
            store: mockStore,
            conversationId: 'test-conv-14',
            autoLoad: false,
            autoSave: false,
          })
        },
        template: '<div></div>',
      })

      const wrapper = mount(TestComponent)
      const vm = wrapper.vm as any

      const message: Message = {
        id: '1',
        role: 'user',
        content: 'Hello',
        timestamp: Date.now(),
      }

      await vm.appendMessage(message)
      await nextTick()

      await vm.updateMessage('1', { content: 'Updated content' })
      await nextTick()

      expect(vm.messages[0].content).toBe('Updated content')
    })
  })

  describe('clearConversation', () => {
    it('should clear all messages', async () => {
      const TestComponent = defineComponent({
        setup() {
          return useConversation({
            store: mockStore,
            conversationId: 'test-conv-15',
            autoLoad: false,
            autoSave: false,
          })
        },
        template: '<div></div>',
      })

      const wrapper = mount(TestComponent)
      const vm = wrapper.vm as any

      const messages: Message[] = [
        { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
        { id: '2', role: 'assistant', content: 'Hi', timestamp: Date.now() },
      ]

      await vm.appendMessages(messages)
      await nextTick()

      await vm.clearConversation()
      await nextTick()

      expect(vm.messages).toEqual([])
      expect(vm.hasMore).toBe(false)
      expect(vm.currentOffset).toBe(0)
    })
  })

  describe('error handling', () => {
    it('should handle load errors', async () => {
      const errorStore = {
        ...mockStore,
        load: vi.fn().mockRejectedValue(new Error('Load failed')),
      }

      const onError = vi.fn()

      const TestComponent = defineComponent({
        setup() {
          return useConversation({
            store: errorStore,
            conversationId: 'test-conv-16',
            autoLoad: false,
            onError,
          })
        },
        template: '<div></div>',
      })

      const wrapper = mount(TestComponent)
      const vm = wrapper.vm as any

      await vm.loadConversation()
      await nextTick()

      expect(vm.error).toBeInstanceOf(Error)
      expect(vm.error?.message).toBe('Load failed')
      expect(onError).toHaveBeenCalled()
    })

    it('should handle save errors', async () => {
      const errorStore = {
        ...mockStore,
        save: vi.fn().mockRejectedValue(new Error('Save failed')),
      }

      const onError = vi.fn()

      const TestComponent = defineComponent({
        setup() {
          return useConversation({
            store: errorStore,
            conversationId: 'test-conv-17',
            autoLoad: false,
            onError,
          })
        },
        template: '<div></div>',
      })

      const wrapper = mount(TestComponent)
      const vm = wrapper.vm as any

      await vm.saveConversation()
      await nextTick()

      expect(vm.error).toBeInstanceOf(Error)
      expect(vm.error?.message).toBe('Save failed')
      expect(onError).toHaveBeenCalled()
    })

    it('should clear error state', async () => {
      const TestComponent = defineComponent({
        setup() {
          return useConversation({
            store: mockStore,
            conversationId: 'test-conv-18',
            autoLoad: false,
          })
        },
        template: '<div></div>',
      })

      const wrapper = mount(TestComponent)
      const vm = wrapper.vm as any

      vm.error = new Error('Test error')
      await nextTick()

      vm.clearError()
      await nextTick()

      expect(vm.error).toBeNull()
    })
  })

  describe('reload', () => {
    it('should reload conversation from store', async () => {
      const messages: Message[] = [
        { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
      ]
      await mockStore.save('test-conv-19', messages)

      const TestComponent = defineComponent({
        setup() {
          return useConversation({
            store: mockStore,
            conversationId: 'test-conv-19',
            autoLoad: false,
          })
        },
        template: '<div></div>',
      })

      const wrapper = mount(TestComponent)
      const vm = wrapper.vm as any

      await vm.reload()
      await nextTick()

      expect(mockStore.load).toHaveBeenCalledWith('test-conv-19')
      expect(vm.messages).toEqual(messages)
    })
  })

  describe('cleanup', () => {
    it('should clear auto-save timer on unmount', async () => {
      const TestComponent = defineComponent({
        setup() {
          return useConversation({
            store: mockStore,
            conversationId: 'test-conv-20',
            autoLoad: false,
            autoSave: true,
          })
        },
        template: '<div></div>',
      })

      const wrapper = mount(TestComponent)
      const vm = wrapper.vm as any

      const message: Message = {
        id: '1',
        role: 'user',
        content: 'Hello',
        timestamp: Date.now(),
      }

      await vm.appendMessage(message)
      await nextTick()

      // Unmount before auto-save triggers
      wrapper.unmount()

      // Fast-forward time
      await vi.advanceTimersByTimeAsync(2000)

      // Auto-save should not have been called after unmount
      expect(mockStore.save).not.toHaveBeenCalled()
    })
  })
})
