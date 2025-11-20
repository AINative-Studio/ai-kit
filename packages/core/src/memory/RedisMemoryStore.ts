/**
 * Redis memory store implementation
 *
 * Stores user memories in Redis for persistence and scalability.
 * Supports TTL, indexing by user, type, and entity.
 */

import Redis from 'ioredis'
import { MemoryStore } from './MemoryStore'
import {
  MemoryItem,
  MemoryType,
  MemorySearchOptions,
  SaveMemoryOptions,
  UpdateMemoryOptions,
  MemoryStoreStats,
  RedisMemoryStoreConfig,
} from './types'

export class RedisMemoryStore extends MemoryStore {
  private redis: Redis

  constructor(config: Omit<RedisMemoryStoreConfig, 'type'>) {
    super(config)

    // Initialize Redis client
    if (config.url) {
      this.redis = new Redis(config.url)
    } else {
      this.redis = new Redis({
        host: config.host || 'localhost',
        port: config.port || 6379,
        password: config.password,
        db: config.db || 0,
        keyPrefix: config.keyPrefix || '',
      })
    }
  }

  async save(
    memory: Omit<MemoryItem, 'id' | 'createdAt' | 'updatedAt' | 'lastAccessedAt'>,
    options?: SaveMemoryOptions
  ): Promise<MemoryItem> {
    const memoryItem = this.createMemoryItem(memory, options)

    // Save the memory
    const key = this.getMemoryKey(memoryItem.id)
    await this.redis.set(key, JSON.stringify(memoryItem))

    // Set TTL if specified
    if (memoryItem.ttl && memoryItem.ttl > 0) {
      await this.redis.expire(key, memoryItem.ttl)
    }

    // Add to user's memory set
    await this.redis.sadd(this.getUserKey(memoryItem.userId), memoryItem.id)

    // Add to type index
    await this.redis.sadd(
      this.getTypeKey(memoryItem.userId, memoryItem.type),
      memoryItem.id
    )

    // Add to entity index if applicable
    if (memoryItem.entityName) {
      await this.redis.sadd(
        this.getEntityKey(memoryItem.userId, memoryItem.entityName),
        memoryItem.id
      )
    }

    return { ...memoryItem }
  }

  async get(memoryId: string): Promise<MemoryItem | null> {
    const key = this.getMemoryKey(memoryId)
    const data = await this.redis.get(key)

    if (!data) {
      return null
    }

    const memory: MemoryItem = JSON.parse(data)

    // Check if expired (Redis should handle this, but double-check)
    if (this.isExpired(memory)) {
      await this.delete(memoryId)
      return null
    }

    // Update last accessed time
    memory.lastAccessedAt = Date.now()
    await this.redis.set(key, JSON.stringify(memory))

    return memory
  }

  async update(
    memoryId: string,
    updates: UpdateMemoryOptions
  ): Promise<MemoryItem | null> {
    const memory = await this.get(memoryId)

    if (!memory) {
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

    // Save updated memory
    const key = this.getMemoryKey(memoryId)
    await this.redis.set(key, JSON.stringify(memory))

    // Update TTL if changed
    if (memory.ttl && memory.ttl > 0) {
      await this.redis.expire(key, memory.ttl)
    } else {
      await this.redis.persist(key)
    }

    return memory
  }

  async delete(memoryId: string): Promise<boolean> {
    const memory = await this.get(memoryId)

    if (!memory) {
      return false
    }

    // Remove from user's memory set
    await this.redis.srem(this.getUserKey(memory.userId), memoryId)

    // Remove from type index
    await this.redis.srem(
      this.getTypeKey(memory.userId, memory.type),
      memoryId
    )

    // Remove from entity index if applicable
    if (memory.entityName) {
      await this.redis.srem(
        this.getEntityKey(memory.userId, memory.entityName),
        memoryId
      )
    }

    // Delete the memory
    const result = await this.redis.del(this.getMemoryKey(memoryId))

    return result > 0
  }

  async search(
    userId: string,
    options?: MemorySearchOptions
  ): Promise<MemoryItem[]> {
    const memories = await this.getByUser(userId, options?.includeExpired)
    return this.filterMemories(memories, options)
  }

  async getByUser(
    userId: string,
    includeExpired: boolean = false
  ): Promise<MemoryItem[]> {
    const memoryIds = await this.redis.smembers(this.getUserKey(userId))
    return this.getMemoriesByIds(memoryIds, includeExpired)
  }

  async getByType(
    userId: string,
    type: MemoryType,
    includeExpired: boolean = false
  ): Promise<MemoryItem[]> {
    const memoryIds = await this.redis.smembers(
      this.getTypeKey(userId, type)
    )
    return this.getMemoriesByIds(memoryIds, includeExpired)
  }

  async getByEntity(
    userId: string,
    entityName: string,
    includeExpired: boolean = false
  ): Promise<MemoryItem[]> {
    const memoryIds = await this.redis.smembers(
      this.getEntityKey(userId, entityName)
    )
    return this.getMemoriesByIds(memoryIds, includeExpired)
  }

  async deleteByUser(userId: string): Promise<number> {
    const memoryIds = await this.redis.smembers(this.getUserKey(userId))
    let count = 0

    for (const id of memoryIds) {
      const deleted = await this.delete(id)
      if (deleted) {
        count++
      }
    }

    // Clean up user key
    await this.redis.del(this.getUserKey(userId))

    return count
  }

  async clear(): Promise<number> {
    const pattern = this.getKey('*')
    let count = 0

    // Use SCAN to avoid blocking
    const stream = this.redis.scanStream({
      match: pattern,
      count: 100,
    })

    for await (const keys of stream) {
      if (keys.length > 0) {
        count += await this.redis.del(...keys)
      }
    }

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

    let totalMemories = 0
    let uniqueUsers = 0

    // Count users
    const userPattern = this.getKey('user:*')
    const userStream = this.redis.scanStream({
      match: userPattern,
      count: 100,
    })

    for await (const keys of userStream) {
      uniqueUsers += keys.length
    }

    // Count memories by type
    const typePattern = this.getKey('type:*')
    const typeStream = this.redis.scanStream({
      match: typePattern,
      count: 100,
    })

    for await (const keys of typeStream) {
      for (const key of keys) {
        const type = key.split(':').pop() as MemoryType
        const count = await this.redis.scard(key)
        if (type in memoriesByType) {
          memoriesByType[type] += count
        }
        totalMemories += count
      }
    }

    return {
      totalMemories,
      memoriesByType,
      uniqueUsers,
    }
  }

  async cleanup(): Promise<number> {
    // Redis automatically handles TTL expiration
    // This method can be used to manually clean up expired memories
    let removed = 0

    const pattern = this.getKey('mem_*')
    const stream = this.redis.scanStream({
      match: pattern,
      count: 100,
    })

    for await (const keys of stream) {
      for (const key of keys) {
        const data = await this.redis.get(key)
        if (data) {
          const memory: MemoryItem = JSON.parse(data)
          if (this.isExpired(memory)) {
            await this.delete(memory.id)
            removed++
          }
        }
      }
    }

    return removed
  }

  async close(): Promise<void> {
    await this.redis.quit()
  }

  /**
   * Get memories by IDs
   */
  private async getMemoriesByIds(
    ids: string[],
    includeExpired: boolean = false
  ): Promise<MemoryItem[]> {
    if (ids.length === 0) {
      return []
    }

    const memories: MemoryItem[] = []

    for (const id of ids) {
      const memory = await this.get(id)
      if (memory && (includeExpired || !this.isExpired(memory))) {
        memories.push(memory)
      }
    }

    return memories
  }

  /**
   * Get key for a specific memory
   */
  private getMemoryKey(memoryId: string): string {
    return this.getKey(memoryId)
  }

  /**
   * Get key for user's memory set
   */
  private getUserKey(userId: string): string {
    return this.getKey(`user:${userId}`)
  }

  /**
   * Get key for type index
   */
  private getTypeKey(userId: string, type: MemoryType): string {
    return this.getKey(`type:${userId}:${type}`)
  }

  /**
   * Get key for entity index
   */
  private getEntityKey(userId: string, entityName: string): string {
    return this.getKey(`entity:${userId}:${entityName}`)
  }
}
