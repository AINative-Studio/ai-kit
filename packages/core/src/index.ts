/**
 * @ainative/ai-kit-core
 * Framework-agnostic core for AI Kit
 */

// Types - export first to establish base types
export * from './types'

// Streaming - use explicit exports to avoid TokenCount conflict with context
export { AIStream } from './streaming'
export {
  countTokens,
  countMessageTokens,
  countMessagesTokens,
  calculateCost,
  estimateRequestTokens,
  MODEL_PRICING,
  type ModelName,
  // TokenCount from streaming (main one)
  type TokenCount,
} from './streaming'

// Store
export * from './store'

// Context - avoid re-exporting TokenCount which conflicts with streaming
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

// Summarization
export * from './summarization'

// Session - use explicit exports to avoid StorageBackend conflict with RLHF
export {
  SessionManager,
  InMemorySessionStore,
  RedisSessionStore,
  ZeroDBSessionStore,
  // StorageBackend from session (main one)
  StorageBackend,
  SessionEvent,
  ExpirationStrategy,
} from './session'
// Re-export other session types
export type {
  SessionConfig,
  SessionData,
  Session,
  SessionStore,
  SessionStats,
  CreateSessionOptions,
  UpdateSessionOptions,
  RefreshSessionOptions,
  ListSessionsOptions,
  SessionEventPayload,
} from './session/types'

// Authentication - use explicit exports to avoid AuthMethod conflict with types
export {
  AINativeAuthProvider,
  AuthError,
  AuthErrorType,
  // AuthMethod from auth (main enum)
  AuthMethod,
  AuthStatus,
  StorageStrategy,
  AuthEventType,
} from './auth'
export type {
  AuthCredentials,
  AuthConfig,
  AuthSession,
  TokenRefreshOptions,
  TokenValidationResult,
  AuthEventListener,
  AuthEvent,
  StorageAdapter,
  AuthResponse,
  RefreshResponse,
  ValidationResponse,
  APIKeyCredentials,
  OAuthCredentials,
  JWTCredentials,
  BaseCredentials,
  UserInfo,
} from './auth'

// RLHF - avoid re-exporting StorageBackend and PerformanceMetrics which conflict
export {
  RLHFLogger,
  RLHFInstrumentation,
  ZeroDBStorage as RLHFZeroDBStorage,
  MemoryStorage as RLHFMemoryStorage,
  LocalStorage as RLHFLocalStorage,
} from './rlhf'
// Re-export RLHF types excluding conflicting ones
export type {
  RLHFConfig,
  FeedbackData,
  Feedback,
  InteractionLog,
  FeedbackSession,
  FeedbackStats,
  IStorageBackend,
  InstrumentationConfig,
  BatchOperation,
  ExportOptions,
  FeedbackFilter,
  AnalyticsResult,
} from './rlhf'

// Design
export * from './design'
