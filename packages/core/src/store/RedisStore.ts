/**
 * Redis-based conversation store implementation
 *
 * Stores conversations in Redis with automatic TTL support.
 * Suitable for production environments with multiple processes or servers.
 * Requires a Redis server to be running.
 */

import { Message } from '../types'
import { ConversationStore } from './ConversationStore'
import {
  Conversation,
  RedisStoreConfig,
  SaveOptions,
  AppendOptions,
  LoadOptions,
  StoreStats,
} from './types'

// Dynamic import for Redis to avoid bundling issues
type Redis = any

export class RedisStore extends ConversationStore {
  private redis: Redis | null = null
  private redisConfig: Omit<RedisStoreConfig, 'type'>
  private keyPrefix: string

  constructor(config: Omit<RedisStoreConfig, 'type'>) {
    super(config)
    this.redisConfig = config
    this.keyPrefix = config.keyPrefix || 'aikit:conversation'
  }

  /**
   * Initialize Redis connection (lazy initialization)
   */
  private async getRedis(): Promise<Redis> {
    if (this.redis) {
      return this.redis
    }

    try {
      // Dynamic import to avoid bundling Redis in environments that don't need it
      const { default: IORedis } = await import('ioredis')

      if (this.redisConfig.url) {
        this.redis = new IORedis(this.redisConfig.url)
      } else {
        this.redis = new IORedis({
          host: this.redisConfig.host || 'localhost',
          port: this.redisConfig.port || 6379,
          password: this.redisConfig.password,
          db: this.redisConfig.db || 0,
        })
      }

      return this.redis
    } catch (error) {
      throw new Error(
        `Failed to initialize Redis: ${error instanceof Error ? error.message : 'Unknown error'}. Make sure ioredis is installed: pnpm add ioredis`
      )
    }
  }

  async save(
    conversationId: string,
    messages: Message[],
    options?: SaveOptions
  ): Promise<Conversation> {
    const redis = await this.getRedis()

    // Get existing conversation to preserve createdAt
    const existing = await this.load(conversationId, { includeExpired: true })

    const metadata = this.createMetadata(
      conversationId,
      messages,
      options,
      existing?.metadata
    )

    const conversation: Conversation = {
      conversationId,
      messages,
      metadata,
    }

    const key = this.getRedisKey(conversationId)
    const value = JSON.stringify(conversation)

    // Set with optional TTL
    if (metadata.ttl && metadata.ttl > 0) {
      await redis.setex(key, metadata.ttl, value)
    } else {
      await redis.set(key, value)
    }

    return conversation
  }

  async load(
    conversationId: string,
    options?: LoadOptions
  ): Promise<Conversation | null> {
    const redis = await this.getRedis()
    const key = this.getRedisKey(conversationId)

    const value = await redis.get(key)

    if (!value) {
      return null
    }

    const conversation: Conversation = JSON.parse(value)

    // Check if expired (should not happen with Redis TTL, but double-check)
    if (!options?.includeExpired && this.isExpired(conversation.metadata)) {
      await this.delete(conversationId)
      return null
    }

    return conversation
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
      ? this.createMetadata(conversationId, allMessages, { ttl: existing.metadata.ttl }, existing.metadata)
      : { ...existing.metadata, messageCount: allMessages.length }

    const conversation: Conversation = {
      conversationId,
      messages: allMessages,
      metadata,
    }

    const redis = await this.getRedis()
    const key = this.getRedisKey(conversationId)
    const value = JSON.stringify(conversation)

    // Preserve TTL if it exists
    if (metadata.ttl && metadata.ttl > 0) {
      await redis.setex(key, metadata.ttl, value)
    } else {
      await redis.set(key, value)
    }

    return conversation
  }

  async delete(conversationId: string): Promise<boolean> {
    const redis = await this.getRedis()
    const key = this.getRedisKey(conversationId)

    const result = await redis.del(key)
    return result > 0
  }

  async clear(): Promise<number> {
    const redis = await this.getRedis()
    const pattern = `${this.keyPrefix}:*`

    const keys = await redis.keys(pattern)

    if (keys.length === 0) {
      return 0
    }

    await redis.del(...keys)
    return keys.length
  }

  async list(): Promise<string[]> {
    const redis = await this.getRedis()
    const pattern = `${this.keyPrefix}:*`

    const keys = await redis.keys(pattern)

    return keys.map((key: string) => {
      // Extract conversation ID from key
      const prefix = `${this.keyPrefix}:`
      return key.startsWith(prefix) ? key.slice(prefix.length) : key
    })
  }

  async exists(conversationId: string): Promise<boolean> {
    const redis = await this.getRedis()
    const key = this.getRedisKey(conversationId)

    const result = await redis.exists(key)
    return result === 1
  }

  async getStats(): Promise<StoreStats> {
    const redis = await this.getRedis()
    const pattern = `${this.keyPrefix}:*`

    const keys = await redis.keys(pattern)
    let totalMessages = 0

    // Load all conversations to count messages
    for (const key of keys) {
      const value = await redis.get(key)
      if (value) {
        const conversation: Conversation = JSON.parse(value)
        totalMessages += conversation.messages.length
      }
    }

    return {
      totalConversations: keys.length,
      totalMessages,
    }
  }

  async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit()
      this.redis = null
    }
  }

  /**
   * Get the Redis key for a conversation
   */
  private getRedisKey(conversationId: string): string {
    return `${this.keyPrefix}:${conversationId}`
  }

  /**
   * Get the remaining TTL for a conversation
   * @param conversationId - Conversation identifier
   * @returns TTL in seconds, -1 if no TTL, -2 if key doesn't exist
   */
  async getTTL(conversationId: string): Promise<number> {
    const redis = await this.getRedis()
    const key = this.getRedisKey(conversationId)

    return await redis.ttl(key)
  }

  /**
   * Set a new TTL for an existing conversation
   * @param conversationId - Conversation identifier
   * @param ttl - TTL in seconds
   * @returns True if successful
   */
  async setTTL(conversationId: string, ttl: number): Promise<boolean> {
    const redis = await this.getRedis()
    const key = this.getRedisKey(conversationId)

    const result = await redis.expire(key, ttl)
    return result === 1
  }
}
