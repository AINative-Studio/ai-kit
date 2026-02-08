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

// Export everything from browser (all browser-safe functionality)
export * from './browser'

// Server-only: Redis-based stores
export {
  RedisStore,
  type RedisStoreConfig,
} from './store/RedisStore'

export {
  RedisSessionStore,
  type RedisSessionConfig,
} from './session/RedisSessionStore'

export {
  RedisMemoryStore,
  type RedisMemoryStoreConfig,
} from './memory/RedisMemoryStore'

// Server-only: Local file storage for RLHF
export {
  LocalStorage as RLHFLocalStorage,
  type LocalStorageConfig as RLHFLocalStorageConfig,
} from './rlhf/storage/LocalStorage'
