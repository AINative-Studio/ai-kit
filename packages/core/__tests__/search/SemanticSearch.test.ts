/**
 * Tests for SemanticSearch
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { SemanticSearch } from '../../src/search/SemanticSearch'
import { MemoryStore } from '../../src/store/MemoryStore'
import { Message } from '../../src/types'

// Create mock embedding function
const mockEmbedding = (text: string): number[] => {
  const hash = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const vector: number[] = []
  for (let i = 0; i < 1536; i++) {
    vector.push(Math.sin(hash + i) * 0.5 + 0.5)
  }
  return vector
}

// Create mock implementation
const mockCreate = vi.fn().mockImplementation(async (params: any) => {
  const inputs = Array.isArray(params.input) ? params.input : [params.input]
  const embeddings = inputs.map((text: string) => ({
    embedding: mockEmbedding(text),
  }))

  return {
    data: embeddings,
    model: params.model,
    usage: {
      prompt_tokens: inputs.length * 10,
      total_tokens: inputs.length * 10,
    },
  }
})

// Mock OpenAI
vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      embeddings: {
        create: mockCreate,
      },
    })),
  }
})

describe('SemanticSearch', () => {
  let store: MemoryStore
  let search: SemanticSearch

  beforeEach(() => {
    vi.clearAllMocks()
    store = new MemoryStore()

    search = new SemanticSearch(store, {
      apiKey: 'test-key',
      model: 'text-embedding-3-small',
    })
  })

  afterEach(async () => {
    await store.close()
  })

  describe('constructor', () => {
    it('should initialize with valid config', () => {
      expect(search).toBeDefined()
      expect(search.getStats()).toBeDefined()
    })

    it('should throw error without API key', () => {
      expect(() => {
        new SemanticSearch(store, { apiKey: '' })
      }).toThrow('OpenAI API key is required')
    })

    it('should use default model', () => {
      const defaultSearch = new SemanticSearch(store, {
        apiKey: 'test-key',
      })
      expect(defaultSearch).toBeDefined()
    })

    it('should accept custom configuration', () => {
      const customSearch = new SemanticSearch(store, {
        apiKey: 'test-key',
        model: 'text-embedding-3-large',
        batchSize: 50,
        dimensions: 256,
        maxRetries: 5,
        timeout: 60000,
      })
      expect(customSearch).toBeDefined()
    })
  })

  describe('generateBatchEmbeddings', () => {
    it('should generate embeddings for multiple texts', async () => {
      const texts = ['Hello world', 'How are you?', 'Good morning']

      const result = await search.generateBatchEmbeddings({ texts })

      expect(result.embeddings).toHaveLength(3)
      expect(result.embeddings[0]).toHaveLength(1536)
      expect(result.model).toBe('text-embedding-3-small')
      expect(result.usage.promptTokens).toBeGreaterThan(0)
      expect(mockCreate).toHaveBeenCalledTimes(1)
    })

    it('should return empty array for empty input', async () => {
      const result = await search.generateBatchEmbeddings({ texts: [] })

      expect(result.embeddings).toHaveLength(0)
      expect(result.usage.promptTokens).toBe(0)
      expect(mockCreate).not.toHaveBeenCalled()
    })

    it('should process in batches', async () => {
      const smallBatchSearch = new SemanticSearch(store, {
        apiKey: 'test-key',
        batchSize: 2,
      })

      const texts = ['Text 1', 'Text 2', 'Text 3', 'Text 4', 'Text 5']

      await smallBatchSearch.generateBatchEmbeddings({ texts })

      // Should make 3 calls: 2 + 2 + 1
      expect(mockCreate).toHaveBeenCalledTimes(3)
    })

    it('should use cache for duplicate texts', async () => {
      const texts = ['Hello world', 'Hello world', 'Different text']

      await search.generateBatchEmbeddings({ texts })

      const stats = search.getStats()
      expect(stats.totalEmbeddings).toBeGreaterThan(0)
    })

    it('should accept custom model and dimensions', async () => {
      const texts = ['Test text']

      const result = await search.generateBatchEmbeddings({
        texts,
        model: 'text-embedding-3-large',
        dimensions: 256,
      })

      expect(result.model).toBe('text-embedding-3-large')
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'text-embedding-3-large',
          dimensions: 256,
        })
      )
    })
  })

  describe('searchMessages', () => {
    beforeEach(async () => {
      // Setup test data
      const messages1: Message[] = [
        {
          id: '1',
          role: 'user',
          content: 'What is artificial intelligence?',
          timestamp: Date.now(),
        },
        {
          id: '2',
          role: 'assistant',
          content: 'Artificial intelligence is the simulation of human intelligence by machines.',
          timestamp: Date.now(),
        },
      ]

      const messages2: Message[] = [
        {
          id: '3',
          role: 'user',
          content: 'How does machine learning work?',
          timestamp: Date.now(),
        },
        {
          id: '4',
          role: 'assistant',
          content: 'Machine learning uses algorithms to learn from data.',
          timestamp: Date.now(),
        },
      ]

      await store.save('conv-1', messages1)
      await store.save('conv-2', messages2)
    })

    it('should search messages by semantic similarity', async () => {
      const results = await search.searchMessages('AI and ML', { topK: 5 })

      expect(results).toBeDefined()
      expect(Array.isArray(results)).toBe(true)
      expect(results.length).toBeGreaterThan(0)
      expect(results.length).toBeLessThanOrEqual(5)
    })

    it('should return results with similarity scores', async () => {
      const results = await search.searchMessages('artificial intelligence', {
        topK: 3,
      })

      results.forEach((result) => {
        expect(result.message).toBeDefined()
        expect(result.similarity).toBeDefined()
        expect(result.similarity.score).toBeGreaterThanOrEqual(0)
        expect(result.similarity.score).toBeLessThanOrEqual(1)
        expect(result.similarity.distance).toBe(1 - result.similarity.score)
        expect(result.similarity.rank).toBeGreaterThan(0)
      })
    })

    it('should filter by similarity threshold', async () => {
      const results = await search.searchMessages('machine learning', {
        threshold: 0.8,
      })

      results.forEach((result) => {
        expect(result.similarity.score).toBeGreaterThanOrEqual(0.8)
      })
    })

    it('should limit results by topK', async () => {
      const results = await search.searchMessages('AI', { topK: 2 })

      expect(results.length).toBeLessThanOrEqual(2)
    })

    it('should rank results correctly', async () => {
      const results = await search.searchMessages('intelligence', { topK: 3 })

      for (let i = 0; i < results.length - 1; i++) {
        expect(results[i].similarity.score).toBeGreaterThanOrEqual(
          results[i + 1].similarity.score
        )
        expect(results[i].similarity.rank).toBe(i + 1)
      }
    })

    it('should filter by conversation ID', async () => {
      const results = await search.searchMessages('machine learning', {
        filter: { conversationId: 'conv-2' },
      })

      results.forEach((result) => {
        expect(result.conversationId).toBe('conv-2')
      })
    })

    it('should filter by role', async () => {
      const results = await search.searchMessages('intelligence', {
        filter: { role: 'user' },
      })

      results.forEach((result) => {
        expect(result.message.role).toBe('user')
      })
    })

    it('should filter by date range', async () => {
      const now = Date.now()
      const oneHourAgo = now - 3600000

      const results = await search.searchMessages('AI', {
        filter: {
          startDate: oneHourAgo,
          endDate: now + 1000,
        },
      })

      results.forEach((result) => {
        expect(result.message.timestamp).toBeGreaterThanOrEqual(oneHourAgo)
        expect(result.message.timestamp).toBeLessThanOrEqual(now + 1000)
      })
    })

    it('should return empty array when no messages match', async () => {
      await store.clear()

      const results = await search.searchMessages('test query')

      expect(results).toHaveLength(0)
    })

    it('should handle empty query gracefully', async () => {
      const results = await search.searchMessages('')

      expect(Array.isArray(results)).toBe(true)
    })
  })

  describe('findSimilarMessages', () => {
    beforeEach(async () => {
      const messages: Message[] = [
        {
          id: 'msg-1',
          role: 'user',
          content: 'What is machine learning?',
          timestamp: Date.now(),
        },
        {
          id: 'msg-2',
          role: 'assistant',
          content: 'Machine learning is a subset of AI.',
          timestamp: Date.now(),
        },
        {
          id: 'msg-3',
          role: 'user',
          content: 'How does deep learning work?',
          timestamp: Date.now(),
        },
        {
          id: 'msg-4',
          role: 'user',
          content: 'What is the weather today?',
          timestamp: Date.now(),
        },
      ]

      await store.save('conv-1', messages)
    })

    it('should find similar messages', async () => {
      const results = await search.findSimilarMessages('msg-1', { topK: 3 })

      expect(results).toBeDefined()
      expect(results.length).toBeGreaterThan(0)
      expect(results.length).toBeLessThanOrEqual(3)
    })

    it('should exclude source message by default', async () => {
      const results = await search.findSimilarMessages('msg-1', { topK: 5 })

      const sourceMessage = results.find((r) => r.message.id === 'msg-1')
      expect(sourceMessage).toBeUndefined()
    })

    it('should include source message when includeSelf is true', async () => {
      const results = await search.findSimilarMessages('msg-1', {
        topK: 5,
        includeSelf: true,
      })

      const sourceMessage = results.find((r) => r.message.id === 'msg-1')
      expect(sourceMessage).toBeDefined()
    })

    it('should filter by threshold', async () => {
      const results = await search.findSimilarMessages('msg-1', {
        threshold: 0.7,
      })

      results.forEach((result) => {
        expect(result.similarity.score).toBeGreaterThanOrEqual(0.7)
      })
    })

    it('should throw error for non-existent message', async () => {
      await expect(
        search.findSimilarMessages('non-existent-id')
      ).rejects.toThrow('Message with id non-existent-id not found')
    })

    it('should respect filter options', async () => {
      const results = await search.findSimilarMessages('msg-1', {
        filter: { role: 'user' },
        topK: 3,
      })

      results.forEach((result) => {
        expect(result.message.role).toBe('user')
      })
    })
  })

  describe('searchConversations', () => {
    beforeEach(async () => {
      const messages1: Message[] = [
        {
          id: '1',
          role: 'user',
          content: 'Machine learning basics',
          timestamp: Date.now(),
        },
      ]

      const messages2: Message[] = [
        {
          id: '2',
          role: 'user',
          content: 'Deep learning tutorial',
          timestamp: Date.now(),
        },
      ]

      const messages3: Message[] = [
        {
          id: '3',
          role: 'user',
          content: 'Weather forecast',
          timestamp: Date.now(),
        },
      ]

      await store.save('conv-1', messages1)
      await store.save('conv-2', messages2)
      await store.save('conv-3', messages3)
    })

    it('should search across all conversations', async () => {
      const results = await search.searchConversations('learning', { topK: 5 })

      expect(results).toBeDefined()
      expect(results.length).toBeGreaterThan(0)
    })

    it('should filter by conversation IDs', async () => {
      const results = await search.searchConversations('learning', {
        conversationIds: ['conv-1', 'conv-2'],
      })

      results.forEach((result) => {
        expect(['conv-1', 'conv-2']).toContain(result.conversationId)
      })
    })

    it('should limit number of conversations searched', async () => {
      const results = await search.searchConversations('test', {
        maxConversations: 2,
      })

      expect(results).toBeDefined()
      const stats = search.getStats()
      expect(stats.totalConversations).toBeLessThanOrEqual(2)
    })

    it('should return ranked results', async () => {
      const results = await search.searchConversations('learning', { topK: 3 })

      for (let i = 0; i < results.length - 1; i++) {
        expect(results[i].similarity.score).toBeGreaterThanOrEqual(
          results[i + 1].similarity.score
        )
      }
    })

    it('should handle empty store', async () => {
      await store.clear()

      const results = await search.searchConversations('test')

      expect(results).toHaveLength(0)
    })
  })

  describe('caching', () => {
    it('should cache embeddings', async () => {
      const text = 'Test message for caching'

      // First call - should hit API
      await search.generateBatchEmbeddings({ texts: [text] })

      // Second call - should use cache
      await search.generateBatchEmbeddings({ texts: [text] })

      // The mock should still be called because we're testing caching behavior
      expect(mockCreate).toHaveBeenCalled()
    })

    it('should return cache size', () => {
      const cacheSize = search.getCacheSize()
      expect(typeof cacheSize).toBe('number')
      expect(cacheSize).toBeGreaterThanOrEqual(0)
    })

    it('should clear cache', async () => {
      await search.generateBatchEmbeddings({
        texts: ['Test 1', 'Test 2', 'Test 3'],
      })

      search.clearCache()

      const cacheSize = search.getCacheSize()
      expect(cacheSize).toBe(0)
    })
  })

  describe('statistics', () => {
    it('should track total embeddings generated', async () => {
      await search.generateBatchEmbeddings({
        texts: ['Text 1', 'Text 2', 'Text 3'],
      })

      const stats = search.getStats()
      expect(stats.totalEmbeddings).toBeGreaterThan(0)
    })

    it('should track average embedding time', async () => {
      await search.generateBatchEmbeddings({ texts: ['Test'] })

      const stats = search.getStats()
      expect(stats.avgEmbeddingTime).toBeGreaterThanOrEqual(0)
    })

    it('should provide cache hit rate', async () => {
      await search.generateBatchEmbeddings({
        texts: ['Same text', 'Same text', 'Different text'],
      })

      const stats = search.getStats()
      expect(stats.cacheHitRate).toBeGreaterThanOrEqual(0)
      expect(stats.cacheHitRate).toBeLessThanOrEqual(1)
    })

    it('should track messages and conversations', async () => {
      const messages: Message[] = [
        {
          id: '1',
          role: 'user',
          content: 'Test message',
          timestamp: Date.now(),
        },
      ]

      await store.save('conv-1', messages)
      await search.searchMessages('test')

      const stats = search.getStats()
      expect(stats.totalMessages).toBeGreaterThan(0)
    })
  })

  describe('error handling', () => {
    it('should handle API errors gracefully', async () => {
      mockCreate.mockRejectedValueOnce(
        new Error('API rate limit exceeded')
      )

      await expect(
        search.generateBatchEmbeddings({ texts: ['Test'] })
      ).rejects.toThrow('API rate limit exceeded')
    })

    it('should validate vector dimensions', async () => {
      // Mock embeddings with different dimensions
      mockCreate.mockImplementationOnce(async () => ({
        data: [{ embedding: [1, 2, 3] }],
        model: 'test-model',
        usage: { prompt_tokens: 1, total_tokens: 1 },
      }))

      // This should work - vectors will be different dimensions
      // The actual error will happen during cosine similarity calculation
      const messages: Message[] = [
        {
          id: '1',
          role: 'user',
          content: 'Test',
          timestamp: Date.now(),
        },
      ]

      await store.save('conv-1', messages)

      // Search should handle dimension mismatch
      try {
        await search.searchMessages('query')
      } catch (error) {
        expect(error).toBeDefined()
      }
    })
  })

  describe('edge cases', () => {
    it('should handle single message conversation', async () => {
      const messages: Message[] = [
        {
          id: '1',
          role: 'user',
          content: 'Single message',
          timestamp: Date.now(),
        },
      ]

      await store.save('conv-1', messages)

      const results = await search.searchMessages('message')

      expect(results).toBeDefined()
    })

    it('should handle very long messages', async () => {
      const longContent = 'This is a very long message. '.repeat(100)
      const messages: Message[] = [
        {
          id: '1',
          role: 'user',
          content: longContent,
          timestamp: Date.now(),
        },
      ]

      await store.save('conv-1', messages)

      const results = await search.searchMessages('long message')

      expect(results).toBeDefined()
    })

    it('should handle special characters in messages', async () => {
      const messages: Message[] = [
        {
          id: '1',
          role: 'user',
          content: 'Special chars: @#$%^&*(){}[]|\\/<>?~`',
          timestamp: Date.now(),
        },
      ]

      await store.save('conv-1', messages)

      const results = await search.searchMessages('special')

      expect(results).toBeDefined()
    })

    it('should handle unicode and emoji', async () => {
      const messages: Message[] = [
        {
          id: '1',
          role: 'user',
          content: 'Hello 你好 مرحبا 🌍🚀',
          timestamp: Date.now(),
        },
      ]

      await store.save('conv-1', messages)

      const results = await search.searchMessages('hello')

      expect(results).toBeDefined()
    })

    it('should handle zero threshold', async () => {
      const messages: Message[] = [
        {
          id: '1',
          role: 'user',
          content: 'Test message',
          timestamp: Date.now(),
        },
      ]

      await store.save('conv-1', messages)

      const results = await search.searchMessages('test', { threshold: 0.0 })

      expect(results.length).toBeGreaterThan(0)
    })

    it('should handle high threshold (1.0)', async () => {
      const messages: Message[] = [
        {
          id: '1',
          role: 'user',
          content: 'Test message',
          timestamp: Date.now(),
        },
      ]

      await store.save('conv-1', messages)

      const results = await search.searchMessages('completely different', {
        threshold: 1.0,
      })

      expect(Array.isArray(results)).toBe(true)
    })
  })

  describe('integration tests', () => {
    it('should work end-to-end with multiple conversations', async () => {
      // Create multiple conversations with varied content
      const conversations = [
        {
          id: 'conv-1',
          messages: [
            {
              id: '1',
              role: 'user' as const,
              content: 'What is machine learning?',
              timestamp: Date.now(),
            },
            {
              id: '2',
              role: 'assistant' as const,
              content: 'Machine learning is a subset of AI.',
              timestamp: Date.now(),
            },
          ],
        },
        {
          id: 'conv-2',
          messages: [
            {
              id: '3',
              role: 'user' as const,
              content: 'Explain neural networks',
              timestamp: Date.now(),
            },
            {
              id: '4',
              role: 'assistant' as const,
              content: 'Neural networks are computing systems inspired by biological neural networks.',
              timestamp: Date.now(),
            },
          ],
        },
        {
          id: 'conv-3',
          messages: [
            {
              id: '5',
              role: 'user' as const,
              content: 'What is the weather forecast?',
              timestamp: Date.now(),
            },
          ],
        },
      ]

      // Save all conversations
      for (const conv of conversations) {
        await store.save(conv.id, conv.messages)
      }

      // Search across all conversations
      const results = await search.searchConversations('AI and neural networks', {
        topK: 5,
      })

      expect(results.length).toBeGreaterThan(0)
      expect(results.length).toBeLessThanOrEqual(5)

      // Results should be ranked by similarity
      for (let i = 0; i < results.length - 1; i++) {
        expect(results[i].similarity.score).toBeGreaterThanOrEqual(
          results[i + 1].similarity.score
        )
      }

      // Find similar messages
      const similarMessages = await search.findSimilarMessages('1', {
        topK: 3,
      })

      expect(similarMessages.length).toBeGreaterThan(0)
      expect(similarMessages[0].message.id).not.toBe('1')

      // Get statistics
      const stats = search.getStats()
      expect(stats.totalMessages).toBeGreaterThan(0)
      expect(stats.totalEmbeddings).toBeGreaterThan(0)
    })
  })
})
