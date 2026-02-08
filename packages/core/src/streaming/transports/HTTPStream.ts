/**
 * HTTP Streaming transport implementation
 * Provides streaming over HTTP using chunked transfer encoding
 * Useful in environments where WebSocket and SSE are restricted
 */

import { BaseTransport } from './BaseTransport'
import type {
  TransportConfig,
  TransportEvent,
  TransportType,
} from './types'

/**
 * HTTP Stream Transport
 * Implements streaming over HTTP with chunked transfer encoding
 */
export class HTTPStreamTransport extends BaseTransport {
  public readonly type: TransportType = 'http-stream'

  private abortController?: AbortController
  private reader?: ReadableStreamDefaultReader<Uint8Array>
  private longPollingTimeout?: NodeJS.Timeout

  constructor(config: TransportConfig) {
    super({
      chunkSize: 8192, // 8KB chunks by default
      longPolling: false,
      longPollingInterval: 1000,
      ...config,
    })
  }

  /**
   * Establish HTTP streaming connection
   */
  async connect(): Promise<void> {
    this.intentionallyClosed = false

    // Use long-polling if enabled
    if (this.config.longPolling) {
      await this.startLongPolling()
    } else {
      await this.performConnect()
    }
  }

  /**
   * Perform the actual HTTP streaming connection
   */
  protected async performConnect(): Promise<void> {
    try {
      this.state = 'connecting'
      this.emit('connecting')
      this.log('Connecting to HTTP streaming endpoint')

      this.abortController = new AbortController()

      const headers: HeadersInit = {
        'Accept': 'application/octet-stream',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        ...this.config.headers,
      }

      const fetchOptions: RequestInit = {
        method: 'POST',
        headers,
        signal: this.abortController.signal,
      }

      if (this.config.withCredentials) {
        fetchOptions.credentials = 'include'
      }

      const response = await fetch(this.config.endpoint, fetchOptions)

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
      this.connectedAt = Date.now()
      this.emit('connected')
      this.log('Connected successfully')

      this.reconnectAttempt = 0
      await this.readChunkedStream(response.body)
    } catch (error) {
      if (this.intentionallyClosed) {
        return
      }

      this.state = 'error'
      this.handleError(error as Error)

      if (this.config.reconnect && this.shouldReconnect()) {
        await this.scheduleReconnect()
      }
    }
  }

  /**
   * Read chunked HTTP stream with backpressure handling
   */
  private async readChunkedStream(body: ReadableStream<Uint8Array>): Promise<void> {
    this.reader = body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        // Check backpressure before reading more data
        if (this.messageBuffer.isHighWater() && !this.paused) {
          this.log('Backpressure detected, pausing stream read', 'warn')
          await new Promise((resolve) => setTimeout(resolve, 100))
        }

        const { done, value } = await this.reader.read()

        if (done) {
          this.log('Stream ended')
          this.emit('done')
          break
        }

        // Decode chunk
        buffer += decoder.decode(value, { stream: true })

        // Process complete messages (newline-delimited JSON)
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.trim()) {
            this.processChunk(line)
          }
        }
      }

      // Process any remaining buffer
      if (buffer.trim()) {
        this.processChunk(buffer)
      }
    } catch (error) {
      if (!this.intentionallyClosed) {
        this.handleError(error as Error)

        if (this.config.reconnect && this.shouldReconnect()) {
          await this.scheduleReconnect()
        }
      }
    }
  }

  /**
   * Process individual chunk
   */
  private processChunk(chunk: string): void {
    const startTime = Date.now()

    try {
      const parsed = JSON.parse(chunk)

      // Handle special message types
      if (parsed.type === 'done' || parsed.done === true) {
        this.log('Received done signal')
        this.emit('done')
        return
      }

      if (parsed.type === 'error') {
        this.handleError(new Error(parsed.error || 'Unknown error'))
        return
      }

      // Buffer the message
      this.bufferMessage(parsed as TransportEvent)

      this.trackLatency(Date.now() - startTime)
    } catch (error) {
      this.handleError(new Error(`Failed to parse chunk: ${chunk}`))
    }
  }

  /**
   * Long-polling implementation as fallback
   */
  private async startLongPolling(): Promise<void> {
    this.state = 'connected'
    this.connectedAt = Date.now()
    this.emit('connected')
    this.log('Starting long-polling mode')

    const poll = async () => {
      if (this.intentionallyClosed || this.state === 'closed') {
        return
      }

      try {
        const response = await fetch(this.config.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...this.config.headers,
          },
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()

        // Handle done signal
        if (data.done === true || data.type === 'done') {
          this.emit('done')
          return
        }

        // Buffer the message
        this.bufferMessage(data as TransportEvent)

        // Schedule next poll
        this.longPollingTimeout = setTimeout(
          poll,
          this.config.longPollingInterval || 1000
        )
      } catch (error) {
        if (!this.intentionallyClosed) {
          this.handleError(error as Error)

          if (this.config.reconnect && this.shouldReconnect()) {
            this.longPollingTimeout = setTimeout(
              poll,
              this.calculateBackoff()
            )
          }
        }
      }
    }

    // Start polling
    poll()
  }

  /**
   * Send data through the transport
   */
  async send(data: any): Promise<void> {
    if (this.state !== 'connected') {
      throw new Error('Transport is not connected')
    }

    const startTime = Date.now()

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...this.config.headers,
      }

      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      this.messagesSent++
      this.trackLatency(Date.now() - startTime)
    } catch (error) {
      this.handleError(error as Error)
      throw error
    }
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

    if (this.longPollingTimeout) {
      clearTimeout(this.longPollingTimeout)
      this.longPollingTimeout = undefined
    }

    if (this.reader) {
      this.reader.cancel().catch(() => {
        // Ignore cancellation errors
      })
      this.reader = undefined
    }

    if (this.abortController) {
      this.abortController.abort()
      this.abortController = undefined
    }

    this.messageBuffer.clear()
    this.emit('closed')
    this.log('Connection closed')
  }
}
