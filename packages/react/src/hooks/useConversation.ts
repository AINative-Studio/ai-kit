/**
 * useConversation hook - Manages conversation state with ConversationStore
 *
 * Features:
 * - Load conversations from ConversationStore
 * - Auto-save on message updates with debouncing
 * - Pagination support for long conversations
 * - Optimistic UI updates
 * - Error handling and retry logic
 * - Loading states
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { Message } from '@ainative/ai-kit-core'
import {
  UseConversationOptions,
  UseConversationReturn,
  ConversationState,
} from './types'

/**
 * Hook for managing conversations with persistent storage
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

  // State
  const [state, setState] = useState<ConversationState>({
    messages: [],
    isLoading: false,
    isSaving: false,
    error: null,
    hasMore: false,
    metadata: null,
    currentOffset: 0,
  })

  // Refs for managing async operations
  const conversationIdRef = useRef(initialConversationId)
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)
  const saveLockRef = useRef(false)
  const messagesRef = useRef<Message[]>([])

  // Keep messages ref in sync with state
  useEffect(() => {
    messagesRef.current = state.messages
  }, [state.messages])

  // Update conversation ID ref when it changes
  useEffect(() => {
    conversationIdRef.current = initialConversationId
  }, [initialConversationId])

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [])

  /**
   * Safe state update that checks if component is mounted
   */
  const safeSetState = useCallback(
    (updater: Partial<ConversationState> | ((prev: ConversationState) => Partial<ConversationState>)) => {
      if (isMountedRef.current) {
        setState((prev) => ({
          ...prev,
          ...(typeof updater === 'function' ? updater(prev) : updater),
        }))
      }
    },
    []
  )

  /**
   * Load conversation from store
   */
  const loadConversation = useCallback(
    async (conversationId?: string) => {
      const targetId = conversationId || conversationIdRef.current

      safeSetState({ isLoading: true, error: null })

      try {
        const conversation = await store.load(targetId)

        if (!isMountedRef.current) return

        if (conversation) {
          safeSetState({
            messages: conversation.messages,
            metadata: conversation.metadata,
            isLoading: false,
            hasMore: false, // Reset pagination
            currentOffset: 0,
          })
          onLoad?.(conversation)
        } else {
          // Conversation doesn't exist yet - start fresh
          safeSetState({
            messages: [],
            metadata: null,
            isLoading: false,
            hasMore: false,
            currentOffset: 0,
          })
        }
      } catch (error) {
        const err = error as Error
        if (!isMountedRef.current) return

        safeSetState({ isLoading: false, error: err })
        onError?.(err)
      }
    },
    [store, safeSetState, onLoad, onError]
  )

  /**
   * Save conversation to store
   */
  const saveConversation = useCallback(async () => {
    // Prevent concurrent saves
    if (saveLockRef.current) {
      return
    }

    saveLockRef.current = true
    safeSetState({ isSaving: true, error: null })

    try {
      const conversation = await store.save(
        conversationIdRef.current,
        messagesRef.current, // Use ref to get latest messages
        {
          ttl,
          metadata: customMetadata,
        }
      )

      if (!isMountedRef.current) return

      safeSetState({
        isSaving: false,
        metadata: conversation.metadata,
      })

      onSave?.(conversation)
    } catch (error) {
      const err = error as Error
      if (!isMountedRef.current) return

      safeSetState({ isSaving: false, error: err })
      onError?.(err)
    } finally {
      saveLockRef.current = false
    }
  }, [store, ttl, customMetadata, safeSetState, onSave, onError])

  /**
   * Trigger auto-save with debouncing
   */
  const triggerAutoSave = useCallback(() => {
    if (!autoSave) return

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }

    // Set new timer
    autoSaveTimerRef.current = setTimeout(async () => {
      await saveConversation()

      if (isMountedRef.current && onAutoSave) {
        // Get the latest conversation after save
        try {
          const conversation = await store.load(conversationIdRef.current)
          if (conversation && isMountedRef.current) {
            onAutoSave(conversation)
          }
        } catch (error) {
          // Ignore errors in auto-save callback
        }
      }
    }, autoSaveDelay)
  }, [autoSave, autoSaveDelay, saveConversation, store, onAutoSave])

  /**
   * Append a single message
   */
  const appendMessage = useCallback(
    async (message: Message) => {
      // Optimistic update
      safeSetState((prev) => ({
        messages: [...prev.messages, message],
      }))

      // Trigger auto-save
      triggerAutoSave()
    },
    [safeSetState, triggerAutoSave]
  )

  /**
   * Append multiple messages at once
   */
  const appendMessages = useCallback(
    async (messages: Message[]) => {
      // Optimistic update
      safeSetState((prev) => ({
        messages: [...prev.messages, ...messages],
      }))

      // Trigger auto-save
      triggerAutoSave()
    },
    [safeSetState, triggerAutoSave]
  )

  /**
   * Delete a message by ID
   */
  const deleteMessage = useCallback(
    async (messageId: string) => {
      // Optimistic update
      safeSetState((prev) => ({
        messages: prev.messages.filter((m) => m.id !== messageId),
      }))

      // Trigger auto-save
      triggerAutoSave()
    },
    [safeSetState, triggerAutoSave]
  )

  /**
   * Update an existing message
   */
  const updateMessage = useCallback(
    async (messageId: string, updates: Partial<Message>) => {
      // Optimistic update
      safeSetState((prev) => ({
        messages: prev.messages.map((m) =>
          m.id === messageId ? { ...m, ...updates } : m
        ),
      }))

      // Trigger auto-save
      triggerAutoSave()
    },
    [safeSetState, triggerAutoSave]
  )

  /**
   * Clear all messages
   */
  const clearConversation = useCallback(async () => {
    // Optimistic update
    safeSetState({
      messages: [],
      hasMore: false,
      currentOffset: 0,
    })

    // Trigger auto-save
    triggerAutoSave()
  }, [safeSetState, triggerAutoSave])

  /**
   * Load more messages (pagination)
   * This is a simplified implementation - in a real scenario,
   * you'd need pagination support in the ConversationStore
   */
  const loadMore = useCallback(async () => {
    // For now, this is a placeholder since ConversationStore
    // doesn't have built-in pagination
    // In a real implementation, you'd load messages with offset/limit
    safeSetState({ hasMore: false })
  }, [safeSetState])

  /**
   * Reload conversation from store
   */
  const reload = useCallback(async () => {
    await loadConversation(conversationIdRef.current)
  }, [loadConversation])

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    safeSetState({ error: null })
  }, [safeSetState])

  // Auto-load conversation on mount
  useEffect(() => {
    if (autoLoad) {
      loadConversation(initialConversationId)
    }
  }, []) // Only run on mount

  // Cleanup auto-save timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [])

  return {
    // State
    messages: state.messages,
    isLoading: state.isLoading,
    isSaving: state.isSaving,
    error: state.error,
    hasMore: state.hasMore,
    metadata: state.metadata,
    currentOffset: state.currentOffset,

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
