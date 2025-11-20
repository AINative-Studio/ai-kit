/**
 * In-memory memory store implementation
 *
 * Stores user memories in memory with optional LRU eviction.
 * Suitable for development, testing, or single-process applications.
 * Data is lost when the process restarts.
 */

import { MemoryStore } from './MemoryStore'
import {
  MemoryItem,
  MemoryType,
  MemorySearchOptions,
  SaveMemoryOptions,
  UpdateMemoryOptions,
  MemoryStoreStats,
  InMemoryMemoryStoreConfig,
} from './types'

export class InMemoryMemoryStore extends MemoryStore {
  private memories: Map<string, MemoryItem>
  private userMemories: Map<string, Set<string>> // userId -> Set of memory IDs
  private accessOrder: string[] // For LRU eviction
  private maxMemories: number

  constructor(config: Omit<InMemoryMemoryStoreConfig, 'type'> = {}) {
    super(config)
    this.memories = new Map()
    this.userMemories = new Map()
    this.accessOrder = []
    this.maxMemories = config.maxMemories || 10000
  }

  async save(
    memory: Omit<MemoryItem, 'id' | 'createdAt' | 'updatedAt' | 'lastAccessedAt'>,
    options?: SaveMemoryOptions
  ): Promise<MemoryItem> {
    const memoryItem = this.createMemoryItem(memory, options)

    this.memories.set(memoryItem.id, memoryItem)

    // Track user's memories
    if (!this.userMemories.has(memoryItem.userId)) {
      this.userMemories.set(memoryItem.userId, new Set())
    }
    this.userMemories.get(memoryItem.userId)!.add(memoryItem.id)

    this.updateAccessOrder(memoryItem.id)
    this.evictIfNeeded()

    return { ...memoryItem }
  }

  async get(memoryId: string): Promise<MemoryItem | null> {
    const memory = this.memories.get(memoryId)

    if (!memory) {
      return null
    }

    // Check if expired
    if (this.isExpired(memory)) {
      await this.delete(memoryId)
      return null
    }

    // Update last accessed time
    memory.lastAccessedAt = Date.now()
    this.updateAccessOrder(memoryId)

    return { ...memory }
  }

  async update(
    memoryId: string,
    updates: UpdateMemoryOptions
  ): Promise<MemoryItem | null> {
    const memory = this.memories.get(memoryId)

    if (!memory || this.isExpired(memory)) {
      return null
    }

    const now = Date.now()

    // Apply updates
    if (updates.content !== undefined) {
      memory.content = updates.content
    }
    if (updates.importance !== undefined) {
      memory.importance = updates.importance
    }
    if (updates.confidence !== undefined) {
      memory.confidence = updates.confidence
    }
    if (updates.ttl !== undefined) {
      memory.ttl = updates.ttl > 0 ? updates.ttl : undefined
    }
    if (updates.metadata) {
      memory.metadata = {
        ...memory.metadata,
        ...updates.metadata,
      }
    }

    memory.updatedAt = now
    memory.lastAccessedAt = now

    this.updateAccessOrder(memoryId)

    return { ...memory }
  }

  async delete(memoryId: string): Promise<boolean> {
    const memory = this.memories.get(memoryId)

    if (!memory) {
      return false
    }

    // Remove from user's memories
    const userMems = this.userMemories.get(memory.userId)
    if (userMems) {
      userMems.delete(memoryId)
      if (userMems.size === 0) {
        this.userMemories.delete(memory.userId)
      }
    }

    this.memories.delete(memoryId)
    this.removeFromAccessOrder(memoryId)

    return true
  }

  async search(
    userId: string,
    options?: MemorySearchOptions
  ): Promise<MemoryItem[]> {
    const userMems = await this.getByUser(userId, options?.includeExpired)
    return this.filterMemories(userMems, options)
  }

  async getByUser(
    userId: string,
    includeExpired: boolean = false
  ): Promise<MemoryItem[]> {
    const memoryIds = this.userMemories.get(userId)

    if (!memoryIds) {
      return []
    }

    const memories: MemoryItem[] = []

    for (const id of memoryIds) {
      const memory = this.memories.get(id)
      if (memory && (includeExpired || !this.isExpired(memory))) {
        memories.push({ ...memory })
      }
    }

    return memories
  }

  async getByType(
    userId: string,
    type: MemoryType,
    includeExpired: boolean = false
  ): Promise<MemoryItem[]> {
    const userMems = await this.getByUser(userId, includeExpired)
    return userMems.filter((m) => m.type === type)
  }

  async getByEntity(
    userId: string,
    entityName: string,
    includeExpired: boolean = false
  ): Promise<MemoryItem[]> {
    const userMems = await this.getByUser(userId, includeExpired)
    return userMems.filter((m) => m.entityName === entityName)
  }

  async deleteByUser(userId: string): Promise<number> {
    const memoryIds = this.userMemories.get(userId)

    if (!memoryIds) {
      return 0
    }

    const count = memoryIds.size

    for (const id of memoryIds) {
      this.memories.delete(id)
      this.removeFromAccessOrder(id)
    }

    this.userMemories.delete(userId)

    return count
  }

  async clear(): Promise<number> {
    const count = this.memories.size
    this.memories.clear()
    this.userMemories.clear()
    this.accessOrder = []
    return count
  }

  async getStats(): Promise<MemoryStoreStats> {
    const memoriesByType: Record<MemoryType, number> = {
      fact: 0,
      preference: 0,
      context: 0,
      entity: 0,
      goal: 0,
    }

    let expiredMemories = 0

    for (const memory of this.memories.values()) {
      memoriesByType[memory.type]++

      if (this.isExpired(memory)) {
        expiredMemories++
      }
    }

    return {
      totalMemories: this.memories.size,
      memoriesByType,
      uniqueUsers: this.userMemories.size,
      expiredMemories,
    }
  }

  async cleanup(): Promise<number> {
    let removed = 0

    for (const [id, memory] of this.memories.entries()) {
      if (this.isExpired(memory)) {
        await this.delete(id)
        removed++
      }
    }

    return removed
  }

  async close(): Promise<void> {
    await this.clear()
  }

  /**
   * Update the access order for LRU eviction
   */
  private updateAccessOrder(memoryId: string): void {
    this.removeFromAccessOrder(memoryId)
    this.accessOrder.push(memoryId)
  }

  /**
   * Remove a memory ID from the access order
   */
  private removeFromAccessOrder(memoryId: string): void {
    const index = this.accessOrder.indexOf(memoryId)
    if (index !== -1) {
      this.accessOrder.splice(index, 1)
    }
  }

  /**
   * Evict least recently used memories if over limit
   */
  private evictIfNeeded(): void {
    while (this.memories.size > this.maxMemories) {
      const lruId = this.accessOrder.shift()
      if (lruId) {
        const memory = this.memories.get(lruId)
        if (memory) {
          // Remove from user's memories
          const userMems = this.userMemories.get(memory.userId)
          if (userMems) {
            userMems.delete(lruId)
            if (userMems.size === 0) {
              this.userMemories.delete(memory.userId)
            }
          }
        }
        this.memories.delete(lruId)
      }
    }
  }

  /**
   * Get the current size of the store
   */
  size(): number {
    return this.memories.size
  }
}
