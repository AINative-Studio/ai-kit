/**
 * Type definitions for conversation store
 */

import { Message } from '../types'

/**
 * Metadata about a conversation
 */
export interface ConversationMetadata {
  /** Unique conversation identifier */
  conversationId: string
  /** Timestamp when conversation was created */
  createdAt: number
  /** Timestamp when conversation was last updated */
  updatedAt: number
  /** Number of messages in the conversation */
  messageCount: number
  /** Optional TTL in seconds */
  ttl?: number
  /** Custom metadata */
  metadata?: Record<string, any>
}

/**
 * A conversation containing messages and metadata
 */
export interface Conversation {
  /** Unique conversation identifier */
  conversationId: string
  /** Array of messages in the conversation */
  messages: Message[]
  /** Conversation metadata */
  metadata: ConversationMetadata
}

/**
 * Backend type for store implementation
 */
export type StoreBackend = 'memory' | 'redis' | 'zerodb'

/**
 * Base configuration for all stores
 */
export interface BaseStoreConfig {
  /** Default TTL in seconds (0 = no expiration) */
  defaultTTL?: number
  /** Namespace/prefix for keys */
  namespace?: string
}

/**
 * Configuration for Memory store
 */
export interface MemoryStoreConfig extends BaseStoreConfig {
  type: 'memory'
  /** Maximum number of conversations to store (LRU eviction) */
  maxConversations?: number
}

/**
 * Configuration for Redis store
 */
export interface RedisStoreConfig extends BaseStoreConfig {
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
 * Configuration for ZeroDB store
 */
export interface ZeroDBStoreConfig extends BaseStoreConfig {
  type: 'zerodb'
  /** ZeroDB project ID */
  projectId: string
  /** ZeroDB API key */
  apiKey: string
  /** Table name for conversations */
  tableName?: string
}

/**
 * Union type for all store configurations
 */
export type StoreConfig = MemoryStoreConfig | RedisStoreConfig | ZeroDBStoreConfig

/**
 * Options for saving a conversation
 */
export interface SaveOptions {
  /** TTL in seconds (overrides default) */
  ttl?: number
  /** Custom metadata to merge */
  metadata?: Record<string, any>
}

/**
 * Options for appending messages
 */
export interface AppendOptions {
  /** Whether to update the updatedAt timestamp */
  updateTimestamp?: boolean
}

/**
 * Options for loading conversations
 */
export interface LoadOptions {
  /** Whether to include expired conversations */
  includeExpired?: boolean
}

/**
 * Statistics about the store
 */
export interface StoreStats {
  /** Total number of conversations */
  totalConversations: number
  /** Total number of messages across all conversations */
  totalMessages: number
  /** Number of expired conversations */
  expiredConversations?: number
  /** Storage size in bytes (if available) */
  storageSize?: number
}
