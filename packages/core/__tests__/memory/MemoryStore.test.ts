/**
 * Tests for MemoryStore implementations
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { InMemoryMemoryStore } from '../../src/memory/InMemoryMemoryStore'
import { MemoryItem, MemoryType } from '../../src/memory/types'

describe('InMemoryMemoryStore', () => {
  let store: InMemoryMemoryStore

  beforeEach(() => {
    store = new InMemoryMemoryStore()
  })

  afterEach(async () => {
    await store.close()
  })

  describe('save', () => {
    it('should save a memory item', async () => {
      const memory = await store.save({
        userId: 'user-1',
        type: 'fact',
        content: 'User lives in San Francisco',
        importance: 0.8,
        confidence: 0.9,
      })

      expect(memory.id).toBeDefined()
      expect(memory.userId).toBe('user-1')
      expect(memory.type).toBe('fact')
      expect(memory.content).toBe('User lives in San Francisco')
      expect(memory.importance).toBe(0.8)
      expect(memory.confidence).toBe(0.9)
      expect(memory.createdAt).toBeDefined()
      expect(memory.updatedAt).toBeDefined()
      expect(memory.lastAccessedAt).toBeDefined()
    })

    it('should save with default importance and confidence', async () => {
      const memory = await store.save({
        userId: 'user-1',
        type: 'fact',
        content: 'Test fact',
        importance: 0.5,
        confidence: 0.8,
      })

      expect(memory.importance).toBe(0.5)
      expect(memory.confidence).toBe(0.8)
    })

    it('should save with custom TTL', async () => {
      const memory = await store.save(
        {
          userId: 'user-1',
          type: 'fact',
          content: 'Test fact',
          importance: 0.5,
          confidence: 0.8,
        },
        { ttl: 3600 }
      )

      expect(memory.ttl).toBe(3600)
    })

    it('should save with metadata', async () => {
      const memory = await store.save(
        {
          userId: 'user-1',
          type: 'fact',
          content: 'Test fact',
          importance: 0.5,
          confidence: 0.8,
        },
        {
          metadata: { source: 'conversation-1' },
        }
      )

      expect(memory.metadata?.source).toBe('conversation-1')
    })

    it('should save entity memory', async () => {
      const memory = await store.save({
        userId: 'user-1',
        type: 'entity',
        content: 'Works at Google',
        entityName: 'Google',
        entityType: 'organization',
        importance: 0.7,
        confidence: 0.9,
      })

      expect(memory.entityName).toBe('Google')
      expect(memory.entityType).toBe('organization')
    })
  })

  describe('get', () => {
    it('should get a memory by ID', async () => {
      const saved = await store.save({
        userId: 'user-1',
        type: 'fact',
        content: 'Test fact',
        importance: 0.5,
        confidence: 0.8,
      })

      const retrieved = await store.get(saved.id)

      expect(retrieved).toBeDefined()
      expect(retrieved?.id).toBe(saved.id)
      expect(retrieved?.content).toBe('Test fact')
    })

    it('should return null for non-existent memory', async () => {
      const retrieved = await store.get('non-existent')

      expect(retrieved).toBeNull()
    })

    it('should update lastAccessedAt when getting memory', async () => {
      const saved = await store.save({
        userId: 'user-1',
        type: 'fact',
        content: 'Test fact',
        importance: 0.5,
        confidence: 0.8,
      })

      const originalAccessTime = saved.lastAccessedAt

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 10))

      const retrieved = await store.get(saved.id)

      expect(retrieved?.lastAccessedAt).toBeGreaterThan(originalAccessTime)
    })

    it('should not return expired memory', async () => {
      const saved = await store.save(
        {
          userId: 'user-1',
          type: 'fact',
          content: 'Test fact',
          importance: 0.5,
          confidence: 0.8,
        },
        { ttl: 1 } // 1 second TTL
      )

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 1100))

      const retrieved = await store.get(saved.id)

      expect(retrieved).toBeNull()
    })
  })

  describe('update', () => {
    it('should update memory content', async () => {
      const saved = await store.save({
        userId: 'user-1',
        type: 'fact',
        content: 'Old content',
        importance: 0.5,
        confidence: 0.8,
      })

      const updated = await store.update(saved.id, {
        content: 'New content',
      })

      expect(updated?.content).toBe('New content')
    })

    it('should update importance and confidence', async () => {
      const saved = await store.save({
        userId: 'user-1',
        type: 'fact',
        content: 'Test fact',
        importance: 0.5,
        confidence: 0.8,
      })

      const updated = await store.update(saved.id, {
        importance: 0.9,
        confidence: 0.95,
      })

      expect(updated?.importance).toBe(0.9)
      expect(updated?.confidence).toBe(0.95)
    })

    it('should update metadata', async () => {
      const saved = await store.save({
        userId: 'user-1',
        type: 'fact',
        content: 'Test fact',
        importance: 0.5,
        confidence: 0.8,
        metadata: { key1: 'value1' },
      })

      const updated = await store.update(saved.id, {
        metadata: { key2: 'value2' },
      })

      expect(updated?.metadata?.key1).toBe('value1')
      expect(updated?.metadata?.key2).toBe('value2')
    })

    it('should return null for non-existent memory', async () => {
      const updated = await store.update('non-existent', {
        content: 'New content',
      })

      expect(updated).toBeNull()
    })
  })

  describe('delete', () => {
    it('should delete a memory', async () => {
      const saved = await store.save({
        userId: 'user-1',
        type: 'fact',
        content: 'Test fact',
        importance: 0.5,
        confidence: 0.8,
      })

      const deleted = await store.delete(saved.id)

      expect(deleted).toBe(true)

      const retrieved = await store.get(saved.id)
      expect(retrieved).toBeNull()
    })

    it('should return false for non-existent memory', async () => {
      const deleted = await store.delete('non-existent')

      expect(deleted).toBe(false)
    })
  })

  describe('search', () => {
    beforeEach(async () => {
      await store.save({
        userId: 'user-1',
        type: 'fact',
        content: 'Lives in SF',
        importance: 0.9,
        confidence: 0.95,
      })

      await store.save({
        userId: 'user-1',
        type: 'preference',
        content: 'Likes coffee',
        importance: 0.6,
        confidence: 0.8,
      })

      await store.save({
        userId: 'user-1',
        type: 'fact',
        content: 'Works at Google',
        entityName: 'Google',
        importance: 0.7,
        confidence: 0.9,
      })

      await store.save({
        userId: 'user-2',
        type: 'fact',
        content: 'Lives in NYC',
        importance: 0.8,
        confidence: 0.9,
      })
    })

    it('should search by type', async () => {
      const results = await store.search('user-1', { type: 'fact' })

      expect(results).toHaveLength(2)
      expect(results.every((m) => m.type === 'fact')).toBe(true)
    })

    it('should search by entity name', async () => {
      const results = await store.search('user-1', { entityName: 'Google' })

      expect(results).toHaveLength(1)
      expect(results[0].entityName).toBe('Google')
    })

    it('should search by minimum importance', async () => {
      const results = await store.search('user-1', { minImportance: 0.7 })

      expect(results.every((m) => m.importance >= 0.7)).toBe(true)
    })

    it('should search by minimum confidence', async () => {
      const results = await store.search('user-1', { minConfidence: 0.9 })

      expect(results.every((m) => m.confidence >= 0.9)).toBe(true)
    })

    it('should limit results', async () => {
      const results = await store.search('user-1', { limit: 2 })

      expect(results).toHaveLength(2)
    })

    it('should apply offset', async () => {
      const allResults = await store.search('user-1')
      const offsetResults = await store.search('user-1', { offset: 1 })

      expect(offsetResults).toHaveLength(allResults.length - 1)
    })

    it('should sort by importance and recency', async () => {
      const results = await store.search('user-1')

      expect(results[0].importance).toBeGreaterThanOrEqual(
        results[results.length - 1].importance
      )
    })
  })

  describe('getByUser', () => {
    it('should get all memories for a user', async () => {
      await store.save({
        userId: 'user-1',
        type: 'fact',
        content: 'Fact 1',
        importance: 0.5,
        confidence: 0.8,
      })

      await store.save({
        userId: 'user-1',
        type: 'preference',
        content: 'Preference 1',
        importance: 0.5,
        confidence: 0.8,
      })

      await store.save({
        userId: 'user-2',
        type: 'fact',
        content: 'Fact 2',
        importance: 0.5,
        confidence: 0.8,
      })

      const user1Memories = await store.getByUser('user-1')

      expect(user1Memories).toHaveLength(2)
      expect(user1Memories.every((m) => m.userId === 'user-1')).toBe(true)
    })

    it('should return empty array for user with no memories', async () => {
      const memories = await store.getByUser('non-existent')

      expect(memories).toHaveLength(0)
    })
  })

  describe('getByType', () => {
    it('should get memories by type', async () => {
      await store.save({
        userId: 'user-1',
        type: 'fact',
        content: 'Fact 1',
        importance: 0.5,
        confidence: 0.8,
      })

      await store.save({
        userId: 'user-1',
        type: 'fact',
        content: 'Fact 2',
        importance: 0.5,
        confidence: 0.8,
      })

      await store.save({
        userId: 'user-1',
        type: 'preference',
        content: 'Preference 1',
        importance: 0.5,
        confidence: 0.8,
      })

      const facts = await store.getByType('user-1', 'fact')

      expect(facts).toHaveLength(2)
      expect(facts.every((m) => m.type === 'fact')).toBe(true)
    })
  })

  describe('getByEntity', () => {
    it('should get memories by entity', async () => {
      await store.save({
        userId: 'user-1',
        type: 'entity',
        content: 'Works at Google',
        entityName: 'Google',
        importance: 0.5,
        confidence: 0.8,
      })

      await store.save({
        userId: 'user-1',
        type: 'entity',
        content: 'Lives near Google',
        entityName: 'Google',
        importance: 0.5,
        confidence: 0.8,
      })

      await store.save({
        userId: 'user-1',
        type: 'entity',
        content: 'Went to Stanford',
        entityName: 'Stanford',
        importance: 0.5,
        confidence: 0.8,
      })

      const googleMemories = await store.getByEntity('user-1', 'Google')

      expect(googleMemories).toHaveLength(2)
      expect(googleMemories.every((m) => m.entityName === 'Google')).toBe(true)
    })
  })

  describe('deleteByUser', () => {
    it('should delete all memories for a user', async () => {
      await store.save({
        userId: 'user-1',
        type: 'fact',
        content: 'Fact 1',
        importance: 0.5,
        confidence: 0.8,
      })

      await store.save({
        userId: 'user-1',
        type: 'fact',
        content: 'Fact 2',
        importance: 0.5,
        confidence: 0.8,
      })

      await store.save({
        userId: 'user-2',
        type: 'fact',
        content: 'Fact 3',
        importance: 0.5,
        confidence: 0.8,
      })

      const deleted = await store.deleteByUser('user-1')

      expect(deleted).toBe(2)

      const user1Memories = await store.getByUser('user-1')
      expect(user1Memories).toHaveLength(0)

      const user2Memories = await store.getByUser('user-2')
      expect(user2Memories).toHaveLength(1)
    })
  })

  describe('clear', () => {
    it('should clear all memories', async () => {
      await store.save({
        userId: 'user-1',
        type: 'fact',
        content: 'Fact 1',
        importance: 0.5,
        confidence: 0.8,
      })

      await store.save({
        userId: 'user-2',
        type: 'fact',
        content: 'Fact 2',
        importance: 0.5,
        confidence: 0.8,
      })

      const cleared = await store.clear()

      expect(cleared).toBe(2)
      expect(store.size()).toBe(0)
    })
  })

  describe('getStats', () => {
    it('should return correct statistics', async () => {
      await store.save({
        userId: 'user-1',
        type: 'fact',
        content: 'Fact 1',
        importance: 0.5,
        confidence: 0.8,
      })

      await store.save({
        userId: 'user-1',
        type: 'fact',
        content: 'Fact 2',
        importance: 0.5,
        confidence: 0.8,
      })

      await store.save({
        userId: 'user-1',
        type: 'preference',
        content: 'Preference 1',
        importance: 0.5,
        confidence: 0.8,
      })

      await store.save({
        userId: 'user-2',
        type: 'goal',
        content: 'Goal 1',
        importance: 0.5,
        confidence: 0.8,
      })

      const stats = await store.getStats()

      expect(stats.totalMemories).toBe(4)
      expect(stats.uniqueUsers).toBe(2)
      expect(stats.memoriesByType.fact).toBe(2)
      expect(stats.memoriesByType.preference).toBe(1)
      expect(stats.memoriesByType.goal).toBe(1)
    })
  })

  describe('cleanup', () => {
    it('should remove expired memories', async () => {
      await store.save(
        {
          userId: 'user-1',
          type: 'fact',
          content: 'Expired fact',
          importance: 0.5,
          confidence: 0.8,
        },
        { ttl: 1 }
      )

      await store.save({
        userId: 'user-1',
        type: 'fact',
        content: 'Valid fact',
        importance: 0.5,
        confidence: 0.8,
      })

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 1100))

      const removed = await store.cleanup()

      expect(removed).toBe(1)

      const memories = await store.getByUser('user-1')
      expect(memories).toHaveLength(1)
      expect(memories[0].content).toBe('Valid fact')
    })
  })

  describe('LRU eviction', () => {
    it('should evict least recently used memories when limit is reached', async () => {
      const smallStore = new InMemoryMemoryStore({ maxMemories: 3 })

      const mem1 = await smallStore.save({
        userId: 'user-1',
        type: 'fact',
        content: 'Fact 1',
        importance: 0.5,
        confidence: 0.8,
      })

      const mem2 = await smallStore.save({
        userId: 'user-1',
        type: 'fact',
        content: 'Fact 2',
        importance: 0.5,
        confidence: 0.8,
      })

      const mem3 = await smallStore.save({
        userId: 'user-1',
        type: 'fact',
        content: 'Fact 3',
        importance: 0.5,
        confidence: 0.8,
      })

      // This should evict mem1
      await smallStore.save({
        userId: 'user-1',
        type: 'fact',
        content: 'Fact 4',
        importance: 0.5,
        confidence: 0.8,
      })

      expect(smallStore.size()).toBe(3)

      const retrieved = await smallStore.get(mem1.id)
      expect(retrieved).toBeNull()

      await smallStore.close()
    })
  })
})
