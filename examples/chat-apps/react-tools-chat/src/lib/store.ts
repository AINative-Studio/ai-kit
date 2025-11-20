import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  toolCalls?: ToolCall[]
}

export interface ToolCall {
  id: string
  name: string
  input: any
  output?: any
  status: 'pending' | 'running' | 'success' | 'error'
  error?: string
  duration?: number
}

export interface ToolExecution {
  id: string
  name: string
  input: any
  output?: any
  status: 'running' | 'success' | 'error'
  error?: string
  timestamp: Date
  duration?: number
}

interface ChatState {
  messages: Message[]
  toolExecutions: ToolExecution[]
  isStreaming: boolean
  error: string | null

  addMessage: (message: Message) => void
  updateLastMessage: (content: string) => void
  addToolExecution: (execution: ToolExecution) => void
  updateToolExecution: (id: string, updates: Partial<ToolExecution>) => void
  setStreaming: (isStreaming: boolean) => void
  setError: (error: string | null) => void
  clearMessages: () => void
  exportConversation: () => string
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [],
      toolExecutions: [],
      isStreaming: false,
      error: null,

      addMessage: (message) =>
        set((state) => ({
          messages: [...state.messages, message],
        })),

      updateLastMessage: (content) =>
        set((state) => {
          if (state.messages.length === 0) return state

          const messages = [...state.messages]
          const lastMessage = messages[messages.length - 1]

          messages[messages.length - 1] = {
            ...lastMessage,
            content: lastMessage.content + content,
          }

          return { messages }
        }),

      addToolExecution: (execution) =>
        set((state) => ({
          toolExecutions: [...state.toolExecutions, execution],
        })),

      updateToolExecution: (id, updates) =>
        set((state) => ({
          toolExecutions: state.toolExecutions.map((exec) =>
            exec.id === id ? { ...exec, ...updates } : exec
          ),
        })),

      setStreaming: (isStreaming) => set({ isStreaming }),

      setError: (error) => set({ error }),

      clearMessages: () =>
        set({
          messages: [],
          toolExecutions: [],
          error: null,
        }),

      exportConversation: () => {
        const { messages } = get()

        const markdown = messages
          .map((msg) => {
            const header = `## ${msg.role === 'user' ? 'You' : 'Assistant'}\n`
            const timestamp = `*${new Date(msg.timestamp).toLocaleString()}*\n\n`
            const content = `${msg.content}\n\n`

            let toolInfo = ''
            if (msg.toolCalls && msg.toolCalls.length > 0) {
              toolInfo = '**Tools Used:**\n'
              msg.toolCalls.forEach((tool) => {
                toolInfo += `- ${tool.name}: ${tool.status}\n`
              })
              toolInfo += '\n'
            }

            return header + timestamp + content + toolInfo
          })
          .join('---\n\n')

        return `# Chat Export\n\nExported on ${new Date().toLocaleString()}\n\n${markdown}`
      },
    }),
    {
      name: 'react-tools-chat-storage',
      partialize: (state) => ({
        messages: state.messages,
      }),
    }
  )
)
