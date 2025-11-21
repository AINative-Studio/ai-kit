import type { Message } from '../types'
import type { TokenCount } from '../types/common.d'

/**
 * Token counting utilities
 * Provides accurate token counting for cost estimation
 */

// Approximate token counts (chars / 4 is a rough estimate)
// For production, integrate with tiktoken or similar
const CHARS_PER_TOKEN = 4

// Re-export TokenCount for backwards compatibility
export type { TokenCount }

/**
 * Count tokens in text (approximation)
 * For production use, integrate with tiktoken
 */
export function countTokens(text: string): TokenCount {
  const characters = text.length
  const tokens = Math.ceil(characters / CHARS_PER_TOKEN)

  return { tokens, characters }
}

/**
 * Count tokens in a message
 */
export function countMessageTokens(message: Message): TokenCount {
  // Add overhead for role, etc. (approximate)
  const overhead = 4
  const contentTokens = countTokens(message.content)

  return {
    tokens: contentTokens.tokens + overhead,
    characters: contentTokens.characters,
  }
}

/**
 * Count tokens in an array of messages
 */
export function countMessagesTokens(messages: Message[]): TokenCount {
  return messages.reduce(
    (acc, message) => {
      const count = countMessageTokens(message)
      return {
        tokens: acc.tokens + count.tokens,
        characters: acc.characters + count.characters,
      }
    },
    { tokens: 0, characters: 0 }
  )
}

/**
 * Pricing per model (per 1K tokens)
 */
export const MODEL_PRICING = {
  // OpenAI
  'gpt-4': { input: 0.03, output: 0.06 },
  'gpt-4-turbo': { input: 0.01, output: 0.03 },
  'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },

  // Anthropic
  'claude-3-opus': { input: 0.015, output: 0.075 },
  'claude-3-sonnet': { input: 0.003, output: 0.015 },
  'claude-3-haiku': { input: 0.00025, output: 0.00125 },
  'claude-sonnet-4': { input: 0.003, output: 0.015 },

  // Meta
  'llama-3-70b': { input: 0.0008, output: 0.0008 },
  'llama-3-8b': { input: 0.0002, output: 0.0002 },
} as const

export type ModelName = keyof typeof MODEL_PRICING

/**
 * Calculate cost based on token usage
 */
export function calculateCost(
  promptTokens: number,
  completionTokens: number,
  model: ModelName
): number {
  const pricing = MODEL_PRICING[model]

  if (!pricing) {
    console.warn(`Unknown model: ${model}, cost calculation may be inaccurate`)
    return 0
  }

  const inputCost = (promptTokens / 1000) * pricing.input
  const outputCost = (completionTokens / 1000) * pricing.output

  return inputCost + outputCost
}

/**
 * Estimate tokens for a request
 */
export function estimateRequestTokens(
  messages: Message[],
  systemPrompt?: string
): TokenCount {
  const messagesTokens = countMessagesTokens(messages)

  if (systemPrompt) {
    const systemTokens = countTokens(systemPrompt)
    return {
      tokens: messagesTokens.tokens + systemTokens.tokens,
      characters: messagesTokens.characters + systemTokens.characters,
    }
  }

  return messagesTokens
}
