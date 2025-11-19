/**
 * Tests for StreamingAgentExecutor
 */

import { z } from 'zod';
import { Agent } from '../../src/agents/Agent';
import {
  StreamingAgentExecutor,
  streamAgentExecution,
} from '../../src/agents/StreamingAgentExecutor';
import {
  AgentConfig,
  ToolDefinition,
  MaxStepsExceededError,
  AgentExecutionEvent,
  ThoughtEvent,
  ToolCallEvent,
  ToolResultEvent,
  FinalAnswerEvent,
  ErrorEvent,
  AgentStepEvent,
} from '../../src/agents/types';
import {
  LLMProvider,
  ChatRequest,
  ChatResponse,
} from '../../src/agents/llm/LLMProvider';

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
    return response;
  }

  getProviderName(): string {
    return 'mock';
  }
}

describe('StreamingAgentExecutor', () => {
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

  describe('Basic Streaming', () => {
    it('should stream simple execution with thought and final answer', async () => {
      mockProvider.setResponses([
        {
          content: 'Hello! How can I help you?',
          finishReason: 'stop',
        },
      ]);

      const agent = new Agent(basicConfig);
      const executor = new StreamingAgentExecutor(agent, {
        llmProvider: mockProvider,
      });

      const events: AgentExecutionEvent[] = [];

      for await (const event of executor.stream('Hi there!')) {
        events.push(event);
      }

      // Verify we got expected event types
      const eventTypes = events.map((e) => e.type);
      expect(eventTypes).toContain('step');
      expect(eventTypes).toContain('thought');
      expect(eventTypes).toContain('final_answer');

      // Verify thought event
      const thoughtEvent = events.find((e) => e.type === 'thought') as ThoughtEvent;
      expect(thoughtEvent).toBeDefined();
      expect(thoughtEvent.content).toBe('Hello! How can I help you?');
      expect(thoughtEvent.step).toBe(1);

      // Verify final answer event
      const finalAnswerEvent = events.find(
        (e) => e.type === 'final_answer'
      ) as FinalAnswerEvent;
      expect(finalAnswerEvent).toBeDefined();
      expect(finalAnswerEvent.answer).toBe('Hello! How can I help you?');
    });

    it('should emit step events for each iteration', async () => {
      mockProvider.setResponses([
        {
          content: 'Thinking...',
          toolCalls: [
            {
              id: 'call-1',
              name: 'calculator',
              parameters: { a: 5, b: 3 },
            },
          ],
          finishReason: 'tool_calls',
        },
        {
          content: 'The result is 8.',
          finishReason: 'stop',
        },
      ]);

      const calculatorTool: ToolDefinition = {
        name: 'calculator',
        description: 'Performs calculations',
        parameters: z.object({
          a: z.number(),
          b: z.number(),
        }),
        execute: async ({ a, b }) => ({ result: a + b }),
      };

      const configWithTool = {
        ...basicConfig,
        tools: [calculatorTool],
      };

      const agent = new Agent(configWithTool);
      const executor = new StreamingAgentExecutor(agent, {
        llmProvider: mockProvider,
      });

      const events: AgentExecutionEvent[] = [];
      for await (const event of executor.stream('Calculate 5 + 3')) {
        events.push(event);
      }

      const stepEvents = events.filter((e) => e.type === 'step') as AgentStepEvent[];
      expect(stepEvents.length).toBeGreaterThan(0);
      expect(stepEvents[0].step).toBe(1);
    });
  });

  describe('Tool Call Streaming', () => {
    it('should stream tool calls and results', async () => {
      const weatherTool: ToolDefinition = {
        name: 'get_weather',
        description: 'Gets weather information',
        parameters: z.object({
          city: z.string(),
        }),
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
          content: 'Let me check the weather for you.',
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
          content: 'The weather in San Francisco is sunny with a temperature of 72°F.',
          finishReason: 'stop',
        },
      ]);

      const agent = new Agent(configWithTool);
      const executor = new StreamingAgentExecutor(agent, {
        llmProvider: mockProvider,
      });

      const events: AgentExecutionEvent[] = [];
      for await (const event of executor.stream('What is the weather in San Francisco?')) {
        events.push(event);
      }

      // Verify tool call event
      const toolCallEvent = events.find(
        (e) => e.type === 'tool_call'
      ) as ToolCallEvent;
      expect(toolCallEvent).toBeDefined();
      expect(toolCallEvent.toolCall.name).toBe('get_weather');
      expect(toolCallEvent.toolCall.parameters).toEqual({
        city: 'San Francisco',
      });

      // Verify tool result event
      const toolResultEvent = events.find(
        (e) => e.type === 'tool_result'
      ) as ToolResultEvent;
      expect(toolResultEvent).toBeDefined();
      expect(toolResultEvent.result.toolName).toBe('get_weather');
      expect(toolResultEvent.result.result).toEqual({
        temperature: 72,
        condition: 'sunny',
        city: 'San Francisco',
      });

      // Verify final answer
      const finalAnswerEvent = events.find(
        (e) => e.type === 'final_answer'
      ) as FinalAnswerEvent;
      expect(finalAnswerEvent).toBeDefined();
    });

    it('should stream multiple tool calls in sequence', async () => {
      const calculatorTool: ToolDefinition = {
        name: 'calculator',
        description: 'Performs calculations',
        parameters: z.object({
          operation: z.enum(['add', 'multiply']),
          a: z.number(),
          b: z.number(),
        }),
        execute: async ({ operation, a, b }) => {
          if (operation === 'add') return { result: a + b };
          return { result: a * b };
        },
      };

      const configWithTool = {
        ...basicConfig,
        tools: [calculatorTool],
      };

      mockProvider.setResponses([
        {
          content: 'First calculation...',
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
          content: 'Second calculation...',
          toolCalls: [
            {
              id: 'call-2',
              name: 'calculator',
              parameters: { operation: 'multiply', a: 8, b: 2 },
            },
          ],
          finishReason: 'tool_calls',
        },
        {
          content: 'The results are 8 and 16.',
          finishReason: 'stop',
        },
      ]);

      const agent = new Agent(configWithTool);
      const executor = new StreamingAgentExecutor(agent, {
        llmProvider: mockProvider,
      });

      const events: AgentExecutionEvent[] = [];
      for await (const event of executor.stream('Calculate')) {
        events.push(event);
      }

      const toolCallEvents = events.filter(
        (e) => e.type === 'tool_call'
      ) as ToolCallEvent[];
      expect(toolCallEvents.length).toBe(2);

      const toolResultEvents = events.filter(
        (e) => e.type === 'tool_result'
      ) as ToolResultEvent[];
      expect(toolResultEvents.length).toBe(2);
    });

    it('should stream tool execution errors', async () => {
      const errorTool: ToolDefinition = {
        name: 'error_tool',
        description: 'Always fails',
        parameters: z.object({}),
        execute: async () => {
          throw new Error('Tool execution failed');
        },
      };

      const configWithTool = {
        ...basicConfig,
        tools: [errorTool],
      };

      mockProvider.setResponses([
        {
          content: 'Using the tool...',
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
      const executor = new StreamingAgentExecutor(agent, {
        llmProvider: mockProvider,
      });

      const events: AgentExecutionEvent[] = [];
      for await (const event of executor.stream('Test error')) {
        events.push(event);
      }

      // Verify tool result event contains error
      const toolResultEvent = events.find(
        (e) => e.type === 'tool_result'
      ) as ToolResultEvent;
      expect(toolResultEvent).toBeDefined();
      expect(toolResultEvent.result.error).toBeDefined();
      expect(toolResultEvent.result.error?.message).toContain('Tool execution failed');
    });
  });

  describe('Error Handling', () => {
    it('should emit error events for LLM failures', async () => {
      const errorProvider = new MockLLMProvider();
      errorProvider.setResponses([]);

      const agent = new Agent(basicConfig);
      const executor = new StreamingAgentExecutor(agent, {
        llmProvider: errorProvider,
      });

      const events: AgentExecutionEvent[] = [];
      for await (const event of executor.stream('Test')) {
        events.push(event);
      }

      const errorEvents = events.filter((e) => e.type === 'error') as ErrorEvent[];
      expect(errorEvents.length).toBeGreaterThan(0);
      expect(errorEvents[0].error).toBeDefined();
    });

    it('should handle max steps exceeded', async () => {
      // Set up loop that never completes - keeps calling tools
      const responses: ChatResponse[] = [];
      for (let i = 0; i < 10; i++) {
        responses.push({
          content: `Iteration ${i}`,
          toolCalls: [
            {
              id: `call-${i}`,
              name: 'dummy_tool',
              parameters: {},
            },
          ],
          finishReason: 'tool_calls',
        });
      }
      mockProvider.setResponses(responses);

      const dummyTool: ToolDefinition = {
        name: 'dummy_tool',
        description: 'Dummy',
        parameters: z.object({}),
        execute: async () => ({ done: true }),
      };

      const configWithTool = {
        ...basicConfig,
        tools: [dummyTool],
      };

      const agent = new Agent(configWithTool);
      const executor = new StreamingAgentExecutor(agent, {
        llmProvider: mockProvider,
      });

      const events: AgentExecutionEvent[] = [];
      let hadError = false;
      let errorInstance: Error | undefined;

      try {
        for await (const event of executor.stream('Loop test', { maxSteps: 5 })) {
          events.push(event);
        }
      } catch (error) {
        hadError = true;
        errorInstance = error as Error;
      }

      // Should have thrown error
      expect(hadError).toBe(true);
      expect(errorInstance).toBeInstanceOf(MaxStepsExceededError);

      // Should have emitted step events up to max
      const stepEvents = events.filter((e) => e.type === 'step');
      expect(stepEvents.length).toBeLessThanOrEqual(5);
    });
  });

  describe('State and Trace', () => {
    it('should maintain execution state', async () => {
      mockProvider.setResponses([
        {
          content: 'Response',
          finishReason: 'stop',
        },
      ]);

      const agent = new Agent(basicConfig);
      const executor = new StreamingAgentExecutor(agent, {
        llmProvider: mockProvider,
      });

      for await (const event of executor.stream('Test')) {
        // Consume events
      }

      const state = executor.getState();
      expect(state.step).toBe(1);
      expect(state.messages.length).toBeGreaterThan(0);
      expect(state.isComplete).toBe(true);
    });

    it('should build execution trace', async () => {
      mockProvider.setResponses([
        {
          content: 'Response',
          finishReason: 'stop',
        },
      ]);

      const agent = new Agent(basicConfig);
      const executor = new StreamingAgentExecutor(agent, {
        llmProvider: mockProvider,
      });

      for await (const event of executor.stream('Test')) {
        // Consume events
      }

      const trace = executor.getTrace();
      expect(trace.executionId).toBeDefined();
      expect(trace.agentId).toBe('test-agent');
      expect(trace.events.length).toBeGreaterThan(0);
      expect(trace.stats.totalSteps).toBe(1);
      expect(trace.stats.totalLLMCalls).toBe(1);
    });
  });

  describe('Factory Function', () => {
    it('should stream using factory function', async () => {
      mockProvider.setResponses([
        {
          content: 'Factory response',
          finishReason: 'stop',
        },
      ]);

      const agent = new Agent(basicConfig);

      const events: AgentExecutionEvent[] = [];
      for await (const event of streamAgentExecution(agent, 'Test', {
        llmProvider: mockProvider,
      })) {
        events.push(event);
      }

      expect(events.length).toBeGreaterThan(0);

      const finalAnswerEvent = events.find(
        (e) => e.type === 'final_answer'
      ) as FinalAnswerEvent;
      expect(finalAnswerEvent).toBeDefined();
      expect(finalAnswerEvent.answer).toBe('Factory response');
    });
  });

  describe('Event Order and Timing', () => {
    it('should emit events in correct order', async () => {
      const calculatorTool: ToolDefinition = {
        name: 'calculator',
        description: 'Performs calculations',
        parameters: z.object({
          a: z.number(),
          b: z.number(),
        }),
        execute: async ({ a, b }) => ({ result: a + b }),
      };

      const configWithTool = {
        ...basicConfig,
        tools: [calculatorTool],
      };

      mockProvider.setResponses([
        {
          content: 'Calculating...',
          toolCalls: [
            {
              id: 'call-1',
              name: 'calculator',
              parameters: { a: 5, b: 3 },
            },
          ],
          finishReason: 'tool_calls',
        },
        {
          content: 'Result is 8',
          finishReason: 'stop',
        },
      ]);

      const agent = new Agent(configWithTool);
      const executor = new StreamingAgentExecutor(agent, {
        llmProvider: mockProvider,
      });

      const events: AgentExecutionEvent[] = [];
      for await (const event of executor.stream('Calculate')) {
        events.push(event);
      }

      // Verify order: step -> thought -> tool_call -> step -> tool_result -> thought -> final_answer
      const types = events.map((e) => e.type);

      // First step should come before first thought
      const firstStepIndex = types.indexOf('step');
      const firstThoughtIndex = types.indexOf('thought');
      expect(firstStepIndex).toBeLessThan(firstThoughtIndex);

      // Tool call should come before tool result
      const toolCallIndex = types.indexOf('tool_call');
      const toolResultIndex = types.indexOf('tool_result');
      expect(toolCallIndex).toBeLessThan(toolResultIndex);

      // Final answer should be last
      const finalAnswerIndex = types.indexOf('final_answer');
      expect(finalAnswerIndex).toBe(types.length - 1);
    });

    it('should include timestamps in all events', async () => {
      mockProvider.setResponses([
        {
          content: 'Response',
          finishReason: 'stop',
        },
      ]);

      const agent = new Agent(basicConfig);
      const executor = new StreamingAgentExecutor(agent, {
        llmProvider: mockProvider,
      });

      const events: AgentExecutionEvent[] = [];
      for await (const event of executor.stream('Test')) {
        events.push(event);
      }

      // All events should have timestamps
      for (const event of events) {
        expect(event.timestamp).toBeDefined();
        expect(typeof event.timestamp).toBe('string');
        // Verify it's a valid ISO date
        expect(new Date(event.timestamp).toISOString()).toBe(event.timestamp);
      }
    });

    it('should include step numbers in relevant events', async () => {
      mockProvider.setResponses([
        {
          content: 'Response',
          finishReason: 'stop',
        },
      ]);

      const agent = new Agent(basicConfig);
      const executor = new StreamingAgentExecutor(agent, {
        llmProvider: mockProvider,
      });

      const events: AgentExecutionEvent[] = [];
      for await (const event of executor.stream('Test')) {
        events.push(event);
      }

      // Events with step should have valid step numbers
      const eventsWithStep = events.filter(
        (e): e is AgentStepEvent | ThoughtEvent | FinalAnswerEvent =>
          e.type === 'step' || e.type === 'thought' || e.type === 'final_answer'
      );

      for (const event of eventsWithStep) {
        expect(event.step).toBeDefined();
        expect(typeof event.step).toBe('number');
        expect(event.step).toBeGreaterThan(0);
      }
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle multi-step execution with multiple tools', async () => {
      const searchTool: ToolDefinition = {
        name: 'search',
        description: 'Searches the web',
        parameters: z.object({ query: z.string() }),
        execute: async ({ query }) => ({
          results: [`Result for ${query}`],
        }),
      };

      const calculatorTool: ToolDefinition = {
        name: 'calculator',
        description: 'Performs calculations',
        parameters: z.object({
          a: z.number(),
          b: z.number(),
        }),
        execute: async ({ a, b }) => ({ result: a + b }),
      };

      const configWithTools = {
        ...basicConfig,
        tools: [searchTool, calculatorTool],
      };

      mockProvider.setResponses([
        {
          content: 'Let me search for that.',
          toolCalls: [
            {
              id: 'call-1',
              name: 'search',
              parameters: { query: 'weather' },
            },
          ],
          finishReason: 'tool_calls',
        },
        {
          content: 'Now let me calculate.',
          toolCalls: [
            {
              id: 'call-2',
              name: 'calculator',
              parameters: { a: 10, b: 5 },
            },
          ],
          finishReason: 'tool_calls',
        },
        {
          content: 'Here are the results.',
          finishReason: 'stop',
        },
      ]);

      const agent = new Agent(configWithTools);
      const executor = new StreamingAgentExecutor(agent, {
        llmProvider: mockProvider,
      });

      const events: AgentExecutionEvent[] = [];
      for await (const event of executor.stream('Complex query')) {
        events.push(event);
      }

      const toolCallEvents = events.filter(
        (e) => e.type === 'tool_call'
      ) as ToolCallEvent[];
      expect(toolCallEvents.length).toBe(2);
      expect(toolCallEvents[0].toolCall.name).toBe('search');
      expect(toolCallEvents[1].toolCall.name).toBe('calculator');

      const thoughtEvents = events.filter(
        (e) => e.type === 'thought'
      ) as ThoughtEvent[];
      expect(thoughtEvents.length).toBeGreaterThan(0);

      const stepEvents = events.filter((e) => e.type === 'step');
      // Should have at least 3 steps (one for each LLM call), but may have more for tool execution
      expect(stepEvents.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Empty and Edge Cases', () => {
    it('should handle empty LLM response', async () => {
      mockProvider.setResponses([
        {
          content: '',
          finishReason: 'stop',
        },
      ]);

      const agent = new Agent(basicConfig);
      const executor = new StreamingAgentExecutor(agent, {
        llmProvider: mockProvider,
      });

      const events: AgentExecutionEvent[] = [];
      for await (const event of executor.stream('Test')) {
        events.push(event);
      }

      // Should still have step and final answer events
      expect(events.some((e) => e.type === 'step')).toBe(true);
      expect(events.some((e) => e.type === 'final_answer')).toBe(true);

      // May or may not have thought event for empty content
      const finalAnswerEvent = events.find(
        (e) => e.type === 'final_answer'
      ) as FinalAnswerEvent;
      expect(finalAnswerEvent.answer).toBe('');
    });

    it('should handle immediate completion', async () => {
      mockProvider.setResponses([
        {
          content: 'Done',
          finishReason: 'stop',
        },
      ]);

      const agent = new Agent({ ...basicConfig, maxSteps: 1 });
      const executor = new StreamingAgentExecutor(agent, {
        llmProvider: mockProvider,
      });

      const events: AgentExecutionEvent[] = [];
      for await (const event of executor.stream('Quick')) {
        events.push(event);
      }

      expect(events.length).toBeGreaterThan(0);
      const stepEvents = events.filter((e) => e.type === 'step');
      expect(stepEvents.length).toBe(1);
    });
  });
});
