/**
 * Streaming type definitions for AI Kit
 * Comprehensive types for streaming AI responses
 */

import type {
  MessageId,
  SessionId,
  Timestamp,
  JsonValue,
  Result,
} from './utils';
import type { PerformanceMetrics } from './common.d';
import type {
  RateLimitConfig,
  RetryConfig,
  TimeoutConfig,
  ToolCall,
} from './common';

// ============================================================================
// Core Streaming Types
// ============================================================================

/**
 * Message role in a conversation
 */
export type MessageRole = 'user' | 'assistant' | 'system' | 'function' | 'tool';

/**
 * Message content type
 */
export type MessageContentType = 'text' | 'image' | 'audio' | 'video' | 'file';

/**
 * Message content
 */
export interface MessageContent {
  readonly type: MessageContentType;
  readonly data: string;
  readonly mimeType?: string;
  readonly metadata?: Record<string, JsonValue>;
}

/**
 * Text message content
 */
export interface TextContent extends MessageContent {
  readonly type: 'text';
  readonly data: string;
}

/**
 * Image message content
 */
export interface ImageContent extends MessageContent {
  readonly type: 'image';
  readonly data: string; // Base64 or URL
  readonly width?: number;
  readonly height?: number;
  readonly mimeType: string;
}

/**
 * Core message interface
 */
export interface Message {
  readonly id: MessageId;
  readonly role: MessageRole;
  readonly content: string | MessageContent | MessageContent[];
  readonly timestamp: Timestamp;
  readonly sessionId?: SessionId;
  readonly metadata?: MessageMetadata;
  readonly name?: string; // For function/tool messages
  readonly functionCall?: FunctionCall;
  readonly toolCalls?: ToolCall[];
}

/**
 * Message metadata
 */
export interface MessageMetadata {
  readonly edited?: boolean;
  readonly deleted?: boolean;
  readonly parentId?: MessageId;
  readonly threadId?: string;
  readonly tags?: readonly string[];
  readonly annotations?: readonly Annotation[];
  readonly [key: string]: JsonValue | undefined;
}

/**
 * Message annotation (for citations, highlights, etc.)
 */
export interface Annotation {
  readonly type: string;
  readonly startIndex: number;
  readonly endIndex: number;
  readonly data?: JsonValue;
}

/**
 * Function call in a message
 */
export interface FunctionCall {
  readonly name: string;
  readonly arguments: string; // JSON string
}

// Re-export ToolCall from common
export type { ToolCall } from './common';

// ============================================================================
// Usage and Cost Tracking
// ============================================================================

/**
 * Token usage information
 */
export interface Usage {
  readonly promptTokens: number;
  readonly completionTokens: number;
  readonly totalTokens: number;
  readonly cacheReadTokens?: number;
  readonly cacheWriteTokens?: number;
}

/**
 * Cost information
 */
export interface Cost {
  readonly amount: number;
  readonly currency: string;
  readonly breakdown?: CostBreakdown;
}

/**
 * Detailed cost breakdown
 */
export interface CostBreakdown {
  readonly promptCost: number;
  readonly completionCost: number;
  readonly cacheCost?: number;
  readonly totalCost: number;
}

/**
 * Performance metrics
 * Re-export from common types for backwards compatibility
 */
export type { PerformanceMetrics };

/**
 * Complete usage statistics
 */
export interface UsageStats extends Usage {
  readonly estimatedCost?: Cost;
  readonly performance?: PerformanceMetrics;
  readonly model?: string;
  readonly cacheHit?: boolean;
  readonly provider?: string;
}

// ============================================================================
// Stream Events
// ============================================================================

/**
 * Stream event types
 */
export type StreamEventType =
  | 'start'
  | 'token'
  | 'content'
  | 'function_call'
  | 'tool_call'
  | 'done'
  | 'error'
  | 'metadata'
  | 'usage'
  | 'abort';

/**
 * Base stream event
 */
export interface BaseStreamEvent<T extends StreamEventType = StreamEventType> {
  readonly type: T;
  readonly timestamp: Timestamp;
  readonly sessionId?: SessionId;
}

/**
 * Stream start event
 */
export interface StreamStartEvent extends BaseStreamEvent<'start'> {
  readonly messageId: MessageId;
  readonly model?: string;
}

/**
 * Token event (individual token streamed)
 */
export interface TokenEvent extends BaseStreamEvent<'token'> {
  readonly token: string;
  readonly messageId: MessageId;
}

/**
 * Content event (chunk of content)
 */
export interface ContentEvent extends BaseStreamEvent<'content'> {
  readonly content: string;
  readonly messageId: MessageId;
  readonly delta?: string; // For incremental updates
}

/**
 * Function call event
 */
export interface FunctionCallEvent extends BaseStreamEvent<'function_call'> {
  readonly functionCall: FunctionCall;
  readonly messageId: MessageId;
}

/**
 * Tool call event
 */
export interface ToolCallEvent extends BaseStreamEvent<'tool_call'> {
  readonly toolCall: ToolCall;
  readonly messageId: MessageId;
}

/**
 * Stream done event
 */
export interface StreamDoneEvent extends BaseStreamEvent<'done'> {
  readonly messageId: MessageId;
  readonly message: Message;
  readonly usage?: UsageStats;
}

/**
 * Stream error event
 */
export interface StreamErrorEvent extends BaseStreamEvent<'error'> {
  readonly error: Error;
  readonly recoverable: boolean;
  readonly retryAfter?: number; // milliseconds
}

/**
 * Stream metadata event
 */
export interface StreamMetadataEvent extends BaseStreamEvent<'metadata'> {
  readonly metadata: Record<string, JsonValue>;
}

/**
 * Stream usage event
 */
export interface StreamUsageEvent extends BaseStreamEvent<'usage'> {
  readonly usage: UsageStats;
}

/**
 * Stream abort event
 */
export interface StreamAbortEvent extends BaseStreamEvent<'abort'> {
  readonly reason?: string;
}

/**
 * Union of all stream events
 */
export type StreamEvent =
  | StreamStartEvent
  | TokenEvent
  | ContentEvent
  | FunctionCallEvent
  | ToolCallEvent
  | StreamDoneEvent
  | StreamErrorEvent
  | StreamMetadataEvent
  | StreamUsageEvent
  | StreamAbortEvent;

// ============================================================================
// Stream Configuration
// ============================================================================

// Re-export RetryConfig from common
export type { RetryConfig } from './common';

/**
 * Cache configuration
 */
export interface CacheConfig {
  readonly enabled: boolean;
  readonly ttl?: number; // seconds
  readonly storage?: 'memory' | 'redis' | 'custom';
  readonly keyPrefix?: string;
  readonly maxSize?: number; // max items in cache
}

// Re-export TimeoutConfig from common
export type { TimeoutConfig } from './common';

// Re-export RateLimitConfig from common
export type { RateLimitConfig } from './common';

/**
 * Stream transport type
 */
export type StreamTransport = 'sse' | 'websocket' | 'http' | 'grpc';

/**
 * Stream options
 */
export interface StreamOptions {
  readonly transport?: StreamTransport;
  readonly reconnect?: boolean;
  readonly maxReconnectAttempts?: number;
  readonly reconnectDelay?: number; // milliseconds
  readonly heartbeatInterval?: number; // milliseconds
  readonly bufferSize?: number;
}

/**
 * Stream configuration
 */
export interface StreamConfig {
  readonly endpoint: string;
  readonly model?: string;
  readonly systemPrompt?: string;
  readonly temperature?: number;
  readonly maxTokens?: number;
  readonly topP?: number;
  readonly topK?: number;
  readonly frequencyPenalty?: number;
  readonly presencePenalty?: number;
  readonly stop?: readonly string[];
  readonly options?: StreamOptions;
  readonly retry?: RetryConfig;
  readonly cache?: boolean | CacheConfig;
  readonly timeout?: number | TimeoutConfig;
  readonly rateLimit?: RateLimitConfig;
  readonly headers?: Record<string, string>;
  readonly metadata?: Record<string, JsonValue>;
}

// ============================================================================
// Stream Callbacks
// ============================================================================

/**
 * Stream event handlers
 */
export interface StreamCallbacks {
  readonly onStart?: (event: StreamStartEvent) => void | Promise<void>;
  readonly onToken?: (token: string) => void | Promise<void>;
  readonly onContent?: (content: string) => void | Promise<void>;
  readonly onFunctionCall?: (call: FunctionCall) => void | Promise<void>;
  readonly onToolCall?: (call: ToolCall) => void | Promise<void>;
  readonly onDone?: (event: StreamDoneEvent) => void | Promise<void>;
  readonly onError?: (error: Error) => void | Promise<void>;
  readonly onMetadata?: (metadata: Record<string, JsonValue>) => void | Promise<void>;
  readonly onUsage?: (usage: UsageStats) => void | Promise<void>;
  readonly onAbort?: (reason?: string) => void | Promise<void>;
  readonly onEvent?: (event: StreamEvent) => void | Promise<void>;
}

// ============================================================================
// Stream Result
// ============================================================================

/**
 * Stream state
 */
export type StreamState =
  | 'idle'
  | 'connecting'
  | 'streaming'
  | 'paused'
  | 'done'
  | 'error'
  | 'aborted';

/**
 * Stream result interface
 */
export interface StreamResult {
  readonly messages: readonly Message[];
  readonly state: StreamState;
  readonly isStreaming: boolean;
  readonly error: Error | null;
  readonly usage: UsageStats;

  // Methods
  send(content: string): Promise<void>;
  sendMessage(message: Omit<Message, 'id' | 'timestamp'>): Promise<void>;
  reset(): void;
  retry(): Promise<void>;
  pause(): void;
  resume(): void;
  abort(reason?: string): void;
  getHistory(): readonly Message[];
}

// ============================================================================
// Stream Controller
// ============================================================================

/**
 * Stream controller for managing stream lifecycle
 */
export interface StreamController {
  readonly signal: AbortSignal;
  readonly state: StreamState;

  abort(reason?: string): void;
  pause(): void;
  resume(): void;
  retry(): Promise<void>;
  isAborted(): boolean;
  isPaused(): boolean;
}

// ============================================================================
// Server-Sent Events (SSE)
// ============================================================================

/**
 * SSE message
 */
export interface SSEMessage {
  readonly id?: string;
  readonly event?: string;
  readonly data: string;
  readonly retry?: number;
}

/**
 * SSE stream configuration
 */
export interface SSEConfig extends StreamOptions {
  readonly transport: 'sse';
  readonly withCredentials?: boolean;
  readonly eventSourceInitDict?: EventSourceInit;
}

// ============================================================================
// WebSocket
// ============================================================================

/**
 * WebSocket message
 */
export interface WebSocketMessage {
  readonly type: string;
  readonly payload: JsonValue;
  readonly id?: string;
}

/**
 * WebSocket stream configuration
 */
export interface WebSocketConfig extends StreamOptions {
  readonly transport: 'websocket';
  readonly protocols?: string | readonly string[];
  readonly binaryType?: 'blob' | 'arraybuffer';
}

// ============================================================================
// Streaming Functions
// ============================================================================

/**
 * Stream function configuration
 */
export interface StreamFunction {
  readonly name: string;
  readonly description?: string;
  readonly parameters: JsonValue; // JSON Schema
  readonly handler: (args: JsonValue) => Promise<JsonValue> | JsonValue;
}

/**
 * Stream tool configuration
 */
export interface StreamTool {
  readonly type: 'function';
  readonly function: Omit<StreamFunction, 'handler'>;
}

// ============================================================================
// Advanced Stream Types
// ============================================================================

/**
 * Multimodal stream configuration
 */
export interface MultimodalStreamConfig extends StreamConfig {
  readonly supportedContentTypes?: readonly MessageContentType[];
  readonly maxImageSize?: number; // bytes
  readonly maxAudioDuration?: number; // seconds
}

/**
 * Batch stream configuration for multiple concurrent streams
 */
export interface BatchStreamConfig {
  readonly streams: readonly StreamConfig[];
  readonly concurrent?: number;
  readonly failFast?: boolean;
  readonly aggregateResults?: boolean;
}

/**
 * Stream middleware function
 */
export type StreamMiddleware = (
  event: StreamEvent,
  next: (event: StreamEvent) => void | Promise<void>
) => void | Promise<void>;

/**
 * Stream with middleware support
 */
export interface StreamWithMiddleware extends StreamResult {
  use(middleware: StreamMiddleware): void;
  removeMiddleware(middleware: StreamMiddleware): void;
}
