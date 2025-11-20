/**
 * Metrics Collector Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryMetricsCollector } from '../src/metrics';

describe('MetricsCollector', () => {
  let collector: InMemoryMetricsCollector;

  beforeEach(() => {
    collector = new InMemoryMetricsCollector();
  });

  it('should start execution', () => {
    collector.startExecution('exec-1');
    const metrics = collector.getMetrics('exec-1');
    expect(metrics).toBeDefined();
    expect(metrics?.startTime).toBeDefined();
  });

  it('should end execution', () => {
    collector.startExecution('exec-2');
    collector.endExecution('exec-2');
    const metrics = collector.getMetrics('exec-2');
    expect(metrics?.endTime).toBeDefined();
    expect(metrics?.durationMs).toBeDefined();
  });

  it('should record tokens', () => {
    collector.startExecution('exec-3');
    collector.recordTokens('exec-3', 1000, 0.01);
    const metrics = collector.getMetrics('exec-3');
    expect(metrics?.tokensUsed).toBe(1000);
    expect(metrics?.costUsd).toBe(0.01);
  });

  it('should record steps', () => {
    collector.startExecution('exec-4');
    collector.recordStep('exec-4');
    collector.recordStep('exec-4');
    const metrics = collector.getMetrics('exec-4');
    expect(metrics?.stepsCompleted).toBe(2);
  });

  it('should record tool calls', () => {
    collector.startExecution('exec-5');
    collector.recordToolCall('exec-5');
    const metrics = collector.getMetrics('exec-5');
    expect(metrics?.toolCalls).toBe(1);
  });

  it('should record errors', () => {
    collector.startExecution('exec-6');
    collector.recordError('exec-6');
    const metrics = collector.getMetrics('exec-6');
    expect(metrics?.errors).toBe(1);
  });

  it('should record cache hits', () => {
    collector.startExecution('exec-7');
    collector.recordCacheHit('exec-7');
    const metrics = collector.getMetrics('exec-7');
    expect(metrics?.cacheHits).toBe(1);
  });

  it('should get all metrics', () => {
    collector.startExecution('exec-8');
    collector.startExecution('exec-9');
    const allMetrics = collector.getAllMetrics();
    expect(allMetrics.length).toBeGreaterThanOrEqual(2);
  });

  it('should generate summary', () => {
    collector.startExecution('exec-10');
    collector.recordTokens('exec-10', 500, 0.005);
    collector.endExecution('exec-10');

    const summary = collector.getSummary();
    expect(summary.totalExecutions).toBeGreaterThan(0);
    expect(summary.totalTokens).toBeGreaterThan(0);
    expect(summary.totalCost).toBeGreaterThan(0);
  });
});
