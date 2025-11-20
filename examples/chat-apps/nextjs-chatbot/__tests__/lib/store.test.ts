import { describe, it, expect, beforeEach } from 'vitest'
import { useChatStore } from '@/lib/store'

describe('Chat Store', () => {
  beforeEach(() => {
    // Reset store before each test
    useChatStore.setState({
      conversations: [],
      currentConversationId: null,
      isStreaming: false,
      error: null,
    })
  })

  describe('createConversation', () => {
    it('creates a new conversation', () => {
      const { createConversation, conversations } = useChatStore.getState()

      const id = createConversation()

      const state = useChatStore.getState()

      expect(state.conversations.length).toBe(1)
      expect(state.currentConversationId).toBe(id)
      expect(state.conversations[0].id).toBe(id)
      expect(state.conversations[0].messages).toEqual([])
    })

    it('creates conversation with correct initial values', () => {
      const { createConversation } = useChatStore.getState()

      createConversation()

      const state = useChatStore.getState()
      const conversation = state.conversations[0]

      expect(conversation.title).toBe('New Conversation')
      expect(conversation.createdAt).toBeInstanceOf(Date)
      expect(conversation.updatedAt).toBeInstanceOf(Date)
    })
  })

  describe('deleteConversation', () => {
    it('deletes a conversation', () => {
      const { createConversation, deleteConversation } =
        useChatStore.getState()

      const id = createConversation()
      deleteConversation(id)

      const state = useChatStore.getState()

      expect(state.conversations.length).toBe(0)
      expect(state.currentConversationId).toBeNull()
    })

    it('switches to next conversation after deletion', () => {
      const { createConversation, deleteConversation } =
        useChatStore.getState()

      const id1 = createConversation()
      const id2 = createConversation()

      deleteConversation(id2)

      const state = useChatStore.getState()

      expect(state.conversations.length).toBe(1)
      expect(state.currentConversationId).toBe(id1)
    })
  })

  describe('addMessage', () => {
    it('adds message to conversation', () => {
      const { createConversation, addMessage } = useChatStore.getState()

      const id = createConversation()

      addMessage(id, {
        id: 'msg-1',
        role: 'user',
        content: 'Hello',
        timestamp: new Date(),
      })

      const state = useChatStore.getState()
      const conversation = state.conversations[0]

      expect(conversation.messages.length).toBe(1)
      expect(conversation.messages[0].content).toBe('Hello')
    })

    it('generates title from first user message', () => {
      const { createConversation, addMessage } = useChatStore.getState()

      const id = createConversation()

      addMessage(id, {
        id: 'msg-1',
        role: 'user',
        content: 'What is the meaning of life?',
        timestamp: new Date(),
      })

      const state = useChatStore.getState()
      const conversation = state.conversations[0]

      expect(conversation.title).toBe('What is the meaning of life?')
    })

    it('truncates long titles', () => {
      const { createConversation, addMessage } = useChatStore.getState()

      const id = createConversation()
      const longMessage = 'a'.repeat(100)

      addMessage(id, {
        id: 'msg-1',
        role: 'user',
        content: longMessage,
        timestamp: new Date(),
      })

      const state = useChatStore.getState()
      const conversation = state.conversations[0]

      expect(conversation.title.length).toBeLessThanOrEqual(53) // 50 + "..."
      expect(conversation.title).toContain('...')
    })
  })

  describe('updateLastMessage', () => {
    it('updates the last message content', () => {
      const { createConversation, addMessage, updateLastMessage } =
        useChatStore.getState()

      const id = createConversation()

      addMessage(id, {
        id: 'msg-1',
        role: 'assistant',
        content: 'Hello',
        timestamp: new Date(),
      })

      updateLastMessage(id, ' world')

      const state = useChatStore.getState()
      const conversation = state.conversations[0]

      expect(conversation.messages[0].content).toBe('Hello world')
    })

    it('does nothing if conversation has no messages', () => {
      const { createConversation, updateLastMessage } =
        useChatStore.getState()

      const id = createConversation()

      updateLastMessage(id, 'test')

      const state = useChatStore.getState()
      const conversation = state.conversations[0]

      expect(conversation.messages.length).toBe(0)
    })
  })

  describe('setStreaming', () => {
    it('updates streaming state', () => {
      const { setStreaming } = useChatStore.getState()

      setStreaming(true)

      expect(useChatStore.getState().isStreaming).toBe(true)

      setStreaming(false)

      expect(useChatStore.getState().isStreaming).toBe(false)
    })
  })

  describe('error handling', () => {
    it('sets error message', () => {
      const { setError } = useChatStore.getState()

      setError('Test error')

      expect(useChatStore.getState().error).toBe('Test error')
    })

    it('clears error message', () => {
      const { setError, clearError } = useChatStore.getState()

      setError('Test error')
      clearError()

      expect(useChatStore.getState().error).toBeNull()
    })
  })
})
