/**
 * Tests for MemoryStore
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { MemoryStore } from '../../src/store/MemoryStore'
import { Message } from '../../src/types'

describe('MemoryStore', () => {
  let store: MemoryStore

  beforeEach(() => {
    store = new MemoryStore()
  })

  afterEach(async () => {
    await store.close()
  })

  describe('save', () => {
    it('should save a conversation', async () => {
      const messages: Message[] = [
        { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
        { id: '2', role: 'assistant', content: 'Hi!', timestamp: Date.now() },
      ]

      const conversation = await store.save('conv-1', messages)

      expect(conversation.conversationId).toBe('conv-1')
      expect(conversation.messages).toHaveLength(2)
      expect(conversation.messages[0].content).toBe('Hello')
      expect(conversation.metadata.messageCount).toBe(2)
      expect(conversation.metadata.createdAt).toBeDefined()
      expect(conversation.metadata.updatedAt).toBeDefined()
    })

    it('should save with custom TTL', async () => {
      const messages: Message[] = [
        { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
      ]

      const conversation = await store.save('conv-1', messages, { ttl: 3600 })

      expect(conversation.metadata.ttl).toBe(3600)
    })

    it('should save with custom metadata', async () => {
      const messages: Message[] = [
        { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
      ]

      const conversation = await store.save('conv-1', messages, {
        metadata: { userId: 'user-123', source: 'web' },
      })

      expect(conversation.metadata.metadata?.userId).toBe('user-123')
      expect(conversation.metadata.metadata?.source).toBe('web')
    })

    it('should update existing conversation', async () => {
      const messages1: Message[] = [
        { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
      ]

      const conv1 = await store.save('conv-1', messages1)
      const createdAt1 = conv1.metadata.createdAt

      await new Promise((resolve) => setTimeout(resolve, 10))

      const messages2: Message[] = [
        { id: '2', role: 'assistant', content: 'Hi!', timestamp: Date.now() },
      ]

      const conv2 = await store.save('conv-1', messages2)

      expect(conv2.metadata.createdAt).toBe(createdAt1) // createdAt preserved
      expect(conv2.metadata.updatedAt).toBeGreaterThan(conv1.metadata.updatedAt)
      expect(conv2.messages).toHaveLength(1) // Replaced, not appended
    })

    it('should create a copy of messages', async () => {
      const messages: Message[] = [
        { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
      ]

      await store.save('conv-1', messages)

      // Modify original array
      messages.push({ id: '2', role: 'user', content: 'World', timestamp: Date.now() })

      const loaded = await store.load('conv-1')
      expect(loaded?.messages).toHaveLength(1) // Not affected by mutation
    })
  })

  describe('load', () => {
    it('should load an existing conversation', async () => {
      const messages: Message[] = [
        { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
      ]

      await store.save('conv-1', messages)
      const loaded = await store.load('conv-1')

      expect(loaded).not.toBeNull()
      expect(loaded?.conversationId).toBe('conv-1')
      expect(loaded?.messages).toHaveLength(1)
    })

    it('should return null for non-existent conversation', async () => {
      const loaded = await store.load('non-existent')
      expect(loaded).toBeNull()
    })

    it('should return null for expired conversation', async () => {
      const messages: Message[] = [
        { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
      ]

      await store.save('conv-1', messages, { ttl: 1 }) // 1 second TTL

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 1100))

      const loaded = await store.load('conv-1')
      expect(loaded).toBeNull()
    })

    it('should include expired conversation with includeExpired option', async () => {
      const messages: Message[] = [
        { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
      ]

      await store.save('conv-1', messages, { ttl: 1 })

      await new Promise((resolve) => setTimeout(resolve, 1100))

      const loaded = await store.load('conv-1', { includeExpired: true })
      expect(loaded).not.toBeNull()
    })

    it('should return a deep copy', async () => {
      const messages: Message[] = [
        { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
      ]

      await store.save('conv-1', messages)
      const loaded = await store.load('conv-1')

      // Modify loaded messages
      loaded?.messages.push({
        id: '2',
        role: 'user',
        content: 'World',
        timestamp: Date.now(),
      })

      // Load again and check it wasn't affected
      const loaded2 = await store.load('conv-1')
      expect(loaded2?.messages).toHaveLength(1)
    })
  })

  describe('append', () => {
    it('should append messages to existing conversation', async () => {
      const messages1: Message[] = [
        { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
      ]

      await store.save('conv-1', messages1)

      const messages2: Message[] = [
        { id: '2', role: 'assistant', content: 'Hi!', timestamp: Date.now() },
      ]

      const conversation = await store.append('conv-1', messages2)

      expect(conversation.messages).toHaveLength(2)
      expect(conversation.messages[0].content).toBe('Hello')
      expect(conversation.messages[1].content).toBe('Hi!')
      expect(conversation.metadata.messageCount).toBe(2)
    })

    it('should create conversation if it does not exist', async () => {
      const messages: Message[] = [
        { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
      ]

      const conversation = await store.append('conv-1', messages)

      expect(conversation.messages).toHaveLength(1)
      expect(conversation.messages[0].content).toBe('Hello')
    })

    it('should update timestamp by default', async () => {
      const messages1: Message[] = [
        { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
      ]

      const conv1 = await store.save('conv-1', messages1)
      const updatedAt1 = conv1.metadata.updatedAt

      await new Promise((resolve) => setTimeout(resolve, 10))

      const messages2: Message[] = [
        { id: '2', role: 'assistant', content: 'Hi!', timestamp: Date.now() },
      ]

      const conv2 = await store.append('conv-1', messages2)

      expect(conv2.metadata.updatedAt).toBeGreaterThan(updatedAt1)
    })

    it('should not update timestamp when updateTimestamp is false', async () => {
      const messages1: Message[] = [
        { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
      ]

      const conv1 = await store.save('conv-1', messages1)
      const updatedAt1 = conv1.metadata.updatedAt

      await new Promise((resolve) => setTimeout(resolve, 10))

      const messages2: Message[] = [
        { id: '2', role: 'assistant', content: 'Hi!', timestamp: Date.now() },
      ]

      const conv2 = await store.append('conv-1', messages2, {
        updateTimestamp: false,
      })

      expect(conv2.metadata.updatedAt).toBe(updatedAt1)
    })

    it('should not append to expired conversation', async () => {
      const messages1: Message[] = [
        { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
      ]

      await store.save('conv-1', messages1, { ttl: 1 })

      await new Promise((resolve) => setTimeout(resolve, 1100))

      const messages2: Message[] = [
        { id: '2', role: 'assistant', content: 'Hi!', timestamp: Date.now() },
      ]

      const conversation = await store.append('conv-1', messages2)

      // Should create new conversation with only the appended messages
      expect(conversation.messages).toHaveLength(1)
      expect(conversation.messages[0].content).toBe('Hi!')
    })
  })

  describe('delete', () => {
    it('should delete an existing conversation', async () => {
      const messages: Message[] = [
        { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
      ]

      await store.save('conv-1', messages)
      const deleted = await store.delete('conv-1')

      expect(deleted).toBe(true)

      const loaded = await store.load('conv-1')
      expect(loaded).toBeNull()
    })

    it('should return false for non-existent conversation', async () => {
      const deleted = await store.delete('non-existent')
      expect(deleted).toBe(false)
    })
  })

  describe('clear', () => {
    it('should clear all conversations', async () => {
      const messages: Message[] = [
        { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
      ]

      await store.save('conv-1', messages)
      await store.save('conv-2', messages)
      await store.save('conv-3', messages)

      const count = await store.clear()

      expect(count).toBe(3)
      expect(store.size()).toBe(0)
    })

    it('should return 0 if no conversations exist', async () => {
      const count = await store.clear()
      expect(count).toBe(0)
    })
  })

  describe('list', () => {
    it('should list all conversation IDs', async () => {
      const messages: Message[] = [
        { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
      ]

      await store.save('conv-1', messages)
      await store.save('conv-2', messages)
      await store.save('conv-3', messages)

      const ids = await store.list()

      expect(ids).toHaveLength(3)
      expect(ids).toContain('conv-1')
      expect(ids).toContain('conv-2')
      expect(ids).toContain('conv-3')
    })

    it('should return empty array if no conversations exist', async () => {
      const ids = await store.list()
      expect(ids).toHaveLength(0)
    })
  })

  describe('exists', () => {
    it('should return true for existing conversation', async () => {
      const messages: Message[] = [
        { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
      ]

      await store.save('conv-1', messages)
      const exists = await store.exists('conv-1')

      expect(exists).toBe(true)
    })

    it('should return false for non-existent conversation', async () => {
      const exists = await store.exists('non-existent')
      expect(exists).toBe(false)
    })

    it('should return false for expired conversation', async () => {
      const messages: Message[] = [
        { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
      ]

      await store.save('conv-1', messages, { ttl: 1 })

      await new Promise((resolve) => setTimeout(resolve, 1100))

      const exists = await store.exists('conv-1')
      expect(exists).toBe(false)
    })
  })

  describe('getStats', () => {
    it('should return correct statistics', async () => {
      const messages1: Message[] = [
        { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
        { id: '2', role: 'assistant', content: 'Hi!', timestamp: Date.now() },
      ]

      const messages2: Message[] = [
        { id: '3', role: 'user', content: 'How are you?', timestamp: Date.now() },
      ]

      await store.save('conv-1', messages1)
      await store.save('conv-2', messages2)

      const stats = await store.getStats()

      expect(stats.totalConversations).toBe(2)
      expect(stats.totalMessages).toBe(3)
      expect(stats.expiredConversations).toBe(0)
    })

    it('should count expired conversations', async () => {
      const messages: Message[] = [
        { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
      ]

      await store.save('conv-1', messages, { ttl: 1 })
      await store.save('conv-2', messages)

      await new Promise((resolve) => setTimeout(resolve, 1100))

      const stats = await store.getStats()

      expect(stats.totalConversations).toBe(2)
      expect(stats.expiredConversations).toBe(1)
    })
  })

  describe('LRU eviction', () => {
    it('should evict least recently used conversation when limit reached', async () => {
      const storeWithLimit = new MemoryStore({ maxConversations: 2 })

      const messages: Message[] = [
        { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
      ]

      await storeWithLimit.save('conv-1', messages)
      await storeWithLimit.save('conv-2', messages)
      await storeWithLimit.save('conv-3', messages) // Should evict conv-1

      const exists1 = await storeWithLimit.exists('conv-1')
      const exists2 = await storeWithLimit.exists('conv-2')
      const exists3 = await storeWithLimit.exists('conv-3')

      expect(exists1).toBe(false) // Evicted
      expect(exists2).toBe(true)
      expect(exists3).toBe(true)

      await storeWithLimit.close()
    })

    it('should update access order when loading', async () => {
      const storeWithLimit = new MemoryStore({ maxConversations: 2 })

      const messages: Message[] = [
        { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
      ]

      await storeWithLimit.save('conv-1', messages)
      await storeWithLimit.save('conv-2', messages)

      // Access conv-1 to make it most recently used
      await storeWithLimit.load('conv-1')

      await storeWithLimit.save('conv-3', messages) // Should evict conv-2

      const exists1 = await storeWithLimit.exists('conv-1')
      const exists2 = await storeWithLimit.exists('conv-2')
      const exists3 = await storeWithLimit.exists('conv-3')

      expect(exists1).toBe(true) // Not evicted (recently accessed)
      expect(exists2).toBe(false) // Evicted
      expect(exists3).toBe(true)

      await storeWithLimit.close()
    })
  })

  describe('cleanup', () => {
    it('should remove expired conversations', async () => {
      const messages: Message[] = [
        { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
      ]

      await store.save('conv-1', messages, { ttl: 1 })
      await store.save('conv-2', messages)

      await new Promise((resolve) => setTimeout(resolve, 1100))

      const removed = await store.cleanup()

      expect(removed).toBe(1)
      expect(await store.exists('conv-1')).toBe(false)
      expect(await store.exists('conv-2')).toBe(true)
    })

    it('should return 0 if no conversations are expired', async () => {
      const messages: Message[] = [
        { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
      ]

      await store.save('conv-1', messages)
      await store.save('conv-2', messages)

      const removed = await store.cleanup()

      expect(removed).toBe(0)
    })
  })

  describe('configuration', () => {
    it('should use default TTL from config', async () => {
      const storeWithTTL = new MemoryStore({ defaultTTL: 3600 })

      const messages: Message[] = [
        { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
      ]

      const conversation = await storeWithTTL.save('conv-1', messages)

      expect(conversation.metadata.ttl).toBe(3600)

      await storeWithTTL.close()
    })

    it('should use custom namespace', async () => {
      const storeWithNamespace = new MemoryStore({ namespace: 'custom' })

      const messages: Message[] = [
        { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
      ]

      await storeWithNamespace.save('conv-1', messages)

      // Verify it works (namespace is internal implementation detail)
      const loaded = await storeWithNamespace.load('conv-1')
      expect(loaded).not.toBeNull()

      await storeWithNamespace.close()
    })
  })

  describe('concurrent access', () => {
    it('should handle concurrent saves', async () => {
      const messages: Message[] = [
        { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
      ]

      // Save multiple conversations concurrently
      await Promise.all([
        store.save('conv-1', messages),
        store.save('conv-2', messages),
        store.save('conv-3', messages),
      ])

      const ids = await store.list()
      expect(ids).toHaveLength(3)
    })

    it('should handle concurrent appends', async () => {
      const messages1: Message[] = [
        { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
      ]

      await store.save('conv-1', messages1)

      const messages2: Message[] = [
        { id: '2', role: 'assistant', content: 'Hi!', timestamp: Date.now() },
      ]

      const messages3: Message[] = [
        { id: '3', role: 'user', content: 'How are you?', timestamp: Date.now() },
      ]

      // Append concurrently - last one wins in this implementation
      await Promise.all([
        store.append('conv-1', messages2),
        store.append('conv-1', messages3),
      ])

      const conversation = await store.load('conv-1')
      expect(conversation?.messages.length).toBeGreaterThanOrEqual(2)
    })
  })
})
