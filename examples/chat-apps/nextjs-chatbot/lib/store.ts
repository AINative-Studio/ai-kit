import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  metadata?: {
    tokenCount?: number
    cost?: number
  }
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

interface ChatState {
  conversations: Conversation[]
  currentConversationId: string | null
  isStreaming: boolean
  error: string | null

  // Actions
  createConversation: () => string
  deleteConversation: (id: string) => void
  setCurrentConversation: (id: string) => void
  addMessage: (conversationId: string, message: Message) => void
  updateLastMessage: (conversationId: string, content: string) => void
  setStreaming: (isStreaming: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: [],
      currentConversationId: null,
      isStreaming: false,
      error: null,

      createConversation: () => {
        const id = `conv_${Date.now()}_${Math.random().toString(36).substring(7)}`
        const newConversation: Conversation = {
          id,
          title: 'New Conversation',
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        set((state) => ({
          conversations: [newConversation, ...state.conversations],
          currentConversationId: id,
        }))

        return id
      },

      deleteConversation: (id: string) => {
        set((state) => {
          const filtered = state.conversations.filter((conv) => conv.id !== id)
          const currentId =
            state.currentConversationId === id
              ? filtered[0]?.id || null
              : state.currentConversationId

          return {
            conversations: filtered,
            currentConversationId: currentId,
          }
        })
      },

      setCurrentConversation: (id: string) => {
        set({ currentConversationId: id })
      },

      addMessage: (conversationId: string, message: Message) => {
        set((state) => ({
          conversations: state.conversations.map((conv) => {
            if (conv.id === conversationId) {
              // Auto-generate title from first user message
              const title =
                conv.messages.length === 0 && message.role === 'user'
                  ? message.content.substring(0, 50) +
                    (message.content.length > 50 ? '...' : '')
                  : conv.title

              return {
                ...conv,
                title,
                messages: [...conv.messages, message],
                updatedAt: new Date(),
              }
            }
            return conv
          }),
        }))
      },

      updateLastMessage: (conversationId: string, content: string) => {
        set((state) => ({
          conversations: state.conversations.map((conv) => {
            if (conv.id === conversationId && conv.messages.length > 0) {
              const messages = [...conv.messages]
              const lastMessage = messages[messages.length - 1]
              messages[messages.length - 1] = {
                ...lastMessage,
                content: lastMessage.content + content,
              }

              return {
                ...conv,
                messages,
                updatedAt: new Date(),
              }
            }
            return conv
          }),
        }))
      },

      setStreaming: (isStreaming: boolean) => {
        set({ isStreaming })
      },

      setError: (error: string | null) => {
        set({ error })
      },

      clearError: () => {
        set({ error: null })
      },
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({
        conversations: state.conversations,
        currentConversationId: state.currentConversationId,
      }),
    }
  )
)
