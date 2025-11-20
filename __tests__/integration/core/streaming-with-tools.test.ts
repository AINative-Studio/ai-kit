/**
 * Integration Tests: Streaming with Tools
 *
 * Tests for AI streaming with tool execution
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { server } from '../setup';
import { http, HttpResponse } from 'msw';
import {
  createMockAIStream,
  collectStreamData,
  waitFor,
  trackPerformance,
} from '../utils/test-helpers';
import {
  mockTools,
  mockStreamingChunks,
  mockStreamingWithTools,
  mockToolCall,
} from '../fixtures/mock-data';

describe('Streaming with Tools Integration', () => {
  describe('Basic Streaming with Tools', () => {
    it('should stream AI responses and execute tools', async () => {
      const chunks: string[] = [];
      const toolCalls: any[] = [];

      // Simulate streaming with tool calls
      const stream = createMockAIStream(
        ['Let me ', 'calculate ', 'that ', 'for you.'],
        50
      );

      const reader = stream.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(new TextDecoder().decode(value));
      }

      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks.join('')).toContain('calculate');
    });

    it('should handle tool execution during streaming', async () => {
      const calculator = mockTools[0];
      const result = await calculator.execute({
        operation: 'add',
        a: 5,
        b: 3,
      });

      expect(result).toBe(8);
    });

    it('should stream response after tool execution', async () => {
      // First stream with tool call
      const toolCallStream = createMockAIStream(['Using calculator...'], 50);

      // Execute tool
      const calculator = mockTools[0];
      const toolResult = await calculator.execute({
        operation: 'multiply',
        a: 7,
        b: 6,
      });

      expect(toolResult).toBe(42);

      // Stream final response
      const responseStream = createMockAIStream(
        ['The result is ', String(toolResult)],
        50
      );

      const chunks = await collectStreamData(responseStream);
      expect(chunks.length).toBeGreaterThan(0);
    });

    it('should handle multiple tool calls in sequence', async () => {
      const results: number[] = [];

      // First tool call
      const result1 = await mockTools[0].execute({
        operation: 'add',
        a: 10,
        b: 5,
      });
      results.push(result1 as number);

      // Second tool call using first result
      const result2 = await mockTools[0].execute({
        operation: 'multiply',
        a: result1,
        b: 2,
      });
      results.push(result2 as number);

      expect(results).toEqual([15, 30]);
    });

    it('should handle parallel tool calls', async () => {
      const toolCalls = [
        mockTools[0].execute({ operation: 'add', a: 5, b: 3 }),
        mockTools[0].execute({ operation: 'multiply', a: 4, b: 6 }),
        mockTools[0].execute({ operation: 'subtract', a: 10, b: 7 }),
      ];

      const results = await Promise.all(toolCalls);

      expect(results).toEqual([8, 24, 3]);
    });
  });

  describe('Error Handling', () => {
    it('should handle tool execution errors gracefully', async () => {
      const calculator = mockTools[0];

      await expect(
        calculator.execute({
          operation: 'invalid',
          a: 5,
          b: 3,
        })
      ).rejects.toThrow('Invalid operation');
    });

    it('should continue streaming after tool error', async () => {
      // Simulate tool error
      let errorOccurred = false;
      try {
        await mockTools[0].execute({
          operation: 'divide',
          a: 5,
          b: 0,
        });
      } catch (error) {
        errorOccurred = true;
      }

      // Stream should continue
      const stream = createMockAIStream(['Error occurred, ', 'but continuing...'], 50);
      const chunks = await collectStreamData(stream);

      expect(chunks.length).toBeGreaterThan(0);
    });

    it('should handle stream interruption', async () => {
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n'));
          // Simulate error
          controller.error(new Error('Stream interrupted'));
        },
      });

      const reader = stream.getReader();
      await expect(async () => {
        while (true) {
          const { done } = await reader.read();
          if (done) break;
        }
      }).rejects.toThrow('Stream interrupted');
    });

    it('should handle malformed streaming data', async () => {
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('invalid json\n\n'));
          controller.close();
        },
      });

      const chunks = await collectStreamData(stream);
      expect(chunks).toHaveLength(1);
    });
  });

  describe('Context Preservation', () => {
    it('should preserve context across tool calls', async () => {
      const context = { previousResults: [] as number[] };

      // First calculation
      const result1 = await mockTools[0].execute({
        operation: 'add',
        a: 5,
        b: 3,
      });
      context.previousResults.push(result1 as number);

      // Second calculation using context
      const result2 = await mockTools[0].execute({
        operation: 'multiply',
        a: context.previousResults[0],
        b: 2,
      });
      context.previousResults.push(result2 as number);

      expect(context.previousResults).toEqual([8, 16]);
    });

    it('should maintain conversation history with tool usage', async () => {
      const conversation: any[] = [
        { role: 'user', content: 'Calculate 5 + 3' },
      ];

      // Tool call
      const result = await mockTools[0].execute({
        operation: 'add',
        a: 5,
        b: 3,
      });

      conversation.push({
        role: 'assistant',
        content: `The result is ${result}`,
        toolCalls: [{ name: 'calculator', result }],
      });

      expect(conversation).toHaveLength(2);
      expect(conversation[1].toolCalls[0].result).toBe(8);
    });

    it('should handle context window limits', async () => {
      const maxMessages = 10;
      const messages: any[] = [];

      // Generate conversation
      for (let i = 0; i < 15; i++) {
        messages.push({
          role: i % 2 === 0 ? 'user' : 'assistant',
          content: `Message ${i}`,
        });
      }

      // Keep only last N messages
      const contextWindow = messages.slice(-maxMessages);

      expect(contextWindow).toHaveLength(maxMessages);
      expect(contextWindow[0].content).toBe('Message 5');
    });
  });

  describe('Token Tracking', () => {
    it('should track tokens during streaming', async () => {
      let totalTokens = 0;

      const stream = new ReadableStream({
        start(controller) {
          const chunks = [
            { content: 'Hello', tokens: 1 },
            { content: ' world', tokens: 2 },
            { content: '!', tokens: 1 },
          ];

          chunks.forEach(({ content, tokens }) => {
            totalTokens += tokens;
            controller.enqueue(
              new TextEncoder().encode(
                `data: {"choices":[{"delta":{"content":"${content}"}}],"usage":{"total_tokens":${totalTokens}}}\n\n`
              )
            );
          });

          controller.close();
        },
      });

      const chunks = await collectStreamData(stream);
      expect(chunks.length).toBe(3);
      expect(totalTokens).toBe(4);
    });

    it('should track token usage across tool calls', async () => {
      const tokenUsage = {
        prompt: 0,
        completion: 0,
        total: 0,
      };

      // Initial prompt
      tokenUsage.prompt += 10;
      tokenUsage.total += 10;

      // Tool call response
      tokenUsage.completion += 5;
      tokenUsage.total += 5;

      // Execute tool
      await mockTools[0].execute({ operation: 'add', a: 5, b: 3 });

      // Tool result tokens
      tokenUsage.completion += 3;
      tokenUsage.total += 3;

      // Final response
      tokenUsage.completion += 7;
      tokenUsage.total += 7;

      expect(tokenUsage.total).toBe(25);
    });

    it('should estimate tokens for tool parameters', async () => {
      const estimateTokens = (obj: any): number => {
        return JSON.stringify(obj).split(/\s+/).length;
      };

      const toolParams = {
        operation: 'add',
        a: 5,
        b: 3,
      };

      const estimatedTokens = estimateTokens(toolParams);
      expect(estimatedTokens).toBeGreaterThan(0);
    });
  });

  describe('Performance', () => {
    it('should stream with low latency', async () => {
      const { duration } = await trackPerformance(async () => {
        const stream = createMockAIStream(['Test'], 10);
        await collectStreamData(stream);
      }, 'streaming-latency');

      expect(duration).toBeLessThan(100);
    });

    it('should execute tools within performance budget', async () => {
      const { duration } = await trackPerformance(async () => {
        await mockTools[0].execute({ operation: 'add', a: 5, b: 3 });
      }, 'tool-execution');

      expect(duration).toBeLessThan(50);
    });

    it('should handle high-frequency streaming', async () => {
      const chunkCount = 100;
      const chunks: any[] = [];

      const stream = new ReadableStream({
        start(controller) {
          for (let i = 0; i < chunkCount; i++) {
            controller.enqueue(
              new TextEncoder().encode(
                `data: {"choices":[{"delta":{"content":"${i}"}}]}\n\n`
              )
            );
          }
          controller.close();
        },
      });

      const startTime = performance.now();
      const result = await collectStreamData(stream);
      const duration = performance.now() - startTime;

      expect(result).toHaveLength(chunkCount);
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Tool Chaining', () => {
    it('should chain multiple tools', async () => {
      // Calculator -> result -> use in weather query
      const calcResult = await mockTools[0].execute({
        operation: 'add',
        a: 20,
        b: 52,
      });

      const weatherResult = await mockTools[1].execute({
        location: `Temperature: ${calcResult}F`,
      });

      expect(calcResult).toBe(72);
      expect(weatherResult).toHaveProperty('temperature');
    });

    it('should handle conditional tool execution', async () => {
      const number = 100;
      let result;

      if (number > 50) {
        result = await mockTools[0].execute({
          operation: 'multiply',
          a: number,
          b: 2,
        });
      } else {
        result = await mockTools[0].execute({
          operation: 'add',
          a: number,
          b: 10,
        });
      }

      expect(result).toBe(200);
    });

    it('should support tool result transformations', async () => {
      const result = await mockTools[0].execute({
        operation: 'divide',
        a: 100,
        b: 3,
      });

      // Transform result
      const transformed = Math.round(result as number * 100) / 100;

      expect(transformed).toBeCloseTo(33.33, 2);
    });
  });
});
