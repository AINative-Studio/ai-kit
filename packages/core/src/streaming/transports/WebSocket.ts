/**
 * WebSocket transport implementation
 * Provides bi-directional streaming with automatic reconnection
 */

import { EventEmitter } from 'events'
import type {
  Transport,
  TransportConfig,
  TransportState,
  TransportEvent,
  TransportErrorEvent,
  ReconnectEvent,
} from './types'

/**
 * WebSocket Transport
 * Implements streaming over WebSocket with automatic reconnection
 */
export class WebSocketTransport extends EventEmitter implements Transport {
  private config: TransportConfig
  private state: TransportState = 'idle'
  private ws?: WebSocket
  private reconnectAttempt = 0
  private reconnectTimeout?: NodeJS.Timeout
  private intentionallyClosed = false
  private heartbeatInterval?: NodeJS.Timeout

  constructor(config: TransportConfig) {
    super()

    // Convert HTTP(S) URLs to WS(S)
    let endpoint = config.endpoint
    if (endpoint.startsWith('http://')) {
      endpoint = endpoint.replace('http://', 'ws://')
    } else if (endpoint.startsWith('https://')) {
      endpoint = endpoint.replace('https://', 'wss://')
    }

    this.config = {
      reconnect: true,
      maxReconnectAttempts: 3,
      reconnectDelay: 1000,
      backoffMultiplier: 2,
      maxReconnectDelay: 30000,
      ...config,
      endpoint,
    }
  }

  /**
   * Establish WebSocket connection
   */
  async connect(): Promise<void> {
    this.intentionallyClosed = false
    return this.performConnect()
  }

  private performConnect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.state = 'connecting'
        this.emit('connecting')

        // Create WebSocket with optional protocols
        this.ws = new WebSocket(
          this.config.endpoint,
          this.config.protocols
        )

        // Set binary type if specified
        if (this.config.binaryType) {
          this.ws.binaryType = this.config.binaryType
        }

        // Setup event handlers
        this.ws.onopen = () => {
          this.state = 'connected'
          this.emit('connected')
          this.reconnectAttempt = 0

          // Start heartbeat if configured
          if (this.config.heartbeatInterval) {
            this.startHeartbeat()
          }

          resolve()
        }

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data)
        }

        this.ws.onerror = (event) => {
          if (!this.intentionallyClosed) {
            const transportError: TransportErrorEvent = {
              error: new Error('WebSocket error'),
              recoverable: true,
            }
            this.emit('error', transportError)
          }
        }

        this.ws.onclose = (event) => {
          this.stopHeartbeat()

          if (this.intentionallyClosed) {
            this.state = 'closed'
            resolve()
            return
          }

          this.state = 'error'
          const transportError: TransportErrorEvent = {
            error: new Error(`WebSocket closed: ${event.code} ${event.reason}`),
            recoverable: true,
            code: event.code,
          }
          this.emit('error', transportError)

          if (this.config.reconnect && this.shouldReconnect()) {
            // Schedule reconnection asynchronously
            this.scheduleReconnect().catch(() => {
              // Ignore errors - they're already handled
            })
          }
          resolve()
        }
      } catch (error) {
        this.state = 'error'
        const transportError: TransportErrorEvent = {
          error: error as Error,
          recoverable: true,
        }
        this.emit('error', transportError)

        if (this.config.reconnect && this.shouldReconnect()) {
          // Schedule reconnection asynchronously
          this.scheduleReconnect().catch(() => {
            // Ignore errors - they're already handled
          })
        }
        resolve()
      }
    })
  }

  /**
   * Handle incoming WebSocket message
   */
  private handleMessage(data: string | ArrayBuffer): void {
    try {
      // Handle string messages (JSON)
      const messageStr = typeof data === 'string' ? data : new TextDecoder().decode(data)
      const parsed = JSON.parse(messageStr)

      // Check for special message types
      if (parsed.type === 'done') {
        this.emit('done')
        return
      }

      if (parsed.type === 'error') {
        const transportError: TransportErrorEvent = {
          error: new Error(parsed.error || 'Unknown error'),
          recoverable: true,
        }
        this.emit('error', transportError)
        return
      }

      // Emit regular event
      this.emit('event', parsed as TransportEvent)
    } catch (error) {
      // Handle malformed JSON
      const transportError: TransportErrorEvent = {
        error: new Error(`Failed to parse message: ${data}`),
        recoverable: true,
      }
      this.emit('error', transportError)
    }
  }

  /**
   * Send data through the transport
   */
  async send(data: any): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected')
    }

    const message = JSON.stringify(data)
    this.ws.send(message)
  }

  /**
   * Close the connection
   */
  close(): void {
    this.intentionallyClosed = true
    this.state = 'closed'

    this.stopHeartbeat()

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = undefined
    }

    if (this.ws) {
      this.ws.close(1000, 'Normal closure')
      this.ws = undefined
    }

    this.emit('closed')
  }

  /**
   * Get current transport state
   */
  getState(): TransportState {
    return this.state
  }

  /**
   * Check if should attempt reconnection
   */
  private shouldReconnect(): boolean {
    const maxAttempts = this.config.maxReconnectAttempts ?? 3
    return this.reconnectAttempt < maxAttempts
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  private scheduleReconnect(): Promise<void> {
    this.reconnectAttempt++
    this.state = 'reconnecting'

    const baseDelay = this.config.reconnectDelay ?? 1000
    const multiplier = this.config.backoffMultiplier ?? 2
    const maxDelay = this.config.maxReconnectDelay ?? 30000

    const delay = Math.min(
      baseDelay * Math.pow(multiplier, this.reconnectAttempt - 1),
      maxDelay
    )

    const reconnectEvent: ReconnectEvent = {
      attempt: this.reconnectAttempt,
      delay,
      maxAttempts: this.config.maxReconnectAttempts,
    }
    this.emit('reconnecting', reconnectEvent)

    return new Promise((resolve, reject) => {
      this.reconnectTimeout = setTimeout(() => {
        this.performConnect().then(resolve).catch(reject)
      }, delay)
    })
  }

  /**
   * Start heartbeat/ping interval
   */
  private startHeartbeat(): void {
    if (!this.config.heartbeatInterval) {
      return
    }

    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }))
      }
    }, this.config.heartbeatInterval)
  }

  /**
   * Stop heartbeat interval
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = undefined
    }
  }
}
