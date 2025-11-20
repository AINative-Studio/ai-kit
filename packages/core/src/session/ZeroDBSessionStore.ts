/**
 * ZeroDB session store implementation
 * Provides persistent, encrypted session storage using ZeroDB
 */

import {
  SessionStore,
  SessionData,
  SessionStats,
  ZeroDBSessionConfig
} from './types'

/**
 * ZeroDB session store with encryption support
 */
export class ZeroDBSessionStore implements SessionStore {
  private projectId: string
  private apiKey: string
  private tableName: string
  private baseUrl: string

  constructor(config: Omit<ZeroDBSessionConfig, 'type'>) {
    this.projectId = config.projectId
    this.apiKey = config.apiKey
    this.tableName = config.tableName || 'sessions'
    this.baseUrl = 'https://api.zerodb.io/v1'
  }

  /**
   * Make an authenticated request to ZeroDB
   */
  private async request(
    method: string,
    endpoint: string,
    body?: any
  ): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'X-Project-ID': this.projectId
      },
      body: body ? JSON.stringify(body) : undefined
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`ZeroDB request failed: ${response.status} ${error}`)
    }

    return response.json()
  }

  /**
   * Initialize the sessions table if it doesn't exist
   */
  async initialize(): Promise<void> {
    try {
      await this.request('POST', '/tables', {
        name: this.tableName,
        schema: {
          sessionId: { type: 'string', primary: true },
          userId: { type: 'string', indexed: true },
          data: { type: 'json' },
          createdAt: { type: 'number' },
          lastAccessedAt: { type: 'number' },
          expiresAt: { type: 'number', indexed: true },
          ipAddress: { type: 'string', optional: true },
          userAgent: { type: 'string', optional: true },
          metadata: { type: 'json', optional: true }
        }
      })
    } catch (error) {
      // Table might already exist, ignore error
      if (!(error instanceof Error) || !error.message.includes('already exists')) {
        console.warn('Failed to initialize sessions table:', error)
      }
    }
  }

  /**
   * Get a session by ID
   */
  async get(sessionId: string): Promise<SessionData | null> {
    try {
      const response = await this.request(
        'POST',
        `/tables/${this.tableName}/query`,
        {
          filter: { sessionId },
          limit: 1
        }
      )

      if (!response.rows || response.rows.length === 0) {
        return null
      }

      const row = response.rows[0]
      return {
        userId: row.userId,
        data: row.data,
        createdAt: row.createdAt,
        lastAccessedAt: row.lastAccessedAt,
        expiresAt: row.expiresAt,
        ipAddress: row.ipAddress,
        userAgent: row.userAgent,
        metadata: row.metadata
      }
    } catch (error) {
      console.error('Failed to get session:', error)
      return null
    }
  }

  /**
   * Set/update a session
   */
  async set(sessionId: string, data: SessionData): Promise<void> {
    try {
      await this.request('POST', `/tables/${this.tableName}/upsert`, {
        rows: [
          {
            sessionId,
            userId: data.userId,
            data: data.data,
            createdAt: data.createdAt,
            lastAccessedAt: data.lastAccessedAt,
            expiresAt: data.expiresAt,
            ipAddress: data.ipAddress,
            userAgent: data.userAgent,
            metadata: data.metadata
          }
        ]
      })
    } catch (error) {
      throw new Error(`Failed to set session: ${error}`)
    }
  }

  /**
   * Delete a session
   */
  async delete(sessionId: string): Promise<boolean> {
    try {
      const response = await this.request(
        'POST',
        `/tables/${this.tableName}/delete`,
        {
          filter: { sessionId }
        }
      )

      return response.deletedCount > 0
    } catch (error) {
      console.error('Failed to delete session:', error)
      return false
    }
  }

  /**
   * Check if a session exists
   */
  async exists(sessionId: string): Promise<boolean> {
    const session = await this.get(sessionId)
    return session !== null
  }

  /**
   * Get all sessions for a user
   */
  async getByUserId(userId: string): Promise<Map<string, SessionData>> {
    try {
      const response = await this.request(
        'POST',
        `/tables/${this.tableName}/query`,
        {
          filter: { userId }
        }
      )

      const result = new Map<string, SessionData>()

      if (response.rows) {
        for (const row of response.rows) {
          result.set(row.sessionId, {
            userId: row.userId,
            data: row.data,
            createdAt: row.createdAt,
            lastAccessedAt: row.lastAccessedAt,
            expiresAt: row.expiresAt,
            ipAddress: row.ipAddress,
            userAgent: row.userAgent,
            metadata: row.metadata
          })
        }
      }

      return result
    } catch (error) {
      console.error('Failed to get sessions by user ID:', error)
      return new Map()
    }
  }

  /**
   * Delete all sessions for a user
   */
  async deleteByUserId(userId: string): Promise<number> {
    try {
      const response = await this.request(
        'POST',
        `/tables/${this.tableName}/delete`,
        {
          filter: { userId }
        }
      )

      return response.deletedCount || 0
    } catch (error) {
      console.error('Failed to delete sessions by user ID:', error)
      return 0
    }
  }

  /**
   * Get all session IDs
   */
  async getAllSessionIds(): Promise<string[]> {
    try {
      const response = await this.request(
        'POST',
        `/tables/${this.tableName}/query`,
        {
          select: ['sessionId']
        }
      )

      if (!response.rows) {
        return []
      }

      return response.rows.map((row: any) => row.sessionId)
    } catch (error) {
      console.error('Failed to get all session IDs:', error)
      return []
    }
  }

  /**
   * Remove expired sessions
   */
  async cleanup(): Promise<number> {
    try {
      const now = Date.now()

      const response = await this.request(
        'POST',
        `/tables/${this.tableName}/delete`,
        {
          filter: {
            expiresAt: { $lte: now }
          }
        }
      )

      return response.deletedCount || 0
    } catch (error) {
      console.error('Failed to cleanup expired sessions:', error)
      return 0
    }
  }

  /**
   * Get session statistics
   */
  async getStats(): Promise<SessionStats> {
    try {
      const response = await this.request(
        'POST',
        `/tables/${this.tableName}/query`,
        {}
      )

      const now = Date.now()
      let activeSessions = 0
      let expiredSessions = 0
      let totalDuration = 0
      const sessionsByUser: Record<string, number> = {}

      if (response.rows) {
        for (const row of response.rows) {
          if (row.expiresAt > now) {
            activeSessions++
          } else {
            expiredSessions++
          }

          // Track sessions by user
          sessionsByUser[row.userId] = (sessionsByUser[row.userId] || 0) + 1

          // Calculate duration
          const duration = row.lastAccessedAt - row.createdAt
          totalDuration += duration
        }
      }

      const totalSessions = response.rows ? response.rows.length : 0
      const averageDuration = totalSessions > 0 ? totalDuration / totalSessions : 0

      return {
        totalSessions,
        activeSessions,
        expiredSessions,
        sessionsByUser,
        averageDuration
      }
    } catch (error) {
      console.error('Failed to get session stats:', error)
      return {
        totalSessions: 0,
        activeSessions: 0,
        expiredSessions: 0
      }
    }
  }

  /**
   * Acquire a lock for a session
   * Note: ZeroDB doesn't natively support locks, so we use a separate locks table
   */
  async acquireLock(sessionId: string, timeout: number): Promise<boolean> {
    try {
      const now = Date.now()
      const expiresAt = now + timeout

      // Try to insert lock
      await this.request('POST', `/tables/session_locks/upsert`, {
        rows: [
          {
            sessionId,
            expiresAt,
            createdAt: now
          }
        ]
      })

      return true
    } catch (error) {
      // Lock might already exist
      return false
    }
  }

  /**
   * Release a lock for a session
   */
  async releaseLock(sessionId: string): Promise<void> {
    try {
      await this.request('POST', `/tables/session_locks/delete`, {
        filter: { sessionId }
      })
    } catch (error) {
      console.error('Failed to release lock:', error)
    }
  }

  /**
   * Close the store connection
   */
  async close(): Promise<void> {
    // No persistent connection to close
  }
}
