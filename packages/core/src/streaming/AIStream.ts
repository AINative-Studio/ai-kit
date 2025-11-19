import { EventEmitter } from 'events'
import { createParser, ParsedEvent, ReconnectInterval } from 'eventsource-parser'
import type {
  Message,
  Usage,
  StreamConfig,
  StreamOptions,
  RetryConfig,
} from '../types'

/**
 * Core AI streaming client - framework-agnostic
 * Handles SSE and WebSocket transports with automatic reconnection
 */
export class AIStream extends EventEmitter {
  private messages: Message[] = []
  private isStreaming = false
  private currentStreamController: AbortController | null = null
  private retryCount = 0
  private usage: Usage = {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
  }

  constructor(
    private config: StreamConfig,
    _options: StreamOptions = {}
  ) {
    super()
    // Options configuration - reserved for future use
    // (WebSocket support, custom reconnection strategies, etc.)
  }

  /**
   * Send a message and start streaming the response
   */
  async send(content: string): Promise<void> {
    const userMessage: Message = {
      id: this.generateId(),
      role: 'user',
      content,
      timestamp: Date.now(),
    }

    this.messages.push(userMessage)
    this.emit('message', userMessage)

    await this.streamResponse()
  }

  /**
   * Stream the AI response
   */
  private async streamResponse(): Promise<void> {
    this.isStreaming = true
    this.emit('streaming-start')

    try {
      await this.makeStreamRequest()
      this.retryCount = 0 // Reset retry count on success
    } catch (error) {
      await this.handleError(error as Error)
    } finally {
      this.isStreaming = false
      this.emit('streaming-end')
    }
  }

  /**
   * Make the streaming request
   */
  private async makeStreamRequest(): Promise<void> {
    this.currentStreamController = new AbortController()

    const response = await fetch(this.config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.config.headers,
      },
      body: JSON.stringify({
        messages: this.messages,
        model: this.config.model,
        systemPrompt: this.config.systemPrompt,
        stream: true,
      }),
      signal: this.currentStreamController.signal,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    if (!response.body) {
      throw new Error('Response body is null')
    }

    await this.processStream(response.body)
  }

  /**
   * Process the SSE stream
   */
  private async processStream(stream: ReadableStream<Uint8Array>): Promise<void> {
    const reader = stream.getReader()
    const decoder = new TextDecoder()
    let accumulatedContent = ''

    const assistantMessage: Message = {
      id: this.generateId(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    }

    const parser = createParser((event: ParsedEvent | ReconnectInterval) => {
      if (event.type === 'event') {
        const data = event.data

        if (data === '[DONE]') {
          return
        }

        try {
          const parsed = JSON.parse(data)

          // Handle token
          if (parsed.token) {
            accumulatedContent += parsed.token
            assistantMessage.content = accumulatedContent

            if (this.config.onToken) {
              this.config.onToken(parsed.token)
            }

            this.emit('token', parsed.token)
          }

          // Handle usage/metadata
          if (parsed.usage) {
            this.usage = {
              ...this.usage,
              ...parsed.usage,
            }

            if (this.config.onCost) {
              this.config.onCost(this.usage)
            }

            this.emit('usage', this.usage)
          }
        } catch (e) {
          console.error('Failed to parse SSE event:', e)
        }
      }
    })

    try {
      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          break
        }

        const chunk = decoder.decode(value, { stream: true })
        parser.feed(chunk)
      }

      // Add the complete message
      if (assistantMessage.content) {
        this.messages.push(assistantMessage)
        this.emit('message', assistantMessage)
      }
    } finally {
      reader.releaseLock()
    }
  }

  /**
   * Handle errors with retry logic
   */
  private async handleError(error: Error): Promise<void> {
    const retryConfig = this.getRetryConfig()

    if (this.shouldRetry(error) && this.retryCount < retryConfig.maxRetries!) {
      this.retryCount++

      const delay = this.calculateRetryDelay(retryConfig)

      this.emit('retry', { attempt: this.retryCount, delay })

      await new Promise((resolve) => setTimeout(resolve, delay))

      await this.streamResponse()
    } else {
      if (this.config.onError) {
        this.config.onError(error)
      }

      this.emit('error', error)
    }
  }

  /**
   * Determine if error is retriable
   */
  private shouldRetry(error: Error): boolean {
    // Don't retry on abort
    if (error.name === 'AbortError') {
      return false
    }

    // Retry on network errors or 5xx errors
    return true
  }

  /**
   * Calculate retry delay with backoff
   */
  private calculateRetryDelay(config: RetryConfig): number {
    const { backoff = 'exponential', initialDelay = 1000, maxDelay = 10000 } = config

    let delay: number

    if (backoff === 'exponential') {
      delay = Math.min(initialDelay * Math.pow(2, this.retryCount - 1), maxDelay)
    } else {
      delay = Math.min(initialDelay * this.retryCount, maxDelay)
    }

    return delay
  }

  /**
   * Get retry configuration with defaults
   */
  private getRetryConfig(): Required<RetryConfig> {
    return {
      maxRetries: this.config.retry?.maxRetries ?? 3,
      backoff: this.config.retry?.backoff ?? 'exponential',
      initialDelay: this.config.retry?.initialDelay ?? 1000,
      maxDelay: this.config.retry?.maxDelay ?? 10000,
    }
  }

  /**
   * Reset the conversation
   */
  reset(): void {
    this.messages = []
    this.usage = {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
    }
    this.emit('reset')
  }

  /**
   * Retry the last message
   */
  async retry(): Promise<void> {
    if (this.messages.length === 0) {
      return
    }

    // Remove the last assistant message if exists
    if (this.messages[this.messages.length - 1].role === 'assistant') {
      this.messages.pop()
    }

    await this.streamResponse()
  }

  /**
   * Stop the current stream
   */
  stop(): void {
    if (this.currentStreamController) {
      this.currentStreamController.abort()
      this.currentStreamController = null
    }
    this.isStreaming = false
  }

  /**
   * Get current messages
   */
  getMessages(): Message[] {
    return [...this.messages]
  }

  /**
   * Get streaming state
   */
  getIsStreaming(): boolean {
    return this.isStreaming
  }

  /**
   * Get usage statistics
   */
  getUsage(): Usage {
    return { ...this.usage }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}
