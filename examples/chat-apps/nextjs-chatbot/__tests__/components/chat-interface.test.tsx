import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ChatInterface } from '@/components/chat-interface'
import { useChatStore } from '@/lib/store'

// Mock fetch
global.fetch = vi.fn()

describe('ChatInterface', () => {
  beforeEach(() => {
    // Reset store
    useChatStore.setState({
      conversations: [],
      currentConversationId: null,
      isStreaming: false,
      error: null,
    })

    vi.clearAllMocks()
  })

  it('renders empty state when no conversation exists', () => {
    render(<ChatInterface />)
    expect(screen.getByText(/Welcome to AI Chatbot/i)).toBeInTheDocument()
  })

  it('creates new conversation when clicking start button', async () => {
    render(<ChatInterface />)

    const startButton = screen.getByText(/Start New Conversation/i)
    fireEvent.click(startButton)

    const store = useChatStore.getState()
    expect(store.conversations.length).toBe(1)
    expect(store.currentConversationId).toBeTruthy()
  })

  it('displays messages in current conversation', () => {
    const conversationId = 'test-conv-1'

    useChatStore.setState({
      conversations: [
        {
          id: conversationId,
          title: 'Test Chat',
          messages: [
            {
              id: 'msg-1',
              role: 'user',
              content: 'Hello',
              timestamp: new Date(),
            },
            {
              id: 'msg-2',
              role: 'assistant',
              content: 'Hi there!',
              timestamp: new Date(),
            },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      currentConversationId: conversationId,
    })

    render(<ChatInterface />)

    expect(screen.getByText('Hello')).toBeInTheDocument()
    expect(screen.getByText('Hi there!')).toBeInTheDocument()
  })

  it('sends message and handles streaming response', async () => {
    const conversationId = 'test-conv-1'

    useChatStore.setState({
      conversations: [
        {
          id: conversationId,
          title: 'Test Chat',
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      currentConversationId: conversationId,
    })

    // Mock streaming response
    const mockReader = {
      read: vi
        .fn()
        .mockResolvedValueOnce({
          done: false,
          value: new TextEncoder().encode(
            'data: {"type":"content","content":"Hello"}\n\n'
          ),
        })
        .mockResolvedValueOnce({
          done: false,
          value: new TextEncoder().encode(
            'data: {"type":"done","tokenCount":10,"cost":0.001}\n\n'
          ),
        })
        .mockResolvedValueOnce({ done: true, value: undefined }),
    }

    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      body: {
        getReader: () => mockReader,
      },
    })

    render(<ChatInterface />)

    const input = screen.getByPlaceholderText(/Type your message/i)
    const sendButton = screen.getByLabelText(/Send message/i)

    fireEvent.change(input, { target: { value: 'Test message' } })
    fireEvent.click(sendButton)

    await waitFor(() => {
      const store = useChatStore.getState()
      expect(store.conversations[0].messages.length).toBeGreaterThan(0)
    })
  })

  it('disables input when streaming', () => {
    const conversationId = 'test-conv-1'

    useChatStore.setState({
      conversations: [
        {
          id: conversationId,
          title: 'Test Chat',
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      currentConversationId: conversationId,
      isStreaming: true,
    })

    render(<ChatInterface />)

    const input = screen.getByPlaceholderText(/Type your message/i)
    const sendButton = screen.getByLabelText(/Send message/i)

    expect(input).toBeDisabled()
    expect(sendButton).toBeDisabled()
  })

  it('handles error gracefully', async () => {
    const conversationId = 'test-conv-1'

    useChatStore.setState({
      conversations: [
        {
          id: conversationId,
          title: 'Test Chat',
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      currentConversationId: conversationId,
    })

    ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

    render(<ChatInterface />)

    const input = screen.getByPlaceholderText(/Type your message/i)
    const sendButton = screen.getByLabelText(/Send message/i)

    fireEvent.change(input, { target: { value: 'Test message' } })
    fireEvent.click(sendButton)

    await waitFor(() => {
      const store = useChatStore.getState()
      expect(store.error).toBeTruthy()
      expect(store.isStreaming).toBe(false)
    })
  })
})
