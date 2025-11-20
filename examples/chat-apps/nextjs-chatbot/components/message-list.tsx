'use client'

import { Message } from '@/lib/store'
import { MessageItem } from './message-item'
import { TypingIndicator } from './typing-indicator'

interface MessageListProps {
  messages: Message[]
  isStreaming: boolean
}

export function MessageList({ messages, isStreaming }: MessageListProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <MessageItem key={message.id} message={message} />
      ))}
      {isStreaming && messages.length > 0 && (
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-semibold">
            AI
          </div>
          <div className="flex-1 bg-muted rounded-lg p-4">
            <TypingIndicator />
          </div>
        </div>
      )}
    </div>
  )
}
