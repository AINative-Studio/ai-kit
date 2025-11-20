/**
 * AIKIT Instrumentation - Type Definitions
 *
 * This module provides types for automatic instrumentation,
 * tracing, metrics collection, and monitoring.
 */

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Instrumentation configuration
 */
export interface InstrumentationConfig {
  /**
   * Whether instrumentation is enabled
   */
  enabled?: boolean;

  /**
   * Service name for tracing
   */
  serviceName?: string;

  /**
   * Environment (development, staging, production)
   */
  environment?: string;

  /**
   * Sampling rate for traces (0-1)
   */
  samplingRate?: number;

  /**
   * Whether to collect metrics
   */
  collectMetrics?: boolean;

  /**
   * Whether to enable tracing
   */
  enableTracing?: boolean;

  /**
   * Custom metadata to attach to all traces
   */
  metadata?: Record<string, unknown>;

  /**
   * Metrics collector instance
   */
  metricsCollector?: MetricsCollector;

  /**
   * Custom trace exporter
   */
  traceExporter?: TraceExporter;

  /**
   * Log level for instrumentation
   */
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

// ============================================================================
// Tracing Types
// ============================================================================

/**
 * Trace context for distributed tracing
 */
export interface TraceContext {
  /**
   * Unique trace ID
   */
  traceId: string;

  /**
   * Parent span ID (if any)
   */
  parentSpanId?: string;

  /**
   * Trace flags
   */
  flags?: number;

  /**
   * Trace state (for propagation)
   */
  state?: string;

  /**
   * Custom baggage
   */
  baggage?: Record<string, string>;
}

/**
 * Span status
 */
export type SpanStatus = 'ok' | 'error' | 'unset';

/**
 * Span kind
 */
export type SpanKind = 'internal' | 'server' | 'client' | 'producer' | 'consumer';

/**
 * Span represents a unit of work in a trace
 */
export interface Span {
  /**
   * Unique span ID
   */
  spanId: string;

  /**
   * Trace ID this span belongs to
   */
  traceId: string;

  /**
   * Parent span ID
   */
  parentSpanId?: string;

  /**
   * Span name/operation
   */
  name: string;

  /**
   * Span kind
   */
  kind: SpanKind;

  /**
   * Start timestamp (milliseconds)
   */
  startTime: number;

  /**
   * End timestamp (milliseconds)
   */
  endTime?: number;

  /**
   * Duration in milliseconds
   */
  duration?: number;

  /**
   * Span status
   */
  status: SpanStatus;

  /**
   * Status message (for errors)
   */
  statusMessage?: string;

  /**
   * Span attributes/metadata
   */
  attributes: Record<string, unknown>;

  /**
   * Span events
   */
  events: SpanEvent[];

  /**
   * Links to other spans
   */
  links: SpanLink[];
}

/**
 * Span event
 */
export interface SpanEvent {
  /**
   * Event name
   */
  name: string;

  /**
   * Event timestamp
   */
  timestamp: number;

  /**
   * Event attributes
   */
  attributes?: Record<string, unknown>;
}

/**
 * Link to another span
 */
export interface SpanLink {
  /**
   * Trace ID of linked span
   */
  traceId: string;

  /**
   * Span ID of linked span
   */
  spanId: string;

  /**
   * Link attributes
   */
  attributes?: Record<string, unknown>;
}

/**
 * Trace represents a complete execution flow
 */
export interface Trace {
  /**
   * Unique trace ID
   */
  traceId: string;

  /**
   * Service name
   */
  serviceName: string;

  /**
   * Root span
   */
  rootSpan: Span;

  /**
   * All spans in the trace
   */
  spans: Span[];

  /**
   * Trace start time
   */
  startTime: number;

  /**
   * Trace end time
   */
  endTime?: number;

  /**
   * Total duration
   */
  duration?: number;

  /**
   * Trace metadata
   */
  metadata?: Record<string, unknown>;
}

/**
 * Trace exporter interface
 */
export interface TraceExporter {
  /**
   * Export a completed trace
   */
  export(trace: Trace): Promise<void>;

  /**
   * Flush pending traces
   */
  flush?(): Promise<void>;

  /**
   * Shutdown the exporter
   */
  shutdown?(): Promise<void>;
}

// ============================================================================
// Metrics Types
// ============================================================================

/**
 * Metric types
 */
export type MetricType = 'counter' | 'gauge' | 'histogram' | 'summary';

/**
 * Base metric interface
 */
export interface Metric {
  /**
   * Metric name
   */
  name: string;

  /**
   * Metric type
   */
  type: MetricType;

  /**
   * Metric description
   */
  description?: string;

  /**
   * Metric unit
   */
  unit?: string;

  /**
   * Metric labels/tags
   */
  labels?: Record<string, string>;

  /**
   * Timestamp
   */
  timestamp: number;
}

/**
 * Counter metric (monotonically increasing)
 */
export interface CounterMetric extends Metric {
  type: 'counter';
  value: number;
}

/**
 * Gauge metric (can go up or down)
 */
export interface GaugeMetric extends Metric {
  type: 'gauge';
  value: number;
}

/**
 * Histogram metric (distribution of values)
 */
export interface HistogramMetric extends Metric {
  type: 'histogram';
  values: number[];
  buckets?: number[];
  sum?: number;
  count?: number;
}

/**
 * Summary metric (percentiles)
 */
export interface SummaryMetric extends Metric {
  type: 'summary';
  sum: number;
  count: number;
  quantiles?: Record<number, number>; // percentile -> value
}

/**
 * Union of all metric types
 */
export type AnyMetric = CounterMetric | GaugeMetric | HistogramMetric | SummaryMetric;

/**
 * LLM-specific metrics
 */
export interface LLMMetrics {
  /**
   * Request duration (milliseconds)
   */
  requestDuration: number;

  /**
   * Time spent waiting for first token (TTFT)
   */
  timeToFirstToken?: number;

  /**
   * LLM processing time
   */
  llmProcessingTime?: number;

  /**
   * Token counts
   */
  tokens: {
    prompt: number;
    completion: number;
    total: number;
  };

  /**
   * Cost estimate (if available)
   */
  estimatedCost?: number;

  /**
   * Provider and model
   */
  provider: string;
  model: string;

  /**
   * Whether request succeeded
   */
  success: boolean;

  /**
   * Error type (if failed)
   */
  errorType?: string;

  /**
   * Retry count
   */
  retryCount?: number;

  /**
   * Cache hit
   */
  cacheHit?: boolean;

  /**
   * Streaming enabled
   */
  streaming?: boolean;

  /**
   * Custom metadata
   */
  metadata?: Record<string, unknown>;
}

/**
 * Tool execution metrics
 */
export interface ToolMetrics {
  /**
   * Tool name
   */
  toolName: string;

  /**
   * Execution duration
   */
  duration: number;

  /**
   * Whether execution succeeded
   */
  success: boolean;

  /**
   * Error type (if failed)
   */
  errorType?: string;

  /**
   * Retry count
   */
  retryCount?: number;

  /**
   * Queue time (if queued)
   */
  queueTime?: number;

  /**
   * Result size (bytes)
   */
  resultSize?: number;

  /**
   * Custom metadata
   */
  metadata?: Record<string, unknown>;
}

/**
 * Agent execution metrics
 */
export interface AgentMetrics {
  /**
   * Agent ID
   */
  agentId: string;

  /**
   * Total execution duration
   */
  totalDuration: number;

  /**
   * Number of steps
   */
  steps: number;

  /**
   * Number of LLM calls
   */
  llmCalls: number;

  /**
   * Number of tool calls
   */
  toolCalls: number;

  /**
   * Total tokens used
   */
  totalTokens: number;

  /**
   * Whether execution succeeded
   */
  success: boolean;

  /**
   * Error type (if failed)
   */
  errorType?: string;

  /**
   * Custom metadata
   */
  metadata?: Record<string, unknown>;
}

/**
 * Metrics collector interface
 */
export interface MetricsCollector {
  /**
   * Record a counter metric
   */
  recordCounter(name: string, value: number, labels?: Record<string, string>): void;

  /**
   * Record a gauge metric
   */
  recordGauge(name: string, value: number, labels?: Record<string, string>): void;

  /**
   * Record a histogram metric
   */
  recordHistogram(name: string, value: number, labels?: Record<string, string>): void;

  /**
   * Record LLM metrics
   */
  recordLLMMetrics(metrics: LLMMetrics): void;

  /**
   * Record tool metrics
   */
  recordToolMetrics(metrics: ToolMetrics): void;

  /**
   * Record agent metrics
   */
  recordAgentMetrics(metrics: AgentMetrics): void;

  /**
   * Get all collected metrics
   */
  getMetrics(): AnyMetric[];

  /**
   * Clear collected metrics
   */
  clear(): void;
}

// ============================================================================
// Interceptor Types
// ============================================================================

/**
 * Interceptor context
 */
export interface InterceptorContext {
  /**
   * Trace context
   */
  trace: TraceContext;

  /**
   * Current span
   */
  span?: Span;

  /**
   * Metrics collector
   */
  metrics?: MetricsCollector;

  /**
   * Custom data
   */
  data?: Record<string, unknown>;
}

/**
 * LLM request interceptor
 */
export interface LLMInterceptor {
  /**
   * Called before LLM request
   */
  beforeRequest?(request: any, context: InterceptorContext): Promise<void> | void;

  /**
   * Called after LLM response
   */
  afterResponse?(
    request: any,
    response: any,
    context: InterceptorContext
  ): Promise<void> | void;

  /**
   * Called on LLM error
   */
  onError?(request: any, error: Error, context: InterceptorContext): Promise<void> | void;
}

/**
 * Tool execution interceptor
 */
export interface ToolInterceptor {
  /**
   * Called before tool execution
   */
  beforeExecution?(
    toolName: string,
    params: any,
    context: InterceptorContext
  ): Promise<void> | void;

  /**
   * Called after tool execution
   */
  afterExecution?(
    toolName: string,
    params: any,
    result: any,
    context: InterceptorContext
  ): Promise<void> | void;

  /**
   * Called on tool error
   */
  onError?(
    toolName: string,
    params: any,
    error: Error,
    context: InterceptorContext
  ): Promise<void> | void;
}

/**
 * Agent execution interceptor
 */
export interface AgentInterceptor {
  /**
   * Called before agent execution
   */
  beforeExecution?(
    agentId: string,
    input: string,
    context: InterceptorContext
  ): Promise<void> | void;

  /**
   * Called after agent execution
   */
  afterExecution?(
    agentId: string,
    input: string,
    result: any,
    context: InterceptorContext
  ): Promise<void> | void;

  /**
   * Called on agent error
   */
  onError?(
    agentId: string,
    input: string,
    error: Error,
    context: InterceptorContext
  ): Promise<void> | void;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * ID generator function
 */
export type IdGenerator = () => string;

/**
 * Instrumentation event
 */
export interface InstrumentationEvent {
  /**
   * Event type
   */
  type: string;

  /**
   * Event timestamp
   */
  timestamp: number;

  /**
   * Event data
   */
  data: Record<string, unknown>;

  /**
   * Trace context
   */
  trace?: TraceContext;
}

/**
 * Instrumentation event listener
 */
export type InstrumentationEventListener = (event: InstrumentationEvent) => void | Promise<void>;
