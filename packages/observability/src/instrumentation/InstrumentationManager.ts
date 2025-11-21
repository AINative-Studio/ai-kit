/**
 * AIKIT Instrumentation Manager
 *
 * This module provides automatic instrumentation for LLM providers,
 * agents, and tools with tracing, metrics, and monitoring.
 */

import { generateId } from '../utils/id';
import {
  InstrumentationConfig,
  TraceContext,
  Span,
  SpanKind,
  SpanStatus,
  Trace,
  InterceptorContext,
  LLMInterceptor,
  ToolInterceptor,
  AgentInterceptor,
  MetricsCollector,
  LLMMetrics,
  ToolMetrics,
  AgentMetrics,
  AnyMetric,
  InstrumentationEvent,
  InstrumentationEventListener,
} from './types';

/**
 * Default metrics collector implementation
 */
class DefaultMetricsCollector implements MetricsCollector {
  private metrics: AnyMetric[] = [];

  recordCounter(name: string, value: number, labels?: Record<string, string>): void {
    this.metrics.push({
      name,
      type: 'counter',
      value,
      labels,
      timestamp: Date.now(),
    });
  }

  recordGauge(name: string, value: number, labels?: Record<string, string>): void {
    this.metrics.push({
      name,
      type: 'gauge',
      value,
      labels,
      timestamp: Date.now(),
    });
  }

  recordHistogram(name: string, value: number, labels?: Record<string, string>): void {
    const existing = this.metrics.find(
      (m) => m.name === name && m.type === 'histogram'
    ) as any;

    if (existing) {
      existing.values.push(value);
      existing.sum = (existing.sum || 0) + value;
      existing.count = (existing.count || 0) + 1;
    } else {
      this.metrics.push({
        name,
        type: 'histogram',
        values: [value],
        sum: value,
        count: 1,
        labels,
        timestamp: Date.now(),
      });
    }
  }

  recordLLMMetrics(metrics: LLMMetrics): void {
    const labels = {
      provider: metrics.provider,
      model: metrics.model,
      success: String(metrics.success),
    };

    this.recordHistogram('llm.request.duration', metrics.requestDuration, labels);
    this.recordCounter('llm.request.total', 1, labels);
    this.recordCounter('llm.tokens.prompt', metrics.tokens.prompt, labels);
    this.recordCounter('llm.tokens.completion', metrics.tokens.completion, labels);
    this.recordCounter('llm.tokens.total', metrics.tokens.total, labels);

    if (metrics.timeToFirstToken !== undefined) {
      this.recordHistogram('llm.time_to_first_token', metrics.timeToFirstToken, labels);
    }

    if (metrics.retryCount !== undefined && metrics.retryCount > 0) {
      this.recordCounter('llm.retries', metrics.retryCount, labels);
    }

    if (!metrics.success && metrics.errorType) {
      this.recordCounter('llm.errors', 1, { ...labels, error_type: metrics.errorType });
    }

    if (metrics.cacheHit !== undefined) {
      this.recordCounter('llm.cache.hits', metrics.cacheHit ? 1 : 0, labels);
    }
  }

  recordToolMetrics(metrics: ToolMetrics): void {
    const labels = {
      tool_name: metrics.toolName,
      success: String(metrics.success),
    };

    this.recordHistogram('tool.execution.duration', metrics.duration, labels);
    this.recordCounter('tool.execution.total', 1, labels);

    if (metrics.retryCount !== undefined && metrics.retryCount > 0) {
      this.recordCounter('tool.retries', metrics.retryCount, labels);
    }

    if (!metrics.success && metrics.errorType) {
      this.recordCounter('tool.errors', 1, { ...labels, error_type: metrics.errorType });
    }

    if (metrics.queueTime !== undefined) {
      this.recordHistogram('tool.queue_time', metrics.queueTime, labels);
    }
  }

  recordAgentMetrics(metrics: AgentMetrics): void {
    const labels = {
      agent_id: metrics.agentId,
      success: String(metrics.success),
    };

    this.recordHistogram('agent.execution.duration', metrics.totalDuration, labels);
    this.recordCounter('agent.execution.total', 1, labels);
    this.recordGauge('agent.steps', metrics.steps, labels);
    this.recordGauge('agent.llm_calls', metrics.llmCalls, labels);
    this.recordGauge('agent.tool_calls', metrics.toolCalls, labels);
    this.recordCounter('agent.tokens.total', metrics.totalTokens, labels);

    if (!metrics.success && metrics.errorType) {
      this.recordCounter('agent.errors', 1, { ...labels, error_type: metrics.errorType });
    }
  }

  getMetrics(): AnyMetric[] {
    return [...this.metrics];
  }

  clear(): void {
    this.metrics = [];
  }
}

/**
 * Instrumentation Manager
 *
 * Provides automatic instrumentation with zero-config setup.
 */
export class InstrumentationManager {
  private config: Required<InstrumentationConfig>;
  private metricsCollector: MetricsCollector;
  private activeTraces: Map<string, Trace> = new Map();
  private activeSpans: Map<string, Span> = new Map();
  private llmInterceptors: LLMInterceptor[] = [];
  private toolInterceptors: ToolInterceptor[] = [];
  private agentInterceptors: AgentInterceptor[] = [];
  private eventListeners: InstrumentationEventListener[] = [];

  constructor(config: InstrumentationConfig = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      serviceName: config.serviceName ?? 'ai-kit',
      environment: config.environment ?? 'development',
      samplingRate: config.samplingRate ?? 1.0,
      collectMetrics: config.collectMetrics ?? true,
      enableTracing: config.enableTracing ?? true,
      metadata: config.metadata ?? {},
      metricsCollector: config.metricsCollector ?? new DefaultMetricsCollector(),
      traceExporter: config.traceExporter,
      logLevel: config.logLevel ?? 'info',
    };

    this.metricsCollector = this.config.metricsCollector;
  }

  // ============================================================================
  // Trace Management
  // ============================================================================

  /**
   * Create a new trace context
   */
  createTraceContext(): TraceContext {
    return {
      traceId: generateId(),
      flags: 1,
    };
  }

  /**
   * Start a new trace
   */
  startTrace(name: string, context?: TraceContext): Trace {
    if (!this.config.enabled || !this.config.enableTracing) {
      return this.createDummyTrace(name);
    }

    // Check sampling
    if (Math.random() > this.config.samplingRate) {
      return this.createDummyTrace(name);
    }

    const traceContext = context || this.createTraceContext();
    const rootSpan = this.createSpan(name, 'internal', traceContext);

    const trace: Trace = {
      traceId: traceContext.traceId,
      serviceName: this.config.serviceName,
      rootSpan,
      spans: [rootSpan],
      startTime: rootSpan.startTime,
      metadata: { ...this.config.metadata },
    };

    this.activeTraces.set(trace.traceId, trace);
    return trace;
  }

  /**
   * End a trace
   */
  async endTrace(traceId: string): Promise<void> {
    const trace = this.activeTraces.get(traceId);
    if (!trace) return;

    trace.endTime = Date.now();
    trace.duration = trace.endTime - trace.startTime;

    // End root span if not already ended
    if (!trace.rootSpan.endTime) {
      this.endSpan(trace.rootSpan.spanId);
    }

    // Export trace if exporter is configured
    if (this.config.traceExporter) {
      try {
        await this.config.traceExporter.export(trace);
      } catch (error) {
        this.log('error', 'Failed to export trace', { error, traceId });
      }
    }

    this.activeTraces.delete(traceId);
  }

  /**
   * Get an active trace
   */
  getTrace(traceId: string): Trace | undefined {
    return this.activeTraces.get(traceId);
  }

  // ============================================================================
  // Span Management
  // ============================================================================

  /**
   * Create a new span
   */
  createSpan(name: string, kind: SpanKind, context: TraceContext, parentSpanId?: string): Span {
    const span: Span = {
      spanId: generateId(),
      traceId: context.traceId,
      parentSpanId: parentSpanId || context.parentSpanId,
      name,
      kind,
      startTime: Date.now(),
      status: 'unset',
      attributes: {},
      events: [],
      links: [],
    };

    this.activeSpans.set(span.spanId, span);
    return span;
  }

  /**
   * End a span
   */
  endSpan(spanId: string, status: SpanStatus = 'ok', message?: string): void {
    const span = this.activeSpans.get(spanId);
    if (!span) return;

    span.endTime = Date.now();
    span.duration = span.endTime - span.startTime;
    span.status = status;
    span.statusMessage = message;

    // Add span to trace
    const trace = this.activeTraces.get(span.traceId);
    if (trace && !trace.spans.find((s) => s.spanId === spanId)) {
      trace.spans.push(span);
    }

    this.activeSpans.delete(spanId);
  }

  /**
   * Add attributes to a span
   */
  addSpanAttributes(spanId: string, attributes: Record<string, unknown>): void {
    const span = this.activeSpans.get(spanId);
    if (span) {
      span.attributes = { ...span.attributes, ...attributes };
    }
  }

  /**
   * Add an event to a span
   */
  addSpanEvent(spanId: string, name: string, attributes?: Record<string, unknown>): void {
    const span = this.activeSpans.get(spanId);
    if (span) {
      span.events.push({
        name,
        timestamp: Date.now(),
        attributes,
      });
    }
  }

  // ============================================================================
  // Interceptor Management
  // ============================================================================

  /**
   * Register an LLM interceptor
   */
  registerLLMInterceptor(interceptor: LLMInterceptor): void {
    this.llmInterceptors.push(interceptor);
  }

  /**
   * Register a tool interceptor
   */
  registerToolInterceptor(interceptor: ToolInterceptor): void {
    this.toolInterceptors.push(interceptor);
  }

  /**
   * Register an agent interceptor
   */
  registerAgentInterceptor(interceptor: AgentInterceptor): void {
    this.agentInterceptors.push(interceptor);
  }

  // ============================================================================
  // Instrumentation Helpers
  // ============================================================================

  /**
   * Instrument an LLM call
   */
  async instrumentLLMCall<T>(
    provider: string,
    model: string,
    request: any,
    fn: () => Promise<T>,
    context?: TraceContext
  ): Promise<T> {
    if (!this.config.enabled) {
      return fn();
    }

    const traceContext = context || this.createTraceContext();
    const span = this.createSpan(`llm.${provider}.chat`, 'client', traceContext);

    this.addSpanAttributes(span.spanId, {
      'llm.provider': provider,
      'llm.model': model,
      'llm.request.messages': request.messages?.length || 0,
    });

    const interceptorContext: InterceptorContext = {
      trace: traceContext,
      span,
      metrics: this.metricsCollector,
    };

    const startTime = Date.now();
    let ttft: number | undefined;
    let success = true;
    let errorType: string | undefined;
    let retryCount = 0;
    let result: T;

    try {
      // Call beforeRequest interceptors
      for (const interceptor of this.llmInterceptors) {
        if (interceptor.beforeRequest) {
          await interceptor.beforeRequest(request, interceptorContext);
        }
      }

      this.addSpanEvent(span.spanId, 'llm.request.start');

      result = await fn();

      this.addSpanEvent(span.spanId, 'llm.response.received');

      // Call afterResponse interceptors
      for (const interceptor of this.llmInterceptors) {
        if (interceptor.afterResponse) {
          await interceptor.afterResponse(request, result, interceptorContext);
        }
      }

      this.endSpan(span.spanId, 'ok');
    } catch (error: any) {
      success = false;
      errorType = error.constructor?.name || 'Error';

      this.addSpanAttributes(span.spanId, {
        'error': true,
        'error.type': errorType,
        'error.message': error.message,
      });

      // Call onError interceptors
      for (const interceptor of this.llmInterceptors) {
        if (interceptor.onError) {
          await interceptor.onError(request, error, interceptorContext);
        }
      }

      this.endSpan(span.spanId, 'error', error.message);
      throw error;
    } finally {
      const duration = Date.now() - startTime;

      // Extract token counts from result
      const tokens = this.extractTokenCounts(result);

      // Record metrics
      if (this.config.collectMetrics) {
        const metrics: LLMMetrics = {
          requestDuration: duration,
          timeToFirstToken: ttft,
          tokens,
          provider,
          model,
          success,
          errorType,
          retryCount,
        };

        this.metricsCollector.recordLLMMetrics(metrics);
      }
    }

    return result!;
  }

  /**
   * Instrument a tool call
   */
  async instrumentToolCall<T>(
    toolName: string,
    params: any,
    fn: () => Promise<T>,
    context?: TraceContext
  ): Promise<T> {
    if (!this.config.enabled) {
      return fn();
    }

    const traceContext = context || this.createTraceContext();
    const span = this.createSpan(`tool.${toolName}`, 'internal', traceContext);

    this.addSpanAttributes(span.spanId, {
      'tool.name': toolName,
      'tool.parameters': JSON.stringify(params),
    });

    const interceptorContext: InterceptorContext = {
      trace: traceContext,
      span,
      metrics: this.metricsCollector,
    };

    const startTime = Date.now();
    let success = true;
    let errorType: string | undefined;
    let retryCount = 0;
    let result: T;

    try {
      // Call beforeExecution interceptors
      for (const interceptor of this.toolInterceptors) {
        if (interceptor.beforeExecution) {
          await interceptor.beforeExecution(toolName, params, interceptorContext);
        }
      }

      this.addSpanEvent(span.spanId, 'tool.execution.start');

      result = await fn();

      this.addSpanEvent(span.spanId, 'tool.execution.complete');

      // Call afterExecution interceptors
      for (const interceptor of this.toolInterceptors) {
        if (interceptor.afterExecution) {
          await interceptor.afterExecution(toolName, params, result, interceptorContext);
        }
      }

      this.endSpan(span.spanId, 'ok');
    } catch (error: any) {
      success = false;
      errorType = error.constructor?.name || 'Error';

      this.addSpanAttributes(span.spanId, {
        'error': true,
        'error.type': errorType,
        'error.message': error.message,
      });

      // Call onError interceptors
      for (const interceptor of this.toolInterceptors) {
        if (interceptor.onError) {
          await interceptor.onError(toolName, params, error, interceptorContext);
        }
      }

      this.endSpan(span.spanId, 'error', error.message);
      throw error;
    } finally {
      const duration = Date.now() - startTime;

      // Record metrics
      if (this.config.collectMetrics) {
        const metrics: ToolMetrics = {
          toolName,
          duration,
          success,
          errorType,
          retryCount,
        };

        this.metricsCollector.recordToolMetrics(metrics);
      }
    }

    return result!;
  }

  /**
   * Instrument agent execution
   */
  async instrumentAgentExecution<T>(
    agentId: string,
    input: string,
    fn: () => Promise<T>,
    context?: TraceContext
  ): Promise<T> {
    if (!this.config.enabled) {
      return fn();
    }

    const traceContext = context || this.createTraceContext();
    const span = this.createSpan(`agent.${agentId}.execute`, 'server', traceContext);

    this.addSpanAttributes(span.spanId, {
      'agent.id': agentId,
      'agent.input': input,
    });

    const interceptorContext: InterceptorContext = {
      trace: traceContext,
      span,
      metrics: this.metricsCollector,
      data: {
        steps: 0,
        llmCalls: 0,
        toolCalls: 0,
        totalTokens: 0,
      },
    };

    const startTime = Date.now();
    let success = true;
    let errorType: string | undefined;
    let result: T;

    try {
      // Call beforeExecution interceptors
      for (const interceptor of this.agentInterceptors) {
        if (interceptor.beforeExecution) {
          await interceptor.beforeExecution(agentId, input, interceptorContext);
        }
      }

      this.addSpanEvent(span.spanId, 'agent.execution.start');

      result = await fn();

      this.addSpanEvent(span.spanId, 'agent.execution.complete');

      // Call afterExecution interceptors
      for (const interceptor of this.agentInterceptors) {
        if (interceptor.afterExecution) {
          await interceptor.afterExecution(agentId, input, result, interceptorContext);
        }
      }

      this.endSpan(span.spanId, 'ok');
    } catch (error: any) {
      success = false;
      errorType = error.constructor?.name || 'Error';

      this.addSpanAttributes(span.spanId, {
        'error': true,
        'error.type': errorType,
        'error.message': error.message,
      });

      // Call onError interceptors
      for (const interceptor of this.agentInterceptors) {
        if (interceptor.onError) {
          await interceptor.onError(agentId, input, error, interceptorContext);
        }
      }

      this.endSpan(span.spanId, 'error', error.message);
      throw error;
    } finally {
      const duration = Date.now() - startTime;

      // Record metrics
      if (this.config.collectMetrics) {
        const data = interceptorContext.data!;
        const metrics: AgentMetrics = {
          agentId,
          totalDuration: duration,
          steps: (data.steps as number) || 0,
          llmCalls: (data.llmCalls as number) || 0,
          toolCalls: (data.toolCalls as number) || 0,
          totalTokens: (data.totalTokens as number) || 0,
          success,
          errorType,
        };

        this.metricsCollector.recordAgentMetrics(metrics);
      }
    }

    return result!;
  }

  // ============================================================================
  // Event Management
  // ============================================================================

  /**
   * Add an event listener
   */
  addEventListener(listener: InstrumentationEventListener): void {
    this.eventListeners.push(listener);
  }

  /**
   * Remove an event listener
   */
  removeEventListener(listener: InstrumentationEventListener): void {
    const index = this.eventListeners.indexOf(listener);
    if (index !== -1) {
      this.eventListeners.splice(index, 1);
    }
  }

  /**
   * Emit an event
   */
  private async emitEvent(event: InstrumentationEvent): Promise<void> {
    for (const listener of this.eventListeners) {
      try {
        await listener(event);
      } catch (error) {
        this.log('error', 'Event listener error', { error, event });
      }
    }
  }

  // ============================================================================
  // Metrics Access
  // ============================================================================

  /**
   * Get collected metrics
   */
  getMetrics(): AnyMetric[] {
    return this.metricsCollector.getMetrics();
  }

  /**
   * Clear metrics
   */
  clearMetrics(): void {
    this.metricsCollector.clear();
  }

  /**
   * Get metrics collector
   */
  getMetricsCollector(): MetricsCollector {
    return this.metricsCollector;
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Enable instrumentation
   */
  enable(): void {
    this.config.enabled = true;
  }

  /**
   * Disable instrumentation
   */
  disable(): void {
    this.config.enabled = false;
  }

  /**
   * Check if instrumentation is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Get configuration
   */
  getConfig(): Required<InstrumentationConfig> {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<InstrumentationConfig>): void {
    this.config = {
      ...this.config,
      ...config,
      metadata: {
        ...this.config.metadata,
        ...config.metadata,
      },
    };
  }

  /**
   * Shutdown instrumentation
   */
  async shutdown(): Promise<void> {
    // End all active traces
    for (const traceId of this.activeTraces.keys()) {
      await this.endTrace(traceId);
    }

    // Flush trace exporter if available
    if (this.config.traceExporter?.flush) {
      await this.config.traceExporter.flush();
    }

    // Shutdown trace exporter if available
    if (this.config.traceExporter?.shutdown) {
      await this.config.traceExporter.shutdown();
    }

    // Clear all data
    this.activeTraces.clear();
    this.activeSpans.clear();
    this.clearMetrics();
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  /**
   * Create a dummy trace (for when tracing is disabled)
   */
  private createDummyTrace(name: string): Trace {
    const dummySpan: Span = {
      spanId: 'dummy',
      traceId: 'dummy',
      name,
      kind: 'internal',
      startTime: Date.now(),
      status: 'unset',
      attributes: {},
      events: [],
      links: [],
    };

    return {
      traceId: 'dummy',
      serviceName: this.config.serviceName,
      rootSpan: dummySpan,
      spans: [dummySpan],
      startTime: Date.now(),
    };
  }

  /**
   * Extract token counts from LLM response
   */
  private extractTokenCounts(result: any): { prompt: number; completion: number; total: number } {
    // Try to extract from common response formats
    if (result?.usage) {
      return {
        prompt: result.usage.promptTokens || result.usage.prompt_tokens || 0,
        completion: result.usage.completionTokens || result.usage.completion_tokens || 0,
        total: result.usage.totalTokens || result.usage.total_tokens || 0,
      };
    }

    return { prompt: 0, completion: 0, total: 0 };
  }

  /**
   * Log a message
   */
  private log(level: string, message: string, data?: Record<string, unknown>): void {
    const levels = ['debug', 'info', 'warn', 'error'];
    const configLevel = levels.indexOf(this.config.logLevel);
    const messageLevel = levels.indexOf(level);

    if (messageLevel >= configLevel) {
      const logData = {
        level,
        message,
        service: this.config.serviceName,
        ...data,
      };

      if (level === 'error') {
        console.error('[Instrumentation]', logData);
      } else if (level === 'warn') {
        console.warn('[Instrumentation]', logData);
      } else {
        console.log('[Instrumentation]', logData);
      }
    }
  }
}

/**
 * Global instrumentation manager instance
 */
let globalInstrumentation: InstrumentationManager | null = null;

/**
 * Get or create global instrumentation manager
 */
export function getInstrumentation(config?: InstrumentationConfig): InstrumentationManager {
  if (!globalInstrumentation) {
    globalInstrumentation = new InstrumentationManager(config);
  }
  return globalInstrumentation;
}

/**
 * Set global instrumentation manager
 */
export function setInstrumentation(manager: InstrumentationManager): void {
  globalInstrumentation = manager;
}

/**
 * Reset global instrumentation manager
 */
export function resetInstrumentation(): void {
  globalInstrumentation = null;
}
