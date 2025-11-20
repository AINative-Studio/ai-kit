/**
 * Redis session store implementation
 * Provides persistent, distributed session storage using Redis
 */

import Redis, { RedisOptions } from 'ioredis'
import {
  SessionStore,
  SessionData,
  SessionStats,
  RedisSessionConfig
} from './types'

/**
 * Redis session store with automatic expiration
 */
export class RedisSessionStore implements SessionStore {
  private redis: Redis
  private keyPrefix: string
  private userIndexPrefix: string

  constructor(config: Omit<RedisSessionConfig, 'type'>) {
    const redisOptions: RedisOptions = {
      host: config.host || 'localhost',
      port: config.port || 6379,
      password: config.password,
      db: config.db || 0,
      keyPrefix: config.keyPrefix || 'session:'
    }

    if (config.url) {
      this.redis = new Redis(config.url, redisOptions)
    } else {
      this.redis = new Redis(redisOptions)
    }

    this.keyPrefix = config.keyPrefix || 'session:'
    this.userIndexPrefix = `${this.keyPrefix}user:`
  }

  /**
   * Get the full Redis key for a session
   */
  private getSessionKey(sessionId: string): string {
    return `${this.keyPrefix}${sessionId}`
  }

  /**
   * Get the user index key
   */
  private getUserIndexKey(userId: string): string {
    return `${this.userIndexPrefix}${userId}`
  }

  /**
   * Get a session by ID
   */
  async get(sessionId: string): Promise<SessionData | null> {
    const key = this.getSessionKey(sessionId)
    const data = await this.redis.get(key)

    if (!data) {
      return null
    }

    try {
      return JSON.parse(data) as SessionData
    } catch (error) {
      console.error('Failed to parse session data:', error)
      return null
    }
  }

  /**
   * Set/update a session
   */
  async set(sessionId: string, data: SessionData): Promise<void> {
    const key = this.getSessionKey(sessionId)
    const userIndexKey = this.getUserIndexKey(data.userId)

    // Calculate TTL in seconds
    const ttl = Math.ceil((data.expiresAt - Date.now()) / 1000)

    if (ttl <= 0) {
      // Session already expired, don't store it
      return
    }

    // Use pipeline for atomic operations
    const pipeline = this.redis.pipeline()

    // Store session data with expiration
    pipeline.setex(key, ttl, JSON.stringify(data))

    // Add session ID to user index
    pipeline.sadd(userIndexKey, sessionId)

    // Set expiration on user index (slightly longer than session)
    pipeline.expire(userIndexKey, ttl + 60)

    await pipeline.exec()
  }

  /**
   * Delete a session
   */
  async delete(sessionId: string): Promise<boolean> {
    const key = this.getSessionKey(sessionId)

    // Get session to find user ID
    const session = await this.get(sessionId)
    if (!session) {
      return false
    }

    const userIndexKey = this.getUserIndexKey(session.userId)

    // Use pipeline for atomic operations
    const pipeline = this.redis.pipeline()
    pipeline.del(key)
    pipeline.srem(userIndexKey, sessionId)

    await pipeline.exec()

    return true
  }

  /**
   * Check if a session exists
   */
  async exists(sessionId: string): Promise<boolean> {
    const key = this.getSessionKey(sessionId)
    const result = await this.redis.exists(key)
    return result === 1
  }

  /**
   * Get all sessions for a user
   */
  async getByUserId(userId: string): Promise<Map<string, SessionData>> {
    const userIndexKey = this.getUserIndexKey(userId)
    const sessionIds = await this.redis.smembers(userIndexKey)

    const result = new Map<string, SessionData>()

    // Fetch all sessions in parallel
    const sessions = await Promise.all(
      sessionIds.map(sessionId => this.get(sessionId))
    )

    // Add non-null sessions to result
    sessionIds.forEach((sessionId, index) => {
      const session = sessions[index]
      if (session) {
        result.set(sessionId, session)
      }
    })

    return result
  }

  /**
   * Delete all sessions for a user
   */
  async deleteByUserId(userId: string): Promise<number> {
    const userIndexKey = this.getUserIndexKey(userId)
    const sessionIds = await this.redis.smembers(userIndexKey)

    if (sessionIds.length === 0) {
      return 0
    }

    // Delete all sessions
    const pipeline = this.redis.pipeline()

    for (const sessionId of sessionIds) {
      const key = this.getSessionKey(sessionId)
      pipeline.del(key)
    }

    // Delete user index
    pipeline.del(userIndexKey)

    await pipeline.exec()

    return sessionIds.length
  }

  /**
   * Get all session IDs
   */
  async getAllSessionIds(): Promise<string[]> {
    const pattern = `${this.keyPrefix}*`
    const keys = await this.redis.keys(pattern)

    return keys
      .map(key => key.replace(this.keyPrefix, ''))
      .filter(sessionId => !sessionId.startsWith('user:'))
  }

  /**
   * Remove expired sessions
   * Note: Redis handles expiration automatically, so this is a no-op
   */
  async cleanup(): Promise<number> {
    // Redis automatically removes expired keys
    // We can clean up orphaned user index entries
    const userIndexPattern = `${this.userIndexPrefix}*`
    const userIndexKeys = await this.redis.keys(userIndexPattern)

    let cleanedCount = 0

    for (const userIndexKey of userIndexKeys) {
      const sessionIds = await this.redis.smembers(userIndexKey)
      const orphanedIds: string[] = []

      // Check which sessions no longer exist
      for (const sessionId of sessionIds) {
        const exists = await this.exists(sessionId)
        if (!exists) {
          orphanedIds.push(sessionId)
        }
      }

      // Remove orphaned session IDs from user index
      if (orphanedIds.length > 0) {
        await this.redis.srem(userIndexKey, ...orphanedIds)
        cleanedCount += orphanedIds.length
      }

      // Remove user index if empty
      const remainingCount = await this.redis.scard(userIndexKey)
      if (remainingCount === 0) {
        await this.redis.del(userIndexKey)
      }
    }

    return cleanedCount
  }

  /**
   * Get session statistics
   */
  async getStats(): Promise<SessionStats> {
    const sessionIds = await this.getAllSessionIds()
    const now = Date.now()

    let activeSessions = 0
    let expiredSessions = 0
    let totalDuration = 0
    const sessionsByUser: Record<string, number> = {}

    // Fetch all sessions in parallel
    const sessions = await Promise.all(
      sessionIds.map(sessionId => this.get(sessionId))
    )

    for (const session of sessions) {
      if (!session) {
        continue
      }

      if (session.expiresAt > now) {
        activeSessions++
      } else {
        expiredSessions++
      }

      // Track sessions by user
      sessionsByUser[session.userId] = (sessionsByUser[session.userId] || 0) + 1

      // Calculate duration
      const duration = session.lastAccessedAt - session.createdAt
      totalDuration += duration
    }

    const totalSessions = sessions.filter(s => s !== null).length
    const averageDuration = totalSessions > 0 ? totalDuration / totalSessions : 0

    return {
      totalSessions,
      activeSessions,
      expiredSessions,
      sessionsByUser,
      averageDuration
    }
  }

  /**
   * Acquire a lock for a session using Redis SET NX
   */
  async acquireLock(sessionId: string, timeout: number): Promise<boolean> {
    const lockKey = `${this.keyPrefix}lock:${sessionId}`
    const ttl = Math.ceil(timeout / 1000)

    // Try to set lock with NX (only if not exists) and EX (expiration)
    const result = await this.redis.set(lockKey, '1', 'EX', ttl, 'NX')

    return result === 'OK'
  }

  /**
   * Release a lock for a session
   */
  async releaseLock(sessionId: string): Promise<void> {
    const lockKey = `${this.keyPrefix}lock:${sessionId}`
    await this.redis.del(lockKey)
  }

  /**
   * Close the Redis connection
   */
  async close(): Promise<void> {
    await this.redis.quit()
  }
}
