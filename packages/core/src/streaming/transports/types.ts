/**
 * Transport layer types for AI streaming
 * Defines interfaces for pluggable transport implementations
 */

import type { EventEmitter } from 'events'

/**
 * Transport state
 */
export type TransportState =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error'
  | 'closed'

/**
 * Transport event data
 */
export interface TransportEvent {
  [key: string]: any
}

/**
 * Reconnection event data
 */
export interface ReconnectEvent {
  attempt: number
  delay: number
  maxAttempts?: number
}

/**
 * Error event data with enhanced context
 */
export interface TransportErrorEvent {
  error: Error
  recoverable?: boolean
  code?: string | number
  context?: {
    state?: TransportState
    attempt?: number
    timestamp?: number
  }
}

/**
 * Backpressure event data
 */
export interface BackpressureEvent {
  bufferSize: number
  bufferLimit: number
  highWaterMark: number
}

/**
 * Message buffering strategy
 */
export type BufferingStrategy = 'drop-oldest' | 'drop-newest' | 'block' | 'unlimited'

/**
 * Transport type
 */
export type TransportType = 'sse' | 'websocket' | 'http-stream'

/**
 * Transport configuration
 */
export interface TransportConfig {
  /** Endpoint URL for the transport */
  endpoint: string

  /** Custom headers to send with requests */
  headers?: Record<string, string>

  /** Enable automatic reconnection on connection loss */
  reconnect?: boolean

  /** Maximum number of reconnection attempts (default: 3) */
  maxReconnectAttempts?: number

  /** Initial delay before reconnection in ms (default: 1000) */
  reconnectDelay?: number

  /** Backoff multiplier for exponential backoff (default: 2) */
  backoffMultiplier?: number

  /** Maximum delay between reconnection attempts in ms (default: 30000) */
  maxReconnectDelay?: number

  /** Add jitter to reconnection delays (default: true) */
  jitter?: boolean

  /** Heartbeat interval in ms for keep-alive (optional) */
  heartbeatInterval?: number

  /** Request timeout in ms (default: 30000) */
  timeout?: number

  /** WebSocket-specific: protocols */
  protocols?: string | string[]

  /** WebSocket-specific: binary type */
  binaryType?: 'blob' | 'arraybuffer'

  /** Message buffer configuration */
  buffer?: {
    /** Maximum buffer size in messages (default: 1000) */
    maxSize?: number
    /** Buffering strategy when limit reached (default: 'drop-oldest') */
    strategy?: BufferingStrategy
    /** High water mark for backpressure warning (default: 0.8 * maxSize) */
    highWaterMark?: number
  }

  /** SSE-specific: withCredentials for CORS */
  withCredentials?: boolean

  /** SSE-specific: last event ID for resuming */
  lastEventId?: string

  /** HTTP Stream-specific: chunk size in bytes */
  chunkSize?: number

  /** HTTP Stream-specific: enable long-polling fallback */
  longPolling?: boolean

  /** HTTP Stream-specific: long-polling interval in ms */
  longPollingInterval?: number

  /** Retry on specific HTTP status codes */
  retryOnStatusCodes?: number[]

  /** Custom retry logic */
  shouldRetry?: (error: Error, attempt: number) => boolean

  /** Debug mode for verbose logging */
  debug?: boolean
}

/**
 * Message buffer interface
 */
export interface MessageBuffer {
  /** Add message to buffer */
  push(message: TransportEvent): boolean

  /** Get next message from buffer */
  shift(): TransportEvent | undefined

  /** Get buffer size */
  size(): number

  /** Check if buffer is empty */
  isEmpty(): boolean

  /** Check if buffer is full */
  isFull(): boolean

  /** Check if above high water mark */
  isHighWater(): boolean

  /** Clear all messages */
  clear(): void

  /** Get all messages */
  getAll(): TransportEvent[]
}

/**
 * Transport metrics
 */
export interface TransportMetrics {
  /** Transport ID */
  id: string

  /** Transport type */
  type: TransportType

  /** Current state */
  state: TransportState

  /** Connection start time */
  connectedAt?: number

  /** Total connection duration in ms */
  connectionDuration?: number

  /** Number of messages sent */
  messagesSent: number

  /** Number of messages received */
  messagesReceived: number

  /** Number of errors encountered */
  errors: number

  /** Number of reconnection attempts */
  reconnectAttempts: number

  /** Current buffer size */
  bufferSize: number

  /** Average message latency in ms */
  avgLatency?: number

  /** Last error */
  lastError?: Error
}

/**
 * Base transport interface
 * All transport implementations must implement this interface
 */
export interface Transport extends EventEmitter {
  /**
   * Transport ID
   */
  readonly id: string

  /**
   * Transport type
   */
  readonly type: TransportType

  /**
   * Establish connection
   */
  connect(): Promise<void>

  /**
   * Send data through the transport
   */
  send(data: any): Promise<void>

  /**
   * Close the connection
   */
  close(): void

  /**
   * Get current transport state
   */
  getState(): TransportState

  /**
   * Get transport metrics
   */
  getMetrics(): TransportMetrics

  /**
   * Check if transport is connected
   */
  isConnected(): boolean

  /**
   * Pause message processing (backpressure)
   */
  pause(): void

  /**
   * Resume message processing
   */
  resume(): void

  /**
   * Events:
   * - 'connecting': Emitted when connection is being established
   * - 'connected': Emitted when connection is established
   * - 'reconnecting': Emitted when attempting to reconnect (data: ReconnectEvent)
   * - 'event': Emitted when data is received (data: TransportEvent)
   * - 'done': Emitted when stream is complete
   * - 'error': Emitted on error (data: TransportErrorEvent)
   * - 'closed': Emitted when connection is closed
   * - 'backpressure': Emitted when buffer reaches high water mark (data: BackpressureEvent)
   * - 'drain': Emitted when buffer is below high water mark again
   */
}

/**
 * Transport health status
 */
export interface TransportHealth {
  healthy: boolean
  state: TransportState
  lastHeartbeat?: number
  consecutiveErrors: number
  uptime?: number
}
