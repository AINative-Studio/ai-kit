/**
 * Tests for AgentExecutor
 */

import { z } from 'zod';
import { Agent } from '../../src/agents/Agent';
import { AgentExecutor, executeAgent } from '../../src/agents/AgentExecutor';
import {
  AgentConfig,
  ToolDefinition,
  MaxStepsExceededError,
  StreamEvent,
} from '../../src/agents/types';
import { LLMProvider, ChatRequest, ChatResponse } from '../../src/agents/llm/LLMProvider';

// Mock LLM Provider for testing
class MockLLMProvider extends LLMProvider {
  private responses: ChatResponse[] = [];
  private currentIndex = 0;

  constructor(responses: ChatResponse[] = []) {
    super({});
    this.responses = responses;
  }

  setResponses(responses: ChatResponse[]) {
    this.responses = responses;
    this.currentIndex = 0;
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    if (this.currentIndex >= this.responses.length) {
      throw new Error('No more mock responses available');
    }

    const response = this.responses[this.currentIndex++];

    // Handle streaming if requested
    if (request.streaming && request.onStream && response.content) {
      for (const char of response.content) {
        await request.onStream(char);
      }
    }

    return response;
  }

  getProviderName(): string {
    return 'mock';
  }
}

describe('AgentExecutor', () => {
  let basicConfig: AgentConfig;
  let mockProvider: MockLLMProvider;

  beforeEach(() => {
    basicConfig = {
      id: 'test-agent',
      name: 'Test Agent',
      systemPrompt: 'You are a helpful assistant.',
      llm: {
        provider: 'openai',
        model: 'gpt-4',
      },
      tools: [],
    };

    mockProvider = new MockLLMProvider();
  });

  describe('Basic Execution', () => {
    it('should execute agent with simple response', async () => {
      mockProvider.setResponses([
        {
          content: 'Hello! How can I help you?',
          finishReason: 'stop',
        },
      ]);

      const agent = new Agent(basicConfig);
      const executor = new AgentExecutor(agent, {
        llmProvider: mockProvider,
      });

      const result = await executor.execute('Hi there!');

      expect(result.success).toBe(true);
      expect(result.response).toBe('Hello! How can I help you?');
      expect(result.error).toBeUndefined();
      expect(result.trace.stats.totalSteps).toBe(1);
      expect(result.trace.stats.totalLLMCalls).toBe(1);
    });

    it('should include execution trace', async () => {
      mockProvider.setResponses([
        {
          content: 'Test response',
          finishReason: 'stop',
        },
      ]);

      const agent = new Agent(basicConfig);
      const executor = new AgentExecutor(agent, {
        llmProvider: mockProvider,
      });

      const result = await executor.execute('Test input');

      expect(result.trace).toBeDefined();
      expect(result.trace.executionId).toBeDefined();
      expect(result.trace.agentId).toBe('test-agent');
      expect(result.trace.startTime).toBeDefined();
      expect(result.trace.endTime).toBeDefined();
      expect(result.trace.durationMs).toBeGreaterThanOrEqual(0);
      expect(result.trace.events.length).toBeGreaterThan(0);
    });

    it('should track agent state', async () => {
      mockProvider.setResponses([
        {
          content: 'Response',
          finishReason: 'stop',
        },
      ]);

      const agent = new Agent(basicConfig);
      const executor = new AgentExecutor(agent, {
        llmProvider: mockProvider,
      });

      const result = await executor.execute('Input');

      expect(result.state.step).toBe(1);
      expect(result.state.messages.length).toBeGreaterThan(0);
      expect(result.state.isComplete).toBe(true);
      expect(result.state.finalResponse).toBe('Response');
    });
  });

  describe('Tool Calling', () => {
    it('should execute single tool call', async () => {
      const tool: ToolDefinition = {
        name: 'calculator',
        description: 'Performs calculations',
        parameters: z.object({
          operation: z.enum(['add', 'subtract']),
          a: z.number(),
          b: z.number(),
        }),
        execute: async ({ operation, a, b }) => {
          if (operation === 'add') return { result: a + b };
          return { result: a - b };
        },
      };

      const configWithTool = {
        ...basicConfig,
        tools: [tool],
      };

      mockProvider.setResponses([
        {
          content: 'I will calculate that for you.',
          toolCalls: [
            {
              id: 'call-1',
              name: 'calculator',
              parameters: { operation: 'add', a: 5, b: 3 },
            },
          ],
          finishReason: 'tool_calls',
        },
        {
          content: 'The result is 8.',
          finishReason: 'stop',
        },
      ]);

      const agent = new Agent(configWithTool);
      const executor = new AgentExecutor(agent, {
        llmProvider: mockProvider,
      });

      const result = await executor.execute('What is 5 + 3?');

      expect(result.success).toBe(true);
      expect(result.response).toBe('The result is 8.');
      expect(result.trace.stats.totalToolCalls).toBe(1);
      expect(result.trace.stats.successfulToolCalls).toBe(1);
      expect(result.trace.stats.totalSteps).toBe(2);
    });

    it('should execute multiple tool calls in sequence', async () => {
      const weatherTool: ToolDefinition = {
        name: 'get_weather',
        description: 'Gets weather',
        parameters: z.object({ city: z.string() }),
        execute: async ({ city }) => ({
          temperature: 72,
          condition: 'sunny',
          city,
        }),
      };

      const configWithTool = {
        ...basicConfig,
        tools: [weatherTool],
      };

      mockProvider.setResponses([
        {
          content: 'Let me check the weather.',
          toolCalls: [
            {
              id: 'call-1',
              name: 'get_weather',
              parameters: { city: 'San Francisco' },
            },
          ],
          finishReason: 'tool_calls',
        },
        {
          content: 'Let me also check another city.',
          toolCalls: [
            {
              id: 'call-2',
              name: 'get_weather',
              parameters: { city: 'New York' },
            },
          ],
          finishReason: 'tool_calls',
        },
        {
          content: 'Both cities have different weather.',
          finishReason: 'stop',
        },
      ]);

      const agent = new Agent(configWithTool);
      const executor = new AgentExecutor(agent, {
        llmProvider: mockProvider,
      });

      const result = await executor.execute('Weather comparison');

      expect(result.success).toBe(true);
      expect(result.trace.stats.totalToolCalls).toBe(2);
      expect(result.trace.stats.successfulToolCalls).toBe(2);
      expect(result.trace.stats.totalSteps).toBe(3);
    });

    it('should handle tool execution errors gracefully', async () => {
      const errorTool: ToolDefinition = {
        name: 'error_tool',
        description: 'Always fails',
        parameters: z.object({}),
        execute: async () => {
          throw new Error('Tool error');
        },
      };

      const configWithTool = {
        ...basicConfig,
        tools: [errorTool],
      };

      mockProvider.setResponses([
        {
          content: 'Using the tool.',
          toolCalls: [
            {
              id: 'call-1',
              name: 'error_tool',
              parameters: {},
            },
          ],
          finishReason: 'tool_calls',
        },
        {
          content: 'The tool encountered an error.',
          finishReason: 'stop',
        },
      ]);

      const agent = new Agent(configWithTool);
      const executor = new AgentExecutor(agent, {
        llmProvider: mockProvider,
      });

      const result = await executor.execute('Test');

      expect(result.success).toBe(true);
      expect(result.trace.stats.totalToolCalls).toBe(1);
      expect(result.trace.stats.failedToolCalls).toBe(1);
      expect(result.trace.stats.successfulToolCalls).toBe(0);
    });
  });

  describe('Max Steps', () => {
    it('should respect max steps limit', async () => {
      // Set up infinite loop of tool calls
      mockProvider.setResponses(
        Array(20).fill({
          content: 'Calling tool again.',
          toolCalls: [
            {
              id: 'call-x',
              name: 'dummy_tool',
              parameters: {},
            },
          ],
          finishReason: 'tool_calls',
        })
      );

      const dummyTool: ToolDefinition = {
        name: 'dummy_tool',
        description: 'Dummy',
        parameters: z.object({}),
        execute: async () => ({ done: true }),
      };

      const configWithTool = {
        ...basicConfig,
        tools: [dummyTool],
        maxSteps: 5,
      };

      const agent = new Agent(configWithTool);
      const executor = new AgentExecutor(agent, {
        llmProvider: mockProvider,
      });

      const result = await executor.execute('Loop test');

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(MaxStepsExceededError);
      expect(result.trace.stats.totalSteps).toBe(5);
    });

    it('should use config max steps override', async () => {
      mockProvider.setResponses(
        Array(10).fill({
          content: 'Continue.',
          toolCalls: [
            {
              id: 'call-x',
              name: 'dummy_tool',
              parameters: {},
            },
          ],
          finishReason: 'tool_calls',
        })
      );

      const dummyTool: ToolDefinition = {
        name: 'dummy_tool',
        description: 'Dummy',
        parameters: z.object({}),
        execute: async () => ({}),
      };

      const configWithTool = {
        ...basicConfig,
        tools: [dummyTool],
        maxSteps: 10,
      };

      const agent = new Agent(configWithTool);
      const executor = new AgentExecutor(agent, {
        llmProvider: mockProvider,
        maxSteps: 3, // Override in execution config
      });

      const result = await executor.execute('Test');

      expect(result.success).toBe(false);
      expect(result.trace.stats.totalSteps).toBe(3);
    });
  });

  describe('Streaming', () => {
    it('should emit streaming events', async () => {
      mockProvider.setResponses([
        {
          content: 'Streaming response',
          finishReason: 'stop',
        },
      ]);

      const agent = new Agent(basicConfig);
      const executor = new AgentExecutor(agent, {
        llmProvider: mockProvider,
      });

      const events: StreamEvent[] = [];

      const result = await executor.execute('Test', {
        streaming: true,
        onStream: async (event) => {
          events.push(event);
        },
      });

      expect(result.success).toBe(true);

      // Should have start, text chunks, and complete events
      const eventTypes = events.map((e) => e.type);
      expect(eventTypes).toContain('start');
      expect(eventTypes).toContain('complete');
    });

    it('should stream text chunks', async () => {
      mockProvider.setResponses([
        {
          content: 'Hello World',
          finishReason: 'stop',
        },
      ]);

      const agent = new Agent(basicConfig);
      const executor = new AgentExecutor(agent, {
        llmProvider: mockProvider,
      });

      const textChunks: string[] = [];

      await executor.execute('Test', {
        streaming: true,
        onStream: async (event) => {
          if (event.type === 'text_chunk') {
            textChunks.push(event.data as any);
          }
        },
      });

      // Should have received individual characters
      expect(textChunks.length).toBeGreaterThan(0);
      expect(textChunks.join('')).toBe('Hello World');
    });

    it('should emit tool call events', async () => {
      const tool: ToolDefinition = {
        name: 'test_tool',
        description: 'Test',
        parameters: z.object({}),
        execute: async () => ({ result: 'ok' }),
      };

      const configWithTool = {
        ...basicConfig,
        tools: [tool],
      };

      mockProvider.setResponses([
        {
          content: '',
          toolCalls: [
            {
              id: 'call-1',
              name: 'test_tool',
              parameters: {},
            },
          ],
          finishReason: 'tool_calls',
        },
        {
          content: 'Done',
          finishReason: 'stop',
        },
      ]);

      const agent = new Agent(configWithTool);
      const executor = new AgentExecutor(agent, {
        llmProvider: mockProvider,
      });

      const events: StreamEvent[] = [];

      await executor.execute('Test', {
        streaming: true,
        onStream: async (event) => {
          events.push(event);
        },
      });

      const toolEvents = events.filter(
        (e) => e.type === 'tool_call' || e.type === 'tool_result'
      );
      expect(toolEvents.length).toBeGreaterThan(0);
    });

    it('should handle stream callback errors gracefully', async () => {
      mockProvider.setResponses([
        {
          content: 'Test',
          finishReason: 'stop',
        },
      ]);

      const agent = new Agent(basicConfig);
      const executor = new AgentExecutor(agent, {
        llmProvider: mockProvider,
      });

      // Callback that throws error
      const result = await executor.execute('Test', {
        streaming: true,
        onStream: async () => {
          throw new Error('Stream error');
        },
      });

      // Execution should still succeed
      expect(result.success).toBe(true);
    });
  });

  describe('Trace Events', () => {
    it('should include agent start/end events', async () => {
      mockProvider.setResponses([
        {
          content: 'Response',
          finishReason: 'stop',
        },
      ]);

      const agent = new Agent(basicConfig);
      const executor = new AgentExecutor(agent, {
        llmProvider: mockProvider,
      });

      const result = await executor.execute('Test');

      const eventTypes = result.trace.events.map((e) => e.type);
      expect(eventTypes).toContain('agent_start');
      expect(eventTypes).toContain('agent_end');
    });

    it('should include step events', async () => {
      mockProvider.setResponses([
        {
          content: 'Response',
          finishReason: 'stop',
        },
      ]);

      const agent = new Agent(basicConfig);
      const executor = new AgentExecutor(agent, {
        llmProvider: mockProvider,
      });

      const result = await executor.execute('Test');

      const eventTypes = result.trace.events.map((e) => e.type);
      expect(eventTypes).toContain('step_start');
      expect(eventTypes).toContain('step_end');
    });

    it('should include LLM request/response events', async () => {
      mockProvider.setResponses([
        {
          content: 'Response',
          finishReason: 'stop',
        },
      ]);

      const agent = new Agent(basicConfig);
      const executor = new AgentExecutor(agent, {
        llmProvider: mockProvider,
      });

      const result = await executor.execute('Test');

      const eventTypes = result.trace.events.map((e) => e.type);
      expect(eventTypes).toContain('llm_request');
      expect(eventTypes).toContain('llm_response');
    });

    it('should include tool call events', async () => {
      const tool: ToolDefinition = {
        name: 'test_tool',
        description: 'Test',
        parameters: z.object({}),
        execute: async () => ({}),
      };

      const configWithTool = {
        ...basicConfig,
        tools: [tool],
      };

      mockProvider.setResponses([
        {
          content: '',
          toolCalls: [
            {
              id: 'call-1',
              name: 'test_tool',
              parameters: {},
            },
          ],
          finishReason: 'tool_calls',
        },
        {
          content: 'Done',
          finishReason: 'stop',
        },
      ]);

      const agent = new Agent(configWithTool);
      const executor = new AgentExecutor(agent, {
        llmProvider: mockProvider,
      });

      const result = await executor.execute('Test');

      const eventTypes = result.trace.events.map((e) => e.type);
      expect(eventTypes).toContain('tool_call_start');
      expect(eventTypes).toContain('tool_call_end');
    });
  });

  describe('Error Handling', () => {
    it('should handle LLM errors', async () => {
      const errorProvider = new MockLLMProvider();
      errorProvider.setResponses([]);

      const agent = new Agent(basicConfig);
      const executor = new AgentExecutor(agent, {
        llmProvider: errorProvider,
      });

      const result = await executor.execute('Test');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.trace.events.some((e) => e.type === 'error')).toBe(true);
    });

    it('should include error in state', async () => {
      const errorProvider = new MockLLMProvider();
      errorProvider.setResponses([]);

      const agent = new Agent(basicConfig);
      const executor = new AgentExecutor(agent, {
        llmProvider: errorProvider,
      });

      const result = await executor.execute('Test');

      expect(result.state.error).toBeDefined();
      expect(result.state.error?.message).toBeDefined();
      expect(result.state.error?.step).toBeDefined();
    });
  });

  describe('Factory Function', () => {
    it('should execute agent using factory function', async () => {
      mockProvider.setResponses([
        {
          content: 'Response',
          finishReason: 'stop',
        },
      ]);

      const agent = new Agent(basicConfig);

      const result = await executeAgent(agent, 'Test', {
        llmProvider: mockProvider,
      });

      expect(result.success).toBe(true);
      expect(result.response).toBe('Response');
    });
  });

  describe('State Management', () => {
    it('should provide access to current state', async () => {
      mockProvider.setResponses([
        {
          content: 'Response',
          finishReason: 'stop',
        },
      ]);

      const agent = new Agent(basicConfig);
      const executor = new AgentExecutor(agent, {
        llmProvider: mockProvider,
      });

      await executor.execute('Test');

      const state = executor.getState();
      expect(state.step).toBeGreaterThan(0);
      expect(state.messages.length).toBeGreaterThan(0);
    });

    it('should provide access to current trace', async () => {
      mockProvider.setResponses([
        {
          content: 'Response',
          finishReason: 'stop',
        },
      ]);

      const agent = new Agent(basicConfig);
      const executor = new AgentExecutor(agent, {
        llmProvider: mockProvider,
      });

      await executor.execute('Test');

      const trace = executor.getTrace();
      expect(trace.executionId).toBeDefined();
      expect(trace.events.length).toBeGreaterThan(0);
    });
  });
});
