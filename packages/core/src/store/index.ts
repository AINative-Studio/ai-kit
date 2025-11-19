/**
 * Conversation Store
 *
 * Provides a unified interface for persisting conversations across different backends.
 * Supports Memory, Redis, and ZeroDB storage with configurable TTL and metadata.
 *
 * @example
 * ```typescript
 * import { createStore } from '@ainative/ai-kit-core/store'
 *
 * // Create a memory store
 * const store = createStore({ type: 'memory' })
 *
 * // Save a conversation
 * await store.save('conversation-1', [
 *   { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
 *   { id: '2', role: 'assistant', content: 'Hi!', timestamp: Date.now() }
 * ])
 *
 * // Load a conversation
 * const conversation = await store.load('conversation-1')
 * console.log(conversation?.messages)
 *
 * // Append messages
 * await store.append('conversation-1', [
 *   { id: '3', role: 'user', content: 'How are you?', timestamp: Date.now() }
 * ])
 *
 * // Delete a conversation
 * await store.delete('conversation-1')
 * ```
 *
 * @module store
 */

// Core classes
export { ConversationStore } from './ConversationStore'
export { MemoryStore } from './MemoryStore'
export { RedisStore } from './RedisStore'
export { ZeroDBStore } from './ZeroDBStore'

// Factory and utilities
export { createStore, isMemoryStore, isRedisStore, isZeroDBStore } from './createStore'

// Types
export type {
  Conversation,
  ConversationMetadata,
  StoreBackend,
  StoreConfig,
  BaseStoreConfig,
  MemoryStoreConfig,
  RedisStoreConfig,
  ZeroDBStoreConfig,
  SaveOptions,
  AppendOptions,
  LoadOptions,
  StoreStats,
} from './types'
