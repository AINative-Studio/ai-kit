/**
 * In-memory conversation store implementation
 *
 * Stores conversations in memory with optional LRU eviction.
 * Suitable for development, testing, or single-process applications.
 * Data is lost when the process restarts.
 */

import { Message } from '../types'
import { ConversationStore } from './ConversationStore'
import {
  Conversation,
  MemoryStoreConfig,
  SaveOptions,
  AppendOptions,
  LoadOptions,
  StoreStats,
} from './types'

export class MemoryStore extends ConversationStore {
  private conversations: Map<string, Conversation>
  private accessOrder: string[] // For LRU eviction
  private maxConversations: number

  constructor(config: Omit<MemoryStoreConfig, 'type'> = {}) {
    super(config)
    this.conversations = new Map()
    this.accessOrder = []
    this.maxConversations = config.maxConversations || 1000
  }

  async save(
    conversationId: string,
    messages: Message[],
    options?: SaveOptions
  ): Promise<Conversation> {
    // Get existing conversation to preserve createdAt
    const existing = this.conversations.get(conversationId)

    const metadata = this.createMetadata(
      conversationId,
      messages,
      options,
      existing?.metadata
    )

    const conversation: Conversation = {
      conversationId,
      messages: [...messages], // Create a copy
      metadata,
    }

    this.conversations.set(conversationId, conversation)
    this.updateAccessOrder(conversationId)
    this.evictIfNeeded()

    return { ...conversation }
  }

  async load(
    conversationId: string,
    options?: LoadOptions
  ): Promise<Conversation | null> {
    const conversation = this.conversations.get(conversationId)

    if (!conversation) {
      return null
    }

    // Check if expired
    if (!options?.includeExpired && this.isExpired(conversation.metadata)) {
      // Remove expired conversation
      await this.delete(conversationId)
      return null
    }

    this.updateAccessOrder(conversationId)

    // Return a deep copy to prevent external mutations
    return {
      conversationId: conversation.conversationId,
      messages: [...conversation.messages],
      metadata: { ...conversation.metadata },
    }
  }

  async append(
    conversationId: string,
    messages: Message[],
    options?: AppendOptions
  ): Promise<Conversation> {
    const existing = await this.load(conversationId, { includeExpired: false })

    if (!existing) {
      // If conversation doesn't exist, create it
      return this.save(conversationId, messages)
    }

    const allMessages = [...existing.messages, ...messages]
    const updateTimestamp = options?.updateTimestamp ?? true

    const metadata = updateTimestamp
      ? this.createMetadata(conversationId, allMessages, {}, existing.metadata)
      : { ...existing.metadata, messageCount: allMessages.length }

    const conversation: Conversation = {
      conversationId,
      messages: allMessages,
      metadata,
    }

    this.conversations.set(conversationId, conversation)
    this.updateAccessOrder(conversationId)

    return { ...conversation }
  }

  async delete(conversationId: string): Promise<boolean> {
    const existed = this.conversations.has(conversationId)

    if (existed) {
      this.conversations.delete(conversationId)
      this.removeFromAccessOrder(conversationId)
    }

    return existed
  }

  async clear(): Promise<number> {
    const count = this.conversations.size
    this.conversations.clear()
    this.accessOrder = []
    return count
  }

  async list(): Promise<string[]> {
    return Array.from(this.conversations.keys())
  }

  async exists(conversationId: string): Promise<boolean> {
    const conversation = this.conversations.get(conversationId)

    if (!conversation) {
      return false
    }

    // Check if expired
    if (this.isExpired(conversation.metadata)) {
      await this.delete(conversationId)
      return false
    }

    return true
  }

  async getStats(): Promise<StoreStats> {
    let totalMessages = 0
    let expiredConversations = 0

    for (const conversation of this.conversations.values()) {
      totalMessages += conversation.messages.length

      if (this.isExpired(conversation.metadata)) {
        expiredConversations++
      }
    }

    return {
      totalConversations: this.conversations.size,
      totalMessages,
      expiredConversations,
    }
  }

  async close(): Promise<void> {
    // No resources to cleanup for memory store
    await this.clear()
  }

  /**
   * Update the access order for LRU eviction
   */
  private updateAccessOrder(conversationId: string): void {
    this.removeFromAccessOrder(conversationId)
    this.accessOrder.push(conversationId)
  }

  /**
   * Remove a conversation ID from the access order
   */
  private removeFromAccessOrder(conversationId: string): void {
    const index = this.accessOrder.indexOf(conversationId)
    if (index !== -1) {
      this.accessOrder.splice(index, 1)
    }
  }

  /**
   * Evict least recently used conversations if over limit
   */
  private evictIfNeeded(): void {
    while (this.conversations.size > this.maxConversations) {
      const lruId = this.accessOrder.shift()
      if (lruId) {
        this.conversations.delete(lruId)
      }
    }
  }

  /**
   * Clean up expired conversations
   * @returns Number of conversations removed
   */
  async cleanup(): Promise<number> {
    let removed = 0

    for (const [id, conversation] of this.conversations.entries()) {
      if (this.isExpired(conversation.metadata)) {
        await this.delete(id)
        removed++
      }
    }

    return removed
  }

  /**
   * Get the current size of the store
   */
  size(): number {
    return this.conversations.size
  }
}
