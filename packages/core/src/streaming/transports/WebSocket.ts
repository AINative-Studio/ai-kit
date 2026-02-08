/**
 * Enhanced WebSocket transport implementation
 * Provides bi-directional streaming with automatic reconnection and backpressure handling
 */

import { BaseTransport } from './BaseTransport'
import type {
  TransportConfig,
  TransportEvent,
  TransportType,
} from './types'

/**
 * WebSocket Transport
 * Implements streaming over WebSocket with automatic reconnection
 */
export class WebSocketTransport extends BaseTransport {
  public readonly type: TransportType = 'websocket'

  private ws?: WebSocket
  private heartbeatInterval?: NodeJS.Timeout
  private heartbeatTimeoutId?: NodeJS.Timeout
  private lastPongReceived?: number
  private sendQueue: any[] = []

  constructor(config: TransportConfig) {
    // Convert HTTP(S) URLs to WS(S)
    let endpoint = config.endpoint
    if (endpoint.startsWith('http://')) {
      endpoint = endpoint.replace('http://', 'ws://')
    } else if (endpoint.startsWith('https://')) {
      endpoint = endpoint.replace('https://', 'wss://')
    }

    super({
      ...config,
      endpoint,
    })
  }

  /**
   * Establish WebSocket connection
   */
  async connect(): Promise<void> {
    this.intentionallyClosed = false
    return this.performConnect()
  }

  /**
   * Perform the actual connection
   */
  protected performConnect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.state = 'connecting'
        this.emit('connecting')
        this.log('Connecting to WebSocket endpoint')

        // Create WebSocket with optional protocols
        this.ws = new WebSocket(
          this.config.endpoint,
          this.config.protocols
        )

        // Set binary type if specified
        if (this.config.binaryType) {
          this.ws.binaryType = this.config.binaryType
        }

        // Setup connection timeout
        const connectionTimeout = setTimeout(() => {
          if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
            this.ws.close()
            reject(new Error('WebSocket connection timeout'))
          }
        }, this.config.timeout || 30000)

        // Setup event handlers
        this.ws.onopen = () => {
          clearTimeout(connectionTimeout)
          this.state = 'connected'
          this.connectedAt = Date.now()
          this.emit('connected')
          this.log('Connected successfully')

          this.reconnectAttempt = 0

          // Start heartbeat if configured
          if (this.config.heartbeatInterval) {
            this.startHeartbeat()
          }

          // Process queued messages
          this.processSendQueue()

          resolve()
        }

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data)
        }

        this.ws.onerror = (event) => {
          clearTimeout(connectionTimeout)
          if (!this.intentionallyClosed) {
            this.handleError(new Error('WebSocket error'))
          }
        }

        this.ws.onclose = (event) => {
          clearTimeout(connectionTimeout)
          this.stopHeartbeat()

          if (this.intentionallyClosed) {
            this.state = 'closed'
            resolve()
            return
          }

          this.state = 'error'
          this.handleError(
            new Error(`WebSocket closed: ${event.code} ${event.reason}`)
          )

          if (this.config.reconnect && this.shouldReconnect()) {
            this.scheduleReconnect().catch(() => {
              // Error already handled
            })
          }
          resolve()
        }
      } catch (error) {
        this.state = 'error'
        this.handleError(error as Error)

        if (this.config.reconnect && this.shouldReconnect()) {
          this.scheduleReconnect().catch(() => {
            // Error already handled
          })
        }
        resolve()
      }
    })
  }

  /**
   * Handle incoming WebSocket message with buffering
   */
  private handleMessage(data: string | ArrayBuffer | Blob): void {
    const startTime = Date.now()

    try {
      // Handle different data types
      let messageStr: string

      if (typeof data === 'string') {
        messageStr = data
      } else if (data instanceof ArrayBuffer) {
        messageStr = new TextDecoder().decode(data)
      } else if (data instanceof Blob) {
        // For Blob, we need to read it asynchronously
        data.text().then((text) => {
          this.processMessage(text, startTime)
        })
        return
      } else {
        messageStr = String(data)
      }

      this.processMessage(messageStr, startTime)
    } catch (error) {
      this.handleError(new Error(`Failed to process message: ${error}`))
    }
  }

  /**
   * Process message after conversion to string
   */
  private processMessage(messageStr: string, startTime: number): void {
    try {
      const parsed = JSON.parse(messageStr)

      // Handle special message types
      if (parsed.type === 'done') {
        this.log('Received done signal')
        this.emit('done')
        return
      }

      if (parsed.type === 'error') {
        this.handleError(new Error(parsed.error || 'Unknown error'))
        return
      }

      // Handle pong response (heartbeat)
      if (parsed.type === 'pong') {
        this.lastPongReceived = Date.now()
        this.log('Received pong')
        // Still emit as regular event for backwards compatibility
        this.bufferMessage(parsed as TransportEvent)
        return
      }

      // Buffer regular messages
      this.bufferMessage(parsed as TransportEvent)

      this.trackLatency(Date.now() - startTime)
    } catch (error) {
      // Handle malformed JSON
      this.handleError(new Error(`Failed to parse message: ${messageStr}`))
    }
  }

  /**
   * Send data through the transport with queuing
   */
  async send(data: any): Promise<void> {
    const startTime = Date.now()

    // Queue message if not connected
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.log('Queueing message - not connected', 'warn')
      this.sendQueue.push(data)

      // Throw if explicitly disconnected
      if (this.state === 'closed' || this.state === 'error') {
        throw new Error('WebSocket is not connected')
      }
      return
    }

    try {
      const message = JSON.stringify(data)
      this.ws.send(message)
      this.messagesSent++
      this.trackLatency(Date.now() - startTime)
      this.log(`Sent message: ${message.substring(0, 100)}...`)
    } catch (error) {
      this.handleError(error as Error)
      // Queue for retry
      this.sendQueue.push(data)
      throw error
    }
  }

  /**
   * Process queued send messages
   */
  private processSendQueue(): void {
    if (this.sendQueue.length === 0) {
      return
    }

    this.log(`Processing ${this.sendQueue.length} queued messages`)

    const queue = [...this.sendQueue]
    this.sendQueue = []

    for (const data of queue) {
      this.send(data).catch((error) => {
        this.log(`Failed to send queued message: ${error.message}`, 'error')
      })
    }
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

    this.sendQueue = []
    this.messageBuffer.clear()
    this.emit('closed')
    this.log('Connection closed')
  }

  /**
   * Start heartbeat/ping interval with timeout detection
   */
  private startHeartbeat(): void {
    if (!this.config.heartbeatInterval) {
      return
    }

    this.log(`Starting heartbeat with ${this.config.heartbeatInterval}ms interval`)
    this.lastPongReceived = Date.now()

    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        // Check if last pong was received within 2x heartbeat interval
        const timeSinceLastPong = Date.now() - (this.lastPongReceived || 0)
        const timeout = (this.config.heartbeatInterval || 0) * 2

        if (timeSinceLastPong > timeout) {
          this.log('Heartbeat timeout - connection may be dead', 'warn')
          this.handleError(new Error('Heartbeat timeout'))

          // Force reconnection
          if (this.ws) {
            this.ws.close(1006, 'Heartbeat timeout')
          }
          return
        }

        // Send ping
        this.ws.send(JSON.stringify({ type: 'ping' }))
        this.log('Sent ping')
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

    if (this.heartbeatTimeoutId) {
      clearTimeout(this.heartbeatTimeoutId)
      this.heartbeatTimeoutId = undefined
    }

    this.log('Heartbeat stopped')
  }

  /**
   * Get WebSocket ready state
   */
  getReadyState(): number | undefined {
    return this.ws?.readyState
  }

  /**
   * Get number of queued messages
   */
  getQueueSize(): number {
    return this.sendQueue.length
  }
}
