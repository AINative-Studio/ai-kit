/**
 * Configuration type definitions for AI Kit
 * Comprehensive types for framework configuration
 */

import type { JsonValue, Brand, ModelId, ToolId, AgentId } from './utils';
import type { ModelProvider } from './models.d';
import type {
  ErrorCategory,
  ErrorSeverity,
} from './errors.d';
import type {
  RateLimitConfig,
  RateLimitRule,
  RetryConfig,
  TimeoutConfig,
  AuthenticationConfig,
  AuthMethod,
  AuthProviderConfig,
  MemoryConfig,
  LearningConfig,
  CollaborationConfig,
  LoadBalancingConfig,
} from './common';

// ============================================================================
// Core Configuration
// ============================================================================

/**
 * Environment type
 */
export type Environment = 'development' | 'staging' | 'production' | 'test';

/**
 * Log level
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'silent';

/**
 * AI Kit configuration
 */
export interface AIKitConfig {
  readonly environment: Environment;
  readonly version?: string;
  readonly models?: ModelsConfig;
  readonly tools?: ToolsConfig;
  readonly agents?: AgentsConfig;
  readonly streaming?: StreamingConfig;
  readonly caching?: CachingConfig;
  readonly logging?: LoggingConfig;
  readonly monitoring?: MonitoringConfig;
  readonly security?: SecurityConfig;
  readonly performance?: PerformanceConfig;
  readonly storage?: StorageConfig;
  readonly providers?: ProvidersConfig;
  readonly features?: FeaturesConfig;
  readonly experimental?: ExperimentalConfig;
  readonly metadata?: Record<string, JsonValue>;
}

// ============================================================================
// Models Configuration
// ============================================================================

/**
 * Models configuration
 */
export interface ModelsConfig {
  readonly defaultProvider?: ModelProvider;
  readonly defaultModel?: ModelId;
  readonly providers: Record<ModelProvider, ProviderConfig>;
  readonly routing?: ModelRoutingConfig;
  readonly fallback?: ModelFallbackConfig;
  readonly optimization?: ModelOptimizationConfig;
}

/**
 * Provider configuration
 */
export interface ProviderConfig {
  readonly enabled: boolean;
  readonly apiKey?: string;
  readonly endpoint?: string;
  readonly organization?: string;
  readonly timeout?: number; // milliseconds
  readonly maxRetries?: number;
  readonly rateLimit?: RateLimitConfig;
  readonly models?: readonly ModelId[];
  readonly defaultParameters?: Record<string, JsonValue>;
  readonly headers?: Record<string, string>;
  readonly metadata?: Record<string, JsonValue>;
}

/**
 * Model routing configuration
 */
export interface ModelRoutingConfig {
  readonly enabled: boolean;
  readonly strategy: 'cheapest' | 'fastest' | 'best-quality' | 'balanced' | 'custom';
  readonly rules?: readonly RoutingRule[];
  readonly loadBalancing?: LoadBalancingConfig;
}

/**
 * Routing rule
 */
export interface RoutingRule {
  readonly condition: RoutingCondition;
  readonly target: ModelId;
  readonly priority?: number;
}

/**
 * Routing condition
 */
export interface RoutingCondition {
  readonly maxTokens?: number;
  readonly capabilities?: readonly string[];
  readonly tags?: readonly string[];
  readonly costLimit?: number;
  readonly custom?: (context: Record<string, JsonValue>) => boolean;
}

// Re-export LoadBalancingConfig from common
export type { LoadBalancingConfig } from './common';

/**
 * Model fallback configuration
 */
export interface ModelFallbackConfig {
  readonly enabled: boolean;
  readonly fallbackChain?: readonly ModelId[];
  readonly maxAttempts?: number;
  readonly conditions?: readonly FallbackCondition[];
}

/**
 * Fallback condition
 */
export interface FallbackCondition {
  readonly errorCodes?: readonly string[];
  readonly statusCodes?: readonly number[];
  readonly timeout?: number; // milliseconds
}

/**
 * Model optimization configuration
 */
export interface ModelOptimizationConfig {
  readonly promptCompression?: boolean;
  readonly responseOptimization?: boolean;
  readonly batchingEnabled?: boolean;
  readonly batchSize?: number;
  readonly batchWindowMs?: number;
}

// ============================================================================
// Tools Configuration
// ============================================================================

/**
 * Tools configuration
 */
export interface ToolsConfig {
  readonly enabled: boolean;
  readonly registry?: ToolRegistryConfig;
  readonly execution?: ToolExecutionConfig;
  readonly security?: ToolSecurityConfig;
  readonly defaults?: ToolDefaultsConfig;
}

/**
 * Tool registry configuration
 */
export interface ToolRegistryConfig {
  readonly autoDiscover?: boolean;
  readonly paths?: readonly string[];
  readonly whitelist?: readonly ToolId[];
  readonly blacklist?: readonly ToolId[];
}

/**
 * Tool execution configuration
 */
export interface ToolExecutionConfig {
  readonly timeout?: number; // milliseconds
  readonly maxConcurrent?: number;
  readonly retry?: RetryConfig;
  readonly sandboxed?: boolean;
  readonly resourceLimits?: ResourceLimits;
}

/**
 * Resource limits for tool execution
 */
export interface ResourceLimits {
  readonly memory?: number; // bytes
  readonly cpu?: number; // percentage
  readonly diskIO?: number; // bytes per second
  readonly networkIO?: number; // bytes per second
}

/**
 * Tool security configuration
 */
export interface ToolSecurityConfig {
  readonly permissions?: Record<ToolId, readonly string[]>;
  readonly requireApproval?: boolean;
  readonly dangerousToolsBlocked?: boolean;
  readonly auditLogging?: boolean;
}

/**
 * Tool defaults configuration
 */
export interface ToolDefaultsConfig {
  readonly timeout?: number;
  readonly retryable?: boolean;
  readonly caching?: boolean;
  readonly validation?: boolean;
}

// ============================================================================
// Agents Configuration
// ============================================================================

/**
 * Agents configuration
 */
export interface AgentsConfig {
  readonly enabled: boolean;
  readonly defaults?: AgentDefaultsConfig;
  readonly collaboration?: CollaborationConfig;
  readonly planning?: PlanningConfig;
  readonly learning?: LearningConfig;
  readonly memory?: MemoryConfig;
}

/**
 * Agent defaults configuration
 */
export interface AgentDefaultsConfig {
  readonly model?: ModelId;
  readonly temperature?: number;
  readonly maxIterations?: number;
  readonly timeout?: number; // milliseconds
  readonly tools?: readonly ToolId[];
}

// Re-export CollaborationConfig from common
export type { CollaborationConfig } from './common';

/**
 * Planning configuration
 */
export interface PlanningConfig {
  readonly enabled: boolean;
  readonly strategy?: 'forward' | 'backward' | 'hierarchical' | 'reactive' | 'deliberative';
  readonly maxDepth?: number;
  readonly timeLimit?: number; // milliseconds
}

// Re-export LearningConfig from common
export type { LearningConfig } from './common';

// Re-export MemoryConfig from common
export type { MemoryConfig } from './common';

// ============================================================================
// Streaming Configuration
// ============================================================================

/**
 * Streaming configuration
 */
export interface StreamingConfig {
  readonly enabled: boolean;
  readonly transport?: 'sse' | 'websocket' | 'http';
  readonly reconnect?: boolean;
  readonly maxReconnectAttempts?: number;
  readonly reconnectDelay?: number; // milliseconds
  readonly heartbeatInterval?: number; // milliseconds
  readonly bufferSize?: number;
  readonly compression?: boolean;
}

// ============================================================================
// Caching Configuration
// ============================================================================

/**
 * Caching configuration
 */
export interface CachingConfig {
  readonly enabled: boolean;
  readonly storage?: CacheStorageConfig;
  readonly policies?: CachePoliciesConfig;
  readonly invalidation?: CacheInvalidationConfig;
  readonly compression?: boolean;
}

/**
 * Cache storage configuration
 */
export interface CacheStorageConfig {
  readonly type: 'memory' | 'redis' | 'memcached' | 'custom';
  readonly url?: string;
  readonly options?: Record<string, JsonValue>;
  readonly maxSize?: number; // max items
  readonly maxSizeBytes?: number; // max bytes
}

/**
 * Cache policies configuration
 */
export interface CachePoliciesConfig {
  readonly default?: CachePolicy;
  readonly models?: Record<ModelId, CachePolicy>;
  readonly tools?: Record<ToolId, CachePolicy>;
  readonly custom?: Record<string, CachePolicy>;
}

/**
 * Cache policy
 */
export interface CachePolicy {
  readonly ttl?: number; // seconds
  readonly strategy?: 'lru' | 'lfu' | 'ttl' | 'adaptive';
  readonly keyGenerator?: string; // function name or reference
  readonly conditions?: readonly CacheCondition[];
}

/**
 * Cache condition
 */
export interface CacheCondition {
  readonly parameter?: string;
  readonly operator: '==' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'matches';
  readonly value: JsonValue;
}

/**
 * Cache invalidation configuration
 */
export interface CacheInvalidationConfig {
  readonly enabled: boolean;
  readonly strategies?: readonly CacheInvalidationStrategy[];
  readonly webhook?: string;
}

/**
 * Cache invalidation strategy
 */
export type CacheInvalidationStrategy =
  | 'time-based'
  | 'event-based'
  | 'pattern-based'
  | 'manual'
  | 'custom';

// ============================================================================
// Logging Configuration
// ============================================================================

/**
 * Logging configuration
 */
export interface LoggingConfig {
  readonly level: LogLevel;
  readonly format?: 'json' | 'text' | 'pretty';
  readonly outputs?: readonly LogOutput[];
  readonly filters?: readonly LogFilter[];
  readonly sampling?: LogSamplingConfig;
  readonly redaction?: LogRedactionConfig;
}

/**
 * Log output
 */
export interface LogOutput {
  readonly type: 'console' | 'file' | 'syslog' | 'http' | 'custom';
  readonly enabled: boolean;
  readonly level?: LogLevel;
  readonly format?: 'json' | 'text';
  readonly path?: string; // for file output
  readonly url?: string; // for http output
  readonly options?: Record<string, JsonValue>;
}

/**
 * Log filter
 */
export interface LogFilter {
  readonly type: 'include' | 'exclude';
  readonly categories?: readonly string[];
  readonly patterns?: readonly string[];
  readonly minLevel?: LogLevel;
}

/**
 * Log sampling configuration
 */
export interface LogSamplingConfig {
  readonly enabled: boolean;
  readonly rate?: number; // 0-1
  readonly rules?: readonly SamplingRule[];
}

/**
 * Sampling rule
 */
export interface SamplingRule {
  readonly pattern?: string;
  readonly category?: string;
  readonly rate: number; // 0-1
}

/**
 * Log redaction configuration
 */
export interface LogRedactionConfig {
  readonly enabled: boolean;
  readonly patterns?: readonly string[]; // regex patterns
  readonly fields?: readonly string[]; // field names to redact
  readonly replacement?: string;
}

// ============================================================================
// Monitoring Configuration
// ============================================================================

/**
 * Monitoring configuration
 */
export interface MonitoringConfig {
  readonly enabled: boolean;
  readonly metrics?: MetricsConfig;
  readonly tracing?: TracingConfig;
  readonly alerts?: AlertsConfig;
  readonly health?: HealthCheckConfig;
}

/**
 * Metrics configuration
 */
export interface MetricsConfig {
  readonly enabled: boolean;
  readonly provider?: 'prometheus' | 'statsd' | 'cloudwatch' | 'datadog' | 'custom';
  readonly endpoint?: string;
  readonly interval?: number; // milliseconds
  readonly prefix?: string;
  readonly labels?: Record<string, string>;
}

/**
 * Tracing configuration
 */
export interface TracingConfig {
  readonly enabled: boolean;
  readonly provider?: 'jaeger' | 'zipkin' | 'datadog' | 'honeycomb' | 'custom';
  readonly endpoint?: string;
  readonly serviceName?: string;
  readonly sampleRate?: number; // 0-1
}

/**
 * Alerts configuration
 */
export interface AlertsConfig {
  readonly enabled: boolean;
  readonly rules?: readonly AlertRule[];
  readonly channels?: readonly AlertChannel[];
}

/**
 * Alert rule
 */
export interface AlertRule {
  readonly id: string;
  readonly name: string;
  readonly condition: AlertCondition;
  readonly severity: ErrorSeverity;
  readonly cooldown?: number; // milliseconds
  readonly channels?: readonly string[]; // channel IDs
}

/**
 * Alert condition
 */
export interface AlertCondition {
  readonly metric: string;
  readonly operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  readonly threshold: number;
  readonly window?: number; // milliseconds
}

/**
 * Alert channel
 */
export interface AlertChannel {
  readonly id: string;
  readonly type: 'email' | 'slack' | 'webhook' | 'pagerduty' | 'custom';
  readonly enabled: boolean;
  readonly config: Record<string, JsonValue>;
}

/**
 * Health check configuration
 */
export interface HealthCheckConfig {
  readonly enabled: boolean;
  readonly endpoint?: string;
  readonly interval?: number; // milliseconds
  readonly checks?: readonly HealthCheck[];
}

/**
 * Health check
 */
export interface HealthCheck {
  readonly name: string;
  readonly type: 'http' | 'tcp' | 'custom';
  readonly target: string;
  readonly timeout?: number; // milliseconds
  readonly critical?: boolean;
}

// ============================================================================
// Security Configuration
// ============================================================================

/**
 * Security configuration
 */
export interface SecurityConfig {
  readonly authentication?: AuthenticationConfig;
  readonly authorization?: AuthorizationConfig;
  readonly encryption?: EncryptionConfig;
  readonly rateLimit?: RateLimitConfig;
  readonly cors?: CORSConfig;
  readonly contentSecurity?: ContentSecurityConfig;
}

// Re-export authentication types from common
export type { AuthenticationConfig, AuthMethod, AuthProviderConfig } from './common';

/**
 * Authorization configuration
 */
export interface AuthorizationConfig {
  readonly enabled: boolean;
  readonly model?: 'rbac' | 'abac' | 'custom';
  readonly policies?: readonly AuthorizationPolicy[];
  readonly defaultDeny?: boolean;
}

/**
 * Authorization policy
 */
export interface AuthorizationPolicy {
  readonly id: string;
  readonly resource: string;
  readonly actions: readonly string[];
  readonly effect: 'allow' | 'deny';
  readonly conditions?: readonly PolicyCondition[];
}

/**
 * Policy condition
 */
export interface PolicyCondition {
  readonly attribute: string;
  readonly operator: string;
  readonly value: JsonValue;
}

/**
 * Encryption configuration
 */
export interface EncryptionConfig {
  readonly enabled: boolean;
  readonly algorithm?: 'aes-256-gcm' | 'chacha20-poly1305';
  readonly keyManagement?: 'kms' | 'vault' | 'env' | 'custom';
  readonly atRest?: boolean;
  readonly inTransit?: boolean;
}

// Re-export rate limiting types from common
export type { RateLimitConfig, RateLimitRule } from './common';

/**
 * CORS configuration
 */
export interface CORSConfig {
  readonly enabled: boolean;
  readonly origins?: readonly string[];
  readonly methods?: readonly string[];
  readonly headers?: readonly string[];
  readonly credentials?: boolean;
  readonly maxAge?: number; // seconds
}

/**
 * Content security configuration
 */
export interface ContentSecurityConfig {
  readonly piiDetection?: boolean;
  readonly jailbreakDetection?: boolean;
  readonly toxicityFiltering?: boolean;
  readonly contentFiltering?: ContentFilterConfig;
}

/**
 * Content filter configuration
 */
export interface ContentFilterConfig {
  readonly enabled: boolean;
  readonly categories?: readonly ContentFilterCategory[];
  readonly threshold?: 'low' | 'medium' | 'high';
  readonly action?: 'block' | 'warn' | 'log';
}

/**
 * Content filter category
 */
export type ContentFilterCategory = 'hate' | 'violence' | 'sexual' | 'self-harm' | 'profanity';

// ============================================================================
// Performance Configuration
// ============================================================================

/**
 * Performance configuration
 */
export interface PerformanceConfig {
  readonly optimization?: OptimizationConfig;
  readonly concurrency?: ConcurrencyConfig;
  readonly timeout?: TimeoutConfig;
  readonly retry?: RetryConfig;
}

/**
 * Optimization configuration
 */
export interface OptimizationConfig {
  readonly enabled: boolean;
  readonly caching?: boolean;
  readonly compression?: boolean;
  readonly minification?: boolean;
  readonly lazyLoading?: boolean;
}

/**
 * Concurrency configuration
 */
export interface ConcurrencyConfig {
  readonly maxConcurrentRequests?: number;
  readonly queueSize?: number;
  readonly queueTimeout?: number; // milliseconds
}

// Re-export timeout and retry types from common
export type { TimeoutConfig, RetryConfig } from './common';

// ============================================================================
// Storage Configuration
// ============================================================================

/**
 * Storage configuration
 */
export interface StorageConfig {
  readonly type: 'memory' | 'file' | 'database' | 's3' | 'custom';
  readonly path?: string;
  readonly connectionString?: string;
  readonly options?: Record<string, JsonValue>;
}

// ============================================================================
// Providers Configuration
// ============================================================================

/**
 * Providers configuration
 */
export interface ProvidersConfig {
  readonly openai?: ProviderConfig;
  readonly anthropic?: ProviderConfig;
  readonly google?: ProviderConfig;
  readonly cohere?: ProviderConfig;
  readonly custom?: Record<string, ProviderConfig>;
}

// ============================================================================
// Features Configuration
// ============================================================================

/**
 * Features configuration (feature flags)
 */
export interface FeaturesConfig {
  readonly streaming?: boolean;
  readonly tools?: boolean;
  readonly agents?: boolean;
  readonly multimodal?: boolean;
  readonly vision?: boolean;
  readonly audio?: boolean;
  readonly codeExecution?: boolean;
  readonly reasoning?: boolean;
  readonly rlhf?: boolean;
  readonly [key: string]: boolean | undefined;
}

// ============================================================================
// Experimental Configuration
// ============================================================================

/**
 * Experimental configuration
 */
export interface ExperimentalConfig {
  readonly enabled: boolean;
  readonly features?: Record<string, boolean>;
  readonly betaAccess?: boolean;
  readonly telemetry?: boolean;
}
