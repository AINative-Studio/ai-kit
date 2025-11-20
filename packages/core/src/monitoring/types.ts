/**
 * AIKIT Query Monitoring - Type Definitions
 *
 * This module defines the core types for LLM query monitoring,
 * event tracking, pattern detection, and alerting.
 */

import { EventEmitter } from 'events';

// ============================================================================
// Query Event Types
// ============================================================================

/**
 * Types of query lifecycle events
 */
export type QueryEventType =
  | 'query:start'
  | 'query:complete'
  | 'query:error'
  | 'query:slow'
  | 'query:retry'
  | 'query:cached';

/**
 * Query event payload
 */
export interface QueryEvent {
  /**
   * Event type
   */
  type: QueryEventType;

  /**
   * Unique query ID
   */
  queryId: string;

  /**
   * Timestamp when the event occurred
   */
  timestamp: string;

  /**
   * Associated metrics
   */
  metrics: QueryMetrics;

  /**
   * Event-specific data
   */
  data?: Record<string, unknown>;
}

// ============================================================================
// Query Metrics
// ============================================================================

/**
 * Performance and cost metrics for a query
 */
export interface QueryMetrics {
  /**
   * Total duration from start to completion (ms)
   */
  totalDuration: number;

  /**
   * Time spent in LLM API call (ms)
   */
  llmDuration: number;

  /**
   * Time spent in pre/post processing (ms)
   */
  processingDuration: number;

  /**
   * Token usage
   */
  tokens: {
    /**
     * Input tokens (prompt)
     */
    input: number;

    /**
     * Output tokens (completion)
     */
    output: number;

    /**
     * Total tokens
     */
    total: number;
  };

  /**
   * LLM model used
   */
  model: string;

  /**
   * LLM provider (openai, anthropic, etc.)
   */
  provider: string;

  /**
   * Estimated cost in USD
   */
  cost?: number;

  /**
   * Query success status
   */
  success: boolean;

  /**
   * Number of retry attempts
   */
  retryCount: number;

  /**
   * Whether result was served from cache
   */
  cached: boolean;

  /**
   * Error details if query failed
   */
  error?: {
    message: string;
    code?: string;
    stack?: string;
  };

  /**
   * Additional context
   */
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Monitor Configuration
// ============================================================================

/**
 * Configuration for QueryMonitor
 */
export interface MonitorConfig {
  /**
   * Enable/disable monitoring
   */
  enabled?: boolean;

  /**
   * Slow query threshold in milliseconds
   */
  slowQueryThresholdMs?: number;

  /**
   * Enable pattern detection
   */
  enablePatternDetection?: boolean;

  /**
   * Pattern detection configuration
   */
  patternDetection?: {
    /**
     * Maximum number of patterns to track
     */
    maxPatterns?: number;

    /**
     * Time window for pattern detection (ms)
     */
    timeWindowMs?: number;

    /**
     * Minimum occurrences to consider as a pattern
     */
    minOccurrences?: number;

    /**
     * Similarity threshold for detecting similar queries (0-1)
     */
    similarityThreshold?: number;
  };

  /**
   * Alert configuration
   */
  alerts?: {
    /**
     * Enable alerting
     */
    enabled?: boolean;

    /**
     * Alert thresholds
     */
    thresholds?: {
      /**
       * Error rate threshold (0-1)
       */
      errorRate?: number;

      /**
       * Average duration threshold (ms)
       */
      avgDuration?: number;

      /**
       * Cost threshold per query (USD)
       */
      costPerQuery?: number;

      /**
       * Total cost threshold per time window (USD)
       */
      totalCost?: number;
    };

    /**
     * Alert callback
     */
    onAlert?: (alert: Alert) => void | Promise<void>;
  };

  /**
   * Metrics retention configuration
   */
  retention?: {
    /**
     * Maximum number of query metrics to retain in memory
     */
    maxQueries?: number;

    /**
     * Maximum age of metrics to retain (ms)
     */
    maxAgeMs?: number;
  };

  /**
   * Integration with external instrumentation
   */
  instrumentation?: {
    /**
     * OpenTelemetry integration
     */
    openTelemetry?: {
      enabled: boolean;
      serviceName?: string;
    };

    /**
     * Custom metrics reporter
     */
    customReporter?: (metrics: QueryMetrics) => void | Promise<void>;
  };
}

// ============================================================================
// Pattern Detection
// ============================================================================

/**
 * Types of detected patterns
 */
export type PatternType =
  | 'repeated'
  | 'similar'
  | 'expensive'
  | 'failing'
  | 'slow';

/**
 * Detected query pattern
 */
export interface Pattern {
  /**
   * Pattern type
   */
  type: PatternType;

  /**
   * Pattern identifier
   */
  id: string;

  /**
   * Human-readable description
   */
  description: string;

  /**
   * Number of queries matching this pattern
   */
  occurrences: number;

  /**
   * First occurrence timestamp
   */
  firstSeen: string;

  /**
   * Last occurrence timestamp
   */
  lastSeen: string;

  /**
   * Query IDs that match this pattern
   */
  queryIds: string[];

  /**
   * Aggregate metrics for this pattern
   */
  aggregateMetrics: {
    /**
     * Average duration
     */
    avgDuration: number;

    /**
     * Total cost
     */
    totalCost: number;

    /**
     * Success rate (0-1)
     */
    successRate: number;

    /**
     * Total tokens used
     */
    totalTokens: number;
  };

  /**
   * Pattern-specific data
   */
  data?: Record<string, unknown>;
}

// ============================================================================
// Alerting
// ============================================================================

/**
 * Alert severity levels
 */
export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';

/**
 * Alert types
 */
export type AlertType =
  | 'high_error_rate'
  | 'high_cost'
  | 'slow_queries'
  | 'pattern_detected'
  | 'quota_exceeded'
  | 'custom';

/**
 * Alert notification
 */
export interface Alert {
  /**
   * Alert type
   */
  type: AlertType;

  /**
   * Alert severity
   */
  severity: AlertSeverity;

  /**
   * Alert message
   */
  message: string;

  /**
   * Timestamp when alert was triggered
   */
  timestamp: string;

  /**
   * Related metrics or data
   */
  data: Record<string, unknown>;

  /**
   * Suggested actions
   */
  suggestions?: string[];
}

// ============================================================================
// Query Context
// ============================================================================

/**
 * Context information for a query
 */
export interface QueryContext {
  /**
   * Unique query ID
   */
  queryId: string;

  /**
   * Agent ID that initiated the query
   */
  agentId?: string;

  /**
   * User ID if applicable
   */
  userId?: string;

  /**
   * Session ID
   */
  sessionId?: string;

  /**
   * Query prompt/input
   */
  prompt: string;

  /**
   * Model configuration
   */
  model: {
    provider: string;
    name: string;
    temperature?: number;
    maxTokens?: number;
  };

  /**
   * Query start time
   */
  startTime: string;

  /**
   * Tags for categorization
   */
  tags?: string[];

  /**
   * Custom metadata
   */
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Monitoring Statistics
// ============================================================================

/**
 * Aggregate monitoring statistics
 */
export interface MonitoringStats {
  /**
   * Total number of queries monitored
   */
  totalQueries: number;

  /**
   * Successful queries
   */
  successfulQueries: number;

  /**
   * Failed queries
   */
  failedQueries: number;

  /**
   * Cached queries
   */
  cachedQueries: number;

  /**
   * Slow queries (exceeding threshold)
   */
  slowQueries: number;

  /**
   * Total retries
   */
  totalRetries: number;

  /**
   * Aggregate metrics
   */
  aggregateMetrics: {
    /**
     * Average query duration (ms)
     */
    avgDuration: number;

    /**
     * Average LLM duration (ms)
     */
    avgLLMDuration: number;

    /**
     * Average processing duration (ms)
     */
    avgProcessingDuration: number;

    /**
     * Total tokens used
     */
    totalTokens: number;

    /**
     * Average tokens per query
     */
    avgTokens: number;

    /**
     * Total cost (USD)
     */
    totalCost: number;

    /**
     * Average cost per query (USD)
     */
    avgCost: number;
  };

  /**
   * Breakdown by model
   */
  byModel: Record<string, {
    queries: number;
    avgDuration: number;
    totalTokens: number;
    totalCost: number;
  }>;

  /**
   * Breakdown by provider
   */
  byProvider: Record<string, {
    queries: number;
    avgDuration: number;
    totalTokens: number;
    totalCost: number;
  }>;

  /**
   * Time period for these statistics
   */
  period: {
    start: string;
    end: string;
    durationMs: number;
  };
}

// ============================================================================
// Event Emitter Interface
// ============================================================================

/**
 * Query monitor event emitter interface
 */
export interface QueryMonitorEvents {
  'query:start': (event: QueryEvent) => void;
  'query:complete': (event: QueryEvent) => void;
  'query:error': (event: QueryEvent) => void;
  'query:slow': (event: QueryEvent) => void;
  'query:retry': (event: QueryEvent) => void;
  'query:cached': (event: QueryEvent) => void;
  'pattern:detected': (pattern: Pattern) => void;
  'alert': (alert: Alert) => void;
}

/**
 * Typed event emitter for query monitoring
 */
export interface TypedQueryMonitorEmitter extends EventEmitter {
  on<K extends keyof QueryMonitorEvents>(
    event: K,
    listener: QueryMonitorEvents[K]
  ): this;

  emit<K extends keyof QueryMonitorEvents>(
    event: K,
    ...args: Parameters<QueryMonitorEvents[K]>
  ): boolean;

  once<K extends keyof QueryMonitorEvents>(
    event: K,
    listener: QueryMonitorEvents[K]
  ): this;

  off<K extends keyof QueryMonitorEvents>(
    event: K,
    listener: QueryMonitorEvents[K]
  ): this;
}
