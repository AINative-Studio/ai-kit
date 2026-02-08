/**
 * Enhanced Server-Sent Events (SSE) transport implementation
 * Provides streaming over HTTP with automatic reconnection and backpressure handling
 */

import { BaseTransport } from './BaseTransport'
import type {
  TransportConfig,
  TransportEvent,
  TransportType,
} from './types'

/**
 * SSE Transport
 * Implements streaming over HTTP using Server-Sent Events
 */
export class SSETransport extends BaseTransport {
  public readonly type: TransportType = 'sse'

  private abortController?: AbortController
  private reader?: ReadableStreamDefaultReader<Uint8Array>
  private lastEventId?: string

  constructor(config: TransportConfig) {
    super(config)
    this.lastEventId = config.lastEventId
  }

  /**
   * Establish SSE connection
   */
  async connect(): Promise<void> {
    this.intentionallyClosed = false
    await this.performConnect()
  }

  /**
   * Perform the actual connection
   */
  protected async performConnect(): Promise<void> {
    try {
      this.state = 'connecting'
      this.emit('connecting')
      this.log('Connecting to SSE endpoint')

      this.abortController = new AbortController()

      const headers: HeadersInit = {
        'Accept': 'text/event-stream',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        ...this.config.headers,
      }

      // Include Last-Event-ID for resuming streams
      if (this.lastEventId) {
        headers['Last-Event-ID'] = this.lastEventId
      }

      const fetchOptions: RequestInit = {
        method: 'POST',
        headers,
        signal: this.abortController.signal,
      }

      // Add credentials for CORS if configured
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
      await this.readStream(response.body)
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
   * Read and parse SSE stream with backpressure handling
   */
  private async readStream(body: ReadableStream<Uint8Array>): Promise<void> {
    this.reader = body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let eventType = ''
    let eventData = ''

    try {
      while (true) {
        // Check backpressure before reading more data
        if (this.messageBuffer.isHighWater() && !this.paused) {
          this.log('Backpressure detected, pausing stream read', 'warn')
          // Wait a bit before reading more
          await new Promise((resolve) => setTimeout(resolve, 100))
        }

        const { done, value } = await this.reader.read()

        if (done) {
          this.log('Stream ended')
          this.emit('done')
          break
        }

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const result = this.parseSseLine(line, eventType, eventData)
          if (result) {
            eventType = result.eventType
            eventData = result.eventData

            // If we completed an event, process it
            if (result.complete && eventData) {
              this.handleSseData(eventData, eventType)
              eventData = ''
              eventType = ''
            }
          }
        }
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
   * Parse individual SSE line
   * Returns updated event state and completion flag
   */
  private parseSseLine(
    line: string,
    currentEventType: string,
    currentEventData: string
  ): { eventType: string; eventData: string; complete: boolean } | null {
    // Empty line signals end of event
    if (!line.trim()) {
      return {
        eventType: currentEventType,
        eventData: currentEventData,
        complete: true,
      }
    }

    // Comment line
    if (line.startsWith(':')) {
      return null
    }

    const colonIndex = line.indexOf(':')
    if (colonIndex === -1) {
      return null
    }

    const field = line.substring(0, colonIndex).trim()
    const value = line.substring(colonIndex + 1).trim()

    switch (field) {
      case 'event':
        return {
          eventType: value,
          eventData: currentEventData,
          complete: false,
        }

      case 'data':
        // Append data (SSE allows multiple data lines)
        const newData = currentEventData ? `${currentEventData}\n${value}` : value
        return {
          eventType: currentEventType,
          eventData: newData,
          complete: false,
        }

      case 'id':
        // Store event ID for resumption
        this.lastEventId = value
        return {
          eventType: currentEventType,
          eventData: currentEventData,
          complete: false,
        }

      case 'retry':
        // Server suggests retry interval (in milliseconds)
        const retryMs = parseInt(value, 10)
        if (!isNaN(retryMs)) {
          this.config.reconnectDelay = retryMs
          this.log(`Server set retry interval to ${retryMs}ms`)
        }
        return {
          eventType: currentEventType,
          eventData: currentEventData,
          complete: false,
        }

      default:
        return null
    }
  }

  /**
   * Handle SSE data field with buffering
   */
  private handleSseData(data: string, eventType?: string): void {
    const startTime = Date.now()

    // Check for [DONE] signal (OpenAI convention)
    if (data === '[DONE]') {
      this.log('Received [DONE] signal')
      this.emit('done')
      return
    }

    try {
      const parsed = JSON.parse(data)

      // Add event type to parsed data if specified
      const event: TransportEvent = eventType
        ? { ...parsed, __eventType: eventType }
        : parsed

      // Buffer the message (handles backpressure)
      this.bufferMessage(event)

      this.trackLatency(Date.now() - startTime)
    } catch (error) {
      // Silently handle malformed JSON but emit error event
      this.handleError(new Error(`Failed to parse SSE data: ${data}`))
    }
  }

  /**
   * Send data through the transport
   * For SSE, we send data through a new request
   */
  async send(data: any): Promise<void> {
    if (this.state !== 'connected') {
      throw new Error('Transport is not connected')
    }

    const startTime = Date.now()

    try {
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

  /**
   * Get last event ID for resumption
   */
  getLastEventId(): string | undefined {
    return this.lastEventId
  }
}
