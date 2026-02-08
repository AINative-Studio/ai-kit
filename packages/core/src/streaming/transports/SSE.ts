/**
 * Server-Sent Events (SSE) transport implementation
 * Provides streaming over HTTP with automatic reconnection
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
 * SSE Transport
 * Implements streaming over HTTP using Server-Sent Events
 */
export class SSETransport extends EventEmitter implements Transport {
  private config: TransportConfig
  private state: TransportState = 'idle'
  private abortController?: AbortController
  private reader?: ReadableStreamDefaultReader<Uint8Array>
  private reconnectAttempt = 0
  private reconnectTimeout?: NodeJS.Timeout
  private intentionallyClosed = false

  constructor(config: TransportConfig) {
    super()
    this.config = {
      reconnect: true,
      maxReconnectAttempts: 3,
      reconnectDelay: 1000,
      backoffMultiplier: 2,
      maxReconnectDelay: 30000,
      ...config,
    }
  }

  /**
   * Establish SSE connection
   */
  async connect(): Promise<void> {
    this.intentionallyClosed = false
    await this.performConnect()
  }

  private async performConnect(): Promise<void> {
    try {
      this.state = 'connecting'
      this.emit('connecting')

      this.abortController = new AbortController()

      const headers: HeadersInit = {
        'Accept': 'text/event-stream',
        'Content-Type': 'application/json',
        ...this.config.headers,
      }

      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers,
        signal: this.abortController.signal,
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(
          `HTTP ${response.status}: ${response.statusText} - ${errorText}`
        )
      }

      if (!response.body) {
        throw new Error('Response body is null')
      }

      this.state = 'connected'
      this.emit('connected')

      this.reconnectAttempt = 0
      await this.readStream(response.body)
    } catch (error) {
      if (this.intentionallyClosed) {
        return
      }

      this.state = 'error'
      const transportError: TransportErrorEvent = {
        error: error as Error,
        recoverable: true,
      }
      this.emit('error', transportError)

      if (this.config.reconnect && this.shouldReconnect()) {
        // Schedule reconnection asynchronously (don't await)
        this.scheduleReconnect().catch(() => {
          // Ignore errors - they're already handled
        })
      }
    }
  }

  /**
   * Read and parse SSE stream
   */
  private async readStream(body: ReadableStream<Uint8Array>): Promise<void> {
    this.reader = body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await this.reader.read()

        if (done) {
          this.emit('done')
          break
        }

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          this.parseSseLine(line)
        }
      }
    } catch (error) {
      if (!this.intentionallyClosed) {
        const transportError: TransportErrorEvent = {
          error: error as Error,
          recoverable: true,
        }
        this.emit('error', transportError)

        if (this.config.reconnect && this.shouldReconnect()) {
          // Schedule reconnection asynchronously (don't await)
          this.scheduleReconnect().catch(() => {
            // Ignore errors - they're already handled
          })
        }
      }
    }
  }

  /**
   * Parse individual SSE line
   */
  private parseSseLine(line: string): void {
    if (!line.trim() || line.startsWith(':')) {
      return
    }

    const colonIndex = line.indexOf(':')
    if (colonIndex === -1) {
      return
    }

    const field = line.substring(0, colonIndex).trim()
    const value = line.substring(colonIndex + 1).trim()

    if (field === 'data') {
      this.handleSseData(value)
    }
    // Handle other SSE fields (event, id, retry) if needed in the future
  }

  /**
   * Handle SSE data field
   */
  private handleSseData(data: string): void {
    // Check for [DONE] signal (OpenAI convention)
    if (data === '[DONE]') {
      this.emit('done')
      return
    }

    try {
      const parsed = JSON.parse(data)
      this.emit('event', parsed as TransportEvent)
    } catch (error) {
      // Silently ignore malformed JSON to match test expectations
      const transportError: TransportErrorEvent = {
        error: new Error(`Failed to parse SSE data: ${data}`),
        recoverable: true,
      }
      this.emit('error', transportError)
    }
  }

  /**
   * Send data through the transport
   */
  async send(data: any): Promise<void> {
    if (this.state !== 'connected') {
      throw new Error('Transport is not connected')
    }

    // For SSE, we send data through the initial request
    // This method allows re-sending if needed
    const headers: HeadersInit = {
      'Accept': 'text/event-stream',
      'Content-Type': 'application/json',
      ...this.config.headers,
    }

    await fetch(this.config.endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    })
  }

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

    if (this.reader) {
      this.reader.cancel()
      this.reader = undefined
    }

    if (this.abortController) {
      this.abortController.abort()
      this.abortController = undefined
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
  private async scheduleReconnect(): Promise<void> {
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

    return new Promise((resolve) => {
      this.reconnectTimeout = setTimeout(async () => {
        try {
          await this.performConnect()
        } catch (error) {
          // Error already handled in performConnect
        }
        resolve()
      }, delay)
    })
  }
}
