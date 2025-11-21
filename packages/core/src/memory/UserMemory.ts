/**
 * User memory system
 *
 * Provides high-level API for managing user memories across conversations.
 * Supports fact extraction, contradiction detection, and memory consolidation.
 */

import { Message } from '../agents/types'
import { LLMProvider } from '../agents/llm/LLMProvider'
import { MemoryStore } from './MemoryStore'
import { FactExtractor } from './FactExtractor'
import {
  MemoryItem,
  MemoryType,
  MemorySearchOptions,
  SaveMemoryOptions,
  ContradictionResult,
  ConsolidationResult,
} from './types'

/**
 * Configuration for UserMemory
 */
export interface UserMemoryConfig {
  /** Memory store implementation */
  store: MemoryStore
  /** LLM provider for fact extraction and analysis */
  llmProvider?: LLMProvider
  /** Whether to automatically extract facts from conversations */
  autoExtract?: boolean
  /** Whether to automatically detect contradictions */
  detectContradictions?: boolean
  /** Whether to automatically consolidate similar memories */
  autoConsolidate?: boolean
  /** Minimum confidence for auto-extracted facts */
  minConfidence?: number
}

/**
 * User memory system
 */
export class UserMemory {
  private store: MemoryStore
  private llmProvider?: LLMProvider
  private factExtractor?: FactExtractor
  private _autoExtract: boolean
  private detectContradictions: boolean
  private autoConsolidate: boolean

  constructor(config: UserMemoryConfig) {
    this.store = config.store
    this.llmProvider = config.llmProvider
    this._autoExtract = config.autoExtract ?? false
    this.detectContradictions = config.detectContradictions ?? true
    this.autoConsolidate = config.autoConsolidate ?? false

    // Initialize fact extractor if LLM provider is available
    if (this.llmProvider) {
      this.factExtractor = new FactExtractor({
        llmProvider: this.llmProvider,
        minConfidence: config.minConfidence ?? 0.6,
      })
    }
  }

  /**
   * Add a memory item
   * @param userId - User ID
   * @param content - Memory content
   * @param type - Memory type
   * @param options - Save options
   * @returns The saved memory item
   */
  async addMemory(
    userId: string,
    content: string,
    type: MemoryType,
    options?: SaveMemoryOptions & {
      entityName?: string
      entityType?: string
    }
  ): Promise<MemoryItem> {
    const memory = await this.store.save(
      {
        userId,
        content,
        type,
        entityName: options?.entityName,
        entityType: options?.entityType,
        importance: options?.importance ?? 0.5,
        confidence: options?.confidence ?? 0.8,
        source: options?.source,
        metadata: options?.metadata,
      },
      options
    )

    return memory
  }

  /**
   * Extract and save memories from conversation messages
   * @param userId - User ID
   * @param messages - Conversation messages
   * @param source - Optional source identifier
   * @returns Array of saved memory items
   */
  async extractFromConversation(
    userId: string,
    messages: Message[],
    source?: string
  ): Promise<MemoryItem[]> {
    if (!this.factExtractor) {
      throw new Error('LLM provider required for fact extraction')
    }

    // Extract facts
    const result = await this.factExtractor.extract(messages)

    if (!result.success) {
      throw new Error(result.error || 'Fact extraction failed')
    }

    const savedMemories: MemoryItem[] = []

    // Save extracted facts
    for (const fact of result.facts) {
      // Check for contradictions if enabled
      if (this.detectContradictions) {
        const contradiction = await this.checkContradiction(userId, fact.content)
        if (contradiction.hasContradiction) {
          // Handle contradiction based on resolution strategy
          if (contradiction.resolution === 'replace' && contradiction.existingMemory) {
            await this.store.delete(contradiction.existingMemory.id)
          } else if (contradiction.resolution === 'keep_existing') {
            continue // Skip this fact
          }
        }
      }

      const memory = await this.addMemory(
        userId,
        fact.content,
        fact.type,
        {
          importance: fact.importance,
          confidence: fact.confidence,
          source,
          entityName: fact.entityName,
          entityType: fact.entityType,
        }
      )

      savedMemories.push(memory)
    }

    // Save entity memories
    for (const entity of result.entities) {
      const memory = await this.addMemory(
        userId,
        entity.context,
        'entity',
        {
          importance: 0.7,
          confidence: entity.confidence,
          source,
          entityName: entity.name,
          entityType: entity.type,
        }
      )

      savedMemories.push(memory)
    }

    // Auto-consolidate if enabled
    if (this.autoConsolidate) {
      await this.consolidateMemories(userId)
    }

    return savedMemories
  }

  /**
   * Get memory by ID
   * @param memoryId - Memory ID
   * @returns Memory item or null
   */
  async getMemory(memoryId: string): Promise<MemoryItem | null> {
    return this.store.get(memoryId)
  }

  /**
   * Search memories
   * @param userId - User ID
   * @param options - Search options
   * @returns Array of matching memories
   */
  async searchMemories(
    userId: string,
    options?: MemorySearchOptions
  ): Promise<MemoryItem[]> {
    return this.store.search(userId, options)
  }

  /**
   * Get all memories for a user
   * @param userId - User ID
   * @returns Array of memory items
   */
  async getUserMemories(userId: string): Promise<MemoryItem[]> {
    return this.store.getByUser(userId)
  }

  /**
   * Get memories by type
   * @param userId - User ID
   * @param type - Memory type
   * @returns Array of memory items
   */
  async getMemoriesByType(
    userId: string,
    type: MemoryType
  ): Promise<MemoryItem[]> {
    return this.store.getByType(userId, type)
  }

  /**
   * Get memories by entity
   * @param userId - User ID
   * @param entityName - Entity name
   * @returns Array of memory items
   */
  async getMemoriesByEntity(
    userId: string,
    entityName: string
  ): Promise<MemoryItem[]> {
    return this.store.getByEntity(userId, entityName)
  }

  /**
   * Update a memory
   * @param memoryId - Memory ID
   * @param content - New content
   * @param importance - New importance score
   * @returns Updated memory or null
   */
  async updateMemory(
    memoryId: string,
    updates: {
      content?: string
      importance?: number
      confidence?: number
    }
  ): Promise<MemoryItem | null> {
    return this.store.update(memoryId, updates)
  }

  /**
   * Delete a memory
   * @param memoryId - Memory ID
   * @returns True if deleted
   */
  async deleteMemory(memoryId: string): Promise<boolean> {
    return this.store.delete(memoryId)
  }

  /**
   * Delete all memories for a user
   * @param userId - User ID
   * @returns Number of memories deleted
   */
  async deleteUserMemories(userId: string): Promise<number> {
    return this.store.deleteByUser(userId)
  }

  /**
   * Check for contradictions with existing memories
   * @param userId - User ID
   * @param newContent - New memory content
   * @returns Contradiction result
   */
  async checkContradiction(
    userId: string,
    newContent: string
  ): Promise<ContradictionResult> {
    if (!this.llmProvider) {
      return {
        hasContradiction: false,
        confidence: 0,
      }
    }

    // Get existing memories
    const existingMemories = await this.getUserMemories(userId)

    if (existingMemories.length === 0) {
      return {
        hasContradiction: false,
        confidence: 1.0,
      }
    }

    // Use LLM to detect contradictions
    const prompt = `Analyze if the following new statement contradicts any existing memories:

NEW STATEMENT: ${newContent}

EXISTING MEMORIES:
${existingMemories.map((m, i) => `${i + 1}. ${m.content}`).join('\n')}

Respond in JSON format:
{
  "hasContradiction": true/false,
  "contradictingMemoryIndex": number (1-based index, or null if no contradiction),
  "explanation": "explanation of the contradiction",
  "confidence": 0.0-1.0,
  "resolution": "keep_existing|replace|merge|keep_both"
}`

    try {
      const response = await this.llmProvider.chat({
        messages: [
          {
            role: 'system',
            content:
              'You are an expert at detecting contradictions in statements.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
      })

      const jsonMatch = response.content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        return { hasContradiction: false, confidence: 0 }
      }

      const result = JSON.parse(jsonMatch[0])

      return {
        hasContradiction: result.hasContradiction,
        existingMemory:
          result.contradictingMemoryIndex !== null
            ? existingMemories[result.contradictingMemoryIndex - 1]
            : undefined,
        explanation: result.explanation,
        confidence: result.confidence,
        resolution: result.resolution,
      }
    } catch (error) {
      return {
        hasContradiction: false,
        confidence: 0,
      }
    }
  }

  /**
   * Consolidate similar memories for a user
   * @param userId - User ID
   * @returns Consolidation results
   */
  async consolidateMemories(userId: string): Promise<ConsolidationResult[]> {
    if (!this.llmProvider) {
      return []
    }

    const memories = await this.getUserMemories(userId)
    const results: ConsolidationResult[] = []

    // Group memories by type
    const memoryGroups = new Map<MemoryType, MemoryItem[]>()
    for (const memory of memories) {
      if (!memoryGroups.has(memory.type)) {
        memoryGroups.set(memory.type, [])
      }
      memoryGroups.get(memory.type)!.push(memory)
    }

    // Consolidate each group
    for (const [_type, groupMemories] of memoryGroups) {
      if (groupMemories.length < 2) {
        continue
      }

      // Find similar memories to consolidate
      const consolidated = await this.findAndConsolidateSimilar(
        userId,
        groupMemories
      )
      results.push(...consolidated)
    }

    return results
  }

  /**
   * Find and consolidate similar memories
   */
  private async findAndConsolidateSimilar(
    userId: string,
    memories: MemoryItem[]
  ): Promise<ConsolidationResult[]> {
    const results: ConsolidationResult[] = []

    if (!this.llmProvider || memories.length < 2) {
      return results
    }

    // Simple similarity check - compare each pair
    for (let i = 0; i < memories.length - 1; i++) {
      for (let j = i + 1; j < memories.length; j++) {
        const mem1 = memories[i]
        const mem2 = memories[j]

        // Skip if either memory is undefined
        if (!mem1 || !mem2) {
          continue
        }

        // Use LLM to check if memories should be consolidated
        const shouldConsolidate = await this.shouldConsolidateMemories(
          mem1,
          mem2
        )

        if (shouldConsolidate.shouldMerge) {
          // Create consolidated memory
          const consolidated = await this.addMemory(
            userId,
            shouldConsolidate.mergedContent || mem1.content,
            mem1.type,
            {
              importance: Math.max(mem1.importance, mem2.importance),
              confidence: (mem1.confidence + mem2.confidence) / 2,
              source: `consolidated:${mem1.id}:${mem2.id}`,
            }
          )

          // Delete original memories
          await this.deleteMemory(mem1.id)
          await this.deleteMemory(mem2.id)

          results.push({
            consolidated: true,
            consolidatedMemory: consolidated,
            originalMemories: [mem1, mem2],
            explanation: shouldConsolidate.explanation,
          })
        }
      }
    }

    return results
  }

  /**
   * Check if two memories should be consolidated
   */
  private async shouldConsolidateMemories(
    mem1: MemoryItem,
    mem2: MemoryItem
  ): Promise<{
    shouldMerge: boolean
    mergedContent?: string
    explanation?: string
  }> {
    if (!this.llmProvider) {
      return { shouldMerge: false }
    }

    const prompt = `Should these two memories be consolidated into one?

MEMORY 1: ${mem1.content}
MEMORY 2: ${mem2.content}

Respond in JSON format:
{
  "shouldMerge": true/false,
  "mergedContent": "consolidated content (if shouldMerge is true)",
  "explanation": "reason for the decision"
}`

    try {
      const response = await this.llmProvider.chat({
        messages: [
          {
            role: 'system',
            content:
              'You are an expert at identifying and merging similar information.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
      })

      const jsonMatch = response.content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        return { shouldMerge: false }
      }

      return JSON.parse(jsonMatch[0])
    } catch (error) {
      return { shouldMerge: false }
    }
  }

  /**
   * Clean up expired memories
   * @returns Number of memories removed
   */
  async cleanup(): Promise<number> {
    return this.store.cleanup()
  }

  /**
   * Get memory statistics
   */
  async getStats() {
    return this.store.getStats()
  }

  /**
   * Close the memory system
   */
  async close(): Promise<void> {
    await this.store.close()
  }
}
