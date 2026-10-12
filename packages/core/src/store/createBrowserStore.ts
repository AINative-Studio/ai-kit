/**
 * Browser-safe factory function for creating conversation stores.
 *
 * This is the subset of createStore() that src/browser.ts can safely
 * re-export: it never imports RedisStore, so this module (and everything
 * that imports it) has zero transitive dependency on 'ioredis'. The full
 * createStore() (memory + redis + zerodb) lives in ./createStore and is
 * only reachable via src/server.ts - see Refs #206.
 */

import { ConversationStore } from './ConversationStore'
import { MemoryStore } from './MemoryStore'
import { ZeroDBStore } from './ZeroDBStore'
import { StoreConfig } from './types'

/**
 * Create a conversation store based on configuration (browser-safe subset:
 * 'memory' and 'zerodb' only).
 *
 * @param config - Store configuration
 * @returns Configured conversation store instance
 *
 * @example
 * ```typescript
 * const store = createBrowserStore({ type: 'memory', maxConversations: 100 })
 * ```
 */
export function createBrowserStore(config: StoreConfig): ConversationStore {
  validateConfig(config)

  switch (config.type) {
    case 'memory':
      return new MemoryStore(config)

    case 'redis':
      throw new Error(
        'Redis stores require Node.js and are not available from the browser-safe entry point. ' +
          "Import createStore from '@ainative/ai-kit-core/server' instead."
      )

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

  switch (config.type) {
    case 'memory':
      validateMemoryConfig(config)
      break

    case 'zerodb':
      validateZeroDBConfig(config)
      break
  }

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
 * Type guard to check if a store is a ZeroDBStore
 */
export function isZeroDBStore(store: ConversationStore): store is ZeroDBStore {
  return store instanceof ZeroDBStore
}
