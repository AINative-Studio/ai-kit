import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useConversation } from '../../src/hooks/useConversation'
import { Message } from '@ainative/ai-kit-core'
import { Conversation, ConversationMetadata } from '@ainative/ai-kit-core/store'

/**
 * Mock ConversationStore implementation for testing
 */
class MockConversationStore {
  private conversations = new Map<string, Conversation>()

  async save(
    conversationId: string,
    messages: Message[],
    options?: { ttl?: number; metadata?: Record<string, any> }
  ): Promise<Conversation> {
    const existing = this.conversations.get(conversationId)
    const now = Date.now()

    const metadata: ConversationMetadata = {
      conversationId,
      createdAt: existing?.metadata.createdAt || now,
      updatedAt: now,
      messageCount: messages.length,
      ttl: options?.ttl,
      metadata: {
        ...existing?.metadata.metadata,
        ...options?.metadata,
      },
    }

    const conversation: Conversation = {
      conversationId,
      messages,
      metadata,
    }

    this.conversations.set(conversationId, conversation)
    return conversation
  }

  async load(conversationId: string): Promise<Conversation | null> {
    return this.conversations.get(conversationId) || null
  }

  async delete(conversationId: string): Promise<boolean> {
    return this.conversations.delete(conversationId)
  }

  async clear(): Promise<number> {
    const count = this.conversations.size
    this.conversations.clear()
    return count
  }

  async list(): Promise<string[]> {
    return Array.from(this.conversations.keys())
  }

  async exists(conversationId: string): Promise<boolean> {
    return this.conversations.has(conversationId)
  }

  // Helper method for testing
  reset() {
    this.conversations.clear()
  }
}

describe('useConversation', () => {
  let mockStore: MockConversationStore

  beforeEach(() => {
    mockStore = new MockConversationStore()
    vi.clearAllMocks()
  })

  afterEach(() => {
    mockStore.reset()
    vi.restoreAllMocks()
  })

  describe('initialization', () => {
    it('should initialize with empty state', () => {
      const { result } = renderHook(() =>
        useConversation({
          store: mockStore,
          conversationId: 'test-1',
          autoLoad: false,
        })
      )

      expect(result.current.messages).toEqual([])
      expect(result.current.isLoading).toBe(false)
      expect(result.current.isSaving).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current.hasMore).toBe(false)
      expect(result.current.metadata).toBeNull()
      expect(result.current.currentOffset).toBe(0)
    })

    it('should provide all required methods', () => {
      const { result } = renderHook(() =>
        useConversation({
          store: mockStore,
          conversationId: 'test-1',
          autoLoad: false,
        })
      )

      expect(typeof result.current.loadConversation).toBe('function')
      expect(typeof result.current.saveConversation).toBe('function')
      expect(typeof result.current.appendMessage).toBe('function')
      expect(typeof result.current.appendMessages).toBe('function')
      expect(typeof result.current.deleteMessage).toBe('function')
      expect(typeof result.current.updateMessage).toBe('function')
      expect(typeof result.current.clearConversation).toBe('function')
      expect(typeof result.current.loadMore).toBe('function')
      expect(typeof result.current.reload).toBe('function')
      expect(typeof result.current.clearError).toBe('function')
    })

    it('should auto-load conversation on mount when autoLoad is true', async () => {
      const mockMessage: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'Hello',
        timestamp: Date.now(),
      }

      await mockStore.save('test-1', [mockMessage])

      const { result } = renderHook(() =>
        useConversation({
          store: mockStore,
          conversationId: 'test-1',
          autoLoad: true,
        })
      )

      await waitFor(() => {
        expect(result.current.messages).toHaveLength(1)
        expect(result.current.messages[0].content).toBe('Hello')
        expect(result.current.isLoading).toBe(false)
      })
    })

    it('should not auto-load when autoLoad is false', async () => {
      const mockMessage: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'Hello',
        timestamp: Date.now(),
      }

      await mockStore.save('test-1', [mockMessage])

      const { result } = renderHook(() =>
        useConversation({
          store: mockStore,
          conversationId: 'test-1',
          autoLoad: false,
        })
      )

      // Should remain empty
      expect(result.current.messages).toEqual([])
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('loadConversation', () => {
    it('should load existing conversation', async () => {
      const mockMessages: Message[] = [
        { id: 'msg-1', role: 'user', content: 'Hello', timestamp: Date.now() },
        {
          id: 'msg-2',
          role: 'assistant',
          content: 'Hi there!',
          timestamp: Date.now(),
        },
      ]

      await mockStore.save('test-1', mockMessages)

      const { result } = renderHook(() =>
        useConversation({
          store: mockStore,
          conversationId: 'test-1',
          autoLoad: false,
        })
      )

      await act(async () => {
        await result.current.loadConversation()
      })

      await waitFor(() => {
        expect(result.current.messages).toHaveLength(2)
        expect(result.current.messages[0].content).toBe('Hello')
        expect(result.current.messages[1].content).toBe('Hi there!')
        expect(result.current.metadata).not.toBeNull()
      })
    })

    it('should handle non-existent conversation gracefully', async () => {
      const { result } = renderHook(() =>
        useConversation({
          store: mockStore,
          conversationId: 'non-existent',
          autoLoad: false,
        })
      )

      await act(async () => {
        await result.current.loadConversation()
      })

      await waitFor(() => {
        expect(result.current.messages).toEqual([])
        expect(result.current.metadata).toBeNull()
        expect(result.current.isLoading).toBe(false)
      })
    })

    it('should set loading state during load', async () => {
      const { result } = renderHook(() =>
        useConversation({
          store: mockStore,
          conversationId: 'test-1',
          autoLoad: false,
        })
      )

      act(() => {
        result.current.loadConversation()
      })

      // Check loading state is true immediately
      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })

    it('should call onLoad callback when conversation loads', async () => {
      const onLoad = vi.fn()
      const mockMessages: Message[] = [
        { id: 'msg-1', role: 'user', content: 'Test', timestamp: Date.now() },
      ]

      await mockStore.save('test-1', mockMessages)

      const { result } = renderHook(() =>
        useConversation({
          store: mockStore,
          conversationId: 'test-1',
          autoLoad: false,
          onLoad,
        })
      )

      await act(async () => {
        await result.current.loadConversation()
      })

      await waitFor(() => {
        expect(onLoad).toHaveBeenCalledTimes(1)
        expect(onLoad).toHaveBeenCalledWith(
          expect.objectContaining({
            conversationId: 'test-1',
            messages: expect.any(Array),
          })
        )
      })
    })

    it('should handle load errors', async () => {
      const mockError = new Error('Load failed')
      const onError = vi.fn()

      const failingStore = {
        load: vi.fn().mockRejectedValue(mockError),
      }

      const { result } = renderHook(() =>
        useConversation({
          store: failingStore,
          conversationId: 'test-1',
          autoLoad: false,
          onError,
        })
      )

      await act(async () => {
        await result.current.loadConversation()
      })

      await waitFor(() => {
        expect(result.current.error).toEqual(mockError)
        expect(result.current.isLoading).toBe(false)
        expect(onError).toHaveBeenCalledWith(mockError)
      })
    })
  })

  describe('saveConversation', () => {
    it('should save messages to store', async () => {
      const { result } = renderHook(() =>
        useConversation({
          store: mockStore,
          conversationId: 'test-1',
          autoLoad: false,
          autoSave: false,
        })
      )

      const mockMessage: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'Hello',
        timestamp: Date.now(),
      }

      await act(async () => {
        await result.current.appendMessage(mockMessage)
      })

      await act(async () => {
        await result.current.saveConversation()
      })

      await waitFor(() => {
        expect(result.current.metadata).not.toBeNull()
        expect(result.current.metadata?.messageCount).toBe(1)
      })

      // Verify it was saved to store
      const saved = await mockStore.load('test-1')
      expect(saved?.messages).toHaveLength(1)
      expect(saved?.messages[0].content).toBe('Hello')
    })

    it('should set saving state during save', async () => {
      const { result } = renderHook(() =>
        useConversation({
          store: mockStore,
          conversationId: 'test-1',
          autoLoad: false,
          autoSave: false,
        })
      )

      act(() => {
        result.current.saveConversation()
      })

      // Check saving state
      expect(result.current.isSaving).toBe(true)

      await waitFor(() => {
        expect(result.current.isSaving).toBe(false)
      })
    })

    it('should call onSave callback', async () => {
      const onSave = vi.fn()

      const { result } = renderHook(() =>
        useConversation({
          store: mockStore,
          conversationId: 'test-1',
          autoLoad: false,
          autoSave: false,
          onSave,
        })
      )

      await act(async () => {
        await result.current.saveConversation()
      })

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledTimes(1)
      })
    })

    it('should handle save errors', async () => {
      const mockError = new Error('Save failed')
      const onError = vi.fn()

      const failingStore = {
        save: vi.fn().mockRejectedValue(mockError),
        load: vi.fn().mockResolvedValue(null),
      }

      const { result } = renderHook(() =>
        useConversation({
          store: failingStore,
          conversationId: 'test-1',
          autoLoad: false,
          autoSave: false,
          onError,
        })
      )

      await act(async () => {
        await result.current.saveConversation()
      })

      await waitFor(() => {
        expect(result.current.error).toEqual(mockError)
        expect(result.current.isSaving).toBe(false)
        expect(onError).toHaveBeenCalledWith(mockError)
      })
    })

    it('should save with custom metadata and ttl', async () => {
      const customMetadata = { userId: '123', tag: 'important' }
      const ttl = 3600

      const saveSpy = vi.spyOn(mockStore, 'save')

      const { result } = renderHook(() =>
        useConversation({
          store: mockStore,
          conversationId: 'test-1',
          autoLoad: false,
          autoSave: false,
          metadata: customMetadata,
          ttl,
        })
      )

      await act(async () => {
        await result.current.saveConversation()
      })

      await waitFor(() => {
        expect(saveSpy).toHaveBeenCalledWith('test-1', [], {
          ttl: 3600,
          metadata: customMetadata,
        })
      })
    })
  })

  describe('auto-save functionality', () => {
    it('should trigger auto-save timer when message is appended', async () => {
      const { result } = renderHook(() =>
        useConversation({
          store: mockStore,
          conversationId: 'test-1',
          autoLoad: false,
          autoSave: true,
          autoSaveDelay: 50, // Very short delay for testing
        })
      )

      const mockMessage: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'Test',
        timestamp: Date.now(),
      }

      await act(async () => {
        await result.current.appendMessage(mockMessage)
      })

      // Message should be in state immediately (optimistic update)
      expect(result.current.messages).toHaveLength(1)

      // Wait for auto-save to complete
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Verify it was saved
      const saved = await mockStore.load('test-1')
      expect(saved?.messages).toHaveLength(1)
      expect(saved?.messages[0].content).toBe('Test')
    })

    it('should not auto-save when autoSave is false', async () => {
      const saveSpy = vi.spyOn(mockStore, 'save')

      const { result } = renderHook(() =>
        useConversation({
          store: mockStore,
          conversationId: 'test-1',
          autoLoad: false,
          autoSave: false,
        })
      )

      await act(async () => {
        await result.current.appendMessage({
          id: 'msg-1',
          role: 'user',
          content: 'Test',
          timestamp: Date.now(),
        })
      })

      // Wait to ensure no auto-save happens
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Should not have saved
      expect(saveSpy).not.toHaveBeenCalled()
    })

    it('should allow manual save regardless of autoSave setting', async () => {
      const { result } = renderHook(() =>
        useConversation({
          store: mockStore,
          conversationId: 'test-1',
          autoLoad: false,
          autoSave: false, // Auto-save disabled
        })
      )

      await act(async () => {
        await result.current.appendMessage({
          id: 'msg-1',
          role: 'user',
          content: 'Manual save test',
          timestamp: Date.now(),
        })
      })

      await act(async () => {
        await result.current.saveConversation()
      })

      // Should have saved manually
      const saved = await mockStore.load('test-1')
      expect(saved?.messages).toHaveLength(1)
      expect(saved?.messages[0].content).toBe('Manual save test')
    })
  })

  describe('appendMessage', () => {
    it('should append a message optimistically', async () => {
      const { result } = renderHook(() =>
        useConversation({
          store: mockStore,
          conversationId: 'test-1',
          autoLoad: false,
          autoSave: false,
        })
      )

      const mockMessage: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'Hello',
        timestamp: Date.now(),
      }

      await act(async () => {
        await result.current.appendMessage(mockMessage)
      })

      expect(result.current.messages).toHaveLength(1)
      expect(result.current.messages[0]).toEqual(mockMessage)
    })

    it('should append multiple messages in order', async () => {
      const { result } = renderHook(() =>
        useConversation({
          store: mockStore,
          conversationId: 'test-1',
          autoLoad: false,
          autoSave: false,
        })
      )

      await act(async () => {
        await result.current.appendMessage({
          id: 'msg-1',
          role: 'user',
          content: 'First',
          timestamp: Date.now(),
        })
      })

      await act(async () => {
        await result.current.appendMessage({
          id: 'msg-2',
          role: 'assistant',
          content: 'Second',
          timestamp: Date.now(),
        })
      })

      expect(result.current.messages).toHaveLength(2)
      expect(result.current.messages[0].content).toBe('First')
      expect(result.current.messages[1].content).toBe('Second')
    })
  })

  describe('appendMessages', () => {
    it('should append multiple messages at once', async () => {
      const { result } = renderHook(() =>
        useConversation({
          store: mockStore,
          conversationId: 'test-1',
          autoLoad: false,
          autoSave: false,
        })
      )

      const messages: Message[] = [
        { id: 'msg-1', role: 'user', content: 'Hello', timestamp: Date.now() },
        {
          id: 'msg-2',
          role: 'assistant',
          content: 'Hi',
          timestamp: Date.now(),
        },
        { id: 'msg-3', role: 'user', content: 'How are you?', timestamp: Date.now() },
      ]

      await act(async () => {
        await result.current.appendMessages(messages)
      })

      expect(result.current.messages).toHaveLength(3)
      expect(result.current.messages[0].content).toBe('Hello')
      expect(result.current.messages[2].content).toBe('How are you?')
    })
  })

  describe('deleteMessage', () => {
    it('should delete a message by ID', async () => {
      const { result } = renderHook(() =>
        useConversation({
          store: mockStore,
          conversationId: 'test-1',
          autoLoad: false,
          autoSave: false,
        })
      )

      await act(async () => {
        await result.current.appendMessages([
          { id: 'msg-1', role: 'user', content: 'First', timestamp: Date.now() },
          { id: 'msg-2', role: 'user', content: 'Second', timestamp: Date.now() },
          { id: 'msg-3', role: 'user', content: 'Third', timestamp: Date.now() },
        ])
      })

      expect(result.current.messages).toHaveLength(3)

      await act(async () => {
        await result.current.deleteMessage('msg-2')
      })

      expect(result.current.messages).toHaveLength(2)
      expect(result.current.messages.find((m) => m.id === 'msg-2')).toBeUndefined()
      expect(result.current.messages[0].content).toBe('First')
      expect(result.current.messages[1].content).toBe('Third')
    })
  })

  describe('updateMessage', () => {
    it('should update a message by ID', async () => {
      const { result } = renderHook(() =>
        useConversation({
          store: mockStore,
          conversationId: 'test-1',
          autoLoad: false,
          autoSave: false,
        })
      )

      await act(async () => {
        await result.current.appendMessage({
          id: 'msg-1',
          role: 'user',
          content: 'Original',
          timestamp: Date.now(),
        })
      })

      await act(async () => {
        await result.current.updateMessage('msg-1', {
          content: 'Updated',
        })
      })

      expect(result.current.messages[0].content).toBe('Updated')
      expect(result.current.messages[0].id).toBe('msg-1')
      expect(result.current.messages[0].role).toBe('user')
    })

    it('should update partial message properties', async () => {
      const { result } = renderHook(() =>
        useConversation({
          store: mockStore,
          conversationId: 'test-1',
          autoLoad: false,
          autoSave: false,
        })
      )

      const originalTimestamp = Date.now()

      await act(async () => {
        await result.current.appendMessage({
          id: 'msg-1',
          role: 'user',
          content: 'Original',
          timestamp: originalTimestamp,
        })
      })

      await act(async () => {
        await result.current.updateMessage('msg-1', {
          content: 'Updated',
        })
      })

      const updatedMessage = result.current.messages[0]
      expect(updatedMessage.content).toBe('Updated')
      expect(updatedMessage.timestamp).toBe(originalTimestamp) // Unchanged
    })
  })

  describe('clearConversation', () => {
    it('should clear all messages', async () => {
      const { result } = renderHook(() =>
        useConversation({
          store: mockStore,
          conversationId: 'test-1',
          autoLoad: false,
          autoSave: false,
        })
      )

      await act(async () => {
        await result.current.appendMessages([
          { id: 'msg-1', role: 'user', content: 'First', timestamp: Date.now() },
          { id: 'msg-2', role: 'user', content: 'Second', timestamp: Date.now() },
        ])
      })

      expect(result.current.messages).toHaveLength(2)

      await act(async () => {
        await result.current.clearConversation()
      })

      expect(result.current.messages).toEqual([])
      expect(result.current.hasMore).toBe(false)
      expect(result.current.currentOffset).toBe(0)
    })
  })

  describe('reload', () => {
    it('should reload conversation from store', async () => {
      const mockMessages: Message[] = [
        { id: 'msg-1', role: 'user', content: 'Hello', timestamp: Date.now() },
      ]

      await mockStore.save('test-1', mockMessages)

      const { result } = renderHook(() =>
        useConversation({
          store: mockStore,
          conversationId: 'test-1',
          autoLoad: false,
        })
      )

      // Initially empty
      expect(result.current.messages).toEqual([])

      await act(async () => {
        await result.current.reload()
      })

      await waitFor(() => {
        expect(result.current.messages).toHaveLength(1)
        expect(result.current.messages[0].content).toBe('Hello')
      })
    })
  })

  describe('clearError', () => {
    it('should clear error state', async () => {
      const mockError = new Error('Test error')

      const failingStore = {
        load: vi.fn().mockRejectedValue(mockError),
      }

      const { result } = renderHook(() =>
        useConversation({
          store: failingStore,
          conversationId: 'test-1',
          autoLoad: false,
        })
      )

      await act(async () => {
        await result.current.loadConversation()
      })

      await waitFor(() => {
        expect(result.current.error).toEqual(mockError)
      })

      act(() => {
        result.current.clearError()
      })

      expect(result.current.error).toBeNull()
    })
  })

  describe('pagination', () => {
    it('should handle loadMore', async () => {
      const { result } = renderHook(() =>
        useConversation({
          store: mockStore,
          conversationId: 'test-1',
          autoLoad: false,
        })
      )

      await act(async () => {
        await result.current.loadMore()
      })

      // Current implementation sets hasMore to false
      expect(result.current.hasMore).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('should handle concurrent save operations', async () => {
      const { result } = renderHook(() =>
        useConversation({
          store: mockStore,
          conversationId: 'test-1',
          autoLoad: false,
          autoSave: false,
        })
      )

      // Trigger multiple saves concurrently
      const saves = [
        result.current.saveConversation(),
        result.current.saveConversation(),
        result.current.saveConversation(),
      ]

      await act(async () => {
        await Promise.all(saves)
      })

      // Should complete without errors
      expect(result.current.error).toBeNull()
    })

    it('should cleanup timers on unmount', async () => {
      const { result, unmount } = renderHook(() =>
        useConversation({
          store: mockStore,
          conversationId: 'test-1',
          autoLoad: false,
          autoSave: true,
          autoSaveDelay: 1000,
        })
      )

      await act(async () => {
        await result.current.appendMessage({
          id: 'msg-1',
          role: 'user',
          content: 'Test',
          timestamp: Date.now(),
        })
      })

      // Unmount before auto-save triggers
      unmount()

      // Wait longer than the auto-save delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Should not have saved after unmount
      const saved = await mockStore.load('test-1')
      expect(saved).toBeNull()
    })

    it('should handle rapid conversation ID changes', async () => {
      const { result, rerender } = renderHook(
        ({ conversationId }) =>
          useConversation({
            store: mockStore,
            conversationId,
            autoLoad: false,
          }),
        { initialProps: { conversationId: 'test-1' } }
      )

      await act(async () => {
        await result.current.appendMessage({
          id: 'msg-1',
          role: 'user',
          content: 'Test 1',
          timestamp: Date.now(),
        })
      })

      // Change conversation ID
      rerender({ conversationId: 'test-2' })

      await act(async () => {
        await result.current.appendMessage({
          id: 'msg-2',
          role: 'user',
          content: 'Test 2',
          timestamp: Date.now(),
        })
      })

      // Messages should be preserved in state
      expect(result.current.messages).toHaveLength(2)
    })
  })
})
