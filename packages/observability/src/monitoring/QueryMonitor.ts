/**
 * AIKIT Query Monitor
 *
 * Real-time monitoring of LLM queries with event emission,
 * performance tracking, pattern detection, and alerting.
 */

import { EventEmitter } from 'events';
import {
  QueryEvent,
  QueryEventType,
  QueryMetrics,
  QueryContext,
  MonitorConfig,
  Pattern,
  PatternType,
  Alert,
  AlertType,
  AlertSeverity,
  MonitoringStats,
  TypedQueryMonitorEmitter,
} from './types';

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<MonitorConfig> = {
  enabled: true,
  slowQueryThresholdMs: 5000,
  enablePatternDetection: true,
  patternDetection: {
    maxPatterns: 100,
    timeWindowMs: 3600000, // 1 hour
    minOccurrences: 3,
    similarityThreshold: 0.85,
  },
  alerts: {
    enabled: true,
    thresholds: {
      errorRate: 0.1, // 10% error rate
      avgDuration: 10000, // 10 seconds
      costPerQuery: 0.5, // $0.50 per query
      totalCost: 100, // $100 total
    },
    onAlert: undefined,
  },
  retention: {
    maxQueries: 10000,
    maxAgeMs: 86400000, // 24 hours
  },
  instrumentation: {},
};

/**
 * Query Monitor - Real-time LLM query monitoring
 */
export class QueryMonitor {
  private emitter: TypedQueryMonitorEmitter;
  private config: Required<MonitorConfig>;
  private queryMetrics: Map<string, QueryMetrics>;
  private queryContexts: Map<string, QueryContext>;
  private patterns: Map<string, Pattern>;
  private startTimes: Map<string, number>;
  private enabled: boolean;

  constructor(config: MonitorConfig = {}) {
    this.emitter = new EventEmitter() as TypedQueryMonitorEmitter;
    this.config = this.mergeConfig(config);
    this.queryMetrics = new Map();
    this.queryContexts = new Map();
    this.patterns = new Map();
    this.startTimes = new Map();
    this.enabled = this.config.enabled;
  }

  // ============================================================================
  // Query Lifecycle Tracking
  // ============================================================================

  /**
   * Record the start of a query
   */
  public startQuery(context: QueryContext): void {
    if (!this.enabled) return;

    // Use context.startTime if provided, otherwise use current time
    const startTime = context.startTime
      ? new Date(context.startTime).getTime()
      : Date.now();
    this.startTimes.set(context.queryId, startTime);
    this.queryContexts.set(context.queryId, context);

    const metrics: QueryMetrics = {
      totalDuration: 0,
      llmDuration: 0,
      processingDuration: 0,
      tokens: { input: 0, output: 0, total: 0 },
      model: context.model.name,
      provider: context.model.provider,
      success: false,
      retryCount: 0,
      cached: false,
    };

    this.queryMetrics.set(context.queryId, metrics);

    const event: QueryEvent = {
      type: 'query:start',
      queryId: context.queryId,
      timestamp: new Date(startTime).toISOString(),
      metrics,
      data: {
        agentId: context.agentId,
        model: context.model,
        tags: context.tags,
      },
    };

    this.emitEvent(event);
  }

  /**
   * Record query completion
   */
  public completeQuery(
    queryId: string,
    result: {
      tokens: { input: number; output: number };
      llmDuration: number;
      response?: string;
    }
  ): void {
    if (!this.enabled) return;

    const startTime = this.startTimes.get(queryId);
    if (!startTime) {
      console.warn(`QueryMonitor: No start time found for query ${queryId}`);
      return;
    }

    const totalDuration = Date.now() - startTime;
    const processingDuration = totalDuration - result.llmDuration;

    const metrics = this.queryMetrics.get(queryId);
    if (!metrics) return;

    // Update metrics
    metrics.totalDuration = totalDuration;
    metrics.llmDuration = result.llmDuration;
    metrics.processingDuration = processingDuration;
    metrics.tokens = {
      input: result.tokens.input,
      output: result.tokens.output,
      total: result.tokens.input + result.tokens.output,
    };
    metrics.success = true;
    metrics.cost = this.calculateCost(metrics);

    const event: QueryEvent = {
      type: 'query:complete',
      queryId,
      timestamp: new Date().toISOString(),
      metrics,
      data: {
        response: result.response,
      },
    };

    this.emitEvent(event);

    // Check for slow query
    if (totalDuration > this.config.slowQueryThresholdMs) {
      this.emitSlowQuery(queryId, metrics);
    }

    // Pattern detection
    if (this.config.enablePatternDetection) {
      this.detectPatterns(queryId, metrics);
    }

    // Alert checks
    this.checkAlerts();

    // Clean up start time
    this.startTimes.delete(queryId);

    // Report to instrumentation
    this.reportToInstrumentation(metrics);

    // Cleanup old metrics
    this.cleanupOldMetrics();
  }

  /**
   * Record query error
   */
  public recordError(
    queryId: string,
    error: Error,
    options?: { llmDuration?: number }
  ): void {
    if (!this.enabled) return;

    const startTime = this.startTimes.get(queryId);
    const totalDuration = startTime ? Date.now() - startTime : 0;

    const metrics = this.queryMetrics.get(queryId) || this.createDefaultMetrics(queryId);

    metrics.totalDuration = totalDuration;
    metrics.llmDuration = options?.llmDuration || 0;
    metrics.processingDuration = totalDuration - metrics.llmDuration;
    metrics.success = false;
    metrics.error = {
      message: error.message,
      code: (error as any).code,
      stack: error.stack,
    };

    this.queryMetrics.set(queryId, metrics);

    const event: QueryEvent = {
      type: 'query:error',
      queryId,
      timestamp: new Date().toISOString(),
      metrics,
      data: {
        error: {
          message: error.message,
          stack: error.stack,
        },
      },
    };

    this.emitEvent(event);

    // Pattern detection for failing queries
    if (this.config.enablePatternDetection) {
      this.detectPatterns(queryId, metrics);
    }

    // Check for error rate alerts
    this.checkAlerts();

    // Clean up
    this.startTimes.delete(queryId);
  }

  /**
   * Record query retry
   */
  public recordRetry(queryId: string, retryCount: number): void {
    if (!this.enabled) return;

    const metrics = this.queryMetrics.get(queryId);
    if (!metrics) return;

    metrics.retryCount = retryCount;

    const event: QueryEvent = {
      type: 'query:retry',
      queryId,
      timestamp: new Date().toISOString(),
      metrics,
      data: {
        retryCount,
      },
    };

    this.emitEvent(event);
  }

  /**
   * Record cache hit
   */
  public recordCacheHit(queryId: string, cachedResult: any): void {
    if (!this.enabled) return;

    const metrics = this.queryMetrics.get(queryId) || this.createDefaultMetrics(queryId);
    metrics.cached = true;
    metrics.success = true;
    metrics.totalDuration = 0;
    metrics.llmDuration = 0;
    metrics.cost = 0;

    this.queryMetrics.set(queryId, metrics);

    const event: QueryEvent = {
      type: 'query:cached',
      queryId,
      timestamp: new Date().toISOString(),
      metrics,
      data: {
        cached: true,
      },
    };

    this.emitEvent(event);
  }

  // ============================================================================
  // Event Emission
  // ============================================================================

  /**
   * Emit a query event
   */
  private emitEvent(event: QueryEvent): void {
    this.emitter.emit(event.type, event);
  }

  /**
   * Emit slow query event
   */
  private emitSlowQuery(queryId: string, metrics: QueryMetrics): void {
    const event: QueryEvent = {
      type: 'query:slow',
      queryId,
      timestamp: new Date().toISOString(),
      metrics,
      data: {
        threshold: this.config.slowQueryThresholdMs,
        exceeded: metrics.totalDuration - this.config.slowQueryThresholdMs,
      },
    };

    this.emitEvent(event);
  }

  // ============================================================================
  // Pattern Detection
  // ============================================================================

  /**
   * Detect patterns in queries
   */
  private detectPatterns(queryId: string, metrics: QueryMetrics): void {
    const context = this.queryContexts.get(queryId);
    if (!context) return;

    // Detect repeated queries
    this.detectRepeatedQueries(queryId, context);

    // Detect expensive queries
    if (metrics.cost && metrics.cost > (this.config.alerts.thresholds?.costPerQuery || 0.5)) {
      this.detectExpensiveQueries(queryId, metrics);
    }

    // Detect failing queries
    if (!metrics.success) {
      this.detectFailingQueries(queryId, metrics);
    }

    // Detect slow queries
    if (metrics.totalDuration > this.config.slowQueryThresholdMs) {
      this.detectSlowQueries(queryId, metrics);
    }
  }

  /**
   * Detect repeated queries
   */
  private detectRepeatedQueries(queryId: string, context: QueryContext): void {
    const patternId = `repeated:${this.hashPrompt(context.prompt)}`;
    const pattern = this.patterns.get(patternId);

    if (pattern) {
      pattern.occurrences++;
      pattern.lastSeen = new Date().toISOString();
      pattern.queryIds.push(queryId);
      this.updatePatternMetrics(pattern, queryId);
    } else {
      const newPattern: Pattern = {
        type: 'repeated',
        id: patternId,
        description: `Repeated query: "${context.prompt.substring(0, 50)}..."`,
        occurrences: 1,
        firstSeen: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        queryIds: [queryId],
        aggregateMetrics: {
          avgDuration: 0,
          totalCost: 0,
          successRate: 1,
          totalTokens: 0,
        },
      };
      this.patterns.set(patternId, newPattern);
    }

    // Emit pattern detection if threshold met
    if (pattern && pattern.occurrences >= (this.config.patternDetection.minOccurrences || 3)) {
      this.emitter.emit('pattern:detected', pattern);
    }
  }

  /**
   * Detect expensive queries
   */
  private detectExpensiveQueries(queryId: string, metrics: QueryMetrics): void {
    const patternId = `expensive:${metrics.model}`;
    this.updateOrCreatePattern(patternId, 'expensive', queryId, metrics,
      `Expensive queries on ${metrics.model}`);
  }

  /**
   * Detect failing queries
   */
  private detectFailingQueries(queryId: string, metrics: QueryMetrics): void {
    const patternId = `failing:${metrics.model}`;
    this.updateOrCreatePattern(patternId, 'failing', queryId, metrics,
      `Failing queries on ${metrics.model}`);
  }

  /**
   * Detect slow queries
   */
  private detectSlowQueries(queryId: string, metrics: QueryMetrics): void {
    const patternId = `slow:${metrics.model}`;
    this.updateOrCreatePattern(patternId, 'slow', queryId, metrics,
      `Slow queries on ${metrics.model}`);
  }

  /**
   * Update or create a pattern
   */
  private updateOrCreatePattern(
    patternId: string,
    type: PatternType,
    queryId: string,
    metrics: QueryMetrics,
    description: string
  ): void {
    const pattern = this.patterns.get(patternId);

    if (pattern) {
      pattern.occurrences++;
      pattern.lastSeen = new Date().toISOString();
      pattern.queryIds.push(queryId);
      this.updatePatternMetrics(pattern, queryId);

      if (pattern.occurrences >= (this.config.patternDetection.minOccurrences || 3)) {
        this.emitter.emit('pattern:detected', pattern);
      }
    } else {
      const newPattern: Pattern = {
        type,
        id: patternId,
        description,
        occurrences: 1,
        firstSeen: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        queryIds: [queryId],
        aggregateMetrics: {
          avgDuration: metrics.totalDuration,
          totalCost: metrics.cost || 0,
          successRate: metrics.success ? 1 : 0,
          totalTokens: metrics.tokens.total,
        },
      };
      this.patterns.set(patternId, newPattern);
    }
  }

  /**
   * Update pattern aggregate metrics
   */
  private updatePatternMetrics(pattern: Pattern, queryId: string): void {
    const metrics = this.queryMetrics.get(queryId);
    if (!metrics) return;

    const totalQueries = pattern.occurrences;

    // Update averages incrementally
    pattern.aggregateMetrics.avgDuration =
      (pattern.aggregateMetrics.avgDuration * (totalQueries - 1) + metrics.totalDuration) / totalQueries;

    pattern.aggregateMetrics.totalCost += metrics.cost || 0;
    pattern.aggregateMetrics.totalTokens += metrics.tokens.total;

    const successCount = pattern.queryIds.reduce((count, id) => {
      const m = this.queryMetrics.get(id);
      return count + (m?.success ? 1 : 0);
    }, 0);
    pattern.aggregateMetrics.successRate = successCount / totalQueries;
  }

  // ============================================================================
  // Alerting
  // ============================================================================

  /**
   * Check alert conditions
   */
  private checkAlerts(): void {
    if (!this.config.alerts.enabled) return;

    const stats = this.getStats();

    // Check error rate
    const errorRate = stats.totalQueries > 0
      ? stats.failedQueries / stats.totalQueries
      : 0;

    if (errorRate > (this.config.alerts.thresholds?.errorRate || 0.1)) {
      this.emitAlert({
        type: 'high_error_rate',
        severity: 'error',
        message: `High error rate detected: ${(errorRate * 100).toFixed(2)}%`,
        timestamp: new Date().toISOString(),
        data: {
          errorRate,
          threshold: this.config.alerts.thresholds?.errorRate,
          failedQueries: stats.failedQueries,
          totalQueries: stats.totalQueries,
        },
        suggestions: [
          'Review recent error logs',
          'Check API credentials and quotas',
          'Verify model availability',
        ],
      });
    }

    // Check average duration
    if (stats.aggregateMetrics.avgDuration > (this.config.alerts.thresholds?.avgDuration || 10000)) {
      this.emitAlert({
        type: 'slow_queries',
        severity: 'warning',
        message: `Average query duration exceeded: ${stats.aggregateMetrics.avgDuration.toFixed(0)}ms`,
        timestamp: new Date().toISOString(),
        data: {
          avgDuration: stats.aggregateMetrics.avgDuration,
          threshold: this.config.alerts.thresholds?.avgDuration,
        },
        suggestions: [
          'Consider using a faster model',
          'Reduce prompt size or complexity',
          'Implement caching for repeated queries',
        ],
      });
    }

    // Check total cost
    if (stats.aggregateMetrics.totalCost > (this.config.alerts.thresholds?.totalCost || 100)) {
      this.emitAlert({
        type: 'high_cost',
        severity: 'warning',
        message: `Total cost exceeded: $${stats.aggregateMetrics.totalCost.toFixed(2)}`,
        timestamp: new Date().toISOString(),
        data: {
          totalCost: stats.aggregateMetrics.totalCost,
          threshold: this.config.alerts.thresholds?.totalCost,
          avgCost: stats.aggregateMetrics.avgCost,
        },
        suggestions: [
          'Review query patterns for optimization',
          'Consider using cheaper models where appropriate',
          'Implement caching to reduce API calls',
        ],
      });
    }
  }

  /**
   * Emit an alert
   */
  private emitAlert(alert: Alert): void {
    this.emitter.emit('alert', alert);

    if (this.config.alerts.onAlert) {
      this.config.alerts.onAlert(alert);
    }
  }

  // ============================================================================
  // Statistics & Reporting
  // ============================================================================

  /**
   * Get current monitoring statistics
   */
  public getStats(): MonitoringStats {
    const allMetrics = Array.from(this.queryMetrics.values());
    const totalQueries = allMetrics.length;

    if (totalQueries === 0) {
      return this.getEmptyStats();
    }

    const successfulQueries = allMetrics.filter(m => m.success).length;
    const failedQueries = totalQueries - successfulQueries;
    const cachedQueries = allMetrics.filter(m => m.cached).length;
    const slowQueries = allMetrics.filter(
      m => m.totalDuration > this.config.slowQueryThresholdMs
    ).length;
    const totalRetries = allMetrics.reduce((sum, m) => sum + m.retryCount, 0);

    const totalDuration = allMetrics.reduce((sum, m) => sum + m.totalDuration, 0);
    const totalLLMDuration = allMetrics.reduce((sum, m) => sum + m.llmDuration, 0);
    const totalProcessingDuration = allMetrics.reduce((sum, m) => sum + m.processingDuration, 0);
    const totalTokens = allMetrics.reduce((sum, m) => sum + m.tokens.total, 0);
    const totalCost = allMetrics.reduce((sum, m) => sum + (m.cost || 0), 0);

    // By model
    const byModel: Record<string, any> = {};
    allMetrics.forEach(m => {
      if (!byModel[m.model]) {
        byModel[m.model] = { queries: 0, avgDuration: 0, totalTokens: 0, totalCost: 0 };
      }
      const modelStats = byModel[m.model];
      modelStats.queries++;
      modelStats.avgDuration = (modelStats.avgDuration * (modelStats.queries - 1) + m.totalDuration) / modelStats.queries;
      modelStats.totalTokens += m.tokens.total;
      modelStats.totalCost += m.cost || 0;
    });

    // By provider
    const byProvider: Record<string, any> = {};
    allMetrics.forEach(m => {
      if (!byProvider[m.provider]) {
        byProvider[m.provider] = { queries: 0, avgDuration: 0, totalTokens: 0, totalCost: 0 };
      }
      const providerStats = byProvider[m.provider];
      providerStats.queries++;
      providerStats.avgDuration = (providerStats.avgDuration * (providerStats.queries - 1) + m.totalDuration) / providerStats.queries;
      providerStats.totalTokens += m.tokens.total;
      providerStats.totalCost += m.cost || 0;
    });

    const oldestMetric = allMetrics.reduce((oldest, m) => {
      const context = this.queryContexts.get(Array.from(this.queryMetrics.entries())
        .find(([_, v]) => v === m)?.[0] || '');
      const timestamp = context?.startTime || new Date().toISOString();
      return timestamp < oldest ? timestamp : oldest;
    }, new Date().toISOString());

    return {
      totalQueries,
      successfulQueries,
      failedQueries,
      cachedQueries,
      slowQueries,
      totalRetries,
      aggregateMetrics: {
        avgDuration: totalDuration / totalQueries,
        avgLLMDuration: totalLLMDuration / totalQueries,
        avgProcessingDuration: totalProcessingDuration / totalQueries,
        totalTokens,
        avgTokens: totalTokens / totalQueries,
        totalCost,
        avgCost: totalCost / totalQueries,
      },
      byModel,
      byProvider,
      period: {
        start: oldestMetric,
        end: new Date().toISOString(),
        durationMs: Date.now() - new Date(oldestMetric).getTime(),
      },
    };
  }

  /**
   * Get detected patterns
   */
  public getPatterns(): Pattern[] {
    return Array.from(this.patterns.values());
  }

  /**
   * Get a specific query's metrics
   */
  public getQueryMetrics(queryId: string): QueryMetrics | undefined {
    return this.queryMetrics.get(queryId);
  }

  /**
   * Get all query metrics
   */
  public getAllMetrics(): QueryMetrics[] {
    return Array.from(this.queryMetrics.values());
  }

  // ============================================================================
  // Event Listeners
  // ============================================================================

  /**
   * Register event listener
   */
  public on<K extends keyof import('./types').QueryMonitorEvents>(
    event: K,
    listener: import('./types').QueryMonitorEvents[K]
  ): this {
    this.emitter.on(event, listener);
    return this;
  }

  /**
   * Register one-time event listener
   */
  public once<K extends keyof import('./types').QueryMonitorEvents>(
    event: K,
    listener: import('./types').QueryMonitorEvents[K]
  ): this {
    this.emitter.once(event, listener);
    return this;
  }

  /**
   * Remove event listener
   */
  public off<K extends keyof import('./types').QueryMonitorEvents>(
    event: K,
    listener: import('./types').QueryMonitorEvents[K]
  ): this {
    this.emitter.off(event, listener);
    return this;
  }

  /**
   * Remove all event listeners
   */
  public removeAllListeners(
    event?: keyof import('./types').QueryMonitorEvents
  ): this {
    if (event) {
      this.emitter.removeAllListeners(event);
    } else {
      this.emitter.removeAllListeners();
    }
    return this;
  }

  // ============================================================================
  // Control Methods
  // ============================================================================

  /**
   * Enable monitoring
   */
  public enable(): void {
    this.enabled = true;
  }

  /**
   * Disable monitoring
   */
  public disable(): void {
    this.enabled = false;
  }

  /**
   * Check if monitoring is enabled
   */
  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Reset all metrics and patterns
   */
  public reset(): void {
    this.queryMetrics.clear();
    this.queryContexts.clear();
    this.patterns.clear();
    this.startTimes.clear();
  }

  /**
   * Clear specific query data
   */
  public clearQuery(queryId: string): void {
    this.queryMetrics.delete(queryId);
    this.queryContexts.delete(queryId);
    this.startTimes.delete(queryId);
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  /**
   * Merge config with defaults
   */
  private mergeConfig(config: MonitorConfig): Required<MonitorConfig> {
    return {
      enabled: config.enabled ?? DEFAULT_CONFIG.enabled,
      slowQueryThresholdMs: config.slowQueryThresholdMs ?? DEFAULT_CONFIG.slowQueryThresholdMs,
      enablePatternDetection: config.enablePatternDetection ?? DEFAULT_CONFIG.enablePatternDetection,
      patternDetection: {
        ...DEFAULT_CONFIG.patternDetection,
        ...config.patternDetection,
      },
      alerts: {
        ...DEFAULT_CONFIG.alerts,
        ...config.alerts,
        thresholds: {
          ...DEFAULT_CONFIG.alerts.thresholds,
          ...config.alerts?.thresholds,
        },
      },
      retention: {
        ...DEFAULT_CONFIG.retention,
        ...config.retention,
      },
      instrumentation: {
        ...DEFAULT_CONFIG.instrumentation,
        ...config.instrumentation,
      },
    };
  }

  /**
   * Create default metrics for a query
   */
  private createDefaultMetrics(queryId: string): QueryMetrics {
    const context = this.queryContexts.get(queryId);
    return {
      totalDuration: 0,
      llmDuration: 0,
      processingDuration: 0,
      tokens: { input: 0, output: 0, total: 0 },
      model: context?.model.name || 'unknown',
      provider: context?.model.provider || 'unknown',
      success: false,
      retryCount: 0,
      cached: false,
    };
  }

  /**
   * Calculate cost based on model and tokens
   */
  private calculateCost(metrics: QueryMetrics): number {
    // Simplified cost calculation - in production, use actual pricing
    const costPerToken: Record<string, { input: number; output: number }> = {
      'gpt-4': { input: 0.03 / 1000, output: 0.06 / 1000 },
      'gpt-3.5-turbo': { input: 0.0015 / 1000, output: 0.002 / 1000 },
      'claude-3-opus': { input: 0.015 / 1000, output: 0.075 / 1000 },
      'claude-3-sonnet': { input: 0.003 / 1000, output: 0.015 / 1000 },
    };

    const pricing = costPerToken[metrics.model] || { input: 0.001 / 1000, output: 0.002 / 1000 };

    return (
      metrics.tokens.input * pricing.input +
      metrics.tokens.output * pricing.output
    );
  }

  /**
   * Hash a prompt for pattern detection
   */
  private hashPrompt(prompt: string): string {
    // Simple hash - in production, consider using a proper hash function
    let hash = 0;
    for (let i = 0; i < prompt.length; i++) {
      const char = prompt.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
  }

  /**
   * Report metrics to instrumentation
   */
  private reportToInstrumentation(metrics: QueryMetrics): void {
    if (this.config.instrumentation.customReporter) {
      this.config.instrumentation.customReporter(metrics);
    }
  }

  /**
   * Clean up old metrics based on retention policy
   */
  private cleanupOldMetrics(): void {
    const now = Date.now();
    const maxAge = this.config.retention.maxAgeMs;
    const maxQueries = this.config.retention.maxQueries;

    // Remove old metrics by age
    for (const [queryId, context] of this.queryContexts.entries()) {
      const age = now - new Date(context.startTime).getTime();
      if (age > maxAge) {
        this.clearQuery(queryId);
      }
    }

    // Remove oldest if exceeding max count
    if (this.queryMetrics.size > maxQueries) {
      const sortedEntries = Array.from(this.queryContexts.entries())
        .sort((a, b) => new Date(a[1].startTime).getTime() - new Date(b[1].startTime).getTime());

      const toRemove = sortedEntries.slice(0, sortedEntries.length - maxQueries);
      toRemove.forEach(([queryId]) => this.clearQuery(queryId));
    }
  }

  /**
   * Get empty statistics
   */
  private getEmptyStats(): MonitoringStats {
    return {
      totalQueries: 0,
      successfulQueries: 0,
      failedQueries: 0,
      cachedQueries: 0,
      slowQueries: 0,
      totalRetries: 0,
      aggregateMetrics: {
        avgDuration: 0,
        avgLLMDuration: 0,
        avgProcessingDuration: 0,
        totalTokens: 0,
        avgTokens: 0,
        totalCost: 0,
        avgCost: 0,
      },
      byModel: {},
      byProvider: {},
      period: {
        start: new Date().toISOString(),
        end: new Date().toISOString(),
        durationMs: 0,
      },
    };
  }
}

/**
 * Factory function to create a query monitor
 */
export function createQueryMonitor(config?: MonitorConfig): QueryMonitor {
  return new QueryMonitor(config);
}
