/**
 * Shared metrics collection for agent applications
 */

export interface ExecutionMetrics {
  agentId: string;
  startTime: Date;
  endTime?: Date;
  durationMs?: number;
  tokensUsed: number;
  costUsd: number;
  stepsCompleted: number;
  toolCalls: number;
  errors: number;
  cacheHits: number;
}

export interface MetricsCollector {
  startExecution(agentId: string): void;
  endExecution(agentId: string): void;
  recordTokens(agentId: string, tokens: number, cost: number): void;
  recordStep(agentId: string): void;
  recordToolCall(agentId: string): void;
  recordError(agentId: string): void;
  recordCacheHit(agentId: string): void;
  getMetrics(agentId: string): ExecutionMetrics | undefined;
  getAllMetrics(): ExecutionMetrics[];
}

export class InMemoryMetricsCollector implements MetricsCollector {
  private metrics: Map<string, ExecutionMetrics> = new Map();

  startExecution(agentId: string): void {
    this.metrics.set(agentId, {
      agentId,
      startTime: new Date(),
      tokensUsed: 0,
      costUsd: 0,
      stepsCompleted: 0,
      toolCalls: 0,
      errors: 0,
      cacheHits: 0,
    });
  }

  endExecution(agentId: string): void {
    const metrics = this.metrics.get(agentId);
    if (metrics) {
      metrics.endTime = new Date();
      metrics.durationMs = metrics.endTime.getTime() - metrics.startTime.getTime();
    }
  }

  recordTokens(agentId: string, tokens: number, cost: number): void {
    const metrics = this.metrics.get(agentId);
    if (metrics) {
      metrics.tokensUsed += tokens;
      metrics.costUsd += cost;
    }
  }

  recordStep(agentId: string): void {
    const metrics = this.metrics.get(agentId);
    if (metrics) {
      metrics.stepsCompleted += 1;
    }
  }

  recordToolCall(agentId: string): void {
    const metrics = this.metrics.get(agentId);
    if (metrics) {
      metrics.toolCalls += 1;
    }
  }

  recordError(agentId: string): void {
    const metrics = this.metrics.get(agentId);
    if (metrics) {
      metrics.errors += 1;
    }
  }

  recordCacheHit(agentId: string): void {
    const metrics = this.metrics.get(agentId);
    if (metrics) {
      metrics.cacheHits += 1;
    }
  }

  getMetrics(agentId: string): ExecutionMetrics | undefined {
    return this.metrics.get(agentId);
  }

  getAllMetrics(): ExecutionMetrics[] {
    return Array.from(this.metrics.values());
  }

  getSummary(): {
    totalExecutions: number;
    totalTokens: number;
    totalCost: number;
    averageDuration: number;
    totalErrors: number;
  } {
    const allMetrics = this.getAllMetrics();

    return {
      totalExecutions: allMetrics.length,
      totalTokens: allMetrics.reduce((sum, m) => sum + m.tokensUsed, 0),
      totalCost: allMetrics.reduce((sum, m) => sum + m.costUsd, 0),
      averageDuration:
        allMetrics.reduce((sum, m) => sum + (m.durationMs || 0), 0) / allMetrics.length || 0,
      totalErrors: allMetrics.reduce((sum, m) => sum + m.errors, 0),
    };
  }
}

export const globalMetricsCollector = new InMemoryMetricsCollector();
