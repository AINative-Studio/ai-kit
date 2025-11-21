/**
 * Session Manager - Comprehensive session management for AI applications
 * Supports multiple storage backends, expiration strategies, and security features
 */

import { createHash, createCipheriv, createDecipheriv, randomBytes } from 'crypto'
import { generateId } from '../utils/id'
import { InMemorySessionStore } from './InMemorySessionStore'
import { RedisSessionStore } from './RedisSessionStore'
import { ZeroDBSessionStore } from './ZeroDBSessionStore'
import {
  SessionConfig,
  SessionStore,
  Session,
  SessionData,
  CreateSessionOptions,
  UpdateSessionOptions,
  RefreshSessionOptions,
  ListSessionsOptions,
  SessionStats,
  ExpirationStrategy,
  SessionEvent,
  SessionEventPayload
} from './types'

/**
 * Event listener for session events
 */
type SessionEventListener = (payload: SessionEventPayload) => void

/**
 * SessionManager - Main class for managing user sessions
 */
export class SessionManager {
  private store: SessionStore
  private defaultTTL: number
  private expirationStrategy: ExpirationStrategy
  private encryptData: boolean
  private encryptionKey?: Buffer
  private maxSessionsPerUser: number
  private enableLocking: boolean
  private lockTimeout: number
  private cleanupInterval?: NodeJS.Timeout
  private eventListeners: Map<SessionEvent, Set<SessionEventListener>>

  constructor(config: SessionConfig) {
    this.defaultTTL = config.ttl || 3600 // Default: 1 hour
    this.expirationStrategy = config.expirationStrategy || ExpirationStrategy.SLIDING
    this.encryptData = config.encryptData || false
    this.maxSessionsPerUser = config.maxSessionsPerUser || 0 // 0 = unlimited
    this.enableLocking = config.enableLocking || false
    this.lockTimeout = config.lockTimeout || 5000
    this.eventListeners = new Map()

    // Validate encryption configuration
    if (this.encryptData && !config.encryptionKey) {
      throw new Error('encryptionKey is required when encryptData is enabled')
    }

    if (this.encryptData && config.encryptionKey) {
      // Derive encryption key from provided key
      this.encryptionKey = createHash('sha256')
        .update(config.encryptionKey)
        .digest()
    }

    // Initialize store based on configuration
    this.store = this.createStore(config)

    // Set up automatic cleanup if enabled
    if (config.autoCleanup !== false) {
      const interval = config.cleanupInterval || 300000 // Default: 5 minutes
      this.cleanupInterval = setInterval(() => {
        this.cleanup().catch(error => {
          console.error('Session cleanup error:', error)
        })
      }, interval)
    }
  }

  /**
   * Create the appropriate store based on configuration
   */
  private createStore(config: SessionConfig): SessionStore {
    switch (config.type) {
      case 'memory':
        return new InMemorySessionStore(config.maxSessions)

      case 'redis':
        return new RedisSessionStore(config)

      case 'zerodb':
        const store = new ZeroDBSessionStore(config)
        // Initialize ZeroDB table
        store.initialize().catch(error => {
          console.error('Failed to initialize ZeroDB store:', error)
        })
        return store

      default:
        throw new Error(`Unsupported store type: ${(config as any).type}`)
    }
  }

  /**
   * Create a new session
   */
  async create(
    userId: string,
    data: Record<string, any> = {},
    options: CreateSessionOptions = {}
  ): Promise<Session> {
    // Check max sessions per user
    if (this.maxSessionsPerUser > 0) {
      const userSessions = await this.store.getByUserId(userId)
      if (userSessions.size >= this.maxSessionsPerUser) {
        // Delete oldest session
        const sessions = Array.from(userSessions.entries())
        sessions.sort((a, b) => a[1].createdAt - b[1].createdAt)
        const oldestSession = sessions[0]
        if (oldestSession) {
          const oldestSessionId = oldestSession[0]
          await this.delete(oldestSessionId)
        }
      }
    }

    // Generate session ID
    const sessionId = generateId('sess')

    // Calculate expiration
    const now = Date.now()
    const ttl = options.ttl || this.defaultTTL
    const expiresAt = now + (ttl * 1000)

    // Encrypt data if enabled
    const sessionData: SessionData = {
      userId,
      data: this.encryptData ? this.encrypt(data) : data,
      createdAt: now,
      lastAccessedAt: now,
      expiresAt,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      metadata: options.metadata
    }

    // Store session
    await this.store.set(sessionId, sessionData)

    // Emit event
    this.emit(SessionEvent.CREATED, {
      sessionId,
      userId,
      event: SessionEvent.CREATED,
      timestamp: now
    })

    // Return session
    return this.toSession(sessionId, sessionData)
  }

  /**
   * Get a session by ID
   */
  async get(sessionId: string): Promise<Session | null> {
    const sessionData = await this.store.get(sessionId)
    if (!sessionData) {
      return null
    }

    // Check if expired
    if (sessionData.expiresAt <= Date.now()) {
      await this.delete(sessionId)
      this.emit(SessionEvent.EXPIRED, {
        sessionId,
        userId: sessionData.userId,
        event: SessionEvent.EXPIRED,
        timestamp: Date.now()
      })
      return null
    }

    // Update last accessed time for sliding expiration
    if (this.expirationStrategy === ExpirationStrategy.SLIDING ||
        this.expirationStrategy === ExpirationStrategy.HYBRID) {
      sessionData.lastAccessedAt = Date.now()

      // Extend expiration for sliding strategy
      if (this.expirationStrategy === ExpirationStrategy.SLIDING) {
        sessionData.expiresAt = Date.now() + (this.defaultTTL * 1000)
      }

      await this.store.set(sessionId, sessionData)
    }

    return this.toSession(sessionId, sessionData)
  }

  /**
   * Update a session's data
   */
  async update(
    sessionId: string,
    data: Record<string, any>,
    options: UpdateSessionOptions = {}
  ): Promise<Session | null> {
    // Acquire lock if enabled
    if (this.enableLocking) {
      const locked = await this.acquireLock(sessionId)
      if (!locked) {
        throw new Error(`Failed to acquire lock for session ${sessionId}`)
      }
    }

    try {
      const sessionData = await this.store.get(sessionId)
      if (!sessionData) {
        return null
      }

      // Check if expired
      if (sessionData.expiresAt <= Date.now()) {
        await this.delete(sessionId)
        return null
      }

      // Merge or replace data
      if (options.merge) {
        const existingData = this.encryptData ? this.decrypt(sessionData.data) : sessionData.data
        const mergedData = { ...existingData, ...data }
        sessionData.data = this.encryptData ? this.encrypt(mergedData) : mergedData
      } else {
        sessionData.data = this.encryptData ? this.encrypt(data) : data
      }

      // Update last accessed time
      if (options.updateLastAccessed !== false) {
        sessionData.lastAccessedAt = Date.now()

        // Extend expiration for sliding strategy
        if (this.expirationStrategy === ExpirationStrategy.SLIDING) {
          sessionData.expiresAt = Date.now() + (this.defaultTTL * 1000)
        }
      }

      // Store updated session
      await this.store.set(sessionId, sessionData)

      // Emit event
      this.emit(SessionEvent.UPDATED, {
        sessionId,
        userId: sessionData.userId,
        event: SessionEvent.UPDATED,
        timestamp: Date.now()
      })

      return this.toSession(sessionId, sessionData)
    } finally {
      // Release lock
      if (this.enableLocking) {
        await this.releaseLock(sessionId)
      }
    }
  }

  /**
   * Delete a session
   */
  async delete(sessionId: string): Promise<boolean> {
    const sessionData = await this.store.get(sessionId)
    const deleted = await this.store.delete(sessionId)

    if (deleted && sessionData) {
      this.emit(SessionEvent.DELETED, {
        sessionId,
        userId: sessionData.userId,
        event: SessionEvent.DELETED,
        timestamp: Date.now()
      })
    }

    return deleted
  }

  /**
   * Refresh/extend a session's expiration
   */
  async refresh(
    sessionId: string,
    options: RefreshSessionOptions = {}
  ): Promise<Session | null> {
    const sessionData = await this.store.get(sessionId)
    if (!sessionData) {
      return null
    }

    // Check if already expired
    if (sessionData.expiresAt <= Date.now()) {
      await this.delete(sessionId)
      return null
    }

    // Extend expiration
    const ttl = options.ttl || this.defaultTTL
    sessionData.expiresAt = Date.now() + (ttl * 1000)
    sessionData.lastAccessedAt = Date.now()

    await this.store.set(sessionId, sessionData)

    // Emit event
    this.emit(SessionEvent.REFRESHED, {
      sessionId,
      userId: sessionData.userId,
      event: SessionEvent.REFRESHED,
      timestamp: Date.now()
    })

    return this.toSession(sessionId, sessionData)
  }

  /**
   * Get all sessions for a user
   */
  async getUserSessions(userId: string): Promise<Session[]> {
    const sessionsMap = await this.store.getByUserId(userId)
    const sessions: Session[] = []
    const now = Date.now()

    Array.from(sessionsMap.entries()).forEach(([sessionId, sessionData]) => {
      // Skip expired sessions
      if (sessionData.expiresAt > now) {
        sessions.push(this.toSession(sessionId, sessionData))
      }
    })

    return sessions
  }

  /**
   * Delete all sessions for a user
   */
  async deleteUserSessions(userId: string): Promise<number> {
    return await this.store.deleteByUserId(userId)
  }

  /**
   * List sessions with optional filters
   */
  async list(options: ListSessionsOptions = {}): Promise<Session[]> {
    const sessionIds = await this.store.getAllSessionIds()
    const sessions: Session[] = []
    const now = Date.now()

    const limit = options.limit || 100
    const offset = options.offset || 0
    let count = 0
    let skipped = 0

    for (const sessionId of sessionIds) {
      if (count >= limit) {
        break
      }

      const sessionData = await this.store.get(sessionId)
      if (!sessionData) {
        continue
      }

      // Filter expired sessions
      const isExpired = sessionData.expiresAt <= now
      if (isExpired && !options.includeExpired) {
        continue
      }

      // Handle offset
      if (skipped < offset) {
        skipped++
        continue
      }

      sessions.push(this.toSession(sessionId, sessionData))
      count++
    }

    return sessions
  }

  /**
   * Validate if a session is active
   */
  async validate(sessionId: string): Promise<boolean> {
    const session = await this.get(sessionId)
    return session !== null && !session.isExpired
  }

  /**
   * Clean up expired sessions
   */
  async cleanup(): Promise<number> {
    return await this.store.cleanup()
  }

  /**
   * Get session statistics
   */
  async getStats(): Promise<SessionStats> {
    return await this.store.getStats()
  }

  /**
   * Acquire a lock for a session
   */
  private async acquireLock(sessionId: string): Promise<boolean> {
    if (!this.store.acquireLock) {
      return true
    }

    const locked = await this.store.acquireLock(sessionId, this.lockTimeout)

    if (locked) {
      this.emit(SessionEvent.LOCKED, {
        sessionId,
        userId: '',
        event: SessionEvent.LOCKED,
        timestamp: Date.now()
      })
    }

    return locked
  }

  /**
   * Release a lock for a session
   */
  private async releaseLock(sessionId: string): Promise<void> {
    if (!this.store.releaseLock) {
      return
    }

    await this.store.releaseLock(sessionId)

    this.emit(SessionEvent.UNLOCKED, {
      sessionId,
      userId: '',
      event: SessionEvent.UNLOCKED,
      timestamp: Date.now()
    })
  }

  /**
   * Convert SessionData to Session object
   */
  private toSession(sessionId: string, sessionData: SessionData): Session {
    const now = Date.now()

    return {
      sessionId,
      userId: sessionData.userId,
      data: this.encryptData ? this.decrypt(sessionData.data) : sessionData.data,
      createdAt: sessionData.createdAt,
      lastAccessedAt: sessionData.lastAccessedAt,
      expiresAt: sessionData.expiresAt,
      isExpired: sessionData.expiresAt <= now,
      ipAddress: sessionData.ipAddress,
      userAgent: sessionData.userAgent,
      metadata: sessionData.metadata
    }
  }

  /**
   * Encrypt session data
   */
  private encrypt(data: Record<string, any>): any {
    if (!this.encryptionKey) {
      return data
    }

    const json = JSON.stringify(data)
    const iv = randomBytes(16)
    const cipher = createCipheriv('aes-256-cbc', this.encryptionKey, iv)

    let encrypted = cipher.update(json, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    return {
      encrypted: true,
      iv: iv.toString('hex'),
      data: encrypted
    }
  }

  /**
   * Decrypt session data
   */
  private decrypt(data: any): Record<string, any> {
    if (!data || !data.encrypted || !this.encryptionKey) {
      return data
    }

    const iv = Buffer.from(data.iv, 'hex')
    const decipher = createDecipheriv('aes-256-cbc', this.encryptionKey, iv)

    let decrypted = decipher.update(data.data, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return JSON.parse(decrypted)
  }

  /**
   * Register an event listener
   */
  on(event: SessionEvent, listener: SessionEventListener): void {
    const listeners = this.eventListeners.get(event) || new Set()
    listeners.add(listener)
    this.eventListeners.set(event, listeners)
  }

  /**
   * Remove an event listener
   */
  off(event: SessionEvent, listener: SessionEventListener): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.delete(listener)
    }
  }

  /**
   * Emit a session event
   */
  private emit(event: SessionEvent, payload: SessionEventPayload): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      Array.from(listeners).forEach(listener => {
        try {
          listener(payload)
        } catch (error) {
          console.error('Error in session event listener:', error)
        }
      })
    }
  }

  /**
   * Close the session manager and cleanup resources
   */
  async close(): Promise<void> {
    // Clear cleanup interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }

    // Close store connection
    if (this.store.close) {
      await this.store.close()
    }

    // Clear event listeners
    this.eventListeners.clear()
  }
}
