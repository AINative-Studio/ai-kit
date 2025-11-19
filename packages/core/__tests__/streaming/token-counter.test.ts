import { describe, it, expect } from 'vitest'
import {
  countTokens,
  countMessageTokens,
  countMessagesTokens,
  calculateCost,
  estimateRequestTokens,
  MODEL_PRICING,
} from '../../src/streaming/token-counter'
import type { Message } from '../../src/types'

describe('token-counter', () => {
  describe('countTokens', () => {
    it('should count tokens in text', () => {
      const result = countTokens('Hello world')
      expect(result.tokens).toBeGreaterThan(0)
      expect(result.characters).toBe(11)
    })

    it('should return zero for empty string', () => {
      const result = countTokens('')
      expect(result.tokens).toBe(0)
      expect(result.characters).toBe(0)
    })

    it('should approximate 4 characters per token', () => {
      const text = 'a'.repeat(100)
      const result = countTokens(text)
      expect(result.tokens).toBe(25) // 100 / 4 = 25
      expect(result.characters).toBe(100)
    })

    it('should handle unicode characters', () => {
      const result = countTokens('Hello 世界 🌍')
      expect(result.tokens).toBeGreaterThan(0)
      expect(result.characters).toBeGreaterThan(0)
    })
  })

  describe('countMessageTokens', () => {
    it('should count tokens in message with overhead', () => {
      const message: Message = {
        id: '1',
        role: 'user',
        content: 'Hello',
        timestamp: Date.now(),
      }

      const result = countMessageTokens(message)
      expect(result.tokens).toBeGreaterThan(1) // Content + overhead
      expect(result.characters).toBe(5)
    })

    it('should add overhead for role metadata', () => {
      const message: Message = {
        id: '1',
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      }

      const result = countMessageTokens(message)
      expect(result.tokens).toBe(4) // Just overhead for empty message
    })

    it('should handle long messages', () => {
      const message: Message = {
        id: '1',
        role: 'user',
        content: 'a'.repeat(1000),
        timestamp: Date.now(),
      }

      const result = countMessageTokens(message)
      expect(result.tokens).toBeGreaterThan(250) // ~250 + overhead
      expect(result.characters).toBe(1000)
    })
  })

  describe('countMessagesTokens', () => {
    it('should count tokens in multiple messages', () => {
      const messages: Message[] = [
        {
          id: '1',
          role: 'user',
          content: 'Hello',
          timestamp: Date.now(),
        },
        {
          id: '2',
          role: 'assistant',
          content: 'Hi there',
          timestamp: Date.now(),
        },
      ]

      const result = countMessagesTokens(messages)
      expect(result.tokens).toBeGreaterThan(0)
      expect(result.characters).toBe(13) // 5 + 8
    })

    it('should return zero for empty array', () => {
      const result = countMessagesTokens([])
      expect(result.tokens).toBe(0)
      expect(result.characters).toBe(0)
    })

    it('should sum all message tokens', () => {
      const messages: Message[] = [
        {
          id: '1',
          role: 'user',
          content: 'a'.repeat(100),
          timestamp: Date.now(),
        },
        {
          id: '2',
          role: 'assistant',
          content: 'a'.repeat(100),
          timestamp: Date.now(),
        },
      ]

      const result = countMessagesTokens(messages)
      // 100/4 + 4 (overhead) = 29 per message
      // 29 * 2 = 58 total
      expect(result.tokens).toBe(58)
      expect(result.characters).toBe(200)
    })
  })

  describe('MODEL_PRICING', () => {
    it('should have pricing for OpenAI models', () => {
      expect(MODEL_PRICING['gpt-4']).toBeDefined()
      expect(MODEL_PRICING['gpt-4-turbo']).toBeDefined()
      expect(MODEL_PRICING['gpt-3.5-turbo']).toBeDefined()
    })

    it('should have pricing for Anthropic models', () => {
      expect(MODEL_PRICING['claude-3-opus']).toBeDefined()
      expect(MODEL_PRICING['claude-3-sonnet']).toBeDefined()
      expect(MODEL_PRICING['claude-3-haiku']).toBeDefined()
      expect(MODEL_PRICING['claude-sonnet-4']).toBeDefined()
    })

    it('should have pricing for Meta models', () => {
      expect(MODEL_PRICING['llama-3-70b']).toBeDefined()
      expect(MODEL_PRICING['llama-3-8b']).toBeDefined()
    })

    it('should have input and output pricing', () => {
      const pricing = MODEL_PRICING['gpt-4']
      expect(pricing.input).toBeGreaterThan(0)
      expect(pricing.output).toBeGreaterThan(0)
      expect(pricing.output).toBeGreaterThan(pricing.input) // Output is typically more expensive
    })
  })

  describe('calculateCost', () => {
    it('should calculate cost for GPT-4', () => {
      const cost = calculateCost(1000, 1000, 'gpt-4')
      // 1000 tokens = 1K tokens
      // Input: 1K * $0.03 = $0.03
      // Output: 1K * $0.06 = $0.06
      // Total: $0.09
      expect(cost).toBe(0.09)
    })

    it('should calculate cost for Claude Sonnet 4', () => {
      const cost = calculateCost(1000, 500, 'claude-sonnet-4')
      // Input: 1K * $0.003 = $0.003
      // Output: 0.5K * $0.015 = $0.0075
      // Total: $0.0105
      expect(cost).toBeCloseTo(0.0105, 4)
    })

    it('should calculate cost for GPT-3.5 Turbo', () => {
      const cost = calculateCost(10000, 5000, 'gpt-3.5-turbo')
      // Input: 10K * $0.0005 = $0.005
      // Output: 5K * $0.0015 = $0.0075
      // Total: $0.0125
      expect(cost).toBeCloseTo(0.0125, 4)
    })

    it('should handle zero tokens', () => {
      const cost = calculateCost(0, 0, 'gpt-4')
      expect(cost).toBe(0)
    })

    it('should return 0 for unknown model', () => {
      const cost = calculateCost(1000, 1000, 'unknown-model' as any)
      expect(cost).toBe(0)
    })

    it('should calculate cost for Claude Opus (most expensive)', () => {
      const cost = calculateCost(1000, 1000, 'claude-3-opus')
      // Input: 1K * $0.015 = $0.015
      // Output: 1K * $0.075 = $0.075
      // Total: $0.09
      expect(cost).toBe(0.09)
    })

    it('should calculate cost for Claude Haiku (cheapest Anthropic)', () => {
      const cost = calculateCost(1000, 1000, 'claude-3-haiku')
      // Input: 1K * $0.00025 = $0.00025
      // Output: 1K * $0.00125 = $0.00125
      // Total: $0.0015
      expect(cost).toBe(0.0015)
    })

    it('should calculate cost for Llama models', () => {
      const cost70b = calculateCost(1000, 1000, 'llama-3-70b')
      const cost8b = calculateCost(1000, 1000, 'llama-3-8b')

      // Llama 70B: $0.0008 per 1K for both input and output
      expect(cost70b).toBe(0.0016)

      // Llama 8B: $0.0002 per 1K for both input and output
      expect(cost8b).toBeCloseTo(0.0004, 4)
    })

    it('should handle large token counts', () => {
      const cost = calculateCost(1000000, 500000, 'gpt-4')
      // Input: 1000K * $0.03 = $30
      // Output: 500K * $0.06 = $30
      // Total: $60
      expect(cost).toBe(60)
    })
  })

  describe('estimateRequestTokens', () => {
    it('should estimate tokens for messages only', () => {
      const messages: Message[] = [
        {
          id: '1',
          role: 'user',
          content: 'Hello',
          timestamp: Date.now(),
        },
      ]

      const result = estimateRequestTokens(messages)
      expect(result.tokens).toBeGreaterThan(0)
    })

    it('should include system prompt tokens', () => {
      const messages: Message[] = [
        {
          id: '1',
          role: 'user',
          content: 'Hello',
          timestamp: Date.now(),
        },
      ]

      const systemPrompt = 'You are a helpful assistant'

      const withoutSystem = estimateRequestTokens(messages)
      const withSystem = estimateRequestTokens(messages, systemPrompt)

      expect(withSystem.tokens).toBeGreaterThan(withoutSystem.tokens)
    })

    it('should handle empty messages and no system prompt', () => {
      const result = estimateRequestTokens([])
      expect(result.tokens).toBe(0)
      expect(result.characters).toBe(0)
    })

    it('should handle empty messages with system prompt', () => {
      const result = estimateRequestTokens([], 'System prompt')
      expect(result.tokens).toBeGreaterThan(0)
    })

    it('should count multiple messages correctly', () => {
      const messages: Message[] = [
        {
          id: '1',
          role: 'user',
          content: 'a'.repeat(100),
          timestamp: Date.now(),
        },
        {
          id: '2',
          role: 'assistant',
          content: 'a'.repeat(100),
          timestamp: Date.now(),
        },
        {
          id: '3',
          role: 'user',
          content: 'a'.repeat(100),
          timestamp: Date.now(),
        },
      ]

      const systemPrompt = 'a'.repeat(100)

      const result = estimateRequestTokens(messages, systemPrompt)

      // 3 messages * (100/4 + 4) + system (100/4) = 3*29 + 25 = 112
      expect(result.tokens).toBe(112)
      expect(result.characters).toBe(400) // 300 from messages + 100 from system
    })
  })
})
