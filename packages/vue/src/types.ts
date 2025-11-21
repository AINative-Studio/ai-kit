/**
 * Type definitions for Vue composables
 */

import { Ref } from 'vue'

// Temporary type definitions until core DTS is fixed
export type Message = {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
}

export type Conversation = {
  id: string
  messages: Message[]
  metadata?: ConversationMetadata
}

export type ConversationMetadata = {
  createdAt?: number
  updatedAt?: number
  title?: string
  [key: string]: any
}

/**
 * Options for configuring the useConversation composable
 */
export interface UseConversationOptions {
  /**
   * Conversation store instance to use
   */
  store: any // ConversationStore type

  /**
   * Conversation ID to load
   */
  conversationId: string

  /**
   * Auto-save messages on change
   * @default true
   */
  autoSave?: boolean

  /**
   * Debounce delay for auto-save in milliseconds
   * @default 1000
   */
  autoSaveDelay?: number

  /**
   * Page size for pagination
   * @default 50
   */
  pageSize?: number

  /**
   * Auto-load conversation on mount
   * @default true
   */
  autoLoad?: boolean

  /**
   * TTL in seconds for saved conversations
   */
  ttl?: number

  /**
   * Custom metadata to save with conversation
   */
  metadata?: Record<string, any>

  /**
   * Callback when conversation is loaded
   */
  onLoad?: (conversation: Conversation) => void

  /**
   * Callback when conversation is saved
   */
  onSave?: (conversation: Conversation) => void

  /**
   * Callback when an error occurs
   */
  onError?: (error: Error) => void

  /**
   * Callback when auto-save completes
   */
  onAutoSave?: (conversation: Conversation) => void
}

/**
 * Return type for useConversation composable
 */
export interface UseConversationReturn {
  /**
   * Current messages in the conversation (reactive)
   */
  messages: Ref<Message[]>

  /**
   * Loading state for initial load or pagination (reactive)
   */
  isLoading: Ref<boolean>

  /**
   * Saving state for auto-save or manual save (reactive)
   */
  isSaving: Ref<boolean>

  /**
   * Error state (reactive)
   */
  error: Ref<Error | null>

  /**
   * Whether more messages are available for pagination (reactive)
   */
  hasMore: Ref<boolean>

  /**
   * Conversation metadata (reactive)
   */
  metadata: Ref<ConversationMetadata | null>

  /**
   * Current page offset for pagination (reactive)
   */
  currentOffset: Ref<number>

  /**
   * Load conversation by ID
   * @param conversationId - Optional conversation ID (uses hook config ID if not provided)
   */
  loadConversation: (conversationId?: string) => Promise<void>

  /**
   * Manually save current conversation
   */
  saveConversation: () => Promise<void>

  /**
   * Append a message to the conversation
   * Triggers auto-save if enabled
   */
  appendMessage: (message: Message) => Promise<void>

  /**
   * Append multiple messages at once
   */
  appendMessages: (messages: Message[]) => Promise<void>

  /**
   * Delete a message from the conversation by ID
   */
  deleteMessage: (messageId: string) => Promise<void>

  /**
   * Update an existing message
   */
  updateMessage: (messageId: string, updates: Partial<Message>) => Promise<void>

  /**
   * Clear all messages from the conversation
   */
  clearConversation: () => Promise<void>

  /**
   * Load more messages (pagination)
   * Loads older messages before the current oldest message
   */
  loadMore: () => Promise<void>

  /**
   * Reload the conversation from the store
   */
  reload: () => Promise<void>

  /**
   * Reset error state
   */
  clearError: () => void
}
