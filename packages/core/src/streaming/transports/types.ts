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
 * Error event data
 */
export interface TransportErrorEvent {
  error: Error
  recoverable?: boolean
  code?: string | number
}

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

  /** Heartbeat interval in ms for keep-alive (optional) */
  heartbeatInterval?: number

  /** WebSocket-specific: protocols */
  protocols?: string | string[]

  /** WebSocket-specific: binary type */
  binaryType?: 'blob' | 'arraybuffer'

  /** Request timeout in ms */
  timeout?: number
}

/**
 * Base transport interface
 * All transport implementations must implement this interface
 */
export interface Transport extends EventEmitter {
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
   * Events:
   * - 'connecting': Emitted when connection is being established
   * - 'connected': Emitted when connection is established
   * - 'reconnecting': Emitted when attempting to reconnect (data: ReconnectEvent)
   * - 'event': Emitted when data is received (data: TransportEvent)
   * - 'done': Emitted when stream is complete
   * - 'error': Emitted on error (data: TransportErrorEvent)
   * - 'closed': Emitted when connection is closed
   */
}
