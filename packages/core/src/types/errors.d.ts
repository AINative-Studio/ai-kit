/**
 * Error type definitions for AI Kit
 * Comprehensive error types and error handling utilities
 */

import type { JsonValue, Brand } from './utils';
import type { ModelId, ToolId, AgentId } from './utils';

// ============================================================================
// Error Categories
// ============================================================================

/**
 * Error category for classification
 */
export type ErrorCategory =
  | 'validation'
  | 'authentication'
  | 'authorization'
  | 'rate-limit'
  | 'timeout'
  | 'network'
  | 'model'
  | 'tool'
  | 'agent'
  | 'stream'
  | 'configuration'
  | 'internal'
  | 'unknown';

/**
 * Error severity level
 */
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Error code - branded string for type safety
 */
export type ErrorCode = Brand<string, 'ErrorCode'>;

// ============================================================================
// Base Error Types
// ============================================================================

/**
 * Base AI Kit error interface
 */
export interface AIKitError extends Error {
  readonly name: string;
  readonly message: string;
  readonly code: ErrorCode;
  readonly category: ErrorCategory;
  readonly severity: ErrorSeverity;
  readonly recoverable: boolean;
  readonly timestamp: number;
  readonly details?: JsonValue;
  readonly cause?: Error;
  readonly stack?: string;
  readonly metadata?: Record<string, JsonValue>;
}

/**
 * Error context for additional information
 */
export interface ErrorContext {
  readonly operation?: string;
  readonly component?: string;
  readonly userId?: string;
  readonly sessionId?: string;
  readonly requestId?: string;
  readonly modelId?: ModelId;
  readonly toolId?: ToolId;
  readonly agentId?: AgentId;
  readonly timestamp: number;
  readonly [key: string]: JsonValue | undefined;
}

// ============================================================================
// Validation Errors
// ============================================================================

/**
 * Validation error
 */
export interface ValidationError extends AIKitError {
  readonly category: 'validation';
  readonly field?: string;
  readonly expected?: string;
  readonly received?: string;
  readonly constraint?: string;
  readonly validationErrors?: readonly FieldValidationError[];
}

/**
 * Field validation error
 */
export interface FieldValidationError {
  readonly field: string;
  readonly message: string;
  readonly constraint: string;
  readonly value?: JsonValue;
}

/**
 * Schema validation error
 */
export interface SchemaValidationError extends ValidationError {
  readonly schema?: JsonValue;
  readonly path?: string;
}

/**
 * Parameter validation error
 */
export interface ParameterValidationError extends ValidationError {
  readonly parameter: string;
  readonly required: boolean;
}

// ============================================================================
// Authentication and Authorization Errors
// ============================================================================

/**
 * Authentication error
 */
export interface AuthenticationError extends AIKitError {
  readonly category: 'authentication';
  readonly authMethod?: string;
  readonly provider?: string;
}

/**
 * Authorization error
 */
export interface AuthorizationError extends AIKitError {
  readonly category: 'authorization';
  readonly resource?: string;
  readonly action?: string;
  readonly requiredPermissions?: readonly string[];
  readonly userPermissions?: readonly string[];
}

/**
 * API key error
 */
export interface APIKeyError extends AuthenticationError {
  readonly keyId?: string;
  readonly expired: boolean;
  readonly invalid: boolean;
}

/**
 * Token error
 */
export interface TokenError extends AuthenticationError {
  readonly tokenType: 'access' | 'refresh' | 'api';
  readonly expired: boolean;
  readonly invalid: boolean;
  readonly expiresAt?: number;
}

// ============================================================================
// Rate Limit Errors
// ============================================================================

/**
 * Rate limit error
 */
export interface RateLimitError extends AIKitError {
  readonly category: 'rate-limit';
  readonly limit: number;
  readonly remaining: number;
  readonly resetAt: number; // timestamp
  readonly retryAfter: number; // milliseconds
  readonly scope: 'user' | 'api-key' | 'ip' | 'global';
}

/**
 * Quota exceeded error
 */
export interface QuotaExceededError extends RateLimitError {
  readonly quotaType: 'requests' | 'tokens' | 'cost' | 'storage';
  readonly used: number;
  readonly quota: number;
  readonly period: 'minute' | 'hour' | 'day' | 'month';
}

// ============================================================================
// Timeout and Network Errors
// ============================================================================

/**
 * Timeout error
 */
export interface TimeoutError extends AIKitError {
  readonly category: 'timeout';
  readonly timeoutMs: number;
  readonly elapsedMs: number;
  readonly operation: string;
}

/**
 * Network error
 */
export interface NetworkError extends AIKitError {
  readonly category: 'network';
  readonly statusCode?: number;
  readonly endpoint?: string;
  readonly method?: string;
  readonly retryable: boolean;
}

/**
 * Connection error
 */
export interface ConnectionError extends NetworkError {
  readonly host?: string;
  readonly port?: number;
  readonly protocol?: string;
}

/**
 * HTTP error
 */
export interface HTTPError extends NetworkError {
  readonly statusCode: number;
  readonly statusText?: string;
  readonly requestId?: string;
  readonly headers?: Record<string, string>;
  readonly body?: JsonValue;
}

// ============================================================================
// Model Errors
// ============================================================================

/**
 * Model error
 */
export interface ModelError extends AIKitError {
  readonly category: 'model';
  readonly modelId?: ModelId;
  readonly provider?: string;
}

/**
 * Model not found error
 */
export interface ModelNotFoundError extends ModelError {
  readonly modelId: ModelId;
  readonly availableModels?: readonly ModelId[];
}

/**
 * Model unavailable error
 */
export interface ModelUnavailableError extends ModelError {
  readonly modelId: ModelId;
  readonly reason?: string;
  readonly retryAfter?: number; // milliseconds
}

/**
 * Model response error
 */
export interface ModelResponseError extends ModelError {
  readonly modelId: ModelId;
  readonly prompt?: string;
  readonly response?: string;
  readonly finishReason?: string;
}

/**
 * Context length exceeded error
 */
export interface ContextLengthError extends ModelError {
  readonly modelId: ModelId;
  readonly maxTokens: number;
  readonly requestedTokens: number;
  readonly promptTokens: number;
  readonly completionTokens?: number;
}

/**
 * Content filter error
 */
export interface ContentFilterError extends ModelError {
  readonly modelId: ModelId;
  readonly filterType: 'hate' | 'violence' | 'sexual' | 'self-harm' | 'profanity';
  readonly severity: 'low' | 'medium' | 'high';
  readonly prompt?: string;
  readonly response?: string;
}

// ============================================================================
// Tool Errors
// ============================================================================

/**
 * Tool error
 */
export interface ToolError extends AIKitError {
  readonly category: 'tool';
  readonly toolId?: ToolId;
  readonly toolName?: string;
}

/**
 * Tool not found error
 */
export interface ToolNotFoundError extends ToolError {
  readonly toolId: ToolId;
  readonly availableTools?: readonly ToolId[];
}

/**
 * Tool execution error
 */
export interface ToolExecutionError extends ToolError {
  readonly toolId: ToolId;
  readonly input?: JsonValue;
  readonly output?: JsonValue;
  readonly exitCode?: number;
}

/**
 * Tool timeout error
 */
export interface ToolTimeoutError extends ToolError {
  readonly toolId: ToolId;
  readonly timeoutMs: number;
  readonly elapsedMs: number;
}

/**
 * Tool permission error
 */
export interface ToolPermissionError extends ToolError {
  readonly toolId: ToolId;
  readonly requiredPermissions: readonly string[];
  readonly grantedPermissions: readonly string[];
}

// ============================================================================
// Agent Errors
// ============================================================================

/**
 * Agent error
 */
export interface AgentError extends AIKitError {
  readonly category: 'agent';
  readonly agentId?: AgentId;
  readonly agentName?: string;
}

/**
 * Agent not found error
 */
export interface AgentNotFoundError extends AgentError {
  readonly agentId: AgentId;
}

/**
 * Agent execution error
 */
export interface AgentExecutionError extends AgentError {
  readonly agentId: AgentId;
  readonly task?: string;
  readonly iteration?: number;
}

/**
 * Agent communication error
 */
export interface AgentCommunicationError extends AgentError {
  readonly fromAgent: AgentId;
  readonly toAgent: AgentId;
  readonly messageType?: string;
}

/**
 * Agent state error
 */
export interface AgentStateError extends AgentError {
  readonly agentId: AgentId;
  readonly currentState?: string;
  readonly expectedState?: string;
}

// ============================================================================
// Stream Errors
// ============================================================================

/**
 * Stream error
 */
export interface StreamError extends AIKitError {
  readonly category: 'stream';
  readonly streamId?: string;
}

/**
 * Stream connection error
 */
export interface StreamConnectionError extends StreamError {
  readonly endpoint?: string;
  readonly transport?: 'sse' | 'websocket';
}

/**
 * Stream abort error
 */
export interface StreamAbortError extends StreamError {
  readonly reason?: string;
  readonly abortedBy?: 'user' | 'timeout' | 'error' | 'server';
}

/**
 * Stream parse error
 */
export interface StreamParseError extends StreamError {
  readonly chunk?: string;
  readonly position?: number;
}

// ============================================================================
// Configuration Errors
// ============================================================================

/**
 * Configuration error
 */
export interface ConfigurationError extends AIKitError {
  readonly category: 'configuration';
  readonly configKey?: string;
  readonly configValue?: JsonValue;
}

/**
 * Missing configuration error
 */
export interface MissingConfigError extends ConfigurationError {
  readonly requiredKeys: readonly string[];
  readonly providedKeys: readonly string[];
}

/**
 * Invalid configuration error
 */
export interface InvalidConfigError extends ConfigurationError {
  readonly configKey: string;
  readonly expectedType?: string;
  readonly receivedType?: string;
  readonly constraint?: string;
}

// ============================================================================
// Internal Errors
// ============================================================================

/**
 * Internal error
 */
export interface InternalError extends AIKitError {
  readonly category: 'internal';
  readonly component?: string;
}

/**
 * Not implemented error
 */
export interface NotImplementedError extends InternalError {
  readonly feature: string;
  readonly plannedVersion?: string;
}

/**
 * Assertion error
 */
export interface AssertionError extends InternalError {
  readonly assertion: string;
  readonly expected?: JsonValue;
  readonly actual?: JsonValue;
}

// ============================================================================
// Error Aggregation
// ============================================================================

/**
 * Aggregate error - contains multiple errors
 */
export interface AggregateError extends AIKitError {
  readonly errors: readonly AIKitError[];
  readonly successCount?: number;
  readonly failureCount: number;
}

/**
 * Validation aggregate error
 */
export interface ValidationAggregateError extends AggregateError {
  readonly category: 'validation';
  readonly errors: readonly ValidationError[];
}

// ============================================================================
// Error Factory
// ============================================================================

/**
 * Error factory options
 */
export interface ErrorFactoryOptions {
  readonly message: string;
  readonly code?: ErrorCode;
  readonly severity?: ErrorSeverity;
  readonly recoverable?: boolean;
  readonly details?: JsonValue;
  readonly cause?: Error;
  readonly context?: ErrorContext;
  readonly metadata?: Record<string, JsonValue>;
}

/**
 * Error factory interface
 */
export interface ErrorFactory {
  // Validation errors
  validation(options: ErrorFactoryOptions): ValidationError;
  schemaValidation(schema: JsonValue, options: ErrorFactoryOptions): SchemaValidationError;
  parameterValidation(parameter: string, options: ErrorFactoryOptions): ParameterValidationError;

  // Auth errors
  authentication(options: ErrorFactoryOptions): AuthenticationError;
  authorization(resource: string, action: string, options: ErrorFactoryOptions): AuthorizationError;
  apiKey(keyId: string, options: ErrorFactoryOptions): APIKeyError;

  // Rate limit errors
  rateLimit(limit: number, resetAt: number, options: ErrorFactoryOptions): RateLimitError;
  quotaExceeded(
    quotaType: QuotaExceededError['quotaType'],
    used: number,
    quota: number,
    options: ErrorFactoryOptions
  ): QuotaExceededError;

  // Network errors
  timeout(timeoutMs: number, elapsedMs: number, options: ErrorFactoryOptions): TimeoutError;
  network(statusCode: number, options: ErrorFactoryOptions): NetworkError;
  http(statusCode: number, statusText: string, options: ErrorFactoryOptions): HTTPError;

  // Model errors
  model(modelId: ModelId, options: ErrorFactoryOptions): ModelError;
  modelNotFound(modelId: ModelId, options: ErrorFactoryOptions): ModelNotFoundError;
  contextLength(
    modelId: ModelId,
    maxTokens: number,
    requestedTokens: number,
    options: ErrorFactoryOptions
  ): ContextLengthError;

  // Tool errors
  tool(toolId: ToolId, options: ErrorFactoryOptions): ToolError;
  toolNotFound(toolId: ToolId, options: ErrorFactoryOptions): ToolNotFoundError;
  toolExecution(toolId: ToolId, options: ErrorFactoryOptions): ToolExecutionError;

  // Agent errors
  agent(agentId: AgentId, options: ErrorFactoryOptions): AgentError;
  agentNotFound(agentId: AgentId, options: ErrorFactoryOptions): AgentNotFoundError;

  // Stream errors
  stream(options: ErrorFactoryOptions): StreamError;
  streamAbort(reason: string, options: ErrorFactoryOptions): StreamAbortError;

  // Configuration errors
  configuration(configKey: string, options: ErrorFactoryOptions): ConfigurationError;
  missingConfig(requiredKeys: readonly string[], options: ErrorFactoryOptions): MissingConfigError;

  // Internal errors
  internal(component: string, options: ErrorFactoryOptions): InternalError;
  notImplemented(feature: string, options: ErrorFactoryOptions): NotImplementedError;

  // Aggregate errors
  aggregate(errors: readonly AIKitError[], options: ErrorFactoryOptions): AggregateError;
}

// ============================================================================
// Error Handler
// ============================================================================

/**
 * Error handler function
 */
export type ErrorHandler = (error: AIKitError, context?: ErrorContext) => void | Promise<void>;

/**
 * Error recovery strategy
 */
export type ErrorRecoveryStrategy =
  | 'retry'
  | 'fallback'
  | 'ignore'
  | 'propagate'
  | 'circuit-break'
  | 'custom';

/**
 * Error recovery options
 */
export interface ErrorRecoveryOptions {
  readonly strategy: ErrorRecoveryStrategy;
  readonly maxRetries?: number;
  readonly retryDelay?: number; // milliseconds
  readonly fallbackValue?: JsonValue;
  readonly circuitBreakerThreshold?: number;
  readonly customHandler?: ErrorHandler;
}

/**
 * Error handling middleware
 */
export type ErrorMiddleware = (
  error: AIKitError,
  next: (error: AIKitError) => void | Promise<void>
) => void | Promise<void>;

// ============================================================================
// Error Reporter
// ============================================================================

/**
 * Error report
 */
export interface ErrorReport {
  readonly error: AIKitError;
  readonly context: ErrorContext;
  readonly timestamp: number;
  readonly stackTrace?: string;
  readonly userAgent?: string;
  readonly environment?: string;
  readonly version?: string;
}

/**
 * Error reporter interface
 */
export interface ErrorReporter {
  report(error: AIKitError, context?: ErrorContext): void | Promise<void>;
  reportMany(errors: readonly AIKitError[], context?: ErrorContext): void | Promise<void>;
}

// ============================================================================
// Error Statistics
// ============================================================================

/**
 * Error statistics
 */
export interface ErrorStatistics {
  readonly totalErrors: number;
  readonly errorsByCategory: Record<ErrorCategory, number>;
  readonly errorsBySeverity: Record<ErrorSeverity, number>;
  readonly errorRate: number; // errors per minute
  readonly mostCommonErrors: readonly ErrorSummary[];
  readonly period: {
    readonly start: number;
    readonly end: number;
  };
}

/**
 * Error summary
 */
export interface ErrorSummary {
  readonly code: ErrorCode;
  readonly message: string;
  readonly count: number;
  readonly category: ErrorCategory;
  readonly severity: ErrorSeverity;
  readonly firstOccurrence: number;
  readonly lastOccurrence: number;
}
