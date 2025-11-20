'use client'

import { Message } from '@/lib/store'
import { format } from 'date-fns'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { User, Bot } from 'lucide-react'

interface MessageItemProps {
  message: Message
}

export function MessageItem({ message }: MessageItemProps) {
  const isUser = message.role === 'user'

  return (
    <div
      className={`flex items-start space-x-3 animate-fade-in ${
        isUser ? 'justify-end' : ''
      }`}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground flex-shrink-0">
          <Bot className="w-4 h-4" />
        </div>
      )}

      <div
        className={`flex-1 max-w-3xl ${
          isUser ? 'flex flex-col items-end' : ''
        }`}
      >
        <div
          className={`rounded-lg p-4 ${
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted'
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="markdown-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        <div className="text-xs text-muted-foreground mt-1 px-1">
          {format(new Date(message.timestamp), 'HH:mm')}
          {message.metadata?.tokenCount && (
            <span className="ml-2">
              {message.metadata.tokenCount} tokens
            </span>
          )}
          {message.metadata?.cost && (
            <span className="ml-2">
              ${message.metadata.cost.toFixed(4)}
            </span>
          )}
        </div>
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4" />
        </div>
      )}
    </div>
  )
}
