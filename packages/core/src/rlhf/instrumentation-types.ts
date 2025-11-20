/**
 * TypeScript types for RLHF auto-instrumentation
 */

import type { Message, Usage } from '../types'

/**
 * Configuration for RLHF instrumentation
 */
export interface InstrumentationConfig {
  /**
   * Enable/disable instrumentation
   * @default true
   */
  enabled?: boolean

  /**
   * Automatically capture prompt-response pairs
   * @default true
   */
  captureInteractions?: boolean

  /**
   * Automatically capture user feedback
   * @default true
   */
  captureFeedback?: boolean

  /**
   * Automatically capture performance metrics
   * @default true
   */
  captureMetrics?: boolean

  /**
   * Automatically capture error events
   * @default true
   */
  captureErrors?: boolean

  /**
   * Automatically capture usage patterns
   * @default true
   */
  captureUsagePatterns?: boolean

  /**
   * Collect contextual data (user agent, timestamps, etc.)
   * @default true
   */
  collectContext?: boolean

  /**
   * Custom context data to include
   */
  customContext?: Record<string, any>

  /**
   * Sample rate for instrumentation (0-1)
   * @default 1.0
   */
  sampleRate?: number

  /**
   * Maximum number of interactions to buffer
   * @default 1000
   */
  maxBufferSize?: number

  /**
   * Callback when buffer is full
   */
  onBufferFull?: (interactions: CapturedInteraction[]) => void

  /**
   * Callback when interaction is captured
   */
  onInteractionCaptured?: (interaction: CapturedInteraction) => void

  /**
   * Callback when feedback is captured
   */
  onFeedbackCaptured?: (feedback: FeedbackEvent) => void

  /**
   * Storage backend for captured data
   * @default 'memory'
   */
  storage?: 'memory' | 'local' | 'remote'

  /**
   * Remote endpoint for sending captured data
   */
  remoteEndpoint?: string

  /**
   * Batch size for remote uploads
   * @default 10
   */
  batchSize?: number

  /**
   * Flush interval in milliseconds
   * @default 60000
   */
  flushInterval?: number
}

/**
 * Captured interaction data
 */
export interface CapturedInteraction {
  /**
   * Unique interaction ID
   */
  id: string

  /**
   * Session ID
   */
  sessionId: string

  /**
   * User prompt/input
   */
  prompt: Message

  /**
   * AI response/output
   */
  response: Message

  /**
   * Context at time of interaction
   */
  context: ContextData

  /**
   * Performance metrics
   */
  metrics: PerformanceMetrics

  /**
   * Usage statistics
   */
  usage?: Usage

  /**
   * Feedback on this interaction
   */
  feedback?: FeedbackEvent[]

  /**
   * Error information if any
   */
  error?: ErrorEvent

  /**
   * Timestamp when captured
   */
  timestamp: number

  /**
   * Custom metadata
   */
  metadata?: Record<string, any>
}

/**
 * Context data collected during interaction
 */
export interface ContextData {
  /**
   * User agent string
   */
  userAgent?: string

  /**
   * Device type
   */
  deviceType?: 'desktop' | 'mobile' | 'tablet' | 'unknown'

  /**
   * Browser/platform information
   */
  platform?: string

  /**
   * Language preference
   */
  language?: string

  /**
   * Timezone
   */
  timezone?: string

  /**
   * Screen resolution
   */
  screenResolution?: string

  /**
   * Referrer
   */
  referrer?: string

  /**
   * Page URL
   */
  url?: string

  /**
   * User ID (if available)
   */
  userId?: string

  /**
   * Application version
   */
  appVersion?: string

  /**
   * Environment (dev, staging, prod)
   */
  environment?: string

  /**
   * Custom context fields
   */
  custom?: Record<string, any>
}

/**
 * Performance metrics for an interaction
 */
export interface PerformanceMetrics {
  /**
   * Time to first token (TTFT) in milliseconds
   */
  timeToFirstToken?: number

  /**
   * Total response time in milliseconds
   */
  totalResponseTime: number

  /**
   * Time to complete streaming
   */
  streamingTime?: number

  /**
   * Number of tokens in prompt
   */
  promptTokenCount?: number

  /**
   * Number of tokens in response
   */
  responseTokenCount?: number

  /**
   * Tokens per second
   */
  tokensPerSecond?: number

  /**
   * Network latency
   */
  networkLatency?: number

  /**
   * Retry count
   */
  retryCount?: number

  /**
   * Cache hit/miss
   */
  cacheHit?: boolean
}

/**
 * User feedback event
 */
export interface FeedbackEvent {
  /**
   * Feedback ID
   */
  id: string

  /**
   * Interaction ID this feedback is for
   */
  interactionId: string

  /**
   * Feedback type
   */
  type: 'thumbs-up' | 'thumbs-down' | 'rating' | 'text' | 'custom'

  /**
   * Feedback value (rating, boolean, text, etc.)
   */
  value: number | boolean | string | any

  /**
   * Optional feedback comment
   */
  comment?: string

  /**
   * Timestamp when feedback was given
   */
  timestamp: number

  /**
   * User who gave feedback (if available)
   */
  userId?: string

  /**
   * Custom metadata
   */
  metadata?: Record<string, any>
}

/**
 * Error event captured during interaction
 */
export interface ErrorEvent {
  /**
   * Error message
   */
  message: string

  /**
   * Error stack trace
   */
  stack?: string

  /**
   * Error code
   */
  code?: string

  /**
   * Error type/name
   */
  type: string

  /**
   * HTTP status code if applicable
   */
  statusCode?: number

  /**
   * Timestamp when error occurred
   */
  timestamp: number

  /**
   * Is error recoverable
   */
  recoverable?: boolean

  /**
   * Custom metadata
   */
  metadata?: Record<string, any>
}

/**
 * Instrumentation metrics
 */
export interface InstrumentationMetrics {
  /**
   * Total interactions captured
   */
  totalInteractions: number

  /**
   * Total feedback events captured
   */
  totalFeedback: number

  /**
   * Total errors captured
   */
  totalErrors: number

  /**
   * Current buffer size
   */
  bufferSize: number

  /**
   * Interactions per session
   */
  interactionsPerSession: Map<string, number>

  /**
   * Average response time
   */
  averageResponseTime: number

  /**
   * Average tokens per interaction
   */
  averageTokensPerInteraction: number

  /**
   * Feedback rate (feedback/interactions)
   */
  feedbackRate: number

  /**
   * Error rate (errors/interactions)
   */
  errorRate: number

  /**
   * Positive feedback rate
   */
  positiveFeedbackRate: number

  /**
   * Negative feedback rate
   */
  negativeFeedbackRate: number

  /**
   * Started at timestamp
   */
  startedAt: number

  /**
   * Last interaction timestamp
   */
  lastInteractionAt?: number

  /**
   * Last flush timestamp
   */
  lastFlushAt?: number

  /**
   * Remote uploads count
   */
  remoteUploads?: number

  /**
   * Failed uploads count
   */
  failedUploads?: number
}

/**
 * Instrumentation event types
 */
export type InstrumentationEventType =
  | 'interaction-captured'
  | 'feedback-captured'
  | 'error-captured'
  | 'buffer-full'
  | 'flushed'
  | 'enabled'
  | 'disabled'
  | 'metrics-updated'

/**
 * Instrumentation event data
 */
export interface InstrumentationEvent {
  type: InstrumentationEventType
  data: any
  timestamp: number
}

/**
 * Custom instrumentor function
 */
export type CustomInstrumentor = (
  interaction: CapturedInteraction
) => CapturedInteraction | null

/**
 * Middleware hook for instrumentation
 */
export type InstrumentationMiddleware = (
  interaction: CapturedInteraction,
  next: () => void
) => void

/**
 * Storage interface for captured data
 */
export interface InstrumentationStorage {
  /**
   * Store an interaction
   */
  store(interaction: CapturedInteraction): Promise<void>

  /**
   * Retrieve interactions
   */
  retrieve(filter?: InteractionFilter): Promise<CapturedInteraction[]>

  /**
   * Clear stored interactions
   */
  clear(): Promise<void>

  /**
   * Get storage size
   */
  size(): Promise<number>
}

/**
 * Filter for retrieving interactions
 */
export interface InteractionFilter {
  /**
   * Session ID
   */
  sessionId?: string

  /**
   * Date range start
   */
  startDate?: number

  /**
   * Date range end
   */
  endDate?: number

  /**
   * Has feedback
   */
  hasFeedback?: boolean

  /**
   * Has errors
   */
  hasError?: boolean

  /**
   * Limit results
   */
  limit?: number

  /**
   * Offset for pagination
   */
  offset?: number
}
