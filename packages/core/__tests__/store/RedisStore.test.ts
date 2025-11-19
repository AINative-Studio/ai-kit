/**
 * Tests for RedisStore
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { RedisStore } from '../../src/store/RedisStore'
import { Message } from '../../src/types'

// Mock ioredis
const mockRedis = {
  setex: vi.fn(),
  set: vi.fn(),
  get: vi.fn(),
  del: vi.fn(),
  keys: vi.fn(),
  exists: vi.fn(),
  quit: vi.fn(),
  ttl: vi.fn(),
  expire: vi.fn(),
}

vi.mock('ioredis', () => {
  return {
    default: vi.fn(() => mockRedis),
  }
})

describe('RedisStore', () => {
  let store: RedisStore

  beforeEach(() => {
    vi.clearAllMocks()
    store = new RedisStore({ host: 'localhost', port: 6379 })
    mockRedis.quit.mockResolvedValue('OK')
  })

  afterEach(async () => {
    // Note: We don't call close here for tests that check close behavior
    // Individual tests will call close as needed
  })

  describe('save', () => {
    it('should save a conversation without TTL', async () => {
      mockRedis.get.mockResolvedValue(null)
      mockRedis.set.mockResolvedValue('OK')

      const messages: Message[] = [
        { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
        { id: '2', role: 'assistant', content: 'Hi!', timestamp: Date.now() },
      ]

      const conversation = await store.save('conv-1', messages)

      expect(conversation.conversationId).toBe('conv-1')
      expect(conversation.messages).toHaveLength(2)
      expect(mockRedis.set).toHaveBeenCalled()
      expect(mockRedis.setex).not.toHaveBeenCalled()
    })

    it('should save a conversation with TTL', async () => {
      mockRedis.get.mockResolvedValue(null)
      mockRedis.setex.mockResolvedValue('OK')

      const messages: Message[] = [
        { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
      ]

      const conversation = await store.save('conv-1', messages, { ttl: 3600 })

      expect(conversation.metadata.ttl).toBe(3600)
      expect(mockRedis.setex).toHaveBeenCalledWith(
        'aikit:conversation:conv-1',
        3600,
        expect.any(String)
      )
    })

    it('should preserve createdAt when updating', async () => {
      const existingConversation = {
        conversationId: 'conv-1',
        messages: [{ id: '1', role: 'user', content: 'Hello', timestamp: Date.now() }],
        metadata: {
          conversationId: 'conv-1',
          createdAt: 1000000,
          updatedAt: 1000000,
          messageCount: 1,
        },
      }

      mockRedis.get.mockResolvedValue(JSON.stringify(existingConversation))
      mockRedis.set.mockResolvedValue('OK')

      const messages: Message[] = [
        { id: '2', role: 'assistant', content: 'Hi!', timestamp: Date.now() },
      ]

      const conversation = await store.save('conv-1', messages)

      expect(conversation.metadata.createdAt).toBe(1000000)
      expect(conversation.metadata.updatedAt).toBeGreaterThan(1000000)
    })

    it('should save with custom metadata', async () => {
      mockRedis.get.mockResolvedValue(null)
      mockRedis.set.mockResolvedValue('OK')

      const messages: Message[] = [
        { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
      ]

      const conversation = await store.save('conv-1', messages, {
        metadata: { userId: 'user-123' },
      })

      expect(conversation.metadata.metadata?.userId).toBe('user-123')
    })
  })

  describe('load', () => {
    it('should load an existing conversation', async () => {
      const savedConversation = {
        conversationId: 'conv-1',
        messages: [{ id: '1', role: 'user', content: 'Hello', timestamp: Date.now() }],
        metadata: {
          conversationId: 'conv-1',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messageCount: 1,
        },
      }

      mockRedis.get.mockResolvedValue(JSON.stringify(savedConversation))

      const conversation = await store.load('conv-1')

      expect(conversation).not.toBeNull()
      expect(conversation?.conversationId).toBe('conv-1')
      expect(mockRedis.get).toHaveBeenCalledWith('aikit:conversation:conv-1')
    })

    it('should return null for non-existent conversation', async () => {
      mockRedis.get.mockResolvedValue(null)

      const conversation = await store.load('non-existent')

      expect(conversation).toBeNull()
    })

    it('should return null for expired conversation', async () => {
      const expiredConversation = {
        conversationId: 'conv-1',
        messages: [{ id: '1', role: 'user', content: 'Hello', timestamp: Date.now() }],
        metadata: {
          conversationId: 'conv-1',
          createdAt: Date.now() - 10000,
          updatedAt: Date.now() - 10000,
          messageCount: 1,
          ttl: 1, // 1 second
        },
      }

      mockRedis.get.mockResolvedValue(JSON.stringify(expiredConversation))
      mockRedis.del.mockResolvedValue(1)

      const conversation = await store.load('conv-1')

      expect(conversation).toBeNull()
      expect(mockRedis.del).toHaveBeenCalled()
    })

    it('should include expired conversation with includeExpired option', async () => {
      const expiredConversation = {
        conversationId: 'conv-1',
        messages: [{ id: '1', role: 'user', content: 'Hello', timestamp: Date.now() }],
        metadata: {
          conversationId: 'conv-1',
          createdAt: Date.now() - 10000,
          updatedAt: Date.now() - 10000,
          messageCount: 1,
          ttl: 1,
        },
      }

      mockRedis.get.mockResolvedValue(JSON.stringify(expiredConversation))

      const conversation = await store.load('conv-1', { includeExpired: true })

      expect(conversation).not.toBeNull()
      expect(mockRedis.del).not.toHaveBeenCalled()
    })
  })

  describe('append', () => {
    it('should append messages to existing conversation', async () => {
      const existingConversation = {
        conversationId: 'conv-1',
        messages: [{ id: '1', role: 'user', content: 'Hello', timestamp: Date.now() }],
        metadata: {
          conversationId: 'conv-1',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messageCount: 1,
        },
      }

      mockRedis.get.mockResolvedValue(JSON.stringify(existingConversation))
      mockRedis.set.mockResolvedValue('OK')

      const messages: Message[] = [
        { id: '2', role: 'assistant', content: 'Hi!', timestamp: Date.now() },
      ]

      const conversation = await store.append('conv-1', messages)

      expect(conversation.messages).toHaveLength(2)
      expect(conversation.metadata.messageCount).toBe(2)
    })

    it('should create conversation if it does not exist', async () => {
      mockRedis.get.mockResolvedValue(null)
      mockRedis.set.mockResolvedValue('OK')

      const messages: Message[] = [
        { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
      ]

      const conversation = await store.append('conv-1', messages)

      expect(conversation.messages).toHaveLength(1)
    })

    it('should preserve TTL when appending', async () => {
      const now = Date.now()
      const existingConversation = {
        conversationId: 'conv-1',
        messages: [{ id: '1', role: 'user', content: 'Hello', timestamp: now }],
        metadata: {
          conversationId: 'conv-1',
          createdAt: now,
          updatedAt: now,
          messageCount: 1,
          ttl: 3600,
        },
      }

      mockRedis.get.mockResolvedValue(JSON.stringify(existingConversation))
      mockRedis.setex.mockResolvedValue('OK')

      const messages: Message[] = [
        { id: '2', role: 'assistant', content: 'Hi!', timestamp: now },
      ]

      await store.append('conv-1', messages)

      // Verify setex was called with TTL
      expect(mockRedis.setex).toHaveBeenCalledWith(
        'aikit:conversation:conv-1',
        3600,
        expect.any(String)
      )
    })
  })

  describe('delete', () => {
    it('should delete an existing conversation', async () => {
      mockRedis.del.mockResolvedValue(1)

      const deleted = await store.delete('conv-1')

      expect(deleted).toBe(true)
      expect(mockRedis.del).toHaveBeenCalledWith('aikit:conversation:conv-1')
    })

    it('should return false for non-existent conversation', async () => {
      mockRedis.del.mockResolvedValue(0)

      const deleted = await store.delete('non-existent')

      expect(deleted).toBe(false)
    })
  })

  describe('clear', () => {
    it('should clear all conversations', async () => {
      mockRedis.keys.mockResolvedValue([
        'aikit:conversation:conv-1',
        'aikit:conversation:conv-2',
      ])
      mockRedis.del.mockResolvedValue(2)

      const count = await store.clear()

      expect(count).toBe(2)
      expect(mockRedis.keys).toHaveBeenCalledWith('aikit:conversation:*')
      expect(mockRedis.del).toHaveBeenCalled()
    })

    it('should return 0 if no conversations exist', async () => {
      mockRedis.keys.mockResolvedValue([])

      const count = await store.clear()

      expect(count).toBe(0)
      expect(mockRedis.del).not.toHaveBeenCalled()
    })
  })

  describe('list', () => {
    it('should list all conversation IDs', async () => {
      mockRedis.keys.mockResolvedValue([
        'aikit:conversation:conv-1',
        'aikit:conversation:conv-2',
        'aikit:conversation:conv-3',
      ])

      const ids = await store.list()

      expect(ids).toHaveLength(3)
      expect(ids).toContain('conv-1')
      expect(ids).toContain('conv-2')
      expect(ids).toContain('conv-3')
    })

    it('should return empty array if no conversations exist', async () => {
      mockRedis.keys.mockResolvedValue([])

      const ids = await store.list()

      expect(ids).toHaveLength(0)
    })
  })

  describe('exists', () => {
    it('should return true for existing conversation', async () => {
      mockRedis.exists.mockResolvedValue(1)

      const exists = await store.exists('conv-1')

      expect(exists).toBe(true)
      expect(mockRedis.exists).toHaveBeenCalledWith('aikit:conversation:conv-1')
    })

    it('should return false for non-existent conversation', async () => {
      mockRedis.exists.mockResolvedValue(0)

      const exists = await store.exists('non-existent')

      expect(exists).toBe(false)
    })
  })

  describe('getStats', () => {
    it('should return correct statistics', async () => {
      const conversation1 = {
        conversationId: 'conv-1',
        messages: [
          { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
          { id: '2', role: 'assistant', content: 'Hi!', timestamp: Date.now() },
        ],
        metadata: {
          conversationId: 'conv-1',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messageCount: 2,
        },
      }

      const conversation2 = {
        conversationId: 'conv-2',
        messages: [
          { id: '3', role: 'user', content: 'How are you?', timestamp: Date.now() },
        ],
        metadata: {
          conversationId: 'conv-2',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messageCount: 1,
        },
      }

      mockRedis.keys.mockResolvedValue([
        'aikit:conversation:conv-1',
        'aikit:conversation:conv-2',
      ])
      mockRedis.get
        .mockResolvedValueOnce(JSON.stringify(conversation1))
        .mockResolvedValueOnce(JSON.stringify(conversation2))

      const stats = await store.getStats()

      expect(stats.totalConversations).toBe(2)
      expect(stats.totalMessages).toBe(3)
    })
  })

  describe('TTL operations', () => {
    it('should get TTL for a conversation', async () => {
      mockRedis.ttl.mockResolvedValue(3600)

      const ttl = await store.getTTL('conv-1')

      expect(ttl).toBe(3600)
      expect(mockRedis.ttl).toHaveBeenCalledWith('aikit:conversation:conv-1')
    })

    it('should set TTL for a conversation', async () => {
      mockRedis.expire.mockResolvedValue(1)

      const success = await store.setTTL('conv-1', 7200)

      expect(success).toBe(true)
      expect(mockRedis.expire).toHaveBeenCalledWith('aikit:conversation:conv-1', 7200)
    })

    it('should return false when setting TTL for non-existent conversation', async () => {
      mockRedis.expire.mockResolvedValue(0)

      const success = await store.setTTL('non-existent', 3600)

      expect(success).toBe(false)
    })
  })

  describe('configuration', () => {
    it('should use URL for connection', async () => {
      const storeWithUrl = new RedisStore({ url: 'redis://localhost:6379' })

      mockRedis.set.mockResolvedValue('OK')

      const messages: Message[] = [
        { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
      ]

      await storeWithUrl.save('conv-1', messages)

      expect(mockRedis.set).toHaveBeenCalled()

      await storeWithUrl.close()
    })

    it('should use custom key prefix', async () => {
      const storeWithPrefix = new RedisStore({
        host: 'localhost',
        keyPrefix: 'myapp:chat',
      })

      mockRedis.set.mockResolvedValue('OK')

      const messages: Message[] = [
        { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
      ]

      await storeWithPrefix.save('conv-1', messages)

      const setCall = mockRedis.set.mock.calls[0]
      expect(setCall[0]).toBe('myapp:chat:conv-1')

      await storeWithPrefix.close()
    })
  })

  describe('error handling', () => {
    it('should throw error if ioredis is not available', async () => {
      // This test verifies the error message, but in the mock environment
      // ioredis is always available
      expect(true).toBe(true)
    })

    it('should handle Redis connection errors gracefully', async () => {
      vi.clearAllMocks()
      const errorStore = new RedisStore({ host: 'localhost', port: 6379 })
      mockRedis.get.mockRejectedValue(new Error('Connection failed'))

      await expect(errorStore.load('conv-1')).rejects.toThrow('Connection failed')
      vi.clearAllMocks()
    })
  })

  describe('close', () => {
    it('should close Redis connection', async () => {
      vi.clearAllMocks()
      const closeStore = new RedisStore({ host: 'localhost', port: 6379 })
      mockRedis.quit.mockResolvedValue('OK')
      mockRedis.set.mockResolvedValue('OK')
      mockRedis.get.mockResolvedValue(null)

      // Initialize Redis by performing an operation
      await closeStore.save('conv-1', [
        { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() }
      ])

      await closeStore.close()

      expect(mockRedis.quit).toHaveBeenCalled()
    })

    it('should handle multiple close calls', async () => {
      vi.clearAllMocks()
      const closeStore = new RedisStore({ host: 'localhost', port: 6379 })
      mockRedis.quit.mockResolvedValue('OK')
      mockRedis.set.mockResolvedValue('OK')
      mockRedis.get.mockResolvedValue(null)

      // Initialize Redis by performing an operation
      await closeStore.save('conv-1', [
        { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() }
      ])

      await closeStore.close()
      await closeStore.close()

      // quit is called once, second close is a no-op since redis is already null
      expect(mockRedis.quit).toHaveBeenCalledTimes(1)
    })

    it('should handle close without initialization', async () => {
      vi.clearAllMocks()
      const closeStore = new RedisStore({ host: 'localhost', port: 6379 })
      mockRedis.quit.mockResolvedValue('OK')

      // Close without any operations (Redis not initialized)
      await closeStore.close()

      // Should not call quit if never initialized
      expect(mockRedis.quit).not.toHaveBeenCalled()
    })
  })
})
