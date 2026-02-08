/**
 * Browser-compatible entry point for @ainative/ai-kit-core
 *
 * This entry point excludes all Node.js-only dependencies:
 * - No ioredis (Redis client)
 * - No fs (file system)
 * - No dns (DNS resolution)
 *
 * Use this entry point for browser, React, Vue, Svelte applications.
 *
 * Refs #106
 */

// Types - export first to establish base types
export * from './types'

// Streaming - browser-safe streaming utilities
export { AIStream } from './streaming'
export {
  countTokens,
  countMessageTokens,
  countMessagesTokens,
  calculateCost,
  estimateRequestTokens,
  MODEL_PRICING,
  type ModelName,
  type TokenCount,
} from './streaming'

// Agents - framework-agnostic AI agents
export {
  Agent,
  createAgent,
  AgentExecutor,
  executeAgent,
  StreamingAgentExecutor,
  streamAgentExecution,
  AgentSwarm,
  createAgentSwarm,
} from './agents'
export type {
  AgentConfig,
  AgentContext,
  AgentResult,
  ToolDefinition,
  ToolCall,
  ToolResult,
  ExecutionConfig,
  ExecutionResult,
  StreamingExecutionConfig,
  StreamingExecutionResult,
  SwarmEvents,
} from './agents'

// Store - export only memory-based stores (no Redis)
export { ConversationStore } from './store/ConversationStore'
export { MemoryStore as ConvMemoryStore } from './store/MemoryStore'
export { ZeroDBStore } from './store/ZeroDBStore'
export { createStore, isMemoryStore, isZeroDBStore } from './store/createStore'
export type * from './store/types'

// Context - token counting and context management
export {
  TokenCounter,
  tokenCounter,
  ContextManager,
  type ContextMessage,
  type TokenUsage,
  type ContextConfig,
  type TruncationStrategy,
  type TruncationStrategyType,
  type ModelType,
  MessageImportance,
  MODEL_TOKEN_LIMITS,
  MODEL_ENCODING_MAP,
} from './context'

// Summarization - conversation summarization
export {
  ConversationSummarizer,
  extractKeySentences,
  extractKeyPoints,
  createExtractiveSummary,
  extractKeywords,
  calculateDiversity,
} from './summarization'
export type * from './summarization/types'

// Memory - export only in-memory and ZeroDB stores (no Redis)
export { MemoryStore } from './memory/MemoryStore'
export { InMemoryMemoryStore } from './memory/InMemoryMemoryStore'
export { ZeroDBMemoryStore } from './memory/ZeroDBMemoryStore'
export { UserMemory } from './memory/UserMemory'
export { FactExtractor } from './memory/FactExtractor'
export type * from './memory/types'

// Session - export only in-memory and ZeroDB stores (no Redis)
export { SessionManager } from './session/SessionManager'
export { InMemorySessionStore } from './session/InMemorySessionStore'
export { ZeroDBSessionStore } from './session/ZeroDBSessionStore'
export type * from './session/types'

// Authentication - browser-safe auth (uses localStorage or sessionStorage)
export { AINativeAuthProvider } from './auth/AINativeAuthProvider'
export { AuthError, AuthErrorType } from './auth/errors'
export {
  AuthMethod,
  AuthStatus,
  StorageStrategy,
  AuthEventType
} from './auth/types'
export type * from './auth/types'

// ZeroDB - cloud-based database client (browser-safe)
export { ZeroDBClient } from './zerodb/ZeroDBClient'
export { ZeroDBQueryBuilder } from './zerodb/QueryBuilder'
export type * from './zerodb/types'

// RLHF - export only memory storage (no local file storage)
export { RLHFLogger } from './rlhf/RLHFLogger'
export { RLHFInstrumentation } from './rlhf/RLHFInstrumentation'
export { MemoryStorage as RLHFMemoryStorage } from './rlhf/storage/MemoryStorage'
export { ZeroDBStorage as RLHFZeroDBStorage } from './rlhf/storage/ZeroDBStorage'
// Export RLHF types
export type * from './rlhf/types'
export type * from './rlhf/instrumentation-types'

// Search - semantic search utilities
export { SemanticSearch } from './search/SemanticSearch'
export type * from './search/types'

// Design - design system constraints
export { DesignConstraints } from './design/DesignConstraints'
export type * from './design/types'

// Utils - helper utilities (exclude server-only utils)
export { RateLimiter } from './utils/RateLimiter'
export type * from './utils/types'
export * from './utils/id'
