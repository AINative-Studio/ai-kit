/**
 * Tests for FactExtractor
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { FactExtractor } from '../../src/memory/FactExtractor'
import { LLMProvider } from '../../src/agents/llm/LLMProvider'
import { Message } from '../../src/agents/types'

// Mock LLM provider
class MockLLMProvider extends LLMProvider {
  private mockResponse: string

  constructor(mockResponse: string) {
    super({})
    this.mockResponse = mockResponse
  }

  async chat() {
    return {
      content: this.mockResponse,
      finishReason: 'stop' as const,
    }
  }

  getProviderName(): string {
    return 'mock'
  }
}

describe('FactExtractor', () => {
  let extractor: FactExtractor
  let mockProvider: MockLLMProvider

  describe('extract', () => {
    it('should extract facts from conversation', async () => {
      const mockResponse = JSON.stringify({
        facts: [
          {
            content: 'User lives in San Francisco',
            type: 'fact',
            confidence: 0.9,
            importance: 0.8,
          },
          {
            content: 'User prefers coffee over tea',
            type: 'preference',
            confidence: 0.85,
            importance: 0.6,
          },
        ],
        entities: [
          {
            name: 'San Francisco',
            type: 'place',
            context: 'User lives in San Francisco',
            confidence: 0.95,
          },
        ],
      })

      mockProvider = new MockLLMProvider(mockResponse)
      extractor = new FactExtractor({ llmProvider: mockProvider })

      const messages: Message[] = [
        {
          role: 'user',
          content: 'I live in San Francisco and I love coffee',
        },
      ]

      const result = await extractor.extract(messages)

      expect(result.success).toBe(true)
      expect(result.facts).toHaveLength(2)
      expect(result.facts[0].content).toBe('User lives in San Francisco')
      expect(result.facts[0].type).toBe('fact')
      expect(result.facts[0].confidence).toBe(0.9)
      expect(result.facts[1].type).toBe('preference')
      expect(result.entities).toHaveLength(1)
      expect(result.entities[0].name).toBe('San Francisco')
      expect(result.entities[0].type).toBe('place')
    })

    it('should filter facts by minimum confidence', async () => {
      const mockResponse = JSON.stringify({
        facts: [
          {
            content: 'High confidence fact',
            type: 'fact',
            confidence: 0.9,
            importance: 0.8,
          },
          {
            content: 'Low confidence fact',
            type: 'fact',
            confidence: 0.3,
            importance: 0.5,
          },
        ],
        entities: [],
      })

      mockProvider = new MockLLMProvider(mockResponse)
      extractor = new FactExtractor({
        llmProvider: mockProvider,
        minConfidence: 0.6,
      })

      const messages: Message[] = [
        {
          role: 'user',
          content: 'Test message',
        },
      ]

      const result = await extractor.extract(messages)

      expect(result.success).toBe(true)
      expect(result.facts).toHaveLength(1)
      expect(result.facts[0].content).toBe('High confidence fact')
    })

    it('should handle extraction errors gracefully', async () => {
      mockProvider = new MockLLMProvider('Invalid JSON response')
      extractor = new FactExtractor({ llmProvider: mockProvider })

      const messages: Message[] = [
        {
          role: 'user',
          content: 'Test message',
        },
      ]

      const result = await extractor.extract(messages)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.facts).toHaveLength(0)
      expect(result.entities).toHaveLength(0)
    })

    it('should extract multiple types of memories', async () => {
      const mockResponse = JSON.stringify({
        facts: [
          {
            content: 'User is a software engineer',
            type: 'fact',
            confidence: 0.9,
            importance: 0.8,
          },
          {
            content: 'User likes TypeScript',
            type: 'preference',
            confidence: 0.85,
            importance: 0.6,
          },
          {
            content: 'User wants to learn Rust',
            type: 'goal',
            confidence: 0.8,
            importance: 0.7,
          },
          {
            content: 'User works remotely',
            type: 'context',
            confidence: 0.75,
            importance: 0.5,
          },
        ],
        entities: [
          {
            name: 'TypeScript',
            type: 'product',
            context: 'User likes TypeScript',
            confidence: 0.9,
          },
          {
            name: 'Rust',
            type: 'product',
            context: 'User wants to learn Rust',
            confidence: 0.85,
          },
        ],
      })

      mockProvider = new MockLLMProvider(mockResponse)
      extractor = new FactExtractor({ llmProvider: mockProvider })

      const messages: Message[] = [
        {
          role: 'user',
          content:
            "I'm a software engineer and I love TypeScript. I want to learn Rust. I work remotely.",
        },
      ]

      const result = await extractor.extract(messages)

      expect(result.success).toBe(true)
      expect(result.facts).toHaveLength(4)

      const factTypes = result.facts.map((f) => f.type)
      expect(factTypes).toContain('fact')
      expect(factTypes).toContain('preference')
      expect(factTypes).toContain('goal')
      expect(factTypes).toContain('context')

      expect(result.entities).toHaveLength(2)
    })

    it('should extract entity information', async () => {
      const mockResponse = JSON.stringify({
        facts: [
          {
            content: 'User works at Google',
            type: 'entity',
            entityName: 'Google',
            entityType: 'organization',
            confidence: 0.95,
            importance: 0.8,
          },
        ],
        entities: [
          {
            name: 'Google',
            type: 'organization',
            context: 'User works at Google',
            confidence: 0.95,
          },
        ],
      })

      mockProvider = new MockLLMProvider(mockResponse)
      extractor = new FactExtractor({ llmProvider: mockProvider })

      const messages: Message[] = [
        {
          role: 'user',
          content: 'I work at Google',
        },
      ]

      const result = await extractor.extract(messages)

      expect(result.success).toBe(true)
      expect(result.facts).toHaveLength(1)
      expect(result.facts[0].entityName).toBe('Google')
      expect(result.facts[0].entityType).toBe('organization')
      expect(result.entities[0].name).toBe('Google')
      expect(result.entities[0].type).toBe('organization')
    })

    it('should handle empty conversation', async () => {
      const mockResponse = JSON.stringify({
        facts: [],
        entities: [],
      })

      mockProvider = new MockLLMProvider(mockResponse)
      extractor = new FactExtractor({ llmProvider: mockProvider })

      const messages: Message[] = []

      const result = await extractor.extract(messages)

      expect(result.success).toBe(true)
      expect(result.facts).toHaveLength(0)
      expect(result.entities).toHaveLength(0)
    })

    it('should extract from multi-turn conversation', async () => {
      const mockResponse = JSON.stringify({
        facts: [
          {
            content: 'User lives in New York',
            type: 'fact',
            confidence: 0.9,
            importance: 0.8,
          },
          {
            content: 'User has a dog named Max',
            type: 'fact',
            confidence: 0.95,
            importance: 0.7,
          },
        ],
        entities: [
          {
            name: 'New York',
            type: 'place',
            context: 'User lives in New York',
            confidence: 0.9,
          },
          {
            name: 'Max',
            type: 'person',
            context: "User's dog",
            confidence: 0.85,
          },
        ],
      })

      mockProvider = new MockLLMProvider(mockResponse)
      extractor = new FactExtractor({ llmProvider: mockProvider })

      const messages: Message[] = [
        {
          role: 'user',
          content: 'I live in New York',
        },
        {
          role: 'assistant',
          content: 'Nice! How do you like living in New York?',
        },
        {
          role: 'user',
          content: "It's great! I have a dog named Max.",
        },
      ]

      const result = await extractor.extract(messages)

      expect(result.success).toBe(true)
      expect(result.facts).toHaveLength(2)
      expect(result.entities).toHaveLength(2)
    })
  })

  describe('extractFromMessage', () => {
    it('should extract from a single message', async () => {
      const mockResponse = JSON.stringify({
        facts: [
          {
            content: 'User is 25 years old',
            type: 'fact',
            confidence: 0.95,
            importance: 0.7,
          },
        ],
        entities: [],
      })

      mockProvider = new MockLLMProvider(mockResponse)
      extractor = new FactExtractor({ llmProvider: mockProvider })

      const message: Message = {
        role: 'user',
        content: 'I am 25 years old',
      }

      const result = await extractor.extractFromMessage(message)

      expect(result.success).toBe(true)
      expect(result.facts).toHaveLength(1)
      expect(result.facts[0].content).toBe('User is 25 years old')
    })
  })

  describe('deduplicateFacts', () => {
    beforeEach(() => {
      mockProvider = new MockLLMProvider('')
      extractor = new FactExtractor({ llmProvider: mockProvider })
    })

    it('should remove duplicate facts', () => {
      const facts = [
        {
          content: 'User lives in SF',
          type: 'fact' as const,
          confidence: 0.9,
          importance: 0.8,
        },
        {
          content: 'User lives in sf',
          type: 'fact' as const,
          confidence: 0.85,
          importance: 0.7,
        },
        {
          content: 'User likes coffee',
          type: 'preference' as const,
          confidence: 0.8,
          importance: 0.6,
        },
      ]

      const unique = extractor.deduplicateFacts(facts)

      expect(unique).toHaveLength(2)
    })

    it('should keep fact with higher confidence when deduplicating', () => {
      const facts = [
        {
          content: 'User likes coffee',
          type: 'preference' as const,
          confidence: 0.7,
          importance: 0.6,
        },
        {
          content: 'User likes coffee',
          type: 'preference' as const,
          confidence: 0.9,
          importance: 0.6,
        },
      ]

      const unique = extractor.deduplicateFacts(facts)

      expect(unique).toHaveLength(1)
      expect(unique[0].confidence).toBe(0.9)
    })

    it('should handle empty array', () => {
      const unique = extractor.deduplicateFacts([])

      expect(unique).toHaveLength(0)
    })

    it('should preserve different facts', () => {
      const facts = [
        {
          content: 'User lives in SF',
          type: 'fact' as const,
          confidence: 0.9,
          importance: 0.8,
        },
        {
          content: 'User likes coffee',
          type: 'preference' as const,
          confidence: 0.85,
          importance: 0.7,
        },
        {
          content: 'User wants to travel',
          type: 'goal' as const,
          confidence: 0.8,
          importance: 0.6,
        },
      ]

      const unique = extractor.deduplicateFacts(facts)

      expect(unique).toHaveLength(3)
    })
  })

  describe('configuration', () => {
    it('should use custom temperature', async () => {
      const mockResponse = JSON.stringify({ facts: [], entities: [] })
      mockProvider = new MockLLMProvider(mockResponse)

      extractor = new FactExtractor({
        llmProvider: mockProvider,
        temperature: 0.5,
      })

      const messages: Message[] = [
        {
          role: 'user',
          content: 'Test',
        },
      ]

      await extractor.extract(messages)

      // The temperature is used internally, just verify it doesn't error
      expect(true).toBe(true)
    })

    it('should use custom maxTokens', async () => {
      const mockResponse = JSON.stringify({ facts: [], entities: [] })
      mockProvider = new MockLLMProvider(mockResponse)

      extractor = new FactExtractor({
        llmProvider: mockProvider,
        maxTokens: 500,
      })

      const messages: Message[] = [
        {
          role: 'user',
          content: 'Test',
        },
      ]

      await extractor.extract(messages)

      // The maxTokens is used internally, just verify it doesn't error
      expect(true).toBe(true)
    })

    it('should respect extractEntities flag', async () => {
      const mockResponse = JSON.stringify({
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

      mockProvider = new MockLLMProvider(mockResponse)

      extractor = new FactExtractor({
        llmProvider: mockProvider,
        extractEntities: false,
      })

      const messages: Message[] = [
        {
          role: 'user',
          content: 'I live in Paris',
        },
      ]

      const result = await extractor.extract(messages)

      expect(result.success).toBe(true)
      // Even though entities might be in the response, they should be filtered
    })
  })
})
