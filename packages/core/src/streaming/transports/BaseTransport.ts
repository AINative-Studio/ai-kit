/**
 * Base transport implementation with common functionality
 */

import { EventEmitter } from 'events'
import { CircularMessageBuffer } from './MessageBuffer'
import type {
  Transport,
  TransportConfig,
  TransportState,
  TransportType,
  TransportMetrics,
  TransportErrorEvent,
  ReconnectEvent,
  BackpressureEvent,
  MessageBuffer,
} from './types'

/**
 * Generate unique transport ID
 */
function generateId(): string {
  return `transport_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Base transport class with common reconnection and buffering logic
 */
export abstract class BaseTransport extends EventEmitter implements Transport {
  public readonly id: string
  public abstract readonly type: TransportType

  protected state: TransportState = 'idle'
  protected config: TransportConfig
  protected reconnectAttempt = 0
  protected reconnectTimeout?: NodeJS.Timeout
  protected intentionallyClosed = false
  protected messageBuffer: MessageBuffer
  protected paused = false

  // Metrics
  protected connectedAt?: number
  protected messagesSent = 0
  protected messagesReceived = 0
  protected errors = 0
  protected lastError?: Error
  protected latencies: number[] = []

  constructor(config: TransportConfig) {
    super()
    this.id = generateId()

    // Merge with defaults
    this.config = {
      reconnect: true,
      maxReconnectAttempts: 3,
      reconnectDelay: 1000,
      backoffMultiplier: 2,
      maxReconnectDelay: 30000,
      jitter: true,
      timeout: 30000,
      retryOnStatusCodes: [408, 429, 500, 502, 503, 504],
      ...config,
      buffer: {
        maxSize: 1000,
        strategy: 'drop-oldest',
        highWaterMark: 800,
        ...config.buffer,
      },
    }

    // Initialize message buffer
    this.messageBuffer = new CircularMessageBuffer(
      this.config.buffer?.maxSize,
      this.config.buffer?.strategy,
      this.config.buffer?.highWaterMark
        ? this.config.buffer.highWaterMark / (this.config.buffer.maxSize || 1000)
        : 0.8
    )

    // Debug logging
    if (this.config.debug) {
      this.enableDebugLogging()
    }
  }

  /**
   * Establish connection - to be implemented by subclasses
   */
  abstract connect(): Promise<void>

  /**
   * Perform the actual connection - to be implemented by subclasses
   */
  protected abstract performConnect(): Promise<void>

  /**
   * Send data through the transport - to be implemented by subclasses
   */
  abstract send(data: any): Promise<void>

  /**
   * Close the connection
   */
  close(): void {
    this.intentionallyClosed = true
    this.state = 'closed'

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = undefined
    }

    this.messageBuffer.clear()
    this.emit('closed')
  }

  /**
   * Get current transport state
   */
  getState(): TransportState {
    return this.state
  }

  /**
   * Get transport metrics
   */
  getMetrics(): TransportMetrics {
    return {
      id: this.id,
      type: this.type,
      state: this.state,
      connectedAt: this.connectedAt,
      connectionDuration: this.connectedAt
        ? Date.now() - this.connectedAt
        : undefined,
      messagesSent: this.messagesSent,
      messagesReceived: this.messagesReceived,
      errors: this.errors,
      reconnectAttempts: this.reconnectAttempt,
      bufferSize: this.messageBuffer.size(),
      avgLatency:
        this.latencies.length > 0
          ? this.latencies.reduce((a, b) => a + b, 0) / this.latencies.length
          : undefined,
      lastError: this.lastError,
    }
  }

  /**
   * Check if transport is connected
   */
  isConnected(): boolean {
    return this.state === 'connected'
  }

  /**
   * Pause message processing (backpressure)
   */
  pause(): void {
    this.paused = true
    this.log('Transport paused')
  }

  /**
   * Resume message processing
   */
  resume(): void {
    this.paused = false
    this.log('Transport resumed')

    // Process buffered messages
    this.drainBuffer()
  }

  /**
   * Check if should attempt reconnection
   */
  protected shouldReconnect(): boolean {
    if (!this.config.reconnect) {
      return false
    }

    const maxAttempts = this.config.maxReconnectAttempts ?? 3
    if (this.reconnectAttempt >= maxAttempts) {
      return false
    }

    return true
  }

  /**
   * Calculate reconnection delay with exponential backoff and jitter
   */
  protected calculateBackoff(): number {
    const baseDelay = this.config.reconnectDelay ?? 1000
    const multiplier = this.config.backoffMultiplier ?? 2
    const maxDelay = this.config.maxReconnectDelay ?? 30000

    let delay = Math.min(
      baseDelay * Math.pow(multiplier, this.reconnectAttempt),
      maxDelay
    )

    // Add jitter to prevent thundering herd
    if (this.config.jitter) {
      const jitter = delay * 0.3 * Math.random()
      delay = delay + jitter
    }

    return Math.floor(delay)
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  protected async scheduleReconnect(): Promise<void> {
    if (!this.shouldReconnect()) {
      this.log('Max reconnection attempts reached')
      return
    }

    this.reconnectAttempt++
    this.state = 'reconnecting'

    const delay = this.calculateBackoff()

    const reconnectEvent: ReconnectEvent = {
      attempt: this.reconnectAttempt,
      delay,
      maxAttempts: this.config.maxReconnectAttempts,
    }
    this.emit('reconnecting', reconnectEvent)

    this.log(`Reconnecting (attempt ${this.reconnectAttempt}) in ${delay}ms`)

    return new Promise((resolve) => {
      this.reconnectTimeout = setTimeout(async () => {
        try {
          await this.performConnect()
          resolve()
        } catch (error) {
          // Error already handled in performConnect
          resolve()
        }
      }, delay)
    })
  }

  /**
   * Handle error with enhanced context
   */
  protected handleError(error: Error, recoverable = true): void {
    this.errors++
    this.lastError = error

    const transportError: TransportErrorEvent = {
      error,
      recoverable,
      context: {
        state: this.state,
        attempt: this.reconnectAttempt,
        timestamp: Date.now(),
      },
    }

    this.emit('error', transportError)
    this.log(`Error: ${error.message}`, 'error')
  }

  /**
   * Buffer message and handle backpressure
   */
  protected bufferMessage(message: any): void {
    const wasHighWater = this.messageBuffer.isHighWater()

    const added = this.messageBuffer.push(message)

    if (!added) {
      this.log('Message dropped - buffer full', 'warn')
    }

    // Emit backpressure event if we crossed high water mark
    if (!wasHighWater && this.messageBuffer.isHighWater()) {
      const config = (this.messageBuffer as CircularMessageBuffer).getConfig()
      const backpressureEvent: BackpressureEvent = {
        bufferSize: config.currentSize,
        bufferLimit: config.maxSize,
        highWaterMark: config.highWaterMark,
      }
      this.emit('backpressure', backpressureEvent)
      this.log('Backpressure: buffer high water mark reached', 'warn')
    }

    // Process buffer if not paused
    if (!this.paused) {
      this.drainBuffer()
    }
  }

  /**
   * Drain buffered messages
   */
  protected drainBuffer(): void {
    const wasHighWater = this.messageBuffer.isHighWater()

    while (!this.paused && !this.messageBuffer.isEmpty()) {
      const message = this.messageBuffer.shift()
      if (message) {
        this.messagesReceived++
        this.emit('event', message)
      }
    }

    // Emit drain event if we went below high water mark
    if (wasHighWater && !this.messageBuffer.isHighWater()) {
      this.emit('drain')
      this.log('Buffer drained below high water mark')
    }
  }

  /**
   * Track message latency
   */
  protected trackLatency(latency: number): void {
    this.latencies.push(latency)

    // Keep only last 100 latencies to prevent memory growth
    if (this.latencies.length > 100) {
      this.latencies.shift()
    }
  }

  /**
   * Debug logging
   */
  protected log(message: string, level: 'debug' | 'info' | 'warn' | 'error' = 'debug'): void {
    if (this.config.debug) {
      const prefix = `[${this.type}:${this.id.slice(-6)}]`
      console[level](`${prefix} ${message}`)
    }
  }

  /**
   * Enable debug logging for all events
   */
  private enableDebugLogging(): void {
    this.on('connecting', () => this.log('Event: connecting'))
    this.on('connected', () => this.log('Event: connected'))
    this.on('reconnecting', (e) => this.log(`Event: reconnecting (attempt ${e.attempt})`))
    this.on('event', () => this.log('Event: message received'))
    this.on('done', () => this.log('Event: done'))
    this.on('error', (e) => this.log(`Event: error - ${e.error.message}`, 'error'))
    this.on('closed', () => this.log('Event: closed'))
    this.on('backpressure', (e) => this.log(`Event: backpressure (${e.bufferSize}/${e.bufferLimit})`, 'warn'))
    this.on('drain', () => this.log('Event: drain'))
  }

  /**
   * Check if error should trigger retry
   */
  protected shouldRetryError(error: Error): boolean {
    if (this.config.shouldRetry) {
      return this.config.shouldRetry(error, this.reconnectAttempt)
    }

    // Default: retry on network errors and specific status codes
    return true
  }
}
