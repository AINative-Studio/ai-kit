/**
 * In-memory session store implementation
 * Provides fast session storage using Maps with LRU eviction
 */

import {
  SessionStore,
  SessionData,
  SessionStats
} from './types'

/**
 * LRU (Least Recently Used) entry for tracking access order
 */
interface LRUEntry {
  sessionId: string
  accessTime: number
}

/**
 * In-memory session store with LRU eviction
 */
export class InMemorySessionStore implements SessionStore {
  private sessions: Map<string, SessionData>
  private userSessions: Map<string, Set<string>>
  private locks: Map<string, number>
  private accessOrder: LRUEntry[]
  private maxSessions: number

  constructor(maxSessions: number = 10000) {
    this.sessions = new Map()
    this.userSessions = new Map()
    this.locks = new Map()
    this.accessOrder = []
    this.maxSessions = maxSessions
  }

  /**
   * Get a session by ID
   */
  async get(sessionId: string): Promise<SessionData | null> {
    const session = this.sessions.get(sessionId)
    if (!session) {
      return null
    }

    // Update access order for LRU
    this.updateAccessOrder(sessionId)

    return { ...session }
  }

  /**
   * Set/update a session
   */
  async set(sessionId: string, data: SessionData): Promise<void> {
    // Check if we need to evict old sessions
    if (!this.sessions.has(sessionId) && this.sessions.size >= this.maxSessions) {
      this.evictOldest()
    }

    // Store session
    this.sessions.set(sessionId, { ...data })

    // Update user sessions index
    const userSessionSet = this.userSessions.get(data.userId) || new Set()
    userSessionSet.add(sessionId)
    this.userSessions.set(data.userId, userSessionSet)

    // Update access order
    this.updateAccessOrder(sessionId)
  }

  /**
   * Delete a session
   */
  async delete(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId)
    if (!session) {
      return false
    }

    // Remove from sessions map
    this.sessions.delete(sessionId)

    // Remove from user sessions index
    const userSessionSet = this.userSessions.get(session.userId)
    if (userSessionSet) {
      userSessionSet.delete(sessionId)
      if (userSessionSet.size === 0) {
        this.userSessions.delete(session.userId)
      }
    }

    // Remove from access order
    this.accessOrder = this.accessOrder.filter(entry => entry.sessionId !== sessionId)

    // Remove lock if exists
    this.locks.delete(sessionId)

    return true
  }

  /**
   * Check if a session exists
   */
  async exists(sessionId: string): Promise<boolean> {
    return this.sessions.has(sessionId)
  }

  /**
   * Get all sessions for a user
   */
  async getByUserId(userId: string): Promise<Map<string, SessionData>> {
    const result = new Map<string, SessionData>()
    const sessionIds = this.userSessions.get(userId)

    if (!sessionIds) {
      return result
    }

    Array.from(sessionIds).forEach(sessionId => {
      const session = this.sessions.get(sessionId)
      if (session) {
        result.set(sessionId, { ...session })
      }
    })

    return result
  }

  /**
   * Delete all sessions for a user
   */
  async deleteByUserId(userId: string): Promise<number> {
    const sessionIds = this.userSessions.get(userId)
    if (!sessionIds) {
      return 0
    }

    let deletedCount = 0
    const sessionIdArray = Array.from(sessionIds)
    for (const sessionId of sessionIdArray) {
      const deleted = await this.delete(sessionId)
      if (deleted) {
        deletedCount++
      }
    }

    return deletedCount
  }

  /**
   * Get all session IDs
   */
  async getAllSessionIds(): Promise<string[]> {
    return Array.from(this.sessions.keys())
  }

  /**
   * Remove expired sessions
   */
  async cleanup(): Promise<number> {
    const now = Date.now()
    let cleanedCount = 0
    const expiredSessionIds: string[] = []

    // Find expired sessions
    Array.from(this.sessions.entries()).forEach(([sessionId, session]) => {
      if (session.expiresAt <= now) {
        expiredSessionIds.push(sessionId)
      }
    })

    // Delete expired sessions
    for (const sessionId of expiredSessionIds) {
      const deleted = await this.delete(sessionId)
      if (deleted) {
        cleanedCount++
      }
    }

    return cleanedCount
  }

  /**
   * Get session statistics
   */
  async getStats(): Promise<SessionStats> {
    const now = Date.now()
    let activeSessions = 0
    let expiredSessions = 0
    let totalDuration = 0
    const sessionsByUser: Record<string, number> = {}

    Array.from(this.sessions.entries()).forEach(([, session]) => {
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
    })

    const totalSessions = this.sessions.size
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
   * Acquire a lock for a session
   */
  async acquireLock(sessionId: string, timeout: number): Promise<boolean> {
    const now = Date.now()
    const existingLock = this.locks.get(sessionId)

    // Check if lock exists and is still valid
    if (existingLock && existingLock > now) {
      return false
    }

    // Acquire lock
    this.locks.set(sessionId, now + timeout)
    return true
  }

  /**
   * Release a lock for a session
   */
  async releaseLock(sessionId: string): Promise<void> {
    this.locks.delete(sessionId)
  }

  /**
   * Update access order for LRU tracking
   */
  private updateAccessOrder(sessionId: string): void {
    // Remove existing entry
    this.accessOrder = this.accessOrder.filter(entry => entry.sessionId !== sessionId)

    // Add to end (most recently used)
    this.accessOrder.push({
      sessionId,
      accessTime: Date.now()
    })
  }

  /**
   * Evict the oldest (least recently used) session
   */
  private evictOldest(): void {
    if (this.accessOrder.length === 0) {
      return
    }

    // Get least recently used session
    const oldest = this.accessOrder[0]
    if (oldest) {
      this.delete(oldest.sessionId)
    }
  }

  /**
   * Get the number of sessions in the store
   */
  get size(): number {
    return this.sessions.size
  }

  /**
   * Clear all sessions (for testing)
   */
  async clear(): Promise<void> {
    this.sessions.clear()
    this.userSessions.clear()
    this.locks.clear()
    this.accessOrder = []
  }
}
