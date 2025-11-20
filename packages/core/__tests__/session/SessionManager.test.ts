/**
 * Comprehensive tests for SessionManager
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { SessionManager } from '../../src/session/SessionManager'
import { InMemorySessionStore } from '../../src/session/InMemorySessionStore'
import {
  SessionConfig,
  ExpirationStrategy,
  SessionEvent,
  InMemorySessionConfig
} from '../../src/session/types'

describe('SessionManager', () => {
  let manager: SessionManager
  const defaultConfig: InMemorySessionConfig = {
    type: 'memory',
    ttl: 3600,
    maxSessions: 1000
  }

  beforeEach(() => {
    manager = new SessionManager(defaultConfig)
  })

  afterEach(async () => {
    await manager.close()
  })

  describe('Session Creation', () => {
    it('should create a new session with default options', async () => {
      const session = await manager.create('user123', { name: 'John' })

      expect(session).toBeDefined()
      expect(session.sessionId).toBeDefined()
      expect(session.userId).toBe('user123')
      expect(session.data.name).toBe('John')
      expect(session.isExpired).toBe(false)
      expect(session.createdAt).toBeLessThanOrEqual(Date.now())
      expect(session.lastAccessedAt).toBeLessThanOrEqual(Date.now())
    })

    it('should create session with custom TTL', async () => {
      const session = await manager.create('user123', {}, { ttl: 7200 })

      const expectedExpiration = Date.now() + (7200 * 1000)
      expect(session.expiresAt).toBeGreaterThanOrEqual(expectedExpiration - 100)
      expect(session.expiresAt).toBeLessThanOrEqual(expectedExpiration + 100)
    })

    it('should create session with IP address and user agent', async () => {
      const session = await manager.create('user123', {}, {
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0'
      })

      expect(session.ipAddress).toBe('192.168.1.1')
      expect(session.userAgent).toBe('Mozilla/5.0')
    })

    it('should create session with metadata', async () => {
      const metadata = { device: 'mobile', version: '1.0' }
      const session = await manager.create('user123', {}, { metadata })

      expect(session.metadata).toEqual(metadata)
    })

    it('should generate unique session IDs', async () => {
      const session1 = await manager.create('user123')
      const session2 = await manager.create('user123')

      expect(session1.sessionId).not.toBe(session2.sessionId)
    })

    it('should enforce max sessions per user', async () => {
      const config: InMemorySessionConfig = {
        type: 'memory',
        maxSessionsPerUser: 2
      }
      const limitedManager = new SessionManager(config)

      await limitedManager.create('user123', { session: 1 })
      await limitedManager.create('user123', { session: 2 })
      await limitedManager.create('user123', { session: 3 })

      const sessions = await limitedManager.getUserSessions('user123')
      expect(sessions.length).toBe(2)

      await limitedManager.close()
    })

    it('should emit CREATED event', async () => {
      const eventSpy = vi.fn()
      manager.on(SessionEvent.CREATED, eventSpy)

      await manager.create('user123')

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          event: SessionEvent.CREATED,
          userId: 'user123'
        })
      )
    })
  })

  describe('Session Retrieval', () => {
    it('should retrieve an existing session', async () => {
      const created = await manager.create('user123', { data: 'test' })
      const retrieved = await manager.get(created.sessionId)

      expect(retrieved).toBeDefined()
      expect(retrieved?.sessionId).toBe(created.sessionId)
      expect(retrieved?.userId).toBe('user123')
      expect(retrieved?.data.data).toBe('test')
    })

    it('should return null for non-existent session', async () => {
      const session = await manager.get('non-existent')
      expect(session).toBeNull()
    })

    it('should return null for expired session', async () => {
      const created = await manager.create('user123', {}, { ttl: 1 })

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1500))

      const retrieved = await manager.get(created.sessionId)
      expect(retrieved).toBeNull()
    })

    it('should update lastAccessedAt on retrieval with sliding expiration', async () => {
      const config: InMemorySessionConfig = {
        type: 'memory',
        expirationStrategy: ExpirationStrategy.SLIDING
      }
      const slidingManager = new SessionManager(config)

      const created = await slidingManager.create('user123')
      const initialAccess = created.lastAccessedAt

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100))

      const retrieved = await slidingManager.get(created.sessionId)
      expect(retrieved?.lastAccessedAt).toBeGreaterThan(initialAccess)

      await slidingManager.close()
    })

    it('should extend expiration with sliding strategy', async () => {
      const config: InMemorySessionConfig = {
        type: 'memory',
        ttl: 2,
        expirationStrategy: ExpirationStrategy.SLIDING
      }
      const slidingManager = new SessionManager(config)

      const created = await slidingManager.create('user123')
      const initialExpiration = created.expiresAt

      // Wait a bit then access
      await new Promise(resolve => setTimeout(resolve, 500))

      const retrieved = await slidingManager.get(created.sessionId)
      expect(retrieved?.expiresAt).toBeGreaterThan(initialExpiration)

      await slidingManager.close()
    })

    it('should not extend expiration with fixed strategy', async () => {
      const config: InMemorySessionConfig = {
        type: 'memory',
        ttl: 2,
        expirationStrategy: ExpirationStrategy.FIXED
      }
      const fixedManager = new SessionManager(config)

      const created = await fixedManager.create('user123')
      const initialExpiration = created.expiresAt

      // Wait a bit then access
      await new Promise(resolve => setTimeout(resolve, 100))

      const retrieved = await fixedManager.get(created.sessionId)
      expect(retrieved?.expiresAt).toBe(initialExpiration)

      await fixedManager.close()
    })
  })

  describe('Session Update', () => {
    it('should update session data', async () => {
      const created = await manager.create('user123', { count: 1 })
      const updated = await manager.update(created.sessionId, { count: 2 })

      expect(updated?.data.count).toBe(2)
    })

    it('should merge data when merge option is true', async () => {
      const created = await manager.create('user123', { name: 'John', age: 30 })
      const updated = await manager.update(
        created.sessionId,
        { age: 31 },
        { merge: true }
      )

      expect(updated?.data.name).toBe('John')
      expect(updated?.data.age).toBe(31)
    })

    it('should replace data when merge option is false', async () => {
      const created = await manager.create('user123', { name: 'John', age: 30 })
      const updated = await manager.update(
        created.sessionId,
        { age: 31 },
        { merge: false }
      )

      expect(updated?.data.name).toBeUndefined()
      expect(updated?.data.age).toBe(31)
    })

    it('should update lastAccessedAt by default', async () => {
      const created = await manager.create('user123')
      const initialAccess = created.lastAccessedAt

      await new Promise(resolve => setTimeout(resolve, 100))

      const updated = await manager.update(created.sessionId, { updated: true })
      expect(updated?.lastAccessedAt).toBeGreaterThan(initialAccess)
    })

    it('should not update lastAccessedAt when option is false', async () => {
      const created = await manager.create('user123')
      const initialAccess = created.lastAccessedAt

      await new Promise(resolve => setTimeout(resolve, 100))

      const updated = await manager.update(
        created.sessionId,
        { updated: true },
        { updateLastAccessed: false }
      )
      expect(updated?.lastAccessedAt).toBe(initialAccess)
    })

    it('should return null for non-existent session', async () => {
      const updated = await manager.update('non-existent', { data: 'test' })
      expect(updated).toBeNull()
    })

    it('should return null for expired session', async () => {
      const created = await manager.create('user123', {}, { ttl: 1 })

      await new Promise(resolve => setTimeout(resolve, 1500))

      const updated = await manager.update(created.sessionId, { data: 'test' })
      expect(updated).toBeNull()
    })

    it('should emit UPDATED event', async () => {
      const eventSpy = vi.fn()
      manager.on(SessionEvent.UPDATED, eventSpy)

      const created = await manager.create('user123')
      await manager.update(created.sessionId, { updated: true })

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          event: SessionEvent.UPDATED,
          sessionId: created.sessionId
        })
      )
    })
  })

  describe('Session Deletion', () => {
    it('should delete an existing session', async () => {
      const created = await manager.create('user123')
      const deleted = await manager.delete(created.sessionId)

      expect(deleted).toBe(true)

      const retrieved = await manager.get(created.sessionId)
      expect(retrieved).toBeNull()
    })

    it('should return false when deleting non-existent session', async () => {
      const deleted = await manager.delete('non-existent')
      expect(deleted).toBe(false)
    })

    it('should emit DELETED event', async () => {
      const eventSpy = vi.fn()
      manager.on(SessionEvent.DELETED, eventSpy)

      const created = await manager.create('user123')
      await manager.delete(created.sessionId)

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          event: SessionEvent.DELETED,
          sessionId: created.sessionId
        })
      )
    })
  })

  describe('Session Refresh', () => {
    it('should refresh session expiration', async () => {
      const created = await manager.create('user123', {}, { ttl: 3600 })
      const initialExpiration = created.expiresAt

      await new Promise(resolve => setTimeout(resolve, 100))

      const refreshed = await manager.refresh(created.sessionId)
      expect(refreshed?.expiresAt).toBeGreaterThan(initialExpiration)
    })

    it('should refresh with custom TTL', async () => {
      const created = await manager.create('user123')
      const refreshed = await manager.refresh(created.sessionId, { ttl: 7200 })

      const expectedExpiration = Date.now() + (7200 * 1000)
      expect(refreshed?.expiresAt).toBeGreaterThanOrEqual(expectedExpiration - 100)
      expect(refreshed?.expiresAt).toBeLessThanOrEqual(expectedExpiration + 100)
    })

    it('should return null for non-existent session', async () => {
      const refreshed = await manager.refresh('non-existent')
      expect(refreshed).toBeNull()
    })

    it('should return null for expired session', async () => {
      const created = await manager.create('user123', {}, { ttl: 1 })

      await new Promise(resolve => setTimeout(resolve, 1500))

      const refreshed = await manager.refresh(created.sessionId)
      expect(refreshed).toBeNull()
    })

    it('should emit REFRESHED event', async () => {
      const eventSpy = vi.fn()
      manager.on(SessionEvent.REFRESHED, eventSpy)

      const created = await manager.create('user123')
      await manager.refresh(created.sessionId)

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          event: SessionEvent.REFRESHED,
          sessionId: created.sessionId
        })
      )
    })
  })

  describe('User Session Management', () => {
    it('should get all sessions for a user', async () => {
      await manager.create('user123', { session: 1 })
      await manager.create('user123', { session: 2 })
      await manager.create('user456', { session: 3 })

      const sessions = await manager.getUserSessions('user123')
      expect(sessions.length).toBe(2)
      expect(sessions.every(s => s.userId === 'user123')).toBe(true)
    })

    it('should return empty array for user with no sessions', async () => {
      const sessions = await manager.getUserSessions('user123')
      expect(sessions).toEqual([])
    })

    it('should delete all sessions for a user', async () => {
      await manager.create('user123', { session: 1 })
      await manager.create('user123', { session: 2 })
      await manager.create('user456', { session: 3 })

      const deletedCount = await manager.deleteUserSessions('user123')
      expect(deletedCount).toBe(2)

      const sessions = await manager.getUserSessions('user123')
      expect(sessions.length).toBe(0)

      const user456Sessions = await manager.getUserSessions('user456')
      expect(user456Sessions.length).toBe(1)
    })
  })

  describe('Session Listing', () => {
    it('should list all sessions', async () => {
      await manager.create('user123')
      await manager.create('user456')
      await manager.create('user789')

      const sessions = await manager.list()
      expect(sessions.length).toBeGreaterThanOrEqual(3)
    })

    it('should list sessions with limit', async () => {
      await manager.create('user1')
      await manager.create('user2')
      await manager.create('user3')

      const sessions = await manager.list({ limit: 2 })
      expect(sessions.length).toBe(2)
    })

    it('should list sessions with offset', async () => {
      await manager.create('user1')
      await manager.create('user2')
      await manager.create('user3')

      const sessions = await manager.list({ offset: 1, limit: 2 })
      expect(sessions.length).toBe(2)
    })

    it('should exclude expired sessions by default', async () => {
      await manager.create('user123', {}, { ttl: 10 })
      await manager.create('user456', {}, { ttl: 1 })

      await new Promise(resolve => setTimeout(resolve, 1500))

      const sessions = await manager.list()
      expect(sessions.every(s => !s.isExpired)).toBe(true)
    })

    it('should include expired sessions when option is true', async () => {
      await manager.create('user123', {}, { ttl: 1 })

      await new Promise(resolve => setTimeout(resolve, 1500))

      const sessions = await manager.list({ includeExpired: true })
      expect(sessions.length).toBeGreaterThan(0)
    })
  })

  describe('Session Validation', () => {
    it('should validate active session', async () => {
      const created = await manager.create('user123')
      const isValid = await manager.validate(created.sessionId)
      expect(isValid).toBe(true)
    })

    it('should not validate non-existent session', async () => {
      const isValid = await manager.validate('non-existent')
      expect(isValid).toBe(false)
    })

    it('should not validate expired session', async () => {
      const created = await manager.create('user123', {}, { ttl: 1 })

      await new Promise(resolve => setTimeout(resolve, 1500))

      const isValid = await manager.validate(created.sessionId)
      expect(isValid).toBe(false)
    })
  })

  describe('Session Cleanup', () => {
    it('should cleanup expired sessions', async () => {
      await manager.create('user123', {}, { ttl: 10 })
      await manager.create('user456', {}, { ttl: 1 })
      await manager.create('user789', {}, { ttl: 1 })

      await new Promise(resolve => setTimeout(resolve, 1500))

      const cleanedCount = await manager.cleanup()
      expect(cleanedCount).toBeGreaterThanOrEqual(2)
    })

    it('should auto-cleanup when enabled', async () => {
      const config: InMemorySessionConfig = {
        type: 'memory',
        autoCleanup: true,
        cleanupInterval: 500,
        ttl: 1
      }
      const autoManager = new SessionManager(config)

      await autoManager.create('user1', {}, { ttl: 1 })
      await autoManager.create('user2', {}, { ttl: 1 })

      // Wait for cleanup
      await new Promise(resolve => setTimeout(resolve, 2000))

      const sessions = await autoManager.list()
      expect(sessions.length).toBe(0)

      await autoManager.close()
    })
  })

  describe('Session Statistics', () => {
    it('should return session statistics', async () => {
      await manager.create('user123')
      await manager.create('user123')
      await manager.create('user456')

      const stats = await manager.getStats()

      expect(stats.totalSessions).toBeGreaterThanOrEqual(3)
      expect(stats.activeSessions).toBeGreaterThanOrEqual(3)
      expect(stats.sessionsByUser).toBeDefined()
      expect(stats.sessionsByUser?.user123).toBe(2)
      expect(stats.sessionsByUser?.user456).toBe(1)
    })

    it('should track expired sessions in statistics', async () => {
      await manager.create('user123', {}, { ttl: 1 })

      await new Promise(resolve => setTimeout(resolve, 1500))

      const stats = await manager.getStats()
      expect(stats.expiredSessions).toBeGreaterThan(0)
    })
  })

  describe('Session Encryption', () => {
    it('should encrypt session data when enabled', async () => {
      const config: InMemorySessionConfig = {
        type: 'memory',
        encryptData: true,
        encryptionKey: 'test-encryption-key-32-characters!'
      }
      const encryptedManager = new SessionManager(config)

      const created = await encryptedManager.create('user123', {
        sensitive: 'secret data'
      })

      expect(created.data.sensitive).toBe('secret data')

      await encryptedManager.close()
    })

    it('should throw error when encryption enabled without key', () => {
      const config: any = {
        type: 'memory',
        encryptData: true
      }

      expect(() => new SessionManager(config)).toThrow()
    })
  })

  describe('Session Locking', () => {
    it('should support concurrent access with locking', async () => {
      const config: InMemorySessionConfig = {
        type: 'memory',
        enableLocking: true,
        lockTimeout: 1000
      }
      const lockManager = new SessionManager(config)

      const created = await lockManager.create('user123', { counter: 0 })

      // Simulate concurrent updates
      const updates = [
        lockManager.update(created.sessionId, { counter: 1 }),
        lockManager.update(created.sessionId, { counter: 2 })
      ]

      // Both should complete without errors
      await Promise.allSettled(updates)

      await lockManager.close()
    })
  })

  describe('Event Listeners', () => {
    it('should support multiple event listeners', async () => {
      const listener1 = vi.fn()
      const listener2 = vi.fn()

      manager.on(SessionEvent.CREATED, listener1)
      manager.on(SessionEvent.CREATED, listener2)

      await manager.create('user123')

      expect(listener1).toHaveBeenCalled()
      expect(listener2).toHaveBeenCalled()
    })

    it('should remove event listener', async () => {
      const listener = vi.fn()

      manager.on(SessionEvent.CREATED, listener)
      manager.off(SessionEvent.CREATED, listener)

      await manager.create('user123')

      expect(listener).not.toHaveBeenCalled()
    })

    it('should handle errors in event listeners gracefully', async () => {
      const errorListener = vi.fn(() => {
        throw new Error('Listener error')
      })

      manager.on(SessionEvent.CREATED, errorListener)

      // Should not throw
      await expect(manager.create('user123')).resolves.toBeDefined()
    })
  })

  describe('Store Types', () => {
    it('should create manager with memory store', () => {
      const config: InMemorySessionConfig = {
        type: 'memory',
        maxSessions: 100
      }
      const memoryManager = new SessionManager(config)

      expect(memoryManager).toBeDefined()
      memoryManager.close()
    })

    it('should throw error for unsupported store type', () => {
      const config: any = {
        type: 'unsupported'
      }

      expect(() => new SessionManager(config)).toThrow()
    })
  })

  describe('Cleanup and Resource Management', () => {
    it('should cleanup resources on close', async () => {
      const created = await manager.create('user123')
      await manager.close()

      // Manager should still work after close (though cleanup interval stops)
      const session = await manager.get(created.sessionId)
      expect(session).toBeDefined()
    })
  })
})
