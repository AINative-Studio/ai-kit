/**
 * Common types shared across the AI Kit core package.
 * This file serves as the single source of truth for frequently used types
 * to prevent duplicate type definitions that block DTS generation.
 */

/**
 * Token count information
 * Used for token counting and cost estimation across the framework
 */
export interface TokenCount {
  /**
   * Number of tokens
   */
  tokens: number;
  /**
   * Number of characters
   */
  characters: number;
  /**
   * Optional breakdown of token counts by component
   */
  breakdown?: {
    role?: number;
    name?: number;
    content?: number;
    functionCall?: number;
    toolCalls?: number;
  };
}

/**
 * Performance metrics for monitoring AI operations
 * Tracks latency, throughput, and other performance indicators
 * This is a union of all performance metric fields used across the AI Kit
 */
export interface PerformanceMetrics {
  // Agent metrics
  /**
   * Success rate (0-1)
   */
  successRate?: number;
  /**
   * Average task duration in milliseconds
   */
  averageTaskDuration?: number;
  /**
   * Total number of tasks completed
   */
  tasksCompleted?: number;
  /**
   * Total number of tasks failed
   */
  tasksFailed?: number;
  /**
   * Total cost incurred (optional)
   */
  totalCost?: number;
  /**
   * Total tokens used (optional)
   */
  totalTokens?: number;
  /**
   * System uptime in milliseconds (optional)
   */
  uptime?: number;
  /**
   * Error rate (0-1, optional)
   */
  errorRate?: number;
  /**
   * User satisfaction score (0-1, optional)
   */
  userSatisfaction?: number;

  // Streaming metrics
  /**
   * Response latency in milliseconds (optional)
   */
  latency?: number;
  /**
   * Time to first token in milliseconds (optional)
   */
  timeToFirstToken?: number;
  /**
   * Tokens per second throughput (optional)
   */
  tokensPerSecond?: number;
  /**
   * Total duration in milliseconds (optional)
   */
  totalDuration?: number;

  // RLHF instrumentation metrics
  /**
   * Total response time in milliseconds
   */
  totalResponseTime?: number;
  /**
   * Time to complete streaming in milliseconds
   */
  streamingTime?: number;
  /**
   * Number of tokens in prompt
   */
  promptTokenCount?: number;
  /**
   * Number of tokens in response
   */
  responseTokenCount?: number;
  /**
   * Network latency in milliseconds
   */
  networkLatency?: number;
  /**
   * Retry count
   */
  retryCount?: number;
  /**
   * Cache hit/miss indicator
   */
  cacheHit?: boolean;
}

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Rate limiting configuration
 * Consolidates rate limit settings across the framework
 */
export interface RateLimitConfig {
  /**
   * Enable/disable rate limiting
   */
  readonly enabled?: boolean;
  /**
   * Maximum number of calls/requests allowed
   */
  readonly maxCalls?: number;
  /**
   * Maximum requests per second
   */
  readonly requestsPerSecond?: number;
  /**
   * Maximum tokens per minute
   */
  readonly tokensPerMinute?: number;
  /**
   * Maximum concurrent requests
   */
  readonly concurrentRequests?: number;
  /**
   * Time window in milliseconds
   */
  readonly windowMs?: number;
  /**
   * Apply rate limit per user
   */
  readonly perUser?: boolean;
  /**
   * Apply rate limit per agent
   */
  readonly perAgent?: boolean;
  /**
   * Apply rate limit per IP address
   */
  readonly perIP?: boolean;
  /**
   * Global rate limit rule
   */
  readonly global?: RateLimitRule;
  /**
   * Per-endpoint rate limit rules
   */
  readonly perEndpoint?: Record<string, RateLimitRule>;
}

/**
 * Rate limit rule details
 */
export interface RateLimitRule {
  readonly requests: number;
  readonly window: number; // milliseconds
  readonly burst?: number;
  readonly strategy?: 'sliding-window' | 'fixed-window' | 'token-bucket';
}

/**
 * Retry configuration for failed requests
 * Handles retry logic across different components
 */
export interface RetryConfig {
  /**
   * Enable/disable retry logic
   */
  readonly enabled?: boolean;
  /**
   * Maximum number of retry attempts
   */
  readonly maxRetries?: number;
  /**
   * Maximum attempts (alias for maxRetries)
   */
  readonly maxAttempts?: number;
  /**
   * Initial delay before first retry in milliseconds
   */
  readonly initialDelay?: number;
  /**
   * Maximum delay between retries in milliseconds
   */
  readonly maxDelay?: number;
  /**
   * Backoff strategy
   */
  readonly backoff?: 'linear' | 'exponential' | 'constant';
  /**
   * Backoff multiplier for exponential backoff
   */
  readonly backoffMultiplier?: number;
  /**
   * Add jitter to retry delays
   */
  readonly jitter?: boolean;
  /**
   * HTTP status codes that should trigger a retry
   */
  readonly retryableStatusCodes?: readonly number[];
  /**
   * Error codes/messages that should trigger a retry
   */
  readonly retryableErrors?: readonly string[];
}

/**
 * Timeout configuration
 * Controls timeout settings for various operations
 */
export interface TimeoutConfig {
  /**
   * Default timeout in milliseconds
   */
  readonly default?: number;
  /**
   * Request timeout in milliseconds
   */
  readonly request?: number;
  /**
   * Request timeout (alias for backwards compatibility)
   */
  readonly requestTimeout?: number;
  /**
   * Response timeout in milliseconds
   */
  readonly response?: number;
  /**
   * Connection timeout in milliseconds
   */
  readonly connectionTimeout?: number;
  /**
   * Idle timeout in milliseconds
   */
  readonly idle?: number;
  /**
   * Idle timeout (alias)
   */
  readonly idleTimeout?: number;
}

/**
 * Authentication method types
 */
export type AuthMethod = 'api-key' | 'jwt' | 'oauth2' | 'basic' | 'bearer' | 'none' | 'custom';

/**
 * Authentication configuration
 * Handles authentication across tools and APIs
 */
export interface AuthenticationConfig {
  /**
   * Whether authentication is required
   */
  readonly required?: boolean;
  /**
   * Authentication type/method
   */
  readonly type?: AuthMethod;
  /**
   * Authentication method (alias)
   */
  readonly method?: AuthMethod;
  /**
   * Supported authentication methods
   */
  readonly methods?: readonly AuthMethod[];
  /**
   * API key for authentication
   */
  readonly apiKey?: string;
  /**
   * Authentication credentials
   */
  readonly credentials?: Record<string, string> | {
    username: string;
    password: string;
  };
  /**
   * Token refresh function
   */
  readonly tokenRefresh?: () => Promise<string>;
  /**
   * Token endpoint URL
   */
  readonly tokenEndpoint?: string;
  /**
   * Authentication provider configurations
   */
  readonly providers?: Record<string, AuthProviderConfig>;
  /**
   * Session timeout in milliseconds
   */
  readonly sessionTimeout?: number;
  /**
   * Token expiration in seconds
   */
  readonly tokenExpiration?: number;
}

/**
 * Authentication provider configuration
 */
export interface AuthProviderConfig {
  readonly enabled: boolean;
  readonly clientId?: string;
  readonly clientSecret?: string;
  readonly issuer?: string;
  readonly audience?: string;
  readonly scopes?: readonly string[];
}

/**
 * Storage backend types
 */
export type StorageBackend = 'memory' | 'file' | 'database' | 's3' | 'redis' | 'custom';

/**
 * Memory configuration for agents
 * Controls memory storage and retention
 */
export interface MemoryConfig {
  /**
   * Enable/disable memory
   */
  readonly enabled?: boolean;
  /**
   * Storage backend type
   */
  readonly backend?: StorageBackend;
  /**
   * Maximum number of memory entries
   */
  readonly maxSize?: number;
  /**
   * Time-to-live in seconds
   */
  readonly ttl?: number;
  /**
   * Memory retention policy
   */
  readonly retentionPolicy?: 'fifo' | 'lru' | 'importance' | 'custom';
  /**
   * Persist memory to disk
   */
  readonly persistToDisk?: boolean;
  /**
   * Enable embeddings for semantic search
   */
  readonly embeddings?: boolean;
  /**
   * Enable compression
   */
  readonly compressionEnabled?: boolean;
}

/**
 * Learning mode types
 */
export type LearningMode = 'supervised' | 'reinforcement' | 'imitation';

/**
 * Learning configuration for RLHF and agent learning
 * Controls learning behavior and parameters
 */
export interface LearningConfig {
  /**
   * Enable/disable learning
   */
  readonly enabled: boolean;
  /**
   * Learning mode
   */
  readonly mode?: LearningMode;
  /**
   * Learning rate (0-1)
   */
  readonly learningRate?: number;
  /**
   * Exploration rate for reinforcement learning
   */
  readonly explorationRate?: number;
  /**
   * Discount factor for future rewards
   */
  readonly discountFactor?: number;
  /**
   * Batch size for learning updates
   */
  readonly batchSize?: number;
  /**
   * How often to update the model (in iterations)
   */
  readonly updateFrequency?: number;
  /**
   * Minimum feedback threshold to trigger learning
   */
  readonly feedbackThreshold?: number;
}

/**
 * Collaboration mode types
 */
export type CollaborationMode =
  | 'sequential'
  | 'parallel'
  | 'hierarchical'
  | 'consensus'
  | 'democratic'
  | 'competitive';

/**
 * Collaboration configuration for multi-agent systems
 * Controls how agents work together
 */
export interface CollaborationConfig {
  /**
   * Enable/disable collaboration
   */
  readonly enabled: boolean;
  /**
   * Collaboration mode/strategy
   */
  readonly mode?: CollaborationMode;
  /**
   * Coordination strategy (alias for mode)
   */
  readonly coordinationStrategy?: CollaborationMode;
  /**
   * Maximum number of agents in collaboration
   */
  readonly maxAgents?: number;
  /**
   * Communication protocol identifier
   */
  readonly communicationProtocol?: string;
  /**
   * Consensus threshold (0-1) for consensus/democratic modes
   */
  readonly consensusThreshold?: number;
  /**
   * Timeout for collaboration in milliseconds
   */
  readonly timeout?: number;
  /**
   * Strategy when collaboration fails
   */
  readonly failureStrategy?: 'abort' | 'continue' | 'fallback';
}

/**
 * Load balancing configuration
 * Controls load distribution across models/endpoints
 */
export interface LoadBalancingConfig {
  /**
   * Load balancing algorithm/strategy
   */
  readonly algorithm?: 'round-robin' | 'least-connections' | 'weighted' | 'random';
  /**
   * Strategy (alias for algorithm)
   */
  readonly strategy?: 'round-robin' | 'least-connections' | 'weighted';
  /**
   * Weights for weighted load balancing
   */
  readonly weights?: Record<string, number>;
  /**
   * Enable health checking
   */
  readonly healthCheck?: boolean;
  /**
   * Health check interval in milliseconds
   */
  readonly healthCheckInterval?: number;
}

// ============================================================================
// Tool Types
// ============================================================================

/**
 * Tool call from LLM
 * Represents a request to execute a tool
 */
export interface ToolCall {
  /**
   * Unique identifier for this tool call
   */
  readonly id: string;
  /**
   * Tool identifier (branded string)
   */
  readonly toolId?: string;
  /**
   * Tool name
   */
  readonly name?: string;
  /**
   * Tool name (alias for streaming compatibility)
   */
  readonly toolName?: string;
  /**
   * Tool type (for streaming)
   */
  readonly type?: 'function';
  /**
   * Function call details (for streaming)
   */
  readonly function?: {
    readonly name: string;
    readonly arguments: string; // JSON string
  };
  /**
   * Tool call arguments/input
   */
  readonly arguments?: Record<string, any>;
  /**
   * Tool input (alias)
   */
  readonly input?: Record<string, any>;
  /**
   * Timestamp of the call
   */
  readonly timestamp?: number;
  /**
   * Execution context
   */
  readonly context?: any;
}

/**
 * Tool error codes
 */
export type ToolErrorCode =
  | 'INVALID_INPUT'
  | 'MISSING_PARAMETER'
  | 'VALIDATION_ERROR'
  | 'PERMISSION_DENIED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'TIMEOUT'
  | 'NOT_FOUND'
  | 'INTERNAL_ERROR'
  | 'NETWORK_ERROR'
  | 'UNAVAILABLE'
  | 'DEPRECATED'
  | 'UNKNOWN';

/**
 * Tool execution error details
 * Simple error information returned from tool execution
 * Note: For framework-level errors, use ToolError from errors.d.ts
 */
export interface ToolExecutionErrorDetails {
  /**
   * Error code
   */
  readonly code: string | ToolErrorCode;
  /**
   * Error message
   */
  readonly message: string;
  /**
   * Tool name that caused the error
   */
  readonly toolName?: string;
  /**
   * Tool ID that caused the error
   */
  readonly toolId?: string;
  /**
   * Additional error details
   */
  readonly details?: any;
  /**
   * Whether the error is recoverable
   */
  readonly recoverable?: boolean;
  /**
   * Milliseconds to wait before retrying
   */
  readonly retryAfter?: number;
}

/**
 * Validation failure details
 * Simple validation error information
 * Note: For framework-level errors, use ValidationError from errors.d.ts
 */
export interface ValidationFailure {
  /**
   * Field that failed validation
   */
  readonly field: string;
  /**
   * Validation error message
   */
  readonly message: string;
  /**
   * Error code
   */
  readonly code?: string;
  /**
   * Validation constraint that was violated
   */
  readonly constraint?: string;
  /**
   * Expected value or type
   */
  readonly expected?: string;
  /**
   * Received value or type
   */
  readonly received?: string;
  /**
   * The actual value that failed validation
   */
  readonly value?: any;
}

// Note: ToolError and ValidationError type aliases are not exported here
// to avoid conflicts with the framework error interfaces in errors.d.ts
// Tools that need simple error details should use ToolExecutionErrorDetails and ValidationFailure
