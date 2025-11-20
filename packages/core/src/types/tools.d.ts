/**
 * Tool type definitions for AI Kit
 * Comprehensive types for AI tools and function calling
 */

import type { JsonValue, Result, Brand } from './utils';
import type { AgentId, MessageId } from './utils';

// ============================================================================
// Core Tool Types
// ============================================================================

/**
 * Tool identifier - branded string
 */
export type ToolId = Brand<string, 'ToolId'>;

/**
 * Tool category
 */
export type ToolCategory =
  | 'data'
  | 'computation'
  | 'communication'
  | 'search'
  | 'filesystem'
  | 'api'
  | 'database'
  | 'visualization'
  | 'analysis'
  | 'automation'
  | 'custom';

/**
 * Tool status
 */
export type ToolStatus =
  | 'available'
  | 'unavailable'
  | 'deprecated'
  | 'experimental'
  | 'beta';

/**
 * Parameter type
 */
export type ParameterType =
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'array'
  | 'object'
  | 'null';

/**
 * Parameter schema (JSON Schema subset)
 */
export interface ParameterSchema {
  readonly type: ParameterType | readonly ParameterType[];
  readonly description?: string;
  readonly enum?: readonly JsonValue[];
  readonly default?: JsonValue;
  readonly minimum?: number;
  readonly maximum?: number;
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly pattern?: string;
  readonly format?: string;
  readonly items?: ParameterSchema;
  readonly properties?: Record<string, ParameterSchema>;
  readonly required?: readonly string[];
  readonly additionalProperties?: boolean | ParameterSchema;
  readonly oneOf?: readonly ParameterSchema[];
  readonly anyOf?: readonly ParameterSchema[];
  readonly allOf?: readonly ParameterSchema[];
  readonly not?: ParameterSchema;
  readonly [key: string]: JsonValue | undefined;
}

/**
 * Tool parameter definition
 */
export interface ToolParameter {
  readonly name: string;
  readonly description: string;
  readonly schema: ParameterSchema;
  readonly required: boolean;
  readonly defaultValue?: JsonValue;
  readonly examples?: readonly JsonValue[];
}

/**
 * Tool return type schema
 */
export interface ToolReturnSchema {
  readonly type: ParameterType | readonly ParameterType[];
  readonly description?: string;
  readonly schema?: ParameterSchema;
  readonly examples?: readonly JsonValue[];
}

// ============================================================================
// Tool Configuration
// ============================================================================

/**
 * Tool configuration
 */
export interface ToolConfig {
  readonly id: ToolId;
  readonly name: string;
  readonly description: string;
  readonly category: ToolCategory;
  readonly version?: string;
  readonly status?: ToolStatus;
  readonly parameters: readonly ToolParameter[];
  readonly returns: ToolReturnSchema;
  readonly examples?: readonly ToolExample[];
  readonly tags?: readonly string[];
  readonly permissions?: readonly ToolPermission[];
  readonly rateLimit?: RateLimitConfig;
  readonly timeout?: number; // milliseconds
  readonly caching?: ToolCacheConfig;
  readonly retryable?: boolean;
  readonly metadata?: Record<string, JsonValue>;
}

/**
 * Tool example
 */
export interface ToolExample {
  readonly description: string;
  readonly input: Record<string, JsonValue>;
  readonly output: JsonValue;
  readonly explanation?: string;
}

/**
 * Tool permission
 */
export type ToolPermission =
  | 'read'
  | 'write'
  | 'execute'
  | 'network'
  | 'filesystem'
  | 'database'
  | 'admin';

/**
 * Rate limit configuration for tools
 */
export interface RateLimitConfig {
  readonly maxCalls: number;
  readonly windowMs: number; // time window in milliseconds
  readonly perUser?: boolean;
  readonly perAgent?: boolean;
}

/**
 * Tool cache configuration
 */
export interface ToolCacheConfig {
  readonly enabled: boolean;
  readonly ttl?: number; // seconds
  readonly keyGenerator?: (input: Record<string, JsonValue>) => string;
  readonly strategy?: 'lru' | 'lfu' | 'ttl' | 'custom';
}

// ============================================================================
// Tool Execution
// ============================================================================

/**
 * Tool execution context
 */
export interface ToolExecutionContext {
  readonly agentId?: AgentId;
  readonly messageId?: MessageId;
  readonly sessionId?: string;
  readonly userId?: string;
  readonly timestamp: number;
  readonly parentCallId?: string; // For nested tool calls
  readonly metadata?: Record<string, JsonValue>;
}

/**
 * Tool execution options
 */
export interface ToolExecutionOptions {
  readonly timeout?: number; // milliseconds
  readonly retry?: ToolRetryConfig;
  readonly cache?: boolean;
  readonly validate?: boolean;
  readonly context?: ToolExecutionContext;
  readonly signal?: AbortSignal;
  readonly metadata?: Record<string, JsonValue>;
}

/**
 * Tool retry configuration
 */
export interface ToolRetryConfig {
  readonly maxAttempts: number;
  readonly backoff: 'linear' | 'exponential' | 'constant';
  readonly initialDelay: number; // milliseconds
  readonly maxDelay: number; // milliseconds
  readonly retryableErrors?: readonly string[];
}

/**
 * Tool call
 */
export interface ToolCall {
  readonly id: string;
  readonly toolId: ToolId;
  readonly toolName: string;
  readonly input: Record<string, JsonValue>;
  readonly timestamp: number;
  readonly context?: ToolExecutionContext;
}

/**
 * Tool call result
 */
export interface ToolCallResult {
  readonly callId: string;
  readonly success: boolean;
  readonly output?: JsonValue;
  readonly error?: ToolError;
  readonly duration: number; // milliseconds
  readonly cached?: boolean;
  readonly retries?: number;
  readonly timestamp: number;
  readonly metadata?: Record<string, JsonValue>;
}

/**
 * Tool error
 */
export interface ToolError {
  readonly code: ToolErrorCode;
  readonly message: string;
  readonly details?: JsonValue;
  readonly recoverable: boolean;
  readonly retryAfter?: number; // milliseconds
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

// ============================================================================
// Tool Handler
// ============================================================================

/**
 * Tool handler function
 */
export type ToolHandler<TInput = Record<string, JsonValue>, TOutput = JsonValue> = (
  input: TInput,
  context: ToolExecutionContext,
  options?: ToolExecutionOptions
) => Promise<TOutput> | TOutput;

/**
 * Tool validator function
 */
export type ToolValidator = (
  input: Record<string, JsonValue>,
  schema: readonly ToolParameter[]
) => Result<Record<string, JsonValue>, ValidationError>;

/**
 * Validation error
 */
export interface ValidationError {
  readonly field: string;
  readonly message: string;
  readonly expected?: string;
  readonly received?: string;
}

// ============================================================================
// Tool Interface
// ============================================================================

/**
 * Core tool interface
 */
export interface Tool<TInput = Record<string, JsonValue>, TOutput = JsonValue> {
  readonly config: ToolConfig;
  readonly handler: ToolHandler<TInput, TOutput>;

  // Execution
  execute(
    input: TInput,
    context?: ToolExecutionContext,
    options?: ToolExecutionOptions
  ): Promise<ToolCallResult>;

  // Validation
  validateInput(input: Record<string, JsonValue>): Result<TInput, ValidationError>;

  // Schema
  getSchema(): ToolConfig;
  getParameterSchema(): readonly ToolParameter[];
  getReturnSchema(): ToolReturnSchema;

  // Status
  isAvailable(): boolean;
  getStatus(): ToolStatus;
}

// ============================================================================
// Tool Registry
// ============================================================================

/**
 * Tool registry interface
 */
export interface ToolRegistry {
  // Registration
  register(tool: Tool): void;
  unregister(toolId: ToolId): void;
  registerMultiple(tools: readonly Tool[]): void;

  // Retrieval
  get(toolId: ToolId): Tool | undefined;
  getByName(name: string): Tool | undefined;
  getAll(): readonly Tool[];
  getByCategory(category: ToolCategory): readonly Tool[];
  getByTags(tags: readonly string[]): readonly Tool[];

  // Search
  search(query: string): readonly Tool[];
  filter(predicate: (tool: Tool) => boolean): readonly Tool[];

  // Status
  has(toolId: ToolId): boolean;
  count(): number;
  getAvailable(): readonly Tool[];
}

// ============================================================================
// Tool Builder
// ============================================================================

/**
 * Fluent tool builder
 */
export interface ToolBuilder<TInput = Record<string, JsonValue>, TOutput = JsonValue> {
  // Basic info
  name(name: string): this;
  description(description: string): this;
  category(category: ToolCategory): this;
  version(version: string): this;
  status(status: ToolStatus): this;

  // Parameters
  parameter(param: ToolParameter): this;
  requiredParameter(name: string, description: string, schema: ParameterSchema): this;
  optionalParameter(
    name: string,
    description: string,
    schema: ParameterSchema,
    defaultValue?: JsonValue
  ): this;

  // Return type
  returns(schema: ToolReturnSchema): this;

  // Configuration
  timeout(ms: number): this;
  rateLimit(config: RateLimitConfig): this;
  permissions(perms: readonly ToolPermission[]): this;
  caching(config: ToolCacheConfig): this;
  retryable(enabled: boolean): this;
  tags(tags: readonly string[]): this;

  // Examples
  example(example: ToolExample): this;

  // Handler
  handler(handler: ToolHandler<TInput, TOutput>): this;

  // Build
  build(): Tool<TInput, TOutput>;
}

// ============================================================================
// Specialized Tool Types
// ============================================================================

/**
 * API tool configuration
 */
export interface APIToolConfig extends ToolConfig {
  readonly endpoint: string;
  readonly method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  readonly headers?: Record<string, string>;
  readonly authentication?: AuthenticationConfig;
  readonly requestTransform?: (input: Record<string, JsonValue>) => JsonValue;
  readonly responseTransform?: (response: JsonValue) => JsonValue;
}

/**
 * Authentication configuration
 */
export interface AuthenticationConfig {
  readonly type: 'none' | 'bearer' | 'basic' | 'api-key' | 'oauth2';
  readonly credentials?: Record<string, string>;
  readonly tokenRefresh?: () => Promise<string>;
}

/**
 * Database tool configuration
 */
export interface DatabaseToolConfig extends ToolConfig {
  readonly connectionString: string;
  readonly database: string;
  readonly query: string;
  readonly parameterMapping?: Record<string, string>;
  readonly resultTransform?: (results: JsonValue) => JsonValue;
}

/**
 * File system tool configuration
 */
export interface FileSystemToolConfig extends ToolConfig {
  readonly basePath?: string;
  readonly allowedPaths?: readonly string[];
  readonly maxFileSize?: number; // bytes
  readonly allowedExtensions?: readonly string[];
}

/**
 * Search tool configuration
 */
export interface SearchToolConfig extends ToolConfig {
  readonly searchEngine: 'google' | 'bing' | 'duckduckgo' | 'custom';
  readonly maxResults?: number;
  readonly filters?: Record<string, JsonValue>;
  readonly resultFormat?: 'full' | 'snippet' | 'links';
}

/**
 * Code execution tool configuration
 */
export interface CodeExecutionToolConfig extends ToolConfig {
  readonly language: string;
  readonly runtime: string;
  readonly memoryLimit?: number; // MB
  readonly cpuLimit?: number; // milliseconds
  readonly networkAccess?: boolean;
  readonly fileSystemAccess?: 'none' | 'read-only' | 'read-write';
  readonly allowedPackages?: readonly string[];
}

// ============================================================================
// Tool Composition
// ============================================================================

/**
 * Composite tool - combines multiple tools
 */
export interface CompositeTool extends Tool {
  readonly tools: readonly ToolId[];
  readonly composition: CompositionStrategy;
}

/**
 * Composition strategy
 */
export type CompositionStrategy =
  | 'sequential' // Execute tools in sequence, passing output to next
  | 'parallel' // Execute tools in parallel, aggregate results
  | 'conditional' // Execute tools based on conditions
  | 'fallback'; // Try tools in order until one succeeds

/**
 * Tool pipeline configuration
 */
export interface ToolPipeline {
  readonly id: string;
  readonly name: string;
  readonly steps: readonly ToolPipelineStep[];
  readonly errorHandling?: 'abort' | 'continue' | 'fallback';
}

/**
 * Tool pipeline step
 */
export interface ToolPipelineStep {
  readonly toolId: ToolId;
  readonly inputMapping?: Record<string, string>; // Map from previous outputs
  readonly outputMapping?: Record<string, string>; // Map to next inputs
  readonly condition?: (context: Record<string, JsonValue>) => boolean;
  readonly fallback?: ToolId;
}

// ============================================================================
// Tool Monitoring
// ============================================================================

/**
 * Tool usage statistics
 */
export interface ToolUsageStats {
  readonly toolId: ToolId;
  readonly totalCalls: number;
  readonly successfulCalls: number;
  readonly failedCalls: number;
  readonly averageDuration: number; // milliseconds
  readonly cacheHitRate?: number; // 0-1
  readonly lastUsed?: number; // timestamp
  readonly errorBreakdown: Record<ToolErrorCode, number>;
}

/**
 * Tool performance metrics
 */
export interface ToolPerformanceMetrics {
  readonly p50: number; // 50th percentile duration
  readonly p95: number; // 95th percentile duration
  readonly p99: number; // 99th percentile duration
  readonly min: number;
  readonly max: number;
  readonly mean: number;
  readonly stdDev: number;
}

/**
 * Tool event
 */
export interface ToolEvent {
  readonly type: ToolEventType;
  readonly toolId: ToolId;
  readonly callId: string;
  readonly timestamp: number;
  readonly data?: JsonValue;
}

/**
 * Tool event types
 */
export type ToolEventType =
  | 'call_start'
  | 'call_end'
  | 'call_error'
  | 'cache_hit'
  | 'cache_miss'
  | 'rate_limit'
  | 'timeout'
  | 'retry';

/**
 * Tool observer interface
 */
export interface ToolObserver {
  onEvent(event: ToolEvent): void | Promise<void>;
}
