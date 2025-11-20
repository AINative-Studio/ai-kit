/**
 * Abstract base class for memory stores
 *
 * Provides a common interface for persisting user memories across different backends.
 * All memory store implementations must extend this class and implement the abstract methods.
 */

import {
  MemoryItem,
  MemoryType,
  MemorySearchOptions,
  SaveMemoryOptions,
  UpdateMemoryOptions,
  MemoryStoreStats,
  BaseMemoryStoreConfig,
} from './types'

export abstract class MemoryStore {
  protected config: BaseMemoryStoreConfig

  constructor(config: BaseMemoryStoreConfig = {}) {
    this.config = {
      defaultTTL: config.defaultTTL || 0, // 0 = no expiration
      namespace: config.namespace || 'aikit',
      memoryConfig: {
        defaultImportance: 0.5,
        defaultConfidence: 0.8,
        maxMemoriesPerUser: 1000,
        minImportanceThreshold: 0.1,
        autoConsolidate: false,
        ...config.memoryConfig,
      },
    }
  }

  /**
   * Save a memory item
   * @param memory - Memory item to save
   * @param options - Optional save options
   * @returns The saved memory item
   */
  abstract save(
    memory: Omit<MemoryItem, 'id' | 'createdAt' | 'updatedAt' | 'lastAccessedAt'>,
    options?: SaveMemoryOptions
  ): Promise<MemoryItem>

  /**
   * Get a memory by ID
   * @param memoryId - Unique identifier for the memory
   * @returns The memory item if found, null otherwise
   */
  abstract get(memoryId: string): Promise<MemoryItem | null>

  /**
   * Update a memory item
   * @param memoryId - Unique identifier for the memory
   * @param updates - Updates to apply
   * @returns The updated memory item
   */
  abstract update(
    memoryId: string,
    updates: UpdateMemoryOptions
  ): Promise<MemoryItem | null>

  /**
   * Delete a memory by ID
   * @param memoryId - Unique identifier for the memory
   * @returns True if deleted, false if not found
   */
  abstract delete(memoryId: string): Promise<boolean>

  /**
   * Search memories for a user
   * @param userId - User ID to search memories for
   * @param options - Search options
   * @returns Array of matching memory items
   */
  abstract search(
    userId: string,
    options?: MemorySearchOptions
  ): Promise<MemoryItem[]>

  /**
   * Get all memories for a user
   * @param userId - User ID
   * @param includeExpired - Whether to include expired memories
   * @returns Array of memory items
   */
  abstract getByUser(
    userId: string,
    includeExpired?: boolean
  ): Promise<MemoryItem[]>

  /**
   * Get memories by type
   * @param userId - User ID
   * @param type - Memory type
   * @param includeExpired - Whether to include expired memories
   * @returns Array of memory items
   */
  abstract getByType(
    userId: string,
    type: MemoryType,
    includeExpired?: boolean
  ): Promise<MemoryItem[]>

  /**
   * Get memories by entity
   * @param userId - User ID
   * @param entityName - Entity name
   * @param includeExpired - Whether to include expired memories
   * @returns Array of memory items
   */
  abstract getByEntity(
    userId: string,
    entityName: string,
    includeExpired?: boolean
  ): Promise<MemoryItem[]>

  /**
   * Delete all memories for a user
   * @param userId - User ID
   * @returns Number of memories deleted
   */
  abstract deleteByUser(userId: string): Promise<number>

  /**
   * Clear all memories from the store
   * @returns Number of memories cleared
   */
  abstract clear(): Promise<number>

  /**
   * Get store statistics
   * @returns Memory store statistics
   */
  abstract getStats(): Promise<MemoryStoreStats>

  /**
   * Clean up expired memories
   * @returns Number of memories removed
   */
  abstract cleanup(): Promise<number>

  /**
   * Close the store and cleanup resources
   */
  abstract close(): Promise<void>

  /**
   * Check if a memory has expired based on TTL
   * @param memory - Memory item
   * @returns True if expired, false otherwise
   */
  protected isExpired(memory: MemoryItem): boolean {
    if (!memory.ttl || memory.ttl === 0) {
      return false
    }

    const now = Date.now()
    const expiresAt = memory.updatedAt + memory.ttl * 1000
    return now > expiresAt
  }

  /**
   * Generate a namespaced key for storage
   * @param key - Key identifier
   * @returns Namespaced key
   */
  protected getKey(key: string): string {
    return `${this.config.namespace}:memory:${key}`
  }

  /**
   * Generate a unique memory ID
   * @returns Unique ID
   */
  protected generateId(): string {
    return `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Create a complete memory item from partial data
   * @param partial - Partial memory data
   * @param options - Save options
   * @returns Complete memory item
   */
  protected createMemoryItem(
    partial: Omit<MemoryItem, 'id' | 'createdAt' | 'updatedAt' | 'lastAccessedAt'>,
    options?: SaveMemoryOptions
  ): MemoryItem {
    const now = Date.now()
    const ttl = options?.ttl ?? this.config.defaultTTL ?? 0
    const importance =
      options?.importance ??
      partial.importance ??
      this.config.memoryConfig?.defaultImportance ??
      0.5
    const confidence =
      options?.confidence ??
      partial.confidence ??
      this.config.memoryConfig?.defaultConfidence ??
      0.8

    return {
      id: this.generateId(),
      userId: partial.userId,
      type: partial.type,
      content: partial.content,
      entityName: partial.entityName,
      entityType: partial.entityType,
      createdAt: now,
      updatedAt: now,
      lastAccessedAt: now,
      ttl: ttl > 0 ? ttl : undefined,
      importance,
      confidence,
      source: options?.source ?? partial.source,
      metadata: {
        ...partial.metadata,
        ...options?.metadata,
      },
    }
  }

  /**
   * Filter memories based on search options
   * @param memories - Array of memories to filter
   * @param options - Search options
   * @returns Filtered array of memories
   */
  protected filterMemories(
    memories: MemoryItem[],
    options?: MemorySearchOptions
  ): MemoryItem[] {
    let filtered = memories

    // Filter by type
    if (options?.type) {
      filtered = filtered.filter((m) => m.type === options.type)
    }

    // Filter by entity name
    if (options?.entityName) {
      filtered = filtered.filter((m) => m.entityName === options.entityName)
    }

    // Filter by entity type
    if (options?.entityType) {
      filtered = filtered.filter((m) => m.entityType === options.entityType)
    }

    // Filter by minimum importance
    if (options?.minImportance !== undefined) {
      filtered = filtered.filter((m) => m.importance >= options.minImportance!)
    }

    // Filter by minimum confidence
    if (options?.minConfidence !== undefined) {
      filtered = filtered.filter((m) => m.confidence >= options.minConfidence!)
    }

    // Filter by age
    if (options?.maxAge !== undefined) {
      const maxAgeMs = options.maxAge * 1000
      const now = Date.now()
      filtered = filtered.filter((m) => now - m.createdAt <= maxAgeMs)
    }

    // Filter expired
    if (!options?.includeExpired) {
      filtered = filtered.filter((m) => !this.isExpired(m))
    }

    // Sort by importance (descending), then by recency
    filtered.sort((a, b) => {
      if (a.importance !== b.importance) {
        return b.importance - a.importance
      }
      return b.updatedAt - a.updatedAt
    })

    // Apply limit and offset
    const offset = options?.offset ?? 0
    const limit = options?.limit ?? filtered.length

    return filtered.slice(offset, offset + limit)
  }
}
