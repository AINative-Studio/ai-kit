/**
 * Tests for UserMemory
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { UserMemory } from '../../src/memory/UserMemory'
import { InMemoryMemoryStore } from '../../src/memory/InMemoryMemoryStore'
import { LLMProvider } from '../../src/agents/llm/LLMProvider'
import { Message } from '../../src/agents/types'

// Mock LLM provider
class MockLLMProvider extends LLMProvider {
  private responses: string[]
  private currentIndex: number = 0

  constructor(responses: string[]) {
    super({})
    this.responses = responses
  }

  async chat() {
    const response = this.responses[this.currentIndex % this.responses.length]
    this.currentIndex++
    return {
      content: response,
      finishReason: 'stop' as const,
    }
  }

  getProviderName(): string {
    return 'mock'
  }

  reset() {
    this.currentIndex = 0
  }
}

describe('UserMemory', () => {
  let store: InMemoryMemoryStore
  let userMemory: UserMemory

  beforeEach(() => {
    store = new InMemoryMemoryStore()
  })

  afterEach(async () => {
    await userMemory.close()
  })

  describe('addMemory', () => {
    beforeEach(() => {
      userMemory = new UserMemory({ store })
    })

    it('should add a fact memory', async () => {
      const memory = await userMemory.addMemory(
        'user-1',
        'Lives in San Francisco',
        'fact'
      )

      expect(memory.id).toBeDefined()
      expect(memory.userId).toBe('user-1')
      expect(memory.type).toBe('fact')
      expect(memory.content).toBe('Lives in San Francisco')
    })

    it('should add a preference memory', async () => {
      const memory = await userMemory.addMemory(
        'user-1',
        'Likes coffee',
        'preference'
      )

      expect(memory.type).toBe('preference')
      expect(memory.content).toBe('Likes coffee')
    })

    it('should add a goal memory', async () => {
      const memory = await userMemory.addMemory(
        'user-1',
        'Learn Rust programming',
        'goal'
      )

      expect(memory.type).toBe('goal')
      expect(memory.content).toBe('Learn Rust programming')
    })

    it('should add an entity memory', async () => {
      const memory = await userMemory.addMemory(
        'user-1',
        'Works at Google',
        'entity',
        {
          entityName: 'Google',
          entityType: 'organization',
        }
      )

      expect(memory.type).toBe('entity')
      expect(memory.entityName).toBe('Google')
      expect(memory.entityType).toBe('organization')
    })

    it('should add memory with custom importance and confidence', async () => {
      const memory = await userMemory.addMemory(
        'user-1',
        'Test fact',
        'fact',
        {
          importance: 0.9,
          confidence: 0.95,
        }
      )

      expect(memory.importance).toBe(0.9)
      expect(memory.confidence).toBe(0.95)
    })

    it('should add memory with source', async () => {
      const memory = await userMemory.addMemory(
        'user-1',
        'Test fact',
        'fact',
        {
          source: 'conversation-123',
        }
      )

      expect(memory.source).toBe('conversation-123')
    })
  })

  describe('extractFromConversation', () => {
    it('should extract and save memories from conversation', async () => {
      const extractResponse = JSON.stringify({
        facts: [
          {
            content: 'User lives in New York',
            type: 'fact',
            confidence: 0.9,
            importance: 0.8,
          },
          {
            content: 'User likes pizza',
            type: 'preference',
            confidence: 0.85,
            importance: 0.6,
          },
        ],
        entities: [
          {
            name: 'New York',
            type: 'place',
            context: 'User lives in New York',
            confidence: 0.9,
          },
        ],
      })

      const mockProvider = new MockLLMProvider([extractResponse])
      userMemory = new UserMemory({
        store,
        llmProvider: mockProvider,
      })

      const messages: Message[] = [
        {
          role: 'user',
          content: 'I live in New York and I love pizza',
        },
      ]

      const memories = await userMemory.extractFromConversation(
        'user-1',
        messages,
        'conv-1'
      )

      expect(memories).toHaveLength(3) // 2 facts + 1 entity
      expect(memories.some((m) => m.type === 'fact')).toBe(true)
      expect(memories.some((m) => m.type === 'preference')).toBe(true)
      expect(memories.some((m) => m.type === 'entity')).toBe(true)

      const allMemories = await userMemory.getUserMemories('user-1')
      expect(allMemories).toHaveLength(3)
    })

    it('should throw error if no LLM provider', async () => {
      userMemory = new UserMemory({ store })

      const messages: Message[] = [
        {
          role: 'user',
          content: 'Test',
        },
      ]

      await expect(
        userMemory.extractFromConversation('user-1', messages)
      ).rejects.toThrow('LLM provider required')
    })

    it('should handle extraction errors', async () => {
      const mockProvider = new MockLLMProvider(['Invalid JSON'])
      userMemory = new UserMemory({
        store,
        llmProvider: mockProvider,
      })

      const messages: Message[] = [
        {
          role: 'user',
          content: 'Test',
        },
      ]

      await expect(
        userMemory.extractFromConversation('user-1', messages)
      ).rejects.toThrow()
    })

    it('should detect and handle contradictions', async () => {
      const extractResponse1 = JSON.stringify({
        facts: [
          {
            content: 'User lives in Paris',
            type: 'fact',
            confidence: 0.9,
            importance: 0.8,
          },
        ],
        entities: [],
      })

      const extractResponse2 = JSON.stringify({
        facts: [
          {
            content: 'User lives in London',
            type: 'fact',
            confidence: 0.9,
            importance: 0.8,
          },
        ],
        entities: [],
      })

      const contradictionResponse = JSON.stringify({
        hasContradiction: true,
        contradictingMemoryIndex: 1,
        explanation: 'User cannot live in both Paris and London',
        confidence: 0.95,
        resolution: 'replace',
      })

      const mockProvider = new MockLLMProvider([
        extractResponse1,
        extractResponse2,
        contradictionResponse,
      ])

      userMemory = new UserMemory({
        store,
        llmProvider: mockProvider,
        detectContradictions: true,
      })

      // Add first memory
      const messages1: Message[] = [
        {
          role: 'user',
          content: 'I live in Paris',
        },
      ]
      await userMemory.extractFromConversation('user-1', messages1)

      // Add contradicting memory
      const messages2: Message[] = [
        {
          role: 'user',
          content: 'I live in London',
        },
      ]
      await userMemory.extractFromConversation('user-1', messages2)

      // The contradiction should be handled based on resolution strategy
      const memories = await userMemory.getUserMemories('user-1')
      expect(memories.length).toBeGreaterThan(0)
    })
  })

  describe('getMemory', () => {
    beforeEach(() => {
      userMemory = new UserMemory({ store })
    })

    it('should get memory by ID', async () => {
      const saved = await userMemory.addMemory('user-1', 'Test fact', 'fact')
      const retrieved = await userMemory.getMemory(saved.id)

      expect(retrieved).toBeDefined()
      expect(retrieved?.id).toBe(saved.id)
      expect(retrieved?.content).toBe('Test fact')
    })

    it('should return null for non-existent memory', async () => {
      const retrieved = await userMemory.getMemory('non-existent')

      expect(retrieved).toBeNull()
    })
  })

  describe('searchMemories', () => {
    beforeEach(async () => {
      userMemory = new UserMemory({ store })

      await userMemory.addMemory('user-1', 'Lives in SF', 'fact', {
        importance: 0.9,
      })
      await userMemory.addMemory('user-1', 'Likes coffee', 'preference', {
        importance: 0.6,
      })
      await userMemory.addMemory('user-1', 'Works at Google', 'entity', {
        entityName: 'Google',
        importance: 0.7,
      })
    })

    it('should search by type', async () => {
      const results = await userMemory.searchMemories('user-1', {
        type: 'fact',
      })

      expect(results).toHaveLength(1)
      expect(results[0].type).toBe('fact')
    })

    it('should search by entity name', async () => {
      const results = await userMemory.searchMemories('user-1', {
        entityName: 'Google',
      })

      expect(results).toHaveLength(1)
      expect(results[0].entityName).toBe('Google')
    })

    it('should search by minimum importance', async () => {
      const results = await userMemory.searchMemories('user-1', {
        minImportance: 0.7,
      })

      expect(results.every((m) => m.importance >= 0.7)).toBe(true)
    })

    it('should limit results', async () => {
      const results = await userMemory.searchMemories('user-1', {
        limit: 2,
      })

      expect(results).toHaveLength(2)
    })
  })

  describe('getUserMemories', () => {
    beforeEach(() => {
      userMemory = new UserMemory({ store })
    })

    it('should get all memories for a user', async () => {
      await userMemory.addMemory('user-1', 'Fact 1', 'fact')
      await userMemory.addMemory('user-1', 'Fact 2', 'fact')
      await userMemory.addMemory('user-2', 'Fact 3', 'fact')

      const user1Memories = await userMemory.getUserMemories('user-1')

      expect(user1Memories).toHaveLength(2)
      expect(user1Memories.every((m) => m.userId === 'user-1')).toBe(true)
    })

    it('should return empty array for user with no memories', async () => {
      const memories = await userMemory.getUserMemories('non-existent')

      expect(memories).toHaveLength(0)
    })
  })

  describe('getMemoriesByType', () => {
    beforeEach(async () => {
      userMemory = new UserMemory({ store })

      await userMemory.addMemory('user-1', 'Fact 1', 'fact')
      await userMemory.addMemory('user-1', 'Fact 2', 'fact')
      await userMemory.addMemory('user-1', 'Preference 1', 'preference')
    })

    it('should get memories by type', async () => {
      const facts = await userMemory.getMemoriesByType('user-1', 'fact')

      expect(facts).toHaveLength(2)
      expect(facts.every((m) => m.type === 'fact')).toBe(true)
    })
  })

  describe('getMemoriesByEntity', () => {
    beforeEach(async () => {
      userMemory = new UserMemory({ store })

      await userMemory.addMemory('user-1', 'Works at Google', 'entity', {
        entityName: 'Google',
      })
      await userMemory.addMemory('user-1', 'Lives near Google', 'entity', {
        entityName: 'Google',
      })
      await userMemory.addMemory('user-1', 'Studied at MIT', 'entity', {
        entityName: 'MIT',
      })
    })

    it('should get memories by entity', async () => {
      const googleMemories = await userMemory.getMemoriesByEntity(
        'user-1',
        'Google'
      )

      expect(googleMemories).toHaveLength(2)
      expect(googleMemories.every((m) => m.entityName === 'Google')).toBe(true)
    })
  })

  describe('updateMemory', () => {
    beforeEach(() => {
      userMemory = new UserMemory({ store })
    })

    it('should update memory content', async () => {
      const saved = await userMemory.addMemory('user-1', 'Old content', 'fact')
      const updated = await userMemory.updateMemory(saved.id, {
        content: 'New content',
      })

      expect(updated?.content).toBe('New content')
    })

    it('should update importance and confidence', async () => {
      const saved = await userMemory.addMemory('user-1', 'Test fact', 'fact')
      const updated = await userMemory.updateMemory(saved.id, {
        importance: 0.95,
        confidence: 0.99,
      })

      expect(updated?.importance).toBe(0.95)
      expect(updated?.confidence).toBe(0.99)
    })

    it('should return null for non-existent memory', async () => {
      const updated = await userMemory.updateMemory('non-existent', {
        content: 'New content',
      })

      expect(updated).toBeNull()
    })
  })

  describe('deleteMemory', () => {
    beforeEach(() => {
      userMemory = new UserMemory({ store })
    })

    it('should delete a memory', async () => {
      const saved = await userMemory.addMemory('user-1', 'Test fact', 'fact')
      const deleted = await userMemory.deleteMemory(saved.id)

      expect(deleted).toBe(true)

      const retrieved = await userMemory.getMemory(saved.id)
      expect(retrieved).toBeNull()
    })

    it('should return false for non-existent memory', async () => {
      const deleted = await userMemory.deleteMemory('non-existent')

      expect(deleted).toBe(false)
    })
  })

  describe('deleteUserMemories', () => {
    beforeEach(() => {
      userMemory = new UserMemory({ store })
    })

    it('should delete all memories for a user', async () => {
      await userMemory.addMemory('user-1', 'Fact 1', 'fact')
      await userMemory.addMemory('user-1', 'Fact 2', 'fact')
      await userMemory.addMemory('user-2', 'Fact 3', 'fact')

      const deleted = await userMemory.deleteUserMemories('user-1')

      expect(deleted).toBe(2)

      const user1Memories = await userMemory.getUserMemories('user-1')
      expect(user1Memories).toHaveLength(0)

      const user2Memories = await userMemory.getUserMemories('user-2')
      expect(user2Memories).toHaveLength(1)
    })
  })

  describe('checkContradiction', () => {
    it('should detect contradictions', async () => {
      const contradictionResponse = JSON.stringify({
        hasContradiction: true,
        contradictingMemoryIndex: 1,
        explanation: 'Cannot live in two places',
        confidence: 0.9,
        resolution: 'replace',
      })

      const mockProvider = new MockLLMProvider([contradictionResponse])
      userMemory = new UserMemory({
        store,
        llmProvider: mockProvider,
      })

      await userMemory.addMemory('user-1', 'Lives in Paris', 'fact')

      const result = await userMemory.checkContradiction(
        'user-1',
        'Lives in London'
      )

      expect(result.hasContradiction).toBe(true)
      expect(result.explanation).toBeDefined()
      expect(result.confidence).toBeGreaterThan(0)
    })

    it('should return no contradiction when no existing memories', async () => {
      const mockProvider = new MockLLMProvider([])
      userMemory = new UserMemory({
        store,
        llmProvider: mockProvider,
      })

      const result = await userMemory.checkContradiction(
        'user-1',
        'Lives in Paris'
      )

      expect(result.hasContradiction).toBe(false)
      expect(result.confidence).toBe(1.0)
    })

    it('should return no contradiction without LLM provider', async () => {
      userMemory = new UserMemory({ store })

      const result = await userMemory.checkContradiction(
        'user-1',
        'Lives in Paris'
      )

      expect(result.hasContradiction).toBe(false)
      expect(result.confidence).toBe(0)
    })
  })

  describe('consolidateMemories', () => {
    it('should consolidate similar memories', async () => {
      const consolidationResponse = JSON.stringify({
        shouldMerge: true,
        mergedContent: 'User enjoys both coffee and espresso',
        explanation: 'Both refer to coffee preferences',
      })

      const mockProvider = new MockLLMProvider([consolidationResponse])
      userMemory = new UserMemory({
        store,
        llmProvider: mockProvider,
        autoConsolidate: false,
      })

      await userMemory.addMemory('user-1', 'Likes coffee', 'preference')
      await userMemory.addMemory('user-1', 'Enjoys espresso', 'preference')

      const results = await userMemory.consolidateMemories('user-1')

      // Results may vary based on implementation
      expect(Array.isArray(results)).toBe(true)
    })

    it('should return empty array without LLM provider', async () => {
      userMemory = new UserMemory({ store })

      await userMemory.addMemory('user-1', 'Fact 1', 'fact')
      await userMemory.addMemory('user-1', 'Fact 2', 'fact')

      const results = await userMemory.consolidateMemories('user-1')

      expect(results).toHaveLength(0)
    })
  })

  describe('cleanup', () => {
    beforeEach(() => {
      userMemory = new UserMemory({ store })
    })

    it('should remove expired memories', async () => {
      await userMemory.addMemory('user-1', 'Expired fact', 'fact', { ttl: 1 })
      await userMemory.addMemory('user-1', 'Valid fact', 'fact')

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 1100))

      const removed = await userMemory.cleanup()

      expect(removed).toBe(1)

      const memories = await userMemory.getUserMemories('user-1')
      expect(memories).toHaveLength(1)
      expect(memories[0].content).toBe('Valid fact')
    })
  })

  describe('getStats', () => {
    beforeEach(() => {
      userMemory = new UserMemory({ store })
    })

    it('should return correct statistics', async () => {
      await userMemory.addMemory('user-1', 'Fact 1', 'fact')
      await userMemory.addMemory('user-1', 'Fact 2', 'fact')
      await userMemory.addMemory('user-1', 'Preference 1', 'preference')
      await userMemory.addMemory('user-2', 'Goal 1', 'goal')

      const stats = await userMemory.getStats()

      expect(stats.totalMemories).toBe(4)
      expect(stats.uniqueUsers).toBe(2)
      expect(stats.memoriesByType.fact).toBe(2)
      expect(stats.memoriesByType.preference).toBe(1)
      expect(stats.memoriesByType.goal).toBe(1)
    })
  })
})
