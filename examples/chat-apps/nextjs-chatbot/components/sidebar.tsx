'use client'

import { useChatStore } from '@/lib/store'
import { Plus, MessageSquare, Trash2, MoreVertical } from 'lucide-react'
import { format } from 'date-fns'
import { useState } from 'react'

export function Sidebar() {
  const {
    conversations,
    currentConversationId,
    createConversation,
    setCurrentConversation,
    deleteConversation,
  } = useChatStore()

  const [hoveredId, setHoveredId] = useState<string | null>(null)

  return (
    <aside className="w-64 border-r border-border bg-muted/10 flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <button
          onClick={() => createConversation()}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Chat</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {conversations.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm mt-8 px-4">
            No conversations yet. Start a new chat!
          </div>
        ) : (
          <div className="space-y-1">
            {conversations.map((conversation) => {
              const isActive = conversation.id === currentConversationId
              const isHovered = hoveredId === conversation.id

              return (
                <div
                  key={conversation.id}
                  className={`group relative rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-muted'
                  }`}
                  onMouseEnter={() => setHoveredId(conversation.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <button
                    onClick={() => setCurrentConversation(conversation.id)}
                    className="w-full text-left p-3 pr-10"
                  >
                    <div className="flex items-start space-x-2">
                      <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {conversation.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(
                            new Date(conversation.updatedAt),
                            'MMM d, HH:mm'
                          )}
                        </p>
                      </div>
                    </div>
                  </button>

                  {isHovered && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (
                          confirm(
                            'Are you sure you want to delete this conversation?'
                          )
                        ) {
                          deleteConversation(conversation.id)
                        }
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-destructive/10 text-destructive"
                      aria-label="Delete conversation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border">
        <div className="text-xs text-muted-foreground space-y-1">
          <p>
            <span className="font-semibold">
              {conversations.length}
            </span>{' '}
            conversations
          </p>
          <p>
            <span className="font-semibold">
              {conversations.reduce((sum, c) => sum + c.messages.length, 0)}
            </span>{' '}
            messages
          </p>
        </div>
      </div>
    </aside>
  )
}
