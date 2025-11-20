/**
 * Semantic search implementation for conversation history
 *
 * Provides vector-based semantic search using OpenAI embeddings API.
 * Supports similarity search, ranking, and filtering across conversations.
 */

import OpenAI from 'openai'
import { Message } from '../types'
import { ConversationStore } from '../store/ConversationStore'
import {
  EmbeddingConfig,
  MessageWithEmbedding,
  SearchOptions,
  SearchResult,
  SimilarMessageOptions,
  ConversationSearchOptions,
  BatchEmbeddingRequest,
  BatchEmbeddingResponse,
  EmbeddingCacheEntry,
  SearchStats,
  SearchFilter,
  SimilarityScore,
  EmbeddingModel,
} from './types'

/**
 * Semantic search engine for conversation messages
 */
export class SemanticSearch {
  private openai: OpenAI
  private config: Required<Omit<EmbeddingConfig, 'apiKey'>>
  private store: ConversationStore
  private embeddingCache: Map<string, EmbeddingCacheEntry>
  private stats: SearchStats

  constructor(store: ConversationStore, config: EmbeddingConfig) {
    if (!config.apiKey) {
      throw new Error('OpenAI API key is required')
    }

    this.store = store
    this.openai = new OpenAI({
      apiKey: config.apiKey,
      maxRetries: config.maxRetries ?? 3,
      timeout: config.timeout ?? 30000,
    })

    this.config = {
      model: config.model ?? 'text-embedding-3-small',
      batchSize: config.batchSize ?? 100,
      dimensions: config.dimensions,
      maxRetries: config.maxRetries ?? 3,
      timeout: config.timeout ?? 30000,
    }

    this.embeddingCache = new Map()
    this.stats = {
      totalMessages: 0,
      totalConversations: 0,
      totalEmbeddings: 0,
      cacheHitRate: 0,
      avgEmbeddingTime: 0,
    }
  }

  /**
   * Generate embedding for a single text
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    const cacheKey = this.getCacheKey(text, this.config.model)
    const cached = this.embeddingCache.get(cacheKey)

    if (cached && !this.isCacheExpired(cached)) {
      return cached.embedding
    }

    const startTime = Date.now()

    try {
      const response = await this.openai.embeddings.create({
        model: this.config.model,
        input: text,
        dimensions: this.config.dimensions,
      })

      const embedding = response.data[0].embedding
      const duration = Date.now() - startTime

      // Update cache
      this.embeddingCache.set(cacheKey, {
        text,
        embedding,
        model: this.config.model,
        cachedAt: Date.now(),
        ttl: 3600000, // 1 hour
      })

      // Update stats
      this.stats.totalEmbeddings++
      this.updateAvgEmbeddingTime(duration)

      return embedding
    } catch (error) {
      throw new Error(
        `Failed to generate embedding: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  /**
   * Generate embeddings for multiple texts in batches
   */
  async generateBatchEmbeddings(
    request: BatchEmbeddingRequest
  ): Promise<BatchEmbeddingResponse> {
    const { texts, model, dimensions } = request
    const embedModel = model ?? this.config.model
    const embedDimensions = dimensions ?? this.config.dimensions

    if (texts.length === 0) {
      return {
        embeddings: [],
        model: embedModel,
        usage: { promptTokens: 0, totalTokens: 0 },
      }
    }

    const embeddings: number[][] = []
    let totalPromptTokens = 0
    let totalTokens = 0

    // Process in batches
    for (let i = 0; i < texts.length; i += this.config.batchSize) {
      const batch = texts.slice(i, i + this.config.batchSize)
      const batchEmbeddings: number[][] = []

      // Check cache first
      const uncachedTexts: string[] = []
      const uncachedIndices: number[] = []

      batch.forEach((text, index) => {
        const cacheKey = this.getCacheKey(text, embedModel)
        const cached = this.embeddingCache.get(cacheKey)

        if (cached && !this.isCacheExpired(cached)) {
          batchEmbeddings[index] = cached.embedding
        } else {
          uncachedTexts.push(text)
          uncachedIndices.push(index)
        }
      })

      // Generate embeddings for uncached texts
      if (uncachedTexts.length > 0) {
        const response = await this.openai.embeddings.create({
          model: embedModel,
          input: uncachedTexts,
          dimensions: embedDimensions,
        })

        uncachedIndices.forEach((index, i) => {
          const embedding = response.data[i].embedding
          batchEmbeddings[index] = embedding

          // Cache the result
          const text = uncachedTexts[i]
          this.embeddingCache.set(this.getCacheKey(text, embedModel), {
            text,
            embedding,
            model: embedModel,
            cachedAt: Date.now(),
            ttl: 3600000,
          })
        })

        totalPromptTokens += response.usage.prompt_tokens
        totalTokens += response.usage.total_tokens
        this.stats.totalEmbeddings += uncachedTexts.length
      }

      embeddings.push(...batchEmbeddings)
    }

    this.updateCacheHitRate()

    return {
      embeddings,
      model: embedModel,
      usage: {
        promptTokens: totalPromptTokens,
        totalTokens,
      },
    }
  }

  /**
   * Search messages by semantic similarity
   */
  async searchMessages(
    query: string,
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    const {
      topK = 10,
      threshold = 0.0,
      filter,
      includeQuery = false,
    } = options

    // Generate query embedding
    const queryEmbedding = await this.generateEmbedding(query)

    // Get messages from store based on filter
    const messages = await this.getFilteredMessages(filter)

    if (messages.length === 0) {
      return []
    }

    // Generate embeddings for all messages
    const messageEmbeddings = await this.generateBatchEmbeddings({
      texts: messages.map((m) => m.content),
      model: this.config.model,
      dimensions: this.config.dimensions,
    })

    // Calculate similarities and create results
    const results: SearchResult[] = []

    messages.forEach((message, index) => {
      const embedding = messageEmbeddings.embeddings[index]
      const similarity = this.cosineSimilarity(queryEmbedding, embedding)

      if (similarity >= threshold) {
        results.push({
          message,
          similarity: {
            score: similarity,
            distance: 1 - similarity,
            rank: 0, // Will be set after sorting
          },
          conversationId: (message as any).conversationId,
        })
      }
    })

    // Sort by similarity (descending)
    results.sort((a, b) => b.similarity.score - a.similarity.score)

    // Set ranks and limit results
    const topResults = results.slice(0, topK)
    topResults.forEach((result, index) => {
      result.similarity.rank = index + 1
    })

    return topResults
  }

  /**
   * Find similar messages to a given message
   */
  async findSimilarMessages(
    messageId: string,
    options: SimilarMessageOptions = {}
  ): Promise<SearchResult[]> {
    const {
      topK = 5,
      threshold = 0.5,
      includeSelf = false,
      filter,
    } = options

    // Find the source message
    const sourceMessage = await this.findMessageById(messageId)
    if (!sourceMessage) {
      throw new Error(`Message with id ${messageId} not found`)
    }

    // Search using the source message content
    const results = await this.searchMessages(sourceMessage.content, {
      topK: includeSelf ? topK : topK + 1,
      threshold,
      filter,
    })

    // Filter out the source message if not included
    const filteredResults = includeSelf
      ? results
      : results.filter((r) => r.message.id !== messageId)

    return filteredResults.slice(0, topK)
  }

  /**
   * Search across multiple conversations
   */
  async searchConversations(
    query: string,
    options: ConversationSearchOptions = {}
  ): Promise<SearchResult[]> {
    const {
      topK = 10,
      threshold = 0.0,
      filter,
      conversationIds,
      maxConversations,
    } = options

    // Get list of conversations to search
    let targetConversationIds: string[]

    if (conversationIds && conversationIds.length > 0) {
      targetConversationIds = conversationIds
    } else {
      const allConversationIds = await this.store.list()
      targetConversationIds = maxConversations
        ? allConversationIds.slice(0, maxConversations)
        : allConversationIds
    }

    // Update filter to include conversation IDs
    const updatedFilter: SearchFilter = {
      ...filter,
    }

    // Search messages
    const results = await this.searchMessages(query, {
      topK,
      threshold,
      filter: updatedFilter,
    })

    // Filter results by conversation IDs
    const filteredResults = conversationIds
      ? results.filter((r) =>
          conversationIds.includes(r.conversationId || '')
        )
      : results

    // Update stats
    this.stats.totalConversations = targetConversationIds.length

    return filteredResults
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length')
    }

    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB)

    if (denominator === 0) {
      return 0
    }

    return dotProduct / denominator
  }

  /**
   * Get filtered messages from the store
   */
  private async getFilteredMessages(
    filter?: SearchFilter
  ): Promise<(Message & { conversationId?: string })[]> {
    const conversationIds = await this.store.list()
    const allMessages: (Message & { conversationId?: string })[] = []

    for (const conversationId of conversationIds) {
      const conversation = await this.store.load(conversationId)

      if (!conversation) {
        continue
      }

      let messages = conversation.messages

      // Apply filters
      if (filter) {
        messages = messages.filter((message) => {
          // Filter by conversation ID
          if (
            filter.conversationId &&
            conversationId !== filter.conversationId
          ) {
            return false
          }

          // Filter by role
          if (filter.role && message.role !== filter.role) {
            return false
          }

          // Filter by date range
          if (filter.startDate && message.timestamp < filter.startDate) {
            return false
          }

          if (filter.endDate && message.timestamp > filter.endDate) {
            return false
          }

          return true
        })
      }

      // Add conversation ID to messages
      const messagesWithConvId = messages.map((m) => ({
        ...m,
        conversationId,
      }))

      allMessages.push(...messagesWithConvId)
    }

    this.stats.totalMessages = allMessages.length

    return allMessages
  }

  /**
   * Find a message by ID across all conversations
   */
  private async findMessageById(
    messageId: string
  ): Promise<Message | null> {
    const conversationIds = await this.store.list()

    for (const conversationId of conversationIds) {
      const conversation = await this.store.load(conversationId)

      if (!conversation) {
        continue
      }

      const message = conversation.messages.find((m) => m.id === messageId)

      if (message) {
        return message
      }
    }

    return null
  }

  /**
   * Generate cache key for an embedding
   */
  private getCacheKey(text: string, model: EmbeddingModel): string {
    // Simple hash function for the cache key
    const hash = this.simpleHash(text)
    return `${model}:${hash}`
  }

  /**
   * Simple hash function for cache keys
   */
  private simpleHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36)
  }

  /**
   * Check if a cache entry is expired
   */
  private isCacheExpired(entry: EmbeddingCacheEntry): boolean {
    if (!entry.ttl) {
      return false
    }

    return Date.now() - entry.cachedAt > entry.ttl
  }

  /**
   * Update average embedding time
   */
  private updateAvgEmbeddingTime(duration: number): void {
    const totalTime =
      (this.stats.avgEmbeddingTime || 0) * (this.stats.totalEmbeddings - 1) +
      duration
    this.stats.avgEmbeddingTime = totalTime / this.stats.totalEmbeddings
  }

  /**
   * Update cache hit rate
   */
  private updateCacheHitRate(): void {
    const totalRequests = this.stats.totalEmbeddings
    const cacheSize = this.embeddingCache.size

    if (totalRequests > 0) {
      this.stats.cacheHitRate = cacheSize / totalRequests
    }
  }

  /**
   * Get search statistics
   */
  getStats(): SearchStats {
    return { ...this.stats }
  }

  /**
   * Clear the embedding cache
   */
  clearCache(): void {
    this.embeddingCache.clear()
  }

  /**
   * Get the current cache size
   */
  getCacheSize(): number {
    return this.embeddingCache.size
  }
}
