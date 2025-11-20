/**
 * Fact extractor for user memory system
 *
 * Uses LLM to extract facts, preferences, entities, and other memory items
 * from conversations.
 */

import { LLMProvider } from '../agents/llm/LLMProvider'
import { Message } from '../agents/types'
import { FactExtractionResult, MemoryType } from './types'

/**
 * Configuration for fact extraction
 */
export interface FactExtractorConfig {
  /** LLM provider to use for extraction */
  llmProvider: LLMProvider
  /** Temperature for LLM calls (0-1) */
  temperature?: number
  /** Maximum tokens for LLM response */
  maxTokens?: number
  /** Minimum confidence score to include a fact (0-1) */
  minConfidence?: number
  /** Whether to extract entities */
  extractEntities?: boolean
  /** Whether to extract preferences */
  extractPreferences?: boolean
  /** Whether to extract goals */
  extractGoals?: boolean
}

/**
 * Fact extractor class
 */
export class FactExtractor {
  private config: Required<FactExtractorConfig>

  constructor(config: FactExtractorConfig) {
    this.config = {
      temperature: config.temperature ?? 0.2,
      maxTokens: config.maxTokens ?? 1000,
      minConfidence: config.minConfidence ?? 0.6,
      extractEntities: config.extractEntities ?? true,
      extractPreferences: config.extractPreferences ?? true,
      extractGoals: config.extractGoals ?? true,
      ...config,
    }
  }

  /**
   * Extract facts from messages
   * @param messages - Array of conversation messages
   * @returns Extraction result with facts and entities
   */
  async extract(messages: Message[]): Promise<FactExtractionResult> {
    try {
      // Build the extraction prompt
      const prompt = this.buildExtractionPrompt(messages)

      // Call LLM
      const response = await this.config.llmProvider.chat({
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(),
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: this.config.temperature,
        maxTokens: this.config.maxTokens,
      })

      // Parse the response
      const result = this.parseExtractionResult(response.content)

      // Filter by confidence
      result.facts = result.facts.filter(
        (f) => f.confidence >= this.config.minConfidence
      )
      result.entities = result.entities.filter(
        (e) => e.confidence >= this.config.minConfidence
      )

      return result
    } catch (error) {
      return {
        facts: [],
        entities: [],
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Build extraction prompt from messages
   */
  private buildExtractionPrompt(messages: Message[]): string {
    const conversation = messages
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n')

    return `Analyze the following conversation and extract relevant information:

${conversation}

Extract the following:
1. Facts about the user (objective information)
2. User preferences (likes, dislikes, opinions)
3. Context information (background, situation)
${this.config.extractEntities ? '4. Named entities (people, places, organizations, etc.)' : ''}
${this.config.extractGoals ? '5. User goals and objectives' : ''}

Provide your response in JSON format.`
  }

  /**
   * Get system prompt for extraction
   */
  private getSystemPrompt(): string {
    return `You are an expert at extracting structured information from conversations.
Your task is to identify and extract facts, preferences, context, entities, and goals from user messages.

For each extracted item, provide:
- content: The actual information
- type: One of "fact", "preference", "context", "entity", or "goal"
- confidence: A score from 0 to 1 indicating your confidence in this extraction
- importance: A score from 0 to 1 indicating how important this information is

For entities, also include:
- name: The entity name
- entityType: The type of entity (person, place, organization, product, event, other)

Return your response in this exact JSON format:
{
  "facts": [
    {
      "content": "The extracted information",
      "type": "fact|preference|context|entity|goal",
      "entityName": "Entity name (for entity type only)",
      "entityType": "person|place|organization|product|event|other (for entity type only)",
      "confidence": 0.0-1.0,
      "importance": 0.0-1.0
    }
  ],
  "entities": [
    {
      "name": "Entity name",
      "type": "person|place|organization|product|event|other",
      "context": "Context where the entity was mentioned",
      "confidence": 0.0-1.0
    }
  ]
}

Guidelines:
- Extract only concrete, specific information
- Avoid extracting generic or trivial facts
- Higher confidence for explicit statements, lower for implied information
- Higher importance for unique, identifying information
- Only extract information explicitly stated or strongly implied
- For preferences, focus on expressed likes, dislikes, and opinions
- For goals, identify stated objectives or intentions
- For entities, identify proper nouns and specific references`
  }

  /**
   * Parse extraction result from LLM response
   */
  private parseExtractionResult(content: string): FactExtractionResult {
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }

      const parsed = JSON.parse(jsonMatch[0])

      return {
        facts: Array.isArray(parsed.facts) ? parsed.facts : [],
        entities: Array.isArray(parsed.entities) ? parsed.entities : [],
        success: true,
      }
    } catch (error) {
      return {
        facts: [],
        entities: [],
        success: false,
        error: error instanceof Error ? error.message : 'Failed to parse response',
      }
    }
  }

  /**
   * Extract facts from a single message
   * @param message - Single message to extract from
   * @returns Extraction result
   */
  async extractFromMessage(message: Message): Promise<FactExtractionResult> {
    return this.extract([message])
  }

  /**
   * Deduplicate extracted facts
   * @param facts - Array of facts to deduplicate
   * @returns Deduplicated array of facts
   */
  deduplicateFacts(
    facts: Array<{
      content: string
      type: MemoryType
      confidence: number
      importance: number
    }>
  ): Array<{
    content: string
    type: MemoryType
    confidence: number
    importance: number
  }> {
    const seen = new Set<string>()
    const unique: typeof facts = []

    for (const fact of facts) {
      // Normalize content for comparison
      const normalized = fact.content.toLowerCase().trim()

      if (!seen.has(normalized)) {
        seen.add(normalized)
        unique.push(fact)
      } else {
        // If duplicate, keep the one with higher confidence
        const existingIndex = unique.findIndex(
          (f) => f.content.toLowerCase().trim() === normalized
        )
        if (
          existingIndex !== -1 &&
          fact.confidence > unique[existingIndex].confidence
        ) {
          unique[existingIndex] = fact
        }
      }
    }

    return unique
  }
}
