/**
 * Server/Node.js entry point for @ainative/ai-kit-core
 *
 * This entry point includes all Node.js-specific functionality:
 * - Redis-based stores (ioredis)
 * - File system storage (fs)
 * - DNS resolution (dns)
 *
 * Use this entry point for Node.js, Next.js API routes, Express servers, etc.
 *
 * Refs #106
 */

// Export everything from browser (all browser-safe functionality), except
// createStore - overridden below with the full (memory + redis + zerodb)
// version, since the browser-safe one throws for type: 'redis'.
export * from './browser'
export { createStore, isRedisStore } from './store/createStore'

// Server-only: Redis-based stores
export { RedisStore } from './store/RedisStore'
export type { RedisStoreConfig } from './store/types'

export { RedisSessionStore } from './session/RedisSessionStore'
export type { RedisSessionConfig } from './session/types'

export { RedisMemoryStore } from './memory/RedisMemoryStore'
export type { RedisMemoryStoreConfig } from './memory/types'

// Server-only: SessionManager itself (its private createStore() can select
// RedisSessionStore, and its optional AES encryption has no browser
// equivalent, so the whole class is server-only for now - see the comment
// in browser.ts).
export { SessionManager } from './session/SessionManager'

// Server-only: Local file storage for RLHF, and RLHFLogger itself (its
// createStorageBackend() can select LocalStorage, so the whole class is
// server-only for now - see the comment in browser.ts).
export { RLHFLogger } from './rlhf/RLHFLogger'
export {
  LocalStorage as RLHFLocalStorage,
  type LocalStorageConfig as RLHFLocalStorageConfig,
} from './rlhf/storage/LocalStorage'
