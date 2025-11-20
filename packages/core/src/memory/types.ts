/**
 * Type definitions for user memory system
 */

/**
 * Types of memory items
 */
export type MemoryType = 'fact' | 'preference' | 'context' | 'entity' | 'goal'

/**
 * Individual memory item
 */
export interface MemoryItem {
  /** Unique identifier for the memory item */
  id: string
  /** User ID this memory belongs to */
  userId: string
  /** Type of memory */
  type: MemoryType
  /** Memory content */
  content: string
  /** Optional entity name (for entity type memories) */
  entityName?: string
  /** Optional entity type (person, place, organization, etc.) */
  entityType?: string
  /** Timestamp when memory was created */
  createdAt: number
  /** Timestamp when memory was last updated */
  updatedAt: number
  /** Timestamp when memory was last accessed */
  lastAccessedAt: number
  /** TTL in seconds (0 = no expiration) */
  ttl?: number
  /** Priority/importance score (0-1) */
  importance: number
  /** Confidence score (0-1) */
  confidence: number
  /** Source of the memory (e.g., conversation ID) */
  source?: string
  /** Custom metadata */
  metadata?: Record<string, any>
}

/**
 * Entity mention in conversation
 */
export interface EntityMention {
  /** Entity name */
  name: string
  /** Entity type */
  type: 'person' | 'place' | 'organization' | 'product' | 'event' | 'other'
  /** Context around the mention */
  context: string
  /** Confidence score (0-1) */
  confidence: number
}

/**
 * Fact extraction result
 */
export interface FactExtractionResult {
  /** Extracted facts */
  facts: Array<{
    content: string
    type: MemoryType
    entityName?: string
    entityType?: string
    confidence: number
    importance: number
  }>
  /** Extracted entities */
  entities: EntityMention[]
  /** Whether extraction was successful */
  success: boolean
  /** Error message if extraction failed */
  error?: string
}

/**
 * Memory search options
 */
export interface MemorySearchOptions {
  /** Filter by memory type */
  type?: MemoryType
  /** Filter by entity name */
  entityName?: string
  /** Filter by entity type */
  entityType?: string
  /** Minimum importance score */
  minImportance?: number
  /** Minimum confidence score */
  minConfidence?: number
  /** Maximum age in seconds */
  maxAge?: number
  /** Maximum number of results */
  limit?: number
  /** Offset for pagination */
  offset?: number
  /** Whether to include expired memories */
  includeExpired?: boolean
}

/**
 * Memory configuration
 */
export interface MemoryConfig {
  /** Default TTL in seconds (0 = no expiration) */
  defaultTTL?: number
  /** Default importance score for new memories */
  defaultImportance?: number
  /** Default confidence score for new memories */
  defaultConfidence?: number
  /** Maximum number of memories to keep per user */
  maxMemoriesPerUser?: number
  /** Minimum importance score to keep a memory */
  minImportanceThreshold?: number
  /** Whether to automatically consolidate similar memories */
  autoConsolidate?: boolean
}

/**
 * Memory store statistics
 */
export interface MemoryStoreStats {
  /** Total number of memories */
  totalMemories: number
  /** Number of memories by type */
  memoriesByType: Record<MemoryType, number>
  /** Number of unique users */
  uniqueUsers: number
  /** Number of expired memories */
  expiredMemories?: number
  /** Storage size in bytes (if available) */
  storageSize?: number
}

/**
 * Options for saving a memory
 */
export interface SaveMemoryOptions {
  /** TTL in seconds (overrides default) */
  ttl?: number
  /** Importance score (0-1) */
  importance?: number
  /** Confidence score (0-1) */
  confidence?: number
  /** Source identifier */
  source?: string
  /** Custom metadata */
  metadata?: Record<string, any>
}

/**
 * Memory update options
 */
export interface UpdateMemoryOptions {
  /** New content */
  content?: string
  /** New importance score */
  importance?: number
  /** New confidence score */
  confidence?: number
  /** New TTL in seconds */
  ttl?: number
  /** Additional metadata to merge */
  metadata?: Record<string, any>
}

/**
 * Contradiction detection result
 */
export interface ContradictionResult {
  /** Whether a contradiction was detected */
  hasContradiction: boolean
  /** The existing memory that contradicts */
  existingMemory?: MemoryItem
  /** The new memory being added */
  newMemory?: Partial<MemoryItem>
  /** Explanation of the contradiction */
  explanation?: string
  /** Confidence in the contradiction detection (0-1) */
  confidence: number
  /** Suggested resolution strategy */
  resolution?: 'keep_existing' | 'replace' | 'merge' | 'keep_both'
}

/**
 * Memory consolidation result
 */
export interface ConsolidationResult {
  /** Whether memories were consolidated */
  consolidated: boolean
  /** The consolidated memory (if consolidation occurred) */
  consolidatedMemory?: MemoryItem
  /** Original memories that were consolidated */
  originalMemories: MemoryItem[]
  /** Explanation of the consolidation */
  explanation?: string
}

/**
 * Base configuration for memory stores
 */
export interface BaseMemoryStoreConfig {
  /** Default TTL in seconds (0 = no expiration) */
  defaultTTL?: number
  /** Namespace/prefix for keys */
  namespace?: string
  /** Memory configuration */
  memoryConfig?: MemoryConfig
}

/**
 * Backend type for memory store implementation
 */
export type MemoryStoreBackend = 'memory' | 'redis' | 'zerodb'

/**
 * Configuration for in-memory memory store
 */
export interface InMemoryMemoryStoreConfig extends BaseMemoryStoreConfig {
  type: 'memory'
  /** Maximum number of memories to store (LRU eviction) */
  maxMemories?: number
}

/**
 * Configuration for Redis memory store
 */
export interface RedisMemoryStoreConfig extends BaseMemoryStoreConfig {
  type: 'redis'
  /** Redis connection URL */
  url?: string
  /** Redis host */
  host?: string
  /** Redis port */
  port?: number
  /** Redis password */
  password?: string
  /** Redis database number */
  db?: number
  /** Key prefix for Redis keys */
  keyPrefix?: string
}

/**
 * Configuration for ZeroDB memory store
 */
export interface ZeroDBMemoryStoreConfig extends BaseMemoryStoreConfig {
  type: 'zerodb'
  /** ZeroDB project ID */
  projectId: string
  /** ZeroDB API key */
  apiKey: string
  /** Table name for memories */
  tableName?: string
}

/**
 * Union type for all memory store configurations
 */
export type MemoryStoreConfig =
  | InMemoryMemoryStoreConfig
  | RedisMemoryStoreConfig
  | ZeroDBMemoryStoreConfig
