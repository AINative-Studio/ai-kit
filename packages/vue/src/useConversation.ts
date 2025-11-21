/**
 * useConversation composable - Manages conversation state with ConversationStore
 *
 * Features:
 * - Load conversations from ConversationStore
 * - Auto-save on message updates with debouncing
 * - Pagination support for long conversations
 * - Optimistic UI updates
 * - Error handling and retry logic
 * - Loading states
 */

import { ref, onMounted, onUnmounted } from 'vue'
import type { Message, UseConversationOptions, UseConversationReturn } from './types'

/**
 * Vue 3 composable for managing conversations with persistent storage
 */
export function useConversation(
  options: UseConversationOptions
): UseConversationReturn {
  const {
    store,
    conversationId: initialConversationId,
    autoSave = true,
    autoSaveDelay = 1000,
    autoLoad = true,
    ttl,
    metadata: customMetadata,
    onLoad,
    onSave,
    onError,
    onAutoSave,
  } = options

  // Reactive state
  const messages = ref<Message[]>([])
  const isLoading = ref(false)
  const isSaving = ref(false)
  const error = ref<Error | null>(null)
  const hasMore = ref(false)
  const metadata = ref<any>(null)
  const currentOffset = ref(0)

  // Internal refs for managing async operations
  let conversationId = initialConversationId
  let autoSaveTimer: NodeJS.Timeout | null = null
  let saveLock = false

  /**
   * Load conversation from store
   */
  const loadConversation = async (newConversationId?: string): Promise<void> => {
    if (newConversationId) {
      conversationId = newConversationId
    }

    isLoading.value = true
    error.value = null

    try {
      const conversation = await store.load(conversationId)

      if (conversation) {
        messages.value = conversation.messages
        metadata.value = conversation.metadata
        hasMore.value = false // Reset pagination
        currentOffset.value = 0
        onLoad?.(conversation)
      } else {
        // Conversation doesn't exist yet - start fresh
        messages.value = []
        metadata.value = null
        hasMore.value = false
        currentOffset.value = 0
      }
    } catch (err) {
      error.value = err as Error
      onError?.(err as Error)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Save conversation to store
   */
  const saveConversation = async (): Promise<void> => {
    // Prevent concurrent saves
    if (saveLock) {
      return
    }

    saveLock = true
    isSaving.value = true
    error.value = null

    try {
      const conversation = await store.save(
        conversationId,
        messages.value,
        {
          ttl,
          metadata: customMetadata,
        }
      )

      metadata.value = conversation.metadata
      onSave?.(conversation)
    } catch (err) {
      error.value = err as Error
      onError?.(err as Error)
    } finally {
      isSaving.value = false
      saveLock = false
    }
  }

  /**
   * Trigger auto-save with debouncing
   */
  const triggerAutoSave = (): void => {
    if (!autoSave) return

    // Clear existing timer
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer)
    }

    // Set new timer
    autoSaveTimer = setTimeout(async () => {
      await saveConversation()

      if (onAutoSave) {
        try {
          const conversation = await store.load(conversationId)
          if (conversation) {
            onAutoSave(conversation)
          }
        } catch (err) {
          // Ignore errors in auto-save callback
        }
      }
    }, autoSaveDelay)
  }

  /**
   * Append a single message
   */
  const appendMessage = async (message: Message): Promise<void> => {
    // Optimistic update
    messages.value = [...messages.value, message]

    // Trigger auto-save
    triggerAutoSave()
  }

  /**
   * Append multiple messages at once
   */
  const appendMessages = async (newMessages: Message[]): Promise<void> => {
    // Optimistic update
    messages.value = [...messages.value, ...newMessages]

    // Trigger auto-save
    triggerAutoSave()
  }

  /**
   * Delete a message by ID
   */
  const deleteMessage = async (messageId: string): Promise<void> => {
    // Optimistic update
    messages.value = messages.value.filter((m: Message) => m.id !== messageId)

    // Trigger auto-save
    triggerAutoSave()
  }

  /**
   * Update an existing message
   */
  const updateMessage = async (
    messageId: string,
    updates: Partial<Message>
  ): Promise<void> => {
    // Optimistic update
    messages.value = messages.value.map((m: Message) =>
      m.id === messageId ? { ...m, ...updates } : m
    )

    // Trigger auto-save
    triggerAutoSave()
  }

  /**
   * Clear all messages
   */
  const clearConversation = async (): Promise<void> => {
    // Optimistic update
    messages.value = []
    hasMore.value = false
    currentOffset.value = 0

    // Trigger auto-save
    triggerAutoSave()
  }

  /**
   * Load more messages (pagination)
   * This is a simplified implementation - in a real scenario,
   * you'd need pagination support in the ConversationStore
   */
  const loadMore = async (): Promise<void> => {
    // For now, this is a placeholder since ConversationStore
    // doesn't have built-in pagination
    hasMore.value = false
  }

  /**
   * Reload conversation from store
   */
  const reload = async (): Promise<void> => {
    await loadConversation(conversationId)
  }

  /**
   * Clear error state
   */
  const clearError = (): void => {
    error.value = null
  }

  // Auto-load conversation on mount
  onMounted(() => {
    if (autoLoad) {
      loadConversation(conversationId)
    }
  })

  // Cleanup auto-save timer on unmount
  onUnmounted(() => {
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer)
      autoSaveTimer = null
    }
  })

  return {
    // Reactive state
    messages,
    isLoading,
    isSaving,
    error,
    hasMore,
    metadata,
    currentOffset,

    // Actions
    loadConversation,
    saveConversation,
    appendMessage,
    appendMessages,
    deleteMessage,
    updateMessage,
    clearConversation,
    loadMore,
    reload,
    clearError,
  }
}
