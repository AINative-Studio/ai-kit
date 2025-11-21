/**
 * Tests for Instrumentation Interceptors
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  OpenAIInterceptor,
  AnthropicInterceptor,
  GenericLLMInterceptor,
  ToolCallInterceptor,
  AgentExecutionInterceptor,
  createLoggingLLMInterceptor,
  createLoggingToolInterceptor,
  createLoggingAgentInterceptor,
} from '../../src/instrumentation/interceptors';
import { InterceptorContext, Span, TraceContext } from '../../src/instrumentation/types';

describe('Interceptors', () => {
  let context: InterceptorContext;
  let span: Span;
  let traceContext: TraceContext;

  beforeEach(() => {
    traceContext = {
      traceId: 'test-trace-id',
      flags: 1,
    };

    span = {
      spanId: 'test-span-id',
      traceId: 'test-trace-id',
      name: 'test-span',
      kind: 'internal',
      startTime: Date.now(),
      status: 'unset',
      attributes: {},
      events: [],
      links: [],
    };

    context = {
      trace: traceContext,
      span,
      metrics: {
        recordCounter: vi.fn(),
        recordGauge: vi.fn(),
        recordHistogram: vi.fn(),
        recordLLMMetrics: vi.fn(),
        recordToolMetrics: vi.fn(),
        recordAgentMetrics: vi.fn(),
        getMetrics: vi.fn(() => []),
        clear: vi.fn(),
      },
    };
  });

  describe('OpenAIInterceptor', () => {
    let interceptor: OpenAIInterceptor;

    beforeEach(() => {
      interceptor = new OpenAIInterceptor();
    });

    it('should add request attributes', async () => {
      const request = {
        model: 'gpt-4',
        temperature: 0.7,
        max_tokens: 1000,
        messages: [{ role: 'user', content: 'test' }],
        tools: [{ name: 'test-tool' }],
        stream: true,
      };

      await interceptor.beforeRequest!(request, context);

      expect(span.attributes['openai.model']).toBe('gpt-4');
      expect(span.attributes['openai.temperature']).toBe(0.7);
      expect(span.attributes['openai.max_tokens']).toBe(1000);
      expect(span.attributes['openai.message_count']).toBe(1);
      expect(span.attributes['openai.has_tools']).toBe(true);
      expect(span.attributes['openai.tool_count']).toBe(1);
      expect(span.attributes['openai.streaming']).toBe(true);
    });

    it('should add response attributes', async () => {
      const request = { model: 'gpt-4' };
      const response = {
        finishReason: 'stop',
        toolCalls: [{ id: '1', name: 'test' }],
        usage: {
          promptTokens: 10,
          completionTokens: 20,
          totalTokens: 30,
        },
      };

      await interceptor.afterResponse!(request, response, context);

      expect(span.attributes['openai.finish_reason']).toBe('stop');
      expect(span.attributes['openai.has_tool_calls']).toBe(true);
      expect(span.attributes['openai.tool_call_count']).toBe(1);
      expect(span.attributes['openai.usage.prompt_tokens']).toBe(10);
      expect(span.attributes['openai.usage.completion_tokens']).toBe(20);
      expect(span.attributes['openai.usage.total_tokens']).toBe(30);
    });

    it('should handle errors', async () => {
      const request = { model: 'gpt-4' };
      const error = new Error('API Error');
      error.name = 'OpenAIError';

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await interceptor.onError!(request, error, context);

      expect(span.attributes['openai.error.name']).toBe('OpenAIError');
      expect(span.attributes['openai.error.message']).toBe('API Error');
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('AnthropicInterceptor', () => {
    let interceptor: AnthropicInterceptor;

    beforeEach(() => {
      interceptor = new AnthropicInterceptor();
    });

    it('should add request attributes', async () => {
      const request = {
        model: 'claude-3-opus',
        temperature: 0.8,
        max_tokens: 2000,
        messages: [{ role: 'user', content: 'test' }],
        tools: [{ name: 'test-tool' }],
      };

      await interceptor.beforeRequest!(request, context);

      expect(span.attributes['anthropic.model']).toBe('claude-3-opus');
      expect(span.attributes['anthropic.temperature']).toBe(0.8);
      expect(span.attributes['anthropic.max_tokens']).toBe(2000);
      expect(span.attributes['anthropic.message_count']).toBe(1);
      expect(span.attributes['anthropic.has_tools']).toBe(true);
    });

    it('should add response attributes', async () => {
      const request = { model: 'claude-3-opus' };
      const response = {
        finishReason: 'end_turn',
        usage: {
          promptTokens: 15,
          completionTokens: 25,
          totalTokens: 40,
        },
      };

      await interceptor.afterResponse!(request, response, context);

      expect(span.attributes['anthropic.finish_reason']).toBe('end_turn');
      expect(span.attributes['anthropic.usage.input_tokens']).toBe(15);
      expect(span.attributes['anthropic.usage.output_tokens']).toBe(25);
    });

    it('should handle errors', async () => {
      const request = { model: 'claude-3-opus' };
      const error = new Error('API Error');

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await interceptor.onError!(request, error, context);

      expect(span.attributes['anthropic.error.message']).toBe('API Error');
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('GenericLLMInterceptor', () => {
    let interceptor: GenericLLMInterceptor;

    beforeEach(() => {
      interceptor = new GenericLLMInterceptor();
    });

    it('should add timestamp on beforeRequest', async () => {
      await interceptor.beforeRequest!({}, context);
      expect(span.attributes['llm.request.timestamp']).toBeTruthy();
    });

    it('should add timestamp on afterResponse', async () => {
      await interceptor.afterResponse!({}, {}, context);
      expect(span.attributes['llm.response.timestamp']).toBeTruthy();
    });

    it('should add timestamp on error', async () => {
      await interceptor.onError!({}, new Error('test'), context);
      expect(span.attributes['llm.error.timestamp']).toBeTruthy();
    });
  });

  describe('ToolCallInterceptor', () => {
    let interceptor: ToolCallInterceptor;

    beforeEach(() => {
      interceptor = new ToolCallInterceptor();
    });

    it('should add execution start attributes', async () => {
      const params = { input: 'test', value: 123 };

      await interceptor.beforeExecution!('test-tool', params, context);

      expect(span.attributes['tool.execution.start_timestamp']).toBeTruthy();
      expect(span.attributes['tool.params.size_bytes']).toBeGreaterThan(0);
    });

    it('should add execution completion attributes', async () => {
      const params = { input: 'test' };
      const result = { output: 'result', data: [1, 2, 3] };

      await interceptor.afterExecution!('test-tool', params, result, context);

      expect(span.attributes['tool.execution.end_timestamp']).toBeTruthy();
      expect(span.attributes['tool.result.size_bytes']).toBeGreaterThan(0);
      expect(span.attributes['tool.execution.success']).toBe(true);
    });

    it('should handle tool errors', async () => {
      const params = { input: 'test' };
      const error = new Error('Tool failed');
      error.stack = 'Error stack trace';

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await interceptor.onError!('test-tool', params, error, context);

      expect(span.attributes['tool.execution.success']).toBe(false);
      expect(span.attributes['tool.error.name']).toBe('Error');
      expect(span.attributes['tool.error.message']).toBe('Tool failed');
      expect(span.attributes['tool.error.stack']).toBeTruthy();
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('AgentExecutionInterceptor', () => {
    let interceptor: AgentExecutionInterceptor;

    beforeEach(() => {
      interceptor = new AgentExecutionInterceptor();
    });

    it('should initialize on beforeExecution', async () => {
      context.data = {};
      const input = 'test input for agent';

      await interceptor.beforeExecution!('test-agent', input, context);

      expect(span.attributes['agent.execution.start_timestamp']).toBeTruthy();
      expect(span.attributes['agent.input.length']).toBe(input.length);
    });

    it('should add execution stats on afterExecution', async () => {
      context.data = {};

      await interceptor.beforeExecution!('test-agent', 'input', context);

      // Simulate some tracking
      interceptor.trackStep('test-agent');
      interceptor.trackStep('test-agent');
      interceptor.trackLLMCall('test-agent', 100);
      interceptor.trackToolCall('test-agent');

      const result = 'agent response';
      await interceptor.afterExecution!('test-agent', 'input', result, context);

      expect(span.attributes['agent.execution.success']).toBe(true);
      expect(span.attributes['agent.execution.steps']).toBe(2);
      expect(span.attributes['agent.execution.llm_calls']).toBe(1);
      expect(span.attributes['agent.execution.tool_calls']).toBe(1);
      expect(span.attributes['agent.execution.total_tokens']).toBe(100);
    });

    it('should track multiple LLM calls', async () => {
      context.data = {};

      await interceptor.beforeExecution!('test-agent', 'input', context);

      interceptor.trackLLMCall('test-agent', 50);
      interceptor.trackLLMCall('test-agent', 75);
      interceptor.trackLLMCall('test-agent', 100);

      await interceptor.afterExecution!('test-agent', 'input', 'result', context);

      expect(context.data.llmCalls).toBe(3);
      expect(context.data.totalTokens).toBe(225);
    });

    it('should handle agent errors', async () => {
      context.data = {};

      await interceptor.beforeExecution!('test-agent', 'input', context);

      const error = new Error('Agent failed');
      error.stack = 'Error stack';

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await interceptor.onError!('test-agent', 'input', error, context);

      expect(span.attributes['agent.execution.success']).toBe(false);
      expect(span.attributes['agent.error.message']).toBe('Agent failed');
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Logging Interceptors', () => {
    beforeEach(() => {
      vi.spyOn(console, 'log').mockImplementation(() => {});
      vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should create logging LLM interceptor', async () => {
      const interceptor = createLoggingLLMInterceptor();

      const request = { model: 'gpt-4', messages: [] };
      const response = { content: 'test', usage: {} };

      await interceptor.beforeRequest!(request, context);
      expect(console.log).toHaveBeenCalled();

      await interceptor.afterResponse!(request, response, context);
      expect(console.log).toHaveBeenCalled();

      await interceptor.onError!(request, new Error('test'), context);
      expect(console.error).toHaveBeenCalled();
    });

    it('should create logging tool interceptor', async () => {
      const interceptor = createLoggingToolInterceptor();

      await interceptor.beforeExecution!('test-tool', {}, context);
      expect(console.log).toHaveBeenCalled();

      await interceptor.afterExecution!('test-tool', {}, {}, context);
      expect(console.log).toHaveBeenCalled();

      await interceptor.onError!('test-tool', {}, new Error('test'), context);
      expect(console.error).toHaveBeenCalled();
    });

    it('should create logging agent interceptor', async () => {
      const interceptor = createLoggingAgentInterceptor();

      await interceptor.beforeExecution!('test-agent', 'input', context);
      expect(console.log).toHaveBeenCalled();

      await interceptor.afterExecution!('test-agent', 'input', 'result', context);
      expect(console.log).toHaveBeenCalled();

      await interceptor.onError!('test-agent', 'input', new Error('test'), context);
      expect(console.error).toHaveBeenCalled();
    });
  });
});
