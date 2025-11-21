/**
 * RLHF Auto-Instrumentation
 *
 * Automatically captures AI stream interactions, feedback events,
 * and contextual data for Reinforcement Learning from Human Feedback (RLHF).
 */

import { EventEmitter } from 'events'
import type { AIStream } from '../streaming/AIStream'
import type { Message, Usage } from '../types'
import type {
  InstrumentationConfig,
  CapturedInteraction,
  InstrumentationMetrics,
  ContextData,
  PerformanceMetrics,
  FeedbackEvent,
  ErrorEvent,
  CustomInstrumentor,
  InstrumentationMiddleware,
  // InstrumentationStorage,
  InteractionFilter,
} from './instrumentation-types'

/**
 * Default configuration for instrumentation
 */
const DEFAULT_CONFIG: Required<Omit<InstrumentationConfig, 'customContext' | 'onBufferFull' | 'onInteractionCaptured' | 'onFeedbackCaptured' | 'remoteEndpoint'>> = {
  enabled: true,
  captureInteractions: true,
  captureFeedback: true,
  captureMetrics: true,
  captureErrors: true,
  captureUsagePatterns: true,
  collectContext: true,
  sampleRate: 1.0,
  maxBufferSize: 1000,
  storage: 'memory',
  batchSize: 10,
  flushInterval: 60000,
}

/**
 * RLHFInstrumentation class
 *
 * Provides automatic instrumentation for AI streams to capture
 * interactions, feedback, and metrics for RLHF training.
 */
export class RLHFInstrumentation extends EventEmitter {
  private config: InstrumentationConfig
  private enabled: boolean = true
  private sessionId: string
  private buffer: CapturedInteraction[] = []
  private metrics: InstrumentationMetrics
  private customInstrumentors: CustomInstrumentor[] = []
  private middleware: InstrumentationMiddleware[] = []
  private flushTimer?: NodeJS.Timeout
  private activeInteractions: Map<string, {
    prompt: Message
    startTime: number
    firstTokenTime?: number
  }> = new Map()

  /**
   * Create a new RLHF instrumentation instance
   */
  constructor(config: InstrumentationConfig = {}) {
    super()
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.enabled = this.config.enabled ?? true
    this.sessionId = this.generateSessionId()

    this.metrics = {
      totalInteractions: 0,
      totalFeedback: 0,
      totalErrors: 0,
      bufferSize: 0,
      interactionsPerSession: new Map([[this.sessionId, 0]]),
      averageResponseTime: 0,
      averageTokensPerInteraction: 0,
      feedbackRate: 0,
      errorRate: 0,
      positiveFeedbackRate: 0,
      negativeFeedbackRate: 0,
      startedAt: Date.now(),
      remoteUploads: 0,
      failedUploads: 0,
    }

    if (this.config.flushInterval && this.config.flushInterval > 0) {
      this.startFlushTimer()
    }
  }

  /**
   * Instrument an AI stream for automatic capture
   */
  instrument(stream: AIStream): AIStream {
    if (!this.enabled) {
      return stream
    }

    // Listen to stream events
    stream.on('message', (message: Message) => {
      this.handleMessage(message)
    })

    stream.on('token', (token: string) => {
      this.handleToken(token)
    })

    stream.on('usage', (usage: Usage) => {
      this.handleUsage(usage)
    })

    stream.on('error', (error: Error) => {
      this.handleError(error)
    })

    stream.on('streaming-start', () => {
      this.handleStreamingStart()
    })

    stream.on('streaming-end', () => {
      this.handleStreamingEnd()
    })

    stream.on('reset', () => {
      this.handleReset()
    })

    return stream
  }

  /**
   * Manually capture an interaction
   */
  captureInteraction(event: {
    prompt: Message
    response: Message
    usage?: Usage
    error?: Error
  }): CapturedInteraction | null {
    if (!this.enabled || !this.config.captureInteractions) {
      return null
    }

    // Apply sampling
    if (Math.random() > (this.config.sampleRate ?? 1.0)) {
      return null
    }

    const context = this.collectContext()
    const metrics = this.calculateMetrics(event)

    const interaction: CapturedInteraction = {
      id: this.generateId(),
      sessionId: this.sessionId,
      prompt: event.prompt,
      response: event.response,
      context,
      metrics,
      usage: event.usage,
      feedback: [],
      error: event.error ? this.createErrorEvent(event.error) : undefined,
      timestamp: Date.now(),
      metadata: {},
    }

    // Apply custom instrumentors
    let processedInteraction: CapturedInteraction | null = interaction
    for (const instrumentor of this.customInstrumentors) {
      processedInteraction = instrumentor(processedInteraction)
      if (!processedInteraction) {
        return null
      }
    }

    // Apply middleware
    let middlewareIndex = 0
    const runMiddleware = () => {
      if (middlewareIndex < this.middleware.length) {
        const current = this.middleware[middlewareIndex++]
        if (current && processedInteraction) {
          current(processedInteraction, runMiddleware)
        }
      } else {
        if (processedInteraction) {
          this.storeInteraction(processedInteraction)
        }
      }
    }
    runMiddleware()

    return processedInteraction
  }

  /**
   * Capture user feedback
   */
  captureFeedback(feedback: Omit<FeedbackEvent, 'id' | 'timestamp'>): void {
    if (!this.enabled || !this.config.captureFeedback) {
      return
    }

    const feedbackEvent: FeedbackEvent = {
      id: this.generateId(),
      timestamp: Date.now(),
      ...feedback,
    }

    // Find the interaction and add feedback
    const interaction = this.buffer.find(i => i.id === feedback.interactionId)
    if (interaction) {
      if (!interaction.feedback) {
        interaction.feedback = []
      }
      interaction.feedback.push(feedbackEvent)
    }

    this.metrics.totalFeedback++
    this.updateFeedbackMetrics(feedbackEvent)

    this.emit('feedback-captured', feedbackEvent)

    if (this.config.onFeedbackCaptured) {
      this.config.onFeedbackCaptured(feedbackEvent)
    }
  }

  /**
   * Collect contextual data
   */
  collectContext(): ContextData {
    if (!this.config.collectContext) {
      return {}
    }

    const context: ContextData = {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: typeof navigator !== 'undefined' ? navigator.language : undefined,
      custom: this.config.customContext,
    }

    // Collect browser-specific context if available
    if (typeof navigator !== 'undefined') {
      context.userAgent = navigator.userAgent
      context.platform = navigator.platform
    }

    if (typeof window !== 'undefined') {
      context.url = window.location.href
      context.referrer = document.referrer
      context.screenResolution = `${window.screen.width}x${window.screen.height}`
    }

    // Determine device type
    if (context.userAgent) {
      context.deviceType = this.detectDeviceType(context.userAgent)
    }

    return context
  }

  /**
   * Enable instrumentation
   */
  enable(): void {
    this.enabled = true
    this.emit('enabled')

    if (this.config.flushInterval && !this.flushTimer) {
      this.startFlushTimer()
    }
  }

  /**
   * Disable instrumentation
   */
  disable(): void {
    this.enabled = false
    this.emit('disabled')

    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = undefined
    }
  }

  /**
   * Get instrumentation metrics
   */
  getMetrics(): InstrumentationMetrics {
    return { ...this.metrics }
  }

  /**
   * Get captured interactions
   */
  getInteractions(filter?: InteractionFilter): CapturedInteraction[] {
    let interactions = [...this.buffer]

    if (!filter) {
      return interactions
    }

    // Apply filters
    if (filter.sessionId) {
      interactions = interactions.filter(i => i.sessionId === filter.sessionId)
    }

    if (filter.startDate) {
      interactions = interactions.filter(i => i.timestamp >= filter.startDate!)
    }

    if (filter.endDate) {
      interactions = interactions.filter(i => i.timestamp <= filter.endDate!)
    }

    if (filter.hasFeedback !== undefined) {
      interactions = interactions.filter(i =>
        filter.hasFeedback ? (i.feedback && i.feedback.length > 0) : !i.feedback || i.feedback.length === 0
      )
    }

    if (filter.hasError !== undefined) {
      interactions = interactions.filter(i =>
        filter.hasError ? !!i.error : !i.error
      )
    }

    // Apply limit and offset
    const offset = filter.offset ?? 0
    const limit = filter.limit ?? interactions.length

    return interactions.slice(offset, offset + limit)
  }

  /**
   * Clear all captured data
   */
  clear(): void {
    this.buffer = []
    this.metrics.bufferSize = 0
    this.activeInteractions.clear()
  }

  /**
   * Flush buffered interactions
   */
  async flush(): Promise<void> {
    if (this.buffer.length === 0) {
      return
    }

    const interactions = [...this.buffer]

    this.emit('flushed', interactions)

    // Upload to remote endpoint if configured
    if (this.config.storage === 'remote' && this.config.remoteEndpoint) {
      await this.uploadToRemote(interactions)
    }

    this.metrics.lastFlushAt = Date.now()
  }

  /**
   * Add custom instrumentor
   */
  addInstrumentor(instrumentor: CustomInstrumentor): void {
    this.customInstrumentors.push(instrumentor)
  }

  /**
   * Add middleware
   */
  addMiddleware(middleware: InstrumentationMiddleware): void {
    this.middleware.push(middleware)
  }

  /**
   * Remove custom instrumentor
   */
  removeInstrumentor(instrumentor: CustomInstrumentor): void {
    const index = this.customInstrumentors.indexOf(instrumentor)
    if (index > -1) {
      this.customInstrumentors.splice(index, 1)
    }
  }

  /**
   * Remove middleware
   */
  removeMiddleware(middleware: InstrumentationMiddleware): void {
    const index = this.middleware.indexOf(middleware)
    if (index > -1) {
      this.middleware.splice(index, 1)
    }
  }

  /**
   * Handle message event from stream
   */
  private handleMessage(message: Message): void {
    if (message.role === 'user') {
      // Start tracking this interaction
      this.activeInteractions.set(message.id, {
        prompt: message,
        startTime: Date.now(),
      })
    } else if (message.role === 'assistant') {
      // Complete the interaction
      const activeInteraction = this.findActiveInteraction()
      if (activeInteraction) {
        this.completeInteraction(activeInteraction.prompt, message)
      }
    }
  }

  /**
   * Handle token event from stream
   */
  private handleToken(_token: string): void {
    if (!this.config.captureMetrics) {
      return
    }

    const activeInteraction = this.findActiveInteraction()
    if (activeInteraction && !activeInteraction.firstTokenTime) {
      activeInteraction.firstTokenTime = Date.now()
    }
  }

  /**
   * Handle usage event from stream
   */
  private handleUsage(_usage: Usage): void {
    // Usage will be attached to the interaction when completed
  }

  /**
   * Handle error event from stream
   */
  private handleError(error: Error): void {
    if (!this.config.captureErrors) {
      return
    }

    const activeInteraction = this.findActiveInteraction()
    if (activeInteraction) {
      // Error will be attached to the interaction
    }

    this.metrics.totalErrors++
    this.updateErrorRate()

    this.emit('error-captured', this.createErrorEvent(error))
  }

  /**
   * Handle streaming start event
   */
  private handleStreamingStart(): void {
    // Streaming started
  }

  /**
   * Handle streaming end event
   */
  private handleStreamingEnd(): void {
    // Streaming ended
  }

  /**
   * Handle reset event
   */
  private handleReset(): void {
    this.activeInteractions.clear()
  }

  /**
   * Find the most recent active interaction
   */
  private findActiveInteraction(): { prompt: Message; startTime: number; firstTokenTime?: number } | undefined {
    // Get the most recent interaction
    const entries = Array.from(this.activeInteractions.entries())
    if (entries.length === 0) {
      return undefined
    }
    const lastEntry = entries[entries.length - 1]
    return lastEntry?.[1]
  }

  /**
   * Complete an interaction
   */
  private completeInteraction(prompt: Message, response: Message): void {
    this.captureInteraction({
      prompt,
      response,
    })

    // Remove from active interactions
    this.activeInteractions.delete(prompt.id)
  }

  /**
   * Store interaction in buffer
   */
  private storeInteraction(interaction: CapturedInteraction): void {
    this.buffer.push(interaction)
    this.metrics.bufferSize = this.buffer.length
    this.metrics.totalInteractions++

    // Update session interactions count
    const sessionCount = this.metrics.interactionsPerSession.get(this.sessionId) ?? 0
    this.metrics.interactionsPerSession.set(this.sessionId, sessionCount + 1)

    this.metrics.lastInteractionAt = interaction.timestamp
    this.updateAverageMetrics(interaction)

    this.emit('interaction-captured', interaction)

    if (this.config.onInteractionCaptured) {
      this.config.onInteractionCaptured(interaction)
    }

    // Check buffer size
    if (this.buffer.length >= (this.config.maxBufferSize ?? DEFAULT_CONFIG.maxBufferSize)) {
      this.handleBufferFull()
    }
  }

  /**
   * Handle buffer full event
   */
  private handleBufferFull(): void {
    const interactions = [...this.buffer]

    this.emit('buffer-full', interactions)

    if (this.config.onBufferFull) {
      this.config.onBufferFull(interactions)
    }

    // Auto-flush if configured
    if (this.config.storage === 'remote') {
      this.flush().catch(error => {
        console.error('Failed to flush buffer:', error)
      })
    }
  }

  /**
   * Calculate performance metrics
   */
  private calculateMetrics(event: {
    prompt: Message
    response: Message
  }): PerformanceMetrics {
    const activeInteraction = this.activeInteractions.get(event.prompt.id)

    const totalResponseTime = activeInteraction
      ? Date.now() - activeInteraction.startTime
      : event.response.timestamp - event.prompt.timestamp

    const timeToFirstToken = activeInteraction?.firstTokenTime
      ? activeInteraction.firstTokenTime - activeInteraction.startTime
      : undefined

    const metrics: PerformanceMetrics = {
      totalResponseTime,
      timeToFirstToken,
      retryCount: 0,
    }

    return metrics
  }

  /**
   * Create error event from Error object
   */
  private createErrorEvent(error: Error): ErrorEvent {
    return {
      message: error.message,
      stack: error.stack,
      type: error.name,
      timestamp: Date.now(),
      recoverable: false,
    }
  }

  /**
   * Update average metrics
   */
  private updateAverageMetrics(interaction: CapturedInteraction): void {
    const total = this.metrics.totalInteractions

    // Update average response time
    this.metrics.averageResponseTime =
      (this.metrics.averageResponseTime * (total - 1) + (interaction.metrics?.totalResponseTime ?? 0)) / total

    // Update average tokens per interaction
    const totalTokens = (interaction.usage?.totalTokens ?? 0)
    this.metrics.averageTokensPerInteraction =
      (this.metrics.averageTokensPerInteraction * (total - 1) + totalTokens) / total

    // Update feedback rate
    this.metrics.feedbackRate = this.metrics.totalFeedback / total

    // Update error rate
    this.updateErrorRate()
  }

  /**
   * Update error rate
   */
  private updateErrorRate(): void {
    if (this.metrics.totalInteractions > 0) {
      this.metrics.errorRate = this.metrics.totalErrors / this.metrics.totalInteractions
    }
  }

  /**
   * Update feedback metrics
   */
  private updateFeedbackMetrics(feedback: FeedbackEvent): void {
    const total = this.metrics.totalFeedback

    if (total === 0) {
      return
    }

    // Update feedback rate
    if (this.metrics.totalInteractions > 0) {
      this.metrics.feedbackRate = total / this.metrics.totalInteractions
    }

    // Update positive/negative feedback rates
    let positiveCount = this.metrics.positiveFeedbackRate * (total - 1)
    let negativeCount = this.metrics.negativeFeedbackRate * (total - 1)

    if (feedback.type === 'thumbs-up' || (feedback.type === 'rating' && typeof feedback.value === 'number' && feedback.value > 3)) {
      positiveCount++
    } else if (feedback.type === 'thumbs-down' || (feedback.type === 'rating' && typeof feedback.value === 'number' && feedback.value <= 3)) {
      negativeCount++
    }

    this.metrics.positiveFeedbackRate = positiveCount / total
    this.metrics.negativeFeedbackRate = negativeCount / total
  }

  /**
   * Start flush timer
   */
  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
    }

    this.flushTimer = setInterval(() => {
      this.flush().catch(error => {
        console.error('Scheduled flush failed:', error)
      })
    }, this.config.flushInterval ?? DEFAULT_CONFIG.flushInterval)
  }

  /**
   * Upload interactions to remote endpoint
   */
  private async uploadToRemote(interactions: CapturedInteraction[]): Promise<void> {
    if (!this.config.remoteEndpoint) {
      return
    }

    const batchSize = this.config.batchSize ?? DEFAULT_CONFIG.batchSize
    const batches: CapturedInteraction[][] = []

    for (let i = 0; i < interactions.length; i += batchSize) {
      batches.push(interactions.slice(i, i + batchSize))
    }

    for (const batch of batches) {
      try {
        const response = await fetch(this.config.remoteEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: this.sessionId,
            interactions: batch,
            timestamp: Date.now(),
          }),
        })

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.status}`)
        }

        this.metrics.remoteUploads = (this.metrics.remoteUploads ?? 0) + 1
      } catch (error) {
        console.error('Failed to upload batch:', error)
        this.metrics.failedUploads = (this.metrics.failedUploads ?? 0) + 1
      }
    }
  }

  /**
   * Detect device type from user agent
   */
  private detectDeviceType(userAgent: string): 'desktop' | 'mobile' | 'tablet' | 'unknown' {
    const ua = userAgent.toLowerCase()

    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return 'tablet'
    }

    if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
      return 'mobile'
    }

    return 'desktop'
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.disable()
    this.clear()
    this.removeAllListeners()
    this.customInstrumentors = []
    this.middleware = []
  }
}

/**
 * Create a new instrumentation instance
 */
export function createInstrumentation(config?: InstrumentationConfig): RLHFInstrumentation {
  return new RLHFInstrumentation(config)
}
