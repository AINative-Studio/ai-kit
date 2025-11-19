/**
 * Abstract base class for conversation stores
 *
 * Provides a common interface for persisting conversations across different backends.
 * All store implementations must extend this class and implement the abstract methods.
 */

import { Message } from '../types'
import {
  Conversation,
  ConversationMetadata,
  SaveOptions,
  AppendOptions,
  LoadOptions,
  StoreStats,
  BaseStoreConfig,
} from './types'

export abstract class ConversationStore {
  protected config: BaseStoreConfig

  constructor(config: BaseStoreConfig = {}) {
    this.config = {
      defaultTTL: config.defaultTTL || 0, // 0 = no expiration
      namespace: config.namespace || 'aikit',
    }
  }

  /**
   * Save a complete conversation
   * @param conversationId - Unique identifier for the conversation
   * @param messages - Array of messages to save
   * @param options - Optional save options (TTL, metadata)
   * @returns The saved conversation with metadata
   */
  abstract save(
    conversationId: string,
    messages: Message[],
    options?: SaveOptions
  ): Promise<Conversation>

  /**
   * Load a conversation by ID
   * @param conversationId - Unique identifier for the conversation
   * @param options - Optional load options
   * @returns The conversation if found, null otherwise
   */
  abstract load(
    conversationId: string,
    options?: LoadOptions
  ): Promise<Conversation | null>

  /**
   * Append messages to an existing conversation
   * @param conversationId - Unique identifier for the conversation
   * @param messages - Array of messages to append
   * @param options - Optional append options
   * @returns The updated conversation with metadata
   */
  abstract append(
    conversationId: string,
    messages: Message[],
    options?: AppendOptions
  ): Promise<Conversation>

  /**
   * Delete a conversation by ID
   * @param conversationId - Unique identifier for the conversation
   * @returns True if deleted, false if not found
   */
  abstract delete(conversationId: string): Promise<boolean>

  /**
   * Clear all conversations from the store
   * @returns Number of conversations cleared
   */
  abstract clear(): Promise<number>

  /**
   * List all conversation IDs
   * @returns Array of conversation IDs
   */
  abstract list(): Promise<string[]>

  /**
   * Check if a conversation exists
   * @param conversationId - Unique identifier for the conversation
   * @returns True if exists, false otherwise
   */
  abstract exists(conversationId: string): Promise<boolean>

  /**
   * Get store statistics
   * @returns Store statistics
   */
  abstract getStats(): Promise<StoreStats>

  /**
   * Create conversation metadata
   * @param conversationId - Unique identifier
   * @param messages - Array of messages
   * @param options - Optional save options
   * @param existingMetadata - Existing metadata to preserve
   * @returns Conversation metadata
   */
  protected createMetadata(
    conversationId: string,
    messages: Message[],
    options?: SaveOptions,
    existingMetadata?: ConversationMetadata
  ): ConversationMetadata {
    const now = Date.now()
    const ttl = options?.ttl ?? this.config.defaultTTL ?? 0

    return {
      conversationId,
      createdAt: existingMetadata?.createdAt ?? now,
      updatedAt: now,
      messageCount: messages.length,
      ttl: ttl > 0 ? ttl : undefined,
      metadata: {
        ...existingMetadata?.metadata,
        ...options?.metadata,
      },
    }
  }

  /**
   * Check if a conversation has expired based on TTL
   * @param metadata - Conversation metadata
   * @returns True if expired, false otherwise
   */
  protected isExpired(metadata: ConversationMetadata): boolean {
    if (!metadata.ttl || metadata.ttl === 0) {
      return false
    }

    const now = Date.now()
    const expiresAt = metadata.updatedAt + metadata.ttl * 1000
    return now > expiresAt
  }

  /**
   * Generate a namespaced key for storage
   * @param conversationId - Conversation identifier
   * @returns Namespaced key
   */
  protected getKey(conversationId: string): string {
    return `${this.config.namespace}:conversation:${conversationId}`
  }

  /**
   * Close the store and cleanup resources
   */
  abstract close(): Promise<void>
}
