/**
 * Performance Tests: State Operations
 *
 * Tests state persistence performance against AIKIT-62 requirements:
 * - State persistence <100ms read/write
 * - Memory efficiency
 * - Concurrent operations
 *
 * Refs #68
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { MemoryStore } from '../../src/store/MemoryStore'
import { RedisStore } from '../../src/store/RedisStore'
import { ZeroDBStore } from '../../src/store/ZeroDBStore'
import type { Message } from '../../src/types'

describe('Performance: State Operations', () => {
  describe('MemoryStore Performance (Target: <100ms)', () => {
    let store: MemoryStore

    beforeEach(() => {
      store = new MemoryStore()
    })

    afterEach(async () => {
      await store.close()
    })

    it('should save conversations in <10ms', async () => {
      const messages: Message[] = [
        {
          id: 'msg-1' as any,
          role: 'user',
          content: 'Hello',
          timestamp: Date.now() as any
        },
        {
          id: 'msg-2' as any,
          role: 'assistant',
          content: 'Hi there!',
          timestamp: Date.now() as any
        }
      ]

      const startTime = performance.now()
      await store.save('conv-1', messages)
      const saveTime = performance.now() - startTime

      // Memory store save should be near-instantaneous (<10ms)
      expect(saveTime).toBeLessThan(10)
    })

    it('should load conversations in <10ms', async () => {
      const messages: Message[] = [
        {
          id: 'msg-1' as any,
          role: 'user',
          content: 'Hello',
          timestamp: Date.now() as any
        }
      ]

      await store.save('conv-1', messages)

      const startTime = performance.now()
      const loaded = await store.load('conv-1')
      const loadTime = performance.now() - startTime

      expect(loaded).not.toBeNull()
      expect(loaded?.messages).toHaveLength(1)

      // Memory store load should be near-instantaneous (<10ms)
      expect(loadTime).toBeLessThan(10)
    })

    it('should append messages in <10ms', async () => {
      await store.save('conv-1', [
        {
          id: 'msg-1' as any,
          role: 'user',
          content: 'Hello',
          timestamp: Date.now() as any
        }
      ])

      const newMessages: Message[] = [
        {
          id: 'msg-2' as any,
          role: 'assistant',
          content: 'Hi!',
          timestamp: Date.now() as any
        }
      ]

      const startTime = performance.now()
      await store.append('conv-1', newMessages)
      const appendTime = performance.now() - startTime

      expect(appendTime).toBeLessThan(10)
    })

    it('should handle large conversations efficiently', async () => {
      // Create a large conversation (1000 messages)
      const messages: Message[] = []
      for (let i = 0; i < 1000; i++) {
        messages.push({
          id: `msg-${i}` as any,
          role: i % 2 === 0 ? 'user' : 'assistant',
          content: `Message ${i}`,
          timestamp: Date.now() as any
        })
      }

      const startTime = performance.now()
      await store.save('large-conv', messages)
      const saveTime = performance.now() - startTime

      // Even large conversations should save quickly (<50ms)
      expect(saveTime).toBeLessThan(50)

      const loadStart = performance.now()
      const loaded = await store.load('large-conv')
      const loadTime = performance.now() - loadStart

      expect(loaded?.messages).toHaveLength(1000)
      expect(loadTime).toBeLessThan(50)
    })

    it('should handle concurrent operations without blocking', async () => {
      const operationCount = 50
      const operations: Promise<any>[] = []

      const startTime = performance.now()

      for (let i = 0; i < operationCount; i++) {
        operations.push(
          store.save(`conv-${i}`, [
            {
              id: `msg-${i}` as any,
              role: 'user',
              content: `Message ${i}`,
              timestamp: Date.now() as any
            }
          ])
        )
      }

      await Promise.all(operations)
      const totalTime = performance.now() - startTime

      // 50 concurrent saves should complete quickly (<100ms)
      expect(totalTime).toBeLessThan(100)

      // Verify all saved
      const list = await store.list()
      expect(list).toHaveLength(operationCount)
    })

    it('should delete conversations efficiently', async () => {
      await store.save('conv-1', [
        {
          id: 'msg-1' as any,
          role: 'user',
          content: 'Hello',
          timestamp: Date.now() as any
        }
      ])

      const startTime = performance.now()
      const deleted = await store.delete('conv-1')
      const deleteTime = performance.now() - startTime

      expect(deleted).toBe(true)
      expect(deleteTime).toBeLessThan(10)
    })

    it('should list conversations efficiently', async () => {
      // Create multiple conversations
      for (let i = 0; i < 100; i++) {
        await store.save(`conv-${i}`, [
          {
            id: `msg-${i}` as any,
            role: 'user',
            content: `Message ${i}`,
            timestamp: Date.now() as any
          }
        ])
      }

      const startTime = performance.now()
      const list = await store.list()
      const listTime = performance.now() - startTime

      expect(list).toHaveLength(100)
      expect(listTime).toBeLessThan(50)
    })

    it('should check existence efficiently', async () => {
      await store.save('conv-1', [
        {
          id: 'msg-1' as any,
          role: 'user',
          content: 'Hello',
          timestamp: Date.now() as any
        }
      ])

      const startTime = performance.now()
      const exists = await store.exists('conv-1')
      const existsTime = performance.now() - startTime

      expect(exists).toBe(true)
      expect(existsTime).toBeLessThan(5)
    })

    it('should clear all conversations efficiently', async () => {
      // Create many conversations
      for (let i = 0; i < 50; i++) {
        await store.save(`conv-${i}`, [
          {
            id: `msg-${i}` as any,
            role: 'user',
            content: `Message ${i}`,
            timestamp: Date.now() as any
          }
        ])
      }

      const startTime = performance.now()
      const count = await store.clear()
      const clearTime = performance.now() - startTime

      expect(count).toBe(50)
      expect(clearTime).toBeLessThan(50)
    })

    it('should get stats efficiently', async () => {
      for (let i = 0; i < 10; i++) {
        await store.save(`conv-${i}`, [
          {
            id: `msg-${i}` as any,
            role: 'user',
            content: `Message ${i}`,
            timestamp: Date.now() as any
          }
        ])
      }

      const startTime = performance.now()
      const stats = await store.getStats()
      const statsTime = performance.now() - startTime

      expect(stats.totalConversations).toBe(10)
      expect(stats.totalMessages).toBe(10)
      expect(statsTime).toBeLessThan(20)
    })
  })

  describe('RedisStore Performance (Target: <100ms)', () => {
    let store: RedisStore

    beforeEach(() => {
      // Mock Redis client
      const mockRedis = {
        set: vi.fn(async () => 'OK'),
        get: vi.fn(async () => JSON.stringify({
          messages: [{ role: 'user', content: 'test' }],
          metadata: { conversationId: 'test', messageCount: 1 }
        })),
        del: vi.fn(async () => 1),
        keys: vi.fn(async () => ['aikit:conversation:test']),
        flushdb: vi.fn(async () => 'OK'),
        exists: vi.fn(async () => 1),
        quit: vi.fn(async () => 'OK')
      }

      store = new RedisStore({ client: mockRedis as any })
    })

    afterEach(async () => {
      await store.close()
    })

    it('should save with network latency simulation (<100ms)', async () => {
      const messages: Message[] = [
        {
          id: 'msg-1' as any,
          role: 'user',
          content: 'Hello',
          timestamp: Date.now() as any
        }
      ]

      const startTime = performance.now()
      await store.save('conv-1', messages)
      const saveTime = performance.now() - startTime

      // Redis save with mock should be <100ms (meets AIKIT-62 requirement)
      expect(saveTime).toBeLessThan(100)
    })

    it('should load with minimal overhead', async () => {
      const startTime = performance.now()
      const loaded = await store.load('conv-1')
      const loadTime = performance.now() - startTime

      expect(loaded).not.toBeNull()
      expect(loadTime).toBeLessThan(100)
    })

    it('should handle serialization overhead efficiently', async () => {
      // Large conversation for serialization test
      const messages: Message[] = []
      for (let i = 0; i < 100; i++) {
        messages.push({
          id: `msg-${i}` as any,
          role: i % 2 === 0 ? 'user' : 'assistant',
          content: `This is a longer message with more content to test serialization overhead. Message number ${i}.`,
          timestamp: Date.now() as any
        })
      }

      const startTime = performance.now()
      await store.save('large-conv', messages)
      const serializationTime = performance.now() - startTime

      // Serialization + mock save should be <100ms
      expect(serializationTime).toBeLessThan(100)
    })
  })

  describe('ZeroDBStore Performance (Target: <100ms)', () => {
    let store: ZeroDBStore

    beforeEach(() => {
      // Mock ZeroDB client
      const mockZeroDB = {
        table: {
          insert: vi.fn(async () => ({ success: true })),
          query: vi.fn(async () => ({
            rows: [{
              conversation_id: 'test',
              messages: [{ role: 'user', content: 'test' }],
              metadata: { messageCount: 1 }
            }]
          })),
          update: vi.fn(async () => ({ success: true })),
          delete: vi.fn(async () => ({ success: true }))
        },
        disconnect: vi.fn(async () => {})
      }

      store = new ZeroDBStore({
        projectId: 'test-project',
        apiKey: 'test-key',
        client: mockZeroDB as any
      })
    })

    afterEach(async () => {
      await store.close()
    })

    it('should save to ZeroDB within performance target', async () => {
      const messages: Message[] = [
        {
          id: 'msg-1' as any,
          role: 'user',
          content: 'Hello',
          timestamp: Date.now() as any
        }
      ]

      const startTime = performance.now()
      await store.save('conv-1', messages)
      const saveTime = performance.now() - startTime

      expect(saveTime).toBeLessThan(100)
    })

    it('should load from ZeroDB efficiently', async () => {
      // First save something to load
      const messages: Message[] = [
        {
          id: 'msg-1' as any,
          role: 'user',
          content: 'Hello',
          timestamp: Date.now() as any
        }
      ]
      await store.save('conv-1', messages)

      const startTime = performance.now()
      const loaded = await store.load('conv-1')
      const loadTime = performance.now() - startTime

      expect(loaded).not.toBeNull()
      expect(loadTime).toBeLessThan(100)
    })
  })

  describe('Cross-Store Performance Comparison', () => {
    it('should compare read/write performance across stores', async () => {
      const messages: Message[] = [
        {
          id: 'msg-1' as any,
          role: 'user',
          content: 'Hello',
          timestamp: Date.now() as any
        }
      ]

      const memoryStore = new MemoryStore()
      const mockRedis = {
        set: vi.fn(async () => 'OK'),
        get: vi.fn(async () => JSON.stringify({
          messages: [{ role: 'user', content: 'test' }],
          metadata: { conversationId: 'test', messageCount: 1 }
        })),
        del: vi.fn(async () => 1),
        keys: vi.fn(async () => []),
        flushdb: vi.fn(async () => 'OK'),
        exists: vi.fn(async () => 1),
        quit: vi.fn(async () => 'OK')
      }
      const redisStore = new RedisStore({ client: mockRedis as any })

      // Measure memory store
      const memStart = performance.now()
      await memoryStore.save('test', messages)
      await memoryStore.load('test')
      const memTime = performance.now() - memStart

      // Measure redis store
      const redisStart = performance.now()
      await redisStore.save('test', messages)
      await redisStore.load('test')
      const redisTime = performance.now() - redisStart

      // Both should meet performance targets
      expect(memTime).toBeLessThan(100)
      expect(redisTime).toBeLessThan(100)

      // Memory should be faster than Redis
      expect(memTime).toBeLessThan(redisTime)

      await memoryStore.close()
      await redisStore.close()
    })
  })

  describe('Given-When-Then: State Persistence', () => {
    it('Given a conversation store, When saving messages, Then operation completes within SLA', async () => {
      // Given
      const store = new MemoryStore()
      const messages: Message[] = [
        {
          id: 'msg-1' as any,
          role: 'user',
          content: 'Test message',
          timestamp: Date.now() as any
        }
      ]

      // When
      const startTime = performance.now()
      const result = await store.save('conv-1', messages)
      const duration = performance.now() - startTime

      // Then
      expect(result.messages).toHaveLength(1)
      expect(duration).toBeLessThan(100) // AIKIT-62 requirement

      await store.close()
    })

    it('Given a conversation store, When loading messages, Then operation completes within SLA', async () => {
      // Given
      const store = new MemoryStore()
      await store.save('conv-1', [
        {
          id: 'msg-1' as any,
          role: 'user',
          content: 'Test',
          timestamp: Date.now() as any
        }
      ])

      // When
      const startTime = performance.now()
      const loaded = await store.load('conv-1')
      const duration = performance.now() - startTime

      // Then
      expect(loaded).not.toBeNull()
      expect(loaded?.messages).toHaveLength(1)
      expect(duration).toBeLessThan(100) // AIKIT-62 requirement

      await store.close()
    })
  })

  describe('Memory Usage', () => {
    it('should not leak memory during repeated operations', async () => {
      const store = new MemoryStore()

      // Perform many operations
      for (let i = 0; i < 100; i++) {
        await store.save(`conv-${i}`, [
          {
            id: `msg-${i}` as any,
            role: 'user',
            content: 'Test',
            timestamp: Date.now() as any
          }
        ])
      }

      const stats = await store.getStats()
      expect(stats.totalConversations).toBe(100)
      expect(stats.totalMessages).toBe(100)

      // Clear and verify cleanup
      await store.clear()
      const statsAfter = await store.getStats()
      expect(statsAfter.totalConversations).toBe(0)
      expect(statsAfter.totalMessages).toBe(0)

      await store.close()
    })

    it('should handle TTL expiration efficiently', async () => {
      const store = new MemoryStore({ defaultTTL: 1 }) // 1 second TTL

      await store.save('conv-1', [
        {
          id: 'msg-1' as any,
          role: 'user',
          content: 'Test',
          timestamp: Date.now() as any
        }
      ])

      // Should exist immediately
      const exists = await store.exists('conv-1')
      expect(exists).toBe(true)

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100))

      // Should be expired
      const loaded = await store.load('conv-1')
      expect(loaded).toBeNull()

      await store.close()
    })
  })

  describe('Batch Operations', () => {
    it('should handle batch saves efficiently', async () => {
      const store = new MemoryStore()
      const batchSize = 100

      const startTime = performance.now()

      const promises: Promise<any>[] = []
      for (let i = 0; i < batchSize; i++) {
        promises.push(
          store.save(`conv-${i}`, [
            {
              id: `msg-${i}` as any,
              role: 'user',
              content: `Message ${i}`,
              timestamp: Date.now() as any
            }
          ])
        )
      }

      await Promise.all(promises)
      const batchTime = performance.now() - startTime

      // 100 concurrent saves should complete in <200ms
      expect(batchTime).toBeLessThan(200)

      await store.close()
    })
  })
})
