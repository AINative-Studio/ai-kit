/**
 * Type definitions for useConversation hook
 */

import { Message } from '@ainative/ai-kit-core'
import { Conversation, ConversationMetadata } from '@ainative/ai-kit-core/store'

/**
 * Options for configuring the useConversation hook
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
 * State for conversation management
 */
export interface ConversationState {
  /**
   * Current messages in the conversation
   */
  messages: Message[]

  /**
   * Loading state for initial load or pagination
   */
  isLoading: boolean

  /**
   * Saving state for auto-save or manual save
   */
  isSaving: boolean

  /**
   * Error state
   */
  error: Error | null

  /**
   * Whether more messages are available for pagination
   */
  hasMore: boolean

  /**
   * Conversation metadata
   */
  metadata: ConversationMetadata | null

  /**
   * Current page offset for pagination
   */
  currentOffset: number
}

/**
 * Actions for conversation management
 */
export interface ConversationActions {
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

/**
 * Return type for useConversation hook
 */
export interface UseConversationReturn extends ConversationState, ConversationActions {}
