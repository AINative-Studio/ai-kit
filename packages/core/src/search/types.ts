/**
 * Type definitions for semantic search
 */

import { Message } from '../types'

/**
 * Supported OpenAI embedding models
 */
export type EmbeddingModel =
  | 'text-embedding-3-small'
  | 'text-embedding-3-large'
  | 'text-embedding-ada-002'

/**
 * Configuration for embeddings
 */
export interface EmbeddingConfig {
  /** OpenAI API key */
  apiKey: string
  /** Embedding model to use */
  model?: EmbeddingModel
  /** Batch size for embedding generation */
  batchSize?: number
  /** Dimensions for the embedding (only for text-embedding-3-* models) */
  dimensions?: number
  /** Maximum retries for API calls */
  maxRetries?: number
  /** Timeout in milliseconds */
  timeout?: number
}

/**
 * A message with its vector embedding
 */
export interface MessageWithEmbedding extends Message {
  /** Vector embedding of the message content */
  embedding: number[]
}

/**
 * Filter criteria for search
 */
export interface SearchFilter {
  /** Filter by conversation ID */
  conversationId?: string
  /** Filter by message role */
  role?: 'user' | 'assistant' | 'system'
  /** Filter by date range (start timestamp) */
  startDate?: number
  /** Filter by date range (end timestamp) */
  endDate?: number
  /** Filter by custom metadata */
  metadata?: Record<string, any>
}

/**
 * Options for search operations
 */
export interface SearchOptions {
  /** Number of results to return */
  topK?: number
  /** Minimum similarity threshold (0-1) */
  threshold?: number
  /** Filter criteria */
  filter?: SearchFilter
  /** Whether to include the query message in results */
  includeQuery?: boolean
}

/**
 * Similarity score with additional metadata
 */
export interface SimilarityScore {
  /** Cosine similarity score (0-1) */
  score: number
  /** Distance metric (1 - cosine similarity) */
  distance: number
  /** Rank in results (1-based) */
  rank: number
}

/**
 * Search result containing a message and its similarity score
 */
export interface SearchResult {
  /** The matched message */
  message: Message
  /** Similarity score and metadata */
  similarity: SimilarityScore
  /** Conversation ID the message belongs to */
  conversationId?: string
}

/**
 * Options for finding similar messages
 */
export interface SimilarMessageOptions {
  /** Number of similar messages to return */
  topK?: number
  /** Minimum similarity threshold (0-1) */
  threshold?: number
  /** Whether to include the source message in results */
  includeSelf?: boolean
  /** Filter criteria */
  filter?: SearchFilter
}

/**
 * Options for searching across conversations
 */
export interface ConversationSearchOptions extends SearchOptions {
  /** Specific conversation IDs to search within */
  conversationIds?: string[]
  /** Maximum number of conversations to search */
  maxConversations?: number
}

/**
 * Batch embedding request
 */
export interface BatchEmbeddingRequest {
  /** Array of texts to embed */
  texts: string[]
  /** Model to use for embeddings */
  model?: EmbeddingModel
  /** Dimensions for the embedding */
  dimensions?: number
}

/**
 * Batch embedding response
 */
export interface BatchEmbeddingResponse {
  /** Array of embeddings corresponding to input texts */
  embeddings: number[][]
  /** Model used for embeddings */
  model: string
  /** Total tokens used */
  usage: {
    promptTokens: number
    totalTokens: number
  }
}

/**
 * Cache entry for embeddings
 */
export interface EmbeddingCacheEntry {
  /** The original text */
  text: string
  /** The generated embedding */
  embedding: number[]
  /** Model used */
  model: string
  /** Timestamp when cached */
  cachedAt: number
  /** TTL in milliseconds */
  ttl?: number
}

/**
 * Statistics for semantic search operations
 */
export interface SearchStats {
  /** Total number of messages indexed */
  totalMessages: number
  /** Total number of conversations indexed */
  totalConversations: number
  /** Total number of embeddings generated */
  totalEmbeddings: number
  /** Cache hit rate (0-1) */
  cacheHitRate?: number
  /** Average embedding generation time (ms) */
  avgEmbeddingTime?: number
}
