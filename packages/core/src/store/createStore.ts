/**
 * Factory function for creating conversation stores
 *
 * Provides a type-safe way to create store instances with configuration validation.
 */

import { ConversationStore } from './ConversationStore'
import { MemoryStore } from './MemoryStore'
import { RedisStore } from './RedisStore'
import { ZeroDBStore } from './ZeroDBStore'
import { StoreConfig } from './types'

/**
 * Create a conversation store based on configuration
 *
 * @param config - Store configuration
 * @returns Configured conversation store instance
 *
 * @example
 * ```typescript
 * // Create a memory store
 * const store = createStore({ type: 'memory', maxConversations: 100 })
 *
 * // Create a Redis store
 * const store = createStore({
 *   type: 'redis',
 *   host: 'localhost',
 *   port: 6379,
 *   defaultTTL: 3600
 * })
 *
 * // Create a ZeroDB store
 * const store = createStore({
 *   type: 'zerodb',
 *   projectId: 'my-project',
 *   apiKey: 'my-api-key',
 *   tableName: 'conversations'
 * })
 * ```
 */
export function createStore(config: StoreConfig): ConversationStore {
  // Validate configuration
  validateConfig(config)

  switch (config.type) {
    case 'memory':
      return new MemoryStore(config)

    case 'redis':
      return new RedisStore(config)

    case 'zerodb':
      return new ZeroDBStore(config)

    default:
      // This should never happen due to TypeScript's type checking
      throw new Error(`Unknown store type: ${(config as any).type}`)
  }
}

/**
 * Validate store configuration
 */
function validateConfig(config: StoreConfig): void {
  if (!config || typeof config !== 'object') {
    throw new Error('Store configuration must be an object')
  }

  if (!('type' in config)) {
    throw new Error('Store configuration must include a "type" field')
  }

  const validTypes = ['memory', 'redis', 'zerodb']
  if (!validTypes.includes(config.type)) {
    throw new Error(
      `Invalid store type: ${config.type}. Must be one of: ${validTypes.join(', ')}`
    )
  }

  // Validate type-specific required fields
  switch (config.type) {
    case 'memory':
      validateMemoryConfig(config)
      break

    case 'redis':
      validateRedisConfig(config)
      break

    case 'zerodb':
      validateZeroDBConfig(config)
      break
  }

  // Validate common fields
  if (config.defaultTTL !== undefined) {
    if (typeof config.defaultTTL !== 'number' || config.defaultTTL < 0) {
      throw new Error('defaultTTL must be a non-negative number')
    }
  }

  if (config.namespace !== undefined) {
    if (typeof config.namespace !== 'string' || config.namespace.length === 0) {
      throw new Error('namespace must be a non-empty string')
    }
  }
}

/**
 * Validate memory store configuration
 */
function validateMemoryConfig(config: StoreConfig): void {
  if (config.type !== 'memory') return

  if (config.maxConversations !== undefined) {
    if (
      typeof config.maxConversations !== 'number' ||
      config.maxConversations <= 0
    ) {
      throw new Error('maxConversations must be a positive number')
    }
  }
}

/**
 * Validate Redis store configuration
 */
function validateRedisConfig(config: StoreConfig): void {
  if (config.type !== 'redis') return

  // Either url OR host/port must be provided
  if (!config.url && !config.host) {
    throw new Error('Redis configuration must include either "url" or "host"')
  }

  if (config.port !== undefined) {
    if (typeof config.port !== 'number' || config.port <= 0 || config.port > 65535) {
      throw new Error('Redis port must be between 1 and 65535')
    }
  }

  if (config.db !== undefined) {
    if (typeof config.db !== 'number' || config.db < 0) {
      throw new Error('Redis db must be a non-negative number')
    }
  }
}

/**
 * Validate ZeroDB store configuration
 */
function validateZeroDBConfig(config: StoreConfig): void {
  if (config.type !== 'zerodb') return

  if (!config.projectId || (typeof config.projectId === 'string' && config.projectId.length === 0)) {
    throw new Error('ZeroDB configuration must include "projectId"')
  }

  if (typeof config.projectId !== 'string') {
    throw new Error('ZeroDB projectId must be a non-empty string')
  }

  if (!config.apiKey || (typeof config.apiKey === 'string' && config.apiKey.length === 0)) {
    throw new Error('ZeroDB configuration must include "apiKey"')
  }

  if (typeof config.apiKey !== 'string') {
    throw new Error('ZeroDB apiKey must be a non-empty string')
  }

  if (config.tableName !== undefined) {
    if (typeof config.tableName !== 'string' || config.tableName.length === 0) {
      throw new Error('ZeroDB tableName must be a non-empty string')
    }
  }
}

/**
 * Type guard to check if a store is a MemoryStore
 */
export function isMemoryStore(store: ConversationStore): store is MemoryStore {
  return store instanceof MemoryStore
}

/**
 * Type guard to check if a store is a RedisStore
 */
export function isRedisStore(store: ConversationStore): store is RedisStore {
  return store instanceof RedisStore
}

/**
 * Type guard to check if a store is a ZeroDBStore
 */
export function isZeroDBStore(store: ConversationStore): store is ZeroDBStore {
  return store instanceof ZeroDBStore
}
