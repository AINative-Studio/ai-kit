/**
 * AIKIT Query Monitor - Test Suite
 *
 * Comprehensive tests for QueryMonitor including event emission,
 * metrics tracking, pattern detection, and alerting.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { QueryMonitor } from '../../src/monitoring/QueryMonitor';
import {
  QueryEvent,
  QueryContext,
  Pattern,
  Alert,
  MonitorConfig,
} from '../../src/monitoring/types';

describe('QueryMonitor', () => {
  let monitor: QueryMonitor;

  beforeEach(() => {
    monitor = new QueryMonitor({
      slowQueryThresholdMs: 1000,
      enablePatternDetection: true,
      patternDetection: {
        minOccurrences: 2,
        timeWindowMs: 60000,
      },
    });
  });

  afterEach(() => {
    monitor.removeAllListeners();
  });

  // ============================================================================
  // Initialization Tests
  // ============================================================================

  describe('Initialization', () => {
    it('should create monitor with default config', () => {
      const defaultMonitor = new QueryMonitor();
      expect(defaultMonitor.isEnabled()).toBe(true);
      expect(defaultMonitor.getStats().totalQueries).toBe(0);
    });

    it('should create monitor with custom config', () => {
      const customMonitor = new QueryMonitor({
        enabled: false,
        slowQueryThresholdMs: 5000,
      });
      expect(customMonitor.isEnabled()).toBe(false);
    });

    it('should accept all configuration options', () => {
      const config: MonitorConfig = {
        enabled: true,
        slowQueryThresholdMs: 3000,
        enablePatternDetection: true,
        patternDetection: {
          maxPatterns: 50,
          minOccurrences: 5,
        },
        alerts: {
          enabled: true,
          thresholds: {
            errorRate: 0.2,
            avgDuration: 5000,
          },
        },
      };

      const configuredMonitor = new QueryMonitor(config);
      expect(configuredMonitor.isEnabled()).toBe(true);
    });
  });

  // ============================================================================
  // Event Emission Tests
  // ============================================================================

  describe('Event Emission', () => {
    it('should emit query:start event', () => {
      return new Promise<void>((resolve) => {
        const context: QueryContext = {
          queryId: 'test-1',
          prompt: 'Test prompt',
          model: { provider: 'openai', name: 'gpt-4' },
          startTime: new Date().toISOString(),
        };

        monitor.on('query:start', (event: QueryEvent) => {
          expect(event.type).toBe('query:start');
          expect(event.queryId).toBe('test-1');
          expect(event.metrics).toBeDefined();
          resolve();
        });

        monitor.startQuery(context);
      });
    });

    it('should emit query:complete event', () => {
      return new Promise<void>((resolve) => {
        const context: QueryContext = {
          queryId: 'test-2',
          prompt: 'Test prompt',
          model: { provider: 'openai', name: 'gpt-4' },
          startTime: new Date().toISOString(),
        };

        monitor.startQuery(context);

        monitor.on('query:complete', (event: QueryEvent) => {
          expect(event.type).toBe('query:complete');
          expect(event.queryId).toBe('test-2');
          expect(event.metrics.success).toBe(true);
          expect(event.metrics.tokens.total).toBe(150);
          resolve();
        });

        monitor.completeQuery('test-2', {
          tokens: { input: 50, output: 100 },
          llmDuration: 500,
        });
      });
    });

    it('should emit query:error event', () => {
      return new Promise<void>((resolve) => {
        const context: QueryContext = {
          queryId: 'test-3',
          prompt: 'Test prompt',
          model: { provider: 'openai', name: 'gpt-4' },
          startTime: new Date().toISOString(),
        };

        monitor.startQuery(context);

        monitor.on('query:error', (event: QueryEvent) => {
          expect(event.type).toBe('query:error');
          expect(event.queryId).toBe('test-3');
          expect(event.metrics.success).toBe(false);
          expect(event.metrics.error).toBeDefined();
          expect(event.metrics.error?.message).toBe('Test error');
          resolve();
        });

        monitor.recordError('test-3', new Error('Test error'));
      });
    });

    it('should emit query:slow event for slow queries', () => {
      let eventCaptured = false;
      const context: QueryContext = {
        queryId: 'test-4',
        prompt: 'Test prompt',
        model: { provider: 'openai', name: 'gpt-4' },
        startTime: new Date(Date.now() - 2000).toISOString(),
      };

      monitor.on('query:slow', (event: QueryEvent) => {
        expect(event.type).toBe('query:slow');
        expect(event.queryId).toBe('test-4');
        expect(event.data?.threshold).toBe(1000);
        eventCaptured = true;
      });

      monitor.startQuery(context);
      monitor.completeQuery('test-4', {
        tokens: { input: 50, output: 100 },
        llmDuration: 1800,
      });

      expect(eventCaptured).toBe(true);
    });

    it('should emit query:retry event', () => {
      return new Promise<void>((resolve) => {
        const context: QueryContext = {
          queryId: 'test-5',
          prompt: 'Test prompt',
          model: { provider: 'openai', name: 'gpt-4' },
          startTime: new Date().toISOString(),
        };

        monitor.startQuery(context);

        monitor.on('query:retry', (event: QueryEvent) => {
          expect(event.type).toBe('query:retry');
          expect(event.queryId).toBe('test-5');
          expect(event.data?.retryCount).toBe(1);
          resolve();
        });

        monitor.recordRetry('test-5', 1);
      });
    });

    it('should emit query:cached event for cache hits', () => {
      return new Promise<void>((resolve) => {
        const context: QueryContext = {
          queryId: 'test-6',
          prompt: 'Test prompt',
          model: { provider: 'openai', name: 'gpt-4' },
          startTime: new Date().toISOString(),
        };

        monitor.startQuery(context);

        monitor.on('query:cached', (event: QueryEvent) => {
          expect(event.type).toBe('query:cached');
          expect(event.queryId).toBe('test-6');
          expect(event.metrics.cached).toBe(true);
          expect(event.metrics.cost).toBe(0);
          resolve();
        });

        monitor.recordCacheHit('test-6', { result: 'cached' });
      });
    });
  });

  // ============================================================================
  // Metrics Tracking Tests
  // ============================================================================

  describe('Metrics Tracking', () => {
    it('should track query duration correctly', () => {
      const context: QueryContext = {
        queryId: 'metrics-1',
        prompt: 'Test prompt',
        model: { provider: 'openai', name: 'gpt-4' },
        startTime: new Date().toISOString(),
      };

      monitor.startQuery(context);
      monitor.completeQuery('metrics-1', {
        tokens: { input: 50, output: 100 },
        llmDuration: 300,
      });

      const metrics = monitor.getQueryMetrics('metrics-1');
      expect(metrics).toBeDefined();
      expect(metrics!.llmDuration).toBe(300);
      expect(metrics!.totalDuration).toBeGreaterThanOrEqual(0);
    });

    it('should track token counts', () => {
      const context: QueryContext = {
        queryId: 'metrics-2',
        prompt: 'Test prompt',
        model: { provider: 'openai', name: 'gpt-4' },
        startTime: new Date().toISOString(),
      };

      monitor.startQuery(context);
      monitor.completeQuery('metrics-2', {
        tokens: { input: 123, output: 456 },
        llmDuration: 500,
      });

      const metrics = monitor.getQueryMetrics('metrics-2');
      expect(metrics!.tokens.input).toBe(123);
      expect(metrics!.tokens.output).toBe(456);
      expect(metrics!.tokens.total).toBe(579);
    });

    it('should calculate cost for queries', () => {
      const context: QueryContext = {
        queryId: 'metrics-3',
        prompt: 'Test prompt',
        model: { provider: 'openai', name: 'gpt-4' },
        startTime: new Date().toISOString(),
      };

      monitor.startQuery(context);
      monitor.completeQuery('metrics-3', {
        tokens: { input: 1000, output: 2000 },
        llmDuration: 500,
      });

      const metrics = monitor.getQueryMetrics('metrics-3');
      expect(metrics!.cost).toBeGreaterThan(0);
    });

    it('should track retry count', () => {
      const context: QueryContext = {
        queryId: 'metrics-4',
        prompt: 'Test prompt',
        model: { provider: 'openai', name: 'gpt-4' },
        startTime: new Date().toISOString(),
      };

      monitor.startQuery(context);
      monitor.recordRetry('metrics-4', 1);
      monitor.recordRetry('metrics-4', 2);

      const metrics = monitor.getQueryMetrics('metrics-4');
      expect(metrics!.retryCount).toBe(2);
    });

    it('should mark cached queries correctly', () => {
      const context: QueryContext = {
        queryId: 'metrics-5',
        prompt: 'Test prompt',
        model: { provider: 'openai', name: 'gpt-4' },
        startTime: new Date().toISOString(),
      };

      monitor.startQuery(context);
      monitor.recordCacheHit('metrics-5', { result: 'cached' });

      const metrics = monitor.getQueryMetrics('metrics-5');
      expect(metrics!.cached).toBe(true);
      expect(metrics!.cost).toBe(0);
    });
  });

  // ============================================================================
  // Pattern Detection Tests
  // ============================================================================

  describe('Pattern Detection', () => {
    it('should detect repeated queries', () => {
      return new Promise<void>((resolve) => {
        let patternsEmitted = 0;

        monitor.on('pattern:detected', (pattern: Pattern) => {
          patternsEmitted++;
          expect(pattern.type).toBe('repeated');
          expect(pattern.occurrences).toBeGreaterThanOrEqual(2);

          if (patternsEmitted === 1) {
            resolve();
          }
        });

        const prompt = 'What is the weather today?';

        // First query
        const context1: QueryContext = {
          queryId: 'pattern-1',
          prompt,
          model: { provider: 'openai', name: 'gpt-4' },
          startTime: new Date().toISOString(),
        };
        monitor.startQuery(context1);
        monitor.completeQuery('pattern-1', {
          tokens: { input: 10, output: 20 },
          llmDuration: 200,
        });

        // Second query (should trigger pattern)
        setTimeout(() => {
          const context2: QueryContext = {
            queryId: 'pattern-2',
            prompt,
            model: { provider: 'openai', name: 'gpt-4' },
            startTime: new Date().toISOString(),
          };
          monitor.startQuery(context2);
          monitor.completeQuery('pattern-2', {
            tokens: { input: 10, output: 20 },
            llmDuration: 200,
          });
        }, 50);
      });
    });

    it('should detect expensive queries', () => {
      return new Promise<void>((resolve) => {
        monitor.on('pattern:detected', (pattern: Pattern) => {
          if (pattern.type === 'expensive') {
            expect(pattern.aggregateMetrics.totalCost).toBeGreaterThan(0);
            resolve();
          }
        });

        // Create expensive queries
        for (let i = 0; i < 3; i++) {
          const context: QueryContext = {
            queryId: `expensive-${i}`,
            prompt: 'Test expensive query',
            model: { provider: 'openai', name: 'gpt-4' },
            startTime: new Date().toISOString(),
          };
          monitor.startQuery(context);
          monitor.completeQuery(`expensive-${i}`, {
            tokens: { input: 10000, output: 20000 }, // Large token count
            llmDuration: 200,
          });
        }
      });
    });

    it('should detect failing queries', () => {
      let patternDetected = false;

      monitor.on('pattern:detected', (pattern: Pattern) => {
        if (pattern.type === 'failing') {
          expect(pattern.aggregateMetrics.successRate).toBeLessThan(1);
          patternDetected = true;
        }
      });

      // Create failing queries - need at least minOccurrences (2) to get pattern emitted
      for (let i = 0; i < 3; i++) {
        const context: QueryContext = {
          queryId: `failing-${i}`,
          prompt: 'Test failing query',
          model: { provider: 'openai', name: 'gpt-4' },
          startTime: new Date().toISOString(),
        };
        monitor.startQuery(context);
        monitor.recordError(`failing-${i}`, new Error('Test error'));
      }

      // Patterns should be detected and stored
      const patterns = monitor.getPatterns();
      const failingPattern = patterns.find(p => p.type === 'failing');
      expect(failingPattern).toBeDefined();
      expect(failingPattern!.occurrences).toBeGreaterThanOrEqual(2);
    });

    it('should detect slow queries', () => {
      let patternDetected = false;

      monitor.on('pattern:detected', (pattern: Pattern) => {
        if (pattern.type === 'slow') {
          expect(pattern.aggregateMetrics.avgDuration).toBeGreaterThan(1000);
          patternDetected = true;
        }
      });

      // Create slow queries - need at least minOccurrences (2)
      for (let i = 0; i < 3; i++) {
        const context: QueryContext = {
          queryId: `slow-${i}`,
          prompt: 'Test slow query',
          model: { provider: 'openai', name: 'gpt-4' },
          startTime: new Date(Date.now() - 2000).toISOString(),
        };
        monitor.startQuery(context);
        monitor.completeQuery(`slow-${i}`, {
          tokens: { input: 10, output: 20 },
          llmDuration: 1800,
        });
      }

      // Check patterns stored
      const patterns = monitor.getPatterns();
      const slowPattern = patterns.find(p => p.type === 'slow');
      expect(slowPattern).toBeDefined();
      expect(slowPattern!.occurrences).toBeGreaterThanOrEqual(2);
    });

    it('should aggregate pattern metrics correctly', () => {
      const prompt = 'Repeated query';

      for (let i = 0; i < 3; i++) {
        const context: QueryContext = {
          queryId: `agg-${i}`,
          prompt,
          model: { provider: 'openai', name: 'gpt-4' },
          startTime: new Date().toISOString(),
        };
        monitor.startQuery(context);
        monitor.completeQuery(`agg-${i}`, {
          tokens: { input: 100, output: 200 },
          llmDuration: 300,
        });
      }

      const patterns = monitor.getPatterns();
      const repeatedPattern = patterns.find(p => p.type === 'repeated');

      expect(repeatedPattern).toBeDefined();
      expect(repeatedPattern!.occurrences).toBe(3);
      // Pattern is created after first query, so only includes 2nd and 3rd
      expect(repeatedPattern!.aggregateMetrics.totalTokens).toBeGreaterThanOrEqual(300);
    });
  });

  // ============================================================================
  // Alerting Tests
  // ============================================================================

  describe('Alerting', () => {
    it('should emit alert for high error rate', () => {
      return new Promise<void>((resolve) => {
        const alertMonitor = new QueryMonitor({
          alerts: {
            enabled: true,
            thresholds: {
              errorRate: 0.5, // 50% error rate
            },
          },
        });

        alertMonitor.on('alert', (alert: Alert) => {
          if (alert.type === 'high_error_rate') {
            expect(alert.severity).toBe('error');
            expect(alert.data.errorRate).toBeGreaterThan(0.5);
            alertMonitor.removeAllListeners();
            resolve();
          }
        });

        // Create queries with high error rate
        for (let i = 0; i < 10; i++) {
          const context: QueryContext = {
            queryId: `alert-error-${i}`,
            prompt: 'Test query',
            model: { provider: 'openai', name: 'gpt-4' },
            startTime: new Date().toISOString(),
          };
          alertMonitor.startQuery(context);

          if (i < 6) {
            // 60% failure rate
            alertMonitor.recordError(`alert-error-${i}`, new Error('Test error'));
          } else {
            alertMonitor.completeQuery(`alert-error-${i}`, {
              tokens: { input: 10, output: 20 },
              llmDuration: 100,
            });
          }
        }
      });
    });

    it('should emit alert for slow queries', () => {
      let alertEmitted = false;

      const alertMonitor = new QueryMonitor({
        slowQueryThresholdMs: 100,
        alerts: {
          enabled: true,
          thresholds: {
            avgDuration: 500,
          },
        },
      });

      alertMonitor.on('alert', (alert: Alert) => {
        if (alert.type === 'slow_queries') {
          expect(alert.severity).toBe('warning');
          expect(alert.suggestions).toBeDefined();
          alertEmitted = true;
        }
      });

      // Create slow queries by reporting high llmDuration
      for (let i = 0; i < 5; i++) {
        const context: QueryContext = {
          queryId: `alert-slow-${i}`,
          prompt: 'Test query',
          model: { provider: 'openai', name: 'gpt-4' },
          startTime: new Date().toISOString(),
        };
        alertMonitor.startQuery(context);
        // High llmDuration will make total duration high
        alertMonitor.completeQuery(`alert-slow-${i}`, {
          tokens: { input: 10, output: 20 },
          llmDuration: 600, // 600ms LLM duration
        });
      }

      // Check the stats
      const stats = alertMonitor.getStats();
      // Since we have 5 queries with 600ms llmDuration, average should be around 600+
      expect(stats.aggregateMetrics.avgDuration).toBeGreaterThan(0);
      expect(stats.aggregateMetrics.avgLLMDuration).toBe(600);

      alertMonitor.removeAllListeners();
      // The alert should have been emitted since avgDuration > 500
      expect(alertEmitted).toBe(true);
    });

    it('should call custom alert handler', () => {
      return new Promise<void>((resolve) => {
        const onAlert = vi.fn((alert: Alert) => {
          expect(alert).toBeDefined();
          resolve();
        });

        const alertMonitor = new QueryMonitor({
          alerts: {
            enabled: true,
            thresholds: {
              errorRate: 0.5,
            },
            onAlert,
          },
        });

        // Trigger error rate alert
        for (let i = 0; i < 10; i++) {
          const context: QueryContext = {
            queryId: `custom-alert-${i}`,
            prompt: 'Test query',
            model: { provider: 'openai', name: 'gpt-4' },
            startTime: new Date().toISOString(),
          };
          alertMonitor.startQuery(context);

          if (i < 6) {
            alertMonitor.recordError(`custom-alert-${i}`, new Error('Test error'));
          } else {
            alertMonitor.completeQuery(`custom-alert-${i}`, {
              tokens: { input: 10, output: 20 },
              llmDuration: 100,
            });
          }
        }

        alertMonitor.removeAllListeners();
      });
    });
  });

  // ============================================================================
  // Statistics Tests
  // ============================================================================

  describe('Statistics', () => {
    beforeEach(() => {
      // Create sample queries
      for (let i = 0; i < 5; i++) {
        const context: QueryContext = {
          queryId: `stats-${i}`,
          prompt: `Test query ${i}`,
          model: { provider: 'openai', name: 'gpt-4' },
          startTime: new Date().toISOString(),
        };
        monitor.startQuery(context);

        if (i % 2 === 0) {
          monitor.completeQuery(`stats-${i}`, {
            tokens: { input: 100, output: 200 },
            llmDuration: 500,
          });
        } else {
          monitor.recordError(`stats-${i}`, new Error('Test error'));
        }
      }
    });

    it('should calculate total queries correctly', () => {
      const stats = monitor.getStats();
      expect(stats.totalQueries).toBe(5);
    });

    it('should calculate success/failure rates', () => {
      const stats = monitor.getStats();
      expect(stats.successfulQueries).toBe(3); // 0, 2, 4
      expect(stats.failedQueries).toBe(2); // 1, 3
    });

    it('should calculate aggregate metrics', () => {
      const stats = monitor.getStats();
      expect(stats.aggregateMetrics.avgDuration).toBeGreaterThanOrEqual(0);
      expect(stats.aggregateMetrics.totalTokens).toBeGreaterThan(0);
      expect(stats.aggregateMetrics.totalCost).toBeGreaterThan(0);
    });

    it('should provide breakdown by model', () => {
      const stats = monitor.getStats();
      expect(stats.byModel).toBeDefined();
      expect(stats.byModel['gpt-4']).toBeDefined();
      expect(stats.byModel['gpt-4'].queries).toBe(5);
    });

    it('should provide breakdown by provider', () => {
      const stats = monitor.getStats();
      expect(stats.byProvider).toBeDefined();
      expect(stats.byProvider['openai']).toBeDefined();
      expect(stats.byProvider['openai'].queries).toBe(5);
    });

    it('should include time period information', () => {
      const stats = monitor.getStats();
      expect(stats.period).toBeDefined();
      expect(stats.period.start).toBeDefined();
      expect(stats.period.end).toBeDefined();
      expect(stats.period.durationMs).toBeGreaterThanOrEqual(0);
    });
  });

  // ============================================================================
  // Control Methods Tests
  // ============================================================================

  describe('Control Methods', () => {
    it('should enable and disable monitoring', () => {
      expect(monitor.isEnabled()).toBe(true);

      monitor.disable();
      expect(monitor.isEnabled()).toBe(false);

      monitor.enable();
      expect(monitor.isEnabled()).toBe(true);
    });

    it('should not track queries when disabled', () => {
      monitor.disable();

      const context: QueryContext = {
        queryId: 'disabled-1',
        prompt: 'Test query',
        model: { provider: 'openai', name: 'gpt-4' },
        startTime: new Date().toISOString(),
      };

      monitor.startQuery(context);

      const metrics = monitor.getQueryMetrics('disabled-1');
      expect(metrics).toBeUndefined();
    });

    it('should reset all metrics', () => {
      const context: QueryContext = {
        queryId: 'reset-1',
        prompt: 'Test query',
        model: { provider: 'openai', name: 'gpt-4' },
        startTime: new Date().toISOString(),
      };
      monitor.startQuery(context);
      monitor.completeQuery('reset-1', {
        tokens: { input: 10, output: 20 },
        llmDuration: 100,
      });

      expect(monitor.getStats().totalQueries).toBe(1);

      monitor.reset();

      expect(monitor.getStats().totalQueries).toBe(0);
      expect(monitor.getPatterns().length).toBe(0);
    });

    it('should clear specific query data', () => {
      const context: QueryContext = {
        queryId: 'clear-1',
        prompt: 'Test query',
        model: { provider: 'openai', name: 'gpt-4' },
        startTime: new Date().toISOString(),
      };
      monitor.startQuery(context);
      monitor.completeQuery('clear-1', {
        tokens: { input: 10, output: 20 },
        llmDuration: 100,
      });

      expect(monitor.getQueryMetrics('clear-1')).toBeDefined();

      monitor.clearQuery('clear-1');

      expect(monitor.getQueryMetrics('clear-1')).toBeUndefined();
    });
  });

  // ============================================================================
  // Event Listener Management Tests
  // ============================================================================

  describe('Event Listener Management', () => {
    it('should register and trigger event listeners', () => {
      return new Promise<void>((resolve) => {
        const listener = vi.fn((event: QueryEvent) => {
          expect(event.queryId).toBe('listener-1');
          resolve();
        });

        monitor.on('query:start', listener);

        const context: QueryContext = {
          queryId: 'listener-1',
          prompt: 'Test query',
          model: { provider: 'openai', name: 'gpt-4' },
          startTime: new Date().toISOString(),
        };
        monitor.startQuery(context);
      });
    });

    it('should register one-time listeners', () => {
      const listener = vi.fn();

      monitor.once('query:start', listener);

      for (let i = 0; i < 3; i++) {
        const context: QueryContext = {
          queryId: `once-${i}`,
          prompt: 'Test query',
          model: { provider: 'openai', name: 'gpt-4' },
          startTime: new Date().toISOString(),
        };
        monitor.startQuery(context);
      }

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should remove event listeners', () => {
      const listener = vi.fn();

      monitor.on('query:start', listener);

      const context1: QueryContext = {
        queryId: 'remove-1',
        prompt: 'Test query',
        model: { provider: 'openai', name: 'gpt-4' },
        startTime: new Date().toISOString(),
      };
      monitor.startQuery(context1);

      expect(listener).toHaveBeenCalledTimes(1);

      monitor.off('query:start', listener);

      const context2: QueryContext = {
        queryId: 'remove-2',
        prompt: 'Test query',
        model: { provider: 'openai', name: 'gpt-4' },
        startTime: new Date().toISOString(),
      };
      monitor.startQuery(context2);

      expect(listener).toHaveBeenCalledTimes(1); // Still 1
    });

    it('should remove all listeners for an event', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      monitor.on('query:start', listener1);
      monitor.on('query:start', listener2);

      monitor.removeAllListeners('query:start');

      const context: QueryContext = {
        queryId: 'remove-all-1',
        prompt: 'Test query',
        model: { provider: 'openai', name: 'gpt-4' },
        startTime: new Date().toISOString(),
      };
      monitor.startQuery(context);

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // Edge Cases and Error Handling Tests
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle completion without start', () => {
      expect(() => {
        monitor.completeQuery('nonexistent', {
          tokens: { input: 10, output: 20 },
          llmDuration: 100,
        });
      }).not.toThrow();
    });

    it('should handle error without start', () => {
      expect(() => {
        monitor.recordError('nonexistent', new Error('Test error'));
      }).not.toThrow();
    });

    it('should handle retry without start', () => {
      expect(() => {
        monitor.recordRetry('nonexistent', 1);
      }).not.toThrow();
    });

    it('should return empty stats when no queries', () => {
      const emptyMonitor = new QueryMonitor();
      const stats = emptyMonitor.getStats();

      expect(stats.totalQueries).toBe(0);
      expect(stats.aggregateMetrics.avgDuration).toBe(0);
      expect(stats.aggregateMetrics.totalCost).toBe(0);
    });

    it('should handle queries with zero duration', () => {
      const context: QueryContext = {
        queryId: 'zero-duration',
        prompt: 'Test query',
        model: { provider: 'openai', name: 'gpt-4' },
        startTime: new Date().toISOString(),
      };
      monitor.startQuery(context);
      monitor.completeQuery('zero-duration', {
        tokens: { input: 10, output: 20 },
        llmDuration: 0,
      });

      const metrics = monitor.getQueryMetrics('zero-duration');
      expect(metrics).toBeDefined();
      expect(metrics!.llmDuration).toBe(0);
    });

    it('should handle queries with zero tokens', () => {
      const context: QueryContext = {
        queryId: 'zero-tokens',
        prompt: 'Test query',
        model: { provider: 'openai', name: 'gpt-4' },
        startTime: new Date().toISOString(),
      };
      monitor.startQuery(context);
      monitor.completeQuery('zero-tokens', {
        tokens: { input: 0, output: 0 },
        llmDuration: 100,
      });

      const metrics = monitor.getQueryMetrics('zero-tokens');
      expect(metrics!.tokens.total).toBe(0);
      expect(metrics!.cost).toBeGreaterThanOrEqual(0);
    });
  });

  // ============================================================================
  // Integration Tests
  // ============================================================================

  describe('Integration', () => {
    it('should handle complete query lifecycle', () => {
      return new Promise<void>((resolve) => {
        const events: string[] = [];

        monitor.on('query:start', () => events.push('start'));
        monitor.on('query:retry', () => events.push('retry'));
        monitor.on('query:complete', () => {
          events.push('complete');
          setTimeout(() => {
            expect(events).toEqual(['start', 'retry', 'complete']);
            resolve();
          }, 10);
        });

        const context: QueryContext = {
          queryId: 'lifecycle-1',
          prompt: 'Test query',
          model: { provider: 'openai', name: 'gpt-4' },
          startTime: new Date().toISOString(),
        };

        monitor.startQuery(context);
        monitor.recordRetry('lifecycle-1', 1);
        monitor.completeQuery('lifecycle-1', {
          tokens: { input: 10, output: 20 },
          llmDuration: 100,
        });
      });
    });

    it('should track multiple concurrent queries', () => {
      for (let i = 0; i < 10; i++) {
        const context: QueryContext = {
          queryId: `concurrent-${i}`,
          prompt: `Query ${i}`,
          model: { provider: 'openai', name: 'gpt-4' },
          startTime: new Date().toISOString(),
        };
        monitor.startQuery(context);
      }

      for (let i = 0; i < 10; i++) {
        monitor.completeQuery(`concurrent-${i}`, {
          tokens: { input: 10, output: 20 },
          llmDuration: 100,
        });
      }

      const stats = monitor.getStats();
      expect(stats.totalQueries).toBe(10);
    });

    it('should handle mixed success and failure queries', () => {
      for (let i = 0; i < 20; i++) {
        const context: QueryContext = {
          queryId: `mixed-${i}`,
          prompt: `Query ${i}`,
          model: { provider: 'openai', name: 'gpt-4' },
          startTime: new Date().toISOString(),
        };
        monitor.startQuery(context);

        if (i % 3 === 0) {
          monitor.recordError(`mixed-${i}`, new Error('Test error'));
        } else if (i % 3 === 1) {
          monitor.recordCacheHit(`mixed-${i}`, { result: 'cached' });
        } else {
          monitor.completeQuery(`mixed-${i}`, {
            tokens: { input: 50, output: 100 },
            llmDuration: 200,
          });
        }
      }

      const stats = monitor.getStats();
      expect(stats.totalQueries).toBe(20);
      expect(stats.successfulQueries + stats.failedQueries).toBe(20);
      expect(stats.cachedQueries).toBeGreaterThan(0);
    });
  });
});
