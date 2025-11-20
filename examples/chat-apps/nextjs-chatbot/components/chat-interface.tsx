'use client'

import { useEffect, useRef, useState } from 'react'
import { useChatStore } from '@/lib/store'
import { MessageList } from './message-list'
import { ChatInput } from './chat-input'
import { EmptyState } from './empty-state'

export function ChatInterface() {
  const {
    conversations,
    currentConversationId,
    createConversation,
    addMessage,
    updateLastMessage,
    setStreaming,
    setError,
    isStreaming,
  } = useChatStore()

  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const currentConversation = conversations.find(
    (conv) => conv.id === currentConversationId
  )

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentConversation?.messages])

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isStreaming) return

    let conversationId = currentConversationId

    // Create new conversation if none exists
    if (!conversationId) {
      conversationId = createConversation()
    }

    // Add user message
    const userMessage = {
      id: `msg_${Date.now()}`,
      role: 'user' as const,
      content: content.trim(),
      timestamp: new Date(),
    }

    addMessage(conversationId, userMessage)
    setInput('')
    setStreaming(true)
    setError(null)

    // Prepare messages for API
    const conversation = conversations.find((c) => c.id === conversationId)
    const messages = conversation
      ? conversation.messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        }))
      : []

    messages.push({ role: 'user', content: content.trim() })

    try {
      // Create assistant message placeholder
      const assistantMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant' as const,
        content: '',
        timestamp: new Date(),
      }

      addMessage(conversationId, assistantMessage)

      // Stream response
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          conversationId,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response body')
      }

      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6))

              if (data.type === 'content') {
                updateLastMessage(conversationId!, data.content)
              } else if (data.type === 'done') {
                // Stream complete
                console.log('Stream complete:', data)
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e)
            }
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error)
      setError(
        error instanceof Error ? error.message : 'Failed to send message'
      )
    } finally {
      setStreaming(false)
    }
  }

  if (!currentConversation) {
    return (
      <EmptyState
        onStart={() => {
          const id = createConversation()
        }}
      />
    )
  }

  return (
    <div className="flex flex-col h-full">
      <MessageList
        messages={currentConversation.messages}
        isStreaming={isStreaming}
      />
      <div ref={messagesEndRef} />
      <ChatInput
        value={input}
        onChange={setInput}
        onSend={handleSendMessage}
        disabled={isStreaming}
      />
    </div>
  )
}
