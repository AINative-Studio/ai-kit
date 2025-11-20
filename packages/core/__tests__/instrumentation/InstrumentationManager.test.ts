/**
 * Tests for InstrumentationManager
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  InstrumentationManager,
  getInstrumentation,
  setInstrumentation,
  resetInstrumentation,
} from '../../src/instrumentation/InstrumentationManager';
import {
  InstrumentationConfig,
  MetricsCollector,
  LLMMetrics,
  ToolMetrics,
  AgentMetrics,
  TraceExporter,
  Trace,
} from '../../src/instrumentation/types';

describe('InstrumentationManager', () => {
  let manager: InstrumentationManager;

  beforeEach(() => {
    manager = new InstrumentationManager();
  });

  afterEach(async () => {
    await manager.shutdown();
    resetInstrumentation();
  });

  describe('Constructor', () => {
    it('should create with default config', () => {
      expect(manager).toBeInstanceOf(InstrumentationManager);
      expect(manager.isEnabled()).toBe(true);
    });

    it('should create with custom config', () => {
      const customManager = new InstrumentationManager({
        enabled: false,
        serviceName: 'test-service',
        environment: 'test',
        samplingRate: 0.5,
      });

      expect(customManager.isEnabled()).toBe(false);
      const config = customManager.getConfig();
      expect(config.serviceName).toBe('test-service');
      expect(config.environment).toBe('test');
      expect(config.samplingRate).toBe(0.5);
    });

    it('should use custom metrics collector', () => {
      const customCollector: MetricsCollector = {
        recordCounter: vi.fn(),
        recordGauge: vi.fn(),
        recordHistogram: vi.fn(),
        recordLLMMetrics: vi.fn(),
        recordToolMetrics: vi.fn(),
        recordAgentMetrics: vi.fn(),
        getMetrics: vi.fn(() => []),
        clear: vi.fn(),
      };

      const customManager = new InstrumentationManager({
        metricsCollector: customCollector,
      });

      expect(customManager.getMetricsCollector()).toBe(customCollector);
    });
  });

  describe('Configuration Management', () => {
    it('should get config', () => {
      const config = manager.getConfig();
      expect(config).toHaveProperty('enabled');
      expect(config).toHaveProperty('serviceName');
      expect(config).toHaveProperty('environment');
    });

    it('should update config', () => {
      manager.updateConfig({
        serviceName: 'updated-service',
        environment: 'production',
      });

      const config = manager.getConfig();
      expect(config.serviceName).toBe('updated-service');
      expect(config.environment).toBe('production');
    });

    it('should enable/disable instrumentation', () => {
      expect(manager.isEnabled()).toBe(true);

      manager.disable();
      expect(manager.isEnabled()).toBe(false);

      manager.enable();
      expect(manager.isEnabled()).toBe(true);
    });
  });

  describe('Trace Management', () => {
    it('should create trace context', () => {
      const context = manager.createTraceContext();
      expect(context).toHaveProperty('traceId');
      expect(context.traceId).toBeTruthy();
      expect(context.flags).toBe(1);
    });

    it('should start and end trace', async () => {
      const trace = manager.startTrace('test-operation');
      expect(trace).toHaveProperty('traceId');
      expect(trace).toHaveProperty('rootSpan');
      expect(trace.serviceName).toBe('ai-kit');

      await manager.endTrace(trace.traceId);
      expect(manager.getTrace(trace.traceId)).toBeUndefined();
    });

    it('should create trace with custom context', () => {
      const context = manager.createTraceContext();
      const trace = manager.startTrace('test-operation', context);
      expect(trace.traceId).toBe(context.traceId);
    });

    it('should export trace when exporter is configured', async () => {
      const exportedTraces: Trace[] = [];
      const exporter: TraceExporter = {
        export: async (trace) => {
          exportedTraces.push(trace);
        },
      };

      const customManager = new InstrumentationManager({
        traceExporter: exporter,
      });

      const trace = customManager.startTrace('test-operation');
      await customManager.endTrace(trace.traceId);

      expect(exportedTraces).toHaveLength(1);
      expect(exportedTraces[0].traceId).toBe(trace.traceId);

      await customManager.shutdown();
    });

    it('should respect sampling rate', () => {
      const samplingManager = new InstrumentationManager({
        samplingRate: 0, // Never sample
      });

      const trace = samplingManager.startTrace('test-operation');
      expect(trace.traceId).toBe('dummy'); // Should create dummy trace
    });

    it('should not create traces when disabled', () => {
      manager.disable();
      const trace = manager.startTrace('test-operation');
      expect(trace.traceId).toBe('dummy');
    });
  });

  describe('Span Management', () => {
    it('should create span', () => {
      const context = manager.createTraceContext();
      const span = manager.createSpan('test-span', 'internal', context);

      expect(span).toHaveProperty('spanId');
      expect(span).toHaveProperty('traceId');
      expect(span.name).toBe('test-span');
      expect(span.kind).toBe('internal');
      expect(span.status).toBe('unset');
    });

    it('should end span', () => {
      const context = manager.createTraceContext();
      const span = manager.createSpan('test-span', 'internal', context);

      manager.endSpan(span.spanId, 'ok');

      expect(span.endTime).toBeTruthy();
      expect(span.duration).toBeGreaterThanOrEqual(0);
      expect(span.status).toBe('ok');
    });

    it('should add span attributes', () => {
      const context = manager.createTraceContext();
      const span = manager.createSpan('test-span', 'internal', context);

      manager.addSpanAttributes(span.spanId, {
        'test.attribute': 'value',
        'test.number': 123,
      });

      expect(span.attributes['test.attribute']).toBe('value');
      expect(span.attributes['test.number']).toBe(123);
    });

    it('should add span events', () => {
      const context = manager.createTraceContext();
      const span = manager.createSpan('test-span', 'internal', context);

      manager.addSpanEvent(span.spanId, 'test-event', { key: 'value' });

      expect(span.events).toHaveLength(1);
      expect(span.events[0].name).toBe('test-event');
      expect(span.events[0].attributes).toEqual({ key: 'value' });
    });
  });

  describe('Interceptor Management', () => {
    it('should register LLM interceptor', () => {
      const interceptor = {
        beforeRequest: vi.fn(),
        afterResponse: vi.fn(),
        onError: vi.fn(),
      };

      manager.registerLLMInterceptor(interceptor);
      // Interceptor registered successfully (no error thrown)
      expect(true).toBe(true);
    });

    it('should register tool interceptor', () => {
      const interceptor = {
        beforeExecution: vi.fn(),
        afterExecution: vi.fn(),
        onError: vi.fn(),
      };

      manager.registerToolInterceptor(interceptor);
      expect(true).toBe(true);
    });

    it('should register agent interceptor', () => {
      const interceptor = {
        beforeExecution: vi.fn(),
        afterExecution: vi.fn(),
        onError: vi.fn(),
      };

      manager.registerAgentInterceptor(interceptor);
      expect(true).toBe(true);
    });
  });

  describe('LLM Instrumentation', () => {
    it('should instrument LLM call successfully', async () => {
      const request = {
        messages: [{ role: 'user', content: 'test' }],
      };

      const response = {
        content: 'response',
        usage: {
          promptTokens: 10,
          completionTokens: 20,
          totalTokens: 30,
        },
      };

      const result = await manager.instrumentLLMCall(
        'openai',
        'gpt-4',
        request,
        async () => response
      );

      expect(result).toBe(response);

      const metrics = manager.getMetrics();
      expect(metrics.length).toBeGreaterThan(0);

      // Check that metrics were recorded
      const hasLLMMetrics = metrics.some(
        (m) => m.name.startsWith('llm.') && m.labels?.provider === 'openai'
      );
      expect(hasLLMMetrics).toBe(true);
    });

    it('should handle LLM errors', async () => {
      const request = {
        messages: [{ role: 'user', content: 'test' }],
      };

      const error = new Error('LLM Error');

      await expect(
        manager.instrumentLLMCall('openai', 'gpt-4', request, async () => {
          throw error;
        })
      ).rejects.toThrow('LLM Error');

      const metrics = manager.getMetrics();
      const errorMetrics = metrics.filter(
        (m) => m.name === 'llm.errors' && m.labels?.provider === 'openai'
      );
      expect(errorMetrics.length).toBeGreaterThan(0);
    });

    it('should call LLM interceptors', async () => {
      const interceptor = {
        beforeRequest: vi.fn(),
        afterResponse: vi.fn(),
        onError: vi.fn(),
      };

      manager.registerLLMInterceptor(interceptor);

      const request = { messages: [] };
      const response = { content: 'test', usage: { promptTokens: 10, completionTokens: 10, totalTokens: 20 } };

      await manager.instrumentLLMCall('openai', 'gpt-4', request, async () => response);

      expect(interceptor.beforeRequest).toHaveBeenCalled();
      expect(interceptor.afterResponse).toHaveBeenCalled();
      expect(interceptor.onError).not.toHaveBeenCalled();
    });

    it('should call error interceptor on failure', async () => {
      const interceptor = {
        beforeRequest: vi.fn(),
        afterResponse: vi.fn(),
        onError: vi.fn(),
      };

      manager.registerLLMInterceptor(interceptor);

      const request = { messages: [] };
      const error = new Error('Test error');

      await expect(
        manager.instrumentLLMCall('openai', 'gpt-4', request, async () => {
          throw error;
        })
      ).rejects.toThrow();

      expect(interceptor.beforeRequest).toHaveBeenCalled();
      expect(interceptor.onError).toHaveBeenCalled();
      expect(interceptor.afterResponse).not.toHaveBeenCalled();
    });

    it('should skip instrumentation when disabled', async () => {
      manager.disable();

      const response = { content: 'test' };
      const result = await manager.instrumentLLMCall(
        'openai',
        'gpt-4',
        {},
        async () => response
      );

      expect(result).toBe(response);
      expect(manager.getMetrics()).toHaveLength(0);
    });
  });

  describe('Tool Instrumentation', () => {
    it('should instrument tool call successfully', async () => {
      const params = { input: 'test' };
      const toolResult = { output: 'result' };

      const result = await manager.instrumentToolCall(
        'test-tool',
        params,
        async () => toolResult
      );

      expect(result).toBe(toolResult);

      const metrics = manager.getMetrics();
      const toolMetrics = metrics.filter((m) => m.name.startsWith('tool.'));
      expect(toolMetrics.length).toBeGreaterThan(0);
    });

    it('should handle tool errors', async () => {
      const params = { input: 'test' };
      const error = new Error('Tool Error');

      await expect(
        manager.instrumentToolCall('test-tool', params, async () => {
          throw error;
        })
      ).rejects.toThrow('Tool Error');

      const metrics = manager.getMetrics();
      const errorMetrics = metrics.filter((m) => m.name === 'tool.errors');
      expect(errorMetrics.length).toBeGreaterThan(0);
    });

    it('should call tool interceptors', async () => {
      const interceptor = {
        beforeExecution: vi.fn(),
        afterExecution: vi.fn(),
        onError: vi.fn(),
      };

      manager.registerToolInterceptor(interceptor);

      const params = { input: 'test' };
      const result = { output: 'result' };

      await manager.instrumentToolCall('test-tool', params, async () => result);

      expect(interceptor.beforeExecution).toHaveBeenCalledWith(
        'test-tool',
        params,
        expect.any(Object)
      );
      expect(interceptor.afterExecution).toHaveBeenCalledWith(
        'test-tool',
        params,
        result,
        expect.any(Object)
      );
    });
  });

  describe('Agent Instrumentation', () => {
    it('should instrument agent execution successfully', async () => {
      const input = 'test input';
      const agentResult = 'agent response';

      const result = await manager.instrumentAgentExecution(
        'test-agent',
        input,
        async () => agentResult
      );

      expect(result).toBe(agentResult);

      const metrics = manager.getMetrics();
      const agentMetrics = metrics.filter((m) => m.name.startsWith('agent.'));
      expect(agentMetrics.length).toBeGreaterThan(0);
    });

    it('should handle agent errors', async () => {
      const input = 'test input';
      const error = new Error('Agent Error');

      await expect(
        manager.instrumentAgentExecution('test-agent', input, async () => {
          throw error;
        })
      ).rejects.toThrow('Agent Error');

      const metrics = manager.getMetrics();
      const errorMetrics = metrics.filter((m) => m.name === 'agent.errors');
      expect(errorMetrics.length).toBeGreaterThan(0);
    });

    it('should call agent interceptors', async () => {
      const interceptor = {
        beforeExecution: vi.fn(),
        afterExecution: vi.fn(),
        onError: vi.fn(),
      };

      manager.registerAgentInterceptor(interceptor);

      const input = 'test input';
      const result = 'agent response';

      await manager.instrumentAgentExecution('test-agent', input, async () => result);

      expect(interceptor.beforeExecution).toHaveBeenCalledWith(
        'test-agent',
        input,
        expect.any(Object)
      );
      expect(interceptor.afterExecution).toHaveBeenCalledWith(
        'test-agent',
        input,
        result,
        expect.any(Object)
      );
    });
  });

  describe('Metrics Collection', () => {
    it('should collect and retrieve metrics', () => {
      const collector = manager.getMetricsCollector();

      collector.recordCounter('test.counter', 1);
      collector.recordGauge('test.gauge', 100);
      collector.recordHistogram('test.histogram', 50);

      const metrics = manager.getMetrics();
      expect(metrics.length).toBe(3);

      const counter = metrics.find((m) => m.name === 'test.counter');
      expect(counter).toBeDefined();
      expect(counter?.type).toBe('counter');

      const gauge = metrics.find((m) => m.name === 'test.gauge');
      expect(gauge).toBeDefined();
      expect(gauge?.type).toBe('gauge');

      const histogram = metrics.find((m) => m.name === 'test.histogram');
      expect(histogram).toBeDefined();
      expect(histogram?.type).toBe('histogram');
    });

    it('should clear metrics', () => {
      const collector = manager.getMetricsCollector();
      collector.recordCounter('test.counter', 1);

      expect(manager.getMetrics()).toHaveLength(1);

      manager.clearMetrics();
      expect(manager.getMetrics()).toHaveLength(0);
    });

    it('should record LLM metrics with labels', () => {
      const collector = manager.getMetricsCollector();

      const metrics: LLMMetrics = {
        requestDuration: 1000,
        timeToFirstToken: 100,
        tokens: { prompt: 10, completion: 20, total: 30 },
        provider: 'openai',
        model: 'gpt-4',
        success: true,
        retryCount: 0,
      };

      collector.recordLLMMetrics(metrics);

      const allMetrics = manager.getMetrics();
      const llmMetrics = allMetrics.filter((m) => m.labels?.provider === 'openai');
      expect(llmMetrics.length).toBeGreaterThan(0);
    });

    it('should record tool metrics', () => {
      const collector = manager.getMetricsCollector();

      const metrics: ToolMetrics = {
        toolName: 'calculator',
        duration: 500,
        success: true,
        retryCount: 0,
      };

      collector.recordToolMetrics(metrics);

      const allMetrics = manager.getMetrics();
      const toolMetrics = allMetrics.filter((m) => m.labels?.tool_name === 'calculator');
      expect(toolMetrics.length).toBeGreaterThan(0);
    });

    it('should record agent metrics', () => {
      const collector = manager.getMetricsCollector();

      const metrics: AgentMetrics = {
        agentId: 'test-agent',
        totalDuration: 2000,
        steps: 5,
        llmCalls: 3,
        toolCalls: 2,
        totalTokens: 100,
        success: true,
      };

      collector.recordAgentMetrics(metrics);

      const allMetrics = manager.getMetrics();
      const agentMetrics = allMetrics.filter((m) => m.labels?.agent_id === 'test-agent');
      expect(agentMetrics.length).toBeGreaterThan(0);
    });
  });

  describe('Event Listeners', () => {
    it('should add and remove event listeners', () => {
      const listener = vi.fn();

      manager.addEventListener(listener);
      manager.removeEventListener(listener);

      // No errors thrown
      expect(true).toBe(true);
    });
  });

  describe('Global Instance', () => {
    it('should get global instrumentation instance', () => {
      const instance1 = getInstrumentation();
      const instance2 = getInstrumentation();

      expect(instance1).toBe(instance2);
    });

    it('should set global instrumentation instance', () => {
      const customManager = new InstrumentationManager({
        serviceName: 'custom-service',
      });

      setInstrumentation(customManager);

      const instance = getInstrumentation();
      expect(instance).toBe(customManager);
    });

    it('should reset global instrumentation instance', () => {
      const instance1 = getInstrumentation();
      resetInstrumentation();
      const instance2 = getInstrumentation();

      expect(instance1).not.toBe(instance2);
    });
  });

  describe('Shutdown', () => {
    it('should shutdown cleanly', async () => {
      const trace = manager.startTrace('test-operation');
      manager.getMetricsCollector().recordCounter('test.counter', 1);

      await manager.shutdown();

      // Trace should be ended
      expect(manager.getTrace(trace.traceId)).toBeUndefined();

      // Metrics should be cleared
      expect(manager.getMetrics()).toHaveLength(0);
    });

    it('should call exporter shutdown', async () => {
      const shutdownSpy = vi.fn();
      const flushSpy = vi.fn();

      const exporter: TraceExporter = {
        export: vi.fn(),
        flush: flushSpy,
        shutdown: shutdownSpy,
      };

      const customManager = new InstrumentationManager({
        traceExporter: exporter,
      });

      await customManager.shutdown();

      expect(flushSpy).toHaveBeenCalled();
      expect(shutdownSpy).toHaveBeenCalled();
    });
  });

  describe('Integration Tests', () => {
    it('should create complete trace with spans', async () => {
      const trace = manager.startTrace('agent-execution');
      const context = { traceId: trace.traceId };

      // Simulate agent execution with LLM call and tool call
      await manager.instrumentLLMCall(
        'openai',
        'gpt-4',
        { messages: [] },
        async () => ({
          content: 'response',
          usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
        }),
        context
      );

      await manager.instrumentToolCall(
        'calculator',
        { operation: 'add', a: 1, b: 2 },
        async () => ({ result: 3 }),
        context
      );

      await manager.endTrace(trace.traceId);

      // Check metrics were collected
      const metrics = manager.getMetrics();
      expect(metrics.length).toBeGreaterThan(0);

      const llmMetrics = metrics.filter((m) => m.name.startsWith('llm.'));
      expect(llmMetrics.length).toBeGreaterThan(0);

      const toolMetrics = metrics.filter((m) => m.name.startsWith('tool.'));
      expect(toolMetrics.length).toBeGreaterThan(0);
    });

    it('should handle concurrent operations', async () => {
      const promises = [];

      for (let i = 0; i < 5; i++) {
        promises.push(
          manager.instrumentLLMCall(
            'openai',
            'gpt-4',
            { messages: [] },
            async () => ({
              content: `response-${i}`,
              usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
            })
          )
        );
      }

      const results = await Promise.all(promises);
      expect(results).toHaveLength(5);

      const metrics = manager.getMetrics();
      const llmRequestMetrics = metrics.filter((m) => m.name === 'llm.request.total');
      expect(llmRequestMetrics.length).toBeGreaterThan(0);
    });
  });
});
