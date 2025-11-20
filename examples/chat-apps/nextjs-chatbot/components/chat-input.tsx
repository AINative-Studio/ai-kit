'use client'

import { useState, useRef, KeyboardEvent } from 'react'
import { Send, Paperclip, Mic } from 'lucide-react'

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSend: (message: string) => void
  disabled?: boolean
}

export function ChatInput({ value, onChange, onSend, disabled }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (value.trim() && !disabled) {
        onSend(value)
      }
    }
  }

  const handleSubmit = () => {
    if (value.trim() && !disabled) {
      onSend(value)
    }
  }

  return (
    <div className="border-t border-border bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-end space-x-2">
          <button
            type="button"
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Attach file"
          >
            <Paperclip className="w-5 h-5 text-muted-foreground" />
          </button>

          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              placeholder="Type your message... (Shift+Enter for new line)"
              className="w-full resize-none rounded-lg border border-input bg-background px-4 py-3 pr-12 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 max-h-32"
              rows={1}
              style={{
                minHeight: '44px',
                height: 'auto',
              }}
            />
          </div>

          <button
            type="button"
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Voice input"
          >
            <Mic className="w-5 h-5 text-muted-foreground" />
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={disabled || !value.trim()}
            className="p-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-2 text-xs text-muted-foreground text-center">
          AI can make mistakes. Verify important information.
        </div>
      </div>
    </div>
  )
}
