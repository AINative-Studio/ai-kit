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

// NOTE: Types are exported via individual module exports below to avoid duplicates
// Do NOT use export * from './types' as it causes duplicate export errors

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
  ToolDefinition,
  ToolCall,
  ToolResult,
  ExecutionConfig,
  ExecutionResult,
  StreamingExecutionConfig,
  StreamingExecutionResult,
  SwarmEvents,
} from './agents'
export type {
  AgentContext,
} from './types'

// Store - export only memory-based stores (no Redis)
export { ConversationStore } from './store/ConversationStore'
export { MemoryStore as ConvMemoryStore } from './store/MemoryStore'
export { ZeroDBStore } from './store/ZeroDBStore'
export { createStore, isMemoryStore, isZeroDBStore } from './store/createStore'
// Export store types explicitly to avoid MemoryStoreConfig conflict with memory/types
export type {
  Conversation,
  BaseStoreConfig,
  MemoryStoreConfig as StoreMemoryConfig,
  ZeroDBStoreConfig,
  StoreConfig,
} from './store/types'

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
// Export memory types explicitly to avoid MemoryStoreConfig conflict with store/types
export type {
  MemoryItem,
  MemorySearchOptions,
  MemoryType,
  MemoryConfig,
  MemoryStoreConfig as MemMemoryStoreConfig,
  BaseMemoryStoreConfig,
  InMemoryMemoryStoreConfig,
  ZeroDBMemoryStoreConfig,
  FactExtractionResult,
  EntityMention,
  MemoryStoreStats,
  SaveMemoryOptions,
  UpdateMemoryOptions,
} from './memory/types'

// Session - export only in-memory and ZeroDB stores (no Redis)
export { SessionManager } from './session/SessionManager'
export { InMemorySessionStore } from './session/InMemorySessionStore'
export { ZeroDBSessionStore } from './session/ZeroDBSessionStore'
// Export session types explicitly to avoid StorageBackend conflict
export type {
  Session,
  SessionData,
  SessionConfig,
  BaseSessionConfig,
  InMemorySessionConfig,
  ZeroDBSessionConfig,
  SessionEvent,
  StorageBackend as SessionStorageBackend,
} from './session/types'

// Authentication - browser-safe auth (uses localStorage or sessionStorage)
export { AINativeAuthProvider } from './auth/AINativeAuthProvider'
export {
  AuthError,
  AuthErrorType,
  AuthMethod,
  AuthStatus,
  StorageStrategy,
  AuthEventType
} from './auth/types'
export type * from './auth/types'

// ZeroDB - cloud-based database client (browser-safe)
export { ZeroDBClient } from './zerodb/ZeroDBClient'
export { QueryBuilder as ZeroDBQueryBuilder } from './zerodb/QueryBuilder'
// Export ZeroDB types explicitly to avoid BatchOperation conflict with RLHF
export type {
  ZeroDBConfig,
  PoolConfig,
  QueryOptions,
  BatchOperation as ZeroDBBatchOperation,
  BatchOperationType,
  RetryConfig as ZeroDBRetryConfig,
  FilterCondition,
  Filter,
  SortSpec,
  PaginationOptions,
  InsertOptions,
  UpdateOptions,
  DeleteOptions,
  TransactionOptions,
} from './zerodb/types'

// RLHF - export only memory storage (no local file storage)
export { RLHFLogger } from './rlhf/RLHFLogger'
export { RLHFInstrumentation } from './rlhf/RLHFInstrumentation'
export { MemoryStorage as RLHFMemoryStorage } from './rlhf/storage/MemoryStorage'
export { ZeroDBStorage as RLHFZeroDBStorage } from './rlhf/storage/ZeroDBStorage'
// Export RLHF types explicitly to avoid StorageBackend and BatchOperation conflicts
export type {
  RLHFConfig,
  FeedbackData,
  Feedback,
  InteractionLog,
  FeedbackSession,
  FeedbackStats,
  IStorageBackend,
  BatchOperation as RLHFBatchOperation,
  ExportOptions,
  FeedbackFilter,
  AnalyticsResult,
  FeedbackType,
  StorageBackend as RLHFStorageBackend,
} from './rlhf/types'
export type {
  InstrumentationConfig,
  PerformanceMetrics as RLHFPerformanceMetrics,
  InstrumentationEvent,
  CapturedInteraction,
  ContextData,
  FeedbackEvent,
  ErrorEvent,
  InstrumentationMetrics,
} from './rlhf/instrumentation-types'

// Search - semantic search utilities
export { SemanticSearch } from './search/SemanticSearch'
export type * from './search/types'

// Design - design system constraints
export { DesignConstraints } from './design/DesignConstraints'
export type * from './design/types'

// Utils - helper utilities (exclude server-only utils)
export { RateLimiter } from './utils/RateLimiter'
// Export utils types explicitly to avoid StorageBackend, RateLimitRule, RetryConfig conflicts
export type {
  RateLimiterConfig,
  RateLimitRule as UtilsRateLimitRule,
  RateLimitStorage,
  StorageBackend as UtilsStorageBackend,
} from './utils/types'
export * from './utils/id'
